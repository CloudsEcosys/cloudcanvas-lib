/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Unit tests for the harness's request containment rule (`scripts/served-path.js`):
 * every dot segment stays closed at every depth, `node_modules` opens only below
 * the head of the core package the import map points into, and traversal is
 * caught after `..` collapses rather than by pattern-matching the raw URL.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { SERVED_PACKAGES, containRequest, isWithin, pathnameOf } from '../../scripts/served-path.js';

const ROOT = path.resolve('/srv/checkout');

function segmentsOf(pathname) {
  return containRequest(ROOT, pathname)?.segments ?? null;
}

test('SERVED_PACKAGES is exactly the core', () => {
  assert.deepEqual([...SERVED_PACKAGES], ['cloudcanvas']);
  assert.ok(Object.isFrozen(SERVED_PACKAGES));
});

test('pathnameOf decodes and strips the query; an unparseable URL is null', () => {
  assert.equal(pathnameOf('/tests/browser/fixtures/bare.html?x=1#board'), '/tests/browser/fixtures/bare.html');
  assert.equal(pathnameOf('/%2egit/config'), '/.git/config');
  assert.equal(pathnameOf('/%E0%A4%A'), null);
});

test('a package file and a served core file are contained', () => {
  assert.deepEqual(segmentsOf('/plugins/drag.js'), ['plugins', 'drag.js']);
  assert.deepEqual(segmentsOf('/dist/esm/drag.js'), ['dist', 'esm', 'drag.js']);
  const contained = containRequest(ROOT, '/node_modules/cloudcanvas/index.js');
  assert.deepEqual(contained.segments, ['node_modules', 'cloudcanvas', 'index.js']);
  assert.equal(contained.resolved, path.join(ROOT, 'node_modules', 'cloudcanvas', 'index.js'));
});

test('every dot segment is refused at the top level', () => {
  for (const hidden of ['/.git/config', '/.env', '/.npmrc', '/.claude/settings.json', '/.hidden/index.js']) {
    assert.equal(segmentsOf(hidden), null, hidden);
  }
});

test('a dot segment nested under a served path is refused', () => {
  assert.equal(segmentsOf('/plugins/.hidden.js'), null);
  assert.equal(segmentsOf('/node_modules/cloudcanvas/.git/config'), null);
});

test('traversal is caught after `..` collapses', () => {
  assert.equal(segmentsOf('/plugins/../.git/config'), null);
  assert.equal(segmentsOf('/plugins/../../etc/passwd'), null);
  assert.equal(segmentsOf('/../index.js'), null);
  assert.equal(segmentsOf('/node_modules/cloudcanvas/../playwright/index.js'), null);
  assert.deepEqual(segmentsOf('/plugins/../index.js'), ['index.js']);
});

test('the encoded spelling of a dot is decoded before it is measured', () => {
  assert.equal(segmentsOf(pathnameOf('/%2egit/config')), null);
  assert.equal(segmentsOf(pathnameOf('/plugins/%2egit')), null);
});

test('node_modules opens only below the head of the core package, never deeper', () => {
  assert.equal(segmentsOf('/node_modules/playwright/package.json'), null);
  assert.equal(segmentsOf('/node_modules/cloudcanvas'), null, 'the package directory itself');
  assert.equal(segmentsOf('/node_modules/cloudcanvas/node_modules/x.js'), null);
  assert.equal(segmentsOf('/plugins/node_modules/x.js'), null);
  assert.equal(segmentsOf('/node_modules/.package-lock.json'), null);
});

test('the root itself, a non-string and a relative pathname are refused', () => {
  assert.equal(containRequest(ROOT, '/'), null);
  assert.equal(containRequest(ROOT, ''), null);
  assert.equal(containRequest(ROOT, 'tests/x.js'), null);
  assert.equal(containRequest(ROOT, null), null);
});

test('isWithin accepts the root and its descendants, refuses siblings and parents', () => {
  assert.equal(isWithin(ROOT, ROOT), true);
  assert.equal(isWithin(ROOT, path.join(ROOT, 'plugins', 'drag.js')), true);
  assert.equal(isWithin(ROOT, path.resolve(ROOT, '..')), false);
  assert.equal(isWithin(ROOT, `${ROOT}-evil/file.js`), false, 'a prefix match is not containment');
  assert.equal(isWithin(ROOT, '/etc/passwd'), false);
});
