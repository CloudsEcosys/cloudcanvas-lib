/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The reactions add-on: the action registry (validation, coercion, built-ins on
 * blits), the store (validation, lookups, prune, load) and the root trait
 * running bindings from native events.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from 'cloudcanvas';
import {
  ActionRegistry, ReactionStore, SIGNALS, actionRegistry, builtinActions, reactions, reactionsOf
} from '../../plugins/reactions.js';
import { select, setSelected } from '../../plugins/select.js';
import { history } from '../../plugins/history.js';
import { coreScene } from '../helpers/core-scene.js';

blit.use({ reactions, select, history });
builtinActions();
type('rx-card', { html: '<b data-slot="title"></b><i data-slot="count"></i>' });

/** A root with the trait on, and two blits `a` and `b`. */
function scene(t) {
  const { app, root } = coreScene(t);
  app.set({ reactions: true });
  const a = app.blit({ id: 'a', x: 0, y: 0, w: 100, h: 50, select: true });
  const b = app.blit({ id: 'b', type: 'rx-card', x: 200, y: 0, w: 100, h: 50, fill: { title: 'Count: 0' } });
  return { app, root, a, b };
}

const bind = (signal, type, params = {}) => ({ source: 'a', signal, action: { type, target: 'b', params } });

test('actions - a definition is registered, found, and described by its declared params', () => {
  const registry = new ActionRegistry();
  registry.register('ping', { label: 'Ping', params: [{ key: 'n', control: 'number' }], run: () => 'pong' });
  assert.equal(registry.has('ping'), true);
  assert.deepEqual(registry.describe('ping').map((each) => each.key), ['n']);
  assert.throws(() => registry.register('ping', { run() {} }), /already registered/);
  assert.throws(() => registry.register('bad', {}), /requires a run function/);
  assert.throws(() => registry.register('bad', { run() {}, params: [{ key: 'k', control: 'dial' }] }), /unknown control/);
  assert.throws(() => registry.register('bad', { run() {}, params: [{ control: 'text' }] }), /no key/);
});

test('actions - validate coerces by control, requires what is required, drops unknown keys', () => {
  const registry = new ActionRegistry();
  registry.register('x', {
    run: () => {},
    params: [
      { key: 'n', control: 'number' },
      { key: 'on', control: 'checkbox', required: false },
      { key: 'pick', control: 'select', options: [{ value: 'a', label: 'A' }], required: false }
    ]
  });
  assert.deepEqual(registry.validate('x', { n: '4', on: 1, extra: 'no' }), { valid: true, params: { n: 4, on: true } });
  assert.equal(registry.validate('x', {}).valid, false);
  assert.match(registry.validate('x', { n: 'NaN' }).error, /must be a number/);
  assert.match(registry.validate('x', { n: 1, pick: 'b' }).error, /offered values/);
  assert.throws(() => registry.run('nope', null, {}), /unknown action type/);
  let ran = false;
  registry.register('y', { run: () => { ran = true; }, params: [{ key: 'v', control: 'text' }] });
  assert.throws(() => registry.run('y', null, {}), /missing parameter/);
  assert.equal(ran, false, 'invalid params never reach the target');
});

test('actions - the built-ins join once, never on import', () => {
  assert.deepEqual(actionRegistry.list().map((each) => each.type), [
    'set-content', 'set-style', 'toggle-visibility', 'focus', 'increment-counter', 'notify', 'navigate-page'
  ]);
  const fresh = new ActionRegistry();
  builtinActions(fresh);
  builtinActions(fresh);
  assert.equal(fresh.list().length, 7);
});

test('actions - set-content, set-style, toggle-visibility and increment-counter act on the target blit', (t) => {
  const { app, b } = scene(t);
  const context = { app, target: b };
  actionRegistry.run('set-content', b, { key: 'title', value: 'hi' }, context);
  assert.equal(b.spec.fill.title, 'hi');
  assert.throws(() => actionRegistry.run('set-content', b, { key: 'body', value: 'x' }, context), /no slot/);
  actionRegistry.run('set-style', b, { property: 'background-color', value: 'red' }, context);
  assert.equal(b.el.style.backgroundColor, 'red');
  assert.throws(() => actionRegistry.run('set-style', b, { property: 'position', value: 'fixed' }, context), /offered values/);

  assert.equal(actionRegistry.run('toggle-visibility', b, {}, context), true);
  assert.equal(b.el.style.visibility, 'hidden');
  assert.equal(actionRegistry.run('toggle-visibility', b, { mode: 'show' }, context), false);
  assert.equal(b.el.style.visibility, '');
});

test('actions - increment-counter counts in a fill slot and keeps a "Label: n" title in step', (t) => {
  const { app } = coreScene(t);
  const counter = app.blit({ id: 'c', type: 'rx-card', fill: { title: 'Clicks: 0', count: '2' } });
  assert.equal(actionRegistry.run('increment-counter', counter, { key: 'count', step: 3 }, { app }), 5);
  assert.deepEqual(counter.spec.fill, { title: 'Clicks: 5', count: '5' });
});

test('store - validates the signal, the action and both ends', () => {
  const store = new ReactionStore(actionRegistry);
  assert.throws(() => store.add({ signal: 'select', action: { type: 'notify', target: 'b' } }), /source is required/);
  assert.throws(() => store.add({ source: 'a', signal: 'wobble', action: { type: 'notify', target: 'b' } }), /not a signal/);
  assert.throws(() => store.add({ source: 'a', signal: 'select', action: { type: 'notify' } }), /target is required/);
  assert.throws(() => store.add({ source: 'a', signal: 'select', action: { type: 'nope', target: 'b' } }), /unknown action/);
  const stored = store.add(bind('select', 'toggle-visibility'));
  assert.match(stored.id, /^rx_/);
  assert.deepEqual(store.matching('a', 'select'), [stored]);
  assert.deepEqual(store.matching('a', 'drag:end'), []);
  assert.equal(store.references('b'), true);
  assert.ok(SIGNALS.includes('press'));
});

test('store - prune drops every binding with a missing end; load replaces and skips with warnings', () => {
  const store = new ReactionStore(actionRegistry);
  store.add(bind('select', 'toggle-visibility'));
  store.add({ source: 'b', signal: 'select', action: { type: 'toggle-visibility', target: 'c' } });
  assert.equal(store.prune((id) => id !== 'c'), 1);
  assert.equal(store.all().length, 1);

  const warnings = store.load([
    bind('select', 'toggle-visibility'),
    { source: 'gone', signal: 'select', action: { type: 'toggle-visibility', target: 'b' } },
    { source: 'a', signal: 'wobble', action: { type: 'toggle-visibility', target: 'b' } }
  ], { exists: (id) => id !== 'gone' });
  assert.equal(store.all().length, 1);
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /"gone" is gone/);
  assert.deepEqual(JSON.parse(JSON.stringify(store)), store.toJSON());
});

test('trait - a real selection of A runs the bound action on B; other signals do not', (t) => {
  const { app, a, b } = scene(t);
  reactionsOf(app).add(bind('select', 'toggle-visibility', { mode: 'hide' }));
  reactionsOf(app).add(bind('drag:end', 'toggle-visibility', { mode: 'show' }));
  setSelected(a, true);
  assert.equal(b.el.style.visibility, 'hidden');
  setSelected(a, false);
  assert.equal(b.el.style.visibility, 'hidden', 'a deselection is not a select signal');
});

test('trait - press is the native click on the source, nested blits resolving innermost', (t) => {
  const { app, a, b } = scene(t);
  const inner = a.blit({ id: 'inner', w: 10, h: 10 });
  reactionsOf(app).add({ source: 'inner', signal: 'press', action: { type: 'toggle-visibility', target: 'b' } });
  a.el.click();
  assert.equal(b.el.style.visibility, '', 'a press on the outer blit is not the inner one');
  inner.el.click();
  assert.equal(b.el.style.visibility, 'hidden');
});

test('trait - a missing target is a silent no-op, a throwing action is contained, stopping the trait stops it', (t) => {
  const { app, a, b } = scene(t);
  const store = reactionsOf(app);
  store.add(bind('select', 'toggle-visibility'));
  actionRegistry.register('explode', { run: () => { throw new Error('boom'); } });
  t.after(() => actionRegistry.unregister('explode'));
  store.add({ source: 'a', signal: 'select', action: { type: 'explode', target: 'b' } });
  store.add({ source: 'a', signal: 'select', action: { type: 'toggle-visibility', target: 'b' } });
  setSelected(a, true);
  assert.equal(b.el.style.visibility, '', 'both toggles ran around the throwing one');

  b.remove();
  setSelected(a, false);
  assert.doesNotThrow(() => setSelected(a, true));

  app.set({ reactions: false });
  assert.equal(store.all().length, 3, 'the bindings outlive the trait');
});

test('trait - focus frames the target through history, navigate-page finds a page by title', (t) => {
  const { app, a, b } = scene(t);
  app.set({ history: true });
  reactionsOf(app).add(bind('select', 'navigate-page', { page: 'Count: 0' }));
  setSelected(a, true);
  assert.equal(app.root, b, 'the page titled "Count: 0" is promoted');
});

test('actions - set-content refuses the reserved keys: html, prototype keys and cc:', (t) => {
  const { app, b } = scene(t);
  for (const key of ['html', '__proto__', 'cc:typeName']) {
    assert.throws(() => actionRegistry.run('set-content', b, { key, value: '<em id="injected">x</em>' }, { app }), /reserved/);
  }
  assert.equal(b.el.querySelector('#injected') === null, true);
});
