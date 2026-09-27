/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Session parts: the state a saved canvas carries beside its blit tree, because it
 * names blits rather than living inside one.
 *
 *   - `reactions` - the session's blit-to-blit reactions (`reactionsFor`), written
 *     in the format's own vocabulary (`source`, `action.target`) and mapped back to
 *     the store's on load by `reactionsFromWire` (`./restore-tree.js`), the same
 *     function an exported page runs.
 *   - `theme` - the host's inline `--cc-*` tokens, read straight off the host, so
 *     the DOM is the store; a load with none clears the host to its dark fallback.
 *   - product parts ({@link PART_KEYS}) - state a product layer owns, such as the
 *     builder's sitemap. The format carries the key; the product attaches the store
 *     for a session ({@link attachSessionPart}), so this layer never imports it. A
 *     part loaded before its store is attached is held, handed over on attach, and
 *     written back unchanged meanwhile, so a load-then-save never drops it.
 *
 * Each part is emitted only when it holds something, so an empty canvas is the
 * smallest document the format allows.
 */

import { TOKEN_PREFIX, applyTheme, createLogger, reactionsFor } from '../../.plugin/index.js';
import { reactionsFromWire } from './restore-tree.js';

const logger = /* @__PURE__ */ createLogger('sandbox/session-parts');

/** The product-owned session keys the format carries, in document order. */
export const PART_KEYS = /* @__PURE__ */ Object.freeze(['pages']);

/** @type {WeakMap<object, Map<string, SessionPart>>} session -> attached parts */
const ATTACHED = /* @__PURE__ */ new WeakMap();

/** @type {WeakMap<object, Map<string, unknown>>} session -> part values loaded before their store */
const PENDING = /* @__PURE__ */ new WeakMap();

/**
 * @typedef {object} SessionPart
 * @property {() => unknown} write the part's document value, or null when it holds nothing
 * @property {(value: unknown, context: LoadContext) => void} read replace the store from a value (null: empty)
 * @property {() => void} clear empty the store
 */

/**
 * @typedef {object} LoadContext
 * @property {(id: string) => boolean} exists whether a blit with this id came back
 * @property {(message: string) => void} warn collector for what could not be restored
 */

/**
 * Attach a product's store for one of {@link PART_KEYS} to a session. A value the
 * session loaded before the store existed is read into it now.
 * @param {object} session
 * @param {string} key
 * @param {SessionPart} part
 * @throws {TypeError} on a key the format does not carry, or an incomplete part
 */
export function attachSessionPart(session, key, part) {
  if (!PART_KEYS.includes(key)) throw new TypeError(`attachSessionPart: "${key}" is not a session part`);
  const complete = part && ['write', 'read', 'clear'].every((name) => typeof part[name] === 'function');
  if (!complete) throw new TypeError('attachSessionPart: a part needs write, read and clear');

  let parts = ATTACHED.get(session);
  if (!parts) ATTACHED.set(session, (parts = new Map()));
  parts.set(key, part);

  const pending = PENDING.get(session);
  if (!pending || !pending.has(key)) return;
  const value = pending.get(key);
  pending.delete(key);
  part.read(value, { exists: (id) => Boolean(session.getPin(id)), warn: (message) => logger.warn(message) });
}

/** The part attached under `key`, or null. */
function partOf(session, key) {
  const parts = ATTACHED.get(session);
  return (parts && parts.get(key)) || null;
}

/** The session's reactions in the format's vocabulary. */
function reactionsToWire(session) {
  return reactionsFor(session).toJSON().map((binding) => ({
    id: binding.id,
    source: binding.sourcePinId,
    signal: binding.signal,
    action: { type: binding.action.type, target: binding.action.targetPinId, params: binding.action.params }
  }));
}

/** The host's `--cc-*` tokens as a map, or null when it carries none. */
function themeOf(session) {
  const style = session && session.hostElement ? session.hostElement.style : null;
  if (!style || typeof style.item !== 'function') return null;

  const theme = {};
  for (let index = 0; index < style.length; index += 1) {
    const name = style.item(index);
    if (name && name.startsWith(TOKEN_PREFIX)) theme[name] = style.getPropertyValue(name).trim();
  }
  return Object.keys(theme).length > 0 ? theme : null;
}

/**
 * Write every session part into `saved`, each only when it holds something.
 * @param {object} session
 * @param {object} saved the v2 document under construction
 */
export function writeSessionParts(session, saved) {
  const reactions = reactionsToWire(session);
  if (reactions.length > 0) saved.reactions = reactions;

  const pending = PENDING.get(session);
  for (const key of PART_KEYS) {
    const part = partOf(session, key);
    const value = part ? part.write() : (pending ? pending.get(key) : null);
    if (value !== null && value !== undefined) saved[key] = value;
  }

  const theme = themeOf(session);
  if (theme) saved.theme = theme;
}

/**
 * Load every session part from a v2 document, after its tree exists: each names
 * blits by id, so an entry whose blit did not come back is dropped with a warning.
 * An absent part is loaded as empty - a load replaces, never merges.
 * @param {object} session
 * @param {object} saved a v2 document
 * @param {LoadContext} context
 */
export function readSessionParts(session, saved, context) {
  reactionsFor(session).load(reactionsFromWire(saved.reactions), { pinExists: context.exists, warn: context.warn });

  for (const key of PART_KEYS) {
    const value = Object.hasOwn(saved, key) ? saved[key] : null;
    const part = partOf(session, key);
    if (part) { part.read(value, context); continue; }
    if (value === null) { PENDING.get(session)?.delete(key); continue; }
    if (!PENDING.has(session)) PENDING.set(session, new Map());
    PENDING.get(session).set(key, value);
  }

  applyTheme(session.hostElement, saved.theme || null);
}

/**
 * Empty every session part: reactions, product parts (held values included) and
 * the host's theme tokens.
 * @param {object} session
 */
export function clearSessionParts(session) {
  reactionsFor(session).clear();
  for (const key of PART_KEYS) partOf(session, key)?.clear();
  PENDING.delete(session);
  applyTheme(session.hostElement, null);
}
