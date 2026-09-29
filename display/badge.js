/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Badge: a small tinted chip, optionally dismissible.
 *
 *   const chip = createBadge(app, { x: 40, y: 40, text: 'beta', tone: 'info', dismissible: true });
 *
 * {@link toneSurface}, the tone-to-colour decision, is shared with `./alert.js`
 * rather than re-derived there, and exported for exactly that reason. A tone token is a
 * *hue*, and a hue says nothing about whether text can be read on it - printing
 * the raw tone as the text colour is how the previous component pass shipped
 * 3.6:1 labels. The fill and edge are the hue at a low alpha, left *translucent*
 * so the browser composites them over the live card/canvas rather than a baked-in
 * backdrop - that is what makes a toned Badge or Alert follow the theme instead of
 * always painting the dark card it was designed on. The foreground still has to
 * be one concrete colour, and one colour cannot read on both a dark and a light
 * composite, so it is computed for the dark card (`BADGE_SURFACE`) and
 * emitted as the *fallback* of a theme-owned override token, exactly as the
 * core's `createBadgeSVG` does. The dismiss button is `./widget.js`'s one
 * convention: a cancellable `dismiss` whose default action removes the widget.
 *
 * The values land on the surface *tokens* the shared sheet already reads
 * (`--cc-badge-bg`, `--cc-badge-border`, `--cc-badge-text`), never as a `color`
 * or `background` literal: the stylesheet keeps every rule, this only says which
 * values it should use for this instance - and `--cc-badge-text` is itself a
 * `var(--cc-badge-text-override, …)` read, so a light theme redefining that one
 * token (`LIGHT_THEME` already does) flips every toned label to dark with no
 * re-render. That is also why a toned Badge carries no
 * `cloudcanvas-lib-badge-<tone>` class - a class can only select a pre-decided
 * colour, and the readable foreground is not decidable until the tone is known.
 * The tone is published as `data-tone` instead, for anything that wants to know
 * which one it is.
 */

import { leadingText, setAttr, setText, setVisible } from '../../.plugin/addons/widget.js';
import {
  BADGE_SURFACE,
  BADGE_TEXT_OVERRIDE_TOKEN,
  compositeOver,
  contrastTextFor
} from '../../.plugin/graphics/primitives/primitives.js';
import { defineWidget } from './widget.js';

const NAME = 'badge';
const ROOT_CLASS = 'cloudcanvas-lib-badge';
const DISMISS_CLASS = 'cloudcanvas-lib-badge-dismiss';

/** Reference hues for the `--cc-tone-*` tokens. */
const TONE_HUES = /* @__PURE__ */ Object.freeze({
  info: '#38bdf8',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171'
});

/**
 * How much of the hue reaches the surface, as 8-bit alpha: enough to read as
 * tinted, not as paint. Emitted as a translucent suffix on the fill and edge
 * (`#rrggbbaa`) so the browser composites the tint over whatever card or canvas
 * the widget actually sits on - the surface is the live theme, not a hard-coded
 * hex, and it re-composites for free the instant the theme changes.
 */
const TONE_BG_ALPHA = 0x40;      // ~25%
const TONE_BORDER_ALPHA = 0x73;  // ~45%

/** An 8-bit alpha as the two hex digits appended to a `#rrggbb` fill. */
function alphaSuffix(byte) {
  return byte.toString(16).padStart(2, '0');
}

/** `neutral` is the absence of a tone: the sheet's own `--cc-badge-*` stand. */
const NEUTRAL = 'neutral';

/**
 * The translucent fill and edge, plus the *dark-theme* foreground, for a tone -
 * or `null` for `neutral`.
 *
 * Fill and edge are the raw hue at a low alpha, left translucent so the browser
 * composites them over the live surface the widget sits on. The foreground is a
 * concrete colour, and one colour cannot read on both a dark and a light
 * composite, so this is the dark answer: the hue composited over the dark card
 * (`BADGE_SURFACE`), then the readable foreground of *that*. A light
 * theme takes it back through the override token in `toneStyle`.
 *
 * @param {string} tone one of `info` / `success` / `warning` / `danger`
 * @returns {{background: string, border: string, text: string}|null}
 */
export function toneSurface(tone) {
  const hue = TONE_HUES[tone];
  if (!hue) return null;

  const darkFill = compositeOver(hue, TONE_BG_ALPHA / 255, BADGE_SURFACE);
  return {
    background: `${hue}${alphaSuffix(TONE_BG_ALPHA)}`,
    border: `${hue}${alphaSuffix(TONE_BORDER_ALPHA)}`,
    text: contrastTextFor(darkFill)
  };
}

/** The tone declarations for one badge, or the empty string for `neutral`. */
function toneStyle(tone) {
  const surface = toneSurface(tone);
  if (!surface) return '';
  // The foreground is written through the theme's override token, with the
  // dark-theme computation as its fallback: a light theme sets the token once
  // and every toned label reads dark, while a page with no theme keeps the
  // computed dark-card colour. (Same token and ordering the core badge uses.)
  return `--cc-badge-bg:${surface.background};`
    + `--cc-badge-border:${surface.border};`
    + `--cc-badge-text:var(${BADGE_TEXT_OVERRIDE_TOKEN}, ${surface.text});`;
}

function bind(host, on, dismiss) {
  const root = host.querySelector(`.${ROOT_CLASS}`);
  const button = root.querySelector(`.${DISMISS_CLASS}`);
  on(button, 'click', dismiss);
  return { root, label: leadingText(root), dismiss: button };
}

function render(bindings, contents, cache) {
  const tone = TONE_HUES[contents.get('tone')] ? contents.get('tone') : NEUTRAL;

  setText(bindings.label, contents.get('text'));
  setAttr(bindings.root, 'data-tone', tone, cache, 'tone');
  setAttr(bindings.root, 'style', toneStyle(tone), cache, 'toneStyle');
  setVisible(bindings.dismiss, contents.get('dismissible') === true);
}

const widget = /* @__PURE__ */ defineWidget({
  name: NAME,
  // A real `<button>`: `CONTROL_SELECTOR` already exempts it from the drag gesture.
  html: `<span class="${ROOT_CLASS}"><button class="${DISMISS_CLASS}" type="button" aria-label="Dismiss">×</button></span>`,
  allowedKeys: ['text', 'tone', 'dismissible'],
  bind,
  render
});

/** Define the Badge widget, once. @returns {object} its type */
export const registerBadge = widget.define;

/** A chromeless Badge blit in `parent`: `createBadge(app, { x, y, text, tone, dismissible })`. */
export const createBadge = widget.create;
