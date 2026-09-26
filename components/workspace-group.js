/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * WorkspaceGroup: a titled scope that other Pins live inside, with a child
 * count and a button that promotes it to the render root.
 *
 * This is the one component that keeps the Pin's own chrome. A workspace
 * *is* a scope: its children sit in the core's scope well, which the core
 * card frames, pads and clips. Drawing a second surface here would put a
 * card inside a card, and drawing none would leave the well unframed - so
 * the widget renders only its header and lets the framework do the rest.
 * That is also why the content node is not claimed to full height: the well
 * has to sit below it.
 */

import {
  FocussableTrait,
  ScopeTrait,
  makeElement,
  makeTextNode,
  setText
} from '../../.plugin/index.js';
import {
  createComponentPin,
  makeRegistrar,
  splitOptions
} from './registrar.js';

/** Registry name, and the `type` a caller creates a Pin by. */
export const WORKSPACE_GROUP_TYPE = 'workspace-group';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const WORKSPACE_CLS = Object.freeze({
  ROOT: 'cloudcanvas-workspace-card',
  HEADER: 'cloudcanvas-workspace-header',
  TITLE: 'cloudcanvas-workspace-title',
  TITLE_TEXT: 'cloudcanvas-workspace-title-text',
  BADGE: 'cloudcanvas-workspace-badge',
  FOCUS: 'cloudcanvas-workspace-focus-btn'
});

const DEFAULT_PADDING = 80;
const DEFAULT_MAX_ZOOM = 2.5;
const ALLOWED_KEYS = ['title', 'category'];

/* ------------------ BEHAVIOUR ------------------ */

/**
 * Promote the workspace to the render root.
 *
 * @returns {boolean} whether a session was there to do it
 */
export function focusWorkspace(pin, options = {}) {
  const session = pin.session;
  if (!session || typeof session.pushFocus !== 'function') return false;
  session.pushFocus(pin, { promote: true, padding: DEFAULT_PADDING, ...options });
  return true;
}

/* ------------------ TEMPLATE ------------------ */

function build(pin, contentEl) {
  const card = makeElement('div', `cloudcanvas-component ${WORKSPACE_CLS.ROOT}`);
  const header = makeElement('div', WORKSPACE_CLS.HEADER);

  const titleWrap = makeElement('div', WORKSPACE_CLS.TITLE);
  const icon = makeElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.appendChild(document.createTextNode('📁'));
  const title = makeElement('span', WORKSPACE_CLS.TITLE_TEXT);
  const titleText = makeTextNode(title);
  const badge = makeElement('span', WORKSPACE_CLS.BADGE);
  const badgeText = makeTextNode(badge);
  titleWrap.append(icon, title, badge);

  const focus = makeElement('button', `cloudcanvas-component-btn ${WORKSPACE_CLS.FOCUS}`);
  focus.setAttribute('type', 'button');
  focus.appendChild(document.createTextNode('🔍 Focus View'));
  focus.addEventListener('click', () => focusWorkspace(pin));

  header.append(titleWrap, focus);
  card.appendChild(header);
  contentEl.replaceChildren(card);

  return { card, titleText, badgeText, focus };
}

function update(pin, contents, bindings) {
  const count = pin.children ? pin.children.size : 0;
  setText(bindings.titleText, contents.get('title'));
  setText(bindings.badgeText, `${count} ${count === 1 ? 'pin' : 'pins'}`);
}

/* ------------------ REGISTRATION ------------------ */

/** Register the workspace group, once per registry; see `./registrar.js`. */
export const registerWorkspaceGroup = makeRegistrar({
  name: WORKSPACE_GROUP_TYPE,
  build,
  update,
  chrome: true,
  allowedKeys: ALLOWED_KEYS
});

/**
 * Create a workspace Pin: a scope, focussable, with the group header.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options] `title`, `category` become contents; `padding`
 *   sets the focus padding; the rest are Pin options
 * @returns {Pin}
 */
export function createWorkspacePin(session, options = {}) {
  const { pinOptions, contents } = splitOptions(options, [
    ['title', 'Workspace Section'],
    ['category', 'General']
  ], { x: 50, y: 50, width: 500 });

  const { padding, ...rest } = pinOptions;
  rest.traits = [
    new ScopeTrait(),
    new FocussableTrait({ padding: padding || DEFAULT_PADDING, maxZoom: DEFAULT_MAX_ZOOM }),
    ...(Array.isArray(rest.traits) ? rest.traits : [])
  ];

  return createComponentPin(session, registerWorkspaceGroup, rest, contents, true);
}
