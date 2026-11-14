/*!
 * CloudCanvas lib v0.7.1 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */

// ui/dom.js
function documentOf(host) {
  const doc = host?.ownerDocument ?? null;
  if (!host || typeof host.append !== "function" || !doc?.createElement) {
    throw new TypeError("A host element attached to a document is required");
  }
  return doc;
}
function applyAttrs(node, attrs) {
  for (const [name, value] of Object.entries(attrs ?? {})) {
    if (value === null || value === void 0 || value === false) continue;
    node.setAttribute(name, value === true ? "" : String(value));
  }
}
function el(doc, tag, { className = "", text: text2, attrs } = {}) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text2 !== void 0 && text2 !== null) node.append(doc.createTextNode(String(text2)));
  applyAttrs(node, attrs);
  return node;
}
var SVG_NS = "http://www.w3.org/2000/svg";
function svg(doc, tag, attrs = {}) {
  const node = doc.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  return node;
}
function textNode(doc, parent, value = "") {
  const node = doc.createTextNode(String(value ?? ""));
  parent.append(node);
  return node;
}
function writeText(node, value) {
  const next = String(value ?? "");
  if (node.data !== next) node.data = next;
}
var BUTTON_CLASS = "cloudcanvas-ui-button";
function isOff(node) {
  return node.getAttribute("aria-disabled") === "true";
}
function setOff(node, off) {
  if (off) node.setAttribute("aria-disabled", "true");
  else node.removeAttribute("aria-disabled");
}
function button(doc, { label, className = "", ariaLabel, title, disabled = false, off = false, onClick: onClick3, signal, attrs } = {}) {
  const node = el(doc, "button", { className: className ? `${BUTTON_CLASS} ${className}` : BUTTON_CLASS, text: label, attrs });
  node.type = "button";
  if (ariaLabel) node.setAttribute("aria-label", ariaLabel);
  if (title) node.title = title;
  node.disabled = Boolean(disabled);
  setOff(node, off);
  if (typeof onClick3 === "function") {
    node.addEventListener("click", (event) => {
      if (!isOff(node)) onClick3(event);
    }, signal ? { signal } : void 0);
  }
  return node;
}
var FIELD_CLASS = "cloudcanvas-ui-field";
var SR_ONLY_CLASS = "cloudcanvas-ui-sr-only";
function input(doc, options = {}) {
  const { type = "text", label, value, placeholder, name, className = "", required = false } = options;
  const classes = className ? `${FIELD_CLASS} ${className}` : FIELD_CLASS;
  const node = el(doc, type === "textarea" ? "textarea" : "input", { className: classes, attrs: options.attrs });
  if (type !== "textarea") node.type = type;
  if (label && !node.hasAttribute("aria-labelledby")) node.setAttribute("aria-label", String(label));
  if (placeholder) node.placeholder = String(placeholder);
  if (name) node.name = String(name);
  if (value !== void 0 && value !== null) node.value = String(value);
  node.required = Boolean(required);
  if (typeof options.onInput === "function") {
    node.addEventListener("input", () => options.onInput(node.value), options.signal ? { signal: options.signal } : void 0);
  }
  return node;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function visualBox(view) {
  const viewport = view.visualViewport;
  return {
    left: viewport?.offsetLeft ?? 0,
    top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? view.innerWidth,
    height: viewport?.height ?? view.innerHeight
  };
}
var ITEM_ID = "data-ui-id";
var ITEM_PART = "data-ui-for";
function itemNodeOf(element, root = null) {
  const from = element?.nodeType === 3 ? element.parentElement : element;
  const node = from?.closest?.(`[${ITEM_ID}], [${ITEM_PART}]`) ?? null;
  return node && (root === null || root.contains(node)) ? node : null;
}
function itemIdOf(element) {
  const node = itemNodeOf(element);
  return node ? node.getAttribute(ITEM_ID) ?? node.getAttribute(ITEM_PART) : null;
}
function markSelected(node, selected) {
  node.classList.toggle("is-selected", selected);
  if (selected) node.setAttribute("aria-current", "true");
  else node.removeAttribute("aria-current");
}
function uniqueItems(items, kind) {
  if (!Array.isArray(items)) throw new TypeError(`${kind} items must be an array`);
  const ids = /* @__PURE__ */ new Set();
  for (const item of items) {
    const id = item?.id;
    if (typeof id !== "string" || id.trim() === "" || ids.has(id)) {
      throw new TypeError(`Invalid or duplicate ${kind} id: ${String(id)}`);
    }
    ids.add(id);
  }
  return items;
}
function focusablesIn(root) {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll(selector)).filter((node) => !node.disabled && !node.closest("[hidden]") && node.getAttribute("tabindex") !== "-1");
}
var sequence = 0;
function uniqueId(prefix) {
  sequence += 1;
  return `${prefix}-${sequence}`;
}
function createLife() {
  const controller = new AbortController();
  const timers = /* @__PURE__ */ new Set();
  const disposers = [];
  return {
    get signal() {
      return controller.signal;
    },
    get dead() {
      return controller.signal.aborted;
    },
    on(target, type, handler, options = {}) {
      if (!controller.signal.aborted) target.addEventListener(type, handler, { ...options, signal: controller.signal });
    },
    later(fn, ms) {
      if (controller.signal.aborted) return () => {
      };
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return () => {
        clearTimeout(id);
        timers.delete(id);
      };
    },
    add(dispose) {
      disposers.push(dispose);
    },
    destroy() {
      if (controller.signal.aborted) return false;
      controller.abort();
      for (const id of timers) clearTimeout(id);
      timers.clear();
      for (const dispose of disposers.splice(0).reverse()) dispose();
      return true;
    }
  };
}

// ui/render.js
function setValue(control, value) {
  const next = String(value ?? "");
  if (control.ownerDocument.activeElement === control || control.value === next) return false;
  control.value = next;
  return true;
}
function setLabel(node, label) {
  const next = String(label ?? "");
  let written = false;
  for (const name of ["aria-label", "title"]) {
    if (node.getAttribute(name) === next) continue;
    node.setAttribute(name, next);
    written = true;
  }
  return written;
}
function show(node, visible) {
  const hidden = !visible;
  if (node.hidden === hidden) return false;
  node.hidden = hidden;
  return true;
}
function keepFocus(scope, active) {
  if (!active || typeof active.focus !== "function" || !scope.contains(active)) return false;
  if (active.ownerDocument.activeElement === active) return false;
  active.focus();
  return true;
}
function placeChildren(container, nodes) {
  nodes.forEach((node, index) => {
    const at = container.childNodes[index] ?? null;
    if (at !== node) container.insertBefore(node, at);
  });
  while (container.childNodes.length > nodes.length) container.lastChild.remove();
}
function entryFor(entries, create, item, key) {
  if (entries.has(key)) return entries.get(key);
  const entry = create(item);
  if (!entry?.node) throw new TypeError(`rowCache: create() returned no node for key "${key}"`);
  entries.set(key, entry);
  return entry;
}
function rowCache({ create, update: update2, key = (item) => item.id } = {}) {
  if (typeof create !== "function") throw new TypeError("rowCache: create must be a function");
  const entries = /* @__PURE__ */ new Map();
  return {
    sync(items) {
      const seen = /* @__PURE__ */ new Set();
      const nodes = [];
      for (const item of items) {
        const id = String(key(item));
        if (seen.has(id)) throw new TypeError(`Duplicate row key: ${id}`);
        seen.add(id);
        const entry = entryFor(entries, create, item, id);
        update2?.(entry, item);
        nodes.push(entry.node);
      }
      for (const id of [...entries.keys()]) if (!seen.has(id)) entries.delete(id);
      return nodes;
    },
    get: (id) => entries.get(String(id)) ?? null
  };
}

// ui/roving.js
var STEPS = Object.freeze({
  horizontal: { ArrowLeft: -1, ArrowRight: 1 },
  vertical: { ArrowUp: -1, ArrowDown: 1 },
  both: { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 }
});
function nextIndex(key, index, count, { orientation = "vertical", wrap = false } = {}) {
  if (count <= 0) return null;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  const step = STEPS[orientation]?.[key];
  if (step === void 0) return null;
  const from = index < 0 ? step > 0 ? -1 : count : index;
  const to = from + step;
  if (wrap) return (to + count) % count;
  return Math.min(count - 1, Math.max(0, to));
}
function setTabStop(nodes, current) {
  for (const node of nodes) node.setAttribute("tabindex", node === current ? "0" : "-1");
}
function isTypingTarget(event) {
  const target = event.target;
  if (!target || typeof target.closest !== "function") return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
}

// plugins/css/announce.js
var LIVE_REGION_CSS = `/* ------------------ UTILITY ------------------ */

/* Announcement target for assistive technology: in the accessibility tree,
   out of the visual one. */
.cloudcanvas-live-region {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

`;

// ui/css/controls.js
var UI_CONTROLS_CSS = `${LIVE_REGION_CSS}/* ------------------ UI KIT: CONTROLS ------------------ */

.cloudcanvas-ui-button {
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  font: inherit;
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-btn-text, #7dd3fc);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-button:hover:not(:disabled):not([aria-disabled="true"]) { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }
.cloudcanvas-ui-button.is-primary { color: var(--cc-ui-on-accent, #0f172a); background: var(--cc-accent, #38bdf8); }
/* A danger button keeps the page's ink and says so by its border: the tone's colour is not one ink that clears 4.5:1 on both the dark and the light page. */
.cloudcanvas-ui-button.is-danger { color: var(--cc-text, #e2e8f0); border-color: var(--cc-tone-danger, #f87171); border-width: 2px; font-weight: var(--cc-weight-semibold, 600); }
/* Off is unavailable for now: drawn as disabled is, and still there to be focused and read. */
.cloudcanvas-ui-button:disabled, .cloudcanvas-ui-button[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
.cloudcanvas-ui-field {
  box-sizing: border-box;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  font: inherit;
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-input-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--cc-input-border, rgba(255, 255, 255, 0.16));
  border-radius: var(--cc-radius-sm, 6px);
}
:is(.cloudcanvas-ui-button, .cloudcanvas-ui-field, .cloudcanvas-ui-splitter, .cloudcanvas-ui-results-option,
  .cloudcanvas-ui-dialog-panel, .cloudcanvas-ui-kanban-card, .cloudcanvas-ui-kanban-label[data-ui-id], .cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head,
  .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-calendar-more, .cloudcanvas-ui-calendar-scroller, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-timeline-group-label, .cloudcanvas-ui-graph-node,
  .cloudcanvas-ui-breadcrumbs-open, .cloudcanvas-ui-tree-row, .cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-remove,
  .cloudcanvas-ui-navbar-link):focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}
/* Its parent clips what is drawn outside it, so the hour grid wears the ring inside. */
.cloudcanvas-ui-calendar-scroller:focus-visible { outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px)); }
.cloudcanvas-ui-dialog, .cloudcanvas-ui-tabs, .cloudcanvas-ui-results, .cloudcanvas-ui-status, .cloudcanvas-ui-toasts,
.cloudcanvas-ui-composer, .cloudcanvas-ui-voice, .cloudcanvas-ui-markdown, .cloudcanvas-ui-breadcrumbs, .cloudcanvas-ui-tree,
.cloudcanvas-ui-progress, .cloudcanvas-ui-chips, .cloudcanvas-ui-navbar, .cloudcanvas-ui-empty, .cloudcanvas-ui-menu-panel {
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  color: var(--cc-text, #e2e8f0);
}
[class^="cloudcanvas-ui-"][hidden], [class*=" cloudcanvas-ui-"][hidden] { display: none; }
.cloudcanvas-ui-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Centred by its own margin: a host that resets every margin takes the browser's away. One that is not modal stands above the toasts. */
.cloudcanvas-ui-dialog {
  z-index: var(--cc-z-ui-dialog, 1350);
  width: min(var(--cc-ui-dialog-width, 36rem), calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  margin: auto;
  padding: 0;
  background: transparent;
  border: 0;
  overflow: visible;
}
.cloudcanvas-ui-dialog::backdrop { background: var(--cc-ui-backdrop, rgba(2, 6, 23, 0.6)); }
.cloudcanvas-ui-dialog.is-modal:not([open]) { display: none; }
.cloudcanvas-ui-dialog-panel {
  display: grid;
  gap: var(--cc-space-3, 12px);
  max-height: calc(100dvh - 2rem);
  overflow: auto;
  padding: var(--cc-space-4, 16px);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
}
.cloudcanvas-ui-dialog-header { display: flex; align-items: center; justify-content: space-between; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-dialog-title { margin: 0; font-size: var(--cc-type-lg, 15px); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-dialog-description { margin: 0; color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-dialog-body { min-width: 0; }

/* A drawer's place and size are the host's; the sheet says where it folds to: its control's aim, or its own top edge. */
.cloudcanvas-ui-drawer { transform-origin: var(--drawer-origin-x, 50%) var(--drawer-origin-y, 0%); }

.cloudcanvas-ui-splitter { flex: none; position: relative; min-width: 8px; min-height: 8px; touch-action: none; cursor: col-resize; }
.cloudcanvas-ui-splitter[aria-orientation="horizontal"] { cursor: row-resize; }
.cloudcanvas-ui-splitter::before {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 2px;
  background: var(--cc-card-border, rgba(255, 255, 255, 0.1));
}
.cloudcanvas-ui-splitter[aria-orientation="horizontal"]::before { width: auto; height: 2px; }
.cloudcanvas-ui-splitter:hover::before, .cloudcanvas-ui-splitter.is-dragging::before { background: var(--cc-accent, #38bdf8); }

.cloudcanvas-ui-results-list { display: grid; gap: 2px; }
.cloudcanvas-ui-results-option {
  display: grid;
  padding: var(--cc-space-2, 8px);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-results-option[aria-selected="true"], .cloudcanvas-ui-results-option:hover { background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))); }
.cloudcanvas-ui-results-detail { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-results-empty { margin: 0; padding: var(--cc-space-2, 8px); color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-status-message { color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-status[data-status="error"] .cloudcanvas-ui-status-label { color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-status[data-status="unavailable"] .cloudcanvas-ui-status-label { color: var(--cc-tone-warning, #eab308); }

/* Held off each edge by a token of its own, and by nothing else: no margin a host gives its sections moves it. */
.cloudcanvas-ui-toasts {
  position: fixed;
  inset: auto var(--cc-ui-toast-inset-right, var(--cc-space-3, 12px)) var(--cc-ui-toast-inset-bottom, var(--cc-ui-toast-offset, 16px)) var(--cc-ui-toast-inset-left, var(--cc-space-3, 12px));
  z-index: var(--cc-z-ui-toast, 1300);
  display: grid;
  justify-items: center;
  margin: 0;
  gap: var(--cc-space-2, 8px);
  pointer-events: none;
}
.cloudcanvas-ui-toast {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  max-width: min(32rem, 100%);
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 4px solid var(--cc-tone-info, #38bdf8);
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  pointer-events: auto;
}
.cloudcanvas-ui-toast[data-tone="success"] { border-left-color: var(--cc-tone-success, #22c55e); }
.cloudcanvas-ui-toast[data-tone="warning"] { border-left-color: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-toast[data-tone="danger"] { border-left-color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-toast-message { flex: 1; }

.cloudcanvas-ui-composer { display: grid; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-composer-input { width: 100%; min-height: 4.5rem; resize: vertical; }
.cloudcanvas-ui-composer-actions { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: flex-end; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-composer-voice { margin-right: auto; }
.cloudcanvas-ui-composer.is-pending .cloudcanvas-ui-composer-input { opacity: 0.7; }

.cloudcanvas-ui-voice { display: grid; gap: var(--cc-space-2, 8px); justify-items: start; }
.cloudcanvas-ui-voice.is-listening .cloudcanvas-ui-voice-mic { color: var(--cc-ui-on-accent, #0f172a); background: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-voice-consent, .cloudcanvas-ui-voice-review { display: flex; flex-wrap: wrap; gap: var(--cc-space-2, 8px); align-items: center; }
.cloudcanvas-ui-voice-consent-text { flex-basis: 100%; margin: 0; font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-voice-status { margin: 0; font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-voice-status:empty { display: none; }
.cloudcanvas-ui-voice-preview { flex-basis: 100%; min-height: 3rem; }

.cloudcanvas-ui-markdown { line-height: 1.5; overflow-wrap: anywhere; }
.cloudcanvas-ui-markdown :is(p, ul, ol, blockquote, pre) { margin: 0 0 var(--cc-space-2, 8px); }
.cloudcanvas-ui-markdown :is(h1, h2, h3, h4, h5, h6) { margin: var(--cc-space-3, 12px) 0 var(--cc-space-1, 4px); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-markdown :is(ul, ol) { padding-left: var(--cc-space-4, 16px); }
.cloudcanvas-ui-markdown blockquote {
  padding: 0 var(--cc-space-3, 12px);
  color: var(--cc-text-muted, #94a3b8);
  border-left: 3px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
}
.cloudcanvas-ui-markdown :is(code, pre) { font-family: var(--cc-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: var(--cc-type-sm, 12px); }
.cloudcanvas-ui-markdown pre { padding: var(--cc-space-2, 8px); overflow-x: auto; background: var(--cc-input-bg, rgba(255, 255, 255, 0.06)); border-radius: var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-markdown a { color: var(--cc-accent, #38bdf8); }
.cloudcanvas-ui-markdown-task-item { list-style: none; }
.cloudcanvas-ui-markdown-mention { color: var(--cc-accent, #38bdf8); font-weight: var(--cc-weight-medium, 500); }

.cloudcanvas-ui-breadcrumbs { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-breadcrumbs-list { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-1, 4px); margin: 0; padding: 0; list-style: none; }
.cloudcanvas-ui-breadcrumbs-item { position: relative; display: inline-flex; align-items: center; gap: var(--cc-space-1, 4px); min-width: 0; overflow-wrap: anywhere; }
.cloudcanvas-ui-breadcrumbs-item + .cloudcanvas-ui-breadcrumbs-item::before {
  content: "";
  flex: none;
  width: 0.4em;
  height: 0.4em;
  border-top: 1px solid var(--cc-text-muted, #94a3b8);
  border-right: 1px solid var(--cc-text-muted, #94a3b8);
  transform: rotate(45deg);
}
.cloudcanvas-ui-breadcrumbs-open {
  padding: 0 var(--cc-space-1, 4px);
  font: inherit;
  color: var(--cc-accent, #38bdf8);
  background: transparent;
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-breadcrumbs-open:hover { text-decoration: underline; }
.cloudcanvas-ui-breadcrumbs-item[aria-current="page"] { color: var(--cc-text, #e2e8f0); font-weight: var(--cc-weight-semibold, 600); }

.cloudcanvas-ui-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 var(--cc-space-1, 4px);
  font: inherit;
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  color: var(--cc-ui-on-accent, #0f172a);
  background: var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-pill, 9999px);
  box-sizing: border-box;
}
.cloudcanvas-ui-badge.is-dot {
  min-width: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  padding: 0;
}
.cloudcanvas-ui-badge[data-tone="danger"] { background: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-badge[data-tone="warning"] { background: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-badge[data-tone="success"] { background: var(--cc-tone-success, #22c55e); }
/* A flag is its SVG: the box keeps only the tone, stands in front of what it is planted on, and rises by what a host gives it. */
.cloudcanvas-ui-badge[data-shape="flag"] {
  z-index: var(--cc-z-ui-raised, 2);
  width: auto;
  min-width: 0;
  height: auto;
  padding: 0;
  color: var(--cc-accent, #38bdf8);
  background: transparent;
  border-radius: 0;
  transform: translateY(calc(-1 * var(--cc-ui-flag-rise, 0px)));
}
.cloudcanvas-ui-badge[data-shape="flag"][data-tone="danger"] { color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-badge[data-shape="flag"][data-tone="warning"] { color: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-badge[data-shape="flag"][data-tone="success"] { color: var(--cc-tone-success, #22c55e); }
.cloudcanvas-ui-badge-flag { display: block; flex: none; overflow: visible; filter: drop-shadow(0 1px 1px var(--cc-ui-flag-shadow, rgba(2, 6, 23, 0.4))); }
.cloudcanvas-ui-badge-flag-pennant { fill: currentColor; }
.cloudcanvas-ui-badge-flag-staff { fill: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-badge-flag-lit { fill: var(--cc-ui-flag-light, #ffffff); stop-color: var(--cc-ui-flag-light, #ffffff); }
.cloudcanvas-ui-badge-flag-shaded { fill: var(--cc-ui-flag-shade, #020617); stop-color: var(--cc-ui-flag-shade, #020617); }
.cloudcanvas-ui-badge-flag-figure { fill: var(--cc-ui-on-accent, #0f172a); font-variant-numeric: tabular-nums; text-anchor: middle; }

/* One column as wide as the tree, whatever its rows hold: a label the tree has no room for ends in an ellipsis (and is said whole in its row's title), it does not widen the tree. */
.cloudcanvas-ui-tree { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; }
.cloudcanvas-ui-tree-row {
  display: flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-2, 8px);
  font: inherit;
  text-align: left;
  color: inherit;
  background: transparent;
  border: 0;
  border-left: 3px solid transparent;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-tree-row:hover, .cloudcanvas-ui-tree-row[aria-selected="true"] { background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))); }
.cloudcanvas-ui-tree-row[aria-selected="true"] { font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-tree-indent { flex: none; width: calc(var(--tree-level, 0) * var(--cc-space-4, 16px)); }
.cloudcanvas-ui-tree-twisty { flex: none; display: inline-grid; place-items: center; width: 1.25em; height: 1.25em; visibility: hidden; }
.cloudcanvas-ui-tree-twisty::before {
  content: "";
  width: 0.4em;
  height: 0.4em;
  border-top: 1px solid var(--cc-text-muted, #94a3b8);
  border-right: 1px solid var(--cc-text-muted, #94a3b8);
  transform: rotate(45deg);
}
.cloudcanvas-ui-tree-row[aria-expanded] .cloudcanvas-ui-tree-twisty { visibility: visible; }
.cloudcanvas-ui-tree-row[aria-expanded="true"] .cloudcanvas-ui-tree-twisty::before { transform: rotate(135deg); }
.cloudcanvas-ui-tree-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cloudcanvas-ui-tree-count { flex: none; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-tree-row > .cloudcanvas-ui-badge { flex: none; }
.cloudcanvas-ui-tree[data-movable] .cloudcanvas-ui-tree-row { cursor: grab; }
.cloudcanvas-ui-tree.is-drag-active { cursor: grabbing; }
.cloudcanvas-ui-tree-row.is-dragging { pointer-events: none; opacity: 0.6; }
.cloudcanvas-ui-tree-row.is-drop-target { outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8)); outline-offset: -2px; }
.cloudcanvas-ui-tree-row.is-unmatched { opacity: 0.45; }
/* What a search that found nothing says, beside the rows: a polite live region, in the words the tree holds; empty, it takes no room. */
.cloudcanvas-ui-tree-status:empty { padding: 0; }
.cloudcanvas-ui-tree-status { margin: 0; padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px); font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif); font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-progress { display: grid; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-progress-label { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-progress-bar { width: 100%; height: 0.5rem; accent-color: var(--cc-accent, #38bdf8); }

.cloudcanvas-ui-chips { display: flex; flex-wrap: wrap; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-chips-chip {
  display: inline-flex;
  align-items: stretch;
  max-width: 100%;
  font-size: var(--cc-type-sm, 12px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-sm, 6px);
}
.cloudcanvas-ui-chips-chip[data-tone] { border-left-width: 3px; }
.cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-label, .cloudcanvas-ui-chips-remove {
  display: inline-flex;
  align-items: center;
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-2, 8px);
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
}
.cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-remove { cursor: pointer; }
.cloudcanvas-ui-chips-toggle:hover, .cloudcanvas-ui-chips-remove:hover { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }
.cloudcanvas-ui-chips-toggle[aria-pressed="true"] {
  font-weight: var(--cc-weight-semibold, 600);
  background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
}
.cloudcanvas-ui-chips-remove { padding: 0 var(--cc-space-1, 4px); color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-navbar-list {
  display: flex;
  gap: var(--cc-space-1, 4px);
  margin: 0;
  padding: 0;
  padding-top: var(--cc-ui-flag-rise, 0px);
  overflow-x: auto;
  list-style: none;
}
.cloudcanvas-ui-navbar-item { flex: none; }
.cloudcanvas-ui-navbar-icon { display: inline-flex; flex: none; }
/* A kit icon is as large as the text beside it and drawn in that text's colour, so what recolours the text recolours it. */
.cloudcanvas-ui-icon { flex: none; width: 1.25em; height: 1.25em; }
.cloudcanvas-ui-navbar-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  font: inherit;
  color: var(--cc-text-muted, #94a3b8);
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.cloudcanvas-ui-navbar-link:hover { color: var(--cc-text, #e2e8f0); }
.cloudcanvas-ui-navbar-link[aria-current="page"] {
  font-weight: var(--cc-weight-semibold, 600);
  color: var(--cc-text, #e2e8f0);
  border-bottom-color: var(--cc-accent, #38bdf8);
}
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-list { gap: 0; overflow-x: visible; }
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-item { flex: 1; min-width: 0; }
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-link { border-bottom: 0; border-top: 2px solid transparent; }
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-link[aria-current="page"] { border-top-color: var(--cc-accent, #38bdf8); }

.cloudcanvas-ui-empty { display: grid; justify-items: center; gap: var(--cc-space-2, 8px); padding: var(--cc-space-4, 16px); text-align: center; }
/* The icon is a graphic, told by its tone: muted for nothing and for loading, the info tone for what needs something first, the danger tone for what failed. */
.cloudcanvas-ui-empty-icon { display: inline-flex; color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-empty-icon > .cloudcanvas-ui-icon { width: 2.5rem; height: 2.5rem; }
.cloudcanvas-ui-empty[data-kind="locked"] .cloudcanvas-ui-empty-icon { color: var(--cc-tone-info, #38bdf8); }
.cloudcanvas-ui-empty[data-kind="error"] .cloudcanvas-ui-empty-icon { color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-empty-title { margin: 0; font-size: var(--cc-type-lg, 15px); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-empty-body { margin: 0; color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-combobox {
  position: absolute;
  z-index: var(--cc-z-ui-raised, 2);
  display: flex;
  flex-direction: column;
  max-width: min(24rem, calc(100vw - 2rem));
  max-height: 16rem;
  overflow: hidden;
  padding: var(--cc-space-1, 4px);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
}
/* The list is what scrolls, not the popup around it: the field controls the list (aria-controls), the one scroller a keyboard need not reach, since the field is operated through aria-activedescendant. The popup's max-height, the kit's or a host's, is what the list gives way to. */
.cloudcanvas-ui-combobox > .cloudcanvas-ui-results { display: flex; flex-direction: column; min-height: 0; }
.cloudcanvas-ui-combobox .cloudcanvas-ui-results-list { min-height: 0; overflow: auto; }

@media (pointer: coarse) {
  :is(.cloudcanvas-ui-button, .cloudcanvas-ui-field, .cloudcanvas-ui-breadcrumbs-open,
    .cloudcanvas-ui-tree-row, .cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-remove, .cloudcanvas-ui-navbar-link) { min-height: var(--cc-control-min-coarse, 44px); }
  /* A toast's controls say so themselves, whatever a host does to its buttons. */
  .cloudcanvas-ui-toast :is(.cloudcanvas-ui-toast-action, .cloudcanvas-ui-toast-dismiss) { min-width: var(--cc-control-min-coarse, 44px); min-height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-splitter { min-width: 20px; min-height: 20px; }
}
@media (max-width: 40rem) {
  .cloudcanvas-ui-dialog { width: 100vw; max-width: 100vw; margin: auto 0 0; }
  .cloudcanvas-ui-dialog-panel { border-radius: var(--cc-radius-md, 10px) var(--cc-radius-md, 10px) 0 0; }
}
`;

// ui/css/forms.js
var UI_FORMS_CSS = `
/* ------------------ UI KIT: SETTINGS ROWS ------------------ */

/* The words take the row; the box keeps its own column at the end. The row is the target, so the box can stay small. */
.cloudcanvas-ui-switch { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: var(--cc-space-3, 12px); min-height: 2.75rem; font: inherit; color: inherit; cursor: pointer; }
.cloudcanvas-ui-switch-text { display: flex; flex-wrap: wrap; align-items: baseline; min-width: 0; }
.cloudcanvas-ui-switch-label { min-width: 0; overflow-wrap: anywhere; }
.cloudcanvas-ui-switch-box { grid-column: 2; margin: 0; width: 1.25rem; height: 1.25rem; accent-color: var(--cc-accent, #38bdf8); cursor: inherit; }
.cloudcanvas-ui-switch-detail { flex-basis: 100%; font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-switch-detail[hidden] { display: none; }
/* The status is there before it has words, so it takes no room and no gap until it has some. Its words are the page's own ink: a tone's colour is a marker, never the only ink a note has. */
.cloudcanvas-ui-switch-status { font-size: var(--cc-type-sm, 12px); color: var(--cc-text, #e2e8f0); }
.cloudcanvas-ui-switch-status:not(:empty) { margin-inline-start: var(--cc-space-2, 8px); }
/* The marker a tone is told by: one dot, before the words of a status and of an invalid select's error. It is a :where(), with no specificity of its own, so the rule for each tone that follows it is the one that colours it. */
:where(.cloudcanvas-ui-switch-status:not(:empty), .cloudcanvas-ui-select-status:not(:empty), .cloudcanvas-ui-select[data-invalid] .cloudcanvas-ui-select-hint)::before {
  content: "";
  display: inline-block;
  width: 0.5em;
  height: 0.5em;
  margin-inline-end: 0.4em;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-text-muted, #94a3b8);
}
.cloudcanvas-ui-switch-status[data-tone="success"]::before, .cloudcanvas-ui-select-status[data-tone="success"]::before { background: var(--cc-tone-success, #22c55e); }
.cloudcanvas-ui-switch-status[data-tone="warning"]::before, .cloudcanvas-ui-select-status[data-tone="warning"]::before { background: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-switch-status[data-tone="danger"]::before, .cloudcanvas-ui-select-status[data-tone="danger"]::before { background: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-switch-status[data-tone="muted"]::before, .cloudcanvas-ui-select-status[data-tone="muted"]::before { background: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-switch-status[aria-live="assertive"], .cloudcanvas-ui-select-status[aria-live="assertive"] { font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-switch:has(.cloudcanvas-ui-switch-box:disabled) { opacity: 0.6; cursor: default; }
.cloudcanvas-ui-switch-box:focus-visible { outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8)); outline-offset: 2px; }

/* The select reads as the switch does: words first, the control at the end of the line. The row wraps, so on a phone the control stands under its words and never reaches past the row. */
.cloudcanvas-ui-select { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--cc-space-1, 4px) var(--cc-space-3, 12px); min-height: 2.75rem; font: inherit; color: inherit; }
.cloudcanvas-ui-select-label { flex: 1 1 10rem; min-width: 0; overflow-wrap: anywhere; }
.cloudcanvas-ui-select-control { flex: 0 1 14rem; min-width: 0; max-width: 100%; }
.cloudcanvas-ui-select-hint { flex-basis: 100%; margin: 0; font-size: var(--cc-type-sm, 12px); color: var(--cc-text, #e2e8f0); }
.cloudcanvas-ui-select-hint[hidden] { display: none; }
/* The status is a line of its own under the hint. Empty it is out of the row and not hidden: a region that comes with its words is not reliably read. */
.cloudcanvas-ui-select-status { flex-basis: 100%; margin: 0; font-size: var(--cc-type-sm, 12px); color: var(--cc-text, #e2e8f0); }
.cloudcanvas-ui-select-status:empty { position: absolute; flex-basis: auto; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.cloudcanvas-ui-select[data-invalid] .cloudcanvas-ui-select-control { border-color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-select[data-invalid] .cloudcanvas-ui-select-hint::before { background: var(--cc-tone-danger, #f87171); }
`;

// ui/css/overlays.js
var UI_OVERLAYS_CSS = `
/* ------------------ UI KIT: OVERLAYS ------------------ */

.cloudcanvas-ui-confirm-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--cc-space-2, 8px); }

/* A popover stands in the viewport, sized by its content and held by the screen's width: placed by the control, so no ancestor clips it. */
.cloudcanvas-ui-popover {
  position: fixed;
  z-index: var(--cc-z-ui-popover, 1375);
  box-sizing: border-box;
  width: max-content;
  overflow: auto;
  overscroll-behavior: contain;
  padding: var(--cc-space-3, 12px);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
}
/* The popover clips what is drawn outside it, so it wears its ring inside. */
.cloudcanvas-ui-popover:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
`;

// ui/css/views.js
var FONT = 'var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)';
var LINE = "var(--cc-ui-grid-line, var(--cc-card-border, rgba(255, 255, 255, 0.1)))";
var UI_VIEWS_CSS = `/* ------------------ UI KIT: VIEWS ------------------ */

.cloudcanvas-ui-kanban, .cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline, .cloudcanvas-ui-graph {
  font-family: ${FONT};
  color: var(--cc-text, #e2e8f0);
}
:is(.cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline, .cloudcanvas-ui-graph) { --item-more-size: 1.5rem; --item-more-room: calc(var(--item-more-size) + 6px); }
.cloudcanvas-ui-item-more {
  position: absolute;
  z-index: var(--cc-z-ui-raised, 2);
  box-sizing: border-box;
  display: grid;
  place-items: center;
  width: var(--item-more-size);
  height: var(--item-more-size);
  padding: 0;
  font: inherit;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid ${LINE};
  border-radius: var(--cc-radius-pill, 9999px);
  cursor: pointer;
}
.cloudcanvas-ui-item-more > .cloudcanvas-ui-icon { width: 1rem; height: 1rem; }
.cloudcanvas-ui-item-more:is(:hover, :focus-visible) { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }
.cloudcanvas-ui-item-more:focus-visible { outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8)); outline-offset: var(--cc-focus-ring-offset, 2px); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node)[data-tone="success"] { border-left-color: var(--cc-tone-success, #22c55e); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node)[data-tone="warning"] { border-left-color: var(--cc-tone-warning, #eab308); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node)[data-tone="danger"] { border-left-color: var(--cc-tone-danger, #f87171); }
/* Category tones one to eight: the host's own palette, on the same edge. */
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="1"] { border-left-color: var(--cc-ui-tone-1, #60a5fa); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="2"] { border-left-color: var(--cc-ui-tone-2, #a78bfa); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="3"] { border-left-color: var(--cc-ui-tone-3, #f472b6); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="4"] { border-left-color: var(--cc-ui-tone-4, #fb923c); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="5"] { border-left-color: var(--cc-ui-tone-5, #facc15); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="6"] { border-left-color: var(--cc-ui-tone-6, #4ade80); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="7"] { border-left-color: var(--cc-ui-tone-7, #2dd4bf); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="8"] { border-left-color: var(--cc-ui-tone-8, #94a3b8); }
:is(.cloudcanvas-ui-kanban-item, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node).is-grabbed,
.cloudcanvas-ui-kanban-item.is-grabbed .cloudcanvas-ui-kanban-card {
  outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  outline-offset: 2px;
}
/* Selected: a ring inside the item. */
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-kanban-label[data-ui-id], .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-timeline-group-label).is-selected {
  box-shadow: var(--cc-ui-selected-ring, inset 0 0 0 2px var(--cc-accent, #38bdf8));
}
/* A heading that stands for an item: a button that reads as the heading it is. */
:is(.cloudcanvas-ui-kanban-label[data-ui-id], .cloudcanvas-ui-timeline-group-label) {
  padding: 0 var(--cc-space-1, 4px);
  font: inherit;
  text-align: start;
  color: var(--cc-text, #e2e8f0);
  background: transparent;
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}

/* Kanban */
.cloudcanvas-ui-kanban-lane {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(15rem, 1fr);
  gap: var(--cc-space-3, 12px);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  isolation: isolate;
}
.cloudcanvas-ui-kanban-column {
  display: flex;
  flex-direction: column;
  min-height: 8rem;
  padding: var(--cc-space-2, 8px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border: 1px solid ${LINE};
  border-radius: var(--cc-radius-md, 10px);
  scroll-snap-align: start;
}
.cloudcanvas-ui-kanban-column.is-drop-target { outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8)); }
.cloudcanvas-ui-kanban-column.is-refused { outline: 2px dashed var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-kanban-heading {
  display: flex;
  justify-content: space-between;
  margin: 0 0 var(--cc-space-2, 8px);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
}
.cloudcanvas-ui-kanban-count { color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-kanban-cards { flex: 1; display: grid; align-content: start; gap: var(--cc-space-2, 8px); margin: 0; padding: 0; list-style: none; }
.cloudcanvas-ui-kanban-item.is-dragging { position: relative; z-index: var(--cc-z-ui-raised, 2); pointer-events: none; opacity: 0.85; }
.cloudcanvas-ui-kanban-card {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  font: inherit;
  text-align: left;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 4px solid var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: grab;
  touch-action: manipulation;
}
.cloudcanvas-ui-kanban-title { font-weight: var(--cc-weight-medium, 500); }
.cloudcanvas-ui-kanban-detail, .cloudcanvas-ui-kanban-meta { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }

/* Calendar */
.cloudcanvas-ui-calendar { display: grid; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-calendar-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-calendar-nav, .cloudcanvas-ui-calendar-views { display: flex; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-calendar-title { flex: 1 1 10rem; margin: 0; font-size: var(--cc-type-lg, 15px); font-weight: var(--cc-weight-semibold, 600); }
:is(.cloudcanvas-ui-calendar-view, .cloudcanvas-ui-timeline-scale)[aria-pressed="true"] { color: var(--cc-ui-on-accent, #0f172a); background: var(--cc-accent, #38bdf8); }
:is(.cloudcanvas-ui-calendar-month, .cloudcanvas-ui-calendar-time) { border: 1px solid ${LINE}; border-radius: var(--cc-radius-md, 10px); overflow: hidden; }
:is(.cloudcanvas-ui-calendar-weekdays, .cloudcanvas-ui-calendar-week) { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.cloudcanvas-ui-calendar-weekday { padding: var(--cc-space-1, 4px); font-size: var(--cc-type-xs, 11px); text-align: center; color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-calendar-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  min-height: 5.5rem;
  padding: var(--cc-space-1, 4px);
  border-top: 1px solid ${LINE};
  border-left: 1px solid ${LINE};
  cursor: pointer;
}
.cloudcanvas-ui-calendar-cell:first-child { border-left: 0; }
.cloudcanvas-ui-calendar-cell.is-outside { opacity: 0.55; }
:is(.cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head, .cloudcanvas-ui-calendar-more) {
  font: inherit;
  font-size: var(--cc-type-sm, 12px);
  color: var(--cc-text, #e2e8f0);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.cloudcanvas-ui-calendar-day { align-self: flex-end; min-width: 1.75rem; min-height: 1.75rem; border-radius: var(--cc-radius-pill, 9999px); }
:is(.cloudcanvas-ui-calendar-cell.is-today .cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head.is-today) {
  color: var(--cc-ui-on-accent, #0f172a);
  background: var(--cc-ui-today, var(--cc-accent, #38bdf8));
}
.cloudcanvas-ui-calendar-more { padding: 0 var(--cc-space-1, 4px); text-align: left; color: var(--cc-accent, #38bdf8); }
.cloudcanvas-ui-calendar-events { display: grid; gap: 2px; min-width: 0; }
.cloudcanvas-ui-calendar-event {
  position: relative;
  display: flex;
  gap: var(--cc-space-1, 4px);
  min-width: 0;
  padding: 0 var(--cc-space-1, 4px);
  overflow: hidden;
  font: inherit;
  font-size: var(--cc-type-xs, 11px);
  text-align: left;
  white-space: nowrap;
  color: var(--cc-ui-bar-text, var(--cc-text, #e2e8f0));
  background: var(--cc-ui-bar, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
  border: 0;
  border-left: 3px solid var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-calendar-event[data-movable] { cursor: grab; }
.cloudcanvas-ui-calendar-event-title { overflow: hidden; text-overflow: ellipsis; }
.cloudcanvas-ui-calendar-event-time { opacity: 0.8; }
:is(.cloudcanvas-ui-calendar-time-head, .cloudcanvas-ui-calendar-allday, .cloudcanvas-ui-calendar-time-grid) {
  display: grid;
  grid-template-columns: 3.5rem repeat(var(--calendar-days), minmax(0, 1fr));
}
.cloudcanvas-ui-calendar-day-head { padding: var(--cc-space-1, 4px); border-left: 1px solid ${LINE}; }
.cloudcanvas-ui-calendar-gutter { padding: var(--cc-space-1, 4px); font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-calendar-allday { border-top: 1px solid ${LINE}; }
.cloudcanvas-ui-calendar-allday-cell { display: grid; align-content: start; gap: 2px; min-height: 1.75rem; min-width: 0; padding: var(--cc-space-1, 4px); border-left: 1px solid ${LINE}; }
.cloudcanvas-ui-calendar-scroller { max-height: var(--cc-ui-time-height, 32rem); overflow-y: auto; border-top: 1px solid ${LINE}; }
.cloudcanvas-ui-calendar-time-grid { height: calc(var(--calendar-hours) * var(--cc-ui-hour-height, 48px)); }
.cloudcanvas-ui-calendar-hours { display: grid; grid-template-rows: repeat(var(--calendar-hours), 1fr); }
.cloudcanvas-ui-calendar-hour { padding: 0 var(--cc-space-1, 4px); font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); border-top: 1px solid ${LINE}; }
.cloudcanvas-ui-calendar-column {
  position: relative;
  min-width: 0;
  border-left: 1px solid ${LINE};
  background-image: var(--cc-ui-hour-lines, repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px var(--cc-ui-hour-height, 48px)));
  cursor: pointer;
}
.cloudcanvas-ui-calendar-timed {
  position: absolute;
  top: calc(var(--calendar-top) * var(--cc-ui-hour-height, 48px) / 60);
  left: calc(var(--calendar-lane) * 100% / var(--calendar-lanes) + 1px);
  width: calc(100% / var(--calendar-lanes) - 2px);
  height: calc(var(--calendar-length) * var(--cc-ui-hour-height, 48px) / 60 - 2px);
  flex-direction: column;
  white-space: normal;
}

@media (max-width: 40rem) {
  .cloudcanvas-ui-kanban-lane { grid-auto-columns: 85%; }
  :is(.cloudcanvas-ui-calendar-time-head, .cloudcanvas-ui-calendar-allday, .cloudcanvas-ui-calendar-time-grid) {
    grid-template-columns: 2.5rem repeat(var(--calendar-days), minmax(0, 1fr));
  }
  .cloudcanvas-ui-calendar-cell { min-height: 4rem; }
}
@media (pointer: coarse) {
  /*
   * A button a view's toolbar draws is 44px wide as it is tall: the glyphs (zoom, previous, next) and the short words (Fit).
   * A day's number and a day's heading keep what is drawn - the number's circle, the heading's fill - and the rest of the
   * 44px is transparent border round it, which is part of the button and takes the press; a "more" link is as tall as a finger.
   */
  :is(.cloudcanvas-ui-graph-toolbar, .cloudcanvas-ui-calendar-toolbar, .cloudcanvas-ui-timeline-toolbar) .cloudcanvas-ui-button { min-width: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-calendar-day { min-width: var(--cc-control-min-coarse, 44px); min-height: var(--cc-control-min-coarse, 44px); padding: 0; border: calc((var(--cc-control-min-coarse, 44px) - 1.75rem) / 2) solid transparent; }
  .cloudcanvas-ui-calendar-day-head { min-height: var(--cc-control-min-coarse, 44px); border-block: calc((var(--cc-control-min-coarse, 44px) - 2.25rem) / 2) solid transparent; }
  :is(.cloudcanvas-ui-calendar-cell.is-today .cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head.is-today) { background-clip: padding-box; }
  .cloudcanvas-ui-calendar-more { min-height: var(--cc-control-min-coarse, 44px); }
  :is(.cloudcanvas-ui-kanban-label[data-ui-id], .cloudcanvas-ui-timeline-group-label) { min-height: var(--cc-control-min-coarse, 44px); }
  /* Room for one whole target: the all-day strip, and a day of the month under its number. A timeline row sets its own height, in ./timeline.js: its rule comes later in the sheet. */
  .cloudcanvas-ui-calendar-allday-cell { min-height: calc(var(--cc-control-min-coarse, 44px) + 2 * var(--cc-space-1, 4px)); }
  .cloudcanvas-ui-calendar-cell { min-height: 6.25rem; }

  /* The 44px targets of what is drawn smaller: see the head of this file. */
  :is(.cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline, .cloudcanvas-ui-graph) { --target: var(--cc-control-min-coarse, 44px); --target-under: -1; }
  :is(.cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline) { --item-more-size: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-item-more > .cloudcanvas-ui-icon { width: 1.25rem; height: 1.25rem; }
  .cloudcanvas-ui-graph-node { --target: calc(var(--cc-control-min-coarse, 44px) / var(--graph-k, 1)); }
  .cloudcanvas-ui-calendar-month { isolation: isolate; }
  .cloudcanvas-ui-calendar-day { position: relative; z-index: var(--cc-z-ui-raised, 2); }
  :is(.cloudcanvas-ui-calendar-events, .cloudcanvas-ui-calendar-allday-cell, .cloudcanvas-ui-calendar-column, .cloudcanvas-ui-timeline-track, .cloudcanvas-ui-graph-nodes) { isolation: isolate; }
  :is(.cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar.is-point) { overflow: visible; }
  /* A chip cuts nothing itself now: its time does, as its title does, and still gives way last. */
  .cloudcanvas-ui-calendar-event-time { flex: none; max-width: 100%; max-height: 100%; overflow: hidden; }
  .cloudcanvas-ui-timeline-bar.is-point::before { border-radius: inherit; }
  :is(.cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar.is-point, .cloudcanvas-ui-graph-node)::after {
    content: "";
    position: absolute;
    top: 50%;
    left: calc(50% - 1.5px);
    z-index: var(--target-under);
    width: max(100%, var(--target));
    height: max(100%, var(--target));
    translate: -50% -50%;
  }
  .cloudcanvas-ui-calendar .cloudcanvas-ui-calendar-event::after { top: 0; translate: -50% 0; }
  .cloudcanvas-ui-calendar .cloudcanvas-ui-calendar-timed::after { left: 0; width: 100%; translate: none; }
  .cloudcanvas-ui-timeline-bar.is-point::after { rotate: -45deg; }
  /* A dimmed node is faded by opacity, a stacking context of its own: its reach could not lie under the node drawn before it, so it has none. */
  .cloudcanvas-ui-graph-node:is(.is-dim, .is-unmatched)::after { pointer-events: none; }
}
`;

// ui/css/graph.js
var LINE2 = "var(--cc-ui-grid-line, var(--cc-card-border, rgba(255, 255, 255, 0.1)))";
var ACCENT = "var(--cc-accent, #38bdf8)";
var TARGET = "max(100%, calc(var(--cc-control-min-coarse, 44px) / var(--graph-k, 1)))";
var reach = (room) => `max(100%, min(calc(24px / var(--graph-k, 1)), ${room}))`;
var UI_GRAPH_CSS = `/* ------------------ UI KIT: GRAPH ------------------ */

.cloudcanvas-ui-graph { display: grid; gap: var(--cc-space-2, 8px); min-width: 0; }
.cloudcanvas-ui-graph-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-graph-search { flex: 1 1 10rem; min-width: 0; max-width: 20rem; }
.cloudcanvas-ui-graph-hint { margin: 0; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-graph-viewport {
  position: relative;
  height: var(--cc-ui-graph-height, 24rem);
  overflow: hidden;
  touch-action: none;
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border: 1px solid ${LINE2};
  border-radius: var(--cc-radius-md, 10px);
  cursor: grab;
}
.cloudcanvas-ui-graph-viewport:is(.is-panning, .is-drag-active) { cursor: grabbing; }
:is(.cloudcanvas-ui-graph-world, .cloudcanvas-ui-graph-edges, .cloudcanvas-ui-graph-nodes) { position: absolute; top: 0; left: 0; transform-origin: 0 0; overflow: visible; }
.cloudcanvas-ui-graph-edges { pointer-events: none; }
.cloudcanvas-ui-graph-overlay { z-index: var(--cc-z-ui-raised, 2); }

.cloudcanvas-ui-graph-edge { fill: none; stroke: var(--cc-connector, rgba(56, 189, 248, 0.6)); stroke-width: 1.5; }
.cloudcanvas-ui-graph-edge.is-related { stroke-dasharray: 6 5; }
.cloudcanvas-ui-graph-edge.is-depends-on { stroke: ${ACCENT}; stroke-width: 2; }
.cloudcanvas-ui-graph-arrow { fill: ${ACCENT}; }
/* A label is a chip on its edge: the surface's colour behind its words, so the line does not run through them. */
.cloudcanvas-ui-graph-edge-label-back { fill: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))); stroke: ${LINE2}; stroke-width: 1px; }
.cloudcanvas-ui-graph-edge-label-text { fill: var(--cc-text-muted, #94a3b8); font-size: var(--cc-type-xs, 11px); }
.cloudcanvas-ui-graph-draft { fill: none; stroke: ${ACCENT}; stroke-width: 2; stroke-dasharray: 4 4; }

.cloudcanvas-ui-graph-node {
  position: absolute;
  top: var(--graph-y);
  left: var(--graph-x);
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto auto;
  align-content: space-between;
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  font: inherit;
  font-size: var(--cc-type-md, 13px);
  line-height: 1.3;
  text-align: left;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 4px solid ${ACCENT};
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06));
  cursor: pointer;
  user-select: none;
}
.cloudcanvas-ui-graph[data-can-move] .cloudcanvas-ui-graph-node { cursor: grab; }
/* Two lines of the title, then an ellipsis: the node's tooltip and name hold the rest. */
.cloudcanvas-ui-graph-node-label {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
  font-weight: var(--cc-weight-medium, 500);
}
.cloudcanvas-ui-graph-node-meta { display: flex; align-items: center; gap: var(--cc-space-1, 4px); min-width: 0; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-graph-status {
  flex: none;
  max-width: 50%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 var(--cc-space-1, 4px);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  border-radius: var(--cc-radius-pill, 9999px);
}
.cloudcanvas-ui-graph-time { flex: 0 1 auto; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.cloudcanvas-ui-graph-toggle {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  padding: 0 var(--cc-space-1, 4px);
  font-variant-numeric: tabular-nums;
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-pill, 9999px);
}
/* A toggle that folds wears a chevron after its count: right to open what is folded, left to fold it back. */
.cloudcanvas-ui-graph[data-can-fold] .cloudcanvas-ui-graph-toggle { cursor: pointer; }
.cloudcanvas-ui-graph[data-can-fold] .cloudcanvas-ui-graph-toggle::before {
  content: "";
  order: 1;
  width: 0.35em;
  height: 0.35em;
  border-top: 1px solid currentColor;
  border-right: 1px solid currentColor;
  rotate: -135deg;
}
.cloudcanvas-ui-graph[data-can-fold] .cloudcanvas-ui-graph-node[aria-expanded="false"] .cloudcanvas-ui-graph-toggle::before { rotate: 45deg; }
.cloudcanvas-ui-graph-node[aria-expanded="false"] .cloudcanvas-ui-graph-toggle { color: var(--cc-ui-on-accent, #0f172a); background: ${ACCENT}; border-color: ${ACCENT}; }
.cloudcanvas-ui-graph-handle {
  position: absolute;
  top: 50%;
  right: 0;
  display: none;
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  translate: 50% -50%;
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  border: 2px solid ${ACCENT};
  border-radius: var(--cc-radius-pill, 9999px);
  opacity: 0;
  cursor: crosshair;
}
.cloudcanvas-ui-graph[data-can-link] .cloudcanvas-ui-graph-handle { display: block; }
.cloudcanvas-ui-graph-node:is(:hover, :focus-visible, .is-selected) .cloudcanvas-ui-graph-handle { opacity: 1; }
/* A mouse gets a whole target of what is drawn small: the fold toggle (24x16) and the link handle (12) reach 24px on the screen, kept within the node's own room - 30 world units tall, so a map at the first view's least scale, 0.8, still has them whole. The reach of the handle starts at its own edge and runs out from the node. */
:where(.cloudcanvas-ui-graph[data-can-fold]) .cloudcanvas-ui-graph-toggle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${reach("40px")};
  height: ${reach("30px")};
  translate: -50% -50%;
}
.cloudcanvas-ui-graph-handle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: -2px;
  width: ${reach("40px")};
  height: ${reach("30px")};
  translate: 0 -50%;
}

/* The "more" button of the selected node: its top right corner, the title keeping its room. Its reach is its own. */
.cloudcanvas-ui-graph-more { top: 3px; right: 3px; }
.cloudcanvas-ui-graph-more::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${reach("36px")};
  height: ${reach("36px")};
  translate: -50% -50%;
}
/* Drawn at the graph's zoom it would shrink to a dot on a map zoomed out to the 0.5 a big one opens at: it holds 16px on the screen, up to 36 of the graph's own units. */
.cloudcanvas-ui-graph-node { --item-more-size: min(max(1.5rem, calc(16px / var(--graph-k, 1))), 2.25rem); --item-more-room: calc(var(--item-more-size) + 4px); }
.cloudcanvas-ui-graph[data-can-menu] .cloudcanvas-ui-graph-node.is-selected .cloudcanvas-ui-graph-node-label { padding-right: var(--item-more-room); }

.cloudcanvas-ui-graph-node.is-selected {
  box-shadow: var(--cc-ui-selected-ring, inset 0 0 0 2px ${ACCENT}), var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
}
.cloudcanvas-ui-graph-node.is-path { border-color: ${ACCENT}; }
:is(.cloudcanvas-ui-graph-node, .cloudcanvas-ui-graph-edge, .cloudcanvas-ui-graph-edge-label).is-dim, .cloudcanvas-ui-graph-node.is-unmatched { opacity: 0.4; }
.cloudcanvas-ui-graph-node.is-drop-target { outline: 2px dashed var(--cc-ui-drop, ${ACCENT}); outline-offset: 3px; }
.cloudcanvas-ui-graph-node.is-dragging {
  z-index: var(--cc-z-ui-raised, 2);
  pointer-events: none;
  opacity: 0.85;
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55));
}

.cloudcanvas-ui-graph-minimap {
  position: absolute;
  right: var(--cc-space-2, 8px);
  bottom: var(--cc-space-2, 8px);
  z-index: var(--cc-z-ui-raised, 2);
  width: 10rem;
  height: 6.25rem;
  overflow: hidden;
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid ${LINE2};
  border-radius: var(--cc-radius-sm, 6px);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  touch-action: none;
  cursor: pointer;
}
.cloudcanvas-ui-graph-minimap-picture { display: block; width: 100%; height: 100%; }
.cloudcanvas-ui-graph-minimap-node { fill: var(--cc-text-muted, #94a3b8); fill-opacity: 0.6; }
.cloudcanvas-ui-graph-minimap-node.is-selected { fill: ${ACCENT}; fill-opacity: 1; }
.cloudcanvas-ui-graph-minimap-view { fill: var(--cc-btn-bg, rgba(56, 189, 248, 0.12)); stroke: ${ACCENT}; stroke-width: 2; vector-effect: non-scaling-stroke; }

@media (max-width: 40rem) {
  .cloudcanvas-ui-graph-minimap { width: 6.5rem; height: 4.25rem; }
}
@media (pointer: coarse) {
  /* The toggle and the handle are drawn small, at the graph's zoom: a finger gets 44px of each on the screen. */
  :is(.cloudcanvas-ui-graph-toggle, .cloudcanvas-ui-graph-handle)::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: ${TARGET};
    height: ${TARGET};
    translate: -50% -50%;
  }
  /* The handle's reach starts at the node's right edge and runs out from it, never over the node: the pill is the pill's, a node's middle is the node's. It is there for the node that is pointed at, focused or selected, as the handle is drawn. */
  .cloudcanvas-ui-graph-handle { pointer-events: none; }
  .cloudcanvas-ui-graph-node:is(:hover, :focus-visible, .is-selected) .cloudcanvas-ui-graph-handle { pointer-events: auto; }
  .cloudcanvas-ui-graph-handle::after { left: 7px; translate: 0 -50%; }
  /* The button is drawn at 24px and reaches a finger's 44px, which the room at a node's corner allows. */
  .cloudcanvas-ui-graph-more::after { width: max(100%, min(calc(var(--cc-control-min-coarse, 44px) / var(--graph-k, 1)), 52px)); height: max(100%, min(calc(var(--cc-control-min-coarse, 44px) / var(--graph-k, 1)), 52px)); }
  .cloudcanvas-ui-graph-node { --item-more-room: calc(var(--item-more-size) + 14px); }
}
`;

// ui/css/timeline.js
var LINE3 = "var(--cc-ui-grid-line, var(--cc-card-border, rgba(255, 255, 255, 0.1)))";
var SURFACE = "var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)))";
var ACCENT2 = "var(--cc-accent, #38bdf8)";
var RING = "var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8))";
var UI_TIMELINE_CSS = `/* ------------------ UI KIT: TIMELINE ------------------ */

.cloudcanvas-ui-timeline { --timeline-gutter: var(--cc-ui-gutter, 10rem); display: grid; gap: var(--cc-space-2, 8px); min-width: 0; }
.cloudcanvas-ui-timeline-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-timeline-scales { display: flex; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-timeline-range { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-hint { margin: 0; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-sheet { position: relative; isolation: isolate; max-height: var(--cc-ui-timeline-height, 28rem); overflow: auto; touch-action: pan-x pan-y; border: 1px solid ${LINE3}; border-radius: var(--cc-radius-md, 10px); }
.cloudcanvas-ui-timeline-sheet.is-drag-active { user-select: none; }
.cloudcanvas-ui-timeline-grid { position: relative; width: calc(var(--timeline-gutter) + var(--timeline-width)); min-width: 100%; padding-bottom: var(--cc-space-2, 8px); }
.cloudcanvas-ui-timeline-axis { position: sticky; top: 0; z-index: var(--cc-z-ui-sticky, 3); display: flex; height: 1.75rem; background: ${SURFACE}; border-bottom: 1px solid ${LINE3}; }
.cloudcanvas-ui-timeline-corner { position: sticky; left: 0; z-index: var(--cc-z-ui-raised, 2); flex: none; width: var(--timeline-gutter); background: ${SURFACE}; }
.cloudcanvas-ui-timeline-ticks { position: relative; flex: none; width: var(--timeline-width); }
.cloudcanvas-ui-timeline-tick {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--timeline-x);
  padding: var(--cc-space-1, 4px);
  font-size: var(--cc-type-xs, 11px);
  white-space: nowrap;
  color: var(--cc-text-muted, #94a3b8);
  border-left: 1px solid ${LINE3};
}

/* The gutter's separator: a grip on the corner's edge, a cursor that says what a drag does. */
.cloudcanvas-ui-timeline-gutter-handle { position: absolute; top: 0; right: -3px; bottom: 0; width: 6px; cursor: col-resize; touch-action: none; border-radius: var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-timeline-gutter-handle::after { content: ""; position: absolute; top: 6px; bottom: 6px; left: 2px; width: 2px; border-radius: var(--cc-radius-sm, 6px); background: var(--cc-text-muted, #94a3b8); opacity: 0.5; }
.cloudcanvas-ui-timeline-gutter-handle:is(:hover, :focus-visible, .is-grabbed)::after { background: ${ACCENT2}; opacity: 1; }
/* The separator is drawn 6px wide and takes a mouse 24px: it stands on the axis alone, so its reach has no neighbour to take a press from. */
.cloudcanvas-ui-timeline-gutter-handle::before { content: ""; position: absolute; top: 0; bottom: 0; left: 50%; width: 24px; translate: -50% 0; }
.cloudcanvas-ui-timeline-gutter-handle:focus-visible { outline: ${RING}; outline-offset: 0; }

/* A group's heading: a row of its own, level 1 of the treegrid. */
/* It is as wide as the sheet's content, so the empty track beside its name takes a dragged span; the name stays in view as the sheet is scrolled. */
.cloudcanvas-ui-timeline-group { position: relative; display: flex; }
.cloudcanvas-ui-timeline-group > .cloudcanvas-ui-timeline-track { position: absolute; top: 0; bottom: 0; left: var(--timeline-gutter); height: auto; }
/* The heading's cell is the title column's, as a row's title is: at least as wide, on its surface, so a summary or a band scrolled under it is hidden as a bar is under a title. */
.cloudcanvas-ui-timeline-group-cell { position: sticky; left: 0; z-index: var(--cc-z-ui-raised, 2); flex: none; box-sizing: border-box; min-width: var(--timeline-gutter); display: flex; align-items: center; gap: var(--cc-space-1, 4px); padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px); font-size: var(--cc-type-sm, 12px); font-weight: var(--cc-weight-semibold, 600); color: var(--cc-text-muted, #94a3b8); background: ${SURFACE}; }
.cloudcanvas-ui-timeline-group-label:focus-visible { outline: ${RING}; outline-offset: var(--cc-focus-ring-offset, 2px); }
/* The chevron: drawn, not written, so the heading's words are its name alone; it points down when the group is open and right when it is folded. */
.cloudcanvas-ui-timeline-group-toggle {
  position: relative;
  order: -1;
  flex: none;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-group-toggle::before {
  content: "";
  position: absolute;
  top: calc(50% - 4px);
  left: calc(50% - 3px);
  width: 6px;
  height: 6px;
  border-right: 2px solid currentcolor;
  border-bottom: 2px solid currentcolor;
  rotate: 45deg;
}
.cloudcanvas-ui-timeline-group-toggle[aria-expanded="false"]::before { top: calc(50% - 3px); left: calc(50% - 4px); rotate: -45deg; }
.cloudcanvas-ui-timeline-group-toggle:is(:hover, :focus-visible) { color: var(--cc-text, #e2e8f0); background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }
.cloudcanvas-ui-timeline-group-toggle:focus-visible { outline: ${RING}; outline-offset: 0; }
.cloudcanvas-ui-timeline-group-count { padding: 0 var(--cc-space-1, 4px); font-weight: var(--cc-weight-medium, 500); color: var(--cc-text-muted, #94a3b8); border: 1px solid ${LINE3}; border-radius: var(--cc-radius-sm, 6px); }

.cloudcanvas-ui-timeline-row { display: flex; align-items: center; min-height: 2.25rem; border-bottom: 1px solid ${LINE3}; }
.cloudcanvas-ui-timeline-label {
  position: sticky;
  left: 0;
  z-index: var(--cc-z-ui-raised, 2);
  flex: none;
  box-sizing: border-box;
  width: var(--timeline-gutter);
  padding: 0 var(--cc-space-2, 8px);
  overflow: hidden;
  font-size: var(--cc-type-sm, 12px);
  white-space: nowrap;
  text-overflow: ellipsis;
  background: ${SURFACE};
  cursor: pointer;
}
.cloudcanvas-ui-timeline-label::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; border-right: 1px solid ${LINE3}; }
.cloudcanvas-ui-timeline-row.is-current .cloudcanvas-ui-timeline-label { font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-timeline-track { position: relative; flex: none; width: var(--timeline-width); height: 2.25rem; }
.cloudcanvas-ui-timeline[data-can-create] .cloudcanvas-ui-timeline-track { cursor: crosshair; }
/* The span being made: a band of the days it covers - its border within them - and its dates in a tag of their own. A title drawn beside a short bar or a milestone is centred on the row, where a band over those days would write its dates too, so the tag hangs below that line: its top is the row's middle (the band's own) and 0.85em down, past a title's half height at the line height of 1.6 a page may inherit, which on the last row is below the row, so the grid keeps room for it and the sheet does not grow when it is drawn - on the sheet's surface so it is read at 4.5:1 whatever is under it, in the page's text colour (see the calendar's band). */
.cloudcanvas-ui-timeline-draft {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: var(--timeline-x);
  width: var(--timeline-w);
  box-sizing: border-box;
  overflow: visible;
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border: 2px dashed var(--cc-ui-drop, ${ACCENT2});
  border-radius: var(--cc-radius-sm, 6px);
  pointer-events: none;
}
.cloudcanvas-ui-timeline-draft-words {
  position: absolute;
  top: calc(50% + 0.85em);
  left: -2px;
  padding: 0 var(--cc-space-1, 4px);
  font-size: var(--cc-type-xs, 11px);
  line-height: 1;
  white-space: nowrap;
  color: var(--cc-text, #e2e8f0);
  background: ${SURFACE};
  border-radius: var(--cc-radius-sm, 6px);
}

/* A folded group's summary: the days its items cover, its name and count in the page's text; a press opens the group's item, so it points, and it is no row to drag a span across. */
.cloudcanvas-ui-timeline-summary {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: var(--timeline-x);
  width: var(--timeline-w);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 var(--cc-space-2, 8px);
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text, #e2e8f0);
  background: ${SURFACE};
  border: 1px dashed var(--cc-text-muted, #94a3b8);
  border-left: 4px solid var(--cc-text-muted, #94a3b8);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-summary-title { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* A bar: its title inside (or beside it), its status in its outline and fill, its progress as the fill that is done. */
.cloudcanvas-ui-timeline-bar {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: var(--timeline-x);
  width: var(--timeline-w);
  min-width: 1.25rem;
  display: flex;
  align-items: center;
  padding: 0 var(--cc-space-2, 8px);
  font: inherit;
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-ui-bar-text, var(--cc-text, #e2e8f0));
  background: var(--cc-ui-bar, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
  border: 1px solid var(--timeline-tone, ${ACCENT2});
  border-left-width: 4px;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-bar[data-movable] { cursor: grab; }
.cloudcanvas-ui-timeline-bar[data-status-tone="success"] { --timeline-tone: var(--cc-tone-success, #22c55e); }
.cloudcanvas-ui-timeline-bar[data-status-tone="warning"] { --timeline-tone: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-timeline-bar[data-status-tone="danger"] { --timeline-tone: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-timeline-bar[data-status-tone="muted"] { --timeline-tone: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-bar::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(var(--timeline-progress, 0) * 100%);
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-radius: inherit;
}
.cloudcanvas-ui-timeline-bar[data-status-tone]::before { background: color-mix(in oklab, var(--timeline-tone) var(--timeline-fill, 40%), transparent); }
.cloudcanvas-ui-timeline-bar.is-point { top: 50%; bottom: auto; left: calc(var(--timeline-x) - 7px); width: 14px; height: 14px; padding: 0; translate: 0 -50%; rotate: 45deg; }
.cloudcanvas-ui-timeline-bar.is-short { padding: 0; }
.cloudcanvas-ui-timeline-bar-title { position: relative; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* The title of a milestone, or of a bar too short to hold it: beside it, a part of the same item. */
.cloudcanvas-ui-timeline-outside {
  position: absolute;
  top: 50%;
  left: calc(var(--timeline-x) + var(--timeline-w) + 22px);
  translate: 0 -50%;
  font-size: var(--cc-type-xs, 11px);
  white-space: nowrap;
  color: var(--cc-text, #e2e8f0);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-outside.is-point { left: calc(var(--timeline-x) + 12px); }
.cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-outside { left: calc(var(--timeline-x) + var(--timeline-w) + 30px); }
.cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-outside.is-point { left: calc(var(--timeline-x) + 32px); }

/* The handle a link is dragged from: beside a bar's right edge, drawn when the host can link and the row is hovered, focused or selected. */
.cloudcanvas-ui-timeline-link {
  position: absolute;
  top: 50%;
  left: calc(var(--timeline-x) + var(--timeline-w) + 6px);
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  z-index: var(--cc-z-ui-raised, 2);
  translate: 0 -50%;
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  border: 2px solid ${ACCENT2};
  border-radius: var(--cc-radius-pill, 9999px);
  opacity: 0;
  cursor: crosshair;
}
.cloudcanvas-ui-timeline-link.is-point { left: calc(var(--timeline-x) + 16px); }
/* A mouse gets 24px of the handle: from the bar's edge, a whole target, clear of the title drawn beside it. */
.cloudcanvas-ui-timeline-link::after { content: ""; position: absolute; top: 50%; left: -6px; width: 24px; height: 24px; translate: 0 -50%; }
.cloudcanvas-ui-timeline-row:is(:hover, :focus-within, .is-current) .cloudcanvas-ui-timeline-link { opacity: 1; }
.cloudcanvas-ui-timeline-bar.is-drop-target { outline: 2px dashed var(--cc-ui-drop, ${ACCENT2}); outline-offset: 2px; }

/* The dependencies: connectors in a layer of their own over the bars, a picture the pointer passes through everywhere - the bars are the pointer's, and so is the handle a link is dragged from, which stands above the layer where a connector starts. */
.cloudcanvas-ui-timeline-links {
  position: absolute;
  top: 0;
  left: var(--timeline-gutter);
  z-index: var(--cc-z-ui-raised, 2);
  width: var(--timeline-width);
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.cloudcanvas-ui-timeline-connector-line { fill: none; stroke: var(--cc-connector, rgba(56, 189, 248, 0.6)); stroke-width: 1.5; }
.cloudcanvas-ui-timeline-arrow { fill: ${ACCENT2}; }
.cloudcanvas-ui-timeline-draft-link { fill: none; stroke: ${ACCENT2}; stroke-width: 2; stroke-dasharray: 6 5; }

/* The handles at a bar's ends: each resizes, and says so under the pointer. */
:is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start) { position: absolute; top: 0; bottom: 0; width: min(10px, 30%); cursor: ew-resize; background: ${ACCENT2}; opacity: 0.4; }
.cloudcanvas-ui-timeline-handle { right: 0; border-radius: 0 var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0; }
.cloudcanvas-ui-timeline-handle-start { left: 0; border-radius: var(--cc-radius-sm, 6px) 0 0 var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-timeline-row:is(:hover, :focus-within, .is-current) :is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start) { opacity: 0.75; }
/* A mouse gets 24px of each end: inward from the bar's edge, never past a third of what is inside its borders (4px at the start, 1px at the end), so its middle is its own to move - a bar of half an hour is 20px wide, and its body is still its body; the handle is as tall as the bar. */
:is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start)::after { content: ""; position: absolute; top: 50%; width: min(24px, calc((var(--timeline-w) - 5px) / 3)); height: max(100%, 24px); translate: 0 -50%; }
.cloudcanvas-ui-timeline-handle::after { right: 0; }
.cloudcanvas-ui-timeline-handle-start::after { left: 0; }

/* The "more" button of the selected bar: where a title beside the bar would begin, which the selected row's title gives way to. */
.cloudcanvas-ui-timeline-more { top: 50%; left: calc(var(--timeline-x) + var(--timeline-w) + 22px); translate: 0 -50%; }
.cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-more { left: calc(var(--timeline-x) + var(--timeline-w) + 30px); }
.cloudcanvas-ui-timeline-more.is-point { left: calc(var(--timeline-x) + 12px); }
.cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-more.is-point { left: calc(var(--timeline-x) + 32px); }
.cloudcanvas-ui-timeline[data-can-menu] .cloudcanvas-ui-timeline-row.is-current:not(.is-crowded) .cloudcanvas-ui-timeline-outside { margin-left: var(--item-more-room); }
.cloudcanvas-ui-timeline-now {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--timeline-gutter) + var(--timeline-x));
  width: 2px;
  pointer-events: none;
  background: var(--cc-tone-danger, #f87171);
}

@media (max-width: 40rem) {
  .cloudcanvas-ui-timeline { --timeline-gutter: var(--cc-ui-gutter, 6rem); }
}
@media (pointer: coarse) {
  /* A finger gets a whole target at everything that is dragged or pressed: the toggle, the separator, a bar's handles. */
  .cloudcanvas-ui-timeline-group-toggle { width: var(--cc-control-min-coarse, 44px); height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-timeline-gutter-handle { right: calc(-0.5 * var(--cc-control-min-coarse, 44px)); width: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-timeline-gutter-handle::after { left: calc(50% - 1px); }
  :is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start) { width: min(14px, 30%); }
  /* A bar's ends reach inward a third of the bar at most, so its body keeps a third; a bar too short for three targets is one, its ends inert. */
  :is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start)::after {
    content: "";
    position: absolute;
    top: 50%;
    width: min(var(--cc-control-min-coarse, 44px), calc(var(--timeline-w) / 3));
    height: var(--cc-control-min-coarse, 44px);
    translate: 0 -50%;
  }
  .cloudcanvas-ui-timeline-bar.is-short :is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start) { pointer-events: none; }
  /* The grab area of a bar drawn narrower than a finger is padding round it: it lies under the bar, so the bar keeps its own look. A folded group's summary is a whole target the same way. */
  .cloudcanvas-ui-timeline-bar { overflow: visible; }
  /* A milestone's reach stands over the title drawn beside it - a part of the same item - so a finger 12 to 22px from its middle moves the milestone, not just opens it. */
  .cloudcanvas-ui-timeline-bar.is-point { z-index: var(--cc-z-ui-raised, 2); }
  .cloudcanvas-ui-timeline-bar:not(.is-point)::after, .cloudcanvas-ui-timeline-summary::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: var(--target-under);
    width: max(100%, var(--target));
    height: max(100%, var(--target));
    translate: -50% -50%;
  }
  .cloudcanvas-ui-timeline-handle::after { right: 0; }
  .cloudcanvas-ui-timeline-handle-start::after { left: 0; }
  /*
   * THE LINK HANDLE'S REACH lies past the bar's right end - the whole 44px of it, starting at the bar's edge (a milestone's
   * right corner) - never over the bar: the middle of every bar is the bar's, to tap, to hold and to drag. Where a bar is
   * narrower than two targets the handle is there only for the item that is selected or focused; its title, drawn beside
   * it, stands clear of the reach.
   */
  .cloudcanvas-ui-timeline-link::after { content: ""; position: absolute; top: 50%; left: -6px; width: var(--cc-control-min-coarse, 44px); height: var(--cc-control-min-coarse, 44px); translate: 0 -50%; }
  .cloudcanvas-ui-timeline-link.is-point::after { left: 0; }
  .cloudcanvas-ui-timeline-link.is-narrow { pointer-events: none; }
  .cloudcanvas-ui-timeline-row:is(.is-current, :focus-within) .cloudcanvas-ui-timeline-link.is-narrow { pointer-events: auto; }
  .cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-outside { left: calc(var(--timeline-x) + var(--timeline-w) + var(--cc-control-min-coarse, 44px) + 8px); }
  .cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-outside.is-point { left: calc(var(--timeline-x) + var(--cc-control-min-coarse, 44px) + 20px); }
  .cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-more { left: calc(var(--timeline-x) + var(--timeline-w) + var(--cc-control-min-coarse, 44px) + 8px); }
  .cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-more.is-point { left: calc(var(--timeline-x) + var(--cc-control-min-coarse, 44px) + 20px); }
  .cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-row.is-current .cloudcanvas-ui-timeline-link { opacity: 1; }
  /* A row is one whole target tall, and so is its track: a bar's grab area and the link handle's reach lie within it. */
  .cloudcanvas-ui-timeline-row { min-height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-timeline-track { height: var(--cc-control-min-coarse, 44px); }
  /* The axis is a target tall too, for the separator on its corner: 44px of content and its 1px rule below, whichever box a host sizes by. A row's title in the gutter, and the title beside a short bar, are the bar's: the whole height of the row. */
  .cloudcanvas-ui-timeline-axis { box-sizing: content-box; height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-timeline-tick { display: flex; align-items: center; }
  .cloudcanvas-ui-timeline-label { align-self: stretch; line-height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-timeline-outside { min-width: var(--cc-control-min-coarse, 44px); line-height: var(--cc-control-min-coarse, 44px); }
}
`;

// ui/css/calendar.js
var UI_CALENDAR_CSS = `/* ------------------ UI KIT: CALENDAR ------------------ */

/* A drag across the grid selects no text on its way. */
.cloudcanvas-ui-calendar-body.is-drag-active { user-select: none; }

/* The line under the toolbar: what the selection can do. */
.cloudcanvas-ui-calendar-hint { margin: 0; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }

/* The handle on a timed event's bottom edge: it resizes, and says so under the pointer. */
.cloudcanvas-ui-calendar-event-handle { position: absolute; right: 0; bottom: 0; left: 0; height: 6px; cursor: ns-resize; }
.cloudcanvas-ui-calendar-event-handle::before {
  content: "";
  position: absolute;
  bottom: 2px;
  left: calc(50% - 7px);
  width: 14px;
  height: 2px;
  background: currentcolor;
  border-radius: var(--cc-radius-sm, 6px);
  opacity: 0;
}
.cloudcanvas-ui-calendar-event:is(:hover, :focus-visible, .is-selected, .is-grabbed) .cloudcanvas-ui-calendar-event-handle::before { opacity: 0.7; }

/* The "more" button of the selected event, and the room its chip keeps for it. */
:is(.cloudcanvas-ui-calendar-events, .cloudcanvas-ui-calendar-allday-cell) { position: relative; }
.cloudcanvas-ui-calendar-event.is-holding-more { padding-right: var(--item-more-room); }
:is(.cloudcanvas-ui-calendar-events, .cloudcanvas-ui-calendar-allday-cell) > .cloudcanvas-ui-calendar-more-actions { grid-column: 1 / 2; top: 50%; right: 3px; translate: 0 -50%; }
.cloudcanvas-ui-calendar-more-actions.is-timed {
  top: calc(var(--calendar-top) * var(--cc-ui-hour-height, 48px) / 60 + 2px);
  right: auto;
  left: calc((var(--calendar-lane) + 1) * 100% / var(--calendar-lanes) - var(--item-more-size) - 3px);
  translate: none;
}

/* The range being made: a band of slots with their times in it down a column; the days of a month or the strip, lit. Its words are the page's text: the band is a wash over the page, and a bar's text colour is for a bar's accent fill. */
.cloudcanvas-ui-calendar-draft {
  position: absolute;
  top: calc(var(--calendar-top) * var(--cc-ui-hour-height, 48px) / 60);
  right: 1px;
  left: 1px;
  height: calc(var(--calendar-length) * var(--cc-ui-hour-height, 48px) / 60);
  padding: 0 var(--cc-space-1, 4px);
  overflow: hidden;
  font-size: var(--cc-type-xs, 11px);
  white-space: nowrap;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  border-radius: var(--cc-radius-sm, 6px);
  pointer-events: none;
}
.cloudcanvas-ui-calendar-cell.is-range, .cloudcanvas-ui-calendar-allday-cell.is-range { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8)); outline-offset: -2px; }

@media (pointer: coarse) {
  .cloudcanvas-ui-calendar-event-handle { height: 14px; }
  /* The handle's reach runs on from it, down over the ground below the event and out over its edge: under every event, so a neighbour below keeps its own. */
  .cloudcanvas-ui-calendar-event-handle::after { content: ""; position: absolute; top: 0; right: 0; left: -3px; z-index: var(--target-under); height: var(--cc-control-min-coarse, 44px); }
}
`;

// ui/css/context.js
var UI_CONTEXT_CSS = `
.cloudcanvas-ui-context-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cc-space-1, 4px);
}
.cloudcanvas-ui-context-actions-pin[aria-pressed="true"] {
  background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
  font-weight: var(--cc-weight-semibold, 600);
}
.cloudcanvas-ui-context-window {
  position: fixed;
  box-sizing: border-box;
  top: calc(var(--context-viewport-top, 0px) + var(--context-viewport-height, 100dvh) - var(--cc-space-2, 8px) - env(safe-area-inset-bottom, 0px));
  right: calc(var(--context-viewport-right, 0px) + var(--cc-space-2, 8px) + env(safe-area-inset-right, 0px));
  transform: translateY(-100%);
  z-index: var(--cc-z-ui-context, 1200);
  width: min(28rem, calc(var(--context-viewport-width, 100vw) - 2 * var(--cc-space-2, 8px) - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)));
  max-height: calc(var(--context-viewport-height, 100dvh) - 2 * var(--cc-space-2, 8px) - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-2, 8px);
  overflow: auto;
  padding: var(--cc-space-3, 12px);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  overflow-wrap: anywhere;
}
.cloudcanvas-ui-context-window:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
.cloudcanvas-ui-context-window-header, .cloudcanvas-ui-context-window-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-width: 0;
  flex: none;
}
.cloudcanvas-ui-context-window-header { justify-content: space-between; }
.cloudcanvas-ui-context-window-title {
  flex: 1 1 100%;
  min-width: 0;
  margin: 0;
  font-size: var(--cc-type-lg, 15px);
  font-weight: var(--cc-weight-semibold, 600);
}
.cloudcanvas-ui-context-window-tools { justify-content: flex-end; width: 100%; }
.cloudcanvas-ui-context-window-description { flex: none; margin: 0; color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-context-window-body { min-width: 0; min-height: 0; overflow: auto; }
.cloudcanvas-ui-context-window-body > * { max-width: 100%; box-sizing: border-box; }
`;

// ui/css/menu.js
var UI_MENU_CSS = `
/* ------------------ UI KIT: MENU ------------------ */

/* The menu's own box draws nothing and takes no room where it is mounted: the control places its panels in the viewport. */
.cloudcanvas-ui-menu { display: contents; }
.cloudcanvas-ui-menu-panel {
  position: fixed;
  z-index: var(--cc-z-ui-menu, 1400);
  box-sizing: border-box;
  display: grid;
  min-width: var(--cc-menu-min-width, 168px);
  overflow: auto;
  padding: var(--cc-space-1, 4px);
  font-size: var(--cc-type-md, 13px);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
}
.cloudcanvas-ui-menu-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-3, 12px);
  min-width: 0;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  font: inherit;
  text-align: start;
  white-space: nowrap;
  color: inherit;
  background: transparent;
  border: 0;
  border-left: 3px solid transparent;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-menu-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.cloudcanvas-ui-menu-icon { display: inline-flex; flex: none; }
/* One highlight: the pointer moves focus, so the item under it and the item the keys are on are the same item. An open submenu's item keeps it. */
.cloudcanvas-ui-menu-item:is(:hover, :focus, [aria-expanded="true"]):not(:disabled) { background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))); }
.cloudcanvas-ui-menu-item:disabled { opacity: 0.5; cursor: not-allowed; }
/* The panel clips what is drawn outside it, so an item - and a menu with nothing to choose - wears the ring inside. */
:is(.cloudcanvas-ui-menu-item, .cloudcanvas-ui-menu-panel):focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
/* A dangerous item wears its tone as text. Under the highlight that tone loses its contrast: there the label is text again, and the edge carries the tone. */
.cloudcanvas-ui-menu-item[data-tone="danger"] { color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-menu-item[data-tone="danger"]:is(:hover, :focus):not(:disabled) { color: inherit; border-left-color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-menu-item[aria-haspopup="menu"]::after {
  content: "";
  flex: none;
  width: 0.4em;
  height: 0.4em;
  border-top: 1px solid currentColor;
  border-right: 1px solid currentColor;
  transform: rotate(45deg);
}
.cloudcanvas-ui-menu-separator { height: 1px; margin: var(--cc-space-1, 4px) 0; background: var(--cc-card-border, rgba(255, 255, 255, 0.1)); }

@media (pointer: coarse) {
  .cloudcanvas-ui-menu-item { min-height: var(--cc-control-min-coarse, 44px); }
}
`;

// ui/css/tabs.js
var UI_TABS_CSS = `
/* ------------------ UI KIT: TABS ------------------ */

/* A strip that scrolls clips, so it keeps the room a risen flag stands in. */
.cloudcanvas-ui-tabs {
  --tab-close: var(--cc-control-min, 28px);
  --tab-close-back: calc(-1 * var(--tab-close));
  display: flex;
  gap: var(--cc-space-1, 4px);
  padding-top: var(--cc-ui-flag-rise, 0px);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}
.cloudcanvas-ui-tabs-item { display: inline-flex; align-items: center; flex: none; overflow-x: clip; scroll-snap-align: start; }
.cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close {
  min-height: var(--cc-control-min, 28px);
  font: inherit;
  color: var(--cc-text, #e2e8f0);
  background: transparent;
  border: 0;
  cursor: pointer;
}
/* A tab is one row: its mark, its label, its badge. The label is what gives way. */
.cloudcanvas-ui-tabs-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  max-width: var(--cc-ui-tab-width, 16rem);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  white-space: nowrap;
  border-bottom: 2px solid transparent;
}
.cloudcanvas-ui-tabs-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
/* The icon is a mark in the tab's own ink; it never shrinks, so the label is what gives way. A kit icon is as large as the label's text, so it makes no tab taller; a host's own element is as large as the host draws it. */
.cloudcanvas-ui-tabs-icon { display: inline-flex; flex: none; }
.cloudcanvas-ui-tabs-icon > .cloudcanvas-ui-icon { width: 1em; height: 1em; }
.cloudcanvas-ui-tabs-tab > .cloudcanvas-ui-badge { flex: none; }
.cloudcanvas-ui-tabs-tab[aria-selected="true"] { border-bottom-color: var(--cc-accent, #38bdf8); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-tabs-tab:disabled { opacity: 0.5; cursor: not-allowed; }
/* A badge needs the height a tab's padding takes: the label is centred in the whole tab instead, where it already sat. */
.cloudcanvas-ui-tabs-tab.is-badged { padding-top: 0; padding-bottom: 0; }
/* A pinned tab stays put and cannot be closed: a small mark before its label says so, in the label's own colour. */
.cloudcanvas-ui-tabs-tab[data-pinned="true"]::before {
  content: "";
  flex: none;
  width: 0.375em;
  height: 0.375em;
  background: currentColor;
  border-radius: var(--cc-radius-pill, 9999px);
}
/* The close control stands back over the far end of its tab, in the room the tab keeps for it. */
.cloudcanvas-ui-tabs .is-closable > .cloudcanvas-ui-tabs-tab { padding-right: var(--tab-close); }
.cloudcanvas-ui-tabs-close { position: relative; flex: none; align-self: stretch; width: var(--tab-close); margin-left: var(--tab-close-back); padding: 0; }
/* The ring is worn inside: a strip cuts what is drawn outside its tabs. */
.cloudcanvas-ui-tabs-tab:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}

/* The folder face: opaque, the tab in front of whatever is behind it in its row. */
.cloudcanvas-ui-tabs[data-face="folder"] {
  --tab-face: linear-gradient(var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))), var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))));
  --layer-shade: linear-gradient(var(--cc-ui-tab-layer, var(--cc-scope-bg, rgba(0, 0, 0, 0.2))), var(--cc-ui-tab-layer, var(--cc-scope-bg, rgba(0, 0, 0, 0.2))));
}
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-tab {
  position: relative;
  align-self: stretch;
  background-color: var(--cc-bg, #0f1117);
  background-image: var(--tab-face);
  border-top: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-right: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0 0;
  box-shadow: var(--cc-ui-tab-layer-shadow, var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)));
}
/* One step back: a step lower, under one wash of shade. A flag that rises keeps its height. */
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-item:not(.is-active) { padding-top: var(--cc-ui-tab-layer-step, 3px); }
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-item:not(.is-active) > .cloudcanvas-ui-tabs-tab { background-image: var(--layer-shade), var(--tab-face); }
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-item:not(.is-active) .cloudcanvas-ui-badge[data-shape="flag"] {
  transform: translateY(calc(-1 * (var(--cc-ui-flag-rise, 0px) + min(var(--cc-ui-flag-rise, 0px), var(--cc-ui-tab-layer-step, 3px)))));
}

/* A tab in hand, and the bar where it would land. */
.cloudcanvas-ui-tabs.is-drag-active, .cloudcanvas-ui-tabs.is-drag-active button { cursor: grabbing; }
.cloudcanvas-ui-tabs-item.is-dragging > .cloudcanvas-ui-tabs-tab {
  outline: var(--cc-focus-ring-width, 2px) dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
.cloudcanvas-ui-tabs-item[data-drop] { position: relative; }
.cloudcanvas-ui-tabs-item[data-drop]::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  z-index: var(--cc-z-ui-raised, 2);
  width: var(--cc-focus-ring-width, 2px);
  background: var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  outline: 1px solid var(--cc-bg, #0f1117);
}
.cloudcanvas-ui-tabs-item[data-drop="after"]::after { inset: 0 0 0 auto; }

/* Under a finger a tab is 44px tall and its close control 44px wide. */
@media (pointer: coarse) {
  .cloudcanvas-ui-tabs { --tab-close: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close { min-height: var(--cc-control-min-coarse, 44px); }
}
`;

// ui/css/tabs-layers.js
var UI_TAB_LAYERS_CSS = `
/* ------------------ UI KIT: TAB LAYERS ------------------ */

.cloudcanvas-ui-tabs-layers { display: inline-flex; align-self: stretch; }
.cloudcanvas-ui-tabs-layer {
  position: relative;
  flex: none;
  box-sizing: border-box;
  min-height: var(--cc-control-min, 28px);
  padding: 0;
  font: inherit;
  font-size: var(--cc-type-sm, 12px);
  color: var(--cc-text, #e2e8f0);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.cloudcanvas-ui-tabs-layer:disabled { opacity: 0.5; cursor: not-allowed; }
/* The face carries the label, and cuts one that is too long for it. */
.cloudcanvas-ui-tabs-layer-face { box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* The ring is the face's, inside it: on a folder strip the face is in front of every neighbour by then, and wider than the place it left. */
.cloudcanvas-ui-tabs-layer:focus-visible { outline: none; }
.cloudcanvas-ui-tabs-layer:focus-visible > .cloudcanvas-ui-tabs-layer-face {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
/* The fold's menu is mounted beside the strip and takes no room there. */
.cloudcanvas-ui-tabs-menu { display: contents; }

/* On a line strip: the label in line, then a mark that points on to the tab. */
.cloudcanvas-ui-tabs[data-face="line"] .cloudcanvas-ui-tabs-layer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  max-width: var(--cc-ui-tab-layer-width, 12rem);
}
.cloudcanvas-ui-tabs[data-face="line"] .cloudcanvas-ui-tabs-layer-face { min-width: 0; padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px); border-radius: var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-tabs[data-face="line"] .cloudcanvas-ui-tabs-layer::after {
  content: "";
  flex: none;
  width: 0.4em;
  height: 0.4em;
  border-top: 1px solid currentColor;
  border-right: 1px solid currentColor;
  transform: rotate(45deg);
}
.cloudcanvas-ui-tabs[data-face="line"] .cloudcanvas-ui-tabs-layer:is(:hover, :focus-visible):not(:disabled) > .cloudcanvas-ui-tabs-layer-face { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }

/* On a folder strip: a stack. The button is what peeks out; its face is free of the row. */
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer { width: var(--cc-ui-tab-layer-peek, 4.5rem); }
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer.is-fold { width: var(--cc-control-min, 28px); }
/* The label starts at the face's near edge, at its top as on a folder's tab, and ends before the corner the face is tucked under. */
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer-face {
  position: absolute;
  inset: var(--cc-ui-tab-layer-step, 3px) auto 0 0;
  width: max-content;
  min-width: calc(100% + var(--cc-radius-sm, 6px));
  max-width: calc(100% + var(--cc-radius-sm, 6px));
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px) 0 var(--cc-space-2, 8px);
  line-height: 1.2;
  text-align: start;
  background-color: var(--cc-bg, #0f1117);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-width: 1px 0 0 1px;
  border-radius: var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0 0;
  box-shadow: var(--cc-ui-tab-layer-shadow, var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)));
}
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer.is-fold > .cloudcanvas-ui-tabs-layer-face { padding-right: var(--cc-space-2, 8px); text-align: center; }
/* One step back, one step lower and one wash of shade more over the tab's own face. */
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer[data-depth="1"] > .cloudcanvas-ui-tabs-layer-face { background-image: var(--layer-shade), var(--tab-face); }
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer[data-depth="2"] > .cloudcanvas-ui-tabs-layer-face {
  top: calc(2 * var(--cc-ui-tab-layer-step, 3px));
  background-image: var(--layer-shade), var(--layer-shade), var(--tab-face);
}
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer[data-depth="3"] > .cloudcanvas-ui-tabs-layer-face {
  top: calc(3 * var(--cc-ui-tab-layer-step, 3px));
  background-image: var(--layer-shade), var(--layer-shade), var(--layer-shade), var(--tab-face);
}
/* Behind a tab a step back: one wash more. No heavier than the rules above, so a layer brought forward is still lit. */
.cloudcanvas-ui-tabs[data-face="folder"] :where(.cloudcanvas-ui-tabs-item:not(.is-active)) .cloudcanvas-ui-tabs-layer[data-depth="1"] > .cloudcanvas-ui-tabs-layer-face { background-image: var(--layer-shade), var(--layer-shade), var(--tab-face); }
.cloudcanvas-ui-tabs[data-face="folder"] :where(.cloudcanvas-ui-tabs-item:not(.is-active)) .cloudcanvas-ui-tabs-layer[data-depth="2"] > .cloudcanvas-ui-tabs-layer-face { background-image: var(--layer-shade), var(--layer-shade), var(--layer-shade), var(--tab-face); }
.cloudcanvas-ui-tabs[data-face="folder"] :where(.cloudcanvas-ui-tabs-item:not(.is-active)) .cloudcanvas-ui-tabs-layer[data-depth="3"] > .cloudcanvas-ui-tabs-layer-face {
  background-image: var(--layer-shade), var(--layer-shade), var(--layer-shade), var(--layer-shade), var(--tab-face);
}
/* Under the pointer or the keys a layer comes to the front and opens out to its label, over what stood in front of it:
   whole now, and lit as a control is under the pointer rather than shaded as something behind. */
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer:is(:hover, :focus-visible):not(:disabled) { z-index: var(--cc-z-ui-raised, 2); }
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer:is(:hover, :focus-visible):not(:disabled) > .cloudcanvas-ui-tabs-layer-face {
  max-width: var(--cc-ui-tab-layer-width, 12rem);
  background-image: linear-gradient(var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)), var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))), var(--tab-face);
  border-right-width: 1px;
}

/* A folder layer eases open only for a user who has not asked for less motion. */
@media (prefers-reduced-motion: no-preference) {
  .cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer-face { transition: max-width 120ms ease-out; }
}
@media (pointer: coarse) {
  .cloudcanvas-ui-tabs-layer { min-width: var(--cc-control-min-coarse, 44px); min-height: var(--cc-control-min-coarse, 44px); }
}
`;

// ui/styles.js
var UI_STYLE_ID = "cloudcanvas-ui-styles";
var UI_CSS = `${UI_CONTROLS_CSS}${UI_FORMS_CSS}${UI_OVERLAYS_CSS}${UI_VIEWS_CSS}${UI_CALENDAR_CSS}${UI_GRAPH_CSS}${UI_TIMELINE_CSS}${UI_CONTEXT_CSS}${UI_MENU_CSS}${UI_TABS_CSS}${UI_TAB_LAYERS_CSS}`;
function injectUiStyles(doc = globalThis.document, { nonce } = {}) {
  if (!doc?.createElement || !doc.head) return null;
  const existing = doc.getElementById(UI_STYLE_ID);
  if (existing) return existing;
  const style = doc.createElement("style");
  style.id = UI_STYLE_ID;
  if (nonce) style.setAttribute("nonce", String(nonce));
  style.textContent = UI_CSS;
  doc.head.append(style);
  return style;
}

// ui/tokens.js
var C = /* @__PURE__ */ Object.freeze({ COLOR: "color", SIZE: "size", SHADOW: "shadow", Z_INDEX: "z-index" });
var UI_TOKENS = /* @__PURE__ */ Object.freeze({
  /* ---- colour ---- */
  "--cc-ui-surface": { category: C.COLOR, purpose: "Surface of dialogs, toasts and sticky timeline chrome" },
  "--cc-ui-backdrop": { category: C.COLOR, purpose: "Dimming layer behind a modal dialog" },
  "--cc-ui-selected": { category: C.COLOR, purpose: "Fill of a highlighted result option" },
  "--cc-ui-on-accent": { category: C.COLOR, purpose: "Text on an accent fill (primary button, pressed view, today)" },
  "--cc-ui-grid-line": { category: C.COLOR, purpose: "Rules between calendar, board and timeline cells" },
  "--cc-ui-hour-lines": { category: C.COLOR, purpose: "Hour-rule background pattern of the week and day grids" },
  "--cc-ui-bar": { category: C.COLOR, purpose: "Fill of a calendar event and a timeline bar" },
  "--cc-ui-bar-text": { category: C.COLOR, purpose: "Text on a calendar event and a timeline bar" },
  "--cc-ui-drop": { category: C.COLOR, purpose: "Outline of a drop target and of an item being moved" },
  "--cc-ui-today": { category: C.COLOR, purpose: "Fill marking today's date" },
  "--cc-ui-flag-light": { category: C.COLOR, purpose: "Light on a flag badge: its sheen, its top edge and the lit side of its staff" },
  "--cc-ui-flag-shade": { category: C.COLOR, purpose: "Shade on a flag badge: under its sheen, at its staff and in its folded tail" },
  "--cc-ui-flag-shadow": { category: C.COLOR, purpose: "Shadow a flag badge casts on what it is planted on" },
  "--cc-ui-tab-layer": { category: C.COLOR, purpose: "Shade a folder layer behind a tab takes, once for each step back it stands" },
  "--cc-ui-tone-1": { category: C.COLOR, purpose: "Category tone 1 of 8: the edge of a card, event, bar, chip or tree item marked tone 1" },
  "--cc-ui-tone-2": { category: C.COLOR, purpose: "Category tone 2 of 8: the edge of a card, event, bar, chip or tree item marked tone 2" },
  "--cc-ui-tone-3": { category: C.COLOR, purpose: "Category tone 3 of 8: the edge of a card, event, bar, chip or tree item marked tone 3" },
  "--cc-ui-tone-4": { category: C.COLOR, purpose: "Category tone 4 of 8: the edge of a card, event, bar, chip or tree item marked tone 4" },
  "--cc-ui-tone-5": { category: C.COLOR, purpose: "Category tone 5 of 8: the edge of a card, event, bar, chip or tree item marked tone 5" },
  "--cc-ui-tone-6": { category: C.COLOR, purpose: "Category tone 6 of 8: the edge of a card, event, bar, chip or tree item marked tone 6" },
  "--cc-ui-tone-7": { category: C.COLOR, purpose: "Category tone 7 of 8: the edge of a card, event, bar, chip or tree item marked tone 7" },
  "--cc-ui-tone-8": { category: C.COLOR, purpose: "Category tone 8 of 8: the edge of a card, event, bar, chip or tree item marked tone 8" },
  /* ---- geometry and stacking ---- */
  "--cc-ui-dialog-width": { category: C.SIZE, purpose: "Maximum width of a dialog panel" },
  "--cc-ui-flag-rise": { category: C.SIZE, purpose: "How far a flag badge stands out of the top of what holds it; tabs and the nav bar keep that room" },
  "--cc-ui-tab-width": { category: C.SIZE, purpose: "Most room a tab takes; a longer label is cut with an ellipsis" },
  "--cc-ui-tab-layer-peek": { category: C.SIZE, purpose: "How much of a folder layer shows past whatever stands in front of it" },
  "--cc-ui-tab-layer-step": { category: C.SIZE, purpose: "How much lower a folder layer stands for each step back from its tab" },
  "--cc-ui-tab-layer-width": { category: C.SIZE, purpose: "Most room a folder layer takes when it comes forward to be read" },
  "--cc-ui-toast-offset": { category: C.SIZE, purpose: "Gap between the toast stack and the bottom of the viewport" },
  "--cc-ui-toast-inset-bottom": { category: C.SIZE, purpose: "Room kept clear under the toast stack, for a bar or a button a host floats there; the toast offset when unset" },
  "--cc-ui-toast-inset-left": { category: C.SIZE, purpose: "Room kept clear to the left of the toast stack" },
  "--cc-ui-toast-inset-right": { category: C.SIZE, purpose: "Room kept clear to the right of the toast stack" },
  "--cc-ui-hour-height": { category: C.SIZE, purpose: "Height of one hour in the week and day grids" },
  "--cc-ui-time-height": { category: C.SIZE, purpose: "Visible height of the scrolling hour grid" },
  "--cc-ui-timeline-height": { category: C.SIZE, purpose: "Visible height of the timeline sheet" },
  "--cc-ui-gutter": { category: C.SIZE, purpose: "Width of the timeline label column" },
  "--cc-ui-graph-height": { category: C.SIZE, purpose: "Height of the relationship-graph viewport" },
  "--cc-ui-tab-layer-shadow": { category: C.SHADOW, purpose: "Shadow a folder tab casts on the layer behind it" },
  "--cc-ui-selected-ring": { category: C.SHADOW, purpose: "Ring inside a card, chip, bar or heading a view marks as the selected item" },
  "--cc-z-ui-context": { category: C.Z_INDEX, purpose: "Nonmodal floating context windows: the lowest of the floating layers, below toasts, dialogs and menus" },
  "--cc-z-ui-toast": { category: C.Z_INDEX, purpose: "Toast stack: above the floating context windows, below a dialog and below a menu, which it must not cover" },
  "--cc-z-ui-dialog": { category: C.Z_INDEX, purpose: "A dialog that is not modal: above toasts, below a menu opened over it (a modal dialog is in the top layer)" },
  "--cc-z-ui-popover": { category: C.Z_INDEX, purpose: "Popovers: above a dialog that is not modal and the toasts, below a menu opened from one" },
  "--cc-z-ui-menu": { category: C.Z_INDEX, purpose: "Menus: the top floating layer, above the context windows, toasts and dialogs one may be opened over" },
  "--cc-z-ui-raised": { category: C.Z_INDEX, purpose: "Parts raised inside a UI view: sticky labels, a card being dragged" },
  "--cc-z-ui-sticky": { category: C.Z_INDEX, purpose: "Sticky headers inside a UI view, above raised parts (the timeline axis)" }
});

// ui/drag.js
var DRAG_START_PX = 4;
var TOUCH_DRAG_DELAY_MS = 350;
var TOUCH_DRAG_START_PX = 10;
function pointOf(event) {
  return { x: event.clientX, y: event.clientY };
}
function travelled(press2, event) {
  return Math.hypot(event.clientX - press2.x, event.clientY - press2.y);
}
function swallowNextClick(life, container) {
  const swallow = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  container.addEventListener("click", swallow, { capture: true, once: true, signal: life.signal });
  life.later(() => container.removeEventListener("click", swallow, { capture: true }), 0);
}
function begin(state, container, options) {
  state.dragging = true;
  try {
    container.setPointerCapture?.(state.press.id);
  } catch {
  }
  container.classList.add("is-drag-active");
  options.onStart?.(state.press.item, { x: state.press.x, y: state.press.y }, state.press.target);
}
function finish(state, container, options, point) {
  const wasDragging = state.dragging;
  state.cancelTouch?.();
  state.cancelTouch = null;
  state.press = null;
  state.dragging = false;
  container.classList.remove("is-drag-active");
  if (wasDragging) options.onEnd?.(point);
  return wasDragging;
}
function press(life, state, container, options, event) {
  if (event.button !== 0 || state.press) return;
  const item = event.target.closest?.(options.selector);
  if (!item || !container.contains(item) || options.canStart?.(item, event) === false) return;
  const touch = event.pointerType === "touch";
  state.press = { id: event.pointerId, item, target: event.target, x: event.clientX, y: event.clientY, touch, ready: !touch };
  if (touch) state.cancelTouch = life.later(() => {
    if (state.press) state.press.ready = true;
  }, options.touchDelay ?? TOUCH_DRAG_DELAY_MS);
}
function slopOf(current, options) {
  return current.touch && current.ready ? options.touchThreshold ?? TOUCH_DRAG_START_PX : options.threshold ?? DRAG_START_PX;
}
function move(state, container, options, event) {
  const current = state.press;
  if (!current || event.pointerId !== current.id) return;
  if (state.dragging) {
    options.onMove?.(pointOf(event));
    return;
  }
  if (travelled(current, event) <= slopOf(current, options)) return;
  if (!current.ready) {
    finish(state, container, options, null);
    return;
  }
  begin(state, container, options);
  options.onMove?.(pointOf(event));
}
function trackDrag(life, container, options) {
  const state = { press: null, dragging: false, cancelTouch: null };
  life.on(container, "pointerdown", (event) => press(life, state, container, options, event));
  life.on(container, "pointermove", (event) => move(state, container, options, event));
  life.on(container, "pointerup", (event) => {
    if (state.press?.id !== event.pointerId) return;
    if (finish(state, container, options, pointOf(event))) swallowNextClick(life, container);
  });
  life.on(container, "pointercancel", (event) => {
    if (state.press?.id === event.pointerId) finish(state, container, options, null);
  });
  life.on(container, "touchmove", (event) => {
    if (state.dragging || state.press?.touch && state.press.ready) event.preventDefault();
  }, { passive: false });
  life.on(container, "contextmenu", (event) => {
    if (state.press?.touch) event.preventDefault();
  });
  const doc = container.ownerDocument;
  life.on(doc, "keydown", (event) => {
    if (event.key === "Escape" && state.dragging) {
      event.preventDefault();
      finish(state, container, options, null);
    }
  });
  life.add(() => {
    state.cancelTouch?.();
    state.press = null;
    state.dragging = false;
  });
  return {
    cancel() {
      finish(state, container, options, null);
    },
    get dragging() {
      return state.dragging;
    }
  };
}

// ui/dialog.js
var CLASS = "cloudcanvas-ui-dialog";
function dialogNodes(doc, life, requestClose) {
  const root = el(doc, "dialog", { className: CLASS });
  const panel = el(doc, "div", { className: `${CLASS}-panel`, attrs: { tabindex: "-1" } });
  const header = el(doc, "div", { className: `${CLASS}-header` });
  const title = el(doc, "h2", { className: `${CLASS}-title`, attrs: { id: uniqueId(CLASS) } });
  const titleText = textNode(doc, title);
  const close3 = button(doc, {
    className: `${CLASS}-close`,
    label: "Close",
    signal: life.signal,
    onClick: () => requestClose("button")
  });
  const description = el(doc, "p", { className: `${CLASS}-description`, attrs: { id: uniqueId(CLASS), hidden: true } });
  const body = el(doc, "div", { className: `${CLASS}-body` });
  header.append(title, close3);
  panel.append(header, description, body);
  root.append(panel);
  root.setAttribute("aria-labelledby", title.id);
  return { root, panel, title, titleText, close: close3, description, body };
}
function wrapTab(event, nodes) {
  const items = focusablesIn(nodes.panel);
  if (items.length === 0) {
    event.preventDefault();
    nodes.panel.focus();
    return;
  }
  const active = nodes.root.ownerDocument.activeElement;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && (active === first || !nodes.panel.contains(active) || active === nodes.panel)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !nodes.panel.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}
function bindKeys(life, nodes, state, requestClose) {
  life.on(nodes.root, "keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      state.escapeHandled = true;
      queueMicrotask(() => {
        state.escapeHandled = false;
      });
      if (state.dismissible) requestClose("escape");
    } else if (event.key === "Tab" && state.modal) {
      wrapTab(event, nodes);
    }
  });
  life.on(nodes.root, "cancel", (event) => {
    event.preventDefault();
    if (!state.escapeHandled && state.dismissible) requestClose("escape");
  });
  life.on(nodes.root, "click", (event) => {
    if (event.target === nodes.root && state.dismissible) requestClose("backdrop");
  });
}
function writeModel(nodes, state, model) {
  writeText(nodes.titleText, model.title ?? "");
  nodes.close.hidden = model.closeButton === false;
  nodes.close.setAttribute("aria-label", String(model.closeLabel ?? "Close"));
  writeText(nodes.close.firstChild, model.closeLabel ?? "Close");
  const description = model.description ? String(model.description) : "";
  nodes.description.hidden = description === "";
  nodes.description.textContent = description;
  if (description) nodes.root.setAttribute("aria-describedby", nodes.description.id);
  else nodes.root.removeAttribute("aria-describedby");
  state.dismissible = model.dismissible !== false;
  state.modal = model.modal !== false;
  if (model.content && nodes.body.firstChild !== model.content) nodes.body.replaceChildren(model.content);
}
function show2(host, nodes, state) {
  const doc = nodes.root.ownerDocument;
  state.previous = doc.activeElement;
  if (!nodes.root.isConnected) host.append(nodes.root);
  if (state.modal && typeof nodes.root.showModal === "function") nodes.root.showModal();
  else if (typeof nodes.root.show === "function") nodes.root.show();
  else nodes.root.setAttribute("open", "");
  nodes.root.classList.toggle("is-modal", state.modal);
  const first = focusablesIn(nodes.body)[0] ?? nodes.panel;
  first.focus();
}
function hide(nodes, state) {
  if (typeof nodes.root.close === "function" && nodes.root.open) nodes.root.close();
  nodes.root.removeAttribute("open");
  const previous = state.previous;
  state.previous = null;
  if (previous?.isConnected && typeof previous.focus === "function") previous.focus();
}
function createDialog(host, { onClose } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const state = { open: false, modal: true, dismissible: true, previous: null, escapeHandled: false };
  const requestClose = (reason) => {
    if (!life.dead && state.open) onClose?.(reason);
  };
  const nodes = dialogNodes(doc, life, requestClose);
  bindKeys(life, nodes, state, requestClose);
  return {
    body: nodes.body,
    update(model = {}) {
      if (life.dead) return;
      writeModel(nodes, state, model);
      if (model.open && !state.open) show2(host, nodes, state);
      else if (!model.open && state.open) hide(nodes, state);
      state.open = Boolean(model.open);
    },
    destroy() {
      if (!life.destroy()) return;
      if (state.open) hide(nodes, state);
      state.open = false;
      nodes.root.remove();
    }
  };
}

// ui/confirm.js
var CLASS2 = "cloudcanvas-ui-confirm";
function checkedWords({ title, body, confirmLabel, cancelLabel }) {
  const heading = String(title ?? "").trim();
  if (heading === "") throw new TypeError("A confirmation needs a title");
  return { heading, body: String(body ?? ""), confirm: String(confirmLabel ?? "Confirm"), cancel: String(cancelLabel ?? "Cancel") };
}
function choices(doc, life, words2, danger, answer) {
  const row = el(doc, "div", { className: `${CLASS2}-actions` });
  const cancel = button(doc, { label: words2.cancel, className: `${CLASS2}-cancel`, signal: life.signal, onClick: () => answer(false) });
  const confirm = button(doc, { label: words2.confirm, className: `${CLASS2}-confirm ${danger ? "is-danger" : "is-primary"}`, signal: life.signal, onClick: () => answer(true) });
  row.append(cancel, confirm);
  return { row, cancel, confirm };
}
function ask(question, resolve) {
  const words2 = checkedWords(question);
  const host = question.host ?? globalThis.document?.body;
  const doc = documentOf(host);
  const life = createLife();
  let dialog = null;
  const answer = (value) => {
    if (life.dead) return;
    dialog.update({ open: false, title: words2.heading });
    dialog.destroy();
    life.destroy();
    resolve(value);
  };
  dialog = createDialog(host, { onClose: () => answer(false) });
  const { row, cancel, confirm } = choices(doc, life, words2, question.danger === true, answer);
  dialog.update({ open: true, title: words2.heading, description: words2.body, closeButton: false, content: row });
  (question.danger === true ? cancel : confirm).focus();
  return answer;
}
function confirmDialog(question = {}) {
  let answerWith = () => {
  };
  const asking = new Promise((resolve) => {
    answerWith = ask(question, resolve);
  });
  return Object.assign(asking, { close: (result = false) => answerWith(Boolean(result)) });
}

// ui/context-actions.js
var CLASS3 = "cloudcanvas-ui-context-actions";
function action(doc, life, name, label, callback) {
  const node = button(doc, {
    className: `${CLASS3}-${name}`,
    label,
    signal: life.signal,
    onClick: () => {
      if (!life.dead && !node.disabled) callback?.();
    }
  });
  return node;
}
function writeButton(node, label, disabled) {
  writeText(node.firstChild, label);
  node.setAttribute("aria-label", String(label));
  node.disabled = Boolean(disabled);
}
function createContextActions(host, { onPin, onExpand } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS3 });
  const pin = action(doc, life, "pin", "Pin", onPin);
  const expand = action(doc, life, "expand", "Expand", onExpand);
  pin.setAttribute("aria-pressed", "false");
  root.append(pin, expand);
  host.append(root);
  return {
    update(model = {}) {
      if (life.dead) return;
      root.setAttribute("aria-busy", String(Boolean(model.busy)));
      pin.setAttribute("aria-pressed", String(Boolean(model.pinned)));
      writeButton(pin, model.pinLabel ?? "Pin", model.busy || model.pinDisabled);
      writeButton(expand, model.expandLabel ?? "Expand", model.busy || model.expandDisabled);
    },
    destroy() {
      if (!life.destroy()) return;
      root.remove();
    }
  };
}

// ui/context-window/viewport.js
function writeViewport(root, view) {
  const { left, top, width, height } = visualBox(view);
  if (!(width > 0 && height > 0)) return;
  root.style.setProperty("--context-viewport-width", `${width}px`);
  root.style.setProperty("--context-viewport-height", `${height}px`);
  root.style.setProperty("--context-viewport-top", `${Math.max(0, top)}px`);
  root.style.setProperty("--context-viewport-right", `${Math.max(0, view.innerWidth - left - width)}px`);
}
function bindViewport(root, life) {
  const view = root.ownerDocument.defaultView;
  if (!view) return;
  const refresh = () => writeViewport(root, view);
  life.on(view, "resize", refresh);
  if (view.visualViewport) {
    life.on(view.visualViewport, "resize", refresh);
    life.on(view.visualViewport, "scroll", refresh);
  }
  refresh();
}

// ui/context-window.js
var CLASS4 = "cloudcanvas-ui-context-window";
function windowNodes(doc, life, requestClose) {
  const root = el(doc, "section", {
    className: CLASS4,
    attrs: { role: "dialog", "aria-modal": "false", tabindex: "-1", hidden: true, "data-cc-control": true }
  });
  const header = el(doc, "div", { className: `${CLASS4}-header` });
  const title = el(doc, "h2", { className: `${CLASS4}-title`, attrs: { id: uniqueId(CLASS4) } });
  const titleText = textNode(doc, title);
  const tools = el(doc, "div", { className: `${CLASS4}-tools` });
  const actionHost = el(doc, "div", { className: `${CLASS4}-actions` });
  const close3 = button(doc, {
    className: `${CLASS4}-close`,
    label: "Close",
    signal: life.signal,
    onClick: () => requestClose("button")
  });
  const description = el(doc, "p", {
    className: `${CLASS4}-description`,
    attrs: { id: uniqueId(CLASS4), hidden: true }
  });
  const body = el(doc, "div", { className: `${CLASS4}-body` });
  tools.append(actionHost, close3);
  header.append(title, tools);
  root.append(header, description, body);
  root.setAttribute("aria-labelledby", title.id);
  return { root, titleText, close: close3, description, body, actionHost };
}
function writeModel2(nodes, state, actions, model) {
  writeText(nodes.titleText, model.title ?? "");
  writeText(nodes.close.firstChild, model.closeLabel ?? "Close");
  nodes.close.setAttribute("aria-label", String(model.closeLabel ?? "Close"));
  const description = model.description ? String(model.description) : "";
  nodes.description.hidden = description === "";
  if (nodes.description.textContent !== description) nodes.description.textContent = description;
  if (description) nodes.root.setAttribute("aria-describedby", nodes.description.id);
  else nodes.root.removeAttribute("aria-describedby");
  nodes.root.setAttribute("aria-busy", String(Boolean(model.busy)));
  state.dismissible = model.dismissible !== false;
  if (Object.hasOwn(model, "content") && nodes.body.firstChild !== model.content) {
    nodes.body.replaceChildren(...model.content == null ? [] : [model.content]);
  }
  actions.update(model);
}
function hide2(nodes, state) {
  const restore2 = nodes.root.contains(nodes.root.ownerDocument.activeElement);
  nodes.root.hidden = true;
  const previous = state.previous;
  state.previous = null;
  if (restore2 && previous?.isConnected && typeof previous.focus === "function") previous.focus();
}
function show3(nodes, state) {
  state.previous = nodes.root.ownerDocument.activeElement;
  nodes.root.hidden = false;
  (focusablesIn(nodes.body)[0] ?? nodes.root).focus();
}
function bindKeys2(life, nodes, state, requestClose) {
  life.on(nodes.root, "keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented || !state.open) return;
    event.preventDefault();
    event.stopPropagation();
    if (state.dismissible) requestClose("escape");
  });
}
function createContextWindow(host, { onClose, onPin, onExpand } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const state = { open: false, dismissible: true, previous: null };
  const requestClose = (reason) => {
    if (!life.dead && state.open) onClose?.(reason);
  };
  const nodes = windowNodes(doc, life, requestClose);
  const actions = createContextActions(nodes.actionHost, {
    onPin: () => {
      if (state.open) onPin?.();
    },
    onExpand: () => {
      if (state.open) onExpand?.();
    }
  });
  life.add(() => actions.destroy());
  host.append(nodes.root);
  bindKeys2(life, nodes, state, requestClose);
  bindViewport(nodes.root, life);
  return {
    body: nodes.body,
    update(model = {}) {
      if (life.dead) return;
      if (!model.open && state.open) hide2(nodes, state);
      writeModel2(nodes, state, actions, model);
      if (model.open && !state.open) show3(nodes, state);
      state.open = Boolean(model.open);
    },
    destroy() {
      if (life.dead) return;
      if (state.open) hide2(nodes, state);
      state.open = false;
      life.destroy();
      nodes.root.remove();
    }
  };
}

// plugins/motion.js
import { Camera } from "cloudcanvas/kernel";
import { schedule } from "cloudcanvas/kernel";
import { rootOf, stateOf } from "cloudcanvas/kernel";
import { createLogger } from "cloudcanvas/log";
var logger = /* @__PURE__ */ createLogger("motion");
var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
var reducedMotion = null;
function readReducedMotion() {
  const state = { matches: false, query: null, onChange: null };
  if (typeof globalThis.matchMedia !== "function") return state;
  try {
    state.query = globalThis.matchMedia(REDUCED_MOTION_QUERY);
  } catch (error) {
    logger.debug(`matchMedia rejected "${REDUCED_MOTION_QUERY}"`, error);
    return state;
  }
  const query = state.query;
  if (!query) return state;
  state.matches = Boolean(query.matches);
  state.onChange = (event) => {
    state.matches = Boolean(event && "matches" in event ? event.matches : query.matches);
  };
  if (typeof query.addEventListener === "function") query.addEventListener("change", state.onChange);
  else if (typeof query.addListener === "function") query.addListener(state.onChange);
  return state;
}
function prefersReducedMotion() {
  reducedMotion ??= readReducedMotion();
  return reducedMotion.matches;
}

// ui/drawer.js
var CLASS5 = "cloudcanvas-ui-drawer";
var TRAVEL_MS = 160;
var UPWARD = /* @__PURE__ */ Object.freeze([{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }]);
var TRAVEL = /* @__PURE__ */ Object.freeze([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.2)" }]);
var ORIGIN_X = "--drawer-origin-x";
var ORIGIN_Y = "--drawer-origin-y";
var HOLDERS = /* @__PURE__ */ new WeakMap();
function ownerOf(anchor) {
  return HOLDERS.get(anchor)?.at(-1) ?? null;
}
function writeOwner(anchor) {
  const owner = ownerOf(anchor);
  if (!owner) {
    anchor.removeAttribute("aria-expanded");
    anchor.removeAttribute("aria-controls");
    return;
  }
  anchor.setAttribute("aria-controls", owner.root.id);
  anchor.setAttribute("aria-expanded", String(owner.state.open === true));
}
function aim(root, anchor) {
  const to = anchor?.getBoundingClientRect();
  if (!to || !(to.width > 0) || !(to.height > 0)) {
    root.style.removeProperty(ORIGIN_X);
    root.style.removeProperty(ORIGIN_Y);
    return;
  }
  const box = root.getBoundingClientRect();
  root.style.setProperty(ORIGIN_X, `${to.left + to.width / 2 - box.left}px`);
  root.style.setProperty(ORIGIN_Y, `${to.top + to.height / 2 - box.top}px`);
}
function conceal(root, anchor) {
  const held = root.contains(root.ownerDocument.activeElement);
  root.hidden = true;
  root.inert = true;
  if (held && anchor?.isConnected && typeof anchor.focus === "function") anchor.focus();
}
function reveal(root) {
  root.hidden = false;
  root.inert = false;
}
function settle(drawer) {
  const { root, state } = drawer;
  if (!state.open) conceal(root, state.anchor);
  state.motion?.cancel();
  state.motion = null;
}
function travel(drawer, moving) {
  const { root, state } = drawer;
  if (state.motion) {
    state.motion.reverse();
    return;
  }
  if (state.open) reveal(root);
  if (!moving || prefersReducedMotion()) {
    settle(drawer);
    return;
  }
  aim(root, state.anchor);
  state.motion = root.animate(state.direction === "up" ? UPWARD : TRAVEL, { duration: TRAVEL_MS, easing: "ease-in", fill: "both", direction: state.open ? "reverse" : "normal" });
  state.motion.onfinish = () => settle(drawer);
}
function halt(state) {
  const motion = state.motion;
  if (!motion) return;
  state.motion = null;
  motion.onfinish = null;
  motion.finish();
  motion.cancel();
}
function release(drawer) {
  const anchor = drawer.state.anchor;
  if (!anchor) return;
  drawer.state.anchor = null;
  if (drawer.press) anchor.removeEventListener("click", drawer.press);
  const others = HOLDERS.get(anchor).filter((holder) => holder !== drawer);
  if (others.length > 0) HOLDERS.set(anchor, others);
  else HOLDERS.delete(anchor);
  writeOwner(anchor);
}
function hold(drawer, anchor) {
  if (drawer.state.anchor === anchor) return;
  release(drawer);
  drawer.state.anchor = anchor;
  if (!anchor) return;
  HOLDERS.set(anchor, [...HOLDERS.get(anchor) ?? [], drawer]);
  if (drawer.press) anchor.addEventListener("click", drawer.press);
}
function createDrawer(host, { onToggle } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS5, attrs: { id: uniqueId(CLASS5), role: "region", hidden: true, inert: true } });
  host.append(root);
  const state = { open: null, anchor: null, motion: null, direction: "anchor" };
  const drawer = { root, state, press: null };
  if (typeof onToggle === "function") drawer.press = () => {
    if (ownerOf(state.anchor) === drawer) onToggle(!state.open);
  };
  life.add(() => release(drawer));
  life.add(() => halt(state));
  return {
    panel: root,
    update(model = {}) {
      if (life.dead) return;
      const was = state.open;
      const direction = model.collapseDirection ?? "anchor";
      if (!["up", "anchor"].includes(direction)) throw new TypeError("Invalid drawer collapse direction");
      if (direction !== state.direction) {
        halt(state);
        settle(drawer);
      }
      state.direction = direction;
      state.open = Boolean(model.open);
      root.setAttribute("aria-label", String(model.label ?? "Side panel"));
      hold(drawer, model.collapseTo ?? null);
      if (state.anchor) writeOwner(state.anchor);
      if (state.open !== was) travel(drawer, was !== null);
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}

// ui/badge-flag.js
var CLASS6 = "cloudcanvas-ui-badge-flag";
var SIZE = /* @__PURE__ */ Object.freeze({ height: 20, top: 2, bottom: 18, hoist: 3, pad: 3, glyph: 6.5, notch: 4, min: 19 });
var DEPTH = /* @__PURE__ */ Object.freeze({ sheen: 0.26, under: 0.18, edge: 0.3, staff: 0.45, glint: 0.7, hoist: 0.25, fold: 0.18 });
function flagWidth(figure) {
  const { hoist, pad, glyph, notch, min } = SIZE;
  return Math.max(min, Math.ceil(hoist + pad * 2 + figure.length * glyph + notch));
}
function pennantPath(width) {
  const { top, bottom, hoist, notch } = SIZE;
  return `M${hoist} ${top}H${width - 1}Q${width} ${top} ${width - 0.5} ${top + 0.9}L${width - notch} ${(top + bottom) / 2}L${width - 0.5} ${bottom - 0.9}Q${width} ${bottom} ${width - 1} ${bottom}H${hoist}Z`;
}
function foldPath(width) {
  const { top, bottom, notch } = SIZE;
  return `M${width - notch} ${(top + bottom) / 2}L${width - 0.5} ${bottom - 0.9}Q${width} ${bottom} ${width - 1} ${bottom}H${width - notch - 2}Z`;
}
function sheenDefs(doc, id) {
  const gradient = svg(doc, "linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 });
  const stops2 = [[0, "lit", DEPTH.sheen], [0.55, "lit", 0], [0.55, "shaded", 0], [1, "shaded", DEPTH.under]];
  gradient.append(...stops2.map(([offset, light2, opacity]) => svg(doc, "stop", { class: `${CLASS6}-${light2}`, offset, "stop-opacity": opacity })));
  const defs = svg(doc, "defs");
  defs.append(gradient);
  return defs;
}
function staffParts(doc) {
  const { height, top, hoist } = SIZE;
  return {
    rod: [
      svg(doc, "rect", { class: `${CLASS6}-staff`, x: 1, y: 1, width: hoist - 1, height: height - 1, rx: 1 }),
      svg(doc, "rect", { class: `${CLASS6}-lit`, x: 1, y: top + 1, width: 1, height: height - top - 2, opacity: DEPTH.staff })
    ],
    finial: [
      svg(doc, "circle", { class: `${CLASS6}-staff`, cx: 2, cy: 2, r: 2 }),
      svg(doc, "circle", { class: `${CLASS6}-lit`, cx: 1.5, cy: 1.5, r: 0.8, opacity: DEPTH.glint })
    ]
  };
}
function clothParts(doc, id) {
  const { top, bottom, hoist } = SIZE;
  return {
    pennant: svg(doc, "path", { class: `${CLASS6}-pennant` }),
    sheen: svg(doc, "path", { fill: `url(#${id})` }),
    hoist: svg(doc, "rect", { class: `${CLASS6}-shaded`, x: hoist, y: top, width: 1, height: bottom - top, opacity: DEPTH.hoist }),
    fold: svg(doc, "path", { class: `${CLASS6}-shaded`, opacity: DEPTH.fold }),
    edge: svg(doc, "rect", { class: `${CLASS6}-lit`, x: hoist, y: top, height: 1, opacity: DEPTH.edge })
  };
}
function fit(node, cloth, figure, width) {
  const { height, hoist, notch } = SIZE;
  const outline = pennantPath(width);
  node.setAttribute("width", String(width));
  node.setAttribute("viewBox", `0 0 ${width} ${height}`);
  cloth.pennant.setAttribute("d", outline);
  cloth.sheen.setAttribute("d", outline);
  cloth.fold.setAttribute("d", foldPath(width));
  cloth.edge.setAttribute("width", String(width - hoist - 1));
  figure.setAttribute("x", String((hoist + width - notch) / 2));
}
function createFlag(doc) {
  const id = uniqueId(CLASS6);
  const node = svg(doc, "svg", { class: CLASS6, height: SIZE.height, "aria-hidden": "true", focusable: "false" });
  const staff = staffParts(doc);
  const cloth = clothParts(doc, id);
  const figure = svg(doc, "text", { class: `${CLASS6}-figure`, y: (SIZE.top + SIZE.bottom) / 2, dy: "0.35em" });
  const text2 = textNode(doc, figure);
  node.append(sheenDefs(doc, id), ...staff.rod, ...Object.values(cloth), ...staff.finial, figure);
  let drawn = 0;
  return {
    node,
    write(value) {
      const width = flagWidth(value);
      writeText(text2, value);
      if (width === drawn) return;
      drawn = width;
      fit(node, cloth, figure, width);
    }
  };
}

// ui/badge.js
var CLASS7 = "cloudcanvas-ui-badge";
var DEFAULT_MAX = 99;
var TONES = /* @__PURE__ */ new Set(["success", "warning", "danger"]);
function wholeCount(count) {
  const value = Number(count);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
}
function formatCount(count, max = DEFAULT_MAX) {
  const whole = wholeCount(count);
  if (whole === null) return "";
  const limit = Number(max);
  const cap = Number.isFinite(limit) && limit >= 1 ? Math.floor(limit) : DEFAULT_MAX;
  return whole > cap ? `${cap}+` : String(whole);
}
function countLabel(label, count) {
  if (typeof label === "function") return String(label(count) ?? "");
  if (typeof label === "string" && label !== "") return label.replaceAll("{count}", String(count));
  return String(count);
}
function badgeModel(badge) {
  if (typeof badge === "number") return { count: badge };
  return badge && typeof badge === "object" ? badge : {};
}
function syncBadge(handle, host, badge) {
  if (badge === void 0 || badge === null) {
    handle?.destroy();
    return null;
  }
  const kept = handle ?? createBadge(host);
  kept.update(badgeModel(badge));
  return kept;
}
function badgeNodes(doc) {
  const root = el(doc, "span", { className: CLASS7, attrs: { hidden: true } });
  const figure = el(doc, "span", { className: `${CLASS7}-figure`, attrs: { "aria-hidden": "true" } });
  const spoken = el(doc, "span", { className: SR_ONLY_CLASS });
  root.append(figure, spoken);
  return { root, figure, figureText: textNode(doc, figure), spoken: textNode(doc, spoken), flag: null };
}
function writeShape(nodes, flagged, figure) {
  writeText(nodes.figureText, flagged ? "" : figure);
  if (!flagged) {
    nodes.root.removeAttribute("data-shape");
    nodes.flag?.node.remove();
    return;
  }
  nodes.root.setAttribute("data-shape", "flag");
  nodes.flag ??= createFlag(nodes.root.ownerDocument);
  nodes.flag.write(figure);
  if (nodes.flag.node.parentNode !== nodes.figure) nodes.figure.append(nodes.flag.node);
}
function writeLive(root, live) {
  if (live) {
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");
  } else {
    root.removeAttribute("role");
    root.removeAttribute("aria-live");
  }
}
function writeBadge(nodes, model) {
  const count = wholeCount(model.count) ?? 0;
  const shown = count > 0 || model.showZero === true;
  const dot = model.dot === true;
  nodes.root.hidden = !shown;
  nodes.root.classList.toggle("is-dot", dot);
  if (TONES.has(model.tone)) nodes.root.setAttribute("data-tone", model.tone);
  else nodes.root.removeAttribute("data-tone");
  writeShape(nodes, model.shape === "flag", dot ? "" : formatCount(count, model.max));
  writeText(nodes.spoken, shown ? countLabel(model.label, count) : "");
}
function createBadge(host) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const nodes = badgeNodes(doc);
  host.append(nodes.root);
  return {
    update(model = {}) {
      if (life.dead) return;
      writeLive(nodes.root, model.live === true);
      writeBadge(nodes, model);
    },
    destroy() {
      if (life.destroy()) nodes.root.remove();
    }
  };
}

// ui/icons.js
var PATHS = /* @__PURE__ */ Object.freeze({
  back: ["m12 19-7-7 7-7", "M19 12H5"],
  check: ["M20 6 9 17l-5-5"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  empty: ["M22 12h-6l-2 3h-4l-2-3H2", "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"],
  error: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z", "M12 8v4", "M12 16h.01"],
  info: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z", "M12 16v-4", "M12 8h.01"],
  loading: ["M21 12a9 9 0 1 1-6.219-8.56"],
  locked: ["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z", "M7 11V7a5 5 0 0 1 10 0v4"],
  more: ["M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", "M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", "M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
  open: ["M7 7h10v10", "M7 17 17 7"],
  plus: ["M12 5v14", "M5 12h14"],
  search: ["M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z", "m21 21-4.34-4.34"]
});
var ICON_NAMES = /* @__PURE__ */ Object.freeze(Object.keys(PATHS));
var ICON_CLASS = "cloudcanvas-ui-icon";
function createIcon(doc, name) {
  const paths = PATHS[name];
  if (!Object.hasOwn(PATHS, name)) throw new TypeError(`The kit has no icon named ${String(name)}`);
  const icon = svg(doc, "svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 1.7,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    focusable: "false",
    class: ICON_CLASS,
    "data-icon": name
  });
  for (const d of paths) icon.append(svg(doc, "path", { d }));
  return icon;
}
var SHOWN = /* @__PURE__ */ new WeakMap();
function iconSlot(doc, className) {
  return el(doc, "span", { className, attrs: { "aria-hidden": "true", hidden: true } });
}
function writeIcon(slot, source) {
  const next = source === void 0 || source === "" ? null : source;
  if (next === (SHOWN.get(slot) ?? null)) return;
  if (next !== null && typeof next !== "string" && typeof next !== "object") throw new TypeError("An icon is a kit icon name or an element");
  const node = typeof next === "string" ? createIcon(slot.ownerDocument, next) : next;
  if (node) slot.replaceChildren(node);
  else slot.replaceChildren();
  SHOWN.set(slot, next);
  slot.hidden = node === null;
}

// ui/menu/panel.js
var MENU_CLASS = "cloudcanvas-ui-menu";
var MENU_ITEM = '[role="menuitem"]';
function isParent(item) {
  return Array.isArray(item?.items) && item.items.length > 0;
}
function menuItems(items) {
  const nested = uniqueItems(items, "menu").flatMap((item) => item.items ?? []);
  if (nested.some(isParent)) throw new TypeError("A menu has one level of submenu: an item inside one cannot have items of its own");
  uniqueItems([...items, ...nested], "menu");
  return items;
}
function rowsOf(items) {
  return items.flatMap((item, index) => {
    const row = { key: `item:${item.id}`, item };
    return item.separatorBefore === true && index > 0 ? [{ key: `separator:${item.id}`, item: null }, row] : [row];
  });
}
function buildRow(doc, row) {
  if (!row.item) return { node: el(doc, "div", { className: `${MENU_CLASS}-separator`, attrs: { role: "separator" } }) };
  const node = el(doc, "button", {
    className: `${MENU_CLASS}-item`,
    attrs: { type: "button", role: "menuitem", tabindex: "-1", "data-ui-id": row.item.id }
  });
  const slot = iconSlot(doc, `${MENU_CLASS}-icon`);
  const label = el(doc, "span", { className: `${MENU_CLASS}-label` });
  node.append(slot, label);
  return { node, slot, text: textNode(doc, label) };
}
function writeParent(node, parent) {
  if (!parent) {
    for (const name of ["aria-haspopup", "aria-expanded", "aria-controls"]) node.removeAttribute(name);
    return;
  }
  node.setAttribute("aria-haspopup", "menu");
  if (!node.hasAttribute("aria-expanded")) node.setAttribute("aria-expanded", "false");
}
function writeRow(entry, { item }) {
  if (!item) return;
  writeText(entry.text, item.label ?? item.id);
  writeIcon(entry.slot, item.icon);
  if (item.title) entry.node.setAttribute("title", String(item.title));
  else entry.node.removeAttribute("title");
  entry.node.disabled = item.disabled === true;
  if (item.danger === true) entry.node.setAttribute("data-tone", "danger");
  else entry.node.removeAttribute("data-tone");
  writeParent(entry.node, isParent(item));
}
function createPanel(doc, className) {
  const node = el(doc, "div", { className, attrs: { id: uniqueId(MENU_CLASS), role: "menu", tabindex: "-1" } });
  const rows = rowCache({ key: (row) => row.key, create: (row) => buildRow(doc, row), update: writeRow });
  return {
    node,
    draw(label, items) {
      node.setAttribute("aria-label", String(label));
      placeChildren(node, rows.sync(rowsOf(items)));
    },
    item: (id) => rows.get(`item:${id}`)?.node ?? null,
    reachable: () => [...node.querySelectorAll(MENU_ITEM)].filter((item) => !item.disabled)
  };
}

// ui/menu/place.js
var EDGE = 8;
function fit2(value, near, far) {
  return Math.max(near, Math.min(value, far));
}
function measure(panel) {
  const view = panel.ownerDocument.defaultView;
  if (!view) return null;
  const room = visualBox(view);
  panel.style.maxWidth = `${room.width - 2 * EDGE}px`;
  panel.style.maxHeight = `${room.height - 2 * EDGE}px`;
  panel.style.left = "0px";
  panel.style.top = "0px";
  return { room, at: panel.getBoundingClientRect() };
}
function put(panel, { room, at }, x, y) {
  const left = fit2(x, room.left + EDGE, room.left + room.width - at.width - EDGE);
  const top = fit2(y, room.top + EDGE, room.top + room.height - at.height - EDGE);
  panel.style.left = `${left - at.left}px`;
  panel.style.top = `${top - at.top}px`;
}
function placeAt(panel, point, anchor) {
  const measured = measure(panel);
  if (!measured) return;
  if (Number.isFinite(point?.x) && Number.isFinite(point?.y)) {
    put(panel, measured, point.x, point.y);
    return;
  }
  const under = anchor?.isConnected ? anchor.getBoundingClientRect() : null;
  put(panel, measured, under?.left ?? 0, under?.bottom ?? 0);
}
function placeBeside(panel, item) {
  const measured = measure(panel);
  if (!measured) return;
  const { room, at } = measured;
  const beside = item.getBoundingClientRect();
  const fitsAfter = beside.right + at.width <= room.left + room.width - EDGE;
  const fitsBefore = beside.left - at.width >= room.left + EDGE;
  put(panel, measured, fitsAfter || !fitsBefore ? beside.right : beside.left - at.width, beside.top);
}

// ui/menu.js
function menuNodes(doc) {
  const panel = createPanel(doc, `${MENU_CLASS}-panel`);
  const root = el(doc, "div", { className: MENU_CLASS, attrs: { hidden: true, role: "region", "aria-labelledby": panel.node.id, "data-cc-control": true } });
  const flyout = createPanel(doc, `${MENU_CLASS}-panel is-submenu`);
  flyout.node.hidden = true;
  root.append(panel.node, flyout.node);
  return { root, panel, flyout };
}
function usable(node) {
  return Boolean(node?.isConnected) && node.disabled !== true && !node.closest("[hidden]");
}
function giveFocus(node) {
  node?.focus({ preventScroll: true });
}
function opensSub(node) {
  return node?.getAttribute("aria-haspopup") === "menu";
}
function enter(panel) {
  giveFocus(panel.reachable()[0] ?? panel.node);
}
function origin(state) {
  return [state.anchor, state.previous].find((node) => node?.isConnected && typeof node.focus === "function") ?? null;
}
function shutSub({ nodes, state }) {
  const parent = nodes.panel.item(state.sub);
  state.sub = null;
  nodes.flyout.node.hidden = true;
  parent?.setAttribute("aria-expanded", "false");
  return parent;
}
function closeSub(menu) {
  const held = menu.nodes.flyout.node.contains(menu.doc.activeElement);
  const parent = shutSub(menu);
  if (held) giveFocus(parent);
}
function drawSub({ nodes, state }) {
  const item = state.items.find((entry) => entry.id === state.sub);
  const parent = nodes.panel.item(item.id);
  nodes.flyout.draw(item.label ?? item.id, item.items);
  nodes.flyout.node.hidden = false;
  parent.setAttribute("aria-expanded", "true");
  parent.setAttribute("aria-controls", nodes.flyout.node.id);
  placeBeside(nodes.flyout.node, parent);
}
function openSub(menu, id) {
  if (menu.state.sub !== null) shutSub(menu);
  menu.state.sub = id;
  drawSub(menu);
  enter(menu.nodes.flyout);
}
function hide3(menu) {
  const { doc, nodes, state } = menu;
  const held = nodes.root.contains(doc.activeElement);
  const back = origin(state);
  if (state.sub !== null) shutSub(menu);
  state.opening.destroy();
  Object.assign(state, { open: false, opening: null, anchor: null, previous: null });
  nodes.root.hidden = true;
  if (held) giveFocus(back);
}
function close(menu, reason, chosen) {
  hide3(menu);
  menu.callbacks.onClose?.(reason);
  if (chosen !== void 0) menu.callbacks.onSelect?.(chosen);
}
function show4(menu) {
  const { doc, nodes, state } = menu;
  const previous = doc.activeElement === doc.body ? null : doc.activeElement;
  Object.assign(state, { open: true, previous, opening: createLife() });
  nodes.root.hidden = false;
  state.opening.on(doc, "pointerdown", (event) => {
    if (!nodes.root.contains(event.target)) close(menu, "outside");
  }, { capture: true });
}
function refocus(menu, held) {
  const { doc, nodes, state } = menu;
  if (!held) return;
  if (usable(held) && keepFocus(nodes.root, held)) return;
  if (nodes.root.contains(doc.activeElement) && usable(doc.activeElement)) return;
  enter(state.sub === null ? nodes.panel : nodes.flyout);
}
function draw(menu, model, items) {
  const { doc, nodes, state } = menu;
  const opening = !state.open;
  if (opening) show4(menu);
  const parent = items.find((item) => item.id === state.sub);
  if (state.sub !== null && !(isParent(parent) && parent.disabled !== true)) closeSub(menu);
  const held = nodes.root.contains(doc.activeElement) ? doc.activeElement : null;
  state.items = items;
  state.anchor = model.anchor ?? null;
  nodes.panel.draw(model.label ?? "Menu", items);
  placeAt(nodes.panel.node, model.at, origin(state));
  if (state.sub !== null) drawSub(menu);
  if (opening) enter(nodes.panel);
  else refocus(menu, held);
}
function activate(menu, node) {
  const id = node.getAttribute("data-ui-id");
  if (!opensSub(node)) close(menu, "select", id);
  else if (menu.state.sub === id) closeSub(menu);
  else openSub(menu, id);
}
function move2(panel, from, key) {
  const items = panel.reachable();
  const to = nextIndex(key, items.indexOf(from), items.length, { orientation: "vertical", wrap: true });
  if (to === null) return false;
  giveFocus(items[to]);
  return true;
}
function itemOf(event) {
  const item = event.target.closest?.(MENU_ITEM) ?? null;
  return item && !item.disabled ? item : null;
}
function onKey(menu, event) {
  const { panel, flyout } = menu.nodes;
  const { key } = event;
  const inSub = flyout.node.contains(event.target);
  const item = itemOf(event);
  if (key === "Tab") close(menu, "tab");
  else if (inSub && (key === "Escape" || key === "ArrowLeft")) closeSub(menu);
  else if (key === "Escape") close(menu, "escape");
  else if (key === "ArrowRight" && opensSub(item)) openSub(menu, item.getAttribute("data-ui-id"));
  else if (item && (key === "Enter" || key === " ")) activate(menu, item);
  else return move2(inSub ? flyout : panel, item, key);
  return true;
}
function bindMenu(life, menu) {
  const { nodes, state } = menu;
  life.on(nodes.root, "keydown", (event) => {
    if (!state.open || !onKey(menu, event)) return;
    event.preventDefault();
    event.stopPropagation();
  });
  life.on(nodes.root, "click", (event) => {
    const item = itemOf(event);
    if (state.open && item) activate(menu, item);
  });
  life.on(nodes.root, "pointerover", (event) => {
    const item = itemOf(event);
    if (!state.open || !item || state.sub !== null && nodes.panel.node.contains(item)) return;
    giveFocus(item);
  });
}
function createMenu(host, { onSelect, onClose } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const nodes = menuNodes(doc);
  host.append(nodes.root);
  const state = { open: false, items: [], sub: null, anchor: null, previous: null, opening: null };
  const menu = { doc, nodes, state, callbacks: { onSelect, onClose } };
  bindMenu(life, menu);
  return {
    update(model = {}) {
      if (life.dead) return;
      const items = model.open ? menuItems(model.items ?? []) : [];
      if (items.length > 0) draw(menu, model, items);
      else if (state.open) close(menu, "update");
    },
    destroy() {
      if (life.dead) return;
      if (state.open) hide3(menu);
      life.destroy();
      nodes.root.remove();
    }
  };
}

// ui/tabs-layers.js
var CLASS8 = "cloudcanvas-ui-tabs";
var MAX_LAYERS = 3;
function layersOf(item) {
  return uniqueItems(item.layers ?? [], "tab layer");
}
function split(layers) {
  if (layers.length <= MAX_LAYERS) return { folded: [], shown: layers };
  return { folded: layers.slice(0, 1 - MAX_LAYERS), shown: layers.slice(1 - MAX_LAYERS) };
}
var labelOf = (layer) => String(layer.label ?? layer.id);
function layerButton(doc, className, attrs) {
  const node = el(doc, "button", { className, attrs: { type: "button", ...attrs } });
  const face = el(doc, "span", { className: `${CLASS8}-layer-face` });
  node.append(face);
  return { node, text: textNode(doc, face) };
}
function writeLayer(entry, layer) {
  writeText(entry.text, labelOf(layer));
  entry.node.setAttribute("aria-label", `Up to ${labelOf(layer)}`);
  entry.node.title = labelOf(layer);
}
function layersView(doc, tabId) {
  const group = el(doc, "div", { className: `${CLASS8}-layers`, attrs: { role: "group", "data-ui-layers": tabId } });
  const fold = layerButton(doc, `${CLASS8}-layer is-fold`, { "data-ui-fold": tabId, "aria-haspopup": "menu", "aria-expanded": "false" });
  writeText(fold.text, "…");
  const rows = rowCache({ create: (layer) => layerButton(doc, `${CLASS8}-layer`, { "data-ui-layer": layer.id }), update: writeLayer });
  return { group, fold: fold.node, rows };
}
function writeLayers(doc, view, item, active) {
  const { folded, shown } = split(item.layers ?? []);
  if (shown.length === 0) {
    view.layers?.group.remove();
    view.layers = null;
    return;
  }
  view.layers ??= layersView(doc, item.id);
  const { group, fold, rows } = view.layers;
  group.setAttribute("aria-label", `Parent scopes of ${String(item.label)}`);
  fold.setAttribute("aria-label", `${folded.length} more parent scopes`);
  const nodes = folded.length > 0 ? [fold, ...rows.sync(shown)] : rows.sync(shown);
  placeChildren(group, nodes);
  nodes.forEach((node, index) => {
    node.setAttribute("data-depth", String(nodes.length - index));
    node.setAttribute("tabindex", active ? "0" : "-1");
    node.disabled = item.disabled === true;
  });
  if (group.parentNode !== view.row) view.row.insertBefore(group, view.tab);
}
function foldButton(fold) {
  return fold.views.get(fold.tabId)?.layers?.fold ?? null;
}
function settle2(fold, open) {
  fold.open = open;
  foldButton(fold)?.setAttribute("aria-expanded", String(open));
}
function forgetPress(fold) {
  fold.shut?.life.destroy();
  fold.shut = null;
}
function rememberPress(fold) {
  forgetPress(fold);
  fold.shut = { tabId: fold.tabId, life: createLife() };
  const doc = fold.host.ownerDocument;
  fold.shut.life.on(doc, "pointerdown", () => forgetPress(fold), { capture: true });
  fold.shut.life.on(doc, "click", () => forgetPress(fold));
}
function mountMenu(fold) {
  fold.mount = el(fold.host.ownerDocument, "div", { className: `${CLASS8}-menu` });
  fold.host.append(fold.mount);
  fold.menu = createMenu(fold.mount, {
    onClose(reason) {
      settle2(fold, false);
      if (reason === "outside") rememberPress(fold);
    },
    // A close leaves `tabId` where it is: the choice the menu reports right after is for that tab.
    onSelect: (layerId) => fold.callbacks.onLayer?.(fold.tabId, layerId)
  });
}
function syncFold(fold, items) {
  if (!fold.open) return;
  const item = items.find((entry) => entry.id === fold.tabId);
  const folded = item && item.disabled !== true ? split(item.layers ?? []).folded : [];
  if (folded.length === 0) {
    fold.menu.update({ open: false });
    return;
  }
  settle2(fold, true);
  fold.menu.update({
    open: true,
    label: `More parent scopes of ${String(item.label)}`,
    anchor: foldButton(fold),
    items: folded.map((layer) => ({ id: layer.id, label: labelOf(layer) }))
  });
}
function pressFold(fold, tabId, items) {
  if (fold.shut?.tabId === tabId) return;
  const shut = fold.open && fold.tabId === tabId;
  if (fold.open) fold.menu.update({ open: false });
  if (shut) return;
  if (!fold.menu) mountMenu(fold);
  Object.assign(fold, { tabId, open: true });
  syncFold(fold, items);
}
function createFold(host, views, callbacks) {
  const fold = { host, views, callbacks, mount: null, menu: null, tabId: null, open: false, shut: null };
  return {
    get open() {
      return fold.open;
    },
    holds: (node) => Boolean(node) && fold.mount?.contains(node) === true,
    button: () => foldButton(fold),
    press: (tabId, items) => pressFold(fold, tabId, items),
    sync: (items) => syncFold(fold, items),
    destroy() {
      forgetPress(fold);
      fold.menu?.destroy();
      fold.mount?.remove();
    }
  };
}

// ui/tabs-reorder.js
var CLASS9 = "cloudcanvas-ui-tabs";
var ROW = `.${CLASS9}-item`;
var SIDES = /* @__PURE__ */ Object.freeze({ ArrowLeft: -1, ArrowRight: 1 });
function landingOf(items, id, wanted) {
  const from = items.findIndex((item) => item.id === id);
  if (from === -1 || items[from].pinned === true) return void 0;
  let at = Math.max(0, Math.min(wanted, items.length));
  while (at < items.length && items[at].pinned === true) at += 1;
  if (at === from || at === from + 1) return void 0;
  return at < items.length ? items[at].id : null;
}
function placeBeside2(items, from, side) {
  if (side > 0) return from + 2;
  for (let at = from - 1; at >= 0; at -= 1) if (items[at].pinned !== true) return at;
  return from;
}
function placeAt2(root, x) {
  const rows = Array.from(root.querySelectorAll(ROW));
  const ahead = rows.findIndex((row) => {
    const box = row.getBoundingClientRect();
    return x < box.left + box.width / 2;
  });
  return ahead === -1 ? rows.length : ahead;
}
function unmark(root) {
  for (const row of root.querySelectorAll("[data-drop]")) row.removeAttribute("data-drop");
}
function mark(root, state, id, x) {
  unmark(root);
  const before = landingOf(state.items, id, placeAt2(root, x));
  if (before === void 0) return;
  const rows = Array.from(root.querySelectorAll(ROW));
  const row = before === null ? rows.at(-1) : rows[state.items.findIndex((item) => item.id === before)];
  row?.setAttribute("data-drop", before === null ? "after" : "before");
}
function bindDrag(life, root, state, onReorder) {
  let held = null;
  const end3 = (point) => {
    const { id, row } = held;
    held = null;
    row.classList.remove("is-dragging");
    unmark(root);
    const before = point ? landingOf(state.items, id, placeAt2(root, point.x)) : void 0;
    if (before !== void 0) onReorder(id, before);
  };
  trackDrag(life, root, {
    selector: '[role="tab"]',
    canStart: (tab) => !tab.disabled && tab.getAttribute("data-pinned") !== "true",
    onStart(tab) {
      held = { id: tab.getAttribute("data-ui-id"), row: tab.closest(ROW) };
      held.row.classList.add("is-dragging");
    },
    onMove: (point) => mark(root, state, held.id, point.x),
    onEnd: end3
  });
}
function createReorder(life, root, state, callbacks) {
  const onReorder = callbacks.onReorder;
  if (typeof onReorder !== "function") return { key: () => false };
  root.setAttribute("data-reorder", "true");
  bindDrag(life, root, state, onReorder);
  return {
    key(event, id) {
      const side = event.altKey ? SIDES[event.key] : void 0;
      if (side === void 0) return false;
      const from = state.items.findIndex((item) => item.id === id);
      const before = from === -1 ? void 0 : landingOf(state.items, id, placeBeside2(state.items, from, side));
      if (before !== void 0) onReorder(id, before);
      return true;
    }
  };
}

// ui/tabs-reveal.js
function shownAs(state) {
  const item = state.items.find((entry) => entry.id === state.activeId);
  return item ? JSON.stringify([item.id, ...(item.layers ?? []).map((layer) => layer.id)]) : null;
}
function shift(start3, end3, width) {
  if (start3 >= 0 && end3 <= width) return 0;
  return start3 < 0 || end3 - start3 > width ? start3 : end3 - width;
}
function shiftFor(root, view) {
  const edge = root.getBoundingClientRect().left;
  const width = root.clientWidth;
  const end3 = view.row.getBoundingClientRect().right - edge;
  const tab = view.tab.getBoundingClientRect().left - edge;
  const nearest = view.layers?.group.lastElementChild ?? null;
  const layer = nearest ? nearest.getBoundingClientRect().left - edge : tab;
  return shift(end3 - layer <= width ? layer : tab, end3, width);
}
function createReveal(root, views) {
  let shown;
  let eases = false;
  return {
    sync(state) {
      const next = shownAs(state);
      if (next === shown) return;
      const view = views.get(state.activeId);
      if (view && root.clientWidth <= 0) return;
      shown = next;
      if (!view) return;
      const by = shiftFor(root, view);
      if (by !== 0) root.scrollTo({ left: root.scrollLeft + by, behavior: eases && !prefersReducedMotion() ? "smooth" : "instant" });
      eases = true;
    }
  };
}

// ui/tabs.js
var CLASS10 = "cloudcanvas-ui-tabs";
var FACES = /* @__PURE__ */ Object.freeze(["line", "folder"]);
function faceOf(face) {
  const asked = face ?? FACES[0];
  if (!FACES.includes(asked)) throw new TypeError(`A tab strip's face is 'line' or 'folder', not ${String(asked)}`);
  return asked;
}
function tabView(doc) {
  const row = el(doc, "div", { className: `${CLASS10}-item`, attrs: { role: "presentation" } });
  const tab = el(doc, "button", { className: `${CLASS10}-tab`, attrs: { id: uniqueId("ui-tab"), role: "tab", type: "button" } });
  const name = el(doc, "span", { className: `${CLASS10}-label` });
  tab.append(name);
  const close3 = el(doc, "button", { className: `${CLASS10}-close`, text: "×", attrs: { type: "button", tabindex: "-1" } });
  row.append(tab, close3);
  return { row, tab, name, label: textNode(doc, name), close: close3, icon: null, badge: null, layers: null };
}
function writeTabIcon(doc, view, source) {
  if (source === void 0 || source === null || source === "") {
    view.icon?.remove();
    return;
  }
  view.icon ??= iconSlot(doc, `${CLASS10}-icon`);
  writeIcon(view.icon, source);
  if (view.icon.parentNode !== view.tab) view.tab.prepend(view.icon);
}
function closes(item) {
  return item?.closable === true && item.pinned !== true;
}
function writeClose(view, item, closeLabel) {
  view.close.setAttribute("data-ui-close", item.id);
  view.close.setAttribute("data-ui-for", item.id);
  view.close.setAttribute("aria-label", `${closeLabel} ${String(item.label)}`);
  view.close.hidden = !closes(item);
  view.row.classList.toggle("is-closable", closes(item));
  if (item.pinned === true) view.close.remove();
  else if (view.close.parentNode !== view.row) view.row.append(view.close);
}
function writeBadge2(view, badge) {
  view.badge = syncBadge(view.badge, view.tab, badge);
  view.tab.classList.toggle("is-badged", view.badge !== null);
}
function writeTitle(node, text2) {
  if (text2 === null) node.removeAttribute("title");
  else node.title = text2;
}
function writeLabel(view, item) {
  const whole = String(item.label ?? "");
  writeText(view.label, whole);
  writeTitle(view.tab, view.badge === null ? whole : null);
  writeTitle(view.name, view.badge === null ? null : whole);
}
function writeTab(doc, view, item, state) {
  const active = item.id === state.activeId;
  view.tab.setAttribute("data-ui-id", item.id);
  view.tab.setAttribute("aria-selected", String(active));
  view.row.classList.toggle("is-active", active);
  if (item.panelId) view.tab.setAttribute("aria-controls", String(item.panelId));
  else view.tab.removeAttribute("aria-controls");
  if (item.pinned === true) view.tab.setAttribute("data-pinned", "true");
  else view.tab.removeAttribute("data-pinned");
  view.tab.disabled = item.disabled === true;
  writeTabIcon(doc, view, item.icon);
  writeBadge2(view, item.badge);
  writeLabel(view, item);
  writeClose(view, item, state.closeLabel);
  writeLayers(doc, view, item, active);
}
function dropTab(views, id) {
  const view = views.get(id);
  view.badge?.destroy();
  view.row.remove();
  views.delete(id);
}
function selectable(state) {
  return state.items.filter((item) => item.disabled !== true);
}
function restingId(state) {
  const active = state.items.find((item) => item.id === state.activeId);
  return (active ?? selectable(state)[0] ?? state.items[0])?.id ?? null;
}
function render(root, doc, views, state) {
  const keep = new Set(state.items.map((item) => item.id));
  for (const id of [...views.keys()]) if (!keep.has(id)) dropTab(views, id);
  if (state.items.some((item) => (item.layers ?? []).length > 0)) root.setAttribute("data-layered", "true");
  else root.removeAttribute("data-layered");
  placeChildren(root, state.items.map((item) => {
    if (!views.has(item.id)) views.set(item.id, tabView(doc));
    const view = views.get(item.id);
    writeTab(doc, view, item, state);
    return view.row;
  }));
  if (!views.has(state.focusId)) state.focusId = restingId(state);
  setTabStop([...views.values()].map((view) => view.tab), views.get(state.focusId)?.tab ?? null);
}
function heldBefore(root, doc, fold) {
  const active = doc.activeElement;
  const inMenu = fold.holds(active);
  const inStrip = root.contains(active) ? active : null;
  const node = inMenu ? fold.button() : inStrip;
  const beside = node?.closest(`.${CLASS10}-item`)?.querySelector('[role="tab"]') ?? null;
  return { node, inMenu, tabId: beside?.getAttribute("data-ui-id") ?? null };
}
function restoreFocus(root, views, state, fold, held) {
  if (!held.node || held.inMenu && fold.open) return;
  if (root.contains(held.node)) {
    keepFocus(root, held.node);
    return;
  }
  const beside = views.get(held.tabId)?.tab;
  if (beside && !beside.disabled) {
    state.focusId = held.tabId;
    setTabStop([...views.values()].map((view) => view.tab), beside);
  }
  views.get(state.focusId)?.tab.focus();
}
function ownTabs(list2, views, state, label) {
  const ids = state.items.map((item) => views.get(item.id).tab.id);
  list2.setAttribute("aria-label", label);
  list2.setAttribute("aria-orientation", "horizontal");
  list2.hidden = ids.length === 0;
  if (ids.length) list2.setAttribute("aria-owns", ids.join(" "));
  else list2.removeAttribute("aria-owns");
}
function onKey2(event, views, state, reorder, callbacks) {
  const tab = event.target.closest?.('[role="tab"]');
  if (!tab) return;
  const id = tab.getAttribute("data-ui-id");
  if (reorder.key(event, id)) {
    event.preventDefault();
    return;
  }
  const items = selectable(state);
  const item = state.items.find((entry) => entry.id === id);
  if (event.key === "Delete" && closes(item)) {
    event.preventDefault();
    callbacks.onClose?.(id);
    return;
  }
  if ((event.key === "Enter" || event.key === " ") && item?.disabled !== true) {
    event.preventDefault();
    if (id !== state.activeId) callbacks.onSelect?.(id);
    return;
  }
  const to = nextIndex(
    event.key,
    items.findIndex((entry) => entry.id === id),
    items.length,
    { orientation: "horizontal", wrap: true }
  );
  if (to === null) return;
  event.preventDefault();
  state.focusId = items[to].id;
  setTabStop([...views.values()].map((view) => view.tab), views.get(state.focusId).tab);
  views.get(state.focusId).tab.focus();
  if (state.activation === "auto" && state.focusId !== state.activeId) callbacks.onSelect?.(state.focusId);
}
function onPress(event, state, fold, callbacks) {
  const hit = (selector) => event.target.closest?.(selector) ?? null;
  const close3 = hit("[data-ui-close]");
  const layer = hit("[data-ui-layer]");
  const folded = hit("[data-ui-fold]");
  const tab = hit('[role="tab"]');
  const id = tab?.getAttribute("data-ui-id");
  if (close3 && !close3.hidden) callbacks.onClose?.(close3.getAttribute("data-ui-close"));
  else if (layer) callbacks.onLayer?.(layer.parentElement.getAttribute("data-ui-layers"), layer.getAttribute("data-ui-layer"));
  else if (folded) fold.press(folded.getAttribute("data-ui-fold"), state.items);
  else if (id && !tab.disabled && id !== state.activeId) callbacks.onSelect?.(id);
}
function bindTabs(life, root, views, state, fold, callbacks) {
  const reorder = createReorder(life, root, state, callbacks);
  life.on(root, "click", (event) => onPress(event, state, fold, callbacks));
  life.on(root, "keydown", (event) => onKey2(event, views, state, reorder, callbacks));
}
function checkedIcon({ icon }) {
  const known = icon === void 0 || icon === null || icon === "" || typeof icon === "object" || ICON_NAMES.includes(icon);
  if (!known) throw new TypeError(typeof icon === "string" ? `The kit has no icon named ${icon}` : "A tab's icon is a kit icon name or an element");
}
function tabItems(items) {
  for (const item of uniqueItems(items, "tab")) {
    layersOf(item);
    checkedIcon(item);
  }
  return items;
}
function createTabs(host, callbacks = {}) {
  const doc = documentOf(host);
  const face = faceOf(callbacks.face);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS10, attrs: { "data-face": face } });
  const list2 = el(doc, "div", { className: SR_ONLY_CLASS, attrs: { role: "tablist", hidden: true } });
  host.append(list2, root);
  const views = /* @__PURE__ */ new Map();
  const state = { items: [], activeId: null, focusId: null, activation: "auto", closeLabel: "Close" };
  const fold = createFold(host, views, callbacks);
  const reveal3 = createReveal(root, views);
  bindTabs(life, root, views, state, fold, callbacks);
  return {
    update(model = {}) {
      if (life.dead) return;
      state.items = tabItems(model.items ?? []);
      if (state.activeId !== (model.activeId ?? null)) state.focusId = model.activeId ?? null;
      state.activeId = model.activeId ?? null;
      state.activation = model.activation === "manual" ? "manual" : "auto";
      state.closeLabel = String(model.closeLabel ?? "Close");
      const held = heldBefore(root, doc, fold);
      render(root, doc, views, state);
      fold.sync(state.items);
      restoreFocus(root, views, state, fold, held);
      ownTabs(list2, views, state, String(model.label ?? "Tabs"));
      reveal3.sync(state);
    },
    destroy() {
      if (!life.destroy()) return;
      fold.destroy();
      for (const view of views.values()) view.badge?.destroy();
      views.clear();
      root.remove();
      list2.remove();
    }
  };
}

// ui/popover/place.js
var EDGE2 = 8;
var GAP = 4;
var MIN_USABLE = 80;
function rectOf(source) {
  const box = typeof source?.getBoundingClientRect === "function" ? source.getBoundingClientRect() : source;
  if (!box || typeof box !== "object") return null;
  const left = Number.isFinite(box.left) ? box.left : box.x;
  const top = Number.isFinite(box.top) ? box.top : box.y;
  const right = Number.isFinite(box.right) ? box.right : left + box.width;
  const bottom = Number.isFinite(box.bottom) ? box.bottom : top + box.height;
  if (![left, top, right, bottom].every(Number.isFinite) || right <= left || bottom <= top) return null;
  return { left, top, right, bottom };
}
function avoidRects(avoid) {
  return [avoid].flat().map(rectOf).filter(Boolean);
}
var overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
var inColumns = (avoid, left, right) => avoid.filter((rect) => rect.left < right && left < rect.right);
function passed(line, { down, height, avoid }) {
  const nearest = [...avoid].sort((a, b) => down ? a.top - b.top : b.bottom - a.bottom);
  return nearest.reduce((edge, rect) => {
    const covered = down ? rect.bottom > edge && rect.top < edge + height : rect.top < edge && rect.bottom > edge - height;
    if (!covered) return edge;
    return down ? rect.bottom + GAP : rect.top - GAP;
  }, line);
}
function candidate(side, { anchor, size, inner, avoid }, past = false) {
  const width = Math.min(size.width, inner.right - inner.left);
  const left = clamp(anchor.left, inner.left, inner.right - width);
  const down = side === "bottom";
  const line = down ? anchor.bottom + GAP : anchor.top - GAP;
  const edge = past ? passed(line, { down, height: size.height, avoid: inColumns(avoid, left, left + width) }) : line;
  const near = down ? Math.max(edge, inner.top) : Math.min(edge, inner.bottom);
  const space = Math.max(0, down ? inner.bottom - near : near - inner.top);
  const height = Math.min(size.height, space);
  const top = down ? Math.min(near, inner.bottom - height) : near - height;
  const box = { left, top, right: left + width, bottom: top + height };
  return { side, left, top, width, height, maxWidth: inner.right - inner.left, maxHeight: space, space, fits: size.height <= space, clear: !avoid.some((rect) => overlaps(box, rect)) };
}
var roomiest = (candidates) => candidates.reduce((best, next) => next.space > (best?.space ?? -1) ? next : best, null);
var wellPlaced = (places) => places.find((place2) => place2.clear && place2.fits) ?? roomiest(places.filter((place2) => place2.clear && place2.space >= MIN_USABLE));
function choosePlace({ anchor, size, room, avoid = [], prefer = "bottom" }) {
  const inner = { left: room.left + EDGE2, top: room.top + EDGE2, right: room.left + room.width - EDGE2, bottom: room.top + room.height - EDGE2 };
  const sides = prefer === "top" ? ["top", "bottom"] : ["bottom", "top"];
  const context = { anchor, size, inner, avoid };
  const options = sides.map((side) => candidate(side, context));
  const beyond = avoid.length > 0 ? sides.map((side) => candidate(side, context, true)) : [];
  return wellPlaced(options) ?? wellPlaced(beyond) ?? options.find((option) => option.fits) ?? roomiest(options);
}
function placePopover(root, anchor, { avoid, prefer = "bottom" } = {}) {
  const view = root.ownerDocument.defaultView;
  if (!view) return null;
  const room = visualBox(view);
  root.style.maxWidth = `${Math.max(0, room.width - 2 * EDGE2)}px`;
  root.style.maxHeight = `${Math.max(0, room.height - 2 * EDGE2)}px`;
  root.style.left = "0px";
  root.style.top = "0px";
  const origin2 = root.getBoundingClientRect();
  const beside = anchor.getBoundingClientRect();
  const placed = choosePlace({
    anchor: { left: beside.left, top: beside.top, right: beside.right, bottom: beside.bottom },
    size: { width: origin2.width, height: origin2.height },
    room,
    avoid: avoidRects(avoid),
    prefer
  });
  root.style.maxWidth = `${placed.maxWidth}px`;
  root.style.maxHeight = `${placed.maxHeight}px`;
  root.style.left = `${placed.left - origin2.left}px`;
  root.style.top = `${placed.top - origin2.top}px`;
  root.setAttribute("data-side", placed.side);
  return placed;
}

// ui/popover.js
var CLASS11 = "cloudcanvas-ui-popover";
function mountPoint(pop) {
  return pop.options.host ?? pop.anchor.closest?.("dialog") ?? pop.doc.body;
}
function place(pop) {
  const { options, state } = pop;
  placePopover(pop.root, pop.anchor, { avoid: state.avoid ?? options.avoid, prefer: state.placement ?? options.placement });
}
function close2(pop, reason, report = true) {
  const { doc, root, state } = pop;
  const held = root.contains(doc.activeElement);
  state.opening?.destroy();
  Object.assign(state, { open: false, opening: null });
  root.remove();
  if (held) pop.anchor.focus({ preventScroll: true });
  if (report) pop.options.onClose?.(reason);
}
function onEscape(pop, event) {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  close2(pop, "escape");
}
function listenToViewport(opening, viewport, again) {
  if (!viewport) return;
  opening.on(viewport, "resize", again);
  opening.on(viewport, "scroll", again);
}
function listen(pop) {
  const { doc, root, anchor } = pop;
  const opening = createLife();
  const again = () => place(pop);
  opening.on(doc, "pointerdown", (event) => {
    if (!root.contains(event.target) && !anchor.contains(event.target)) close2(pop, "outside");
  }, { capture: true });
  opening.on(root, "keydown", (event) => onEscape(pop, event));
  opening.on(anchor, "keydown", (event) => onEscape(pop, event));
  const view = doc.defaultView;
  if (view) {
    opening.on(view, "resize", again);
    opening.on(doc, "scroll", again, { capture: true, passive: true });
    listenToViewport(opening, view.visualViewport, again);
  }
  return opening;
}
function show5(pop) {
  const { root, state } = pop;
  mountPoint(pop).append(root);
  state.open = true;
  state.opening = listen(pop);
  place(pop);
  (focusablesIn(root)[0] ?? root).focus({ preventScroll: true });
}
function writeModel3(pop, model) {
  const label = String(model.label ?? "").trim();
  if (label === "") throw new TypeError("A popover needs a label");
  if (!model.content || typeof model.content !== "object") throw new TypeError("A popover needs content");
  pop.root.setAttribute("aria-label", label);
  if (pop.root.childNodes.length !== 1 || pop.root.firstChild !== model.content) pop.root.replaceChildren(model.content);
  pop.state.avoid = model.avoid;
  pop.state.placement = model.placement;
}
function createPopover(anchor, options = {}) {
  const doc = documentOf(anchor);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS11, attrs: { role: "dialog", tabindex: "-1" } });
  const pop = { doc, anchor, root, options, state: { open: false, opening: null, avoid: void 0, placement: void 0 } };
  return {
    update(model = {}) {
      if (life.dead) return;
      if (!model.open) {
        if (pop.state.open) close2(pop, "update");
        return;
      }
      writeModel3(pop, model);
      if (pop.state.open) place(pop);
      else show5(pop);
    },
    destroy() {
      if (!life.destroy()) return;
      if (pop.state.open) close2(pop, "update", false);
    }
  };
}

// plugins/trait.js
import { BLIT_ATTR, stateOf as stateOf2 } from "cloudcanvas/kernel";
var CONTROL_ATTR = "data-cc-control";
var CONTROL_SELECTOR = /* @__PURE__ */ [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "label",
  '[contenteditable=""]',
  '[contenteditable="true"]',
  `[${CONTROL_ATTR}]`
].join(", ");
function isControlTarget(target) {
  if (!target || typeof target.closest !== "function") return false;
  return Boolean(target.closest(CONTROL_SELECTOR));
}

// ui/splitter.js
var CLASS12 = "cloudcanvas-ui-splitter";
function splitterLimits(model) {
  const min = Number.isFinite(model.min) ? clamp(model.min, 0, 100) : 0;
  const max = Number.isFinite(model.max) ? clamp(model.max, min, 100) : 100;
  const value = clamp(Number.isFinite(model.value) ? model.value : 50, min, max);
  return { min, max, value };
}
function splitterKeyValue(key, model) {
  const { min, max, value } = splitterLimits(model);
  const step = Number.isFinite(model.step) && model.step > 0 ? model.step : 1;
  const vertical = model.orientation !== "horizontal";
  const grow = vertical ? "ArrowRight" : "ArrowDown";
  const shrink = vertical ? "ArrowLeft" : "ArrowUp";
  const moves = { Home: min, End: max, PageUp: value - 10, PageDown: value + 10, [grow]: value + step, [shrink]: value - step };
  return Object.hasOwn(moves, key) ? clamp(moves[key], min, max) : null;
}
function startDrag(event, root, host, state) {
  const vertical = state.model.orientation !== "horizontal";
  const rect = host.getBoundingClientRect();
  const length = vertical ? rect.width : rect.height;
  if (!(length > 0)) return;
  event.preventDefault();
  root.setPointerCapture?.(event.pointerId);
  state.drag = {
    id: event.pointerId,
    vertical,
    length,
    start: vertical ? event.clientX : event.clientY,
    value: splitterLimits(state.model).value
  };
  root.classList.add("is-dragging");
}
function bindSplitter(life, root, host, state, onChange) {
  life.on(root, "keydown", (event) => {
    const next = splitterKeyValue(event.key, state.model);
    if (next === null) return;
    event.preventDefault();
    onChange?.(next);
  });
  life.on(root, "pointerdown", (event) => {
    if (event.button === 0) startDrag(event, root, host, state);
  });
  life.on(root, "pointermove", (event) => {
    const drag = state.drag;
    if (!drag || event.pointerId !== drag.id) return;
    const moved = (drag.vertical ? event.clientX : event.clientY) - drag.start;
    const { min, max } = splitterLimits(state.model);
    onChange?.(clamp(Math.round(drag.value + moved / drag.length * 100), min, max));
  });
  const end3 = (event) => {
    if (state.drag?.id !== event.pointerId) return;
    state.drag = null;
    root.classList.remove("is-dragging");
  };
  life.on(root, "pointerup", end3);
  life.on(root, "pointercancel", end3);
  life.on(root, "lostpointercapture", end3);
}
function createSplitter(host, { onChange } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS12, attrs: { role: "separator", tabindex: "0", [CONTROL_ATTR]: true } });
  host.append(root);
  const state = { model: { value: 50 }, drag: null };
  bindSplitter(life, root, host, state, onChange);
  return {
    update(model = {}) {
      if (life.dead) return;
      state.model = model;
      const { min, max, value } = splitterLimits(model);
      root.setAttribute("aria-orientation", model.orientation === "horizontal" ? "horizontal" : "vertical");
      root.setAttribute("aria-label", String(model.label ?? "Resize panes"));
      root.setAttribute("aria-valuemin", String(min));
      root.setAttribute("aria-valuemax", String(max));
      root.setAttribute("aria-valuenow", String(value));
      if (model.controls) root.setAttribute("aria-controls", String(model.controls));
      else root.removeAttribute("aria-controls");
    },
    destroy() {
      if (!life.destroy()) return;
      state.drag = null;
      root.remove();
    }
  };
}

// plugins/keyed-list.js
var KEY_ATTR = "data-cc-key";
function defaultKey(item, index) {
  if (item && typeof item === "object") {
    if (item.id !== void 0 && item.id !== null) return item.id;
    if (item.key !== void 0 && item.key !== null) return item.key;
  }
  return index;
}
function firstKeyed(container) {
  let node = container.firstElementChild;
  while (node && !node.hasAttribute(KEY_ATTR)) node = node.nextElementSibling;
  return node;
}
function nextKeyed(node) {
  let next = node ? node.nextElementSibling : null;
  while (next && !next.hasAttribute(KEY_ATTR)) next = next.nextElementSibling;
  return next;
}
function indexByKey(container) {
  const existing = /* @__PURE__ */ new Map();
  for (let node = firstKeyed(container); node; node = nextKeyed(node)) {
    const key = node.getAttribute(KEY_ATTR);
    if (!existing.has(key)) existing.set(key, node);
  }
  return existing;
}
function reconcileKeyedList(container, items, options = {}) {
  if (!container || typeof container.insertBefore !== "function") return [];
  if (typeof options.create !== "function") {
    throw new TypeError("reconcileKeyedList: options.create must be a function");
  }
  const keyOf = typeof options.key === "function" ? options.key : defaultKey;
  const update2 = typeof options.update === "function" ? options.update : null;
  const existing = indexByKey(container);
  const nodes = [];
  let cursor = firstKeyed(container);
  let index = 0;
  for (const item of items || []) {
    const key = String(keyOf(item, index));
    const node = existing.get(key) || createKeyed(options.create, item, index, key);
    existing.delete(key);
    if (update2) update2(node, item, index);
    if (node === cursor) cursor = nextKeyed(cursor);
    else container.insertBefore(node, cursor);
    nodes.push(node);
    index += 1;
  }
  for (const leftover of existing.values()) leftover.remove();
  return nodes;
}
function createKeyed(create, item, index, key) {
  const node = create(item, index);
  if (!node || typeof node.setAttribute !== "function") {
    throw new TypeError(`reconcileKeyedList: create() returned no element for key "${key}"`);
  }
  node.setAttribute(KEY_ATTR, key);
  return node;
}

// ui/results.js
var CLASS13 = "cloudcanvas-ui-results";
function optionNode(doc, listId) {
  const node = el(doc, "div", { className: `${CLASS13}-option`, attrs: { role: "option", [CONTROL_ATTR]: true } });
  const label = el(doc, "span", { className: `${CLASS13}-label` });
  const detail = el(doc, "span", { className: `${CLASS13}-detail` });
  node.append(label, detail);
  node._uiText = { label: textNode(doc, label), detail: textNode(doc, detail), listId };
  return node;
}
function writeOption(node, item, state) {
  node.id = `${node._uiText.listId}-${item.id}`;
  node.setAttribute("data-ui-id", item.id);
  node.setAttribute("aria-selected", String(item.id === state.highlightId));
  node.classList.toggle("is-active", item.id === state.activeId);
  writeText(node._uiText.label, item.label);
  writeText(node._uiText.detail, item.detail ?? "");
  node._uiText.detail.parentNode.hidden = !item.detail;
}
function highlight(nodes, state, id, { focus }) {
  const changed = state.highlightId !== id;
  state.highlightId = id;
  const current = nodes.find((node) => node.getAttribute("data-ui-id") === id) ?? null;
  for (const node of nodes) node.setAttribute("aria-selected", String(node === current));
  if (state.input) {
    if (current) state.input.setAttribute("aria-activedescendant", current.id);
    else state.input.removeAttribute("aria-activedescendant");
    current?.scrollIntoView?.({ block: "nearest" });
  } else {
    setTabStop(nodes, current ?? nodes[0] ?? null);
    if (focus) current?.focus();
  }
  if (changed) state.onHighlight?.(id);
}
function onKey3(event, list2, state) {
  const nodes = Array.from(list2.children);
  const index = nodes.findIndex((node) => node.getAttribute("data-ui-id") === state.highlightId);
  if ((event.key === "Enter" || event.key === " " && !state.input) && state.highlightId) {
    event.preventDefault();
    state.onActivate?.(state.highlightId);
    return;
  }
  if (event.key === "Escape" && state.input && state.highlightId) {
    event.preventDefault();
    highlight(nodes, state, null, { focus: false });
    return;
  }
  const keys = state.input ? ["ArrowUp", "ArrowDown"] : ["ArrowUp", "ArrowDown", "Home", "End"];
  if (!keys.includes(event.key)) return;
  const to = nextIndex(event.key, index, nodes.length, { orientation: "vertical" });
  if (to === null) return;
  event.preventDefault();
  highlight(nodes, state, nodes[to].getAttribute("data-ui-id"), { focus: !state.input });
}
function render2(doc, root, list2, empty2, state) {
  const nodes = reconcileKeyedList(list2, state.items, {
    key: (item) => item.id,
    create: () => optionNode(doc, list2.id),
    update: (node, item) => writeOption(node, item, state)
  });
  const present = (id) => state.items.some((item) => item.id === id);
  let next = state.highlightId;
  if (!present(next)) next = state.activeId ?? null;
  if (!present(next)) next = state.input ? null : state.items[0]?.id ?? null;
  highlight(nodes, state, next, { focus: false });
  empty2.hidden = state.items.length > 0 || !state.emptyText;
  empty2.textContent = state.emptyText;
  root.classList.toggle("is-empty", state.items.length === 0);
}
function createResults(host, { onActivate, onHighlight } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS13 });
  const list2 = el(doc, "div", { className: `${CLASS13}-list`, attrs: { role: "listbox", id: uniqueId(CLASS13) } });
  const empty2 = el(doc, "p", { className: `${CLASS13}-empty`, attrs: { role: "status", hidden: true } });
  root.append(list2, empty2);
  host.append(root);
  const state = { items: [], activeId: null, highlightId: null, emptyText: "", input: null, onActivate, onHighlight };
  life.on(list2, "click", (event) => {
    const option = event.target.closest?.('[role="option"]');
    if (option) onActivate?.(option.getAttribute("data-ui-id"));
  });
  life.on(list2, "keydown", (event) => {
    if (!state.input) onKey3(event, list2, state);
  });
  return {
    update(model = {}) {
      if (life.dead) return;
      state.items = uniqueItems(model.items ?? [], "result");
      if (state.activeId !== (model.activeId ?? null)) state.highlightId = model.activeId ?? null;
      state.activeId = model.activeId ?? null;
      state.emptyText = String(model.emptyText ?? "");
      list2.setAttribute("aria-label", String(model.label ?? "Results"));
      render2(doc, root, list2, empty2, state);
      state.input?.setAttribute("aria-expanded", String(state.items.length > 0));
    },
    attachInput(field) {
      if (life.dead) return () => {
      };
      state.input = field;
      field.setAttribute("role", "combobox");
      field.setAttribute("aria-controls", list2.id);
      field.setAttribute("aria-autocomplete", "list");
      field.setAttribute("aria-expanded", String(state.items.length > 0));
      const handler = (event) => onKey3(event, list2, state);
      field.addEventListener("keydown", handler, { signal: life.signal });
      return () => {
        field.removeEventListener("keydown", handler);
        for (const name of ["role", "aria-controls", "aria-autocomplete", "aria-expanded", "aria-activedescendant"]) field.removeAttribute(name);
        if (state.input === field) state.input = null;
      };
    },
    destroy() {
      if (!life.destroy()) return;
      state.input?.removeAttribute("aria-activedescendant");
      state.input = null;
      root.remove();
    }
  };
}

// ui/status.js
var CLASS14 = "cloudcanvas-ui-status";
var STATUS_LABELS = /* @__PURE__ */ Object.freeze({
  idle: "",
  loading: "Loading",
  empty: "Nothing here yet",
  error: "Something went wrong",
  unavailable: "Unavailable",
  ready: ""
});
function statusNodes(doc, life, state) {
  const root = el(doc, "div", { className: CLASS14, attrs: { role: "status", "aria-live": "polite" } });
  const label = el(doc, "strong", { className: `${CLASS14}-label` });
  const message = el(doc, "span", { className: `${CLASS14}-message` });
  const retry = button(doc, {
    className: `${CLASS14}-retry`,
    label: "Retry",
    signal: life.signal,
    onClick: () => state.retry?.()
  });
  root.append(label, message, retry);
  return { root, label, labelText: textNode(doc, label), message, messageText: textNode(doc, message), retry };
}
function createStatus(host, options) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const { labels, retryLabel } = options ?? {};
  const life = createLife();
  const state = { retry: null };
  const nodes = statusNodes(doc, life, state);
  host.append(nodes.root);
  const write = (model) => {
    const status = model.status ?? "idle";
    if (!Object.hasOwn(STATUS_LABELS, status)) throw new TypeError(`Unknown status: ${String(status)}`);
    const word = String(model.labels?.[status] ?? labels?.[status] ?? STATUS_LABELS[status]);
    const message = String(model.message ?? "");
    nodes.root.setAttribute("data-status", status);
    nodes.root.setAttribute("aria-live", status === "error" ? "assertive" : "polite");
    nodes.root.classList.toggle("is-quiet", word === "" && message === "");
    writeText(nodes.labelText, word);
    nodes.label.hidden = word === "";
    writeText(nodes.messageText, message);
    nodes.message.hidden = message === "";
    const canRetry = (status === "error" || status === "unavailable") && typeof model.retry === "function";
    state.retry = canRetry ? model.retry : null;
    nodes.retry.hidden = !canRetry;
    writeText(nodes.retry.firstChild, model.retryLabel ?? retryLabel ?? "Retry");
  };
  write({});
  return {
    update(model = {}) {
      if (life.dead) return;
      write(model);
    },
    destroy() {
      if (!life.destroy()) return;
      state.retry = null;
      nodes.root.remove();
    }
  };
}

// ui/breadcrumbs.js
var CLASS15 = "cloudcanvas-ui-breadcrumbs";
function ancestorsOf(model) {
  const items = uniqueItems(model.items ?? [], "breadcrumb");
  for (const item of items) {
    if (String(item.label ?? "").trim() === "") throw new TypeError(`A breadcrumb needs a label: ${item.id}`);
  }
  return items;
}
function entriesOf(state) {
  if (state.message) return [{ kind: "message", key: "message", label: state.message }];
  if (state.items.length === 0) return [];
  const entries = state.items.map((item) => ({ kind: "crumb", key: `crumb:${item.id}`, id: item.id, label: item.label }));
  if (!state.complete) entries.unshift({ kind: "more", key: "more", label: state.moreLabel });
  if (state.current) entries.push({ kind: "current", key: "current", label: state.current });
  return entries;
}
function entryNode(doc, entry, opens) {
  const node = el(doc, "li", { className: `${CLASS15}-item` });
  let holder = node;
  if (entry.kind === "more") {
    node.append(el(doc, "span", { text: "…", attrs: { "aria-hidden": "true" } }));
    holder = el(doc, "span", { className: SR_ONLY_CLASS });
  } else if (entry.kind === "crumb" && opens) {
    holder = el(doc, "button", { className: `${CLASS15}-open`, attrs: { type: "button", "data-ui-id": entry.id } });
  } else if (entry.kind === "current") {
    node.setAttribute("aria-current", "page");
  }
  if (holder !== node) node.append(holder);
  node._uiText = textNode(doc, holder);
  return node;
}
function writeModel4(root, state, model) {
  state.items = ancestorsOf(model);
  state.current = String(model.current ?? "");
  state.complete = model.complete !== false;
  state.message = String(model.message ?? "");
  state.moreLabel = String(model.moreLabel ?? "Earlier levels are not shown");
  root.setAttribute("aria-label", String(model.label ?? "Breadcrumb"));
}
function createBreadcrumbs(host, { onOpen } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const opens = typeof onOpen === "function";
  const root = el(doc, "nav", { className: CLASS15, attrs: { hidden: true } });
  const list2 = el(doc, "ol", { className: `${CLASS15}-list` });
  root.append(list2);
  host.append(root);
  const state = { items: [], current: "", complete: true, message: "", moreLabel: "" };
  if (opens) {
    life.on(list2, "click", (event) => {
      const crumb = event.target.closest?.(`.${CLASS15}-open`);
      if (!crumb || !list2.contains(crumb)) return;
      const id = crumb.getAttribute("data-ui-id");
      onOpen(id, state.items.find((item) => item.id === id));
    });
  }
  return {
    update(model = {}) {
      if (life.dead) return;
      writeModel4(root, state, model);
      const entries = entriesOf(state);
      root.hidden = entries.length === 0;
      reconcileKeyedList(list2, entries, {
        key: (entry) => entry.key,
        create: (entry) => entryNode(doc, entry, opens),
        update: (node, entry) => writeText(node._uiText, entry.label)
      });
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}

// ui/graph/marks.js
function matchesQuery(label, query) {
  const wanted = String(query ?? "").trim().toLowerCase();
  return wanted === "" || String(label).toLowerCase().includes(wanted);
}
function setDropTarget(drag, target) {
  if (target === drag.target) return;
  drag.target?.classList.remove("is-drop-target");
  target?.classList.add("is-drop-target");
  drag.target = target;
}

// ui/tree.js
var CLASS16 = "cloudcanvas-ui-tree";
var ROW2 = '[role="treeitem"]';
var TREE_LABELS = Object.freeze({ noMatches: "Nothing matches “{query}”" });
function childrenByParent(items) {
  const ids = new Set(items.map((item) => item.id));
  const children = /* @__PURE__ */ new Map([[null, []]]);
  for (const item of items) {
    const named = item.parentId === null || item.parentId === void 0 ? null : String(item.parentId);
    const parent = named !== null && named !== item.id && ids.has(named) ? named : null;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(item);
  }
  return children;
}
function forestOf(items) {
  const children = childrenByParent(items);
  const reached = /* @__PURE__ */ new Set();
  const reach2 = (parentId) => {
    for (const item of children.get(parentId) ?? []) {
      reached.add(item.id);
      reach2(item.id);
    }
  };
  reach2(null);
  for (const item of items) {
    if (reached.has(item.id)) continue;
    const siblings = children.get(String(item.parentId));
    siblings.splice(siblings.indexOf(item), 1);
    children.get(null).push(item);
    reached.add(item.id);
    reach2(item.id);
  }
  return children;
}
function visibleRows(children, expanded) {
  const rows = [];
  const walk = (parentId, level) => {
    const siblings = children.get(parentId) ?? [];
    siblings.forEach((item, index) => {
      const hasChildren = (children.get(item.id) ?? []).length > 0;
      const open = hasChildren && expanded.has(item.id);
      rows.push({ id: item.id, item, parentId, level, position: index + 1, size: siblings.length, hasChildren, expanded: open });
      if (open) walk(item.id, level + 1);
    });
  };
  walk(null, 1);
  return rows;
}
function tabStopId(state, children) {
  const parents = /* @__PURE__ */ new Map();
  for (const [parentId, items] of children) for (const item of items) parents.set(item.id, parentId);
  const shown = new Set(state.rows.map((row) => row.id));
  for (let id = state.focusId; id !== null && id !== void 0; id = parents.get(id) ?? null) {
    if (shown.has(id)) return id;
  }
  return shown.has(state.selectedId) ? state.selectedId : state.rows[0]?.id ?? null;
}
var searched = (query) => query.trim() !== "";
function rowNode(doc) {
  const node = el(doc, "button", { className: `${CLASS16}-row`, attrs: { type: "button", role: "treeitem", tabindex: "-1" } });
  const label = el(doc, "span", { className: `${CLASS16}-label` });
  const count = el(doc, "span", { className: `${CLASS16}-count` });
  node.append(
    el(doc, "span", { className: `${CLASS16}-indent`, attrs: { "aria-hidden": "true" } }),
    el(doc, "span", { className: `${CLASS16}-twisty`, attrs: { "aria-hidden": "true" } }),
    label,
    count
  );
  node._uiText = { label: textNode(doc, label), count: textNode(doc, count) };
  node._uiLabel = label;
  node._uiBadge = null;
  return node;
}
function writeBadge3(node, badge) {
  const had = node._uiBadge;
  node._uiBadge = syncBadge(had, node, badge);
  if (node._uiBadge && !had) node.insertBefore(node.lastChild, node._uiText.count.parentNode);
}
function writeRow2(node, row, state) {
  const { item } = row;
  const counted2 = item.count !== void 0 && item.count !== null;
  node.setAttribute("data-ui-id", row.id);
  node.setAttribute("aria-level", String(row.level));
  node.setAttribute("aria-posinset", String(row.position));
  node.setAttribute("aria-setsize", String(row.size));
  if (state.selectedId === null) node.removeAttribute("aria-selected");
  else node.setAttribute("aria-selected", String(row.id === state.selectedId));
  if (row.hasChildren) node.setAttribute("aria-expanded", String(row.expanded));
  else node.removeAttribute("aria-expanded");
  if (item.tone) node.setAttribute("data-tone", String(item.tone));
  else node.removeAttribute("data-tone");
  node.style.setProperty("--tree-level", String(row.level - 1));
  node.classList.toggle("is-unmatched", !state.nothingMatches && !matchesQuery(item.label ?? row.id, state.query));
  writeText(node._uiText.label, item.label ?? row.id);
  writeText(node._uiText.count, counted2 ? item.count : "");
  node._uiText.count.parentNode.hidden = !counted2;
  writeBadge3(node, item.badge);
}
function dropBadges(rows, root = null) {
  for (const node of rows) {
    if (root !== null && node.parentNode === root) continue;
    node._uiBadge?.destroy();
    node._uiBadge = null;
  }
}
var isCut = (node) => node._uiLabel.scrollWidth > node._uiLabel.clientWidth;
function titleCutLabels(root) {
  const rows = Array.from(root.querySelectorAll(ROW2));
  const cut = rows.map(isCut);
  rows.forEach((node, at) => {
    if (cut[at]) node.setAttribute("title", node._uiLabel.textContent);
    else node.removeAttribute("title");
  });
}
function watchWidth(tree) {
  const Observer = tree.doc.defaultView?.ResizeObserver;
  if (typeof Observer !== "function") return;
  const observer = new Observer(() => {
    if (!tree.life.dead) titleCutLabels(tree.root);
  });
  observer.observe(tree.root);
  tree.life.add(() => observer.disconnect());
}
function moveStop(tree, id, { focus }) {
  const nodes = Array.from(tree.root.querySelectorAll(ROW2));
  const node = nodes.find((entry) => entry.getAttribute("data-ui-id") === id) ?? null;
  tree.state.focusId = id;
  setTabStop(nodes, node);
  if (focus) node?.focus();
}
function draw2(tree) {
  const { doc, root, state } = tree;
  const had = root.contains(doc.activeElement);
  const before = Array.from(root.querySelectorAll(ROW2));
  reconcileKeyedList(root, state.rows, {
    key: (row) => row.id,
    create: () => rowNode(doc),
    update: (node, row) => writeRow2(node, row, state)
  });
  dropBadges(before, root);
  moveStop(tree, state.focusId, { focus: had && !root.contains(doc.activeElement) });
  titleCutLabels(root);
}
function keyAction(key, index, rows) {
  const row = rows[index];
  if (key === "Enter") return { activate: row.id };
  if (key === "ArrowRight") {
    if (!row.hasChildren) return null;
    return row.expanded ? { focus: rows[index + 1].id } : { toggle: row.id, expanded: true };
  }
  if (key === "ArrowLeft") {
    if (row.expanded) return { toggle: row.id, expanded: false };
    return row.parentId === null ? null : { focus: row.parentId };
  }
  const to = nextIndex(key, index, rows.length, { orientation: "vertical" });
  return to === null ? null : { focus: rows[to].id };
}
function bindTree(tree) {
  const { root, state, callbacks } = tree;
  const rowOf = (event) => {
    const node = event.target.closest?.(ROW2);
    const index = node && root.contains(node) ? state.rows.findIndex((row) => row.id === node.getAttribute("data-ui-id")) : -1;
    return index;
  };
  tree.life.on(root, "keydown", (event) => {
    const index = rowOf(event);
    const action2 = index < 0 ? null : keyAction(event.key, index, state.rows);
    if (!action2) return;
    event.preventDefault();
    if (action2.focus !== void 0) moveStop(tree, action2.focus, { focus: true });
    else if (action2.toggle !== void 0) callbacks.onToggle?.(action2.toggle, action2.expanded);
    else callbacks.onActivate?.(action2.activate);
  });
  tree.life.on(root, "click", (event) => {
    const row = state.rows[rowOf(event)];
    if (!row) return;
    moveStop(tree, row.id, { focus: false });
    if (row.hasChildren && event.target.closest?.(`.${CLASS16}-twisty`)) callbacks.onToggle?.(row.id, !row.expanded);
    else callbacks.onActivate?.(row.id);
  });
}
function bindMove(tree) {
  const { root, doc, callbacks } = tree;
  let drag = null;
  root.setAttribute("data-movable", "");
  trackDrag(tree.life, root, {
    selector: ROW2,
    onStart(row) {
      drag = { id: row.getAttribute("data-ui-id"), row, target: null };
      row.classList.add("is-dragging");
    },
    onMove(point) {
      if (!drag) return;
      const hit = doc.elementFromPoint?.(point.x, point.y)?.closest?.(ROW2) ?? null;
      setDropTarget(drag, hit && root.contains(hit) && hit !== drag.row ? hit : null);
    },
    onEnd(point) {
      if (!drag) return;
      const { id, row, target } = drag;
      setDropTarget(drag, null);
      drag = null;
      row.classList.remove("is-dragging");
      if (point && target) callbacks.onMove(id, target.getAttribute("data-ui-id"));
    }
  });
}
function createTree(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS16, attrs: { role: "tree", [CONTROL_ATTR]: true } });
  host.append(root);
  const status = el(doc, "p", { className: `${CLASS16}-status`, attrs: { "aria-live": "polite" } });
  host.append(status);
  const labels = { ...TREE_LABELS, ...callbacks.labels };
  const tree = { doc, root, life, callbacks, state: { rows: [], focusId: null, selectedId: null, query: "", nothingMatches: false } };
  const statusText = textNode(doc, status);
  bindTree(tree);
  watchWidth(tree);
  if (typeof callbacks.onMove === "function") bindMove(tree);
  return {
    update(model = {}) {
      if (life.dead) return;
      const children = forestOf(uniqueItems(model.items ?? [], "tree"));
      const selectedId = model.selectedId ?? null;
      if (selectedId !== null && selectedId !== tree.state.selectedId) tree.state.focusId = selectedId;
      tree.state.selectedId = selectedId;
      tree.state.query = String(model.query ?? "");
      tree.state.nothingMatches = searched(tree.state.query) && !(model.items ?? []).some((item) => matchesQuery(item.label ?? item.id, tree.state.query));
      writeText(statusText, tree.state.nothingMatches ? labels.noMatches.replace("{query}", tree.state.query.trim()) : "");
      tree.state.rows = visibleRows(children, new Set((model.expanded ?? []).map(String)));
      tree.state.focusId = tabStopId(tree.state, children);
      root.setAttribute("aria-label", String(model.label ?? "Tree"));
      draw2(tree);
    },
    destroy() {
      if (!life.destroy()) return;
      dropBadges(Array.from(root.querySelectorAll(ROW2)));
      root.remove();
      status.remove();
    }
  };
}

// ui/progress.js
var CLASS17 = "cloudcanvas-ui-progress";
function numberOf(value) {
  if (value === null || value === void 0 || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function progressOf(model) {
  const limit = numberOf(model.max);
  const max = limit !== null && limit > 0 ? limit : 1;
  const value = numberOf(model.value);
  return { max, value: value === null ? null : clamp(value, 0, max) };
}
function createProgress(host) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS17 });
  const label = el(doc, "span", { className: `${CLASS17}-label`, attrs: { id: uniqueId(CLASS17) } });
  const labelText = textNode(doc, label);
  const bar = el(doc, "progress", { className: `${CLASS17}-bar`, attrs: { "aria-labelledby": label.id } });
  root.append(label, bar);
  host.append(root);
  return {
    update(model = {}) {
      if (life.dead) return;
      const words2 = String(model.label ?? "").trim();
      if (words2 === "") throw new TypeError("A progress bar needs a label");
      const { max, value } = progressOf(model);
      writeText(labelText, words2);
      bar.setAttribute("max", String(max));
      if (value === null) bar.removeAttribute("value");
      else bar.setAttribute("value", String(value));
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}

// ui/row-status.js
var TONES2 = /* @__PURE__ */ new Set(["success", "warning", "danger", "muted"]);
function statusSlot(doc, className) {
  const node = el(doc, "span", { className, attrs: { id: uniqueId(className), role: "status", "aria-live": "polite", "aria-atomic": "true" } });
  return { node, text: textNode(doc, node) };
}
function writeStatus(slot, status) {
  const words2 = String(status?.text ?? "").trim();
  const tone = TONES2.has(status?.tone) ? status.tone : "muted";
  if (words2 === "") slot.node.removeAttribute("data-tone");
  else slot.node.setAttribute("data-tone", tone);
  slot.node.setAttribute("aria-live", tone === "danger" && words2 !== "" ? "assertive" : "polite");
  writeText(slot.text, words2);
  return words2 !== "";
}

// ui/switch.js
var CLASS18 = "cloudcanvas-ui-switch";
function switchNodes(doc) {
  const root = el(doc, "label", { className: CLASS18 });
  const text2 = el(doc, "span", { className: `${CLASS18}-text` });
  const words2 = el(doc, "span", { className: `${CLASS18}-label`, attrs: { id: uniqueId(CLASS18) } });
  const status = statusSlot(doc, `${CLASS18}-status`);
  const detail = el(doc, "span", { className: `${CLASS18}-detail`, attrs: { id: uniqueId(`${CLASS18}-detail`) } });
  const box = el(doc, "input", { className: `${CLASS18}-box`, attrs: { type: "checkbox", role: "switch" } });
  text2.append(words2, status.node, detail);
  root.append(text2, box);
  return { root, box, words: words2, status, detail, texts: { words: textNode(doc, words2), detail: textNode(doc, detail) } };
}
function writeDescribed(nodes, model, hasStatus) {
  const described = [model.detail ? nodes.detail.id : null, hasStatus ? nodes.status.node.id : null].filter(Boolean);
  if (described.length > 0) nodes.box.setAttribute("aria-describedby", described.join(" "));
  else nodes.box.removeAttribute("aria-describedby");
}
function createSwitch(host, { onChange } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const nodes = switchNodes(doc);
  const { root, box } = nodes;
  host.append(root);
  let shown = false;
  life.on(box, "change", () => {
    const asked = Boolean(box.checked);
    box.checked = shown;
    if (!life.dead && !box.disabled) onChange?.(asked);
  });
  return {
    update(model = {}) {
      if (life.dead) return;
      const label = String(model.label ?? "").trim();
      if (label === "") throw new TypeError("A switch needs a label");
      shown = Boolean(model.checked);
      writeText(nodes.texts.words, label);
      writeText(nodes.texts.detail, String(model.detail ?? ""));
      nodes.detail.hidden = !model.detail;
      box.checked = shown;
      box.disabled = Boolean(model.disabled);
      box.setAttribute("aria-labelledby", nodes.words.id);
      box.setAttribute("aria-checked", String(shown));
      writeDescribed(nodes, model, writeStatus(nodes.status, model.status));
    },
    destroy() {
      if (!life.destroy()) return;
      root.remove();
    }
  };
}

// ui/select.js
var CLASS19 = "cloudcanvas-ui-select";
function selectNodes(doc) {
  const root = el(doc, "div", { className: CLASS19 });
  const control = el(doc, "select", { className: `${FIELD_CLASS} ${CLASS19}-control`, attrs: { id: uniqueId(CLASS19) } });
  const label = el(doc, "label", { className: `${CLASS19}-label`, attrs: { for: control.id } });
  const hint = el(doc, "p", { className: `${CLASS19}-hint`, attrs: { id: uniqueId(`${CLASS19}-hint`), hidden: true } });
  const status = statusSlot(doc, `${CLASS19}-status`);
  root.append(label, control, hint, status.node);
  return { root, control, label, hint, status, texts: { label: textNode(doc, label), hint: textNode(doc, hint) } };
}
function checkedOptions(options) {
  if (!Array.isArray(options)) throw new TypeError("A select needs options");
  const seen = /* @__PURE__ */ new Set();
  for (const option of options) {
    const key = String(option?.value);
    if (option?.value === void 0 || option?.value === null || seen.has(key)) throw new TypeError(`Missing or duplicate select value: ${key}`);
    seen.add(key);
  }
  return options;
}
function optionNodes(doc, options) {
  return options.map((option) => {
    const node = el(doc, "option", { text: option.label ?? option.value });
    node.value = String(option.value);
    node.disabled = option.disabled === true;
    return node;
  });
}
function writeOptions(doc, select4, options) {
  const signature = JSON.stringify(options.map((option) => [String(option.value), String(option.label ?? option.value), option.disabled === true]));
  if (signature !== select4.signature) {
    select4.control.replaceChildren(...optionNodes(doc, options));
    select4.signature = signature;
  }
  select4.values = new Map(options.map((option) => [String(option.value), option.value]));
}
function writeDescribed2(nodes, hasHint, hasStatus) {
  const described = [hasHint ? nodes.hint.id : null, hasStatus ? nodes.status.node.id : null].filter(Boolean);
  if (described.length > 0) nodes.control.setAttribute("aria-describedby", described.join(" "));
  else nodes.control.removeAttribute("aria-describedby");
}
function writeNotes(nodes, model) {
  const words2 = String(model.hint ?? "").trim();
  writeText(nodes.texts.hint, words2);
  nodes.hint.hidden = words2 === "";
  writeDescribed2(nodes, words2 !== "", writeStatus(nodes.status, model.status));
  if (model.invalid === true) {
    nodes.control.setAttribute("aria-invalid", "true");
    nodes.root.setAttribute("data-invalid", "true");
  } else {
    nodes.control.removeAttribute("aria-invalid");
    nodes.root.removeAttribute("data-invalid");
  }
}
function createSelect(host, { onChange } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const nodes = selectNodes(doc);
  const { root, control } = nodes;
  const select4 = { control, signature: null, values: /* @__PURE__ */ new Map(), shown: "" };
  host.append(root);
  life.on(control, "change", () => {
    const asked = control.value;
    control.value = select4.shown;
    if (!life.dead && !control.disabled) onChange?.(select4.values.has(asked) ? select4.values.get(asked) : asked);
  });
  return {
    update(model = {}) {
      if (life.dead) return;
      const label = String(model.label ?? "").trim();
      if (label === "") throw new TypeError("A select needs a label");
      writeOptions(doc, select4, checkedOptions(model.options));
      writeText(nodes.texts.label, label);
      select4.shown = String(model.value ?? "");
      control.value = select4.shown;
      control.disabled = Boolean(model.disabled);
      writeNotes(nodes, model);
    },
    destroy() {
      if (!life.destroy()) return;
      root.remove();
    }
  };
}

// ui/chips.js
var CLASS20 = "cloudcanvas-ui-chips";
var CHIP = `.${CLASS20}-chip`;
var TOGGLE = `.${CLASS20}-toggle`;
function chipNode(doc, { toggles, removes }) {
  const node = el(doc, "span", { className: `${CLASS20}-chip` });
  const face = toggles ? el(doc, "button", { className: `${CLASS20}-toggle`, attrs: { type: "button" } }) : el(doc, "span", { className: `${CLASS20}-label` });
  const remove = removes ? el(doc, "button", { className: `${CLASS20}-remove`, text: "×", attrs: { type: "button" } }) : null;
  node.append(face);
  if (remove) node.append(remove);
  node._uiChip = { face, text: textNode(doc, face), remove };
  return node;
}
function writeChip(node, item, chips) {
  const { face, text: text2, remove } = node._uiChip;
  const label = String(item.label ?? item.id);
  writeText(text2, label);
  if (item.tone) node.setAttribute("data-tone", String(item.tone));
  else node.removeAttribute("data-tone");
  if (chips.toggles) {
    face.setAttribute("data-ui-id", item.id);
    face.setAttribute("aria-pressed", String(chips.single ? item.id === chips.state.value : item.pressed === true));
  }
  if (remove) {
    remove.setAttribute("data-ui-remove", item.id);
    remove.setAttribute("aria-label", `${chips.state.removeLabel} ${label}`);
    remove.hidden = item.removable !== true;
  }
}
function draw3(chips) {
  const { doc, root, state } = chips;
  const active = doc.activeElement;
  const chip = active?.closest?.(CHIP) ?? null;
  const at = chip && root.contains(chip) ? Array.from(root.children).indexOf(chip) : -1;
  const nodes = reconcileKeyedList(root, state.items, {
    key: (item) => item.id,
    create: () => chipNode(doc, chips),
    update: (node, item) => writeChip(node, item, chips)
  });
  if (at >= 0 && !root.contains(doc.activeElement)) {
    const heir = nodes.includes(chip) ? chip : nodes[Math.min(at, nodes.length - 1)];
    const targets = heir ? focusablesIn(heir) : [];
    (targets.includes(active) ? active : targets[0])?.focus();
  }
  restTabStop(chips);
}
function facesOf(chips) {
  return [...chips.root.querySelectorAll(TOGGLE)];
}
function restTabStop(chips) {
  if (!chips.single || !chips.toggles) return;
  const faces = facesOf(chips);
  const held = faces.find((face) => face === chips.doc.activeElement);
  const chosen = faces.find((face) => face.getAttribute("aria-pressed") === "true");
  if (faces.length > 0) setTabStop(faces, held ?? chosen ?? faces[0]);
}
function bindRoving(chips) {
  const { root, life } = chips;
  life.on(root, "keydown", (event) => {
    const face = event.target.closest?.(TOGGLE);
    if (!face || !root.contains(face) || event.altKey || event.ctrlKey || event.metaKey) return;
    const faces = facesOf(chips);
    const to = nextIndex(event.key, faces.indexOf(face), faces.length, { orientation: "both", wrap: true });
    if (to === null) return;
    event.preventDefault();
    setTabStop(faces, faces[to]);
    faces[to].focus();
  });
  life.on(root, "focusin", (event) => {
    const face = event.target.closest?.(TOGGLE);
    if (face && root.contains(face)) setTabStop(facesOf(chips), face);
  });
}
function bindChips(chips, { onToggle, onRemove, onChange }) {
  const { root, state } = chips;
  chips.life.on(root, "click", (event) => {
    const remove = event.target.closest?.("[data-ui-remove]");
    if (remove && root.contains(remove)) {
      if (!remove.hidden) onRemove(remove.getAttribute("data-ui-remove"));
      return;
    }
    const face = event.target.closest?.(TOGGLE);
    if (!face || !root.contains(face)) return;
    const id = face.getAttribute("data-ui-id");
    if (!chips.single) onToggle(id, state.items.find((item) => item.id === id)?.pressed !== true);
    else if (id !== state.value) onChange(id);
  });
  if (chips.single) bindRoving(chips);
}
function createChips(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS20, attrs: { role: "group" } });
  host.append(root);
  const single = callbacks.single === true;
  const chips = {
    doc,
    root,
    life,
    single,
    toggles: typeof (single ? callbacks.onChange : callbacks.onToggle) === "function",
    removes: !single && typeof callbacks.onRemove === "function",
    state: { items: [], removeLabel: "Remove", value: null }
  };
  bindChips(chips, callbacks);
  return {
    update(model = {}) {
      if (life.dead) return;
      chips.state.items = uniqueItems(model.items ?? [], "chip");
      chips.state.removeLabel = String(model.removeLabel ?? "Remove");
      chips.state.value = model.value ?? null;
      root.setAttribute("aria-label", String(model.label ?? "Chips"));
      draw3(chips);
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}

// ui/navbar.js
var CLASS21 = "cloudcanvas-ui-navbar";
function entryFor2(doc, id) {
  const node = el(doc, "li", { className: `${CLASS21}-item` });
  const link = el(doc, "button", { className: `${CLASS21}-link`, attrs: { type: "button", "data-ui-id": id } });
  const slot = iconSlot(doc, `${CLASS21}-icon`);
  const label = el(doc, "span", { className: `${CLASS21}-label` });
  link.append(slot, label);
  node.append(link);
  return { node, link, slot, text: textNode(doc, label), badge: createBadge(link) };
}
function draw4(nav, items, activeId) {
  const { doc, list: list2, entries } = nav;
  const kept = new Set(items.map((item) => item.id));
  for (const [id, entry] of entries) {
    if (kept.has(id)) continue;
    entry.badge.destroy();
    entries.delete(id);
  }
  const active = doc.activeElement;
  placeChildren(list2, items.map((item) => {
    if (!entries.has(item.id)) entries.set(item.id, entryFor2(doc, item.id));
    const entry = entries.get(item.id);
    writeText(entry.text, item.label ?? item.id);
    writeIcon(entry.slot, item.icon);
    if (item.title) entry.link.setAttribute("title", String(item.title));
    else entry.link.removeAttribute("title");
    if (item.id === activeId) entry.link.setAttribute("aria-current", "page");
    else entry.link.removeAttribute("aria-current");
    entry.badge.update(badgeModel(item.badge));
    return entry.node;
  }));
  keepFocus(list2, active);
}
function createNavBar(host, { onSelect } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "nav", { className: CLASS21 });
  const list2 = el(doc, "ul", { className: `${CLASS21}-list`, attrs: { role: "list" } });
  root.append(list2);
  host.append(root);
  const nav = { doc, list: list2, entries: /* @__PURE__ */ new Map() };
  life.on(list2, "click", (event) => {
    const link = event.target.closest?.(`.${CLASS21}-link`);
    if (link && list2.contains(link)) onSelect?.(link.getAttribute("data-ui-id"));
  });
  life.add(() => {
    for (const entry of nav.entries.values()) entry.badge.destroy();
  });
  return {
    update(model = {}) {
      if (life.dead) return;
      const items = uniqueItems(model.items ?? [], "navbar");
      root.setAttribute("aria-label", String(model.label ?? "Navigation"));
      root.setAttribute("data-placement", model.placement === "bottom" ? "bottom" : "top");
      draw4(nav, items, model.activeId ?? null);
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}

// ui/empty.js
var CLASS22 = "cloudcanvas-ui-empty";
var KINDS = /* @__PURE__ */ new Set(["empty", "error", "locked", "loading"]);
function kindOf(model) {
  if (model.kind === void 0 || model.kind === null) return null;
  if (!KINDS.has(model.kind)) throw new TypeError(`Unknown empty-state kind: ${String(model.kind)}`);
  return model.kind;
}
function writePart(node, text2, value) {
  const words2 = String(value ?? "").trim();
  writeText(text2, words2);
  node.hidden = words2 === "";
  return words2 !== "";
}
function createEmptyState(host, { onAction } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const acts = typeof onAction === "function";
  const root = el(doc, "div", { className: CLASS22 });
  const slot = iconSlot(doc, `${CLASS22}-icon`);
  const title = el(doc, "p", { className: `${CLASS22}-title`, attrs: { hidden: true } });
  const body = el(doc, "p", { className: `${CLASS22}-body`, attrs: { hidden: true } });
  const action2 = button(doc, { className: `${CLASS22}-action`, label: "", signal: life.signal, onClick: () => onAction?.(), attrs: { hidden: true } });
  const texts = { title: textNode(doc, title), body: textNode(doc, body) };
  root.append(slot, title, body, action2);
  host.append(root);
  return {
    update(model = {}) {
      if (life.dead) return;
      const kind = kindOf(model);
      writeIcon(slot, kind ?? void 0);
      if (kind) root.setAttribute("data-kind", kind);
      else root.removeAttribute("data-kind");
      if (kind === "loading") root.setAttribute("aria-busy", "true");
      else root.removeAttribute("aria-busy");
      writePart(title, texts.title, model.title);
      writePart(body, texts.body, model.body);
      const named = writePart(action2, action2.firstChild, model.actionLabel);
      action2.hidden = !(acts && named);
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}

// ui/combobox.js
var CLASS23 = "cloudcanvas-ui-combobox";
function createCombobox(input2, { onPick } = {}) {
  const doc = documentOf(input2);
  injectUiStyles(doc);
  const life = createLife();
  const popup = el(doc, "div", { className: CLASS23, attrs: { hidden: true } });
  input2.after(popup);
  const state = { options: [] };
  const results = createResults(popup, { onActivate: (id) => onPick?.(id, state.options.find((option) => option.id === id)) });
  const detach2 = results.attachInput(input2);
  life.on(popup, "mousedown", (event) => event.preventDefault());
  life.add(() => {
    detach2();
    results.destroy();
    popup.remove();
  });
  return {
    update(model = {}) {
      if (life.dead) return;
      const options = model.open === true ? model.options ?? [] : [];
      results.update({ label: model.label ?? "Suggestions", items: options });
      state.options = options;
      popup.hidden = options.length === 0;
    },
    destroy() {
      life.destroy();
    }
  };
}

// ui/toast.js
var CLASS24 = "cloudcanvas-ui-toast";
var TONES3 = /* @__PURE__ */ new Set(["info", "success", "warning", "danger"]);
var RESUME_FLOOR_MS = 1500;
var MAX_ACTIONS = 2;
var REGIONS = /* @__PURE__ */ new WeakMap();
function holdRegion(doc, host, label) {
  const named = REGIONS.get(doc) ?? /* @__PURE__ */ new Map();
  REGIONS.set(doc, named);
  const region = named.get(label) ?? { node: el(doc, "section", { className: `${CLASS24}s`, attrs: { "aria-label": label } }), holders: 0, count: 0 };
  named.set(label, region);
  region.holders += 1;
  if (!region.node.isConnected) host.append(region.node);
  return region;
}
function releaseRegion(doc, label, region) {
  region.holders -= 1;
  if (region.holders > 0) return;
  region.node.remove();
  REGIONS.get(doc).delete(label);
}
function toastNode(doc, life, entry, labels, on) {
  const node = el(doc, "div", { className: CLASS24, attrs: {
    role: entry.tone === "danger" ? "alert" : "status",
    "data-tone": entry.tone,
    "data-ui-id": entry.id
  } });
  node.append(el(doc, "span", { className: `${CLASS24}-message`, text: entry.message }));
  for (const action2 of entry.actions) {
    node.append(button(doc, {
      className: `${CLASS24}-action`,
      label: action2.label,
      signal: life.signal,
      attrs: { "data-ui-action": action2.id },
      onClick: () => on.take(entry.id, action2)
    }));
  }
  node.append(button(doc, {
    className: `${CLASS24}-dismiss`,
    label: "×",
    ariaLabel: labels.dismiss,
    signal: life.signal,
    onClick: () => on.close(entry.id, "dismiss")
  }));
  return node;
}
function ownAction(action2) {
  if (typeof action2.run !== "function" || !String(action2.label ?? "").trim()) {
    throw new TypeError("A toast action needs a label and a run function");
  }
  return [{ id: null, label: String(action2.label), run: action2.run }];
}
function actionsOf(options, id, onAction) {
  if (options.action && options.actions) throw new TypeError("A toast takes action or actions, not both");
  if (options.action) return ownAction(options.action);
  const listed = uniqueItems(options.actions ?? [], "toast action");
  if (listed.length > MAX_ACTIONS) throw new TypeError("A toast takes at most two actions");
  return listed.map((action2) => {
    if (!String(action2.label ?? "").trim()) throw new TypeError(`The toast action ${action2.id} needs a label`);
    return { id: action2.id, label: String(action2.label), run: () => onAction?.(id, action2.id) };
  });
}
function validEntry(options, id, fallbackTimeout, onAction) {
  const message = String(options?.message ?? "").trim();
  if (message === "") throw new TypeError("A toast needs a message");
  const tone = TONES3.has(options.tone) ? options.tone : "info";
  const timeout = Number.isFinite(options.timeout) && options.timeout >= 0 ? options.timeout : fallbackTimeout;
  return { id, message, tone, actions: actionsOf(options, id, onAction), timeout };
}
function armTimer(life, entry, close3) {
  entry.cancel?.();
  entry.cancel = null;
  if (entry.timeout === 0 || entry.paused) return;
  const wait = Math.max(entry.remaining ?? entry.timeout, entry.remaining === void 0 ? 0 : RESUME_FLOOR_MS);
  entry.deadline = Date.now() + wait;
  entry.cancel = life.later(() => close3(entry.id, "timeout"), wait);
}
function bindPause(life, node, entry, close3) {
  const pause = () => {
    if (entry.paused) return;
    entry.paused = true;
    if (entry.deadline) entry.remaining = Math.max(0, entry.deadline - Date.now());
    entry.cancel?.();
    entry.cancel = null;
  };
  const resume = () => {
    if (!entry.paused || node.matches(":hover") || node.contains(node.ownerDocument.activeElement)) return;
    entry.paused = false;
    armTimer(life, entry, close3);
  };
  life.on(node, "pointerenter", pause);
  life.on(node, "focusin", pause);
  life.on(node, "pointerleave", resume);
  life.on(node, "focusout", () => queueMicrotask(resume));
  life.on(node, "keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close3(entry.id, "escape");
    }
  });
}
function createToaster(host, { max = 3, timeout = 6e3, labels = {}, onAction, onClose } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const words2 = { region: labels.region ?? "Notifications", dismiss: labels.dismiss ?? "Dismiss" };
  const region = holdRegion(doc, host, words2.region);
  const entries = /* @__PURE__ */ new Map();
  const close3 = (id, reason = "api") => {
    const entry = entries.get(id);
    if (!entry) return false;
    entry.cancel?.();
    entries.delete(id);
    entry.node.remove();
    onClose?.(id, reason);
    return true;
  };
  const take = (id, action2) => {
    if (!entries.has(id)) return;
    try {
      action2.run();
    } finally {
      close3(id, "action");
    }
  };
  return {
    show(options) {
      if (life.dead) return null;
      const entry = validEntry(options, `toast-${region.count + 1}`, timeout, onAction);
      region.count += 1;
      entry.node = toastNode(doc, life, entry, words2, { close: close3, take });
      entries.set(entry.id, entry);
      if (!region.node.isConnected) host.append(region.node);
      region.node.append(entry.node);
      bindPause(life, entry.node, entry, close3);
      armTimer(life, entry, close3);
      while (entries.size > Math.max(1, max)) close3(entries.keys().next().value, "max");
      return entry.id;
    },
    dismiss: (id) => close3(id, "api"),
    clear() {
      for (const id of [...entries.keys()]) close3(id, "clear");
    },
    destroy() {
      if (!life.destroy()) return;
      for (const entry of entries.values()) entry.node.remove();
      entries.clear();
      releaseRegion(doc, words2.region, region);
    }
  };
}

// ui/voice-draft.js
var VOICE_MAX_LENGTH = 16e3;
var VOICE_MESSAGES = /* @__PURE__ */ Object.freeze({
  listening: "Listening. Stop when you are done.",
  denied: "Voice input is unavailable or was denied. You can still type.",
  failed: "Voice input could not start. You can still type."
});
function detach(owner) {
  const device = owner.device;
  owner.device = null;
  owner.sequence += 1;
  if (!device) return;
  device.onresult = null;
  device.onerror = null;
  device.onend = null;
  try {
    device.abort();
  } catch {
  }
}
function wire(owner, device, sequence2) {
  const current = () => !owner.dead && sequence2 === owner.sequence && !owner.disabled;
  device.continuous = false;
  device.interimResults = true;
  device.maxAlternatives = 1;
  device.onresult = (event) => {
    if (!current()) return;
    owner.text = Array.from(event.results).map((result) => result[0]?.transcript ?? "").join(" ").slice(0, VOICE_MAX_LENGTH);
    owner.emit();
  };
  device.onend = () => {
    if (!current()) return;
    owner.listening = false;
    owner.emit();
    owner.onEnd?.();
  };
  device.onerror = () => {
    if (!current()) return;
    detach(owner);
    owner.listening = false;
    owner.message = owner.messages.denied;
    owner.emit();
  };
}
function start(owner, consent) {
  if (!consent || owner.dead || owner.disabled || owner.listening || !owner.createRecognition) return;
  detach(owner);
  const sequence2 = owner.sequence;
  owner.text = "";
  owner.message = owner.messages.listening;
  owner.listening = true;
  try {
    const device = owner.createRecognition();
    owner.device = device;
    wire(owner, device, sequence2);
    device.start();
  } catch {
    detach(owner);
    owner.listening = false;
    owner.message = owner.messages.failed;
  }
  owner.emit();
}
function update(owner, { contextKey, disabled = false } = {}, cancel) {
  if (owner.dead) return;
  const reset = contextKey !== owner.contextKey || disabled && !owner.disabled;
  owner.contextKey = contextKey;
  owner.disabled = disabled;
  if (reset) cancel();
  else owner.emit();
}
function createVoiceDraft({ createRecognition, onApply, onEnd, messages = {} } = {}) {
  const listeners = /* @__PURE__ */ new Set();
  const owner = {
    createRecognition,
    onEnd,
    device: null,
    sequence: 0,
    dead: false,
    disabled: false,
    listening: false,
    text: "",
    message: "",
    messages: { ...VOICE_MESSAGES, ...messages }
  };
  const snapshot = () => ({
    supported: Boolean(createRecognition),
    listening: owner.listening,
    text: owner.text,
    message: owner.message,
    disabled: owner.disabled
  });
  owner.emit = () => {
    if (!owner.dead) for (const listener of listeners) listener(snapshot());
  };
  const cancel = () => {
    detach(owner);
    owner.listening = false;
    owner.text = "";
    owner.message = "";
    owner.emit();
  };
  return {
    get state() {
      return snapshot();
    },
    start: (consent) => start(owner, consent),
    stop() {
      try {
        owner.device?.stop();
      } catch {
        cancel();
      }
    },
    edit(text2) {
      if (owner.dead || owner.disabled || owner.listening) return;
      owner.text = String(text2).slice(0, VOICE_MAX_LENGTH);
      owner.emit();
    },
    apply() {
      if (owner.dead || owner.disabled || owner.listening || !owner.text.trim()) return;
      const text2 = owner.text.trim();
      cancel();
      onApply?.(text2);
    },
    update: (model) => update(owner, model, cancel),
    cancel,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    destroy() {
      if (owner.dead) return;
      owner.dead = true;
      detach(owner);
      owner.text = "";
      listeners.clear();
    }
  };
}

// ui/voice.js
var CLASS25 = "cloudcanvas-ui-voice";
var VOICE_LABELS = /* @__PURE__ */ Object.freeze({
  voice: "Voice",
  stop: "Stop",
  allow: "Allow and start",
  decline: "Not now",
  add: "Add",
  discard: "Discard",
  preview: "Voice draft",
  consent: "Voice uses your browser’s speech service, which may process audio online. Nothing is sent or saved until you choose to."
});
function voiceNodes(doc, words2) {
  const root = el(doc, "div", { className: CLASS25 });
  const mic = button(doc, { className: `${CLASS25}-mic`, label: words2.voice, attrs: { "aria-pressed": "false" } });
  const consent = el(doc, "div", { className: `${CLASS25}-consent`, attrs: { hidden: true } });
  const consentText = el(doc, "p", { className: `${CLASS25}-consent-text`, text: words2.consent });
  const allow = button(doc, { className: `${CLASS25}-allow is-primary`, label: words2.allow });
  const decline = button(doc, { className: `${CLASS25}-decline`, label: words2.decline });
  consent.append(consentText, allow, decline);
  const status = el(doc, "p", { className: `${CLASS25}-status`, attrs: { role: "status" } });
  const statusText = textNode(doc, status);
  const review = el(doc, "div", { className: `${CLASS25}-review`, attrs: { hidden: true } });
  const preview2 = input(doc, { type: "textarea", label: words2.preview, className: `${CLASS25}-preview` });
  preview2.maxLength = VOICE_MAX_LENGTH;
  const add = button(doc, { className: `${CLASS25}-add is-primary`, label: words2.add });
  const discard = button(doc, { className: `${CLASS25}-discard`, label: words2.discard });
  review.append(preview2, add, discard);
  root.append(mic, consent, status, review);
  return { root, mic, consent, allow, decline, statusText, review, preview: preview2, add, discard };
}
function render3(nodes, state, words2, view) {
  nodes.root.hidden = !state.supported;
  nodes.mic.disabled = state.disabled;
  nodes.mic.setAttribute("aria-pressed", String(state.listening));
  writeText(nodes.mic.firstChild, state.listening ? words2.stop : words2.voice);
  nodes.root.classList.toggle("is-listening", state.listening);
  nodes.consent.hidden = !view.asking || state.listening || state.disabled;
  const reviewing = view.review && !state.listening && state.text.trim() !== "";
  nodes.review.hidden = !reviewing;
  if (nodes.preview.value !== state.text) nodes.preview.value = state.text;
  nodes.add.disabled = state.disabled || !reviewing;
  writeText(nodes.statusText, state.message);
}
function bindVoice(life, nodes, controller, view) {
  life.on(nodes.mic, "click", () => {
    if (controller.state.listening) {
      controller.stop();
      return;
    }
    if (view.consented) {
      controller.start(true);
      return;
    }
    view.asking = true;
    view.rerender();
    nodes.allow.focus();
  });
  life.on(nodes.allow, "click", () => {
    view.consented = true;
    view.asking = false;
    controller.start(true);
    nodes.mic.focus();
  });
  life.on(nodes.decline, "click", () => {
    view.asking = false;
    view.rerender();
    nodes.mic.focus();
  });
  life.on(nodes.preview, "input", () => controller.edit(nodes.preview.value));
  life.on(nodes.add, "click", () => controller.apply());
  life.on(nodes.discard, "click", () => controller.cancel());
}
function recognitionFactory(doc, createRecognition) {
  if (createRecognition) return createRecognition;
  const win = doc.defaultView ?? globalThis;
  const Recognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  return Recognition ? () => new Recognition() : void 0;
}
function createVoiceInput(host, { onApply, createRecognition, review = false, labels = {}, messages } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const words2 = { ...VOICE_LABELS, ...labels };
  const nodes = voiceNodes(doc, words2);
  host.append(nodes.root);
  const view = { review, consented: false, asking: false, contextKey: void 0, disabled: false, rerender: null };
  const controller = createVoiceDraft({
    onApply,
    messages,
    createRecognition: recognitionFactory(doc, createRecognition),
    onEnd: () => {
      if (!view.review) controller.apply();
    }
  });
  view.rerender = () => render3(nodes, controller.state, words2, view);
  life.add(controller.subscribe((state) => render3(nodes, state, words2, view)));
  life.add(() => controller.destroy());
  bindVoice(life, nodes, controller, view);
  const win = doc.defaultView;
  if (win?.addEventListener) life.on(win, "offline", () => controller.cancel());
  life.on(doc, "visibilitychange", () => {
    if (doc.hidden) controller.cancel();
  });
  return {
    update(model = {}) {
      if (life.dead) return;
      const disabled = model.disabled === true;
      if (model.contextKey !== view.contextKey || disabled && !view.disabled) {
        view.consented = false;
        view.asking = false;
      }
      view.contextKey = model.contextKey;
      view.disabled = disabled;
      controller.update({ contextKey: model.contextKey, disabled });
    },
    cancel() {
      if (!life.dead) controller.cancel();
    },
    destroy() {
      if (life.destroy()) nodes.root.remove();
    }
  };
}

// ui/composer.js
var CLASS26 = "cloudcanvas-ui-composer";
function composerNodes(doc, maxLength) {
  const root = el(doc, "div", { className: CLASS26 });
  const field = input(doc, { type: "textarea", label: "Compose", className: `${CLASS26}-input` });
  field.maxLength = maxLength;
  const actions = el(doc, "div", { className: `${CLASS26}-actions` });
  const voiceSlot = el(doc, "div", { className: `${CLASS26}-voice` });
  const cancel = button(doc, { className: `${CLASS26}-cancel`, label: "Cancel" });
  const submit2 = button(doc, { className: `${CLASS26}-submit is-primary`, label: "Send" });
  actions.append(voiceSlot, cancel, submit2);
  root.append(field, actions);
  return { root, field, voiceSlot, cancel, submit: submit2 };
}
function paint(nodes, state) {
  const blocked = state.disabled || state.pending || state.inFlight;
  nodes.field.disabled = state.disabled;
  nodes.field.readOnly = state.pending || state.inFlight;
  nodes.submit.disabled = blocked || nodes.field.value.trim() === "";
  nodes.cancel.disabled = blocked;
  nodes.root.classList.toggle("is-pending", state.pending || state.inFlight);
  state.voice?.update({ contextKey: state.contextKey, disabled: blocked });
}
function settle3(nodes, state, api, outcome) {
  state.inFlight = false;
  if (outcome.ok && outcome.value !== false) api.clear();
  else paint(nodes, state);
  if (!outcome.ok) (state.onError ?? globalThis.reportError ?? console.error)(outcome.error);
}
function submit(nodes, state, api) {
  const text2 = nodes.field.value.trim();
  if (text2 === "" || state.disabled || state.pending || state.inFlight || state.composing) return;
  let result;
  try {
    result = state.onSubmit?.(text2);
  } catch (error) {
    settle3(nodes, state, api, { ok: false, error });
    return;
  }
  if (typeof result?.then !== "function") {
    settle3(nodes, state, api, { ok: true, value: result });
    return;
  }
  state.inFlight = true;
  paint(nodes, state);
  result.then(
    (value) => {
      if (!state.life.dead) settle3(nodes, state, api, { ok: true, value });
    },
    (error) => {
      if (!state.life.dead) settle3(nodes, state, api, { ok: false, error });
    }
  );
}
function bindComposer(life, nodes, state, api) {
  life.on(nodes.field, "input", () => {
    paint(nodes, state);
    state.onChange?.(nodes.field.value);
  });
  life.on(nodes.field, "compositionstart", () => {
    state.composing = true;
  });
  life.on(nodes.field, "compositionend", () => {
    state.composing = false;
  });
  life.on(nodes.field, "keydown", (event) => {
    if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey) || event.isComposing) return;
    event.preventDefault();
    submit(nodes, state, api);
  });
  life.on(nodes.submit, "click", () => submit(nodes, state, api));
  life.on(nodes.cancel, "click", () => {
    if (state.disabled || state.pending || state.inFlight) return;
    api.clear();
    state.onCancel?.();
  });
}
function mountVoice(nodes, state, voice) {
  if (!voice) return null;
  const options = voice === true ? {} : voice;
  return createVoiceInput(nodes.voiceSlot, { ...options, onApply: (text2) => {
    if (state.life.dead || state.disabled || state.pending || state.inFlight) return;
    const current = nodes.field.value.trimEnd();
    nodes.field.value = current ? `${current}
${text2}` : text2;
    paint(nodes, state);
    state.onChange?.(nodes.field.value);
  } });
}
function writeModel5(nodes, state, model) {
  if (model.contextKey !== state.contextKey) {
    state.contextKey = model.contextKey;
    nodes.field.value = String(model.text ?? "");
    state.lastText = model.text;
  } else if (Object.hasOwn(model, "text") && model.text !== state.lastText) {
    nodes.field.value = String(model.text ?? "");
    state.lastText = model.text;
  }
  state.pending = model.pending === true;
  state.disabled = model.disabled === true;
  nodes.field.setAttribute("aria-label", String(model.label ?? "Compose"));
  nodes.field.placeholder = String(model.placeholder ?? "");
  writeText(nodes.submit.firstChild, model.submitLabel ?? "Send");
  writeText(nodes.cancel.firstChild, model.cancelLabel ?? "Cancel");
  nodes.cancel.hidden = model.showCancel === false;
}
function createComposer(host, options = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const nodes = composerNodes(doc, options.maxLength ?? 16e3);
  host.append(nodes.root);
  const state = {
    life,
    onChange: options.onChange,
    onSubmit: options.onSubmit,
    onCancel: options.onCancel,
    onError: options.onError,
    pending: false,
    disabled: false,
    inFlight: false,
    composing: false,
    contextKey: void 0,
    lastText: void 0,
    voice: null
  };
  const api = {
    update(model = {}) {
      if (life.dead) return;
      writeModel5(nodes, state, model);
      paint(nodes, state);
    },
    clear() {
      if (life.dead) return;
      nodes.field.value = "";
      state.voice?.cancel();
      paint(nodes, state);
      state.onChange?.("");
    },
    focus() {
      if (!life.dead) nodes.field.focus();
    },
    destroy() {
      if (life.destroy()) nodes.root.remove();
    }
  };
  state.voice = mountVoice(nodes, state, options.voice);
  if (state.voice) life.add(() => state.voice.destroy());
  bindComposer(life, nodes, state, api);
  paint(nodes, state);
  return api;
}

// ui/markdown-inline.js
var SAFE_SCHEMES = /* @__PURE__ */ new Set(["http", "https", "mailto", "tel"]);
var SCHEME = /^([a-z][a-z0-9+.-]*):/i;
var CONTROL = /[\u0000- \u007F-\u009F]/g;
var WORD = /[\p{L}\p{N}_]/u;
var URL_TAIL = /[.,;:!?)\]'"]+$/;
var MENTION = /^@([\p{L}\p{N}_][\p{L}\p{N}_.-]{0,63})/u;
var MAX_LINK_TEXT = 1e3;
var MAX_INLINE_DEPTH = 4;
function safeHref(value, { allowRelative = true } = {}) {
  const text2 = String(value ?? "").trim();
  if (text2 === "" || text2.length > 2048) return null;
  const probe = text2.replace(CONTROL, "");
  const scheme = SCHEME.exec(probe);
  if (scheme) {
    const name = scheme[1].toLowerCase();
    if (!SAFE_SCHEMES.has(name) || probe !== text2.replace(/\s/g, "")) return null;
    return { href: text2, external: name === "http" || name === "https" };
  }
  if (!allowRelative || probe.startsWith("//") || probe.startsWith("\\") || probe !== text2) return null;
  return { href: text2, external: false };
}
function finder(text2) {
  const cache = /* @__PURE__ */ new Map();
  return (token, from) => {
    const known = cache.get(token);
    if (known !== void 0 && (known === -1 || known >= from)) return known;
    const at = text2.indexOf(token, from);
    cache.set(token, at);
    return at;
  };
}
function appendLink(ctx, parent, label, target, title) {
  const safe = safeHref(target, ctx);
  if (!safe) {
    parent.append(ctx.doc.createTextNode(label));
    return;
  }
  const link = ctx.doc.createElement("a");
  link.setAttribute("href", safe.href);
  link.setAttribute("rel", "noopener noreferrer nofollow");
  if (safe.external && ctx.externalTarget !== false) link.setAttribute("target", "_blank");
  if (title) link.setAttribute("title", title);
  link.append(ctx.doc.createTextNode(label));
  parent.append(link);
}
function closingParen(text2, from) {
  let depth = 0;
  const limit = Math.min(text2.length, from + 2048);
  for (let j = from; j < limit; j += 1) {
    const char = text2[j];
    if (char === "\n") return -1;
    if (char === "(") depth += 1;
    else if (char === ")" && depth === 0) return j;
    else if (char === ")") depth -= 1;
  }
  return -1;
}
function readLink(text2, i, find) {
  const close3 = find("](", i + 1);
  if (close3 === -1 || close3 - i > MAX_LINK_TEXT || text2.slice(i + 1, close3).includes("\n")) return null;
  const end3 = closingParen(text2, close3 + 2);
  if (end3 === -1) return null;
  const inside = text2.slice(close3 + 2, end3).trim();
  const titled = /^(\S+)\s+"([^"]*)"$/.exec(inside);
  return { label: text2.slice(i + 1, close3), target: titled ? titled[1] : inside, title: titled?.[2] ?? "", next: end3 + 1 };
}
function readBareUrl(text2, i) {
  if (i > 0 && WORD.test(text2[i - 1])) return null;
  const head2 = text2.slice(i, i + 8).toLowerCase();
  if (!head2.startsWith("http://") && !head2.startsWith("https://")) return null;
  let end3 = i;
  while (end3 < text2.length && !/\s|</.test(text2[end3])) end3 += 1;
  const url = text2.slice(i, end3).replace(URL_TAIL, "");
  return url.length > 8 ? { url, next: i + url.length } : null;
}
function readMention(ctx, text2, i) {
  if (!ctx.mentions || i > 0 && WORD.test(text2[i - 1])) return null;
  const match = MENTION.exec(text2.slice(i, i + 66));
  if (!match) return null;
  const handle = match[1].replace(/[.-]+$/, "");
  const resolved = ctx.mentions(handle);
  return resolved ? { handle, resolved, next: i + 1 + handle.length } : null;
}
function appendMention(ctx, parent, { handle, resolved }) {
  const label = String(resolved.label ?? `@${handle}`);
  if (resolved.href && safeHref(resolved.href, ctx)) {
    appendLink(ctx, parent, label, resolved.href, "");
    return;
  }
  const span = ctx.doc.createElement("span");
  span.className = "cloudcanvas-ui-markdown-mention";
  span.setAttribute("data-mention", handle);
  span.append(ctx.doc.createTextNode(label));
  parent.append(span);
}
var WRAPS = /* @__PURE__ */ Object.freeze([["**", "strong"], ["__", "strong"], ["~~", "del"], ["*", "em"], ["_", "em"]]);
function readWrap(text2, i, find) {
  for (const [token, tag] of WRAPS) {
    if (!text2.startsWith(token, i)) continue;
    if (token[0] === "_" && i > 0 && WORD.test(text2[i - 1])) return null;
    const start3 = i + token.length;
    const end3 = find(token, start3 + 1);
    if (end3 === -1 || /\s/.test(text2[start3] ?? " ") || /\s/.test(text2[end3 - 1])) continue;
    if (token[0] === "_" && WORD.test(text2[end3 + token.length] ?? "")) continue;
    return { tag, inner: text2.slice(start3, end3), next: end3 + token.length };
  }
  return null;
}
function construct(ctx, text2, i, parent, depth, find) {
  const char = text2[i];
  if (char === "\\" && i + 1 < text2.length && /[\\`*_~[\]()@<>#!-]/.test(text2[i + 1])) {
    parent.append(ctx.doc.createTextNode(text2[i + 1]));
    return i + 2;
  }
  if (char === "`") {
    const end3 = find("`", i + 1);
    if (end3 === -1) return -1;
    const code = ctx.doc.createElement("code");
    code.append(ctx.doc.createTextNode(text2.slice(i + 1, end3)));
    parent.append(code);
    return end3 + 1;
  }
  if (char === "[") {
    const link = readLink(text2, i, find);
    if (!link) return -1;
    appendLink(ctx, parent, link.label, link.target, link.title);
    return link.next;
  }
  if (char === "<" && /^<https?:\/\/[^\s>]+>/i.test(text2.slice(i, i + 2050))) {
    const end3 = text2.indexOf(">", i);
    appendLink(ctx, parent, text2.slice(i + 1, end3), text2.slice(i + 1, end3), "");
    return end3 + 1;
  }
  return formatted(ctx, text2, i, parent, depth, find);
}
function formatted(ctx, text2, i, parent, depth, find) {
  const char = text2[i];
  if (char === "h" || char === "H") {
    const bare = readBareUrl(text2, i);
    if (!bare) return -1;
    appendLink(ctx, parent, bare.url, bare.url, "");
    return bare.next;
  }
  if (char === "@") {
    const mention = readMention(ctx, text2, i);
    if (!mention) return -1;
    appendMention(ctx, parent, mention);
    return mention.next;
  }
  if (depth >= MAX_INLINE_DEPTH || !"*_~".includes(char)) return -1;
  const wrap = readWrap(text2, i, find);
  if (!wrap) return -1;
  const node = ctx.doc.createElement(wrap.tag);
  appendInline(ctx, wrap.inner, node, depth + 1);
  parent.append(node);
  return wrap.next;
}
var TRIGGERS = "\\`[<hH@*_~";
function appendInline(ctx, text2, parent, depth = 0) {
  const find = finder(text2);
  let plain = "";
  let i = 0;
  while (i < text2.length) {
    const scratch = TRIGGERS.includes(text2[i]) ? ctx.doc.createDocumentFragment() : null;
    const next = scratch ? construct(ctx, text2, i, scratch, depth, find) : -1;
    if (next === -1) {
      plain += text2[i];
      i += 1;
      continue;
    }
    if (plain) parent.append(ctx.doc.createTextNode(plain));
    plain = "";
    parent.append(scratch);
    i = next;
  }
  if (plain) parent.append(ctx.doc.createTextNode(plain));
}

// ui/markdown.js
var CLASS27 = "cloudcanvas-ui-markdown";
var MAX_DEPTH = 6;
var FENCE = /^ {0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$/;
var HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
var RULE = /^ {0,3}([-*_])(\s*\1){2,}\s*$/;
var QUOTE = /^ {0,3}>\s?/;
var ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
var TASK = /^\[([ xX])\]\s+(.*)$/;
function isBlockStart(line) {
  return FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || ITEM.test(line);
}
function indentOf(line) {
  return line.length - line.trimStart().length;
}
function fenced(ctx, lines, i, parent) {
  const open = FENCE.exec(lines[i]);
  let end3 = i + 1;
  while (end3 < lines.length && !lines[end3].trim().startsWith(open[1])) end3 += 1;
  const pre = ctx.doc.createElement("pre");
  const code = ctx.doc.createElement("code");
  if (open[2]) code.setAttribute("data-language", open[2]);
  code.append(ctx.doc.createTextNode(lines.slice(i + 1, end3).join("\n")));
  pre.append(code);
  parent.append(pre);
  return Math.min(end3 + 1, lines.length);
}
function quote(ctx, lines, i, parent, depth, offset) {
  let end3 = i;
  while (end3 < lines.length && QUOTE.test(lines[end3])) end3 += 1;
  const node = ctx.doc.createElement("blockquote");
  renderBlocks(ctx, lines.slice(i, end3).map((line) => line.replace(QUOTE, "")), node, depth + 1, offset + i);
  parent.append(node);
  return end3;
}
function paragraph(ctx, lines, i, parent) {
  let end3 = i;
  while (end3 < lines.length && lines[end3].trim() !== "" && (end3 === i || !isBlockStart(lines[end3]))) end3 += 1;
  const node = ctx.doc.createElement("p");
  lines.slice(i, end3).forEach((line, index) => {
    if (index > 0) node.append(ctx.doc.createElement("br"));
    appendInline(ctx, line.trim(), node);
  });
  parent.append(node);
  return end3;
}
function listExtent(lines, i) {
  const base = indentOf(lines[i]);
  const ordered = /\d/.test(ITEM.exec(lines[i])[2]);
  let end3 = i + 1;
  while (end3 < lines.length) {
    const line = lines[end3];
    const item = ITEM.exec(line);
    if (item && indentOf(line) === base && /\d/.test(item[2]) === ordered) {
      end3 += 1;
      continue;
    }
    if (line.trim() === "" && end3 + 1 < lines.length && indentOf(lines[end3 + 1]) > base) {
      end3 += 1;
      continue;
    }
    if (line.trim() !== "" && indentOf(line) > base) {
      end3 += 1;
      continue;
    }
    break;
  }
  return { base, ordered, end: end3 };
}
function taskBox(ctx, checked, line) {
  const box = ctx.doc.createElement("input");
  box.type = "checkbox";
  box.checked = checked;
  box.className = `${CLASS27}-task`;
  box.setAttribute("data-line", String(line));
  box.disabled = !ctx.tasks;
  return box;
}
function listItem(ctx, lines, start3, end3, depth, offset, base) {
  const li = ctx.doc.createElement("li");
  const first = ITEM.exec(lines[start3])[3];
  const task = TASK.exec(first);
  const body = [task ? task[2] : first, ...lines.slice(start3 + 1, end3).map((line) => line.slice(Math.min(indentOf(line), base + 2)))];
  if (task) {
    li.className = `${CLASS27}-task-item`;
    const label = ctx.doc.createElement("label");
    label.append(taskBox(ctx, task[1] !== " ", offset + start3), ctx.doc.createTextNode(" "));
    appendInline(ctx, body[0], label);
    li.append(label);
    body.shift();
  }
  if (body.length === 1 && !isBlockStart(body[0])) appendInline(ctx, body[0].trim(), li);
  else if (body.length > 0) renderBlocks(ctx, body, li, depth + 1, offset + start3 + (task ? 1 : 0));
  return li;
}
function list(ctx, lines, i, parent, depth, offset) {
  const { base, ordered, end: end3 } = listExtent(lines, i);
  const node = ctx.doc.createElement(ordered ? "ol" : "ul");
  const number = Number.parseInt(ITEM.exec(lines[i])[2], 10);
  if (ordered && number !== 1) node.setAttribute("start", String(number));
  let start3 = i;
  for (let line = i + 1; line <= end3; line += 1) {
    const next = line < end3 ? ITEM.exec(lines[line]) : null;
    if (line === end3 || next && indentOf(lines[line]) === base) {
      node.append(listItem(ctx, lines, start3, line, depth, offset, base));
      start3 = line;
    }
  }
  parent.append(node);
  return end3;
}
function block(ctx, lines, i, parent, depth, offset) {
  const line = lines[i];
  if (FENCE.test(line)) return fenced(ctx, lines, i, parent);
  const heading = HEADING.exec(line);
  if (heading) {
    const level = Math.min(6, heading[1].length + ctx.headingOffset);
    const node = el(ctx.doc, `h${level}`);
    appendInline(ctx, heading[2], node);
    parent.append(node);
    return i + 1;
  }
  if (RULE.test(line)) {
    parent.append(ctx.doc.createElement("hr"));
    return i + 1;
  }
  if (QUOTE.test(line)) return quote(ctx, lines, i, parent, depth, offset);
  if (ITEM.test(line)) return list(ctx, lines, i, parent, depth, offset);
  return paragraph(ctx, lines, i, parent);
}
function renderBlocks(ctx, lines, parent, depth, offset) {
  if (depth > MAX_DEPTH) {
    parent.append(ctx.doc.createTextNode(lines.join("\n")));
    return;
  }
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === "") {
      i += 1;
      continue;
    }
    i = block(ctx, lines, i, parent, depth, offset);
  }
}
function renderMarkdown(source, options = {}) {
  const doc = options.doc ?? globalThis.document;
  const text2 = String(source ?? "").slice(0, options.maxLength ?? 1e5).replace(/\r\n?/g, "\n");
  const ctx = {
    doc,
    mentions: options.mentions,
    allowRelative: options.allowRelativeLinks !== false,
    externalTarget: options.externalTarget,
    headingOffset: Math.max(0, options.headingOffset ?? 0),
    tasks: options.tasks === true
  };
  const fragment = doc.createDocumentFragment();
  renderBlocks(ctx, text2.split("\n"), fragment, 0, 0);
  return fragment;
}
function toggleTaskLine(source, line, checked) {
  const lines = String(source ?? "").split("\n");
  const match = /^(\s*(?:[-*+]|\d{1,9}[.)])\s+\[)([ xX])(\].*)$/.exec(lines[line] ?? "");
  if (!match) return String(source ?? "");
  lines[line] = `${match[1]}${checked ? "x" : " "}${match[3]}`;
  return lines.join("\n");
}
function createMarkdownView(host, options = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS27 });
  host.append(root);
  let source = null;
  life.on(root, "change", (event) => {
    const box = event.target.closest?.(`.${CLASS27}-task`);
    if (box) options.onTaskToggle?.(Number(box.getAttribute("data-line")), box.checked);
  });
  return {
    update(model = {}) {
      if (life.dead || model.source === source) return;
      source = model.source ?? "";
      root.replaceChildren(renderMarkdown(source, { ...options, doc, tasks: typeof options.onTaskToggle === "function" }));
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}

// plugins/announce.js
var LIVE_REGION_CLASS = "cloudcanvas-live-region";
var HIDDEN_STYLE = "position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;";
var NBSP = " ";
function createLiveRegion(host) {
  if (typeof document === "undefined" || !host) return null;
  const region = document.createElement("div");
  region.className = LIVE_REGION_CLASS;
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  region.setAttribute("style", HIDDEN_STYLE);
  host.appendChild(region);
  return region;
}
function say(region, text2) {
  if (!region) return false;
  const message = text2 === null || text2 === void 0 ? "" : String(text2).trim();
  if (message === "") return false;
  region.textContent = region.textContent === message ? message + NBSP : message;
  return true;
}

// ui/kanban-keys.js
var CARD = ".cloudcanvas-ui-kanban-card";
function cardNodes(board) {
  return Array.from(board.lane.querySelectorAll(CARD));
}
function placeOf(board, cardId) {
  for (const column of board.model.columns) {
    const index = column.cards.findIndex((card) => card.id === cardId);
    if (index !== -1) return { columnId: column.id, index };
  }
  return null;
}
function focusCard(board, cardId, { move: move3 }) {
  const cards = cardNodes(board);
  const card = cards.find((node) => node.getAttribute("data-ui-id") === cardId) ?? null;
  board.state.focusId = card ? cardId : null;
  setTabStop(cards, card ?? cards[0] ?? null);
  if (move3) card?.focus();
}
function titleOf(board, cardId) {
  for (const column of board.model.columns) {
    const card = column.cards.find((entry) => entry.id === cardId);
    if (card) return String(card.title ?? card.id);
  }
  return cardId;
}
function columnAt(board, columnId) {
  const index = board.model.columns.findIndex((column) => column.id === columnId);
  return { index, column: board.model.columns[index] };
}
function rove(board, key, cardId) {
  const place2 = placeOf(board, cardId);
  if (!place2) return null;
  const { index: col, column } = columnAt(board, place2.columnId);
  if (key === "ArrowUp" || key === "ArrowDown" || key === "Home" || key === "End") {
    const last = column.cards.length - 1;
    const to = { ArrowUp: place2.index - 1, ArrowDown: place2.index + 1, Home: 0, End: last }[key];
    return column.cards[Math.max(0, Math.min(last, to))].id;
  }
  const step = key === "ArrowRight" ? 1 : -1;
  for (let next = col + step; next >= 0 && next < board.model.columns.length; next += step) {
    const cards = board.model.columns[next].cards;
    if (cards.length) return cards[Math.min(place2.index, cards.length - 1)].id;
  }
  return null;
}
function preview(board) {
  const grab = board.state.grab;
  const section = Array.from(board.lane.children).find((node) => node.getAttribute("data-column-id") === grab.columnId);
  const card = cardNodes(board).find((node) => node.getAttribute("data-ui-id") === grab.id);
  if (!section || !card) return;
  const list2 = section.lastChild;
  const others = Array.from(list2.children).filter((item) => item !== card.parentNode);
  list2.insertBefore(card.parentNode, others[grab.index] ?? null);
  card.focus();
  const { column } = columnAt(board, grab.columnId);
  const where = `${String(column.label ?? column.id)}, position ${grab.index + 1} of ${others.length + 1}`;
  const refusal = board.verdict(grab.id, grab.from, grab.columnId);
  section.classList.toggle("is-refused", refusal !== true);
  board.say(refusal === true ? where : `${where}. ${refusal}`);
}
function moveInHand(board, key) {
  const grab = board.state.grab;
  const { index: col } = columnAt(board, grab.columnId);
  if (key === "ArrowLeft" || key === "ArrowRight") {
    const next = board.model.columns[col + (key === "ArrowRight" ? 1 : -1)];
    if (!next) return;
    grab.columnId = next.id;
    const size = next.cards.filter((card) => card.id !== grab.id).length;
    grab.index = Math.min(grab.index, size);
  } else {
    const size = columnAt(board, grab.columnId).column.cards.filter((card) => card.id !== grab.id).length;
    grab.index = Math.max(0, Math.min(size, grab.index + (key === "ArrowDown" ? 1 : -1)));
  }
  preview(board);
}
function endGrab(board, drop) {
  const grab = board.state.grab;
  board.state.grab = null;
  for (const node of board.lane.querySelectorAll(".is-grabbed, .is-refused")) node.classList.remove("is-grabbed", "is-refused");
  if (drop && board.commit(grab.id, grab.from, grab.columnId, grab.index)) board.say(`Dropped ${titleOf(board, grab.id)}.`);
  else if (!drop) {
    board.render();
    board.say("Move cancelled.");
  }
  focusCard(board, grab.id, { move: true });
}
function startGrab(board, cardId, card) {
  const place2 = placeOf(board, cardId);
  if (!place2) return;
  board.state.grab = { id: cardId, from: place2.columnId, columnId: place2.columnId, index: place2.index };
  card.parentNode.classList.add("is-grabbed");
  board.say(`Picked up ${titleOf(board, cardId)}. Arrow keys move it, Space drops it, Escape cancels.`);
}
function onKeyDown(board, event) {
  const card = event.target.closest?.(CARD);
  if (!card) return;
  const cardId = card.getAttribute("data-ui-id");
  const arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  if (event.repeat && (event.key === " " || event.key === "Enter")) {
    event.preventDefault();
    return;
  }
  if (board.state.grab) {
    if (arrows.includes(event.key)) moveInHand(board, event.key);
    else if (event.key === " " || event.key === "Enter") endGrab(board, true);
    else if (event.key === "Escape" || event.key === "Tab") endGrab(board, false);
    else return;
    if (event.key !== "Tab") event.preventDefault();
    return;
  }
  if (event.key === " ") {
    event.preventDefault();
    startGrab(board, cardId, card);
    return;
  }
  const to = [...arrows, "Home", "End"].includes(event.key) ? rove(board, event.key, cardId) : null;
  if (to === null) return;
  event.preventDefault();
  focusCard(board, to, { move: true });
}
function bindBoardKeys(board) {
  board.verdict = (cardId, from, to) => board.moveVerdict(board.callbacks.canMove, cardId, from, to);
  board.life.on(board.lane, "keydown", (event) => onKeyDown(board, event));
  board.life.on(board.lane, "keyup", (event) => {
    if (event.key === " " && event.target.closest?.(CARD)) event.preventDefault();
  });
  board.life.on(board.lane, "focusin", (event) => {
    const card = event.target.closest?.(CARD);
    if (card && !board.state.grab) board.state.focusId = card.getAttribute("data-ui-id");
  });
}

// ui/kanban.js
var CLASS28 = "cloudcanvas-ui-kanban";
function cardNode(doc) {
  const item = el(doc, "li", { className: `${CLASS28}-item` });
  const card = el(doc, "button", { className: `${CLASS28}-card`, attrs: { type: "button", tabindex: "-1" } });
  card.append(
    el(doc, "span", { className: `${CLASS28}-title` }),
    el(doc, "span", { className: `${CLASS28}-detail` }),
    el(doc, "span", { className: `${CLASS28}-meta` })
  );
  item.append(card);
  return item;
}
function writeDetail(detail, card) {
  const when = card.time?.iso && card.time?.text ? card.time : null;
  detail.textContent = when ? "" : String(card.detail ?? "");
  if (when) {
    const node = detail.ownerDocument.createElement("time");
    node.setAttribute("datetime", String(when.iso));
    node.setAttribute("title", String(when.title ?? when.iso));
    node.textContent = String(when.text);
    detail.append(node);
  }
  detail.hidden = !when && !card.detail;
}
function writeCard(item, card, column, selectedId) {
  const button2 = item.firstChild;
  const [title, detail, meta] = button2.children;
  button2.setAttribute("data-ui-id", card.id);
  button2.setAttribute("data-column-id", column.id);
  if (card.tone) button2.setAttribute("data-tone", String(card.tone));
  else button2.removeAttribute("data-tone");
  title.textContent = String(card.title ?? "");
  writeDetail(detail, card);
  meta.textContent = String(card.meta ?? "");
  meta.hidden = !card.meta;
  markSelected(button2, card.id === selectedId);
}
function columnNode(doc, column) {
  const section = el(doc, "section", { className: `${CLASS28}-column` });
  const heading = el(doc, "h3", { className: `${CLASS28}-heading`, attrs: { id: uniqueId(CLASS28) } });
  heading.append(el(doc, "span", { className: `${CLASS28}-label` }), el(doc, "span", { className: `${CLASS28}-count` }));
  const list2 = el(doc, "ul", { className: `${CLASS28}-cards`, attrs: { role: "list" } });
  section.setAttribute("aria-labelledby", heading.id);
  section.append(heading, list2);
  section.setAttribute("data-column-id", column.id);
  return section;
}
function headingLabel(doc, heading, itemId) {
  const tag = itemId === null ? "span" : "button";
  let label = heading.firstChild;
  if (label.localName !== tag) {
    label = el(doc, tag, { className: `${CLASS28}-label`, attrs: { type: itemId === null ? null : "button" } });
    heading.firstChild.replaceWith(label);
  }
  if (itemId !== null) label.setAttribute("data-ui-id", itemId);
  return label;
}
function writeColumn(section, column, { doc, model }) {
  const heading = section.firstChild;
  const label = headingLabel(doc, heading, column.itemId);
  label.textContent = String(column.label ?? column.id);
  markSelected(label, column.itemId !== null && column.itemId === model.selectedId);
  heading.lastChild.textContent = String(column.cards.length);
  reconcileKeyedList(section.lastChild, column.cards, {
    key: (card) => card.id,
    create: () => cardNode(doc),
    update: (item, card) => writeCard(item, card, column, model.selectedId)
  });
}
function itemIdFor(column) {
  const id = column.itemId ?? null;
  if (id !== null && (typeof id !== "string" || id.trim() === "")) throw new TypeError(`Invalid item id for column ${column.id}: ${String(id)}`);
  return id;
}
function normalize(model) {
  const columns = uniqueItems(model.columns ?? [], "column").map((column) => ({ ...column, itemId: itemIdFor(column), cards: Array.isArray(column.cards) ? column.cards : [] }));
  uniqueItems(columns.flatMap((column) => column.cards), "card");
  return { ...model, selectedId: model.selectedId ?? null, columns };
}
function restoreFocus2(board, held) {
  const stays = held?.matches(`button.${CLASS28}-label`) === true && board.root.contains(held);
  focusCard(board, board.state.focusId, { move: held !== null && !stays });
  if (stays) keepFocus(board.root, held);
}
function render4(board, model) {
  const columns = model.columns;
  board.model = model;
  board.root.setAttribute("aria-label", String(model.label ?? "Board"));
  const held = board.root.contains(board.doc.activeElement) ? board.doc.activeElement : null;
  reconcileKeyedList(board.lane, columns, {
    key: (column) => column.id,
    create: (column) => columnNode(board.doc, column),
    update: (section, column) => writeColumn(section, column, board)
  });
  const ids = cardNodes(board).map((card) => card.getAttribute("data-ui-id"));
  if (!ids.includes(board.state.focusId)) board.state.focusId = ids.includes(model.selectedId) ? model.selectedId : ids[0] ?? null;
  restoreFocus2(board, held);
}
function dropAt(board, point, draggedId) {
  const hit = board.doc.elementFromPoint?.(point.x, point.y);
  const section = hit?.closest?.(`.${CLASS28}-column`);
  if (!section || !board.lane.contains(section)) return null;
  const cards = Array.from(section.querySelectorAll(`.${CLASS28}-card`)).filter((card) => card.getAttribute("data-ui-id") !== draggedId);
  const index = cards.findIndex((card) => {
    const box = card.getBoundingClientRect();
    return point.y < box.top + box.height / 2;
  });
  return { columnId: section.getAttribute("data-column-id"), index: index === -1 ? cards.length : index, section };
}
function moveVerdict(canMove, cardId, fromId, toId) {
  if (fromId === toId || typeof canMove !== "function") return true;
  const verdict = canMove(cardId, fromId, toId);
  if (verdict === true || verdict === void 0) return true;
  return typeof verdict === "string" && verdict.trim() ? verdict : "This move is not allowed.";
}
function clearDropMarks(board) {
  for (const node of board.lane.querySelectorAll(".is-drop-target, .is-refused")) node.classList.remove("is-drop-target", "is-refused");
}
function bindPointer(board) {
  trackDrag(board.life, board.lane, {
    selector: `.${CLASS28}-card`,
    onStart(card, point) {
      board.drag = { id: card.getAttribute("data-ui-id"), from: card.getAttribute("data-column-id"), origin: point, card };
      card.closest("li").classList.add("is-dragging");
    },
    onMove(point) {
      const drag = board.drag;
      drag.card.closest("li")?.style.setProperty("transform", `translate(${point.x - drag.origin.x}px, ${point.y - drag.origin.y}px)`);
      const lane = board.lane.getBoundingClientRect();
      if (point.x > lane.right - 32) board.lane.scrollLeft += 12;
      else if (point.x < lane.left + 32) board.lane.scrollLeft -= 12;
      clearDropMarks(board);
      const target = dropAt(board, point, drag.id);
      if (target) target.section.classList.add(moveVerdict(board.callbacks.canMove, drag.id, drag.from, target.columnId) === true ? "is-drop-target" : "is-refused");
    },
    onEnd(point) {
      const drag = board.drag;
      board.drag = null;
      drag.card.closest("li")?.classList.remove("is-dragging");
      drag.card.closest("li")?.style.removeProperty("transform");
      clearDropMarks(board);
      const target = point ? dropAt(board, point, drag.id) : null;
      if (target) board.commit(drag.id, drag.from, target.columnId, target.index);
      else board.render();
    }
  });
}
function createKanban(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: CLASS28, attrs: { role: "group", [CONTROL_ATTR]: true } });
  const lane = el(doc, "div", { className: `${CLASS28}-lane` });
  root.append(lane);
  host.append(root);
  const board = {
    doc,
    life,
    root,
    lane,
    callbacks,
    model: { selectedId: null, columns: [] },
    state: { focusId: null, grab: null },
    drag: null,
    region: createLiveRegion(root),
    moveVerdict
  };
  board.say = (text2) => say(board.region, text2);
  board.render = () => render4(board, board.model);
  board.commit = (cardId, from, to, index) => {
    const verdict = moveVerdict(callbacks.canMove, cardId, from, to);
    if (verdict !== true) {
      board.say(verdict);
      board.render();
      return false;
    }
    const here = placeOf(board, cardId);
    if (here && here.columnId === to && here.index === index) {
      board.render();
      return false;
    }
    callbacks.onMove?.(cardId, to, index);
    board.render();
    return true;
  };
  life.on(lane, "click", (event) => {
    const face = itemNodeOf(event.target, lane);
    if (face && !board.state.grab) callbacks.onActivate?.(itemIdOf(face));
  });
  bindBoardKeys(board);
  bindPointer(board);
  return {
    update(model = {}) {
      if (life.dead) return;
      board.model = normalize(model);
      if (!board.state.grab && !board.drag) board.render();
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}

// ui/item-more.js
var MORE_CLASS = "cloudcanvas-ui-item-more";
var MORE_WORDS = "More actions for {title}";
var MORE_HELD_WORDS = "Touch and hold, Shift+F10 or right-click for more";
var MORE_SHARE = 3;
function roomForMore(itemWidth, buttonWidth) {
  return !(itemWidth > 0 && buttonWidth * MORE_SHARE > itemWidth);
}
function moreButton(doc, className) {
  const node = el(doc, "button", { className: `${MORE_CLASS} ${className}`, attrs: { type: "button" } });
  node.append(createIcon(doc, "more"));
  return node;
}
function nameMore(node, words2, title) {
  const name = words2.replace("{title}", title);
  node.setAttribute("aria-label", name);
  node.setAttribute("title", name);
}
function isMore(target) {
  return Boolean(target?.closest?.(`.${MORE_CLASS}`));
}
function belowMore(node) {
  const rect = node.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom };
}

// ui/calendar/dates.js
var CALENDAR_VIEWS = /* @__PURE__ */ Object.freeze(["month", "week", "day"]);
function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return fromDayKey(value);
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function addDays(date, n) {
  const out = new Date(date.getTime());
  out.setDate(out.getDate() + n);
  return out;
}
function addMinutes(date, n) {
  const out = new Date(date.getTime());
  out.setMinutes(out.getMinutes() + n);
  return out;
}
function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function startOfWeek(date, weekStartsOn = 0) {
  const day = startOfDay(date);
  return addDays(day, -((day.getDay() - weekStartsOn + 7) % 7));
}
function dayKey(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function fromDayKey(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key ?? ""));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return dayKey(date) === key ? date : null;
}
function sameDay(a, b) {
  return dayKey(a) === dayKey(b);
}
function daysBetween(a, b) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 864e5);
}
function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}
function atMinutes(date, minutes) {
  const out = startOfDay(date);
  out.setMinutes(minutes);
  return out;
}
function monthGrid(anchor, weekStartsOn = 0) {
  const first = startOfWeek(startOfMonth(anchor), weekStartsOn);
  return Array.from({ length: 42 }, (_, index) => addDays(first, index));
}
function viewDays(view, anchor, weekStartsOn = 0) {
  if (view === "month") return monthGrid(anchor, weekStartsOn);
  if (view === "week") {
    const first = startOfWeek(anchor, weekStartsOn);
    return Array.from({ length: 7 }, (_, index) => addDays(first, index));
  }
  return [startOfDay(anchor)];
}
function shiftAnchor(view, anchor, delta) {
  if (view === "month") return addMonths(anchor, delta);
  return addDays(startOfDay(anchor), delta * (view === "week" ? 7 : 1));
}
function touchesDay(start3, end3, day) {
  const from = startOfDay(day);
  const to = addDays(from, 1);
  const last = end3 && end3 > start3 ? end3 : new Date(start3.getTime() + 1);
  return start3 < to && last > from;
}

// ui/calendar/model.js
var DEFAULT_EVENT_MINUTES = 60;
function normalizeEvent(event) {
  const id = event?.id;
  if (typeof id !== "string" || id.trim() === "") throw new TypeError("Calendar event needs a string id");
  const start3 = toDate(event.start);
  if (!start3) throw new TypeError(`Calendar event ${id} has no valid start`);
  const end3 = event.end === void 0 || event.end === null ? null : toDate(event.end);
  if (end3 === null && event.end !== void 0 && event.end !== null) throw new TypeError(`Calendar event ${id} has an invalid end`);
  return {
    id,
    start: start3,
    end: end3 && end3 > start3 ? end3 : null,
    allDay: event.allDay === true,
    title: String(event.title ?? id),
    tone: event.tone ? String(event.tone) : "",
    movable: event.movable !== false
  };
}
function normalizeEvents(events) {
  if (!Array.isArray(events)) throw new TypeError("Calendar events must be an array");
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const event of events.map(normalizeEvent)) {
    if (seen.has(event.id)) throw new TypeError(`Duplicate calendar event id: ${event.id}`);
    seen.add(event.id);
    out.push(event);
  }
  return out.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
}
function eventById(cal, id) {
  return cal.state.events.find((event) => event.id === id) ?? null;
}
function endOf(event) {
  if (event.end) return event.end;
  return event.allDay ? addDays(startOfDay(event.start), 1) : addMinutes(event.start, DEFAULT_EVENT_MINUTES);
}
function isAllDayLike(event) {
  return event.allDay || dayKey(event.start) !== dayKey(addMinutes(endOf(event), -1));
}
function eventsByDay(events, days2) {
  const map = new Map(days2.map((day) => [dayKey(day), []]));
  for (const event of events) {
    for (const day of days2) if (touchesDay(event.start, endOf(event), day)) map.get(dayKey(day)).push(event);
  }
  return map;
}
function layoutLanes(events) {
  const ends = [];
  const placed = events.map((event) => {
    const start3 = minutesOfDay(event.start);
    const stop = Math.max(start3 + 15, start3 + (endOf(event) - event.start) / 6e4);
    let lane = ends.findIndex((end3) => end3 <= start3);
    if (lane === -1) lane = ends.length;
    ends[lane] = stop;
    return { event, lane, start: start3, stop };
  });
  return { placed, lanes: Math.max(1, ends.length) };
}
function formattersFor(locale) {
  const make = (options) => new Intl.DateTimeFormat(locale, options);
  return {
    title: { month: make({ month: "long", year: "numeric" }), day: make({ weekday: "long", month: "long", day: "numeric", year: "numeric" }) },
    weekday: make({ weekday: "short" }),
    weekdayLong: make({ weekday: "long" }),
    dayNumber: make({ day: "numeric" }),
    dayHead: make({ weekday: "short", day: "numeric" }),
    full: make({ weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    time: make({ hour: "numeric", minute: "2-digit" }),
    hour: make({ hour: "numeric" })
  };
}
function titleFor(view, days2, format) {
  if (view === "day") return format.title.day.format(days2[0]);
  if (view === "month") return format.title.month.format(days2[15]);
  const first = days2[0];
  const last = days2[days2.length - 1];
  return format.title.month.formatRange?.(first, last) ?? format.title.month.format(first);
}
function describeEvent(event, format) {
  if (isAllDayLike(event)) return `${event.title}, ${format.full.format(event.start)}, all day`;
  return `${event.title}, ${format.full.format(event.start)}, ${format.time.format(event.start)} to ${format.time.format(endOf(event))}`;
}

// ui/calendar/month.js
var CAL = "cloudcanvas-ui-calendar";
var MONTH_CHIPS = 3;
function eventChip(cal, event, { showTime }) {
  const { doc, format } = cal;
  const name = describeEvent(event, format);
  const chip = el(doc, "button", { className: `${CAL}-event`, attrs: {
    type: "button",
    "data-ui-id": event.id,
    "aria-label": name,
    title: name,
    tabindex: "-1",
    "data-tone": event.tone || null,
    "data-movable": event.movable ? "true" : null
  } });
  if (showTime && !isAllDayLike(event)) chip.append(el(doc, "span", { className: `${CAL}-event-time`, text: format.time.format(event.start) }));
  chip.append(el(doc, "span", { className: `${CAL}-event-title`, text: event.title }));
  if (cal.state.pending?.id === event.id) chip.classList.add("is-grabbed");
  markSelected(chip, event.id === cal.state.selectedId);
  return chip;
}
function weekdayRow(cal, days2) {
  const row = el(cal.doc, "div", { className: `${CAL}-weekdays`, attrs: { role: "row" } });
  for (const day of days2.slice(0, 7)) {
    row.append(el(cal.doc, "div", {
      className: `${CAL}-weekday`,
      text: cal.format.weekday.format(day),
      attrs: { role: "columnheader", "aria-label": cal.format.weekdayLong.format(day) }
    }));
  }
  return row;
}
function dayCell(cal, day, events) {
  const { doc, state, format } = cal;
  const key = dayKey(day);
  const cell = el(doc, "div", { className: `${CAL}-cell`, attrs: { role: "gridcell", "data-date": key } });
  cell.classList.toggle("is-outside", day.getMonth() !== state.anchor.getMonth());
  cell.classList.toggle("is-today", sameDay(day, state.now));
  const count = events.length ? `, ${events.length} event${events.length === 1 ? "" : "s"}` : "";
  cell.append(el(doc, "button", { className: `${CAL}-day`, text: format.dayNumber.format(day), attrs: {
    type: "button",
    "data-date": key,
    tabindex: "-1",
    "aria-label": `${format.full.format(day)}${count}`,
    "aria-current": sameDay(day, state.now) ? "date" : null
  } }));
  const list2 = el(doc, "div", { className: `${CAL}-events` });
  for (const event of events.slice(0, MONTH_CHIPS)) list2.append(eventChip(cal, event, { showTime: true }));
  if (events.length > MONTH_CHIPS) {
    list2.append(el(doc, "button", { className: `${CAL}-more`, text: `+${events.length - MONTH_CHIPS}`, attrs: {
      type: "button",
      "data-open-day": key,
      tabindex: "-1",
      "aria-label": `Show all ${events.length} events on ${format.full.format(day)}`
    } }));
  }
  cell.append(list2);
  return cell;
}
function renderMonth(cal, days2, events) {
  const grid = el(cal.doc, "div", { className: `${CAL}-month`, attrs: { role: "grid", "aria-label": cal.title } });
  grid.append(weekdayRow(cal, days2));
  const byDay = eventsByDay(events, days2);
  for (let week = 0; week < 6; week += 1) {
    const row = el(cal.doc, "div", { className: `${CAL}-week`, attrs: { role: "row" } });
    for (const day of days2.slice(week * 7, week * 7 + 7)) row.append(dayCell(cal, day, byDay.get(dayKey(day))));
    grid.append(row);
  }
  cal.body.replaceChildren(grid);
}

// ui/calendar/time.js
function head(cal, days2) {
  const row = el(cal.doc, "div", { className: `${CAL}-time-head` });
  row.append(el(cal.doc, "div", { className: `${CAL}-gutter` }));
  for (const day of days2) {
    const today = sameDay(day, cal.state.now);
    const button2 = el(cal.doc, "button", { className: `${CAL}-day-head`, text: cal.format.dayHead.format(day), attrs: {
      type: "button",
      "data-date": dayKey(day),
      tabindex: "-1",
      "aria-label": cal.format.full.format(day),
      "aria-current": today ? "date" : null
    } });
    button2.classList.toggle("is-today", today);
    row.append(button2);
  }
  return row;
}
function allDayStrip(cal, days2, byDay) {
  const row = el(cal.doc, "div", { className: `${CAL}-allday` });
  row.append(el(cal.doc, "div", { className: `${CAL}-gutter`, text: cal.labels.allDay }));
  for (const day of days2) {
    const cell = el(cal.doc, "div", { className: `${CAL}-allday-cell`, attrs: { "data-date": dayKey(day) } });
    for (const event of byDay.get(dayKey(day)).filter(isAllDayLike)) cell.append(eventChip(cal, event, { showTime: false }));
    row.append(cell);
  }
  return row;
}
function hourLabels(cal) {
  const column = el(cal.doc, "div", { className: `${CAL}-hours`, attrs: { "aria-hidden": "true" } });
  const base = new Date(2e3, 0, 1);
  for (let hour = cal.state.hours.start; hour < cal.state.hours.end; hour += 1) {
    base.setHours(hour, 0, 0, 0);
    column.append(el(cal.doc, "div", { className: `${CAL}-hour`, text: cal.format.hour.format(base) }));
  }
  return column;
}
function placeChip(cal, chip, slot, lanes) {
  const from = cal.state.hours.start * 60;
  const to = cal.state.hours.end * 60;
  const top = Math.max(0, Math.min(to - from - 15, slot.start - from));
  const length = Math.max(15, Math.min(to, slot.stop) - Math.max(from, slot.start));
  chip.style.setProperty("--calendar-top", String(top));
  chip.style.setProperty("--calendar-length", String(length));
  chip.style.setProperty("--calendar-lane", String(slot.lane));
  chip.style.setProperty("--calendar-lanes", String(lanes));
}
function dayColumn(cal, day, events) {
  const column = el(cal.doc, "div", { className: `${CAL}-column`, attrs: { "data-date": dayKey(day) } });
  column.classList.toggle("is-today", sameDay(day, cal.state.now));
  const timed = events.filter((event) => !isAllDayLike(event));
  const { placed, lanes } = layoutLanes(timed);
  for (const slot of placed) {
    const chip = eventChip(cal, slot.event, { showTime: true });
    chip.classList.add(`${CAL}-timed`);
    if (slot.event.movable && typeof cal.callbacks.onMove === "function") chip.append(el(cal.doc, "span", { className: `${CAL}-event-handle`, attrs: { "aria-hidden": "true" } }));
    placeChip(cal, chip, slot, lanes);
    column.append(chip);
  }
  return column;
}
function initialScroll(cal, scroller, grid, events, previous) {
  const key = `${cal.state.view}:${dayKey(cal.state.anchor)}`;
  if (cal.scrolledFor === key) {
    if (previous !== null) scroller.scrollTop = previous;
    return;
  }
  cal.scrolledFor = key;
  const hours = cal.state.hours.end - cal.state.hours.start;
  const hourHeight = grid.getBoundingClientRect().height / hours;
  if (!(hourHeight > 0)) return;
  const first = events.find((event) => !isAllDayLike(event));
  const target = Math.max(cal.state.hours.start, first ? first.start.getHours() : 8);
  scroller.scrollTop = (target - cal.state.hours.start) * hourHeight;
}
function renderTimeGrid(cal, days2, events) {
  const wrap = el(cal.doc, "div", { className: `${CAL}-time`, attrs: { role: "group", "aria-label": cal.title } });
  wrap.style.setProperty("--calendar-days", String(days2.length));
  const byDay = eventsByDay(events, days2);
  const scroller = el(cal.doc, "div", { className: `${CAL}-scroller`, attrs: { tabindex: "0", role: "group", "aria-label": cal.labels.hours } });
  const grid = el(cal.doc, "div", { className: `${CAL}-time-grid` });
  grid.style.setProperty("--calendar-hours", String(cal.state.hours.end - cal.state.hours.start));
  grid.append(hourLabels(cal), ...days2.map((day) => dayColumn(cal, day, byDay.get(dayKey(day)))));
  scroller.append(grid);
  wrap.append(head(cal, days2), allDayStrip(cal, days2, byDay), scroller);
  const previous = cal.body.querySelector(`.${CAL}-scroller`)?.scrollTop ?? null;
  cal.body.replaceChildren(wrap);
  initialScroll(cal, scroller, grid, events, previous);
}
function minutesAt(cal, column, clientY, { slot = false, edge = false } = {}) {
  const rect = column.getBoundingClientRect();
  const hours = cal.state.hours.end - cal.state.hours.start;
  if (!(rect.height > 0)) return null;
  const raw = cal.state.hours.start * 60 + (clientY - rect.top) / rect.height * hours * 60;
  const snap = cal.state.snap;
  const snapped = (slot ? Math.floor(raw / snap) : Math.round(raw / snap)) * snap;
  const last = cal.state.hours.end * 60 - (edge ? 0 : snap);
  return Math.max(cal.state.hours.start * 60, Math.min(last, snapped));
}

// ui/draw-keys.js
function isDrawKey(event) {
  return (event.key === "n" || event.key === "N") && !event.ctrlKey && !event.metaKey && !event.altKey;
}
function asSentence(line) {
  return `${line.split(" · ").join(", ")}.`;
}
function cancelOnLeave(life, container, { active, cancel }) {
  life.on(container, "pointerdown", () => {
    if (active()) cancel();
  }, { capture: true });
  life.on(container, "focusout", () => {
    if (!active()) return;
    life.later(() => {
      if (active() && !container.contains(container.ownerDocument.activeElement)) cancel();
    }, 0);
  });
}

// ui/calendar/more.js
var PLACE = Object.freeze(["--calendar-top", "--calendar-lane", "--calendar-lanes", "--calendar-length"]);
function chipOf(cal, id) {
  return Array.from(cal.body.querySelectorAll(`.${CAL}-event`)).find((chip) => chip.getAttribute("data-ui-id") === id) ?? null;
}
function placeInList(button2, chip) {
  const row = Array.from(chip.parentElement.children).filter((node) => node !== button2).indexOf(chip) + 1;
  button2.style.setProperty("grid-row", `${row} / ${row + 1}`);
  for (const name of PLACE) button2.style.removeProperty(name);
}
function placeInColumn(button2, chip) {
  button2.style.removeProperty("grid-row");
  for (const name of PLACE) button2.style.setProperty(name, chip.style.getPropertyValue(name));
}
var PRESS_MS = 400;
function dropMore(cal, chip) {
  const held = cal.more !== void 0 && cal.doc.activeElement === cal.more;
  cal.more?.remove();
  chip?.classList.remove("is-holding-more");
  if (held) chip?.focus({ preventScroll: true });
}
function syncMore(cal) {
  const { state } = cal;
  const taken = typeof cal.callbacks.onMenu === "function" && !state.pending && !state.creating;
  const chip = taken && state.selectedId !== null ? chipOf(cal, state.selectedId) : null;
  if (cal.pressing && chip) return;
  for (const node of cal.body.querySelectorAll(".is-holding-more")) if (node !== chip) node.classList.remove("is-holding-more");
  cal.crowded = false;
  if (!chip) {
    dropMore(cal, null);
    return;
  }
  cal.more ??= moreButton(cal.doc, `${CAL}-more-actions`);
  nameMore(cal.more, cal.labels.more, state.events.find((event) => event.id === state.selectedId)?.title ?? "");
  cal.more.setAttribute("data-more-for", state.selectedId);
  const timed = chip.classList.contains(`${CAL}-timed`);
  cal.more.classList.toggle("is-timed", timed);
  if (cal.more.previousElementSibling !== chip) chip.after(cal.more);
  (timed ? placeInColumn : placeInList)(cal.more, chip);
  cal.crowded = !roomForMore(chip.getBoundingClientRect().width, cal.more.getBoundingClientRect().width);
  if (cal.crowded) dropMore(cal, chip);
  else chip.classList.add("is-holding-more");
}
function pressMore(cal, target) {
  if (!isMore(target)) return false;
  const button2 = target.closest(`.${MORE_CLASS}`);
  cal.callbacks.onMenu?.(button2.getAttribute("data-more-for"), belowMore(button2));
  return true;
}
function bindMore(cal) {
  const end3 = () => {
    if (!cal.pressing) return;
    cal.pressing = false;
    syncMore(cal);
  };
  cal.life.on(cal.body, "pointerdown", () => {
    cal.pressing = true;
  }, { capture: true });
  cal.life.on(cal.body, "click", end3);
  cal.life.on(cal.body, "pointerup", () => cal.life.later(end3, PRESS_MS));
  cal.life.on(cal.body, "pointercancel", end3);
}

// ui/calendar/resize.js
var EDGE3 = `.${CAL}-event-handle`;
var CHIP2 = `.${CAL}-event`;
function resizable(cal, event) {
  return Boolean(event) && event.movable && cal.state.view !== "month" && !isAllDayLike(event) && typeof cal.callbacks.onMove === "function";
}
function endAt(cal, event, minutes) {
  const least = minutesOfDay(event.start) + cal.state.snap;
  const end3 = atMinutes(event.start, Math.min(cal.state.hours.end * 60, Math.max(minutes, least)));
  return end3.getTime() === endOf(event).getTime() ? event.end : end3;
}
function startResize(cal, handle) {
  const event = eventById(cal, handle.closest(CHIP2).getAttribute("data-ui-id"));
  if (!resizable(cal, event)) return false;
  const times = { start: event.start, end: event.end, allDay: event.allDay };
  cal.state.pending = { id: event.id, keyboard: false, mode: "resize", original: times, times, offset: 0 };
  return true;
}
function moveEdge(cal, point) {
  const { pending } = cal.state;
  const event = eventById(cal, pending.id);
  const column = cal.body.querySelector(`.${CAL}-column[data-date="${dayKey(event.start)}"]`);
  const minutes = column ? minutesAt(cal, column, point.y, { edge: true }) : null;
  if (minutes === null) return;
  const end3 = endAt(cal, event, minutes);
  if ((end3?.getTime() ?? null) === (pending.times.end?.getTime() ?? null)) return;
  pending.times = { ...pending.times, end: end3 };
  cal.render();
}
function finishResize(cal, drop) {
  const { pending } = cal.state;
  cal.state.pending = null;
  const changed = (pending.times.end?.getTime() ?? null) !== (pending.original.end?.getTime() ?? null);
  if (drop && changed) {
    cal.callbacks.onMove(pending.id, { ...pending.times });
    cal.say(`${cal.labels.resized} ${describeEvent({ ...eventById(cal, pending.id), ...pending.times }, cal.format)}.`);
  }
  cal.render();
}
function resizeKey(cal, chip, event) {
  const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
  const item = eventById(cal, chip.getAttribute("data-ui-id"));
  if (!event.altKey || !event.shiftKey || step === void 0 || !resizable(cal, item)) return false;
  event.preventDefault();
  const current = Math.round((endOf(item) - startOfDay(item.start)) / 6e4);
  const end3 = endAt(cal, item, current + step * cal.state.snap);
  if (!end3 || end3.getTime() === endOf(item).getTime()) return true;
  const times = { start: item.start, end: end3, allDay: item.allDay };
  cal.callbacks.onMove(item.id, times);
  cal.say(`${cal.labels.resized} ${describeEvent({ ...item, ...times }, cal.format)}.`);
  return true;
}
function bindResize(cal) {
  trackDrag(cal.life, cal.body, {
    selector: EDGE3,
    canStart: () => !cal.state.pending,
    onStart(handle) {
      startResize(cal, handle);
    },
    onMove(point) {
      if (cal.state.pending?.mode === "resize") moveEdge(cal, point);
    },
    onEnd(point) {
      if (cal.state.pending?.mode === "resize") finishResize(cal, point !== null);
    }
  });
}

// ui/calendar/hint.js
function eventVerbs(cal, event) {
  const { labels, callbacks: cb } = cal;
  const moves = event.movable && typeof cb.onMove === "function";
  return [
    cb.onActivate && labels.hintOpen,
    moves && labels.hintMove,
    resizable(cal, event) && labels.hintResize,
    resizable(cal, event) && labels.hintKeys,
    cb.onMenu && (cal.crowded ? labels.hintMoreHeld : labels.hintMore)
  ];
}
function startVerbs(cal) {
  const add = cal.state.view === "month" ? cal.labels.hintCreateDays : cal.labels.hintCreate;
  return [cal.labels.hintNone, cal.callbacks.onPick && add, cal.callbacks.onMenu && cal.labels.hintMore, cal.callbacks.onPick && cal.labels.hintDraw];
}
function drawingHint(cal, { kind, anchor }) {
  const { labels } = cal;
  if (kind === "days") return anchor === null ? labels.hintDrawDays : labels.hintDrawDaysEnd;
  return anchor === null ? labels.hintDrawTime : labels.hintDrawTimeEnd;
}
function hintOf(cal) {
  if (cal.state.drawing) return drawingHint(cal, cal.state.drawing);
  const event = eventById(cal, cal.state.selectedId);
  const verbs = event ? eventVerbs(cal, event) : startVerbs(cal);
  return verbs.filter(Boolean).join(" · ");
}
function paint2(cal) {
  for (const chip of cal.body.querySelectorAll(`.${CAL}-event`)) markSelected(chip, chip.getAttribute("data-ui-id") === cal.state.selectedId);
  syncMore(cal);
  const hint = hintOf(cal);
  writeText(cal.hintText, hint);
  cal.hint.hidden = hint === "";
}
function select(cal, id) {
  if (cal.state.selectedId === id) return;
  cal.state.selectedId = id;
  paint2(cal);
}

// ui/calendar/draw.js
var START_HOUR = 8;
var kindOf2 = (cal) => cal.state.view === "month" ? "days" : "time";
function slots(cal) {
  const { at, anchor } = cal.state.drawing;
  const from = Math.min(at, anchor ?? at);
  return { from, to: Math.min(cal.state.hours.end * 60, Math.max(at, anchor ?? at) + cal.state.snap) };
}
function days(cal) {
  const here = dayKey(cal.state.focusDate);
  return [cal.state.drawing.anchor ?? here, here].sort();
}
function words(cal, { day = false } = {}) {
  const { format } = cal;
  if (cal.state.drawing.kind === "days") {
    const [first, last] = days(cal).map(fromDayKey);
    return first.getTime() === last.getTime() ? format.full.format(first) : `${format.full.format(first)} to ${format.full.format(last)}`;
  }
  const { from, to } = slots(cal);
  const { at, anchor } = cal.state.drawing;
  const time = (minutes) => format.time.format(atMinutes(cal.state.focusDate, minutes));
  const when = anchor === null ? time(at) : `${time(from)} to ${time(to)}`;
  return day ? `${format.full.format(cal.state.focusDate)}, ${when}` : when;
}
function firstShownSlot(cal) {
  const { hours, snap } = cal.state;
  const scroller = cal.body.querySelector(`.${CAL}-scroller`);
  const height = scroller?.querySelector(`.${CAL}-time-grid`)?.getBoundingClientRect().height ?? 0;
  const minutes = height > 0 ? hours.start * 60 + scroller.scrollTop / height * (hours.end - hours.start) * 60 : START_HOUR * 60;
  return clamp(Math.ceil(minutes / snap) * snap, hours.start * 60, hours.end * 60 - snap);
}
function keepInView(cal) {
  const scroller = cal.body.querySelector(`.${CAL}-scroller`);
  const height = scroller?.querySelector(`.${CAL}-time-grid`)?.getBoundingClientRect().height ?? 0;
  const shown = scroller?.clientHeight || 0;
  if (!(height > 0) || !(shown > 0)) return;
  const perMinute = height / ((cal.state.hours.end - cal.state.hours.start) * 60);
  const top = (cal.state.drawing.at - cal.state.hours.start * 60) * perMinute;
  const bottom = top + cal.state.snap * perMinute;
  if (top < scroller.scrollTop) scroller.scrollTop = top;
  else if (bottom > scroller.scrollTop + shown) scroller.scrollTop = bottom - shown;
}
function placeBand(cal) {
  cal.drawBand?.remove();
  const key = dayKey(cal.state.focusDate);
  const column = Array.from(cal.body.querySelectorAll(`.${CAL}-column`)).find((node) => node.getAttribute("data-date") === key);
  if (!column) return;
  const { from, to } = slots(cal);
  const band = el(cal.doc, "div", { className: `${CAL}-draft is-keyboard`, attrs: { "aria-hidden": "true" } });
  band.style.setProperty("--calendar-top", String(from - cal.state.hours.start * 60));
  band.style.setProperty("--calendar-length", String(to - from));
  const time = (minutes) => cal.format.time.format(atMinutes(cal.state.focusDate, minutes));
  band.textContent = `${time(from)} – ${time(to)}`;
  column.append(band);
  cal.drawBand = band;
}
function lightDays(cal, range) {
  const [first, last] = range ?? ["", ""];
  for (const cell of cal.body.querySelectorAll(`.${CAL}-cell`)) {
    const day = cell.getAttribute("data-date");
    cell.classList.toggle("is-range", range !== null && day >= first && day <= last);
  }
}
function paintDraw(cal) {
  const drawing = cal.state.drawing;
  if (!drawing) return;
  if (drawing.kind !== kindOf2(cal)) {
    cancelDraw(cal);
    return;
  }
  if (drawing.kind === "days") lightDays(cal, days(cal));
  else placeBand(cal);
}
function end(cal) {
  cal.drawBand?.remove();
  cal.drawBand = null;
  lightDays(cal, null);
  cal.state.drawing = null;
  paint2(cal);
}
function cancelDraw(cal) {
  if (!cal.state.drawing) return;
  end(cal);
  cal.say(cal.labels.drawCancelled);
}
function startDraw(cal, day) {
  if (typeof cal.callbacks.onPick !== "function" || cal.state.pending || cal.state.creating) return false;
  cal.state.focusDate = fromDayKey(day.getAttribute("data-date")) ?? cal.state.focusDate;
  const kind = kindOf2(cal);
  cal.state.drawing = { kind, at: kind === "time" ? firstShownSlot(cal) : null, anchor: null };
  paintDraw(cal);
  if (kind === "time") keepInView(cal);
  paint2(cal);
  const when = kind === "time" ? words(cal, { day: true }) : words(cal);
  cal.say(`${cal.labels.drawStart.replace("{when}", when)} ${asSentence(hintOf(cal))}`);
  return true;
}
function sayDraw(cal) {
  if (cal.state.drawing) cal.say(words(cal, { day: cal.state.drawing.kind === "time" }));
}
function anchorOrAdd(cal) {
  const drawing = cal.state.drawing;
  if (drawing.anchor === null) {
    drawing.anchor = drawing.kind === "time" ? drawing.at : dayKey(cal.state.focusDate);
    paint2(cal);
    const start3 = drawing.kind === "time" ? cal.format.time.format(atMinutes(cal.state.focusDate, drawing.at)) : words(cal);
    cal.say(`${cal.labels.drawAnchor.replace("{when}", start3)} ${asSentence(hintOf(cal))}`);
    return;
  }
  const said = cal.labels.drawn.replace("{range}", words(cal, { day: true }));
  const range = drawing.kind === "days" ? daysRange(days(cal)) : timeRange(cal);
  end(cal);
  cal.callbacks.onPick(range);
  cal.say(said);
}
var daysRange = ([first, last]) => ({ date: first, start: fromDayKey(first), end: addDays(fromDayKey(last), 1), allDay: true });
function timeRange(cal) {
  const { from, to } = slots(cal);
  return { date: dayKey(cal.state.focusDate), start: atMinutes(cal.state.focusDate, from), end: atMinutes(cal.state.focusDate, to) };
}
function stepSlot(cal, step) {
  const { hours, snap } = cal.state;
  cal.state.drawing.at = clamp(cal.state.drawing.at + step * snap, hours.start * 60, hours.end * 60 - snap);
  placeBand(cal);
  keepInView(cal);
  cal.say(words(cal));
}
var DAY_KEYS = /* @__PURE__ */ new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]);
function drawKey(cal, event) {
  const drawing = cal.state.drawing;
  const slot = drawing.kind === "time" ? { ArrowUp: -1, ArrowDown: 1 }[event.key] : void 0;
  if ((event.key === " " || event.key === "Enter") && event.repeat) {
    event.preventDefault();
    return true;
  }
  if (slot !== void 0) stepSlot(cal, slot);
  else if (DAY_KEYS.has(event.key)) {
    if (drawing.kind === "days" || drawing.anchor === null) return false;
  } else if (event.key === " " || event.key === "Enter") {
    cal.spaceTaken = event.key === " ";
    anchorOrAdd(cal);
  } else if (event.key === "Escape" || event.key === "Tab") cancelDraw(cal);
  else return true;
  if (event.key !== "Tab") event.preventDefault();
  return true;
}
function bindDraw(cal) {
  cancelOnLeave(cal.life, cal.body, { active: () => cal.state.drawing !== null, cancel: () => cancelDraw(cal) });
}

// ui/calendar/range.js
var COLUMN = `.${CAL}-column`;
var CELL = `.${CAL}-cell, .${CAL}-allday-cell`;
function empty(item, target) {
  return target === item || item.matches(CELL) && target.classList.contains(`${CAL}-events`);
}
function startSpan(cal, column, point) {
  const from = minutesAt(cal, column, point.y, { slot: true });
  if (from === null) return null;
  const band = el(cal.doc, "div", { className: `${CAL}-draft`, attrs: { "aria-hidden": "true" } });
  column.append(band);
  return { kind: "time", column, band, from, date: column.getAttribute("data-date"), range: null };
}
function drawSpan(cal, creating, point) {
  const here = minutesAt(cal, creating.column, point.y, { slot: true });
  if (here === null) return;
  const start3 = Math.min(creating.from, here);
  const end3 = Math.min(cal.state.hours.end * 60, Math.max(creating.from, here) + cal.state.snap);
  const { band } = creating;
  band.style.setProperty("--calendar-top", String(start3 - cal.state.hours.start * 60));
  band.style.setProperty("--calendar-length", String(end3 - start3));
  const day = fromDayKey(creating.date);
  band.textContent = `${cal.format.time.format(atMinutes(day, start3))} – ${cal.format.time.format(atMinutes(day, end3))}`;
  creating.range = { date: creating.date, start: atMinutes(day, start3), end: atMinutes(day, end3) };
}
function startDays(cal, cell) {
  const key = cell.getAttribute("data-date");
  return { kind: "days", from: key, range: null, lit: [] };
}
function drawDays(cal, creating, point) {
  const key = cal.doc.elementFromPoint?.(point.x, point.y)?.closest?.("[data-date]")?.getAttribute("data-date") ?? creating.from;
  const [first, last] = [creating.from, key].sort();
  for (const node of cal.body.querySelectorAll(`${CELL}`)) {
    const day = node.getAttribute("data-date");
    node.classList.toggle("is-range", day >= first && day <= last);
  }
  creating.range = { date: first, start: fromDayKey(first), end: addDays(fromDayKey(last), 1), allDay: true };
}
function endRange(cal, point) {
  const creating = cal.state.creating;
  cal.state.creating = null;
  creating.band?.remove();
  for (const node of cal.body.querySelectorAll(".is-range")) node.classList.remove("is-range");
  if (point !== null && creating.range) cal.callbacks.onPick({ ...creating.range });
  cal.render();
}
function bindRange(cal) {
  trackDrag(cal.life, cal.body, {
    selector: `${COLUMN}, ${CELL}`,
    canStart: (item, event) => typeof cal.callbacks.onPick === "function" && !cal.state.pending && empty(item, event.target),
    onStart(item, point) {
      cal.state.creating = item.matches(COLUMN) ? startSpan(cal, item, point) : startDays(cal, item);
    },
    onMove(point) {
      const creating = cal.state.creating;
      if (!creating) return;
      if (creating.kind === "time") drawSpan(cal, creating, point);
      else drawDays(cal, creating, point);
    },
    onEnd(point) {
      if (cal.state.creating) endRange(cal, point);
    }
  });
}

// ui/calendar/interact.js
var CHIP3 = `.${CAL}-event`;
var DAY = `.${CAL}-day, .${CAL}-day-head`;
function pick(cal, key, start3) {
  const date = fromDayKey(key);
  if (!date) return;
  cal.state.focusDate = date;
  cal.callbacks.onPick?.(start3 ? { date: key, start: start3 } : { date: key });
}
function onClick(cal, event) {
  if (cal.state.pending) return;
  const target = event.target;
  if (pressMore(cal, target)) return;
  const chip = target.closest?.(CHIP3);
  if (chip) {
    select(cal, chip.getAttribute("data-ui-id"));
    cal.callbacks.onActivate?.(chip.getAttribute("data-ui-id"));
    return;
  }
  const more = target.closest?.(`.${CAL}-more`);
  if (more && cal.state.views.includes("day")) {
    cal.navigate("day", fromDayKey(more.getAttribute("data-open-day")), { focus: true });
    return;
  }
  const day = target.closest?.(DAY);
  if (day) {
    pick(cal, day.getAttribute("data-date"));
    return;
  }
  const column = target.closest?.(`.${CAL}-column`);
  if (column && target === column) {
    const minutes = minutesAt(cal, column, event.clientY);
    const key = column.getAttribute("data-date");
    pick(cal, key, minutes === null ? void 0 : atMinutes(fromDayKey(key), minutes));
    return;
  }
  const cell = target.closest?.(`.${CAL}-cell, .${CAL}-allday-cell`);
  if (cell && (target === cell || target.classList.contains(`${CAL}-events`))) pick(cal, cell.getAttribute("data-date"));
}
function dayTarget(cal, key) {
  const { view, focusDate, weekStartsOn } = cal.state;
  const steps = view === "month" ? { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } : { ArrowLeft: -1, ArrowRight: 1 };
  if (Object.hasOwn(steps, key)) return addDays(focusDate, steps[key]);
  if (key === "Home") return startOfWeek(focusDate, weekStartsOn);
  if (key === "End") return addDays(startOfWeek(focusDate, weekStartsOn), 6);
  if (key !== "PageUp" && key !== "PageDown") return null;
  const shifted = shiftAnchor(view, focusDate, key === "PageUp" ? -1 : 1);
  if (view !== "month") return shifted;
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  return new Date(shifted.getFullYear(), shifted.getMonth(), Math.min(focusDate.getDate(), lastDay));
}
function focusDay(cal, date) {
  const visible = viewDays(cal.state.view, cal.state.anchor, cal.state.weekStartsOn).some((day) => sameDay(day, date));
  if (!visible) {
    cal.navigate(cal.state.view, date, { focus: true });
    return;
  }
  cal.state.focusDate = date;
  cal.focusAfter = { day: true };
  cal.render();
}
function follow(cal, date) {
  const visible = viewDays(cal.state.view, cal.state.anchor, cal.state.weekStartsOn).some((day) => sameDay(day, date));
  cal.focusAfter = { eventId: cal.state.pending.id };
  if (visible) {
    cal.render();
    return;
  }
  cal.navigate(cal.state.view, date, { focus: false });
  cal.focusAfter = null;
}
function shiftTimes(times, { days: days2 = 0, minutes = 0 }) {
  const move3 = (date) => date ? addMinutes(addDays(date, days2), minutes) : null;
  return { ...times, start: move3(times.start), end: move3(times.end) };
}
function startGrab2(cal, chip, keyboard) {
  const event = eventById(cal, chip.getAttribute("data-ui-id"));
  if (!event?.movable) return false;
  const times = { start: event.start, end: event.end, allDay: event.allDay };
  cal.state.pending = { id: event.id, keyboard, original: times, times, offset: 0 };
  if (keyboard) cal.say(`Picked up ${event.title}. Arrow keys move it, Space drops it, Escape cancels.`);
  return true;
}
function finishGrab(cal, drop) {
  const pending = cal.state.pending;
  cal.state.pending = null;
  cal.focusAfter = pending.keyboard ? { eventId: pending.id } : null;
  const moved = pending.times.start.getTime() !== pending.original.start.getTime();
  if (drop && moved) {
    cal.callbacks.onMove?.(pending.id, { ...pending.times });
    cal.say(`Moved to ${describeEvent({ ...eventById(cal, pending.id), ...pending.times }, cal.format)}.`);
  } else if (pending.keyboard) {
    cal.say(drop ? "Not moved." : "Move cancelled.");
  }
  cal.render();
}
function grabKey(cal, event) {
  const pending = cal.state.pending;
  const timed = cal.state.view !== "month" && !isAllDayLike({ ...eventById(cal, pending.id), ...pending.times });
  const vertical = cal.state.view === "month" ? { days: 7 } : timed ? { minutes: cal.state.snap } : null;
  const moves = { ArrowLeft: { days: -1 }, ArrowRight: { days: 1 } };
  if (vertical) {
    moves.ArrowDown = vertical;
    moves.ArrowUp = { days: -(vertical.days ?? 0), minutes: -(vertical.minutes ?? 0) };
  }
  if (event.key === " " || event.key === "Enter") finishGrab(cal, true);
  else if (event.key === "Escape" || event.key === "Tab") finishGrab(cal, false);
  else if (Object.hasOwn(moves, event.key)) {
    pending.times = shiftTimes(pending.times, moves[event.key]);
    follow(cal, pending.times.start);
    cal.say(describeEvent({ ...eventById(cal, pending.id), ...pending.times }, cal.format));
  } else return;
  if (event.key !== "Tab") event.preventDefault();
}
function onKeyDown2(cal, event) {
  if (event.repeat && (event.key === " " || event.key === "Enter") && event.target.closest?.(CHIP3)) {
    event.preventDefault();
    return;
  }
  if (cal.state.pending?.keyboard) {
    grabKey(cal, event);
    return;
  }
  if (cal.state.drawing && drawKey(cal, event)) return;
  const chip = event.target.closest?.(CHIP3);
  if (chip && (resizeKey(cal, chip, event) || menuKey(cal, chip, event))) return;
  if (chip && event.key === " ") {
    event.preventDefault();
    if (startGrab2(cal, chip, true)) {
      cal.focusAfter = { eventId: cal.state.pending.id };
      cal.render();
    } else cal.say("This event cannot be moved.");
    return;
  }
  const day = event.target.closest?.(DAY);
  if (!day) return;
  if (!cal.state.drawing && isDrawKey(event) && startDraw(cal, day)) {
    event.preventDefault();
    return;
  }
  cal.state.focusDate = fromDayKey(day.getAttribute("data-date")) ?? cal.state.focusDate;
  const target = dayTarget(cal, event.key);
  if (!target) return;
  event.preventDefault();
  focusDay(cal, target);
  sayDraw(cal);
}
function dropTimes(cal, point) {
  const hit = cal.doc.elementFromPoint?.(point.x, point.y);
  const pending = cal.state.pending;
  const dated = hit?.closest?.("[data-date]");
  if (!dated || !cal.body.contains(dated)) return null;
  const date = fromDayKey(dated.getAttribute("data-date"));
  const original = pending.original;
  let start3 = addDays(original.start, daysBetween(original.start, date));
  const column = hit.closest(`.${CAL}-column`);
  if (column && !isAllDayLike({ ...eventById(cal, pending.id), ...original })) {
    const minutes = minutesAt(cal, column, point.y);
    if (minutes !== null) start3 = atMinutes(date, Math.max(0, minutes - pending.offset));
  }
  const end3 = original.end ? new Date(start3.getTime() + (original.end - original.start)) : null;
  return { ...original, start: start3, end: end3 };
}
function bindDrag2(cal) {
  trackDrag(cal.life, cal.body, {
    selector: `${CHIP3}[data-movable]`,
    canStart: (chip, event) => !cal.state.pending && !event.target.closest?.(`.${CAL}-event-handle`),
    onStart(chip, point) {
      if (!startGrab2(cal, chip, false)) return;
      const column = chip.closest(`.${CAL}-column`);
      const grabbed = column ? minutesAt(cal, column, point.y) : null;
      cal.state.pending.offset = grabbed === null ? 0 : grabbed - minutesOfDay(cal.state.pending.original.start);
      chip.classList.add("is-grabbed");
    },
    onMove(point) {
      const next = cal.state.pending && dropTimes(cal, point);
      if (!next || next.start.getTime() === cal.state.pending.times.start.getTime()) return;
      cal.state.pending.times = next;
      cal.render();
    },
    onEnd(point) {
      if (cal.state.pending) finishGrab(cal, point !== null);
    }
  });
}
function menuKey(cal, chip, event) {
  if (typeof cal.callbacks.onMenu !== "function" || !(event.key === "ContextMenu" || event.key === "F10" && event.shiftKey)) return false;
  event.preventDefault();
  const rect = chip.getBoundingClientRect();
  cal.callbacks.onMenu(chip.getAttribute("data-ui-id"), { x: rect.left, y: rect.bottom });
  return true;
}
function onContextMenu(cal, event) {
  const chip = event.target.closest?.(CHIP3);
  if (!chip || typeof cal.callbacks.onMenu !== "function") return;
  event.preventDefault();
  cal.callbacks.onMenu(chip.getAttribute("data-ui-id"), { x: event.clientX, y: event.clientY });
}
function onFocusIn(cal, event) {
  const chip = event.target.closest?.(CHIP3);
  if (chip && !cal.drawing && !cal.state.pending) select(cal, chip.getAttribute("data-ui-id"));
}
function bindCalendar(cal) {
  cal.life.on(cal.body, "click", (event) => onClick(cal, event));
  cal.life.on(cal.body, "keydown", (event) => onKeyDown2(cal, event));
  cal.life.on(cal.body, "contextmenu", (event) => onContextMenu(cal, event));
  cal.life.on(cal.body, "focusin", (event) => onFocusIn(cal, event));
  cal.life.on(cal.body, "keyup", (event) => {
    if (event.key === " " && (event.target.closest?.(CHIP3) || cal.spaceTaken)) event.preventDefault();
    if (event.key === " ") cal.spaceTaken = false;
  });
  bindDraw(cal);
  bindDrag2(cal);
  bindResize(cal);
  bindRange(cal);
  bindMore(cal);
}

// ui/calendar/calendar.js
var CALENDAR_LABELS = /* @__PURE__ */ Object.freeze({
  previous: "Previous",
  next: "Next",
  today: "Today",
  allDay: "All day",
  views: "View",
  month: "Month",
  week: "Week",
  day: "Day",
  hours: "Hours",
  resized: "Now",
  hintNone: "Select an event to see what it can do",
  hintCreate: "drag across empty slots to add one",
  hintCreateDays: "drag across days to add one",
  hintOpen: "Enter opens",
  hintMove: "drag to move",
  hintResize: "drag the bottom edge to resize",
  hintKeys: "Alt+Shift+Up or Down resizes",
  hintDraw: "N on a day draws one",
  hintMore: "Shift+F10 or right-click for more",
  hintMoreHeld: MORE_HELD_WORDS,
  more: MORE_WORDS,
  hintDrawTime: "Up and Down move the time · Left and Right the day · Enter or Space starts the range · Escape cancels",
  hintDrawTimeEnd: "Up and Down set the end · Enter or Space adds the range · Escape cancels",
  hintDrawDays: "The arrows move the day · Enter or Space starts the range · Escape cancels",
  hintDrawDaysEnd: "The arrows set the end · Enter or Space adds the range · Escape cancels",
  drawStart: "Drawing a range: {when}.",
  drawAnchor: "Starts {when}.",
  drawn: "Range drawn: {range}.",
  drawCancelled: "No range drawn."
});
function toolbar(cal) {
  const { doc, labels, life } = cal;
  const bar = el(doc, "div", { className: `${CAL}-toolbar` });
  const nav = el(doc, "div", { className: `${CAL}-nav` });
  nav.append(
    button(doc, { className: `${CAL}-prev`, label: "‹", ariaLabel: labels.previous, signal: life.signal, onClick: () => cal.shift(-1) }),
    button(doc, { className: `${CAL}-today`, label: labels.today, signal: life.signal, onClick: () => cal.navigate(cal.state.view, startOfDay(/* @__PURE__ */ new Date()), { focus: false }) }),
    button(doc, { className: `${CAL}-next`, label: "›", ariaLabel: labels.next, signal: life.signal, onClick: () => cal.shift(1) })
  );
  const title = el(doc, "h2", { className: `${CAL}-title`, attrs: { "aria-live": "polite" } });
  cal.titleText = textNode(doc, title);
  cal.viewGroup = el(doc, "div", { className: `${CAL}-views`, attrs: { role: "group", "aria-label": labels.views } });
  bar.append(nav, title, cal.viewGroup);
  return bar;
}
function writeViews(cal) {
  const { views } = cal.state;
  const group = cal.viewGroup;
  const stands = Array.from(group.children, (node) => node.getAttribute("data-view")).join() === views.join();
  const held = !stands && group.contains(cal.doc.activeElement) ? cal.doc.activeElement.getAttribute("data-view") : null;
  if (!stands) {
    group.replaceChildren(...views.map((view) => button(cal.doc, {
      className: `${CAL}-view`,
      label: "",
      signal: cal.life.signal,
      attrs: { "data-view": view },
      onClick: () => cal.navigate(view, cal.state.focusDate, { focus: false })
    })));
  }
  for (const node of group.children) {
    const view = node.getAttribute("data-view");
    writeText(node.firstChild, cal.labels[view] ?? view);
    node.setAttribute("aria-pressed", String(view === cal.state.view));
    if (view === held) node.focus({ preventScroll: true });
  }
}
function writeTabStops(cal) {
  const key = dayKey(cal.state.focusDate);
  const days2 = Array.from(cal.body.querySelectorAll(`.${CAL}-day, .${CAL}-day-head`));
  const target = days2.find((node) => node.getAttribute("data-date") === key) ?? days2.find((node) => !node.closest(".is-outside")) ?? days2[0];
  for (const node of days2) node.setAttribute("tabindex", node === target ? "0" : "-1");
  const focusKey = target?.getAttribute("data-date");
  for (const node of cal.body.querySelectorAll(`.${CAL}-event, .${CAL}-more`)) {
    node.setAttribute("tabindex", node.closest("[data-date]")?.getAttribute("data-date") === focusKey ? "0" : "-1");
  }
}
function heldFocus(cal) {
  const held = cal.doc.activeElement;
  if (!held || !cal.body.contains(held)) return null;
  if (held.matches(`.${CAL}-event`)) return { eventId: held.getAttribute("data-ui-id"), keep: true };
  if (held.matches(`.${CAL}-day, .${CAL}-day-head`)) return { day: true, keep: true };
  return held.matches(`.${CAL}-scroller`) ? { scroller: true, keep: true } : null;
}
function restoreFocus3(cal) {
  const want = cal.focusAfter;
  cal.focusAfter = null;
  if (!want) return;
  const options = want.keep ? { preventScroll: true } : void 0;
  if (want.scroller) {
    cal.body.querySelector(`.${CAL}-scroller`)?.focus(options);
    return;
  }
  const selector = want.eventId ? `.${CAL}-event` : `.${CAL}-day, .${CAL}-day-head`;
  const match = Array.from(cal.body.querySelectorAll(selector)).find((node) => want.eventId ? node.getAttribute("data-ui-id") === want.eventId : node.getAttribute("data-date") === dayKey(cal.state.focusDate));
  if (match) {
    match.setAttribute("tabindex", "0");
    match.focus(options);
  }
}
function render5(cal) {
  const { state } = cal;
  if (cal.focusAfter === null) cal.focusAfter = heldFocus(cal);
  const heldMore = cal.more !== void 0 && cal.doc.activeElement === cal.more;
  const days2 = viewDays(state.view, state.anchor, state.weekStartsOn);
  if (!days2.some((day) => sameDay(day, state.focusDate))) state.focusDate = startOfDay(state.view === "month" ? state.anchor : days2[0]);
  cal.title = titleFor(state.view, days2, cal.format);
  writeText(cal.titleText, cal.title);
  writeViews(cal);
  const pending = state.pending;
  const events = pending ? state.events.map((event) => event.id === pending.id ? { ...event, ...pending.times } : event) : state.events;
  cal.root.setAttribute("data-view", state.view);
  if (state.view === "month") renderMonth(cal, days2, events);
  else renderTimeGrid(cal, days2, events);
  paintDraw(cal);
  writeTabStops(cal);
  cal.drawing = true;
  restoreFocus3(cal);
  cal.drawing = false;
  paint2(cal);
  if (heldMore) cal.more.focus({ preventScroll: true });
  return days2;
}
function applyModel(cal, model) {
  const { state } = cal;
  state.views = (Array.isArray(model.views) ? model.views : CALENDAR_VIEWS).filter((view) => CALENDAR_VIEWS.includes(view));
  if (state.views.length === 0) throw new TypeError("Calendar needs at least one of month, week, day");
  if (model.view !== cal.last.view && state.views.includes(model.view)) state.view = model.view;
  if (!state.views.includes(state.view)) state.view = state.views[0];
  const date = model.date === void 0 ? null : toDate(model.date);
  if (model.date !== void 0 && !date) throw new TypeError(`Calendar date is not a date: ${String(model.date)}`);
  if (date && dayKey(date) !== cal.last.date) {
    state.anchor = startOfDay(date);
    state.focusDate = state.anchor;
  }
  cal.last = { view: model.view, date: date ? dayKey(date) : cal.last.date, selectedId: cal.last.selectedId };
  state.events = normalizeEvents(model.events ?? []);
  const selectedId = model.selectedId ?? null;
  if (selectedId !== cal.last.selectedId) {
    cal.last.selectedId = selectedId;
    state.selectedId = selectedId;
  }
  state.weekStartsOn = Number.isInteger(model.weekStartsOn) ? (model.weekStartsOn % 7 + 7) % 7 : 0;
  state.now = toDate(model.now) ?? /* @__PURE__ */ new Date();
  state.snap = Number.isInteger(model.snapMinutes) && model.snapMinutes > 0 && model.snapMinutes <= 240 ? model.snapMinutes : 15;
  const start3 = Number.isInteger(model.hours?.start) ? clamp(model.hours.start, 0, 23) : 0;
  const end3 = Number.isInteger(model.hours?.end) ? clamp(model.hours.end, 1, 24) : 24;
  state.hours = end3 > start3 ? { start: start3, end: end3 } : { start: 0, end: 24 };
  if (model.locale !== state.locale || !cal.format) {
    state.locale = model.locale;
    cal.format = formattersFor(model.locale);
  }
  cal.root.setAttribute("aria-label", String(model.label ?? "Calendar"));
}
function createRecord(host, callbacks, labels) {
  const doc = documentOf(host);
  const life = createLife();
  const root = el(doc, "div", { className: CAL, attrs: { role: "region", [CONTROL_ATTR]: true } });
  const today = startOfDay(/* @__PURE__ */ new Date());
  const cal = {
    doc,
    life,
    root,
    callbacks,
    labels: { ...CALENDAR_LABELS, ...labels },
    format: null,
    last: {},
    focusAfter: null,
    state: { view: "month", anchor: today, focusDate: today, events: [], views: [...CALENDAR_VIEWS], pending: null, creating: null, drawing: null, selectedId: null }
  };
  root.append(toolbar(cal));
  cal.hint = el(doc, "p", { className: `${CAL}-hint` });
  cal.hintText = textNode(doc, cal.hint);
  root.append(cal.hint);
  cal.body = el(doc, "div", { className: `${CAL}-body` });
  root.append(cal.body);
  cal.region = createLiveRegion(root);
  cal.say = (text2) => say(cal.region, text2);
  cal.render = () => render5(cal);
  return cal;
}
function watchWidth2(cal) {
  const Observer = cal.doc.defaultView?.ResizeObserver;
  if (typeof Observer !== "function") return;
  const observer = new Observer(() => {
    if (!cal.life.dead && !cal.pressing && !cal.state.pending && !cal.state.creating) paint2(cal);
  });
  observer.observe(cal.body);
  cal.life.add(() => observer.disconnect());
}
function createCalendar(host, callbacks = {}) {
  const cal = createRecord(host, callbacks, callbacks.labels);
  injectUiStyles(cal.doc);
  cal.navigate = (view, date, { focus }) => {
    cal.state.view = view;
    cal.state.anchor = startOfDay(date);
    cal.state.focusDate = startOfDay(date);
    if (focus) cal.focusAfter = { day: true };
    const days2 = cal.render();
    callbacks.onNavigate?.({ view, date: dayKey(cal.state.anchor), start: days2[0], end: addDays(days2[days2.length - 1], 1) });
  };
  cal.shift = (delta) => cal.navigate(cal.state.view, shiftAnchor(cal.state.view, cal.state.anchor, delta), { focus: false });
  bindCalendar(cal);
  watchWidth2(cal);
  host.append(cal.root);
  return {
    update(model = {}) {
      if (cal.life.dead) return;
      applyModel(cal, model);
      if (!cal.state.pending && !cal.state.creating) cal.render();
    },
    /**
     * Make `date` the day the calendar keeps - its one tab stop, and the day a redraw gives the focus back to - and focus it; a
     * day not on show is navigated to first (`onNavigate`). False for what is not a date, and while an event is in hand.
     */
    focusDay(date) {
      const day = toDate(date);
      if (cal.life.dead || !day || cal.state.pending || cal.state.creating) return false;
      focusDay(cal, startOfDay(day));
      return true;
    },
    destroy() {
      if (cal.life.destroy()) cal.root.remove();
    }
  };
}

// ui/timeline/model.js
var TL = "cloudcanvas-ui-timeline";
var TIMELINE_SCALES = /* @__PURE__ */ Object.freeze({
  day: { perDay: 64, pad: 2 },
  week: { perDay: 20, pad: 7 },
  month: { perDay: 5, pad: 31 }
});
var DAY_MS = 864e5;
var STATUS_TONES = /* @__PURE__ */ Object.freeze(["success", "warning", "danger", "muted"]);
var SCALE_ORDER = /* @__PURE__ */ Object.freeze(["day", "week", "month"]);
function groupOf(item) {
  const { group } = item;
  if (group === null || typeof group !== "object") {
    const id2 = typeof item.groupId === "string" && item.groupId.trim() !== "" ? item.groupId : null;
    return { group: group ? String(group) : "", groupId: id2, collapsed: false };
  }
  const id = group.id ?? null;
  if (id !== null && (typeof id !== "string" || id.trim() === "")) throw new TypeError(`Timeline item ${item.id} has a group with an invalid id: ${String(id)}`);
  return { group: String(group.label ?? id ?? ""), groupId: id, collapsed: group.collapsed === true };
}
function statusOf(status) {
  const object = status !== null && typeof status === "object";
  const label = String((object ? status.label : status) ?? "");
  return { status: label, statusTone: object && STATUS_TONES.includes(status.tone) ? status.tone : "" };
}
function dependsOf(item) {
  const ids = Array.isArray(item.depends) ? item.depends.filter((id) => typeof id === "string" && id !== item.id) : [];
  return [...new Set(ids)];
}
function normalizeItem(item, id) {
  const start3 = toDate(item.start);
  if (!start3) throw new TypeError(`Timeline item ${id} has no valid start`);
  const end3 = item.end === void 0 || item.end === null ? null : toDate(item.end);
  if (item.end !== void 0 && item.end !== null && !end3) throw new TypeError(`Timeline item ${id} has an invalid end`);
  const progress = Number.isFinite(item.progress) ? Math.min(1, Math.max(0, item.progress)) : null;
  return {
    id,
    title: String(item.title ?? id),
    start: start3,
    end: end3 && end3 > start3 && item.milestone !== true ? end3 : null,
    ...groupOf(item),
    ...statusOf(item.status),
    depends: dependsOf(item),
    tone: item.tone ? String(item.tone) : "",
    progress,
    movable: item.movable !== false
  };
}
function normalizeItems(items) {
  if (!Array.isArray(items)) throw new TypeError("Timeline items must be an array");
  const seen = /* @__PURE__ */ new Set();
  return items.map((item) => {
    const id = item?.id;
    if (typeof id !== "string" || id.trim() === "" || seen.has(id)) throw new TypeError(`Invalid or duplicate timeline id: ${String(id)}`);
    seen.add(id);
    return normalizeItem(item, id);
  });
}
function domainFor(items, scale, now) {
  const { pad } = TIMELINE_SCALES[scale];
  let first = startOfDay(now);
  let last = startOfDay(now);
  for (const item of items) {
    if (item.start < first) first = startOfDay(item.start);
    const end3 = item.end ?? item.start;
    if (end3 > last) last = startOfDay(end3);
  }
  return { start: addDays(first, -pad), end: addDays(last, pad + 1) };
}
function daysIn(domain) {
  return Math.round((domain.end.getTime() - domain.start.getTime()) / DAY_MS);
}
function xOf(date, domain, scale) {
  return (date.getTime() - domain.start.getTime()) / DAY_MS * TIMELINE_SCALES[scale].perDay;
}
function widthOf(domain, scale) {
  return xOf(domain.end, domain, scale);
}
var MIN_BAR_PX = 20;
function barOf(item, domain, scale) {
  const left = xOf(item.start, domain, scale);
  if (!item.end) return { left, width: 0, point: true };
  const width = xOf(item.end, domain, scale) - left;
  return width < MIN_BAR_PX ? { left, width: MIN_BAR_PX, point: false, clamped: true } : { left, width, point: false };
}
function tickDates(domain, scale, weekStartsOn = 1) {
  const ticks = [];
  let date = scale === "month" ? startOfMonth(domain.start) : scale === "week" ? startOfWeek(domain.start, weekStartsOn) : domain.start;
  while (date < domain.end) {
    if (date >= domain.start) ticks.push(date);
    date = scale === "month" ? addMonths(date, 1) : addDays(date, scale === "week" ? 7 : 1);
  }
  return ticks;
}
function shiftItem(times, days2, mode = "move") {
  const how = mode === true ? "end" : mode === false ? "move" : mode;
  if (how === "end") {
    const end3 = addDays(times.end ?? times.start, days2);
    return { start: times.start, end: end3 > times.start ? end3 : times.end ?? null };
  }
  if (how === "start") {
    const start3 = addDays(times.start, days2);
    return times.end && start3 < times.end ? { start: start3, end: times.end } : { start: times.start, end: times.end ?? null };
  }
  return { start: addDays(times.start, days2), end: times.end ? addDays(times.end, days2) : null };
}
function dayAt(x, scale) {
  return Math.floor(x / TIMELINE_SCALES[scale].perDay);
}
function stepScale(scale, step) {
  const at = SCALE_ORDER.indexOf(scale) + step;
  return SCALE_ORDER[Math.max(0, Math.min(SCALE_ORDER.length - 1, at))];
}
function dateAt(x, domain, scale) {
  return new Date(domain.start.getTime() + x / TIMELINE_SCALES[scale].perDay * DAY_MS);
}

// ui/timeline/gutter.js
var GUTTER_MIN = 64;
var GUTTER_MAX = 480;
var GUTTER_STEP = 16;
var GUTTER_STEP_BIG = 64;
var GUTTER_DEFAULT = 160;
var TRACK_MIN = 96;
var HANDLE = `.${TL}-gutter-handle`;
function limitOf(tl) {
  const room = tl.sheet.clientWidth > 0 ? tl.sheet.clientWidth - TRACK_MIN : GUTTER_MAX;
  return Math.max(GUTTER_MIN, Math.min(GUTTER_MAX, room));
}
function widthNow(tl) {
  if (tl.state.gutter !== null) return tl.state.gutter;
  const measured = tl.gutterNode?.parentElement?.getBoundingClientRect().width ?? 0;
  return measured > 0 ? measured : GUTTER_DEFAULT;
}
function writeHandle(tl) {
  const node = tl.gutterNode;
  if (!node) return;
  node.setAttribute("aria-valuenow", String(Math.round(widthNow(tl))));
  node.setAttribute("aria-valuemax", String(Math.round(limitOf(tl))));
}
function applyGutter(tl, px) {
  const width = Math.round(clamp(px, GUTTER_MIN, limitOf(tl)));
  tl.state.gutter = width;
  tl.root.style.setProperty("--timeline-gutter", `${width}px`);
  writeHandle(tl);
  tl.windowMoved?.();
  return width;
}
function gutterHandle(tl) {
  const handle = el(tl.doc, "div", { className: `${TL}-gutter-handle`, attrs: {
    role: "separator",
    "aria-orientation": "vertical",
    tabindex: "0",
    "aria-label": tl.labels.gutter,
    "aria-valuemin": GUTTER_MIN,
    title: tl.labels.gutter
  } });
  tl.gutterNode = handle;
  tl.root.setAttribute("data-can-gutter", "");
  writeHandle(tl);
  return handle;
}
function onKey4(tl, event) {
  const handle = event.target.closest?.(HANDLE);
  if (!handle) return;
  const step = event.shiftKey ? GUTTER_STEP_BIG : GUTTER_STEP;
  const to = { ArrowLeft: widthNow(tl) - step, ArrowRight: widthNow(tl) + step, Home: GUTTER_MIN, End: limitOf(tl) }[event.key];
  if (to === void 0) return;
  event.preventDefault();
  const before = widthNow(tl);
  const width = applyGutter(tl, to);
  if (width !== Math.round(before)) tl.callbacks.onGutter?.(width);
}
function bindGutter(tl) {
  let origin2 = null;
  trackDrag(tl.life, tl.sheet, {
    selector: HANDLE,
    onStart(handle, point) {
      origin2 = { x: point.x, width: widthNow(tl) };
      handle.classList.add("is-grabbed");
    },
    onMove(point) {
      if (origin2) applyGutter(tl, origin2.width + point.x - origin2.x);
    },
    onEnd(point) {
      tl.gutterNode?.classList.remove("is-grabbed");
      if (point === null && origin2) applyGutter(tl, origin2.width);
      else if (origin2) tl.callbacks.onGutter?.(widthNow(tl));
      origin2 = null;
    }
  });
  tl.life.on(tl.sheet, "keydown", (event) => onKey4(tl, event));
}

// ui/timeline/create.js
var TRACK = `.${TL}-track`;
function spanOf(tl, from, to) {
  const first = Math.min(from, to);
  const days2 = Math.abs(to - from) + 1;
  const start3 = addDays(tl.domain.start, first);
  return { start: start3, end: addDays(start3, days2), first, days: days2 };
}
function bandNode(tl, className = `${TL}-draft`) {
  const band = el(tl.doc, "div", { className, attrs: { "aria-hidden": "true" } });
  band.append(el(tl.doc, "span", { className: `${TL}-draft-words` }));
  return band;
}
function writeBand(tl, band, span) {
  const perDay = TIMELINE_SCALES[tl.state.scale].perDay;
  band.style.setProperty("--timeline-x", `${span.first * perDay}px`);
  band.style.setProperty("--timeline-w", `${span.days * perDay}px`);
  const last = addDays(span.end, -1);
  band.firstChild.textContent = span.days === 1 ? tl.format.format(span.start) : `${tl.format.format(span.start)} – ${tl.format.format(last)}`;
}
function dayUnder(tl, creating, point) {
  const day = dayAt(point.x - creating.track.getBoundingClientRect().left, tl.state.scale);
  return Math.min(daysIn(tl.domain) - 1, Math.max(0, day));
}
function drawBand(tl, creating, point) {
  const span = spanOf(tl, creating.from, dayUnder(tl, creating, point));
  writeBand(tl, creating.band, span);
  creating.span = span;
}
function endCreate(tl, point) {
  const creating = tl.state.creating;
  tl.state.creating = null;
  creating.band.remove();
  if (point !== null && creating.span) {
    tl.callbacks.onCreate({ groupId: creating.groupId, start: creating.span.start, end: creating.span.end });
  }
  tl.render();
}
function bindCreate(tl) {
  const follow3 = (point) => {
    if (tl.state.creating) drawBand(tl, tl.state.creating, point);
  };
  trackDrag(tl.life, tl.sheet, {
    selector: TRACK,
    canStart: (track, event) => typeof tl.callbacks.onCreate === "function" && !tl.state.pending && event.target === track,
    onStart(track, point) {
      const band = bandNode(tl);
      track.append(band);
      tl.state.creating = { track, band, groupId: track.getAttribute("data-group-id"), span: null, from: 0 };
      tl.state.creating.from = dayUnder(tl, tl.state.creating, point);
      tl.paint();
    },
    onMove(point) {
      follow3(point);
      tl.edge.follow(point, follow3);
    },
    onEnd(point) {
      tl.edge.stop();
      if (tl.state.creating) endCreate(tl, point);
    }
  });
}

// ui/timeline/rows.js
var INSIDE_MIN_PX = 56;
function daysWords({ start: start3, end: end3 }, date) {
  const midnight = startOfDay(end3);
  const last = end3.getTime() === midnight.getTime() ? addDays(end3, -1) : midnight;
  return last > startOfDay(start3) ? `${date(start3)} to ${date(last)}` : date(start3);
}
function describeItem(tl, item) {
  const date = (value) => tl.format.format(value);
  const when = item.end ? daysWords(item, date) : `${date(item.start)}, ${tl.labels.milestone}`;
  const clamped = item.end && barOf(item, tl.domain, tl.state.scale).clamped ? `, ${tl.labels.clamped}` : "";
  const status = item.status ? `, ${item.status}` : "";
  const done = item.progress === null ? "" : `, ${Math.round(item.progress * 100)}% ${tl.labels.done}`;
  const needs = item.depends.filter((id) => tl.byId.has(id)).map((id) => tl.byId.get(id).title);
  return `${item.title}, ${when}${clamped}${status}${done}${needs.length ? `, ${tl.labels.dependsOn} ${needs.join(", ")}` : ""}`;
}
function writeGeometry(node, geometry) {
  node.style.setProperty("--timeline-x", `${geometry.left}px`);
  node.style.setProperty("--timeline-w", `${geometry.width}px`);
}
function barNode(tl, item, geometry, inside) {
  const { doc } = tl;
  const name = describeItem(tl, item);
  const node = el(doc, "button", { className: `${TL}-bar`, attrs: {
    type: "button",
    tabindex: "-1",
    "data-ui-id": item.id,
    title: name,
    "aria-label": name,
    "data-tone": item.tone || null,
    "data-status-tone": item.statusTone || null,
    "data-movable": item.movable ? "true" : null
  } });
  node.classList.toggle("is-point", geometry.point);
  node.classList.toggle("is-short", !geometry.point && !inside);
  node.classList.toggle("is-grabbed", tl.state.pending?.id === item.id);
  writeGeometry(node, geometry);
  if (item.progress !== null) node.style.setProperty("--timeline-progress", String(item.progress));
  if (inside) node.append(el(doc, "span", { className: `${TL}-bar-title`, text: item.title }));
  if (item.movable && !geometry.point) {
    for (const name2 of ["handle-start", "handle"]) node.append(el(doc, "span", { className: `${TL}-${name2}`, attrs: { "aria-hidden": "true" } }));
  }
  return node;
}
function outsideTitle(tl, item, geometry) {
  const node = el(tl.doc, "span", { className: `${TL}-outside`, text: item.title, attrs: { "aria-hidden": "true", "data-ui-for": item.id } });
  node.classList.toggle("is-point", geometry.point);
  writeGeometry(node, geometry);
  return node;
}
var NARROW_PX = 88;
function linkHandle(tl, item, geometry) {
  const node = el(tl.doc, "span", { className: `${TL}-link`, attrs: { "aria-hidden": "true", "data-link-from": item.id, title: tl.labels.link } });
  node.classList.toggle("is-point", geometry.point);
  node.classList.toggle("is-narrow", geometry.width < NARROW_PX);
  writeGeometry(node, geometry);
  return node;
}
function trackNode(tl, item) {
  const track = el(tl.doc, "div", { className: `${TL}-track`, attrs: { role: "gridcell", "data-group-id": item.groupId } });
  const geometry = barOf(item, tl.domain, tl.state.scale);
  const inside = !geometry.point && geometry.width >= INSIDE_MIN_PX;
  track.append(barNode(tl, item, geometry, inside));
  if (typeof tl.callbacks.onLink === "function") track.append(linkHandle(tl, item, geometry));
  if (!inside) track.append(outsideTitle(tl, item, geometry));
  return track;
}
function rowNode2(tl, item) {
  const level = item.group ? 2 : 1;
  const row = el(tl.doc, "div", { className: `${TL}-row`, attrs: { role: "row", "aria-level": level, "data-row-id": item.id } });
  row.append(
    el(tl.doc, "div", { className: `${TL}-label`, text: item.title, attrs: { "aria-hidden": "true", "data-ui-for": item.id, title: item.title } }),
    trackNode(tl, item)
  );
  return row;
}
function foldToggle(tl, item) {
  const word = item.collapsed ? tl.labels.expand : tl.labels.collapse;
  return el(tl.doc, "button", { className: `${TL}-group-toggle`, attrs: {
    type: "button",
    tabindex: "-1",
    "data-group-id": item.groupId,
    "aria-expanded": String(!item.collapsed),
    "aria-label": word.replace("{group}", item.group),
    title: word.replace("{group}", item.group)
  } });
}
function foldCount(tl, item) {
  const count = tl.state.items.filter((other) => other.groupId === item.groupId).length;
  return el(tl.doc, "span", { className: `${TL}-group-count`, text: count, attrs: { title: tl.labels.hidden.replace("{count}", String(count)) } });
}
function membersOf(tl, item) {
  return tl.state.items.filter((other) => other.groupId === item.groupId && (item.groupId !== null || other.group === item.group));
}
function groupSpan(tl, item) {
  const members = membersOf(tl, item);
  const start3 = new Date(Math.max(tl.domain.start, Math.min(...members.map((one) => one.start))));
  const end3 = new Date(Math.min(tl.domain.end, Math.max(...members.map((one) => one.end ?? one.start))));
  const left = xOf(start3, tl.domain, tl.state.scale);
  return { left, width: Math.max(MIN_BAR_PX, xOf(end3, tl.domain, tl.state.scale) - left), count: members.length };
}
function summaryNode(tl, item) {
  const span = groupSpan(tl, item);
  const words2 = (span.count === 1 ? tl.labels.summaryOne : tl.labels.summary).replace("{group}", item.group).replace("{count}", String(span.count));
  const node = el(tl.doc, "span", { className: `${TL}-summary`, attrs: { "aria-hidden": "true", title: words2, "data-ui-for": item.groupId } });
  node.append(el(tl.doc, "span", { className: `${TL}-summary-title`, text: words2 }));
  writeGeometry(node, span);
  return node;
}
function headingTrack(tl, item) {
  const track = el(tl.doc, "div", { className: `${TL}-track`, attrs: { role: "gridcell", "aria-hidden": "true", "data-group-id": item.groupId } });
  if (item.collapsed) track.append(summaryNode(tl, item));
  return track;
}
function groupNode(tl, item) {
  const row = el(tl.doc, "div", { className: `${TL}-group`, attrs: { role: "row", "aria-level": 1 } });
  const cell = el(tl.doc, "div", { className: `${TL}-group-cell`, attrs: { role: "gridcell" } });
  row.append(cell);
  if (typeof tl.callbacks.onCreate === "function" || item.collapsed) row.append(headingTrack(tl, item));
  if (item.groupId === null) {
    cell.textContent = item.group;
    return row;
  }
  cell.append(el(tl.doc, "button", { className: `${TL}-group-label`, text: item.group, attrs: { type: "button", "data-ui-id": item.groupId } }));
  if (typeof tl.callbacks.onToggleGroup !== "function") return row;
  row.setAttribute("aria-expanded", String(!item.collapsed));
  cell.append(foldToggle(tl, item));
  if (item.collapsed) cell.append(foldCount(tl, item));
  return row;
}
var startsGroup = (item, last) => !last || item.group !== last.group || item.groupId !== last.groupId;
function rowsNode(tl, items) {
  const rows = el(tl.doc, "div", { className: `${TL}-rows`, attrs: { role: "treegrid", "aria-label": tl.root.getAttribute("aria-label") } });
  let last = null;
  for (const item of items) {
    if (startsGroup(item, last) && item.group) rows.append(groupNode(tl, item));
    last = item;
    if (!item.collapsed) rows.append(rowNode2(tl, item));
  }
  return rows;
}
function axisNode(tl) {
  const axis = el(tl.doc, "div", { className: `${TL}-axis` });
  const corner = el(tl.doc, "div", { className: `${TL}-corner` });
  corner.append(gutterHandle(tl));
  const ticks = el(tl.doc, "div", { className: `${TL}-ticks`, attrs: { "aria-hidden": "true" } });
  const format = tl.tickFormats[tl.state.scale];
  for (const date of tickDates(tl.domain, tl.state.scale)) {
    const tick = el(tl.doc, "div", { className: `${TL}-tick`, text: format.format(date) });
    tick.style.setProperty("--timeline-x", `${xOf(date, tl.domain, tl.state.scale)}px`);
    ticks.append(tick);
  }
  axis.append(corner, ticks);
  return axis;
}

// ui/timeline/reveal.js
var POINT = 7;
var CLEAR_MIN = 44;
function maxScrollLeft(tl) {
  return Math.max(0, widthNow(tl) + widthOf(tl.domain, tl.state.scale) - (tl.sheet.clientWidth || 0));
}
function aim2(from, room, [start3, end3], centre) {
  if (centre && end3 - start3 <= room) return (start3 + end3) / 2 - room / 2;
  return start3 < from || centre && end3 - start3 > room ? start3 : end3 - room;
}
var clearOf = (width, room, centre) => centre ? Math.min(Math.max(width, CLEAR_MIN), room / 4) : 0;
function revealDays(tl, left, right, { centre = false } = {}) {
  const { sheet } = tl;
  const room = (sheet.clientWidth || 0) - widthNow(tl);
  const from = sheet.scrollLeft;
  const clear = clearOf(right - left, room, centre);
  if (!(room > 0) || !tl.domain || left - clear >= from && right + clear <= from + room) return false;
  sheet.scrollLeft = clamp(aim2(from, room, [left, right], centre), 0, maxScrollLeft(tl));
  tl.windowMoved();
  return sheet.scrollLeft !== from;
}
function revealRow(tl, row, { centre = false } = {}) {
  const { sheet } = tl;
  const height = sheet.clientHeight || 0;
  const box = row?.getBoundingClientRect();
  if (!(height > 0) || !box || !(box.height > 0)) return;
  const axis = sheet.querySelector(`.${TL}-axis`)?.getBoundingClientRect().height || 0;
  const from = sheet.scrollTop;
  const top = box.top - sheet.getBoundingClientRect().top + from;
  const room = height - axis;
  if (top >= from + axis && top + box.height <= from + height) return;
  sheet.scrollTop = Math.max(0, aim2(from, room, [top - axis, top + box.height - axis], centre));
}
function faceOf2(tl, kind, id) {
  return Array.from(tl.sheet.querySelectorAll(`.${TL}-${kind}`)).find((node) => node.getAttribute("data-ui-id") === id) ?? null;
}
function revealItem(tl, id) {
  const item = tl.byId.get(id) ?? null;
  const bar = item && faceOf2(tl, "bar", id);
  if (bar) {
    const { left: left2, width: width2, point } = barOf(item, tl.domain, tl.state.scale);
    revealDays(tl, point ? left2 - POINT : left2, point ? left2 + POINT : left2 + width2, { centre: true });
    revealRow(tl, bar.closest(`.${TL}-row`), { centre: true });
    return true;
  }
  const groupId = item ? item.groupId : id;
  const member = tl.state.items.find((one) => one.groupId === groupId);
  const heading = groupId !== null && member ? faceOf2(tl, "group-label", groupId)?.closest(`.${TL}-group`) : null;
  if (!heading) return false;
  const { left, width } = groupSpan(tl, member);
  revealDays(tl, left, left + width, { centre: true });
  revealRow(tl, heading, { centre: true });
  return true;
}

// ui/timeline/draw.js
var TRACK2 = `.${TL}-track`;
var DAY_MS2 = 864e5;
function groupNameOf(tl, track) {
  const row = track.parentElement;
  const id = row?.getAttribute("data-row-id");
  if (id) return tl.byId.get(id)?.group || tl.labels.noGroup;
  const cell = row?.querySelector(`.${TL}-group-cell`);
  return (cell?.querySelector(`.${TL}-group-label`) ?? cell)?.textContent || tl.labels.noGroup;
}
function tracksOf(tl) {
  const seen = /* @__PURE__ */ new Map();
  return Array.from(tl.sheet.querySelectorAll(TRACK2), (track) => {
    const id = track.parentElement?.getAttribute("data-row-id");
    if (id) return { track, key: `item ${id}` };
    const heading = `heading ${track.getAttribute("data-group-id") ?? ""} ${groupNameOf(tl, track)}`;
    seen.set(heading, (seen.get(heading) ?? 0) + 1);
    return { track, key: `${heading} ${seen.get(heading)}` };
  });
}
function dayAfter(item) {
  const end3 = item.end ?? addDays(startOfDay(item.start), 1);
  return startOfDay(end3).getTime() === end3.getTime() ? end3 : addDays(startOfDay(end3), 1);
}
function dayOf(tl, date) {
  return clamp(Math.round((startOfDay(date).getTime() - tl.domain.start.getTime()) / DAY_MS2), 0, daysIn(tl.domain) - 1);
}
function spanWords(tl, span) {
  const count = span.days === 1 ? tl.labels.oneDay : tl.labels.days.replace("{count}", String(span.days));
  return `${daysWords(span, (date) => tl.format.format(date))}, ${count}`;
}
function placeCursor(tl) {
  const cursor = tl.state.cursor;
  const found = cursor && tracksOf(tl).find((one) => one.key === cursor.key);
  if (!found) {
    if (cursor) cancelDraw2(tl);
    return null;
  }
  const at = dayOf(tl, cursor.at);
  cursor.at = addDays(tl.domain.start, at);
  const span = spanOf(tl, cursor.anchor ? dayOf(tl, cursor.anchor) : at, at);
  if (cursor.band?.parentElement !== found.track) {
    cursor.band?.remove();
    cursor.band = bandNode(tl, `${TL}-draft is-keyboard`);
    found.track.append(cursor.band);
  }
  writeBand(tl, cursor.band, span);
  return { span, track: found.track };
}
function keepInView2(tl, track) {
  const perDay = TIMELINE_SCALES[tl.state.scale].perDay;
  const x = dayOf(tl, tl.state.cursor.at) * perDay;
  revealDays(tl, x, x + perDay);
  revealRow(tl, track.parentElement);
}
function end2(tl) {
  tl.state.cursor.band?.remove();
  tl.state.cursor = null;
  tl.paint();
}
function cancelDraw2(tl) {
  if (!tl.state.cursor) return;
  end2(tl);
  tl.say(tl.labels.drawCancelled);
}
function startDraw2(tl, face) {
  if (typeof tl.callbacks.onCreate !== "function" || tl.busy()) return false;
  const track = face.closest(TRACK2) ?? face.closest(`.${TL}-group`)?.querySelector(TRACK2);
  const found = track && tracksOf(tl).find((one) => one.track === track);
  if (!found) return false;
  const item = face.closest(TRACK2) ? tl.byId.get(face.getAttribute("data-ui-id")) : null;
  const at = item ? dayAfter(item) : startOfDay(tl.state.now);
  tl.state.cursor = { key: found.key, at, anchor: null, band: null };
  placeCursor(tl);
  keepInView2(tl, track);
  tl.paint();
  const where = tl.labels.drawStart.replace("{group}", groupNameOf(tl, track)).replace("{date}", tl.format.format(tl.state.cursor.at));
  tl.say(`${where} ${asSentence(tl.labels.hintDrawing)}`);
  return true;
}
function stepped(tl, { row = false } = {}) {
  const placed = placeCursor(tl);
  if (!placed) return;
  const cursor = tl.state.cursor;
  keepInView2(tl, placed.track);
  const what = cursor.anchor ? spanWords(tl, placed.span) : tl.format.format(cursor.at);
  tl.say(row ? `${groupNameOf(tl, placed.track)}: ${what}` : what);
}
function moveRow(tl, step) {
  const cursor = tl.state.cursor;
  const tracks = tracksOf(tl);
  const at = tracks.findIndex((one) => one.key === cursor.key);
  cursor.key = tracks[clamp(at + step, 0, tracks.length - 1)].key;
  stepped(tl, { row: true });
}
function anchorOrAdd2(tl) {
  const cursor = tl.state.cursor;
  if (!cursor.anchor) {
    cursor.anchor = cursor.at;
    placeCursor(tl);
    tl.paint();
    tl.say(`${tl.labels.drawAnchor.replace("{date}", tl.format.format(cursor.at))} ${asSentence(tl.labels.hintSpanning)}`);
    return;
  }
  const placed = placeCursor(tl);
  if (!placed) return;
  const { span, track } = placed;
  const group = groupNameOf(tl, track);
  end2(tl);
  tl.callbacks.onCreate({ groupId: track.getAttribute("data-group-id"), start: span.start, end: span.end });
  tl.say(tl.labels.drawn.replace("{range}", daysWords(span, (date) => tl.format.format(date))).replace("{group}", group));
}
function drawKey2(tl, event) {
  const day = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  const row = { ArrowUp: -1, ArrowDown: 1 }[event.key];
  if ((event.key === " " || event.key === "Enter") && event.repeat) {
    event.preventDefault();
    return;
  }
  if (day !== void 0) {
    tl.state.cursor.at = addDays(tl.state.cursor.at, day);
    stepped(tl);
  } else if (row !== void 0) moveRow(tl, row);
  else if (event.key === " " || event.key === "Enter") {
    tl.spaceTaken = event.key === " ";
    anchorOrAdd2(tl);
  } else if (event.key === "Escape" || event.key === "Tab") cancelDraw2(tl);
  else return;
  if (event.key !== "Tab") event.preventDefault();
}
function drawHint(tl) {
  const cursor = tl.state.cursor;
  if (!cursor) return null;
  return cursor.anchor ? tl.labels.hintSpanning : tl.labels.hintDrawing;
}
function bindDraw2(tl) {
  cancelOnLeave(tl.life, tl.sheet, { active: () => tl.state.cursor !== null, cancel: () => cancelDraw2(tl) });
}

// ui/timeline/edge.js
var EDGE_PX = 48;
var FRAME_MS = 16;
var FRAME_MAX_PX = 24;
var STEP_MS = 250;
var STEP_PX = 64;
function depthAt(tl, x) {
  const { sheet } = tl;
  const left = sheet.getBoundingClientRect().left + widthNow(tl);
  const right = sheet.getBoundingClientRect().left + (sheet.clientWidth || 0);
  if (!(right - left > 2 * EDGE_PX)) return 0;
  if (x < left + EDGE_PX) return -Math.min(1, (left + EDGE_PX - x) / EDGE_PX);
  return x > right - EDGE_PX ? Math.min(1, (x - right + EDGE_PX) / EDGE_PX) : 0;
}
function stepAt(tl, depth, reduced) {
  if (!reduced) return Math.sign(depth) * Math.max(1, Math.round(FRAME_MAX_PX * Math.abs(depth)));
  const { perDay } = TIMELINE_SCALES[tl.state.scale];
  return Math.sign(depth) * perDay * Math.max(1, Math.round(STEP_PX / perDay));
}
function bindEdge(tl) {
  const run = { point: null, onScroll: null, cancel: null };
  const pace = () => prefersReducedMotion() ? STEP_MS : FRAME_MS;
  const tick = () => {
    run.cancel = null;
    const depth = run.point ? depthAt(tl, run.point.x) : 0;
    if (depth === 0) return;
    const before = tl.sheet.scrollLeft;
    tl.sheet.scrollLeft = clamp(before + stepAt(tl, depth, prefersReducedMotion()), 0, maxScrollLeft(tl));
    if (tl.sheet.scrollLeft === before) return;
    run.onScroll(run.point);
    tl.windowMoved();
    run.cancel = tl.life.later(tick, pace());
  };
  tl.edge = {
    follow(point, onScroll) {
      Object.assign(run, { point, onScroll });
      if (run.cancel === null && depthAt(tl, point.x) !== 0) run.cancel = tl.life.later(tick, pace());
    },
    stop() {
      run.cancel?.();
      Object.assign(run, { point: null, onScroll: null, cancel: null });
    }
  };
}

// ui/timeline/move.js
var BAR = `.${TL}-bar`;
var HANDLE_END = `.${TL}-handle`;
var HANDLE_START = `.${TL}-handle-start`;
function bars(tl) {
  return Array.from(tl.sheet.querySelectorAll(BAR));
}
function itemById(tl, id) {
  return tl.state.items.find((item) => item.id === id) ?? null;
}
function modeOf(target) {
  if (target?.closest?.(HANDLE_START)) return "start";
  return target?.closest?.(HANDLE_END) ? "end" : "move";
}
function startMove(tl, id, { keyboard, mode }) {
  const item = itemById(tl, id);
  if (!item?.movable) return false;
  const original = { start: item.start, end: item.end };
  tl.state.pending = { id, keyboard, mode, original, times: original, days: 0, domain: tl.domain };
  if (keyboard) tl.say(tl.labels.pickedUp.replace("{title}", item.title));
  return true;
}
var sameTime = (a, b) => (a?.getTime() ?? null) === (b?.getTime() ?? null);
function finishMove(tl, drop) {
  const pending = tl.state.pending;
  tl.state.pending = null;
  tl.focusAfter = pending.keyboard;
  const moved = !sameTime(pending.times.start, pending.original.start) || !sameTime(pending.times.end, pending.original.end);
  if (drop && moved) {
    tl.callbacks.onChange?.(pending.id, { ...pending.times });
    tl.say(`${tl.labels.moved}: ${tl.describe({ ...itemById(tl, pending.id), ...pending.times })}.`);
  } else if (pending.keyboard) {
    tl.say(drop ? tl.labels.notMoved : tl.labels.cancelled);
  }
  tl.render();
}
function stepMove(tl, days2, mode) {
  const pending = tl.state.pending;
  pending.times = shiftItem(pending.times, days2, mode);
  tl.focusAfter = true;
  tl.render();
  tl.say(tl.describe({ ...itemById(tl, pending.id), ...pending.times }));
}
function pickupKey(tl, event) {
  if (event.repeat && (event.key === " " || event.key === "Enter")) return true;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") stepMove(tl, event.key === "ArrowRight" ? 1 : -1, event.shiftKey ? "end" : "move");
  else if (event.key === " " || event.key === "Enter") finishMove(tl, true);
  else if (event.key === "Escape" || event.key === "Tab") finishMove(tl, false);
  else return false;
  if (event.key !== "Tab") event.preventDefault();
  return true;
}
function pickUp(tl, bar) {
  if (!startMove(tl, bar.getAttribute("data-ui-id"), { keyboard: true, mode: "move" })) return false;
  tl.focusAfter = true;
  tl.render();
  return true;
}
function reportChange(tl, id, times) {
  tl.callbacks.onChange?.(id, times);
  tl.say(`${tl.labels.moved}: ${tl.describe({ ...itemById(tl, id), ...times })}.`);
}
function dragTo(tl, point) {
  const pending = tl.state.pending;
  if (!pending) return;
  const travel2 = point.x - pending.originX + tl.sheet.scrollLeft - pending.originScroll;
  const days2 = Math.round(travel2 / TIMELINE_SCALES[tl.state.scale].perDay);
  if (days2 === pending.days) return;
  pending.days = days2;
  pending.times = shiftItem(pending.original, days2, pending.mode);
  tl.render();
}
function bindMove2(tl) {
  const follow3 = (point) => dragTo(tl, point);
  trackDrag(tl.life, tl.sheet, {
    selector: `${BAR}[data-movable]`,
    canStart: () => !tl.state.pending,
    onStart(bar, point, pressTarget) {
      if (!startMove(tl, bar.getAttribute("data-ui-id"), { keyboard: false, mode: modeOf(pressTarget) })) return;
      Object.assign(tl.state.pending, { originX: point.x, originScroll: tl.sheet.scrollLeft });
    },
    onMove(point) {
      follow3(point);
      if (tl.state.pending) tl.edge.follow(point, follow3);
    },
    onEnd(point) {
      tl.edge.stop();
      if (tl.state.pending) finishMove(tl, point !== null);
    }
  });
}

// ui/timeline/hint.js
function barVerbs(tl, item) {
  const { labels, callbacks: cb } = tl;
  const editable = Boolean(cb.onChange) && item.movable;
  return [
    cb.onActivate && labels.hintOpen,
    editable && labels.hintMove,
    editable && item.end && labels.hintResize,
    editable && labels.hintKeys,
    cb.onLink && labels.hintLink,
    cb.onDelete && labels.hintDelete,
    cb.onMenu && (tl.crowded === item.id ? labels.hintMoreHeld : labels.hintMore),
    cb.onCreate && labels.hintDraw
  ];
}
function groupVerbs(tl, groupId) {
  const { labels, callbacks: cb } = tl;
  const folds = Boolean(cb.onToggleGroup) && tl.groups.has(groupId);
  return [cb.onActivate && labels.hintOpen, cb.onAdd && labels.hintAdd, folds && labels.hintFold, cb.onMenu && labels.hintMore, cb.onCreate && labels.hintDraw];
}
function startVerbs2(tl) {
  const { labels, callbacks: cb } = tl;
  return [labels.hintNone, cb.onCreate && labels.hintCreate, cb.onMenu && labels.hintMore, cb.onCreate && labels.hintDraw];
}
function hintOf2(tl) {
  const { selectedId } = tl.state;
  const drawing = drawHint(tl);
  if (drawing !== null) return drawing;
  let verbs = startVerbs2(tl);
  if (tl.byId.has(selectedId)) verbs = barVerbs(tl, tl.byId.get(selectedId));
  else if (tl.groups.has(selectedId)) verbs = groupVerbs(tl, selectedId);
  return verbs.filter(Boolean).join(" · ");
}

// ui/timeline/more.js
var PLACE2 = Object.freeze(["--timeline-x", "--timeline-w"]);
var ROW3 = `${TL}-row`;
function dropMore2(tl, bar) {
  const held = tl.more !== void 0 && tl.doc.activeElement === tl.more;
  tl.more?.remove();
  if (held) bar?.focus({ preventScroll: true });
}
function crowdedBy(tl, bar) {
  return !bar.classList.contains("is-point") && !roomForMore(bar.getBoundingClientRect().width, tl.more.getBoundingClientRect().width);
}
function syncMore2(tl) {
  const id = tl.state.selectedId;
  const bar = id !== null && typeof tl.callbacks.onMenu === "function" && !tl.busy() ? bars(tl).find((node) => node.getAttribute("data-ui-id") === id) : null;
  tl.crowded = null;
  for (const row of tl.sheet.querySelectorAll(`.${ROW3}.is-crowded`)) row.classList.remove("is-crowded");
  if (!bar) {
    dropMore2(tl, null);
    return;
  }
  tl.more ??= moreButton(tl.doc, `${TL}-more`);
  nameMore(tl.more, tl.labels.more, tl.byId.get(id).title);
  tl.more.setAttribute("data-more-for", id);
  tl.more.classList.toggle("is-point", bar.classList.contains("is-point"));
  for (const name of PLACE2) tl.more.style.setProperty(name, bar.style.getPropertyValue(name));
  const track = bar.parentElement;
  if (tl.more.parentElement !== track) track.append(tl.more);
  if (!crowdedBy(tl, bar)) return;
  tl.crowded = id;
  bar.closest(`.${ROW3}`)?.classList.add("is-crowded");
  dropMore2(tl, bar);
}
function pressMore2(tl, target) {
  if (!isMore(target)) return false;
  const button2 = target.closest(`.${MORE_CLASS}`);
  tl.callbacks.onMenu?.(button2.getAttribute("data-more-for"), belowMore(button2));
  return true;
}

// ui/timeline/select.js
function paint3(tl) {
  const { selectedId } = tl.state;
  for (const node of tl.sheet.querySelectorAll(`.${TL}-bar, .${TL}-group-label`)) {
    markSelected(node, node.getAttribute("data-ui-id") === selectedId);
  }
  for (const row of tl.sheet.querySelectorAll(`.${TL}-row`)) row.classList.toggle("is-current", row.getAttribute("data-row-id") === selectedId);
  syncMore2(tl);
  const hint = hintOf2(tl);
  writeText(tl.hintText, hint);
  tl.hint.hidden = hint === "";
}
function select2(tl, id) {
  const { state } = tl;
  if (state.selectedId === id) return;
  state.selectedId = id;
  paint3(tl);
}

// ui/timeline/keys.js
var LABEL = `.${TL}-group-label`;
function stops(tl) {
  return Array.from(tl.sheet.querySelectorAll(`${BAR}, ${LABEL}`));
}
function goTo(tl, next) {
  const id = next.getAttribute("data-ui-id");
  if (next.matches(BAR)) {
    tl.state.focusId = id;
    setTabStop(bars(tl), next);
  }
  next.focus();
  select2(tl, id);
}
function walkRows(tl, from, event) {
  const nodes = stops(tl);
  const index = nodes.indexOf(from);
  const to = { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: nodes.length - 1 }[event.key];
  if (to === void 0) return false;
  event.preventDefault();
  goTo(tl, nodes[Math.max(0, Math.min(nodes.length - 1, to))]);
  return true;
}
function walkTime(tl, bar, event) {
  const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  if (step === void 0) return false;
  event.preventDefault();
  const nodes = bars(tl);
  const start3 = (node) => tl.byId.get(node.getAttribute("data-ui-id")).start.getTime();
  const ordered = [...nodes].sort((a, b) => start3(a) - start3(b) || nodes.indexOf(a) - nodes.indexOf(b));
  const next = ordered[Math.max(0, Math.min(ordered.length - 1, ordered.indexOf(bar) + step))];
  goTo(tl, next);
  return true;
}
function dayKey2(tl, bar, event) {
  const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  if (!event.altKey || step === void 0 || typeof tl.callbacks.onChange !== "function") return false;
  event.preventDefault();
  const item = tl.byId.get(bar.getAttribute("data-ui-id"));
  if (!item.movable) return true;
  const resize = event.shiftKey;
  if (resize && !item.end) return true;
  reportChange(tl, item.id, shiftItem({ start: item.start, end: item.end }, step, resize ? "end" : "move"));
  return true;
}
function menuPoint(face) {
  const rect = face.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom };
}
function verbOf(tl, face, event) {
  const cb = tl.callbacks;
  const id = face.getAttribute("data-ui-id");
  const bar = face.matches(BAR);
  const groupId = bar ? tl.byId.get(id).groupId : id;
  if (event.key === "ContextMenu" || event.key === "F10" && event.shiftKey) return cb.onMenu ? () => cb.onMenu(id, menuPoint(face)) : null;
  if (event.key === "Enter") return bar && cb.onActivate ? () => cb.onActivate(id) : null;
  if (event.key === "+" || event.key === "Insert") return cb.onAdd && groupId !== null ? () => cb.onAdd(groupId) : null;
  if (event.key === "Delete" || event.key === "Backspace") return bar && cb.onDelete ? () => cb.onDelete(id) : null;
  return null;
}
function foldKey(tl, face, event) {
  const id = face.getAttribute("data-ui-id");
  const folded = tl.groups.get(id) === true;
  const ask2 = { " ": !folded, ArrowLeft: folded ? null : true, ArrowRight: folded ? false : null }[event.key];
  if (ask2 === void 0 || typeof tl.callbacks.onToggleGroup !== "function") return false;
  event.preventDefault();
  if (ask2 !== null) tl.fold(id, ask2);
  return true;
}
function onFaceKey(tl, face, event) {
  const bar = face.matches(BAR);
  if (!bar && foldKey(tl, face, event)) return;
  if (walkRows(tl, face, event) || bar && dayKey2(tl, face, event)) return;
  if (bar && !event.altKey && walkTime(tl, face, event)) return;
  const verb = verbOf(tl, face, event);
  if (!verb) return;
  event.preventDefault();
  verb();
}
function onKeyDown3(tl, event) {
  if (tl.state.cursor) {
    drawKey2(tl, event);
    return;
  }
  const face = event.target.closest?.(`${BAR}, ${LABEL}`);
  if (!face) return;
  if (tl.state.pending?.keyboard) {
    pickupKey(tl, event);
    return;
  }
  if (isDrawKey(event) && startDraw2(tl, face)) {
    event.preventDefault();
    return;
  }
  if (event.key === " " && face.matches(BAR)) {
    event.preventDefault();
    if (!event.repeat) pickUp(tl, face);
    return;
  }
  onFaceKey(tl, face, event);
}
function bindKeys3(tl) {
  tl.life.on(tl.sheet, "keydown", (event) => onKeyDown3(tl, event));
  tl.life.on(tl.sheet, "keyup", (event) => {
    const held = event.target.closest?.(`${BAR}, ${LABEL}`);
    if (event.key === " " && held && (held.matches(BAR) || tl.callbacks.onToggleGroup || tl.spaceTaken)) event.preventDefault();
    if (event.key === " ") tl.spaceTaken = false;
  });
}

// ui/timeline/links.js
var LINKS = `${TL}-links`;
var GAP2 = 12;
function elbowPath(a, b) {
  if (b.x - a.x >= 2 * GAP2) return `M${a.x} ${a.y} H${Math.round((a.x + b.x) / 2)} V${b.y} H${b.x}`;
  const between = Math.round((a.y + b.y) / 2);
  return `M${a.x} ${a.y} H${a.x + GAP2} V${between} H${b.x - GAP2} V${b.y} H${b.x}`;
}
function placeOf2(layerBox, bar) {
  const box = bar.getBoundingClientRect();
  const y = Math.round(box.top - layerBox.top + box.height / 2);
  return { end: { x: Math.round(box.right - layerBox.left), y }, start: { x: Math.round(box.left - layerBox.left), y } };
}
function pairsOf(tl, places) {
  return tl.state.items.flatMap((item) => item.depends.filter((id) => places.has(id) && places.has(item.id)).map((id) => [id, item.id]));
}
function connectorNode(tl, [from, to], places) {
  const group = svg(tl.doc, "g", { class: `${TL}-connector`, "data-from": from, "data-to": to });
  group.append(svg(tl.doc, "path", { class: `${TL}-connector-line`, d: elbowPath(places.get(from).end, places.get(to).start), "marker-end": `url(#${tl.id}-arrow)` }));
  return group;
}
function arrowDefs(tl) {
  const marker = svg(tl.doc, "marker", { id: `${tl.id}-arrow`, viewBox: "0 0 10 10", refX: 10, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto" });
  marker.append(svg(tl.doc, "path", { d: "M0,0 L10,5 L0,10 z", class: `${TL}-arrow` }));
  const defs = svg(tl.doc, "defs", {});
  defs.append(marker);
  return defs;
}
function linksLayer(tl) {
  tl.links = svg(tl.doc, "svg", { class: LINKS, width: 1, height: 1, "aria-hidden": "true" });
  return tl.links;
}
function drawLinks(tl) {
  const layerBox = tl.links.getBoundingClientRect();
  const places = new Map(bars(tl).map((bar) => [bar.getAttribute("data-ui-id"), placeOf2(layerBox, bar)]));
  tl.links.replaceChildren(arrowDefs(tl), ...pairsOf(tl, places).map((pair) => connectorNode(tl, pair, places)));
}
function targetUnder(tl, point, fromId) {
  const id = itemIdOf(tl.doc.elementFromPoint?.(point.x, point.y));
  return id !== null && id !== fromId && bars(tl).some((bar) => bar.getAttribute("data-ui-id") === id) ? id : null;
}
function light(tl, id) {
  for (const bar of bars(tl)) bar.classList.toggle("is-drop-target", bar.getAttribute("data-ui-id") === id);
}
function drawDraft(tl, linking, point) {
  const box = tl.links.getBoundingClientRect();
  linking.draft.setAttribute("d", `M${linking.from.x} ${linking.from.y} L${Math.round(point.x - box.left)} ${Math.round(point.y - box.top)}`);
}
function startLink(tl, handle) {
  const fromId = handle.getAttribute("data-link-from");
  const bar = bars(tl).find((node) => node.getAttribute("data-ui-id") === fromId);
  const from = placeOf2(tl.links.getBoundingClientRect(), bar).end;
  const draft = svg(tl.doc, "path", { class: `${TL}-draft-link`, d: `M${from.x} ${from.y}` });
  tl.links.append(draft);
  tl.state.linking = { fromId, from, draft, target: null };
  tl.paint();
}
function endLink(tl, point) {
  const { fromId, draft, target } = tl.state.linking;
  tl.state.linking = null;
  draft.remove();
  light(tl, null);
  tl.state.focusId = fromId;
  tl.focusAfter = "keep";
  if (point !== null && target) tl.callbacks.onLink(fromId, target);
  tl.render();
}
function bindLinks(tl) {
  trackDrag(tl.life, tl.sheet, {
    selector: `.${TL}-link`,
    canStart: () => typeof tl.callbacks.onLink === "function" && !tl.state.pending && !tl.state.creating,
    onStart(handle) {
      startLink(tl, handle);
    },
    onMove(point) {
      const linking = tl.state.linking;
      if (!linking) return;
      drawDraft(tl, linking, point);
      linking.target = targetUnder(tl, point, linking.fromId);
      light(tl, linking.target);
    },
    onEnd(point) {
      if (tl.state.linking) endLink(tl, point);
    }
  });
}

// ui/timeline/reach.js
var MAX_REACH_DAYS = 3660;
var MIN_GROWTH_DAYS = 14;
var roomOf = (tl) => Math.max(0, tl.sheet.clientWidth - GUTTER_MIN);
function stepOf(tl) {
  tl.reach.room = Math.max(tl.reach.room, roomOf(tl));
  const { room } = tl.reach;
  return room === 0 ? 0 : Math.max(MIN_GROWTH_DAYS, Math.ceil(room / TIMELINE_SCALES[tl.state.scale].perDay));
}
function domainOf(tl) {
  const { reach: reach2, state } = tl;
  const base = domainFor(state.items, state.scale, state.now);
  const step = stepOf(tl);
  return { start: addDays(base.start, -Math.max(reach2.before, step)), end: addDays(base.end, Math.max(reach2.after, step)), home: base.start };
}
function reachTo(tl, date) {
  const { reach: reach2, state } = tl;
  const base = domainFor(state.items, state.scale, state.now);
  const step = stepOf(tl);
  reach2.before = Math.min(MAX_REACH_DAYS, Math.max(reach2.before, daysBetween(date, base.start) + step));
  reach2.after = Math.min(MAX_REACH_DAYS, Math.max(reach2.after, daysBetween(base.end, date) + 2 * step));
}
function viewBefore(tl) {
  if (!tl.domain) return null;
  return { date: dateAt(tl.sheet.scrollLeft, tl.domain, tl.domainScale), scale: tl.domainScale, start: tl.domain.start };
}
function viewAfter(tl, before) {
  const { domain, state } = tl;
  tl.domainScale = state.scale;
  if (before === null) tl.sheet.scrollLeft = xOf(domain.home ?? domain.start, domain, state.scale);
  else if (before.scale === state.scale && before.start.getTime() !== domain.start.getTime()) tl.sheet.scrollLeft = xOf(before.date, domain, state.scale);
}
function nearEnds(tl) {
  const { reach: reach2, state } = tl;
  const view = Math.max(0, tl.sheet.clientWidth - widthNow(tl));
  const left = tl.sheet.scrollLeft;
  const right = widthOf(tl.domain, state.scale) - left - view;
  return { before: left < view / 2 && reach2.before < MAX_REACH_DAYS, after: right < view / 2 && reach2.after < MAX_REACH_DAYS };
}
function extend(tl) {
  if (!tl.domain || tl.busy() || tl.drawing) return;
  const { before, after } = nearEnds(tl);
  if (!before && !after) return;
  const step = stepOf(tl);
  if (before) tl.reach.before = Math.min(MAX_REACH_DAYS, Math.max(tl.reach.before, step) + step);
  if (after) tl.reach.after = Math.min(MAX_REACH_DAYS, Math.max(tl.reach.after, step) + step);
  tl.render();
}
function refit(tl) {
  if (!tl.domain || tl.busy() || tl.drawing) return;
  const next = domainOf(tl);
  if (next.start.getTime() !== tl.domain.start.getTime() || next.end.getTime() !== tl.domain.end.getTime()) tl.render();
}
function bindReach(tl) {
  tl.life.on(tl.sheet, "scroll", () => extend(tl));
}

// ui/timeline/place.js
var hasBox = (tl) => typeof tl.sheet.getClientRects !== "function" || tl.sheet.getClientRects().length > 0;
function placeNow(tl) {
  if (!tl.domain) return null;
  return { date: dateAt(tl.sheet.scrollLeft, tl.domain, tl.domainScale), top: tl.sheet.scrollTop };
}
function notePlace(tl) {
  if (tl.domain && hasBox(tl)) tl.held = placeNow(tl);
}
function visibleStart(tl) {
  const place2 = tl.asked ?? (hasBox(tl) ? placeNow(tl) : tl.held);
  return place2 && { date: new Date(place2.date.getTime()), top: place2.top ?? tl.sheet.scrollTop };
}
function scrollToDate(tl, date, top) {
  const at = toDate(date);
  if (!at) return false;
  tl.asked = { date: at, top: Number.isFinite(top) ? top : null };
  if (tl.domain && !tl.busy()) tl.render();
  return true;
}
function placeToKeep(tl) {
  const { asked } = tl;
  const held = tl.away ? tl.held : null;
  Object.assign(tl, { asked: null, away: false });
  if (!asked) return held;
  reachTo(tl, asked.date);
  return asked;
}
function putPlace(tl, place2) {
  tl.sheet.scrollLeft = Math.max(0, xOf(place2.date, tl.domain, tl.state.scale));
  if (place2.top !== null) tl.sheet.scrollTop = place2.top;
}
function drawIfBack(tl) {
  if (!tl.life.dead && tl.away && hasBox(tl) && !tl.busy()) tl.render();
}
function waitForBox(tl) {
  tl.away = true;
  const frame = tl.doc.defaultView?.requestAnimationFrame;
  if (tl.looking || typeof frame !== "function") return;
  tl.looking = true;
  frame(() => {
    tl.looking = false;
    drawIfBack(tl);
  });
}
function resized(tl) {
  drawIfBack(tl);
  refit(tl);
  tl.windowMoved();
}
function bindPlace(tl) {
  tl.life.on(tl.sheet, "scroll", () => notePlace(tl));
  const Observer = tl.doc.defaultView?.ResizeObserver;
  if (typeof Observer !== "function") return;
  const observer = new Observer(() => resized(tl));
  observer.observe(tl.sheet);
  tl.life.add(() => observer.disconnect());
}

// ui/timeline/window.js
var WINDOW_SETTLE_MS = 150;
function shownDays(tl) {
  const { sheet, domain, state } = tl;
  const room = (sheet.clientWidth || 0) - widthNow(tl);
  if (!domain || room <= 0) return null;
  const left = Math.max(0, sheet.scrollLeft);
  return { from: dateAt(left, domain, state.scale), to: dateAt(left + room - 1, domain, state.scale) };
}
function windowOf(tl) {
  const shown = shownDays(tl);
  return shown && { from: dayKey(shown.from), to: dayKey(shown.to) };
}
function writeRange(tl) {
  const shown = shownDays(tl);
  writeText(tl.rangeText, shown ? `${tl.format.format(shown.from)} – ${tl.format.format(shown.to)}` : "");
}
function say2(tl, said) {
  const next = windowOf(tl);
  if (next === null || said.last && said.last.from === next.from && said.last.to === next.to) return;
  said.last = next;
  tl.callbacks.onWindow(next);
}
function bindWindow(tl) {
  const said = { last: null, cancel: () => {
  } };
  const reports = typeof tl.callbacks.onWindow === "function";
  tl.windowMoved = () => {
    writeRange(tl);
    if (!reports) return;
    said.cancel();
    said.cancel = tl.life.later(() => say2(tl, said), said.last === null ? 0 : WINDOW_SETTLE_MS);
  };
  tl.life.on(tl.sheet, "scroll", () => tl.windowMoved());
}

// plugins/pan.js
import { createLogger as createLogger2 } from "cloudcanvas/log";
import { schedule as schedule2 } from "cloudcanvas/kernel";
import { BLIT_ATTR as BLIT_ATTR2 } from "cloudcanvas/kernel";
var LINE_HEIGHT_PX = 16;
var PAGE_HEIGHT_FALLBACK_PX = 800;
var MAX_WHEEL_DELTA_PX = 160;
var PINCH_ZOOM_K = 0.01;
var WHEEL_ZOOM_K = 15e-4;
var DISCRETE_WHEEL_MIN_PX = 40;
function wheelPixelsPerUnit(deltaMode, hostHeight) {
  if (deltaMode === 1) return LINE_HEIGHT_PX;
  if (deltaMode === 2) return Number(hostHeight) || PAGE_HEIGHT_FALLBACK_PX;
  return 1;
}
function clampWheelDelta(pixels) {
  return Math.min(MAX_WHEEL_DELTA_PX, Math.max(-MAX_WHEEL_DELTA_PX, pixels));
}
function normalizeWheelDeltas(event, hostHeight) {
  const unit = wheelPixelsPerUnit(Number(event.deltaMode) || 0, hostHeight);
  return {
    dx: clampWheelDelta((Number(event.deltaX) || 0) * unit),
    dy: clampWheelDelta((Number(event.deltaY) || 0) * unit)
  };
}
function isDiscreteWheel(event) {
  if ((Number(event.deltaMode) || 0) !== 0) return true;
  const dy = Number(event.deltaY) || 0;
  return (Number(event.deltaX) || 0) === 0 && Math.abs(dy) >= DISCRETE_WHEEL_MIN_PX && Number.isInteger(dy);
}
function wheelZoomFactor(deltaPx, gain) {
  return Math.exp(-deltaPx * gain);
}

// ui/timeline/zoom.js
var NOTCH_PX = 50;
var PAUSE_MS = 300;
var PINCH_RATIO = 1.5;
function anchorOf(tl, offset) {
  const { sheet } = tl;
  const gutter = widthNow(tl);
  const at = Math.max(gutter, offset);
  return { date: dateAt(at + sheet.scrollLeft - gutter, tl.domain, tl.state.scale), gutter, offset: at };
}
var anchorAt = (tl, clientX) => anchorOf(tl, clientX - tl.sheet.getBoundingClientRect().left);
var anchorMiddle = (tl) => anchorOf(tl, widthNow(tl) + Math.max(0, (tl.sheet.clientWidth || 0) - widthNow(tl)) / 2);
function restore(tl, anchor) {
  const x = xOf(anchor.date, tl.domain, tl.state.scale);
  tl.sheet.scrollLeft = Math.max(0, anchor.gutter + x - anchor.offset);
}
function rescale(tl, next, anchor) {
  tl.state.scale = next;
  tl.render();
  restore(tl, anchor);
  tl.windowMoved();
  tl.callbacks.onScale?.(next);
}
function zoomBy(tl, step, clientX) {
  const next = stepScale(tl.state.scale, step);
  if (next === tl.state.scale || tl.busy()) return;
  rescale(tl, next, anchorAt(tl, clientX));
}
function bindWheel(tl) {
  let pixels = 0;
  let forget = () => {
  };
  tl.life.on(tl.sheet, "wheel", (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    pixels += normalizeWheelDeltas(event, tl.sheet.getBoundingClientRect().height).dy;
    forget();
    if (Math.abs(pixels) >= NOTCH_PX) {
      const step = pixels < 0 ? -1 : 1;
      pixels = 0;
      zoomBy(tl, step, event.clientX);
      return;
    }
    forget = tl.life.later(() => {
      pixels = 0;
    }, PAUSE_MS);
  }, { passive: false });
}
var apart = (points) => Math.abs(points[0].x - points[1].x);
var middle = (points) => (points[0].x + points[1].x) / 2;
function bindPinch(tl) {
  const touches = /* @__PURE__ */ new Map();
  let start3 = 0;
  tl.life.on(tl.sheet, "pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    touches.set(event.pointerId, { x: event.clientX });
    if (touches.size === 2) start3 = Math.max(1, apart([...touches.values()]));
  });
  tl.life.on(tl.sheet, "pointermove", (event) => {
    if (!touches.has(event.pointerId)) return;
    touches.set(event.pointerId, { x: event.clientX });
    if (touches.size !== 2) return;
    const points = [...touches.values()];
    const ratio = Math.max(1, apart(points)) / start3;
    if (ratio < PINCH_RATIO && ratio > 1 / PINCH_RATIO) return;
    start3 = Math.max(1, apart(points));
    zoomBy(tl, ratio >= PINCH_RATIO ? -1 : 1, middle(points));
  });
  const end3 = (event) => touches.delete(event.pointerId);
  tl.life.on(tl.sheet, "pointerup", end3);
  tl.life.on(tl.sheet, "pointercancel", end3);
}
function bindZoom(tl) {
  tl.setScale = (scale) => rescale(tl, scale, anchorMiddle(tl));
  bindWheel(tl);
  bindPinch(tl);
}

// ui/timeline/interact.js
function writeTabStops2(tl) {
  const nodes = bars(tl);
  const barOf2 = (id) => nodes.find((node) => node.getAttribute("data-ui-id") === id);
  const current = barOf2(tl.state.focusId) ?? barOf2(tl.state.selectedId) ?? nodes[0] ?? null;
  tl.state.focusId = current?.getAttribute("data-ui-id") ?? null;
  setTabStop(nodes, current);
  if (tl.focusAfter && current) current.focus(tl.focusAfter === "keep" ? { preventScroll: true } : void 0);
  tl.focusAfter = false;
}
var SUMMARY = Object.freeze({ summary: true });
var isSummary = (part) => part.classList.contains(`${TL}-summary`);
function onClick2(tl, event) {
  if (pressMore2(tl, event.target)) return;
  const toggle2 = event.target.closest?.(`.${TL}-group-toggle`);
  if (toggle2) {
    tl.fold(toggle2.getAttribute("data-group-id"), toggle2.getAttribute("aria-expanded") === "true");
    return;
  }
  const part = itemNodeOf(event.target, tl.sheet);
  if (!part || tl.state.pending) return;
  const id = itemIdOf(part);
  select2(tl, id);
  if (isSummary(part)) tl.callbacks.onActivate?.(id, SUMMARY);
  else tl.callbacks.onActivate?.(id);
}
function onFocusIn2(tl, event) {
  const face = event.target.closest?.(`${BAR}, .${TL}-group-label`);
  if (!face || tl.state.pending || tl.drawing) return;
  const id = face.getAttribute("data-ui-id");
  if (face.matches(BAR)) tl.state.focusId = id;
  select2(tl, id);
}
function onContextMenu2(tl, event) {
  const part = itemNodeOf(event.target, tl.sheet);
  if (!part || typeof tl.callbacks.onMenu !== "function") return;
  event.preventDefault();
  const point = { x: event.clientX, y: event.clientY };
  if (isSummary(part)) tl.callbacks.onMenu(itemIdOf(part), point, SUMMARY);
  else tl.callbacks.onMenu(itemIdOf(part), point);
}
function bindTimeline(tl) {
  tl.writeTabStops = () => writeTabStops2(tl);
  tl.fold = (groupId, collapsed) => tl.callbacks.onToggleGroup?.(groupId, collapsed);
  tl.life.on(tl.sheet, "click", (event) => onClick2(tl, event));
  tl.life.on(tl.sheet, "contextmenu", (event) => onContextMenu2(tl, event));
  tl.life.on(tl.sheet, "focusin", (event) => onFocusIn2(tl, event));
  bindDraw2(tl);
  bindEdge(tl);
  bindKeys3(tl);
  bindMove2(tl);
  bindCreate(tl);
  bindLinks(tl);
  bindGutter(tl);
  bindZoom(tl);
  bindReach(tl);
  bindPlace(tl);
  bindWindow(tl);
}

// ui/timeline/timeline.js
var TIMELINE_LABELS = /* @__PURE__ */ Object.freeze({
  scale: "Zoom",
  day: "Days",
  week: "Weeks",
  month: "Months",
  today: "Today",
  done: "done",
  milestone: "milestone",
  gutter: "Resize the title column",
  moved: "Moved",
  notMoved: "Not moved.",
  cancelled: "Move cancelled.",
  pickedUp: "Picked up {title}. Left and Right move it a day, Shift resizes, Space drops it, Escape cancels.",
  hintNone: "Select a bar to see what it can do",
  hintCreate: "drag on a row to add one",
  hintOpen: "Enter opens",
  hintMove: "drag to move",
  hintResize: "drag an edge to resize",
  hintKeys: "Alt+arrows move a day, Alt+Shift+arrows resize",
  hintLink: "drag the dot to link",
  hintDelete: "Delete removes",
  hintAdd: "+ or Insert to add one here",
  hintFold: "Space folds",
  hintMore: "Shift+F10 or right-click for more",
  hintMoreHeld: MORE_HELD_WORDS,
  more: MORE_WORDS,
  clamped: "shown wider than it lasts",
  link: "Drag to another bar to link them",
  dependsOn: "depends on",
  collapse: "Collapse {group}",
  expand: "Expand {group}",
  hidden: "{count} hidden",
  summary: "{group}, {count} items",
  summaryOne: "{group}, 1 item",
  hintDraw: "N draws a span",
  hintDrawing: "Left and Right move the day · Up and Down the row · Enter or Space starts the span · Escape cancels",
  hintSpanning: "Left and Right set the end · Enter or Space adds the span · Escape cancels",
  drawStart: "Drawing a span in {group}: {date}.",
  drawAnchor: "Starts {date}.",
  drawn: "Span drawn: {range}, {group}.",
  drawCancelled: "No span drawn.",
  days: "{count} days",
  oneDay: "1 day",
  noGroup: "no group"
});
function toolbar2(tl) {
  const bar = el(tl.doc, "div", { className: `${TL}-toolbar` });
  tl.scaleGroup = el(tl.doc, "div", { className: `${TL}-scales`, attrs: { role: "group", "aria-label": tl.labels.scale } });
  const today = button(tl.doc, { className: `${TL}-today`, label: tl.labels.today, signal: tl.life.signal, onClick: () => tl.scrollToNow() });
  const range = el(tl.doc, "span", { className: `${TL}-range` });
  tl.rangeText = textNode(tl.doc, range);
  bar.append(tl.scaleGroup, today, range);
  return bar;
}
function writeScales(tl) {
  if (!tl.scaleGroup.firstChild) {
    tl.scaleGroup.append(...Object.keys(TIMELINE_SCALES).map((scale) => button(tl.doc, {
      className: `${TL}-scale`,
      label: "",
      signal: tl.life.signal,
      attrs: { "data-scale": scale },
      onClick: () => tl.setScale(scale)
    })));
  }
  for (const node of tl.scaleGroup.children) {
    const scale = node.getAttribute("data-scale");
    writeText(node.firstChild, tl.labels[scale]);
    node.setAttribute("aria-pressed", String(scale === tl.state.scale));
  }
}
function heldFocus2(tl) {
  const held = tl.sheet.contains(tl.doc.activeElement) ? tl.doc.activeElement : null;
  return {
    bar: Boolean(held?.closest(`.${TL}-bar`)),
    gutter: Boolean(held?.closest(`.${TL}-gutter-handle`)),
    more: Boolean(held?.closest(`.${MORE_CLASS}`)),
    groupId: held?.closest(`.${TL}-group-label`)?.getAttribute("data-ui-id") ?? null
  };
}
function headingOf(tl, groupId) {
  if (groupId === null) return null;
  return Array.from(tl.sheet.querySelectorAll(`.${TL}-group-label`)).find((node) => node.getAttribute("data-ui-id") === groupId) ?? null;
}
function drawnItems(state) {
  const { pending } = state;
  return pending ? state.items.map((item) => item.id === pending.id ? { ...item, ...pending.times } : item) : state.items;
}
function gridNode(tl, items) {
  const { state } = tl;
  const grid = el(tl.doc, "div", { className: `${TL}-grid` });
  grid.style.setProperty("--timeline-width", `${widthOf(tl.domain, state.scale)}px`);
  const now = el(tl.doc, "div", { className: `${TL}-now`, attrs: { "aria-hidden": "true" } });
  now.style.setProperty("--timeline-x", `${xOf(state.now, tl.domain, state.scale)}px`);
  grid.append(axisNode(tl), linksLayer(tl), rowsNode(tl, items), now);
  return grid;
}
function render6(tl) {
  if (!hasBox(tl)) {
    waitForBox(tl);
    return;
  }
  const { state } = tl;
  const view = viewBefore(tl);
  const keep = placeToKeep(tl);
  tl.domain = state.pending?.domain ?? domainOf(tl);
  const held = heldFocus2(tl);
  tl.drawing = true;
  tl.sheet.replaceChildren(gridNode(tl, drawnItems(state)));
  viewAfter(tl, view);
  if (keep) putPlace(tl, keep);
  drawLinks(tl);
  placeCursor(tl);
  const heading = headingOf(tl, held.groupId);
  if (!tl.focusAfter && !heading && (held.bar || held.groupId !== null)) tl.focusAfter = "keep";
  writeScales(tl);
  tl.writeTabStops();
  paint3(tl);
  heading?.focus({ preventScroll: true });
  if (held.more) tl.more?.focus({ preventScroll: true });
  if (held.gutter) tl.gutterNode?.focus({ preventScroll: true });
  tl.drawing = false;
  if (tl.reveal !== null && !tl.busy() && revealItem(tl, tl.reveal)) tl.reveal = null;
  tl.windowMoved();
  notePlace(tl);
}
function writeFormats(tl, locale) {
  tl.locale = locale;
  tl.format = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  tl.tickFormats = {
    day: new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric" }),
    week: tl.format,
    month: new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" })
  };
}
function adopt(tl, model) {
  const { seen, state } = tl;
  const selectedId = model.selectedId ?? null;
  if (selectedId !== seen.selectedId) {
    seen.selectedId = selectedId;
    state.selectedId = selectedId;
  }
  const gutter = Number.isFinite(model.gutter) ? model.gutter : null;
  if (gutter !== seen.gutter) {
    seen.gutter = gutter;
    if (gutter !== null) applyGutter(tl, gutter);
  }
  const focusId = model.focusId ?? null;
  if (focusId !== seen.focusId) {
    seen.focusId = focusId;
    if (focusId !== null) {
      tl.reveal = focusId;
      state.focusId = focusId;
    }
  }
}
function applyModel2(tl, model) {
  const { state } = tl;
  if (model.scale !== tl.lastScale && Object.hasOwn(TIMELINE_SCALES, model.scale)) state.scale = model.scale;
  tl.lastScale = model.scale;
  state.items = normalizeItems(model.items ?? []);
  tl.byId = new Map(state.items.map((item) => [item.id, item]));
  tl.groups = new Map(state.items.filter((item) => item.groupId !== null).map((item) => [item.groupId, item.collapsed]));
  state.now = toDate(model.now) ?? /* @__PURE__ */ new Date();
  if (model.locale !== tl.locale || !tl.format) writeFormats(tl, model.locale);
  tl.root.setAttribute("aria-label", String(model.label ?? "Timeline"));
  adopt(tl, model);
}
function markAbilities(root, callbacks) {
  for (const [name, callback] of [
    ["data-can-move", "onChange"],
    ["data-can-create", "onCreate"],
    ["data-can-link", "onLink"],
    ["data-can-fold", "onToggleGroup"],
    ["data-can-menu", "onMenu"]
  ]) {
    if (typeof callbacks[callback] === "function") root.setAttribute(name, "");
  }
}
function timelineState(doc, life, root, callbacks) {
  return {
    doc,
    life,
    root,
    callbacks,
    id: uniqueId(TL),
    labels: { ...TIMELINE_LABELS, ...callbacks.labels },
    format: null,
    lastScale: void 0,
    byId: /* @__PURE__ */ new Map(),
    groups: /* @__PURE__ */ new Map(),
    seen: { selectedId: void 0, gutter: void 0, focusId: void 0 },
    reach: { before: 0, after: 0, room: 0 },
    reveal: null,
    asked: null,
    held: null,
    away: false,
    looking: false,
    state: { scale: "week", items: [], now: /* @__PURE__ */ new Date(), pending: null, creating: null, linking: null, cursor: null, focusId: null, selectedId: null, gutter: null }
  };
}
function createTimeline(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: TL, attrs: { role: "region", [CONTROL_ATTR]: true } });
  markAbilities(root, callbacks);
  const tl = timelineState(doc, life, root, callbacks);
  root.append(toolbar2(tl));
  tl.hint = el(doc, "p", { className: `${TL}-hint` });
  tl.hintText = textNode(doc, tl.hint);
  tl.sheet = el(doc, "div", { className: `${TL}-sheet` });
  root.append(tl.hint, tl.sheet);
  tl.region = createLiveRegion(root);
  tl.say = (text2) => say(tl.region, text2);
  tl.render = () => render6(tl);
  tl.paint = () => paint3(tl);
  tl.busy = () => Boolean(tl.state.pending || tl.state.creating || tl.state.linking);
  tl.describe = (item) => describeItem(tl, item);
  tl.scrollToNow = () => {
    const x = xOf(tl.state.now, tl.domain, tl.state.scale);
    tl.sheet.scrollLeft = Math.max(0, x - tl.sheet.clientWidth / 2);
  };
  bindTimeline(tl);
  host.append(root);
  return {
    update(model = {}) {
      if (life.dead) return;
      applyModel2(tl, model);
      if (!tl.busy()) tl.render();
    },
    /** The moment at the track's left edge and the rows' offset (`./place.js`); null before anything is drawn or asked. */
    visibleStart: () => visibleStart(tl),
    /** Show `date` at the track's left edge and, given, the rows at `top`: once, at once or at the first draw. False for no date. */
    scrollToDate: (date, { top } = {}) => !life.dead && scrollToDate(tl, date, top),
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}

// ui/graph/layout.js
var NODE_WIDTH = 208;
var NODE_HEIGHT = 68;
var LAYER_GAP = 288;
var ROW_GAP = 84;
var ROOT_GAP = 28;
var EDGE_KINDS = Object.freeze(["parent", "related", "depends-on"]);
var text = (value) => value === void 0 || value === null ? "" : String(value);
function timeOf(time) {
  if (typeof time === "string") return time.trim() === "" ? null : { iso: "", text: time, title: "" };
  if (!time || typeof time !== "object" || !time.text) return null;
  return { iso: text(time.iso), text: String(time.text), title: text(time.title ?? time.iso) };
}
function nodeOf(node, ids) {
  const id = node?.id;
  if (typeof id !== "string" || id.trim() === "" || ids.has(id)) throw new TypeError(`Invalid or duplicate graph node id: ${String(id)}`);
  ids.add(id);
  const count = Number(node.childCount);
  return {
    id,
    label: text(node.label ?? id),
    detail: text(node.detail),
    status: text(node.status),
    tone: text(node.tone),
    time: timeOf(node.time),
    childCount: Number.isInteger(count) && count > 0 ? count : null,
    collapsed: Boolean(node.collapsed)
  };
}
function normalizeGraph(nodes, edges) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) throw new TypeError("Graph nodes and edges must be arrays");
  const ids = /* @__PURE__ */ new Set();
  const clean = nodes.map((node) => nodeOf(node, ids));
  const links = [];
  edges.forEach((edge, index) => {
    if (!ids.has(edge?.from) || !ids.has(edge?.to) || edge.from === edge.to) return;
    const kind = EDGE_KINDS.includes(edge.kind) ? edge.kind : "related";
    links.push({ id: String(edge.id ?? `${edge.from}->${edge.to}#${index}`), from: edge.from, to: edge.to, kind, label: text(edge.label) });
  });
  return { nodes: clean, edges: links };
}
function cutLoops(nodes, parent) {
  const order = new Map(nodes.map((node, index) => [node.id, index]));
  for (const node of nodes) {
    const path = [];
    const seen = /* @__PURE__ */ new Set();
    let at = node.id;
    while (parent.has(at) && !seen.has(at)) {
      seen.add(at);
      path.push(at);
      at = parent.get(at);
    }
    if (!seen.has(at)) continue;
    const loop = path.slice(path.indexOf(at));
    parent.delete(loop.reduce((first, id) => order.get(id) < order.get(first) ? id : first));
  }
}
function forestOf2(nodes, edges) {
  const parent = /* @__PURE__ */ new Map();
  for (const edge of edges) if (edge.kind === "parent" && !parent.has(edge.to)) parent.set(edge.to, edge.from);
  cutLoops(nodes, parent);
  const children = new Map(nodes.map((node) => [node.id, []]));
  const roots = [];
  for (const node of nodes) (parent.has(node.id) ? children.get(parent.get(node.id)) : roots).push(node.id);
  return { parent, children, roots };
}
function treeRows(forest) {
  const rows = [];
  const walk = (ids, level, parentId) => ids.forEach((id, index) => {
    rows.push({ id, level, position: index + 1, size: ids.length, parentId });
    walk(forest.children.get(id), level + 1, id);
  });
  walk(forest.roots, 1, null);
  return rows;
}
function layoutForest(forest) {
  const positions = /* @__PURE__ */ new Map();
  let cursor = 0;
  const place2 = (id, depth) => {
    const kids = forest.children.get(id);
    for (const kid of kids) place2(kid, depth + 1);
    const y = kids.length === 0 ? cursor : (positions.get(kids[0]).y + positions.get(kids.at(-1)).y) / 2;
    if (kids.length === 0) cursor += ROW_GAP;
    positions.set(id, { x: depth * LAYER_GAP, y });
  };
  forest.roots.forEach((root, index) => {
    if (index > 0) cursor += ROOT_GAP;
    place2(root, 0);
  });
  return positions;
}
function layoutGraph(nodes, edges) {
  return layoutForest(forestOf2(nodes, edges));
}
var round = (value) => Math.round(value * 10) / 10;
function anchorsOf(a, b) {
  const ay = a.y + NODE_HEIGHT / 2;
  const by = b.y + NODE_HEIGHT / 2;
  if (b.x >= a.x + NODE_WIDTH) {
    const bend = Math.max(24, (b.x - a.x - NODE_WIDTH) / 2);
    return [{ x: a.x + NODE_WIDTH, y: ay }, { x: a.x + NODE_WIDTH + bend, y: ay }, { x: b.x - bend, y: by }, { x: b.x, y: by }];
  }
  if (b.x + NODE_WIDTH <= a.x) {
    const bend = Math.max(24, (a.x - b.x - NODE_WIDTH) / 2);
    return [{ x: a.x, y: ay }, { x: a.x - bend, y: ay }, { x: b.x + NODE_WIDTH + bend, y: by }, { x: b.x + NODE_WIDTH, y: by }];
  }
  const out = Math.max(a.x, b.x) + NODE_WIDTH + 40 + Math.abs(by - ay) / 4;
  return [{ x: a.x + NODE_WIDTH, y: ay }, { x: out, y: ay }, { x: out, y: by }, { x: b.x + NODE_WIDTH, y: by }];
}
function edgePoint(a, b, t) {
  const [p0, p1, p2, p3] = anchorsOf(a, b);
  const u = 1 - t;
  const along = (axis) => round(u * u * u * p0[axis] + 3 * u * u * t * p1[axis] + 3 * u * t * t * p2[axis] + t * t * t * p3[axis]);
  return { x: along("x"), y: along("y") };
}
function edgePath(a, b) {
  const [p0, p1, p2, p3] = anchorsOf(a, b).map((point) => ({ x: round(point.x), y: round(point.y) }));
  return { d: `M${p0.x} ${p0.y} C${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`, mid: edgePoint(a, b, 0.5) };
}
function boundsOf(positions) {
  const all = [...positions.values()];
  if (all.length === 0) return null;
  const xs = all.map((point) => point.x);
  const ys = all.map((point) => point.y);
  return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs) + NODE_WIDTH, bottom: Math.max(...ys) + NODE_HEIGHT };
}
function emphasisOf(selectedId, forest, edges) {
  if (selectedId === null || !forest.children.has(selectedId)) return null;
  const path = /* @__PURE__ */ new Set([selectedId]);
  for (let at = forest.parent.get(selectedId); at !== void 0; at = forest.parent.get(at)) path.add(at);
  const lit = new Set(path);
  for (const edge of edges) {
    if (edge.from === selectedId) lit.add(edge.to);
    if (edge.to === selectedId) lit.add(edge.from);
  }
  return { path, lit };
}
function edgeLit(edge, selectedId, emphasis) {
  if (edge.from === selectedId || edge.to === selectedId) return true;
  return edge.kind === "parent" && emphasis.path.has(edge.from) && emphasis.path.has(edge.to);
}
function treeStep(forest, rows, id, key) {
  if (key === "Home") return rows[0]?.id ?? null;
  if (key === "End") return rows.at(-1)?.id ?? null;
  const parentId = forest.parent.get(id);
  if (key === "ArrowLeft") return parentId ?? null;
  if (key === "ArrowRight") return forest.children.get(id)?.[0] ?? null;
  const siblings = parentId === void 0 ? forest.roots : forest.children.get(parentId);
  const step = { ArrowUp: -1, ArrowDown: 1 }[key];
  return step === void 0 ? null : siblings[siblings.indexOf(id) + step] ?? null;
}

// ui/graph/labels.js
var CHAR_PX = 6.6;
var PAD_PX = 4;
var HEIGHT_PX = 16;
var GAP_PX = 2;
var REACH = 0.3;
var STEP = 0.025;
var labelSize = (text2) => ({ width: Math.ceil(text2.length * CHAR_PX) + PAD_PX * 2, height: HEIGHT_PX });
var lap = (a, b) => Math.max(0, Math.min(a.x + a.width / 2, b.x + b.width / 2) - Math.max(a.x - a.width / 2, b.x - b.width / 2) + GAP_PX) * Math.max(0, Math.min(a.y + a.height / 2, b.y + b.height / 2) - Math.max(a.y - a.height / 2, b.y - b.height / 2) + GAP_PX);
var OFFSETS = Array.from({ length: Math.round(REACH / STEP) * 2 + 1 }, (_, at) => at === 0 ? 0 : (at % 2 === 1 ? 1 : -1) * Math.ceil(at / 2) * STEP);
function placeLabels(labels) {
  const placed = [];
  for (const { text: text2, at } of labels) {
    const size = labelSize(text2);
    const chips = OFFSETS.map((offset) => ({ ...at(0.5 + offset), ...size }));
    const overlap = (chip) => placed.reduce((sum, other) => sum + lap(chip, other), 0);
    placed.push(chips.find((chip) => overlap(chip) === 0) ?? chips.reduce((best, chip) => overlap(chip) < overlap(best) ? chip : best));
  }
  return placed;
}

// ui/graph/edges.js
var PART = "cloudcanvas-ui-graph";
function arrowDefs2(g) {
  const marker = svg(g.doc, "marker", { id: g.markerId, viewBox: "0 0 10 10", refX: 10, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
  marker.append(svg(g.doc, "path", { d: "M0,0 L10,5 L0,10 z", class: `${PART}-arrow` }));
  const defs = svg(g.doc, "defs", {});
  defs.append(marker);
  return defs;
}
function dimmed(g, edge, emphasis) {
  if (emphasis && !edgeLit(edge, g.state.selectedId, emphasis)) return true;
  const label = (id) => g.byId.get(id)?.label ?? "";
  return !matchesQuery(label(edge.from), g.state.query) && !matchesQuery(label(edge.to), g.state.query);
}
function edgeShapes(g, edge, emphasis) {
  const from = g.positions.get(edge.from);
  const to = g.positions.get(edge.to);
  if (!from || !to) return null;
  const { d } = edgePath(from, to);
  const dim = dimmed(g, edge, emphasis) ? " is-dim" : "";
  const path = svg(g.doc, "path", { d, class: `${PART}-edge is-${edge.kind}${dim}`, "data-kind": edge.kind });
  if (edge.kind === "depends-on") path.setAttribute("marker-end", `url(#${g.markerId})`);
  return { path, label: edge.label ? { text: edge.label, dim, at: (t) => edgePoint(from, to, t) } : null };
}
function labelNode(g, { text: text2, dim }, chip) {
  const group = svg(g.doc, "g", { class: `${PART}-edge-label${dim}` });
  group.append(svg(g.doc, "rect", { class: `${PART}-edge-label-back`, x: chip.x - chip.width / 2, y: chip.y - chip.height / 2, width: chip.width, height: chip.height, rx: 4 }));
  const words2 = svg(g.doc, "text", { class: `${PART}-edge-label-text`, x: chip.x, y: chip.y, "text-anchor": "middle", "dominant-baseline": "central" });
  words2.textContent = text2;
  group.append(words2);
  return group;
}
function drawEdges(g, emphasis) {
  const shapes = g.state.edges.map((edge) => edgeShapes(g, edge, emphasis)).filter(Boolean);
  const wanted = shapes.map((shape) => shape.label).filter(Boolean);
  const chips = placeLabels(wanted);
  g.chips = chips;
  g.svg.replaceChildren(arrowDefs2(g), ...shapes.map((shape) => shape.path), ...wanted.map((label, at) => labelNode(g, label, chips[at])));
}
function drawDraft2(g, fromId, to) {
  if (to === null) {
    g.draft?.remove();
    g.draft = null;
    return;
  }
  const start3 = g.positions.get(fromId);
  const sx = start3.x + NODE_WIDTH;
  const sy = start3.y + NODE_HEIGHT / 2;
  const bend = Math.round(Math.max(24, Math.abs(to.x - sx) / 2));
  if (!g.draft) {
    g.draft = svg(g.doc, "path", { class: `${PART}-draft` });
    g.overlay.append(g.draft);
  }
  g.draft.setAttribute("d", `M${sx} ${sy} C${sx + bend} ${sy} ${Math.round(to.x - bend)} ${Math.round(to.y)} ${Math.round(to.x)} ${Math.round(to.y)}`);
}

// ui/graph/node.js
var PART2 = "cloudcanvas-ui-graph";
var NODE_CLASS = `${PART2}-node`;
var TOGGLE_CLASS = `${PART2}-toggle`;
var HANDLE_CLASS = `${PART2}-handle`;
function nodeElement(doc) {
  const node = el(doc, "div", { className: NODE_CLASS, attrs: { role: "treeitem", tabindex: "-1" } });
  const meta = el(doc, "span", { className: `${PART2}-node-meta`, attrs: { "aria-hidden": "true" } });
  meta.append(
    el(doc, "span", { className: `${PART2}-status` }),
    el(doc, "time", { className: `${PART2}-time` }),
    el(doc, "span", { className: TOGGLE_CLASS })
  );
  node.append(
    el(doc, "span", { className: `${PART2}-node-label`, attrs: { "aria-hidden": "true" } }),
    meta,
    el(doc, "span", { className: HANDLE_CLASS, attrs: { "aria-hidden": "true" } })
  );
  return node;
}
function counted(labels, count) {
  return (count === 1 ? labels.child : labels.children).replace("{count}", String(count));
}
function relationsOf(g, id) {
  const name = (other) => g.byId.get(other)?.label ?? other;
  const groups = { dependsOn: [], neededBy: [], relatedTo: [] };
  for (const edge of g.state.edges) {
    if (edge.kind === "parent" || edge.from !== id && edge.to !== id) continue;
    const other = edge.from === id ? edge.to : edge.from;
    if (edge.kind === "related") groups.relatedTo.push(name(other));
    else groups[edge.from === id ? "dependsOn" : "neededBy"].push(name(other));
  }
  return Object.entries(groups).filter(([, names]) => names.length > 0).map(([phrase, names]) => `${g.labels[phrase]} ${names.join(", ")}`);
}
function describeNode(g, node, count) {
  const parts = [node.label, node.detail, node.status, node.time?.text, count > 0 ? counted(g.labels, count) : ""];
  return [...parts.filter(Boolean), ...relationsOf(g, node.id)].join("; ");
}
function writeChip2(chip, value) {
  chip.textContent = value;
  chip.hidden = value === "";
}
function writeTime(element, time) {
  element.textContent = time?.text ?? "";
  element.hidden = !time;
  for (const [name, value] of [["datetime", time?.iso], ["title", time?.title]]) {
    if (value) element.setAttribute(name, value);
    else element.removeAttribute(name);
  }
}
function writeToggle(g, toggle2, node, count) {
  writeChip2(toggle2, count > 0 ? String(count) : "");
  toggle2.setAttribute("title", node.collapsed ? g.labels.expand : g.labels.collapse);
}
function writeTree(element, row, node, count) {
  element.setAttribute("aria-level", String(row.level));
  element.setAttribute("aria-posinset", String(row.position));
  element.setAttribute("aria-setsize", String(row.size));
  if (count > 0) element.setAttribute("aria-expanded", String(!node.collapsed));
  else element.removeAttribute("aria-expanded");
}
function placeNode(element, point) {
  element.style.setProperty("--graph-x", `${point.x}px`);
  element.style.setProperty("--graph-y", `${point.y}px`);
  element.style.setProperty("width", `${NODE_WIDTH}px`);
  element.style.setProperty("height", `${NODE_HEIGHT}px`);
}
function writeNode(g, element, row) {
  const node = g.byId.get(row.id);
  const count = g.countOf(row.id);
  const [label, meta, handle] = element.children;
  const [status, time, toggle2] = meta.children;
  element.setAttribute("data-ui-id", node.id);
  element.setAttribute("title", node.label);
  element.setAttribute("aria-label", describeNode(g, node, count));
  writeTree(element, row, node, count);
  if (node.tone) element.setAttribute("data-tone", node.tone);
  else element.removeAttribute("data-tone");
  label.textContent = node.label;
  writeChip2(status, node.status);
  writeTime(time, node.time);
  writeToggle(g, toggle2, node, count);
  handle.setAttribute("title", g.labels.link);
  placeNode(element, g.positions.get(row.id));
}

// ui/graph/keys.js
var MOVES = /* @__PURE__ */ new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"]);
function toggle(g, id, collapsed) {
  if (!g.callbacks.onToggle || g.countOf(id) === 0) return false;
  g.callbacks.onToggle(id, collapsed);
  return true;
}
function moveKey(g, id, key) {
  const open = g.countOf(id) > 0 && !g.byId.get(id).collapsed;
  if (key === "ArrowRight" && !open && toggle(g, id, false)) return;
  if (key === "ArrowLeft" && open && toggle(g, id, true)) return;
  const next = treeStep(g.forest, g.rows, id, key);
  if (next !== null) g.select(next, { focus: true });
}
function menuPoint2(element) {
  const rect = element.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom };
}
function verbOf2(g, id, event, element) {
  const cb = g.callbacks;
  const menu = event.key === "ContextMenu" || event.key === "F10" && event.shiftKey;
  if (menu) return cb.onMenu ? () => cb.onMenu(id, menuPoint2(element)) : null;
  if (event.key === "Enter") return cb.onActivate ? () => cb.onActivate(id) : null;
  if (event.key === "+" || event.key === "Insert") return cb.onAdd ? () => cb.onAdd(id) : null;
  if (event.key === "Delete" || event.key === "Backspace") return cb.onDelete ? () => cb.onDelete(id) : null;
  if (event.key === " ") return cb.onToggle ? () => toggle(g, id, !g.byId.get(id).collapsed) : null;
  if (event.key === "/") return () => {
    g.search.focus();
    g.search.select?.();
  };
  if (event.key === "0") return () => g.fit({ report: true });
  return null;
}
function onGraphKey(g, event) {
  const element = event.target.closest?.(`.${NODE_CLASS}`);
  if (!element || !g.nodeLayer.contains(element) || isMore(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
  const id = element.getAttribute("data-ui-id");
  if (!g.byId.has(id)) return;
  if (MOVES.has(event.key)) {
    event.preventDefault();
    moveKey(g, id, event.key);
    return;
  }
  const verb = verbOf2(g, id, event, element);
  if (!verb) return;
  event.preventDefault();
  verb();
}

// ui/graph/more.js
var PART3 = "cloudcanvas-ui-graph";
function elementOf(g, id) {
  return Array.from(g.nodeLayer.children).find((node) => node.getAttribute("data-ui-id") === id) ?? null;
}
function syncMore3(g) {
  const id = g.state.selectedId;
  const node = id !== null && typeof g.callbacks.onMenu === "function" && g.drag === null ? elementOf(g, id) : null;
  if (!node) {
    g.more?.remove();
    return;
  }
  g.more ??= moreButton(g.doc, `${PART3}-more`);
  nameMore(g.more, g.labels.more, g.byId.get(id).label);
  if (g.more.parentElement !== node) node.append(g.more);
}
function pressMore3(g, target) {
  if (!isMore(target)) return false;
  const node = target.closest(`.${PART3}-node`);
  g.callbacks.onMenu?.(node.getAttribute("data-ui-id"), belowMore(target.closest(`.${MORE_CLASS}`)));
  return true;
}

// ui/graph/interact.js
var NODE = `.${NODE_CLASS}`;
var MINIMAP = ".cloudcanvas-ui-graph-minimap";
function dragModeOf(g, target) {
  if (!target.closest?.(NODE) || target.closest(`.${TOGGLE_CLASS}`) || isMore(target)) return null;
  if (target.closest(`.${HANDLE_CLASS}`)) return g.callbacks.onConnect ? "link" : null;
  return g.callbacks.onDropOn ? "move" : null;
}
function worldAt(g, point) {
  const rect = g.viewport.getBoundingClientRect();
  return { x: (point.x - rect.left - g.view.x) / g.view.k, y: (point.y - rect.top - g.view.y) / g.view.k };
}
function targetAt(g, drag, point) {
  const node = g.doc.elementFromPoint?.(point.x, point.y)?.closest?.(NODE) ?? null;
  return node && g.nodeLayer.contains(node) && node !== drag.element ? node : null;
}
function startDrag2(g, element, point, mode) {
  const id = element.getAttribute("data-ui-id");
  g.drag = { mode, id, element, press: point, origin: { ...g.positions.get(id) }, target: null };
  if (mode === "move") element.classList.add("is-dragging");
  syncMore3(g);
}
function moveDrag(g, point) {
  const drag = g.drag;
  if (drag.mode === "move") {
    const at = { x: drag.origin.x + (point.x - drag.press.x) / g.view.k, y: drag.origin.y + (point.y - drag.press.y) / g.view.k };
    g.positions.set(drag.id, at);
    placeNode(drag.element, at);
    drawEdges(g, g.emphasis);
  } else {
    drawDraft2(g, drag.id, worldAt(g, point));
  }
  setDropTarget(drag, targetAt(g, drag, point));
}
function endDrag(g, point) {
  const { mode, id, element, target } = g.drag;
  setDropTarget(g.drag, null);
  g.drag = null;
  element.classList.remove("is-dragging");
  drawDraft2(g, id, null);
  g.render();
  if (!point || !target) return;
  const targetId = target.getAttribute("data-ui-id");
  if (mode === "move") g.callbacks.onDropOn(id, targetId);
  else g.callbacks.onConnect(id, targetId);
}
function bindNodeDrag(g) {
  trackDrag(g.life, g.viewport, {
    selector: NODE,
    canStart: (item, event) => !g.drag && dragModeOf(g, event.target) !== null,
    onStart: (item, point, target) => startDrag2(g, item, point, dragModeOf(g, target)),
    onMove: (point) => {
      if (g.drag) moveDrag(g, point);
    },
    onEnd: (point) => {
      if (g.drag) endDrag(g, point);
    }
  });
}
var middle2 = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
var apart2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function follow2(g, gesture, pointers) {
  const points = [...pointers.values()];
  const rect = g.viewport.getBoundingClientRect();
  if (points.length === 1) {
    g.view = { ...gesture.view, x: gesture.view.x + points[0].x - gesture.at.x, y: gesture.view.y + points[0].y - gesture.at.y };
  } else {
    const centre = middle2(points[0], points[1]);
    const anchor = { x: (gesture.at.x - rect.left - gesture.view.x) / gesture.view.k, y: (gesture.at.y - rect.top - gesture.view.y) / gesture.view.k };
    const k = g.clampScale(gesture.view.k * apart2(points[0], points[1]) / gesture.span);
    g.view = { k, x: centre.x - rect.left - anchor.x * k, y: centre.y - rect.top - anchor.y * k };
  }
  g.fitted = true;
  g.applyView({ report: true });
}
function gestureOf(g, pointers) {
  const points = [...pointers.values()].slice(0, 2);
  const at = points.length === 2 ? middle2(points[0], points[1]) : points[0];
  return { at, view: { ...g.view }, span: points.length === 2 ? Math.max(1, apart2(points[0], points[1])) : 1 };
}
var PAN_SLOP_PX = 4;
function holdClick(g) {
  g.panned = true;
  g.life.later(() => {
    g.panned = false;
  }, 0);
}
function capture(g, pointerId) {
  try {
    g.viewport.setPointerCapture?.(pointerId);
  } catch {
  }
}
function bindPan(g) {
  const pointers = /* @__PURE__ */ new Map();
  let gesture = null;
  g.life.on(g.viewport, "pointerdown", (event) => {
    const target = event.target;
    if (event.button !== 0 || g.drag || target.closest?.(MINIMAP) || pointers.size >= 2) return;
    if (target.closest?.(NODE) && (dragModeOf(g, target) !== null || target.closest(`.${TOGGLE_CLASS}`) || isMore(target))) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gesture = { ...gestureOf(g, pointers), moved: pointers.size > 1 };
  });
  g.life.on(g.viewport, "pointermove", (event) => {
    if (!pointers.has(event.pointerId) || g.drag) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!gesture.moved && apart2(gesture.at, { x: event.clientX, y: event.clientY }) > PAN_SLOP_PX) gesture.moved = true;
    if (!gesture.moved) return;
    for (const id of pointers.keys()) capture(g, id);
    g.viewport.classList.add("is-panning");
    follow2(g, gesture, pointers);
  });
  const end3 = (event) => {
    if (!pointers.delete(event.pointerId)) return;
    if (gesture?.moved) holdClick(g);
    gesture = pointers.size > 0 ? { ...gestureOf(g, pointers), moved: true } : null;
    if (!gesture) g.viewport.classList.remove("is-panning");
  };
  g.life.on(g.viewport, "pointerup", end3);
  g.life.on(g.viewport, "pointercancel", end3);
}
function bindWheel2(g) {
  g.life.on(g.viewport, "wheel", (event) => {
    event.preventDefault();
    const rect = g.viewport.getBoundingClientRect();
    const { dx, dy } = normalizeWheelDeltas(event, rect.height);
    const pinch = event.ctrlKey || event.metaKey;
    if (pinch || isDiscreteWheel(event)) {
      g.zoomAt(wheelZoomFactor(dy, pinch ? PINCH_ZOOM_K : WHEEL_ZOOM_K), { x: event.clientX, y: event.clientY });
      return;
    }
    g.view = { ...g.view, x: g.view.x - dx, y: g.view.y - dy };
    g.fitted = true;
    g.applyView({ report: true });
  }, { passive: false });
}
function onPress2(g, event) {
  if (pressMore3(g, event.target)) return;
  const element = event.target.closest?.(NODE);
  if (!element || !g.nodeLayer.contains(element) || !g.byId.has(element.getAttribute("data-ui-id"))) return;
  const id = element.getAttribute("data-ui-id");
  if (g.panned) return;
  if (event.target.closest(`.${TOGGLE_CLASS}`)) {
    if (g.callbacks.onToggle && g.countOf(id) > 0) g.callbacks.onToggle(id, !g.byId.get(id).collapsed);
    return;
  }
  if (event.target.closest(`.${HANDLE_CLASS}`)) return;
  g.select(id, { focus: false });
  g.callbacks.onActivate?.(id);
}
function onMenu(g, event) {
  const element = event.target.closest?.(NODE);
  if (!g.callbacks.onMenu || !element || !g.nodeLayer.contains(element)) return;
  event.preventDefault();
  g.callbacks.onMenu(element.getAttribute("data-ui-id"), { x: event.clientX, y: event.clientY });
}
function bindGraph(g) {
  g.life.on(g.viewport, "click", (event) => onPress2(g, event));
  g.life.on(g.viewport, "contextmenu", (event) => onMenu(g, event));
  g.life.on(g.viewport, "keydown", (event) => onGraphKey(g, event));
  g.life.on(g.viewport, "focusin", (event) => {
    const element = event.target.closest?.(NODE);
    if (element && g.nodeLayer.contains(element)) g.state.focusId = element.getAttribute("data-ui-id");
  });
  bindPan(g);
  bindWheel2(g);
  bindNodeDrag(g);
}

// ui/graph/minimap.js
var PART4 = "cloudcanvas-ui-graph-minimap";
var MARGIN = 40;
function fitsInView(g, box, rect) {
  const { x, y, k } = g.view;
  return box.left * k + x >= 0 && box.top * k + y >= 0 && box.right * k + x <= rect.width && box.bottom * k + y <= rect.height;
}
function worldAt2(map, event) {
  const rect = map.element.getBoundingClientRect();
  const { box } = map;
  const width = box.right - box.left;
  const height = box.bottom - box.top;
  const scale = Math.min(rect.width / width, rect.height / height);
  if (!(scale > 0)) return null;
  const left = rect.left + (rect.width - width * scale) / 2;
  const top = rect.top + (rect.height - height * scale) / 2;
  return { x: box.left + (event.clientX - left) / scale, y: box.top + (event.clientY - top) / scale };
}
function centreOn(g, map, event) {
  const point = map.box ? worldAt2(map, event) : null;
  const rect = g.viewport.getBoundingClientRect();
  if (!point) return;
  const { k } = g.view;
  g.view = { k, x: rect.width / 2 - point.x * k, y: rect.height / 2 - point.y * k };
  g.fitted = true;
  g.applyView({ report: true });
}
function bindMinimap(g, map) {
  let pressed = null;
  g.life.on(map.element, "pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    pressed = event.pointerId;
    try {
      map.element.setPointerCapture?.(event.pointerId);
    } catch {
    }
    centreOn(g, map, event);
  });
  g.life.on(map.element, "pointermove", (event) => {
    if (event.pointerId === pressed) centreOn(g, map, event);
  });
  const release2 = (event) => {
    if (event.pointerId === pressed) pressed = null;
  };
  g.life.on(map.element, "pointerup", release2);
  g.life.on(map.element, "pointercancel", release2);
}
function createMinimap(g) {
  const element = el(g.doc, "div", { className: PART4, attrs: { "aria-hidden": "true" } });
  const picture = svg(g.doc, "svg", { class: `${PART4}-picture`, preserveAspectRatio: "xMidYMid meet" });
  const nodes = svg(g.doc, "g", {});
  const frame = svg(g.doc, "rect", { class: `${PART4}-view` });
  picture.append(nodes, frame);
  element.append(picture);
  element.hidden = true;
  const map = { element, box: null };
  map.drawNodes = () => {
    const bounds = boundsOf(g.positions ?? /* @__PURE__ */ new Map());
    map.box = bounds && { left: bounds.left - MARGIN, top: bounds.top - MARGIN, right: bounds.right + MARGIN, bottom: bounds.bottom + MARGIN };
    if (map.box) picture.setAttribute("viewBox", `${map.box.left} ${map.box.top} ${map.box.right - map.box.left} ${map.box.bottom - map.box.top}`);
    nodes.replaceChildren(...[...g.positions ?? /* @__PURE__ */ new Map()].map(([id, point]) => svg(g.doc, "rect", {
      x: point.x,
      y: point.y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      rx: 8,
      class: `${PART4}-node${id === g.state.selectedId ? " is-selected" : ""}`
    })));
  };
  map.drawView = () => {
    const rect = g.viewport.getBoundingClientRect();
    const bounds = boundsOf(g.positions ?? /* @__PURE__ */ new Map());
    element.hidden = !bounds || !(rect.width > 0) || !(rect.height > 0) || fitsInView(g, bounds, rect);
    if (element.hidden) return;
    const { x, y, k } = g.view;
    const box = map.box;
    const left = Math.max(box.left, -x / k);
    const top = Math.max(box.top, -y / k);
    const seen = { x: left, y: top, width: Math.min(box.right, (rect.width - x) / k) - left, height: Math.min(box.bottom, (rect.height - y) / k) - top };
    frame.setAttribute("visibility", seen.width > 0 && seen.height > 0 ? "visible" : "hidden");
    for (const [name, value] of Object.entries(seen)) frame.setAttribute(name, String(Math.round(Math.max(0, value))));
  };
  bindMinimap(g, map);
  return map;
}

// ui/graph/view.js
var MIN_SCALE = 0.2;
var MAX_SCALE = 3;
var FIT_MAX = 1;
var READABLE = 0.8;
var PAD = 24;
var MARGIN2 = 16;
var REPORT_MS = 300;
function scheduleReport(g) {
  g.cancelReport?.();
  g.cancelReport = g.life.later(() => {
    g.cancelReport = null;
    const view = { x: Math.round(g.view.x), y: Math.round(g.view.y), scale: Math.round(g.view.k * 1e3) / 1e3 };
    g.seen.viewport = `${view.x},${view.y},${view.scale}`;
    g.callbacks.onViewport?.(view);
  }, REPORT_MS);
}
function applyView(g, report) {
  const { x, y, k } = g.view;
  g.world.style.setProperty("transform", `translate(${x}px, ${y}px) scale(${k})`);
  g.world.style.setProperty("--graph-k", String(k));
  g.minimap.drawView();
  if (!report) return;
  g.wait.focusId = null;
  scheduleReport(g);
}
function frameOf(g) {
  const box = boundsOf(g.positions);
  const rect = g.viewport.getBoundingClientRect();
  if (!box || !(rect.width > 0) || !(rect.height > 0)) return null;
  for (const chip of g.chips ?? []) {
    box.left = Math.min(box.left, chip.x - chip.width / 2);
    box.right = Math.max(box.right, chip.x + chip.width / 2);
    box.top = Math.min(box.top, chip.y - chip.height / 2);
    box.bottom = Math.max(box.bottom, chip.y + chip.height / 2);
  }
  return { box, rect };
}
function fitScale({ box, rect }) {
  return Math.min((rect.width - PAD * 2) / (box.right - box.left), (rect.height - PAD * 2) / (box.bottom - box.top));
}
function markAuto(g, width) {
  g.auto = { x: g.view.x, y: g.view.y, k: g.view.k, width };
}
function followsWidth(g, width) {
  const auto = g.auto;
  return auto !== null && auto.width !== width && auto.x === g.view.x && auto.y === g.view.y && auto.k === g.view.k;
}
function fit3(g, report) {
  const frame = frameOf(g);
  if (!frame) return false;
  const { box, rect } = frame;
  const k = clamp(fitScale(frame), MIN_SCALE, FIT_MAX);
  g.view = { k, x: (rect.width - (box.right - box.left) * k) / 2 - box.left * k, y: (rect.height - (box.bottom - box.top) * k) / 2 - box.top * k };
  g.fitted = true;
  markAuto(g, rect.width);
  applyView(g, report);
  return true;
}
function start2(g) {
  const frame = frameOf(g);
  if (!frame) return;
  if (fitScale(frame) >= READABLE) {
    fit3(g, false);
    return;
  }
  const { box, rect } = frame;
  const k = READABLE;
  const root = g.positions.get(g.forest.roots[0]);
  const x = PAD - box.left * k;
  const whole = (box.bottom - box.top) * k <= rect.height - PAD * 2;
  const y = whole ? PAD - box.top * k : rect.height / 2 - (root.y + NODE_HEIGHT / 2) * k;
  g.view = { k, x, y };
  g.fitted = true;
  if (g.state.selectedId !== null) reveal2(g, g.state.selectedId, { report: false, nearest: true });
  markAuto(g, rect.width);
}
function zoomAt(g, factor, point) {
  const rect = g.viewport.getBoundingClientRect();
  const at = Number.isFinite(point?.x) && Number.isFinite(point?.y);
  const px = at ? point.x - rect.left : rect.width / 2;
  const py = at ? point.y - rect.top : rect.height / 2;
  const k = clamp(g.view.k * factor, MIN_SCALE, MAX_SCALE);
  g.view = { k, x: px - (px - g.view.x) * (k / g.view.k), y: py - (py - g.view.y) * (k / g.view.k) };
  g.fitted = true;
  applyView(g, true);
}
var nudge = (at, size, room) => at < MARGIN2 ? MARGIN2 - at : room - MARGIN2 - (at + size);
function reveal2(g, id, { report, nearest = false }) {
  const point = g.positions.get(id);
  const rect = g.viewport.getBoundingClientRect();
  if (!point || !(rect.width > 0) || !(rect.height > 0)) return;
  const { k } = g.view;
  let { x, y } = g.view;
  const left = point.x * k + x;
  const top = point.y * k + y;
  if (left < MARGIN2 || left + NODE_WIDTH * k > rect.width - MARGIN2) x = nearest ? x + nudge(left, NODE_WIDTH * k, rect.width) : rect.width / 2 - (point.x + NODE_WIDTH / 2) * k;
  if (top < MARGIN2 || top + NODE_HEIGHT * k > rect.height - MARGIN2) y = nearest ? y + nudge(top, NODE_HEIGHT * k, rect.height) : rect.height / 2 - (point.y + NODE_HEIGHT / 2) * k;
  if (x === g.view.x && y === g.view.y) return;
  g.view = { k, x, y };
  g.fitted = true;
  applyView(g, report);
}
function adopt2(g, viewport, replaced) {
  if (!viewport || ![viewport.x, viewport.y, viewport.scale].every(Number.isFinite)) {
    if (replaced) g.fitted = false;
    return;
  }
  const key = `${viewport.x},${viewport.y},${viewport.scale}`;
  if (key === g.seen.viewport) return;
  g.seen.viewport = key;
  g.view = { x: viewport.x, y: viewport.y, k: clamp(viewport.scale, MIN_SCALE, MAX_SCALE) };
  g.fitted = true;
}
function observeSize(g) {
  const Observer = g.doc.defaultView?.ResizeObserver;
  if (typeof Observer !== "function") return;
  const observer = new Observer(() => {
    if (g.life.dead || g.drag) return;
    if (!g.fitted || followsWidth(g, g.viewport.getBoundingClientRect().width)) start2(g);
    applyView(g, false);
  });
  observer.observe(g.viewport);
  g.life.add(() => observer.disconnect());
}
function createViewModel(g) {
  g.clampScale = (k) => clamp(k, MIN_SCALE, MAX_SCALE);
  g.applyView = ({ report = false } = {}) => applyView(g, report);
  g.fit = ({ report = false } = {}) => fit3(g, report);
  g.zoomAt = (factor, point) => zoomAt(g, factor, point);
  observeSize(g);
  return { start: () => start2(g), reveal: (id, options) => reveal2(g, id, options), adopt: (viewport, replaced) => adopt2(g, viewport, replaced) };
}

// ui/graph/graph.js
var GRAPH = "cloudcanvas-ui-graph";
var GRAPH_LABELS = /* @__PURE__ */ Object.freeze({
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  fit: "Fit",
  search: "Search the map",
  searchPlaceholder: "Search",
  child: "1 child",
  children: "{count} children",
  dependsOn: "depends on",
  neededBy: "needed by",
  relatedTo: "related to",
  expand: "Show children",
  collapse: "Hide children",
  link: "Drag to another node to link them",
  matches: "{count} matching",
  noMatches: "Nothing matches “{query}”",
  more: MORE_WORDS,
  hintNone: "Select a node to see what it can do · drag the background to pan",
  hintSearch: "/ searches",
  hintOpen: "Enter opens",
  hintAdd: "+ or Insert to add a child",
  hintCollapse: "Space collapses",
  hintExpand: "Space expands",
  hintMove: "drag onto a node to move it",
  hintLink: "drag the dot to link",
  hintDelete: "Delete removes",
  hintMore: "Shift+F10 or right-click for more"
});
function nothingMatches(g) {
  const { query, nodes } = g.state;
  return query.trim() !== "" && !nodes.some((node) => matchesQuery(node.label, query));
}
var noMatchWords = (g) => g.labels.noMatches.replace("{query}", g.state.query.trim());
function hintOf3(g) {
  const { labels, callbacks: cb } = g;
  const id = g.state.selectedId;
  if (nothingMatches(g)) return noMatchWords(g);
  if (id === null) return [labels.hintNone, cb.onMenu && labels.hintMore, labels.hintSearch].filter(Boolean).join(" · ");
  const folds = cb.onToggle && g.countOf(id) > 0;
  return [
    cb.onActivate && labels.hintOpen,
    cb.onAdd && labels.hintAdd,
    folds && (g.byId.get(id).collapsed ? labels.hintExpand : labels.hintCollapse),
    cb.onDropOn && labels.hintMove,
    cb.onConnect && labels.hintLink,
    cb.onDelete && labels.hintDelete,
    cb.onMenu && labels.hintMore
  ].filter(Boolean).join(" · ");
}
function paint4(g) {
  const { selectedId, query } = g.state;
  const faded = !nothingMatches(g);
  g.emphasis = emphasisOf(selectedId, g.forest, g.state.edges);
  for (const element of g.nodeLayer.children) {
    const id = element.getAttribute("data-ui-id");
    const selected = id === selectedId;
    markSelected(element, selected);
    if (selectedId === null) element.removeAttribute("aria-selected");
    else element.setAttribute("aria-selected", String(selected));
    element.classList.toggle("is-path", Boolean(g.emphasis) && !selected && g.emphasis.path.has(id));
    element.classList.toggle("is-dim", Boolean(g.emphasis) && !g.emphasis.lit.has(id));
    element.classList.toggle("is-unmatched", faded && !matchesQuery(g.byId.get(id).label, query));
  }
  syncMore3(g);
  drawEdges(g, g.emphasis);
  const hint = hintOf3(g);
  writeText(g.hintText, hint);
  g.hint.hidden = hint === "";
}
function stopId(g) {
  const { focusId, selectedId } = g.state;
  if (g.byId.has(focusId)) return focusId;
  return g.byId.has(selectedId) ? selectedId : g.rows[0]?.id ?? null;
}
function placeStop(g, { focus }) {
  const id = stopId(g);
  g.state.focusId = id;
  let stop = null;
  for (const element of g.nodeLayer.children) {
    const here = element.getAttribute("data-ui-id") === id;
    element.setAttribute("tabindex", here ? "0" : "-1");
    if (here) stop = element;
  }
  if (focus) stop?.focus({ preventScroll: true });
}
function render7(g) {
  const { nodes, edges } = g.state;
  g.byId = new Map(nodes.map((node) => [node.id, node]));
  g.forest = forestOf2(nodes, edges);
  g.rows = treeRows(g.forest);
  g.positions = layoutForest(g.forest);
  if (!g.byId.has(g.state.selectedId)) unselectGone(g);
  const had = g.nodeLayer.contains(g.doc.activeElement);
  reconcileKeyedList(g.nodeLayer, g.rows, { key: (row) => row.id, create: () => nodeElement(g.doc), update: (element, row) => writeNode(g, element, row) });
  paint4(g);
  placeStop(g, { focus: had && !g.nodeLayer.contains(g.doc.activeElement) });
  g.minimap.drawNodes();
  if (!g.fitted) g.views.start();
  g.applyView();
}
function unselectGone(g) {
  const id = g.state.selectedId;
  if (id !== null && id === g.seen.selectedId) g.wait.selectedId = id;
  g.state.selectedId = null;
}
function select3(g, id, { focus }) {
  Object.assign(g.wait, { selectedId: null, focusId: null });
  g.state.selectedId = id;
  g.state.focusId = id;
  paint4(g);
  g.minimap.drawNodes();
  placeStop(g, { focus });
  if (focus) g.views.reveal(id, { report: true });
}
function onSearch(g, text2) {
  g.state.query = text2;
  paint4(g);
  const count = g.state.nodes.filter((node) => matchesQuery(node.label, text2)).length;
  if (text2.trim() !== "") g.say(count === 0 ? noMatchWords(g) : g.labels.matches.replace("{count}", String(count)));
  g.callbacks.onQuery?.(text2);
}
function onSearchKey(g, event) {
  if (event.key === "Escape") {
    event.preventDefault();
    if (g.search.value !== "") {
      g.search.value = "";
      onSearch(g, "");
    }
    placeStop(g, { focus: true });
    return;
  }
  if (event.key !== "Enter" && event.key !== "ArrowDown") return;
  const first = g.state.query.trim() === "" ? null : g.rows.find((row) => matchesQuery(g.byId.get(row.id).label, g.state.query));
  if (!first) return;
  event.preventDefault();
  select3(g, first.id, { focus: true });
}
function toolbar3(g) {
  const { doc, labels, life } = g;
  const bar = el(doc, "div", { className: `${GRAPH}-toolbar` });
  g.search = input(doc, {
    type: "search",
    label: labels.search,
    placeholder: labels.searchPlaceholder,
    className: `${GRAPH}-search`,
    signal: life.signal,
    onInput: (value) => onSearch(g, String(value ?? ""))
  });
  life.on(g.search, "keydown", (event) => onSearchKey(g, event));
  bar.append(
    g.search,
    button(doc, { className: `${GRAPH}-zoom-out`, label: "−", ariaLabel: labels.zoomOut, signal: life.signal, onClick: () => g.zoomAt(0.8) }),
    button(doc, { className: `${GRAPH}-zoom-in`, label: "+", ariaLabel: labels.zoomIn, signal: life.signal, onClick: () => g.zoomAt(1.25) }),
    button(doc, { className: `${GRAPH}-fit`, label: labels.fit, signal: life.signal, onClick: () => g.fit({ report: true }) })
  );
  return bar;
}
function adopt3(g, model, replaced) {
  const { seen, wait, state } = g;
  const selectedId = model.selectedId ?? null;
  if (selectedId !== seen.selectedId) {
    seen.selectedId = selectedId;
    wait.selectedId = selectedId;
    if (selectedId === null) state.selectedId = null;
  }
  const query = String(model.query ?? "");
  if (query !== seen.query) {
    seen.query = query;
    state.query = query;
    g.search.value = query;
  }
  g.views.adopt(model.viewport, replaced);
  const focusId = model.focusId ?? null;
  if (focusId !== seen.focusId) {
    seen.focusId = focusId;
    wait.focusId = focusId;
  }
}
function takeWaiting(g) {
  const { wait, state } = g;
  const drawn = (id2) => id2 !== null && state.nodes.some((node) => node.id === id2);
  if (drawn(wait.selectedId)) {
    state.selectedId = wait.selectedId;
    state.focusId = wait.selectedId;
    wait.selectedId = null;
  }
  if (!drawn(wait.focusId)) return null;
  const id = wait.focusId;
  wait.focusId = null;
  state.focusId = id;
  return id;
}
function surface(g) {
  const { doc } = g;
  g.viewport = el(doc, "div", { className: `${GRAPH}-viewport` });
  g.world = el(doc, "div", { className: `${GRAPH}-world` });
  g.svg = svg(doc, "svg", { class: `${GRAPH}-edges`, "aria-hidden": "true", width: 1, height: 1 });
  g.nodeLayer = el(doc, "div", { className: `${GRAPH}-nodes`, attrs: { role: "tree" } });
  g.overlay = svg(doc, "svg", { class: `${GRAPH}-edges ${GRAPH}-overlay`, "aria-hidden": "true", width: 1, height: 1 });
  g.world.append(g.svg, g.nodeLayer, g.overlay);
  g.minimap = createMinimap(g);
  g.viewport.append(g.world, g.minimap.element);
  g.hint = el(doc, "p", { className: `${GRAPH}-hint` });
  g.hintText = textNode(doc, g.hint);
}
function markAbilities2(root, callbacks) {
  for (const [name, callback] of [["data-can-move", "onDropOn"], ["data-can-link", "onConnect"], ["data-can-fold", "onToggle"], ["data-can-menu", "onMenu"]]) {
    if (typeof callbacks[callback] === "function") root.setAttribute(name, "");
  }
}
function graphState(doc, life, root, callbacks) {
  const g = {
    doc,
    life,
    root,
    callbacks,
    labels: { ...GRAPH_LABELS, ...callbacks.labels },
    markerId: uniqueId(`${GRAPH}-arrow`),
    view: { x: 0, y: 0, k: 1 },
    fitted: false,
    auto: null,
    positions: /* @__PURE__ */ new Map(),
    byId: /* @__PURE__ */ new Map(),
    forest: forestOf2([], []),
    rows: [],
    emphasis: null,
    drag: null,
    draft: null,
    panned: false,
    state: { nodes: [], edges: [], selectedId: null, focusId: null, query: "" },
    seen: { selectedId: void 0, query: void 0, focusId: void 0, viewport: void 0 },
    wait: { selectedId: null, focusId: null }
  };
  g.countOf = (id) => g.byId.get(id)?.childCount ?? g.forest.children.get(id)?.length ?? 0;
  g.render = () => render7(g);
  g.select = (id, options) => select3(g, id, options);
  return g;
}
function createGraph(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, "div", { className: GRAPH, attrs: { role: "region", [CONTROL_ATTR]: true } });
  markAbilities2(root, callbacks);
  const g = graphState(doc, life, root, callbacks);
  surface(g);
  g.views = createViewModel(g);
  root.append(toolbar3(g), g.hint, g.viewport);
  g.region = createLiveRegion(root);
  g.say = (text2) => say(g.region, text2);
  bindGraph(g);
  host.append(root);
  return {
    update(model = {}) {
      if (life.dead) return;
      const { nodes, edges } = normalizeGraph(model.nodes ?? [], model.edges ?? []);
      const replaced = g.state.nodes.length > 0 && !nodes.some((node) => g.byId.has(node.id));
      Object.assign(g.state, { nodes, edges });
      const label = String(model.label ?? "Relationships");
      root.setAttribute("aria-label", label);
      g.nodeLayer.setAttribute("aria-label", label);
      adopt3(g, model, replaced);
      if (g.drag) return;
      const reveal3 = takeWaiting(g);
      render7(g);
      if (reveal3 !== null) g.views.reveal(reveal3, { report: false });
    },
    fit: () => life.dead ? false : g.fit({ report: true }),
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}
export {
  BUTTON_CLASS,
  CALENDAR_LABELS,
  CALENDAR_VIEWS,
  DRAG_START_PX,
  FIELD_CLASS,
  GRAPH_LABELS,
  ICON_CLASS,
  ICON_NAMES,
  SR_ONLY_CLASS,
  STATUS_LABELS,
  TIMELINE_LABELS,
  TIMELINE_SCALES,
  TOUCH_DRAG_DELAY_MS,
  TOUCH_DRAG_START_PX,
  UI_CSS,
  UI_STYLE_ID,
  UI_TOKENS,
  VOICE_LABELS,
  VOICE_MAX_LENGTH,
  VOICE_MESSAGES,
  addDays,
  addMinutes,
  addMonths,
  atMinutes,
  button,
  clamp,
  confirmDialog,
  countLabel,
  createBadge,
  createBreadcrumbs,
  createCalendar,
  createChips,
  createCombobox,
  createComposer,
  createContextActions,
  createContextWindow,
  createDialog,
  createDrawer,
  createEmptyState,
  createGraph,
  createIcon,
  createKanban,
  createLife,
  createMarkdownView,
  createMenu,
  createNavBar,
  createPopover,
  createProgress,
  createResults,
  createSelect,
  createSplitter,
  createStatus,
  createSwitch,
  createTabs,
  createTimeline,
  createToaster,
  createTree,
  createVoiceDraft,
  createVoiceInput,
  dayKey,
  daysBetween,
  documentOf,
  el,
  focusablesIn,
  formatCount,
  fromDayKey,
  injectUiStyles,
  input,
  isControlTarget,
  isOff,
  isTypingTarget,
  itemIdOf,
  keepFocus,
  layoutGraph,
  minutesOfDay,
  monthGrid,
  moveVerdict,
  nextIndex,
  placeChildren,
  reconcileKeyedList,
  renderMarkdown,
  rowCache,
  safeHref,
  sameDay,
  setLabel,
  setOff,
  setTabStop,
  setValue,
  shiftAnchor,
  show,
  splitterKeyValue,
  splitterLimits,
  startOfDay,
  startOfMonth,
  startOfWeek,
  textNode,
  toDate,
  toggleTaskLine,
  touchesDay,
  trackDrag,
  uniqueId,
  uniqueItems,
  viewDays,
  writeText
};
