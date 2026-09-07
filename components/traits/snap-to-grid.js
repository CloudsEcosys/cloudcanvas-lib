/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * SnapToGridTrait: rounds a Pin's position to a grid when a drag ends.
 *
 * It rides the `drag:end` signal `DraggableTrait` emits rather than its own
 * `onPointerUp`: traits receive pointer hooks in attachment order, and the
 * default drag trait - attached first - has already cleared its `dragging`
 * flag by the time a later trait's hook runs, so a check of that flag never
 * saw a real drag. The signal carries the resting position and a
 * `cancelled` flag; a drag the platform took away is not snapped.
 */

import { PinTrait } from '../../../src/index.js';

/** The signal the trait listens for; see `PIN_SIGNAL_TYPES` in the core. */
const DRAG_END_SIGNAL = 'drag:end';

const DEFAULT_GRID = 24;

export class SnapToGridTrait extends PinTrait {
  constructor(options = {}) {
    super(options, {
      name: 'snap-to-grid',
      capabilities: ['interactive', 'spatial-constraint']
    });
    this.gridSize = Number(options.gridSize) > 0 ? Number(options.gridSize) : DEFAULT_GRID;
    this._listeners = new WeakMap();
  }

  onAttach(pin) {
    if (!pin || typeof pin.addEventListener !== 'function') return;
    const listener = (event) => this._onDragEnd(pin, event);
    this._listeners.set(pin, listener);
    pin.addEventListener(DRAG_END_SIGNAL, listener);
  }

  onDetach(pin) {
    const listener = this._listeners.get(pin);
    if (listener && typeof pin.removeEventListener === 'function') {
      pin.removeEventListener(DRAG_END_SIGNAL, listener);
    }
    this._listeners.delete(pin);
  }

  _onDragEnd(pin, event) {
    const payload = event ? event.payload : null;
    if (payload && payload.cancelled) return;
    this.snap(pin);
  }

  /**
   * Round the Pin's position to the grid, writing only when it moves.
   *
   * @returns {{x: number, y: number}|null} the snapped position
   */
  snap(pin) {
    if (!pin || !pin.particle) return null;

    const x = Math.round(pin.particle.x / this.gridSize) * this.gridSize;
    const y = Math.round(pin.particle.y / this.gridSize) * this.gridSize;
    if (x !== pin.particle.x || y !== pin.particle.y) pin.setPosition(x, y);
    return { x, y };
  }
}
