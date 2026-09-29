/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The writer: a live board out to a v2 document (`./format.js`).
 *
 * A node is read off its blit's `spec` - the keys the blit carries - and
 * reshaped into the format's order and defaults. Children are the blits
 * directly inside, in document order (which is paint order), an offloaded one
 * read through its anchor so it is saved where it sits.
 *
 *   - `type` only when it is a registered type;
 *   - `fill` is the contents: a widget's trait options, else the core `fill`;
 *   - a named trait is `name: true`, or `name: options` when it carries them;
 *   - `chrome` whenever the blit declares it (a type's default surface varies);
 *     `bordered`, `selectableText`, `layout`, `gap`, the style overrides
 *     in force (`styleMap`) and the authored `class` (recorded in `data-class`)
 *     only when off their default;
 *   - `w`/`h` are the size in force, measured or declared.
 */
import { blit, type } from '../../.plugin/core/index.js';
import { parkedStateOf } from '../../.plugin/addons/offload.js';
import { styleMap } from '../../.plugin/addons/style.js';
import { contentKeyOf } from '../../.plugin/addons/widget.js';
import { createLogger } from '../../.plugin/log.js';
import { SANDBOX_FORMAT_VERSION } from './format.js';
import { PROTOTYPE_KEYS } from './reserved-keys.js';
import { NODE_KEYS } from './restore-tree.js';
import { writeBoardParts } from './board-parts.js';

const logger = /* @__PURE__ */ createLogger('sandbox/write');

/** Spec keys the node gives a place of its own, never written as traits. */
const OWN_KEYS = /* @__PURE__ */ new Set([...NODE_KEYS, 'editing']);

/** The blits directly inside `node`, parked ones included, in document order. */
export function childrenOf(node, out = []) {
  for (const child of node.childNodes) {
    if (child.nodeType === 8) {
      const parked = parkedStateOf(child);
      if (parked?.handle) out.push(parked.handle);
    } else if (child.nodeType === 1) {
      if (child.hasAttribute('data-blit')) out.push(blit(child));
      else childrenOf(child, out);
    }
  }
  return out;
}

/** The contents as a plain, JSON-safe object; prototype keys are never written. */
function fillOf(b, spec) {
  const key = contentKeyOf(b);
  const source = key ? spec[key] : spec.fill;
  const fill = {};
  if (!source || typeof source !== 'object') return fill;
  for (const [name, value] of Object.entries(source)) {
    if (value === undefined || typeof value === 'function' || PROTOTYPE_KEYS.includes(name)) continue;
    fill[name] = value;
  }
  return fill;
}

/** Every named trait but the contents key: `true`, or the options it carries. */
function writeTraits(b, spec, node) {
  const names = new Set(blit.use());
  const contentKey = contentKeyOf(b);
  for (const [name, value] of Object.entries(spec)) {
    if (OWN_KEYS.has(name) || name === contentKey || !names.has(name)) continue;
    if (PROTOTYPE_KEYS.includes(name)) {
      logger.warn(`blit "${node.id}": trait "${name}" collides with a spec key and is not saved`);
      continue;
    }
    if (value !== false && value !== undefined) node[name] = value;
  }
}

/** Surface and flow, each only when it differs from the default. */
function writeSurface(b, spec, node) {
  if (spec.chrome === 'false' || spec.chrome === 'true') node.chrome = spec.chrome === 'true';
  if (spec.bordered === 'false') node.bordered = false;
  if (spec.layout && spec.layout !== 'free' && spec.layout !== true) node.layout = spec.layout;
  const gap = Number(spec.gap);
  if (spec.gap !== undefined && Number.isFinite(gap)) node.gap = gap;
  if (spec.selectableText === 'true') node.selectableText = true;
  const style = styleMap(b);
  if (Object.keys(style).length > 0) node.style = style;
  const names = authoredClassesOf(b.el);
  if (names) node.class = names;
}

/** The authored class names an element was given and still wears, or null. */
function authoredClassesOf(element) {
  const declared = element.getAttribute('data-class');
  if (!declared) return null;
  const worn = declared.split(/\s+/).filter((name) => name && element.classList.contains(name));
  return worn.length > 0 ? worn.join(' ') : null;
}

/**
 * One blit and its subtree as a v2 node.
 * @param {object} b
 * @returns {object}
 */
export function serializeBlit(b) {
  const spec = b.spec;
  const node = { id: b.el.id, x: b.x, y: b.y };
  if (spec.type && type(spec.type)) node.type = spec.type;
  if (b.z !== 0) node.z = b.z;
  const { w, h } = b.size;
  if (w > 0) node.w = w;
  if (h > 0) node.h = h;

  const fill = fillOf(b, spec);
  if (Object.keys(fill).length > 0) node.fill = fill;
  if (spec.port) node.port = spec.port;
  writeTraits(b, spec, node);
  writeSurface(b, spec, node);

  const children = childrenOf(b.el).map(serializeBlit);
  if (children.length > 0) node.blits = children;
  return node;
}

/**
 * A whole board as a v2 document.
 * @param {object} app the board's root blit
 * @returns {{version: 2, blits: object[]}}
 */
export function serializeBoard(app) {
  if (!app || typeof app.find !== 'function') throw new TypeError('serializeBoard: a root blit is required');
  const saved = { version: SANDBOX_FORMAT_VERSION, blits: childrenOf(app.el).map(serializeBlit) };
  writeBoardParts(app, saved);
  return saved;
}
