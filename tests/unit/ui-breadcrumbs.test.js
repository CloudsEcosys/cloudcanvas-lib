/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Breadcrumbs: a labelled landmark over an ordered trail, ancestors that open,
 * a current entry, a spoken mark for a trail cut short, a message for a trail
 * that could not be read, and crumbs that survive a redraw.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { SR_ONLY_CLASS, createBreadcrumbs } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

/** The text of every entry in the trail, in order. */
const texts = (host) => [...host.querySelectorAll('li')].map((node) => node.textContent);

test('breadcrumbs: a labelled trail, root first, ending in the current entry; a crumb opens its item', (t) => {
  const host = mount(t);
  const opened = [];
  const trail = createBreadcrumbs(host, { onOpen: (id, item) => opened.push([id, item]) });
  const nav = host.querySelector('nav');
  assert.equal(nav.hidden, true, 'nothing to show before the first model');
  const book = { id: 'book', label: 'Projects' };
  trail.update({ label: 'Folder path', items: [book, { id: 'f', label: 'Q4 <b>' }], current: 'Plan' });
  assert.equal(nav.hidden, false);
  assert.equal(nav.getAttribute('aria-label'), 'Folder path');
  assert.equal(nav.firstElementChild.localName, 'ol', 'an ordered list: the order is the meaning');
  assert.deepEqual(texts(host), ['Projects', 'Q4 <b>', 'Plan'], 'labels are text, never markup');
  assert.equal(host.querySelector('[aria-current="page"]').textContent, 'Plan');
  const crumbs = [...host.querySelectorAll('button')];
  assert.deepEqual(crumbs.map((node) => node.type), ['button', 'button']);
  crumbs[0].click();
  assert.equal(opened.length, 1);
  assert.equal(opened[0][0], 'book');
  assert.equal(opened[0][1], book, 'the item the model gave, not a copy');
  trail.destroy();
  crumbs[0].click();
  assert.equal(opened.length, 1, 'destroy ended the listener');
  assertSame(host.querySelector('nav'), null);
  assert.doesNotThrow(() => trail.update({ items: [book] }));
});

test('breadcrumbs: a trail cut short says so, an unreadable one shows its message, and none hides the landmark', (t) => {
  const host = mount(t);
  const trail = createBreadcrumbs(host, { onOpen() {} });
  const nav = host.querySelector('nav');
  trail.update({ items: [{ id: 'f', label: 'Inner' }], complete: false, current: 'Note', moreLabel: 'Higher levels are hidden' });
  assert.equal(nav.getAttribute('aria-label'), 'Breadcrumb', 'the default name');
  const more = host.querySelector('li');
  assert.equal(more.querySelector('[aria-hidden="true"]').textContent, '…');
  assert.equal(more.querySelector(`.${SR_ONLY_CLASS}`).textContent, 'Higher levels are hidden', 'the mark is spoken, not just drawn');
  assert.deepEqual(texts(host).slice(1), ['Inner', 'Note']);
  trail.update({ items: [{ id: 'f', label: 'Inner' }], current: 'Note' });
  assert.deepEqual(texts(host), ['Inner', 'Note'], 'a complete trail carries no mark');
  trail.update({ message: 'The path could not be read.', items: [{ id: 'f', label: 'Inner' }], current: 'Note' });
  assert.deepEqual(texts(host), ['The path could not be read.'], 'a message replaces the trail rather than sit beside a partial one');
  assert.equal(host.querySelectorAll('button').length, 0);
  assert.equal(nav.hidden, false);
  trail.update({ items: [], current: 'Top' });
  assert.equal(nav.hidden, true, 'the current entry alone is not a trail');
  assert.deepEqual(texts(host), []);
  assert.throws(() => trail.update({ items: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }] }), /duplicate breadcrumb id/);
  assert.throws(() => trail.update({ items: [{ id: 'a', label: ' ' }] }), /A breadcrumb needs a label: a/, 'a crumb with no words is a button with no name');
  trail.destroy();
});

test('breadcrumbs: a redraw reuses the crumb for an id, so the focus inside it survives; labels move in place', (t) => {
  const host = mount(t);
  const trail = createBreadcrumbs(host, { onOpen() {} });
  trail.update({ items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], current: 'C' });
  const crumb = host.querySelector('[data-ui-id="b"]');
  crumb.focus();
  trail.update({ items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'Renamed' }, { id: 'c', label: 'C' }], current: 'D' });
  assertSame(host.querySelector('[data-ui-id="b"]'), crumb, 'the same element, not a rebuilt one');
  assertSame(document.activeElement, crumb);
  assert.equal(crumb.textContent, 'Renamed');
  assert.deepEqual(texts(host), ['A', 'Renamed', 'C', 'D']);
  trail.destroy();
});

test('breadcrumbs: only a crumb opens - not the current entry, and not a host that carries an id of its own', (t) => {
  const host = mount(t);
  host.setAttribute('data-ui-id', 'card-7');
  const opened = [];
  const trail = createBreadcrumbs(host, { onOpen: (id) => opened.push(id) });
  trail.update({ items: [{ id: 'a', label: 'A' }], complete: false, current: 'B' });
  host.querySelector('[aria-current="page"]').click();
  host.querySelector('li').click();
  host.querySelector('nav').click();
  assert.deepEqual(opened, [], 'a click that lands outside a crumb is nobody\'s');
  host.querySelector('button').click();
  assert.deepEqual(opened, ['a']);
  trail.destroy();
});

test('breadcrumbs: without onOpen the ancestors are text, not buttons that open nothing', (t) => {
  const host = mount(t);
  const trail = createBreadcrumbs(host);
  trail.update({ items: [{ id: 'a', label: 'A' }], current: 'B' });
  assert.equal(host.querySelectorAll('button').length, 0);
  assert.deepEqual(texts(host), ['A', 'B']);
  trail.destroy();
});
