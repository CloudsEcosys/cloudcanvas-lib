/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The reserved-key rule: which content keys a saved canvas or a custom-type
 * definition may never carry. One definition, shared by every surface that
 * enforces it - the builder's author/import gate and custom-type loader (`.site`)
 * import it from here, and the session loader (`./restore-tree.js`) holds the same
 * literals inline, because it is stringified into exported pages; a unit test
 * holds the inline copy equal to this one, by value and by behaviour.
 *
 * It lives beside the session loader rather than in the builder because the
 * loader is the lower layer: a saved canvas is refused these keys whether or not
 * any builder code is on the page.
 */

import { HTML_KEY } from '../../.plugin/index.js';

/**
 * The content key a placed custom-type instance carries its source type's name
 * under. Written by the placer, carried in `fill` so it round-trips like any other
 * content, and named with a `cc:` prefix no user field can collide with. The
 * session loader treats a node carrying it as an instance.
 */
export const TYPE_NAME_KEY = 'cc:typeName';

/**
 * The namespace prefix the engine reserves for its own back-references: everything
 * up to and including the first colon of {@link TYPE_NAME_KEY}, matched
 * case-sensitively, so the reserved namespace can never drift from the key stamped.
 */
export const RESERVED_KEY_PREFIX = TYPE_NAME_KEY.slice(0, TYPE_NAME_KEY.indexOf(':') + 1);

/**
 * The keys the language gives a meaning to. `JSON.parse` yields `__proto__` as an
 * own key, and copying it with `object[key] = value` would rebind the copy's
 * prototype rather than add a property.
 */
export const PROTOTYPE_KEYS = /* @__PURE__ */ Object.freeze(['__proto__', 'constructor', 'prototype']);

/**
 * Exact field keys a user field must not seize: the engine's `html` content key,
 * which a `card` renders as raw `innerHTML` (a stored-XSS sink on a custom-type
 * instance), derived from the engine constant, plus the prototype keys.
 */
export const RESERVED_FIELD_KEYS = /* @__PURE__ */ Object.freeze([HTML_KEY, ...PROTOTYPE_KEYS]);

/**
 * Whether a field key is reserved, by either rule: an exact reserved key
 * ({@link RESERVED_FIELD_KEYS}), or anything in the {@link RESERVED_KEY_PREFIX}
 * namespace (which the placer would clobber). Padding does not smuggle one past.
 * @param {unknown} key
 * @returns {boolean}
 */
export function isReservedFieldKey(key) {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  return RESERVED_FIELD_KEYS.includes(trimmed) || trimmed.startsWith(RESERVED_KEY_PREFIX);
}
