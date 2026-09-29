/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Radio, and the group widget that holds a set of them.
 *
 *   const size = createRadioGroup(app, { label: 'Size', group: 'size', value: 'm',
 *     options: [{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium' }] });
 *   size.on('change', (event) => console.log(event.detail.payload.value));
 *
 * Mutual exclusion is the platform's, not ours: the `group` content key becomes
 * the native `name` attribute, and the browser deselects every other radio
 * carrying it - across blit boundaries, because `name` is document-scoped. There
 * is no selection logic in this file, and there must never be.
 *
 * What that costs is contents that can go stale: the radio the platform switched
 * off fires no event, so its contents still say checked. Two answers, both
 * below. The change handler tells its siblings (`b.parent.blits`), and the render
 * writes `checked` only when the *contents* moved - never merely because the DOM
 * disagrees - so re-rendering a stale sibling cannot take the selection back.
 *
 * A consumer listens on the group: a child's `change` bubbles to it with no
 * wiring in the group at all. The group's element is its own scope
 * (`data-scope`), so its radios sit under its caption.
 */
import { blit } from '../../.plugin/core/index.js';
import { contentOf, leadingText, setAttr, setContent, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { asText } from '../coerce.js';
import { injectLibStyles } from '../styles.js';
import { hostId, linkLabel, renderLabel, setFlag, stopAtControl } from './control.js';

/** The type names. */
const NAME = 'radio';
const GROUP_NAME = 'radio-group';

const ROOT_CLASS = 'cloudcanvas-lib-radio';
const CONTROL_CLASS = 'cloudcanvas-lib-radio-control';
const LABEL_CLASS = 'cloudcanvas-lib-radio-label';
const GROUP_CLASS = 'cloudcanvas-lib-radio-group';
const GROUP_LABEL_CLASS = 'cloudcanvas-lib-radio-group-label';

/**
 * Tell the siblings the platform just deselected.
 * Their DOM is already right; this is only their contents catching up.
 */
function deselectSiblings(b, group) {
  if (!b.parent || !group) return;
  for (const sibling of b.parent.blits) {
    if (sibling === b) continue;
    const contents = contentOf(sibling);
    if (contents.group === group && contents.checked === true) setContent(sibling, 'checked', false);
  }
}

/** A radio only ever fires `change` on the way in; the one going out is silent. */
function onChange(b, control, event) {
  stopAtControl(event);
  if (!control.checked) return;
  setContent(b, 'checked', true);
  const { group, value } = contentOf(b);
  deselectSiblings(b, group);
  b.emit('change', { value });
}

/** The control and its label, named from the blit's element id, and the change listener. */
function bind(host, on) {
  const b = blit(host);
  const root = host.querySelector(`.${ROOT_CLASS}`);
  const control = root.querySelector(`.${CONTROL_CLASS}`);
  const label = root.querySelector(`.${LABEL_CLASS}`);
  linkLabel(host, control, label);
  on(control, 'change', (event) => onChange(b, control, event));
  return { root, control, label, labelText: leadingText(label) };
}

/** The label, the group name and value, and the checked state. */
function render(bindings, contents, cache) {
  const { control } = bindings;
  renderLabel(bindings.label, bindings.labelText, contents.get('label'));
  setAttr(control, 'name', asText(contents.get('group')), cache, 'name');
  setAttr(control, 'value', asText(contents.get('value')), cache, 'value');

  // Gated on what this render last wrote, not on what the DOM now holds: a
  // sibling's selection legitimately flipped this element without the contents
  // moving, and re-asserting it here would undo the user's choice.
  const checked = contents.get('checked') === true;
  if (cache.checked !== checked) {
    cache.checked = checked;
    control.checked = checked;
  }
  setFlag(control, 'disabled', contents.get('disabled'));
}

/** The group's caption; its radios are its child blits. */
function bindGroup(host) {
  const label = host.querySelector(`.${GROUP_LABEL_CLASS}`);
  return { label, labelText: leadingText(label) };
}

function renderGroup(bindings, contents) {
  renderLabel(bindings.label, bindings.labelText, contents.get('label'));
}

const SPEC = Object.freeze({
  name: NAME,
  html: `<div class="${ROOT_CLASS}"><input class="${CONTROL_CLASS}" type="radio">`
    + `<label class="${LABEL_CLASS}"></label></div>`,
  keys: ['label', 'group', 'value', 'checked', 'disabled'],
  bind,
  render
});

const GROUP_SPEC = Object.freeze({
  name: GROUP_NAME,
  html: `<div class="${GROUP_CLASS}" data-scope><span class="${GROUP_LABEL_CLASS}"></span></div>`,
  keys: ['label'],
  bind: bindGroup,
  render: renderGroup
});

/** Define the Radio widget, once. @returns {object} its type */
export function registerRadio() {
  injectLibStyles();
  return widget(SPEC);
}

/** Define the radio group widget, once. @returns {object} its type */
export function registerRadioGroup() {
  injectLibStyles();
  return widget(GROUP_SPEC);
}

/** A chromeless Radio blit in `parent`; its contents may come flat or as `contents`. */
export function createRadio(parent, options = {}) {
  registerRadio();
  return parent.blit(widgetSpec(NAME, { chrome: false, ...options }));
}

/**
 * A group blit in `parent` with one child Radio per choice.
 *
 * The children share one native `name`, which is the whole of the exclusion. An
 * absent `group` falls back to one derived from the group's element id, so two
 * groups on one canvas cannot collide by accident.
 *
 * @param {object} parent a root blit, or any blit
 * @param {object} [config] the group's spec and `label`, plus:
 * @param {string} [config.group] the native `name` its radios share
 * @param {Array<{value: *, label: string}>} [config.options] the choices
 * @param {*} [config.value] the value of the initially selected choice
 * @returns {object} the group blit, parent of the radios
 */
export function createRadioGroup(parent, config = {}) {
  const { group, options: choices = [], value, ...spec } = config;
  registerRadioGroup();
  const groupBlit = parent.blit(widgetSpec(GROUP_NAME, { chrome: false, ...spec }));
  const name = group || `${hostId(groupBlit.el)}-group`;
  for (const choice of choices) {
    createRadio(groupBlit, { label: choice.label, group: name, value: choice.value, checked: choice.value === value });
  }
  return groupBlit;
}
