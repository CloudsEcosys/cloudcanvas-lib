/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Where the link handle's reach lies under a finger: past the bar's right end,
 * never over the bar, and for a bar narrower than two targets only while its
 * item is selected or focused. The browser suite (`tests/browser/ui-timeline.test.js`)
 * measures what a finger finds; this holds the sheet and the markup to their word.
 *
 * Each case was run on the timeline as it stood at `fc5c778`; its comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_CSS } from '../../ui/index.js';
import { COARSE, declared } from './ui-sheet.js';
import { ITEMS, timelineOf } from './ui-timeline-fixture.js';

const LINK = '.cloudcanvas-ui-timeline-link';
const links = (host) => Object.fromEntries([...host.querySelectorAll(LINK)].map((node) => [node.getAttribute('data-link-from'), node.classList.contains('is-narrow')]));

/*
 * Seen to fail on the timeline of `fc5c778`:
 *
 *   ✖ link reach: a bar narrower than two targets (88px) marks its handle narrow, a wider one does not
 *     AssertionError [ERR_ASSERTION]: day scale: four days is 256px, half an hour is drawn 20px, a milestone has no width
 *       + actual - expected      { draft: false,
 *       +   loose: false,  quick: false,  ship: false
 *       -   loose: true,   quick: true,   ship: true      }
 */
test('link reach: a bar narrower than two targets (88px) marks its handle narrow, a wider one does not', (t) => {
  const { host, draw } = timelineOf(t, ITEMS, ['onActivate', 'onLink']);
  draw(ITEMS, { scale: 'day' });
  assert.deepEqual(links(host), { draft: false, quick: true, ship: true, loose: true }, 'day scale: four days is 256px, half an hour is drawn 20px, a milestone has no width');
  draw(ITEMS, { scale: 'week' });
  assert.equal(links(host).draft, true, 'week scale: four days is 80px, narrower than two targets');
});

/*
 * Seen to fail on the sheet of `fc5c778`:
 *
 *   ✖ link reach: under a finger the reach starts at the bar's right edge, not at the dot's middle; a narrow bar's is there only while it is selected or focused
 *     AssertionError [ERR_ASSERTION]: the dot is 6px past the bar: its reach starts at the bar
 *       '50%' !== '-6px'
 */
test('link reach: under a finger the reach starts at the bar\'s right edge, not at the dot\'s middle; a narrow bar\'s is there only while it is selected or focused', () => {
  const after = `${LINK}::after`;
  assert.equal(declared(after, 'left', COARSE), '-6px', 'the dot is 6px past the bar: its reach starts at the bar');
  assert.equal(declared(after, 'translate', COARSE), '0 -50%', 'and runs on from there, centred on the dot\'s height');
  assert.equal(declared(`${LINK}.is-narrow`, 'pointer-events', COARSE), 'none');
  assert.equal(declared(`.cloudcanvas-ui-timeline-row:is(.is-current, :focus-within) ${LINK}.is-narrow`, 'pointer-events', COARSE), 'auto');
});

/*
 * Seen to fail on the sheet of `fc5c778` (Chromium measured a row 37px tall under a finger, and the link handle's reach 40.5px):
 *
 *   ✖ link reach: a row and its track are one target tall under a finger, by the rule that comes last in the sheet
 *     AssertionError [ERR_ASSERTION]: the finger's rule for .cloudcanvas-ui-timeline-row's min-height comes after the plain one
 *
 * The finger's rule stood in the views' sheet, ahead of the timeline's own plain rule of equal weight: the plain rule won.
 */
test('link reach: a row and its track are one target tall under a finger, by the rule that comes last in the sheet', () => {
  for (const [part, property, plain] of [['.cloudcanvas-ui-timeline-row', 'min-height', '2.25rem'], ['.cloudcanvas-ui-timeline-track', 'height', '2.25rem']]) {
    assert.equal(declared(part, property), plain);
    assert.equal(declared(part, property, COARSE), 'var(--cc-control-min-coarse, 44px)');
    const finger = UI_CSS.lastIndexOf(`${part} { ${property}: var(--cc-control-min-coarse, 44px); }`);
    const base = UI_CSS.indexOf(`${property}: ${plain}`, UI_CSS.indexOf(`${part} {`));
    assert.ok(finger > base && base > 0, `the finger's rule for ${part}'s ${property} comes after the plain one`);
  }
});
