/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The add-on styles reuse the core's transform writer rather than a copy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTransform3D as coreFormat } from 'cloudcanvas/kernel';
import { formatTransform3D } from '../../plugins/styles.js';

test('port - plugins/styles re-exports the core formatTransform3D, one implementation', () => {
  assert.equal(formatTransform3D, coreFormat);
});
