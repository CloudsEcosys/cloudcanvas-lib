/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The component library's stylesheet door: the joined sheet, its light-theme
 * supplement, and the one injection call.
 *
 * Same two rules the base kit's sheet is held to (`lib/styles.js`), for the
 * same reasons: every themable value is a token read whose fallback is the
 * dark default (no `:root` block - the dark theme is the fallback chain), and
 * the widgets ship no inline styles beyond the custom properties a widget
 * writes for a per-instance value (a note's tilt, an avatar's colour).
 *
 * The rules are data, so they live in their own three modules and are joined
 * here. Order is the contract: `./styles-cards-css.js` opens with the shared
 * surfaces the other two build on, and `./styles-comms-css.js` owns the
 * environment queries, which have to come last to win.
 */
import { COMPONENTS_CARDS_CSS } from './styles-cards-css.js';
import { COMPONENTS_BOARD_CSS } from './styles-board-css.js';
import { COMPONENTS_COMMS_CSS } from './styles-comms-css.js';

/** Id of the single component stylesheet element. */
export const COMPONENT_STYLE_ID = 'cloudcanvas-components-styles';

/** The component sheet, injected once per document by `injectComponentStyles()`. */
export const COMPONENT_DEFAULT_CSS = `${COMPONENTS_CARDS_CSS}${COMPONENTS_BOARD_CSS}${COMPONENTS_COMMS_CSS}`;

/**
 * The tokens this library introduces, each with its dark default: exactly the
 * fallback every read of it in the component sheet carries, so the catalogue is
 * the definition and applying it renders nothing new. A note's tilt and a chat
 * avatar's colours are also written per instance; their entry is the value an
 * instance without one reads. `tests/unit/tokens-defined.test.js` holds
 * each fallback to its value here and every `--cc-*` read to a catalogue.
 */
export const COMPONENT_TOKENS = /* @__PURE__ */ Object.freeze({
  '--cc-priority-urgent': '#fb7185',
  '--cc-priority-high': '#fb923c',
  '--cc-priority-normal': '#38bdf8',
  '--cc-priority-low': '#94a3b8',
  '--cc-status-nominal': '#34d399',
  '--cc-status-warning': '#fbbf24',
  '--cc-status-critical': '#f87171',
  '--cc-severity-critical': '#f87171',
  '--cc-severity-critical-glow': '0 0 16px rgba(248, 113, 113, 0.6)',
  '--cc-severity-high': '#fbbf24',
  '--cc-severity-normal': '#38bdf8',
  '--cc-severity-info': '#34d399',
  '--cc-flow-pulse': '0 0 20px rgba(56, 189, 248, 0.6)',
  '--cc-type-display': '28px',
  '--cc-weight-bold': '700',
  '--cc-chat-avatar-bg': 'var(--cc-badge-bg, rgba(56, 189, 248, 0.15))',
  '--cc-chat-avatar-text': 'var(--cc-badge-text, #38bdf8)',
  '--cc-sticky-yellow': '#fef08a',
  '--cc-sticky-yellow-ink': '#713f12',
  '--cc-sticky-pink': '#fbcfe8',
  '--cc-sticky-pink-ink': '#831843',
  '--cc-sticky-cyan': '#bae6fd',
  '--cc-sticky-cyan-ink': '#0c4a6e',
  '--cc-sticky-lime': '#d9f99d',
  '--cc-sticky-lime-ink': '#365314',
  '--cc-sticky-orange': '#fed7aa',
  '--cc-sticky-orange-ink': '#7c2d12',
  '--cc-sticky-pinhead': '#e11d48',
  '--cc-sticky-pinhead-shadow': '0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
  '--cc-sticky-rule': 'rgba(0, 0, 0, 0.2)',
  '--cc-sticky-swatch-ring': '0 0 0 1px rgba(0, 0, 0, 0.2)',
  '--cc-sticky-swatch-ring-active': '0 0 0 2px currentColor',
  '--cc-sticky-editor-bg': 'rgba(255, 255, 255, 0.7)',
  '--cc-sticky-tilt': '0deg'
});

/**
 * Light-theme overrides for the tokens this library introduces.
 *
 * Mirrors `LIGHT_THEME` (`src/graphics/theme.js`) and `LIB_LIGHT_THEME`
 * (`lib/styles.js`) in shape and in scope: only tokens whose dark fallback is
 * wrong on a light surface appear, every key is read by `COMPONENT_DEFAULT_CSS`,
 * and it repeats none of the other two sets' keys - so all three spread into
 * one call without any shadowing another:
 *
 *   applyTheme(host, { ...LIGHT_THEME, ...LIB_LIGHT_THEME, ...COMPONENTS_LIGHT_THEME });
 *
 * Every value is a filled chip's background, printed with `--cc-bg` as its
 * ink: the dark fallbacks are the bright 400-weight hues that read with dark
 * ink, and these are the deeper 700/800-weight hues that read with light ink.
 * `tests/unit/lib-components.test.js` measures every pair in both themes.
 *
 * The sticky-note tokens are absent on purpose: paper and its ink are the same
 * colour on either board, so their fallbacks are their only values.
 */
export const COMPONENTS_LIGHT_THEME = /* @__PURE__ */ Object.freeze({
  '--cc-priority-urgent': '#be123c',
  '--cc-priority-high': '#9a3412',
  '--cc-priority-normal': '#0369a1',
  '--cc-priority-low': '#475569',
  '--cc-status-nominal': '#047857',
  '--cc-status-warning': '#92400e',
  '--cc-status-critical': '#b91c1c',
  '--cc-severity-critical': '#b91c1c',
  '--cc-severity-high': '#92400e',
  '--cc-severity-normal': '#0369a1',
  '--cc-severity-info': '#047857'
});

/**
 * Inject the component stylesheet, exactly once per document.
 *
 * Write-once for the reason `injectLibStyles` is: several sessions can share
 * a page, and re-writing `textContent` on a live `<style>` invalidates every
 * rule the browser has already matched. An existing element is returned
 * untouched. Every widget's `onAttach` calls this, so a page that creates one
 * component gets the sheet without a separate call.
 *
 * @returns {HTMLStyleElement|null} the style element (null when headless)
 */
export function injectComponentStyles() {
  if (typeof document === 'undefined') return null;
  const existing = document.getElementById(COMPONENT_STYLE_ID);
  if (existing) return existing;

  const style = document.createElement('style');
  style.id = COMPONENT_STYLE_ID;
  style.textContent = COMPONENT_DEFAULT_CSS;
  document.head.appendChild(style);
  return style;
}
