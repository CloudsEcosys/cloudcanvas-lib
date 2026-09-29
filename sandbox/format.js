/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The sandbox save format, version 2, and the one door every load goes through.
 *
 * A document is a tree of blit specs - the plain object a blit's `spec`
 * getter returns and `root.blit(spec)` consumes - plus the session parts that
 * name blits rather than living in one:
 *
 *   { version: 2,
 *     blits:      Spec[],                        roots, in paint order
 *     reactions?: {id?, source, signal, action: {type, target, params}}[],
 *     pages?:     {id, name, home, folder?, order?}[], the builder's sitemap; `folder` files a page
 *     folders?:   {id, name, parent?}[],         its folders, in order (absent: none)
 *     theme?:     {'--cc-*': value} }            the host's token overrides
 *
 *   Spec = { id, x, y, z?, w?, h?, type?, fill?, <trait>: true, reload?, chrome?: boolean,
 *            bordered?: false, layout?, gap?, selectableText?: true, style?, class?,
 *            blits?: Spec[] }
 *
 * `type` is a registered display type; `fill` is the content by key (a type's text
 * slots, plus any structured value such as a slotted instance's `slots`); a named
 * trait is a key set to `true`, as in a core spec; `blits` are the children, in
 * paint order. The remaining keys ride as the `data-*` a blit would carry.
 * Every key is left out at its default (`z` 0, no size, no fill, `reload`
 * 'active', the type's own card surface, border on, `layout` 'free', stylesheet gap, no text
 * selection, no style, no class, no children) and every session part when it is
 * empty, so an untouched canvas is the smallest document the format allows. `id` is
 * the element id a root indexes a blit under, and what reactions and pages name.
 * `class` is authored class names (space-separated; never an engine namespace;
 * at most 32 of them, each at most 64 characters).
 * `pages` and `folders` are one product part, the builder's sitemap: a folder's
 * `parent` and a page's `folder` name a folder id, and one naming a folder that is
 * not there reads as top level; a page's `order` is its rank once the sitemap has
 * been reordered (absent: paint order). Both were added before v2 shipped, so a v2
 * document without them is simply a sitemap with no folders.
 *
 * Not stored: camera, trait state beyond a name, physics and vectors, and custom
 * type definitions (a global library of their own; an instance carries what it
 * needs in `fill`). Written by `./write.js`, loaded by `./restore-tree.js` and
 * `./board-parts.js`; v1 is migrated on load by `./migrate-v1.js`.
 */

import { createLogger } from '../../.plugin/log.js';
import { V1_NODES_KEY, migrateV1 } from './migrate-v1.js';

const logger = /* @__PURE__ */ createLogger('sandbox/format');

/** The version every save writes. */
export const SANDBOX_FORMAT_VERSION = 2;

/** The one earlier version the loader still reads, through `migrateV1`. */
const LEGACY_VERSION = 1;

/** The array each version keeps its node tree in: the shape a version label promises. */
const NODES_KEY = /* @__PURE__ */ Object.freeze({ [LEGACY_VERSION]: V1_NODES_KEY, [SANDBOX_FORMAT_VERSION]: 'blits' });

/** A document the loader cannot read: not a snapshot, or a version it does not know. */
export class SandboxFormatError extends TypeError {
  constructor(message) {
    super(message);
    this.name = 'SandboxFormatError';
  }
}

/** Log through the logger seam, then throw: a bad document is an error a caller must see. */
function refuse(message) {
  logger.error(message);
  throw new SandboxFormatError(message);
}

/**
 * Refuse a document whose shape is not the one its version label promises: its
 * node tree must be the array that version keeps it in. A mislabelled document -
 * a v1 tree marked version 2, or the reverse - would otherwise restore
 * as an empty canvas with no word said.
 */
function requireShape(data) {
  const key = NODES_KEY[data.version];
  if (Array.isArray(data[key])) return;
  const other = NODES_KEY[data.version === LEGACY_VERSION ? SANDBOX_FORMAT_VERSION : LEGACY_VERSION];
  const hint = Array.isArray(data[other]) ? `; it carries a "${other}" tree, so its version label is wrong` : '';
  refuse(`sandbox: a version ${data.version} document needs a "${key}" array${hint}`);
}

/**
 * Any loadable snapshot as a v2 document: v2 as is, v1 (and a bare v1 root array,
 * which the v1 loader accepted) migrated.
 * @param {unknown} data a parsed snapshot
 * @param {string[]} [warnings] collector for what a migration could not carry
 * @returns {{version: 2, blits: object[]}}
 * @throws {SandboxFormatError} on anything else - an unknown version, or a shape
 *   its version does not describe - after logging it
 */
export function readDocument(data, warnings = []) {
  if (Array.isArray(data)) return migrateV1(data, warnings);
  if (!data || typeof data !== 'object') refuse('sandbox: a snapshot must be an object');
  if (data.version !== LEGACY_VERSION && data.version !== SANDBOX_FORMAT_VERSION) {
    refuse(`sandbox: unsupported format version ${JSON.stringify(data.version ?? null)}; `
      + `this build reads versions ${LEGACY_VERSION} and ${SANDBOX_FORMAT_VERSION}`);
  }
  requireShape(data);
  return data.version === LEGACY_VERSION ? migrateV1(data, warnings) : data;
}
