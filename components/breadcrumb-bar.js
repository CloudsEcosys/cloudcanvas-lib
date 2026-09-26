/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * BreadcrumbBar: a Back button and a two-crumb trail, for a scope that has
 * been promoted to the render root.
 *
 * Both crumbs that navigate are real `<button>`s and the one that does not
 * is `aria-current="page"`, so the trail reads as navigation and the current
 * place is announced as such. The root name is a content key, not a trait
 * option, so it renders through `update` like everything else and survives a
 * snapshot. The session is reached through `pin.session`, never a global.
 */

import {
  PinEvent,
  makeElement,
  makeTextNode,
  setText
} from '../../.plugin/index.js';
import {
  claimHost,
  createComponentPin,
  makeRegistrar,
  splitOptions
} from './registrar.js';

/** Registry name, and the `type` a caller creates a Pin by. */
export const BREADCRUMB_BAR_TYPE = 'breadcrumb-bar';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const BREADCRUMB_CLS = Object.freeze({
  ROOT: 'cloudcanvas-breadcrumb-card',
  BACK: 'cloudcanvas-breadcrumb-back-btn',
  PATH: 'cloudcanvas-breadcrumb-path',
  CRUMB: 'cloudcanvas-breadcrumb-crumb',
  SEPARATOR: 'cloudcanvas-breadcrumb-separator',
  CURRENT: 'cloudcanvas-breadcrumb-current'
});

/** The event a Back press transmits, bubbling up the scope chain. */
export const BACK_EVENT = 'navigation:back';

const DEFAULT_ROOT_NAME = 'Dashboard';
const ALLOWED_KEYS = ['title', 'rootName'];

/* ------------------ BEHAVIOUR ------------------ */

/** Pop the session's focus and say so. */
export function navigateBreadcrumbBack(pin) {
  const session = pin.session;
  if (session && typeof session.popFocus === 'function') session.popFocus({ animate: true });

  pin.transmit(new PinEvent(BACK_EVENT, {
    payload: { from: pin.id },
    bubbles: true,
    source: pin
  }));
}

/* ------------------ TEMPLATE ------------------ */

function build(pin, contentEl) {
  claimHost(contentEl);
  const card = makeElement('nav', `cloudcanvas-component ${BREADCRUMB_CLS.ROOT}`);
  card.setAttribute('aria-label', 'Breadcrumb');

  const back = makeElement('button', `cloudcanvas-component-btn ${BREADCRUMB_CLS.BACK}`);
  back.setAttribute('type', 'button');
  back.appendChild(document.createTextNode('⬅ Back'));
  back.addEventListener('click', () => navigateBreadcrumbBack(pin));

  const path = makeElement('div', BREADCRUMB_CLS.PATH);
  const root = makeElement('button', BREADCRUMB_CLS.CRUMB);
  root.setAttribute('type', 'button');
  const rootText = makeTextNode(root);
  root.addEventListener('click', () => navigateBreadcrumbBack(pin));

  const separator = makeElement('span', BREADCRUMB_CLS.SEPARATOR);
  separator.setAttribute('aria-hidden', 'true');
  separator.appendChild(document.createTextNode('›'));

  const current = makeElement('span', BREADCRUMB_CLS.CURRENT);
  current.setAttribute('aria-current', 'page');
  const currentText = makeTextNode(current);

  path.append(root, separator, current);
  card.append(back, path);
  contentEl.replaceChildren(card);

  return { card, back, rootText, currentText };
}

function update(pin, contents, bindings) {
  const rootName = contents.get('rootName');
  const title = contents.get('title');
  const fallback = pin.parent && pin.parent.contents instanceof Map
    ? pin.parent.contents.get('title')
    : undefined;

  setText(bindings.rootText, `🏠 ${rootName === undefined || rootName === null ? DEFAULT_ROOT_NAME : rootName}`);
  setText(bindings.currentText, title === undefined || title === null || title === '' ? (fallback || 'Focused Scope') : title);
}

/* ------------------ REGISTRATION ------------------ */

/** Register the breadcrumb bar, once per registry; see `./registrar.js`. */
export const registerBreadcrumbBar = makeRegistrar({
  name: BREADCRUMB_BAR_TYPE,
  build,
  update,
  chrome: false,
  allowedKeys: ALLOWED_KEYS
});

/**
 * Create a breadcrumb Pin inside a scope: fixed, unselectable, chromeless.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options] `title`, `rootName` become contents; the rest
 *   are Pin options
 * @returns {Pin}
 */
export function createBreadcrumbPin(session, options = {}) {
  const { pinOptions, contents } = splitOptions(options, [
    ['title', 'Workspace View'],
    ['rootName', DEFAULT_ROOT_NAME]
  ], { x: 20, y: 16, width: 260, height: 42, draggable: false, selectable: false });

  return createComponentPin(session, registerBreadcrumbBar, pinOptions, contents, false);
}
