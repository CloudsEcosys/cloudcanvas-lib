/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Alert: a toned message, optionally dismissible.
 *
 * The role is a function of the tone, and it is written on every pass rather
 * than at build: `warning` and `danger` are `role="alert"`, which interrupts,
 * and `info` and `success` are `role="status"`, which waits its turn. Changing
 * the tone at runtime therefore changes the urgency a screen reader is told
 * about too - a danger that still announces politely is the failure this costs
 * one attribute write to avoid.
 *
 * The tone surface and the dismiss convention are `./badge.js`'s, imported
 * rather than re-derived; see that file's header for why the fill is translucent
 * and the foreground is computed-for-dark behind a theme override token. Here the
 * values land on the four surface tokens the shared sheet reads inside an alert:
 * `--cc-scope-bg` and `--cc-card-border` take the translucent tint (composited
 * over the live card, so the panel follows the theme), and both `--cc-text` and
 * `--cc-text-muted` take the same foreground, read through
 * `--cc-badge-text-override` so a light theme flips the panel's text to dark
 * along with every badge. `--cc-text-muted` sharing that foreground is
 * deliberate: the sheet prints the message body muted, and slate-400 over a
 * tinted panel measures 3.9:1, so on a coloured surface "muted" has to mean the
 * same readable foreground, or it means unreadable. The modifier class is still
 * written, because the sheet uses it for the accent edge only, which is a colour
 * no text is printed on.
 */

import {
  defineComponent,
  makeElement,
  makeTextNode,
  primitives,
  setAttr,
  setText,
  setVisible
} from '../src/index.js';
import { makeDismissButton, toneSurface } from './badge.js';

const NAME = 'alert';
const ROOT_CLASS = 'cloudcanvas-lib-alert';
const CONTENT_CLASS = 'cloudcanvas-lib-alert-content';
const TITLE_CLASS = 'cloudcanvas-lib-alert-title';
const BODY_CLASS = 'cloudcanvas-lib-alert-body';
const DISMISS_CLASS = 'cloudcanvas-lib-alert-dismiss';

const TONES = ['info', 'success', 'warning', 'danger'];

/** Tones whose arrival is worth interrupting a screen reader for. */
const ASSERTIVE_TONES = new Set(['warning', 'danger']);

const ALLOWED_KEYS = ['title', 'message', 'tone', 'dismissible'];

/** The declared tone, or the default. */
function toneOf(contents) {
  const tone = contents.get('tone');
  return TONES.includes(tone) ? tone : 'info';
}

/** The tone declarations for one alert. Every tone has a surface; there is no neutral. */
function toneStyle(tone) {
  const surface = toneSurface(tone);
  if (!surface) return '';
  // Both foregrounds read through the same override token the badge uses, with
  // the dark-theme computation as the fallback: a light theme sets that one
  // token and the panel's text flips to dark with no re-render, while an
  // unthemed page keeps the computed dark-card colour.
  const text = `var(${primitives.BADGE_TEXT_OVERRIDE_TOKEN}, ${surface.text})`;
  return `--cc-scope-bg:${surface.background};`
    + `--cc-card-border:${surface.border};`
    + `--cc-text:${text};`
    + `--cc-text-muted:${text};`;
}

function build(pin, contentEl) {
  const root = makeElement('div', ROOT_CLASS);
  const content = makeElement('div', CONTENT_CLASS);
  const title = makeElement('strong', TITLE_CLASS);
  const titleText = makeTextNode(title);
  const body = makeElement('p', BODY_CLASS);
  const bodyText = makeTextNode(body);
  const dismiss = makeDismissButton(pin, DISMISS_CLASS);

  content.appendChild(title);
  content.appendChild(body);
  root.appendChild(content);
  root.appendChild(dismiss);
  contentEl.replaceChildren(root);

  return { root, title, titleText, body, bodyText, dismiss };
}

function update(pin, contents, bindings, cache) {
  const tone = toneOf(contents);
  const title = contents.get('title');
  const heading = title === undefined || title === null ? '' : String(title);

  setAttr(bindings.root, 'role', ASSERTIVE_TONES.has(tone) ? 'alert' : 'status', cache, 'role');
  setAttr(bindings.root, 'data-tone', tone, cache, 'tone');
  setAttr(bindings.root, 'style', toneStyle(tone), cache, 'toneStyle');
  for (const variant of TONES) {
    bindings.root.classList.toggle(`${ROOT_CLASS}-${variant}`, variant === tone);
  }

  setText(bindings.titleText, heading);
  setVisible(bindings.title, heading !== '');
  setText(bindings.bodyText, contents.get('message'));

  setVisible(bindings.dismiss, contents.get('dismissible') !== false);
}

let handle = null;

/** Register the Alert display type once; a second call returns the same handle. */
export function registerAlert() {
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

/** Create an Alert Pin on `session`; see `./text.js` on the option order. */
export function createAlertPin(session, options = {}) {
  registerAlert();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
