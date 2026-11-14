/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The extension contract: `blit.use()` names traits and ports, a trait runs
 * once per indexed blit and is cleaned up when the blit leaves the frame, a
 * named trait or port round-trips through `spec`, and nothing is registered
 * until it is asked for.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { detach, park, unpark } from '../../plugins/park.js';
import { stateOf } from 'cloudcanvas/kernel';
import { setLogSink } from 'cloudcanvas/log';
import { resetDocument } from '../helpers/dom.js';
import { coreScene } from '../helpers/core-scene.js';

const { blit } = core;

/** A root over a fresh host. */
function scene(t) {
  const host = document.createElement('div');
  host.id = 'app';
  document.body.appendChild(host);
  t.after(resetDocument);
  const app = blit('#app');
  return { host, app, root: stateOf(host).root };
}

/** A trait that records its runs and cleanups. */
function probe() {
  const log = [];
  const trait = (b, opts, root) => {
    log.push(['run', b, opts, root]);
    return () => log.push(['cleanup', b]);
  };
  return { trait, log };
}

test('core exports exactly blit and type; use is a property of blit', () => {
  assert.deepEqual(Object.keys(core).sort(), ['blit', 'type']);
  assert.equal(typeof blit.use, 'function');
});

test('use - the same name with the same function is a no-op, another function throws', () => {
  const one = () => {};
  const two = () => {};
  blit.use({ useProbeA: one });
  assert.doesNotThrow(() => blit.use({ useProbeA: one }));
  assert.throws(() => blit.use({ useProbeA: two }), /"useProbeA" is already in use/);
  assert.throws(() => blit.use({ useProbeB: 'nope' }), /is not a function/);
  assert.throws(() => blit.use(null), /expected \{name: fn\}/);
});

test('with - an anonymous trait runs once when the blit is indexed, with the root', (t) => {
  const { app, root } = scene(t);
  const { trait, log } = probe();

  const card = app.blit({ x: 1, y: 2, with: [trait] });
  assert.equal(log.length, 1);
  assert.equal(log[0][1], card);
  assert.equal(log[0][2], true);
  assert.equal(log[0][3], root);

  card.set({ x: 5 });
  runFrame(root, 1);
  assert.equal(log.length, 1, 'a trait ran again for a blit already indexed');
});

test('named - `drag: true` and `drag: {opts}` resolve through use(), and false stops the trait', (t) => {
  const { app } = scene(t);
  const { trait, log } = probe();
  blit.use({ useDrag: trait });

  const flagged = app.blit({ useDrag: true });
  const configured = app.blit({ useDrag: { axis: 'x' } });
  assert.equal(flagged.el.getAttribute('data-use-drag'), '');
  assert.deepEqual(log.map((entry) => entry[2]), [true, { axis: 'x' }]);

  flagged.set({ useDrag: false });
  assert.equal(flagged.el.hasAttribute('data-use-drag'), false);
  assert.deepEqual(log.at(-1), ['cleanup', flagged]);

  // New options restart the trait.
  configured.set({ useDrag: { axis: 'y' } });
  assert.deepEqual(log.slice(-2).map((entry) => entry[0]), ['cleanup', 'run']);
  assert.deepEqual(log.at(-1)[2], { axis: 'y' });
});

test('html - `data-name` on a [data-blit] element resolves the same way, on scan and on adoption', (t) => {
  const { trait, log } = probe();
  blit.use({ useAuthored: trait });

  const host = document.createElement('div');
  host.id = 'app';
  host.innerHTML = '<div id="a" data-blit data-use-authored></div>';
  document.body.appendChild(host);
  t.after(resetDocument);

  const app = blit('#app');
  assert.equal(log.length, 1, 'the scanned element did not get its trait');
  assert.equal(log[0][1].el.id, 'a');

  const late = document.createElement('div');
  late.setAttribute('data-blit', '');
  late.setAttribute('data-use-authored', '{"k":1}');
  app.el.querySelector('[data-blit-plane]').appendChild(late);
  blit(late);
  assert.equal(log.length, 2);
  assert.deepEqual(log[1][2], { k: 1 });
});

test('late use() upgrades the elements already declaring the name under live roots', (t) => {
  const { app } = scene(t);
  const { trait, log } = probe();

  const card = app.blit({ useLate: true, x: 1 });
  assert.equal(card.el.getAttribute('data-use-late'), 'true');
  assert.equal(log.length, 0);

  blit.use({ useLate: trait });
  assert.equal(log.length, 1);
  assert.equal(log[0][1], card);
  assert.equal(log[0][2], true);
  blit.use({ useLate: trait });
  assert.equal(log.length, 1, 'a repeated use() re-ran the trait');
});

test('cleanup - remove, park-out and detach clean up, and unpark re-runs, the whole subtree', (t) => {
  const { app } = scene(t);
  const { trait, log } = probe();

  const outer = app.blit({ with: [trait] });
  const inner = outer.blit({ with: [trait] });
  assert.equal(log.length, 2);

  park(stateOf(outer.el));
  assert.deepEqual(log.slice(2).map((entry) => [entry[0], entry[1]]), [['cleanup', outer], ['cleanup', inner]]);
  unpark(stateOf(outer.el));
  assert.deepEqual(log.slice(4).map((entry) => [entry[0], entry[1]]), [['run', outer], ['run', inner]]);

  detach(stateOf(inner.el));
  assert.deepEqual(log.at(-1), ['cleanup', inner]);

  outer.remove();
  assert.deepEqual(log.at(-1), ['cleanup', outer]);
  assert.equal(log.length, 8);
});

test('spec - named traits and ports round-trip; anonymous ones are omitted with a warning', (t) => {
  const { app } = scene(t);
  const records = [];
  const previous = setLogSink((record) => records.push(record), { level: 'warn' });
  t.after(() => setLogSink(previous));

  const named = () => {};
  const anonymous = () => {};
  const port = () => {};
  blit.use({ useNamed: named, usePort: port });

  const card = app.blit({ x: 3, y: 4, with: [named, anonymous], useOther: { n: 1 }, port: 'usePort' });
  blit.use({ useOther: () => {} });
  const spec = card.spec;

  assert.equal(spec.useNamed, true);
  assert.deepEqual(spec.useOther, { n: 1 });
  assert.equal(spec.port, 'usePort');
  assert.equal(stateOf(card.el).port, port);
  assert.equal(records.length, 1);
  assert.match(records[0].message, /anonymous trait is not serialised/);

  card.set({ port: anonymous });
  card.spec;
  assert.match(records.at(-1).message, /anonymous port is not serialised/);
  assert.throws(() => card.set({ port: 'useUnknown' }), /no port named "useUnknown"/);

  const copy = app.blit(spec);
  assert.equal(copy.el.getAttribute('data-use-other'), '{"n":1}');
  assert.equal(copy.el.getAttribute('data-use-named'), '');
  assert.equal(stateOf(copy.el).port, port);
});

test('use - a name must round-trip through data-* and not be a key the core routes', () => {
  for (const name of ['Drag', 'drag-x', 'x', 'fill', 'port', 'with', 'type', 'blit']) {
    assert.throws(() => blit.use({ [name]: () => {} }), /cannot be a name/, name);
  }
});

test('with - must be functions; a function dropped from the list stops, the rest keep running', (t) => {
  const { app } = scene(t);
  const one = probe();
  const two = probe();
  const card = app.blit({ with: [one.trait, two.trait] });

  assert.throws(() => card.set({ with: ['drag'] }), /with must be an array of functions/);
  card.set({ with: [two.trait] });
  assert.deepEqual(one.log.map((entry) => entry[0]), ['run', 'cleanup']);
  assert.deepEqual(two.log.map((entry) => entry[0]), ['run']);
  card.set({ with: null });
  assert.deepEqual(two.log.map((entry) => entry[0]), ['run', 'cleanup']);
});

test('run - a trait that writes its own blit runs once; one that throws is not left marked running', (t) => {
  const { app } = scene(t);
  let runs = 0;
  const writer = (b) => { runs += 1; b.set({ x: 9, note: 'set by the trait' }); };
  const card = app.blit({ with: [writer] });
  assert.equal(runs, 1);
  assert.equal(card.el.getAttribute('data-note'), 'set by the trait');

  let fail = true;
  const flaky = () => { if (fail) throw new Error('trait failed'); };
  assert.throws(() => card.set({ with: [writer, flaky] }), /trait failed/);
  fail = false;
  card.set({ x: 1 });
  assert.equal(stateOf(card.el).cleanups.has(flaky), true, 'a trait that threw was never retried');
});

test('root - a name on the host runs on mount and on a late use(), like any blit', (t) => {
  const { trait, log } = probe();
  blit.use({ useHostEarly: trait });
  const host = document.createElement('div');
  host.id = 'app';
  host.setAttribute('data-use-host-early', '');
  host.setAttribute('data-use-host-late', '');
  document.body.appendChild(host);
  t.after(resetDocument);

  const app = blit('#app');
  assert.deepEqual(log.map((entry) => [entry[0], entry[1]]), [['run', app]]);
  blit.use({ useHostLate: trait });
  assert.deepEqual(log.map((entry) => [entry[0], entry[1]]), [['run', app], ['run', app]]);
});

test('use - a named trait that refuses its value takes that value off: the blit stays writable', (t) => {
  const picky = (_b, options) => { if (options !== true) throw new TypeError('picky: no options'); };
  blit.use({ picky });
  const { app } = coreScene(t);
  const card = app.blit({ id: 'c' });
  assert.throws(() => card.set({ picky: { nope: 1 } }), /picky/);
  assert.equal(card.el.hasAttribute('data-picky'), false, 'the refused value stayed on the element');
  assert.doesNotThrow(() => card.set({ x: 50 }));
  assert.equal(card.x, 50);
});

test('use - a cleanup that throws is logged; removal and the other cleanups still happen', (t) => {
  let cleaned = false;
  blit.use({ brittle: () => () => { throw new Error('brittle'); }, tidy: () => () => { cleaned = true; } });
  const { app } = coreScene(t);
  const card = app.blit({ id: 'd', brittle: true, tidy: true });
  const errors = [];
  t.mock.method(console, 'error', (...args) => errors.push(args));
  assert.doesNotThrow(() => card.remove());
  assert.equal(card.el.isConnected, false);
  assert.equal(cleaned, true);
  assert.equal(app.find('d'), null);
});
