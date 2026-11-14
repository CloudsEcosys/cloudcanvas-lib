/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The keyboard add-on on a core root, no bridge: the host becomes one tab stop
 * with `role="application"` only while the add-on is on (author values kept,
 * everything written taken back), arrows and `+`/`-` drive the camera (a tilted
 * one zooms about the canvas point at the host centre), Enter
 * steps into the blits and arrows rove them in reading order, Enter and Space
 * emit `action`, Escape and Home step the root out, owned keys are left alone.
 * The key table, reading order, Space and reveal cases ported from
 * `keyboard.test.js` (ledger: tests/fixtures/test-ledger.json).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import {
  ENSURE_VISIBLE_MS, KEY_BINDINGS, PAN_SHIFT_MULTIPLIER, PAN_STEP_PX, VISIBILITY_MARGIN_PX, ZOOM_STEP, keyboard,
  keyboardEnv, reveal, sortReadingOrder
} from '../../plugins/keyboard.js';
import { FOCUSED_CLASS } from '../../plugins/focus.js';
import { MotionCamera } from '../../plugins/motion.js';
import { coreScene, signals } from '../helpers/core-scene.js';

blit.use({ keyboard });

const EXACT = 1e-12;

function key(target, name, init = {}) {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

/** A root with the keyboard attached by name, and three cards out of reading order. */
function keyScene(t) {
  const scene = coreScene(t);
  scene.app.set({ keyboard: true });
  t.after(() => scene.app.set({ keyboard: false }));
  const card = (id, x, y) => {
    const b = scene.app.blit({ x, y, w: 100, h: 60 });
    b.el.id = id;
    return b;
  };
  return { ...scene, c: card('c', 0, 200), a: card('a', 0, 0), b: card('b', 300, 0) };
}

test('keyboard - the host is one tab stop with an application role, taken back on off', (t) => {
  const { app, host } = coreScene(t);
  assert.equal(host.hasAttribute('role'), false, 'a root without the add-on claimed application');

  const off = keyboard(app, { label: 'Board' });
  assert.equal(host.getAttribute('tabindex'), '0');
  assert.equal(host.getAttribute('role'), 'application');
  assert.equal(host.getAttribute('aria-roledescription'), 'canvas');
  assert.equal(host.getAttribute('aria-label'), 'Board');

  off();
  for (const name of ['tabindex', 'role', 'aria-roledescription', 'aria-label']) {
    assert.equal(host.hasAttribute(name), false, `${name} outlived the add-on`);
  }
});

test('keyboard - author attributes on the host win, and survive off', (t) => {
  const { app, host } = coreScene(t);
  host.setAttribute('tabindex', '3');
  host.setAttribute('role', 'region');

  keyboard(app)();
  assert.equal(host.getAttribute('tabindex'), '3');
  assert.equal(host.getAttribute('role'), 'region');
});

test('keyboard - arrows pan a step (Shift four), +/- zoom about the host centre', (t) => {
  const { host, root } = keyScene(t);

  assert.equal(key(host, 'ArrowRight').defaultPrevented, true);
  key(host, 'ArrowDown', { shiftKey: true });
  assert.deepEqual([root.camera.x, root.camera.y], [PAN_STEP_PX, PAN_STEP_PX * PAN_SHIFT_MULTIPLIER]);

  root.camera.panTo(0, 0);
  key(host, '+');
  assert.ok(Math.abs(root.camera.scale - ZOOM_STEP) < EXACT);
  // The default host box is 800x600: its centre stays put.
  assert.ok(Math.abs(root.camera.x - (400 - 400 * ZOOM_STEP)) < EXACT);
  key(host, '-');
  assert.ok(Math.abs(root.camera.scale - 1) < EXACT);
});

test('keyboard - on a tilted camera +/- zoom about the canvas point at the host centre; arrows stay a screen nudge', (t) => {
  const { host, root } = keyScene(t);
  Object.assign(root.camera, { perspective: 900, rotateX: 40, rotateY: -20 });
  const rect = root.hostRect;
  const centre = root.camera.unproject(rect.width / 2, rect.height / 2, rect);
  key(host, '+');
  assert.ok(Math.abs(root.camera.scale - ZOOM_STEP) < EXACT);
  const at = root.camera.project(centre.x, centre.y, rect);
  assert.ok(Math.abs(at.x - rect.width / 2) < 1e-6 && Math.abs(at.y - rect.height / 2) < 1e-6, `the centre drifted to (${at.x}, ${at.y})`);

  const [x, y] = [root.camera.x, root.camera.y];
  key(host, 'ArrowRight');
  assert.deepEqual([root.camera.x, root.camera.y], [x + PAN_STEP_PX, y]);
});

test('keyboard - Enter steps into the blits; arrows rove in reading order, wrapping; Escape returns', (t) => {
  const { host, a, b, c } = keyScene(t);
  host.focus();

  key(host, 'Enter');
  assert.equal(document.activeElement, a.el);
  assert.equal(a.el.getAttribute('tabindex'), '-1');
  key(document.activeElement, 'ArrowRight');
  assert.equal(document.activeElement, b.el);
  key(document.activeElement, 'ArrowDown');
  assert.equal(document.activeElement, c.el);
  key(document.activeElement, 'ArrowDown');
  assert.equal(document.activeElement, a.el, 'the order did not wrap');
  key(document.activeElement, 'ArrowUp');
  assert.equal(document.activeElement, c.el);

  key(document.activeElement, 'Escape');
  assert.equal(document.activeElement, host);
});

test('keyboard - Enter on a blit emits action; Space counts only when a listener takes it', (t) => {
  const { host, a } = keyScene(t);
  const actions = signals(a, 'action');
  host.focus();
  key(host, 'Enter');

  assert.equal(key(a.el, 'Enter').defaultPrevented, true);
  assert.equal(key(a.el, ' ').defaultPrevented, false, 'an unclaimed Space was swallowed');
  a.on('action', (event) => event.preventDefault());
  assert.equal(key(a.el, ' ').defaultPrevented, true);
  assert.deepEqual(actions.map((each) => each.payload.key), ['Enter', ' ', ' ']);
});

test('keyboard - Escape steps a promoted root out one level; Home drops it', (t) => {
  const { app, host, a } = keyScene(t);
  const inner = a.blit({ x: 5, y: 5, w: 10, h: 10 });

  app.root = inner;
  key(host, 'Escape');
  assert.equal(app.root.el, a.el);
  key(host, 'Home');
  assert.equal(app.root.el, host);
});

test('keyboard - keys a text field or control owns are left alone', (t) => {
  const { a, root } = keyScene(t);
  const input = document.createElement('input');
  a.el.appendChild(input);

  assert.equal(key(input, 'ArrowRight').defaultPrevented, false);
  assert.equal(key(a.el, 'q').defaultPrevented, false, 'an unbound key was taken');
  assert.deepEqual([root.camera.x, root.camera.y], [0, 0]);
});

/*
 * Written first and seen to fail on a key table that did not know a disclosure: Enter on a focused `<summary>` was
 * taken as the blit's own (focus it) and defaulted away, so its `<details>` never opened from the keyboard.
 *
 *   ✖ keyboard - a <summary> keeps Enter and Space: in a blit, in a focusable row there, and on the host itself
 *     AssertionError [ERR_ASSERTION]: in a blit: Enter on a summary was defaulted away, so its details cannot open
 *     true !== false
 */
test('keyboard - a <summary> keeps Enter and Space: in a blit, in a focusable row there, and on the host itself', (t) => {
  const { host, a, root } = keyScene(t);
  const actions = signals(a, 'action');
  a.on('action', (event) => event.preventDefault());
  const disclosure = (parent) => {
    const details = document.createElement('details');
    const summary = details.appendChild(document.createElement('summary'));
    parent.appendChild(details);
    return summary;
  };
  const row = a.el.appendChild(document.createElement('div'));
  row.setAttribute('tabindex', '0');
  const places = { 'in a blit': disclosure(a.el), 'in a focusable row of a blit': disclosure(row), 'on the host': disclosure(host) };

  for (const [where, summary] of Object.entries(places)) {
    summary.focus();
    assert.equal(key(summary, 'Enter').defaultPrevented, false, `${where}: Enter on a summary was defaulted away, so its details cannot open`);
    assert.equal(key(summary, ' ').defaultPrevented, false, `${where}: Space on a summary was defaulted away`);
    assert.equal(key(summary, 'ArrowRight').defaultPrevented, false, `${where}: a summary's arrow moved the canvas`);
    assert.equal(document.activeElement, summary, `${where}: focus left the summary`);
  }
  assert.deepEqual([actions.length, root.camera.x, root.camera.y], [0, 0, 0], 'no blit acted and the camera did not move');
  assert.equal(key(row, 'Enter').defaultPrevented, true, 'the row around a disclosure is no control: its Enter is still the blit\'s');
  assert.deepEqual(actions.map((each) => each.payload.key), ['Enter']);
});

/* The neighbours of that defect, checked with it and found whole: this passed as written, and records them. */
test('keyboard - contenteditable, a select and its options keep every key, and a plain element inside a blit does not', (t) => {
  const { a, root } = keyScene(t);
  const actions = signals(a, 'action');
  const add = (tag, attrs = {}) => {
    const node = a.el.appendChild(document.createElement(tag));
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    return node;
  };
  const select = add('select');
  const owners = { 'contenteditable': add('div', { contenteditable: 'true' }), 'contenteditable="plaintext-only"': add('div', { contenteditable: 'plaintext-only' }),
    'a paragraph being edited': add('div', { contenteditable: 'true' }).appendChild(document.createElement('p')),
    select, option: select.appendChild(document.createElement('option')), textarea: add('textarea'), button: add('button') };

  for (const [what, node] of Object.entries(owners)) {
    for (const name of ['Enter', ' ', 'ArrowDown', 'Escape']) {
      assert.equal(key(node, name).defaultPrevented, false, `${what} lost ${JSON.stringify(name)} to the canvas`);
    }
  }
  assert.deepEqual([actions.length, root.camera.x, root.camera.y], [0, 0, 0]);
  assert.equal(key(add('span', { tabindex: '0' }), 'Enter').defaultPrevented, true, 'a focusable span owns no key: Enter there is the blit\'s');
});

test('keyboard - roving to an off-screen blit pans it into view at the same scale', (t) => {
  const { app, host, root } = keyScene(t);
  const far = app.blit({ x: 900, y: 40, w: 100, h: 60 });
  far.el.id = 'far';
  host.focus();

  key(host, 'Enter');
  key(document.activeElement, 'ArrowRight');
  const y = root.camera.y;
  key(document.activeElement, 'ArrowRight');
  assert.equal(document.activeElement, far.el);
  // Right edge 1000 plus the margin lands on the 800px edge; y already fitted.
  assert.deepEqual([root.camera.x, root.camera.y, root.camera.scale], [800 - (1000 + VISIBILITY_MARGIN_PX), y, 1]);
});

test('keyboard - the key table is deep-frozen and covers both stages; Enter enters, Space acts', () => {
  assert.ok(Object.isFrozen(KEY_BINDINGS) && Object.isFrozen(KEY_BINDINGS.host) && Object.isFrozen(KEY_BINDINGS.blit));
  assert.ok(Object.isFrozen(KEY_BINDINGS.host.ArrowLeft));
  assert.deepEqual(Object.keys(KEY_BINDINGS.host).sort(),
    ['+', '-', '0', '=', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'Enter', 'Escape', 'Home', '_'].sort());
  assert.deepEqual(Object.keys(KEY_BINDINGS.blit).sort(), [' ', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'Enter', 'Escape'].sort());
  assert.equal(KEY_BINDINGS.blit.Enter.action, 'focus');
  assert.equal(KEY_BINDINGS.blit[' '].action, 'act');
});

test('keyboard - every arrow pans a step its own way and Shift four; = and _ are + and -; 0 re-frames the host', (t) => {
  const { host, root } = keyScene(t);
  for (const [name, dx, dy] of [['ArrowRight', 1, 0], ['ArrowLeft', -1, 0], ['ArrowDown', 0, 1], ['ArrowUp', 0, -1]]) {
    for (const shiftKey of [false, true]) {
      root.camera.panTo(0, 0);
      assert.equal(key(host, name, { shiftKey }).defaultPrevented, true, `${name} was not consumed`);
      const step = PAN_STEP_PX * (shiftKey ? PAN_SHIFT_MULTIPLIER : 1);
      assert.deepEqual([root.camera.x, root.camera.y], [dx * step, dy * step], `${name} shift=${shiftKey}`);
    }
  }
  key(host, '=');
  assert.ok(root.camera.scale > 1);
  key(host, '_');
  assert.ok(Math.abs(root.camera.scale - 1) < EXACT);

  root.camera.panBy(120, 90);
  root.camera.setZoom(2);
  key(host, '0');
  assert.deepEqual([root.camera.x, root.camera.y, root.camera.scale], [0, 0, 1]);
});

test('keyboard - reading order is top to bottom, then left to right, ids breaking ties; hidden blits are skipped', (t) => {
  const box = (minX, minY) => ({ minX, minY, maxX: minX + 10, maxY: minY + 10 });
  assert.deepEqual(sortReadingOrder([
    { target: 'bottom', bounds: box(10, 300), id: 'bottom' },
    { target: 'right', bounds: box(500, 10), id: 'right' },
    { target: 'z-tie', bounds: box(20, 10), id: 'z' },
    { target: 'a-tie', bounds: box(20, 10), id: 'a' }
  ]), ['a-tie', 'z-tie', 'right', 'bottom']);

  const { host, a, b } = keyScene(t);
  b.el.hidden = true;
  host.focus();
  key(host, 'Enter');
  key(document.activeElement, 'ArrowRight');
  assert.equal(document.activeElement.id, 'c', 'a hidden blit took a roving stop');
  assert.notEqual(document.activeElement, a.el);
});

test('keyboard - Enter steps in at the focused blit rather than the first', (t) => {
  const { host, b } = keyScene(t);
  b.el.classList.add(FOCUSED_CLASS);
  host.focus();
  key(host, 'Enter');
  assert.equal(document.activeElement, b.el);
});

test('keyboard - a Space a listener takes goes no further than the blit; at the host stage Space is the page\'s', (t) => {
  const { host, root, a } = keyScene(t);
  a.on('action', (event) => event.preventDefault());
  const above = [];
  const onBody = (event) => { if (event.key === ' ') above.push(event); };
  document.body.addEventListener('keydown', onBody);
  t.after(() => document.body.removeEventListener('keydown', onBody));

  host.focus();
  key(host, 'Enter');
  assert.equal(key(a.el, ' ').defaultPrevented, true);
  assert.equal(above.length, 0, 'a consumed Space kept bubbling past the canvas');

  const before = [root.camera.x, root.camera.y];
  const atHost = key(host, ' ');
  assert.equal(atHost.defaultPrevented, false);
  assert.deepEqual([root.camera.x, root.camera.y, above.length], [...before, 1]);
});

test('keyboard - a button keeps its Space, contenteditable its arrows, and Tab is never taken', (t) => {
  const { host, root, a } = keyScene(t);
  const actions = signals(a, 'action');
  const button = document.createElement('button');
  a.el.appendChild(button);
  host.focus();
  key(host, 'Enter');
  assert.equal(key(button, ' ').defaultPrevented, false);
  assert.deepEqual(actions, [], 'a button lost its Space to the blit');

  const editable = document.createElement('div');
  Object.defineProperty(editable, 'isContentEditable', { value: true });
  host.appendChild(editable);
  const before = root.camera.y;
  key(editable, 'ArrowDown');
  assert.equal(root.camera.y, before, 'an editable lost its arrow to the camera');
  assert.equal(key(host, 'Tab').defaultPrevented, false, 'the host became a focus trap');
});

test('keyboard - off unbinds the listener', (t) => {
  const { app, host, root } = coreScene(t);
  keyboard(app)();
  key(host, 'ArrowRight');
  assert.equal(root.camera.x, 0, 'an unbound keyboard still drove the camera');
});

test('keyboard - reveal eases the least distance at the same scale, and does nothing once the box fits', (t) => {
  const { host, root } = coreScene(t);
  root.camera = new MotionCamera();
  const env = keyboardEnv(host, root, {});
  const far = { minX: 900, minY: 40, maxX: 1000, maxY: 100 };
  assert.equal(reveal(env, far), true);
  const { animation } = root.camera;
  assert.deepEqual([animation.targetX, animation.targetY, animation.targetScale, animation.duration],
    [800 - (1000 + VISIBILITY_MARGIN_PX), 0, 1, ENSURE_VISIBLE_MS]);

  root.camera.stopAnimation();
  root.camera.panTo(animation.targetX, 0);
  assert.equal(reveal(env, far), false);
  assert.equal(root.camera.isAnimating, false);
});
