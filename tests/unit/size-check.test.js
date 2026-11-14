/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The size gate's judgement (`scripts/size.js --check`), on rows and a baseline
 * given directly: a row that grew fails, and so does a row the baseline does not
 * know and a baseline row no entry measures any more - either means the
 * baseline no longer describes the package.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { sizeProblems } from '../../scripts/size.js';

const row = (name, min, gzip) => ({ name, min, gzip });

test('size check - rows at or under their baseline pass', () => {
  assert.deepEqual(sizeProblems([row('drag', 100, 50), row('pan', 90, 40)], { drag: { min: 100, gzip: 50 }, pan: { min: 99, gzip: 45 } }), []);
});

test('size check - a row that grew fails, per metric', () => {
  assert.deepEqual(sizeProblems([row('drag', 101, 51)], { drag: { min: 100, gzip: 50 } }),
    ['drag min: 100 -> 101 (+1 B)', 'drag gzip: 50 -> 51 (+1 B)']);
});

test('size check - an entry with no baseline row fails', () => {
  assert.deepEqual(sizeProblems([row('drag', 100, 50), row('new', 1, 1)], { drag: { min: 100, gzip: 50 } }),
    ['new: no baseline row']);
});

test('size check - a baseline row no entry measures fails as stale', () => {
  assert.deepEqual(sizeProblems([row('drag', 100, 50)], { drag: { min: 100, gzip: 50 }, gone: { min: 1, gzip: 1 } }),
    ['gone: stale baseline row (no such entry)']);
});
