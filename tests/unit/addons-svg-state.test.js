/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The svgState add-on on core blits, no bridge: the wrapper, `<svg>` and
 * `<path>` in the element, a transition with its compositor hint and bubbling
 * `svg:statechange`, the 3D orientation, and no residue when it stops.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { MOVING_CLASS } from '../../plugins/motion.js';
import {
  SVG_STATE_PATH_CLASS,
  SVG_STATE_WRAPPER_CLASS,
  setOrientation,
  svgState,
  svgStateOf,
  transitionState
} from '../../plugins/svg-state.js';
import { coreScene, signals } from '../helpers/core-scene.js';

blit.use({ svgState });

const STATES = { idle: { d: 'M 0 0 L 10 10', stroke: '#000000' }, hot: { d: 'M 0 0 L 50 50', stroke: '#38bdf8', bloom: 2 } };

test('svgState - builds its SVG in the blit and draws the initial state', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ svgState: { states: STATES, initialState: 'idle' } });
  const path = card.el.querySelector(`.${SVG_STATE_WRAPPER_CLASS} .${SVG_STATE_PATH_CLASS}`);
  assert.equal(path.getAttribute('d'), 'M 0 0 L 10 10');
  assert.equal(path.getAttribute('stroke'), '#000000');
});

test('svgState - a transition morphs the path, grants the hint and announces', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ svgState: { states: STATES, duration: 20 } });
  const seen = signals(app, 'svg:statechange');
  const s = svgStateOf(card);

  assert.equal(transitionState(s, card, 'hot'), true);
  assert.equal(transitionState(s, card, 'nowhere'), false);
  const path = card.el.querySelector(`.${SVG_STATE_PATH_CLASS}`);
  assert.equal(path.getAttribute('d'), 'M 0 0 L 50 50');
  assert.match(path.style.filter, /drop-shadow/);
  assert.ok(card.el.classList.contains(MOVING_CLASS));
  assert.deepEqual(seen.map((each) => [each.payload.from, each.payload.to]), [['idle', 'hot']]);
  card.set({ svgState: false });
});

test('svgState - orientation writes the 3D transform; stopping leaves no residue', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ svgState: { states: STATES } });
  const s = svgStateOf(card);

  setOrientation(s, { rx: 30, ry: 45, rz: 15, depth: 50 });
  assert.equal(s.bindings.svg.style.transform, 'translateZ(50px) rotateX(30deg) rotateY(45deg) rotateZ(15deg)');

  card.set({ svgState: false });
  assert.equal(card.el.querySelector(`.${SVG_STATE_WRAPPER_CLASS}`), null);
  assert.equal(svgStateOf(card), undefined);
  assert.equal(card.el.classList.contains(MOVING_CLASS), false);
});
