/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The design system's invariants: token discipline in the default stylesheet,
 * class discipline in the display types, write-once base injection, the
 * session-stylesheet lifecycle, and the theming API.
 *
 * The first two are permanent guards, not coverage. A hardcoded colour in the
 * stylesheet or an inline style in a template is invisible until someone tries
 * to theme or restyle the framework - at which point it is a bug report, not a
 * diff. These tests turn both into a failing assertion at the moment they land.
 *
 * The stylesheet half of that is `checkStyleDiscipline`
 * (`cloudcanvas/style-gates`) - the rules are shipped now, not test-local,
 * because a consumer's own sheet and a component pack's are held to them too.
 * Its own mutation coverage lives in `./style-gates.test.js`. What stays here is
 * everything specific to *this* sheet and *these* types: the classes the
 * display types (`plugins/types.js`) emit, the hand-off rules the
 * add-ons write against, and the inline-style ban on their DOM.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  BASE_STYLE_ID,
  CANVAS_DEFAULT_CSS,
  LIGHT_THEME,
  SESSION_STYLE_ATTR,
  applyTheme,
  injectCanvasStyles,
  injectSessionStyles
} from '../../plugins/styles.js';
import {
  createBadgeSVG,
  createConnectorPathSVG,
  createGradientMeterSVG
} from 'cloudcanvas/primitives';
import { checkStyleDiscipline } from 'cloudcanvas/style-gates';
import { CLS, registerDisplayTypes } from '../../plugins/types.js';
import { CONNECTOR_STROKE } from '../../plugins/connect.js';
import { resetDocument } from '../helpers/dom.js';
import { coreScene } from '../helpers/core-scene.js';

/** Slots whose contents are SVG strings, so an inline style is the only option. */
const SVG_SLOTS = new Set([CLS.BADGE_SLOT, CLS.NEEDLE_SLOT, CLS.METER_SLOT]);

/** Sources that read `--cc-*` tokens from outside the stylesheet. */
const TOKEN_READING_SOURCES = [
  import.meta.resolve('cloudcanvas/primitives'),
  new URL('../../plugins/connect.js', import.meta.url).href,
  // The cursor traits interpolate their colours into SVG attributes, so they
  // read tokens directly rather than being matched by a stylesheet rule.
  new URL('../../plugins/cursors.js', import.meta.url).href
];

/** Declaration bodies of every rule, at-rules included (text after the last `{`). */
function declarationsOf(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const declarations = [];

  for (const chunk of stripped.split('}')) {
    const open = chunk.lastIndexOf('{');
    if (open === -1) continue;

    for (const raw of chunk.slice(open + 1).split(';')) {
      const colon = raw.indexOf(':');
      if (colon === -1) continue;
      declarations.push({
        property: raw.slice(0, colon).trim().toLowerCase(),
        value: raw.slice(colon + 1).trim()
      });
    }
  }

  return declarations;
}

test('CANVAS_DEFAULT_CSS - keeps the discipline the framework ships as a gate', () => {
  const { violations, stats } = checkStyleDiscipline(CANVAS_DEFAULT_CSS);

  assert.deepEqual(violations.map((violation) => violation.message), []);
  assert.ok(stats.declarations > 60, `only ${stats.declarations} declarations were parsed`);
  assert.ok(stats.themable > 30, `only ${stats.themable} themable declarations were checked`);
});

test('CANVAS_DEFAULT_CSS - every class the templates emit is styled', () => {
  for (const className of Object.values(CLS)) {
    assert.ok(
      CANVAS_DEFAULT_CSS.includes(`.${className}`),
      `${className} is built by a template but has no default rule`
    );
  }

  // The classes the add-ons write themselves.
  for (const className of ['cloudcanvas-primitive-badge', 'cloudcanvas-grab-handle', 'cloudcanvas-resize-handle',
    'cloudcanvas-context-menu', 'cloudcanvas-live-region', 'cloudcanvas-toast', 'cloudcanvas-svg-state-host']) {
    assert.ok(CANVAS_DEFAULT_CSS.includes(`.${className}`), `${className} has no default rule`);
  }
});

test('CANVAS_DEFAULT_CSS - the hand-off rules are present', () => {
  const required = [
    '[data-blit-root]:focus-visible',
    '[data-blit-root] [data-blit]:focus-visible',
    '[data-blit][data-chrome="true"]:hover',
    '[data-blit][data-bordered="false"]:hover',
    '@media (pointer: coarse)',
    '@media (prefers-reduced-motion: reduce)',
    '[data-blit][data-selectable-text="true"] [data-drag-handle]',
    'var(--cc-scope-overflow, hidden)'
  ];
  for (const fragment of required) {
    assert.ok(CANVAS_DEFAULT_CSS.includes(fragment), `missing hand-off rule: ${fragment}`);
  }
});

/** Each rule's declarations by its selector, comments dropped; at-rule bodies read by their inner selector. */
function rulesOf(css) {
  return Object.fromEntries(
    css.replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .map((chunk) => {
        const open = chunk.lastIndexOf('{');
        if (open === -1) return null;
        const prelude = chunk.slice(0, open);
        return [prelude.slice(prelude.lastIndexOf('{') + 1).replace(/\s+/g, ' ').trim(), chunk.slice(open + 1)];
      })
      .filter(Boolean)
  );
}

test('CANVAS_DEFAULT_CSS - the root is a gesture surface: no text selection, the canvas surface and type', () => {
  const rules = rulesOf(CANVAS_DEFAULT_CSS);
  const board = rules['[data-blit-root]'];
  assert.ok(board, 'the board lost its root rule');
  for (const fragment of ['user-select: none', '-webkit-user-select: none', 'background-color: var(--cc-bg',
    'color: var(--cc-text', 'font-family: var(--cc-font', 'font-size: var(--cc-type-md']) {
    assert.ok(board.includes(fragment), `the root rule is missing: ${fragment}`);
  }
  const panned = rules['[data-blit-root][data-pan]'];
  assert.ok(panned, 'the pan chunk lost its surface rule');
  assert.match(panned, /user-select:\s*none/);
  assert.match(panned, /touch-action:\s*none/);
});

test('CANVAS_DEFAULT_CSS - the scope well is a granted state, not the default one', () => {
  const rules = rulesOf(CANVAS_DEFAULT_CSS);

  // Every container widget owns a scope well, so the empty one has to cost nothing.
  const base = rules['.cloudcanvas-card-scope'];
  assert.ok(base, 'the scope container lost its base rule');
  assert.match(base, /min-height:\s*0/);
  assert.match(base, /margin:\s*0/);
  assert.match(rules['[data-scope].cloudcanvas-card-scope:empty'] ?? '', /display:\s*none/, 'an empty scope still takes up space');

  // ...and the well - box, border, gap, clipping - arrives with the class.
  const well = rules['.cloudcanvas-card-scope.cc-populated'];
  assert.ok(well, 'there is no populated scope rule for the renderer to grant');
  for (const fragment of ['margin-top: var(--cc-space-2', 'min-height: var(--cc-scope-min-height',
    'background: var(--cc-scope-bg', 'overflow: var(--cc-scope-overflow, hidden)']) {
    assert.ok(well.includes(fragment), `the populated well is missing: ${fragment}`);
  }
});

test('CANVAS_DEFAULT_CSS - stacking is class-driven and carries no !important z-index', () => {
  const rules = rulesOf(CANVAS_DEFAULT_CSS);
  for (const selector of ['[data-blit].is-dragging', '[data-blit].is-resizing']) {
    assert.match(rules[selector] ?? '', /z-index: var\(--cc-z-drag, 1100\)/, `${selector} does not clear its neighbours`);
  }
  assert.match(rules['[data-blit].cc-moving'] ?? '', /will-change: transform/, 'a moving blit promises no layer');

  // A consumer must be able to restack the canvas without an arms race.
  for (const { property, value } of declarationsOf(CANVAS_DEFAULT_CSS)) {
    if (property !== 'z-index') continue;
    assert.equal(value.includes('!important'), false, `z-index is still forced: ${value}`);
  }

  // No blanket compositor hint; only a moving blit promises a layer.
  const blits = rules['[data-blit-root] [data-blit]'];
  assert.ok(blits, 'the board lost its blit rule');
  assert.equal(blits.includes('will-change'), false, 'every blit is promising the compositor a layer');
});

/** Is `element` inside (or itself) one of the SVG string slots? */
function insideSvgSlot(element, root) {
  for (let node = element; node && node !== root; node = node.parentElement) {
    const className = node.getAttribute ? node.getAttribute('class') : null;
    if (className && className.split(/\s+/).some((name) => SVG_SLOTS.has(name))) return true;
  }
  return false;
}

/** Every element a display type built, paired with whether it is slot markup. */
function templateElements(b) {
  const root = b.el;
  return Array.from(root.querySelectorAll('*')).map((element) => ({
    element,
    fromSlot: insideSvgSlot(element.parentElement, root)
  }));
}

/** A display blit of `type`, its trait (the type's camel-cased name) given `contents`. */
function displayBlit(app, type, contents) {
  registerDisplayTypes();
  const trait = type.replace(/-(\w)/g, (_, character) => character.toUpperCase());
  return app.blit({ type, [trait]: contents });
}

const FULL_CONTENTS = {
  card: { title: 'T', body: 'B', author: 'A', actionText: 'Go', badge: { text: 'N', color: '#38bdf8' } },
  'vector-pointer': { title: 'T', angle: 30, magnitude: 40, label: 'L', color: '#38bdf8' },
  media: { title: 'T', caption: 'C', src: 'https://example.test/a.png', badge: 'AVIF' }
};

test('display types - every class is prefixed and no element carries a style', (t) => {
  const { app } = coreScene(t);

  for (const [type, contents] of Object.entries(FULL_CONTENTS)) {
    const b = displayBlit(app, type, contents);

    for (const { element, fromSlot } of templateElements(b)) {
      if (fromSlot) continue;

      const className = element.getAttribute('class') || '';
      assert.notEqual(className, '', `<${element.tagName}> in "${type}" has no class`);
      for (const name of className.split(/\s+/)) {
        assert.ok(name.startsWith('cloudcanvas-'), `"${name}" in "${type}" is not namespaced`);
      }
      assert.equal(
        element.getAttribute('style'),
        null,
        `<${element.tagName}.${className}> in "${type}" carries an inline style`
      );
    }
  }
});

test('display types - the slots are the only inline-styled markup', (t) => {
  const { app } = coreScene(t);

  const b = displayBlit(app, 'vector-pointer', FULL_CONTENTS['vector-pointer']);
  const styled = templateElements(b).filter(({ element }) => element.getAttribute('style') !== null);

  assert.ok(styled.length > 0, 'the SVG slots rendered nothing at all');
  for (const { element, fromSlot } of styled) {
    assert.equal(fromSlot, true, `<${element.tagName}> is inline-styled outside a slot`);
  }
});

test('SVG generators - inline styles read the same tokens as the stylesheet', () => {
  const meter = createGradientMeterSVG(50, 0, 100, { color: '#38bdf8' });
  assert.match(meter, /var\(--cc-meter-track,/, 'the meter track is hardcoded');
  assert.match(meter, /var\(--cc-meter-end,/, 'the meter gradient end is hardcoded');
  assert.match(createBadgeSVG('B', '#38bdf8'), /var\(--cc-badge-dot,/, 'the badge dot is hardcoded');

  // The connector default survives `safeColor`, which validates the fallback in turn.
  const connector = createConnectorPathSVG(0, 0, 10, 10, {});
  assert.match(connector, /stroke="var\(--cc-connector, rgba\(56, 189, 248, 0\.6\)\)"/);
  assert.equal(CONNECTOR_STROKE, 'var(--cc-connector, rgba(56, 189, 248, 0.6))');
});

/* ------------------ INJECTION ------------------ */

function removeInjectedStyles() {
  document.getElementById(BASE_STYLE_ID)?.remove();
  for (const element of document.querySelectorAll(`style[${SESSION_STYLE_ATTR}]`)) element.remove();
}

test('injectCanvasStyles - writes the base sheet exactly once', (t) => {
  t.after(removeInjectedStyles);
  removeInjectedStyles();

  const first = injectCanvasStyles();
  assert.equal(first.id, BASE_STYLE_ID);
  assert.equal(first.textContent, CANVAS_DEFAULT_CSS);

  first.textContent = '/* a live sheet the browser has already matched */';
  const second = injectCanvasStyles();

  assert.equal(second, first, 'a second call replaced the base element');
  assert.equal(second.textContent, '/* a live sheet the browser has already matched */');
  assert.equal(document.querySelectorAll(`#${BASE_STYLE_ID}`).length, 1);
});

test('injectCanvasStyles - the deprecated customCSS argument routes to a session sheet', (t) => {
  t.after(removeInjectedStyles);
  removeInjectedStyles();

  const base = injectCanvasStyles('.demo { color: red; }');
  const session = document.querySelector(`style[${SESSION_STYLE_ATTR}]`);

  assert.equal(base.textContent, CANVAS_DEFAULT_CSS, 'custom CSS leaked into the base sheet');
  assert.ok(session, 'the custom CSS was dropped');
  assert.equal(session.textContent, '.demo { color: red; }');
});

test('injectSessionStyles - one removable element per call, empty input ignored', (t) => {
  t.after(removeInjectedStyles);
  removeInjectedStyles();

  assert.equal(injectSessionStyles(''), null);
  assert.equal(injectSessionStyles('   '), null);
  assert.equal(injectSessionStyles(undefined), null);
  assert.equal(document.querySelectorAll(`style[${SESSION_STYLE_ATTR}]`).length, 0);

  const first = injectSessionStyles('.a { color: red; }');
  const second = injectSessionStyles('.b { color: blue; }');

  assert.notEqual(first, second, 'two sessions shared one element');
  assert.equal(first.parentNode, document.head);
  assert.equal(document.querySelectorAll(`style[${SESSION_STYLE_ATTR}]`).length, 2);

  first.remove();
  assert.equal(document.querySelectorAll(`style[${SESSION_STYLE_ATTR}]`).length, 1);
  assert.equal(second.textContent, '.b { color: blue; }', 'removing one session touched the other');
});

/* ------------------ THEMING ------------------ */

test('applyTheme - writes tokens, removes them individually, and clears wholesale', (t) => {
  t.after(resetDocument);

  const host = document.createElement('div');
  host.style.setProperty('--unrelated', 'keep me');

  assert.equal(applyTheme(host, LIGHT_THEME), host);
  assert.equal(host.style.getPropertyValue('--cc-bg'), LIGHT_THEME['--cc-bg']);
  assert.equal(host.style.getPropertyValue('--cc-text'), LIGHT_THEME['--cc-text']);

  applyTheme(host, { '--cc-bg': null, '--cc-accent': '#123456', 'color': 'red' });
  assert.equal(host.style.getPropertyValue('--cc-bg'), '');
  assert.equal(host.style.getPropertyValue('--cc-accent'), '#123456');
  assert.equal(host.style.getPropertyValue('color'), '', 'a non-token key was written');

  applyTheme(host, null);
  for (const name of Object.keys(LIGHT_THEME)) {
    assert.equal(host.style.getPropertyValue(name), '', `${name} survived the clear`);
  }
  assert.equal(host.style.getPropertyValue('--unrelated'), 'keep me', 'a foreign property was cleared');

  assert.equal(applyTheme(null, LIGHT_THEME), null);
});

test('LIGHT_THEME - is frozen and overrides only tokens something reads', () => {
  assert.equal(Object.isFrozen(LIGHT_THEME), true);

  const referenced = new Set();
  const collect = (text) => {
    for (const match of text.matchAll(/--cc-[a-z0-9-]+/g)) referenced.add(match[0]);
  };

  collect(CANVAS_DEFAULT_CSS);
  for (const url of TOKEN_READING_SOURCES) {
    collect(readFileSync(fileURLToPath(url), 'utf8'));
  }

  for (const name of Object.keys(LIGHT_THEME)) {
    assert.ok(referenced.has(name), `${name} is themed but nothing reads it`);
    assert.notEqual(String(LIGHT_THEME[name]).trim(), '', `${name} has an empty value`);
  }

  // The cursor colours were the last hardcoded hexes outside the token system;
  // they are part of the reference theme now, and must stay there.
  for (const name of ['--cc-cursor-focus', '--cc-cursor-selected', '--cc-cursor-activated']) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(LIGHT_THEME, name),
      `${name} is read by a cursor but is missing from LIGHT_THEME`
    );
  }
});
