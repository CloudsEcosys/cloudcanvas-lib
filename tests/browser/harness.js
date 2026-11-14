/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Browser smoke harness: a throwaway static server, the optional Playwright
 * dependency, and the page wiring every check shares.
 *
 * Deliberately dependency-light. `playwright` is an *optional* devDependency:
 * when it is absent the suite reports a skip instead of failing, so `npm test`
 * (headless, happy-dom) and `npm run test:browser` (real chromium) can live in
 * the same repository without one gating the other.
 */
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { containRequest, pathnameOf } from '../../scripts/served-path.js';
import { importMapFor, withImportMap } from './import-map.js';

/** Repository root, derived from this file's location. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** The zero-CSS completeness fixture, as the static server addresses it. */
export const BARE_FIXTURE = '/tests/browser/fixtures/bare.html';

/** The multi-window dashboard scene `openPage` boots (`./fixtures/dashboard.html`). */
export const DASHBOARD_FIXTURE = '/tests/browser/fixtures/dashboard.html';

export const PLAYWRIGHT_MISSING = [
  '',
  'SKIPPED: the browser smoke suite needs Playwright and a chromium build.',
  '  npm install --save-dev playwright && npx playwright install chromium',
  'Then re-run: npm run test:browser',
  ''
].join('\n');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

/** Chromium flags that expose WebGPU on a headless run (swiftshader here); WebGL2 needs none. */
export const GPU_ARGS = Object.freeze(['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=swiftshader']);

/** Chromium launcher, or null when the optional dependency is not installed. */
export async function loadChromium() {
  try {
    const playwright = await import('playwright');
    return playwright.chromium;
  } catch {
    return null;
  }
}

/**
 * Resolve a request path inside `rootDir`, or null when it may not be served.
 *
 * This server only ever listens on loopback for the duration of a test run, so
 * the containment is not load-bearing - but it is a real rule
 * (`scripts/served-path.js`): every dot segment closed, `node_modules` closed
 * but for the core package the import map points into.
 */
function resolveRequestPath(rootDir, requestUrl) {
  const pathname = pathnameOf(requestUrl);
  if (pathname === null) return null;

  const contained = containRequest(rootDir, pathname);
  return contained ? contained.resolved : null;
}

async function serveFile(rootDir, req, res) {
  if (req.url === '/favicon.ico') {
    res.writeHead(204).end();
    return;
  }

  const filePath = resolveRequestPath(rootDir, req.url);
  const stats = filePath ? await stat(filePath).catch(() => null) : null;

  if (!stats || !stats.isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }

  const extension = path.extname(filePath);
  res.writeHead(200, {
    'content-type': MIME_TYPES[extension] || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  if (extension !== '.html') {
    createReadStream(filePath).pipe(res);
    return;
  }
  res.end(withImportMap(await readFile(filePath, 'utf8'), importMapFor(rootDir)));
}

/**
 * Serve `rootDir` on a free loopback port.
 * @returns {Promise<{url: string, close: () => Promise<void>}>}
 */
export async function startStaticServer(rootDir = REPO_ROOT) {
  const server = http.createServer((req, res) => {
    serveFile(rootDir, req, res).catch(() => {
      res.writeHead(500, { 'content-type': 'text/plain' }).end('Server error');
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  };
}

/**
 * Console errors and uncaught exceptions are failures, not noise.
 *
 * @param {(text: string) => boolean} [ignoreConsole] a console error the page is
 *   expected to log, e.g. a resource a suite 404s on purpose
 */
function collectErrors(page, errors, ignoreConsole = null) {
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (message.text().includes('favicon')) return;
    if (ignoreConsole && ignoreConsole(message.text())) return;
    errors.push(`console: ${message.text()}`);
  });
}

/**
 * The one request failure that is the host's doing, not the page's.
 *
 * Chromium watches the machine's netlink feed, and on any address or link change
 * - a container's veth going down is enough - it fails every queued and
 * connecting request with this code, loopback included. A module graph caught
 * mid-load never executes, so the page sits un-booted with nothing else wrong.
 */
const NETWORK_CHANGED = 'net::ERR_NETWORK_CHANGED';

/** Boots one open or reload may spend on host network changes before it gives up. */
const NETWORK_CHANGE_ATTEMPTS = 3;

/**
 * A fresh page, booted by `plan.boot`, with its errors collected.
 *
 * A page whose load Chromium aborted with {@link NETWORK_CHANGED} is discarded
 * whole - its errors with it - and a new one is prepared and booted in its
 * place. Every other failure is thrown as it is, carrying the page's errors.
 *
 * @param {object} plan
 * @param {(page: object) => Promise<void>} plan.boot navigates, then waits for readiness
 * @param {object} [plan.pageOptions] `browser.newPage` options
 * @param {(page: object) => (object|Promise<object>)} [plan.prepare] runs on each
 *   fresh page before `boot` - routes, request taps; the properties of what it
 *   returns are handed back alongside `page` and `errors`
 * @param {(text: string) => boolean} [plan.ignoreConsole] see {@link collectErrors}
 * @returns {Promise<{page: object, errors: string[]}>}
 */
export async function openBootedPage(browser, { boot, pageOptions = {}, prepare = null, ignoreConsole = null }) {
  for (let attempt = 1; attempt <= NETWORK_CHANGE_ATTEMPTS; attempt += 1) {
    const page = await browser.newPage(pageOptions);
    const errors = [];
    collectErrors(page, errors, ignoreConsole);
    const prepared = prepare ? await prepare(page) : {};

    if (!(await bootVoidedByNetwork(page, errors, boot))) {
      await assertUniqueBlitIds(page);
      return { ...prepared, page, errors };
    }
    await page.close();
    reportVoidedBoot(attempt, 'page discarded');
  }
  throw networkGaveUp();
}

/**
 * Boot an open page again in place - a reload - keeping its browser context, and
 * so its `localStorage`. An attempt voided by {@link NETWORK_CHANGED} is re-run,
 * and whatever it added to `errors` is struck: those lines were the host's.
 *
 * @param {string[]} errors the page's collected errors, from `openBootedPage`
 * @param {(page: object) => Promise<void>} boot reloads, then waits for readiness
 */
export async function rebootPage(page, errors, boot) {
  for (let attempt = 1; attempt <= NETWORK_CHANGE_ATTEMPTS; attempt += 1) {
    const mark = errors.length;
    if (!(await bootVoidedByNetwork(page, errors, boot))) {
      await assertUniqueBlitIds(page);
      return;
    }
    errors.splice(mark);
    reportVoidedBoot(attempt, 'reloading again');
  }
  throw networkGaveUp();
}

/**
 * Run `boot` once, watching for the host's network abort.
 * @returns {Promise<boolean>} true when a {@link NETWORK_CHANGED} failure voided it
 */
async function bootVoidedByNetwork(page, errors, boot) {
  let networkChanged = false;
  const watch = (request) => {
    if (request.failure()?.errorText === NETWORK_CHANGED) networkChanged = true;
  };
  page.on('requestfailed', watch);

  try {
    await boot(page);
  } catch (error) {
    if (!networkChanged) throw withPageErrors(error, errors);
  } finally {
    page.off('requestfailed', watch);
  }
  return networkChanged;
}

function reportVoidedBoot(attempt, next) {
  console.warn(`[browser harness] ${NETWORK_CHANGED} during page load ${attempt}/${NETWORK_CHANGE_ATTEMPTS}; ${next}`);
}

function networkGaveUp() {
  return new Error(`the host network changed under ${NETWORK_CHANGE_ATTEMPTS} consecutive page loads (${NETWORK_CHANGED})`);
}

/** A boot failure names what the page itself reported, so a timeout is never mute. */
function withPageErrors(error, errors) {
  if (errors.length > 0) error.message += `\npage errors: ${errors.join(' | ')}`;
  return error;
}

/**
 * A fresh page on the dashboard fixture (`./fixtures/dashboard.html`), booted
 * to a mounted board.
 *
 * Separate from `openHarness` because a first-paint claim cannot be made on the
 * shared page: by the time the suite reaches it the camera has been zoomed,
 * panned and focused a dozen times, and *any* of those would hide a defect that
 * only survives while nothing has moved yet.
 *
 * @param {object} [pageOptions] merged over the defaults - `reducedMotion` and
 *   `hasTouch` are emulation switches only a fresh page can carry, and the
 *   acceptance suite needs one page of each.
 * @returns {Promise<{page: object, errors: string[]}>}
 */
export function openPage(browser, url, pageOptions = {}) {
  return openBootedPage(browser, {
    pageOptions: { viewport: { width: 1280, height: 800 }, ...pageOptions },
    boot: async (page) => {
      await page.goto(`${url}${DASHBOARD_FIXTURE}`, { waitUntil: 'load' });
      await page.waitForFunction(() => Boolean(window.cloudcanvas), null, { timeout: 10000 });
    }
  });
}

/**
 * A fresh page on an arbitrary served fixture, booted to a mounted root.
 *
 * The completeness fixtures are their own documents - `bare.html` carries no CSS
 * at all - so they cannot be reached through `openPage`, which is hard-wired to
 * the dashboard fixture. Everything else is shared: the same error collection and
 * the same readiness signal, which is the root blit on `window.cloudcanvas`, never
 * the load event (the placeholder image would gate that).
 *
 * @param {string} fixturePath server-root-relative path, e.g. `/tests/.../bare.html`
 * @returns {Promise<{page: object, errors: string[]}>}
 */
export function openFixturePage(browser, url, fixturePath, pageOptions = {}) {
  return openBootedPage(browser, {
    pageOptions: { viewport: { width: 1280, height: 800 }, ...pageOptions },
    boot: async (page) => {
      await page.goto(`${url}${fixturePath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => Boolean(window.cloudcanvas), null, { timeout: 10000 });
    }
  });
}

/**
 * Launch chromium on the dashboard fixture.
 * @returns {Promise<{browser: object, page: object, errors: string[]}>}
 */
export async function openHarness(chromium, url) {
  const browser = await chromium.launch();
  const { page, errors } = await openPage(browser, url);

  return { browser, page, errors };
}

/**
 * The ids a blit shares with another element of the document. A blit's id is its
 * element's `id`, so one colliding with page chrome (or another canvas) makes
 * `#id`, `getElementById` and `[data-blit][id]` ambiguous.
 * @returns {Promise<string[]>} each shared id once
 */
export function duplicateBlitIds(page) {
  return page.evaluate(() => {
    const counts = new Map();
    for (const element of document.querySelectorAll('[id]')) counts.set(element.id, (counts.get(element.id) || 0) + 1);
    const blitIds = Array.from(document.querySelectorAll('[data-blit][id]'), (element) => element.id);
    return Array.from(new Set(blitIds.filter((id) => counts.get(id) > 1)));
  });
}

/** Throw when any blit id is shared (see {@link duplicateBlitIds}); every harness boot and reload asserts it. */
export async function assertUniqueBlitIds(page) {
  const shared = await duplicateBlitIds(page);
  if (shared.length > 0) throw new Error(`blit ids shared with other elements: ${shared.join(', ')}`);
}

/** Let the rAF loop run for `ms`; a root is only observable across frames. */
export function frames(page, ms) {
  return page.waitForTimeout(ms);
}

/** Read a blit's global bounds `{x, y, w, h}` out of the live root (`window.cloudcanvas`). */
export function boundsOf(page, blitId) {
  return page.evaluate((id) => {
    const found = window.cloudcanvas.find(id);
    return found ? found.bounds : null;
  }, blitId);
}

/** The dashboard fixture's live camera triple (`window.fixture.camera`). */
export function cameraOf(page) {
  return page.evaluate(() => {
    const { x, y, scale } = window.fixture.camera;
    return { x, y, scale };
  });
}

/** Snap the dashboard fixture's camera to a view, so the next check starts from a known one. */
export function setCamera(page, view) {
  return page.evaluate((to) => {
    window.fixture.camera.setZoom(to.scale);
    window.fixture.camera.panTo(to.x, to.y);
  }, view);
}

/** Unpack an archive with whichever real extractor this machine has. */
export function extractArchive(archive, destination) {
  mkdirSync(destination, { recursive: true });

  try {
    return execFileSync('unzip', ['-o', archive, '-d', destination], { encoding: 'utf8' });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const script = 'import sys,zipfile\nzipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])\n';
  execFileSync('python3', ['-c', script, archive, destination]);
  return 'python3 zipfile.extractall';
}
