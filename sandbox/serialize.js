/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Board serialization: a live board out to a v2 document, and any saved
 * snapshot - v2, or v1 migrated on the way in - back onto a board.
 *
 * The entry point of the serializer, split by concern:
 *
 *   format.js        the v2 schema, the version door (`readDocument`), `SandboxFormatError`
 *   migrate-v1.js    the one-time, pure v1 -> v2 migration
 *   write.js         a board out: `serializeBlit`, `serializeBoard`
 *   restore-tree.js  a blit tree in: `restoreTree`, self-contained so exports embed it
 *   board-parts.js   reactions, theme, and product parts (the builder's pages)
 *   reserved-keys.js the reserved-key rule the loader and the builder's gate share
 *
 * This module is the read path that ties them together, and re-exports the rest.
 */
import { blit, type } from '../../.plugin/core/index.js';
import { contentKeyOf } from '../../.plugin/addons/widget.js';
import { safeUrl } from '../../.plugin/graphics/primitives/primitives.js';
import { readDocument } from './format.js';
import { restoreTree } from './restore-tree.js';
import { readBoardParts } from './board-parts.js';

export { SANDBOX_FORMAT_VERSION, SandboxFormatError } from './format.js';
export { migrateV1 } from './migrate-v1.js';
export { restoreTree } from './restore-tree.js';
export { serializeBlit, serializeBoard } from './write.js';

/** The key a type keeps its contents under when it is a widget, else null: read off a potential instance. */
export function contentKeyOfType(name) {
  const template = type(name);
  return template ? contentKeyOf(template) : null;
}

/** What the loader needs from the engine, the same surface an exported page's bundle provides. */
export const LOADER_API = /* @__PURE__ */ Object.freeze({ blit, type, contentKey: contentKeyOfType, safeUrl });

/**
 * Rebuild a snapshot onto a board: the tree first, then the board parts that
 * name its blits, so an entry whose blit did not come back is dropped with a warning.
 *
 * Returns the warnings rather than logging them: a caller restoring a sandbox needs
 * to *show* what did not come back, and a console line is not something a UI can
 * render.
 *
 * @param {object} app the board's root blit
 * @param {object|object[]} data a v2 or v1 snapshot, or a bare v1 root array
 * @returns {{blits: object[], warnings: string[]}}
 * @throws {TypeError} without a root; {@link SandboxFormatError} on an unreadable snapshot
 */
export function deserializeBoard(app, data) {
  if (!app || typeof app.find !== 'function') throw new TypeError('deserializeBoard: a root blit is required');
  const warnings = [];
  const saved = readDocument(data, warnings);
  const blits = restoreTree(LOADER_API, app, saved.blits, warnings);
  readBoardParts(app, saved, { exists: (id) => Boolean(app.find(id)), warn: (message) => warnings.push(message) });
  return { blits, warnings };
}
