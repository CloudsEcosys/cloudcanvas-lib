/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The import boundary, read statically from source.
 *
 * This package is written against the core package, `cloudcanvas`, and reaches it
 * only by package specifier - `cloudcanvas`, `cloudcanvas/kernel`, `cloudcanvas/log`
 * and the other keys its `exports` names - never by a path into it. The core's
 * test seams (`cloudcanvas/testing`, `cloudcanvas/style-gates`) are for tests and
 * scripts only: no shipped module imports them. Inside the
 * package, imports are relative. No file names a cc-main layout path
 * (`.plugin`, `.addons`, `.site`) or reaches into `node_modules` by path; no
 * shipped file builds a relative or `node_modules` path at run time
 * (`import.meta.resolve`, `new URL`) or names
 * `node_modules` at all.
 *
 * The engine half (the add-ons in `plugins/`, the UI kit in `ui/`, `defaults.js`)
 * imports nothing from the widget half (the kit and its groups, the archetypes,
 * the board), and the widget half reaches the add-ons only through a file the
 * package `exports` publishes: a deep import there is an internal the package
 * never promised.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const MANIFEST = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const CORE_MANIFEST = JSON.parse(readFileSync(fileURLToPath(import.meta.resolve('cloudcanvas/package.json')), 'utf8'));

/** The engine half and the widget half, root-relative; together they are everything the package ships. */
const ENGINE = Object.freeze(['plugins', 'ui', 'defaults.js']);
const WIDGETS = Object.freeze(['index.js', 'coerce.js', 'styles.js', 'archetypes', 'components', 'display', 'forms', 'sandbox']);

/** The core entries only tests and scripts may import. */
const TEST_SEAMS = Object.freeze(['cloudcanvas/testing', 'cloudcanvas/style-gates']);

/** What tests and scripts may also import: the devDependencies. */
const TOOLING = Object.freeze(Object.keys(MANIFEST.devDependencies).filter((name) => name !== CORE_MANIFEST.name));

/** Every specifier in a module: static `from`, bare `import '...'` and `import('...')`; templates skipped. */
function specifiersOf(file) {
  const source = readFileSync(file, 'utf8');
  const pattern = /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"\s]+)\1/g;
  return [...source.matchAll(pattern)].map((match) => match[2]).filter((spec) => !spec.includes('${'));
}

/** Every `.js`/`.html` file under a root-relative tree (or the file itself). */
function sourcesUnder(tree) {
  const absolute = path.join(ROOT, tree);
  if (statSync(absolute).isFile()) return [absolute];
  return readdirSync(absolute, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.(js|html)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
}

const SHIPPED = [...ENGINE, ...WIDGETS].flatMap(sourcesUnder);
const TOOLS = ['tests', 'scripts'].flatMap(sourcesUnder);

/** The `exports` key a package specifier names, or null when it is not that package's. */
function exportKey(name, spec) {
  if (spec === name) return '.';
  return spec.startsWith(`${name}/`) ? `.${spec.slice(name.length)}` : null;
}

function isInside(tree, file) {
  const relative = path.relative(path.join(ROOT, tree), file);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

const inHalf = (half, file) => half.some((tree) => isInside(tree, file));
const where = (file, spec) => `${path.relative(ROOT, file)} -> ${spec}`;
const isCore = (spec) => exportKey(CORE_MANIFEST.name, spec) !== null;
const isSelf = (spec) => exportKey(MANIFEST.name, spec) !== null;

/** Offenders across `files`: each specifier `bad` flags, as `file -> spec`. */
function offendersIn(files, bad) {
  return files.flatMap((file) => specifiersOf(file).filter((spec) => bad(spec, file)).map((spec) => where(file, spec)));
}

test('boundary - the core is reached only by a specifier its exports name', () => {
  const unknown = (spec) => isCore(spec) && !Object.hasOwn(CORE_MANIFEST.exports, exportKey(CORE_MANIFEST.name, spec));
  assert.deepEqual(offendersIn([...SHIPPED, ...TOOLS], unknown), []);
  const used = new Set(SHIPPED.flatMap(specifiersOf).filter(isCore));
  assert.ok(used.has('cloudcanvas/kernel') && used.has('cloudcanvas'), 'the scan found no core import at all');
});

test('boundary - no path names the cc-main layout or reaches into node_modules', () => {
  const layout = (spec) => /(^|\/)\.(plugin|addons|site)(\/|$)|(^|\/)node_modules(\/|$)/.test(spec);
  assert.deepEqual(offendersIn([...SHIPPED, ...TOOLS], layout), []);
});

/** A path a module builds at run time: `import.meta.resolve(...)` or `new URL(...)` on a relative or `node_modules` string. */
const RUNTIME_PATH = /(?:\bimport\.meta\.resolve|\bnew\s+URL)\s*\(\s*(['"`])((?:\.|[^'"`]*node_modules)[^'"`]*)\1/g;

/** Offenders across shipped `files`: each run-time path, and any `node_modules` named at all. */
function runtimePathsIn(files) {
  return files.flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    const built = [...source.matchAll(RUNTIME_PATH)].map((match) => where(file, match[0]));
    return source.includes('node_modules') && built.length === 0 ? [where(file, 'node_modules')] : built;
  });
}

test('boundary - no shipped module builds a path at run time or names node_modules', () => {
  assert.deepEqual(runtimePathsIn(SHIPPED), []);
});

test('boundary - a shipped module imports the core (no test seam), a published entry of its own, or a file inside the package', () => {
  const outside = (spec, file) => {
    if (isCore(spec)) return TEST_SEAMS.includes(spec);
    if (isSelf(spec)) return !Object.hasOwn(MANIFEST.exports, exportKey(MANIFEST.name, spec));
    if (!spec.startsWith('.')) return true;
    const target = path.resolve(path.dirname(file), spec);
    return !inHalf([...ENGINE, ...WIDGETS], target) || !existsSync(target);
  };
  assert.deepEqual(offendersIn(SHIPPED, outside), []);
});

test('boundary - the test seams are real core entries, and tests use them', () => {
  for (const seam of TEST_SEAMS) assert.ok(Object.hasOwn(CORE_MANIFEST.exports, exportKey(CORE_MANIFEST.name, seam)), `${seam} is not exported`);
  const used = new Set(TOOLS.flatMap(specifiersOf));
  assert.deepEqual(TEST_SEAMS.filter((seam) => !used.has(seam)), [], 'a seam no test imports');
});

test('boundary - tests and scripts import only the packages, the builtins and the tooling', () => {
  const foreign = (spec) => !(spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:')
    || isCore(spec) || isSelf(spec) || TOOLING.some((name) => exportKey(name, spec) !== null));
  assert.deepEqual(offendersIn(TOOLS, foreign), []);
});

test('boundary - the engine half imports nothing from the widget half', () => {
  const engineFiles = SHIPPED.filter((file) => inHalf(ENGINE, file));
  const intoWidgets = (spec, file) => spec.startsWith('.') && inHalf(WIDGETS, path.resolve(path.dirname(file), spec));
  assert.deepEqual(offendersIn(engineFiles, intoWidgets), []);
});

/** Every engine file the package publishes: the `exports` targets in the engine half. */
const PUBLIC_ENGINE = new Set(Object.values(MANIFEST.exports)
  .map((target) => path.join(ROOT, target))
  .filter((target) => inHalf(ENGINE, target)));

test('boundary - the widgets reach the engine only through a published entry', () => {
  const widgetFiles = SHIPPED.filter((file) => inHalf(WIDGETS, file));
  const intoEngine = (spec, file) => spec.startsWith('.') && inHalf(ENGINE, path.resolve(path.dirname(file), spec));
  assert.ok(offendersIn(widgetFiles, intoEngine).length > 0, 'the scan found no engine import at all');
  const deep = (spec, file) => intoEngine(spec, file) && !PUBLIC_ENGINE.has(path.resolve(path.dirname(file), spec));
  assert.deepEqual(offendersIn(widgetFiles, deep), []);
});

test('boundary - the 0.4 bridges are gone for good', () => {
  const addons = new Set(readdirSync(path.join(ROOT, 'plugins')));
  assert.deepEqual(['adapt-trait.js', 'carrier.js', 'class-from-trait.js'].filter((name) => addons.has(name)), [],
    'a 0.4 bridge came back');
});
