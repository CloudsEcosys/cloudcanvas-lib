/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Sandbox utilities: taking a live canvas off the page and putting it back.
 *
 *  - serialize.js      : a session as a v2 document of blit specs, and back (v1 migrated on load)
 *  - format.js         : the v2 schema and the version door
 *  - migrate-v1.js     : the one-time, pure v1 -> v2 migration
 *  - write.js          : the writer
 *  - restore-tree.js   : the self-contained loader an exported page embeds
 *  - session-parts.js  : reactions, theme, and the parts a product attaches (its pages)
 *  - reserved-keys.js  : the reserved-key rule the loader and the builder's gate share
 *  - persistence.js    : named snapshots in localStorage, and a debounced auto-save
 *  - pin-ops.js        : whole-session operations (`clearSession`) the builder surfaces share
 *  - zip.js            : a dependency-free STORE-mode ZIP writer
 *  - export-static.js  : a session as a standalone, serverless static site
 *
 * A barrel only. Every module here is importable on its own and they import each
 * other only downwards, so a page that only wants a zip writer pays for a zip
 * writer. The builder's product modules (custom types, the slotted type, the page
 * store) live in `.site`.
 */

export {
  SANDBOX_FORMAT_VERSION,
  SandboxFormatError,
  deserializeSession,
  migrateV1,
  restoreTree,
  serializePin,
  serializeSession
} from './serialize.js';

export { PART_KEYS, attachSessionPart } from './session-parts.js';

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
  autoSaveSession,
  deleteSandbox,
  listSandboxKeys,
  loadSandbox,
  saveSandbox
} from './persistence.js';

export { clearSession } from './pin-ops.js';

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

export {
  serializeGroup,
  saveGroup,
  loadGroup,
  listGroupKeys,
  deleteGroup,
  instantiateGroup,
  GROUP_STORAGE_PREFIX
} from '../../.plugin/pins/group.js';
