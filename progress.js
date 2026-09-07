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

import {
  defineComponent,
  makeElement,
  makeTextNode,
  setAttr,
  setText,
  setVisible
} from '../src/index.js';

const NAME = 'progress';
const ROW_CLASS = 'cloudcanvas-lib-progress-row';
const LABEL_CLASS = 'cloudcanvas-lib-progress-label';
const BAR_CLASS = 'cloudcanvas-lib-progress';

/** `default` is the base rule (`--cc-accent`), so it is the absence of a modifier. */
const TONES = ['success', 'warning', 'danger'];

const DEFAULT_MAX = 100;

const ALLOWED_KEYS = ['value', 'max', 'label', 'tone'];

/** A finite number, or the stated default. */
function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function build(pin, contentEl) {
  const root = makeElement('div', ROW_CLASS);
  const caption = makeElement('span', LABEL_CLASS);
  const captionText = makeTextNode(caption);
  const bar = makeElement('progress', BAR_CLASS);

  root.appendChild(caption);
  root.appendChild(bar);
  contentEl.replaceChildren(root);

  return { root, caption, captionText, bar };
}

function update(pin, contents, bindings, cache) {
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

let handle = null;

/** Register the Progress display type once; a second call returns the same handle. */
export function registerProgress() {
  if (!handle) {
    handle = defineComponent({
      name: NAME,
      build,
      update,
      chrome: false,
      allowedKeys: ALLOWED_KEYS
    });
  }
  return handle;
}

/** Create a Progress Pin on `session`; see `./text.js` on the option order. */
export function createProgressPin(session, options = {}) {
  registerProgress();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
