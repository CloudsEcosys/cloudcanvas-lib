/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The look of a tab strip is a choice: `createTabs(host, { face })`. `'line'`,
 * the default, is the quiet strip - a label on whatever is behind it and a
 * line under the tab that is selected - and `'folder'` is the row of folder
 * tabs, layers stacked behind each. In either, a close control stands inside
 * its tab's face, and a label is cut in a box of its own, so a tab with a
 * badge is cut like any other. What a folder strip looks like in detail is
 * `ui-menu-tabs-style.test.js`; that it looks so in a browser is
 * `tests/browser/ui-kit.test.js`.
 *
 * Written first, and seen to fail on a strip that was a row of folders whoever
 * asked, with a close control drawn as a box of its own beside its tab and a
 * badged tab that was never cut:
 *
 *   ✖ tabs: a strip says which face it wears - line unless folders are asked for - and refuses a face it does not know
 *     AssertionError [ERR_ASSERTION]: a strip that asks for nothing is a line strip   null !== 'line'
 *   ✖ tabs: a label has an element of its own, first in its tab, whole; the pointer gets it whole where the tab's name says more
 *     AssertionError [ERR_ASSERTION]: the label is an element of its own, first in its tab   undefined !== 'cloudcanvas-ui-tabs-label'
 *   ✖ a strip is a line strip unless it asks for folders: no face, no box, the selected tab underlined; folder faces are drawn for a folder strip alone
 *     AssertionError [ERR_ASSERTION]: no rule gives a tab a face outside a folder strip
 *   ✖ the close control stands inside its tab's face, in room the tab keeps for it, 44px each way under a finger
 *     AssertionError [ERR_ASSERTION]: the sheet declares no --tab-close for .cloudcanvas-ui-tabs
 *   ✖ a tab is cut at the width a host can set whether or not it holds a badge: the label gives way, in a box of its own
 *     AssertionError [ERR_ASSERTION]: the sheet declares no max-width for .cloudcanvas-ui-tabs-tab
 *   ✖ layers on a line strip are read in line before their tab: whole labels up to a limit, pointing at the tab, lit under the pointer, ringed under the keys
 *     AssertionError [ERR_ASSERTION]: the sheet declares no max-width for .cloudcanvas-ui-tabs[data-face="line"] .cloudcanvas-ui-tabs-layer
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_TOKENS, createTabs } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';
import { COARSE, RULES, THEMES, colour, contrast, declared, over, pageOf, resolve } from './ui-sheet.js';

const STRIP = '.cloudcanvas-ui-tabs';
const LINE = `${STRIP}[data-face="line"]`;
const FOLDER = `${STRIP}[data-face="folder"]`;
const TAB = '.cloudcanvas-ui-tabs-tab';
const LABEL = '.cloudcanvas-ui-tabs-label';
const CLOSE = '.cloudcanvas-ui-tabs-close';
const LAYER = '.cloudcanvas-ui-tabs-layer';
const FACE = `${LAYER}-face`;

const tabOf = (host, id) => host.querySelector(`[role="tab"][data-ui-id="${id}"]`);
const TRAIL = [{ id: 'home', label: 'Home' }, { id: 'work', label: 'Work' }];
const ITEMS = [{ id: 'notes', label: 'Notes', closable: true, layers: TRAIL }, { id: 'plan', label: 'Plan' }];

test('tabs: a strip says which face it wears - line unless folders are asked for - and refuses a face it does not know', (t) => {
  const faces = [undefined, null, 'line', 'folder'].map((face) => {
    const host = mount(t);
    const went = [];
    const tabs = createTabs(host, { face, onLayer: (tab, layer) => went.push([tab, layer]) });
    tabs.update({ label: 'Scopes', activeId: 'notes', items: ITEMS });
    const layers = [...host.querySelectorAll('[role="group"] button')];
    layers[1].click();
    assert.deepEqual([layers.map((node) => [node.getAttribute('aria-label'), node.getAttribute('data-depth'), node.getAttribute('tabindex')]), went],
      [[['Up to Home', '2', '0'], ['Up to Work', '1', '0']], [['notes', 'work']]], `${face}: layers are the same buttons, named, counted and reported, whatever the strip looks like`);
    tabs.update({ label: 'Scopes', activeId: 'plan', items: ITEMS });
    return host.querySelector(STRIP).getAttribute('data-face');
  });
  assert.equal(faces[0], 'line', 'a strip that asks for nothing is a line strip');
  assert.deepEqual(faces.slice(1), ['line', 'line', 'folder'], 'and one that asks is what it asked for, on every draw');
  const host = mount(t);
  for (const face of ['box', '', 'Folder', 1]) assert.throws(() => createTabs(host, { face }), /face/, `${String(face)} is no face`);
  assert.equal(host.children.length, 0, 'a refused strip mounts nothing');
});

test('tabs: a label has an element of its own, first in its tab, whole; the pointer gets it whole where the tab\'s name says more', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  const long = 'The quarterly review of everything the team said it would ship';
  const items = [{ id: 'review', label: long, closable: true }, { id: 'alerts', label: 'Alerts and everything else that wants attention today', badge: { count: 3, label: '{count} unread' } }];
  tabs.update({ label: 'Feed', activeId: 'review', items });
  const [review, alerts] = ['review', 'alerts'].map((id) => tabOf(host, id));
  for (const tab of [review, alerts]) {
    assert.equal(tab.firstChild.className, 'cloudcanvas-ui-tabs-label', 'the label is an element of its own, first in its tab');
    assert.equal(tab.firstChild.localName, 'span', 'a span: nothing a tab may not hold, and nothing its name is read differently for');
    assert.equal(tab.querySelectorAll('button, [role]').length, 0);
  }
  assert.deepEqual([review.firstChild.textContent, review.textContent, alerts.firstChild.textContent], [long, long, items[1].label], 'whole in the page: it is the sheet that cuts it');
  assert.equal(alerts.lastChild.className, 'cloudcanvas-ui-badge', 'a badge comes after the label');
  assert.deepEqual([review.title, review.firstChild.hasAttribute('title')], [long, false], 'with no badge the tab\'s name is its label, and its title says it whole');
  assert.deepEqual([alerts.hasAttribute('title'), alerts.firstChild.title], [false, items[1].label], 'with a badge the name says more than the label: the label says itself whole, and the tab says nothing twice');
  const label = review.firstChild;
  tabs.update({ label: 'Feed', activeId: 'review', items: [{ ...items[0], label: 'Review', badge: 2 }, { ...items[1], badge: undefined }] });
  assertSame(review.firstChild, label, 'a redraw writes the label where it is');
  assert.deepEqual([label.textContent, review.hasAttribute('title'), label.title, alerts.title, alerts.firstChild.hasAttribute('title')], ['Review', false, 'Review', items[1].label, false],
    'and the title follows the badge coming or going');
  assert.equal(host.querySelector('[data-ui-close="review"]').getAttribute('aria-label'), 'Close Review', 'the close control is named for the label, not the count');
  tabs.destroy();
});

/** The rules that draw a folder's face: a ground of its own, an edge above it, or a shadow on what is behind. */
const facing = (rule) => ['background-image', 'background-color', 'border-top', 'border-left', 'border-right', 'box-shadow'].some((name) => name in rule.declarations);

test('a strip is a line strip unless it asks for folders: no face, no box, the selected tab underlined; folder faces are drawn for a folder strip alone', () => {
  const parts = [TAB, CLOSE, FACE];
  const faced = RULES.filter((rule) => parts.some((part) => rule.selector.includes(part)) && facing(rule)).map((rule) => rule.selector);
  assert.ok(faced.length >= 6, `the check looked at too little: ${faced.length}`);
  assert.deepEqual(faced.filter((selector) => !selector.includes('[data-face="folder"]')), [], 'no rule gives a tab a face outside a folder strip');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes('.is-active') && !rule.selector.includes('[data-face="folder"]')).map((rule) => rule.selector), [],
    'nor does a row step back: on a line strip every tab stands on one line');
  const tab = (property) => declared(TAB, property);
  assert.deepEqual([tab('background'), tab('border'), declared(CLOSE, 'background'), declared(CLOSE, 'border')], ['transparent', '0', 'transparent', '0'], 'a tab is its label, on whatever is behind it, and so is its close control');
  assert.equal(declared(TAB, 'border-bottom'), '2px solid transparent', 'with room under it for the line');
  const selected = (property) => declared(`${TAB}[aria-selected="true"]`, property);
  assert.match(selected('border-bottom-color'), /^var\(--cc-accent, /, 'which the selected tab draws');
  assert.match(selected('font-weight'), /^var\(--cc-weight-semibold, /);
  assert.equal(declared(`${TAB}:focus-visible`, 'outline-offset'), 'calc(-1 * var(--cc-focus-ring-width, 2px))', 'the ring is worn inside on either face: a strip that scrolls cuts what is drawn outside its tabs');
  for (const [name, theme] of Object.entries(THEMES)) {
    const page = pageOf(theme);
    const surface = over(colour(resolve('var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)))', theme)), page);
    const label = colour(resolve(tab('color'), theme));
    const line = colour(resolve(selected('border-bottom-color'), theme));
    for (const [where, ground] of [['the page', page], ['a card', surface]]) {
      assert.ok(contrast(label, ground) >= 4.5, `${name}: a tab's label on ${where} is ${contrast(label, ground).toFixed(2)}:1`);
      assert.ok(contrast(line, ground) >= 3, `${name}: the line under the selected tab on ${where} is a graphic, at 3:1 or more: ${contrast(line, ground).toFixed(2)}:1`);
    }
  }
});

test('the close control stands inside its tab\'s face, in room the tab keeps for it, 44px each way under a finger', () => {
  assert.equal(declared(STRIP, '--tab-close'), 'var(--cc-control-min, 28px)', 'as wide as a control is tall');
  assert.equal(declared(STRIP, '--tab-close', COARSE), 'var(--cc-control-min-coarse, 44px)', 'and under a finger as wide as a target');
  assert.deepEqual([TAB, CLOSE].map((part) => declared(part, 'min-height', COARSE)), Array(2).fill('var(--cc-control-min-coarse, 44px)'), 'and as tall, as its tab is');
  assert.equal(declared(`${STRIP} .is-closable > ${TAB}`, 'padding-right'), 'var(--tab-close)', 'the tab keeps that room at its far end');
  const close = (property) => declared(CLOSE, property);
  assert.deepEqual([close('width'), close('margin-left'), declared(STRIP, '--tab-close-back')], ['var(--tab-close)', 'var(--tab-close-back)', 'calc(-1 * var(--tab-close))'],
    'and the control stands back into it: over the tab\'s own face, not beside it');
  assert.deepEqual([close('position'), close('align-self'), close('padding')], ['relative', 'stretch', '0'], 'in front of that face, as tall as it, its mark in the middle');
  const own = RULES.filter((rule) => rule.selector.includes(CLOSE) && !rule.selector.includes(TAB) && facing(rule)).map((rule) => rule.selector);
  assert.deepEqual(own, [], 'it has no face of its own on any strip: no ground, no edge, no corner - it is not a second tab');
  const whole = (property) => declared(`${FOLDER} ${TAB}`, property);
  assert.equal(whole('border-radius'), 'var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0 0', 'a folder tab that can be closed keeps both of its corners');
  assert.match(whole('border-right'), /^1px solid var\(--cc-card-border, /, 'and its far edge');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes('.is-closable') && ('border-right-width' in rule.declarations || 'border-top-right-radius' in rule.declarations)), [],
    'nothing opens the tab\'s face to let a second box close it');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes(`+ ${CLOSE}`)), [], 'and the line under a selected tab is the tab\'s own, from end to end');
});

test('a tab is cut at the width a host can set whether or not it holds a badge: the label gives way, in a box of its own', () => {
  assert.equal(UI_TOKENS['--cc-ui-tab-width']?.category, 'size');
  assert.match(declared(TAB, 'max-width'), /^var\(--cc-ui-tab-width, 16rem\)$/, 'every tab, badged or not');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes('is-badged)')).map((rule) => rule.selector), [], 'no rule sets a badged tab apart from the cap');
  assert.deepEqual([declared(TAB, 'display'), declared(TAB, 'white-space'), declared(TAB, 'justify-content')], ['inline-flex', 'nowrap', 'center'], 'a tab lays its label, its mark and its badge in one row, centred as its text was');
  const label = (property) => declared(LABEL, property);
  assert.deepEqual([label('min-width'), label('overflow'), label('text-overflow')], ['0', 'hidden', 'ellipsis'], 'the label is what gives way, with an ellipsis');
  assert.equal(declared(`${TAB} > .cloudcanvas-ui-badge`, 'flex'), 'none', 'the badge is never what gives way');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes(TAB) && ('overflow' in rule.declarations || 'overflow-x' in rule.declarations)).map((rule) => rule.selector), [],
    'and the tab cuts nothing itself: a flag still stands out of the top of it');
});

test('layers on a line strip are read in line before their tab: whole labels up to a limit, pointing at the tab, lit under the pointer, ringed under the keys', () => {
  const layer = (property) => declared(`${LINE} ${LAYER}`, property);
  assert.match(layer('max-width'), /^var\(--cc-ui-tab-layer-width, /, 'as wide as its label, up to what a host allows');
  assert.equal(layer('display'), 'inline-flex');
  const face = (property) => declared(FACE, property);
  assert.deepEqual([face('overflow'), face('text-overflow'), face('white-space')], ['hidden', 'ellipsis', 'nowrap'], 'a label longer than that is cut with an ellipsis, on either face');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes(FACE) && !rule.selector.includes('[data-face="folder"]') && 'position' in rule.declarations), [],
    'nothing is stacked: a layer\'s label stands in the row, where it is read whole');
  const mark = (property) => declared(`${LINE} ${LAYER}::after`, property);
  assert.deepEqual([mark('content'), mark('border-top'), mark('border-right')], ['""', '1px solid currentColor', '1px solid currentColor'], 'a mark after each points on to the tab, in the label\'s own colour');
  assert.match(declared(`${LINE} ${LAYER}:is(:hover, :focus-visible):not(:disabled) > ${FACE}`, 'background'), /^var\(--cc-btn-bg-hover, /, 'lit under the pointer and the keys as a control is');
  assert.equal(declared(`${LAYER}:focus-visible > ${FACE}`, 'outline-offset'), 'calc(-1 * var(--cc-focus-ring-width, 2px))', 'and ringed, inside, on either face');
  assert.deepEqual([declared(LAYER, 'min-width', COARSE), declared(LAYER, 'min-height', COARSE)], Array(2).fill('var(--cc-control-min-coarse, 44px)'), 'a 44px target under a finger, on either face');
  for (const [name, theme] of Object.entries(THEMES)) {
    const page = pageOf(theme);
    const label = colour(resolve(declared(LAYER, 'color'), theme));
    const lit = over(colour(resolve(declared(`${LINE} ${LAYER}:is(:hover, :focus-visible):not(:disabled) > ${FACE}`, 'background'), theme)), page);
    for (const [where, ground] of [['the page', page], ['its highlight', lit]]) assert.ok(contrast(label, ground) >= 4.5, `${name}: a layer's label on ${where} is ${contrast(label, ground).toFixed(2)}:1`);
  }
});
