/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The component library's stylesheet: the style gate, the theme supplement,
 * and the contrast of every text-on-surface pair in both themes.
 *
 * Contrast is measured, not asserted by eye. Every pair below names the
 * layers a reader actually sees - the canvas background, the card over it, a
 * tint over that - and the token the text is printed in; each layer is
 * resolved from the sheet's own fallbacks for the dark theme and from the
 * three override sets for the light one, composited in order with the
 * framework's own `compositeOver`, and held to WCAG AA. A token that moves in
 * one theme and not the other fails here, in the theme it fails in.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CANVAS_DEFAULT_CSS, LIGHT_THEME } from '../../plugins/styles.js';
import { checkStyleDiscipline } from 'cloudcanvas/style-gates';
import { compositeOver, relativeLuminance } from 'cloudcanvas/primitives';
import { LIB_LIGHT_THEME } from '../../styles.js';
import {
  BREADCRUMB_CLS,
  CHAT_CLS,
  COMPONENT_DEFAULT_CSS,
  COMPONENT_STYLE_ID,
  COMPONENTS_LIGHT_THEME,
  EVENT_CLS,
  FLOW_CLS,
  MEDIA_CLS,
  STICKY_CLS,
  STICKY_THEMES,
  TASK_CLS,
  TELEMETRY_CLS,
  WORKSPACE_CLS,
  injectComponentStyles
} from '../../components/index.js';

const AA_CONTRAST = 4.5;

/** The whole light theme a consumer applies: core, base kit, components. */
const LIGHT = { ...LIGHT_THEME, ...LIB_LIGHT_THEME, ...COMPONENTS_LIGHT_THEME };

/** The sheets a token's dark default may be stated in, this library's first. */
const SHEETS = [COMPONENT_DEFAULT_CSS, CANVAS_DEFAULT_CSS];

/* ------------------ RESOLUTION ------------------ */

/** The fallback a sheet reads `token` with, balanced parens and all. */
function fallbackOf(token) {
  for (const css of SHEETS) {
    const needle = `var(${token},`;
    const at = css.indexOf(needle);
    if (at === -1) continue;

    let depth = 0;
    for (let cursor = at + 3; cursor < css.length; cursor += 1) {
      if (css[cursor] === '(') depth += 1;
      else if (css[cursor] === ')' && (depth -= 1) === 0) {
        return css.slice(at + needle.length, cursor).trim();
      }
    }
  }
  return null;
}

/** A token's value in a theme: the override when there is one, else the dark default. */
function valueOf(token, theme) {
  if (theme === 'light' && LIGHT[token] !== undefined) return LIGHT[token];
  const fallback = fallbackOf(token);
  assert.ok(fallback !== null, `${token} is read by no sheet`);
  return fallback;
}

const RGB = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/;

/** An opaque hex for a colour painted over `base`. */
function paint(value, base) {
  const colour = String(value).trim();
  if (colour.startsWith('#')) return colour;

  const match = RGB.exec(colour);
  assert.ok(match, `"${colour}" is not a colour this test can measure`);
  const hex = `#${[match[1], match[2], match[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  return alpha >= 1 ? hex : compositeOver(hex, alpha, base);
}

/** The surface a reader sees: the canvas, then each layer painted over it. */
function surfaceOf(layers, theme) {
  let surface = paint(valueOf('--cc-bg', theme), '#000000');
  for (const token of layers) surface = paint(valueOf(token, theme), surface);
  return surface;
}

function contrast(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ------------------ THE PAIRS ------------------ */

/** Chips print their label in the canvas background colour. */
const chip = (name, fill) => ({ name, layers: [fill], text: '--cc-bg' });
const onCard = (name, text, ...tints) => ({ name, layers: ['--cc-card-bg', ...tints], text });

const PAIRS = [
  ...STICKY_THEMES.map((theme) => ({
    name: `sticky-note ${theme} paper`,
    layers: [`--cc-sticky-${theme}`],
    text: `--cc-sticky-${theme}-ink`
  })),
  ...STICKY_THEMES.map((theme) => ({
    name: `sticky-note ${theme} editor`,
    layers: [`--cc-sticky-${theme}`, '--cc-sticky-editor-bg'],
    text: `--cc-sticky-${theme}-ink`
  })),
  onCard('card text', '--cc-text'),
  onCard('card muted text (time, unit, caption, type, crumb)', '--cc-text-muted'),
  onCard('check item hover / reaction pill / crumb hover', '--cc-text', '--cc-scope-bg'),
  onCard('editable input', '--cc-text', '--cc-scope-bg'),
  onCard('component button', '--cc-btn-text', '--cc-btn-bg'),
  onCard('component button hover', '--cc-btn-text', '--cc-btn-bg-hover'),
  onCard('workspace badge / pressed reaction / default avatar', '--cc-badge-text', '--cc-badge-bg'),
  chip('chip resting fill', '--cc-text'),
  chip('task priority urgent', '--cc-priority-urgent'),
  chip('task priority high', '--cc-priority-high'),
  chip('task priority normal', '--cc-priority-normal'),
  chip('task priority low', '--cc-priority-low'),
  chip('telemetry status nominal', '--cc-status-nominal'),
  chip('telemetry status warning', '--cc-status-warning'),
  chip('telemetry status critical', '--cc-status-critical'),
  chip('event severity critical', '--cc-severity-critical'),
  chip('event severity high', '--cc-severity-high'),
  chip('event severity normal', '--cc-severity-normal'),
  chip('event severity info', '--cc-severity-info')
];

for (const theme of ['dark', 'light']) {
  test(`COMPONENT_DEFAULT_CSS - every text pair clears ${AA_CONTRAST}:1 in the ${theme} theme`, () => {
    assert.ok(PAIRS.length >= 29, 'the pair table lost rows');

    for (const pair of PAIRS) {
      const surface = surfaceOf(pair.layers, theme);
      const ink = paint(valueOf(pair.text, theme), surface);
      const ratio = contrast(ink, surface);
      assert.ok(
        ratio >= AA_CONTRAST,
        `${pair.name} (${theme}): ${pair.text} ${ink} on ${surface} is ${ratio.toFixed(2)}:1`
      );
    }
  });
}

/* ------------------ THE SHEET ------------------ */

test('COMPONENT_DEFAULT_CSS - passes the style gate whole, and was actually read', () => {
  const { violations, stats } = checkStyleDiscipline(COMPONENT_DEFAULT_CSS);

  assert.deepEqual(violations.map((violation) => violation.message), []);
  assert.ok(stats.declarations > 400, `only ${stats.declarations} declarations were parsed`);
  assert.ok(stats.themable > 150, `only ${stats.themable} themable declarations were checked`);
  assert.ok(stats.classes > 100, `only ${stats.classes} classes were checked`);
});

test('COMPONENT_DEFAULT_CSS - styles every class the widgets emit', () => {
  const tables = [STICKY_CLS, TASK_CLS, TELEMETRY_CLS, FLOW_CLS, WORKSPACE_CLS, MEDIA_CLS, BREADCRUMB_CLS, CHAT_CLS, EVENT_CLS];

  for (const table of tables) {
    for (const className of Object.values(table)) {
      assert.ok(COMPONENT_DEFAULT_CSS.includes(`.${className}`), `${className} has no rule`);
    }
  }

  // The shared surfaces, and the native-control rules the widgets lean on.
  for (const fragment of [
    '.cloudcanvas-component-card',
    '.cloudcanvas-component-btn',
    '.cloudcanvas-component-chip',
    '.cloudcanvas-component-meter::-webkit-progress-value',
    '.cloudcanvas-component-meter::-moz-progress-bar',
    '.cloudcanvas-editable-input',
    'button:focus-visible',
    '[aria-pressed="true"]',
    '[data-theme="pink"]',
    '[data-priority="urgent"]',
    '[data-status="critical"]',
    '[data-severity="critical"]',
    'min-height: var(--cc-control-min, 28px)',
    '@media (pointer: coarse)',
    '@media (prefers-reduced-motion: reduce)'
  ]) {
    assert.ok(COMPONENT_DEFAULT_CSS.includes(fragment), `missing rule: ${fragment}`);
  }

  // No raw colour outside a fallback is what the gate proves; no `:root` block
  // is the other half of "the dark theme is the fallback chain".
  assert.equal(COMPONENT_DEFAULT_CSS.includes(':root'), false);
});

test('COMPONENTS_LIGHT_THEME - is frozen, additive, and read in full by the sheet', () => {
  assert.equal(Object.isFrozen(COMPONENTS_LIGHT_THEME), true);

  for (const [name, value] of Object.entries(COMPONENTS_LIGHT_THEME)) {
    assert.ok(name.startsWith('--cc-'), `${name} is outside the framework's prefix`);
    assert.notEqual(String(value).trim(), '', `${name} has an empty value`);
    assert.match(
      COMPONENT_DEFAULT_CSS,
      new RegExp(`var\\(${name},\\s*[^)]`),
      `${name} is themed but not read with a dark fallback`
    );
    assert.equal(name in LIGHT_THEME, false, `${name} shadows a core theme key`);
    assert.equal(name in LIB_LIGHT_THEME, false, `${name} shadows a base kit theme key`);
  }

  // The eleven tokens this library themes, stated so a silent removal fails here.
  assert.deepEqual(Object.keys(COMPONENTS_LIGHT_THEME), [
    '--cc-priority-urgent',
    '--cc-priority-high',
    '--cc-priority-normal',
    '--cc-priority-low',
    '--cc-status-nominal',
    '--cc-status-warning',
    '--cc-status-critical',
    '--cc-severity-critical',
    '--cc-severity-high',
    '--cc-severity-normal',
    '--cc-severity-info'
  ]);
});

test('injectComponentStyles - writes the sheet exactly once per document', (t) => {
  const clean = () => document.getElementById(COMPONENT_STYLE_ID)?.remove();
  t.after(clean);
  clean();

  const first = injectComponentStyles();
  assert.equal(first.id, COMPONENT_STYLE_ID);
  assert.equal(first.textContent, COMPONENT_DEFAULT_CSS);
  assert.equal(first.parentNode, document.head);

  first.textContent = '/* a live sheet the browser has already matched */';
  assert.equal(injectComponentStyles(), first, 'a second call replaced the element');
  assert.equal(first.textContent, '/* a live sheet the browser has already matched */');
  assert.equal(document.querySelectorAll(`#${COMPONENT_STYLE_ID}`).length, 1);
});
