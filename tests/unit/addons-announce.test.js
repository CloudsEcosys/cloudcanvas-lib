/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The announce add-on on a core root, no bridge: one polite live region, taken
 * away by `off`; the focus add-on's changes, `edit` and `announce` events are
 * said as they bubble; a focus that moves is not said as cleared on the way; a
 * root change is said on the next frame; a repeat is nudged so it is heard.
 * The nudge and single-region cases ported from `announcer.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { LIVE_REGION_CLASS, announce } from '../../plugins/announce.js';
import { focus } from '../../plugins/focus.js';
import { coreScene, press, release } from '../helpers/core-scene.js';

blit.use({ announce, focus });

/** A root announcing, and its region. */
function announceScene(t) {
  const scene = coreScene(t);
  scene.app.set({ announce: true });
  t.after(() => scene.app.set({ announce: false }));
  return { ...scene, region: scene.host.querySelector(`.${LIVE_REGION_CLASS}`) };
}

function click(b) {
  press(b.el, 10, 10);
  release(10, 10);
}

test('announce - one polite region, visually hidden inline, removed by off', (t) => {
  const { app, host } = coreScene(t);
  const off = announce(app);
  const region = host.querySelector(`.${LIVE_REGION_CLASS}`);

  assert.equal(region.getAttribute('role'), 'status');
  assert.equal(region.getAttribute('aria-live'), 'polite');
  assert.match(region.getAttribute('style'), /position:absolute/);
  off();
  assert.equal(host.querySelector(`.${LIVE_REGION_CLASS}`), null);
});

test('announce - focus is said by name; a moved focus is not said as cleared; a dropped one is', async (t) => {
  const { app, region } = announceScene(t);
  const a = app.blit({ w: 10, h: 10, focus: { focusOnClick: true } });
  const b = app.blit({ x: 50, w: 10, h: 10, focus: { focusOnClick: true } });
  a.el.setAttribute('aria-label', 'Alpha');
  b.el.id = 'beta';

  const said = [];
  const observer = new MutationObserver((records) => {
    for (const record of records) said.push(...Array.from(record.addedNodes, (node) => node.textContent));
  });
  observer.observe(region, { childList: true });
  t.after(() => observer.disconnect());

  click(a);
  click(b);
  b.set({ focus: false });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(said, ['Focused Alpha', 'Focused beta', 'Focus cleared']);
});

test('announce - edit and announce events are said; a repeat is nudged', (t) => {
  const { app, region } = announceScene(t);
  const note = app.blit({ w: 10, h: 10 });
  note.el.dataset.title = 'Notes';

  note.emit('edit', true);
  assert.equal(region.textContent, 'Editing Notes');
  note.emit('edit', false);
  assert.equal(region.textContent, 'Finished editing Notes');

  app.emit('announce', 'Saved');
  app.emit('announce', 'Saved');
  assert.equal(region.textContent, 'Saved ');
  app.emit('announce', '   ');
  assert.equal(region.textContent, 'Saved ', 'nothing to say cleared the region');
});

test('announce - a root change is said on the next frame', (t) => {
  const { app, host, root, region } = announceScene(t);
  const room = app.blit({ w: 10, h: 10 });
  room.el.id = 'kitchen';

  app.root = room;
  runFrame(root, 1);
  assert.equal(region.textContent, 'Viewing kitchen');
  app.root = null;
  runFrame(root, 1);
  assert.equal(region.textContent, 'Viewing the whole canvas');
  assert.equal(host.querySelectorAll(`.${LIVE_REGION_CLASS}`).length, 1);
});

test('announce - a third repeat takes the nudge off again; restarting the trait leaves one region', (t) => {
  const { app, host } = announceScene(t);
  const region = () => host.querySelector(`.${LIVE_REGION_CLASS}`);
  for (let i = 0; i < 3; i += 1) app.emit('announce', 'Focused Alpha');
  assert.equal(region().textContent, 'Focused Alpha');

  app.set({ announce: true });
  app.set({ announce: true });
  assert.equal(host.querySelectorAll(`.${LIVE_REGION_CLASS}`).length, 1, 'a restart left two regions');
  assert.equal(region().getAttribute('aria-atomic'), 'true');
});

test('announce - the lazy add-on\'s loads and failures are said', (t) => {
  const { app, region } = announceScene(t);
  const folder = app.blit({ id: 'folder' });
  folder.el.setAttribute('aria-label', 'Folder');
  folder.emit('children:load', [1, 2, 3]);
  assert.match(region.textContent, /3 items loaded in Folder/);
  folder.emit('children:error', { error: new Error('offline') });
  assert.match(region.textContent, /Failed to load Folder/);
});

test('announce - a widget is named by the title in its contents', (t) => {
  const { app, region } = announceScene(t);
  const card = app.blit({ id: 'card_7' });
  card.el.setAttribute('data-type', 'note');
  card.el.setAttribute('data-note', JSON.stringify({ title: 'Quarterly revenue' }));
  card.emit('focus:change', true);
  assert.match(region.textContent, /Focused Quarterly revenue/);
});
