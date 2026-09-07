/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Custom Pin types: user-defined presets, kept in `localStorage`.
 *
 * A custom type is a *recipe*, not a display trait: a name, a list of default
 * content fields, the traits an instance is born with, and its chrome / border /
 * reload defaults. Placing one is `session.createPin(...)` with those defaults
 * spread in, plus the trait attachments - the same calls a hand-built Pin makes.
 * Nothing is registered with the trait registry, so a page that never loads
 * this module renders a saved instance exactly as a card.
 *
 * Its own key namespace, deliberately separate from `./persistence.js`:
 *
 *   - A type is global. It is a thing the visitor made once and expects in the
 *     insert menu of every profile, so it must not live inside any profile's
 *     snapshot.
 *   - `listSandboxKeys()` defines "a saved sandbox" as *any* key under
 *     `cloudcanvas-sandbox:`. A type stored there would appear in the Load menu
 *     as a profile that cannot be opened. One prefix per concern keeps both
 *     enumerable sets honest.
 *
 * The storage guard and the key enumeration follow `./persistence.js` exactly:
 * `typeof localStorage === 'undefined'` returns rather than throws, and the set
 * is walked with `key(i)`, the only enumeration the spec defines.
 */

/** Namespace every custom type lives under. */
export const CUSTOM_TYPE_KEY_PREFIX = 'cloudcanvas-custom-type:';

/** The value kinds a default field may declare. Small on purpose. */
export const CUSTOM_FIELD_KINDS = Object.freeze(['text', 'number', 'checkbox']);

/** The attachable traits a definition may name. */
export const CUSTOM_TYPE_TRAITS = Object.freeze(['draggable', 'selectable', 'resizable', 'focussable']);

/**
 * The insert-menu category a definition lands in when it names none.
 *
 * A category is free text - the visitor may file a type under a built-in
 * category or coin a new one - so the only rule is that every stored type has
 * one, and this is what an older definition written before categories existed
 * reads back as.
 */
export const DEFAULT_CUSTOM_CATEGORY = 'Custom';

/** The reload strategies a definition may name (mirrors `RELOAD_STRATEGIES`). */
const RELOAD_VALUES = Object.freeze(['active', 'persistent', 'lazy']);

/** Traits a Pin is born with when a definition says nothing. */
const DEFAULT_TRAITS = Object.freeze(['draggable', 'selectable', 'resizable']);

/** The backing store, or null wherever there is not one. */
function storage() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

/** A type name as the key it is actually stored under. */
function namespaced(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new TypeError('custom-types: a non-empty type name is required');
  }
  return `${CUSTOM_TYPE_KEY_PREFIX}${name.trim()}`;
}

/* ------------------ NORMALISATION ------------------ */

/** A field's default value coerced to its declared kind. */
function coerceFieldValue(kind, value) {
  if (kind === 'number') {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }
  if (kind === 'checkbox') return Boolean(value);
  return value === undefined || value === null ? '' : String(value);
}

/**
 * One field as `{key, kind, value}`, or null when it has no usable key.
 * An unknown kind falls back to `text` rather than throwing: a definition
 * written by an older page should still load, and text loses nothing.
 */
function normalizeField(field) {
  if (!field || typeof field !== 'object') return null;
  const key = typeof field.key === 'string' ? field.key.trim() : '';
  if (key === '') return null;

  const kind = CUSTOM_FIELD_KINDS.includes(field.kind) ? field.kind : 'text';
  return { key, kind, value: coerceFieldValue(kind, field.value) };
}

/** The fields a definition declares, de-duplicated by key, first wins. */
function normalizeFields(fields) {
  const seen = new Set();
  const out = [];
  for (const raw of (Array.isArray(fields) ? fields : [])) {
    const field = normalizeField(raw);
    if (!field || seen.has(field.key)) continue;
    seen.add(field.key);
    out.push(field);
  }
  return out;
}

/**
 * One slot as `{name, fields}`, or null when it has no usable name.
 *
 * A slot is a *named* sub-region of a type - a header, a body - and its name is
 * the only thing that distinguishes it from the flat-fields shape, so a nameless
 * slot is dropped rather than kept as an anonymous one: two anonymous slots could
 * not be told apart at render time, nor addressed in the editor. Its fields go
 * through the very same `normalizeFields`, so a slot's field is a field in every
 * other respect - kind, coercion, key de-duplication - and the machinery is
 * shared, not forked.
 */
function normalizeSlot(slot) {
  if (!slot || typeof slot !== 'object') return null;
  const name = typeof slot.name === 'string' ? slot.name.trim() : '';
  if (name === '') return null;
  return { name, fields: normalizeFields(slot.fields) };
}

/**
 * The slots a definition declares, de-duplicated by name, first wins.
 *
 * An older definition written before slots existed carries no `slots` key and so
 * reads back as the empty array, which is exactly "this is a flat type" - the one
 * signal `customTypeContents` and the placer read to keep the old render path.
 */
function normalizeSlots(slots) {
  const seen = new Set();
  const out = [];
  for (const raw of (Array.isArray(slots) ? slots : [])) {
    const slot = normalizeSlot(raw);
    if (!slot || seen.has(slot.name)) continue;
    seen.add(slot.name);
    out.push(slot);
  }
  return out;
}

/** The traits a definition names, restricted to the attachable set. */
function normalizeTraits(traits) {
  if (!Array.isArray(traits)) return [...DEFAULT_TRAITS];
  return CUSTOM_TYPE_TRAITS.filter((name) => traits.includes(name));
}

/** The category a definition names, trimmed, or the default when it names none. */
function normalizeCategory(category) {
  const trimmed = typeof category === 'string' ? category.trim() : '';
  return trimmed === '' ? DEFAULT_CUSTOM_CATEGORY : trimmed;
}

/**
 * A definition as this module stores it: every field present, every value of
 * the type the placer expects.
 *
 * @param {object} definition
 * @returns {{name: string, category: string, fields: object[], slots: object[],
 *   traits: string[], chrome: boolean, bordered: boolean, reload: string,
 *   width: number|null, height: number|null}}
 * @throws {TypeError} when the name is missing
 */
export function normalizeCustomType(definition) {
  const source = definition && typeof definition === 'object' ? definition : {};
  const name = typeof source.name === 'string' ? source.name.trim() : '';
  if (name === '') throw new TypeError('custom-types: a definition needs a name');

  return {
    name,
    category: normalizeCategory(source.category),
    fields: normalizeFields(source.fields),
    slots: normalizeSlots(source.slots),
    traits: normalizeTraits(source.traits),
    chrome: source.chrome !== false,
    bordered: source.bordered !== false,
    reload: RELOAD_VALUES.includes(source.reload) ? source.reload : 'active',
    width: Number(source.width) > 0 ? Number(source.width) : null,
    height: Number(source.height) > 0 ? Number(source.height) : null
  };
}

/**
 * Whether a definition renders through named slots rather than flat fields.
 *
 * The single branch the placer and the editor read: a type with at least one
 * slot is a slotted type, everything else keeps the flat `card` render it has
 * always had.
 */
export function isSlottedType(definition) {
  return normalizeCustomType(definition).slots.length > 0;
}

/** A definition's default fields as the contents object an instance is born with. */
export function customTypeContents(definition) {
  const contents = {};
  for (const field of normalizeCustomType(definition).fields) contents[field.key] = field.value;
  return contents;
}

/**
 * A slotted definition's slots as the contents an instance is born with.
 *
 * The value is *self-describing* on purpose: each slot carries its own field
 * `{key, kind, value}` list, not a flat `{key: value}` map. The render component
 * needs the values, but the editor needs the kinds too (a number field is a
 * number row, a checkbox a checkbox), and a placed Pin that carried only values
 * would have to reach back into `localStorage` for its own type to be edited -
 * which an exported or reloaded Pin cannot do. Carried in full, the slots survive
 * the serializer's plain-object round-trip and render and edit standalone.
 *
 * @returns {{slots: object[]}} the contents object, `slots` deep-copied so no two
 *   instances share a field record
 */
export function customTypeSlotContents(definition) {
  const slots = normalizeCustomType(definition).slots.map((slot) => ({
    name: slot.name,
    fields: slot.fields.map((field) => ({ ...field }))
  }));
  return { slots };
}

/* ------------------ STORAGE ------------------ */

/**
 * Write a definition under its own name. Saving a name that exists replaces it.
 *
 * @param {object} definition see {@link normalizeCustomType}
 * @returns {object|null} the normalised definition, or null when there is no storage
 */
export function saveCustomType(definition) {
  const normalized = normalizeCustomType(definition);
  const store = storage();
  if (!store) return null;

  store.setItem(namespaced(normalized.name), JSON.stringify(normalized));
  return normalized;
}

/**
 * Read one definition back, or null when it was never saved or is not JSON.
 * @param {string} name
 * @returns {object|null}
 */
export function getCustomType(name) {
  const store = storage();
  if (!store) return null;

  const raw = store.getItem(namespaced(name));
  if (raw === null || raw === undefined) return null;

  try {
    return normalizeCustomType(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Every saved definition, sorted by name.
 *
 * Entries that fail to parse are skipped, not thrown: one stale key must not
 * take the whole insert menu down with it.
 *
 * @returns {object[]}
 */
export function listCustomTypes() {
  const store = storage();
  if (!store) return [];

  const found = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    if (typeof key !== 'string' || !key.startsWith(CUSTOM_TYPE_KEY_PREFIX)) continue;
    const definition = getCustomType(key.slice(CUSTOM_TYPE_KEY_PREFIX.length));
    if (definition) found.push(definition);
  }

  return found.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Drop a saved definition. Deleting one that was never there is a no-op.
 * @returns {boolean} false when there is no storage
 */
export function deleteCustomType(name) {
  const store = storage();
  if (!store) return false;

  store.removeItem(namespaced(name));
  return true;
}
