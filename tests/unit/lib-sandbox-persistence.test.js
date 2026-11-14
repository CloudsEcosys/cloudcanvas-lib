/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Unit tests for the sandbox localStorage layer (`.addons/sandbox/persistence.js`):
 * named v2 saves, and the v1 saves real users already hold, which must keep loading.
 *
 * happy-dom supplies a real `localStorage` implementation (verified by the first
 * test below, which reads back through the raw API rather than through the module
 * under test), so nothing here is mocked.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setLogSink } from 'cloudcanvas/log';
import { SANDBOX_FORMAT_VERSION, serializeBoard } from '../../sandbox/serialize.js';
import {
  SANDBOX_KEY_PREFIX,
  deleteSandbox,
  listSandboxKeys,
  loadSandbox,
  saveSandbox
} from '../../sandbox/persistence.js';
import { resetDocument } from '../helpers/dom.js';
import { buildTree, freshBoard } from '../helpers/sandbox-tree.js';

const V1_FIXTURE = new URL('../fixtures/sandbox/export.v1.json', import.meta.url);

test.beforeEach(() => {
  resetDocument();
  for (const key of listSandboxKeys()) deleteSandbox(key);
});


/* ------------------ PERSISTENCE ------------------ */

test('Sandbox persistence - save writes a namespaced key holding the snapshot', () => {
  const app = freshBoard();
  buildTree(app);

  assert.equal(saveSandbox('draft', app), true);

  const raw = localStorage.getItem(`${SANDBOX_KEY_PREFIX}draft`);
  assert.equal(typeof raw, 'string');
  assert.deepEqual(JSON.parse(raw), serializeBoard(app));
});

test('Sandbox persistence - save then load reconstructs the canvas', () => {
  const source = freshBoard();
  buildTree(source);
  saveSandbox('draft', source);

  const target = freshBoard();
  const loaded = loadSandbox('draft', target);

  assert.deepEqual(loaded.warnings, []);
  assert.deepEqual(loaded.blits.map((b) => b.el.id), ['sandbox_root', 'sandbox_sibling']);
  assert.deepEqual(serializeBoard(target), serializeBoard(source));
});

test('Sandbox persistence - list reports saved names, stripped of the namespace', () => {
  const app = freshBoard();
  app.blit({ id: 'p', x: 0, y: 0 });

  saveSandbox('alpha', app);
  saveSandbox('beta', app);
  localStorage.setItem('unrelated-app-key', 'not ours');

  assert.deepEqual(listSandboxKeys().sort(), ['alpha', 'beta']);

  localStorage.removeItem('unrelated-app-key');
});

test('Sandbox persistence - delete removes exactly the one sandbox', () => {
  const app = freshBoard();
  app.blit({ id: 'p', x: 0, y: 0 });
  saveSandbox('alpha', app);
  saveSandbox('beta', app);

  assert.equal(deleteSandbox('alpha'), true);
  assert.deepEqual(listSandboxKeys(), ['beta']);
  assert.equal(loadSandbox('alpha', freshBoard()), null);
});

test('Sandbox persistence - a missing or corrupt key loads as null, not a throw', () => {
  const app = freshBoard();

  assert.equal(loadSandbox('never-saved', app), null);

  localStorage.setItem(`${SANDBOX_KEY_PREFIX}corrupt`, '{ this is not json');
  assert.equal(loadSandbox('corrupt', app), null);

  localStorage.setItem(`${SANDBOX_KEY_PREFIX}scalar`, '42');
  assert.equal(loadSandbox('scalar', app), null);
});

test('Sandbox persistence - an empty key is a programming error, and says so', () => {
  const app = freshBoard();
  assert.throws(() => saveSandbox('', app), TypeError);
  assert.throws(() => deleteSandbox(null), TypeError);
});

/* ------------------ FORMAT VERSIONS ------------------ */

test('Sandbox persistence - a save is always written as v2', () => {
  const app = freshBoard();
  buildTree(app);
  saveSandbox('draft', app);
  assert.equal(JSON.parse(localStorage.getItem(`${SANDBOX_KEY_PREFIX}draft`)).version, SANDBOX_FORMAT_VERSION);
});

test('Sandbox persistence - a real v1 save still loads, and re-saves as v2', () => {
  localStorage.setItem(`${SANDBOX_KEY_PREFIX}legacy`, readFileSync(V1_FIXTURE, 'utf8'));
  const app = freshBoard();
  const loaded = loadSandbox('legacy', app);

  assert.deepEqual(loaded.warnings, []);
  assert.deepEqual(loaded.blits.map((b) => b.el.id), ['x_board', 'x_gauge', 'x_img']);
  assert.equal(app.find('x_pencil').parent.el.id, 'x_board');

  saveSandbox('legacy', app);
  assert.equal(JSON.parse(localStorage.getItem(`${SANDBOX_KEY_PREFIX}legacy`)).version, 2);
});

test('Sandbox persistence - an unknown format version loads as null, reported through the logger', () => {
  const records = [];
  const previous = setLogSink((record) => records.push(record), { level: 'error' });
  try {
    localStorage.setItem(`${SANDBOX_KEY_PREFIX}future`, JSON.stringify({ version: 99, blits: [] }));
    assert.equal(loadSandbox('future', freshBoard()), null);
  } finally {
    setLogSink(previous);
  }
  assert.equal(records.length, 1);
  assert.equal(records[0].level, 'error');
  assert.match(records[0].message, /unsupported format version 99/);
});
