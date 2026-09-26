/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * SnapToGridTrait: rounds a Pin's box to a grid when a gesture ends.
 *
 * It rides the `drag:end` and `resize:end` signals the interaction traits emit
 * rather than its own `onPointerUp`: traits receive pointer hooks in attachment
 * order, and the default drag/resize traits - attached first - have already
 * cleared their live flags by the time a later trait's hook runs, so a check of
 * those flags never saw a real gesture. Each signal carries its resting box and
 * a `cancelled` flag; a gesture the platform took away is not snapped.
 *
 * `enabled` is the runtime toggle. On (the default), a finished drag snaps the
 * Pin's position and a finished resize snaps its whole box to the grid; off, the
 * gesture is left exactly where the pointer put it - free-form. The flag is a
 * plain field, so a host can flip it live (`trait.enabled = false`) without
 * detaching the trait and losing its handles.
 */

import { PinTrait, resizePin } from '../../../.plugin/index.js';

/** The signals the trait listens for; see `PIN_SIGNAL_TYPES` in the core. */
const DRAG_END_SIGNAL = 'drag:end';
const RESIZE_END_SIGNAL = 'resize:end';

const DEFAULT_GRID = 24;

export class SnapToGridTrait extends PinTrait {
  constructor(options = {}) {
    super(options, {
      name: 'snap-to-grid',
      capabilities: ['interactive', 'spatial-constraint']
    });
    this.gridSize = Number(options.gridSize) > 0 ? Number(options.gridSize) : DEFAULT_GRID;
    this.enabled = options.enabled !== false;
    this._listeners = new WeakMap();
  }

  onAttach(pin) {
    if (!pin || typeof pin.addEventListener !== 'function') return;
    const listener = (event) => this._onGestureEnd(pin, event);
    this._listeners.set(pin, listener);
    pin.addEventListener(DRAG_END_SIGNAL, listener);
    pin.addEventListener(RESIZE_END_SIGNAL, listener);
  }

  onDetach(pin) {
    const listener = this._listeners.get(pin);
    if (listener && typeof pin.removeEventListener === 'function') {
      pin.removeEventListener(DRAG_END_SIGNAL, listener);
      pin.removeEventListener(RESIZE_END_SIGNAL, listener);
    }
    this._listeners.delete(pin);
  }

  _onGestureEnd(pin, event) {
    if (!this.enabled) return;
    const payload = event ? event.payload : null;
    if (payload && payload.cancelled) return;

    if (event && event.type === RESIZE_END_SIGNAL) this.snapResize(pin);
    else this.snap(pin);
  }

  /**
   * Round a value to the nearest grid multiple.
   */
  _round(value) {
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  /**
   * Round the Pin's position to the grid, writing only when it moves.
   *
   * @returns {{x: number, y: number}|null} the snapped position
   */
  snap(pin) {
    if (!pin || !pin.particle) return null;

    const x = this._round(pin.x);
    const y = this._round(pin.y);
    if (x !== pin.x || y !== pin.y) pin.setPosition(x, y);
    return { x, y };
  }

  /**
   * Round the Pin's whole box to the grid: its origin, so the box stays
   * grid-aligned however a near-edge handle moved it, and its size, floored at
   * one cell so a box never snaps away to nothing. The size goes through
   * `resizePin` - the DOM is the size authority - and the origin through the
   * same `setPosition` a drag snap uses.
   *
   * @returns {{x: number, y: number, width: number, height: number}|null}
   */
  snapResize(pin) {
    if (!pin || !pin.particle) return null;

    const width = Math.max(this.gridSize, this._round(pin.size.w));
    const height = Math.max(this.gridSize, this._round(pin.size.h));
    if (width !== pin.size.w || height !== pin.size.h) {
      resizePin(pin, width, height);
    }

    const position = this.snap(pin);
    return { x: position.x, y: position.y, width, height };
  }
}
