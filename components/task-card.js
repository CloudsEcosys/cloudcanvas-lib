/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * TaskCard: a checklist with a priority chip and a progress bar.
 *
 *   registerTaskCard();
 *   const task = createTaskCard(app, { title: 'Ship it', items: [{ text: 'Test', done: false }] });
 *   toggleTaskItem(task, 0);                  // task:updated {index, item, progress}
 *
 * The checklist is real form markup: each row is an `<input type="checkbox">`
 * and its `<label for>`, so ticking works from the keyboard and the row is
 * announced as what it is. Rows are reconciled by key rather than rebuilt, so
 * the checkbox that has focus is the checkbox that stays. One `change`
 * listener on the list serves every row.
 *
 * `items` is read, never written: a toggle writes a new array with a new item
 * in place of the old one. The completion percentage is the `progress` content
 * key, seeded by the factory and kept in step by the toggle; the bar itself is
 * drawn from the items, so it can never disagree with the list it measures.
 */
import { blit } from '../../.plugin/core/index.js';
import { reconcileKeyedList } from '../../.plugin/addons/keyed-list.js';
import { contentOf, leadingText, setAttr, setContents, setText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { keyedIndexOf, withDefaults } from './registrar.js';
import { injectComponentStyles } from './styles.js';

/** The type name. */
export const TASK_CARD_TYPE = 'task-card';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const TASK_CLS = /* @__PURE__ */ Object.freeze({
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
export const TASK_PRIORITIES = /* @__PURE__ */ Object.freeze(['urgent', 'high', 'normal', 'low']);

/** The event a toggle emits. */
export const TASK_UPDATED_EVENT = 'task:updated';

const DEFAULT_PRIORITY = 'normal';

/** Row-id prefixes for elements without an id of their own, made once per element. */
const ROW_PREFIXES = /* @__PURE__ */ new WeakMap();
let rowSerial = 0;

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

/* ------------------ BEHAVIOUR ------------------ */

/**
 * Flip one item's `done`, immutably, keep `progress` in step, and emit `task:updated`.
 * @returns {boolean} whether an item was toggled
 */
export function toggleTaskItem(b, index) {
  const items = contentOf(b).items;
  if (!Array.isArray(items) || !items[index]) return false;
  const next = items.map((item, position) => (position === index ? { ...item, done: !item.done } : item));
  const progress = taskProgressOf(next);
  setContents(b, { items: next, progress });
  b.emit(TASK_UPDATED_EVENT, { index, item: next[index], progress });
  return true;
}

/* ------------------ TEMPLATE ------------------ */

const HTML = `<div class="cloudcanvas-component cloudcanvas-component-card ${TASK_CLS.ROOT}">`
  + `<div class="${TASK_CLS.HEADER}"><div class="${TASK_CLS.TITLE}"></div>`
  + `<span class="cloudcanvas-component-chip ${TASK_CLS.PRIORITY}"></span></div>`
  + `<ul class="${TASK_CLS.CHECKLIST}"></ul>`
  + `<progress class="cloudcanvas-component-meter ${TASK_CLS.PROGRESS}" max="100" aria-label="Checklist progress"></progress>`
  + '</div>';

/** The prefix a card's checkbox ids start with: its own id, else one made for it. */
function rowPrefixOf(host) {
  if (host.id) return host.id;
  if (!ROW_PREFIXES.has(host)) ROW_PREFIXES.set(host, `cc-task-${rowSerial += 1}`);
  return ROW_PREFIXES.get(host);
}

/** One row: the checkbox, and the label that names it. */
function rowMaker(prefix) {
  return (item, index) => {
    const row = document.createElement('li');
    row.className = TASK_CLS.ITEM;
    const box = document.createElement('input');
    box.className = TASK_CLS.BOX;
    box.setAttribute('type', 'checkbox');
    box.id = `${prefix}-item-${String(itemKey(item, index))}`;
    const label = document.createElement('label');
    label.className = TASK_CLS.LABEL;
    label.setAttribute('for', box.id);
    leadingText(label);
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
  setText(label.firstChild, text);
  if (row.classList.contains(TASK_CLS.ITEM_DONE) !== done) row.classList.toggle(TASK_CLS.ITEM_DONE, done);
}

/** The nodes, and one `change` listener on the list resolving the row it came from. */
function bind(host, on) {
  const b = blit(host);
  const find = (className) => host.querySelector(`.${className}`);
  const checklist = find(TASK_CLS.CHECKLIST);
  on(checklist, 'change', (event) => {
    const index = keyedIndexOf(checklist, event.target, TASK_CLS.ITEM, contentOf(b).items, itemKey);
    if (index !== -1) toggleTaskItem(b, index);
  });
  const priority = find(TASK_CLS.PRIORITY);
  return {
    titleText: leadingText(find(TASK_CLS.TITLE)), priority, priorityText: leadingText(priority),
    checklist, progress: find(TASK_CLS.PROGRESS), makeRow: rowMaker(rowPrefixOf(host))
  };
}

function render(bindings, contents, cache) {
  const priority = priorityOf(contents.get('priority'));
  const items = contents.get('items');
  const list = Array.isArray(items) ? items : [];
  setText(bindings.titleText, contents.get('title'));
  setText(bindings.priorityText, priority);
  setAttr(bindings.priority, 'data-priority', priority, cache, 'priority');
  reconcileKeyedList(bindings.checklist, list, { key: itemKey, create: bindings.makeRow, update: updateRow });
  setAttr(bindings.progress, 'value', String(taskProgressOf(list)), cache, 'progress');
}

/* ------------------ REGISTRATION ------------------ */

const SPEC = Object.freeze({
  name: TASK_CARD_TYPE, html: HTML, keys: ['title', 'priority', 'items', 'assignee', 'progress'], bind, render
});

/** Define the task card widget, once. @returns {object} its type */
export function registerTaskCard() {
  injectComponentStyles();
  return widget(SPEC);
}

/**
 * A task card in `parent`. `title`, `priority`, `items`, `assignee` and `progress` (seeded
 * from the items when absent) are contents; the rest is spec.
 */
export function createTaskCard(parent, options = {}) {
  registerTaskCard();
  const items = options.items ?? [
    { text: 'Initial design review', done: true },
    { text: 'Refactor core abstractions', done: true },
    { text: 'Write automated test suite', done: false }
  ];
  return parent.blit(widgetSpec(TASK_CARD_TYPE, withDefaults({
    x: 100, y: 100, w: 220, h: 190, chrome: false,
    title: 'Feature Checklist', priority: DEFAULT_PRIORITY, assignee: 'Engineer', progress: taskProgressOf(items)
  }, { ...options, items })));
}
