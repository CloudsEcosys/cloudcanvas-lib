/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * snapToGrid: rounds a blit's box to a grid when a gesture ends. A function
 * trait, named by `registerComponents()`:
 *
 *   blit.use({ snapToGrid });
 *   card.set({ drag: true, resize: true, snapToGrid: { gridSize: 20 } });
 *
 * It rides the `drag:end` and `resize:end` signals the drag and resize add-ons
 * emit on the blit, so it needs no pointer handling of its own. A finished drag
 * snaps the position; a finished resize snaps the whole box, its size floored
 * at one cell. A gesture the platform took away (`payload.cancelled`) is left
 * where it was, and so is a nested blit's gesture bubbling through.
 *
 * `enabled: false` keeps the grid configured but leaves gestures free-form;
 * writing the key again (`card.set({ snapToGrid: { gridSize: 20 } })`) turns it
 * back on, and `snapToGrid: false` removes it.
 */

/** The signals the trait listens for. */
const DRAG_END_SIGNAL = 'drag:end';
const RESIZE_END_SIGNAL = 'resize:end';

const DEFAULT_GRID = 24;

/** Round `value` to the nearest multiple of `gridSize`. */
function round(value, gridSize) {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Round the blit's position to the grid, writing only when it moves.
 * @returns {{x: number, y: number}} the snapped position
 */
export function snapPosition(b, gridSize = DEFAULT_GRID) {
  const x = round(b.x, gridSize);
  const y = round(b.y, gridSize);
  if (x !== b.x || y !== b.y) b.set({ x, y });
  return { x, y };
}

/**
 * Round the blit's whole box to the grid: its size, floored at one cell so a box
 * never snaps away to nothing, then its origin, so the box stays aligned however
 * a near-edge handle moved it. `size` is the box the resize came to rest at
 * (its `resize:end` payload); the blit's own size in force by default.
 * @returns {{x: number, y: number, width: number, height: number}}
 */
export function snapBox(b, gridSize = DEFAULT_GRID, size = null) {
  const { w, h } = b.size;
  const restW = Number.isFinite(size?.width) ? size.width : w;
  const restH = Number.isFinite(size?.height) ? size.height : h;
  const width = Math.max(gridSize, round(restW, gridSize));
  const height = Math.max(gridSize, round(restH, gridSize));
  if (width !== restW || height !== restH) b.set({ w: width, h: height });
  const { x, y } = snapPosition(b, gridSize);
  return { x, y, width, height };
}

/**
 * The trait. @param {{gridSize?: number, enabled?: boolean}|true} [options] the cell size
 * (24) and whether gestures snap (true)
 * @returns {() => void} off
 */
export function snapToGrid(b, options) {
  const { gridSize: requested, enabled = true } = options && typeof options === 'object' ? options : {};
  const gridSize = Number(requested) > 0 ? Number(requested) : DEFAULT_GRID;
  const onGestureEnd = (event) => {
    const payload = event.detail?.payload;
    if (!enabled || event.target !== b.el || payload?.cancelled) return;
    if (event.type === RESIZE_END_SIGNAL) snapBox(b, gridSize, payload);
    else snapPosition(b, gridSize);
  };
  b.el.addEventListener(DRAG_END_SIGNAL, onGestureEnd);
  b.el.addEventListener(RESIZE_END_SIGNAL, onGestureEnd);
  return () => {
    b.el.removeEventListener(DRAG_END_SIGNAL, onGestureEnd);
    b.el.removeEventListener(RESIZE_END_SIGNAL, onGestureEnd);
  };
}
