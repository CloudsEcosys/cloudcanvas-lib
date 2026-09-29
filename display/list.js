/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * List: a keyed, selectable row list as a widget.
 *
 *   const list = createList(app, { x: 40, y: 40, items: [{ id: 'a', label: 'Alpha' }] });
 *   list.on('list:select', (event) => setContent(list, 'items', markSelected(event.detail.payload.id)));
 *
 * The widget owns no selection state. `items` is read, never written, so a click
 * does not rewrite it. Clicking (or Enter/Space on a focused row) emits
 * `list:select` with the item's id and stops there; the consumer decides what
 * selection means and writes `items` back with the flags it wants painted. One
 * direction of data flow, one owner per fact.
 *
 * Rows are reconciled by key rather than rebuilt: `reconcileKeyedList`
 * (`cloudcanvas/keyed-list`) reuses the element already holding an item's id, so
 * node identity - and therefore focus, scroll position and the row a screen
 * reader is sitting on - survives every write.
 *
 * Activation is delegated to the `<ul>`: two listeners for the whole list rather
 * than two per row, so a thousand rows cost what one does and a reconciled row
 * needs no rebinding.
 */
import { blit } from '../../.plugin/core/index.js';
import { KEY_ATTR, reconcileKeyedList } from '../../.plugin/addons/keyed-list.js';
import { contentOf, leadingText, setText } from '../../.plugin/addons/widget.js';
import { defineWidget } from './widget.js';

/** The type name; its contents live under the `libList` key. */
export const LIST_TYPE = 'lib-list';

/** Every class this widget emits. Styled by `LIB_DEFAULT_CSS`. */
export const LIST_CLS = /* @__PURE__ */ Object.freeze({
  ROOT: 'cloudcanvas-lib-list',
  ITEM: 'cloudcanvas-lib-list-item',
  ITEM_LABEL: 'cloudcanvas-lib-list-item-label',
  ITEM_SELECTED: 'cloudcanvas-lib-list-item-selected'
});

/**
 * The event a row activation emits, bubbling. Namespaced, and it has to be:
 * `select` alone is the select add-on's (`cloudcanvas/select`) - an ancestor
 * listening for "this blit is now selected" would read every row click as one.
 * Every component event is namespaced for the same reason (`note:edited`).
 */
export const SELECT_EVENT = 'list:select';

/** Keys that activate a focused row, matching a native option list. */
const ACTIVATION_KEYS = new Set(['Enter', ' ', 'Spacebar']);

/** An item's key: its own id, or its position when it has none. */
function itemKey(item, index) {
  if (item && item.id !== undefined && item.id !== null) return item.id;
  return index;
}

/**
 * One row: a real list item that is also a real control. `data-cc-control` is the
 * declaration that the canvas must stand down here (`CONTROL_SELECTOR`), so
 * pressing a row selects it instead of dragging the blit; `tabindex="0"` makes it
 * operable by keyboard, the other half of being a control.
 */
function createRow() {
  const li = document.createElement('li');
  li.className = LIST_CLS.ITEM;
  li.setAttribute('tabindex', '0');
  li.setAttribute('data-cc-control', '');
  const label = document.createElement('span');
  label.className = LIST_CLS.ITEM_LABEL;
  leadingText(label);
  li.appendChild(label);
  return li;
}

/** Write one item into its row; both writes diff first, so an unchanged item costs no DOM write. */
function updateRow(li, item) {
  const label = li.querySelector(`.${LIST_CLS.ITEM_LABEL}`);
  if (label) setText(leadingText(label), item && item.label);

  const selected = Boolean(item && item.selected);
  if (li.classList.contains(LIST_CLS.ITEM_SELECTED) === selected) return;
  li.classList.toggle(LIST_CLS.ITEM_SELECTED, selected);
  // `aria-selected` belongs to listbox semantics this plain list does not claim;
  // `aria-current` is the valid way to mark the chosen member of a set.
  if (selected) li.setAttribute('aria-current', 'true');
  else li.removeAttribute('aria-current');
}

/**
 * Resolve the row an event landed on and emit its selection. The key on the
 * element is a string, so the item is looked up rather than reconstructed: the
 * payload carries the caller's own id, with its own type.
 */
function activateFrom(b, root, event, fromKeyboard) {
  const row = typeof event.target?.closest === 'function' ? event.target.closest(`.${LIST_CLS.ITEM}`) : null;
  if (!row || !root.contains(row)) return;

  const items = contentOf(b).items;
  const key = row.getAttribute(KEY_ATTR);
  const index = Array.isArray(items)
    ? items.findIndex((entry, position) => String(itemKey(entry, position)) === key)
    : -1;
  if (index === -1) return;

  // A row that handles the key owns it outright: no keyboard binding above sees it.
  if (fromKeyboard) {
    event.preventDefault();
    event.stopPropagation();
  }
  b.emit(SELECT_EVENT, { id: items[index].id });
}

/** The `<ul>`, and activation delegated to it. */
function bind(host, on) {
  const b = blit(host);
  const root = host.querySelector(`.${LIST_CLS.ROOT}`);
  on(root, 'click', (event) => activateFrom(b, root, event, false));
  on(root, 'keydown', (event) => {
    if (ACTIVATION_KEYS.has(event.key)) activateFrom(b, root, event, true);
  });
  return { root };
}

/** Reconcile the rows against `items`; nothing else is written. */
function render(bindings, contents) {
  const items = contents.get('items');
  reconcileKeyedList(bindings.root, Array.isArray(items) ? items : [], {
    key: itemKey,
    create: createRow,
    update: updateRow
  });
}

const widget = /* @__PURE__ */ defineWidget({
  name: LIST_TYPE,
  html: `<ul class="${LIST_CLS.ROOT}"></ul>`,
  allowedKeys: ['items'],
  bind,
  render
});

/** Define the list widget, once. @returns {object} its type */
export const registerList = widget.define;

/** A chromeless list blit in `parent`: `createList(app, { x, y, items })`. */
export const createList = widget.create;
