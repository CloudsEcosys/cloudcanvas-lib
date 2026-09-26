/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Sandbox persistence: named snapshots in `localStorage`.
 *
 * A thin, deliberately boring layer over `./serialize.js`. Two decisions are
 * worth stating:
 *
 *   - Keys are namespaced (`cloudcanvas-sandbox:<name>`). `localStorage` is one
 *     flat map shared with every other script on the origin, so a sandbox named
 *     `draft` must not be a sandbox that collides with the host page's own
 *     `draft`. `listSandboxKeys()` is only possible *because* of the prefix -
 *     it is what makes "the sandboxes" an enumerable set rather than a guess.
 *
 *   - Every entry point returns rather than throws when there is no storage.
 *     The guard is `typeof localStorage === 'undefined'`, matching how the core
 *     guards its own DOM access (`typeof document === 'undefined'` in
 *     `src/pins/pin-element.js` and `src/engine/session.js`): a module rendered
 *     on a server, or imported in a bare Node process, has to load and no-op,
 *     not explode.
 *
 * A quota failure is not swallowed. Storage that exists but refuses the write
 * is a real condition the caller has to see - unlike storage that does not
 * exist at all, which is a rendering context, not an error.
 *
 * `autoSaveSession` sits on top of that same write and inverts exactly one of
 * those two decisions: a timer cannot throw at anybody, so it reports a quota
 * failure through `onError` instead. It is caller-driven - `markDirty()` is a
 * hand-written call, not a subscription - because there is no "the session
 * changed" event in this codebase to subscribe to. A saver that pretended
 * otherwise would be a polling loop wearing an observer's name.
 */

import { createLogger } from '../../.plugin/index.js';
import { deserializeSession, serializeSession } from './serialize.js';

const logger = createLogger('sandbox/persistence');

/** Namespace every sandbox key lives under. */
export const SANDBOX_KEY_PREFIX = 'cloudcanvas-sandbox:';

/** The backing store, or null wherever there is not one. */
function storage() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

/** A caller's name as the key it is actually stored under. */
function namespaced(key) {
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('saveSandbox: a non-empty sandbox key is required');
  }
  return `${SANDBOX_KEY_PREFIX}${key}`;
}

/**
 * Write a session's snapshot under `key`.
 *
 * @param {string} key sandbox name, un-namespaced
 * @param {CloudCanvasSession} session
 * @returns {boolean} false when there is no storage to write to
 */
export function saveSandbox(key, session) {
  const store = storage();
  if (!store) return false;

  store.setItem(namespaced(key), JSON.stringify(serializeSession(session)));
  return true;
}

/**
 * Restore a saved snapshot into a session.
 *
 * A key that was never saved, and a key holding text that is not a snapshot,
 * both resolve to `null`: neither is an exception the caller can act on
 * differently, and a sandbox picker that throws on one stale entry is a sandbox
 * picker nobody can open.
 *
 * @param {string} key sandbox name, un-namespaced
 * @param {CloudCanvasSession} session the session to rebuild into
 * @returns {{pins: Pin[], warnings: string[]}|null}
 */
export function loadSandbox(key, session) {
  const store = storage();
  if (!store) return null;

  const raw = store.getItem(namespaced(key));
  if (raw === null || raw === undefined) return null;

  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    logger.warn(`saved sandbox "${key}" is not JSON; ignored`, error);
    return null;
  }

  if (!data || typeof data !== 'object') return null;
  return deserializeSession(session, data);
}

/**
 * Every saved sandbox name, with the namespace stripped back off.
 *
 * Indexed rather than key-iterated: `localStorage` is not an iterable in the
 * language sense, and `Object.keys` on it picks up the interface's own members
 * in some implementations. `key(i)` is the only enumeration the spec defines.
 *
 * @returns {string[]}
 */
export function listSandboxKeys() {
  const store = storage();
  if (!store) return [];

  const found = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    if (typeof key === 'string' && key.startsWith(SANDBOX_KEY_PREFIX)) {
      found.push(key.slice(SANDBOX_KEY_PREFIX.length));
    }
  }

  return found;
}

/**
 * Drop a saved sandbox. Deleting one that was never there is a no-op.
 *
 * @param {string} key sandbox name, un-namespaced
 * @returns {boolean} false when there is no storage
 */
export function deleteSandbox(key) {
  const store = storage();
  if (!store) return false;

  store.removeItem(namespaced(key));
  return true;
}

/* ------------------ AUTO-SAVE ------------------ */

/** How long a session stays quiet before an auto-save actually writes. */
export const AUTO_SAVE_DEBOUNCE_MS = 800;

/**
 * The window to hang the unload hook on, or null wherever there is not one.
 *
 * Same shape as `storage()` above, and for the same reason: a session driven
 * from a bare Node process has no `window` to lose an edit on, so the missing
 * one is a context, not a failure. The `addEventListener` check is not
 * defensive padding - happy-dom registers a `window` whose event surface is
 * real, but a hand-rolled SSR shim frequently does not.
 */
function unloadTarget() {
  if (typeof window === 'undefined' || !window) return null;
  return typeof window.addEventListener === 'function' ? window : null;
}

/**
 * Debounced auto-save for a live session against one localStorage key.
 *
 * The caller marks the moment something changed; this decides when to actually
 * persist. Trailing edge, not throttled: a burst of `markDirty()` calls writes
 * once, `debounceMs` after the *last* of them, which is the behaviour a drag
 * or a keystroke run needs.
 *
 * One attempt clears the dirty flag whatever its outcome, including a quota
 * failure. That is what makes `flush()` idempotent, and it leaves the retry
 * where the caller can see it: `onError` fires, and another `markDirty()`
 * asks again. Silently re-queueing a write that a full store already refused
 * would turn one failure into a loop of them.
 *
 * A few lines over this codebase's usual ceiling for one function, for the same
 * reason `restoreTree` is: its four steps are already extracted and none is a
 * dozen lines, but all four read and write the same `timer` / `dirty` /
 * `stopped` triple, and that state is the closure. Hoisting them out would mean
 * inventing an object to carry it.
 *
 * @param {string} key sandbox name, un-namespaced
 * @param {CloudCanvasSession} session the live session to snapshot
 * @param {{debounceMs?: number, onSave?: (key: string) => void, onError?: (error: Error) => void}} [options]
 * @returns {{markDirty: () => void, flush: () => void, stop: () => void}}
 */
export function autoSaveSession(key, session, options = {}) {
  const { debounceMs = AUTO_SAVE_DEBOUNCE_MS, onSave, onError } = options;
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('autoSaveSession: a non-empty sandbox key is required');
  }

  const target = unloadTarget();
  let timer = null;
  let dirty = false;
  let stopped = false;

  /** Write now, and count the session clean whether or not the write landed. */
  function write() {
    timer = null;
    dirty = false;

    try {
      // `false` means there was no storage at all: nothing saved, nothing wrong.
      if (saveSandbox(key, session) && onSave) onSave(key);
    } catch (error) {
      if (onError) onError(error);
    }
  }

  function markDirty() {
    if (stopped) return;

    dirty = true;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(write, debounceMs);
  }

  function flush() {
    if (stopped || !dirty) return;

    if (timer !== null) clearTimeout(timer);
    write();
  }

  function stop() {
    if (stopped) return;

    stopped = true;
    dirty = false;
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (target) target.removeEventListener('beforeunload', flush);
  }

  // A mid-debounce edit is the one an unload would otherwise eat.
  if (target) target.addEventListener('beforeunload', flush);

  return { markDirty, flush, stop };
}
