/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel add-on's pure half (`.plugin/addons/panel-place.js`): the options normalised whole and refused with
 * the allowed values named, `placeOf` over every place with its clamps, `slotOf`, and `insetsOf`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as entry from '../../plugins/panel.js';
import {
  PANEL_CONTROLS, PANEL_EDGES, PANEL_PLACES, PANEL_TAB_PX, insetsOf, placeOf, slotOf
} from '../../plugins/panel.js';
import { mergePanel, normalisePanel } from '../../plugins/panel-place.js';

const LAYER = Object.freeze({ w: 1000, h: 800 });

test('cloudcanvas/panel - exports exactly the names the spec lists; the trait is (b, options, root) => cleanup', () => {
  assert.deepEqual(Object.keys(entry).sort(), [
    'PANEL_CONTROLS', 'PANEL_EDGES', 'PANEL_PLACES', 'PANEL_TAB_PX', 'bodyOf', 'insetsOf', 'panel', 'panelOf', 'panels',
    'placeOf', 'setPanel', 'slotOf'
  ]);
  assert.equal(typeof entry.panel, 'function');
  assert.equal(entry.panel.length, 3);
});

test('panel constants - frozen, and as the spec names them', () => {
  assert.deepEqual(PANEL_PLACES, ['float', 'left', 'right', 'top', 'bottom', 'modal', 'full', 'window']);
  assert.deepEqual(PANEL_EDGES, ['left', 'right', 'top', 'bottom']);
  assert.deepEqual(PANEL_CONTROLS, ['collapse', 'pin', 'place', 'full', 'close']);
  assert.equal(PANEL_TAB_PX, 28);
  for (const list of [PANEL_PLACES, PANEL_EDGES, PANEL_CONTROLS]) assert.ok(Object.isFrozen(list));
});

test('normalisePanel - nothing given is every default, whole', () => {
  for (const given of [undefined, null, true, {}]) {
    assert.deepEqual(normalisePanel(given), {
      at: 'float', pinned: true, collapsed: false, open: true, size: { x: 360, y: 360 }, box: { x: null, y: null, w: 480, h: 360 },
      title: '', places: ['float', 'left', 'right', 'top', 'bottom', 'modal', 'full'], controls: [...PANEL_CONTROLS],
      snap: 24, min: { w: 200, h: 120 }, group: '', active: null
    });
  }
});

test('normalisePanel - given values kept, partial measures filled, unknown keys kept, lists deduplicated', () => {
  const o = normalisePanel({ at: 'right', size: 400, box: { w: 600 }, min: { h: 80 }, places: ['left', 'left', 'float'], note: 'mine', active: true });
  assert.equal(o.at, 'right');
  assert.deepEqual(o.size, { x: 400, y: 400 });
  assert.deepEqual(o.box, { x: null, y: null, w: 600, h: 360 });
  assert.deepEqual(o.min, { w: 200, h: 120 - 40 });
  assert.deepEqual(o.places, ['left', 'float']);
  assert.equal(o.note, 'mine');
  assert.equal(o.active, true);
  assert.deepEqual(normalisePanel({ controls: [] }).controls, []);
  assert.deepEqual(normalisePanel({ places: ['window'] }).places, ['window'], 'window is a value the normalisation accepts');
});

test('normalisePanel - an unknown place, control or listed place throws a TypeError naming the allowed values', () => {
  assert.throws(() => normalisePanel({ at: 'side' }), (error) => error instanceof TypeError && /float, left, right, top, bottom, modal, full, window/.test(error.message));
  assert.throws(() => normalisePanel({ controls: ['collapse', 'minimise'] }), (error) => error instanceof TypeError && /collapse, pin, place, full, close/.test(error.message));
  assert.throws(() => normalisePanel({ places: ['float', 'corner'] }), TypeError);
  assert.throws(() => normalisePanel({ places: 'float' }), TypeError);
  assert.throws(() => normalisePanel('right'), TypeError);
  assert.throws(() => normalisePanel([]), TypeError);
});

test('normalisePanel - numbers that are not finite throw; so does a value of the wrong type', () => {
  for (const bad of [{ size: NaN }, { size: Infinity }, { size: '400' }, { snap: -Infinity }, { box: { w: NaN } }, { min: { h: 'big' } }, { box: 5 }]) {
    assert.throws(() => normalisePanel(bad), TypeError, JSON.stringify(bad));
  }
  for (const bad of [{ pinned: 'false' }, { collapsed: 1 }, { open: 'yes' }, { active: 'true' }, { title: 5 }, { group: {} }]) {
    assert.throws(() => normalisePanel(bad), TypeError, JSON.stringify(bad));
  }
});

test('size - per axis: a number is both, `{x, y}` fills what it lacks; anything else is refused', () => {
  assert.deepEqual(normalisePanel({ size: 300 }).size, { x: 300, y: 300 });
  assert.deepEqual(normalisePanel({ size: { x: 500 } }).size, { x: 500, y: 360 });
  assert.deepEqual(normalisePanel({ size: { x: 500, y: 200 } }).size, { x: 500, y: 200 });
  for (const bad of ['300', [300], { x: '5' }, { y: Infinity }]) assert.throws(() => normalisePanel({ size: bad }), TypeError, JSON.stringify(bad));
  assert.deepEqual(mergePanel({ size: 300 }, { size: { y: 120 } }), { size: { x: 300, y: 120 } }, 'a stored number keeps its other axis');
  assert.deepEqual(mergePanel({ size: { x: 300, y: 200 } }, { size: 500 }), { size: 500 });
});

test('size - left and right take x, top and bottom take y', () => {
  const size = { x: 300, y: 150 };
  assert.equal(placeOf({ at: 'left', size }, LAYER).w, 300);
  assert.equal(placeOf({ at: 'right', size }, LAYER).w, 300);
  assert.equal(placeOf({ at: 'top', size }, LAYER).h, 150);
  assert.equal(placeOf({ at: 'bottom', size }, LAYER).h, 150);
  assert.deepEqual(insetsOf([{ at: 'left', size }, { at: 'bottom', size }]), { top: 0, right: 0, bottom: 150, left: 300 });
});

test('opposite pinned strips leave the content at least 80: each gives way in proportion, never below min', () => {
  const small = { w: 800, h: 600 };
  assert.deepEqual(insetsOf([{ at: 'left', size: 900 }, { at: 'right', size: 900 }], small), { top: 0, right: 360, bottom: 0, left: 360 });
  const loose = { w: 100 };
  assert.deepEqual(insetsOf([{ at: 'left', size: 600, min: loose }, { at: 'right', size: 200, min: loose }], small), { top: 0, right: 180, bottom: 0, left: 540 });
  assert.deepEqual(insetsOf([{ at: 'left', size: 600 }, { at: 'right', size: 200 }], small), { top: 0, right: 200, bottom: 0, left: 520 }, 'one at its min, the other takes the rest');
  assert.deepEqual(insetsOf([{ at: 'top', size: 500 }, { at: 'bottom', size: 500 }], small), { top: 260, right: 0, bottom: 260, left: 0 });
  assert.deepEqual(insetsOf([{ at: 'left', size: 700, min: { w: 600 } }, { at: 'right', size: 500, min: { w: 450 } }], small),
    { top: 0, right: 450, bottom: 0, left: 600 }, 'where even the minimums do not fit, min wins');
  assert.deepEqual(insetsOf([{ at: 'left', size: 900 }, { at: 'right', collapsed: true }], small), { top: 0, right: 28, bottom: 0, left: 692 });
  assert.deepEqual(insetsOf([{ at: 'left', size: 900 }, { at: 'right', size: 900, pinned: false }], small).left, 720, 'a drawer is no strip');
  const insets = insetsOf([{ at: 'left', size: 900 }, { at: 'right', size: 900 }], small);
  assert.deepEqual(placeOf({ at: 'left', size: 900 }, small, insets), { x: 0, y: 0, w: 360, h: 600 });
  assert.deepEqual(placeOf({ at: 'top' }, small, insets), { x: 360, y: 0, w: 80, h: 360 }, 'a strip between them keeps its bar');
});

test('placeOf and insetsOf - a layer size that is missing or not finite is refused by name', () => {
  for (const bad of [undefined, null, {}, { w: 800 }, { w: NaN, h: 600 }, { w: 800, h: Infinity }, '800x600']) {
    assert.throws(() => placeOf({ at: 'left' }, bad), (error) => error instanceof TypeError && /placeOf: layerSize/.test(error.message), JSON.stringify(bad));
  }
  for (const bad of [{ w: NaN, h: 600 }, { h: 600 }]) {
    assert.throws(() => insetsOf([{ at: 'left' }], bad), (error) => error instanceof TypeError && /insetsOf: layerSize/.test(error.message));
  }
  assert.deepEqual(insetsOf([{ at: 'left' }]), { top: 0, right: 0, bottom: 0, left: 360 }, 'a layer size is optional for insetsOf');
});

test('mergePanel - a patch over the stored options, one level deep into box and min', () => {
  assert.deepEqual(mergePanel({ at: 'right', box: { x: 10, y: 20, w: 300, h: 200 } }, { box: { w: 600 }, title: 'T' }),
    { at: 'right', title: 'T', box: { x: 10, y: 20, w: 600, h: 200 } });
  assert.deepEqual(mergePanel({ min: { w: 100 } }, { min: null }), { min: null });
});

test('placeOf - float: the box, centred without a position, at least min, its whole bar kept inside the layer', () => {
  assert.deepEqual(placeOf({}, LAYER), { x: 260, y: 220, w: 480, h: 360 });
  assert.deepEqual(placeOf({ box: { x: 40, y: 50, w: 300, h: 200 } }, LAYER), { x: 40, y: 50, w: 300, h: 200 });
  assert.deepEqual(placeOf({ box: { x: 10, y: 10, w: 100, h: 50 } }, LAYER), { x: 10, y: 10, w: 200, h: 120 }, 'min holds');
  assert.deepEqual(placeOf({ box: { x: 900, y: 790, w: 300, h: 200 } }, LAYER), { x: 700, y: 800 - PANEL_TAB_PX, w: 300, h: 200 });
  assert.deepEqual(placeOf({ box: { x: -50, y: -9, w: 300, h: 200 } }, LAYER), { x: 0, y: 0, w: 300, h: 200 });
  assert.deepEqual(placeOf({ box: { x: 40, y: 40, w: 1400, h: 200 } }, LAYER), { x: 0, y: 40, w: 1000, h: 200 }, 'wider than the layer: held to it');
  assert.deepEqual(placeOf({ box: { w: 5000, h: 5000 } }, { w: 800, h: 600 }), { x: 0, y: 0, w: 800, h: 600 }, 'every control in reach');
  assert.deepEqual(placeOf({ collapsed: true, box: { x: 40, y: 50, w: 300, h: 200 } }, LAYER), { x: 40, y: 50, w: 300, h: PANEL_TAB_PX }, 'folded to its bar');
});

test('placeOf - left and right run the full height; the thickness is held between min and the layer less 80', () => {
  assert.deepEqual(placeOf({ at: 'left' }, LAYER), { x: 0, y: 0, w: 360, h: 800 });
  assert.deepEqual(placeOf({ at: 'right', size: 300 }, LAYER), { x: 700, y: 0, w: 300, h: 800 });
  assert.deepEqual(placeOf({ at: 'right', size: 50 }, LAYER), { x: 800, y: 0, w: 200, h: 800 }, 'min.w holds');
  assert.deepEqual(placeOf({ at: 'left', size: 5000 }, LAYER), { x: 0, y: 0, w: 920, h: 800 }, 'the layer less 80');
  assert.deepEqual(placeOf({ at: 'right', collapsed: true, size: 500 }, LAYER), { x: 1000 - PANEL_TAB_PX, y: 0, w: PANEL_TAB_PX, h: 800 });
  assert.deepEqual(placeOf({ at: 'left', pinned: false }, LAYER), { x: 0, y: 0, w: 360, h: 800 }, 'a drawer takes the same strip');
});

test('placeOf - a left or right drawer runs between the pinned top and bottom strips; pinned, the full height', () => {
  const insets = { top: 100, right: 0, bottom: PANEL_TAB_PX, left: 0 };
  assert.deepEqual(placeOf({ at: 'right', pinned: false, size: 300 }, LAYER, insets), { x: 700, y: 100, w: 300, h: 800 - 100 - PANEL_TAB_PX });
  assert.deepEqual(placeOf({ at: 'left', pinned: false, size: 300 }, LAYER, insets), { x: 0, y: 100, w: 300, h: 672 });
  assert.deepEqual(placeOf({ at: 'left', pinned: false, collapsed: true }, LAYER, insets), { x: 0, y: 100, w: PANEL_TAB_PX, h: 672 }, 'a collapsed drawer');
  assert.deepEqual(placeOf({ at: 'right', size: 300 }, LAYER, insets), { x: 700, y: 0, w: 300, h: 800 }, 'a pinned strip runs the full height');
  assert.deepEqual(placeOf({ at: 'left', size: 300 }, LAYER, insets), { x: 0, y: 0, w: 300, h: 800 });
  assert.deepEqual(placeOf({ at: 'right', pinned: false }, LAYER, { top: 500, right: 0, bottom: 500, left: 0 }).h, 0, 'never below nothing');
});

test('placeOf - a top or bottom strip, pinned or a drawer, runs between the pinned left and right strips', () => {
  const insets = { top: 0, right: PANEL_TAB_PX, bottom: 0, left: 360 };
  for (const pinned of [true, false]) {
    assert.deepEqual(placeOf({ at: 'top', size: 200, pinned }, LAYER, insets), { x: 360, y: 0, w: 1000 - 360 - PANEL_TAB_PX, h: 200 });
    assert.deepEqual(placeOf({ at: 'bottom', size: 200, pinned }, LAYER, insets), { x: 360, y: 600, w: 612, h: 200 });
  }
});

test('placeOf - top and bottom run between the pinned left and right strips', () => {
  const insets = { top: 0, right: 28, bottom: 0, left: 360 };
  assert.deepEqual(placeOf({ at: 'top', size: 200 }, LAYER, insets), { x: 360, y: 0, w: 612, h: 200 });
  assert.deepEqual(placeOf({ at: 'bottom', size: 200 }, LAYER, insets), { x: 360, y: 600, w: 612, h: 200 });
  assert.deepEqual(placeOf({ at: 'top', size: 100 }, LAYER), { x: 0, y: 0, w: 1000, h: 120 }, 'min.h holds, no insets given');
  assert.deepEqual(placeOf({ at: 'bottom', size: 2000 }, LAYER), { x: 0, y: 80, w: 1000, h: 720 });
  assert.deepEqual(placeOf({ at: 'bottom', collapsed: true }, LAYER), { x: 0, y: 800 - PANEL_TAB_PX, w: 1000, h: PANEL_TAB_PX });
});

test('placeOf - modal: box.w by box.h, each at most the layer less 48, centred; full: the layer; window: none', () => {
  assert.deepEqual(placeOf({ at: 'modal' }, LAYER), { x: 260, y: 220, w: 480, h: 360 });
  assert.deepEqual(placeOf({ at: 'modal', box: { x: 5, y: 5, w: 2000, h: 2000 } }, LAYER), { x: 24, y: 24, w: 952, h: 752 });
  assert.deepEqual(placeOf({ at: 'modal', collapsed: true }, LAYER), { x: 260, y: 220, w: 480, h: 360 }, 'collapsed has no effect');
  assert.deepEqual(placeOf({ at: 'full', collapsed: true }, LAYER), { x: 0, y: 0, w: 1000, h: 800 });
  assert.equal(placeOf({ at: 'window' }, LAYER), null);
});

test('placeOf - refuses what the normalisation refuses', () => {
  assert.throws(() => placeOf({ at: 'nowhere' }, LAYER), TypeError);
});

test('slotOf - an edge, modal and full are their own slot; floating and window slots go by group, else id', () => {
  for (const at of ['left', 'right', 'top', 'bottom', 'modal', 'full']) assert.equal(slotOf({ at, group: 'g' }, 'a'), at);
  assert.equal(slotOf({}, 'sheet'), 'float:sheet');
  assert.equal(slotOf({ group: 'tools' }, 'sheet'), 'float:tools');
  assert.equal(slotOf({ at: 'window' }, 'sheet'), 'window:sheet');
  assert.equal(slotOf({ at: 'window', group: 'tools' }, 'sheet'), 'window:tools');
});

test('insetsOf - per edge, the thickness of open, pinned panels; the tab when collapsed', () => {
  assert.deepEqual(insetsOf([]), { top: 0, right: 0, bottom: 0, left: 0 });
  assert.deepEqual(insetsOf([
    { at: 'left', size: 300 }, { at: 'right', collapsed: true }, { at: 'top', size: 150 }, { at: 'bottom', pinned: false }
  ]), { top: 150, right: PANEL_TAB_PX, bottom: 0, left: 300 });
});

test('insetsOf - drawers, closed, floating, modal, full and window panels take no space', () => {
  assert.deepEqual(insetsOf([
    { at: 'left', pinned: false }, { at: 'right', open: false }, { at: 'float' }, { at: 'modal' }, { at: 'full' }, { at: 'window' }
  ]), { top: 0, right: 0, bottom: 0, left: 0 });
});

test('insetsOf - tabs on one edge: the one that says active, else the first; held at the layer when given', () => {
  assert.equal(insetsOf([{ at: 'right', size: 300 }, { at: 'right', size: 500 }]).right, 300);
  assert.equal(insetsOf([{ at: 'right', size: 300 }, { at: 'right', size: 500, active: true }]).right, 500);
  assert.equal(insetsOf([{ at: 'right', size: 300, pinned: false }, { at: 'right', size: 500 }]).right, 0, 'the shown one is a drawer');
  assert.equal(insetsOf([{ at: 'left', size: 5000 }], LAYER).left, 920);
  assert.equal(insetsOf([{ at: 'left', size: 50 }]).left, 200);
});
