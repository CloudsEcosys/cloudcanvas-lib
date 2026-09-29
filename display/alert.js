/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Alert: a toned message, optionally dismissible.
 *
 *   const saved = createAlert(app, { x: 40, y: 40, title: 'Saved', message: 'All good', tone: 'success' });
 *
 * The role is a function of the tone, and it is written on every pass rather
 * than at build: `warning` and `danger` are `role="alert"`, which interrupts,
 * and `info` and `success` are `role="status"`, which waits its turn. Changing
 * the tone at runtime therefore changes the urgency a screen reader is told
 * about too - a danger that still announces politely is the failure this costs
 * one attribute write to avoid.
 *
 * The tone surface is `./badge.js`'s and the dismiss convention `./widget.js`'s,
 * imported rather than re-derived; see the badge's header for why the fill is
 * translucent and the foreground is computed-for-dark behind a theme override
 * token. Here the
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

import { leadingText, setAttr, setText, setVisible } from '../../.plugin/addons/widget.js';
import { BADGE_TEXT_OVERRIDE_TOKEN } from '../../.plugin/graphics/primitives/primitives.js';
import { toneSurface } from './badge.js';
import { defineWidget } from './widget.js';

const NAME = 'alert';
const ROOT_CLASS = 'cloudcanvas-lib-alert';
const CONTENT_CLASS = 'cloudcanvas-lib-alert-content';
const TITLE_CLASS = 'cloudcanvas-lib-alert-title';
const BODY_CLASS = 'cloudcanvas-lib-alert-body';
const DISMISS_CLASS = 'cloudcanvas-lib-alert-dismiss';

const TONES = ['info', 'success', 'warning', 'danger'];

/** Tones whose arrival is worth interrupting a screen reader for. */
const ASSERTIVE_TONES = new Set(['warning', 'danger']);

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
  const text = `var(${BADGE_TEXT_OVERRIDE_TOKEN}, ${surface.text})`;
  return `--cc-scope-bg:${surface.background};`
    + `--cc-card-border:${surface.border};`
    + `--cc-text:${text};`
    + `--cc-text-muted:${text};`;
}

function bind(host, on, dismiss) {
  const root = host.querySelector(`.${ROOT_CLASS}`);
  const title = root.querySelector(`.${TITLE_CLASS}`);
  const body = root.querySelector(`.${BODY_CLASS}`);
  const button = root.querySelector(`.${DISMISS_CLASS}`);
  on(button, 'click', dismiss);
  return { root, title, titleText: leadingText(title), body, bodyText: leadingText(body), dismiss: button };
}

function render(bindings, contents, cache) {
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

const widget = /* @__PURE__ */ defineWidget({
  name: NAME,
  html: `<div class="${ROOT_CLASS}"><div class="${CONTENT_CLASS}"><strong class="${TITLE_CLASS}"></strong>`
    + `<p class="${BODY_CLASS}"></p></div>`
    + `<button class="${DISMISS_CLASS}" type="button" aria-label="Dismiss">×</button></div>`,
  allowedKeys: ['title', 'message', 'tone', 'dismissible'],
  bind,
  render
});

/** Define the Alert widget, once. @returns {object} its type */
export const registerAlert = widget.define;

/** A chromeless Alert blit in `parent`: `createAlert(app, { x, y, title, message, tone, dismissible })`. */
export const createAlert = widget.create;
