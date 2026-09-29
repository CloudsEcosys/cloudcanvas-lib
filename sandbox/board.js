/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The board: a root with the standard add-ons, what the builder and every
 * exported page run on.
 *
 *   const app = createBoard(host, { label: 'Project board' });
 *   const card = app.blit({ type: 'card', card: { title: 'Hi' }, drag: true, select: true });
 *
 * `createBoard` names the traits (`BOARD_TRAITS`), puts the board's CSS chunk
 * in the document (the canvas surface, its type, no text selection), registers
 * the display widgets, mounts the root with a flying camera, and switches on
 * the root add-ons: pan, the keyboard's single tab stop, the live region, the
 * cursors, history and reactions. Every blit then opts into its own - `drag`, `select`,
 * `resize`, `focus`, `connect`, `layout`, `style` and the rest - as spec keys.
 * The menu is the caller's: `menu(app, {registry})`.
 *
 *   allBlits(app)        every blit on the board, in document order
 *   freshId(app, prefix) an id no blit on the board carries
 *   cameraOf(app)        the board's flying camera (`cloudcanvas/motion`): pan, zoom, fit, screen <-> canvas
 *   retype(b, name)      the same blit (id, place, children) as another type
 *   clearBoard(app)      every blit and every board part gone (`./board-parts.js`)
 */
import { blit } from '../../.plugin/core/index.js';
import { announce } from '../../.plugin/addons/announce.js';
import { connect } from '../../.plugin/addons/connect.js';
import { cursors } from '../../.plugin/addons/cursors.js';
import { drag } from '../../.plugin/addons/drag.js';
import { edit } from '../../.plugin/addons/edit.js';
import { focus } from '../../.plugin/addons/focus.js';
import { history } from '../../.plugin/addons/history.js';
import { keyboard } from '../../.plugin/addons/keyboard.js';
import { gap, layout } from '../../.plugin/addons/layout.js';
import { motion } from '../../.plugin/addons/motion.js';
import { offload } from '../../.plugin/addons/offload.js';
import { pan } from '../../.plugin/addons/pan.js';
import { reactions } from '../../.plugin/addons/reactions.js';
import { resize } from '../../.plugin/addons/resize.js';
import { select } from '../../.plugin/addons/select.js';
import { style } from '../../.plugin/addons/style.js';
import { svgState } from '../../.plugin/addons/svg-state.js';
import { registerDisplayTypes } from '../../.plugin/addons/types.js';
import { injectBoardStyles } from '../../.plugin/graphics/styles.js';
import { contentKeyOf } from '../../.plugin/addons/widget.js';
import { clearBoardParts } from './board-parts.js';

/** The traits a board names, blit and root alike. */
export const BOARD_TRAITS = /* @__PURE__ */ Object.freeze({
  drag, select, resize, focus, connect, edit, layout, gap, style, offload, svgState,
  pan, keyboard, announce, cursors, history, reactions
});

/**
 * Mount a board on `host`. @param {Element|string} host
 * @param {{label?: string}} [options] `label` names the board for assistive technology
 * @returns {object} the root blit
 */
export function createBoard(host, { label = 'Board' } = {}) {
  blit.use(BOARD_TRAITS);
  injectBoardStyles();
  registerDisplayTypes();
  const app = blit(host);
  motion(app);
  app.set({ pan: true, keyboard: { label }, announce: true, cursors: true, history: true, reactions: true });
  return app;
}

/** The board's camera: the `MotionCamera` its root renders through. */
export function cameraOf(app) {
  return motion(app);
}

/** Every blit on the board, in document order; the root itself is not one. */
export function allBlits(app) {
  return Array.from(app.el.querySelectorAll('[data-blit]'), (element) => blit(element));
}

/** An id no blit on the board carries yet: `prefix_` and eight base-36 characters. */
export function freshId(app, prefix = 'blit') {
  for (;;) {
    const id = `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
    if (!app.find(id) && !app.el.ownerDocument.getElementById(id)) return id;
  }
}

/**
 * Rebuild `b` as type `name` in its place: same id, placement, surface and traits, its children moved
 * over, its contents carried where the new type takes them. @returns {object} the new blit
 */
export function retype(b, name, contents = {}) {
  const spec = b.spec;
  const oldKey = contentKeyOf(b);
  if (oldKey) delete spec[oldKey];
  delete spec.fill;
  const parent = b.parent;
  const children = b.blits;
  const anchor = b.el.nextSibling;
  const container = b.el.parentNode;
  for (const child of children) child.el.remove();
  b.remove();

  const next = parent.blit({ ...spec, type: name });
  const key = contentKeyOf(next);
  if (key && Object.keys(contents).length > 0) next.set({ [key]: contents });
  if (anchor && anchor.parentNode === container) container.insertBefore(next.el, anchor);
  const scope = next.el.querySelector('[data-scope]') ?? next.el;
  for (const child of children) scope.appendChild(child.el);
  return next;
}

/** Empty the board: every blit, then every board part. @returns {number} how many top-level blits went */
export function clearBoard(app) {
  const top = app.blits;
  for (const b of top) b.remove();
  clearBoardParts(app);
  return top.length;
}
