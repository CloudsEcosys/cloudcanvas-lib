/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel's bar on the repository's DOM: each control a real button named for what it does, pressed where it
 * toggles, shown where it applies; the place menu; the tab strip's keys; the bar's own keys; the collapsed tab;
 * the double press; and a modal holding the keyboard and every press outside it, and giving both back.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { runFrame } from 'cloudcanvas/testing';
import { stateOf } from 'cloudcanvas/kernel';
import { PANEL_TAB_PX, bodyOf, panelOf, panels, setPanel } from '../../plugins/panel.js';
import { PANEL_CSS } from '../../plugins/css/panel.js';
import { resetDocument, setElementSize } from '../helpers/dom.js';
import { press, release } from '../helpers/core-scene.js';

function scene(t) {
  const realRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 1;
  t.after(() => { globalThis.requestAnimationFrame = realRaf; resetDocument(); });
  const host = document.createElement('div');
  host.style.position = 'relative';
  document.body.appendChild(host);
  const layer = panels(host);
  setElementSize(layer.el, 1000, 800);
  const root = stateOf(layer.el).root;
  return { host, layer, settle: () => { runFrame(root); runFrame(root); } };
}

const barOf = (b) => b.el.querySelector('.cloudcanvas-panel-bar');
const controls = (b) => Array.from(b.el.querySelectorAll('.cloudcanvas-panel-control'));
const shown = (b) => controls(b).filter((button) => !button.hidden).map((button) => button.getAttribute('data-cc-key'));
const control = (b, name) => b.el.querySelector(`.cloudcanvas-panel-control[data-cc-key="${name}"]`);
const key = (target, name, extra = {}) => {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...extra });
  target.dispatchEvent(event);
  return event;
};

test('controls - real buttons, in the order given, each named for what pressing it does; [] shows none', (t) => {
  const { layer } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right', title: 'Sheet' });
  assert.deepEqual(controls(sheet).map((button) => button.getAttribute('data-cc-key')), ['collapse', 'pin', 'place', 'full', 'close']);
  for (const button of controls(sheet)) {
    assert.equal(button.tagName, 'BUTTON');
    assert.equal(button.type, 'button');
    assert.match(button.getAttribute('aria-label'), /Sheet/);
  }
  assert.equal(control(sheet, 'close').getAttribute('aria-label'), 'Close Sheet');
  assert.equal(control(sheet, 'collapse').getAttribute('aria-pressed'), 'false');
  assert.equal(control(sheet, 'pin').getAttribute('aria-pressed'), 'true');
  assert.equal(control(sheet, 'full').getAttribute('aria-pressed'), 'false');
  assert.equal(control(sheet, 'close').hasAttribute('aria-pressed'), false, 'close is no toggle');
  assert.equal(control(sheet, 'place').getAttribute('aria-haspopup'), 'menu');
  setPanel(sheet, { controls: ['close', 'collapse'] });
  assert.deepEqual(controls(sheet).map((button) => button.getAttribute('data-cc-key')), ['close', 'collapse']);
  setPanel(sheet, { controls: [] });
  assert.deepEqual(controls(sheet), []);
});

test('controls - a toggle\'s pressed state is shown by more than colour', () => {
  const pressed = /\.cloudcanvas-panel-control\[aria-pressed="true"\]\s*\{([^}]*)\}/.exec(PANEL_CSS)?.[1] ?? '';
  assert.match(pressed, /box-shadow:/, 'no ring');
  assert.match(pressed, /background:/, 'no fill');
});

test('controls - each shows where it applies: pin on an edge, collapse on an edge and floating, place with two places, full when allowed', (t) => {
  const { layer } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  assert.deepEqual(shown(sheet), ['collapse', 'pin', 'place', 'full', 'close']);
  setPanel(sheet, { at: 'float' });
  assert.deepEqual(shown(sheet), ['collapse', 'place', 'full', 'close']);
  setPanel(sheet, { at: 'modal' });
  assert.deepEqual(shown(sheet), ['place', 'full', 'close']);
  setPanel(sheet, { places: ['modal'] });
  assert.deepEqual(shown(sheet), ['close']);
});

test('controls - collapse and pin toggle, full goes and comes back, each pressed state following', (t) => {
  const { layer } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'left' });
  control(sheet, 'collapse').click();
  assert.equal(panelOf(sheet).collapsed, true);
  assert.equal(control(sheet, 'collapse').getAttribute('aria-pressed'), 'true');
  control(sheet, 'collapse').click();
  control(sheet, 'pin').click();
  assert.equal(panelOf(sheet).pinned, false);
  assert.equal(control(sheet, 'pin').getAttribute('aria-pressed'), 'false');
  assert.ok(sheet.el.classList.contains('cc-drawer'));
  control(sheet, 'full').click();
  assert.equal(panelOf(sheet).at, 'full');
  assert.equal(control(sheet, 'full').getAttribute('aria-pressed'), 'true');
  control(sheet, 'full').click();
  assert.equal(panelOf(sheet).at, 'left', 'full did not go back to the place it came from');
});

test('controls - close emits a cancelable dismiss; unless prevented the panel is not shown, its settings kept', (t) => {
  const { layer, settle } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right', size: 300 });
  settle();
  let dismissed = 0;
  const stop = (event) => { dismissed += 1; event.preventDefault(); };
  sheet.el.addEventListener('dismiss', stop);
  control(sheet, 'close').click();
  assert.equal(dismissed, 1);
  assert.equal(panelOf(sheet).open, true, 'a prevented dismiss closed it');
  sheet.el.removeEventListener('dismiss', stop);
  control(sheet, 'close').click();
  assert.equal(panelOf(sheet).open, false);
  assert.equal(sheet.el.hidden, true);
  assert.deepEqual(panelOf(sheet).size, { x: 300, y: 300 });
  setPanel(sheet, { open: true });
  assert.equal(sheet.el.hidden, false);
});

test('place menu - a menu of menuitemradios for the allowed places; roved with the arrows, chosen, closed with Escape', (t) => {
  const { layer } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right', places: ['float', 'right', 'modal'] });
  const place = control(sheet, 'place');
  place.click();
  const menu = sheet.el.querySelector('[role="menu"]');
  assert.ok(menu, 'no menu opened');
  assert.equal(place.getAttribute('aria-expanded'), 'true');
  const items = Array.from(menu.querySelectorAll('[role="menuitemradio"]'));
  assert.deepEqual(items.map((item) => [item.textContent, item.getAttribute('aria-checked')]),
    [['Float', 'false'], ['Right edge', 'true'], ['Modal', 'false']]);
  assert.equal(document.activeElement, items[1], 'the checked place has the focus');
  key(items[1], 'ArrowDown');
  assert.equal(document.activeElement, items[2]);
  key(items[2], 'ArrowDown');
  assert.equal(document.activeElement, items[0]);
  key(items[0], 'Escape');
  assert.equal(sheet.el.querySelector('[role="menu"]'), null);
  assert.equal(document.activeElement, place);
  assert.equal(place.getAttribute('aria-expanded'), 'false');
  place.click();
  sheet.el.querySelector('[data-cc-panel-place="modal"]').click();
  assert.equal(panelOf(sheet).at, 'modal');
  assert.equal(sheet.el.querySelector('[role="menu"]'), null, 'choosing left the menu open');
});

test('place menu - a press outside closes it; a single allowed place shows no place control', (t) => {
  const { layer } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  control(sheet, 'place').click();
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
  assert.equal(sheet.el.querySelector('[role="menu"]'), null);
  setPanel(sheet, { places: ['right'] });
  assert.equal(control(sheet, 'place').hidden, true);
});

test('tab strip - a tablist; Left and Right move among the tabs, select, and keep the keyboard on the tab', (t) => {
  const { layer, settle } = scene(t);
  const a = layer.add(null, { id: 'a', at: 'right', title: 'A' });
  const b = layer.add(null, { id: 'b', at: 'right', title: 'B' });
  const c = layer.add(null, { id: 'c', at: 'right', title: 'C' });
  settle();
  assert.equal(panelOf(c).active, true);
  const strip = c.el.querySelector('[role="tablist"]');
  assert.deepEqual(Array.from(strip.children, (tab) => tab.getAttribute('tabindex')), ['-1', '-1', '0']);
  const tabC = strip.children[2];
  tabC.focus();
  key(tabC, 'ArrowRight');
  assert.equal(panelOf(a).active, true, 'Right from the last tab wraps to the first');
  assert.equal(document.activeElement.textContent, 'A');
  assert.ok(a.el.contains(document.activeElement));
  key(document.activeElement, 'ArrowRight');
  assert.equal(panelOf(b).active, true);
  key(document.activeElement, 'ArrowLeft');
  assert.equal(panelOf(a).active, true);
  assert.deepEqual([a.el.hidden, b.el.hidden, c.el.hidden], [false, true, true]);
});

test('tab strip - a tablist named for its place; each tab controls its member\'s body, which is that tab\'s tabpanel', (t) => {
  const { layer, settle } = scene(t);
  const a = layer.add(null, { id: 'a', at: 'right', title: 'A' });
  const b = layer.add(null, { id: 'b', at: 'right', title: 'B' });
  settle();
  const strip = b.el.querySelector('[role="tablist"]');
  assert.equal(strip.getAttribute('aria-label'), 'Right edge panels');
  const [tabA, tabB] = strip.children;
  assert.equal(document.getElementById(tabA.getAttribute('aria-controls')), bodyOf(a));
  assert.equal(document.getElementById(tabB.getAttribute('aria-controls')), bodyOf(b));
  assert.equal(bodyOf(b).getAttribute('role'), 'tabpanel');
  assert.equal(document.getElementById(bodyOf(b).getAttribute('aria-labelledby')), tabB);
  assert.equal(document.getElementById(bodyOf(a).getAttribute('aria-labelledby')).textContent, 'A');
  setPanel(a, { open: false });
  assert.equal(bodyOf(b).hasAttribute('role'), false, 'a panel alone is no tabpanel');
  assert.equal(strip.hasAttribute('aria-label'), false);
});

test('bar keys - one tab stop; the arrows move a floating panel 16px, Shift with them sizes it', (t) => {
  const { layer, settle } = scene(t);
  const tool = layer.add(null, { id: 'tool', box: { x: 100, y: 100, w: 300, h: 200 } });
  settle();
  const bar = barOf(tool);
  assert.equal(bar.getAttribute('tabindex'), '0');
  assert.ok(key(bar, 'ArrowRight').defaultPrevented);
  key(bar, 'ArrowDown');
  assert.deepEqual(panelOf(tool).box, { x: 116, y: 116, w: 300, h: 200 });
  key(bar, 'ArrowRight', { shiftKey: true });
  key(bar, 'ArrowUp', { shiftKey: true });
  assert.deepEqual(panelOf(tool).box, { x: 116, y: 116, w: 316, h: 184 });
  const inner = tool.el.querySelector('.cloudcanvas-panel-control');
  assert.equal(key(inner, 'ArrowRight').defaultPrevented, false, 'a key on a button moved the panel');
});

test('bar keys - on an edge Shift with the arrows sizes the thickness towards the content; Enter unfolds a collapsed tab', (t) => {
  const { layer, settle } = scene(t);
  const right = layer.add(null, { id: 'right', at: 'right', size: 300 });
  const top = layer.add(null, { id: 'top', at: 'top', size: 200 });
  settle();
  key(barOf(right), 'ArrowLeft', { shiftKey: true });
  assert.deepEqual(panelOf(right).size, { x: 316, y: 300 }, 'Shift with the arrows sized the other axis');
  key(barOf(right), 'ArrowRight', { shiftKey: true });
  key(barOf(right), 'ArrowRight', { shiftKey: true });
  assert.equal(panelOf(right).size.x, 284);
  key(barOf(top), 'ArrowDown', { shiftKey: true });
  assert.deepEqual(panelOf(top).size, { x: 200, y: 216 });
  key(barOf(right), 'ArrowLeft');
  assert.equal(panelOf(right).at, 'right', 'an arrow moved an edge panel');
  setPanel(right, { collapsed: true });
  assert.equal(barOf(right).getAttribute('role'), 'button');
  assert.equal(barOf(right).getAttribute('aria-expanded'), 'false');
  key(barOf(right), 'Enter');
  assert.equal(panelOf(right).collapsed, false);
  setPanel(top, { collapsed: true });
  key(barOf(top), ' ');
  assert.equal(panelOf(top).collapsed, false);
});

test('collapsed tab - only the tab, the strip the tab\'s width; pressing it unfolds the panel', (t) => {
  const { layer, settle } = scene(t);
  const left = layer.add(null, { id: 'left', at: 'left', collapsed: true, title: 'Files' });
  settle();
  assert.equal(left.spec.w, PANEL_TAB_PX);
  assert.ok(left.el.classList.contains('is-collapsed'));
  assert.equal(barOf(left).getAttribute('aria-label'), 'Expand Files');
  press(barOf(left), 10, 300);
  release(10, 300);
  assert.equal(panelOf(left).collapsed, false);
  settle();
  assert.equal(left.spec.w, 360);
});

test('double press - toggles full when full is allowed, not on a button, not when it is not', (t) => {
  const { layer } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  const dbl = (target) => target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  dbl(barOf(sheet));
  assert.equal(panelOf(sheet).at, 'full');
  dbl(barOf(sheet));
  assert.equal(panelOf(sheet).at, 'right');
  dbl(control(sheet, 'close'));
  assert.equal(panelOf(sheet).at, 'right');
  setPanel(sheet, { places: ['right', 'float'] });
  dbl(barOf(sheet));
  assert.equal(panelOf(sheet).at, 'right');
});

test('modal - holds the keyboard: the focus moves in, Tab cycles inside, Escape closes it and the focus returns', (t) => {
  const { host, layer, settle } = scene(t);
  const outside = document.createElement('button');
  host.appendChild(outside);
  outside.focus();
  const form = document.createElement('div');
  form.append(document.createElement('input'), document.createElement('input'));
  const dialog = layer.add(form, { id: 'dialog', at: 'modal', title: 'Settings', controls: ['close'] });
  settle();
  assert.equal(dialog.el.getAttribute('role'), 'dialog');
  assert.equal(dialog.el.getAttribute('aria-modal'), 'true');
  assert.equal(dialog.el.getAttribute('aria-label'), 'Settings');
  const bar = barOf(dialog);
  assert.equal(document.activeElement, bar, 'the focus did not move into the modal');
  const [first, second] = form.querySelectorAll('input');
  second.focus();
  assert.ok(key(second, 'Tab').defaultPrevented);
  assert.equal(document.activeElement, bar, 'Tab past the last did not wrap');
  key(bar, 'Tab', { shiftKey: true });
  assert.equal(document.activeElement, second);
  outside.focus();
  key(outside, 'Tab');
  assert.ok(dialog.el.contains(document.activeElement), 'Tab from outside did not come back in');
  first.focus();
  let dismissed = 0;
  dialog.el.addEventListener('dismiss', () => { dismissed += 1; });
  key(first, 'Escape');
  assert.equal(dismissed, 1);
  assert.equal(panelOf(dialog).open, false);
  assert.equal(document.activeElement, outside, 'the focus did not return');
  assert.equal(dialog.el.hasAttribute('role'), false);
});

test('modal - while one is shown the layer takes every press outside it, and only then', (t) => {
  const { layer, settle } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  settle();
  const press = (target) => {
    const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };
  const plane = layer.el.querySelector('[data-blit-plane]');
  assert.equal(layer.el.classList.contains('cc-modal'), false);
  assert.equal(press(plane), false);
  const dialog = layer.add(null, { id: 'dialog', at: 'modal' });
  assert.equal(layer.el.classList.contains('cc-modal'), false, 'the layer took presses before the modal showed');
  settle();
  assert.equal(layer.el.classList.contains('cc-modal'), true);
  assert.equal(press(plane), true, 'a press outside the modal moved the focus');
  const bodyIn = (b) => b.el.querySelector('.cloudcanvas-panel-body');
  assert.equal(press(bodyIn(sheet)), true, 'a press on another panel was not held');
  assert.equal(press(bodyIn(dialog)), false, 'a press inside the modal was held');
  assert.equal(panelOf(dialog).open, true, 'a press outside closed it');
  setPanel(dialog, { open: false });
  assert.equal(layer.el.classList.contains('cc-modal'), false);
  assert.equal(press(plane), false);
});

test('modal - leaving it gives the focus back to the element that had it, one inside the panel only while it shows', (t) => {
  const { layer, settle } = scene(t);
  const field = document.createElement('input');
  const sheet = layer.add(field, { id: 'sheet' });
  settle();
  field.focus();
  setPanel(sheet, { at: 'modal' });
  settle();
  assert.equal(document.activeElement, barOf(sheet));
  setPanel(sheet, { at: 'float' });
  assert.equal(document.activeElement, field, 'the focus did not come back to the field inside the panel');
  setPanel(sheet, { at: 'modal' });
  settle();
  key(barOf(sheet), 'Escape');
  assert.notEqual(document.activeElement, field, 'the focus went into a panel that is no longer shown');
});

test('modal - the focus goes back into a panel it covered, once that is no longer inert', (t) => {
  const { layer, settle } = scene(t);
  const button = document.createElement('button');
  const other = layer.add(button, { id: 'other', at: 'left' });
  settle();
  button.focus();
  const dialog = layer.add(null, { id: 'dialog', at: 'modal' });
  settle();
  assert.equal(other.el.hasAttribute('inert'), true);
  key(barOf(dialog), 'Escape');
  assert.equal(other.el.hasAttribute('inert'), false);
  assert.equal(document.activeElement, button);
});

test('cover - while a panel is modal or full the others are inert, and stop being so after', (t) => {
  const { layer, settle } = scene(t);
  const left = layer.add(null, { id: 'left', at: 'left' });
  const float = layer.add(null, { id: 'float' });
  const right = layer.add(null, { id: 'right', at: 'right' });
  settle();
  const inert = () => [left, float, right].map((b) => b.el.hasAttribute('inert'));
  assert.deepEqual(inert(), [false, false, false]);
  setPanel(float, { at: 'full' });
  assert.deepEqual(inert(), [true, false, true]);
  setPanel(float, { at: 'float' });
  assert.deepEqual(inert(), [false, false, false]);
  setPanel(right, { at: 'modal' });
  settle();
  assert.deepEqual(inert(), [true, true, false]);
  setPanel(right, { open: false });
  assert.deepEqual(inert(), [false, false, false]);
});

test('modal - a prevented dismiss keeps it open and holding the keyboard; moving it elsewhere lets the keyboard go', (t) => {
  const { layer, settle } = scene(t);
  const dialog = layer.add(null, { id: 'dialog', at: 'modal' });
  settle();
  dialog.el.addEventListener('dismiss', (event) => event.preventDefault());
  key(barOf(dialog), 'Escape');
  assert.equal(panelOf(dialog).open, true);
  assert.equal(dialog.el.getAttribute('aria-modal'), 'true');
  setPanel(dialog, { at: 'float' });
  assert.equal(dialog.el.hasAttribute('aria-modal'), false);
  assert.equal(document.activeElement, barOf(dialog), 'a modal that only moved lost the focus');
  key(barOf(dialog), 'Escape');
  assert.equal(panelOf(dialog).open, true, 'Escape closed a panel that is no modal');
});
