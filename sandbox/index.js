/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Sandbox utilities: the board, and taking it off the page and putting it back.
 *
 *  - board.js          : `createBoard` (a root with the standard add-ons), `allBlits`, `retype`, `clearBoard`
 *  - serialize.js      : a board as a v2 document of blit specs, and back (v1 migrated on load)
 *  - format.js         : the v2 schema and the version door
 *  - migrate-v1.js     : the one-time, pure v1 -> v2 migration
 *  - write.js          : the writer
 *  - restore-tree.js   : the self-contained loader an exported page embeds
 *  - board-parts.js    : reactions, theme, and the parts a product attaches (its pages)
 *  - reserved-keys.js  : the reserved-key rule the loader and the builder's gate share
 *  - persistence.js    : named snapshots in localStorage, and a debounced auto-save
 *  - zip.js            : a dependency-free STORE-mode ZIP writer
 *  - export-static.js  : a board as a standalone, serverless static site
 *  - runtime.js        : what an exported page's bundle carries (`dist/cloudcanvas.board.iife.js`)
 *
 * A barrel only. Every module here is importable on its own and they import each
 * other only downwards, so a page that only wants a zip writer pays for a zip
 * writer. The builder's product modules (custom types, the slotted type, the page
 * store) live in `.site`.
 */

export { BOARD_TRAITS, allBlits, cameraOf, clearBoard, createBoard, freshId, retype } from './board.js';
export {
  LOADER_API,
  SANDBOX_FORMAT_VERSION,
  SandboxFormatError,
  deserializeBoard,
  migrateV1,
  restoreTree,
  serializeBlit,
  serializeBoard
} from './serialize.js';
export { PART_KEYS, attachBoardPart } from './board-parts.js';
export {
  PROTOTYPE_KEYS,
  RESERVED_FIELD_KEYS,
  RESERVED_KEY_PREFIX,
  TYPE_NAME_KEY,
  isReservedFieldKey
} from './reserved-keys.js';
export {
  AUTO_SAVE_DEBOUNCE_MS,
  SANDBOX_KEY_PREFIX,
  autoSaveBoard,
  deleteSandbox,
  listSandboxKeys,
  loadSandbox,
  saveSandbox
} from './persistence.js';
export { createZip, crc32, dosTimestamp, downloadZip } from './zip.js';
export {
  BUNDLE_FILENAME,
  DATA_ID,
  ROOT_ID,
  buildStaticSite,
  downloadStaticSite,
  exportStaticSite,
  renderStaticHtml
} from './export-static.js';
