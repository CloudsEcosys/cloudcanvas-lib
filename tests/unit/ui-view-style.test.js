/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * How the kit sheet orders its floating layers and draws what the four views
 * - kanban, calendar, timeline, graph - gained from use: an item marked
 * selected, a heading that stands for an item, and a 44px target under a
 * finger for what is drawn smaller. Through tokens alone, in the dark defaults
 * and the reference light theme. That it looks so in a browser is
 * `tests/browser/ui-kit.test.js`; that the sheet says so is here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_CSS, UI_TOKENS } from '../../ui/index.js';
import { COARSE, RULES, THEMES, assertTokensOnly, colour, coloursOf, contrast, declared, over, pageOf, resolve } from './ui-sheet.js';

/** The fallback level the sheet reads the stacking token `name` with. */
const levelOf = (name) => Number(new RegExp(`var\\(${name}, (\\d+)\\)`).exec(UI_CSS)?.[1]);

/*
 * Written first and seen to fail on a sheet that stacked the toast region over an open menu, where on a phone it
 * covered the menu's lower entries, and gave a dialog that is not modal no level at all:
 *
 *   ✖ the floating layers are ordered by tokens: context windows, then toasts, then a dialog, then a menu on top
 *     AssertionError [ERR_ASSERTION]: --cc-z-ui-dialog is not catalogued
 *   and, with the token catalogued and read:
 *     AssertionError [ERR_ASSERTION]: each layer stands above the one before it: context 1200, toast 1300, dialog 1350, menu 1250
 */
test('the floating layers are ordered by tokens: context windows, then toasts, then a dialog, then a menu on top', () => {
  const layers = { context: '--cc-z-ui-context', toast: '--cc-z-ui-toast', dialog: '--cc-z-ui-dialog', menu: '--cc-z-ui-menu' };
  for (const name of Object.values(layers)) assert.equal(UI_TOKENS[name]?.category, 'z-index', `${name} is not catalogued`);
  const read = { context: '.cloudcanvas-ui-context-window', toast: '.cloudcanvas-ui-toasts', dialog: '.cloudcanvas-ui-dialog', menu: '.cloudcanvas-ui-menu-panel' };
  for (const [layer, selector] of Object.entries(read)) {
    assert.equal(declared(selector, 'z-index'), `var(${layers[layer]}, ${levelOf(layers[layer])})`, `${selector} is stacked by ${layers[layer]} and nothing else`);
  }
  const levels = Object.entries(layers).map(([layer, name]) => [layer, levelOf(name)]);
  assert.ok(levels.every(([, level], at) => at === 0 || level > levels[at - 1][1]),
    `each layer stands above the one before it: ${levels.map((pair) => pair.join(' ')).join(', ')}`);
  assert.match(UI_TOKENS['--cc-z-ui-menu'].purpose, /above .*toasts/i, 'the catalogue says where a menu stands');
  assert.match(UI_TOKENS['--cc-z-ui-toast'].purpose, /below .*menu/i, 'and where a toast does');
});

const CARD = '.cloudcanvas-ui-kanban-card';
const COLUMN_ITEM = '.cloudcanvas-ui-kanban-label[data-ui-id]';
const CHIP = '.cloudcanvas-ui-calendar-event';
const TIMED = '.cloudcanvas-ui-calendar-timed';
const BAR = '.cloudcanvas-ui-timeline-bar';
const MILESTONE = `${BAR}.is-point`;
const GROUP_ITEM = '.cloudcanvas-ui-timeline-group-label';
const NODE = '.cloudcanvas-ui-graph-node';
const VIEWS = ['.cloudcanvas-ui-kanban', '.cloudcanvas-ui-calendar', '.cloudcanvas-ui-timeline', '.cloudcanvas-ui-graph'];

/** The opaque colour a declared fill shows over `back` under `theme`. */
const fillOf = (selector, property, theme, back) => over(colour(resolve(declared(selector, property), theme)), back);

/*
 * Written first and seen to fail on a sheet with nothing to say about a selected card, chip or bar:
 *
 *   ✖ an item marked selected wears a ring inside it, drawn from a token, that is told from the item's own fill in both themes
 *     AssertionError [ERR_ASSERTION]: --cc-ui-selected-ring is not catalogued
 */
test('an item marked selected wears a ring inside it, drawn from a token, that is told from the item\'s own fill in both themes', () => {
  assert.equal(UI_TOKENS['--cc-ui-selected-ring']?.category, 'shadow', '--cc-ui-selected-ring is not catalogued');
  const FACES = `:is(${CARD}, ${COLUMN_ITEM}, ${CHIP}, ${BAR}, ${GROUP_ITEM}).is-selected`;
  const ring = declared(FACES, 'box-shadow');
  assert.match(ring, /^var\(--cc-ui-selected-ring, inset 0 0 0 2px var\(--cc-accent, #[0-9a-f]{6}\)\)$/,
    'inside the item, where no scrolling parent cuts it and the focus ring - an outline, outside - stands clear of it');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes('.is-selected') && 'outline' in rule.declarations), [], 'the outline is left to focus and to a move in hand');
  for (const [name, theme] of Object.entries(THEMES)) {
    const page = pageOf(theme);
    const column = fillOf('.cloudcanvas-ui-kanban-column', 'background', theme, page);
    const fills = { 'a card': fillOf(CARD, 'background', theme, column), 'a column\'s heading': column, 'a chip': fillOf(CHIP, 'background', theme, page),
      'a bar': fillOf(BAR, 'background', theme, page), 'a group\'s heading': page };
    const accent = colour(resolve(/var\(--cc-accent, [^)]+\)/.exec(ring)[0], theme));
    for (const [what, fill] of Object.entries(fills)) {
      assert.ok(contrast(accent, fill) >= 3, `${name}: the ring on ${what} is a graphic, at 3:1 or more: ${contrast(accent, fill).toFixed(2)}:1`);
    }
  }
});

/*
 * Written first and seen to fail on a sheet that knew a heading only as text:
 *
 *   ✖ a heading that stands for an item is a quiet button with a visible focus ring, text that clears 4.5:1, and a 44px target under a finger; the label beside a bar invites a press
 *     AssertionError [ERR_ASSERTION]: the sheet declares no cursor for :is(.cloudcanvas-ui-kanban-label[data-ui-id], .cloudcanvas-ui-timeline-group-label)
 */
test('a heading that stands for an item is a quiet button with a visible focus ring, text that clears 4.5:1, and a 44px target under a finger; the label beside a bar invites a press', () => {
  const HEADINGS = `:is(${COLUMN_ITEM}, ${GROUP_ITEM})`;
  const look = (property) => declared(HEADINGS, property);
  assert.deepEqual([look('cursor'), look('font'), look('background'), look('border')], ['pointer', 'inherit', 'transparent', '0'], 'it reads as the heading it is: the heading\'s own type, no box of its own');
  assert.match(look('color'), /^var\(--cc-text, /, 'in the text colour: the muted ink of a group\'s name would not clear 4.5:1 on the light page');
  const ringed = RULES.find((rule) => rule.media === null && rule.selector.includes(':focus-visible') && /^var\(--cc-focus-ring-width, 2px\) solid var\(--cc-focus-ring, /.test(rule.declarations.outline ?? '')
    && rule.selector.includes('.cloudcanvas-ui-kanban-card'));
  for (const face of [COLUMN_ITEM, GROUP_ITEM]) assert.ok(ringed.selector.includes(face), `${face} wears the ring a card and a bar wear`);
  assert.equal(declared(HEADINGS, 'min-height', COARSE), 'var(--cc-control-min-coarse, 44px)');
  assert.equal(declared('.cloudcanvas-ui-timeline-label', 'cursor'), 'pointer');
  for (const [name, theme] of Object.entries(THEMES)) {
    const page = pageOf(theme);
    const text = colour(resolve(look('color'), theme));
    const grounds = { 'a column\'s heading on its column': fillOf('.cloudcanvas-ui-kanban-column', 'background', theme, page), 'a group\'s heading on the page': page };
    for (const [what, ground] of Object.entries(grounds)) assert.ok(contrast(text, ground) >= 4.5, `${name}: ${what} is ${contrast(text, ground).toFixed(2)}:1`);
  }
});

/*
 * Written first and seen to fail on a sheet that drew a chip 16px tall, a milestone 14px across and a node 40px tall
 * - less on a graph zoomed out to fit - and gave a finger no more than that:
 *
 *   ✖ under a finger a chip, a milestone and a node are 44px targets, though drawn smaller: the target reaches out from its item and lies under every item drawn beside it
 *     AssertionError [ERR_ASSERTION]: the sheet declares no content for :is(.cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar.is-point, .cloudcanvas-ui-graph-node)::after under (pointer: coarse)
 *
 * The first sheet that passed reached out from the middle of every item, a chip's included. Chromium then showed what
 * that does to chips stacked in one day (`tests/browser/ui-kit.test.js`): the room above the first chip was the
 * second chip's, whose reach lay over it. So a chip reaches down from its own top. That assertion was seen to fail
 * with its rule taken out of the sheet again:
 *
 *     AssertionError [ERR_ASSERTION]: the sheet declares no top for .cloudcanvas-ui-calendar .cloudcanvas-ui-calendar-event::after under (pointer: coarse)
 */
test('under a finger a chip, a milestone and a node are 44px targets, though drawn smaller: the target reaches out from its item and lies under every item drawn beside it', () => {
  const TARGETS = `:is(${CHIP}, ${MILESTONE}, ${NODE})::after`;
  const target = (property) => declared(TARGETS, property, COARSE);
  const ROOTS = ':is(.cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline, .cloudcanvas-ui-graph)';
  assert.deepEqual([target('content'), target('position'), target('top'), target('left'), target('translate')], ['""', 'absolute', '50%', 'calc(50% - 1.5px)', '-50% -50%'],
    'centred on its item: on the whole of it, whose leading edge is 3px wider than its others');
  assert.deepEqual([target('width'), target('height')], Array(2).fill('max(100%, var(--target))'), 'as large as the item is drawn, and never less than a target each way');
  assert.equal(declared(ROOTS, '--target', COARSE), 'var(--cc-control-min-coarse, 44px)', 'the size the kit gives every control under a finger');
  assert.equal(declared(NODE, '--target', COARSE), 'calc(var(--cc-control-min-coarse, 44px) / var(--graph-k, 1))', 'a node is drawn at the graph\'s zoom: its target is 44px on the screen, not in the graph');
  const chip = (property) => declared(`.cloudcanvas-ui-calendar ${CHIP}::after`, property, COARSE);
  assert.deepEqual([chip('top'), chip('translate')], ['0', '-50% 0'],
    'chips stand one under another: a chip reaches down from its own top, so the room between two is the upper one\'s and nothing reaches up over what is above');
  assert.deepEqual(['left', 'width'].map((property) => declared(`.cloudcanvas-ui-calendar ${TIMED}::after`, property, COARSE)), ['0', '100%'], 'in the hour grid a chip keeps to its lane: beside it is another day, or another event');
  assert.equal(declared(`${MILESTONE}::after`, 'rotate', COARSE), '-45deg', 'a milestone is drawn turned: its target is not');
  assert.deepEqual([target('z-index'), declared(ROOTS, '--target-under', COARSE)], ['var(--target-under)', '-1'], 'the reach of a target lies under what is drawn');
  assert.equal(declared(':is(.cloudcanvas-ui-calendar-events, .cloudcanvas-ui-calendar-allday-cell, .cloudcanvas-ui-calendar-column, .cloudcanvas-ui-timeline-track, .cloudcanvas-ui-graph-nodes)', 'isolation', COARSE), 'isolate',
    'under every item of its own day, lane, row or graph and over that container\'s own ground: a press on an item that is drawn is never another\'s');
  assert.equal(declared(`:is(${CHIP}, ${MILESTONE})`, 'overflow', COARSE), 'visible', 'an item that clips itself would clip its own target');
  assert.equal(declared('.cloudcanvas-ui-calendar-day', 'z-index', COARSE), 'var(--cc-z-ui-raised, 2)', 'a day\'s number stays above the reach of the chips in the week over it');
  assert.equal(declared('.cloudcanvas-ui-calendar-month', 'isolation', COARSE), 'isolate', 'and what the calendar raises is raised inside the calendar, not over the page');
  assert.deepEqual([declared('.cloudcanvas-ui-timeline-row', 'min-height', COARSE), declared('.cloudcanvas-ui-timeline-track', 'height', COARSE)], Array(2).fill('var(--cc-control-min-coarse, 44px)'),
    'a timeline row is as tall as a target, so a milestone\'s target is inside its own row');
  assert.deepEqual([declared('.cloudcanvas-ui-calendar-allday-cell', 'min-height', COARSE), declared('.cloudcanvas-ui-calendar-cell', 'min-height', COARSE)],
    ['calc(var(--cc-control-min-coarse, 44px) + 2 * var(--cc-space-1, 4px))', '6.25rem'], 'the all-day strip, and a day of the month under its number (a target tall itself), have room for one whole target');
  assert.deepEqual(RULES.filter((rule) => rule.media !== COARSE && /(calendar-event|timeline-bar|graph-node)[^,{]*::after/.test(rule.selector)).map((rule) => rule.selector), [],
    'under a fine pointer nothing is added: an item is its drawing');
});

test('the four views are drawn through tokens alone, and nothing in them moves', () => {
  const colours = coloursOf(VIEWS);
  assert.ok(colours.length >= 60, `the check looked at too little: ${colours.length}`);
  assertTokensOnly(colours);
  const moving = RULES.filter((rule) => VIEWS.some((view) => rule.selector.includes(view)))
    .flatMap((rule) => Object.keys(rule.declarations).filter((name) => /^(transition|animation)/.test(name)).map((name) => `${rule.selector} { ${name} }`));
  assert.deepEqual(moving, [], 'so there is no motion to turn off for a user who asked for less');
});
