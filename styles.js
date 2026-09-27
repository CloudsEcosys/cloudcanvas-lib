/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's stylesheet door: injection, and the light-theme override set.
 *
 * Same two rules the core sheet is held to (`src/graphics/styles.js`), for the
 * same reasons:
 *
 *   1. Every themable value is a custom-property read whose *fallback* is the
 *      dark default. There is no `:root` block: the dark theme IS the fallback
 *      chain, so a page that defines nothing still looks designed and a page
 *      that defines one token changes exactly one thing.
 *
 *   2. Widgets ship no inline styles. Everything the kit renders is styled from
 *      `LIB_DEFAULT_CSS`, by class, so a consumer can restyle it with one rule.
 *
 * This layer is optional and additive: the nine tokens below are the only ones
 * it introduces, everything else it reads is already defined by the core sheet.
 * A consumer running the light theme spreads both override sets into one call -
 * `applyTheme(host, { ...LIGHT_THEME, ...LIB_LIGHT_THEME })` - because the kit's
 * tokens are the core theme's missing half, not a replacement for it.
 */
import { LIB_CONTROLS_CSS } from './styles-controls-css.js';
import { LIB_DISPLAY_CSS } from './styles-display-css.js';

/**
 * The kit's default stylesheet, injected once per document by
 * `injectLibStyles()`.
 *
 * The rules are data, not code, so they live in their own two modules - form
 * controls first, display widgets and the closing environment queries second -
 * and are joined here. Order is the contract: the environment queries have to
 * come last to win, which is why the display half owns them.
 */
export const LIB_DEFAULT_CSS = `${LIB_CONTROLS_CSS}${LIB_DISPLAY_CSS}`;

/** Id of the single kit stylesheet element. */
export const LIB_STYLE_ID = 'cloudcanvas-lib-styles';

/**
 * Light-theme overrides for the tokens this kit introduces.
 *
 * Mirrors `LIGHT_THEME` (`src/graphics/theme.js`) in shape and in scope: only
 * tokens whose dark fallback is wrong on a light surface appear, and every key
 * is read by `LIB_DEFAULT_CSS`, which `tests/unit/lib-list-and-styles.test.js`
 * asserts. It is a *supplement* - it repeats none of the core's keys, so the two
 * objects spread together without either shadowing the other.
 *
 * `--cc-input-border-focus` is a token read rather than a colour in both themes:
 * a focused field borrows the accent by definition, and stating it as its own
 * knob lets a consumer break that link without redefining the accent.
 */
export const LIB_LIGHT_THEME = /* @__PURE__ */ Object.freeze({
  '--cc-tone-info': '#0284c7',
  '--cc-tone-success': '#16a34a',
  '--cc-tone-warning': '#ca8a04',
  '--cc-tone-danger': '#dc2626',
  '--cc-input-bg': 'rgba(15, 23, 42, 0.04)',
  '--cc-input-border': 'rgba(15, 23, 42, 0.16)',
  '--cc-input-border-focus': 'var(--cc-accent)',
  '--cc-track-bg': 'rgba(15, 23, 42, 0.16)',
  '--cc-thumb-bg': '#ffffff'
});

/**
 * Inject the kit's stylesheet, exactly once per document.
 *
 * Write-once for the reason `injectCanvasStyles` is: several sessions can share
 * a page, and re-writing `textContent` on a live `<style>` invalidates every
 * rule the browser has already matched. An existing element is returned
 * untouched.
 *
 * There is no session-scoped half here. Every rule in this sheet is static - the
 * kit holds no per-session state and generates no per-session CSS - so a
 * removable second element would be a lifecycle to manage with nothing in it. A
 * consumer with genuinely session-scoped overrides already has the right tool in
 * `injectSessionStyles()` (`src/graphics/styles.js`), which returns the element
 * they must remove on teardown.
 *
 * @param {string} [customCSS] optional extra rules, appended to the kit sheet on
 *   the call that creates it. Ignored once the sheet exists, exactly as the
 *   core's base sheet ignores a late edit - pass session-scoped CSS to
 *   `injectSessionStyles()` instead, which hands back a removable element.
 * @returns {HTMLStyleElement|null} the kit's style element (null when headless)
 */
export function injectLibStyles(customCSS = '') {
  if (typeof document === 'undefined') return null;

  let styleEl = document.getElementById(LIB_STYLE_ID);
  if (styleEl) return styleEl;

  styleEl = document.createElement('style');
  styleEl.id = LIB_STYLE_ID;
  styleEl.textContent = typeof customCSS === 'string' && customCSS.trim() !== ''
    ? `${LIB_DEFAULT_CSS}\n${customCSS}`
    : LIB_DEFAULT_CSS;
  document.head.appendChild(styleEl);

  return styleEl;
}
