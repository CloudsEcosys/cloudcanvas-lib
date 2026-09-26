/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * TaskCard: a checklist with a priority chip and a progress bar.
 *
 * The checklist is real form markup: each row is an `<input type="checkbox">`
 * and its `<label for>`, so ticking works from the keyboard and the row is
 * announced as what it is. Rows are reconciled by key rather than rebuilt, so
 * the checkbox that has focus is the checkbox that stays. One `change`
 * listener on the list serves every row.
 *
 * `items` is read, never written: a toggle produces a new array with a new
 * item in place of the old one (`toggleTaskItem`), the reconciler's own
 * contract. The completion percentage lives in the Pin's primary vector,
 * kept in step from the toggle path - not from the render pass, where a
 * vector write would invalidate the render that is running.
 */

import {
  KEY_ATTR,
  PinEvent,
  makeElement,
  makeTextNode,
  reconcileKeyedList,
  setAttr,
  setText
} from '../../.plugin/index.js';
import {
  claimHost,
  createComponentPin,
  makeRegistrar,
  splitOptions
} from './registrar.js';

/** Registry name, and the `type` a caller creates a Pin by. */
export const TASK_CARD_TYPE = 'task-card';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const TASK_CLS = Object.freeze({
  ROOT: 'cloudcanvas-task-card',
  HEADER: 'cloudcanvas-task-header',
  TITLE: 'cloudcanvas-task-title',
  PRIORITY: 'cloudcanvas-task-priority',
  CHECKLIST: 'cloudcanvas-task-checklist',
  ITEM: 'cloudcanvas-check-item',
  ITEM_DONE: 'is-done',
  BOX: 'cloudcanvas-check-box',
  LABEL: 'cloudcanvas-check-label',
  PROGRESS: 'cloudcanvas-task-progress'
});

/** The priorities the sheet has a fill for; anything else is `normal`. */
export const TASK_PRIORITIES = Object.freeze(['urgent', 'high', 'normal', 'low']);

const DEFAULT_PRIORITY = 'normal';
const ALLOWED_KEYS = ['title', 'priority', 'items', 'assignee'];

/** An item's key: its own id, or its position when it has none. */
function itemKey(item, index) {
  if (item && item.id !== undefined && item.id !== null) return item.id;
  return index;
}

/** The declared priority, lower-cased, or the default. */
function priorityOf(value) {
  const priority = typeof value === 'string' ? value.toLowerCase() : '';
  return TASK_PRIORITIES.includes(priority) ? priority : DEFAULT_PRIORITY;
}

/** Percentage of items done, 0 for an empty list. */
export function taskProgressOf(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const done = items.filter((item) => item && item.done).length;
  return Math.round((done / items.length) * 100);
}

/** Write the percentage into the primary vector; seed it when there is none. */
function syncProgress(pin, items) {
  const progress = taskProgressOf(items);
  if (pin.particle.getVectors().length > 0) pin.setVector(0, progress);
  else pin.addVector(progress);
  return progress;
}

/* ------------------ BEHAVIOUR ------------------ */

/**
 * Flip one item's `done`, immutably, and announce the new progress.
 *
 * @returns {boolean} whether an item was toggled
 */
export function toggleTaskItem(pin, index) {
  const items = pin.contents.get('items');
  if (!Array.isArray(items) || !items[index]) return false;

  const next = items.map((item, position) => (
    position === index ? { ...item, done: !item.done } : item
  ));
  pin.setContent('items', next);
  const progress = syncProgress(pin, next);

  pin.transmit(new PinEvent('task:updated', {
    payload: { index, item: next[index], progress },
    bubbles: true,
    source: pin
  }));
  return true;
}

/** Resolve the row a `change` landed on and toggle its item. */
function onChecklistChange(pin, list, event) {
  const target = event.target;
  const row = target && typeof target.closest === 'function' ? target.closest(`.${TASK_CLS.ITEM}`) : null;
  if (!row || !list.contains(row)) return;

  const items = pin.contents.get('items');
  const key = row.getAttribute(KEY_ATTR);
  const index = Array.isArray(items)
    ? items.findIndex((item, position) => String(itemKey(item, position)) === key)
    : -1;
  if (index !== -1) toggleTaskItem(pin, index);
}

/* ------------------ TEMPLATE ------------------ */

/** One row: the checkbox, and the label that names it. */
function makeRow(pin) {
  return (item, index) => {
    const row = makeElement('li', TASK_CLS.ITEM);
    const box = makeElement('input', TASK_CLS.BOX);
    box.setAttribute('type', 'checkbox');
    box.id = `${pin.id}-item-${String(itemKey(item, index))}`;
    const label = makeElement('label', TASK_CLS.LABEL);
    label.setAttribute('for', box.id);
    makeTextNode(label);
    row.append(box, label);
    return row;
  };
}

/** Write one item into its row; every write diffs first. */
function updateRow(row, item, index) {
  const box = row.firstElementChild;
  const label = row.lastElementChild;
  const done = Boolean(item && item.done);
  const text = item && item.text !== undefined && item.text !== null ? item.text : `Item ${index + 1}`;

  if (box.checked !== done) box.checked = done;
  if (label.firstChild) setText(label.firstChild, text);
  if (row.classList.contains(TASK_CLS.ITEM_DONE) !== done) {
    row.classList.toggle(TASK_CLS.ITEM_DONE, done);
  }
}

function build(pin, contentEl) {
  claimHost(contentEl);
  const card = makeElement('div', `cloudcanvas-component cloudcanvas-component-card ${TASK_CLS.ROOT}`);

  const header = makeElement('div', TASK_CLS.HEADER);
  const title = makeElement('div', TASK_CLS.TITLE);
  const titleText = makeTextNode(title);
  const priority = makeElement('span', `cloudcanvas-component-chip ${TASK_CLS.PRIORITY}`);
  const priorityText = makeTextNode(priority);
  header.append(title, priority);

  const checklist = makeElement('ul', TASK_CLS.CHECKLIST);
  checklist.addEventListener('change', (event) => onChecklistChange(pin, checklist, event));

  const progress = makeElement('progress', `cloudcanvas-component-meter ${TASK_CLS.PROGRESS}`);
  progress.setAttribute('max', '100');
  progress.setAttribute('aria-label', 'Checklist progress');

  card.append(header, checklist, progress);
  contentEl.replaceChildren(card);

  return { card, titleText, priority, priorityText, checklist, progress, makeRow: makeRow(pin) };
}

function update(pin, contents, bindings, cache) {
  const priority = priorityOf(contents.get('priority'));
  const items = contents.get('items');
  const list = Array.isArray(items) ? items : [];

  setText(bindings.titleText, contents.get('title'));
  setText(bindings.priorityText, priority);
  setAttr(bindings.priority, 'data-priority', priority, cache, 'priority');

  reconcileKeyedList(bindings.checklist, list, {
    key: itemKey,
    create: bindings.makeRow,
    update: updateRow
  });

  setAttr(bindings.progress, 'value', String(taskProgressOf(list)), cache, 'progress');
}

/** Seed the progress vector from the items the card was born with. */
function onAttach(pin) {
  syncProgress(pin, pin.contents.get('items'));
}

/* ------------------ REGISTRATION ------------------ */

/** Register the task card, once per registry; see `./registrar.js`. */
export const registerTaskCard = makeRegistrar({
  name: TASK_CARD_TYPE,
  build,
  update,
  chrome: false,
  allowedKeys: ALLOWED_KEYS,
  defaults: { onAttach }
});

/**
 * Create a task card Pin.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options] `title`, `priority`, `items`, `assignee` become
 *   contents; the rest are Pin options
 * @returns {Pin}
 */
export function createTaskCardPin(session, options = {}) {
  const { pinOptions, contents } = splitOptions(options, [
    ['title', 'Feature Checklist'],
    ['priority', DEFAULT_PRIORITY],
    ['items', [
      { text: 'Initial design review', done: true },
      { text: 'Refactor core abstractions', done: true },
      { text: 'Write automated test suite', done: false }
    ]],
    ['assignee', 'Engineer']
  ], { x: 100, y: 100, width: 220, height: 190 });

  return createComponentPin(session, registerTaskCard, pinOptions, contents, false);
}
