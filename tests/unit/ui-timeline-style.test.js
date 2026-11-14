/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What the timeline's sheet promises, read from the sheet: every control of
 * it - the chevron, the separator, the ends of a bar - is a whole target under
 * a finger, a gesture the host takes shows its cursor, and nothing moves.
 *
 * Written first and seen to fail on the sheet of `a304bfb`, which had none of them:
 *
 *   ✖ timeline sheet: under a finger the chevron, the separator and the ends of a bar are 44px targets
 *     AssertionError [ERR_ASSERTION]: the sheet declares no width for .cloudcanvas-ui-timeline-group-toggle under (pointer: coarse)
 *   ✖ timeline sheet: what a drag does is said by its cursor, where the host takes it
 *     AssertionError [ERR_ASSERTION]: the sheet declares no cursor for .cloudcanvas-ui-timeline-gutter-handle
 *
 * The third case held on it too (the old sheet moved nothing) and is here to keep the new rules so. Two cases were added
 * after a look in a browser (phase 28 K2: a short bar padded to 21px, one-day bars with no room between two handles of
 * 10px, and the base sheet's gutter overriding the phone's); on `a304bfb` they read
 *
 *   ✖ timeline sheet: the gutter is narrower on a phone, and a bar of one day keeps room to be moved between its two handles
 *     AssertionError [ERR_ASSERTION]: the sheet declares no width for :is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start)
 *   ✖ timeline sheet: a short bar keeps no padding, so it is as narrow as its length
 *     AssertionError [ERR_ASSERTION]: the sheet declares no padding for .cloudcanvas-ui-timeline-bar.is-short
 *
 * and, found in a browser (a link dragged from its handle did nothing, because a connector starts at the handle and took
 * the press), the last case:
 *
 *   ✖ timeline sheet: the handle a link is dragged from stands over the connectors, which start where it is
 *     AssertionError [ERR_ASSERTION]: the sheet declares no z-index for .cloudcanvas-ui-timeline-link
 *
 * and, found in the same look (the labels and the band were highlighted as text while a drag crossed them):
 *
 *   ✖ timeline and calendar sheets: a drag across them selects no text on its way
 *     AssertionError [ERR_ASSERTION]: the sheet declares no user-select for .cloudcanvas-ui-timeline-sheet.is-drag-active
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { COARSE, RULES, declared } from './ui-sheet.js';

const FINGER = 'var(--cc-control-min-coarse, 44px)';
const ENDS = ':is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start)';

test('timeline sheet: under a finger the chevron, the separator and the ends of a bar are 44px targets', () => {
  assert.deepEqual(['width', 'height'].map((property) => declared('.cloudcanvas-ui-timeline-group-toggle', property, COARSE)), [FINGER, FINGER]);
  assert.equal(declared('.cloudcanvas-ui-timeline-gutter-handle', 'width', COARSE), FINGER);
  // K4: the width is a whole target only for a bar of three of them; a shorter bar's ends reach a third of it (ui-timeline-short.test.js).
  assert.deepEqual(['width', 'height'].map((property) => declared(`${ENDS}::after`, property, COARSE)), [`min(${FINGER}, calc(var(--timeline-w) / 3))`, FINGER], 'a bar\'s ends reach out to a whole target');
  assert.equal(declared(`${ENDS}::after`, 'content', COARSE), '""');
});

test('timeline sheet: the gutter is narrower on a phone, and a bar of one day keeps room to be moved between its two handles', () => {
  assert.equal(declared('.cloudcanvas-ui-timeline', '--timeline-gutter'), 'var(--cc-ui-gutter, 10rem)');
  assert.equal(declared('.cloudcanvas-ui-timeline', '--timeline-gutter', '(max-width: 40rem)'), 'var(--cc-ui-gutter, 6rem)', 'the phone\'s rule is the later one: it is not overridden by the base');
  assert.equal(declared(ENDS, 'width'), 'min(10px, 30%)', 'a day is 20px at the week scale: the handles take a third of it at most');
});

test('timeline sheet: a short bar keeps no padding, so it is as narrow as its length', () => {
  assert.equal(declared('.cloudcanvas-ui-timeline-bar.is-short', 'padding'), '0');
});

test('timeline sheet: what a drag does is said by its cursor, where the host takes it', () => {
  assert.equal(declared('.cloudcanvas-ui-timeline-gutter-handle', 'cursor'), 'col-resize');
  assert.equal(declared(ENDS, 'cursor'), 'ew-resize');
  assert.equal(declared('.cloudcanvas-ui-timeline[data-can-create] .cloudcanvas-ui-timeline-track', 'cursor'), 'crosshair', 'across a row that can be drawn on');
  assert.equal(declared('.cloudcanvas-ui-timeline-bar[data-movable]', 'cursor'), 'grab');
});

test('timeline sheet: nothing in it moves, so there is no motion to turn off', () => {
  const moving = RULES.filter((rule) => rule.selector.includes('.cloudcanvas-ui-timeline'))
    .flatMap((rule) => Object.keys(rule.declarations).filter((name) => /^(transition|animation|scroll-behavior)/.test(name)));
  assert.deepEqual(moving, []);
});

test('timeline sheet: the handle a link is dragged from stands over the connectors, which start where it is', () => {
  assert.equal(declared('.cloudcanvas-ui-timeline-link', 'z-index'), declared('.cloudcanvas-ui-timeline-links', 'z-index'), 'at the connectors\' level, drawn after them');
});

test('timeline and calendar sheets: a drag across them selects no text on its way', () => {
  assert.equal(declared('.cloudcanvas-ui-timeline-sheet.is-drag-active', 'user-select'), 'none');
  assert.equal(declared('.cloudcanvas-ui-calendar-body.is-drag-active', 'user-select'), 'none');
});

/*
 * K8, written before the code and run on the sheet of `8f8720e`, whose band wrote its dates as its own text, centred on the row's middle
 * where a title drawn beside a short bar or a milestone is centred too. The tag's place was first a fixed offset from the band's foot;
 * Momentum hands its titles a line height of 1.5 (a title's box 16.5px tall at 11px) and the dates stood 2px into that box, so the tag
 * starts a step of its own type size below the row's middle (Momentum's demo, K8 look):
 *
 *   ✖ timeline sheet: a band's dates hang below it in a tag of their own, a line tall, clear of the title a bar draws beside itself, whatever line height the page hands down
 *     AssertionError [ERR_ASSERTION]: the sheet declares no position for .cloudcanvas-ui-timeline-draft-words
 *
 * and, with the tag in the sheet and the grid keeping no room under its last row:
 *
 *   ✖ timeline sheet: a band's dates hang below it in a tag of their own, a line tall, clear of the title a bar draws beside itself, whatever line height the page hands down
 *     AssertionError [ERR_ASSERTION]: the sheet declares no padding-bottom for .cloudcanvas-ui-timeline-grid
 */
test('timeline sheet: a band\'s dates hang below it in a tag of their own, a line tall, clear of the title a bar draws beside itself, whatever line height the page hands down', () => {
  const TAG = '.cloudcanvas-ui-timeline-draft-words';
  const px = (text) => Number.parseFloat(/(-?[\d.]+)px/.exec(text)[1]);
  const row = Number.parseFloat(declared('.cloudcanvas-ui-timeline-track', 'height')) * 16;
  assert.deepEqual(['position', 'line-height', 'white-space'].map((property) => declared(TAG, property)), ['absolute', '1', 'nowrap'], 'a line of its own height, never wrapped, placed by the band');
  assert.equal(px(declared(TAG, 'font-size')), px(declared('.cloudcanvas-ui-timeline-outside', 'font-size')), 'in the size of the title it keeps clear of');
  // The band is as far from the row's top as its bottom, so `50%` of it is the row's middle, where a title is centred (`top: 50%`).
  assert.equal(declared('.cloudcanvas-ui-timeline-outside', 'top'), '50%');
  const down = Number.parseFloat(/^calc\(50% \+ ([\d.]+)em\)$/.exec(declared(TAG, 'top'))?.[1]);
  assert.ok(down >= 0.8, `${down}em below the middle: a title's half height is 0.8em at the line height of 1.6 a page may hand down, and 0.7em at normal`);
  // The tag may end below the last row, where nothing holds it: the grid keeps that room, so drawing there grows no scroll.
  const room = px(declared('.cloudcanvas-ui-timeline-grid', 'padding-bottom'));
  for (const font of [11, 13]) {
    const spill = row / 2 + down * font + font - (row + 1);
    assert.ok(spill <= room, `${font}px type: the tag ends ${spill}px below the last row, and the grid keeps ${room}px for it`);
  }
  assert.equal(declared('.cloudcanvas-ui-timeline-draft', 'overflow'), 'visible', 'the band does not clip it');
});
