/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The design-token catalogue's honesty against the strings it describes.
 *
 * `TOKENS` is a discovery layer over the token names that already live in the
 * stylesheet and the light theme; its whole value is being trustworthy, so these
 * guard it in both directions - every catalogued name is a token something
 * actually reads (no invented names), and every `LIGHT_THEME` override is
 * catalogued (nothing shipped but undocumented). The category and query helpers
 * are checked so an appearance editor can rely on them.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TOKENS,
  TOKEN_CATEGORY,
  TOKEN_NAMES,
  TOKEN_PREFIX,
  isToken,
  tokensInCategory,
  lightThemeValue
} from 'cloudcanvas/tokens';
import { CANVAS_DEFAULT_CSS } from '../../plugins/styles-css.js';
import { LIGHT_THEME } from 'cloudcanvas/theme';

/** The installed core package's root, found through its own `exports`. */
const CORE_ROOT = dirname(fileURLToPath(import.meta.resolve('cloudcanvas/package.json')));

/** This package's engine trees: the add-ons (their CSS included), the UI kit, the defaults. */
const LIB_TREES = ['../../plugins/', '../../ui/', '../../defaults.js'].map((at) => fileURLToPath(new URL(at, import.meta.url)));

/** Every `.js` file under `root` (or `root` itself) but a `tokens.js` catalogue. */
function sourcesUnder(root) {
  if (root.endsWith('.js')) return [root];
  return readdirSync(root, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'tokens.js')
    .map((entry) => join(entry.parentPath, entry.name));
}

/** Every engine source - the core's and this package's - but the catalogue itself, which must never vouch for its own names. */
function engineSources() {
  return [CORE_ROOT, ...LIB_TREES].flatMap(sourcesUnder).map((file) => readFileSync(file, 'utf8'));
}

/** Every `--cc-*` name that appears anywhere the token values actually live. */
function referencedTokenNames() {
  const referenced = new Set();
  const collect = (text, pattern) => {
    for (const match of text.matchAll(pattern)) referenced.add(match[1]);
  };

  collect(CANVAS_DEFAULT_CSS, /(--cc-[a-z0-9-]+)/g);
  // The theme file both defines and comments on tokens; its text is the second
  // place a name can legitimately come from (cursor and badge-override tokens).
  collect(readFileSync(fileURLToPath(import.meta.resolve('cloudcanvas/theme')), 'utf8'), /(--cc-[a-z0-9-]+)/g);
  // The third: a `var()` read in any engine module (a style option, an add-on default, a primitive's markup).
  for (const source of engineSources()) collect(source, /var\((--cc-[a-z0-9-]+)/g);
  return referenced;
}

test('TOKENS - every catalogued name is a real token something reads', () => {
  const referenced = referencedTokenNames();

  for (const name of TOKEN_NAMES) {
    assert.ok(name.startsWith(TOKEN_PREFIX), `${name} is not a --cc- token`);
    assert.ok(referenced.has(name), `${name} is catalogued but nothing defines or reads it`);
  }
});

test('TOKENS - every LIGHT_THEME override is catalogued', () => {
  for (const name of Object.keys(LIGHT_THEME)) {
    assert.ok(isToken(name), `${name} is themed but missing from the catalogue`);
  }
});

test('TOKENS - every entry carries a known category and a purpose', () => {
  const categories = new Set(Object.values(TOKEN_CATEGORY));

  for (const [name, entry] of Object.entries(TOKENS)) {
    assert.ok(categories.has(entry.category), `${name} has an unknown category "${entry.category}"`);
    assert.equal(typeof entry.purpose, 'string');
    assert.notEqual(entry.purpose.trim(), '', `${name} has an empty purpose`);
  }
});

test('TOKENS - every category is populated', () => {
  for (const category of Object.values(TOKEN_CATEGORY)) {
    const members = tokensInCategory(category);
    assert.ok(members.length > 0, `category "${category}" has no tokens`);
    for (const [, entry] of members) {
      assert.equal(entry.category, category, 'tokensInCategory returned a foreign category');
    }
  }
});

test('TOKENS - the colour category holds the tokens an editor expects', () => {
  const names = tokensInCategory(TOKEN_CATEGORY.COLOR).map(([name]) => name);
  for (const expected of ['--cc-bg', '--cc-text', '--cc-accent', '--cc-connector', '--cc-card-bg']) {
    assert.ok(names.includes(expected), `${expected} is not catalogued as a colour`);
  }
});

test('TOKENS - shadow and radius are their own browsable categories', () => {
  const shadows = tokensInCategory(TOKEN_CATEGORY.SHADOW).map(([name]) => name);
  assert.deepEqual(shadows.sort(), ['--cc-shadow-1', '--cc-shadow-2', '--cc-shadow-focus'].sort());

  const radii = tokensInCategory(TOKEN_CATEGORY.RADIUS).map(([name]) => name);
  assert.deepEqual(radii.sort(), ['--cc-radius-md', '--cc-radius-pill', '--cc-radius-sm'].sort());
});

test('TOKENS - isToken resolves a name, and rejects a typo', () => {
  assert.equal(isToken('--cc-accent'), true);
  assert.equal(isToken('--cc-not-a-token'), false);
  assert.equal(isToken('accent'), false);
});

test('TOKENS - lightThemeValue reads through to the theme, never a copy', () => {
  assert.equal(lightThemeValue('--cc-bg'), LIGHT_THEME['--cc-bg']);
  // A token with no light override keeps its dark default (the stylesheet
  // fallback), which is not a value this module holds.
  assert.equal(lightThemeValue('--cc-space-1'), undefined);
});

test('TOKENS - the map and its name list are frozen', () => {
  assert.equal(Object.isFrozen(TOKENS), true);
  assert.equal(Object.isFrozen(TOKEN_NAMES), true);
  assert.equal(Object.isFrozen(TOKEN_CATEGORY), true);
});
