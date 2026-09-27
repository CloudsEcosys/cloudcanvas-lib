/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The writer: a live session out to a v2 document (`./format.js`).
 *
 * The tree is walked through the public surface only - `pinManager.getRootPins()`
 * for the roots, `children` for membership - so a save is exactly what the
 * framework considers the canvas to be, and utility blits (the cursor) never
 * appear. Sibling order is read from the live DOM (`orderedByPaint`), at the root
 * and in every scope, because paint order is document order and that is the only
 * place a bring-to-front / send-to-back is recorded.
 *
 * What a spec captures, and what it does not:
 *   - `type` is the display type's registry name, and only when the registry can
 *     still resolve it; an anonymous display is left out and rebuilds as the default.
 *   - every other trait is a NAME (`name: true`), not its state: a trait restored
 *     by name is freshly initialised. Anything that must survive belongs in `fill`.
 *   - `fill` is the content map, JSON-safe (functions and `undefined` drop out).
 *   - physics state and vectors are not captured; neither is `active`, which the
 *     reload strategy derives at construction.
 *   - `chrome` is read off the element's class list, the one field with no public
 *     reader; `bordered`, `layout`, `gap`, `selectableText` and `style` (only the
 *     allow-listed overrides set inline) are public accessors.
 */

import { createLogger, traitRegistry } from '../../.plugin/index.js';
import { SANDBOX_FORMAT_VERSION } from './format.js';
import { PROTOTYPE_KEYS } from './reserved-keys.js';
import { NODE_KEYS } from './restore-tree.js';
import { writeSessionParts } from './session-parts.js';

const logger = /* @__PURE__ */ createLogger('sandbox/write');

/**
 * The default card surface's class. Mirrors a constant the core does not export
 * (`CARD_CLASS` in `.plugin/pins/pin-element.js`); see the header note on `chrome`.
 */
const CARD_CLASS = 'cloudcanvas-primitive-card';

/** The display type as a registry name, or null for an anonymous or unregistered one. */
function displayTypeOf(pin) {
  const trait = pin.displayTrait;
  const name = trait ? trait.name : null;
  return typeof name === 'string' && traitRegistry.has(name) ? name : null;
}

/** The content map as a plain, JSON-safe object; prototype keys are never written. */
function fillOf(pin) {
  const fill = {};
  for (const [key, value] of pin.contents) {
    if (value === undefined || typeof value === 'function' || PROTOTYPE_KEYS.includes(key)) continue;
    fill[key] = value;
  }
  return fill;
}

/**
 * Siblings in the order they paint, not the order they were made: the container's
 * live child order, mapped back by element identity. The container holds other
 * layers (the focus veil, the SVG layer) that belong to no blit, so only mapped
 * elements are placed; a sibling with no element there (unmounted, headless) keeps
 * its model order after everything the DOM placed.
 * @param {object[]} pins the sibling set, utility blits already removed
 * @param {Element|null} container the element their elements are children of
 */
function orderedByPaint(pins, container) {
  const domChildren = container && container.children ? container.children : null;
  if (!domChildren || pins.length < 2) return pins;

  const ownerOf = new Map();
  for (const pin of pins) if (pin.element) ownerOf.set(pin.element, pin);

  const ordered = [];
  const placed = new Set();
  for (const node of Array.from(domChildren)) {
    const pin = ownerOf.get(node);
    if (pin && !placed.has(pin)) { ordered.push(pin); placed.add(pin); }
  }
  for (const pin of pins) if (!placed.has(pin)) ordered.push(pin);
  return ordered;
}

/** A blit's children in paint order; the container is its own scope well. */
function orderedChildren(pin) {
  return orderedByPaint(Array.from(pin.children).filter((child) => !child.utility), pin.scopeElement);
}

/** A session's roots in paint order; their shared container is the canvas plane. */
function orderedRoots(session) {
  const roots = session.pinManager.getRootPins();
  const plane = roots.find((pin) => pin.element && pin.element.parentNode);
  return orderedByPaint(roots, plane ? plane.element.parentNode : null);
}

/** Every trait but the display type's own as a `name: true` key. */
function writeTraits(pin, spec) {
  for (const name of pin.traits.keys()) {
    if (name === spec.type) continue;
    if (NODE_KEYS.includes(name) || PROTOTYPE_KEYS.includes(name)) {
      logger.warn(`pin "${pin.id}": trait "${name}" collides with a spec key and is not saved`);
      continue;
    }
    spec[name] = true;
  }
}

/** Surface and flow, each only when it differs from the default. */
function writeSurface(pin, spec) {
  const classList = pin.element ? pin.element.classList : null;
  if (pin.reload && pin.reload !== 'active') spec.reload = pin.reload;
  if (!(classList && classList.contains(CARD_CLASS))) spec.chrome = false;
  if (pin.bordered === false) spec.bordered = false;
  if (pin.layout && pin.layout !== 'free') spec.layout = pin.layout;
  if (Number.isFinite(pin.layoutGap)) spec.gap = pin.layoutGap;
  if (pin.selectableText === true) spec.selectableText = true;
  const style = typeof pin.styleOverrides === 'object' ? pin.styleOverrides : null;
  if (style && Object.keys(style).length > 0) spec.style = style;
}

/**
 * One blit and its subtree as a v2 spec.
 * @param {object} pin
 * @returns {object}
 */
export function serializePin(pin) {
  const spec = { id: pin.id, x: pin.x, y: pin.y };
  const type = displayTypeOf(pin);
  if (type) spec.type = type;
  if (pin.z !== 0) spec.z = pin.z;
  if (pin.size.w > 0) spec.w = pin.size.w;
  if (pin.size.h > 0) spec.h = pin.size.h;

  const fill = fillOf(pin);
  if (Object.keys(fill).length > 0) spec.fill = fill;
  writeTraits(pin, spec);
  writeSurface(pin, spec);

  const children = orderedChildren(pin).map(serializePin);
  if (children.length > 0) spec.blits = children;
  return spec;
}

/**
 * A whole session as a v2 document.
 * @param {object} session a CloudCanvas session
 * @returns {{version: 2, blits: object[]}}
 */
export function serializeSession(session) {
  if (!session || !session.pinManager) {
    throw new TypeError('serializeSession: a CloudCanvasSession is required');
  }
  const saved = { version: SANDBOX_FORMAT_VERSION, blits: orderedRoots(session).map(serializePin) };
  writeSessionParts(session, saved);
  return saved;
}
