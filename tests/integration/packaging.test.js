/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The package as a consumer's bundler sees it: every `exports` key resolves,
 * every add-on subpath imported and unused bundles to nothing, the defaults stay
 * under their ceiling, and the `sideEffects` allowlist keeps exactly the modules
 * whose import does something. The core's own guarantees (its entry, its size,
 * no GPU symbol in it) are the `cloudcanvas` package's tests.
 *
 * Bundles are built in memory with esbuild through the package's own name (a
 * self-reference), so resolution runs through `exports` and each file's
 * nearest `package.json`, as it does from `node_modules`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { ROOT, publicEntries, readManifest } from '../../scripts/entries.js';

const manifest = readManifest();

/** The add-on subpaths the package publishes, and the helpers it must not. */
const PUBLIC_ADDONS = Object.freeze([
  'drag', 'select', 'resize', 'focus', 'physics', 'connect', 'svg-state', 'cursors',
  'pan', 'keyboard', 'menu', 'announce', 'observe', 'motion', 'types', 'widget', 'keyed-list',
  'style', 'layout', 'edit', 'place', 'history', 'reactions', 'lazy', 'offload', 'gpu', 'orbit',
  'mesh', 'svg-path', 'sprites', 'text', 'video', 'own-canvas', 'xml', 'html-canvas', 'panel'
]);
const INTERNAL_ADDONS = Object.freeze([
  'trait', 'park', 'menu-registry', 'menu-place', 'actions', 'gpu-scene', 'gpu-webgl2', 'gpu-webgpu',
  'gpu-webgl2-mesh', 'gpu-webgpu-mesh', 'mesh-geometry', 'svg-path-parse', 'svg-path-triangulate', 'svg-path-geometry',
  'panel-place', 'panel-record', 'panel-layer', 'panel-frame', 'panel-snap', 'panel-modal', 'panel-door', 'panel-window'
]);

/** The kit, its groups, the UI kit, the defaults and the add-on CSS, ahead of the add-ons. */
const KIT_ENTRIES = Object.freeze([
  'index', 'forms', 'display', 'components', 'archetypes', 'sandbox', 'ui', 'ui/testing', 'defaults', 'graphics'
]);

/** Ceiling, gzip -9 bytes. */
const DEFAULTS_GZIP_MAX = 59600;

/** One minified in-memory ESM bundle of `source`, resolved from the package root. */
async function bundle(source) {
  const result = await esbuild.build({
    stdin: { contents: source, resolveDir: ROOT, loader: 'js' },
    bundle: true,
    format: 'esm',
    minify: true,
    write: false,
    platform: 'browser',
    target: ['es2022'],
    logLevel: 'silent'
  });
  return result.outputFiles[0].contents;
}

const gzip = (bytes) => zlib.gzipSync(bytes, { level: 9 }).length;

test('exports - the kit entries, then one subpath per public add-on; no internal helper', () => {
  assert.equal(manifest.exports['.'], './index.js');
  assert.equal(manifest.exports['./ui'], './ui/index.js');
  assert.equal(manifest.exports['./ui/testing'], './ui/testing/index.js');
  assert.equal(manifest.exports['./defaults'], './defaults.js');
  assert.equal(manifest.exports['./graphics'], './plugins/styles.js');
  assert.deepEqual(publicEntries(manifest).map(({ name }) => name), [...KIT_ENTRIES, ...PUBLIC_ADDONS]);
  for (const name of PUBLIC_ADDONS) assert.equal(manifest.exports[`./${name}`], `./plugins/${name}.js`, name);
  const targets = Object.values(manifest.exports);
  for (const name of INTERNAL_ADDONS) {
    assert.ok(!targets.includes(`./plugins/${name}.js`), `${name} is internal but has a subpath`);
  }
});

test('exports - every key resolves, for Node and for a bundler, to the file it names', async () => {
  for (const [key, target] of Object.entries(manifest.exports).filter(([name]) => !name.includes('*'))) {
    const specifier = key === '.' ? manifest.name : `${manifest.name}/${key.slice(2)}`;
    assert.ok(fs.existsSync(path.join(ROOT, target)), `${key} -> ${target} does not exist`);
    assert.equal(fileURLToPath(import.meta.resolve(specifier)), path.join(ROOT, target), `Node resolves ${specifier} elsewhere`);
    await assert.doesNotReject(bundle(`import '${specifier}';`), `esbuild cannot resolve ${specifier}`);
  }
});

test('exports - the built bundles resolve through the ./dist/* pattern', () => {
  assert.equal(manifest.exports['./dist/*'], './dist/*');
  for (const file of ['cloudcanvas-lib.esm.js', 'cloudcanvas-ui.esm.js', 'cloudcanvas.board.iife.js', 'esm/drag.js']) {
    assert.equal(fileURLToPath(import.meta.resolve(`${manifest.name}/dist/${file}`)), path.join(ROOT, 'dist', file));
  }
});

test('tree-shaking - every add-on subpath (and the UI kit) imported but unused bundles to 0 bytes', async () => {
  const shaken = [...PUBLIC_ADDONS, 'ui'].map((name) => `${manifest.name}/${name}`);
  for (const specifier of shaken) {
    assert.equal((await bundle(`import '${specifier}';`)).length, 0, `import '${specifier}' kept code`);
    assert.equal((await bundle(`import * as unused from '${specifier}';`)).length, 0, `namespace ${specifier} kept code`);
  }
});

test('gpu - the backends load by import() only: in no static chunk, each its own chunk of dist/esm', () => {
  const esm = path.join(ROOT, 'dist/esm');
  const files = fs.readdirSync(esm).filter((file) => file.endsWith('.js'));
  const holders = (marker) => files.filter((file) => fs.readFileSync(path.join(esm, file), 'utf8').includes(marker));
  assert.deepEqual(holders('drawArraysInstanced'), [files.find((file) => file.startsWith('gpu-webgl2-'))]);
  assert.deepEqual(holders('requestAdapter'), [files.find((file) => file.startsWith('gpu-webgpu-'))]);
  for (const file of fs.readdirSync(path.join(ROOT, 'dist')).filter((name) => name.endsWith('.js'))) {
    const text = fs.readFileSync(path.join(ROOT, 'dist', file), 'utf8');
    assert.ok(!text.includes('requestAdapter') && !text.includes('drawArraysInstanced'), `${file} carries a backend`);
  }
});

test('size - the defaults bundle, every export and its registrations, is at most 59.6 KB gzipped', async () => {
  const bytes = await bundle(`export * from '${manifest.name}/defaults';`);
  assert.ok(gzip(bytes) <= DEFAULTS_GZIP_MAX, `defaults bundle is ${gzip(bytes)} B gzipped`);
});

test('sideEffects - an allowlist, never false; every pattern names a real file', () => {
  const list = manifest.sideEffects;
  assert.ok(Array.isArray(list) && list.length > 0, 'sideEffects is not an allowlist');
  for (const pattern of list) assert.ok(matches(ROOT, pattern).length > 0, `${pattern} matches nothing`);
});

test('sideEffects - only the defaults register on import: a bare entry import is 0 bytes, the defaults survive', async () => {
  assert.equal((await bundle(`import '${manifest.name}';`)).length, 0, 'the entry kept code on a bare import');
  assert.ok((await bundle(`import '${manifest.name}/defaults';`)).length > 0, 'the defaults were shaken out');
  assert.deepEqual(manifest.sideEffects.filter((pattern) => !pattern.startsWith('./dist/')), ['./defaults.js']);
});

test('sideEffects - the archetypes register by a call and import only the core: an unused import is 0 bytes', async () => {
  const widgetDirs = ['./archetypes/', './components/', './display/', './forms/', './sandbox/'];
  assert.ok(!manifest.sideEffects.some((pattern) => widgetDirs.some((dir) => pattern.startsWith(dir))), 'a widget module declares an import side effect');
  assert.equal((await bundle(`import '${manifest.name}/archetypes';`)).length, 0, 'the archetypes kept code');
});

/** The files under `base` a `./dir/name` pattern (a `*` only in the last segment) matches. */
function matches(base, pattern) {
  const relative = pattern.replace(/^\.\//, '');
  const dir = path.join(base, path.dirname(relative));
  if (!fs.existsSync(dir)) return [];
  const name = new RegExp(`^${path.basename(relative).split('*').map(escapeRegExp).join('[^/]*')}$`);
  return fs.readdirSync(dir).filter((entry) => name.test(entry));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
