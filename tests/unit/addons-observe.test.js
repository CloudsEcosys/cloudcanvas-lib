/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The observe add-on: `[data-blit]` elements added by plain DOM calls join the
 * root (indexed, named traits running), removed ones are released, a move or a
 * park is neither, ids are re-indexed, and disconnecting stops it cleanly.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { stateOf } from 'cloudcanvas/kernel';
import { observe } from '../../plugins/observe.js';
import { park, unpark } from '../../plugins/park.js';
import { coreScene } from '../helpers/core-scene.js';

/** Every start and stop of the `mark` trait, by element id. */
const log = [];
blit.use({
  mark: (b) => {
    log.push(`start:${b.el.id}`);
    return () => log.push(`stop:${b.el.id}`);
  },
  observe
});

/** Let the observer's microtask batch run. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

function card(id, extra = '') {
  const element = document.createElement('div');
  element.innerHTML = `<div data-blit data-mark id="${id}" ${extra}></div>`;
  return element.firstElementChild;
}

function scene(t) {
  log.length = 0;
  const found = coreScene(t);
  const off = observe(found.app);
  t.after(off);
  return { ...found, off };
}

test('observe - an appended [data-blit] joins: indexed, placed on the plane, its named traits running', async (t) => {
  const { app, root, host } = scene(t);
  const element = card('added', 'data-x="40"');
  host.appendChild(element);
  assert.equal(stateOf(element), undefined, 'nothing happens until the batch settles');

  await settled();
  assert.equal(app.find('added').el, element);
  assert.equal(element.parentElement, root.plane);
  assert.equal(blit(element).x, 40);
  assert.deepEqual(log, ['start:added']);
});

test('observe - innerHTML adopts nested blits ancestors first, and releases what it replaced', async (t) => {
  const { app, root } = scene(t);
  const outer = app.blit({});
  outer.el.innerHTML = '<div data-blit data-mark id="parent"><div data-blit data-mark id="child"></div></div>';
  await settled();
  assert.deepEqual(log, ['start:parent', 'start:child']);
  assert.equal(app.find('child').parent, app.find('parent'));

  outer.el.innerHTML = '';
  await settled();
  assert.deepEqual(log.slice(2).sort(), ['stop:child', 'stop:parent']);
  assert.equal(root.ids.has('parent') || root.ids.has('child'), false);
  assert.equal(app.find('parent'), null);
});

test('observe - a move inside the root is not a removal, and one batch settles once', async (t) => {
  const { app, host } = scene(t);
  const element = card('mover');
  const other = app.blit({});
  host.appendChild(element);
  other.el.appendChild(element);
  element.remove();
  other.el.appendChild(element);
  await settled();
  assert.deepEqual(log, ['start:mover'], 'three mutations, one join');

  app.blit({}).el.appendChild(element);
  await settled();
  assert.deepEqual(log, ['start:mover']);
  assert.equal(app.find('mover').el, element);
});

test('observe - a parked blit is not released, and one whose anchor leaves is', async (t) => {
  const { app, root } = scene(t);
  const holder = app.blit({});
  const wrapper = document.createElement('section');
  holder.el.appendChild(wrapper);
  wrapper.appendChild(card('parked'));
  await settled();
  const parked = app.find('parked');

  park(stateOf(parked.el));
  await settled();
  assert.equal(app.find('parked'), parked, 'parked, still indexed');
  unpark(stateOf(parked.el));
  park(stateOf(parked.el));
  await settled();
  assert.equal(root.ids.get('parked'), parked.el);

  wrapper.remove();
  await settled();
  assert.equal(root.ids.has('parked'), false, 'its anchor left inside a plain wrapper');
});

test('observe - a changed id is re-indexed', async (t) => {
  const { app, root } = scene(t);
  const b = app.blit({});
  b.el.id = 'before';
  await settled();
  assert.equal(root.ids.get('before'), b.el);

  b.el.id = 'after';
  await settled();
  assert.equal(root.ids.has('before'), false);
  assert.equal(app.find('after'), b);
});

test('observe - disconnect drops what is pending and settles nothing after', async (t) => {
  const { host, off } = scene(t);
  const pending = card('pending');
  host.appendChild(pending);
  off();
  host.appendChild(card('later'));
  await settled();
  assert.equal(stateOf(pending), undefined);
  assert.deepEqual(log, []);
});

test('observe - as a named trait on the host, and only on a root collection', async (t) => {
  log.length = 0;
  const { app, host } = coreScene(t);
  app.set({ observe: true });
  host.appendChild(card('by-trait'));
  await settled();
  assert.deepEqual(log, ['start:by-trait']);

  app.set({ observe: false });
  host.appendChild(card('ignored'));
  await settled();
  assert.deepEqual(log, ['start:by-trait']);
  assert.throws(() => observe(app.blit({})), /expected a root collection/);
});
