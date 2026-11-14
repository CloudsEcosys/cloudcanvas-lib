/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What a mouse is given of the handles the views draw small: the map's fold
 * toggle (24x16) and link handle (12), the timeline's separator (6), link handle
 * (12) and bar ends (10). Each keeps its drawn size and reaches a whole 24px
 * target by a part of its own (`::before` or `::after`), as a finger already
 * gets 44px. Where each reach goes - and where it does not - is held in a real
 * browser (`tests/browser/ui-more.test.js`); this reads the sheet.
 *
 * Every case was written before the sheet and run on the sheet of `d242ea4`;
 * each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { COARSE, declared } from './ui-sheet.js';

const WHOLE = /24px/;

/*
 * Seen to fail on the sheet of `d242ea4`, which gave a mouse the drawn size and a finger the reach:
 *
 *   ✖ hit areas: the map's fold toggle and link handle reach 24px on the screen for a mouse, and a finger keeps its 44px
 *     AssertionError [ERR_ASSERTION]: the sheet declares no content for :where(.cloudcanvas-ui-graph[data-can-fold]) .cloudcanvas-ui-graph-toggle::after
 */
test('hit areas: the map\'s fold toggle and link handle reach 24px on the screen for a mouse, and a finger keeps its 44px', () => {
  const toggle = ':where(.cloudcanvas-ui-graph[data-can-fold]) .cloudcanvas-ui-graph-toggle::after';
  const handle = '.cloudcanvas-ui-graph-handle::after';
  for (const part of [toggle, handle]) {
    assert.equal(declared(part, 'content'), '""', `${part} is a reach of its own`);
    assert.match(declared(part, 'width'), WHOLE, 'a whole target wide, on the screen at any zoom (the graph\'s own: `--graph-k`)');
    assert.match(declared(part, 'height'), WHOLE);
    assert.match(declared(part, 'width'), /var\(--graph-k, 1\)/);
  }
  assert.equal(declared(handle, 'left'), '-2px', 'the handle\'s reach starts at its own edge and runs out from the node');
  assert.match(declared(':is(.cloudcanvas-ui-graph-toggle, .cloudcanvas-ui-graph-handle)::after', 'width', COARSE), /var\(--cc-control-min-coarse, 44px\)/, 'a finger keeps 44px');
});

/*
 * Seen to fail on the sheet of `d242ea4`:
 *
 *   ✖ hit areas: the timeline's separator, link handle and bar ends reach 24px for a mouse, and a finger keeps its 44px
 *     AssertionError [ERR_ASSERTION]: the sheet declares no content for .cloudcanvas-ui-timeline-gutter-handle::before
 */
test('hit areas: the timeline\'s separator, link handle and bar ends reach 24px for a mouse, and a finger keeps its 44px', () => {
  const ends = ':is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start)::after';
  assert.equal(declared('.cloudcanvas-ui-timeline-gutter-handle::before', 'content'), '""');
  assert.equal(declared('.cloudcanvas-ui-timeline-gutter-handle::before', 'width'), '24px', 'the separator is 6px drawn and 24px reached');
  assert.equal(declared('.cloudcanvas-ui-timeline-link::after', 'content'), '""');
  assert.deepEqual(['width', 'height'].map((property) => declared('.cloudcanvas-ui-timeline-link::after', property)), ['24px', '24px']);
  assert.equal(declared('.cloudcanvas-ui-timeline-link::after', 'left'), '-6px', 'from the bar\'s edge: the handle is drawn 6px out, and the reach does not enter the bar');
  assert.equal(declared(ends, 'content'), '""');
  assert.equal(declared(ends, 'width'), 'min(24px, calc((var(--timeline-w) - 5px) / 3))', 'inward from the end, never past a third of the bar inside its borders: its middle is its own');
  assert.equal(declared(ends, 'height'), 'max(100%, 24px)');
  assert.equal(declared('.cloudcanvas-ui-timeline-handle::after', 'right'), '0');
  assert.equal(declared('.cloudcanvas-ui-timeline-handle-start::after', 'left'), '0');
  assert.equal(declared(ends, 'width', COARSE), 'min(var(--cc-control-min-coarse, 44px), calc(var(--timeline-w) / 3))', 'a finger keeps 44px');
  assert.equal(declared('.cloudcanvas-ui-timeline-gutter-handle', 'width', COARSE), 'var(--cc-control-min-coarse, 44px)');
});
