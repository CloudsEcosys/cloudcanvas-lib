/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline's item menu was reached only by a right-click, Shift+F10 or a
 * long press, and nothing said so. The selected bar now has a "more" button
 * beside it that asks for that same menu, and every hint line under the
 * toolbar says where the rest is.
 *
 * Every case was written before the code and run on the timeline as it stood at
 * `d242ea4`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSame, key, stubBox } from '../helpers/ui.js';
import { ITEMS, timelineOf } from './ui-timeline-fixture.js';

const MORE = '.cloudcanvas-ui-item-more';
const moreIn = (host) => [...host.querySelectorAll(MORE)];
const calls = (log, name) => log.filter(([called]) => called === name);
const NAMES = ['onActivate', 'onChange', 'onMenu'];

/*
 * Seen to fail on the timeline of `d242ea4`, which drew no such button:
 *
 *   ✖ timeline more: the selected bar has a "more" button named for it, in its own row, which asks for the menu a right-click asks for
 *     TypeError [Error]: Cannot read properties of undefined (reading 'parentElement')
 *
 * and, found in a browser look (the button stood 950px to the left of the sheet: the geometry its sheet places it by is the bar's, and
 * it had none), with the button given none:
 *
 *   ✖ timeline more: the selected bar has a "more" button named for it, in its own row, which asks for the menu a right-click asks for
 *     AssertionError [ERR_ASSERTION]: --timeline-x: it stands where the bar ends, by the same geometry
 *     actual: '', expected: '227.5px'
 */
test('timeline more: the selected bar has a "more" button named for it, in its own row, which asks for the menu a right-click asks for', (t) => {
  const { host, draw, bar, log } = timelineOf(t, ITEMS, NAMES);
  assert.deepEqual(moreIn(host), [], 'nothing selected, nothing to ask about');
  draw(ITEMS, { selectedId: 'quick' });
  const [more, ...others] = moreIn(host);
  assert.equal(others.length, 0);
  assertSame(more.parentElement, bar('quick').parentElement, 'in the track of the bar\'s row');
  assert.ok(bar('quick').compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING, 'after the bar: the next stop for Tab');
  assert.notEqual(more.getAttribute('tabindex'), '-1');
  for (const name of ['--timeline-x', '--timeline-w']) {
    assert.ok(bar('quick').style.getPropertyValue(name) !== '', `the bar has ${name}`);
    assert.equal(more.style.getPropertyValue(name), bar('quick').style.getPropertyValue(name), `${name}: it stands where the bar ends, by the same geometry`);
  }
  assert.equal(more.getAttribute('aria-label'), 'More actions for Call the printer');
  assert.deepEqual([more.localName, more.type], ['button', 'button']);
  assert.ok(more.querySelector('svg[data-icon="more"]'));
  stubBox(more, { left: 500, top: 80, width: 24, height: 24 });
  more.click();
  assert.deepEqual(calls(log, 'onMenu'), [['onMenu', 'quick', { x: 500, y: 104 }]], 'under the button');
  assert.deepEqual(calls(log, 'onActivate'), [], 'it opens nothing');
  assert.deepEqual([key(more, 'Enter').defaultPrevented, key(more, ' ').defaultPrevented], [false, false], 'Enter and Space are the button\'s own');
  assert.deepEqual(calls(log, 'onActivate'), [], 'and are not the bar\'s');
  bar('draft').click();
  assert.deepEqual(moreIn(host).map((one) => one.parentElement === bar('draft').parentElement), [true], 'a press on another bar moves it there');
  draw(ITEMS, { selectedId: 'ship' });
  assert.ok(moreIn(host)[0].classList.contains('is-point'), 'a milestone\'s button is told, so the sheet can place it by the diamond');
});

/*
 * Seen to fail on the timeline of `d242ea4`:
 *
 *   ✖ timeline more: a host that takes no menu gets no button, and its hint does not promise one
 *     AssertionError [ERR_ASSERTION]: a host with a menu gets the button
 *     0 !== 1
 */
test('timeline more: a host that takes no menu gets no button, and its hint does not promise one', (t) => {
  const withMenu = timelineOf(t, ITEMS, NAMES, { selectedId: 'draft' });
  assert.equal(moreIn(withMenu.host).length, 1, 'a host with a menu gets the button');
  const { host, hint } = timelineOf(t, ITEMS, ['onActivate', 'onChange'], { selectedId: 'draft' });
  assert.equal(moreIn(host).length, 0);
  assert.doesNotMatch(hint(), /right-click/);
});

/*
 * Seen to fail on the timeline of `d242ea4`:
 *
 *   ✖ timeline more: not drawn while a bar is in hand, back when it is put down, and focus on it survives a redraw
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     0 !== 1
 */
test('timeline more: not drawn while a bar is in hand, back when it is put down, and focus on it survives a redraw', (t) => {
  const { host, draw, bar, root } = timelineOf(t, ITEMS, NAMES, { selectedId: 'draft' });
  const shown = () => moreIn(host).filter((one) => !one.hidden).length;
  assert.equal(shown(), 1);
  bar('draft').focus();
  key(bar('draft'), ' ');
  assert.equal(shown(), 0, 'the button is out of the way of a bar in hand');
  key(document.activeElement, 'Escape');
  assert.equal(shown(), 1);
  moreIn(host)[0].focus();
  draw(ITEMS, { selectedId: 'draft' });
  assert.ok(document.activeElement.matches(MORE), 'the host drew again, and the reader is where they were');
  assert.ok(root.contains(document.activeElement));
});

/*
 * Seen to fail on the timeline of `d242ea4`, whose lines said nothing of the menu and whose heading said "+ adds one here":
 *
 *   ✖ timeline more: every hint line says where the menu is, and + or Insert adds, for what the host can do
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     + actual - expected
 *     + 'Select a bar to see what it can do · drag on a row to add one · N draws a span'
 *     - 'Select a bar to see what it can do · drag on a row to add one · Shift+F10 or right-click for more · N draws a span'
 */
test('timeline more: every hint line says where the menu is, and + or Insert adds, for what the host can do', (t) => {
  const { draw, hint } = timelineOf(t, ITEMS, ['onActivate', 'onMenu', 'onAdd', 'onCreate']);
  assert.equal(hint(), 'Select a bar to see what it can do · drag on a row to add one · Shift+F10 or right-click for more · N draws a span');
  draw(ITEMS, { selectedId: 'draft' });
  assert.equal(hint(), 'Enter opens · Shift+F10 or right-click for more · N draws a span');
  draw(ITEMS, { selectedId: 'book' });
  assert.equal(hint(), 'Enter opens · + or Insert to add one here · Shift+F10 or right-click for more · N draws a span');
  const bare = timelineOf(t, ITEMS, ['onActivate'], { selectedId: 'draft' });
  assert.equal(bare.hint(), 'Enter opens');
});
