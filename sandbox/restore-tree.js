/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The loader: a v2 blit tree (`./format.js`) rebuilt onto a board.
 *
 * SELF-CONTAINED, AND WHY. `./export-static.js` embeds these functions' source text
 * in every exported page, where only `window.CloudCanvas` exists, instead of
 * keeping a second copy that drifts. So each function in {@link LOADER_FUNCTIONS}
 * may reference only its own arguments and the other functions in that list: no
 * import, no module-scope constant, no closure. Every engine dependency arrives
 * through `api` - `{blit, type, contentKey, safeUrl}` - and every rule is a literal
 * inside `restoreTree`; a unit test holds those literals equal to the exported
 * constants (`./reserved-keys.js`, {@link NODE_KEYS}) and the file:// browser test
 * runs them.
 *
 * A node becomes a blit in steps - made with its id, type, placement and surface,
 * then its contents, then each trait - so one bad value costs that value, never
 * the blit. A trait saved under its legacy name (`draggable`, `resizable`, ...)
 * loads under its blit name; `reload` is no longer a thing and is skipped.
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
 *     Without `api.safeUrl` every such value is refused;
 *   - a `class` name that is not a plain CSS identifier, is over 64 characters, or
 *     claims one of the engine's own namespaces (`cloudcanvas-`, `cc-`, `is-`): a
 *     saved board may style a blit, never forge its engine state; every name past
 *     the 32nd kept, and a `class` that is not a string, are dropped too;
 *   - an unregistered type (the blit loads without it), an unknown trait, and any
 *     value its type, trait or the core refuses.
 */

/**
 * The node keys the format gives a meaning to; every other key whose value is
 * `true` names a trait. `restoreTree` inlines the same list.
 */
export const NODE_KEYS = /* @__PURE__ */ Object.freeze([
  'id', 'type', 'x', 'y', 'z', 'w', 'h', 'fill', 'blits', 'reload', 'chrome', 'bordered',
  'layout', 'gap', 'selectableText', 'style', 'class', 'port', 'with'
]);

/**
 * Rebuild v2 nodes onto a board.
 * @param {{blit: Function, type: Function, contentKey: Function, safeUrl?: Function}} api
 * @param {object} app the board's root blit
 * @param {object[]} nodes the top-level nodes
 * @param {string[]} [warnings] collector for everything that could not be restored
 * @returns {object[]} the rebuilt top-level blits
 */
export function restoreTree(api, app, nodes, warnings) {
  const context = {
    api: api || {},
    warn: function (message) { if (warnings) warnings.push(message); },
    rules: {
      typeMarkerKey: 'cc:typeName',
      reservedContentKey: 'html',
      reservedPrefix: 'cc:',
      prototypeKeys: ['__proto__', 'constructor', 'prototype'],
      urlKeys: ['src', 'href', 'url', 'poster'],
      flowModes: ['row', 'column', 'grid'],
      engineClassPrefixes: ['cloudcanvas-', 'cc-', 'is-'],
      maxClasses: 32,
      maxClassLength: 64,
      nodeKeys: ['id', 'type', 'x', 'y', 'z', 'w', 'h', 'fill', 'blits', 'reload', 'chrome', 'bordered',
        'layout', 'gap', 'selectableText', 'style', 'class', 'port', 'with'],
      traitAliases: { draggable: 'drag', selectable: 'select', resizable: 'resize', focussable: 'focus',
        connectable: 'connect', 'snap-to-grid': '', scope: '' },
      typeAliases: { select: 'dropdown' }
    }
  };
  context.traits = context.api.blit ? context.api.blit.use() : [];
  return (Array.isArray(nodes) ? nodes : [])
    .map(function (node) { return restoreNode(context, node, app); })
    .filter(Boolean);
}

/** One node and its subtree: made, filled, given its traits, then its children and classes. */
function restoreNode(context, node, parent) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null;
  let b;
  try {
    b = parent.blit(baseOf(context, node));
  } catch (error) {
    context.warn('blit "' + node.id + '": ' + error.message);
    return null;
  }
  fillBlit(context, node, b);
  const traits = traitsOf(context, node);
  for (let index = 0; index < traits.length; index += 1) setKey(context, node, b, traits[index][0], traits[index][1]);
  applyStyle(context, node, b);
  const children = Array.isArray(node.blits) ? node.blits : [];
  for (let index = 0; index < children.length; index += 1) restoreNode(context, children[index], b);
  applyClasses(context, node, b);
  return b;
}

/** Write one key, or warn with what refused it. */
function setKey(context, node, b, key, value) {
  try {
    const patch = {};
    patch[key] = value;
    b.set(patch);
  } catch (error) {
    context.warn('blit "' + node.id + '": ' + key + ' not restored (' + error.message + ')');
  }
}

/** A node's type under its current name: a type renamed since it was saved loads as what it is now. */
function typeOf(context, node) {
  const aliases = context.rules.typeAliases;
  return Object.prototype.hasOwnProperty.call(aliases, node.type) ? aliases[node.type] : node.type;
}

/** What a blit is made with: id, a registered type, placement and surface. */
function baseOf(context, node) {
  const spec = { x: Number(node.x) || 0, y: Number(node.y) || 0 };
  const type = typeOf(context, node);
  if (typeof node.id === 'string' && node.id) spec.id = node.id;
  if (Number(node.z)) spec.z = Number(node.z);
  if (Number(node.w) > 0) spec.w = Number(node.w);
  if (Number(node.h) > 0) spec.h = Number(node.h);
  if (type && context.api.type && context.api.type(type)) spec.type = type;
  else if (type) context.warn('blit "' + node.id + '": type "' + type + '" is not registered');
  if (node.chrome === false) spec.chrome = false;
  if (node.bordered === false) spec.bordered = false;
  if (node.selectableText === true) spec.selectableText = true;
  if (typeof node.port === 'string' && context.traits.indexOf(node.port) !== -1) spec.port = node.port;
  return spec;
}

/** The contents: a widget's under its trait key, anything else into its slots. */
function fillBlit(context, node, b) {
  const fill = safeFill(context, node);
  if (Object.keys(fill).length === 0) return;
  const type = typeOf(context, node);
  const key = type && context.api.contentKey ? context.api.contentKey(type) : null;
  if (key && b.el.getAttribute('data-type') === type) setKey(context, node, b, key, fill);
  else setKey(context, node, b, 'fill', fill);
}

/** The traits and flow a node declares, as `[key, value]` under their blit names. */
function traitsOf(context, node) {
  const rules = context.rules;
  const out = [];
  const keys = Object.keys(node);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const value = node[key];
    if (rules.nodeKeys.indexOf(key) !== -1 || value === false || value === null || value === undefined) continue;
    if (rules.prototypeKeys.indexOf(key) !== -1) { context.warn('blit "' + node.id + '": dropped reserved key "' + key + '"'); continue; }
    const name = Object.prototype.hasOwnProperty.call(rules.traitAliases, key) ? rules.traitAliases[key] : key;
    if (name === '') continue;
    if (context.traits.indexOf(name) !== -1) out.push([name, value]);
    else context.warn('blit "' + node.id + '": trait "' + key + '" is not registered');
  }
  if (node.layout && node.layout !== 'free') {
    if (rules.flowModes.indexOf(node.layout) !== -1) out.push(['layout', node.layout]);
    else context.warn('blit "' + node.id + '": layout mode "' + node.layout + '" is not recognised');
  }
  if (Number.isFinite(node.gap)) out.push(['gap', node.gap]);
  return out;
}

/** The style overrides, key by key: one the style trait refuses is dropped with a warning, the rest kept. */
function applyStyle(context, node, b) {
  const map = node.style;
  if (!map || typeof map !== 'object' || Array.isArray(map)) return;
  const kept = {};
  const keys = Object.keys(map);
  for (let index = 0; index < keys.length; index += 1) {
    const trial = Object.assign({}, kept);
    trial[keys[index]] = map[keys[index]];
    try {
      b.set({ style: trial });
      kept[keys[index]] = map[keys[index]];
    } catch (error) {
      context.warn('blit "' + node.id + '": style "' + keys[index] + '" not restored (' + error.message + ')');
    }
  }
  if (Object.keys(kept).length > 0) b.set({ style: kept });
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
    if (problem) { changed = true; context.warn('blit "' + node.id + '": dropped ' + problem); continue; }
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
      if (problem) context.warn('blit "' + node.id + '": dropped ' + problem + ' from slot "' + slot.name + '"');
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
  if (typeof context.api.safeUrl !== 'function') return true;
  return context.api.safeUrl(value, null) === null;
}

/**
 * A spec's authored `class` names onto the element, each a plain identifier outside
 * the engine's namespaces, at most `maxClasses` of them. The kept set is mirrored in
 * `data-class`, the record the writer reads back: the class list also holds engine
 * and trait classes.
 */
function applyClasses(context, node, b) {
  if (node.class === undefined || node.class === null) return;
  if (typeof node.class !== 'string') { context.warn('blit "' + node.id + '": class is not a string, dropped'); return; }
  const cap = context.rules.maxClasses;
  const kept = [];
  const names = node.class.split(/\s+/).filter(Boolean);
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    if (kept.length === cap) {
      context.warn('blit "' + node.id + '": dropped ' + (names.length - index) + ' class names over the cap of ' + cap);
      break;
    }
    if (!isAuthoredClass(context, name)) context.warn('blit "' + node.id + '": dropped class "' + name.slice(0, context.rules.maxClassLength) + '"');
    else if (kept.indexOf(name) === -1) kept.push(name);
  }
  if (kept.length === 0) return;
  b.el.classList.add.apply(b.el.classList, kept);
  b.el.setAttribute('data-class', kept.join(' '));
}

/**
 * Whether a class name may be authored: a plain CSS identifier within the length
 * cap, outside the engine's namespaces. `__proto__` passes as a literal class: the
 * name only ever reaches `classList` and a string array, never an object key.
 */
function isAuthoredClass(context, name) {
  const rules = context.rules;
  const engine = rules.engineClassPrefixes.some(function (prefix) { return name.indexOf(prefix) === 0; });
  return !engine && name.length <= rules.maxClassLength && /^[A-Za-z_][A-Za-z0-9_-]*$/.test(name);
}

/** Every function an exported page embeds, in source form: the whole loader. */
export const LOADER_FUNCTIONS = /* @__PURE__ */ Object.freeze([
  restoreTree, restoreNode, setKey, typeOf, baseOf, fillBlit, traitsOf, applyStyle, safeFill, fillKeyProblem,
  safeSlots, slotFieldProblem, isUnsafeUrl, applyClasses, isAuthoredClass
]);
