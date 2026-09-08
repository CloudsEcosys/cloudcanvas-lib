/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The display component a *slotted* custom type renders through.
 *
 * A flat custom type is a `card`: one title, one body, one field bag. A slotted
 * one is a stack of named regions - a header above a body, each its own set of
 * fields - and that is a different subtree, so it is a different display type.
 * Rather than hand-write a `DisplayTrait` subclass for it (`../../src/pins/traits/display.js`
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
 */

import {
  defineComponent,
  makeElement,
  makeTextNode,
  setText,
  setVisible
} from '../../src/index.js';
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

/**
 * Build one region per slot, and one text line per field inside it.
 *
 * The `data-slot-name` attribute is the region's public handle: the stylesheet
 * emphasises the first (header) region through it, and a test reads it to prove
 * the regions are genuinely separate elements rather than one run of text.
 */
function build(pin, contentEl) {
  const stack = makeElement('div', STACK_CLASS);
  const regions = [];

  for (const slot of slotsOf(pin.contents)) {
    const region = makeElement('section', SLOT_CLASS);
    region.dataset.slotName = slot && typeof slot.name === 'string' ? slot.name : '';

    const lines = [];
    for (const field of (slot && Array.isArray(slot.fields) ? slot.fields : [])) {
      const line = makeElement('div', FIELD_CLASS);
      line.dataset.slotFieldKey = field && typeof field.key === 'string' ? field.key : '';
      lines.push({ element: line, node: makeTextNode(line) });
      region.appendChild(line);
    }

    stack.appendChild(region);
    regions.push({ lines });
  }

  contentEl.replaceChildren(stack);
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

/** @returns {import('../../src/pins/traits/define-component.js').ComponentHandle} */
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
