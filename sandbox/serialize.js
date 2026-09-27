/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Session serialization: a live canvas out to a v2 document, and any saved
 * snapshot - v2, or v1 migrated on the way in - back into a session.
 *
 * The entry point of the serializer, split by concern:
 *
 *   format.js        the v2 schema, the version door (`readDocument`), `SandboxFormatError`
 *   migrate-v1.js    the one-time, pure v1 -> v2 migration
 *   write.js         a session out: `serializePin`, `serializeSession`
 *   restore-tree.js  a blit tree in: `restoreTree`, self-contained so exports embed it
 *   session-parts.js reactions, theme, and product parts (the builder's pages)
 *   reserved-keys.js the reserved-key rule the loader and the builder's gate share
 *
 * This module is the read path that ties them together, and re-exports the rest.
 */

import { applyPinStyleMap, primitives, traitRegistry } from '../../.plugin/index.js';
import { readDocument } from './format.js';
import { restoreTree } from './restore-tree.js';
import { readSessionParts } from './session-parts.js';

export { SANDBOX_FORMAT_VERSION, SandboxFormatError } from './format.js';
export { migrateV1 } from './migrate-v1.js';
export { restoreTree } from './restore-tree.js';
export { serializePin, serializeSession } from './write.js';

/**
 * Rebuild a snapshot into a session: the tree first, then the session parts that
 * name its blits, so an entry whose blit did not come back is dropped with a warning.
 *
 * Returns the warnings rather than logging them: a caller restoring a sandbox needs
 * to *show* what did not come back, and a console line is not something a UI can
 * render.
 *
 * @param {object} session a CloudCanvas session
 * @param {object|object[]} data a v2 or v1 snapshot, or a bare v1 root array
 * @returns {{pins: object[], warnings: string[]}}
 * @throws {TypeError} without a session; {@link SandboxFormatError} on an unreadable snapshot
 */
export function deserializeSession(session, data) {
  if (!session || typeof session.createPin !== 'function') {
    throw new TypeError('deserializeSession: a CloudCanvasSession is required');
  }

  const warnings = [];
  const saved = readDocument(data, warnings);
  const pins = restoreTree({ traitRegistry, applyPinStyleMap, primitives }, session, saved.blits, warnings);
  readSessionParts(session, saved, {
    exists: (id) => Boolean(session.getPin(id)),
    warn: (message) => warnings.push(message)
  });
  return { pins, warnings };
}
