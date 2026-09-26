/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * EditableTrait: double-click a title, type, Enter to keep it, Escape to
 * drop it.
 *
 * A behaviour trait, not a display one, so it stays a `PinTrait` subclass:
 * it renders nothing of its own and can be added to any Pin whose template
 * paints a title it recognises.
 *
 * Two rules keep it from fighting the display trait that owns the title:
 *
 *   - **The title's own node is never replaced.** The input is inserted
 *     *beside* the title and the title is hidden; the text node the display
 *     template holds a reference to survives, so the next render still
 *     reaches it. Replacing the title's children - what the previous version
 *     did - left every later title update writing into a detached node.
 *   - **The edit lock is taken.** `pin.beginEdit` defers any render that
 *     lands mid-edit, and `pin.endEdit` after the commit replays exactly one,
 *     which finds the committed value already in `pin.contents`.
 *
 * Escape cannot become a commit: the input is closed (removed) before its
 * blur can fire, and the blur handler finds the edit already over.
 */

import { PinEvent, PinTrait, makeElement } from '../../../.plugin/index.js';

/** The class the input carries; styled by `COMPONENT_DEFAULT_CSS`. */
export const EDITABLE_INPUT_CLASS = 'cloudcanvas-editable-input';

/** The event a committed edit transmits, bubbling up the scope chain. */
export const EDITED_EVENT = 'pin:edited';

/** The title nodes the trait recognises, core card first. */
export const DEFAULT_EDITABLE_SELECTOR = [
  '.cloudcanvas-pin-title',
  '.cloudcanvas-sticky-title',
  '.cloudcanvas-task-title',
  '.cloudcanvas-telemetry-title',
  '.cloudcanvas-flow-title',
  '.cloudcanvas-media-title',
  '.cloudcanvas-workspace-title-text'
].join(', ');

export class EditableTrait extends PinTrait {
  constructor(options = {}) {
    super(options, {
      name: 'editable',
      capabilities: ['interactive', 'editable']
    });
    this.targetKey = options.targetKey || 'title';
    this.selector = options.selector || DEFAULT_EDITABLE_SELECTOR;
    this._handlers = new WeakMap();
  }

  onAttach(pin) {
    if (!pin.element) return;
    const handler = (event) => this._onDoubleClick(pin, event);
    this._handlers.set(pin, handler);
    pin.element.addEventListener('dblclick', handler);
  }

  onDetach(pin) {
    const handler = this._handlers.get(pin);
    if (pin.element && handler) pin.element.removeEventListener('dblclick', handler);
    this._handlers.delete(pin);
  }

  _onDoubleClick(pin, event) {
    const target = pin.element.querySelector(this.selector);
    if (!target || !(target === event.target || target.contains(event.target))) return;
    event.stopPropagation();
    this.beginInlineEdit(pin, target);
  }

  /**
   * Open an editor beside `targetEl`.
   *
   * @returns {HTMLInputElement|null} the input, or null when an edit is already open
   */
  beginInlineEdit(pin, targetEl) {
    if (pin.editing || !targetEl || !targetEl.parentNode) return null;

    const key = this.targetKey;
    const original = targetEl.textContent;
    const input = makeElement('input', EDITABLE_INPUT_CLASS);
    input.setAttribute('type', 'text');
    input.setAttribute('aria-label', `Edit ${key}`);
    const current = pin.contents.get(key);
    input.value = current === undefined || current === null ? original : String(current);

    pin.beginEdit(input);
    targetEl.hidden = true;
    targetEl.parentNode.insertBefore(input, targetEl.nextSibling);
    input.focus();
    input.select();

    let open = true;
    const close = (commit) => {
      if (!open) return;
      open = false;
      input.remove();
      targetEl.hidden = false;
      if (commit) this._commit(pin, key, input.value.trim() || original);
      pin.endEdit();
    };

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'Escape') {
        event.stopPropagation();
        close(false);
      }
    });
    input.addEventListener('blur', () => close(true));

    return input;
  }

  _commit(pin, key, value) {
    pin.setContent(key, value);
    pin.transmit(new PinEvent(EDITED_EVENT, {
      payload: { key, value },
      bubbles: true,
      source: pin
    }));
  }
}
