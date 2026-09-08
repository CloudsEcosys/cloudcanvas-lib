/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Sandbox utilities: taking a live canvas off the page and putting it back.
 *
 *  - serialize.js     : a session as a plain JSON tree, and back again
 *  - persistence.js   : named snapshots in localStorage, and a debounced auto-save
 *  - custom-types.js  : user-defined Pin presets in localStorage, global to the origin
 *  - slotted-type.js  : the display component a slotted custom type renders through
 *  - pages.js         : per-session page metadata (a name and Home flag per root Pin)
 *  - zip.js           : a dependency-free STORE-mode ZIP writer
 *  - export-static.js : a session as a standalone, serverless static site
 *
 * A barrel only. Every module here is importable on its own and none of them
 * import each other except downwards (`export-static` -> `serialize` + `zip`,
 * `persistence` -> `serialize`, `serialize` -> `pages`), so a page that only wants
 * a zip writer pays for a zip writer.
 */

export {
  SANDBOX_FORMAT_VERSION,
  deserializeSession,
  restoreTree,
  serializePin,
  serializeSession
} from './serialize.js';

export {
  AUTO_SAVE_DEBOUNCE_MS,
  SANDBOX_KEY_PREFIX,
  autoSaveSession,
  deleteSandbox,
  listSandboxKeys,
  loadSandbox,
  saveSandbox
} from './persistence.js';

export {
  CUSTOM_FIELD_KINDS,
  CUSTOM_TYPE_KEY_PREFIX,
  CUSTOM_TYPE_TRAITS,
  DEFAULT_CUSTOM_CATEGORY,
  TYPE_NAME_KEY,
  customTypeContents,
  customTypeSlotContents,
  deleteCustomType,
  getCustomType,
  isSlottedType,
  listCustomTypes,
  normalizeCustomType,
  saveCustomType
} from './custom-types.js';

export { SLOTTED_TYPE, registerSlottedType } from './slotted-type.js';

export { PageStore, pagesFor } from './pages.js';

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
