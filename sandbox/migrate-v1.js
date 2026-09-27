/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The one-time v1 -> v2 migration: a pure function from the Pin-era snapshot to
 * the blit-spec document (`./format.js`). The loader runs it on every v1 save or
 * export it meets; nothing writes v1 any more.
 *
 * Per node: `width`/`height` -> `w`/`h`, `contents` -> `fill`, `children` ->
 * `blits`, each `traitNames` entry -> a `name: true` key (the display type's own
 * trait is the `type` and is not repeated), and every field at its v1 default is
 * left out. Session parts: `pins` -> `blits`, `bindings` -> `reactions` with
 * `sourcePinId`/`targetPinId` -> `source`/`action.target`, `pages[].pinId` ->
 * `pages[].id`, `theme` as is.
 *
 * Mapping, not policing: own keys are copied as own data properties (never by
 * assignment, so a hostile `__proto__` cannot rebind anything here) and reach the
 * loader intact, which drops and warns exactly as the v1 loader did. The one thing
 * the v2 shape cannot hold - a trait named like a spec key - is warned about here.
 */

import { NODE_KEYS } from './restore-tree.js';

/** Set `key` on `target` as an own, enumerable data property, whatever the key is. */
function define(target, key, value) {
  Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
}

/** A plain object's own keys copied as own data properties, or null when it has none. */
function copyOwn(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  const keys = Object.keys(source);
  if (keys.length === 0) return null;
  const copy = {};
  for (const key of keys) define(copy, key, source[key]);
  return copy;
}

/** The v1 node's traits as `name: true` keys on the spec. */
function migrateTraits(node, spec, warnings) {
  const names = Array.isArray(node.traitNames) ? node.traitNames : [];
  for (const name of names) {
    if (typeof name !== 'string' || name === '' || name === spec.type) continue;
    if (NODE_KEYS.includes(name)) warnings.push(`pin "${node.id}": trait "${name}" collides with a spec key; not migrated`);
    else define(spec, name, true);
  }
}

/** The v1 node's appearance and flow, each only when it differs from the v1 default. */
function migrateSurface(node, spec) {
  if (node.reload && node.reload !== 'active') spec.reload = node.reload;
  if (node.chrome === false) spec.chrome = false;
  if (node.bordered === false) spec.bordered = false;
  if (node.layout && node.layout !== 'free') spec.layout = node.layout;
  if (Number.isFinite(node.gap)) spec.gap = node.gap;
  if (node.selectableText) spec.selectableText = true;
  const style = copyOwn(node.style);
  if (style) spec.style = style;
}

/** One v1 node and its subtree as a v2 spec, or null for anything that is not a node. */
function migrateNode(node, warnings) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null;
  const spec = {};
  if (node.id !== undefined) spec.id = node.id;
  if (typeof node.type === 'string' && node.type !== '') spec.type = node.type;
  spec.x = Number(node.x) || 0;
  spec.y = Number(node.y) || 0;
  if (Number(node.z)) spec.z = Number(node.z);
  if (Number(node.width) > 0) spec.w = Number(node.width);
  if (Number(node.height) > 0) spec.h = Number(node.height);

  const fill = copyOwn(node.contents);
  if (fill) spec.fill = fill;
  migrateTraits(node, spec, warnings);
  migrateSurface(node, spec);

  const children = (Array.isArray(node.children) ? node.children : [])
    .map((child) => migrateNode(child, warnings)).filter(Boolean);
  if (children.length > 0) spec.blits = children;
  return spec;
}

/** v1 bindings in the format's reaction vocabulary. */
function migrateBindings(bindings) {
  return bindings.map((binding) => {
    const source = binding && typeof binding === 'object' ? binding : {};
    const action = source.action && typeof source.action === 'object' ? source.action : {};
    return {
      id: source.id,
      source: source.sourcePinId,
      signal: source.signal,
      action: { type: action.type, target: action.targetPinId, params: action.params }
    };
  });
}

/** v1 page entries, keyed by `id`. */
function migratePages(pages) {
  return pages.map((page) => {
    const entry = page && typeof page === 'object' ? page : {};
    return { id: entry.pinId, name: entry.name, home: entry.home };
  });
}

/**
 * A v1 snapshot - or a bare v1 root array - as a v2 document.
 * @param {{version?: 1, pins?: object[], bindings?: object[], pages?: object[], theme?: object}|object[]} v1
 * @param {string[]} [warnings] collector for what the v2 shape cannot hold
 * @returns {{version: 2, blits: object[], reactions?: object[], pages?: object[], theme?: object}}
 */
export function migrateV1(v1, warnings = []) {
  const snapshot = Array.isArray(v1) ? { pins: v1 } : (v1 && typeof v1 === 'object' ? v1 : {});
  const pins = Array.isArray(snapshot.pins) ? snapshot.pins : [];
  const migrated = { version: 2, blits: pins.map((node) => migrateNode(node, warnings)).filter(Boolean) };

  if (Array.isArray(snapshot.bindings) && snapshot.bindings.length > 0) {
    migrated.reactions = migrateBindings(snapshot.bindings);
  }
  if (Array.isArray(snapshot.pages) && snapshot.pages.length > 0) migrated.pages = migratePages(snapshot.pages);
  const theme = copyOwn(snapshot.theme);
  if (theme) migrated.theme = theme;
  return migrated;
}
