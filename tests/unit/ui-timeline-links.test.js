/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Dependencies. An item that `depends` on others has a connector drawn from
 * each dependency's end to its own start, with an arrowhead; a connector is a
 * picture (the bar it ends at says what it depends on, and the item's menu takes
 * the link away). A link is made the other way: dragged from the handle at a
 * bar's right edge to another bar, `onLink(fromId, toId)`. Nothing is applied.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `a304bfb` (the connector's case, `bdc16db`); each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSame, focusCalls, key, pointer, stubHitTest } from '../helpers/ui.js';
import { timelineOf } from './ui-timeline-fixture.js';

const LINKED = [
  { id: 'a', title: 'Brief', start: '2026-09-28', end: '2026-10-01', group: { id: 'book', label: 'The book' } },
  { id: 'b', title: 'Draft', start: '2026-10-02', end: '2026-10-06', group: { id: 'book', label: 'The book' }, depends: ['a', 'nowhere'] },
  { id: 'c', title: 'Ship', start: '2026-10-08', milestone: true, depends: ['b', 'b', 'c'] }
];
const NAMES = ['onActivate', 'onChange', 'onLink', 'onUnlink'];
const calls = (log, name) => log.filter(([called]) => called === name).map(([, ...args]) => args);
const connectors = (host) => [...host.querySelectorAll('.cloudcanvas-ui-timeline-connector')];
const pairs = (host) => connectors(host).map((node) => [node.getAttribute('data-from'), node.getAttribute('data-to')]);

/** Boxes as a browser would measure them: the links layer 160px in, and each bar where `at` puts it. */
function measure(t, at) {
  const original = HTMLElement.prototype.getBoundingClientRect;
  const svgOriginal = Element.prototype.getBoundingClientRect;
  const box = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });
  const read = function read() {
    const id = this.getAttribute?.('data-ui-id');
    if (this.classList?.contains('cloudcanvas-ui-timeline-links')) return box(160, 0, 4000, 300);
    return at[id] ? box(...at[id]) : original.call(this);
  };
  Element.prototype.getBoundingClientRect = read;
  HTMLElement.prototype.getBoundingClientRect = read;
  t.after(() => { Element.prototype.getBoundingClientRect = svgOriginal; HTMLElement.prototype.getBoundingClientRect = original; });
}

/*
 * Seen to fail on the timeline of `a304bfb`, which drew no dependency:
 *
 *   ✖ connectors: a dependency is an arrowed elbow from the dependency's end to the dependent's start; ends that are not drawn, repeats and itself draw nothing
 *     AssertionError [ERR_ASSERTION]: one connector for each dependency that is drawn at both ends
 *       actual: [],
 *       expected: [ [ 'a', 'b' ], [ 'b', 'c' ] ],
 */
test('connectors: a dependency is an arrowed elbow from the dependency\'s end to the dependent\'s start; ends that are not drawn, repeats and itself draw nothing', (t) => {
  measure(t, { a: [300, 40, 80, 24], b: [420, 76, 100, 24], c: [600, 112, 14, 14] });
  const { host, draw } = timelineOf(t, LINKED, NAMES);
  draw(LINKED);
  assert.deepEqual(pairs(host), [['a', 'b'], ['b', 'c']], 'one connector for each dependency that is drawn at both ends');
  const [first] = connectors(host);
  assert.equal(first.querySelector('.cloudcanvas-ui-timeline-connector-line').getAttribute('d'), 'M220 52 H240 V88 H260', 'out of the end of the first, down, into the start of the second');
  const marker = first.querySelector('.cloudcanvas-ui-timeline-connector-line').getAttribute('marker-end');
  assert.match(marker, /^url\(#.+\)$/, 'with an arrowhead at the dependent');
  assert.ok(host.querySelector(marker.slice(4, -1)), 'the marker it names is drawn');
  measure(t, { a: [300, 40, 80, 24], b: [330, 76, 100, 24] });
  draw(LINKED);
  assert.equal(connectors(host)[0].querySelector('.cloudcanvas-ui-timeline-connector-line').getAttribute('d'), 'M220 52 H232 V70 H158 V88 H170', 'a dependent that starts before its dependency ends is reached round the back, between the rows');
  draw(LINKED.map((item) => (item.id === 'a' ? { ...item, group: { id: 'book', label: 'The book', collapsed: true } } : item)));
  assert.deepEqual(pairs(host), [['b', 'c']], 'a bar that is not drawn has no connector');
});

/*
 * Found in a browser, where a link dragged from the handle did nothing: a connector starts exactly at the handle, and its
 * line, drawn over the rows, took the press. Run on `a304bfb`, which had no layer at all:
 *
 *   ✖ connectors: the layer is drawn before the rows, so a handle in the rows stands over a connector that starts at it
 *     TypeError [Error]: Cannot read properties of null (reading 'nextElementSibling')
 */
test('connectors: the layer is drawn before the rows, so a handle in the rows stands over a connector that starts at it', (t) => {
  const { host } = timelineOf(t, LINKED, NAMES);
  const layer = host.querySelector('.cloudcanvas-ui-timeline-links');
  assert.equal(layer.nextElementSibling.getAttribute('role'), 'treegrid', 'the rows come after it');
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ connectors: a bar's name says what it depends on
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *       actual: 'Draft, Oct 2 to Oct 6',
 *       expected: 'Draft, Oct 2 to Oct 6, depends on Brief',
 */
test('connectors: a bar\'s name says what it depends on', (t) => {
  const { bar } = timelineOf(t, LINKED, NAMES);
  assert.equal(bar('b').getAttribute('aria-label'), 'Draft, Oct 2 to Oct 5, depends on Brief');
  assert.equal(bar('a').getAttribute('aria-label'), 'Brief, Sep 28 to Sep 30', 'a bar that depends on nothing says nothing of it');
  assert.equal(bar('c').getAttribute('aria-label'), 'Ship, Oct 8, milestone, depends on Draft');
});

/*
 * Seen to fail on the timeline of `bdc16db`, whose connector said `role="button"` with a name, was a tab-less press target, and did a press and
 * Delete only for the pointer (Enter, Space and the menu key did nothing; in the browser its 12px hit stroke also took the press from a bar it
 * crossed - 160 px of two one-day bars in the demo's seed):
 *
 *   ✖ connectors: a connector is a picture - no role, name, tab stop, press or hit path of its own - however the host is called; a bar says what it depends on
 *     AssertionError [ERR_ASSERTION]: no role, no name, no tab stop: a picture for assistive technology
 *       actual: [ 'button', 'Draft depends on Brief', '-1' ],
 *       expected: [ null, null, null ]
 *
 * What a connector says is said by the bar it ends at (its name: "Draft, ..., depends on Brief") and removed by the item's own menu ("Unlink"):
 * a way to the same end for the pointer, the keyboard and a finger, rather than a second one for a mouse.
 */
test('connectors: a connector is a picture - no role, name, tab stop, press or hit path of its own - however the host is called; a bar says what it depends on', (t) => {
  measure(t, { a: [300, 40, 80, 24], b: [420, 76, 100, 24], c: [600, 112, 14, 14] });
  for (const names of [NAMES, ['onActivate']]) {
    const { host, bar, log, hint } = timelineOf(t, LINKED, names);
    const [first] = connectors(host);
    assert.deepEqual([first.getAttribute('role'), first.getAttribute('aria-label'), first.getAttribute('tabindex')], [null, null, null], 'no role, no name, no tab stop: a picture for assistive technology');
    assert.equal(first.closest('svg').getAttribute('aria-hidden'), 'true', 'the layer is hidden from it');
    assert.equal(host.querySelectorAll('.cloudcanvas-ui-timeline-connector-hit').length, 0, 'nothing of it takes a press');
    const before = hint();
    first.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    key(first, 'Delete');
    assert.equal(connectors(host).some((node) => node.classList.contains('is-selected')), false, 'a press selects nothing');
    assert.equal(hint(), before, 'and the hint does not promise a Delete');
    assert.deepEqual(calls(log, 'onUnlink'), [], 'and nothing is reported');
    assert.match(bar('b').getAttribute('aria-label'), /depends on Brief$/);
  }
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ link: a drag from the handle at a bar's right edge to another bar reports onLink; the target lights, a line follows the pointer, and nowhere else is nothing
 *     AssertionError [ERR_ASSERTION]: every bar has a handle to link from
 *       actual: 0,
 *       expected: 3,
 */
test('link: a drag from the handle at a bar\'s right edge to another bar reports onLink; the target lights, a line follows the pointer, and nowhere else is nothing', (t) => {
  measure(t, { a: [300, 40, 80, 24], b: [420, 76, 100, 24], c: [600, 112, 14, 14] });
  const { host, bar, log, root } = timelineOf(t, LINKED, NAMES);
  const handle = (id) => host.querySelector(`.cloudcanvas-ui-timeline-link[data-link-from="${id}"]`);
  assert.equal(host.querySelectorAll('.cloudcanvas-ui-timeline-link').length, 3, 'every bar has a handle to link from');
  assert.ok(root.hasAttribute('data-can-link'));
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  let under = sheet;
  stubHitTest(t, () => under);
  pointer(handle('a'), 'pointerdown', { clientX: 384, clientY: 52 });
  under = bar('c');
  pointer(sheet, 'pointermove', { clientX: 600, clientY: 119 });
  assert.ok(bar('c').classList.contains('is-drop-target'), 'the bar it would link to lights');
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-draft-link').getAttribute('d'), 'M220 52 L440 119', 'a line runs from the handle to the pointer');
  pointer(sheet, 'pointerup', { clientX: 600, clientY: 119 });
  assert.deepEqual(calls(log, 'onLink'), [['a', 'c']]);
  assert.deepEqual([host.querySelector('.cloudcanvas-ui-timeline-draft-link'), host.querySelector('.is-drop-target')], [null, null], 'the line and the light go with the drag');
  pointer(handle('b'), 'pointerdown', { clientX: 524, clientY: 88 });
  under = bar('b');
  pointer(sheet, 'pointermove', { clientX: 470, clientY: 88 });
  assert.equal(bar('b').classList.contains('is-drop-target'), false, 'a bar is not its own target');
  pointer(sheet, 'pointerup', { clientX: 470, clientY: 88 });
  pointer(handle('b'), 'pointerdown', { clientX: 524, clientY: 88 });
  under = host.querySelector('[data-row-id="a"] .cloudcanvas-ui-timeline-label');
  pointer(sheet, 'pointermove', { clientX: 100, clientY: 52 });
  pointer(sheet, 'pointerup', { clientX: 100, clientY: 52 });
  assert.deepEqual(calls(log, 'onLink').at(-1), ['b', 'a'], 'the title beside a bar is the bar');
  pointer(handle('a'), 'pointerdown', { clientX: 384, clientY: 52 });
  under = bar('b');
  pointer(sheet, 'pointermove', { clientX: 450, clientY: 88 });
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(calls(log, 'onLink').length, 2, 'Escape reports nothing');
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-draft-link'), null);
  under = sheet;
  pointer(handle('a'), 'pointerdown', { clientX: 384, clientY: 52 });
  pointer(sheet, 'pointermove', { clientX: 700, clientY: 200 });
  pointer(sheet, 'pointerup', { clientX: 700, clientY: 200 });
  assert.equal(calls(log, 'onLink').length, 2, 'let go on nothing, it is nothing');
  assert.equal(timelineOf(t, LINKED, ['onActivate']).host.querySelectorAll('.cloudcanvas-ui-timeline-link').length, 0, 'a host that took no onLink draws no handle');
});

/*
 * Found in a browser: a press on the link handle, which no key can reach, moved the focus to the nearest thing that can hold
 * it (the host's pane), so after a link was made Ctrl/Cmd-Z, heard on the sheet, was heard by nobody. The test gives the focus away
 * as the browser does, on the press. Seen to fail on the timeline of `98d52d1`:
 *
 *   ✖ link: a drag from the handle, made, cancelled or let go on nothing, gives the focus back to the bar it began on, without scrolling
 *     AssertionError [ERR_ASSERTION]: made: the bar it was dragged from: expected <button[data-ui-id=a].cloudcanvas-ui-timeline-bar>, got <button>
 */
test('link: a drag from the handle, made, cancelled or let go on nothing, gives the focus back to the bar it began on, without scrolling', (t) => {
  measure(t, { a: [300, 40, 80, 24], b: [420, 76, 100, 24], c: [600, 112, 14, 14] });
  const { host, bar } = timelineOf(t, LINKED, NAMES);
  const outside = document.createElement('button');
  host.append(outside);
  const handle = (id) => host.querySelector(`.cloudcanvas-ui-timeline-link[data-link-from="${id}"]`);
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  let under = sheet;
  stubHitTest(t, () => under);
  const calls = focusCalls(t);
  const press = (id, at) => { pointer(handle(id), 'pointerdown', at); outside.focus(); };
  press('a', { clientX: 384, clientY: 52 });
  under = bar('c');
  pointer(sheet, 'pointermove', { clientX: 600, clientY: 119 });
  pointer(sheet, 'pointerup', { clientX: 600, clientY: 119 });
  assertSame(document.activeElement, bar('a'), 'made: the bar it was dragged from');
  assert.deepEqual(calls.at(-1), { preventScroll: true }, 'and the sheet is not scrolled to it');
  press('b', { clientX: 524, clientY: 88 });
  under = bar('a');
  pointer(sheet, 'pointermove', { clientX: 330, clientY: 52 });
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assertSame(document.activeElement, bar('b'), 'cancelled with Escape');
  under = sheet;
  press('a', { clientX: 384, clientY: 52 });
  pointer(sheet, 'pointermove', { clientX: 700, clientY: 200 });
  pointer(sheet, 'pointerup', { clientX: 700, clientY: 200 });
  assertSame(document.activeElement, bar('a'), 'let go on nothing');
});
