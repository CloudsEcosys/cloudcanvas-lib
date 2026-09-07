/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Standalone static-site export: a sandbox as a zip you can unzip and open.
 *
 * The archive holds exactly two files - a generated `index.html` and the
 * already-built `dist/cloudcanvas.iife.js` next to it - and the page loads from
 * a `file://` URL with no server, no import map and no network request. The IIFE
 * bundle is the only form that can: Chromium fetches module scripts in CORS
 * mode and a `file://` origin is always denied, which is the same reason
 * `README.md`'s Distribution Bundles section points the zero-server case at the
 * IIFE build (see also `scripts/build.js`).
 *
 * THE DUPLICATION THAT ISN'T. The exported page cannot import
 * `./serialize.js` - it has only the bundle - so it needs the reconstruction
 * logic inline. Rather than hand-writing a second copy against
 * `window.CloudCanvas` (which drifts from the real one the first time either
 * side changes, and drifts silently, because nothing tests the copy), the page
 * embeds `String(restoreTree)`: the *same function*, in source form. That is
 * what `restoreTree` being self-contained buys - it takes its whole dependency
 * surface as an `api` argument, so its text is a complete implementation
 * wherever it lands. One implementation, exercised by the unit round-trip test
 * and by the file:// browser test at once.
 *
 * The bundle bytes are a parameter, not a read: this module runs in a browser,
 * where there is no filesystem. `downloadStaticSite` fetches them for you;
 * `exportStaticSite` takes them directly, which is also how a build script (or
 * a test) hands over bytes it already has on disk.
 *
 * An optional `page` size (`{width, height}`, CSS pixels) sizes the mounted
 * root to that box instead of the window - the Sandbox's windowed mode hands
 * over the device frame it was composed in. The page's viewport meta stays
 * `width=device-width` either way: that is the right declaration for a page
 * built to a device size, and a fixed `width=` would only fight it.
 */

import { restoreTree, serializeSession } from './serialize.js';
import { createZip, downloadZip } from './zip.js';

/** The bundle's name inside the archive, and the src the page asks for. */
export const BUNDLE_FILENAME = 'cloudcanvas.iife.js';

/** Where the session mounts in the exported page. */
export const ROOT_ID = 'cloudcanvas-root';

/** The `<script>` the snapshot is embedded in, read back at boot. */
export const DATA_ID = 'cloudcanvas-sandbox';

/** Default location the browser path fetches the bundle from. */
const DEFAULT_BUNDLE_URL = `./dist/${BUNDLE_FILENAME}`;

const DEFAULT_TITLE = 'CloudCanvas Sandbox';

/**
 * The page's own CSS, and all of it.
 *
 * Everything else - the plane, the layers, the card surface - arrives with the
 * bundle's injected stylesheet. This is only the host box, which the framework
 * deliberately does not size for you: a canvas host is the page's layout
 * decision, not the engine's. Two answers, then. With no page size the host
 * fills the window. With one, it is a box of that size, centred, and the
 * window scrolls when it is the smaller of the two; the session inside mounts
 * with its camera at rest, so canvas (0, 0) is the box's top-left corner - the
 * corner the Sandbox anchors its frame at.
 *
 * @param {{width: number, height: number}|null} page
 */
function pageCss(page) {
  if (!page) {
    return [
      'html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }',
      `#${ROOT_ID} { position: absolute; inset: 0; width: 100vw; height: 100vh; }`
    ].join('\n      ');
  }
  return [
    'html, body { margin: 0; padding: 0; min-height: 100%; }',
    `#${ROOT_ID} { position: relative; width: ${page.width}px; height: ${page.height}px; `
      + 'max-width: 100vw; margin: 0 auto; }'
  ].join('\n      ');
}

/**
 * `options.page` as `{width, height}` in whole CSS pixels, or null when absent.
 * A page that is given but describes no box is a programming error, and says so.
 */
function normalizePage(page) {
  if (page === undefined || page === null) return null;
  const box = page && typeof page === 'object' ? page : {};
  const width = Number(box.width);
  const height = Number(box.height);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new TypeError('renderStaticHtml: `page` must be {width, height} in positive CSS pixels');
  }
  return { width: Math.round(width), height: Math.round(height) };
}

/* ------------------ ESCAPING ------------------ */

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

/** Escape a value interpolated into markup (the document title). */
function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => HTML_ESCAPES[character]);
}

/**
 * Escape JSON for embedding inside a `<script>` element.
 *
 * An element's raw text is not entity-decoded, so the escaping has to happen in
 * the JSON itself: `<` parses straight back to `<`, and a snapshot
 * containing the literal text `</script>` therefore cannot end the element
 * early. U+2028 and U+2029 go with it - legal in JSON, historically illegal in
 * a JavaScript string literal, and free to escape either way.
 */
function escapeJsonForScript(json) {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/* ------------------ PAGE GENERATION ------------------ */

/**
 * The boot script: parse the embedded snapshot, start a session, rebuild it.
 *
 * `readyState` is checked as well as listened for. The script tag sits last in
 * the body, so `DOMContentLoaded` has not fired yet and the listener is the one
 * that runs - but a page someone later edits to load this `defer`ed, or inject
 * it after parse, would otherwise wait for an event that already happened and
 * render nothing at all.
 */
function bootScript() {
  return [
    '(function () {',
    `  var restoreTree = ${restoreTree.toString()};`,
    '',
    '  function boot() {',
    `    var raw = document.getElementById(${JSON.stringify(DATA_ID)}).textContent;`,
    '    var data = JSON.parse(raw);',
    '    var warnings = [];',
    '    var session = window.CloudCanvas.createCanvasSession({',
    `      container: document.getElementById(${JSON.stringify(ROOT_ID)})`,
    '    });',
    '    restoreTree(window.CloudCanvas, session, data.pins, warnings);',
    '    window.cloudcanvas = session;',
    '    window.cloudcanvasWarnings = warnings;',
    '  }',
    '',
    "  if (document.readyState === 'loading') {",
    "    window.addEventListener('DOMContentLoaded', boot);",
    '  } else {',
    '    boot();',
    '  }',
    '}());'
  ].join('\n');
}

/**
 * The generated `index.html` for a snapshot.
 *
 * @param {{version: number, pins: object[]}} snapshot
 * @param {object} [options]
 * @param {string} [options.title] document title
 * @param {{width: number, height: number}} [options.page] size the mounted root
 *   to this box, CSS pixels, instead of filling the window
 * @returns {string}
 * @throws {TypeError} when `page` is given but is not a box
 */
export function renderStaticHtml(snapshot, options = {}) {
  const title = escapeHtml(options.title || DEFAULT_TITLE);
  const page = normalizePage(options.page);
  const json = escapeJsonForScript(JSON.stringify(snapshot));

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${title}</title>`,
    '  <style>',
    `      ${pageCss(page)}`,
    '  </style>',
    '</head>',
    '<body>',
    `  <div id="${ROOT_ID}"></div>`,
    `  <script id="${DATA_ID}" type="application/json">${json}</script>`,
    `  <script src="./${BUNDLE_FILENAME}"></script>`,
    '  <script>',
    bootScript(),
    '  </script>',
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

/**
 * The two files an exported archive contains.
 *
 * Separate from `exportStaticSite` because a caller writing a directory instead
 * of a zip - a build step, a test that wants the page on disk - needs the files
 * and not the container.
 *
 * @param {CloudCanvasSession} session
 * @param {object} options
 * @param {string|Uint8Array} options.bundle the built IIFE bundle's contents
 * @param {string} [options.title]
 * @param {{width: number, height: number}} [options.page] see {@link renderStaticHtml}
 * @returns {Array<{name: string, content: string|Uint8Array}>}
 */
export function buildStaticSite(session, options = {}) {
  const bundle = options.bundle;
  if (typeof bundle !== 'string' && !(bundle instanceof Uint8Array)) {
    throw new TypeError(
      'buildStaticSite: `bundle` must be the contents of dist/cloudcanvas.iife.js '
      + '(a string or Uint8Array); this module cannot read the filesystem'
    );
  }

  return [
    { name: 'index.html', content: renderStaticHtml(serializeSession(session), options) },
    { name: BUNDLE_FILENAME, content: bundle }
  ];
}

/**
 * A session as a standalone static site, zipped.
 *
 * @param {CloudCanvasSession} session
 * @param {object} options see {@link buildStaticSite}
 * @returns {Uint8Array} the archive
 */
export function exportStaticSite(session, options = {}) {
  return createZip(buildStaticSite(session, options));
}

/**
 * Export a session and hand the archive to the browser as a download.
 *
 * Async only because of the bundle: pass `options.bundle` and nothing is
 * fetched. The default fetch is same-origin against the page's own `dist/`,
 * which is where a page that loaded CloudCanvas from a bundle already has one.
 *
 * @param {CloudCanvasSession} session
 * @param {string} [filename]
 * @param {object} [options] `bundle`, `bundleUrl`, `title`, `page`
 * @returns {Promise<boolean>} false when there is no document to download into
 */
export async function downloadStaticSite(session, filename = 'cloudcanvas-sandbox.zip', options = {}) {
  const bundle = options.bundle !== undefined
    ? options.bundle
    : await fetchBundle(options.bundleUrl || DEFAULT_BUNDLE_URL);

  return downloadZip(filename, buildStaticSite(session, { ...options, bundle }));
}

/** Read the built bundle over the network, failing loudly on a bad response. */
async function fetchBundle(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`downloadStaticSite: could not fetch "${url}" (HTTP ${response.status})`);
  }
  return response.text();
}
