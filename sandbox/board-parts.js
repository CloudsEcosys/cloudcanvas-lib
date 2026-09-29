/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Board parts: the state a saved board carries beside its blit tree, because it
 * names blits rather than living inside one.
 *
 *   - `reactions` - the board's blit-to-blit reactions (`reactionsOf`), whose
 *     store already speaks the format's vocabulary (`source`, `action.target`).
 *   - `theme` - the host's inline `--cc-*` tokens, read straight off the host, so
 *     the DOM is the store; a load with none clears the host to its dark fallback.
 *   - product parts ({@link PART_KEYS}) - state a product layer owns, such as the
 *     builder's sitemap (its `pages` and their `folders`). The format carries the
 *     key; the product attaches the store for a board ({@link attachBoardPart}), so
 *     this layer never imports it. A part loaded before its store is attached is
 *     held, handed over on attach, and written back unchanged meanwhile, so a
 *     load-then-save never drops it.
 *
 * Each part is emitted only when it holds something, so an empty board is the
 * smallest document the format allows.
 */
import { reactionsOf } from '../../.plugin/addons/reactions.js';
import { TOKEN_PREFIX, applyTheme } from '../../.plugin/graphics/theme.js';
import { createLogger } from '../../.plugin/log.js';

const logger = /* @__PURE__ */ createLogger('sandbox/board-parts');

/** The product-owned board keys the format carries, in document order. */
export const PART_KEYS = /* @__PURE__ */ Object.freeze(['pages', 'folders']);

/** @type {WeakMap<Element, Map<string, BoardPart>>} host -> attached parts */
const ATTACHED = /* @__PURE__ */ new WeakMap();

/** @type {WeakMap<Element, Map<string, unknown>>} host -> part values loaded before their store */
const PENDING = /* @__PURE__ */ new WeakMap();

/**
 * @typedef {object} BoardPart
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
 * Attach a product's store for one of {@link PART_KEYS} to a board. A value the
 * board loaded before the store existed is read into it now.
 * @param {object} app the board's root blit
 * @param {string} key
 * @param {BoardPart} part
 * @throws {TypeError} on a key the format does not carry, or an incomplete part
 */
export function attachBoardPart(app, key, part) {
  if (!PART_KEYS.includes(key)) throw new TypeError(`attachBoardPart: "${key}" is not a board part`);
  const complete = part && ['write', 'read', 'clear'].every((name) => typeof part[name] === 'function');
  if (!complete) throw new TypeError('attachBoardPart: a part needs write, read and clear');
  let parts = ATTACHED.get(app.el);
  if (!parts) ATTACHED.set(app.el, (parts = new Map()));
  parts.set(key, part);
  const pending = PENDING.get(app.el);
  if (!pending || !pending.has(key)) return;
  const value = pending.get(key);
  pending.delete(key);
  part.read(value, { exists: (id) => Boolean(app.find(id)), warn: (message) => logger.warn(message) });
}

/** The part attached under `key`, or null. */
function partOf(app, key) {
  return ATTACHED.get(app.el)?.get(key) ?? null;
}

/** The host's `--cc-*` tokens as a map, or null when it carries none. */
function themeOf(app) {
  const style = app.el.style;
  const theme = {};
  for (let index = 0; index < style.length; index += 1) {
    const name = style.item(index);
    if (name && name.startsWith(TOKEN_PREFIX)) theme[name] = style.getPropertyValue(name).trim();
  }
  return Object.keys(theme).length > 0 ? theme : null;
}

/**
 * Write every board part into `saved`, each only when it holds something.
 * @param {object} app
 * @param {object} saved the v2 document under construction
 */
export function writeBoardParts(app, saved) {
  const reactions = reactionsOf(app).toJSON();
  if (reactions.length > 0) saved.reactions = reactions;
  const pending = PENDING.get(app.el);
  for (const key of PART_KEYS) {
    const part = partOf(app, key);
    const value = part ? part.write() : pending?.get(key);
    if (value !== null && value !== undefined) saved[key] = value;
  }
  const theme = themeOf(app);
  if (theme) saved.theme = theme;
}

/**
 * Load every board part from a v2 document, after its tree exists: each names
 * blits by id, so an entry whose blit did not come back is dropped with a warning.
 * An absent part is loaded as empty - a load replaces, never merges.
 * @param {object} app
 * @param {object} saved a v2 document
 * @param {LoadContext} context
 */
export function readBoardParts(app, saved, context) {
  reactionsOf(app).load(saved.reactions, { exists: context.exists, warn: context.warn });
  for (const key of PART_KEYS) {
    const value = Object.hasOwn(saved, key) ? saved[key] : null;
    const part = partOf(app, key);
    if (part) { part.read(value, context); continue; }
    if (value === null) { PENDING.get(app.el)?.delete(key); continue; }
    if (!PENDING.has(app.el)) PENDING.set(app.el, new Map());
    PENDING.get(app.el).set(key, value);
  }
  applyTheme(app.el, saved.theme || null);
}

/**
 * Empty every board part: reactions, product parts (held values included) and
 * the host's theme tokens.
 * @param {object} app
 */
export function clearBoardParts(app) {
  reactionsOf(app).clear();
  for (const key of PART_KEYS) partOf(app, key)?.clear();
  PENDING.delete(app.el);
  applyTheme(app.el, null);
}
