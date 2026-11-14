/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The dashboard fixture's wiring (`./dashboard.html`): a board, its right-click
 * menu, the event feed, keyboard Enter as focus, and the HUD buttons the
 * browser suites click. The scene itself is `./dashboard-scene.js`.
 *
 * `window.cloudcanvas` is the board's root blit; `window.fixture` carries the
 * handles the suites drive the board through.
 */

import { blit } from 'cloudcanvas';
import { stateOf } from 'cloudcanvas/kernel';
import { FOCUSED_CLASS, focusBlit } from '../../../plugins/focus.js';
import { back, breadcrumb, canGoBack, canGoForward, forward, go } from '../../../plugins/history.js';
import { reorder } from '../../../plugins/layout.js';
import { lazyChildren, load } from '../../../plugins/lazy.js';
import { MenuRegistry, menu } from '../../../plugins/menu.js';
import { spot } from '../../../plugins/place.js';
import { CLS } from '../../../plugins/types.js';
import { setContent } from '../../../plugins/widget.js';
import { LIGHT_THEME, applyTheme } from 'cloudcanvas/theme';
import { COMPONENTS_LIGHT_THEME } from '../../../components/index.js';
import { cameraOf, createBoard } from '../../../sandbox/board.js';
import { buildDashboardScene, dashboardProvider } from './dashboard-scene.js';

/** The custom `cursor-focus` skin the HUD toggle installs. */
const CUSTOM_FOCUS_CURSOR = Object.freeze({
  color: '#f59e0b',
  padding: 18,
  showFrustum: false,
  label: 'custom cursor-focus skin'
});

/** How many feed rows are kept. */
const FEED_LIMIT = 25;

/** The signals the event feed logs, as they bubble to the host. */
const LOGGED_SIGNALS = Object.freeze([
  'drag:end', 'select', 'focus:change', 'view:change', 'chat:reaction', 'chat:sent',
  'alert:acknowledged', 'alert:resolved', 'flow:pulse', 'children:load'
]);

const byId = (id) => document.getElementById(id);

/** Append one line to the event feed, oldest dropped past the limit. */
function logEvent(type, text) {
  const feed = byId('event-feed');
  const row = document.createElement('div');
  row.className = 'event-log-entry';
  const kind = document.createElement('span');
  kind.className = 'type';
  kind.textContent = `[${type}]`;
  row.append(kind, ` ${text}`);
  feed.appendChild(row);
  if (feed.children.length > FEED_LIMIT) feed.removeChild(feed.firstChild);
}

/** Click handler on one HUD button. */
function onClick(id, handler) {
  byId(id).addEventListener('click', () => handler(byId(id)));
}

/** A HUD button's label and `active` state. */
function paint(button, label, active) {
  button.textContent = label;
  button.classList.toggle('active', active);
}

/* ------------------ FOCUS ------------------ */

/** The options a blit's `focus` trait was given, or the add-on's defaults. */
function focusOptionsOf(b) {
  const declared = b.spec.focus;
  return { padding: 50, maxZoom: 3, frame: true, ...(declared && typeof declared === 'object' ? declared : {}) };
}

/** Focus `b` as its own focus trait would on a click: the class, the signal, the framing. */
function focusCard(app, b) {
  return focusBlit(focusOptionsOf(b), b, stateOf(app.el).root);
}

/** Take the focus off whichever blit holds it: its focus trait restarted, which gives the focus up. */
function clearFocus(app) {
  const element = app.el.querySelector(`.${FOCUSED_CLASS}`);
  if (!element) return false;
  const focused = blit(element);
  const declared = focused.spec.focus ?? true;
  focused.set({ focus: false });
  focused.set({ focus: declared });
  return true;
}

/* ------------------ MENU ------------------ */

/** The board's right-click commands: history, and paint order within a container. */
function boardMenu(app) {
  const registry = new MenuRegistry();
  const onBlit = (subject, { target }) => Boolean(target);
  registry.register({ id: 'back', label: 'Back', group: 'nav', when: (subject) => canGoBack(subject), action: (subject) => back(subject) });
  registry.register({ id: 'forward', label: 'Forward', group: 'nav', when: (subject) => canGoForward(subject), action: (subject) => forward(subject) });
  registry.register({
    id: 'bring-to-front', label: 'Bring to front', group: 'order', when: onBlit, action: (subject, { target }) => reorder(target, null)
  });
  registry.register({
    id: 'send-to-back', label: 'Send to back', group: 'order', when: onBlit, action: (subject, { target }) => reorder(target, target.parent.blits[0])
  });
  menu(app, { registry });
  return registry;
}

/* ------------------ CAMERA ------------------ */

/** The union of the top-level blits' global boxes. */
function topLevelBox(app) {
  const boxes = app.blits.map((b) => b.bounds);
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.w));
  const maxY = Math.max(...boxes.map((box) => box.y + box.h));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function bindCameraButtons(app, scene) {
  const promote = (target) => () => go(app, target, { duration: 500 });
  onClick('btn-focus-chat', promote(scene.chat));
  onClick('btn-focus-cal', promote(scene.calendar));
  onClick('btn-focus-flow', promote(scene.flow));
  onClick('btn-focus-scope', promote(scene.parent));
  onClick('btn-focus-child', () => focusCard(app, scene.focusedChild));
  onClick('btn-unfocus', () => {
    clearFocus(app);
    if (!back(app)) app.view();
  });
  onClick('btn-reset', () => {
    clearFocus(app);
    app.root = null;
    cameraOf(app).fit(topLevelBox(app), app.el.getBoundingClientRect(), { padding: 60 });
    logEvent('camera', 'Fit every top-level window');
  });
  // A card's action button names its action; "Focus Me" focuses the card it sits on.
  app.el.addEventListener('click', (event) => {
    const button = event.target.closest(`.${CLS.ACTION_BTN}`);
    if (button && button.getAttribute('data-action') === 'Focus Me') focusCard(app, blit(button.closest('[data-blit]')));
  });
  // Enter on a roved-to blit is its action; on this board, the action is focus.
  app.on('action', (event) => {
    if (event.detail.payload.key === 'Enter') focusCard(app, event.detail.source);
  });
}

/* ------------------ DEMOS ------------------ */

function bindActivationToggle(scene) {
  let active = false;
  onClick('btn-toggle-active', (button) => {
    active = !active;
    scene.activeChild.emit(active ? 'activate' : 'deactivate');
    setContent(scene.activeChild, 'badge', active ? { text: 'Active', color: '#10b981' } : { text: 'Inactive', color: '#eab308' });
    paint(button, active ? 'Activation: On' : 'Activation: Off', active);
  });
}

function bindProviderLoad(scene) {
  onClick('btn-load-provider', (button) => {
    byId('stat-provider').textContent = 'loading...';
    load(scene.provider).then((children) => {
      byId('stat-provider').textContent = `${children.length} children loaded`;
      button.classList.add('active');
    });
  });
  scene.provider.on('children:error', () => { byId('stat-provider').textContent = 'provider failed (retryable)'; });
}

function bindCursorToggle(app) {
  let custom = false;
  onClick('btn-toggle-cursor', (button) => {
    custom = !custom;
    app.set({ cursors: custom ? { 'cursor-focus': CUSTOM_FOCUS_CURSOR } : true });
    paint(button, custom ? 'Cursor: Custom' : 'Cursor: Default', custom);
  });
}

function bindThemeToggle(app) {
  let light = false;
  onClick('btn-toggle-theme', (button) => {
    light = !light;
    applyTheme(app.el, light ? { ...LIGHT_THEME, ...COMPONENTS_LIGHT_THEME } : null);
    paint(button, light ? 'Theme: Light' : 'Theme: Dark', light);
  });
}

/** A card at the next free spot on the canvas. */
function bindSpawner(app) {
  let counter = 1;
  onClick('btn-add-card', () => {
    counter += 1;
    const at = spot(app, { width: 320, height: 140 });
    app.blit({
      id: `card_spawned_${counter}`, type: 'card', x: at.x, y: at.y, w: 320, drag: true, select: true, focus: {},
      card: { title: `Card #${counter}`, body: 'A focusable card, placed clear of the rest.', badge: { text: 'Spawned', color: '#38bdf8' } }
    });
  });
}

function bindEventLog(app) {
  for (const type of LOGGED_SIGNALS) {
    app.on(type, (event) => logEvent(type, `on #${event.target.id || 'board'}`));
  }
}

function boot() {
  blit.use({ lazy: lazyChildren(dashboardProvider) });
  const app = createBoard('#canvas-container', { label: 'Dashboard canvas' });
  const scene = buildDashboardScene(app);
  const registry = boardMenu(app);

  bindEventLog(app);
  bindCameraButtons(app, scene);
  bindActivationToggle(scene);
  bindProviderLoad(scene);
  bindCursorToggle(app);
  bindThemeToggle(app);
  bindSpawner(app);

  window.fixture = {
    app, scene, registry, camera: cameraOf(app), CLS, go, back, breadcrumb, setContent,
    focus: (b) => focusCard(app, typeof b === 'string' ? app.find(b) : b),
    clearFocus: () => clearFocus(app)
  };
  window.cloudcanvas = app;
  logEvent('init', 'Dashboard board ready: four windows mounted.');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
