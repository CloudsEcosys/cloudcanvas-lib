/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Where the graph's link handle reaches under a finger: out from the node's
 * right edge, never over the node - so the fold pill and the node's middle are
 * their own - and only for the node that is pointed at, focused or selected.
 * The browser suite (`tests/browser/ui-graph-phone.test.js`) measures what a
 * finger finds; this holds the sheet to its word.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { COARSE, declared } from './ui-sheet.js';

const HANDLE = '.cloudcanvas-ui-graph-handle';

/*
 * Seen to fail on the sheet of `fc5c778`, which centred the handle's 44px reach on its dot (and so on the node's edge, 22px of it over the node):
 *
 *   ✖ graph reach: under a finger the handle's reach starts at the node's right edge, and is there for a node pointed at, focused or selected
 *     AssertionError [ERR_ASSERTION]: the sheet declares no left for .cloudcanvas-ui-graph-handle::after under (pointer: coarse)
 *       (it declared one for `:is(toggle, handle)::after` - '50%', the reach centred on the dot)
 */
test('graph reach: under a finger the handle\'s reach starts at the node\'s right edge, and is there for a node pointed at, focused or selected', () => {
  assert.equal(declared(`${HANDLE}::after`, 'left', COARSE), '7px', 'the dot is centred on the node\'s edge: its reach starts 1px past the edge, the dot\'s left edge being 7px before it');
  assert.equal(declared(`${HANDLE}::after`, 'translate', COARSE), '0 -50%', 'and runs out from there, centred on the dot\'s height');
  assert.equal(declared(HANDLE, 'pointer-events', COARSE), 'none');
  assert.equal(declared(`.cloudcanvas-ui-graph-node:is(:hover, :focus-visible, .is-selected) ${HANDLE}`, 'pointer-events', COARSE), 'auto');
});
