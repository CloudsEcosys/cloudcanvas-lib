/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The release bundler (`scripts/build.js`) as a tool: it runs from any working
 * directory, a build that fails part-way leaves the committed `dist/` as it was
 * (the output is staged beside it and swapped in whole), and `--check` reports a
 * file the build does not make anywhere under `dist/`, not only in `dist/esm/`.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findStale, replaceDir } from '../../scripts/build.js';
import { ROOT } from '../../scripts/entries.js';

const bytes = (text) => new TextEncoder().encode(text);

let scratch;

before(() => {
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-build-'));
});

after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
});

/** A fresh fake package root under the scratch directory, with `files` (root-relative) on disk. */
function fakeRoot(name, files) {
  const root = path.join(scratch, name);
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  }
  return root;
}

test('build - --check passes from a working directory other than the root', () => {
  const run = spawnSync(process.execPath, [path.join(ROOT, 'scripts/build.js'), '--check'], { cwd: os.tmpdir(), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Dist check passed/);
});

test('build - --check reports a file the build does not make anywhere under dist/', () => {
  const root = fakeRoot('stale', { 'dist/a.js': 'a', 'dist/extra.js': 'x', 'dist/esm/b.js': 'b', 'dist/esm/old.js': 'o', 'dist/notes/c.txt': 'c' });
  const built = [{ outfile: 'dist/a.js', bytes: bytes('a') }, { outfile: 'dist/esm/b.js', bytes: bytes('b') }];
  assert.deepEqual(findStale(built, root).sort(), ['dist/esm/old.js: not built', 'dist/extra.js: not built', 'dist/notes/c.txt: not built']);
});

test('build - --check reports a built file that differs or is missing', () => {
  const root = fakeRoot('differs', { 'dist/a.js': 'a' });
  const built = [{ outfile: 'dist/a.js', bytes: bytes('A') }, { outfile: 'dist/b.js', bytes: bytes('b') }];
  assert.deepEqual(findStale(built, root), ['dist/a.js: differs', 'dist/b.js: missing']);
});

test('build - a write replaces dist/ whole: no file of the old build survives', () => {
  const root = fakeRoot('swap', { 'dist/old.js': 'old', 'dist/esm/old.js': 'old' });
  replaceDir(path.join(root, 'dist'), [{ outfile: 'dist/a.js', bytes: bytes('a') }, { outfile: 'dist/esm/b.js', bytes: bytes('b') }], root);
  assert.deepEqual(fs.readdirSync(path.join(root, 'dist'), { recursive: true }).sort(), ['a.js', 'esm', 'esm/b.js']);
  assert.deepEqual(fs.readdirSync(root), ['dist'], 'a staging or retired directory was left behind');
});

test('build - a write that fails part-way leaves dist/ as it was', () => {
  const root = fakeRoot('fail', { 'dist/keep.js': 'keep' });
  const clash = [{ outfile: 'dist/a.js', bytes: bytes('a') }, { outfile: 'dist/a.js/b.js', bytes: bytes('b') }];
  assert.throws(() => replaceDir(path.join(root, 'dist'), clash, root));
  assert.deepEqual(fs.readdirSync(path.join(root, 'dist')), ['keep.js']);
  assert.equal(fs.readFileSync(path.join(root, 'dist/keep.js'), 'utf8'), 'keep');
  assert.deepEqual(fs.readdirSync(root), ['dist'], 'a staging directory was left behind');
});
