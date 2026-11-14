/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Unit tests for `.addons/coerce.js`, the one `asText` / `toNumber` the forms and
 * components share. The table fixes the exact semantics the ten former private
 * copies had, so a "tidy" of either helper fails here first.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { asText, toNumber } from '../../coerce.js';

test('asText: undefined and null are the empty string, everything else is String()', () => {
  assert.equal(asText(undefined), '');
  assert.equal(asText(null), '');
  assert.equal(asText(''), '');
  assert.equal(asText('hi'), 'hi');
  assert.equal(asText(0), '0', 'zero must not read as empty');
  assert.equal(asText(false), 'false', 'false must not read as empty');
  assert.equal(asText(NaN), 'NaN');
  assert.equal(asText([1, 2]), '1,2');
  assert.equal(asText({ toString: () => 'custom' }), 'custom');
});

test('toNumber: a finite parse wins, anything else is the stated fallback', () => {
  assert.equal(toNumber(3, 0), 3);
  assert.equal(toNumber('4.5', 0), 4.5);
  assert.equal(toNumber('  7 ', 0), 7, 'Number() trims, and so must the helper');
  assert.equal(toNumber(0, 9), 0, 'zero is finite and must not fall back');
  assert.equal(toNumber('', 9), 0, 'Number("") is 0, preserved deliberately');
  assert.equal(toNumber(null, 9), 0, 'Number(null) is 0, preserved deliberately');
  assert.equal(toNumber(true, 9), 1);
  assert.equal(toNumber(undefined, 9), 9);
  assert.equal(toNumber('abc', 9), 9);
  assert.equal(toNumber(NaN, 9), 9);
  assert.equal(toNumber(Infinity, 9), 9);
  assert.equal(toNumber(-Infinity, 9), 9);
  assert.equal(toNumber({}, 9), 9);
});

test('toNumber: the fallback is returned as given, even when it is not itself a number', () => {
  assert.equal(toNumber('x', undefined), undefined);
  assert.equal(toNumber('x', null), null);
  assert.equal(toNumber('x', NaN), NaN);
});
