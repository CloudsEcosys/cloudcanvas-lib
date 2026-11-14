/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Sandbox suite: persistence and standalone export, in a real browser.
 *
 * `tests/unit/lib-sandbox*.test.js` prove the wiring and the byte layout against
 * happy-dom and an independent unzip tool. Three claims are only answerable
 * here, because each one needs a browser that actually does the thing:
 *
 *   - a snapshot written to `localStorage` survives a real page navigation and
 *     rebuilds a live board afterwards - happy-dom's storage is per-process and
 *     never crosses a reload, so it cannot make this claim,
 *   - `downloadStaticSite` produces a *download*: a file the browser wrote to
 *     disk with the name we asked for, which `unzip` then reads. Asserting that
 *     the function returned `true` proves nothing about the download itself, and
 *   - the exported site loads from a `file://` URL with no server and no
 *     network. The extracted `index.html` and the board runtime
 *     (`cloudcanvas.board.iife.js`) sit alone in a temporary directory; if the
 *     page reaches for anything else, the request log catches it.
 *
 * Run with `npm run test:browser`; fails without Playwright unless CLOUDCANVAS_BROWSER_OPTIONAL=1 (then skipped whole).
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  PLAYWRIGHT_MISSING,
  REPO_ROOT,
  extractArchive,
  loadChromium,
  openFixturePage,
  rebootPage,
  startStaticServer
} from './harness.js';

/** The sandbox fixture, as the static server addresses it. */
const SANDBOX_FIXTURE = '/tests/browser/fixtures/sandbox.html';

/** The board runtime an exported page loads beside itself. */
const BUNDLE = 'cloudcanvas.board.iife.js';

/** The blits the fixture builds, top-level first. */
const FIXTURE_BLITS = ['sandbox_board', 'sandbox_note', 'sandbox_leaf', 'sandbox_gauge'];

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser sandbox suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, workdir: null };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();
    ctx.workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-sandbox-browser-'));
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
    if (ctx.workdir) fs.rmSync(ctx.workdir, { recursive: true, force: true });
  });

  registerPersistence(ctx);
  registerDownload(ctx);
  registerStandalone(ctx);
  registerBoardParts(ctx);
}

/* ------------------ HELPERS ------------------ */

/** Console errors, page errors, and every URL the page asked for. */
function watchPage(page) {
  const errors = [];
  const requests = [];

  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('favicon')) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('request', (request) => requests.push(request.url()));

  return { errors, requests };
}

/** Wait until every named blit is on the page: a restored child is placed on the next frame. */
function waitForBlits(page, ids) {
  return page.waitForFunction(
    (wanted) => wanted.every((id) => document.querySelector(`[data-blit][id="${id}"]`)),
    ids,
    { timeout: 10000 }
  );
}

/**
 * Every blit the live board on a page holds, as plain data: read through the
 * root (`find`, `parent`, `spec`), so it runs the same on the served page and on
 * an exported one that has only the bundle.
 */
function readCanvas(page) {
  return page.evaluate(() => {
    const app = window.cloudcanvas;
    const describe = (element) => {
      const found = app.find(element.id);
      const type = element.getAttribute('data-type');
      const key = type ? type.replace(/-([a-z])/g, (_, character) => character.toUpperCase()) : null;
      const contents = key ? found.spec[key] : null;
      const parent = found.parent;
      return {
        id: element.id,
        found: found !== null && found.el === element,
        parent: parent && parent.el !== app.el ? parent.el.id : null,
        type,
        title: (contents && contents.title) || null
      };
    };
    return {
      blits: Array.from(app.el.querySelectorAll('[data-blit]'), describe),
      warnings: window.cloudcanvasWarnings || []
    };
  });
}

/* ------------------ PERSISTENCE ACROSS A RELOAD ------------------ */

function registerPersistence(ctx) {
  test('sandbox - a saved board survives a page reload and rebuilds', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, SANDBOX_FIXTURE);

    const saved = await page.evaluate(async () => {
      const sandbox = await import('/sandbox/index.js');
      sandbox.saveSandbox('browser-draft', window.cloudcanvas);
      return sandbox.listSandboxKeys();
    });
    assert.deepEqual(saved, ['browser-draft']);

    // The navigation is the point: happy-dom cannot make this claim.
    await rebootPage(page, errors, async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => Boolean(window.cloudcanvas), null, { timeout: 10000 });
    });

    const restored = await page.evaluate(async () => {
      const sandbox = await import('/sandbox/index.js');
      // The fixture rebuilt its own blits under the same ids; the snapshot lands on an emptied board.
      const cleared = sandbox.clearBoard(window.cloudcanvas);
      const result = sandbox.loadSandbox('browser-draft', window.cloudcanvas);
      window.cloudcanvasWarnings = result.warnings;
      return { cleared, roots: result.blits.map((b) => b.el.id), warnings: result.warnings };
    });

    assert.equal(restored.cleared, 2, 'the fixture\'s own board was not emptied first');
    assert.deepEqual(restored.warnings, []);
    assert.deepEqual(restored.roots, ['sandbox_board', 'sandbox_gauge']);

    await waitForBlits(page, FIXTURE_BLITS);
    const canvas = await readCanvas(page);
    assert.deepEqual(canvas.blits.map((b) => b.id).sort(), [...FIXTURE_BLITS].sort());
    assert.ok(canvas.blits.every((b) => b.found), 'a restored blit is not indexed by its root');

    const byId = Object.fromEntries(canvas.blits.map((b) => [b.id, b]));
    assert.equal(byId.sandbox_note.parent, 'sandbox_board');
    assert.equal(byId.sandbox_leaf.parent, 'sandbox_note');
    assert.equal(byId.sandbox_gauge.type, 'vector-pointer');
    assert.equal(byId.sandbox_board.title, 'Sandbox Board');

    await page.evaluate(async () => {
      const sandbox = await import('/sandbox/index.js');
      sandbox.deleteSandbox('browser-draft');
    });

    assert.deepEqual(errors, []);
    await page.close();
  });
}

/* ------------------ A REAL DOWNLOAD ------------------ */

function registerDownload(ctx) {
  test('sandbox - downloadStaticSite writes a real, readable archive to disk', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, SANDBOX_FIXTURE);

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.evaluate(async (bundle) => {
        const { downloadStaticSite } = await import('/sandbox/export-static.js');
        return downloadStaticSite(window.cloudcanvas, 'cloudcanvas-sandbox.zip', {
          bundleUrl: `/dist/${bundle}`,
          title: 'Downloaded Sandbox'
        });
      }, BUNDLE)
    ]);

    assert.equal(download.suggestedFilename(), 'cloudcanvas-sandbox.zip');

    const saved = path.join(ctx.workdir, 'downloaded.zip');
    await download.saveAs(saved);
    assert.ok(fs.statSync(saved).size > 1024, 'the archive carries the bundle, not just a page');

    // The browser wrote it; an independent tool reads it.
    const listing = extractArchive(saved, path.join(ctx.workdir, 'downloaded'));
    assert.ok(listing.length > 0);
    assert.deepEqual(fs.readdirSync(path.join(ctx.workdir, 'downloaded')).sort(), [BUNDLE, 'index.html']);

    assert.deepEqual(errors, []);
    await page.close();
  });
}

/* ------------------ THE file:// STANDALONE PROOF ------------------ */

function registerStandalone(ctx) {
  test('sandbox - the exported site runs from file:// with no server and no network', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, SANDBOX_FIXTURE);

    const base64 = await page.evaluate(async (name) => {
      const { exportStaticSite } = await import('/sandbox/export-static.js');
      const bundle = await (await fetch(`/dist/${name}`)).text();
      const bytes = exportStaticSite(window.cloudcanvas, { bundle, title: 'Exported Sandbox' });

      let binary = '';
      const CHUNK = 0x8000;
      for (let index = 0; index < bytes.length; index += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(index, index + CHUNK));
      }
      return btoa(binary);
    }, BUNDLE);

    assert.deepEqual(errors, []);
    await page.close();

    const archive = path.join(ctx.workdir, 'exported.zip');
    const site = path.join(ctx.workdir, 'site');
    fs.writeFileSync(archive, Buffer.from(base64, 'base64'));
    extractArchive(archive, site);
    assert.deepEqual(fs.readdirSync(site).sort(), [BUNDLE, 'index.html']);

    const standalone = await ctx.browser.newPage({ viewport: { width: 1280, height: 800 } });
    const watch = watchPage(standalone);

    await standalone.goto(`file://${path.join(site, 'index.html')}`, { waitUntil: 'load' });
    await standalone.waitForFunction(() => Boolean(window.cloudcanvas), null, { timeout: 10000 });
    await waitForBlits(standalone, FIXTURE_BLITS);

    const canvas = await readCanvas(standalone);
    assert.deepEqual(canvas.warnings, [], 'every type and trait resolved from the bundle alone');
    assert.deepEqual(canvas.blits.map((b) => b.id).sort(), [...FIXTURE_BLITS].sort());
    assert.ok(canvas.blits.every((b) => b.found), 'an exported blit is not indexed by its root');
    const byId = Object.fromEntries(canvas.blits.map((b) => [b.id, b]));
    assert.equal(byId.sandbox_leaf.parent, 'sandbox_note');
    assert.equal(byId.sandbox_board.title, 'Sandbox Board');
    assert.equal(byId.sandbox_gauge.type, 'vector-pointer');

    assert.equal(await standalone.title(), 'Exported Sandbox');
    assert.deepEqual(watch.errors, [], 'the exported page logged nothing');

    const offDisk = watch.requests.filter((url) => !url.startsWith('file://'));
    assert.deepEqual(offDisk, [], 'the exported page made no network request');
    assert.equal(watch.requests.length, 2, 'exactly index.html and the bundle beside it');

    await standalone.close();
  });
}

/* ------------------ A v2 EXPORT'S BOARD PARTS ------------------ */

function registerBoardParts(ctx) {
  test('sandbox - a v2 export boots its reactions, theme and home page from file://', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, SANDBOX_FIXTURE);
    const html = await page.evaluate(async () => {
      const { renderStaticHtml } = await import('/sandbox/export-static.js');
      const saved = await (await fetch('/tests/fixtures/sandbox/export.v2.json')).json();
      return renderStaticHtml(saved, { title: 'Parts' });
    });
    assert.deepEqual(errors, []);
    await page.close();

    const site = path.join(ctx.workdir, 'parts');
    fs.mkdirSync(site, { recursive: true });
    fs.writeFileSync(path.join(site, 'index.html'), html);
    fs.copyFileSync(path.join(REPO_ROOT, 'dist', BUNDLE), path.join(site, BUNDLE));

    const standalone = await ctx.browser.newPage({ viewport: { width: 1280, height: 800 } });
    const watch = watchPage(standalone);
    await standalone.goto(`file://${path.join(site, 'index.html')}`, { waitUntil: 'load' });
    await waitForBlits(standalone, ['x_board', 'x_note', 'x_pencil']);
    await standalone.waitForTimeout(300);

    // The home page (x_board) is promoted, so the other top-level blits are hidden.
    const state = await standalone.evaluate(() => ({
      warnings: window.cloudcanvasWarnings,
      reactions: window.CloudCanvas.reactionsOf(window.cloudcanvas).all().length,
      theme: window.cloudcanvas.el.style.getPropertyValue('--cc-bg') !== '',
      home: window.cloudcanvas.root.el.id,
      offPage: ['x_gauge', 'x_img'].filter((id) => {
        const element = document.querySelector(`[data-blit][id="${id}"]`);
        return element && !element.closest('[hidden]');
      })
    }));
    assert.deepEqual(state, { warnings: [], reactions: 1, theme: true, home: 'x_board', offPage: [] });
    assert.deepEqual(watch.errors, [], 'the exported page logged nothing');
    await standalone.close();
  });
}
