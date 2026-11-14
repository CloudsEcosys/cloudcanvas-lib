/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Unit tests for the board serializer: the v2 document it writes, and the
 * round-trip back onto a live board. The loader's security rules are in
 * `lib-sandbox-security.test.js`, the localStorage layer in
 * `lib-sandbox-persistence.test.js`, v1 migration in `lib-sandbox-migrate.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { stateOf } from 'cloudcanvas/kernel';
import { reorder } from '../../plugins/layout.js';
import { getStyle, setStyle } from '../../plugins/style.js';
import { contentOf } from '../../plugins/widget.js';
import { gpu } from '../../plugins/gpu.js';
import { mesh } from '../../plugins/mesh.js';
import { svgPath } from '../../plugins/svg-path.js';
import { LIGHT_THEME, applyTheme } from 'cloudcanvas/theme';
import { SANDBOX_FORMAT_VERSION, deserializeBoard, serializeBlit, serializeBoard } from '../../sandbox/serialize.js';
import { allBlits, clearBoard, retype } from '../../sandbox/board.js';
import { resetDocument } from '../helpers/dom.js';
import { buildTree, freshBoard } from '../helpers/sandbox-tree.js';

test.afterEach(resetDocument);

const frame = (app) => runFrame(stateOf(app.el).root, 1);

/* ------------------ SERIALIZE ------------------ */

test('board serialize - captures the declared shape of every blit in the tree', () => {
  const app = freshBoard();
  buildTree(app);

  const snapshot = serializeBoard(app);
  assert.equal(snapshot.version, SANDBOX_FORMAT_VERSION);
  assert.deepEqual(snapshot.blits.map((node) => node.id), ['sandbox_root', 'sandbox_sibling']);

  const root = snapshot.blits[0];
  assert.deepEqual({ x: root.x, y: root.y, z: root.z, type: root.type }, { x: 10, y: 20, z: 1, type: 'card' });
  assert.equal('chrome' in root, false, 'a default card surface was written');
  assert.deepEqual(root.fill, { title: 'Root', body: 'top of the tree' });
  assert.deepEqual([root.drag, root.select, 'card' in root], [true, true, false], 'the contents key is not a trait');

  const child = root.blits[0];
  assert.deepEqual([child.id, child.type, child.chrome, child.focus], ['sandbox_child', 'raw', false, true]);
  assert.deepEqual(child.fill, { html: '<b>nested</b>' });

  const grandchild = child.blits[0];
  assert.equal(grandchild.selectableText, true);
  assert.equal('drag' in grandchild, false);
  assert.deepEqual(grandchild.fill, { angle: 30, magnitude: 3 });

  const sibling = snapshot.blits[1];
  assert.deepEqual([sibling.type, sibling.drag, 'select' in sibling, sibling.bordered], ['media', true, false, false]);
});

test('board serialize - the overlay and the cursors are machinery, and never appear', () => {
  const app = freshBoard();
  app.blit({ id: 'only', x: 0, y: 0 });
  frame(app);
  assert.deepEqual(serializeBoard(app).blits.map((node) => node.id), ['only']);
});

test('board serialize - round-trips onto a fresh board field for field', () => {
  const source = freshBoard();
  buildTree(source);
  const snapshot = serializeBoard(source);

  const target = freshBoard();
  const { blits, warnings } = deserializeBoard(target, snapshot);
  assert.deepEqual(warnings, []);
  assert.deepEqual(blits.map((b) => b.el.id), ['sandbox_root', 'sandbox_sibling']);
  assert.deepEqual(serializeBoard(target), snapshot);
});

test('board serialize - the rebuilt blits are live, parented, and carry their traits and contents', () => {
  const source = freshBoard();
  buildTree(source);
  const target = freshBoard();
  deserializeBoard(target, serializeBoard(source));

  const child = target.find('sandbox_child');
  assert.equal(child.parent.el.id, 'sandbox_root');
  assert.equal(child.spec.focus, true);
  assert.equal(child.el.getAttribute('data-chrome'), 'false');
  assert.equal(child.el.querySelector('b').textContent, 'nested');
  assert.equal(target.find('sandbox_grandchild').parent, child);
  assert.deepEqual(contentOf(target.find('sandbox_root')), { title: 'Root', body: 'top of the tree' });
  assert.equal(target.find('sandbox_sibling').el.getAttribute('data-bordered'), 'false');
});

test('board serialize - an explicit card surface round-trips on a type that is chromeless by default', () => {
  const source = freshBoard();
  source.blit({ id: 'dressed', x: 0, y: 0, type: 'raw', chrome: true });
  source.blit({ id: 'bare', x: 0, y: 0, type: 'raw' });

  const snapshot = serializeBoard(source);
  assert.equal(snapshot.blits[0].chrome, true, 'chrome: true was not saved');
  assert.equal('chrome' in snapshot.blits[1], false, 'a blit declaring no surface saved one');

  const target = freshBoard();
  deserializeBoard(target, snapshot);
  assert.equal(target.find('dressed').el.getAttribute('data-chrome'), 'true');
  assert.equal(target.find('bare').el.hasAttribute('data-chrome'), false);
});

test('board serialize - appearance overrides round-trip, and are omitted when none', () => {
  const source = freshBoard();
  const styled = source.blit({ id: 'styled', type: 'card', card: { title: 'S' } });
  source.blit({ id: 'plain', type: 'card', card: { title: 'P' } });
  setStyle(styled, 'border-radius', '18px');
  setStyle(styled, 'box-shadow', 'inset 0 2px 4px rgba(0, 0, 0, 0.45)');

  const snapshot = serializeBoard(source);
  assert.deepEqual(snapshot.blits[0].style, { 'border-radius': '18px', 'box-shadow': 'inset 0 2px 4px rgba(0, 0, 0, 0.45)' });
  assert.equal('style' in snapshot.blits[1], false);

  const target = freshBoard();
  assert.deepEqual(deserializeBoard(target, snapshot).warnings, []);
  assert.equal(getStyle(target.find('styled'), 'border-radius'), '18px');
  assert.deepEqual(serializeBoard(target), snapshot);
});

test('board serialize - a hand-edited style map is re-validated on restore', () => {
  const target = freshBoard();
  deserializeBoard(target, { version: 2, blits: [{ id: 't', x: 0, y: 0, style: { 'border-radius': '6px', position: 'fixed' } }] });
  const restored = target.find('t');
  assert.equal(getStyle(restored, 'border-radius'), '6px');
  assert.equal(restored.el.style.getPropertyValue('position'), '');
});

test('board serialize - an order change among children, and among top-level blits, survives a reload', () => {
  const source = freshBoard();
  const box = source.blit({ id: 'zbox', type: 'card' });
  const a = box.blit({ id: 'z_a' });
  box.blit({ id: 'z_b' });
  const c = box.blit({ id: 'z_c' });
  const top = source.blit({ id: 'top' });
  reorder(a, null);
  reorder(c, box.blits[0]);
  reorder(top, box);
  assert.deepEqual(box.blits.map((b) => b.el.id), ['z_c', 'z_b', 'z_a']);

  const snapshot = serializeBoard(source);
  assert.deepEqual(snapshot.blits.map((node) => node.id), ['top', 'zbox']);
  assert.deepEqual(snapshot.blits[1].blits.map((node) => node.id), ['z_c', 'z_b', 'z_a']);

  const target = freshBoard();
  deserializeBoard(target, snapshot);
  assert.deepEqual(target.find('zbox').blits.map((b) => b.el.id), ['z_c', 'z_b', 'z_a']);
  assert.deepEqual(serializeBoard(target), snapshot);
});

test('board serialize - a container\'s layout and gap round-trip, flowing its children again', () => {
  const source = freshBoard();
  const row = source.blit({ id: 'row_box', type: 'card', layout: 'row', gap: 12 });
  row.blit({ id: 'row_a', x: 3, y: 4 });
  frame(source);

  const snapshot = serializeBoard(source);
  assert.deepEqual({ layout: snapshot.blits[0].layout, gap: snapshot.blits[0].gap }, { layout: 'row', gap: 12 });

  const target = freshBoard();
  deserializeBoard(target, snapshot);
  frame(target);
  assert.ok(target.find('row_a').el.classList.contains('is-flow-child'));
  assert.deepEqual(serializeBoard(target), snapshot);
});

test('board serialize - the theme is read off the host and applied on restore; none clears it', () => {
  const source = freshBoard();
  applyTheme(source.el, LIGHT_THEME);
  const snapshot = serializeBoard(source);
  assert.equal(snapshot.theme['--cc-bg'], LIGHT_THEME['--cc-bg']);

  const target = freshBoard();
  deserializeBoard(target, snapshot);
  assert.equal(target.el.style.getPropertyValue('--cc-bg'), LIGHT_THEME['--cc-bg']);
  deserializeBoard(target, { version: 2, blits: [] });
  assert.equal(target.el.style.getPropertyValue('--cc-bg'), '');
  assert.equal('theme' in serializeBoard(freshBoard()), false);
});

test('board serialize - legacy trait names load under their blit names; reload is skipped', () => {
  const target = freshBoard();
  const { warnings } = deserializeBoard(target, {
    version: 2,
    blits: [{ id: 'old', x: 1, y: 2, type: 'card', fill: { title: 'T' }, draggable: true, selectable: true, resizable: true, focussable: true, scope: true, reload: 'persistent' }]
  });
  assert.deepEqual(warnings, []);
  const node = serializeBoard(target).blits[0];
  assert.deepEqual([node.drag, node.select, node.resize, node.focus, 'reload' in node], [true, true, true, true, false]);
});

test('board serialize - an unknown trait, type or bad value warns and is skipped, never thrown', () => {
  const target = freshBoard();
  const { blits, warnings } = deserializeBoard(target, {
    version: 2,
    blits: [
      { id: 'a', x: 0, y: 0, type: 'no-such-type', fill: { title: 'lost' } },
      { id: 'b', x: 0, y: 0, frobnicate: true, layout: 'spiral' }
    ]
  });
  assert.equal(blits.length, 2);
  assert.equal(warnings.length, 4, warnings.join('\n'));
  assert.match(warnings.join('\n'), /type "no-such-type" is not registered/);
  assert.match(warnings.join('\n'), /trait "frobnicate" is not registered/);
  assert.match(warnings.join('\n'), /layout mode "spiral"/);
});

/** A board drawing through `gpu(app)` on a backend that records nothing: the gpu port is registered. */
async function gpuBoard(t) {
  const app = freshBoard();
  const backend = { kind: 'recorder', depthRange: 'minus-one-to-one', texture() {}, dropTexture() {}, mesh() {},
    dropMesh() {}, draw() {}, read: async () => ({}), destroy() {} };
  const controller = gpu(app, { backend: async () => backend });
  t.after(() => controller.destroy());
  await controller.ready;
  blit.use({ mesh, svgPath });
  return app;
}

test('board serialize - a gpu blit keeps its tint through a round trip, a mesh and a filled svgPath alike', async (t) => {
  const app = await gpuBoard(t);
  const at = { y: 10, w: 40, h: 40, port: 'gpu' };
  app.blit({ id: 'box', x: 10, ...at, tint: '#ff0000', mesh: { shape: 'box', rotate: [10, 20, 0] } });
  app.blit({ id: 'path', x: 60, ...at, tint: '#0f0', svgPath: { d: 'M0 0 L10 0 L5 10 Z', fill: true } });
  frame(app);
  const saved = serializeBoard(app);
  assert.deepEqual(saved.blits.map((node) => [node.port, node.tint]), [['gpu', '#ff0000'], ['gpu', '#0f0']]);

  clearBoard(app);
  const { warnings } = deserializeBoard(app, JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(warnings, []);
  assert.equal(app.find('box').el.getAttribute('data-tint'), '#ff0000', 'the mesh came back white');
  assert.equal(app.find('path').el.getAttribute('data-tint'), '#0f0', 'the svgPath came back white');
  assert.deepEqual(serializeBoard(app), saved, 'a reload changed the save');
});

test('board serialize - a tint that is not #rgb, #rrggbb or #rrggbbaa is dropped with a warning; the blit loads', () => {
  const target = freshBoard();
  const hostile = ['red', '#ff00', '#ff0000"><img src=x>', 'url(javascript:alert(1))', 12, { r: 1 }];
  const blits = hostile.map((tint, index) => ({ id: `t${index}`, x: 0, y: 0, tint }));
  blits.push({ id: 'ok', x: 0, y: 0, tint: '#ABCDEF12' });
  const { warnings } = deserializeBoard(target, { version: 2, blits });
  assert.equal(warnings.length, hostile.length, warnings.join('\n'));
  for (const [index] of hostile.entries()) {
    assert.ok(target.find(`t${index}`), `t${index} was not restored`);
    assert.equal(target.find(`t${index}`).el.hasAttribute('data-tint'), false, `t${index} kept a hostile tint`);
    assert.match(warnings[index], new RegExp(`blit "t${index}": dropped tint`));
  }
  assert.equal(target.find('ok').el.getAttribute('data-tint'), '#ABCDEF12');
});

test('board serialize - a port that is not registered is dropped with a warning; the blit loads on the default port', () => {
  const target = freshBoard();
  const hostile = JSON.parse('{"toString": 1}');
  const { blits, warnings } = deserializeBoard(target, { version: 2, blits: [{ id: 'p', x: 3, y: 4, port: 'no-such-port' },
    { id: 'q', x: 0, y: 0, port: hostile }] });
  assert.deepEqual(blits.map((b) => b.el.id), ['p', 'q']);
  assert.deepEqual(blits.map((b) => b.spec.port), [undefined, undefined], 'an unregistered port was kept');
  assert.deepEqual(warnings, ['blit "p": port "no-such-port" is not registered', 'blit "q": dropped port (not a name)']);
});

test('board serialize - a bare root array is accepted as well as a snapshot; a non-root is refused', () => {
  const target = freshBoard();
  const { blits } = deserializeBoard(target, [{ id: 'bare', x: 0, y: 0 }]);
  assert.deepEqual(blits.map((b) => b.el.id), ['bare']);
  assert.throws(() => deserializeBoard({}, { version: 2, blits: [] }), /a root blit is required/);
  assert.throws(() => serializeBoard(null), /a root blit is required/);
});

test('board serialize - an offloaded blit is saved where it sits', () => {
  const app = freshBoard();
  app.blit({ id: 'near' });
  app.blit({ id: 'far', x: 90000, w: 10, h: 10, offload: { margin: 0 } });
  frame(app);
  assert.equal(app.find('far').el.isConnected, false, 'the far blit was not offloaded');
  assert.deepEqual(serializeBoard(app).blits.map((node) => node.id), ['near', 'far']);
});

test('board - allBlits, clearBoard and retype', () => {
  const app = freshBoard();
  buildTree(app);
  assert.deepEqual(allBlits(app).map((b) => b.el.id), ['sandbox_root', 'sandbox_child', 'sandbox_grandchild', 'sandbox_sibling']);

  const child = app.find('sandbox_child');
  const next = retype(child, 'card', { title: 'Now a card' });
  assert.equal(next.el.id, 'sandbox_child');
  assert.equal(next.el.getAttribute('data-type'), 'card');
  assert.equal(app.find('sandbox_grandchild').parent, next, 'the children moved over');
  assert.deepEqual(serializeBlit(next).fill, { title: 'Now a card' });

  assert.equal(clearBoard(app), 2);
  assert.deepEqual(serializeBoard(app).blits, []);
  assert.equal(blit(app.el), app);
});

test('board - an offloaded blit is cleared, walked and restored like any other: undo cannot multiply it', (t) => {
  const app = freshBoard();
  app.blit({ id: 'near' });
  app.blit({ id: 'far', x: 90000, w: 10, h: 10, offload: { margin: 0 } });
  frame(app);
  assert.equal(app.find('far').el.isConnected, false, 'the far blit was not offloaded');
  assert.deepEqual(allBlits(app).map((b) => b.el.id), ['near', 'far']);
  const snapshot = serializeBoard(app);
  assert.equal(clearBoard(app), 2);
  assert.deepEqual(serializeBoard(app).blits, []);
  deserializeBoard(app, snapshot);
  frame(app);
  clearBoard(app);
  deserializeBoard(app, snapshot);
  assert.deepEqual(serializeBoard(app).blits.map((node) => node.id), ['near', 'far']);
});

test('board serialize - an id or a type that is not text cannot make a warning throw; the rest loads', () => {
  const target = freshBoard();
  const hostile = { toString: 1, valueOf: 1 };
  const { warnings } = deserializeBoard(target, {
    version: 2,
    blits: [
      { id: hostile, x: 0, y: 0, type: 'no-such-type' },
      { id: 'typed', x: 0, y: 0, type: hostile },
      { id: 'after', x: 0, y: 0 }
    ]
  });
  assert.ok(target.find('typed'), 'a blit with a hostile type still loads, untyped');
  assert.ok(target.find('after'), 'and restoring goes on');
  assert.ok(warnings.some((warning) => /blit "undefined": type "no-such-type"/.test(warning)));
  assert.ok(warnings.some((warning) => /blit "typed": type is not a name/.test(warning)));
});
