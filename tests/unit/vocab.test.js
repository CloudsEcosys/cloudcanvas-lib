/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The vocabulary gate (`scripts/vocab.js`): the 0.4 engine's words appear
 * nowhere in the add-ons, the UI kit, the widgets, `tests` or `scripts` outside the
 * named exemptions, each exemption still names a file that exists, and the
 * pattern catches every form it is meant to - whole tokens only.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EXEMPT, ROOT, SCANNED, isExempt, scan, scanText, scanFile } from '../../scripts/vocab.js';

/** Every file under the scanned trees, root-relative, for the exemption check. */
function scannedFiles() {
  return SCANNED.flatMap((tree) => (fs.statSync(path.join(ROOT, tree)).isFile() ? [tree] : fs.readdirSync(path.join(ROOT, tree), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(ROOT, path.join(entry.parentPath ?? entry.path, entry.name)).split(path.sep).join('/'))
    .filter((file) => !/(^|\/)(node_modules|dist|\.git)\//.test(file))));
}

test('vocab - domain pinning does not excuse an obsolete runtime API', () => {
  const file = 'ui/context-actions.js';
  assert.deepEqual(scanFile(file, "const pin = button('Pin');"), []);
  assert.equal(scanFile(file, 'const view = new Pin();').length, 1);
  assert.equal(scanFile(file, 'createCanvasSession();').length, 1);
});

test('vocab - no hit of the removed vocabulary outside the exemptions', () => {
  const hits = scan().map(({ file, line, text }) => `${file}:${line}: ${text}`);
  assert.deepEqual(hits, []);
});

test('vocab - every exemption names a file that exists, with a reason', () => {
  const files = scannedFiles();
  for (const [pattern, reason] of EXEMPT) {
    assert.ok(reason.length > 0, `${pattern} has no reason`);
    assert.ok(files.some((file) => pattern.test(file)), `${pattern} exempts nothing: drop it`);
  }
  assert.equal(isExempt('plugins/drag.js'), false);
});

test('vocab - each form is caught, and only as a whole token', () => {
  const caught = ['a Pin', 'three pins', 'Pins', 'new PinEvent(', 'pinId', 'pinManager.getAllPins()',
    'a particle', 'particles', '.cloudcanvas-pin-title', '[data-pin-id]'];
  for (const text of caught) assert.equal(scanText(text).length, 1, `missed: ${text}`);
  const clean = ['spinner', 'pinned', 'pinhead', 'pink', 'beginPinch', 'Pinboard', 'opinion', 'PIN', 'cloudcanvas-card-title'];
  for (const text of clean) assert.deepEqual(scanText(text), [], `a false hit: ${text}`);
  assert.deepEqual(scanText('one\ntwo pins\nthree').map(({ line }) => line), [2]);
});
