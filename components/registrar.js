/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What more than one component needs beyond the widget add-on: the root a
 * blit sits in (history navigates a root collection), the keyed row an event
 * landed on (a checklist item, a reaction pill), and a factory's options laid
 * over its defaults.
 *
 * Nothing here registers anything; each component's `registerX()` does.
 */
import { blit } from '../../.plugin/core/index.js';
import { KEY_ATTR } from '../../.plugin/addons/keyed-list.js';

/** The attribute every root collection's host carries. */
const ROOT_SELECTOR = '[data-blit-root]';

/** The root collection `b` sits in, or null for a potential (detached) blit. */
export function appOf(b) {
  const host = b.el.closest(ROOT_SELECTOR);
  return host ? blit(host) : null;
}

/**
 * The index in `items` of the keyed row (`.rowClass`, reconciled into
 * `container`) that `target` sits in, or -1.
 * @param {(item: *, index: number) => string|number} keyOf the reconciler's own key reader
 */
export function keyedIndexOf(container, target, rowClass, items, keyOf) {
  const row = typeof target?.closest === 'function' ? target.closest(`.${rowClass}`) : null;
  if (!row || !container.contains(row) || !Array.isArray(items)) return -1;
  const key = row.getAttribute(KEY_ATTR);
  return items.findIndex((item, index) => String(keyOf(item, index)) === key);
}

/**
 * A factory's options over its defaults. An explicit `undefined` is an absence,
 * not a value: the default stands.
 */
export function withDefaults(defaults, options = {}) {
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(options)) if (value !== undefined) merged[key] = value;
  return merged;
}
