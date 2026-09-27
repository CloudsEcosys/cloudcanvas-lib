/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Text: a run of prose as a Pin.
 *
 * The only decision this display type makes that it cannot take back is the
 * element it is: `as` picks a real `<p>`, `<h2>` or `<label>` at build time,
 * because a heading that is a `<span>` with heading-sized type is not a heading
 * to anything that reads the page. `DisplayTrait` builds a subtree once per
 * display signature, so the tag is fixed for the life of the Pin - which is the
 * honest shape of the decision anyway: a paragraph does not become a heading.
 *
 * Tone, size and weight are published as the modifier classes `../styles.js`
 * already selects on. They are written with `classList.toggle`, never
 * `className =`: the assignment would take the structural classes down with it,
 * and `toggle` only touches the attribute when the token set actually changes,
 * so an idle frame still performs no DOM write. No colour or metric is decided
 * here - the widget states which variant it is, the sheet states what that
 * variant looks like, in tokens.
 */

import {
  defineComponent,
  makeElement,
  makeTextNode,
  setText
} from '../../.plugin/index.js';

/** Registry name, and the `type` a caller creates a Pin by. */
const NAME = 'text';

/** Class the shared stylesheet hangs every Text rule off. */
const ROOT_CLASS = 'cloudcanvas-lib-text';

/**
 * Tags a Text Pin may be built as.
 *
 * A closed set rather than "whatever the caller passed": `as` reaches
 * `document.createElement` directly, and an open one turns a content value into
 * an element-name injection.
 */
const TAGS = new Set(['span', 'p', 'h1', 'h2', 'h3', 'h4', 'label']);

const SIZES = ['xs', 'sm', 'md', 'lg'];

/** `regular` is the base rule, so it is the absence of a weight modifier. */
const WEIGHTS = ['medium', 'semibold'];

/** The content keys a Text Pin accepts; anything else is refused by `setContents`. */
const ALLOWED_KEYS = ['text', 'as', 'tone', 'size', 'weight'];

/** A member of `values`, or the stated default. */
function oneOf(values, value, fallback) {
  return values.includes(value) ? value : fallback;
}

/** Build once: the chosen element and the one Text node its content lives in. */
function build(pin, contentEl) {
  const tag = TAGS.has(pin.contents.get('as')) ? pin.contents.get('as') : 'span';
  const root = makeElement(tag, ROOT_CLASS);
  const label = makeTextNode(root);
  contentEl.replaceChildren(root);
  return { root, label };
}

/** Mutate after: the text through `Text.data`, the variants through the class list. */
function update(pin, contents, bindings) {
  setText(bindings.label, contents.get('text'));

  const size = oneOf(SIZES, contents.get('size'), 'md');
  const weight = oneOf(WEIGHTS, contents.get('weight'), 'regular');
  const classes = bindings.root.classList;

  for (const name of SIZES) classes.toggle(`${ROOT_CLASS}-${name}`, name === size);
  for (const name of WEIGHTS) classes.toggle(`${ROOT_CLASS}-${name}`, name === weight);
  classes.toggle(`${ROOT_CLASS}-muted`, contents.get('tone') === 'muted');
}

/**
 * Registration is lazy and memoised, never an import-time side effect: importing
 * a widget must not mutate the shared trait registry, and `defineComponent`
 * throws on a duplicate name, so a second call has to return the first handle
 * rather than register again.
 */
let handle = null;

/** @returns {{name: string, createTrait: Function}} the component handle */
export function registerText() {
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

/**
 * Create a Text Pin on `session`.
 *
 * `chrome: false` goes to `createPin` itself, not to the component defaults: the
 * root element's class is decided from the raw Pin options before any trait is
 * resolved, so a component that draws its own surface has to say so here. It is
 * written first so a caller who genuinely wants the card back can override it,
 * and `type` is written last so a caller cannot accidentally break the identity.
 */
export function createTextPin(session, options = {}) {
  registerText();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
