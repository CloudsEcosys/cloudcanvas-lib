/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The kit's seven form controls as widgets: button, input, checkbox, radio (and
 * its group), toggle, slider, select.
 *
 * What is under test is the contract a consumer depends on, not the markup:
 * definition that is a call rather than an import-time side effect, `chrome:
 * false` reaching the blit, a real native element per widget, the declared keys
 * enforced where they bite, the characteristic interaction arriving as the
 * blit's own bubbling event, and the two delicate places - the Input's edit lock
 * and the Radio group's platform-owned exclusion.
 *
 * Interactions are driven on the real elements under the blit, the same nodes
 * the render writes through.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { runFrame } from 'cloudcanvas/testing';
import { isEditing } from '../../plugins/edit.js';
import { contentOf, isWidget, setContent, setContents } from '../../plugins/widget.js';
import { registerButton, createButton } from '../../forms/button.js';
import { registerInput, createInput } from '../../forms/input.js';
import { registerCheckbox, createCheckbox } from '../../forms/checkbox.js';
import { registerRadio, registerRadioGroup, createRadio, createRadioGroup } from '../../forms/radio.js';
import { registerToggle, createToggle } from '../../forms/toggle.js';
import { registerSlider, createSlider } from '../../forms/slider.js';
import { registerSelect, createSelect } from '../../forms/select.js';
import { registerForms } from '../../forms/index.js';
import { coreScene, signals } from '../helpers/core-scene.js';

/** Every widget in this half of the kit, as `[type, factory]`. */
const WIDGETS = [
  ['button', createButton],
  ['input', createInput],
  ['checkbox', createCheckbox],
  ['radio', createRadio],
  ['toggle', createToggle],
  ['slider', createSlider],
  ['dropdown', createSelect]
];

/** The node under a blit's element. */
function nodeOf(b, selector) {
  return b.el.querySelector(selector);
}

/** The payloads of every `type` event the blit hears. */
function payloads(b, type) {
  const seen = signals(b, type);
  return { get values() { return seen.map((each) => each.payload); } };
}

/** Re-render with the contents unchanged: the trait restarts, bind reruns, render runs. */
function rerender(b) {
  setContents(b, {});
}

/**
 * Importing a widget must not define it. First test in the file on purpose:
 * every module above is already imported, so this is the one moment the claim
 * can be observed.
 */
test('lib/forms - importing a widget defines nothing; register() is a call, and idempotent', () => {
  for (const [type] of WIDGETS) assert.equal(isWidget(type), false, `importing "${type}" defined it`);
  assert.equal(isWidget('radio-group'), false);

  const first = registerButton();
  assert.equal(registerButton(), first, 'a second call defined again instead of returning the type');
  assert.equal(first.el.tagName, 'TEMPLATE');
  assert.equal(first.el.getAttribute('data-type'), 'button');

  const registrars = [registerInput, registerCheckbox, registerRadio, registerRadioGroup, registerToggle, registerSlider, registerSelect];
  for (const register of registrars) assert.equal(register().el.tagName, 'TEMPLATE');
  assert.deepEqual(registerForms(), ['button', 'input', 'checkbox', 'radio', 'radio-group', 'toggle', 'slider', 'dropdown']);
});

test('lib/forms - every factory creates a chromeless blit of its own type', (t) => {
  const { app } = coreScene(t);
  for (const [type, create] of WIDGETS) {
    const b = create(app);
    assert.equal(b.parent, app);
    assert.equal(b.el.getAttribute('data-type'), type);
    assert.equal(b.el.getAttribute('data-chrome'), 'false', `${type}: chrome:false never reached the blit`);
  }
});

test('lib/forms - a caller can still ask for the card back, and contents come flat or nested', (t) => {
  const { app } = coreScene(t);
  assert.equal(createButton(app, { chrome: true }).el.getAttribute('data-chrome'), 'true');
  assert.deepEqual(contentOf(createButton(app, { contents: { label: 'Nested' } })), { label: 'Nested' });
  assert.deepEqual(contentOf(createButton(app, { label: 'Flat', x: 12 })), { label: 'Flat' });
});

test('lib/forms - an unknown content key is refused', (t) => {
  const { app } = coreScene(t);
  for (const [type, create] of WIDGETS) {
    const b = create(app);
    assert.throws(() => setContents(b, { nonsense: 1 }), /key "nonsense" not permitted/, `${type}: accepted an unknown key`);
  }
});

test('lib/forms - a control is named from the blit id, with a stable fallback when there is none', (t) => {
  const { app } = coreScene(t);
  const named = createCheckbox(app, { id: 'agree', label: 'Agree' });
  assert.equal(nodeOf(named, 'input').id, 'agree-control');
  assert.equal(nodeOf(named, 'label').getAttribute('for'), 'agree-control');

  const first = createCheckbox(app, { label: 'One' });
  const second = createCheckbox(app, { label: 'Two' });
  const id = nodeOf(first, 'input').id;
  assert.ok(id, 'an unnamed blit left its control unnamed');
  assert.notEqual(id, nodeOf(second, 'input').id, 'two unnamed blits share a control id');
  setContent(first, 'label', 'Still one');
  assert.equal(nodeOf(first, 'input').id, id, 'a write renamed the control');
  assert.equal(nodeOf(first, 'label').getAttribute('for'), id);
});

test('Button - a real <button type="button"> whose press is the native click', (t) => {
  const { app } = coreScene(t);
  const b = createButton(app, { label: 'Save' });
  const root = nodeOf(b, 'button');

  assert.equal(root.getAttribute('type'), 'button');
  assert.equal(root.classList.contains('cloudcanvas-lib-button'), true);
  assert.equal(root.textContent, 'Save');

  let presses = 0;
  b.on('click', () => { presses += 1; });
  root.click();
  assert.equal(presses, 1);

  // A disabled control is not a control: its activation is declined.
  setContent(b, 'disabled', true);
  assert.equal(root.disabled, true);
  root.click();
  assert.equal(presses, 1, 'a disabled button was pressed');
});

test('Button - the variant is one modifier class, and an unrelated write moves nothing', (t) => {
  const { app } = coreScene(t);
  const b = createButton(app, { label: 'Save' });
  const root = nodeOf(b, 'button');
  const label = root.firstChild;

  assert.equal(root.classList.contains('cloudcanvas-lib-button-secondary'), true, 'no default variant');
  setContent(b, 'variant', 'danger');
  assert.equal(root.classList.contains('cloudcanvas-lib-button-danger'), true);
  assert.equal(root.classList.contains('cloudcanvas-lib-button-secondary'), false, 'the old modifier survived');
  assert.equal(root.classList.contains('cloudcanvas-lib-button'), true, 'the root class was lost');

  setContent(b, 'disabled', false);
  assert.equal(nodeOf(b, 'button'), root, 'the element was rebuilt');
  assert.equal(root.firstChild, label, 'the text node was rebuilt');
  assert.equal(label.data, 'Save');
});

test('Input - a labelled native control, with the textarea in the template and hidden', (t) => {
  const { app } = coreScene(t);
  const b = createInput(app, { id: 'who', label: 'Name', value: 'ada', placeholder: 'who?' });
  const single = nodeOf(b, 'input');
  const multi = nodeOf(b, 'textarea');
  const label = nodeOf(b, 'label');

  assert.equal(single.getAttribute('type'), 'text');
  assert.equal(single.value, 'ada');
  assert.equal(single.getAttribute('placeholder'), 'who?');
  assert.equal(single.id, 'who-control');
  assert.equal(multi.id, 'who-control-multiline');

  // The accessible name is the native association, not an aria-label.
  assert.equal(label.getAttribute('for'), single.id);
  assert.equal(single.hasAttribute('aria-label'), false);
  assert.equal(multi.hidden, true);

  setContent(b, 'multiline', true);
  assert.equal(single.hidden, true);
  assert.equal(multi.hidden, false);
  assert.equal(label.getAttribute('for'), multi.id, 'the label kept naming the hidden control');
  assert.equal(multi.value, 'ada');
  assert.equal(nodeOf(b, 'input'), single, 'the swap rebuilt the subtree');

  setContents(b, { type: 'email', multiline: false });
  assert.equal(single.getAttribute('type'), 'email');
  assert.equal(single.disabled, false);

  setContent(b, 'type', 'colour-picker');
  assert.equal(single.getAttribute('type'), 'text', 'an unknown type reached the DOM');
});

test('Input - the edit lock defers a concurrent write until blur commits', (t) => {
  const { app, root } = coreScene(t);
  const b = createInput(app, { label: 'Name', value: 'ada' });
  const single = nodeOf(b, 'input');
  const live = payloads(b, 'input');
  const committed = payloads(b, 'change');

  single.dispatchEvent(new Event('focus'));
  assert.equal(isEditing(b), true, 'focus did not take the edit lock');

  // Typing publishes, but does not commit.
  single.value = 'ada l';
  single.dispatchEvent(new Event('input', { bubbles: true }));
  assert.deepEqual(live.values, ['ada l']);
  assert.equal(contentOf(b).value, 'ada', 'a keystroke wrote through to the contents');

  // A write from outside is deferred, not dropped.
  setContent(b, 'value', 'overwritten');
  assert.equal(single.value, 'ada l', 'the render was not deferred and ate the edit');
  assert.deepEqual(committed.values, []);

  single.dispatchEvent(new Event('blur'));
  assert.equal(isEditing(b), false);
  assert.equal(contentOf(b).value, 'ada l', 'blur did not commit the typed value');
  assert.deepEqual(committed.values, ['ada l']);

  runFrame(root, 1);
  rerender(b);
  assert.equal(single.value, 'ada l', 'the replayed render undid the commit');
});

test('Checkbox - the native change commits and emits the boolean, exactly once', (t) => {
  const { app } = coreScene(t);
  const b = createCheckbox(app, { label: 'Agree' });
  const control = nodeOf(b, 'input');

  assert.equal(control.getAttribute('type'), 'checkbox');
  assert.equal(nodeOf(b, 'label').getAttribute('for'), control.id);
  assert.equal(control.checked, false);

  // The native change bubbles like a user's would; it stops at the control and the blit issues its own.
  const changes = payloads(b, 'change');
  control.checked = true;
  control.dispatchEvent(new Event('change', { bubbles: true }));
  assert.deepEqual(changes.values, [true]);
  assert.equal(contentOf(b).checked, true);

  // No ARIA mirror on a native checkbox: the element already reports itself.
  assert.equal(control.hasAttribute('aria-checked'), false);

  setContent(b, 'checked', false);
  assert.equal(control.checked, false);
});

test('Radio - a group shares one native name, and the platform does the exclusion', (t) => {
  const { app } = coreScene(t);
  const group = createRadioGroup(app, {
    group: 'size',
    value: 'm',
    label: 'Size',
    options: [{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium' }]
  });
  const [small, medium] = group.blits;
  const control = (b) => nodeOf(b, 'input');

  assert.equal(group.blits.length, 2);
  assert.equal(nodeOf(group, '.cloudcanvas-lib-radio-group-label').textContent, 'Size');
  assert.equal(small.el.parentElement.classList.contains('cloudcanvas-lib-radio-group'), true, 'the radios are outside the group');
  assert.equal(control(small).getAttribute('name'), 'size');
  assert.equal(control(medium).getAttribute('name'), 'size');
  assert.equal(control(small).getAttribute('value'), 's');
  assert.equal(control(small).checked, false);
  assert.equal(control(medium).checked, true);

  // A child's change reaches the group with no wiring in the group at all.
  const heard = payloads(group, 'change');
  control(small).click();
  assert.equal(control(small).checked, true);
  assert.equal(control(medium).checked, false, 'happy-dom did not honour name-based exclusion');
  assert.deepEqual(heard.values, [{ value: 's' }]);

  // The contents followed the platform, on both blits...
  assert.equal(contentOf(small).checked, true);
  assert.equal(contentOf(medium).checked, false);

  // ...and re-rendering either of them cannot take the selection back.
  rerender(medium);
  rerender(small);
  assert.equal(control(small).checked, true);
  assert.equal(control(medium).checked, false);
});

test('Radio - a group with no stated name derives one from its element id', (t) => {
  const { app } = coreScene(t);
  const group = createRadioGroup(app, { id: 'plan', options: [{ value: 'a', label: 'A' }] });
  assert.equal(nodeOf(group.blits[0], 'input').getAttribute('name'), 'plan-group');
});

test('Radio - a stale sibling does not steal the selection on re-render', (t) => {
  const { app } = coreScene(t);
  // Two radios under different parents: no sibling sync reaches them, so the only
  // defence left is the render writing `checked` from what it last wrote.
  const first = createRadio(app.blit({}), { label: 'A', group: 'loose', value: 'a', checked: true });
  const second = createRadio(app.blit({}), { label: 'B', group: 'loose', value: 'b' });

  nodeOf(second, 'input').click();
  assert.equal(nodeOf(first, 'input').checked, false, 'the platform did not deselect the first');
  assert.equal(contentOf(first).checked, true, 'this test is no longer about stale contents');

  rerender(first);
  assert.equal(nodeOf(first, 'input').checked, false, 'a stale re-render stole the selection back');
  assert.equal(nodeOf(second, 'input').checked, true);
});

test('Toggle - role=switch with aria-checked kept in step with the property', (t) => {
  const { app } = coreScene(t);
  const b = createToggle(app, { label: 'Live', checked: true });
  const control = nodeOf(b, 'input');

  assert.equal(control.getAttribute('type'), 'checkbox');
  assert.equal(control.getAttribute('role'), 'switch');
  assert.equal(control.getAttribute('aria-checked'), 'true');
  assert.equal(control.checked, true);
  assert.equal(nodeOf(b, 'label').getAttribute('for'), control.id);

  const changes = payloads(b, 'change');
  control.checked = false;
  control.dispatchEvent(new Event('change'));
  assert.deepEqual(changes.values, [false]);
  assert.equal(contentOf(b).checked, false);
  // The commit renders at once, so the announced state is never behind the painted one.
  assert.equal(control.getAttribute('aria-checked'), 'false');

  setContent(b, 'checked', true);
  assert.equal(control.checked, true);
  assert.equal(control.getAttribute('aria-checked'), 'true');
});

test('Slider - the readout follows every tick; only the release commits', (t) => {
  const { app } = coreScene(t);
  const b = createSlider(app, { label: 'Volume', value: 5, min: 0, max: 10, step: 1 });
  const control = nodeOf(b, 'input');
  const readout = nodeOf(b, '.cloudcanvas-lib-slider-value');

  assert.equal(control.getAttribute('type'), 'range');
  assert.equal(control.getAttribute('min'), '0');
  assert.equal(control.getAttribute('max'), '10');
  assert.equal(control.getAttribute('step'), '1');
  assert.equal(control.value, '5');
  assert.equal(readout.textContent, '5');
  assert.equal(nodeOf(b, 'label').getAttribute('for'), control.id);

  const live = payloads(b, 'input');
  const committed = payloads(b, 'change');
  control.value = '8';
  control.dispatchEvent(new Event('input'));
  assert.deepEqual(live.values, [8]);
  assert.equal(readout.textContent, '8', 'the readout did not follow the drag');
  assert.equal(contentOf(b).value, 5, 'a drag tick committed into the contents');

  control.dispatchEvent(new Event('change'));
  assert.deepEqual(committed.values, [8]);
  assert.equal(contentOf(b).value, 8);
});

test('Slider - the bounds are written before the value they clamp', (t) => {
  const { app } = coreScene(t);
  const b = createSlider(app, { value: 750, min: 0, max: 1000 });
  const control = nodeOf(b, 'input');

  assert.equal(control.getAttribute('max'), '1000');
  assert.equal(control.value, '750', 'the value was written against a stale max');

  // A value outside the range is clamped, and an unusable range falls back.
  setContents(b, { value: 5000, min: 0, max: 1000 });
  assert.equal(control.value, '1000');
  setContents(b, { value: 30, min: 0, max: -4 });
  assert.equal(control.getAttribute('max'), '100', 'a max below the min was written through');
  assert.equal(control.value, '30');
});

test('Select - options are reconciled by value, never rebuilt', (t) => {
  const { app } = coreScene(t);
  const b = createSelect(app, {
    label: 'Fruit',
    value: 'b',
    options: [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]
  });
  const control = nodeOf(b, 'select');

  assert.equal(nodeOf(b, 'label').getAttribute('for'), control.id);
  assert.equal(control.options.length, 2);
  assert.equal(control.value, 'b', 'the selection was written before the options existed');

  const [apple, banana] = Array.from(control.options);
  assert.equal(apple.getAttribute('data-cc-key'), 'a');
  assert.equal(apple.textContent, 'Apple');

  // An unrelated write must not touch the list at all.
  setContent(b, 'label', 'Produce');
  assert.deepEqual(Array.from(control.options), [apple, banana], 'the option list was rebuilt');

  // A relabelled key keeps its element; a new key gets one; a dropped key goes.
  setContent(b, 'options', [{ value: 'a', label: 'Apricot' }, { value: 'c', label: 'Cherry' }]);
  assert.equal(control.options.length, 2);
  assert.equal(control.options[0], apple, 'a surviving key was re-created');
  assert.equal(control.options[0].textContent, 'Apricot');
  assert.equal(control.options[1].value, 'c');
  assert.equal(banana.parentNode, null, 'the dropped option was left in the DOM');
});

test('Select - the native change commits and emits the value', (t) => {
  const { app } = coreScene(t);
  const b = createSelect(app, { value: 'a', options: [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }] });
  const control = nodeOf(b, 'select');

  // No label was given, so the visible one is hidden rather than blank.
  assert.equal(nodeOf(b, 'label').hidden, true);

  const changes = payloads(b, 'change');
  control.value = 'b';
  control.dispatchEvent(new Event('change', { bubbles: true }));
  assert.deepEqual(changes.values, ['b']);
  assert.equal(contentOf(b).value, 'b');

  setContent(b, 'disabled', true);
  assert.equal(control.disabled, true);
});

test('Select - with no stated value the platform default stands', (t) => {
  const { app } = coreScene(t);
  const b = createSelect(app, { options: [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }] });
  const control = nodeOf(b, 'select');

  assert.equal('value' in contentOf(b), false);
  assert.equal(control.value, 'a', 'an absent value blanked the field');
  assert.equal(control.selectedIndex, 0);

  // ...and a stated one still wins, including after the list changes under it.
  setContent(b, 'value', 'b');
  assert.equal(control.value, 'b');
  setContent(b, 'options', [{ value: 'a', label: 'Apple' }]);
  assert.equal(control.value, '', 'a value no option carries was reported as held');
});
