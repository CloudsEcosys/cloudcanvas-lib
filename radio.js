/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Radio, and the group Pin that mounts a set of them.
 *
 * Mutual exclusion is the platform's, not ours: the `group` content key becomes
 * the native `name` attribute, and the browser deselects every other radio
 * carrying it - across Pin boundaries, because `name` is document-scoped. There
 * is no selection logic in this file, and there must never be.
 *
 * What that costs is a model that can go stale: the radio the platform switched
 * off fires no event, so its Pin still believes it is checked. Two answers, both
 * below. The change handler tells its siblings (they are children of one group
 * Pin, which is how it can find them), and the update pass writes `checked` only
 * when the *model* moved - never merely because the DOM disagrees - so
 * re-rendering a stale sibling cannot take the selection back.
 *
 * A consumer listens on the group Pin: `transmit` walks the scope chain, so a
 * child's `change` arrives there with no wiring in the group at all.
 */

import {
  defineComponent,
  makeElement,
  makeTextNode,
  setAttr,
  setText,
  setVisible,
  PinEvent
} from '../.plugin/index.js';
import { asText } from './coerce.js';

/** Registry names, and the `type`s a caller creates these Pins by. */
const NAME = 'radio';
const GROUP_NAME = 'radio-group';

const ROOT_CLASS = 'cloudcanvas-lib-radio';
const CONTROL_CLASS = 'cloudcanvas-lib-radio-control';
const LABEL_CLASS = 'cloudcanvas-lib-radio-label';
const GROUP_CLASS = 'cloudcanvas-lib-radio-group';
const GROUP_LABEL_CLASS = 'cloudcanvas-lib-radio-group-label';

const ALLOWED_KEYS = ['label', 'group', 'value', 'checked', 'disabled'];

/** The group Pin renders one caption; the radios themselves are its child Pins. */
const GROUP_ALLOWED_KEYS = ['label'];

/**
 * Tell the siblings the platform just deselected.
 * Their DOM is already right; this is only their model catching up.
 */
function deselectSiblings(pin, group) {
  if (!pin.parent || !group) return;

  for (const sibling of pin.parent.children) {
    if (sibling === pin || sibling.contents.get('group') !== group) continue;
    if (sibling.contents.get('checked') === true) sibling.setContent('checked', false);
  }
}

/** Build once: the control, its label, and the change listener. */
function build(pin, contentEl) {
  const root = makeElement('div', ROOT_CLASS);

  const control = makeElement('input', CONTROL_CLASS);
  control.setAttribute('type', 'radio');
  control.id = `${pin.id}-control`;

  const label = makeElement('label', LABEL_CLASS);
  label.setAttribute('for', control.id);
  const labelText = makeTextNode(label);

  control.addEventListener('change', () => {
    // A radio only ever fires `change` on the way in; the one going out is silent.
    if (!control.checked) return;
    pin.setContent('checked', true);
    deselectSiblings(pin, pin.contents.get('group'));
    pin.transmit(new PinEvent('change', {
      payload: { value: pin.contents.get('value') },
      bubbles: true,
      source: pin
    }));
  });

  root.appendChild(control);
  root.appendChild(label);
  contentEl.replaceChildren(root);

  return { root, control, label, labelText };
}

/** Mutate after: the label, the group name and value, and the checked state. */
function update(pin, contents, bindings, cache) {
  const { control } = bindings;

  const label = contents.get('label');
  setText(bindings.labelText, label);
  setVisible(bindings.label, Boolean(label));

  setAttr(control, 'name', asText(contents.get('group')), cache, 'name');
  setAttr(control, 'value', asText(contents.get('value')), cache, 'value');

  // Gated on what this pass last wrote, not on what the DOM now holds: a
  // sibling's selection legitimately flipped this element without the model
  // moving, and re-asserting it here would undo the user's choice.
  const checked = contents.get('checked') === true;
  if (cache.checked !== checked) {
    cache.checked = checked;
    control.checked = checked;
  }

  const disabled = contents.get('disabled') === true;
  if (control.disabled !== disabled) control.disabled = disabled;
}

/** The group's own subtree: one optional caption above its scope well of radios. */
function buildGroup(pin, contentEl) {
  const root = makeElement('div', GROUP_CLASS);
  const label = makeElement('span', GROUP_LABEL_CLASS);
  const labelText = makeTextNode(label);
  root.appendChild(label);
  contentEl.replaceChildren(root);
  return { root, label, labelText };
}

function updateGroup(pin, contents, bindings) {
  const label = contents.get('label');
  setText(bindings.labelText, label);
  setVisible(bindings.label, Boolean(label));
}

/** Lazy, memoised registration; see `./button.js` on why it is never at import time. */
let handle = null;
let groupHandle = null;

/** @returns {import('../.plugin/pins/traits/define-component.js').ComponentHandle} */
export function registerRadio() {
  if (!handle) {
    handle = defineComponent({
      name: NAME,
      build,
      update,
      chrome: false,
      allowedKeys: ALLOWED_KEYS
    });
  }
  return handle;
}

/** @returns {import('../.plugin/pins/traits/define-component.js').ComponentHandle} */
export function registerRadioGroup() {
  if (!groupHandle) {
    groupHandle = defineComponent({
      name: GROUP_NAME,
      build: buildGroup,
      update: updateGroup,
      chrome: false,
      allowedKeys: GROUP_ALLOWED_KEYS
    });
  }
  return groupHandle;
}

/** Create a single Radio Pin on `session`; see `./text.js` on the option order. */
export function createRadioPin(session, options = {}) {
  registerRadio();
  return session.createPin({ chrome: false, ...options, type: NAME });
}

/**
 * Create a group Pin with one child Radio per choice.
 *
 * The children share one native `name`, which is the whole of the exclusion. An
 * absent `group` falls back to the group Pin's own id, so two groups on one
 * canvas cannot collide by accident.
 *
 * @param {object} session a CloudCanvasSession
 * @param {object} [config] Pin options for the group, plus:
 * @param {string} [config.group] the native `name` its radios share
 * @param {Array<{value: *, label: string}>} [config.options] the choices
 * @param {*} [config.value] the value of the initially selected choice
 * @returns {object} the group Pin, parent of the radios
 */
export function createRadioGroupPin(session, config = {}) {
  const { group, options: choices = [], value, ...pinOptions } = config;
  registerRadioGroup();

  const groupPin = session.createPin({ chrome: false, ...pinOptions, type: GROUP_NAME });
  const name = group || `${groupPin.id}-group`;

  for (const choice of choices) {
    createRadioPin(session, {
      parent: groupPin,
      contents: {
        label: choice.label,
        group: name,
        value: choice.value,
        checked: choice.value === value
      }
    });
  }

  return groupPin;
}
