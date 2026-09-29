/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Input: a real `<input>` - or `<textarea>` - and its `<label for>`, as a widget.
 *
 *   registerInput();
 *   const name = createInput(app, { x: 40, y: 40, label: 'Name', placeholder: 'who?' });
 *   name.on('change', (event) => save(event.detail.payload));
 *
 * Two things separate this from every other control in the kit.
 *
 *   - **The edit lock is the design.** Every write re-renders, and an editor
 *     lives inside the render: a render during a keystroke takes the caret, the
 *     selection and the half-typed word with it. So `focus` takes the blit's edit
 *     lock (`cloudcanvas/edit`) and `blur` commits the typed value and then
 *     releases it - in that order, because `end` replays exactly one deferred
 *     render and it must find the committed value already in place. Nothing
 *     touches the contents in between: keystrokes go out as a live `input`
 *     event, so a consumer can follow them, while the value a render reads stays
 *     where the user left it.
 *   - **Both controls are in the template.** `multiline` chooses between them and
 *     visibility picks one: hide it, do not rebuild it.
 *
 * The accessible name is the native one: a `<label for>` pointing at an id
 * derived from the blit's element id. No `aria-label` is written.
 */
import { blit } from '../../.plugin/core/index.js';
import { begin, end } from '../../.plugin/addons/edit.js';
import { leadingText, setAttr, setContent, setVisible, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { asText } from '../coerce.js';
import { injectLibStyles } from '../styles.js';
import { nameControl, renderLabel, setFlag, stopAtControl } from './control.js';

/** The type name. */
const NAME = 'input';

const ROOT_CLASS = 'cloudcanvas-lib-input';
const LABEL_CLASS = 'cloudcanvas-lib-input-label';
const CONTROL_CLASS = 'cloudcanvas-lib-input-control';

/**
 * The `type` attributes a single-line Input accepts, and its default.
 * A closed set: the value is written straight onto a live form control.
 */
const TYPES = new Set(['text', 'email', 'password', 'number']);
const DEFAULT_TYPE = 'text';

/** Close the edit: commit the typed value, release the lock (its one replay finds the commit), announce it. */
function commit(b, control) {
  setContent(b, 'value', control.value);
  end(b);
  b.emit('change', control.value);
}

/** Wire one control into the edit-lock contract. Both controls get all four listeners. */
function wire(b, on, control) {
  on(control, 'focus', () => begin(b, control));
  // Live, and deliberately content-free: nothing re-renders mid-word.
  on(control, 'input', (event) => {
    stopAtControl(event);
    b.emit('input', control.value);
  });
  // The blit's `change` is the commit on blur.
  on(control, 'change', stopAtControl);
  on(control, 'blur', () => commit(b, control));
}

/** The label and both controls, named from the blit's element id, and their listeners. */
function bind(host, on) {
  const b = blit(host);
  const root = host.querySelector(`.${ROOT_CLASS}`);
  const label = root.querySelector(`.${LABEL_CLASS}`);
  const single = root.querySelector('input');
  const multi = root.querySelector('textarea');
  nameControl(host, single, 'control');
  nameControl(host, multi, 'control-multiline');
  wire(b, on, single);
  wire(b, on, multi);
  return { root, label, labelText: leadingText(label), single, multi };
}

/** `placeholder`, `disabled` and `required` for one control. */
function applyState(control, contents, cache, key) {
  setAttr(control, 'placeholder', asText(contents.get('placeholder')), cache, `${key}:placeholder`);
  setFlag(control, 'disabled', contents.get('disabled'));
  setFlag(control, 'required', contents.get('required'));
}

/** Which control is live, what names it, and what it holds. */
function render(bindings, contents, cache) {
  const multiline = contents.get('multiline') === true;
  const control = multiline ? bindings.multi : bindings.single;

  setVisible(bindings.single, !multiline);
  setVisible(bindings.multi, multiline);
  // The label names whichever control is showing.
  setAttr(bindings.label, 'for', control.id, cache, 'for');
  renderLabel(bindings.label, bindings.labelText, contents.get('label'));

  const type = contents.get('type');
  setAttr(bindings.single, 'type', TYPES.has(type) ? type : DEFAULT_TYPE, cache, 'type');
  applyState(bindings.single, contents, cache, 'single');
  applyState(bindings.multi, contents, cache, 'multi');

  // Only the live control carries the value; the other is written by the render that reveals it.
  const value = asText(contents.get('value'));
  if (control.value !== value) control.value = value;
}

const SPEC = Object.freeze({
  name: NAME,
  html: `<div class="${ROOT_CLASS}"><label class="${LABEL_CLASS}"></label>`
    + `<input class="${CONTROL_CLASS}"><textarea class="${CONTROL_CLASS}" hidden></textarea></div>`,
  keys: ['label', 'value', 'placeholder', 'type', 'multiline', 'disabled', 'required'],
  bind,
  render
});

/** Define the Input widget, once. @returns {object} its type */
export function registerInput() {
  injectLibStyles();
  return widget(SPEC);
}

/** A chromeless Input blit in `parent`; its contents may come flat or as `contents`. */
export function createInput(parent, options = {}) {
  registerInput();
  return parent.blit(widgetSpec(NAME, { chrome: false, ...options }));
}
