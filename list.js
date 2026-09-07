/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * List: a keyed, selectable row list built on `defineComponent`.
 *
 * The widget owns no selection state. `items` is read-only - the reconciler's
 * own contract, and the reason a frozen array reconciles exactly like a mutable
 * one - so a click does not rewrite it. Clicking (or Enter/Space on a focused
 * row) transmits `list:select` with the item's id and stops there; the consumer
 * decides what selection means and calls `setContent('items', next)` back with
 * the flags it wants painted. One direction of data flow, one owner per fact.
 *
 * Rows are reconciled by key rather than rebuilt: `reconcileKeyedList` reuses
 * the element already holding an item's id, so node identity - and therefore
 * focus, scroll position and the row a screen reader is sitting on - survives
 * every content change. Rebuilding the `<ul>` on each pass is the exact defect
 * this widget exists not to have.
 *
 * Activation is delegated to the `<ul>`: two listeners for the whole list rather
 * than two per row, so a thousand rows cost what one does and a reconciled row
 * needs no rebinding.
 */

import { PinEvent } from '../src/pins/traits/base.js';
import { defineComponent } from '../src/pins/traits/define-component.js';
import { traitRegistry } from '../src/pins/traits/registry.js';
import {
  KEY_ATTR,
  makeElement,
  makeTextNode,
  reconcileKeyedList,
  setText
} from '../src/pins/traits/template-kit.js';
import { injectLibStyles } from './styles.js';

/** Registry name, and the trait's own name. */
export const LIST_TYPE = 'lib-list';

/** Every class this widget emits. Styled by `LIB_DEFAULT_CSS`. */
export const LIST_CLS = Object.freeze({
  ROOT: 'cloudcanvas-lib-list',
  ITEM: 'cloudcanvas-lib-list-item',
  ITEM_LABEL: 'cloudcanvas-lib-list-item-label',
  ITEM_SELECTED: 'cloudcanvas-lib-list-item-selected'
});

/**
 * The event a row activation transmits, bubbling up the scope chain.
 *
 * Namespaced, and it has to be: `select` alone is a core *Pin signal*
 * (`PIN_SIGNAL_TYPES` in `src/pins/traits/base.js`). `PinSignalBus` subscribes
 * to that type on every registered Pin and the session routes it to
 * `handlePinSignal`, which reads a truthy payload as "this Pin is now selected"
 * and moves the selection cursor onto it - so a bare `select` would paint the
 * cursor on the list itself on every row click, and never release it. Every
 * component event in this codebase is namespaced for the same reason
 * (`note:edited`, `telemetry:alert`, `navigation:back`).
 */
export const SELECT_EVENT = 'list:select';

/** Keys that activate a focused row, matching a native option list. */
const ACTIVATION_KEYS = new Set(['Enter', ' ', 'Spacebar']);

/** One handle per registry: the definition is per-registry, so the cache is too. */
const handles = new WeakMap();

/** An item's key: its own id, or its position when it has none. */
function itemKey(item, index) {
  if (item && item.id !== undefined && item.id !== null) return item.id;
  return index;
}

/* ------------------ TEMPLATE ------------------ */

/** Build the container once and delegate activation to it. */
function build(pin, contentEl) {
  const root = makeElement('ul', LIST_CLS.ROOT);
  root.addEventListener('click', (event) => activateFrom(pin, root, event, false));
  root.addEventListener('keydown', (event) => {
    if (ACTIVATION_KEYS.has(event.key)) activateFrom(pin, root, event, true);
  });
  contentEl.replaceChildren(root);
  return { root };
}

/** Reconcile the rows against `items`; nothing else is written. */
function update(pin, contents, bindings) {
  const items = contents.get('items');
  reconcileKeyedList(bindings.root, Array.isArray(items) ? items : [], {
    key: itemKey,
    create: createRow,
    update: updateRow
  });
}

/**
 * One row: a real list item that is also a real control.
 *
 * `data-cc-control` is the declaration that the canvas must stand down here -
 * both the pointer router and `DraggableTrait` read it (`CONTROL_SELECTOR` in
 * `src/pins/pin-element.js`) - so pressing a row selects it instead of dragging
 * the Pin. `tabindex="0"` makes it operable by keyboard, which is the other half
 * of being a control.
 */
function createRow() {
  const li = makeElement('li', LIST_CLS.ITEM);
  li.setAttribute('tabindex', '0');
  li.setAttribute('data-cc-control', '');
  const label = makeElement('span', LIST_CLS.ITEM_LABEL);
  makeTextNode(label);
  li.appendChild(label);
  return li;
}

/**
 * Write one item into its row.
 *
 * The text node is re-derived rather than cached in a side table: the row is one
 * span with one text child, `querySelector` finds it in constant depth, and a
 * WeakMap of node references would be a second copy of state the DOM already
 * holds. Both writes diff first, so an unchanged item costs zero DOM writes -
 * which is what the renderer's idle-frame model depends on.
 */
function updateRow(li, item) {
  const label = li.querySelector(`.${LIST_CLS.ITEM_LABEL}`);
  if (label && label.firstChild) setText(label.firstChild, item && item.label);

  const selected = Boolean(item && item.selected);
  if (li.classList.contains(LIST_CLS.ITEM_SELECTED) === selected) return;

  li.classList.toggle(LIST_CLS.ITEM_SELECTED, selected);
  // `aria-selected` belongs to listbox semantics this plain list does not claim;
  // `aria-current` is the valid way to mark the chosen member of a set.
  if (selected) li.setAttribute('aria-current', 'true');
  else li.removeAttribute('aria-current');
}

/* ------------------ ACTIVATION ------------------ */

/**
 * Resolve the row an event landed on and transmit its selection.
 *
 * The key on the element is a string (the reconciler stamps it that way), so the
 * item is looked up rather than reconstructed: the payload carries the caller's
 * own id, with its own type, not a stringified copy of it.
 */
function activateFrom(pin, root, event, fromKeyboard) {
  const target = event.target;
  const row = target && typeof target.closest === 'function'
    ? target.closest(`.${LIST_CLS.ITEM}`)
    : null;
  if (!row || !root.contains(row)) return;

  const items = pin.getContent('items');
  const key = row.getAttribute(KEY_ATTR);
  const index = Array.isArray(items)
    ? items.findIndex((entry, position) => String(itemKey(entry, position)) === key)
    : -1;
  if (index === -1) return;

  if (fromKeyboard) {
    // Enter focuses a Pin and Space activates it (`KEY_BINDINGS` in
    // `src/engine/keyboard.js`); a row that handles the key owns it outright.
    event.preventDefault();
    event.stopPropagation();
  }

  pin.transmit(new PinEvent(SELECT_EVENT, {
    payload: { id: items[index].id },
    bubbles: true,
    source: pin
  }));
}

/* ------------------ REGISTRATION ------------------ */

/**
 * Define the list component, once per registry.
 *
 * Idempotent because both entry points reach it: `registerBaseTypes()` and the
 * factory's own lazy call. `registry.clear()` drops the definition and replays
 * only its default providers, so a stale handle is re-defined rather than
 * returned - a handle whose name no longer exists would throw at `createTrait`.
 *
 * @param {TraitRegistry} [registry] defaults to the shared singleton
 * @returns {ComponentHandle}
 */
export function registerList(registry = traitRegistry) {
  const cached = handles.get(registry);
  if (cached && registry.has(LIST_TYPE)) return cached;

  const handle = defineComponent({
    name: LIST_TYPE,
    build,
    update,
    allowedKeys: ['items'],
    chrome: false,
    registry
  });

  handles.set(registry, handle);
  return handle;
}

/**
 * Create a list Pin in a session.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options] Pin options; `contents.items` is the row array, and
 *   `registry` targets a registry other than the shared singleton
 * @returns {Pin}
 */
export function createListPin(session, options = {}) {
  if (!session || typeof session.createPin !== 'function') {
    throw new TypeError('createListPin: a CloudCanvasSession is required');
  }

  const { registry, contents, ...pinOptions } = options;
  const component = registerList(registry);
  injectLibStyles();

  // `chrome` is read from the Pin's own options, not from the trait, so the
  // component's declaration has to be restated here to reach the element - and
  // stated *before* the spread, so a caller who wants the card back can say so.
  return session.createPin({
    chrome: false,
    x: 0,
    y: 0,
    ...pinOptions,
    displayTrait: component.createTrait(),
    contents: contents || { items: [] }
  });
}
