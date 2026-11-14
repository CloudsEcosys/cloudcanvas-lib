/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline's bars as a reader meets them: every bar and milestone draws
 * its title, a bar shows its status and progress, the column of titles is the
 * reader's to size, the hint under the toolbar says what the selection can do,
 * and the rows are a treegrid.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `a304bfb`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { key, pointer, stubBox } from '../helpers/ui.js';
import { ITEMS, timelineOf } from './ui-timeline-fixture.js';

/*
 * Seen to fail on the timeline of `a304bfb`, which drew a title inside a bar however short it was, and none beside a milestone:
 *
 *   ✖ titles: a bar wide enough holds its title; a milestone and a bar too short draw it beside them; the full title is the tooltip and the name
 *     AssertionError [ERR_ASSERTION]: half an hour is no room: its title is beside it
 *       actual: [ 'Call the printer', undefined ],
 *       expected: [ null, 'Call the printer' ],
 */
test('titles: a bar wide enough holds its title; a milestone and a bar too short draw it beside them; the full title is the tooltip and the name', (t) => {
  const { host, bar } = timelineOf(t);
  const title = (id) => bar(id).querySelector('.cloudcanvas-ui-timeline-bar-title')?.textContent ?? null;
  const beside = (id) => host.querySelector(`.cloudcanvas-ui-timeline-outside[data-ui-for="${id}"]`);
  assert.equal(title('draft'), ITEMS[0].title, 'a bar four days long holds its title, to be cut by an ellipsis in the sheet');
  assert.equal(beside('draft'), null, 'and says it once');
  assert.deepEqual([title('quick'), beside('quick')?.textContent], [null, 'Call the printer'], 'half an hour is no room: its title is beside it');
  assert.equal(beside('ship')?.textContent, 'Ship it', 'a milestone\'s title stands beside its diamond');
  assert.equal(beside('loose')?.textContent, 'Loose end', 'and so does one with no end');
  assert.ok(beside('ship').classList.contains('is-point'));
  assert.deepEqual([bar('quick'), bar('draft'), bar('ship')].map((node) => node.classList.contains('is-short')), [true, false, false], 'a short bar has no room to pad: it is drawn as narrow as its length');
  assert.equal(beside('ship').getAttribute('aria-hidden'), 'true', 'the name is the bar\'s: the title beside it is for the eye');
  for (const id of ['draft', 'quick', 'ship']) {
    assert.equal(bar(id).getAttribute('title'), bar(id).getAttribute('aria-label'), `${id}: the tooltip is the name`);
    assert.ok(bar(id).getAttribute('aria-label').startsWith(ITEMS.find((item) => item.id === id).title), `${id}: and leads with the full title`);
  }
  assert.equal(host.querySelector('[data-row-id="draft"] .cloudcanvas-ui-timeline-label').getAttribute('title'), ITEMS[0].title, 'a title cut in the gutter is whole in its tooltip');
});

/*
 * Seen to fail on the timeline of `a304bfb`, which knew no status:
 *
 *   ✖ status and progress: a status is said in the name and drawn as its tone; progress is the share of the bar that is done
 *     AssertionError [ERR_ASSERTION]: the status is in the name
 *       actual: 'Draft the whole spring campaign brief and circulate it, Sep 28 to Oct 2, 40% done',
 *       expected: /, Doing, 40% done$/
 */
test('status and progress: a status is said in the name and drawn as its tone; progress is the share of the bar that is done', (t) => {
  const { bar } = timelineOf(t);
  assert.match(bar('draft').getAttribute('aria-label'), /, Doing, 40% done$/, 'the status is in the name');
  assert.deepEqual([bar('draft').getAttribute('data-status-tone'), bar('draft').style.getPropertyValue('--timeline-progress')], ['warning', '0.4']);
  assert.match(bar('quick').getAttribute('aria-label'), /, Next$/);
  assert.equal(bar('quick').getAttribute('data-status-tone'), null, 'words alone carry no tone');
  assert.equal(bar('ship').getAttribute('data-status-tone'), null);
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ gutter: a separator on the corner is moved by the arrows and reports its width; the model's width restores it and a width it already knew does not undo the reader's
 *     AssertionError [ERR_ASSERTION]: the corner holds the gutter's separator
 *       actual: null,
 *       expected: true,
 */
test('gutter: a separator on the corner is moved by the arrows and reports its width; the model\'s width restores it and a width it already knew does not undo the reader\'s', (t) => {
  const { host, root, draw, log } = timelineOf(t);
  const handle = () => host.querySelector('.cloudcanvas-ui-timeline-corner [role="separator"]');
  assert.ok(handle(), 'the corner holds the gutter\'s separator');
  assert.deepEqual([handle().getAttribute('aria-orientation'), handle().getAttribute('tabindex'), handle().getAttribute('aria-label')], ['vertical', '0', 'Resize the title column']);
  stubBox(handle().parentElement, { width: 160, height: 28 });
  key(handle(), 'ArrowRight');
  assert.equal(root.style.getPropertyValue('--timeline-gutter'), '176px');
  key(handle(), 'ArrowLeft', { shiftKey: true });
  assert.equal(root.style.getPropertyValue('--timeline-gutter'), '112px', 'Shift steps by four');
  assert.deepEqual(log.filter(([name]) => name === 'onGutter'), [['onGutter', 176], ['onGutter', 112]]);
  assert.equal(handle().getAttribute('aria-valuenow'), '112');
  key(handle(), 'Home');
  assert.equal(root.style.getPropertyValue('--timeline-gutter'), '64px', 'Home is the narrowest');
  key(handle(), 'ArrowLeft');
  assert.equal(log.filter(([name]) => name === 'onGutter').length, 3, 'a key that changes nothing reports nothing');
  key(handle(), 'End');
  assert.equal(root.style.getPropertyValue('--timeline-gutter'), '480px', 'End is the widest');
  draw(ITEMS, { gutter: 200 });
  assert.equal(root.style.getPropertyValue('--timeline-gutter'), '200px', 'the model restores it');
  key(handle(), 'ArrowRight');
  draw(ITEMS, { gutter: 200 });
  assert.equal(root.style.getPropertyValue('--timeline-gutter'), '216px', 'the same width again is not news');
  draw(ITEMS, { gutter: 9999 });
  assert.equal(root.style.getPropertyValue('--timeline-gutter'), '480px', 'a width is kept within the limits');
});

/*
 * Seen to fail on the timeline of `a304bfb`, which had no separator to drag:
 *
 *   ✖ gutter: dragging the separator sizes the column live and reports once, when it lets go; Escape puts it back and reports nothing
 *     TypeError [Error]: Cannot read properties of null (reading 'parentElement')
 */
test('gutter: dragging the separator sizes the column live and reports once, when it lets go; Escape puts it back and reports nothing', (t) => {
  const { host, root, log } = timelineOf(t);
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  const handle = host.querySelector('[role="separator"]');
  stubBox(handle.parentElement, { width: 160, height: 28 });
  pointer(handle, 'pointerdown', { clientX: 160, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: 220, clientY: 10 });
  assert.equal(root.style.getPropertyValue('--timeline-gutter'), '220px', 'the column follows the pointer');
  assert.deepEqual(log.filter(([name]) => name === 'onGutter'), [], 'and nothing is reported while it moves');
  pointer(sheet, 'pointerup', { clientX: 220, clientY: 10 });
  assert.deepEqual(log.filter(([name]) => name === 'onGutter'), [['onGutter', 220]]);
  pointer(handle, 'pointerdown', { clientX: 220, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: 300, clientY: 10 });
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(root.style.getPropertyValue('--timeline-gutter'), '220px', 'Escape puts it back');
  assert.equal(log.filter(([name]) => name === 'onGutter').length, 1);
});

/*
 * Seen to fail on the timeline of `a304bfb`, which had no hint line:
 *
 *   ✖ hint: one line under the toolbar says what the selection can do, from the callbacks the host gave, and changes with the selection
 *     AssertionError [ERR_ASSERTION]: under the toolbar
 *       actual: 'cloudcanvas-ui-timeline-sheet',
 *       expected: 'cloudcanvas-ui-timeline-hint',
 */
test('hint: one line under the toolbar says what the selection can do, from the callbacks the host gave, and changes with the selection', (t) => {
  const { host, root, draw, bar, hint } = timelineOf(t);
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-toolbar').nextElementSibling.className, 'cloudcanvas-ui-timeline-hint', 'under the toolbar');
  assert.equal(hint(), 'Select a bar to see what it can do');
  bar('draft').click();
  assert.equal(hint(), 'Enter opens · drag to move · drag an edge to resize · Alt+arrows move a day, Alt+Shift+arrows resize', 'a bar that can be moved and resized says so');
  bar('ship').click();
  assert.equal(hint(), 'Enter opens · drag to move · Alt+arrows move a day, Alt+Shift+arrows resize', 'a milestone is moved, not resized');
  draw(ITEMS.map((item) => ({ ...item, movable: false })));
  assert.equal(hint(), 'Enter opens', 'a bar that is held in place says only what remains');
  for (const attribute of ['data-can-move', 'data-can-link']) assert.equal(root.hasAttribute(attribute), attribute === 'data-can-move', `${attribute} says what the host takes`);
  const bare = timelineOf(t, ITEMS, []);
  bare.bar('draft').click();
  assert.deepEqual([bare.hint(), bare.host.querySelector('.cloudcanvas-ui-timeline-hint').hidden], ['', true], 'a host that took nothing is offered nothing: the line is not drawn empty');
});

/*
 * Seen to fail on the timeline of `a304bfb`, whose rows were lists and whose headings were not rows:
 *
 *   ✖ treegrid: a heading is a row of level 1, a bar's row level 2 under it, and the bar is in the row's cell
 *     AssertionError [ERR_ASSERTION]: the rows are a treegrid, named by the timeline
 *       actual: [ undefined ],
 *       expected: [ 'Plan' ],
 */
test('treegrid: a heading is a row of level 1, a bar\'s row level 2 under it, and the bar is in the row\'s cell', (t) => {
  const { host, bar } = timelineOf(t);
  const grid = host.querySelector('[role="treegrid"]');
  assert.deepEqual([grid?.getAttribute('aria-label')], ['Plan'], 'the rows are a treegrid, named by the timeline');
  const rows = [...grid.children].map((row) => [row.getAttribute('role'), row.getAttribute('aria-level'), row.firstElementChild.textContent.slice(0, 8)]);
  assert.deepEqual(rows, [['row', '1', 'The book'], ['row', '2', 'Draft th'], ['row', '2', 'Call the'], ['row', '1', 'Release'], ['row', '2', 'Ship it'], ['row', '1', 'Loose en']],
    'headings and rows, in order: the item with no group is a row of level 1');
  assert.equal(bar('draft').closest('[role="gridcell"]').parentElement.getAttribute('role'), 'row');
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-ticks').getAttribute('aria-hidden'), 'true', 'the axis\' dates are for the eye: the bars say theirs');
});

/*
 * Seen to fail on the timeline of `a304bfb`, where a bar was selected by the model alone:
 *
 *   ✖ selection: the arrows and a press move the selection; the model's replaces it only when the model changes it
 *     AssertionError [ERR_ASSERTION]: focus on a bar selects it
 *       actual: [],
 *       expected: [ 'draft' ],
 */
test('selection: the arrows and a press move the selection; the model\'s replaces it only when the model changes it', (t) => {
  const { host, draw, bar } = timelineOf(t);
  const selected = () => [...host.querySelectorAll('.cloudcanvas-ui-timeline-bar.is-selected')].map((node) => node.getAttribute('data-ui-id'));
  bar('draft').focus();
  assert.deepEqual(selected(), ['draft'], 'focus on a bar selects it');
  key(bar('draft'), 'ArrowDown');
  assert.deepEqual(selected(), ['quick'], 'the arrows moved the selection with them');
  assert.equal(bar('quick').getAttribute('aria-current'), 'true');
  draw(ITEMS, { selectedId: 'ship' });
  assert.deepEqual(selected(), ['ship'], 'a selection the model changes is the model\'s');
  key(bar('ship'), 'ArrowUp');
  draw(ITEMS, { selectedId: 'ship' });
  assert.deepEqual(selected(), ['quick'], 'the same one again is not news: it does not undo the reader\'s');
  assert.equal(host.querySelectorAll('.cloudcanvas-ui-timeline-row.is-current').length, 1, 'and the row of the selection says so');
});
