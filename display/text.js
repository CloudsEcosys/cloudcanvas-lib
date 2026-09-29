/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Text: a run of prose as a widget.
 *
 *   const title = createText(app, { x: 40, y: 20, text: 'Hello', as: 'h2', size: 'lg' });
 *
 * The one structural decision is the element it is: `as` picks a real `<p>`,
 * `<h2>` or `<label>`, because a heading that is a `<span>` with heading-sized
 * type is not a heading to anything that reads the page. The render keeps the
 * element while `as` is unchanged and swaps it only when `as` moves
 * (`elementAs`), so an ordinary write never rebuilds the node.
 *
 * Tone, size and weight are published as the modifier classes `../styles.js`
 * already selects on, written with `classList.toggle`, never `className =`: the
 * assignment would take the structural class down with it, and `toggle` only
 * touches the attribute when the token set actually changes.
 */
import { leadingText, setText } from '../../.plugin/addons/widget.js';
import { defineWidget, elementAs } from './widget.js';

/** Class the shared stylesheet hangs every Text rule off. */
const ROOT_CLASS = 'cloudcanvas-lib-text';

/**
 * Tags a Text may be. A closed set rather than "whatever the caller passed":
 * `as` reaches `document.createElement`, and an open one turns a content value
 * into an element-name injection.
 */
const TAGS = new Set(['span', 'p', 'h1', 'h2', 'h3', 'h4', 'label']);
const DEFAULT_TAG = 'span';

const SIZES = ['xs', 'sm', 'md', 'lg'];

/** `regular` is the base rule, so it is the absence of a weight modifier. */
const WEIGHTS = ['medium', 'semibold'];

/** A member of `values`, or the stated default. */
function oneOf(values, value, fallback) {
  return values.includes(value) ? value : fallback;
}

function bind(host) {
  return { root: host.querySelector(`.${ROOT_CLASS}`) };
}

/** The element `as` names, the text through `Text.data`, the variants through the class list. */
function render(bindings, contents) {
  const as = contents.get('as');
  const root = elementAs(bindings.root, TAGS.has(as) ? as : DEFAULT_TAG);
  setText(leadingText(root), contents.get('text'));

  const size = oneOf(SIZES, contents.get('size'), 'md');
  const weight = oneOf(WEIGHTS, contents.get('weight'), 'regular');
  for (const name of SIZES) root.classList.toggle(`${ROOT_CLASS}-${name}`, name === size);
  for (const name of WEIGHTS) root.classList.toggle(`${ROOT_CLASS}-${name}`, name === weight);
  root.classList.toggle(`${ROOT_CLASS}-muted`, contents.get('tone') === 'muted');
}

const widget = /* @__PURE__ */ defineWidget({
  name: 'text',
  html: `<span class="${ROOT_CLASS}"></span>`,
  allowedKeys: ['text', 'as', 'tone', 'size', 'weight'],
  bind,
  render
});

/** Define the Text widget, once. @returns {object} its type */
export const registerText = widget.define;

/** A chromeless Text blit in `parent`: `createText(app, { x, y, text, as, tone, size, weight })`. */
export const createText = widget.create;
