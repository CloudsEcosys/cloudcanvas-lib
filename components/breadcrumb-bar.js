/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * BreadcrumbBar: a Back button and a two-crumb trail, for a container that has
 * been promoted to the view root.
 *
 *   registerBreadcrumbBar();
 *   createBreadcrumb(workspace, { rootName: 'Home' });   // Back: history back(app)
 *
 * Both crumbs that navigate are real `<button>`s and the one that does not is
 * `aria-current="page"`, so the trail reads as navigation and the current place
 * is announced as such. The root name is a content key, so it renders like
 * everything else and survives a snapshot. An empty `title` shows the parent
 * widget's title. Back steps the root's history (`cloudcanvas/history`), found
 * from the blit itself, never a global.
 */
import { blit } from '../../.plugin/core/index.js';
import { back } from '../../.plugin/addons/history.js';
import { contentOf, leadingText, setText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { appOf, withDefaults } from './registrar.js';
import { injectComponentStyles } from './styles.js';

/** The type name. */
export const BREADCRUMB_BAR_TYPE = 'breadcrumb-bar';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const BREADCRUMB_CLS = /* @__PURE__ */ Object.freeze({
  ROOT: 'cloudcanvas-breadcrumb-card',
  BACK: 'cloudcanvas-breadcrumb-back-btn',
  PATH: 'cloudcanvas-breadcrumb-path',
  CRUMB: 'cloudcanvas-breadcrumb-crumb',
  SEPARATOR: 'cloudcanvas-breadcrumb-separator',
  CURRENT: 'cloudcanvas-breadcrumb-current'
});

/** The event a Back press emits. */
export const BACK_EVENT = 'navigation:back';

const DEFAULT_ROOT_NAME = 'Dashboard';

/* ------------------ BEHAVIOUR ------------------ */

/**
 * Step the root's history back, and emit `navigation:back`.
 * @returns {boolean} whether there was an entry to step back to
 */
export function navigateBreadcrumbBack(b) {
  const app = appOf(b);
  const stepped = app !== null && app.el !== b.el && back(app);
  b.emit(BACK_EVENT, { from: b.el.id });
  return stepped;
}

/* ------------------ TEMPLATE ------------------ */

const HTML = `<nav class="cloudcanvas-component ${BREADCRUMB_CLS.ROOT}" aria-label="Breadcrumb">`
  + `<button class="cloudcanvas-component-btn ${BREADCRUMB_CLS.BACK}" type="button">⬅ Back</button>`
  + `<div class="${BREADCRUMB_CLS.PATH}"><button class="${BREADCRUMB_CLS.CRUMB}" type="button"></button>`
  + `<span class="${BREADCRUMB_CLS.SEPARATOR}" aria-hidden="true">›</span>`
  + `<span class="${BREADCRUMB_CLS.CURRENT}" aria-current="page"></span></div></nav>`;

/** The title of the widget this bar sits in, or undefined. */
function parentTitleOf(b) {
  const parent = b.parent;
  return parent ? contentOf(parent).title : undefined;
}

/** The nodes, both navigating buttons, and the parent's title as it stands at this write. */
function bind(host, on) {
  const b = blit(host);
  const find = (className) => host.querySelector(`.${className}`);
  const crumb = find(BREADCRUMB_CLS.CRUMB);
  on(find(BREADCRUMB_CLS.BACK), 'click', () => navigateBreadcrumbBack(b));
  on(crumb, 'click', () => navigateBreadcrumbBack(b));
  return { rootText: leadingText(crumb), currentText: leadingText(find(BREADCRUMB_CLS.CURRENT)), parentTitle: parentTitleOf(b) };
}

function render(bindings, contents) {
  const rootName = contents.get('rootName');
  const title = contents.get('title');
  const current = title === undefined || title === null || title === '' ? (bindings.parentTitle || 'Focused Scope') : title;
  setText(bindings.rootText, `🏠 ${rootName === undefined || rootName === null ? DEFAULT_ROOT_NAME : rootName}`);
  setText(bindings.currentText, current);
}

/* ------------------ REGISTRATION ------------------ */

const SPEC = Object.freeze({ name: BREADCRUMB_BAR_TYPE, html: HTML, keys: ['title', 'rootName'], bind, render });

/** Define the breadcrumb bar widget, once. @returns {object} its type */
export function registerBreadcrumbBar() {
  injectComponentStyles();
  return widget(SPEC);
}

/** A breadcrumb bar in `parent`. `title` and `rootName` are contents; the rest is spec. */
export function createBreadcrumb(parent, options = {}) {
  registerBreadcrumbBar();
  return parent.blit(widgetSpec(BREADCRUMB_BAR_TYPE, withDefaults({
    x: 20, y: 16, w: 260, h: 42, chrome: false, title: 'Workspace View', rootName: DEFAULT_ROOT_NAME
  }, options)));
}
