/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Folder tabs: a pinned tab that cannot be closed, and the parent scopes a tab
 * stands in front of - buttons in a named group beside the tab, never inside
 * it; at most three, the outermost folded into a menu; tab stops for the
 * active tab only; each saying how far back it stands, so the sheet can stack
 * them. What a redraw does to focus is in `ui-tabs-focus.test.js`, and how the
 * stack is drawn in `ui-menu-tabs-style.test.js`.
 *
 * Written first, and seen to fail on tabs that knew neither:
 *
 *   ✖ tabs: a pinned tab says so and has no close control ...
 *     AssertionError [ERR_ASSERTION]: the caller orders the tabs; the kit only marks them
 *     actual: [ [ 'notes', null ], [ 'home', null ], [ 'plan', null ] ]
 *     expected: [ [ 'notes', null ], [ 'home', 'true' ], [ 'plan', 'true' ] ]
 *   ✖ tabs: layers are buttons in a named group beside the tab ...
 *     TypeError: Cannot read properties of null (reading 'getAttribute')
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabs, focusablesIn } from '../../ui/index.js';
import { assertSame, key, mount, pointer } from '../helpers/ui.js';

const TRAIL = [{ id: 'home', label: 'Home' }, { id: 'work', label: 'Work' }, { id: 'q4', label: 'Q4 planning' },
  { id: 'launch', label: 'Launch' }, { id: 'copy', label: 'Copy review' }];

const tabOf = (host, id) => host.querySelector(`[role="tab"][data-ui-id="${id}"]`);
const tabsIn = (host) => [...host.querySelectorAll('[role="tab"]')];
const groupOf = (host, id) => tabOf(host, id).parentElement.querySelector('[role="group"]');
const layersOf = (host, id) => [...(groupOf(host, id)?.querySelectorAll('button') ?? [])];
const texts = (nodes) => nodes.map((node) => node.textContent);
const depths = (nodes) => nodes.map((node) => node.getAttribute('data-depth'));

test('tabs: a pinned tab says so and has no close control - closable or not, by button or by Delete - and stays where the model put it', (t) => {
  const host = mount(t);
  const closed = [];
  const tabs = createTabs(host, { onClose: (id) => closed.push(id) });
  const items = [{ id: 'notes', label: 'Notes', closable: true }, { id: 'home', label: 'Home', pinned: true, closable: true },
    { id: 'plan', label: 'Plan', pinned: true }];
  tabs.update({ label: 'Scopes', activeId: 'notes', items });
  assert.deepEqual(tabsIn(host).map((node) => [node.getAttribute('data-ui-id'), node.getAttribute('data-pinned')]),
    [['notes', null], ['home', 'true'], ['plan', 'true']], 'the caller orders the tabs; the kit only marks them');
  assert.deepEqual([...host.querySelectorAll('[data-ui-close]')].map((node) => node.getAttribute('data-ui-close')), ['notes'],
    'a pinned tab has no close control on the page at all');
  assertSame(tabOf(host, 'home').nextElementSibling, null);
  key(tabOf(host, 'home'), 'Delete');
  key(tabOf(host, 'notes'), 'Delete');
  assert.deepEqual(closed, ['notes'], 'Delete closes what can be closed, and a pinned tab cannot');
  assert.equal(host.querySelector('[role="tablist"]').getAttribute('aria-owns'), tabsIn(host).map((node) => node.id).join(' '), 'a pinned tab is a tab like any other');
  tabs.update({ label: 'Scopes', activeId: 'notes', items: items.map((item) => ({ ...item, pinned: false })) });
  assert.deepEqual(tabsIn(host).map((node) => node.hasAttribute('data-pinned')), [false, false, false]);
  const close = host.querySelector('[data-ui-close="home"]');
  assert.equal(close.hidden, false, 'unpinned and closable: its close control is back');
  assertSame(close.previousElementSibling, tabOf(host, 'home'), 'where it belongs, right after its tab');
  assert.equal(host.querySelector('[data-ui-close="plan"]').hidden, true, 'unpinned is not closable');
  tabs.destroy();
});

test('tabs: layers are buttons in a named group beside the tab, outermost first, each named "Up to" its label', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  const items = [{ id: 'home', label: 'Home', pinned: true }, { id: 'notes', label: 'Notes', layers: TRAIL.slice(0, 3), closable: true }];
  tabs.update({ label: 'Scopes', activeId: 'notes', items });
  const tab = tabOf(host, 'notes');
  const group = groupOf(host, 'notes');
  const list = host.querySelector('[role="tablist"]');
  assert.equal(group.getAttribute('aria-label'), 'Parent scopes of Notes');
  assertSame(group.nextElementSibling, tab, 'behind the tab is before it, the nearest parent right against the tab');
  assert.equal(tab.contains(group) || list.contains(group), false, 'outside the tab, and outside the tablist');
  assert.equal(tab.querySelectorAll('button, [role]').length, 0, 'nothing interactive inside a tab');
  assert.equal(tab.parentElement.getAttribute('role'), 'presentation');
  assert.equal(list.getAttribute('aria-owns'), tabsIn(host).map((node) => node.id).join(' '), 'the tablist still owns its tabs, and only them');
  assert.deepEqual(layersOf(host, 'notes').map((node) => [node.getAttribute('data-ui-layer'), node.getAttribute('aria-label'), node.title, node.textContent, node.type]),
    TRAIL.slice(0, 3).map(({ id, label }) => [id, `Up to ${label}`, label, label, 'button']), 'the label is drawn, and whole in the title where the sheet cuts it short');
  for (const node of layersOf(host, 'notes')) {
    assert.deepEqual([node.children.length, node.firstElementChild.className, node.firstElementChild.textContent], [1, 'cloudcanvas-ui-tabs-layer-face', node.textContent],
      'the button is the layer\'s place and target; its label is on the face the sheet draws there');
  }
  assert.deepEqual(depths(layersOf(host, 'notes')), ['3', '2', '1'], 'each says how many steps behind the tab it stands: the nearest parent one');
  assertSame(groupOf(host, 'home'), null, 'a tab with no layers has no group');
  assertSame(tab.nextElementSibling, host.querySelector('[data-ui-close="notes"]'), 'the close control still follows its tab');
  const kept = layersOf(host, 'notes')[1];
  tabs.update({ label: 'Scopes', activeId: 'notes', items: [items[0], { ...items[1], label: 'Drafts', layers: [{ id: 'work', label: 'Work, renamed' }] }] });
  assertSame(groupOf(host, 'notes'), group, 'the same group, redrawn');
  assert.equal(group.getAttribute('aria-label'), 'Parent scopes of Drafts');
  assertSame(layersOf(host, 'notes')[0], kept, 'a layer the model still names is the button it was');
  assert.deepEqual(layersOf(host, 'notes').map((node) => [node.getAttribute('aria-label'), node.title, node.textContent]), [['Up to Work, renamed', 'Work, renamed', 'Work, renamed']]);
  tabs.update({ label: 'Scopes', activeId: 'notes', items: [items[0], { id: 'notes', label: 'Notes', layers: [] }] });
  assertSame(groupOf(host, 'notes'), null, 'no layers, no group');
  tabs.destroy();
  assert.equal(host.children.length, 0);
});

/*
 * Written first and seen to fail on a strip whose sheet could not tell a row of
 * folders from a row of plain tabs:
 *
 *   ✖ AssertionError [ERR_ASSERTION]: pinned is not closable, whatever its item says
 *     actual: [ false, false, false ]   expected: [ false, true, false ]
 */
test('tabs: a strip with a stack says so - and only then - and a row says whether its tab can be closed', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  const strip = host.querySelector('.cloudcanvas-ui-tabs');
  const closable = () => tabsIn(host).map((node) => node.parentElement.classList.contains('is-closable'));
  const plain = [{ id: 'home', label: 'Home', pinned: true, closable: true }, { id: 'notes', label: 'Notes', closable: true }, { id: 'plan', label: 'Plan' }];
  tabs.update({ label: 'Scopes', activeId: 'notes', items: plain });
  assert.equal(strip.hasAttribute('data-layered'), false, 'a strip with no stack claims none');
  assert.deepEqual(closable(), [false, true, false], 'pinned is not closable, whatever its item says');
  tabs.update({ label: 'Scopes', activeId: 'notes', items: [plain[0], plain[1], { ...plain[2], layers: TRAIL.slice(0, 1) }] });
  assert.equal(strip.getAttribute('data-layered'), 'true', 'one stack, and the strip says it has one');
  tabs.update({ label: 'Scopes', activeId: 'notes', items: [plain[0], { ...plain[1], closable: false }, { ...plain[2], closable: true, layers: [] }] });
  assert.equal(strip.hasAttribute('data-layered'), false, 'and with the last stack gone it says so no more');
  assert.deepEqual(closable(), [false, false, true]);
  tabs.destroy();
});

/*
 * Written first and seen to fail on a strip that was a row of folders only while one of its tabs had a stack, and so
 * changed shape the first time a scope was entered: no row said which tab stands in front, and no tab its whole label.
 *
 *   ✖ tabs: every row says whether its tab is the one in front - in a strip with no stack as in one with - and nothing selected puts none there
 *     AssertionError [ERR_ASSERTION]: a strip with no stack: the row of the active tab, and only that one
 *     actual: [ false, false, false ]   expected: [ false, true, false ]
 *   ✖ tabs: a tab the sheet may cut short says its whole label in its title, and is still named by the label it holds
 *     AssertionError [ERR_ASSERTION]: whole, for the pointer, where the sheet cuts the label short
 *     actual: [ '', '' ]   expected: [ 'Home', 'The quarterly review of everything the team said it would ship' ]
 */
test('tabs: every row says whether its tab is the one in front - in a strip with no stack as in one with - and nothing selected puts none there', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  const front = () => tabsIn(host).map((node) => node.parentElement.classList.contains('is-active'));
  const plain = [{ id: 'home', label: 'Home', pinned: true }, { id: 'notes', label: 'Notes', closable: true }, { id: 'plan', label: 'Plan' }];
  const stacked = [plain[0], { ...plain[1], layers: TRAIL }, { ...plain[2], layers: TRAIL.slice(0, 1) }];
  for (const [name, items] of [['a strip with no stack', plain], ['a strip with stacks', stacked]]) {
    tabs.update({ label: 'Scopes', activeId: 'notes', items });
    assert.deepEqual(front(), [false, true, false], `${name}: the row of the active tab, and only that one`);
    tabs.update({ label: 'Scopes', activeId: 'home', items });
    assert.deepEqual(front(), [true, false, false], `${name}: it follows the active tab, pinned or not`);
    tabs.update({ label: 'Scopes', activeId: null, items });
    assert.deepEqual(front(), [false, false, false], `${name}: nothing selected, nothing in front`);
  }
  tabs.destroy();
});

test('tabs: a tab the sheet may cut short says its whole label in its title, and is still named by the label it holds', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  const long = 'The quarterly review of everything the team said it would ship';
  const items = [{ id: 'home', label: 'Home', pinned: true }, { id: 'review', label: long, closable: true, layers: TRAIL.slice(0, 1) },
    { id: 'alerts', label: 'Alerts', badge: { count: 3, label: '{count} unread' } }];
  tabs.update({ label: 'Scopes', activeId: 'review', items });
  assert.deepEqual([tabOf(host, 'home').title, tabOf(host, 'review').title], ['Home', long], 'whole, for the pointer, where the sheet cuts the label short');
  assert.deepEqual([tabOf(host, 'review').firstChild.textContent, tabOf(host, 'review').hasAttribute('aria-label')], [long, false],
    'the label itself is whole in the page - it is the sheet that cuts it - so the tab\'s name is the whole label, and nothing overrides it');
  assert.deepEqual([tabOf(host, 'alerts').hasAttribute('title'), tabOf(host, 'alerts').firstChild.title], [false, 'Alerts'],
    'a badged tab is cut too, now that its label has a box of its own: the label says itself whole, and the tab - whose name says more - says nothing twice');
  tabs.update({ label: 'Scopes', activeId: 'review', items: [items[0], { ...items[1], label: 'Review', badge: 2 }, { ...items[2], badge: undefined }] });
  assert.deepEqual([tabOf(host, 'review').hasAttribute('title'), tabOf(host, 'alerts').title], [false, 'Alerts'], 'it follows the label, and the badge coming or going');
  tabs.destroy();
});

test('tabs: at most three layers show - with more, the outermost fold into one … layer, which is one of the three', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  const model = (count) => ({ label: 'Scopes', activeId: 'notes', items: [{ id: 'notes', label: 'Notes', layers: TRAIL.slice(0, count) }] });
  for (const count of [1, 2, 3]) {
    tabs.update(model(count));
    assert.deepEqual(texts(layersOf(host, 'notes')), TRAIL.slice(0, count).map((layer) => layer.label), `${count} fit`);
    assert.deepEqual(depths(layersOf(host, 'notes')), ['3', '2', '1'].slice(-count), 'counted back from the tab');
    assertSame(host.querySelector('[data-ui-fold]'), null, 'and nothing is folded');
  }
  tabs.update(model(5));
  const [fold, ...shown] = layersOf(host, 'notes');
  assert.deepEqual(texts([fold, ...shown]), ['…', 'Launch', 'Copy review'], 'the nearest parents stay, behind the fold');
  assert.deepEqual(depths([fold, ...shown]), ['3', '2', '1'], 'the fold stands furthest back, where the layers it holds would');
  assert.deepEqual([fold.type, fold.getAttribute('data-ui-fold'), fold.getAttribute('aria-haspopup'), fold.getAttribute('aria-expanded'), fold.getAttribute('aria-label')],
    ['button', 'notes', 'menu', 'false', '3 more parent scopes'], 'a button that says what it holds and that it opens a menu');
  assert.equal(fold.hasAttribute('data-ui-layer'), false, 'the fold is no parent scope itself');
  assertSame(host.querySelector('[role="menu"]'), null, 'its menu is not made until it is asked for');
  tabs.update(model(4));
  assert.deepEqual(texts(layersOf(host, 'notes')), ['…', 'Q4 planning', 'Launch']);
  assertSame(layersOf(host, 'notes')[0], fold, 'the same fold, counting again');
  assert.equal(fold.getAttribute('aria-label'), '2 more parent scopes');
  assert.throws(() => tabs.update({ items: [{ id: 'a', label: 'A', layers: [{ id: 'x', label: 'X' }, { id: 'x', label: 'X again' }] }] }), /duplicate tab layer id: x/);
  assert.deepEqual(texts(layersOf(host, 'notes')), ['…', 'Q4 planning', 'Launch'], 'a refused model changes nothing');
  tabs.destroy();
});

test('tabs: the fold opens a menu of the folded layers, outermost first; choosing one is onLayer, like a press on a layer that shows', (t) => {
  const host = mount(t);
  const went = [];
  const tabs = createTabs(host, { onLayer: (tab, layer) => went.push([tab, layer]) });
  const model = (count) => ({ label: 'Scopes', activeId: 'notes', items: [{ id: 'notes', label: 'Notes', layers: TRAIL.slice(0, count) }] });
  tabs.update(model(5));
  const fold = layersOf(host, 'notes')[0];
  fold.click();
  const menu = host.querySelector('[role="menu"]');
  const wrap = host.querySelector('.cloudcanvas-ui-menu');
  assert.equal(wrap.hidden, false);
  assert.equal(host.querySelector('[role="tablist"]').contains(menu) || host.querySelector('.cloudcanvas-ui-tabs').contains(menu), false, 'beside the strip, not in it');
  assert.equal(menu.getAttribute('aria-label'), 'More parent scopes of Notes');
  assert.deepEqual(texts([...menu.querySelectorAll('[role="menuitem"]')]), ['Home', 'Work', 'Q4 planning']);
  assert.equal(fold.getAttribute('aria-expanded'), 'true');
  assert.equal(document.activeElement.textContent, 'Home', 'the menu takes focus');
  key(document.activeElement, 'ArrowDown');
  key(document.activeElement, 'Enter');
  assert.deepEqual(went, [['notes', 'work']]);
  assert.deepEqual([wrap.hidden, fold.getAttribute('aria-expanded')], [true, 'false']);
  assertSame(document.activeElement, fold, 'and focus is back on the fold');
  fold.click();
  key(document.activeElement, 'Escape');
  assert.deepEqual([wrap.hidden, fold.getAttribute('aria-expanded'), went.length], [true, 'false', 1], 'Escape closes it and goes nowhere');
  fold.click();
  tabs.update(model(4));
  assert.deepEqual([wrap.hidden, fold.getAttribute('aria-expanded')], [false, 'true'], 'a redraw leaves an open menu open');
  assert.deepEqual(texts([...menu.querySelectorAll('[role="menuitem"]')]), ['Home', 'Work'], 'and listing what is folded now');
  assert.equal(document.activeElement.textContent, 'Home', 'with focus still in it');
  tabs.update(model(3));
  assert.equal(wrap.hidden, true, 'nothing is folded any more: its menu closes');
  assertSame(document.activeElement, tabOf(host, 'notes'), 'and focus, which the fold would have had, goes to its tab');
  tabs.destroy();
  assert.equal(host.children.length, 0, 'destroy takes the menu with it');
});

/*
 * Written first and seen to fail: a press on the fold while its menu was open
 * closed the menu as a press outside it, and the click that same press ended
 * in opened it again.
 *
 *   ✖ AssertionError [ERR_ASSERTION]: and the click that press ends in does not open it again: on the fold itself
 */
test('tabs: a second press on the fold shuts its menu, and the click a closing press ends in never opens it again', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  tabs.update({ label: 'Scopes', activeId: 'notes', items: [{ id: 'notes', label: 'Notes', layers: TRAIL }] });
  const fold = layersOf(host, 'notes')[0];
  fold.click();
  const wrap = host.querySelector('.cloudcanvas-ui-menu');
  fold.click();
  assert.equal(wrap.hidden, true, 'pressed with its menu open - by an assistive click, which presses nothing first - it shuts it');
  for (const [name, target] of [['on the fold itself', fold], ['anywhere else', document.body]]) {
    fold.click();
    pointer(target, 'pointerdown');
    assert.equal(wrap.hidden, true, `a press outside the menu - ${name} - closes it`);
    target.click();
    assert.equal(wrap.hidden, true, `and the click that press ends in does not open it again: ${name}`);
    fold.click();
    assert.equal(wrap.hidden, false, 'the press after that opens it, as any press on a shut fold does');
    key(document.activeElement, 'Escape');
  }
  fold.click();
  pointer(document.body, 'pointerdown');
  pointer(fold, 'pointerdown');
  fold.click();
  assert.equal(wrap.hidden, false, 'a press that ended in no click at all is forgotten when the next press begins');
  tabs.destroy();
  assert.equal(host.children.length, 0);
});

test('tabs: a press on a layer reports onLayer(tabId, layerId) - for any tab, active or not - and selects nothing', (t) => {
  const host = mount(t);
  const went = [];
  const chosen = [];
  const tabs = createTabs(host, { onLayer: (tab, layer) => went.push([tab, layer]), onSelect: (id) => chosen.push(id) });
  const items = [{ id: 'notes', label: 'Notes', layers: TRAIL.slice(0, 2) }, { id: 'plan', label: 'Plan', layers: TRAIL.slice(1, 3) },
    { id: 'off', label: 'Off', disabled: true, layers: TRAIL.slice(0, 1) }];
  tabs.update({ label: 'Scopes', activeId: 'notes', items });
  layersOf(host, 'notes')[1].click();
  layersOf(host, 'plan')[0].click();
  assert.deepEqual(went, [['notes', 'work'], ['plan', 'work']], 'one layer id under two tabs is told apart by its tab');
  assert.deepEqual(chosen, [], 'going up is the host\'s to answer: the kit selects nothing');
  assert.equal(layersOf(host, 'off')[0].disabled, true, 'a disabled tab\'s layers are disabled with it');
  layersOf(host, 'off')[0].click();
  assert.equal(went.length, 2);
  const layer = layersOf(host, 'notes')[0];
  tabs.destroy();
  layer.click();
  assert.equal(went.length, 2, 'a destroyed strip reports nothing');
  const quietHost = mount(t);
  const quiet = createTabs(quietHost);
  quiet.update({ items });
  assert.doesNotThrow(() => layersOf(quietHost, 'notes')[0].click(), 'no onLayer given, none called');
  quiet.destroy();
});

test('tabs: the layers of the active tab are tab stops, in order, before the tab; the layers of every other tab are not', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  const items = [{ id: 'home', label: 'Home', pinned: true }, { id: 'notes', label: 'Notes', layers: TRAIL },
    { id: 'plan', label: 'Plan', layers: TRAIL.slice(0, 2), closable: true }];
  const stopsOf = (id) => layersOf(host, id).map((node) => node.getAttribute('tabindex'));
  const reached = () => focusablesIn(host).map((node) => (node.getAttribute('role') === 'tab' ? `tab ${node.getAttribute('data-ui-id')}` : node.textContent));
  tabs.update({ label: 'Scopes', activeId: 'notes', items });
  assert.deepEqual([stopsOf('notes'), stopsOf('plan')], [['0', '0', '0'], ['-1', '-1']], 'the fold is a stop like the layers it stands for');
  assert.deepEqual(reached(), ['…', 'Launch', 'Copy review', 'tab notes'], 'Tab walks the active tab\'s layers outermost first, then reaches the tab');
  assert.deepEqual(tabsIn(host).map((node) => node.getAttribute('tabindex')), ['-1', '0', '-1'], 'the tabs keep their one roving stop');
  tabs.update({ label: 'Scopes', activeId: 'plan', items });
  assert.deepEqual([stopsOf('notes'), stopsOf('plan')], [['-1', '-1', '-1'], ['0', '0']], 'the stops follow the active tab');
  assert.deepEqual(reached(), ['Home', 'Work', 'tab plan']);
  tabs.update({ label: 'Scopes', activeId: null, items });
  assert.deepEqual([stopsOf('notes'), stopsOf('plan')], [['-1', '-1', '-1'], ['-1', '-1']], 'no active tab, no layer stops');
  assert.deepEqual(reached(), ['tab home']);
  tabs.update({ label: 'Scopes', activeId: 'notes', items, activation: 'manual' });
  tabOf(host, 'notes').focus();
  key(tabOf(host, 'notes'), 'ArrowRight');
  assertSame(document.activeElement, tabOf(host, 'plan'), 'the arrows rove the tabs, as they did, and step over every layer');
  assert.deepEqual([stopsOf('notes'), stopsOf('plan')], [['0', '0', '0'], ['-1', '-1']], 'the stop the arrows moved is the tabs\'; the layers stay with the active tab');
  const layer = layersOf(host, 'notes')[1];
  assert.equal(key(layer, 'ArrowRight').defaultPrevented || key(layer, 'Delete').defaultPrevented, false, 'a layer is a plain button: the tab keys are not its keys');
  tabs.destroy();
});
