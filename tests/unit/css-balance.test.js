/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Structural guard on the default stylesheet: brace balance and rule nesting.
 *
 * A CSS parser recovers from an unclosed `@media` block silently - every rule
 * that follows is swallowed into the query and only applies under it. Nothing
 * fails, the styles just stop landing on most devices. That happened once to
 * the SVG-state rules behind a coarse-pointer query; this turns it into a
 * failing assertion at the moment the brace goes missing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CANVAS_DEFAULT_CSS } from '../../plugins/styles.js';

/** Strip block comments so a brace in prose can never skew the count. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Walk the sheet and return the brace depth *before* each character, plus the
 * minimum depth ever reached and the depth at the end.
 */
function braceProfile(css) {
  const depthAt = new Array(css.length);
  let depth = 0;
  let min = 0;

  for (let i = 0; i < css.length; i++) {
    depthAt[i] = depth;
    if (css[i] === '{') depth++;
    if (css[i] === '}') depth--;
    if (depth < min) min = depth;
  }

  return { depthAt, min, end: depth };
}

/**
 * The `@media` prelude whose block is still open at `index`, or null. A block
 * is open when the depth at `index` is still above the depth it was opened at.
 */
function enclosingMedia(css, depthAt, index) {
  const before = css.slice(0, index);
  for (const match of [...before.matchAll(/@media[^{]*\{/g)].reverse()) {
    if (depthAt[index] > depthAt[match.index]) return match[0].slice(0, -1).trim();
  }
  return null;
}

test('CANVAS_DEFAULT_CSS braces never go below depth 0 and close at 0', () => {
  const { min, end } = braceProfile(stripComments(CANVAS_DEFAULT_CSS));

  assert.equal(min, 0, 'a stray `}` closed a block that was never opened');
  assert.equal(end, 0, `${end} block(s) left open at end of sheet`);
});

test('.cloudcanvas-svg-state-wrapper is a top-level rule outside any @media', () => {
  const css = stripComments(CANVAS_DEFAULT_CSS);
  const index = css.indexOf('.cloudcanvas-svg-state-wrapper {');
  assert.notEqual(index, -1, 'svg-state wrapper rule is missing from the sheet');

  const { depthAt } = braceProfile(css);
  const media = enclosingMedia(css, depthAt, index);

  assert.equal(media, null, `svg-state wrapper rule is inside \`${media}\``);
  assert.equal(depthAt[index], 0, 'svg-state wrapper rule is nested inside another block');
});
