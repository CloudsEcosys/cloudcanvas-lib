/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Unit tests for the sandbox auto-saver's debounce, its lifecycle, and the two
 * environments it has to survive: a storage that refuses the write, and a
 * runtime with no storage or window at all.
 *
 * Time is controlled with `node:test`'s `mock.timers` rather than real delays -
 * this is the suite's first timer-driven module, so the choice is stated here:
 * a debounce test built on real `setTimeout` either sleeps for the whole window
 * on every assertion or races it, and neither is a test that stays green on a
 * loaded machine. `t.mock.timers` is enabled per test and torn down with it.
 *
 * The saver calls the bare global `setTimeout` (not `window.setTimeout`, which
 * happy-dom owns and Node's mock does not reach), which is what makes it
 * mockable here and what keeps it working in a bare Node process.
 *
 * `saveSandbox` is never stubbed. Where a failure is needed, `localStorage`
 * itself is swapped for a store whose `setItem` throws `QuotaExceededError`,
 * so the error travels the real path a full browser store would send it down.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTO_SAVE_DEBOUNCE_MS,
  SANDBOX_KEY_PREFIX,
  autoSaveBoard,
  deleteSandbox,
  listSandboxKeys,
  loadSandbox
} from '../../sandbox/persistence.js';
import { resetDocument } from '../helpers/dom.js';
import { freshBoard } from '../helpers/sandbox-tree.js';

/** Savers built during the current test, stopped after it. */
const savers = [];

/** An auto-saver that cannot outlive the test that made it. */
function trackedSaver(app, key, options) {
  const saver = autoSaveBoard(key, app, options);
  savers.push(saver);
  return saver;
}

/** How many times this key has been written, counted at the raw store. */
function writesTo(key) {
  const raw = localStorage.getItem(`${SANDBOX_KEY_PREFIX}${key}`);
  return raw === null ? 0 : JSON.parse(raw).blits.length;
}

/**
 * Swap the global `localStorage` for `replacement` until the returned undo runs.
 *
 * happy-dom's `Storage` is proxied, so assigning over `setItem` on the instance
 * does not take - the whole binding has to be replaced. The descriptor is a
 * configurable getter, which is the only reason this is possible at all.
 */
function withLocalStorage(replacement) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: () => replacement
  });
  return () => Object.defineProperty(globalThis, 'localStorage', original);
}

/** A store that exists, accepts reads, and refuses every write. */
function fullStore() {
  const error = new Error('The quota has been exceeded.');
  error.name = 'QuotaExceededError';

  return {
    length: 0,
    key: () => null,
    getItem: () => null,
    removeItem: () => undefined,
    setItem() { throw error; }
  };
}

test.beforeEach(() => {
  resetDocument();
  for (const key of listSandboxKeys()) deleteSandbox(key);
});

test.afterEach(() => {
  while (savers.length > 0) savers.pop().stop();
});

/* ------------------ DEBOUNCE ------------------ */

test('Sandbox auto-save - one markDirty writes after the window, and not before', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const app = freshBoard();
  app.blit({ id: 'a', x: 1, y: 2 });
  const saver = trackedSaver(app, 'auto', { debounceMs: 500 });

  saver.markDirty();
  t.mock.timers.tick(499);
  assert.equal(writesTo('auto'), 0, 'nothing written while the window is still open');

  t.mock.timers.tick(1);
  assert.equal(writesTo('auto'), 1, 'written on the trailing edge');
});

test('Sandbox auto-save - a burst writes once, timed from the last call', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const app = freshBoard();
  app.blit({ id: 'a', x: 0, y: 0 });
  const saved = [];
  const saver = trackedSaver(app, 'auto', { debounceMs: 500, onSave: (key) => saved.push(key) });

  saver.markDirty();
  t.mock.timers.tick(300);
  saver.markDirty();
  t.mock.timers.tick(300);
  saver.markDirty();

  // 600ms of wall time has passed since the first call, so a throttle would
  // already have fired. The window restarts instead.
  t.mock.timers.tick(499);
  assert.deepEqual(saved, [], 'the third call moved the deadline, it did not add one');

  t.mock.timers.tick(1);
  assert.deepEqual(saved, ['auto'], 'exactly one write, 500ms after the last markDirty');

  t.mock.timers.tick(5000);
  assert.deepEqual(saved, ['auto'], 'the superseded timers are gone, not merely early');
});

test('Sandbox auto-save - the default window is the exported one', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const app = freshBoard();
  app.blit({ id: 'a', x: 0, y: 0 });
  const saved = [];
  const saver = trackedSaver(app, 'auto', { onSave: (key) => saved.push(key) });

  saver.markDirty();
  t.mock.timers.tick(AUTO_SAVE_DEBOUNCE_MS - 1);
  assert.deepEqual(saved, []);

  t.mock.timers.tick(1);
  assert.deepEqual(saved, ['auto']);
});

/* ------------------ FLUSH ------------------ */

test('Sandbox auto-save - flush writes now and cancels the pending timer', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const app = freshBoard();
  app.blit({ id: 'a', x: 0, y: 0 });
  const saved = [];
  const saver = trackedSaver(app, 'auto', { debounceMs: 500, onSave: (key) => saved.push(key) });

  saver.markDirty();
  t.mock.timers.tick(100);
  saver.flush();
  assert.deepEqual(saved, ['auto'], 'written immediately, without waiting out the window');

  t.mock.timers.tick(5000);
  assert.deepEqual(saved, ['auto'], 'the timer flush replaced never fired');
});

test('Sandbox auto-save - flush with nothing dirty is a no-op, twice over', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const app = freshBoard();
  app.blit({ id: 'a', x: 0, y: 0 });
  const saved = [];
  const saver = trackedSaver(app, 'auto', { debounceMs: 500, onSave: (key) => saved.push(key) });

  saver.flush();
  assert.deepEqual(saved, [], 'a saver nobody has marked dirty has nothing to write');
  assert.equal(localStorage.getItem(`${SANDBOX_KEY_PREFIX}auto`), null);

  saver.markDirty();
  saver.flush();
  saver.flush();
  assert.deepEqual(saved, ['auto'], 'the second flush found the app clean again');
});

test('Sandbox auto-save - what it writes is what loadSandbox reads back', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const source = freshBoard();
  source.blit({ id: 'kept', x: 12, y: 34, type: 'card', card: { title: 'Kept' } });
  trackedSaver(source, 'auto', { debounceMs: 500 }).markDirty();
  t.mock.timers.tick(500);

  const target = freshBoard();
  const restored = loadSandbox('auto', target);

  assert.deepEqual(restored.warnings, []);
  assert.deepEqual(restored.blits.map((b) => b.el.id), ['kept']);
  assert.equal(target.find('kept').spec.card.title, 'Kept');
});

/* ------------------ LIFECYCLE ------------------ */

test('Sandbox auto-save - stop is final: no pending write, no later one', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const app = freshBoard();
  app.blit({ id: 'a', x: 0, y: 0 });
  const saved = [];
  const saver = trackedSaver(app, 'auto', { debounceMs: 500, onSave: (key) => saved.push(key) });

  saver.markDirty();
  t.mock.timers.tick(100);
  saver.stop();

  t.mock.timers.tick(5000);
  assert.deepEqual(saved, [], 'the timer stop cancelled never fired');

  saver.markDirty();
  t.mock.timers.tick(5000);
  saver.flush();
  assert.deepEqual(saved, [], 'a stopped saver stays stopped');
  assert.equal(localStorage.getItem(`${SANDBOX_KEY_PREFIX}auto`), null);
});

test('Sandbox auto-save - beforeunload flushes a mid-debounce edit, and stop detaches it', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const app = freshBoard();
  app.blit({ id: 'a', x: 0, y: 0 });
  const saved = [];
  const saver = trackedSaver(app, 'auto', { debounceMs: 500, onSave: (key) => saved.push(key) });

  saver.markDirty();
  t.mock.timers.tick(100);
  window.dispatchEvent(new Event('beforeunload'));
  assert.deepEqual(saved, ['auto'], 'the edit survived the unload');

  saver.stop();
  saver.markDirty();
  window.dispatchEvent(new Event('beforeunload'));
  assert.deepEqual(saved, ['auto'], 'the listener came off with stop');
});

test('Sandbox auto-save - an empty key is a programming error, and says so', () => {
  const app = freshBoard();

  assert.throws(() => autoSaveBoard('', app), TypeError);
  assert.throws(() => autoSaveBoard(null, app), TypeError);
});

/* ------------------ FAILURE AND ABSENCE ------------------ */

test('Sandbox auto-save - a refused write reports through onError, never throws', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const app = freshBoard();
  app.blit({ id: 'a', x: 0, y: 0 });
  const saved = [];
  const errors = [];
  const saver = trackedSaver(app, 'auto', {
    debounceMs: 500,
    onSave: (key) => saved.push(key),
    onError: (error) => errors.push(error)
  });

  const restore = withLocalStorage(fullStore());
  try {
    saver.markDirty();
    // The throw happens inside the timer callback; an escape here would be an
    // uncatchable one in production.
    t.mock.timers.tick(500);
  } finally {
    restore();
  }

  assert.equal(errors.length, 1);
  assert.equal(errors[0].name, 'QuotaExceededError');
  assert.deepEqual(saved, [], 'a write that was refused is not a save');

  // The failed attempt still cleared the flag: the retry is the caller's call.
  saver.flush();
  assert.deepEqual(saved, []);

  saver.markDirty();
  t.mock.timers.tick(500);
  assert.deepEqual(saved, ['auto'], 'asked again against a working store, it writes');
  assert.equal(errors.length, 1);
});

test('Sandbox auto-save - no storage is a context, not a failure: no save, no error', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const app = freshBoard();
  app.blit({ id: 'a', x: 0, y: 0 });
  const saved = [];
  const errors = [];
  const saver = trackedSaver(app, 'auto', {
    debounceMs: 500,
    onSave: (key) => saved.push(key),
    onError: (error) => errors.push(error)
  });

  const restore = withLocalStorage(undefined);
  try {
    saver.markDirty();
    t.mock.timers.tick(500);
    saver.flush();
  } finally {
    restore();
  }

  assert.deepEqual(saved, [], 'nothing was written, so nothing is reported as written');
  assert.deepEqual(errors, [], 'a Node process is not a broken browser');
});

test('Sandbox auto-save - constructs and runs with no window and no storage', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const app = freshBoard();
  app.blit({ id: 'a', x: 0, y: 0 });

  const restoreStorage = withLocalStorage(undefined);
  const originalWindow = globalThis.window;
  globalThis.window = undefined;

  try {
    const saver = autoSaveBoard('auto', app, { debounceMs: 500 });
    saver.markDirty();
    t.mock.timers.tick(500);
    saver.flush();
    saver.stop();
    saver.markDirty();
    t.mock.timers.tick(500);
  } finally {
    globalThis.window = originalWindow;
    restoreStorage();
  }

  assert.equal(localStorage.getItem(`${SANDBOX_KEY_PREFIX}auto`), null);
});
