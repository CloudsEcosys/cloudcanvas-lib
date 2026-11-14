/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The history add-on on a core root: back and forward over `{root, camera}`
 * entries, the browser's invariants (a Back then a Forward is the identity; a new
 * navigation drops the forward history), `view:change` on every transition, and
 * `breadcrumb`. Ported from `navigation-history.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import {
  VIEW_CHANGE_EVENT, back, breadcrumb, canGoBack, canGoForward, forward, go, history, reset
} from '../../plugins/history.js';
import { motion } from '../../plugins/motion.js';
import { runFrame } from 'cloudcanvas/testing';
import { coreScene, signals } from '../helpers/core-scene.js';

blit.use({ history });

/**
 * grandparent
 *   +- parent
 *   |    +- target
 *   +- sibling
 */
function graph(t) {
  const { app, root } = coreScene(t);
  app.set({ history: true });
  const make = (at, id, x, y) => {
    const b = at.blit({ x, y, w: 160, h: 90 });
    b.el.id = id;
    return b;
  };
  const grandparent = make(app, 'grandparent', 0, 0);
  const parent = make(grandparent, 'parent', 20, 20);
  const target = make(parent, 'target', 40, 40);
  const sibling = make(grandparent, 'sibling', 400, 0);
  return { app, root, grandparent, parent, target, sibling };
}

/** Everything a traversal puts back, as one comparable value. */
function stateOf(app, root) {
  return {
    root: root.view ? root.view.id : null,
    breadcrumb: breadcrumb(app).map((b) => b.el.id),
    camera: { x: root.camera.x, y: root.camera.y, scale: root.camera.scale }
  };
}

test('history - back then forward restores the exact state that was left', (t) => {
  const { app, root, target } = graph(t);
  const atRoot = stateOf(app, root);
  go(app, target);
  const zoomedIn = stateOf(app, root);
  assert.equal(zoomedIn.root, 'target', 'go did not promote');

  assert.equal(back(app), true);
  assert.deepEqual(stateOf(app, root), atRoot, 'Back did not restore the whole root');
  assert.equal(canGoForward(app), true);

  assert.equal(forward(app), true);
  assert.deepEqual(stateOf(app, root), zoomedIn, 'Forward is not the inverse of Back');
  assert.equal(canGoForward(app), false, 'the forward entry was not consumed');
  assert.equal(canGoBack(app), true);
});

test('history - a new navigation after Back drops the forward history, a camera-only one too', (t) => {
  const { app, root, target, sibling } = graph(t);
  go(app, target);
  back(app);
  go(app, sibling);
  assert.equal(canGoForward(app), false, 'a new navigation kept its stale forward history');
  assert.equal(forward(app), false);
  assert.equal(root.view, sibling.el, 'a no-op Forward moved the view root');

  back(app);
  assert.equal(canGoForward(app), true);
  go(app, 'target', { promote: false });
  assert.equal(canGoForward(app), false, 'a camera-only navigation kept its forward history');
});

test('history - three levels of promotion, walked out and back in', (t) => {
  const { app, root, grandparent, parent, target } = graph(t);
  const states = [stateOf(app, root)];
  for (const b of [grandparent, parent, target]) {
    go(app, b);
    states.push(stateOf(app, root));
  }
  assert.deepEqual(states[3].breadcrumb, ['grandparent', 'parent', 'target']);

  for (let step = 2; step >= 0; step -= 1) {
    back(app);
    assert.deepEqual(stateOf(app, root), states[step], `Back to level ${step} was wrong`);
  }
  assert.equal(canGoBack(app), false, 'the whole root still has something behind it');
  for (let step = 1; step <= 3; step += 1) {
    forward(app);
    assert.deepEqual(stateOf(app, root), states[step], `Forward to level ${step} was wrong`);
  }
  assert.equal(root.view, target.el);
});

test('history - nothing to go forward to is a no-op that announces nothing', (t) => {
  const { app, root, target } = graph(t);
  const seen = signals(app, VIEW_CHANGE_EVENT);
  assert.equal(forward(app), false);
  assert.equal(back(app), false);
  assert.deepEqual(seen, [], 'an empty traversal announced a change');

  go(app, target);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].payload.root, target);
  assert.deepEqual(seen[0].payload.camera, { x: root.camera.x, y: root.camera.y, scale: root.camera.scale });
  assert.deepEqual([seen[0].payload.back, seen[0].payload.forward], [1, 0]);
  forward(app);
  assert.equal(seen.length, 1, 'a no-op Forward announced a change');
});

test('history - reset drops both stacks and shows the whole root', (t) => {
  const { app, root, target } = graph(t);
  go(app, target);
  back(app);
  reset(app);
  assert.equal(canGoForward(app), false);
  assert.equal(canGoBack(app), false);
  assert.equal(root.view, null);
  assert.deepEqual([root.camera.x, root.camera.y, root.camera.scale], [0, 0, 1]);
});

test('history - going to the view root already shown stacks nothing', (t) => {
  const { app, root, target } = graph(t);
  go(app, target);
  go(app, target);
  go(app, target);
  back(app);
  assert.equal(root.view, null, 'one Back did not reach the whole root');
  assert.equal(canGoBack(app), false, 'repeat activation stacked duplicate history');
});

test('history - breadcrumb walks b.parent from the top of the root', (t) => {
  const { app, target, sibling } = graph(t);
  assert.deepEqual(breadcrumb(target).map((b) => b.el.id), ['grandparent', 'parent', 'target']);
  assert.deepEqual(breadcrumb(sibling).map((b) => b.el.id), ['grandparent', 'sibling']);
  assert.deepEqual(breadcrumb(app), [], 'the whole root has a breadcrumb');
});

test('history - a flying camera is flown back unless the step is immediate', (t) => {
  const { app, root, target } = graph(t);
  motion(app);
  go(app, target, { immediate: true });
  const zoomed = root.camera.scale;
  back(app, { duration: 1 });
  assert.equal(root.camera.scale, zoomed, 'the camera snapped instead of flying');
  for (let frame = 0; frame < 5; frame += 1) runFrame(root);
  assert.deepEqual([root.camera.x, root.camera.y, root.camera.scale], [0, 0, 1]);
});

test('history - stopping the trait forgets the stacks', (t) => {
  const { app, target } = graph(t);
  go(app, target);
  app.set({ history: false });
  assert.equal(canGoBack(app), false);
  assert.throws(() => history(blit(target)), /expected a root collection/);
});

/* ------------------ STALE ENTRIES ------------------ */

test('history - back past a removed blit skips its entry and never throws', (t) => {
  const { app, root, parent, sibling } = graph(t);
  go(app, parent);
  go(app, sibling);
  parent.remove();
  assert.equal(canGoBack(app), true, 'the whole root is still behind');
  assert.doesNotThrow(() => back(app));
  assert.equal(root.view, null, 'Back did not land on the next live entry');
  assert.equal(canGoBack(app), false, 'the removed entry is still counted');
  assert.equal(forward(app), true);
  assert.equal(root.view, sibling.el);
});

test('history - forward past a removed blit skips its entry and never throws', (t) => {
  const { app, root, parent, target, sibling } = graph(t);
  go(app, sibling);
  go(app, parent);
  back(app);
  back(app);
  parent.remove();
  assert.equal(canGoForward(app), true);
  assert.doesNotThrow(() => forward(app));
  assert.equal(root.view, sibling.el, 'Forward did not land on the live entry');
  assert.equal(canGoForward(app), false, 'the removed entry is still ahead');
  assert.equal(forward(app), false);
  assert.equal(target.el.isConnected, false);
});

test('history - every entry removed: nothing stale behind or ahead, and back is a silent no-op', (t) => {
  const { app, root, grandparent, parent, target } = graph(t);
  go(app, grandparent);
  go(app, parent);
  go(app, target);
  back(app);
  const seen = signals(app, VIEW_CHANGE_EVENT);
  grandparent.remove();
  assert.equal(root.view, null, 'the removed view root still held the view');
  assert.equal(canGoBack(app), true, 'the whole root entry is always live');
  back(app);
  assert.equal(root.view, null);
  assert.equal(canGoBack(app), false, 'removed entries still count as behind');
  assert.equal(canGoForward(app), true, 'the whole-root view the removal left is live');
  assert.equal(back(app), false);
  assert.equal(seen.length, 1, 'a no-op traversal announced a change');
  assert.deepEqual([seen[0].payload.back, seen[0].payload.forward], [0, 1], 'the payload counts stale entries');
});
