/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The active tab comes into view: when `activeId` changes, or the active tab's
 * layers do, the strip scrolls - itself, and nothing around it - by the least
 * that shows the tab and the layer right behind it. It eases there, unless
 * less motion was asked for or there is nowhere to ease from.
 *
 * happy-dom lays nothing out, so the strip is given the width it would have and
 * each part the span it would have along the strip's content; the strip's
 * `scrollTo` is the thing watched. That it happens on screen is
 * `tests/browser/ui-kit.test.js`.
 *
 * Written first, and seen to fail on a strip that never scrolled itself:
 *
 *   ✖ tabs: a new active tab is scrolled into view by the least that shows it, eased; one already in view moves nothing
 *     AssertionError [ERR_ASSERTION]: the first tab shown is shown at once: there is nowhere to ease from
 *     actual: []   expected: [ { left: 300, behavior: 'instant' } ]
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabs } from '../../ui/index.js';
import { _resetReducedMotionForTests } from '../../plugins/motion.js';
import { mount } from '../helpers/ui.js';

const STRIP_LEFT = 40;
const STRIP_WIDTH = 300;

const TRAIL = [{ id: 'home', label: 'Home' }, { id: 'work', label: 'Work' }, { id: 'q4', label: 'Q4' }];

/** Answer the reduced-motion query with "reduce" for the rest of the test. */
function reduceMotion(t) {
  const original = globalThis.matchMedia;
  globalThis.matchMedia = () => ({ matches: true });
  _resetReducedMotionForTests();
  t.after(() => { globalThis.matchMedia = original; _resetReducedMotionForTests(); });
}

/** What a part of a strip is called in a test's table of spans: `row:c`, `tab:c`, or `layer:c:work` for a layer of the tab `c`. */
function nameOf(node) {
  if (node.matches('[data-ui-layer]')) return `layer:${node.parentElement.getAttribute('data-ui-layers')}:${node.getAttribute('data-ui-layer')}`;
  if (node.matches('[role="tab"]')) return `tab:${node.getAttribute('data-ui-id')}`;
  return node.matches('.cloudcanvas-ui-tabs-item') ? `row:${node.querySelector('[role="tab"]').getAttribute('data-ui-id')}` : null;
}

/**
 * A strip `STRIP_WIDTH` wide at `STRIP_LEFT`, scrolled as far as its
 * `scrollTo` was last asked to go. `spans` says where each part stands along
 * the strip's content, `[start, end]` from the content's start; a part is
 * measured when the strip asks, so a part a redraw makes can be given its span
 * before that redraw. `width` is the strip's own, for a test to take away.
 */
function strip(t, items) {
  const host = mount(t);
  const tabs = createTabs(host);
  const seen = { scrolls: [], spans: {}, width: STRIP_WIDTH };
  tabs.update({ label: 'Scopes', activeId: null, items });
  const root = host.querySelector('.cloudcanvas-ui-tabs');
  let scrolled = 0;
  const boxOf = (left, width) => ({ left, top: 0, width, height: 31, right: left + width, bottom: 31, x: left, y: 0 });
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function measured() {
    if (this === root) return boxOf(STRIP_LEFT, seen.width);
    const [start, end] = seen.spans[nameOf(this)] ?? [0, 0];
    return boxOf(STRIP_LEFT + start - scrolled, end - start);
  };
  t.after(() => { Element.prototype.getBoundingClientRect = original; tabs.destroy(); });
  Object.defineProperty(root, 'clientWidth', { get: () => seen.width });
  Object.defineProperty(root, 'scrollLeft', { get: () => scrolled });
  root.scrollTo = (options) => { seen.scrolls.push(options); scrolled = options.left; };
  return Object.assign(seen, { host, tabs, draw: (activeId, next = items) => tabs.update({ label: 'Scopes', activeId, items: next }) });
}

const PLAIN = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, label: id.toUpperCase(), closable: true }));
/** Five rows of 120 side by side, the last 20 of each its close control: the strip shows two and a half. */
const ROWS = Object.fromEntries(PLAIN.flatMap((item, index) => [[`row:${item.id}`, [index * 120, index * 120 + 120]], [`tab:${item.id}`, [index * 120, index * 120 + 100]]]));

test('tabs: a new active tab is scrolled into view by the least that shows it, eased; one already in view moves nothing', (t) => {
  const view = strip(t, PLAIN);
  const { scrolls, draw } = view;
  view.spans = ROWS;
  draw('e');
  assert.deepEqual(scrolls, [{ left: 300, behavior: 'instant' }], 'the first tab shown is shown at once: there is nowhere to ease from');
  scrolls.length = 0;
  draw('e');
  draw('d');
  assert.deepEqual(scrolls, [], 'the same tab again, or one already whole in view, moves nothing');
  draw('b');
  assert.deepEqual(scrolls, [{ left: 120, behavior: 'smooth' }], 'a tab cut off at the near edge is brought to it: the least that shows it');
  draw('a');
  draw('d');
  assert.deepEqual(scrolls.slice(1), [{ left: 0, behavior: 'smooth' }, { left: 180, behavior: 'smooth' }], 'and one past the far edge is brought to that edge, its close control with it');
  scrolls.length = 0;
  draw(null);
  draw('d');
  assert.deepEqual(scrolls, [], 'nothing selected asks for nothing, and coming back to a tab in view moves nothing');
});

test('tabs: the active tab comes into view with the layer right behind it; when its layers change it is shown again', (t) => {
  const stacked = (layers, label = 'C') => [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label, layers, closable: true }];
  const view = strip(t, stacked(TRAIL.slice(0, 2)));
  const { scrolls, draw } = view;
  // C's row: two layers of 72, the tab, and its close control.
  view.spans = { 'row:a': [0, 200], 'row:b': [200, 400], 'row:c': [400, 664], 'layer:c:home': [400, 472], 'layer:c:work': [472, 544], 'tab:c': [544, 644] };
  draw('a');
  draw('c');
  assert.deepEqual(scrolls, [{ left: 364, behavior: 'smooth' }], 'to the far edge: the tab, its close control and its nearest layer are in view');
  // A scope is entered: a third layer stands behind the tab, and everything from it on is 72 further along.
  Object.assign(view.spans, { 'row:c': [400, 736], 'layer:c:q4': [544, 616], 'tab:c': [616, 716] });
  draw('c', stacked(TRAIL));
  assert.deepEqual(scrolls.at(-1), { left: 436, behavior: 'smooth' }, 'the same tab, moved by a layer it gained: shown again, with its new nearest layer');
  draw('c', stacked(TRAIL.map((layer) => ({ ...layer })), 'Renamed'));
  assert.equal(scrolls.length, 2, 'a redraw with the same layers is not a change: the strip stays where the user left it');
});

test('tabs: a tab too wide to show with its layer is kept whole and the layer gives way; too wide for the strip, it shows its start', (t) => {
  const view = strip(t, [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', layers: TRAIL.slice(0, 1) }, { id: 'c', label: 'C' }]);
  const { scrolls, draw } = view;
  view.spans = { 'row:a': [0, 200], 'row:b': [200, 552], 'layer:b:home': [200, 272], 'tab:b': [272, 552], 'row:c': [552, 952], 'tab:c': [552, 952] };
  draw('a');
  draw('b');
  assert.deepEqual(scrolls, [{ left: 252, behavior: 'smooth' }], 'the layer and the tab are 352 in a strip of 300: the tab is the one shown whole');
  draw('c');
  assert.deepEqual(scrolls.at(-1), { left: 552, behavior: 'smooth' }, 'and a tab wider than the strip shows its start, where its label is');
});

test('tabs: under reduced motion the strip does not ease', (t) => {
  reduceMotion(t);
  const view = strip(t, PLAIN);
  view.spans = ROWS;
  view.draw('a');
  view.draw('e');
  assert.deepEqual(view.scrolls, [{ left: 300, behavior: 'instant' }], 'it is simply there');
});

test('tabs: a strip with no width yet waits for one; bringing a tab into view scrolls the strip alone; a destroyed strip scrolls nothing', (t) => {
  const view = strip(t, PLAIN);
  const { host, tabs, scrolls, draw } = view;
  const into = [];
  const original = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function spy(...args) { into.push(args); };
  t.after(() => { Element.prototype.scrollIntoView = original; });
  view.spans = ROWS;
  view.width = 0;
  draw('e');
  assert.deepEqual(scrolls, [], 'a strip that is not laid out has nothing to scroll');
  view.width = STRIP_WIDTH;
  draw('e');
  assert.deepEqual(scrolls, [{ left: 300, behavior: 'instant' }], 'the same model on the first draw that finds it laid out: its tab is shown, at once');
  assert.deepEqual(into, [], 'scrollIntoView would move every scroller around the strip, the page with it: it is not used');
  tabs.destroy();
  draw('a');
  assert.deepEqual([scrolls.length, host.children.length], [1, 0]);
});
