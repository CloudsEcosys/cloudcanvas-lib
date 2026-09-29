/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * WorkspaceGroup: a titled container other blits live inside, with a child
 * count and a button that promotes it to the view root.
 *
 *   registerWorkspaceGroup();
 *   const ws = createWorkspace(app, { id: 'ws', title: 'Project Alpha' });
 *   createStickyNote(ws, { title: 'Inside' });   // lands in the workspace's scope
 *   focusWorkspace(ws);                           // history go(app, ws, {promote: true})
 *
 * The template ends in a `[data-scope]` well, so `ws.blit(spec)` puts the child
 * there, placed from the well's origin. The badge counts the well's blits and
 * follows them as they come and go, through one observer per element that
 * stops when the workspace is removed. How the camera frames the workspace is
 * its `focus` spec key (`cloudcanvas/focus`: `padding`, `maxZoom`); promoting it
 * goes through the root's history (`cloudcanvas/history`), so Back returns.
 */
import { blit } from '../../.plugin/core/index.js';
import { focus } from '../../.plugin/addons/focus.js';
import { go } from '../../.plugin/addons/history.js';
import { leadingText, setText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { appOf, withDefaults } from './registrar.js';
import { injectComponentStyles } from './styles.js';

/** The type name. */
export const WORKSPACE_GROUP_TYPE = 'workspace-group';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const WORKSPACE_CLS = /* @__PURE__ */ Object.freeze({
  ROOT: 'cloudcanvas-workspace-card',
  HEADER: 'cloudcanvas-workspace-header',
  TITLE: 'cloudcanvas-workspace-title',
  TITLE_TEXT: 'cloudcanvas-workspace-title-text',
  BADGE: 'cloudcanvas-workspace-badge',
  FOCUS: 'cloudcanvas-workspace-focus-btn'
});

const DEFAULT_PADDING = 80;
const DEFAULT_MAX_ZOOM = 2.5;

/** The badge observers, by element: one each, for as long as the workspace is on the board. */
const COUNTERS = /* @__PURE__ */ new WeakMap();

/* ------------------ BEHAVIOUR ------------------ */

/**
 * Promote the workspace to the view root and frame it, through the root's
 * history. Framing reads the `focus` spec key; `options` override it.
 * @returns {boolean} whether a root was there to do it
 */
export function focusWorkspace(b, options = {}) {
  const app = appOf(b);
  if (!app || app.el === b.el) return false;
  const framing = b.spec.focus;
  const { padding = DEFAULT_PADDING, maxZoom = DEFAULT_MAX_ZOOM } = framing && typeof framing === 'object' ? framing : {};
  go(app, b, { promote: true, padding, maxZoom, ...options });
  return true;
}

/** How many blits sit directly in the well. */
function childCountOf(scope) {
  let count = 0;
  for (const child of scope.children) if (child.hasAttribute('data-blit')) count += 1;
  return count;
}

/** The badge's text for a count. */
function badgeLabel(count) {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

/** Keep the badge on the well's count as children come and go; a second call for the element is a no-op. */
function watchChildren(host, scope, badgeText) {
  if (COUNTERS.has(host) || typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver(() => setText(badgeText, badgeLabel(childCountOf(scope))));
  observer.observe(scope, { childList: true });
  COUNTERS.set(host, observer);
}

/** Stop the element's badge observer. */
function unwatchChildren(host) {
  COUNTERS.get(host)?.disconnect();
  COUNTERS.delete(host);
}

/* ------------------ TEMPLATE ------------------ */

const HTML = `<div class="cloudcanvas-component cloudcanvas-component-card ${WORKSPACE_CLS.ROOT}">`
  + `<div class="${WORKSPACE_CLS.HEADER}"><div class="${WORKSPACE_CLS.TITLE}">`
  + `<span aria-hidden="true">📁</span><span class="${WORKSPACE_CLS.TITLE_TEXT}"></span>`
  + `<span class="${WORKSPACE_CLS.BADGE}"></span></div>`
  + `<button class="cloudcanvas-component-btn ${WORKSPACE_CLS.FOCUS}" type="button">🔍 Focus View</button></div>`
  + '<div data-scope></div></div>';

/** The nodes (the workspace's own come before its well's), the Focus press, and the badge's observer. */
function bind(host, on) {
  const b = blit(host);
  const find = (className) => host.querySelector(`.${className}`);
  const scope = host.querySelector('[data-scope]');
  const badgeText = leadingText(find(WORKSPACE_CLS.BADGE));
  on(find(WORKSPACE_CLS.FOCUS), 'click', () => focusWorkspace(b));
  on(host, 'remove', (event) => {
    if (event.target === host) unwatchChildren(host);
  });
  watchChildren(host, scope, badgeText);
  return { titleText: leadingText(find(WORKSPACE_CLS.TITLE_TEXT)), badgeText, scope };
}

function render(bindings, contents) {
  setText(bindings.titleText, contents.get('title'));
  setText(bindings.badgeText, badgeLabel(childCountOf(bindings.scope)));
}

/* ------------------ REGISTRATION ------------------ */

const SPEC = Object.freeze({
  name: WORKSPACE_GROUP_TYPE, html: HTML, keys: ['title', 'category'], bind, render, defaults: { layout: 'free' }
});

/** Define the workspace group widget, once, and name the `focus` trait its framing is. @returns {object} its type */
export function registerWorkspaceGroup() {
  injectComponentStyles();
  blit.use({ focus });
  return widget(SPEC);
}

/**
 * A workspace group in `parent`. `title` and `category` are contents; `padding` sets the
 * focus padding (the `focus` spec key, with `maxZoom` 2.5); the rest is spec.
 */
export function createWorkspace(parent, options = {}) {
  registerWorkspaceGroup();
  const { padding, ...rest } = options;
  return parent.blit(widgetSpec(WORKSPACE_GROUP_TYPE, withDefaults({
    x: 50, y: 50, w: 500, title: 'Workspace Section', category: 'General',
    focus: { padding: padding || DEFAULT_PADDING, maxZoom: DEFAULT_MAX_ZOOM }
  }, rest)));
}
