/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * SVG path geometry without a GPU: the parser reads every command and number form into absolute commands and names
 * the offset of what it cannot read; flattening keeps curves and arcs within the tolerance, ends arcs exactly and
 * flags closed subpaths; the fill covers exactly the polygon (holes and disjoint shapes under both rules, a circle
 * within 1%); the stroke covers about perimeter x width; self-crossing and hostile input stays bounded.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { MESH_STRIDE } from '../../plugins/gpu-scene.js';
import {
  PATH_LIMIT, POINT_LIMIT, fillGeometry, flattenPath, parsePath, pathGeometry, strokeGeometry
} from '../../plugins/svg-path-geometry.js';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

/** Each triangle of a mesh as three [x, y] corners. */
function trianglesOf({ vertices, indices }) {
  const at = (i) => [vertices[i * MESH_STRIDE], vertices[i * MESH_STRIDE + 1]];
  const out = [];
  for (let k = 0; k < indices.length; k += 3) out.push([at(indices[k]), at(indices[k + 1]), at(indices[k + 2])]);
  return out;
}

const cross = ([ax, ay], [bx, by], [cx, cy]) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);

/** The sum of a mesh's triangle areas. */
const meshArea = (geometry) => trianglesOf(geometry).reduce((sum, [a, b, c]) => sum + Math.abs(cross(a, b, c)) / 2, 0);

/** The shoelace area of flat x, y pairs. */
function shoelace(points) {
  let sum = 0;
  for (let i = 0, j = points.length - 2; i < points.length; j = i, i += 2) sum += points[j] * points[i + 1] - points[i] * points[j + 1];
  return Math.abs(sum) / 2;
}

/** The cells of a `cell` grid (from minX, minY) whose centres lie in triangle a, b, c, marked in `hit`. */
function markTriangle(hit, grid, [a, b, c]) {
  const { minX, minY, cell, cols } = grid;
  const sign = Math.sign(cross(a, b, c));
  const [x0, x1] = [Math.floor((Math.min(a[0], b[0], c[0]) - minX) / cell), Math.ceil((Math.max(a[0], b[0], c[0]) - minX) / cell)];
  const [y0, y1] = [Math.floor((Math.min(a[1], b[1], c[1]) - minY) / cell), Math.ceil((Math.max(a[1], b[1], c[1]) - minY) / cell)];
  for (let row = Math.max(0, y0); row < Math.min(grid.rows, y1); row += 1) {
    for (let col = Math.max(0, x0); col < Math.min(cols, x1); col += 1) {
      const p = [minX + (col + 0.5) * cell, minY + (row + 0.5) * cell];
      if (sign * cross(a, b, p) >= 0 && sign * cross(b, c, p) >= 0 && sign * cross(c, a, p) >= 0) hit[row * cols + col] = 1;
    }
  }
}

/** The area a mesh covers, overlaps counted once: the cells of a `cell` grid whose centres some triangle holds. */
function coveredArea(geometry, cell) {
  const tris = trianglesOf(geometry);
  const [xs, ys] = [tris.flat().map(([x]) => x), tris.flat().map(([, y]) => y)];
  const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
  const grid = { minX, minY, cell, cols: Math.ceil((Math.max(...xs) - minX) / cell), rows: Math.ceil((Math.max(...ys) - minY) / cell) };
  const hit = new Uint8Array(grid.cols * grid.rows);
  for (const triangle of tris) markTriangle(hit, grid, triangle);
  return hit.reduce((sum, value) => sum + value, 0) * cell * cell;
}

/** Distance from (x, y) to the polyline through flat x, y pairs. */
function distanceToPolyline(points, x, y) {
  let best = Infinity;
  for (let k = 0; k + 3 < points.length; k += 2) {
    const [ax, ay, bx, by] = [points[k], points[k + 1], points[k + 2], points[k + 3]];
    const length2 = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = length2 ? Math.min(1, Math.max(0, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / length2)) : 0;
    best = Math.min(best, Math.hypot(ax + t * (bx - ax) - x, ay + t * (by - ay) - y));
  }
  return best;
}

/** Every index in range, and (optionally) no triangle of zero area. */
function assertWellFormed(geometry, { degenerate = false } = {}) {
  const count = geometry.vertices.length / MESH_STRIDE;
  assert.equal(geometry.vertices.length % MESH_STRIDE, 0);
  assert.equal(geometry.indices.length % 3, 0);
  for (const index of geometry.indices) assert.ok(index < count, `index ${index} past ${count} vertices`);
  const flat = (k) => geometry.vertices.slice(k * MESH_STRIDE + 2, (k + 1) * MESH_STRIDE).join();
  const bent = Array.from({ length: count }, (unused, k) => k).filter((k) => flat(k) !== '0,0,0,1');
  assert.deepEqual(bent, [], 'every vertex at z = 0 with normal (0, 0, 1)');
  if (!degenerate) for (const [a, b, c] of trianglesOf(geometry)) assert.ok(Math.abs(cross(a, b, c)) > 0, 'a degenerate triangle');
}

const isEmpty = (geometry) => geometry.vertices.length === 0 && geometry.indices.length === 0;

/* ------------------ PARSER ------------------ */

test('svg-path - every absolute command, H/V as L, S/T with reflected control points', () => {
  const d = 'M1 2 L3 4 H5 V6 C7 8 9 10 11 12 S13 14 15 16 Q17 18 19 20 T21 22 A1 1 0 0 1 23 24 Z';
  assert.deepEqual(parsePath(d), [
    { type: 'M', values: [1, 2] }, { type: 'L', values: [3, 4] }, { type: 'L', values: [5, 4] }, { type: 'L', values: [5, 6] },
    { type: 'C', values: [7, 8, 9, 10, 11, 12] }, { type: 'C', values: [13, 14, 13, 14, 15, 16] },
    { type: 'Q', values: [17, 18, 19, 20] }, { type: 'Q', values: [21, 22, 21, 22] },
    { type: 'A', values: [1, 1, 0, 0, 1, 23, 24] }, { type: 'Z', values: [] }
  ]);
  assert.deepEqual(parsePath('M0 0 S1 1 2 0 T4 0').slice(1).map(({ values }) => values), [[0, 0, 1, 1, 2, 0], [2, 0, 4, 0]],
    'S and T with no curve before reflect nothing: the control point is the pen');
});

test('svg-path - relative commands resolve against the pen; z returns it to the subpath start', () => {
  const d = 'm1 2 l3 4 h5 v6 c1 1 2 2 3 3 s1 1 2 2 q1 1 2 2 t1 1 a1 1 0 0 1 2 2 z m1 1';
  assert.deepEqual(parsePath(d).map(({ type, values }) => [type, ...values]), [
    ['M', 1, 2], ['L', 4, 6], ['L', 9, 6], ['L', 9, 12], ['C', 10, 13, 11, 14, 12, 15], ['C', 13, 16, 13, 16, 14, 17],
    ['Q', 15, 18, 16, 19], ['Q', 17, 20, 17, 20], ['A', 1, 1, 0, 0, 1, 19, 22], ['Z'], ['M', 2, 3]
  ]);
  assert.deepEqual(parsePath('m10 10 l10 10'), parsePath('M10 10 L20 20'));
  assert.deepEqual(parsePath('M0 0 A-3 -4 0 0 0 1 1')[1].values.slice(0, 2), [3, 4], 'radii are made positive');
});

test('svg-path - implicit repeats: after M they are L, after m they are l, and every command repeats', () => {
  const types = (d) => parsePath(d).map(({ type, values }) => [type, ...values]);
  assert.deepEqual(types('M0 0 1 1 2 2'), [['M', 0, 0], ['L', 1, 1], ['L', 2, 2]]);
  assert.deepEqual(types('m1 1 2 2 3 3'), [['M', 1, 1], ['L', 3, 3], ['L', 6, 6]]);
  assert.deepEqual(types('M0 0 h1 2 v3'), [['M', 0, 0], ['L', 1, 0], ['L', 3, 0], ['L', 3, 3]]);
  assert.deepEqual(types('M0 0 C1 1 2 2 3 3 4 4 5 5 6 6').map(([type]) => type), ['M', 'C', 'C']);
  assert.deepEqual(types('M0 0 Q1 1 2 2,3 3 4 4').map(([type]) => type), ['M', 'Q', 'Q']);
  assert.deepEqual(types('M0 0 A1 1 0 0 1 2 0 1 1 0 0 1 4 0').map(([type]) => type), ['M', 'A', 'A']);
});

test('svg-path - numbers in every legal form: exponents, bare fractions, signs as separators, compact flags', () => {
  const values = (d) => parsePath(d).flatMap((command) => command.values);
  assert.deepEqual(values('M.5.5L-1-2'), [0.5, 0.5, -1, -2]);
  assert.deepEqual(values('M1e-3 1E2 2.5e+1-.25'), [0.001, 100, 25, -0.25]);
  assert.deepEqual(values('M+3,-4 5.,6'), [3, -4, 5, 6]);
  assert.deepEqual(values('M1.5.5.5.5'), [1.5, 0.5, 0.5, 0.5], 'the third number starts the implicit lineto');
  assert.deepEqual(values('M0,0a5,5,0,1,1,10,0'), [0, 0, 5, 5, 0, 1, 1, 10, 0]);
  assert.deepEqual(values('M0 0a5 5 0 1110 0'), [0, 0, 5, 5, 0, 1, 1, 10, 0], 'flags need no separator');
  assert.deepEqual(values('\t\nM 1 , 2\r\fL3 4  '), [1, 2, 3, 4]);
  assert.deepEqual(parsePath(''), []);
  assert.deepEqual(parsePath('   '), []);
});

test('svg-path - malformed data throws a TypeError naming the offset', () => {
  const cases = [
    ['L1 2', /moveto at offset 0/], ['M1', /expected a number at offset 2/], ['M1 2 X3', /unexpected 'X' at offset 5/],
    ['M1,,2', /expected a number at offset 3/], ['M,1 2', /expected a number at offset 1/],
    ['M1 2,L3 4', /after the comma at offset 5/], ['M0 0 A1 1 0 2 0 1 1', /flag \(0 or 1\) at offset 12/],
    ['M0 0 Z 1 1', /unexpected '1' at offset 7/], ['M0 0 L1 2e', /unexpected 'e' at offset 9/], ['M0 0 L-', /number at offset 6/],
    ['M0 0 LNaN 0', /number at offset 6/], ['M1e39 0', /out of range at offset 1/], ['M3e38 0 l3e38 0', /out of range at offset 9/]
  ];
  for (const [d, message] of cases) {
    assert.throws(() => parsePath(d), (error) => error instanceof TypeError && /^svg-path: /.test(error.message) && message.test(error.message), d);
  }
  assert.throws(() => parsePath(null), TypeError);
});

test('svg-path - data longer than PATH_LIMIT throws; at the limit it reads', () => {
  assert.equal(PATH_LIMIT, 100000);
  const atLimit = 'M0 0' + ' '.repeat(PATH_LIMIT - 4);
  assert.deepEqual(parsePath(atLimit), [{ type: 'M', values: [0, 0] }]);
  assert.throws(() => parsePath(atLimit + ' '), (error) => error instanceof RangeError && /svg-path: .*limit/.test(error.message));
});

/* ------------------ FLATTENING ------------------ */

test('svg-path - a cubic and a quadratic stay within the tolerance of the true curve; a finer one takes more points', () => {
  const cubic = (t) => {
    const [p0, p1, p2, p3] = [[0, 0], [30, 90], [70, -40], [100, 50]];
    const w = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3];
    return [0, 1].map((axis) => w[0] * p0[axis] + w[1] * p1[axis] + w[2] * p2[axis] + w[3] * p3[axis]);
  };
  const quad = (t) => [0, 1].map((axis) => (1 - t) ** 2 * [10, 0][axis] + 2 * (1 - t) * t * [60, 120][axis] + t * t * [110, 0][axis]);
  const counts = [];
  for (const tolerance of [2, 0.25, 0.01]) {
    for (const [d, curve] of [['M0 0 C30 90 70 -40 100 50', cubic], ['M10 0 Q60 120 110 0', quad]]) {
      const [{ points }] = flattenPath(d, tolerance);
      const end = curve(1);
      assert.deepEqual([points[points.length - 2], points[points.length - 1]], end, 'the end point is exact');
      let worst = 0;
      for (let k = 0; k <= 2000; k += 1) worst = Math.max(worst, distanceToPolyline(points, ...curve(k / 2000)));
      assert.ok(worst <= tolerance + 1e-9, `${d} strays ${worst} at tolerance ${tolerance}`);
      if (curve === cubic) counts.push(points.length);
    }
  }
  assert.ok(counts[0] < counts[1] && counts[1] < counts[2], `points did not grow as the tolerance shrank: ${counts}`);
});

test('svg-path - an arc lies on its circle within the tolerance, ends exactly, and sweeps the flagged way', () => {
  const tolerance = 0.25;
  const [{ points }] = flattenPath('M10 0 A10 10 0 0 1 -10 0', tolerance);
  assert.deepEqual([points[0], points[1], points[points.length - 2], points[points.length - 1]], [10, 0, -10, 0]);
  for (let k = 0; k < points.length; k += 2) assert.ok(close(Math.hypot(points[k], points[k + 1]), 10, 1e-9));
  assert.ok(points.filter((v, k) => k % 2 === 1).every((y) => y >= 0), 'sweep 1 turns through +y');
  for (let k = 0; k <= 1000; k += 1) {
    const t = (Math.PI * k) / 1000;
    assert.ok(distanceToPolyline(points, 10 * Math.cos(t), 10 * Math.sin(t)) <= tolerance + 1e-9);
  }
  const [{ points: other }] = flattenPath('M10 0 A10 10 0 0 0 -10 0', tolerance);
  assert.ok(other.filter((v, k) => k % 2 === 1).every((y) => y <= 0), 'sweep 0 turns through -y');
  const onCircle = (list, cx, cy) => list.every((v, k) => k % 2 === 1 || close(Math.hypot(v - cx, list[k + 1] - cy), 10, 1e-9));
  const [{ points: small }] = flattenPath('M0 10 A10 10 0 0 1 10 0');
  assert.ok(onCircle(small, 10, 10) && small.every((v) => v >= -1e-9 && v <= 10 + 1e-9), 'small, positive sweep: about (10, 10)');
  const [{ points: large }] = flattenPath('M0 10 A10 10 0 1 1 10 0');
  assert.ok(onCircle(large, 0, 0) && large.some((v, k) => k % 2 === 0 && v < -9), 'large, positive sweep: three quarters about (0, 0)');
  const [{ points: rotated }] = flattenPath('M0 0 A20 10 30 1 0 15 5', 0.1);
  assert.deepEqual([rotated[rotated.length - 2], rotated[rotated.length - 1]], [15, 5], 'a rotated arc ends exactly');
});

test('svg-path - arc radii too small are scaled up; a zero radius is a line; equal end points draw nothing', () => {
  const [{ points }] = flattenPath('M0 0 A1 1 0 0 1 10 0');
  for (let k = 0; k < points.length; k += 2) assert.ok(close(Math.hypot(points[k] - 5, points[k + 1]), 5, 1e-9));
  assert.ok(points.length > 8, 'a half circle of radius 5, not a line');
  assert.deepEqual(Array.from(flattenPath('M0 0 A0 5 0 0 1 10 0')[0].points), [0, 0, 10, 0]);
  assert.deepEqual(flattenPath('M0 0 A5 5 0 0 1 0 0'), []);
});

test('svg-path - subpaths: closed flags, no repeated first point, duplicates and lone movetos dropped', () => {
  const subpaths = flattenPath('M0 0 L10 0 L10 10 Z M20 20 L30 20');
  assert.deepEqual(subpaths.map(({ points, closed }) => [Array.from(points), closed]), [
    [[0, 0, 10, 0, 10, 10], true], [[20, 20, 30, 20], false]
  ]);
  assert.ok(subpaths[0].points instanceof Float64Array);
  assert.deepEqual(Array.from(flattenPath('M0 0 H10 V10 H0 V0 Z')[0].points), [0, 0, 10, 0, 10, 10, 0, 10]);
  assert.deepEqual(Array.from(flattenPath('M0 0 L0 0 L1 1 L1 1')[0].points), [0, 0, 1, 1]);
  assert.equal(flattenPath('M5 5 M0 0 L1 1').length, 1);
  const after = flattenPath('M0 0 H10 V10 Z L5 5');
  assert.deepEqual(after.map(({ points, closed }) => [Array.from(points), closed]), [[[0, 0, 10, 0, 10, 10], true], [[0, 0, 5, 5], false]],
    'a drawing command after Z starts a subpath at the start point');
});

test('svg-path - flattening past POINT_LIMIT throws; so does a tolerance that is not a positive number', () => {
  assert.equal(POINT_LIMIT, 200000);
  const tooMany = (error) => error instanceof RangeError && /svg-path: .*200000 points/.test(error.message);
  assert.throws(() => flattenPath('M0 0 C0 1e9 1e9 1e9 1e9 0', 1e-6), tooMany);
  assert.throws(() => flattenPath('M-1e6 0 A1e6 1e6 0 0 1 1e6 0', 1e-6), tooMany, 'an arc is counted before it is traced');
  for (const tolerance of [0, -1, NaN, Infinity, '1']) assert.throws(() => flattenPath('M0 0 L1 1', tolerance), TypeError);
});

/* ------------------ FILL ------------------ */

test('svg-path - fill area is the polygon area: a square, a concave L, a circle within 1%', () => {
  const cases = [['M0 0 H10 V10 H0 Z', 100], ['M0 0 H10 V4 H4 V10 H0 Z', 64]];
  for (const [d, area] of cases) {
    const { fill } = pathGeometry(d);
    assert.ok(close(meshArea(fill), area) && close(shoelace(flattenPath(d)[0].points), area), d);
    assertWellFormed(fill);
  }
  const circle = pathGeometry('M50 0 A50 50 0 1 1 -50 0 A50 50 0 1 1 50 0 Z').fill;
  assert.ok(Math.abs(meshArea(circle) - Math.PI * 2500) / (Math.PI * 2500) < 0.01, `circle area ${meshArea(circle)}`);
  assertWellFormed(circle);
});

test('svg-path - holes: evenodd empties a nested ring either way; nonzero only one wound against its parent', () => {
  const same = 'M0 0 H10 V10 H0 Z M3 3 H7 V7 H3 Z';
  const opposite = 'M0 0 H10 V10 H0 Z M3 3 V7 H7 V3 Z';
  assert.ok(close(meshArea(pathGeometry(same, { fillRule: 'evenodd' }).fill), 84));
  assert.ok(close(meshArea(pathGeometry(opposite, { fillRule: 'evenodd' }).fill), 84));
  assert.ok(close(meshArea(pathGeometry(opposite, { fillRule: 'nonzero' }).fill), 84));
  assert.ok(close(meshArea(pathGeometry(same, { fillRule: 'nonzero' }).fill), 100), 'wound alike, the inner ring is filled');
  const island = 'M0 0 H20 V20 H0 Z M4 4 H16 V16 H4 Z M8 8 H12 V12 H8 Z';
  assert.ok(close(meshArea(pathGeometry(island, { fillRule: 'evenodd' }).fill), 400 - 144 + 16), 'an island in a hole');
  for (const d of [same, opposite, island]) assertWellFormed(pathGeometry(d, { fillRule: 'evenodd' }).fill);
});

test('svg-path - disjoint shapes in one path; open subpaths filled as if closed', () => {
  const { fill } = pathGeometry('M0 0 H10 V10 H0 Z M20 0 H25 V5 H20 Z');
  assert.ok(close(meshArea(fill), 125));
  assertWellFormed(fill);
  assert.ok(close(meshArea(pathGeometry('M0 0 H10 V10 H0').fill), 100));
  const direct = fillGeometry([{ points: [0, 0, 4, 0, 4, 3], closed: false }]);
  assert.ok(close(meshArea(direct), 6), 'a plain array of x, y pairs works too');
});

test('svg-path - degenerate input gives the empty geometry; bad input throws', () => {
  for (const d of ['', 'M0 0', 'M0 0 L10 0', 'M0 0 L10 10 L20 20 Z', 'M0 0 H10 H0 Z', 'M0 0 L1 1 L0 0 Z']) {
    assert.ok(isEmpty(pathGeometry(d).fill), d);
  }
  assert.throws(() => fillGeometry([], 'winding'), TypeError);
  assert.throws(() => fillGeometry({}), TypeError);
  assert.throws(() => fillGeometry([{ points: [0, 0, NaN, 1, 2, 2] }]), TypeError);
  assert.throws(() => fillGeometry([{ points: [0, 0, 1] }]), TypeError);
});

test('svg-path - vertices are MESH_STRIDE floats, flat and facing +z; Uint32 indices past 65535 vertices', () => {
  const { fill } = pathGeometry('M0 0 H10 V10 H0 Z');
  assert.ok(fill.vertices instanceof Float32Array && fill.indices instanceof Uint16Array);
  assert.equal(fill.vertices.length, 4 * MESH_STRIDE);
  const big = pathGeometry('M1000 0 A1000 1000 0 1 1 -1000 0 A1000 1000 0 1 1 1000 0 Z', { tolerance: 1e-6 }).fill;
  assert.ok(big.vertices.length / MESH_STRIDE > 65535);
  assert.ok(big.indices instanceof Uint32Array);
  assert.ok(Math.abs(meshArea(big) - Math.PI * 1e6) / (Math.PI * 1e6) < 1e-3);
  assertWellFormed(big, { degenerate: true });
});

/* ------------------ STROKE ------------------ */

test('svg-path - a unit square stroked 2 wide covers about perimeter x width, the bevels a little less', () => {
  const stroke = strokeGeometry(flattenPath('M0 0 H1 V1 H0 Z'), 2);
  assertWellFormed(stroke);
  assert.equal(stroke.indices.length / 3, 4 * 2 + 4, 'four quads and four bevels');
  const covered = coveredArea(stroke, 0.005);
  assert.ok(covered < 4 * 2 && covered > 0.85 * 4 * 2, `covered ${covered}`);
  assert.ok(close(covered, 9 - 4 * 0.5, 0.05), 'the 3 x 3 outline less four half-unit bevel corners');
  const thin = strokeGeometry(flattenPath('M0 0 H10 V10 H0 Z'), 1);
  assert.ok(close(coveredArea(thin, 0.01), 40 - 0.5, 0.15), 'perimeter x width, less the four corners');
  assert.ok(close(meshArea(thin), 40 + 4 * 0.125), 'the quads (overlapping inside the corners) and the bevels');
});

test('svg-path - miter joins meet at the corner and fall back to a bevel past the limit of 4', () => {
  const square = strokeGeometry(flattenPath('M0 0 H10 V10 H0 Z'), 1, { join: 'miter' });
  assert.ok(close(coveredArea(square, 0.01), 11 * 11 - 9 * 9, 0.15), 'a mitred square outline');
  const spike = flattenPath('M0 0 L10 1 L0 2');
  const maxX = (geometry) => Math.max(...trianglesOf(geometry).flat().map(([x]) => x));
  assert.ok(maxX(strokeGeometry(spike, 1, { join: 'miter' })) < 10.5, 'too sharp for a miter: bevelled');
  assert.ok(maxX(strokeGeometry(flattenPath('M0 0 L10 5 L0 10'), 1, { join: 'miter' })) > 10.5, 'blunt enough: mitred');
});

test('svg-path - open subpaths end in butt (or square) caps with no join end to start; width <= 0 is empty', () => {
  const line = strokeGeometry(flattenPath('M0 0 H10'), 2);
  assert.ok(close(meshArea(line), 20));
  assert.deepEqual([...new Set(trianglesOf(line).flat().map(([x, y]) => `${x},${y}`))].sort(), ['0,-1', '0,1', '10,-1', '10,1']);
  assert.ok(close(meshArea(strokeGeometry(flattenPath('M0 0 H10'), 2, { cap: 'square' })), 24));
  const open = strokeGeometry(flattenPath('M0 0 H10 V10 H0 V0'), 1);
  assert.equal(open.indices.length / 3, 4 * 2 + 3, 'three corners joined, the ends left apart');
  for (const width of [0, -1, -Infinity]) assert.ok(isEmpty(strokeGeometry(flattenPath('M0 0 H10'), width)));
  assert.ok(isEmpty(strokeGeometry(flattenPath('M5 5 L5 5'), 2)), 'a single point strokes nothing with butt caps');
  assert.throws(() => strokeGeometry([], NaN), TypeError);
  assert.throws(() => strokeGeometry([], 1, { join: 'round' }), TypeError);
});

test('svg-path - pathGeometry: fill, stroke on request, and the bounds of the path itself', () => {
  const both = pathGeometry('M10 20 H30 V40 H10 Z', { stroke: true, strokeWidth: 4 });
  assert.ok(close(meshArea(both.fill), 400));
  assert.ok(both.stroke.indices.length > 0);
  assert.deepEqual(both.bounds, [10, 20, 30, 40], 'the stroke is not in the bounds');
  const strokeOnly = pathGeometry('M0 0 H10', { fill: false, stroke: true });
  assert.equal(strokeOnly.fill, null);
  assert.ok(close(meshArea(strokeOnly.stroke), 10));
  assert.equal(pathGeometry('M0 0 H10').stroke, null);
  const capped = pathGeometry('M0 0 H10', { fill: false, stroke: true, strokeWidth: 2, cap: 'square' }).stroke;
  assert.ok(close(meshArea(capped), 24), 'join and cap reach the stroke');
  assert.deepEqual(pathGeometry('').bounds, [0, 0, 0, 0]);
  const circle = pathGeometry('M50 0 A50 50 0 1 1 -50 0 A50 50 0 1 1 50 0 Z').bounds;
  assert.ok(circle.every((v, k) => close(v, [-50, -50, 50, 50][k], 1e-9)));
});

/* ------------------ SELF-CROSSING AND HOSTILE INPUT ------------------ */

test('svg-path - a self-crossing bow-tie, a star and a random scribble neither throw nor hang', () => {
  const started = performance.now();
  for (const fillRule of ['nonzero', 'evenodd']) {
    const bowTie = pathGeometry('M0 0 L10 10 L10 0 L0 10 Z', { fillRule, stroke: true }).fill;
    assertWellFormed(bowTie, { degenerate: true });
    const area = meshArea(bowTie);
    assert.ok(area >= 25 && area <= 100, `bow-tie area ${area} is not roughly its two lobes (50)`);
    assertWellFormed(pathGeometry('M50 0 L79 90 L2 35 L98 35 L21 90 Z', { fillRule }).fill, { degenerate: true });
  }
  let seed = 7;
  const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const scribble = Float64Array.from({ length: 4000 }, () => random() * 1000);
  const fill = fillGeometry([{ points: scribble, closed: true }], 'evenodd');
  assertWellFormed(fill, { degenerate: true });
  assert.ok(performance.now() - started < 5000, 'self-crossing input took too long');
});

test('svg-path - hostile input: enormous data, far-out or NaN numbers, and point floods all throw', () => {
  assert.throws(() => pathGeometry('M0 0' + ' L1 1'.repeat(30000)), RangeError);
  assert.throws(() => pathGeometry('M0 0 L1e400 0'), TypeError);
  assert.throws(() => pathGeometry('M0 0 LNaN NaN'), TypeError);
  assert.throws(() => pathGeometry('M3e38 0 l3e38 0'), TypeError);
  assert.throws(() => pathGeometry('M0 0 L1 1', { tolerance: NaN }), TypeError);
  assert.throws(() => pathGeometry('M0 0 A1 1 0 0 1 3e38 3e38', { tolerance: 1e-3 }), RangeError);
  assert.throws(() => pathGeometry({ toString: () => 'M0 0' }), TypeError);
  assert.throws(() => pathGeometry('M0 3e38 H10', { stroke: true, strokeWidth: 1e38 }), TypeError, 'a stroke past float range');
});
