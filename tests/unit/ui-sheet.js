/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The kit sheet, read the way the style suites need it: every rule with the
 * media query it stands in, what the sheet declares for one selector, and a
 * declared colour as a browser would compute it - the theme's value for a
 * token, else the fallback - so contrast is computed, not eyeballed.
 *
 * Not a suite: it has no test of its own, and the runner's `*.test.js` glob
 * does not pick it up. It is shared by the suites that hold the sheet to its
 * word (`ui-menu-tabs-style.test.js`, `ui-tabs-face.test.js`,
 * `ui-view-style.test.js`).
 */
import assert from 'node:assert/strict';
import { UI_CSS } from '../../ui/index.js';
import { LIGHT_THEME } from 'cloudcanvas/theme';
import { LIB_LIGHT_THEME } from '../../styles.js';

/** The query a rule for a coarse pointer stands in. */
export const COARSE = '(pointer: coarse)';

/** One block of rules as `{media, selector, declarations}`. */
function rulesIn(block, media) {
  return [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    media,
    selector: selector.trim().replace(/\s+/g, ' '),
    declarations: Object.fromEntries(body.split(';').filter((line) => line.includes(':'))
      .map((line) => [line.slice(0, line.indexOf(':')).trim(), line.slice(line.indexOf(':') + 1).trim()]))
  }));
}

/** Every rule of the kit sheet, those inside an `@media` block carrying its query. */
export const RULES = (() => {
  const css = UI_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  const queries = /@media([^{]+)\{((?:[^{}]|\{[^{}]*\})*)\}/g;
  const inside = [...css.matchAll(queries)].flatMap(([, query, block]) => rulesIn(block, query.trim()));
  return [...rulesIn(css.replace(queries, ''), null), ...inside];
})();

/** The rules that name `part` in their selector, outside any media query unless one is given. */
export const rulesFor = (part, media = null) => RULES.filter((rule) => rule.media === media && rule.selector.includes(part));

/** The selectors of a rule's list: split at its commas, but not at the ones inside `:is(...)`. */
export function listed(selector) {
  const parts = [''];
  let depth = 0;
  for (const char of selector) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) parts.push('');
    else parts[parts.length - 1] += char;
  }
  return parts.map((part) => part.trim());
}

/**
 * What the sheet declares for `property` on exactly `selector`: by a rule of
 * its own, or by one that lists it among others. Outside any media query
 * unless one is given.
 */
export function declared(selector, property, media = null) {
  const rule = RULES.findLast((entry) => entry.media === media && listed(entry.selector).includes(selector) && property in entry.declarations);
  assert.ok(rule, `the sheet declares no ${property} for ${selector}${media ? ` under ${media}` : ''}`);
  return rule.declarations[property];
}

/** What `value` computes to under `theme`: each `var(--name, fallback)` is the theme's value, else its fallback, read the same way. */
export function resolve(value, theme) {
  const start = value.indexOf('var(');
  if (start === -1) return value.trim();
  let depth = 0;
  let end = start + 3;
  for (; end < value.length; end += 1) {
    if (value[end] === '(') depth += 1;
    else if (value[end] === ')' && --depth === 0) break;
  }
  const inner = value.slice(start + 4, end);
  const comma = inner.indexOf(',');
  const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
  const read = Object.hasOwn(theme, name) ? theme[name] : inner.slice(comma + 1);
  return resolve(`${value.slice(0, start)}${read}${value.slice(end + 1)}`, theme);
}

/** A colour as `[r, g, b, alpha]`. */
export function colour(text) {
  const hex = /^#([0-9a-f]{6})$/i.exec(text);
  if (hex) return [...[0, 2, 4].map((at) => parseInt(hex[1].slice(at, at + 2), 16)), 1];
  const parts = /^rgba?\(([^)]+)\)$/.exec(text);
  assert.ok(parts, `not a colour this test reads: ${text}`);
  const [r, g, b, alpha = 1] = parts[1].split(',').map(Number);
  return [r, g, b, alpha];
}

/** `front` laid over the opaque `back`. */
export const over = ([r, g, b, alpha], back) => [r, g, b].map((channel, index) => channel * alpha + back[index] * (1 - alpha));

/** WCAG relative luminance, and the contrast ratio of two opaque colours. */
export function luminance(rgb) {
  const [r, g, b] = rgb.map((channel) => (channel / 255 <= 0.04045 ? channel / 255 / 12.92 : ((channel / 255 + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

/** The dark theme is the sheet's own fallbacks; the light one is the engine's reference set plus the component library's, which holds the tones. */
export const THEMES = { dark: {}, light: { ...LIGHT_THEME, ...LIB_LIGHT_THEME } };

/** The canvas background the kit is laid over when a theme names none (`.plugin/graphics/css/canvas.js`). */
export const DARK_PAGE = '#0f1117';

/** The page a theme lays the kit over, as an opaque colour. */
export const pageOf = (theme) => colour(theme['--cc-bg'] ?? DARK_PAGE);

/** The one colour a flat `linear-gradient(c, c)` lays down. */
export function flat(gradient) {
  const stops = /^linear-gradient\((.+), \1\)$/.exec(gradient);
  assert.ok(stops, `not a flat wash: ${gradient}`);
  return stops[1];
}

/** Every colour-bearing declaration of the rules whose selector names one of `parts`, as `[name, value]`. */
export function coloursOf(parts) {
  return RULES.filter((rule) => parts.some((part) => rule.selector.includes(part)))
    .flatMap((rule) => Object.entries(rule.declarations).filter(([name]) => /^(color|background(-color|-image)?|border(-[a-z]+)*|outline|box-shadow|--layer-shade|--tab-face)$/.test(name)));
}

/** Fails for a colour-bearing declaration that carries a colour which is no token read: a literal outside every `var()`. */
export function assertTokensOnly(colours) {
  for (const [name, value] of colours) {
    assert.doesNotMatch(value.replace(/var\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)/g, ''), /#|rgb|hsl/, `${name}: ${value} carries a colour that is no token read`);
  }
}
