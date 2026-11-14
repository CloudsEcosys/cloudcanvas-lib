/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A search nothing matches left every row dimmed and said nothing. The tree
 * now says it in words, in a polite status of its own beside the rows, and
 * dims nothing for it; a search that finds something dims what it did not.
 *
 * Every case was written before the code and run on the tree as it stood at
 * `d242ea4`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTree } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

const ITEMS = Object.freeze([
  { id: 'work', label: 'Work' }, { id: 'plan', parentId: 'work', label: 'Plan' }, { id: 'home', label: 'Home' }
]);
const unmatched = (host) => [...host.querySelectorAll('.is-unmatched')].map((row) => row.getAttribute('data-ui-id'));
const statusOf = (host) => host.querySelector('.cloudcanvas-ui-tree-status');

/*
 * Seen to fail on the tree of `d242ea4`, which dimmed all three rows and said nothing:
 *
 *   ✖ tree search: a query nothing matches is said in a polite status and dims nothing; one that finds something dims the rest
 *     TypeError [Error]: Cannot read properties of null (reading 'textContent')
 *
 * and, found in Momentum's suite (`tests/unified-notes.test.js` reads its save status's Retry from "the first role=status of its host", which the
 * tree's own, drawn before it, was: `TypeError: Cannot read properties of undefined (reading 'click')`), with the status given
 * `aria-live="polite"` and still a `role="status"`:
 *
 *   ✖ tree search: a query nothing matches is said in a polite status and dims nothing; one that finds something dims the rest
 *     AssertionError [ERR_ASSERTION]: it is no role="status": a host that looks for the first status of its own page finds its own
 *     actual: false, expected: true
 */
test('tree search: a query nothing matches is said in a polite status and dims nothing; one that finds something dims the rest', (t) => {
  const host = mount(t);
  const tree = createTree(host);
  tree.update({ items: ITEMS, expanded: ['work'], query: 'zzz' });
  assert.equal(statusOf(host).textContent, 'Nothing matches “zzz”');
  assert.equal(statusOf(host).getAttribute('aria-live'), 'polite', 'a live region, which is there before it says anything');
  assert.equal(statusOf(host).closest('[role="tree"]'), null, 'beside the tree, not inside it: a tree holds only items');
  assert.ok(host.querySelector('[role="status"]') === null, 'it is no role="status": a host that looks for the first status of its own page finds its own');
  assert.deepEqual(unmatched(host), [], 'no row is faded for a search that found nothing');
  tree.update({ items: ITEMS, expanded: ['work'], query: 'plan' });
  assert.deepEqual(unmatched(host), ['work', 'home'], 'a search that found something fades the rest');
  assert.equal(statusOf(host).textContent, '', 'and says nothing');
  tree.update({ items: ITEMS, expanded: ['work'], query: '  ' });
  assert.deepEqual([unmatched(host), statusOf(host).textContent], [[], ''], 'a blank search is no search');
  tree.update({ items: ITEMS, expanded: [], query: 'plan' });
  assert.equal(statusOf(host).textContent, '', 'a match inside a closed row is a match: nothing is said to be missing');
  assert.deepEqual(unmatched(host), ['work', 'home']);
  tree.destroy();
  assert.equal(host.children.length, 0, 'the status goes with the tree');
});

/*
 * Seen to fail on the tree of `d242ea4`:
 *
 *   ✖ tree search: the words are the host's to change
 *     TypeError [Error]: Cannot read properties of null (reading 'textContent')
 */
test('tree search: the words are the host\'s to change', (t) => {
  const host = mount(t);
  const tree = createTree(host, { labels: { noMatches: 'Aucun résultat pour « {query} »' } });
  tree.update({ items: ITEMS, query: 'zzz' });
  assert.equal(statusOf(host).textContent, 'Aucun résultat pour « zzz »');
});
