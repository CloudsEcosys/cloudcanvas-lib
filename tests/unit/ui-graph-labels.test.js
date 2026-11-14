/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Where an edge's label stands: on its edge, at its middle, or - where
 * another label is - the nearest place along the edge that touches none; and
 * what it is drawn as, a chip in the surface's colour with its words on it.
 *
 * Written before the code and run on the graph as it stood at `f5756b2`, where
 * this file does not load:
 *
 *   Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../.plugin/ui/graph/labels.js' imported from tests/unit/ui-graph-labels.test.js
 *
 * and the last case, run there without the import, read `['text', 'text']` for
 * the tags of the two labels of the fixture's map where `['g', 'g']` is asked.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { NODE_HEIGHT, NODE_WIDTH, edgePath, edgePoint } from '../../ui/graph/layout.js';
import { labelSize, placeLabels } from '../../ui/graph/labels.js';
import { graphOf } from './ui-graph-fixture.js';

const touch = (a, b) => Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2;
const along = (x, y, run) => (t) => ({ x: x + run.x * t, y: y + run.y * t });

test('labels: a point along an edge is the middle at half, and the ends at 0 and 1', () => {
  const [a, b] = [{ x: 0, y: 0 }, { x: 500, y: 168 }];
  for (const [from, to] of [[a, b], [b, a], [a, { x: 0, y: 252 }]]) {
    assert.deepEqual(edgePoint(from, to, 0.5), edgePath(from, to).mid, 'the middle is where the curve has always put its label');
  }
  assert.deepEqual([edgePoint(a, b, 0), edgePoint(a, b, 1)], [{ x: NODE_WIDTH, y: NODE_HEIGHT / 2 }, { x: 500, y: 168 + NODE_HEIGHT / 2 }], 'a facing edge runs from the first node\'s right side to the second\'s left');
});

test('labels: two labels at one middle are moved apart along their edges, nearest place first; a label alone stays at its middle', () => {
  const column = (x) => along(x, 100, { x: 0, y: 200 });
  const [alone] = placeLabels([{ text: 'related', at: column(300) }]);
  assert.deepEqual([alone.x, alone.y], [300, 200], 'alone: at the middle');
  const [first, second, third] = placeLabels(['related', 'depends on', 'needs'].map((text) => ({ text, at: column(300) })));
  assert.deepEqual([first.x, first.y], [300, 200], 'the first keeps the middle');
  assert.ok(!touch(first, second) && !touch(first, third) && !touch(second, third), `three on one edge are apart: ${JSON.stringify([first, second, third])}`);
  assert.ok([second, third].every((chip) => chip.x === 300 && chip.y !== 200), 'each is still on the edge, moved along it');
  assert.equal(Math.abs(second.y - 200), 20, 'the second takes the nearest place that is clear: one step either side is not, two is');
  assert.deepEqual({ ...labelSize('related') }, { width: Math.ceil(7 * 6.6) + 8, height: 16 }, 'a chip is sized by its words');
});

test('labels: where no place along the edge is clear the label stays where it touches least, on the edge', () => {
  const short = along(100, 50, { x: 60, y: 0 });
  const [first, second] = placeLabels([{ text: 'related', at: short }, { text: 'depends on', at: short }]);
  assert.equal(second.y, 50, 'on the edge');
  assert.ok(Math.abs(second.x - first.x) > 0, `moved away from the first as far as the edge lets it: ${second.x} against ${first.x}`);
  assert.deepEqual(placeLabels([]), []);
});

test('labels: an edge\'s label is a chip - a backing and the words on it - and it keeps its name and its dimming', (t) => {
  const { host } = graphOf(t);
  const labels = [...host.querySelectorAll('.cloudcanvas-ui-graph-edge-label')];
  assert.deepEqual(labels.map((label) => label.tagName), ['g', 'g'], 'each label is a group of a backing and its words');
  assert.deepEqual(labels.map((label) => label.textContent), ['needs', 'see also']);
  assert.ok(labels.every((label) => label.querySelector('rect.cloudcanvas-ui-graph-edge-label-back') && label.querySelector('text.cloudcanvas-ui-graph-edge-label-text')));
});
