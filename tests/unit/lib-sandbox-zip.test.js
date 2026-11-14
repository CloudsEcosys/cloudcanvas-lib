/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Unit tests for the sandbox ZIP writer and the standalone static-site export.
 *
 * The decisive check here is not any assertion this file makes about its own
 * bytes - a writer and a reader written by the same hand agree on a wrong
 * offset as happily as on a right one. It is `extractWith()`: the archive is
 * written to disk and handed to `unzip`, or to Python's `zipfile` module, and
 * the *tool's* verdict is what passes the test. Both are independent
 * implementations of the same spec; neither has ever seen `.addons/sandbox/zip.js`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createZip, crc32, dosTimestamp, downloadZip } from '../../sandbox/zip.js';
import {
  BUNDLE_FILENAME,
  DATA_ID,
  ROOT_ID,
  buildStaticSite,
  exportStaticSite,
  renderStaticHtml
} from '../../sandbox/export-static.js';
import { serializeBoard } from '../../sandbox/serialize.js';
import { freshBoard } from '../helpers/sandbox-tree.js';
import { resetDocument } from '../helpers/dom.js';

const encoder = new TextEncoder();


/** Whether an external command is present and runnable. */
function available(command, args) {
  try {
    execFileSync(command, args, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return error.status !== undefined && error.code !== 'ENOENT';
  }
}

const HAS_UNZIP = available('unzip', ['-v']);
const HAS_PYTHON = available('python3', ['-c', 'import zipfile']);

/** Write an archive to a throwaway directory and hand back its path. */
function writeArchive(bytes, name = 'archive.zip') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-sandbox-zip-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, bytes);
  return { dir, file };
}

/**
 * Extract one member with a real, independent tool.
 *
 * `unzip` first because it is the reference implementation everyone actually
 * has; Python's `zipfile` is the fallback, and an entirely separate codebase, so
 * an archive both accept is an archive.
 *
 * @returns {{tool: string, integrity: string, bytes: Buffer}}
 */
function extractWith(file, member) {
  if (HAS_UNZIP) {
    return {
      tool: 'unzip',
      integrity: execFileSync('unzip', ['-t', file], { encoding: 'utf8' }),
      bytes: execFileSync('unzip', ['-p', file, member], { maxBuffer: 1 << 28 })
    };
  }

  const script = 'import sys,zipfile\n'
    + 'z = zipfile.ZipFile(sys.argv[1])\n'
    + 'bad = z.testzip()\n'
    + 'sys.stderr.write("bad member: %r\\n" % (bad,))\n'
    + 'assert bad is None\n'
    + 'sys.stdout.buffer.write(z.read(sys.argv[2]))\n';

  return {
    tool: 'python3 zipfile',
    integrity: 'python3 zipfile.testzip(): no bad members',
    bytes: execFileSync('python3', ['-c', script, file, member], { maxBuffer: 1 << 28 })
  };
}

/**
 * Extract one member with Python's `zipfile`, specifically.
 *
 * Info-ZIP's *command line* matches member names in CP437 unless it was built
 * for UTF-8, so `unzip -p archive.zip ünïcode.txt` reports "filename not
 * matched" for an archive it validates perfectly with `-t`. That is a limitation
 * of the tool's argument handling, not of the archive, and Python reads the same
 * bytes and the same UTF-8 flag correctly - so the non-ASCII claim is made
 * against Python alone.
 */
function pythonExtract(file, member) {
  const script = 'import sys,zipfile\n'
    + 'z = zipfile.ZipFile(sys.argv[1])\n'
    + 'assert z.testzip() is None\n'
    + 'sys.stdout.buffer.write(z.read(sys.argv[2]))\n';

  return execFileSync('python3', ['-c', script, file, member], { maxBuffer: 1 << 28 });
}

/** Member names as Python's `zipfile` decodes them. */
function pythonNames(file) {
  const script = 'import sys,zipfile\nprint("\\n".join(zipfile.ZipFile(sys.argv[1]).namelist()))\n';
  return execFileSync('python3', ['-c', script, file], { encoding: 'utf8' }).trim().split('\n');
}

/** Every member name an independent tool reports in the archive. */
function listMembers(file) {
  if (HAS_UNZIP) {
    return execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).trim().split('\n');
  }
  return pythonNames(file);
}

const EXTRACTOR_MISSING = 'neither `unzip` nor python3 zipfile is available to validate the archive';

test.beforeEach(() => {
  resetDocument();
});


/* ------------------ CRC-32 ------------------ */

test('Sandbox zip - CRC-32 matches the standard "123456789" vector', () => {
  // The published check value for CRC-32/ISO-HDLC. Any other answer means the
  // polynomial, the bit order, or the final xor is wrong.
  assert.equal(crc32(encoder.encode('123456789')), 0xcbf43926);
  assert.equal(crc32(new Uint8Array(0)), 0x00000000);
  assert.equal(crc32(encoder.encode('a')), 0xe8b7be43);
  assert.equal(crc32(encoder.encode('The quick brown fox jumps over the lazy dog')), 0x414fa339);
});

test('Sandbox zip - DOS timestamps pack the two 16-bit fields, and clamp at 1980', () => {
  const stamp = dosTimestamp(new Date(2026, 8, 3, 22, 35, 44));
  assert.equal(stamp.date, ((2026 - 1980) << 9) | (9 << 5) | 3);
  assert.equal(stamp.time, (22 << 11) | (35 << 5) | 22);

  assert.equal(dosTimestamp(new Date(1970, 0, 1)).date >> 9, 0);
});

/* ------------------ BYTE LAYOUT ------------------ */

test('Sandbox zip - the three record signatures land at the offsets they declare', () => {
  const bytes = createZip([{ name: 'a.txt', content: 'AAA' }]);
  const view = new DataView(bytes.buffer);

  assert.equal(view.getUint32(0, true), 0x04034b50, 'local file header');
  assert.equal(view.getUint16(8, true), 0, 'compression method is STORE');
  assert.equal(view.getUint32(18, true), 3, 'compressed size');
  assert.equal(view.getUint32(22, true), 3, 'uncompressed size');
  assert.equal(view.getUint16(26, true), 5, 'file name length');

  // The end record is the last 22 bytes, and it points at the central directory.
  const end = bytes.length - 22;
  assert.equal(view.getUint32(end, true), 0x06054b50, 'end of central directory');
  assert.equal(view.getUint16(end + 10, true), 1, 'entry count');

  const centralOffset = view.getUint32(end + 16, true);
  const centralSize = view.getUint32(end + 12, true);
  assert.equal(view.getUint32(centralOffset, true), 0x02014b50, 'central directory header');
  assert.equal(centralOffset + centralSize, end, 'the central directory ends where the end record begins');
  assert.equal(view.getUint32(centralOffset + 42, true), 0, 'local header offset of the first entry');
});

test('Sandbox zip - refuses malformed input rather than emitting a broken archive', () => {
  assert.throws(() => createZip('not an array'), TypeError);
  assert.throws(() => createZip([{ content: 'nameless' }]), TypeError);
  assert.throws(() => createZip([{ name: '', content: 'x' }]), TypeError);
});

/* ------------------ INDEPENDENT VALIDATION ------------------ */

test('Sandbox zip - a real extractor accepts the archive and returns the exact bytes', (t) => {
  if (!HAS_UNZIP && !HAS_PYTHON) return t.skip(EXTRACTOR_MISSING);

  const html = '<!doctype html>\n<title>zip round trip</title>\n';
  const json = JSON.stringify({ blits: [{ id: 'a', x: 1 }] });
  const raw = new Uint8Array([0, 1, 2, 0x7f, 0x80, 0xff, 0xfe]);

  const { file, dir } = writeArchive(createZip([
    { name: 'index.html', content: html },
    { name: 'nested/data.json', content: json },
    { name: 'raw.bin', content: raw }
  ]));

  try {
    assert.deepEqual(listMembers(file).sort(), ['index.html', 'nested/data.json', 'raw.bin']);

    const extracted = extractWith(file, 'index.html');
    assert.ok(extracted.integrity.length > 0, `${extracted.tool} reported integrity`);
    assert.deepEqual(extracted.bytes, Buffer.from(html, 'utf8'), 'index.html is byte-for-byte');

    assert.deepEqual(extractWith(file, 'nested/data.json').bytes, Buffer.from(json, 'utf8'));
    assert.deepEqual(extractWith(file, 'raw.bin').bytes, Buffer.from(raw));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Sandbox zip - non-ASCII names and contents survive a real extractor', (t) => {
  if (!HAS_PYTHON) return t.skip('python3 zipfile is needed to read UTF-8 member names');

  const content = 'naïve — pinned ✓';
  const { file, dir } = writeArchive(createZip([{ name: 'ünïcode.txt', content }]));

  try {
    assert.deepEqual(pythonExtract(file, 'ünïcode.txt'), Buffer.from(content, 'utf8'));
    assert.deepEqual(pythonNames(file), ['ünïcode.txt']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* ------------------ DOWNLOAD ------------------ */

test('Sandbox zip - downloadZip names the blob and cleans up after itself', () => {
  const clicks = [];
  const created = [];
  const revoked = [];

  const realCreate = URL.createObjectURL;
  const realRevoke = URL.revokeObjectURL;
  URL.createObjectURL = (blob) => {
    created.push(blob);
    return 'blob:cloudcanvas-test';
  };
  URL.revokeObjectURL = (url) => revoked.push(url);
  document.addEventListener('click', (event) => clicks.push(event.target));

  try {
    assert.equal(downloadZip('sandbox.zip', [{ name: 'a.txt', content: 'A' }]), true);
  } finally {
    URL.createObjectURL = realCreate;
    URL.revokeObjectURL = realRevoke;
  }

  assert.equal(created.length, 1);
  assert.equal(created[0].type, 'application/zip');
  assert.equal(clicks.length, 1);
  assert.equal(clicks[0].download, 'sandbox.zip');
  assert.deepEqual(revoked, ['blob:cloudcanvas-test']);
  // The anchor is a means, not a fixture: it must not survive the call.
  assert.equal(document.querySelector('a[download]'), null);
});

/* ------------------ STATIC SITE ------------------ */

test('Sandbox export - the generated page is well-formed and carries the snapshot', () => {
  const app = freshBoard();
  app.blit({ id: 'exported', x: 12, y: 34, type: 'card', card: { title: 'Exported' } });

  const snapshot = serializeBoard(app);
  const html = renderStaticHtml(snapshot, { title: 'My Sandbox' });

  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('<title>My Sandbox</title>'));
  assert.ok(html.includes(`<div id="${ROOT_ID}"></div>`));
  assert.ok(html.includes(`<script src="./${BUNDLE_FILENAME}"></script>`));
  assert.ok(html.includes('CC.createBoard('));
  assert.ok(html.includes('function restoreTree'), 'the real restoreTree source is embedded');
  assert.equal(html.trimEnd().endsWith('</html>'), true);

  // The one claim that matters: the page's data block parses back to the snapshot.
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  assert.deepEqual(JSON.parse(parsed.getElementById(DATA_ID).textContent), snapshot);
  assert.equal(parsed.getElementById(ROOT_ID).tagName, 'DIV');
});

test('Sandbox export - a page size sizes the mounted root instead of filling the window', () => {
  const app = freshBoard();
  const snapshot = serializeBoard(app);

  const sized = renderStaticHtml(snapshot, { page: { width: 375, height: 812 } });
  assert.ok(sized.includes(
    `#${ROOT_ID} { position: relative; width: 375px; height: 812px; max-width: 100vw; margin: 0 auto; }`
  ), 'the root is not sized to the page');
  assert.equal(sized.includes('width: 100vw; height: 100vh'), false, 'the window-filling rule survived');
  assert.ok(sized.includes('<meta name="viewport" content="width=device-width, initial-scale=1">'));

  // Without one the page fills the window, as it always did.
  assert.ok(renderStaticHtml(snapshot).includes('width: 100vw; height: 100vh'));
  assert.ok(renderStaticHtml(snapshot, { page: null }).includes('width: 100vw; height: 100vh'));

  // And it threads through the archive builder untouched, rounded to whole pixels.
  const [index] = buildStaticSite(app, { bundle: 'window.CloudCanvas = {};', page: { width: 1440.4, height: 900 } });
  assert.ok(index.content.includes('width: 1440px; height: 900px'));
});

test('Sandbox export - a page that is not a box is a programming error, and says so', () => {
  const snapshot = serializeBoard(freshBoard());
  assert.throws(() => renderStaticHtml(snapshot, { page: { width: 0, height: 812 } }), TypeError);
  assert.throws(() => renderStaticHtml(snapshot, { page: { width: 375 } }), TypeError);
  assert.throws(() => renderStaticHtml(snapshot, { page: 'mobile' }), TypeError);
  assert.throws(() => renderStaticHtml(snapshot, { page: { width: Infinity, height: 1 } }), TypeError);
});

test('Sandbox export - a snapshot containing markup cannot break out of its script tag', () => {
  const app = freshBoard();
  app.blit({
    id: 'hostile',
    type: 'raw',
    raw: { html: '</script><script>window.escaped = true;</script>' }
  });

  const snapshot = serializeBoard(app);
  const html = renderStaticHtml(snapshot);

  assert.equal(html.includes('</script><script>window.escaped'), false);
  assert.ok(html.includes('\\u003c/script\\u003e'));

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  assert.deepEqual(JSON.parse(parsed.getElementById(DATA_ID).textContent), snapshot);
});

test('Sandbox export - the bundle is a required argument, not a filesystem read', () => {
  const app = freshBoard();
  assert.throws(() => buildStaticSite(app), TypeError);
  assert.throws(() => buildStaticSite(app, { bundle: 42 }), TypeError);
});

test('Sandbox export - the archive holds index.html beside the bundle, and unzips', (t) => {
  if (!HAS_UNZIP && !HAS_PYTHON) return t.skip(EXTRACTOR_MISSING);

  const app = freshBoard();
  app.blit({ id: 'packaged', x: 7, y: 9, type: 'card', card: { title: 'Packaged' } });

  const bundle = '/* stand-in for the built IIFE bundle */\nwindow.CloudCanvas = {};\n';
  const files = buildStaticSite(app, { bundle, title: 'Packaged' });
  const { file, dir } = writeArchive(exportStaticSite(app, { bundle, title: 'Packaged' }));

  try {
    assert.deepEqual(listMembers(file).sort(), [BUNDLE_FILENAME, 'index.html']);
    assert.deepEqual(extractWith(file, 'index.html').bytes, Buffer.from(files[0].content, 'utf8'));
    assert.deepEqual(extractWith(file, BUNDLE_FILENAME).bytes, Buffer.from(bundle, 'utf8'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Sandbox export - a minified consumer bundle still boots: the page calls the loader by the name it embeds', async () => {
  const { build } = await import('esbuild');
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const path = await import('node:path');
  const { pathToFileURL, fileURLToPath } = await import('node:url');
  const entry = fileURLToPath(new URL('../../sandbox/export-static.js', import.meta.url));
  const result = await build({ entryPoints: [entry], bundle: true, minify: true, format: 'esm', write: false, platform: 'browser' });
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'cc-minexport-')), 'export.mjs');
  writeFileSync(file, result.outputFiles[0].text);
  const minified = await import(pathToFileURL(file).href);
  const html = minified.renderStaticHtml({ version: 2, blits: [] });
  const boot = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const called = /^\s*(\w+)\(CC\.loaderApi, app, data\.blits, warnings\);$/m.exec(boot);
  assert.ok(called, 'the boot script no longer calls the loader');
  assert.notEqual(called[1], 'restoreTree', 'the bundle kept the source name, so this test proves nothing');
  assert.ok(boot.includes(`function ${called[1]}(`), `the page calls ${called[1]} but embeds no function by that name`);
});
