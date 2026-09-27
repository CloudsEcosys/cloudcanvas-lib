/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Progress: a determinate bar.
 *
 * A real `<progress value max>`, not a pair of divs with hand-written ARIA. The
 * native element already has the `progressbar` role and already computes
 * `aria-valuenow` / `aria-valuemin` / `aria-valuemax` from the two attributes
 * written below, so re-declaring them is two sources of truth that drift the
 * first time only one of them is updated. What the native element does *not*
 * give is a name, so `aria-label` follows the caption - and that is the only
 * ARIA this widget writes.
 *
 * `cloudcanvas-lib-progress` sits on the `<progress>` itself, because that is
 * what the sheet's `::-webkit-progress-bar` / `::-webkit-progress-value` /
 * `::-moz-progress-bar` rules have to attach to; the caption and the bar share
 * the `-row` wrapper. The tone selects the fill only - the track stays neutral,
 * because a fully tinted bar gives no reference for how full it is.
 */

import { setAttr, setText, setVisible } from '../../.plugin/index.js';
import { toNumber } from '../coerce.js';
import { defineWidget, leadingText } from './widget.js';

const NAME = 'progress';
const ROW_CLASS = 'cloudcanvas-lib-progress-row';
const LABEL_CLASS = 'cloudcanvas-lib-progress-label';
const BAR_CLASS = 'cloudcanvas-lib-progress';

/** `default` is the base rule (`--cc-accent`), so it is the absence of a modifier. */
const TONES = ['success', 'warning', 'danger'];

const DEFAULT_MAX = 100;

function bind(host) {
  const root = host.querySelector(`.${ROW_CLASS}`);
  const caption = root.querySelector(`.${LABEL_CLASS}`);
  return { root, caption, captionText: leadingText(caption), bar: root.querySelector(`.${BAR_CLASS}`) };
}

function render(bindings, contents, cache) {
  const rawMax = toNumber(contents.get('max'), DEFAULT_MAX);
  // A non-positive max is not a bar, it is a division by zero in the renderer.
  const max = rawMax > 0 ? rawMax : DEFAULT_MAX;
  const value = Math.min(Math.max(toNumber(contents.get('value'), 0), 0), max);

  const label = contents.get('label');
  const caption = label === undefined || label === null ? '' : String(label);
  const tone = contents.get('tone');

  setText(bindings.captionText, caption);
  setVisible(bindings.caption, caption !== '');

  setAttr(bindings.bar, 'value', String(value), cache, 'value');
  setAttr(bindings.bar, 'max', String(max), cache, 'max');
  setAttr(bindings.bar, 'aria-label', caption, cache, 'ariaLabel');

  for (const variant of TONES) {
    bindings.bar.classList.toggle(`${BAR_CLASS}-${variant}`, variant === tone);
  }
}

const widget = /* @__PURE__ */ defineWidget({
  name: NAME,
  html: `<div class="${ROW_CLASS}"><span class="${LABEL_CLASS}"></span><progress class="${BAR_CLASS}"></progress></div>`,
  allowedKeys: ['value', 'max', 'label', 'tone'],
  bind,
  render
});

/** Register the Progress Pin component once; a second call returns the same handle. */
export const registerProgress = widget.register;

/** Create a Progress Pin on `session`; see `./text.js` on the option order. */
export const createProgressPin = widget.create;

/** The core `progress` type: `root.blit({ type: 'progress', progress: { value, max, label, tone } })`. */
export const progressType = widget.define;
