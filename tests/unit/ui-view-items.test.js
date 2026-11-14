/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What the board views gained from use: a kanban column and a timeline group
 * that stand for an item - their heading takes focus and is pressed as a card
 * or a bar is - the label beside a timeline bar as part of that bar's item,
 * and `selectedId` in the kanban, the calendar and the timeline as the graph
 * has it: the item marked for the eye and for assistive technology, and focus
 * left where it was.
 *
 * Written first, and seen to fail on views that knew none of it:
 *
 *   ✖ kanban: a column that stands for an item has a heading that takes focus, is pressed as a card is, and carries the item's id
 *     AssertionError [ERR_ASSERTION]: the heading of a column that stands for an item is a button   'span' !== 'button'
 *   ✖ timeline: a group that carries an id is an item - its heading takes focus and is pressed as a bar is - and a name alone is a heading as before
 *     TypeError: Cannot read properties of null (reading 'click')
 *   ✖ timeline: a press on the label beside a bar is a press on that bar
 *     AssertionError [ERR_ASSERTION]: actual: []   expected: [ 'draft' ]
 *   ✖ selectedId: the kanban, the calendar and the timeline mark the item selected for the eye and the ear, and move no focus
 *     AssertionError [ERR_ASSERTION]: kanban: the selected item is marked   actual: []   expected: [ 'b' ]
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendar, createKanban, createTimeline } from '../../ui/index.js';
import { assertSame, key, mount } from '../helpers/ui.js';

const NOW = '2026-09-29T08:00';

const COLUMNS = [
  { id: 'none', label: 'No parent', cards: [{ id: 'plan', title: 'Plan the launch' }, { id: 'a', title: 'Call' }] },
  { id: 'col-plan', itemId: 'plan', label: 'Plan the launch', cards: [{ id: 'b', title: 'Book a room' }] }
];

function board(t, callbacks = {}) {
  const host = mount(t);
  const kanban = createKanban(host, callbacks);
  kanban.update({ label: 'Plan', columns: COLUMNS });
  const heading = (columnId) => host.querySelector(`[data-column-id="${columnId}"] .cloudcanvas-ui-kanban-heading`);
  const card = (id) => host.querySelector(`.cloudcanvas-ui-kanban-card[data-ui-id="${id}"]`);
  return { host, kanban, heading, card };
}

test('kanban: a column that stands for an item has a heading that takes focus, is pressed as a card is, and carries the item\'s id', (t) => {
  const opened = [];
  const moved = [];
  const { host, kanban, heading, card } = board(t, { onActivate: (id) => opened.push(id), onMove: (...move) => moved.push(move) });
  const open = heading('col-plan').firstElementChild;
  assert.equal(open.localName, 'button', 'the heading of a column that stands for an item is a button');
  assert.deepEqual([open.type, open.getAttribute('data-ui-id'), open.textContent, open.tabIndex], ['button', 'plan', 'Plan the launch', 0], 'a real control, a tab stop, carrying the item\'s id and not the column\'s');
  assert.deepEqual([heading('col-plan').localName, heading('col-plan').textContent], ['h3', 'Plan the launch1'], 'still the column\'s heading, and still its name');
  assert.equal(document.getElementById(host.querySelector('[data-column-id="col-plan"]').getAttribute('aria-labelledby')).textContent, 'Plan the launch1');
  open.click();
  card('plan').click();
  assert.deepEqual(opened, ['plan', 'plan'], 'a press on the heading reports the item, as a press on its card does');
  open.focus();
  for (const name of [' ', 'ArrowDown', 'ArrowRight']) assert.equal(key(open, name).defaultPrevented, false, `${name} on a heading is not the board's: a heading is not picked up or roved from`);
  assert.deepEqual([moved, host.querySelectorAll('.is-grabbed').length], [[], 0]);
  const plain = heading('none').firstElementChild;
  assert.deepEqual([plain.localName, plain.hasAttribute('data-ui-id'), plain.tabIndex], ['span', false, -1], 'a column that is only a column has the heading it always had');
  kanban.update({ label: 'Plan', columns: [{ ...COLUMNS[0], itemId: 'goal' }, { ...COLUMNS[1], itemId: undefined }] });
  assert.deepEqual([heading('none').firstElementChild.localName, heading('none').firstElementChild.getAttribute('data-ui-id'), heading('col-plan').firstElementChild.localName],
    ['button', 'goal', 'span'], 'a column becomes an item, and stops being one, with its model');
  assert.throws(() => kanban.update({ columns: [{ id: 'x', itemId: ' ', cards: [] }] }), /item id/i, 'an item id is a name, or it is not given');
});

test('kanban: a redraw leaves focus on a heading that held it, and takes none from a card or from outside', (t) => {
  const { host, kanban, heading, card } = board(t);
  const open = heading('col-plan').firstElementChild;
  open.focus();
  kanban.update({ label: 'Plan', columns: [COLUMNS[1], COLUMNS[0]] });
  assertSame(document.activeElement, open, 'the columns changed places: the heading is the same button, and still has focus');
  kanban.update({ label: 'Plan', columns: [COLUMNS[0], { ...COLUMNS[1], itemId: undefined }] });
  assertSame(document.activeElement, card('plan'), 'the heading stopped being a control: focus goes to the board\'s tab stop, not to the page');
  const outside = document.createElement('button');
  host.append(outside);
  outside.focus();
  kanban.update({ label: 'Plan', columns: COLUMNS });
  assertSame(document.activeElement, outside);
});

const ITEMS = [
  { id: 'draft', title: 'Draft', start: '2026-09-28', end: '2026-10-02', group: { id: 'book', label: 'The book' } },
  { id: 'edit', title: 'Edit', start: '2026-10-02', end: '2026-10-05', group: { id: 'book', label: 'The book' } },
  { id: 'ship', title: 'Ship', start: '2026-10-06', group: 'Release' },
  { id: 'loose', title: 'Loose end', start: '2026-10-07' }
];

function timeline(t, items = ITEMS) {
  const host = mount(t);
  const opened = [];
  const control = createTimeline(host, { onActivate: (id) => opened.push(id) });
  const draw = (next = items, more = {}) => control.update({ label: 'Plan', scale: 'week', now: NOW, locale: 'en-US', items: next, ...more });
  draw();
  const groups = () => [...host.querySelectorAll('.cloudcanvas-ui-timeline-group')];
  const bar = (id) => host.querySelector(`.cloudcanvas-ui-timeline-bar[data-ui-id="${id}"]`);
  return { host, control, opened, draw, groups, bar };
}

test('timeline: a group that carries an id is an item - its heading takes focus and is pressed as a bar is - and a name alone is a heading as before', (t) => {
  const { host, opened, draw, groups, bar } = timeline(t);
  assert.deepEqual(groups().map((node) => [node.textContent, node.getAttribute('role'), node.getAttribute('aria-level')]), [['The book', 'row', '1'], ['Release', 'row', '1']],
    'one heading for the two items of one group, and none for an item with no group');
  const [book, release] = groups();
  const open = book.querySelector('button');
  assert.deepEqual([open.type, open.getAttribute('data-ui-id'), open.textContent, open.tabIndex], ['button', 'book', 'The book', 0]);
  assert.equal(release.querySelector('button'), null, 'a group that is only a name has the heading it always had');
  open.click();
  bar('draft').click();
  assert.deepEqual(opened, ['book', 'draft'], 'a press on the heading reports the group\'s item, as a press on a bar reports the bar\'s');
  assert.deepEqual([...host.querySelectorAll('.cloudcanvas-ui-timeline-bar')].map((node) => node.getAttribute('tabindex')), ['0', '-1', '-1', '-1'], 'the bars keep their one tab stop');
  draw([ITEMS[0], { ...ITEMS[1], group: { id: 'film', label: 'The book' } }]);
  assert.deepEqual(groups().map((node) => node.querySelector('button').getAttribute('data-ui-id')), ['book', 'film'], 'two groups of one name are two groups when their ids differ');
  draw([{ ...ITEMS[0], group: { id: 'book' } }]);
  assert.equal(groups()[0].textContent, 'book', 'a group with no label is headed by its id');
  assert.throws(() => draw([{ ...ITEMS[0], group: { id: '', label: 'The book' } }]), /group/i, 'a group\'s id is a name, or it is not given');
});

test('timeline: a redraw leaves focus on a group heading that held it', (t) => {
  const { draw, groups, bar } = timeline(t);
  const before = groups()[0].querySelector('button');
  before.focus();
  draw(ITEMS.map((item) => (item.id === 'draft' ? { ...item, title: 'First draft' } : item)));
  const after = groups()[0].querySelector('button');
  assert.ok(after !== before, 'the heading was redrawn');
  assertSame(document.activeElement, after, 'and focus is on it still');
  draw(ITEMS.slice(2));
  assertSame(document.activeElement, bar('ship'), 'its group gone, focus goes to the timeline\'s tab stop, not to the page');
});

test('timeline: a press on the label beside a bar is a press on that bar', (t) => {
  const { host, opened } = timeline(t);
  const label = host.querySelector('[data-row-id="draft"] .cloudcanvas-ui-timeline-label');
  assert.deepEqual([label.textContent, label.getAttribute('aria-hidden')], ['Draft', 'true'], 'the label is the bar\'s name again, for the eye alone');
  label.click();
  assert.deepEqual(opened, ['draft']);
  host.querySelector('[data-row-id="draft"] .cloudcanvas-ui-timeline-track').click();
  assert.deepEqual(opened, ['draft'], 'the empty track beside a bar is not the bar');
});

/** The ids of the items `host` draws as selected, and of those it says so of to assistive technology. */
function selectedIn(host) {
  const ids = (selector) => [...host.querySelectorAll(selector)].map((node) => node.getAttribute('data-ui-id'));
  return { seen: ids('.is-selected'), said: ids('[aria-current="true"]') };
}

const EVENTS = [{ id: 'a', title: 'Call', start: '2026-09-29T09:00', end: '2026-09-29T10:00' }, { id: 'b', title: 'Trip', start: '2026-09-30', end: '2026-10-03', allDay: true }];

/** Each view that takes `selectedId`, as `draw(selectedId)` over two items `a` and `b`, with what a second face of `b` adds. */
const SELECTING = {
  kanban(host) {
    const control = createKanban(host);
    return (selectedId) => control.update({ selectedId, columns: [{ id: 'todo', cards: [{ id: 'a', title: 'Call' }, { id: 'b', title: 'Buy' }] }] });
  },
  calendar(host) {
    const control = createCalendar(host);
    return (selectedId) => control.update({ view: 'month', date: '2026-09-29', now: NOW, locale: 'en-US', selectedId, events: EVENTS });
  },
  timeline(host) {
    const control = createTimeline(host);
    return (selectedId) => control.update({ scale: 'week', now: NOW, locale: 'en-US', selectedId,
      items: [{ id: 'a', title: 'Draft', start: '2026-09-28', end: '2026-10-02' }, { id: 'b', title: 'Ship', start: '2026-10-06' }] });
  }
};

test('selectedId: the kanban, the calendar and the timeline mark the item selected for the eye and the ear, and move no focus', (t) => {
  for (const [name, create] of Object.entries(SELECTING)) {
    const host = mount(t);
    const outside = document.createElement('button');
    host.append(outside);
    outside.focus();
    const draw = create(host);
    draw(undefined);
    assert.deepEqual(selectedIn(host), { seen: [], said: [] }, `${name}: with no selection nothing is marked`);
    draw('b');
    const { seen, said } = selectedIn(host);
    assert.deepEqual([...new Set(seen)], ['b'], `${name}: the selected item is marked`);
    assert.deepEqual(said, seen, `${name}: and said, on the same elements`);
    assertSame(document.activeElement, outside, `${name}: focus is where it was`);
    draw('a');
    assert.deepEqual([...new Set(selectedIn(host).seen)], ['a'], `${name}: the mark follows the model`);
    draw('gone');
    assert.deepEqual(selectedIn(host), { seen: [], said: [] }, `${name}: an id the view does not draw marks nothing`);
    draw(null);
    assert.deepEqual(selectedIn(host), { seen: [], said: [] }, `${name}: and the selection is the model's to take away`);
  }
});

test('selectedId: a calendar event drawn on three days is marked on each; a heading that stands for the selected item is marked with its card or its bar', (t) => {
  const draw = SELECTING.calendar(mount(t));
  draw('b');
  assert.equal(document.querySelectorAll('.cloudcanvas-ui-calendar-event.is-selected[data-ui-id="b"]').length, 3);
  const { host, kanban, heading, card } = board(t);
  kanban.update({ label: 'Plan', selectedId: 'plan', columns: COLUMNS });
  assert.deepEqual([card('plan'), heading('col-plan').firstElementChild].map((node) => [node.classList.contains('is-selected'), node.getAttribute('aria-current')]), [[true, 'true'], [true, 'true']]);
  assert.equal(host.querySelectorAll('.is-selected').length, 2);
  const lined = timeline(t);
  lined.draw(ITEMS, { selectedId: 'book' });
  assert.deepEqual(selectedIn(lined.host), { seen: ['book'], said: ['book'] }, 'the group\'s heading, when the group is the selected item');
});

test('selectedId: where a view keeps one tab stop, it rests on the selected item until the keys have placed it', (t) => {
  const { kanban, card } = board(t);
  kanban.update({ label: 'Plan', selectedId: 'b', columns: COLUMNS });
  assert.deepEqual(['plan', 'a', 'b'].map((id) => card(id).getAttribute('tabindex')), ['0', '-1', '-1'], 'the board had its stop already: a selection does not take it');
  const fresh = mount(t);
  createKanban(fresh).update({ selectedId: 'b', columns: COLUMNS });
  assert.equal(fresh.querySelector('.cloudcanvas-ui-kanban-card[data-ui-id="b"]').getAttribute('tabindex'), '0', 'a board first drawn with a selection puts its stop there');
  const lined = mount(t);
  createTimeline(lined).update({ scale: 'week', now: NOW, locale: 'en-US', selectedId: 'ship', items: ITEMS });
  assert.equal(lined.querySelector('.cloudcanvas-ui-timeline-bar[data-ui-id="ship"]').getAttribute('tabindex'), '0', 'and so does a timeline');
});
