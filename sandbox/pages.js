/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Sandbox pages: a name and a home flag for each root Pin, stored beside the
 * session rather than on the Pin.
 *
 * Promoting a root Pin (`session.focus(pin, {promote: true})`) already isolates
 * it from every sibling root - `RenderRootScope.allows` demotes everything not on
 * its chain - so a root Pin *is* a page, structurally, with no new engine
 * primitive. What a root Pin has no room for is the two things a sitemap needs on
 * top of that: a human name, and which page is Home. Neither belongs on the Pin.
 * A name keyed to a Pin id is exactly the shape a reaction binding is
 * (`src/pins/reactions.js`): session state that *names* a Pin rather than living
 * inside it, so it rides the snapshot beside `pins` and `bindings`, survives the
 * JSON round-trip through the id, and is pruned when the Pin it names is gone. And
 * "at most one Home" is a rule about the *set* of pages, which a field on any one
 * Pin could only ever half-enforce; the store owns it, and `setHome` clears every
 * other flag as it sets one.
 *
 * Reached through a WeakMap ({@link pagesFor}), the same way `reactionsFor` reaches
 * a session's bindings, so the serializer, the panel and the reaction editor all
 * read and write the one store. The store holds only metadata for Pins the panel
 * has actually named or flagged; an unnamed root Pin is a page with no entry here,
 * which reads back as an untitled page and never as an error.
 */

/** A page's metadata as this store keeps it: a trimmed name, and the home flag. */
function normalizeEntry(name, home) {
  return {
    name: typeof name === 'string' ? name.trim() : '',
    home: Boolean(home)
  };
}

/**
 * The pages for one session: name and home flag per root-Pin id, with the
 * single-home invariant enforced on write and repaired on load.
 *
 * Keyed by Pin id, not by Pin, so an entry outlives a JSON round-trip in which
 * the Pin object itself does not: a reloaded canvas rebuilds a Pin under the same
 * id (`serializePin` captures it), and the entry finds it again by that id.
 */
export class PageStore {
  constructor() {
    /** @type {Map<string, {name: string, home: boolean}>} id -> metadata */
    this._pages = new Map();
  }

  /** The metadata for a Pin id, or null when it has none. */
  get(pinId) {
    return this._pages.get(pinId) || null;
  }

  /** The page name for a Pin id, or '' when it has none. */
  nameOf(pinId) {
    const entry = this._pages.get(pinId);
    return entry ? entry.name : '';
  }

  /** Whether a Pin id is the flagged Home page. */
  isHome(pinId) {
    const entry = this._pages.get(pinId);
    return Boolean(entry && entry.home);
  }

  /** The id of the Home page, or null when none is flagged. */
  home() {
    for (const [id, entry] of this._pages) {
      if (entry.home) return id;
    }
    return null;
  }

  /**
   * Name a page. A blank name with no home flag drops the entry entirely, so an
   * emptied name leaves the same "no metadata" state an unnamed root Pin has,
   * rather than a lingering empty record.
   */
  setName(pinId, name) {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    const existing = this._pages.get(pinId);
    if (trimmed === '' && !(existing && existing.home)) {
      this._pages.delete(pinId);
      return null;
    }
    const entry = normalizeEntry(trimmed, existing ? existing.home : false);
    this._pages.set(pinId, entry);
    return entry;
  }

  /**
   * Flag a page as Home, clearing the flag from every other page as it does -
   * the single-home invariant lives here, so no caller has to remember it.
   * Passing `false` clears this page's flag without touching any other.
   */
  setHome(pinId, home = true) {
    if (!home) {
      const existing = this._pages.get(pinId);
      if (!existing) return null;
      // Clearing the flag from an otherwise-unnamed page drops it back to the
      // no-metadata state, the same way an emptied name does in `setName`.
      if (existing.name === '') this._pages.delete(pinId);
      else existing.home = false;
      return null;
    }
    for (const entry of this._pages.values()) entry.home = false;
    const existing = this._pages.get(pinId);
    const entry = normalizeEntry(existing ? existing.name : '', true);
    this._pages.set(pinId, entry);
    return entry;
  }

  /** Drop a Pin's page metadata; a Pin that never had any is a no-op. */
  remove(pinId) {
    return this._pages.delete(pinId);
  }

  clear() {
    this._pages.clear();
  }

  /**
   * Every page entry as a plain, JSON-safe object (the serialization surface).
   * Only Pins with real metadata appear, so a canvas whose pages were never named
   * serializes to an empty list and, in `serializeSession`, to no `pages` key.
   */
  toJSON() {
    const out = [];
    for (const [pinId, entry] of this._pages) {
      out.push({ pinId, name: entry.name, home: entry.home });
    }
    return out;
  }

  /**
   * Replace the store's contents from a persisted list.
   *
   * Clears first, so loading a saved canvas over a live one replaces rather than
   * merges - the same semantics the Pins and the bindings get. An entry naming a
   * Pin that did not come back is skipped (given `pinExists`), and the single-home
   * invariant is repaired here too: a hand-edited snapshot with two homes keeps the
   * first and drops the rest, so a bad file can never load a two-home canvas.
   *
   * @param {object[]} list
   * @param {{pinExists?: (id: string) => boolean, warn?: (message: string) => void}} [options]
   */
  load(list, options = {}) {
    this.clear();
    const exists = typeof options.pinExists === 'function' ? options.pinExists : null;
    const warn = (message) => { if (options.warn) options.warn(message); };
    let homeTaken = false;

    for (const raw of Array.isArray(list) ? list : []) {
      const pinId = raw && typeof raw.pinId === 'string' ? raw.pinId : '';
      if (pinId === '') continue;
      if (exists && !exists(pinId)) { warn(`page skipped: pin "${pinId}" is gone`); continue; }

      const wantsHome = Boolean(raw.home);
      const home = wantsHome && !homeTaken;
      if (wantsHome && homeTaken) warn(`page "${pinId}": a home page is already set, flag ignored`);
      if (home) homeTaken = true;

      const entry = normalizeEntry(raw.name, home);
      if (entry.name === '' && !entry.home) continue;
      this._pages.set(pinId, entry);
    }
  }
}

/** session -> its PageStore, created on first ask. */
const STORES = new WeakMap();

/**
 * The page store for a session, created on first access.
 *
 * The single place any layer - the serializer, the Pages panel, the reaction
 * editor's target labels - reaches a session's page metadata, so all of them read
 * and write the one store. Mirrors `reactionsFor` deliberately: same lookup, same
 * lifetime, same "session state keyed by Pin id" contract.
 *
 * @returns {PageStore}
 */
export function pagesFor(session) {
  let store = STORES.get(session);
  if (!store) {
    store = new PageStore();
    STORES.set(session, store);
  }
  return store;
}
