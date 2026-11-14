/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Where a popover goes, as arithmetic: no layout is needed to say that a box under an anchor flips over it when
 * there is no room below, shifts when it would leave the side of the screen, is held to a phone's width, and
 * keeps off a rectangle the host named, and stands past it when no side keeps clear. The room is the visual viewport,
 * in client coordinates.
 *
 * Red by construction before the popover stood past what it avoids (observed on the two cases that say it, a button
 * at the top of the screen with the strip right under it; the box covered the strip, 36 to 136, from where it was):
 *
 *   ✖ popover place: an anchor at the top of the screen with the strip under it, and no room over it: it stands past the strip, never over it
 *     AssertionError: at the anchor's start edge (kept inside the screen), a gap below the strip
 *     actual:   [ 'bottom', 72, 36, 312, 136 ]     expected: [ 'bottom', 72, 80, 312, 180 ]
 *   ✖ popover place: standing past needs room: ...
 *     AssertionError: past the strip, in the 480px there is
 *     actual:   [ 'bottom', 36, 560 ]               expected: [ 'bottom', 80, 560 ]
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { avoidRects, choosePlace, rectOf } from '../../ui/popover/place.js';
import { stubBox } from '../helpers/ui.js';

/** A 320 by 568 phone, the narrowest screen the kit is held to. */
const PHONE = Object.freeze({ left: 0, top: 0, width: 320, height: 568 });
const at = (left, top, width = 60, height = 30) => ({ left, top, right: left + width, bottom: top + height });
const place = (anchor, size, extra = {}) => choosePlace({ anchor, size, room: PHONE, avoid: [], prefer: 'bottom', ...extra });
const edges = (placed) => [placed.left, placed.top, placed.left + placed.width, placed.top + placed.height];

test('popover place: under the anchor, at its start edge, a gap below it', () => {
  const placed = place(at(20, 100), { width: 200, height: 100 });
  assert.deepEqual([placed.side, ...edges(placed)], ['bottom', 20, 134, 220, 234]);
});

test('popover place: a box that would leave the side of the screen shifts back inside it, and is held to the width of the phone', () => {
  const right = place(at(250, 100), { width: 200, height: 100 });
  assert.deepEqual([right.left, right.left + right.width], [112, 312], 'its far edge keeps the margin the screen is given');
  const wide = place(at(40, 100), { width: 400, height: 100 });
  assert.deepEqual([wide.left, wide.width, wide.maxWidth], [8, 304, 304], 'never wider than the room, and at its margin');
  assert.equal(place(at(40, 100), { width: 120, height: 100 }).maxWidth, 304, 'and the room is the most it may grow to, not the width it has');
});

test('popover place: with no room below it goes over the anchor, and a wish for over goes under when there is no room above', () => {
  const low = place(at(20, 520), { width: 200, height: 100 });
  assert.deepEqual([low.side, low.top + low.height], ['top', 516], 'its bottom edge a gap above the anchor');
  const wished = place(at(20, 300), { width: 200, height: 100 }, { prefer: 'top' });
  assert.equal(wished.side, 'top');
  const high = place(at(20, 10), { width: 200, height: 100 }, { prefer: 'top' });
  assert.deepEqual([high.side, high.top], ['bottom', 44]);
});

test('popover place: taller than either side, it takes the larger side and scrolls inside itself, never off the screen', () => {
  const tall = place(at(20, 300), { width: 200, height: 700 });
  assert.deepEqual([tall.side, tall.top, tall.height, tall.maxHeight], ['top', 8, 288, 288]);
  const [, top, , bottom] = edges(tall);
  assert.ok(top >= 8 && bottom <= 560, 'inside the margin on every side');
});

test('popover place: it keeps off a rectangle it was told to avoid, by going to the side that does not cover it', () => {
  const strip = { left: 0, top: 330, right: 320, bottom: 380 };
  const placed = place(at(20, 300), { width: 200, height: 100 }, { avoid: [strip] });
  assert.deepEqual([placed.side, placed.top + placed.height], ['top', 296], 'under the anchor is the strip: over it is not');
  const free = place(at(20, 300), { width: 200, height: 100 }, { avoid: [{ left: 0, top: 0, right: 320, bottom: 40 }] });
  assert.equal(free.side, 'bottom', 'a strip it would not touch changes nothing');
});

test('popover place: when the side that keeps clear has no room it shrinks there, and when neither does it covers least by taking the side that fits', () => {
  const strip = { left: 0, top: 130, right: 320, bottom: 180 };
  const squeezed = place(at(20, 100), { width: 200, height: 100 }, { avoid: [strip] });
  assert.deepEqual([squeezed.side, squeezed.height], ['top', 88], 'clear of the strip, in the 88px there is');
  const everywhere = place(at(20, 300), { width: 200, height: 100 }, { avoid: [{ left: 0, top: 0, right: 320, bottom: 568 }] });
  assert.equal(everywhere.side, 'bottom', 'nothing is clear: the wished side, if it fits');
});

test('popover place: what to avoid is an element, a rectangle in either of its two shapes, or a list of them; a box with no size is nothing to avoid', () => {
  const strip = stubBox(document.createElement('nav'), { left: 0, top: 330, width: 320, height: 50 });
  assert.deepEqual(rectOf(strip), { left: 0, top: 330, right: 320, bottom: 380 });
  assert.deepEqual(rectOf({ x: 5, y: 6, width: 10, height: 20 }), { left: 5, top: 6, right: 15, bottom: 26 });
  assert.deepEqual(rectOf({ left: 1, top: 2, right: 3, bottom: 4 }), { left: 1, top: 2, right: 3, bottom: 4 });
  assert.equal(rectOf(null), null);
  assert.equal(rectOf({ left: 1, top: 2, right: 1, bottom: 9 }), null, 'no width');
  assert.deepEqual(avoidRects([strip, { x: 0, y: 0, width: 0, height: 0 }, null, { left: 1, top: 2, right: 3, bottom: 4 }]).length, 2);
  assert.deepEqual(avoidRects(strip), [rectOf(strip)]);
  assert.deepEqual(avoidRects(undefined), []);
});

test('popover place: an anchor at the top of the screen with the strip under it, and no room over it: it stands past the strip, never over it', () => {
  const info = at(260, 4, 28, 28);
  const strip = { left: 0, top: 32, right: 320, bottom: 76 };
  const past = place(info, { width: 240, height: 100 }, { avoid: [strip] });
  assert.deepEqual([past.side, ...edges(past)], ['bottom', 72, 80, 312, 180], 'at the anchor\'s start edge (kept inside the screen), a gap below the strip');
  const stacked = place(info, { width: 240, height: 100 }, { avoid: [strip, { left: 0, top: 76, right: 320, bottom: 120 }] });
  assert.equal(stacked.top, 124, 'past both, a gap below the last that is in the way');
  const beside = place(info, { width: 240, height: 100 }, { avoid: [{ left: 0, top: 32, right: 40, bottom: 76 }] });
  assert.equal(beside.top, 36, 'what stands beside where it would go is not in its way');
});

test('popover place: standing past needs room: with none past what is avoided, a squeezed place that keeps clear still goes first, and with nowhere clear it covers least', () => {
  const info = at(260, 4, 28, 28);
  const strip = { left: 0, top: 32, right: 320, bottom: 76 };
  const squeezed = place(info, { width: 240, height: 700 }, { avoid: [strip] });
  assert.deepEqual([squeezed.side, squeezed.top, squeezed.top + squeezed.height], ['bottom', 80, 560], 'past the strip, in the 480px there is');
  const none = place(info, { width: 240, height: 100 }, { avoid: [{ left: 0, top: 32, right: 320, bottom: 540 }] });
  assert.equal(none.top, 36, 'past it is 20px: not a place; it covers, as it did before there was a past');
  const over = place(at(20, 520), { width: 200, height: 100 }, { avoid: [{ left: 0, top: 550, right: 320, bottom: 600 }] });
  assert.deepEqual([over.side, over.top + over.height], ['top', 516], 'past is only for when over and under both fail: a side that keeps clear is taken first');
});
