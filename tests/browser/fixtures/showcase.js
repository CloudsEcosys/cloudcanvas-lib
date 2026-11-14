/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The showcase fixture's board (`./showcase.html`): eight capability cards and
 * a card holding a breadcrumb and a child, on a board built from the public
 * surface. The context-menu suite roves into it with the keyboard to prove that
 * Enter - the keyboard add-on's `action` - promotes the card, as the builder's
 * own board answers it.
 */

import { back, canGoBack, go } from '../../../plugins/history.js';
import { setContent } from '../../../plugins/widget.js';
import { LIGHT_THEME, applyTheme } from 'cloudcanvas/theme';
import { createBreadcrumb } from '../../../components/index.js';
import { cameraOf, createBoard } from '../../../sandbox/board.js';

/** The eight capability cards. Declarative so the builder stays a loop. */
const SHOWCASE_CARDS = Object.freeze([
  {
    id: 'hero_draggable', x: 40, y: 40,
    title: 'Draggable',
    badge: { text: 'drag', color: '#38bdf8' },
    body: 'Pointer, trackpad and touch. A 3px jitter threshold keeps a click a click.'
  },
  {
    id: 'hero_events', x: 40, y: 230,
    title: 'Native Events',
    badge: { text: 'emit', color: '#a855f7' },
    body: 'Press Transmit: a bubbling CustomEvent rewrites this body through a plain listener.',
    actionText: 'Transmit'
  },
  {
    id: 'hero_touch', x: 40, y: 420,
    title: 'Touch & Pinch',
    badge: { text: 'Pointer Events', color: '#f472b6' },
    body: 'Two-finger pinch zooms about the midpoint; a trackpad pans on both axes and ctrl-pinches to zoom.'
  },
  {
    id: 'hero_connectors', x: 310, y: 40,
    title: 'Connectors',
    badge: { text: 'connect', color: '#34d399' },
    body: 'Two wires, drawn in canvas coordinates, so they stay attached at every zoom.',
    connect: { connections: ['hero_draggable', 'hero_events'] }
  },
  {
    id: 'hero_theme', x: 310, y: 230,
    title: 'Theming',
    badge: { text: 'applyTheme', color: '#fbbf24' },
    body: 'Every value is a --cc-* custom property with a dark fallback.',
    actionText: 'Toggle theme'
  },
  {
    id: 'hero_keyboard', x: 310, y: 420,
    title: 'Keyboard Nav',
    badge: { text: 'Accessible', color: '#818cf8' },
    body: 'Arrows pan, +/- zoom, Enter steps into the cards, Escape backs out.',
    connect: { connections: ['hero_touch'], dashed: false }
  },
  {
    id: 'hero_history', x: 900, y: 40,
    title: 'History',
    badge: { text: 'go / back', color: '#22d3ee' },
    body: 'Promoting a card narrows the board to its branch; Back walks out again.'
  },
  {
    id: 'hero_offload', x: 900, y: 230,
    title: 'Offload',
    badge: { text: 'offload', color: '#10b981' },
    body: 'A card far outside the view leaves the document, and returns when the camera does.'
  }
]);

/** A capability card's spec. */
function cardSpec({ id, x, y, title, badge, body, actionText, connect }) {
  const contents = actionText ? { title, badge, body, actionText } : { title, badge, body };
  return { id, type: 'card', x, y, w: 250, drag: true, select: true, card: contents, ...(connect ? { connect } : {}) };
}

/** The card that holds blits: a breadcrumb and a child. */
function createScopeCard(app) {
  const scope = app.blit({
    id: 'hero_scope', type: 'card', x: 580, y: 40, w: 290, drag: true, select: true, focus: { padding: 40, maxZoom: 2.4 },
    card: {
      title: 'Nested Cards',
      badge: { text: 'scope', color: '#f43f5e' },
      body: 'Any card can hold blits. Zoom in promotes this one; the breadcrumb walks back out.',
      actionText: 'Zoom in'
    }
  });
  createBreadcrumb(scope, { id: 'hero_crumb', x: 18, y: 20, w: 220, rootName: 'Showcase', title: 'Nested Cards' });
  scope.blit({
    id: 'hero_scope_child', type: 'card', x: 18, y: 80, w: 220, drag: true, select: true,
    card: {
      title: 'Nested child card',
      badge: { text: 'child', color: '#38bdf8' },
      body: 'Lives in the parent card\'s scope well, sized to hold it.'
    }
  });
  return scope;
}

/** The union of the top-level blits' global boxes. */
function contentBox(app) {
  const boxes = app.blits.map((b) => b.bounds);
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  return {
    x: minX,
    y: minY,
    width: Math.max(...boxes.map((box) => box.x + box.w)) - minX,
    height: Math.max(...boxes.map((box) => box.y + box.h)) - minY
  };
}

/** Frame every card on the board. */
function fitShowcase(app) {
  app.root = null;
  cameraOf(app).fit(contentBox(app), app.el.getBoundingClientRect(), { padding: 36, maxZoom: 1.15, immediate: true });
}

/** Card action buttons, keyed by card id and dispatched from one delegated listener. */
function bindActions(app, theme) {
  let pings = 0;
  const actions = {
    hero_scope: () => go(app, 'hero_scope', { duration: 500 }),
    hero_theme: () => theme.toggle(),
    hero_events: () => app.find('hero_events').emit('showcase:ping', { at: new Date().toLocaleTimeString() })
  };
  app.el.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    const owner = button && button.closest('[data-blit]:not([data-blit-root])');
    if (owner && actions[owner.id]) actions[owner.id]();
  });
  app.find('hero_events').on('showcase:ping', (event) => {
    pings += 1;
    setContent(event.detail.source, 'body', `Ping #${pings} received at ${event.detail.payload.at}.`);
  });
  // Enter on a roved-to card is its action: promote it, as the builder does.
  app.on('action', (event) => {
    if (event.detail.payload.key === 'Enter') go(app, event.detail.source, { duration: 500 });
  });
}

/** The toolbar: Fit view re-frames; Back out steps the history back, or re-frames when there is none. */
function bindToolbar(app) {
  document.getElementById('hero-fit').addEventListener('click', () => fitShowcase(app));
  document.getElementById('hero-back').addEventListener('click', () => {
    if (canGoBack(app)) back(app, { duration: 400 });
    else fitShowcase(app);
  });
}

/** The page theme: dark is the absence of one, light is the core preset. */
function pageTheme() {
  let dark = true;
  return {
    toggle() {
      dark = !dark;
      applyTheme(document.documentElement, dark ? null : LIGHT_THEME);
    }
  };
}

function boot() {
  const app = createBoard('#hero-canvas', { label: 'CloudCanvas feature showcase' });
  for (const spec of SHOWCASE_CARDS) app.blit(cardSpec(spec));
  createScopeCard(app);
  bindActions(app, pageTheme());
  bindToolbar(app);

  // Two frames before the first fit: a card has no measured box until a read phase has run over it.
  requestAnimationFrame(() => requestAnimationFrame(() => fitShowcase(app)));
  window.cloudcanvas = app;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
