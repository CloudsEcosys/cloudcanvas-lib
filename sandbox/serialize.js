/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Session serialization: a live canvas out to a plain JSON tree, and back.
 *
 * The tree is walked through the public surface only - `session.pinManager`'s
 * `getRootPins()` for the roots, `pin.children` for membership - so a sandbox
 * snapshot is exactly what the framework itself considers the canvas to be, and
 * utility Pins (the cursor Pin) never appear in one. Sibling *order* is read from
 * the live DOM rather than from the model (see `orderedByPaint`), at the root
 * level and inside every scope alike, because paint order is document order and
 * that is the only place a bring-to-front / send-to-back is recorded.
 *
 * WHAT IS AND IS NOT CAPTURED, stated plainly rather than discovered later:
 *
 *   - The display type is recorded by *registry name* (`type`), and only when
 *     the shared `traitRegistry` can still resolve it. A Pin carrying an
 *     anonymous `DisplayTrait` - what `createPin` gives you when you declare no
 *     type at all - serializes as `type: null` and rebuilds as the same default.
 *
 *   - Every other trait is recorded as a NAME and nothing else (`traitNames`).
 *     This is a scope limit, not an oversight: `draggable`, `selectable`,
 *     `focussable` and `scope` carry no state a restore could meaningfully put
 *     back, and a trait that *does* (a `connectable`'s live connection set, a
 *     component trait's private caches) holds object references into a graph
 *     that no longer exists on the other side of a JSON round-trip. Restoring
 *     such a trait by name gives you a working, freshly-initialised one; it does
 *     not give you the one you had. Anything a consumer needs to survive the
 *     round-trip belongs in `pin.contents`, which is captured in full.
 *
 *   - The particle's vector list is not captured, and neither is the rest of its
 *     physics state (`vx`, `vy`, `mass`, `friction`, `pinned`, `metadata`).
 *     Position and size are. A Pin whose display reads a vector - the
 *     `vector-pointer` type's needle - restores pointing at zero, so a consumer
 *     that treats vectors as data rather than as simulation state should mirror
 *     them into `contents`.
 *
 *   - `active` is not captured. It is derived from the reload strategy at
 *     construction (lazy Pins are born asleep, everything else awake), and
 *     recording a transient wake state would restore a lazy scope as
 *     provisioned when its provider never ran.
 *
 *   - `chrome` is read back off the element's class list. It is the one field
 *     here with no public reader on `Pin` - a construction-time option only -
 *     and so the one place this module touches a class name the core does not
 *     export. (`bordered`, the finer-grained sibling, *is* a public accessor and
 *     is read as one.) An adopted Pin (`session.adopt`) carries the author's own
 *     markup and classes, and reports `chrome: false`; restoring one synthesises
 *     a new Pin rather than recovering that markup.
 *
 *   - `layout` and `gap` (how a Pin arranges its *children* - the flow mode and
 *     its spacing) are captured as public accessors, the counterparts to
 *     `bordered`: `pin.layout` (`'free'|'row'|'column'|'grid'`) and
 *     `pin.layoutGap` (pixels, or null for the stylesheet default) both round-trip
 *     as one key each. A snapshot written before these existed carries neither key;
 *     an absent `layout` restores as `'free'` and an absent `gap` as unset, so an
 *     old snapshot is indistinguishable from a Pin that never left the default.
 *
 * `restoreTree` is deliberately self-contained: no imports, no module-scope
 * references, every dependency arrives through its `api` argument. That is what
 * lets `./export-static.js` stringify this exact function into a generated page
 * where only `window.CloudCanvas` exists, instead of keeping a second copy of
 * the reconstruction logic that drifts the first time either side changes.
 */

import { traitRegistry } from '../../src/index.js';

/** Snapshot format version, bumped whenever a captured field changes meaning. */
export const SANDBOX_FORMAT_VERSION = 1;

/**
 * The default card surface's class.
 *
 * Mirrors a constant the core does not export (`CARD_CLASS` in
 * `src/pins/pin-element.js`); see the header note on `chrome`.
 */
const CARD_CLASS = 'cloudcanvas-primitive-card';

/* ------------------ SERIALIZE ------------------ */

/** Whether the shared registry can build a trait under this name. */
function registered(name) {
  return typeof name === 'string' && traitRegistry.has(name);
}

/**
 * The Pin's display type as a registry name, or null.
 *
 * Null is the honest answer for an anonymous or ad-hoc display trait: a name the
 * registry cannot resolve would restore as a hard failure, and guessing at the
 * `displayType` behind it would silently rebuild a different Pin.
 */
function displayTypeOf(pin) {
  const trait = pin.displayTrait;
  const name = trait ? trait.name : null;
  return registered(name) ? name : null;
}

/**
 * The Pin's contents as a plain, JSON-safe object.
 *
 * Functions and `undefined` are dropped rather than stringified: both vanish in
 * `JSON.stringify` anyway, and dropping them here means the serialized tree is
 * the same object the persistence layer will write.
 */
function plainContents(pin) {
  const contents = {};

  for (const [key, value] of pin.contents) {
    if (value === undefined || typeof value === 'function') continue;
    contents[key] = value;
  }

  return contents;
}

/** Whether the Pin's root element still carries the default card surface. */
function hasChrome(pin) {
  const classList = pin.element ? pin.element.classList : null;
  return Boolean(classList && classList.contains(CARD_CLASS));
}

/**
 * A set of sibling Pins in the order they will paint, not the order they were
 * made.
 *
 * Paint order among siblings is document order ("the DOM is the model", see
 * `bringToFront`/`sendToBack` in `src/engine/context-menu.js`), and those
 * commands move the real element without touching the model - neither
 * `pin.children`, a Set frozen at insertion order, nor `getRootPins()`, which
 * reports registration order. Walking either would restore a re-ordered canvas
 * back to creation order, losing every bring-to-front the user ever did. So the
 * live child order of the container element is the source of truth here, mapped
 * back to the owning Pins by element identity.
 *
 * The container is not scanned for anything but those elements, which is what
 * makes the same walk correct for a scope well and for the canvas plane: the
 * plane also holds the focus veil and the SVG layer, and neither belongs to a
 * Pin, so neither is in the identity map and neither is placed.
 *
 * A Pin with no element *in* that container - an unmounted/offloaded Pin, or any
 * Pin at all in a headless session with no DOM - has no DOM position to read, so
 * it keeps its model order and is appended after everything the DOM placed. That
 * fallback is also the whole answer when the container does not exist yet
 * (nothing has been rendered), which is exactly a pre-render snapshot.
 *
 * @param {Pin[]} pins the sibling set, utility Pins already removed
 * @param {Element|null} container the element their elements are children of
 * @returns {Pin[]} the same Pins, in paint order
 */
function orderedByPaint(pins, container) {
  const domChildren = container && container.children ? container.children : null;
  if (!domChildren || pins.length < 2) return pins;

  const ownerOf = new Map();
  for (const pin of pins) {
    if (pin.element) ownerOf.set(pin.element, pin);
  }

  const ordered = [];
  const placed = new Set();
  for (const node of Array.from(domChildren)) {
    const pin = ownerOf.get(node);
    if (pin && !placed.has(pin)) {
      ordered.push(pin);
      placed.add(pin);
    }
  }
  // Anything the DOM did not place (no mounted element) keeps its original
  // relative order, after everything that was on screen.
  for (const pin of pins) {
    if (!placed.has(pin)) ordered.push(pin);
  }
  return ordered;
}

/** A Pin's children in paint order; the container is its own scope well. */
function orderedChildren(pin) {
  const children = Array.from(pin.children).filter((child) => !child.utility);
  return orderedByPaint(children, pin.scopeElement);
}

/**
 * A session's root Pins in paint order.
 *
 * The roots' shared container is the canvas plane - the element `bringToFront`
 * reaches when the Pin it is given has no parent - so a z-order change made on
 * open canvas is read back exactly as one made inside a scope well.
 */
function orderedRoots(session) {
  const roots = session.pinManager.getRootPins();
  const plane = roots.find((pin) => pin.element && pin.element.parentNode);
  return orderedByPaint(roots, plane ? plane.element.parentNode : null);
}

/**
 * One Pin and its subtree as a plain object.
 *
 * @param {Pin} pin
 * @returns {object}
 */
export function serializePin(pin) {
  return {
    id: pin.id,
    x: pin.x,
    y: pin.y,
    z: pin.z,
    width: pin.particle.width,
    height: pin.particle.height,
    type: displayTypeOf(pin),
    contents: plainContents(pin),
    reload: pin.reload,
    chrome: hasChrome(pin),
    // `!== false` rather than `Boolean(...)`: both sides default to a painted
    // border, so a core without the accessor round-trips as a no-op.
    bordered: pin.bordered !== false,
    // How this Pin arranges its children. `layout` is always a string ('free' by
    // default); `gap` is a number or null (the stylesheet-default marker). Both
    // are emitted unconditionally, like `chrome`/`bordered`, so an absent key
    // means "written before layout existed" and reads back as the default.
    layout: pin.layout,
    gap: pin.layoutGap,
    selectableText: pin.selectableText,
    traitNames: Array.from(pin.traits.keys()),
    // Paint order, read from the live DOM, so a bring-to-front / send-to-back
    // survives the round-trip instead of snapping back to creation order.
    children: orderedChildren(pin).map(serializePin)
  };
}

/**
 * A whole session as a plain, JSON-safe snapshot.
 *
 * @param {CloudCanvasSession} session
 * @returns {{version: number, pins: object[]}}
 */
export function serializeSession(session) {
  if (!session || !session.pinManager) {
    throw new TypeError('serializeSession: a CloudCanvasSession is required');
  }

  return {
    version: SANDBOX_FORMAT_VERSION,
    // Paint order, for the same reason the children are (see `orderedByPaint`):
    // a bring-to-front on open canvas is recorded nowhere but the DOM.
    pins: orderedRoots(session).map(serializePin)
  };
}

/* ------------------ DESERIALIZE ------------------ */

/**
 * Rebuild a serialized tree into a session. Pure, self-contained, stringifiable.
 *
 * Every dependency arrives through `api` (the CloudCanvas namespace - `src/index.js`
 * here, `window.CloudCanvas` in an exported page), so this function's source text
 * is a complete implementation on its own. Do not add an import, a module-scope
 * constant, or a closure reference to it: `./export-static.js` embeds
 * `String(restoreTree)` verbatim, and any of those would produce a page that
 * throws a ReferenceError on load.
 *
 * Missing trait names are collected, never thrown: a sandbox that restores
 * nine Pins out of ten is worth more than one that restores none because a
 * component library was not registered.
 *
 * Longer than this codebase's usual ceiling for one function, and deliberately:
 * its steps *are* extracted (`optionsFor`, `attachTraits`, `applyLayout`, `build`,
 * none of them more than twenty lines), they simply cannot be lifted out of the
 * enclosing scope without breaking the self-containment above.
 *
 * @param {{traitRegistry: TraitRegistry}} api
 * @param {CloudCanvasSession} session
 * @param {object[]} nodes serialized root Pins
 * @param {string[]} [warnings] collector for everything that could not be restored
 * @returns {Pin[]} the reconstructed root Pins
 */
export function restoreTree(api, session, nodes, warnings) {
  const registry = api ? api.traitRegistry : null;
  const known = (name) => Boolean(name && registry && registry.has(name));
  const warn = (message) => { if (warnings) warnings.push(message); };

  // The non-`free` layout modes this restore recognises. Inlined for the same
  // self-containment reason `optionsFor` inlines its option vocabulary: an unknown
  // value must warn, not throw, and the live setter throws - so it is gated here.
  const flowModes = ['row', 'column', 'grid'];

  function optionsFor(node, names, parent) {
    const options = {
      id: node.id,
      x: Number(node.x) || 0, y: Number(node.y) || 0, z: Number(node.z) || 0,
      reload: node.reload || 'active',
      chrome: node.chrome !== false,
      bordered: node.bordered !== false,
      selectableText: Boolean(node.selectableText),
      contents: node.contents && typeof node.contents === 'object' ? node.contents : {},
      draggable: names.indexOf('draggable') !== -1,
      selectable: names.indexOf('selectable') !== -1
    };

    if (Number(node.width) > 0) options.width = Number(node.width);
    if (Number(node.height) > 0) options.height = Number(node.height);
    if (parent) options.parent = parent;

    if (node.type && known(node.type)) options.type = node.type;
    else if (node.type) warn('pin "' + node.id + '": display type "' + node.type + '" is not registered');

    return options;
  }

  function attachTraits(pin, names) {
    for (let index = 0; index < names.length; index += 1) {
      const name = names[index];
      if (pin.traits.has(name)) continue;
      if (known(name)) pin.addTrait(name);
      else warn('pin "' + pin.id + '": trait "' + name + '" is not registered');
    }
  }

  // `layout`/`gap` govern how a Pin places its CHILDREN, so they are applied
  // *after* the subtree exists (see the `build` call site): setting `pin.layout`
  // then makes every already-restored child a flow child in one sweep - the same
  // path the live UI drives - rather than fighting each child's initial position
  // restoration as it attaches. An absent `layout` leaves the Pin at its 'free'
  // default and an absent `gap` at unset, so a pre-layout snapshot is a no-op; an
  // unrecognised mode warns rather than throwing, like an unregistered type.
  function applyLayout(node, pin) {
    const layout = node.layout;
    if (layout && layout !== 'free') {
      if (flowModes.indexOf(layout) !== -1) pin.layout = layout;
      else warn('pin "' + node.id + '": layout mode "' + layout + '" is not recognised');
    }
    if (Number.isFinite(node.gap)) pin.layoutGap = node.gap;
  }

  function build(node, parent) {
    if (!node || typeof node !== 'object') return null;

    const names = Array.isArray(node.traitNames) ? node.traitNames : [];
    const pin = session.createPin(optionsFor(node, names, parent));
    attachTraits(pin, names);

    const children = Array.isArray(node.children) ? node.children : [];
    for (let index = 0; index < children.length; index += 1) build(children[index], pin);

    // After the children exist: layout re-flags them all in a single pass.
    applyLayout(node, pin);

    return pin;
  }

  return (Array.isArray(nodes) ? nodes : []).map((node) => build(node, null)).filter(Boolean);
}

/**
 * Rebuild a snapshot into a session.
 *
 * Returns the warnings alongside the Pins rather than logging or throwing them:
 * a caller restoring a sandbox needs to *show* what did not come back, and a
 * console line is not something a UI can render.
 *
 * @param {CloudCanvasSession} session
 * @param {{pins: object[]}|object[]} data a snapshot, or a bare root array
 * @returns {{pins: Pin[], warnings: string[]}}
 */
export function deserializeSession(session, data) {
  if (!session || typeof session.createPin !== 'function') {
    throw new TypeError('deserializeSession: a CloudCanvasSession is required');
  }

  const nodes = Array.isArray(data) ? data : (data && data.pins);
  const warnings = [];
  const pins = restoreTree({ traitRegistry }, session, nodes, warnings);

  return { pins, warnings };
}
