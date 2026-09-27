/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The display component a *slotted* custom type renders through.
 *
 * A flat custom type is a `card`: one title, one body, one field bag. A slotted
 * one is a stack of named regions - a header above a body, each its own set of
 * fields - and that is a different subtree, so it is a different display type.
 * Rather than hand-write a `DisplayTrait` subclass for it (`../../.plugin/pins/traits/display.js`
 * and the churn that comes with re-deriving the build-once/mutate-after contract),
 * this is the same `defineComponent` path every `lib/` widget takes: a `build`
 * that constructs the regions once and an `update` that only writes text into
 * them, so node identity is stable and an idle frame performs no DOM write.
 *
 * The layout is read from the Pin's own contents, not from the type definition:
 * the `slots` content key carries each region's name and its `{key, kind, value}`
 * fields in full (`customTypeSlotContents`), so the component renders a placed,
 * reloaded or exported Pin with no reach back into `localStorage`. `build` reads
 * that shape once - the display signature is stable for the life of a slotted Pin,
 * so its structure is fixed the moment it is placed - and `update` writes the
 * current values back into the text nodes `build` handed up.
 *
 * Text travels through `Text.data` (`setText`), which the DOM escapes, so a slot
 * value is prose and never markup - the same XSS story the built-in card tells.
 *
 * A shim over the core type: each distinct region/field *shape* is one
 * `type('cc-slotted:<shape>', {template})`, built with DOM calls (names are data,
 * so they never pass through markup) and holding one text-only `[data-slot]` per
 * field line, `"<region>.<field>"`. `build` clones that type; `update` writes text.
 * The shape key is the only structure, so equal shapes share one template.
 */

import {
  defineComponent,
  makeElement,
  makeTextNode,
  setText,
  setVisible
} from '../../.plugin/index.js';
import { type } from '../../.plugin/core/index.js';
import { mountType } from '../../.plugin/addons/types.js';
import { TYPE_NAME_KEY } from './custom-types.js';

/** Registry name, and the `type` a slotted instance is created by. */
export const SLOTTED_TYPE = 'cc-slotted';

/**
 * The content keys a slotted Pin may carry; anything else `setContents` refuses.
 * `slots` is the render data; `TYPE_NAME_KEY` is the source-type back-reference a
 * placed instance carries (`custom-types.js`), listed here so the same instance
 * identity a flat card gets for free (a card has no `allowedKeys`) is legal on a
 * slotted one too. Neither the `build` below nor `update` reads the type name; it
 * rides for the push-update machinery and the serializer alone.
 */
const ALLOWED_KEYS = ['slots', TYPE_NAME_KEY];

/** Class the region stack hangs off; styled by `../styles-display-css.js`. */
const STACK_CLASS = 'cloudcanvas-pin-slots';

/** Class one region carries; the stylesheet separates adjacent ones. */
const SLOT_CLASS = 'cloudcanvas-pin-slot';

/** Class a single field line inside a region carries. */
const FIELD_CLASS = 'cloudcanvas-pin-slot-field';

/** The slots content value as an array, or an empty one when it is missing or malformed. */
function slotsOf(contents) {
  const value = contents.get('slots');
  return Array.isArray(value) ? value : [];
}

/** A slot field's value rendered as the line of text a region shows. */
function fieldText(field) {
  if (!field || typeof field !== 'object') return '';
  const { value } = field;
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? '✓' : '';
  return String(value);
}

/** The structure a slots value describes: each region's name and its field keys, strings only. */
function shapeOf(slots) {
  const text = (value) => (typeof value === 'string' ? value : '');
  return slots.map((slot) => ({
    name: text(slot?.name),
    keys: (Array.isArray(slot?.fields) ? slot.fields : []).map((field) => text(field?.key))
  }));
}

/**
 * The core type for one shape, defined on first use. The `data-slot-name` and
 * `data-slot-field-key` attributes are the regions' public handles (the
 * stylesheet emphasises the header region through them; tests read them).
 */
function shapeType(shape) {
  const name = `${SLOTTED_TYPE}:${JSON.stringify(shape)}`;
  const known = type(name);
  if (known) return known.el;

  const template = document.createElement('template');
  const stack = makeElement('div', STACK_CLASS);
  shape.forEach((slot, slotIndex) => {
    const region = makeElement('section', SLOT_CLASS);
    region.dataset.slotName = slot.name;
    slot.keys.forEach((key, fieldIndex) => {
      const line = makeElement('div', FIELD_CLASS);
      line.dataset.slotFieldKey = key;
      line.dataset.slot = `${slotIndex}.${fieldIndex}`;
      region.appendChild(line);
    });
    stack.appendChild(region);
  });
  template.content.appendChild(stack);
  return type(name, { template }).el;
}

/** Clone the shape's type into the content element; bind a text node in every field line. */
function build(pin, contentEl) {
  const shape = shapeOf(slotsOf(pin.contents));
  const lines = mountType(shapeType(shape), contentEl);
  const regions = shape.map((slot, slotIndex) => ({
    lines: slot.keys.map((key, fieldIndex) => {
      const element = lines[`${slotIndex}.${fieldIndex}`];
      return { element, node: makeTextNode(element) };
    })
  }));
  return { regions };
}

/**
 * Write each field's current value into its line, hiding an empty one so a region
 * with a filled header and a blank subtitle does not paint a hollow row.
 */
function update(pin, contents, bindings) {
  const slots = slotsOf(contents);

  bindings.regions.forEach((region, slotIndex) => {
    const fields = slots[slotIndex] && Array.isArray(slots[slotIndex].fields) ? slots[slotIndex].fields : [];
    region.lines.forEach((line, fieldIndex) => {
      const text = fieldText(fields[fieldIndex]);
      setText(line.node, text);
      setVisible(line.element, text !== '');
    });
  });
}

/**
 * Registration is lazy and memoised, the same contract `lib/`'s widgets keep:
 * importing this module must not touch the shared registry, and `defineComponent`
 * throws on a duplicate name, so a second call returns the first handle.
 */
let handle = null;

/** @returns {import('../../.plugin/pins/traits/define-component.js').ComponentHandle} */
export function registerSlottedType() {
  if (!handle) {
    handle = defineComponent({
      name: SLOTTED_TYPE,
      build,
      update,
      allowedKeys: ALLOWED_KEYS
    });
  }
  return handle;
}
