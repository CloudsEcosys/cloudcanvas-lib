/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The connect add-on on core blits, no bridge: one group per root in the
 * plane's SVG layer, one keyed path per connection drawn in the write phase,
 * following its target, dropping it when the target leaves, and taking the
 * group and its pass with the last source. The write-gate cases ported from
 * `svg-groups.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { SVG_LAYER_ATTR, connect } from '../../plugins/connect.js';
import { edgeConnectorPathData } from 'cloudcanvas/primitives';
import { coreScene } from '../helpers/core-scene.js';

blit.use({ connect });

const HTML = '<div id="a" data-blit data-x="0" data-y="0" data-w="100" data-h="50"'
  + ' data-connect=\'{"connections":["b"],"dashed":false}\'></div>'
  + '<div id="b" data-blit data-x="200" data-y="0" data-w="100" data-h="50"></div>';

test('connect - a connector from edge to edge, drawn in the write phase', (t) => {
  const { host, root } = coreScene(t, HTML);
  const group = host.querySelector(`[data-blit-plane] > svg[${SVG_LAYER_ATTR}] > g[data-trait="connectable"]`);
  assert.ok(group, 'no group on the plane layer');
  assert.equal(group.querySelector('path'), null, 'drew before the write phase');

  runFrame(root, 1);
  const path = group.querySelector('path');
  assert.match(path.getAttribute('d'), /^M 100\.0 25\.0 C/, 'it leaves the right face, toward its target');
  assert.equal(path.getAttribute('stroke-dasharray'), 'none');
  assert.match(path.getAttribute('stroke'), /--cc-connector/);
});

test('connect - the connector follows its target and goes with it', (t) => {
  const { host, root } = coreScene(t, HTML);
  runFrame(root, 1);
  const path = host.querySelector('g[data-trait="connectable"] path');
  const first = path.getAttribute('d');

  blit('#b').set({ x: 300 });
  runFrame(root, 1);
  assert.notEqual(path.getAttribute('d'), first);
  assert.equal(host.querySelectorAll('g[data-trait="connectable"] path').length, 1, 'the path was not reused');

  blit('#b').remove();
  runFrame(root, 1);
  assert.equal(host.querySelectorAll('g[data-trait="connectable"] path').length, 0);
});

test('connect - the last source out takes the group and its pass', (t) => {
  const { host, root } = coreScene(t, HTML);
  const passes = root.hooks.write.size;
  blit('#a').set({ connect: false });
  assert.equal(host.querySelector('g[data-trait="connectable"]'), null);
  assert.equal(root.hooks.write.size, passes - 1);
});

test('connect - routes edge to edge: out of the face nearest the target, on the dominant axis', () => {
  const box = (x, y, w, h) => ({ minX: x, minY: y, maxX: x + w, maxY: y + h, centerX: x + w / 2, centerY: y + h / 2 });
  assert.equal(edgeConnectorPathData(box(0, 0, 100, 50), box(300, 0, 100, 50)),
    'M 100.0 25.0 C 220.0 25.0, 180.0 25.0, 300.0 25.0');
  assert.equal(edgeConnectorPathData(box(0, 300, 100, 50), box(0, 0, 100, 50)),
    'M 50.0 300.0 C 50.0 180.0, 50.0 170.0, 50.0 50.0');
  assert.equal(edgeConnectorPathData(box(0, 0, 10, 10), box(20, 0, 10, 10)),
    'M 10.0 5.0 C 50.0 5.0, -20.0 5.0, 20.0 5.0', 'the push is at least 40px');
});

test('connect - an idle frame, a camera move or an unrelated blit writes nothing; an ancestor move or a resized target redraws', (t) => {
  const { app, host, root } = coreScene(t);
  const parent = app.blit({ id: 'parent', x: 50, y: 50, w: 100, h: 100 });
  parent.blit({ id: 'nested', x: 10, y: 10, w: 20, h: 20, connect: { connections: ['far'] } });
  const far = app.blit({ id: 'far', x: 900, y: 900, w: 40, h: 40 });
  const unrelated = app.blit({ id: 'unrelated', x: 400, y: 0, w: 10, h: 10 });
  runFrame(root, 1);
  const path = host.querySelector('g[data-trait="connectable"] path');
  const writes = [];
  const setAttribute = path.setAttribute.bind(path);
  path.setAttribute = (name, value) => { writes.push(name); setAttribute(name, value); };

  for (let i = 0; i < 5; i += 1) runFrame(root, 1);
  root.camera.panBy(120, -60);
  unrelated.set({ x: 720 });
  runFrame(root, 1);
  assert.deepEqual(writes, [], 'a frame with nothing of its own moving rewrote the connector');

  parent.set({ x: 300, y: 400 });
  runFrame(root, 1);
  assert.deepEqual(writes, ['d'], 'an ancestor move left the connector stale');
  far.set({ h: 400 });
  runFrame(root, 1);
  assert.deepEqual(writes, ['d', 'd'], 'a resized target left the connector stale');
  assert.equal(host.querySelector('g[data-trait="connectable"] path'), path, 'the path node was replaced');
});
