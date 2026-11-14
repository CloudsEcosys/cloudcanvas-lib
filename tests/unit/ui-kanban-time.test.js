/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A card can carry a moment: its detail line is then a `<time datetime title>` that reads as the words the
 * host chose ("Tue", "09:40"), so the whole moment stays for assistive technology and a hover.
 *
 * Red by construction before the field existed: a card's `time` was ignored, so there was no `<time>`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createKanban } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

const column = (card) => ({ label: 'Plan', columns: [{ id: 'todo', label: 'To do', cards: [{ id: 'a', title: 'Call', ...card }] }] });

test('kanban card time: the detail is a time element with the moment behind the words', (t) => {
  const host = mount(t), kanban = createKanban(host, {});
  kanban.update(column({ time: { iso: '2026-10-09T09:40:00.000Z', text: 'Today', title: 'Friday, 9 October 2026, 09:40' } }));
  const detail = host.querySelector('.cloudcanvas-ui-kanban-detail'), time = detail.querySelector('time');
  assert.equal(detail.hidden, false);
  assert.deepEqual([time.getAttribute('datetime'), time.getAttribute('title'), time.textContent], ['2026-10-09T09:40:00.000Z', 'Friday, 9 October 2026, 09:40', 'Today']);
});

test('kanban card time: without one the detail is plain words, and an update swaps between the two', (t) => {
  const host = mount(t), kanban = createKanban(host, {});
  kanban.update(column({ detail: 'Dentist' }));
  const detail = () => host.querySelector('.cloudcanvas-ui-kanban-detail');
  assert.deepEqual([detail().textContent, detail().querySelector('time')], ['Dentist', null]);
  kanban.update(column({ time: { iso: '2026-10-10T08:00:00.000Z', text: 'Sat' } }));
  assert.deepEqual([detail().querySelector('time').textContent, detail().querySelector('time').getAttribute('title')], ['Sat', '2026-10-10T08:00:00.000Z']);
  kanban.update(column({ detail: 'Back to words' }));
  assert.deepEqual([detail().textContent, detail().querySelector('time')], ['Back to words', null]);
  kanban.update(column({}));
  assert.equal(detail().hidden, true);
});
