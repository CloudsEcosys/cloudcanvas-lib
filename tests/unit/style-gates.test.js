/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The style gate itself: each rule against a sheet that breaks it, and both
 * shipped sheets against all three.
 *
 * A gate is only worth what it catches, so every rule here is tested by
 * mutation - a sheet identical to a legal one except for the one thing the rule
 * exists to forbid. A checker that returns an empty array for everything would
 * pass a "the sheet is clean" test and fail every test below.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STYLE_RULES,
  checkStyleDiscipline
} from 'cloudcanvas/style-gates';
import { CANVAS_DEFAULT_CSS } from '../../plugins/styles.js';
import { COMPONENT_DEFAULT_CSS } from '../../components/styles.js';

/** A legal sheet: tokens with fallbacks, namespaced classes, nothing forced. */
const CLEAN_CSS = `
/* a comment { with braces } and a .fake-class */
.cloudcanvas-demo-card {
  position: absolute;
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-card-bg, rgba(20, 24, 33, 0.92));
  box-shadow: var(--cc-shadow-1, 0 2px 8px rgba(0, 0, 0, 0.4));
  border-radius: var(--cc-radius-md, 10px);
  z-index: var(--cc-z-card, 5);
}

.cloudcanvas-demo-card.is-active .cloudcanvas-demo-title {
  font-weight: var(--cc-weight-bold, 600);
}

.cloudcanvas-demo-card.cc-raised {
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55)) !important;
}

@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-demo-card {
    transition: none !important;
  }
}
`;

/** Rule ids of every violation, so a test can name what it expected to trip. */
function rulesTripped(css, options) {
  return checkStyleDiscipline(css, options).violations.map((violation) => violation.rule);
}

function countOf(violations, rule) {
  return violations.filter((violation) => violation.rule === rule).length;
}

test('checkStyleDiscipline - a disciplined sheet trips nothing, and was actually read', () => {
  const { violations, stats } = checkStyleDiscipline(CLEAN_CSS);

  assert.deepEqual(violations, []);
  assert.equal(stats.rules, 4);
  assert.ok(stats.themable >= 7, `only ${stats.themable} themable declarations were checked`);
  assert.ok(stats.classes >= 3, `only ${stats.classes} classes were checked`);
});

test('checkStyleDiscipline - a hardcoded colour, padding or z-index each trips', () => {
  const mutations = [
    ['color', 'color: #e2e8f0;'],
    ['padding', 'padding: 8px 12px;'],
    ['z-index', 'z-index: 5;'],
    ['background', 'background: rgba(20, 24, 33, 0.92);'],
    ['box-shadow', 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);'],
    ['border-radius', 'border-radius: 10px;'],
    ['font-size', 'font-size: 13px;']
  ];

  for (const [property, declaration] of mutations) {
    const css = `.cloudcanvas-demo-card { position: absolute; ${declaration} }`;
    const { violations } = checkStyleDiscipline(css);

    assert.ok(countOf(violations, STYLE_RULES.TOKEN) > 0, `a hardcoded ${property} was allowed`);
    assert.equal(violations[0].property, property);
    assert.match(violations[0].message, /literal outside a var\(\) fallback/);
  }

  // The literal has to be *outside* the fallback: this is the legal form.
  assert.deepEqual(
    rulesTripped('.cloudcanvas-demo-card { padding: var(--cc-space-2, 8px); }'),
    []
  );
  // ...and structural geometry is not themable, so it is left alone.
  assert.deepEqual(rulesTripped('.cloudcanvas-demo-card { width: 240px; inset: -100000px; }'), []);
});

test('checkStyleDiscipline - a nested var() disappears whole', () => {
  assert.deepEqual(
    rulesTripped('.cloudcanvas-demo { color: var(--cc-focus-ring, var(--cc-accent, #38bdf8)); }'),
    []
  );
  // A literal after the closing paren is still a literal.
  assert.deepEqual(
    rulesTripped('.cloudcanvas-demo { box-shadow: var(--cc-shadow-1, 0 1px 2px) 0 0 4px #000; }'),
    [STYLE_RULES.TOKEN, STYLE_RULES.TOKEN]
  );
});

test('checkStyleDiscipline - an unprefixed class trips, state prefixes do not', () => {
  const { violations } = checkStyleDiscipline('.card { color: var(--cc-text, #fff); }');
  assert.deepEqual(violations.map((violation) => violation.rule), [STYLE_RULES.PREFIX]);
  assert.equal(violations[0].className, 'card');

  // A compound selector is checked class by class: one bad name is enough.
  assert.deepEqual(
    rulesTripped('.cloudcanvas-demo.theme-yellow { color: var(--cc-text, #fff); }'),
    [STYLE_RULES.PREFIX]
  );
  assert.deepEqual(rulesTripped('.cloudcanvas-demo.cc-moving.is-active { display: block; }'), []);

  // The prefix and the state allowlist are both the caller's to choose.
  assert.deepEqual(rulesTripped('.acme-card { display: block; }', { prefix: 'acme-' }), []);
  assert.deepEqual(
    rulesTripped('.cloudcanvas-demo.is-active { display: block; }', { allowStateClasses: [] }),
    [STYLE_RULES.PREFIX]
  );
});

test('checkStyleDiscipline - !important is forcing, except over a token or a reset', () => {
  // Forcing a literal is the arms race a consumer always loses.
  assert.deepEqual(
    rulesTripped('.cloudcanvas-demo { box-shadow: 0 0 0 2px #833446 !important; }'),
    [STYLE_RULES.IMPORTANT, STYLE_RULES.TOKEN, STYLE_RULES.TOKEN]
  );

  // Forcing a value the theme still owns is how the framework wins the cascade
  // without taking the decision away.
  assert.deepEqual(
    rulesTripped('.cloudcanvas-demo { box-shadow: var(--cc-shadow-focus, 0 0 0 2px #833446) !important; }'),
    []
  );

  // A structural reset to a bare keyword is a correctness fix, not a design one.
  assert.deepEqual(rulesTripped('.cloudcanvas-demo [hidden] { display: none !important; }'), []);
  assert.deepEqual(rulesTripped('.cloudcanvas-demo { transition: none !important; }'), []);
  assert.deepEqual(
    rulesTripped('.cloudcanvas-demo { display: 42px !important; }'),
    [STYLE_RULES.IMPORTANT]
  );

  // Stacking is never forceable: a consumer has to be able to put their own
  // chrome above the canvas.
  assert.deepEqual(
    rulesTripped('.cloudcanvas-demo { z-index: var(--cc-z-drag, 1100) !important; }'),
    [STYLE_RULES.IMPORTANT]
  );
});

test('checkStyleDiscipline - extraTokenReaders widen what counts as a read', () => {
  const css = '.cloudcanvas-demo { padding: env(safe-area-inset-top, 12px); }';
  assert.deepEqual(rulesTripped(css), [STYLE_RULES.TOKEN]);
  assert.deepEqual(rulesTripped(css, { extraTokenReaders: ['env'] }), []);

  // A RegExp exempts the whole value, for a shape no function name describes.
  const gridded = '.cloudcanvas-demo { background-size: 24px 24px; }';
  assert.deepEqual(rulesTripped(gridded), [STYLE_RULES.TOKEN, STYLE_RULES.TOKEN]);
  assert.deepEqual(rulesTripped(gridded, { extraTokenReaders: [/^24px 24px$/] }), []);

  // A name that only looks like a reader is not one.
  assert.deepEqual(
    rulesTripped('.cloudcanvas-demo { color: myvar(--x, #fff); }'),
    [STYLE_RULES.TOKEN]
  );
});

test('checkStyleDiscipline - degenerate input is answered, not thrown at', () => {
  for (const input of ['', '   ', null, undefined, '.cloudcanvas-demo { }', 'not css at all']) {
    const { violations } = checkStyleDiscipline(input);
    assert.deepEqual(violations, [], `"${input}" produced a violation`);
  }
});

test('CANVAS_DEFAULT_CSS - passes the style gate whole', () => {
  const { violations, stats } = checkStyleDiscipline(CANVAS_DEFAULT_CSS);

  assert.deepEqual(
    violations.map((violation) => violation.message),
    [],
    'the framework sheet broke its own rules'
  );

  // The parse has to have found the sheet, or "no violations" means nothing.
  assert.ok(stats.declarations > 60, `only ${stats.declarations} declarations were parsed`);
  assert.ok(stats.themable > 30, `only ${stats.themable} themable declarations were checked`);
  assert.ok(stats.classes > 30, `only ${stats.classes} classes were checked`);
});

/**
 * The component sheet once predated the gate - 254 literal colours and 23
 * unprefixed classes, held as a shrinking snapshot. It is held to the same
 * bar as the canvas sheet now, and for the same reason: a consumer theming
 * the board widgets has to be able to reach every value through a token.
 */
test('COMPONENT_DEFAULT_CSS - passes the style gate whole', () => {
  const { violations, stats } = checkStyleDiscipline(COMPONENT_DEFAULT_CSS);

  assert.deepEqual(
    violations.map((violation) => violation.message),
    [],
    'the component sheet broke the framework\'s rules'
  );
  assert.ok(stats.declarations > 400, `only ${stats.declarations} declarations were parsed`);
  assert.ok(stats.themable > 150, `only ${stats.themable} themable declarations were checked`);
  assert.ok(stats.classes > 100, `only ${stats.classes} classes were checked`);
});
