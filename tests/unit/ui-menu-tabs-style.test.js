/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * How the kit sheet draws the menu, a folder strip, a tab's layers behind it
 * and a pinned tab: through tokens alone, with a focus ring that is not
 * clipped, 44px targets on a coarse pointer, no motion a user asked not to
 * see, and text that clears WCAG AA (4.5:1) on what is behind it - in the dark
 * defaults and in the reference light themes.
 *
 * A strip that wears the folder face (`createTabs(host, { face: 'folder' })`)
 * is a row of folder tabs, with a stack behind them or with none: the active
 * tab in front, every other a step back. And the layers stack as folder tabs
 * behind their tab, each overlapped by the one in front, a step lower and a
 * shade more muted for each step back, and brought to the front to be read.
 * That it looks so in a browser is `tests/browser/ui-kit.test.js`; that the
 * sheet says so is here. The line face a strip wears unasked, the close control
 * inside a tab's face and the cut of a label are `ui-tabs-face.test.js`.
 *
 * The contrast is computed, not eyeballed: each colour is the sheet's own
 * declaration, read the way a browser reads it - the theme's value for a
 * token, else the fallback - and laid over what is under it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_CSS, UI_TOKENS, createMenu } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';
import { COARSE, DARK_PAGE, RULES, THEMES, assertTokensOnly, colour, coloursOf, contrast, declared, flat, luminance, over, resolve, rulesFor } from './ui-sheet.js';

const MENU = '.cloudcanvas-ui-menu';
/** A strip that wears the folder face: every tab in it is a folder tab, whether or not anything stands behind one. */
const STRIP = '.cloudcanvas-ui-tabs[data-face="folder"]';
const TAB = '.cloudcanvas-ui-tabs-tab';
const STRIP_TAB = `${STRIP} ${TAB}`;
/** A layer's button and the face on it, on any strip; and as a folder strip stacks them. */
const LAYER = '.cloudcanvas-ui-tabs-layer';
const FACE = `${LAYER}-face`;
const STACKED = `${STRIP} ${LAYER}`;
const STACK_FACE = `${STRIP} ${FACE}`;
/** A stacked layer under the pointer or the keys: the one that comes to the front. */
const FORWARD = `${STACKED}:is(:hover, :focus-visible):not(:disabled)`;
/** A row whose tab is not the active one, and so stands a step back. */
const ROW_BACK = '.cloudcanvas-ui-tabs-item:not(.is-active)';
const BACK = `${STRIP} ${ROW_BACK}`;
/** The face of the layer `depth` steps behind its tab, and the same behind a tab that is itself a step back. */
const faceAt = (depth) => `${STACKED}[data-depth="${depth}"] > ${FACE}`;
const faceBehind = (depth) => `${STRIP} :where(${ROW_BACK}) ${LAYER}[data-depth="${depth}"] > ${FACE}`;
const STEP = 'var(--cc-ui-tab-layer-step, 3px)';
const CORNER = 'var(--cc-radius-sm, 6px)';
const PINNED = '.cloudcanvas-ui-tabs-tab[data-pinned="true"]';
const HIGHLIGHT = `${MENU}-item:is(:hover, :focus, [aria-expanded="true"]):not(:disabled)`;
const DANGER = `${MENU}-item[data-tone="danger"]`;
const DANGER_HIGHLIGHT = `${DANGER}:is(:hover, :focus):not(:disabled)`;

test('the menu and the layers are drawn through tokens the kit catalogues, and stack where a menu belongs', () => {
  assert.equal(UI_TOKENS['--cc-z-ui-menu']?.category, 'z-index');
  assert.equal(UI_TOKENS['--cc-ui-tab-layer']?.category, 'color');
  for (const name of ['--cc-ui-tab-layer-width', '--cc-ui-tab-layer-peek', '--cc-ui-tab-layer-step']) assert.equal(UI_TOKENS[name]?.category, 'size', name);
  assert.equal(UI_TOKENS['--cc-ui-tab-layer-shadow']?.category, 'shadow');
  const z = (name) => Number(new RegExp(`var\\(${name}, (\\d+)\\)`).exec(UI_CSS)?.[1]);
  assert.equal(declared(`${MENU}-panel`, 'z-index'), `var(--cc-z-ui-menu, ${z('--cc-z-ui-menu')})`);
  assert.ok(z('--cc-z-ui-context') < z('--cc-z-ui-menu') && z('--cc-z-ui-toast') < z('--cc-z-ui-menu'),
    'above a floating context window it may be opened from, and above a toast, which would cover its entries (the whole order is in `ui-view-style.test.js`)');
  assert.equal(declared(`${MENU}-panel`, 'position'), 'fixed', 'placed in the viewport, so no scrolling strip can clip it');
  assert.equal(declared(`${MENU}-panel`, 'overflow'), 'auto', 'a menu longer than the viewport scrolls inside itself');
  assert.match(declared(STRIP, '--layer-shade'), /^linear-gradient\(var\(--cc-ui-tab-layer, var\(--cc-/, 'the layer\'s own token, chained to a core one');
  const colours = coloursOf([MENU, LAYER, PINNED, '.cloudcanvas-ui-tabs']);
  assert.ok(colours.length >= 24, `the check looked at too little: ${colours.length}`);
  assertTokensOnly(colours);
});

/*
 * The folder faces, written first and seen to fail on a sheet that drew them only for a strip with a stack
 * (`[data-layered]`), so that a strip changed shape the first time one of its tabs was given a layer:
 *
 *   ✖ every strip is a row of folders: no rule waits for a stack, and the tab in front is lit and tallest while every other stands a step back
 *     AssertionError [ERR_ASSERTION]: no rule draws a strip one way with a stack and another way without
 *     actual: [ '.cloudcanvas-ui-tabs[data-layered]', '.cloudcanvas-ui-tabs[data-layered] .cloudcanvas-ui-tabs-item', ... ]   expected: []
 *
 * It is a folder strip's now: the folder face became a choice (`face: 'folder'`), and what wears it is still a row
 * of folders with a stack or with none.
 */
test('a folder strip is a row of folders: no rule waits for a stack, and the tab in front is lit and tallest while every other stands a step back', () => {
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes('data-layered')).map((rule) => rule.selector), [], 'no rule draws a strip one way with a stack and another way without');
  const face = (property) => declared(STRIP_TAB, property);
  assert.deepEqual([face('align-self'), face('background-image')], ['stretch', 'var(--tab-face)'], 'the tab in front is as tall as the strip, on the lit face');
  assert.equal(declared(BACK, 'padding-top'), STEP, 'every other row starts one step lower, its tab and whatever is behind that with it');
  assert.equal(declared(`${BACK} > ${TAB}`, 'background-image'), 'var(--layer-shade), var(--tab-face)', 'and its tab takes one wash of shade, as the nearest layer of the tab in front does');
  assert.match(declared(`${BACK} .cloudcanvas-ui-badge[data-shape="flag"]`, 'transform'), /^translateY\(calc\(-1 \* \(var\(--cc-ui-flag-rise, 0px\) \+ min\(var\(--cc-ui-flag-rise, 0px\), var\(--cc-ui-tab-layer-step, 3px\)\)\)\)\)$/,
    'a flag that rises gains the step its tab lost, so flags stand level along a strip; one given no rise stays in the middle of its tab');
  const behind = [1, 2, 3].map((depth) => declared(faceBehind(depth), 'background-image').split(',').map((layer) => layer.trim()));
  assert.deepEqual(behind, [1, 2, 3].map((depth) => [...Array(depth + 1).fill('var(--layer-shade)'), 'var(--tab-face)']),
    'its layers stand behind it still: one wash more each than the same layer behind the tab in front');
  assert.equal(declared(TAB, 'color'), declared(LAYER, 'color'), 'a tab is labelled as a layer is: a muted label would not clear 4.5:1 on a shaded face');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes(`${TAB}[aria-selected="true"]`) && 'color' in rule.declarations), [], 'so being in front changes the face and the weight, not the ink');
  assert.match(declared(`${TAB}[aria-selected="true"]`, 'font-weight'), /^var\(--cc-weight-semibold, /);
});

/*
 * Written first and seen to fail on a strip with nothing to say about a tab being moved:
 *
 *   ✖ a tab being moved is outlined and the place it would land is a bar at that edge, both in the drop colour, and neither takes room
 *     AssertionError [ERR_ASSERTION]: the sheet declares no outline for .cloudcanvas-ui-tabs-item.is-dragging > .cloudcanvas-ui-tabs-tab
 */
test('a tab being moved is outlined and the place it would land is a bar at that edge, both in the drop colour, and neither takes room', () => {
  const DROP = /var\(--cc-ui-drop, var\(--cc-accent, /;
  const ROW = '.cloudcanvas-ui-tabs-item';
  assert.match(declared(`${ROW}.is-dragging > ${TAB}`, 'outline'), DROP, 'the colour the board, the calendar and the timeline mark a move with');
  assert.equal(declared(`${ROW}.is-dragging > ${TAB}`, 'outline-offset'), 'calc(-1 * var(--cc-focus-ring-width, 2px))', 'inside the tab\'s face, where its row does not cut it and nothing lies over it');
  const bar = (property) => declared(`${ROW}[data-drop]::after`, property);
  assert.match(bar('background'), DROP);
  assert.deepEqual([bar('position'), bar('inset'), bar('content')], ['absolute', '0 auto 0 0', '""'], 'at the near edge of the row it would land before, out of the row\'s flow: nothing shifts under the pointer');
  assert.equal(declared(`${ROW}[data-drop="after"]::after`, 'inset'), '0 0 0 auto', 'and at the far edge of the last row, for the end');
  assert.equal(bar('z-index'), 'var(--cc-z-ui-raised, 2)', 'in front of the faces it lies over');
  assert.match(bar('outline'), /^1px solid var\(--cc-bg, /, 'edged in the page\'s colour, so it is told from any face it lies over, however deep in the shade');
  for (const [name, theme] of Object.entries(THEMES)) {
    const ratio = contrast(colour(resolve(bar('background'), theme)), colour(theme['--cc-bg'] ?? DARK_PAGE));
    assert.ok(ratio >= 3, `${name}: the bar against its edge is ${ratio.toFixed(2)}:1`);
  }
  assert.equal(declared(`${ROW}[data-drop]`, 'position'), 'relative', 'a row is the bar\'s frame only while it carries one');
});

test('a pinned tab is marked in its own text colour', () => {
  assert.equal(declared(`${PINNED}::before`, 'background'), 'currentColor', 'a mark as legible as the label it stands before');
});

/*
 * The stack, written first and seen to fail on layers that were chips laid
 * side by side - a breadcrumb, not a stack:
 *
 *   ✖ layers overlap: each face runs under what stands in front of it, and the order of the page is the order of the stack
 *     AssertionError [ERR_ASSERTION]: the sheet declares no position for .cloudcanvas-ui-tabs-layer
 */
test('layers overlap: each face runs under what stands in front of it, and the order of the page is the order of the stack', () => {
  assert.equal(declared(LAYER, 'position'), 'relative', 'the button is the layer\'s place in the row: what peeks out');
  assert.match(declared(STACKED, 'width'), /^var\(--cc-ui-tab-layer-peek, /, 'as wide as a host says a layer peeks');
  assert.equal(declared(STACK_FACE, 'position'), 'absolute', 'the face is what is seen, and is free of the row');
  assert.deepEqual([declared(STACK_FACE, 'min-width'), declared(STACK_FACE, 'max-width')], [`calc(100% + ${CORNER})`, `calc(100% + ${CORNER})`],
    'wider than its place by one corner: that much of it is tucked behind its neighbour, under the corner that neighbour rounds off');
  assert.equal(declared(STRIP_TAB, 'position'), 'relative', 'the tab is stacked too, so it covers the nearest parent');
  const raised = RULES.filter((rule) => rule.selector.includes(LAYER) && 'z-index' in rule.declarations).map((rule) => rule.selector);
  assert.deepEqual(raised, [FORWARD], 'at rest nothing is given a level: later in the page is nearer the front, so the order rises to the tab');
  assert.equal(declared('.cloudcanvas-ui-tabs-item', 'overflow-x'), 'clip', 'and a stack keeps to its own row');
});

test('layers recede: the tab is tallest, each step back is one step lower and one shade more muted, all on one baseline', () => {
  assert.equal(declared(STRIP_TAB, 'align-self'), 'stretch', 'the tab is as tall as the strip');
  assert.equal(declared('.cloudcanvas-ui-tabs-layers', 'align-self'), 'stretch', 'and so is a layer\'s target, whatever is seen of it');
  assert.equal(declared(STACK_FACE, 'inset'), `${STEP} auto 0 0`, 'the nearest parent starts one step down, and stands on the baseline like every other');
  assert.deepEqual([2, 3].map((depth) => declared(faceAt(depth), 'top')), [`calc(2 * ${STEP})`, `calc(3 * ${STEP})`]);
  const washes = [1, 2, 3].map((depth) => declared(faceAt(depth), 'background-image').split(',').map((layer) => layer.trim()));
  assert.deepEqual(washes, [1, 2, 3].map((depth) => [...Array(depth).fill('var(--layer-shade)'), 'var(--tab-face)']),
    'one more wash of the shade for each step back, over the face the tab itself has');
  const tab = (property) => declared(STRIP_TAB, property);
  assert.equal(tab('background-image'), 'var(--tab-face)');
  assert.match(tab('background-color'), /^var\(--cc-bg, /, 'laid on the page\'s own colour: a folder tab hides what it stands in front of, it does not tint it');
  assert.equal(declared(STACK_FACE, 'background-color'), tab('background-color'));
  assert.match(declared(`${TAB}[aria-selected="true"]`, 'border-bottom-color'), /^var\(--cc-accent, /, 'and the selected tab is underlined to its far end: its close control stands inside that face');
});

test('a folder tab has rounded top corners, a flat foot, a hairline edge and a soft shadow on what is behind it', () => {
  for (const selector of [STACK_FACE, STRIP_TAB]) {
    assert.equal(declared(selector, 'border-radius'), `${CORNER} ${CORNER} 0 0`, selector);
    assert.match(declared(selector, 'box-shadow'), /^var\(--cc-ui-tab-layer-shadow, var\(--cc-shadow-1, /, `${selector}: a shadow a theme already has`);
  }
  assert.match(declared(STACK_FACE, 'border'), /^1px solid var\(--cc-card-border, /);
  assert.equal(declared(STACK_FACE, 'border-width'), '1px 0 0 1px', 'no edge where it runs under its neighbour, none at its foot');
  for (const side of ['border-top', 'border-left', 'border-right']) assert.match(declared(STRIP_TAB, side), /^1px solid var\(--cc-card-border, /, `${side}: the tab's face is whole, a close control inside it or not`);
});

test('a layer\'s label starts at its near edge and is cut short where the layer goes under; under the pointer or the keys it comes forward to be read', () => {
  const face = (property) => declared(STACK_FACE, property);
  assert.deepEqual([declared(FACE, 'overflow'), declared(FACE, 'text-overflow'), declared(FACE, 'white-space'), face('text-align')], ['hidden', 'ellipsis', 'nowrap', 'start']);
  assert.equal(face('padding'), 'var(--cc-space-1, 4px) var(--cc-space-3, 12px) 0 var(--cc-space-2, 8px)', 'the label ends before the corner it is tucked under');
  assert.equal(face('width'), 'max-content', 'it would be as wide as its label, were it not held to its place');
  assert.equal(declared(FORWARD, 'z-index'), 'var(--cc-z-ui-raised, 2)', 'in front of its neighbours and of the tab');
  const forward = (property) => declared(`${FORWARD} > ${FACE}`, property);
  assert.match(forward('max-width'), /^var\(--cc-ui-tab-layer-width, /, 'as wide as its label, up to what a host allows');
  assert.equal(forward('border-right-width'), '1px', 'whole, now that nothing covers its far edge');
  assert.match(forward('background-image'), /^linear-gradient\(var\(--cc-btn-bg-hover, .+\), var\(--tab-face\)$/, 'lit as a control is under the pointer, no longer shaded as something behind');
});

test('focus is visible on a menu item and on a layer, drawn inside what would clip it', () => {
  const rings = RULES.filter((rule) => rule.media === null && rule.selector.includes(':focus-visible') && /^var\(/.test(rule.declarations.outline ?? ''));
  for (const part of [`${MENU}-item`, FACE]) {
    const ring = rings.filter((rule) => rule.selector.includes(part));
    assert.equal(ring.length, 1, `${part} has one focus ring`);
    assert.match(ring[0].declarations.outline, /^var\(--cc-focus-ring-width, 2px\) solid var\(--cc-focus-ring, /);
    assert.equal(ring[0].declarations['outline-offset'], 'calc(-1 * var(--cc-focus-ring-width, 2px))');
  }
  assert.equal(declared(`${LAYER}:focus-visible > ${FACE}`, 'outline-offset'), 'calc(-1 * var(--cc-focus-ring-width, 2px))', 'on the face, which is in front of every neighbour by then');
  assert.equal(declared(`${LAYER}:focus-visible`, 'outline'), 'none', 'and not a second time round the place the face has outgrown');
  assert.ok(declared(HIGHLIGHT, 'background'), 'and the item the keys are on is filled, however focus got there');
});

/*
 * The kit's font contract, pinned after a report that tabs had turned monospace in a host. They had not changed: a strip
 * has always taken its family from the host's `--cc-font` (the system sans without one), and that host set it to a mono
 * face. What would be a regression is a part that stops following its strip - a button with no `font: inherit` is drawn
 * in the browser's own button face, and a family named in a tab's, a layer's or a menu item's rule ignores the host.
 * Seen to fail, as it should, with `font: inherit` taken out of the layer's rule, and to pass again with it back:
 *
 *   ✖ AssertionError [ERR_ASSERTION]: the sheet declares no font for .cloudcanvas-ui-tabs-layer
 */
test('tabs, layers and menu items take their font from their strip or their menu, which take it from the host\'s --cc-font', () => {
  const HOST_FONT = /^var\(--cc-font, /;
  for (const root of ['.cloudcanvas-ui-tabs', `${MENU}-panel`]) assert.match(declared(root, 'font-family'), HOST_FONT, `${root} reads the host's font`);
  for (const part of ['.cloudcanvas-ui-tabs-tab', '.cloudcanvas-ui-tabs-close', LAYER, `${MENU}-item`]) {
    assert.equal(declared(part, 'font'), 'inherit', `${part} inherits its font: a button does not unless it is told to`);
  }
  const parts = ['.cloudcanvas-ui-tabs-', `${MENU}-`];
  const families = RULES.filter((rule) => parts.some((part) => rule.selector.includes(part)) && !HOST_FONT.test(rule.declarations['font-family'] ?? 'var(--cc-font, '))
    .map((rule) => `${rule.selector} { font-family: ${rule.declarations['font-family']} }`);
  assert.deepEqual(families, [], 'and no rule for a part of them names a family of its own');
  const fonts = RULES.filter((rule) => parts.some((part) => rule.selector.includes(part)) && 'font' in rule.declarations && rule.declarations.font !== 'inherit')
    .map((rule) => `${rule.selector} { font: ${rule.declarations.font} }`);
  assert.deepEqual(fonts, [], 'nor a whole font');
});

test('on a coarse pointer a menu item and a layer are at least 44px tall', () => {
  for (const part of [`${MENU}-item`, LAYER]) {
    const tall = rulesFor(part, COARSE).filter((rule) => rule.declarations['min-height'] === 'var(--cc-control-min-coarse, 44px)');
    assert.equal(tall.length, 1, `${part} is in the coarse-pointer rule`);
  }
  assert.equal(declared(LAYER, 'min-height'), 'var(--cc-control-min, 28px)', 'a layer\'s target is the whole height of the strip: only its face steps down');
});

test('the one thing that moves is a layer opening out, and only for a user who has not asked for less motion', (t) => {
  const moving = RULES.filter((rule) => [MENU, '.cloudcanvas-ui-tabs'].some((part) => rule.selector.includes(part)))
    .flatMap((rule) => Object.keys(rule.declarations).filter((name) => /^(transition|animation)/.test(name)).map((name) => [rule.media, rule.selector, name]));
  assert.deepEqual(moving, [['(prefers-reduced-motion: no-preference)', STACK_FACE, 'transition']], 'so under reduced motion there is no transition to turn off');
  assert.match(RULES.find((rule) => rule.media !== null && rule.selector === STACK_FACE).declarations.transition, /^max-width \d+ms /, 'its width, which moves nothing else');
  const animated = [];
  const original = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = function spy(...args) { animated.push(args); return original?.apply(this, args); };
  t.after(() => { HTMLElement.prototype.animate = original; });
  const menu = createMenu(mount(t));
  menu.update({ open: true, items: [{ id: 'a', label: 'A', items: [{ id: 'b', label: 'B' }] }] });
  document.activeElement.click();
  menu.update({ open: false });
  menu.destroy();
  assert.equal(animated.length, 0, 'the controls start no animation of their own');
});

test('text on a menu clears 4.5:1 in the dark defaults and in the light theme, at rest and under the highlight', () => {
  for (const [name, theme] of Object.entries(THEMES)) {
    const read = (selector, property) => colour(resolve(declared(selector, property), theme));
    const page = colour(theme['--cc-bg'] ?? DARK_PAGE);
    const surface = over(read(`${MENU}-panel`, 'background'), page);
    const highlight = over(read(HIGHLIGHT, 'background'), surface);
    const text = over(read(`${MENU}-panel`, 'color'), surface);
    const danger = read(DANGER, 'color');
    const pairs = { 'a menu item': [text, surface], 'the menu item the keys are on': [text, highlight], 'a dangerous menu item': [danger, surface] };
    for (const [what, [front, back]] of Object.entries(pairs)) {
      const ratio = contrast(front, back);
      assert.ok(ratio >= 4.5, `${name}: ${what} is ${ratio.toFixed(2)}:1`);
    }
    assert.ok(contrast(read(DANGER_HIGHLIGHT, 'border-left-color'), highlight) >= 3, `${name}: the edge that carries the tone there is a graphic, at 3:1 or more`);
  }
  assert.equal(declared(DANGER_HIGHLIGHT, 'color'), 'inherit', 'under the highlight a dangerous item is text again: its tone would not clear 4.5:1 there');
  const lost = Object.values(THEMES).some((theme) => {
    const surface = over(colour(resolve(declared(`${MENU}-panel`, 'background'), theme)), colour(theme['--cc-bg'] ?? DARK_PAGE));
    return contrast(colour(resolve(declared(DANGER, 'color'), theme)), over(colour(resolve(declared(HIGHLIGHT, 'background'), theme)), surface)) < 4.5;
  });
  assert.equal(lost, true, 'which is why: were the tone to clear it in both themes, the rule would be dead weight');
});

test('every step of a stack keeps its label at 4.5:1 or better, and each step back can be told from the one in front of it', () => {
  for (const [name, theme] of Object.entries(THEMES)) {
    const read = (value) => colour(resolve(value, theme));
    const surface = over(read(flat(declared(STRIP, '--tab-face'))), read(declared(STACK_FACE, 'background-color')));
    const shade = read(flat(declared(STRIP, '--layer-shade')));
    const steps = [1, 2, 3].map((depth) => Array(depth).fill(shade).reduce((back, wash) => over(wash, back), surface));
    const forward = over(read(flat(declared(`${FORWARD} > ${FACE}`, 'background-image').replace(/, var\(--tab-face\)$/, ''))), surface);
    const label = read(declared(LAYER, 'color'));
    const fills = { 'the nearest layer': steps[0], 'the layer behind it': steps[1], 'the furthest layer': steps[2], 'a layer brought forward': forward };
    for (const [what, fill] of Object.entries(fills)) {
      assert.ok(contrast(label, fill) >= 4.5, `${name}: ${what} is ${contrast(label, fill).toFixed(2)}:1`);
    }
    const fourth = over(shade, steps[2]);
    const tab = read(declared(TAB, 'color'));
    const tabs = { 'the active tab, on the lit face': surface, 'a tab a step back, on one wash of shade': steps[0], 'the furthest layer of a tab a step back': fourth };
    for (const [what, fill] of Object.entries(tabs)) {
      assert.ok(contrast(tab, fill) >= 4.5, `${name}: ${what}, is ${contrast(tab, fill).toFixed(2)}:1`);
    }
    assert.ok(contrast(read(declared(`${TAB}[aria-selected="true"]`, 'border-bottom-color')), surface) >= 3, `${name}: the line under the active tab is a graphic, at 3:1 or more`);
    const receding = [surface, ...steps, fourth].map(luminance);
    for (let depth = 1; depth < receding.length; depth += 1) {
      assert.ok(receding[depth] < receding[depth - 1], `${name}: step ${depth} is in more shade than the one in front of it`);
      assert.ok((receding[depth - 1] + 0.05) / (receding[depth] + 0.05) >= 1.03, `${name}: and by enough to see, step ${depth}`);
    }
  }
});
