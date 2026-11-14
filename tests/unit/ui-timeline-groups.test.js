/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Folding a group. A group that stands for an item has a chevron on its
 * heading: pressed, or answered with Space (Left folds, Right opens) on the
 * heading's own button, it reports `onToggleGroup(groupId, collapsed)`. Nothing
 * is applied: the rows of a group are drawn or not as the model's
 * `group.collapsed` says, and a folded heading says how many it holds.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `a304bfb`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { key } from '../helpers/ui.js';
import { ITEMS, timelineOf } from './ui-timeline-fixture.js';

const CALLBACKS = ['onActivate', 'onChange', 'onToggleGroup'];
const folded = (items, collapsed) => items.map((item) => (item.group?.id === 'book' ? { ...item, group: { ...item.group, collapsed } } : item));
const toggles = (log) => log.filter(([name]) => name === 'onToggleGroup').map(([, ...args]) => args);
const rows = (host) => [...host.querySelectorAll('.cloudcanvas-ui-timeline-row')].map((row) => row.getAttribute('data-row-id'));

/*
 * Seen to fail on the timeline of `a304bfb`, whose headings could not be folded:
 *
 *   ✖ fold: a heading that stands for an item has a chevron that reports the fold it asks for and applies nothing
 *     AssertionError [ERR_ASSERTION]: a chevron on the heading
 *       actual: null,
 *       expected: true,
 */
test('fold: a heading that stands for an item has a chevron that reports the fold it asks for and applies nothing', (t) => {
  const { host, root, log } = timelineOf(t, undefined, CALLBACKS);
  const heading = host.querySelector('.cloudcanvas-ui-timeline-group');
  const chevron = heading.querySelector('.cloudcanvas-ui-timeline-group-toggle');
  assert.ok(chevron, 'a chevron on the heading');
  assert.deepEqual([chevron.getAttribute('aria-expanded'), chevron.getAttribute('aria-label'), chevron.getAttribute('tabindex'), heading.getAttribute('aria-expanded')], ['true', 'Collapse The book', '-1', 'true']);
  assert.ok(root.hasAttribute('data-can-fold'));
  chevron.click();
  assert.deepEqual(toggles(log), [['book', true]], 'a press asks to fold it');
  assert.equal(host.querySelectorAll('.cloudcanvas-ui-timeline-row').length, 4, 'and nothing is applied until the model says so');
});

/*
 * Seen to fail on the timeline of `a304bfb`, which drew every row of every group:
 *
 *   ✖ fold: the model's collapsed decides which rows are drawn; a folded heading says how many it holds and asks to open
 *     AssertionError [ERR_ASSERTION]: a folded group draws no rows
 *       actual: [ 'draft', 'quick', 'ship', 'loose' ],
 *       expected: [ 'ship', 'loose' ],
 */
test('fold: the model\'s collapsed decides which rows are drawn; a folded heading says how many it holds and asks to open', (t) => {
  const { host, draw, log } = timelineOf(t, undefined, CALLBACKS);
  draw(folded(ITEMS, true));
  assert.deepEqual(rows(host), ['ship', 'loose'], 'a folded group draws no rows');
  const heading = host.querySelector('.cloudcanvas-ui-timeline-group');
  const chevron = heading.querySelector('.cloudcanvas-ui-timeline-group-toggle');
  assert.deepEqual([chevron.getAttribute('aria-expanded'), chevron.getAttribute('aria-label'), heading.getAttribute('aria-expanded')], ['false', 'Expand The book', 'false']);
  assert.equal(heading.querySelector('.cloudcanvas-ui-timeline-group-count').textContent, '2', 'and how many it holds');
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-bar[data-ui-id="draft"]'), null);
  chevron.click();
  assert.deepEqual(toggles(log), [['book', false]], 'a press asks to open it');
  assert.deepEqual(rows(host), ['ship', 'loose'], 'and nothing is applied until the model says so');
  draw(folded(ITEMS, false));
  assert.deepEqual(rows(host), ['draft', 'quick', 'ship', 'loose']);
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-group-count'), null, 'an open heading carries no count');
  host.querySelector('.cloudcanvas-ui-timeline-group-toggle').click();
  assert.deepEqual(toggles(log).at(-1), ['book', true], 'and asks to fold an open one');
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ fold: on the heading's own button Space folds, Left folds an open group and Right opens a folded one; a name alone has nothing to fold
 *     AssertionError [ERR_ASSERTION]: Space asks to fold an open group
 *       actual: [],
 *       expected: [ [ 'book', true ] ],
 */
test('fold: on the heading\'s own button Space folds, Left folds an open group and Right opens a folded one; a name alone has nothing to fold', (t) => {
  const { host, draw, log } = timelineOf(t, undefined, CALLBACKS);
  const label = () => host.querySelector('.cloudcanvas-ui-timeline-group-label');
  key(label(), ' ');
  assert.deepEqual(toggles(log), [['book', true]], 'Space asks to fold an open group');
  key(label(), 'ArrowRight');
  assert.equal(toggles(log).length, 1, 'Right on an open group is nothing to do');
  key(label(), 'ArrowLeft');
  assert.deepEqual(toggles(log).at(-1), ['book', true], 'Left folds it');
  draw(folded(ITEMS, true));
  key(label(), 'ArrowLeft');
  assert.equal(toggles(log).length, 2, 'Left on a folded group is nothing to do');
  key(label(), 'ArrowRight');
  assert.deepEqual(toggles(log).at(-1), ['book', false], 'Right opens it');
  key(label(), ' ');
  assert.deepEqual(toggles(log).at(-1), ['book', false], 'and Space asks to open a folded one');
  const release = [...host.querySelectorAll('.cloudcanvas-ui-timeline-group')].at(-1);
  assert.deepEqual([release.textContent, release.querySelector('button')], ['Release', null], 'a group that is only a name has no chevron and no button');
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ fold: a host that took no onToggleGroup gets the headings it always had; a fold the model asks for still hides the rows
 *     AssertionError [ERR_ASSERTION]: the model decides
 *       actual: [ 'draft', 'quick', 'ship', 'loose' ],
 *       expected: [ 'ship', 'loose' ],
 */
test('fold: a host that took no onToggleGroup gets the headings it always had; a fold the model asks for still hides the rows', (t) => {
  const { host, draw, root } = timelineOf(t, undefined, ['onActivate']);
  assert.equal(host.querySelectorAll('.cloudcanvas-ui-timeline-group-toggle').length, 0, 'no chevron where nothing can be asked');
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-group').hasAttribute('aria-expanded'), false);
  assert.equal(root.hasAttribute('data-can-fold'), false);
  draw(folded(ITEMS, true));
  assert.deepEqual(rows(host), ['ship', 'loose'], 'the model decides');
});
