/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The loader: a v2 blit tree (`./format.js`) rebuilt into a live session, and the
 * format's reactions mapped back to the store's shape.
 *
 * SELF-CONTAINED, AND WHY. `./export-static.js` embeds these functions' source text
 * in every exported page, where only `window.CloudCanvas` exists, instead of
 * keeping a second copy that drifts. So each function in {@link LOADER_FUNCTIONS}
 * may reference only its own arguments and the other functions in that list: no
 * import, no module-scope constant, no closure. Every engine dependency arrives
 * through `api` (the CloudCanvas namespace), and every rule is a literal inside
 * `restoreTree`; a unit test holds those literals equal to the exported constants
 * (`./reserved-keys.js`, {@link NODE_KEYS}) and the file:// browser test runs them.
 *
 * WHAT IS DROPPED AT LOAD, WITH A WARNING EACH:
 *   - a prototype key (`__proto__`, `constructor`, `prototype`) on any node or in
 *     any `fill`: copying one would rebind a prototype;
 *   - the `html` content key on a custom-type instance (a node whose `fill` carries
 *     `cc:typeName`), which a `card` renders as markup; a first-party `raw` node
 *     keeps its `html`;
 *   - a slot field (`fill.slots[].fields[]`) under a reserved key - `html`, a
 *     prototype key, or the `cc:` namespace - the same rule the builder's gate
 *     enforces (`isReservedFieldKey`);
 *   - a URL-bearing value (`src`, `href`, `url`, `poster`) the engine's `safeUrl`
 *     refuses (`javascript:`, `data:text/html`, ...), in `fill` or a slot field.
 *     Without `api.primitives.safeUrl` every such value is refused.
 * Unknown display types and traits warn and are skipped, never thrown: a canvas
 * that restores nine blits out of ten beats one that restores none.
 */

/**
 * The node keys the format gives a meaning to; every other key whose value is
 * `true` names a trait. `restoreTree` inlines the same list.
 */
export const NODE_KEYS = /* @__PURE__ */ Object.freeze([
  'id', 'type', 'x', 'y', 'z', 'w', 'h', 'fill', 'blits', 'reload', 'chrome', 'bordered',
  'layout', 'gap', 'selectableText', 'style', 'port', 'with'
]);

/**
 * Rebuild v2 blit specs into a session.
 * @param {{traitRegistry: object, applyPinStyleMap?: Function, primitives?: {safeUrl: Function}}} api
 * @param {object} session a CloudCanvas session
 * @param {object[]} nodes the root specs
 * @param {string[]} [warnings] collector for everything that could not be restored
 * @returns {object[]} the rebuilt roots
 */
export function restoreTree(api, session, nodes, warnings) {
  const context = {
    api: api || {},
    session: session,
    warn: function (message) { if (warnings) warnings.push(message); },
    rules: {
      typeMarkerKey: 'cc:typeName',
      reservedContentKey: 'html',
      reservedPrefix: 'cc:',
      prototypeKeys: ['__proto__', 'constructor', 'prototype'],
      urlKeys: ['src', 'href', 'url', 'poster'],
      flowModes: ['row', 'column', 'grid'],
      nodeKeys: ['id', 'type', 'x', 'y', 'z', 'w', 'h', 'fill', 'blits', 'reload', 'chrome', 'bordered',
        'layout', 'gap', 'selectableText', 'style', 'port', 'with']
    }
  };
  return (Array.isArray(nodes) ? nodes : [])
    .map(function (node) { return restoreNode(context, node, null); })
    .filter(Boolean);
}

/** One spec and its subtree; layout after the children, so it re-flags them in one pass. */
function restoreNode(context, node, parent) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null;
  const names = traitNamesOf(context, node);
  const pin = context.session.createPin(optionsOf(context, node, names, parent));
  attachTraits(context, pin, names);

  const children = Array.isArray(node.blits) ? node.blits : [];
  for (let index = 0; index < children.length; index += 1) restoreNode(context, children[index], pin);

  applyLayout(context, node, pin);
  // Re-validated key by key through the engine's own mutator, so a hand-edited map cannot write blind.
  const api = context.api;
  if (node.style && typeof node.style === 'object' && typeof api.applyPinStyleMap === 'function') {
    api.applyPinStyleMap(pin, node.style);
  }
  return pin;
}

/** Whether the registry can build a trait or display type under `name`. */
function isKnown(context, name) {
  const registry = context.api.traitRegistry;
  return Boolean(name && registry && registry.has(name));
}

/** The trait names a spec declares: its non-format keys set to `true`. */
function traitNamesOf(context, node) {
  const rules = context.rules;
  const names = [];
  const keys = Object.keys(node);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (rules.nodeKeys.indexOf(key) !== -1 || node[key] === false) continue;
    if (rules.prototypeKeys.indexOf(key) !== -1) context.warn('pin "' + node.id + '": dropped reserved key "' + key + '"');
    else if (node[key] === true) names.push(key);
    else context.warn('pin "' + node.id + '": unknown key "' + key + '" ignored');
  }
  return names;
}

/** The session's construction options for one spec. */
function optionsOf(context, node, names, parent) {
  const options = {
    id: typeof node.id === 'string' ? node.id : undefined,
    x: Number(node.x) || 0, y: Number(node.y) || 0, z: Number(node.z) || 0,
    reload: node.reload || 'active',
    chrome: node.chrome !== false,
    bordered: node.bordered !== false,
    selectableText: node.selectableText === true,
    contents: safeFill(context, node),
    draggable: names.indexOf('draggable') !== -1,
    selectable: names.indexOf('selectable') !== -1
  };
  if (Number(node.w) > 0) options.width = Number(node.w);
  if (Number(node.h) > 0) options.height = Number(node.h);
  if (parent) options.parent = parent;

  if (node.type && isKnown(context, node.type)) options.type = node.type;
  else if (node.type) context.warn('pin "' + node.id + '": display type "' + node.type + '" is not registered');
  return options;
}

/** A spec's fill with every dropped key gone - the original object when nothing is. */
function safeFill(context, node) {
  const raw = node.fill && typeof node.fill === 'object' && !Array.isArray(node.fill) ? node.fill : {};
  const keys = Object.keys(raw);
  const isInstance = keys.indexOf(context.rules.typeMarkerKey) !== -1;
  const safe = {};
  let changed = false;
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const problem = fillKeyProblem(context, key, raw[key], isInstance);
    if (problem) { changed = true; context.warn('pin "' + node.id + '": dropped ' + problem); continue; }
    safe[key] = key === 'slots' && Array.isArray(raw[key]) ? safeSlots(context, node, raw[key]) : raw[key];
    if (safe[key] !== raw[key]) changed = true;
  }
  return changed ? safe : raw;
}

/** Why one fill key must not reach a blit, or null. */
function fillKeyProblem(context, key, value, isInstance) {
  const rules = context.rules;
  if (rules.prototypeKeys.indexOf(key) !== -1 || (isInstance && key === rules.reservedContentKey)) {
    return 'reserved content key "' + key + '"' + (key === rules.reservedContentKey ? ' from a custom-type instance' : '');
  }
  if (rules.urlKeys.indexOf(key) !== -1 && isUnsafeUrl(context, value)) return 'unsafe URL in content key "' + key + '"';
  return null;
}

/** Slots with every reserved or unsafe field gone - the original array when nothing is. */
function safeSlots(context, node, slots) {
  let changed = false;
  const out = slots.map(function (slot) {
    if (!slot || typeof slot !== 'object' || !Array.isArray(slot.fields)) return slot;
    const fields = slot.fields.filter(function (field) {
      const problem = slotFieldProblem(context, field);
      if (problem) context.warn('pin "' + node.id + '": dropped ' + problem + ' from slot "' + slot.name + '"');
      return !problem;
    });
    if (fields.length === slot.fields.length) return slot;
    changed = true;
    return { name: slot.name, fields: fields };
  });
  return changed ? out : slots;
}

/** Why one slot field must not reach a blit, or null: the gate's reserved-key rule, and the URL rule. */
function slotFieldProblem(context, field) {
  if (!field || typeof field !== 'object') return null;
  const rules = context.rules;
  const key = typeof field.key === 'string' ? field.key.trim() : '';
  const reserved = rules.prototypeKeys.indexOf(key) !== -1 || key === rules.reservedContentKey
    || key.indexOf(rules.reservedPrefix) === 0;
  if (reserved) return 'reserved slot field "' + key + '"';
  if (rules.urlKeys.indexOf(key) !== -1 && isUnsafeUrl(context, field.value)) return 'unsafe URL in slot field "' + key + '"';
  return null;
}

/** Whether a URL-bearing value is one the engine's `safeUrl` refuses; fails closed without it. */
function isUnsafeUrl(context, value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  const primitives = context.api.primitives;
  if (!primitives || typeof primitives.safeUrl !== 'function') return true;
  return primitives.safeUrl(value, null) === null;
}

/** Every named trait the construction options did not already give. */
function attachTraits(context, pin, names) {
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    if (pin.traits.has(name)) continue;
    if (isKnown(context, name)) pin.addTrait(name);
    else context.warn('pin "' + pin.id + '": trait "' + name + '" is not registered');
  }
}

/** How a blit places its children; an unrecognised mode warns rather than throwing. */
function applyLayout(context, node, pin) {
  const layout = node.layout;
  if (layout && layout !== 'free') {
    if (context.rules.flowModes.indexOf(layout) !== -1) pin.layout = layout;
    else context.warn('pin "' + node.id + '": layout mode "' + layout + '" is not recognised');
  }
  if (Number.isFinite(node.gap)) pin.layoutGap = node.gap;
}

/**
 * The format's reactions (`{id, source, signal, action: {type, target, params}}`)
 * in the reaction store's shape; the store validates each on load.
 * @param {object[]} list
 * @returns {object[]}
 */
export function reactionsFromWire(list) {
  return (Array.isArray(list) ? list : []).map(function (entry) {
    const source = entry && typeof entry === 'object' ? entry : {};
    const action = source.action && typeof source.action === 'object' ? source.action : {};
    return {
      id: source.id,
      sourcePinId: source.source,
      signal: source.signal,
      action: { type: action.type, targetPinId: action.target, params: action.params }
    };
  });
}

/** Every function an exported page embeds, in source form: the whole loader. */
export const LOADER_FUNCTIONS = /* @__PURE__ */ Object.freeze([
  restoreTree, restoreNode, isKnown, traitNamesOf, optionsOf, safeFill, fillKeyProblem,
  safeSlots, slotFieldProblem, isUnsafeUrl, attachTraits, applyLayout, reactionsFromWire
]);
