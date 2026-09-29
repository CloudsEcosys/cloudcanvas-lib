/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A display widget from one template and one render: `widget()`
 * (`cloudcanvas/widget`) plus the kit's stylesheet and a chromeless factory.
 *
 *   const progress = defineWidget({ name: 'progress', html, allowedKeys: ['value', 'label'], bind, render });
 *   const bar = progress.create(app, { x: 40, y: 40, value: 40, label: 'Upload' });
 *   setContent(bar, 'value', 80);
 *
 *   bind(host, on, dismiss)            the nodes under the blit's element; idempotent, since it
 *                                      runs on every write
 *   render(bindings, contents, cache)  `contents` (a Map) into them, diff-first through `cache`
 *
 * `on(target, type, listener)` is how `bind` listens, until the trait restarts.
 * `dismiss()` is the widget asking to go away: a cancelable `dismiss` event whose
 * default action - removing the blit - a listener stops with `preventDefault()`.
 */
import { widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { injectLibStyles } from '../styles.js';

/**
 * One display widget: its definition, once, and a factory.
 * @param {{name: string, html: string, allowedKeys: string[], bind: Function, render: Function}} spec
 *   `html` is constant markup, never data
 * @returns {{name: string, define: Function, create: Function}}
 */
export function defineWidget(spec) {
  const { name, html, allowedKeys, bind, render } = spec;
  const definition = Object.freeze({ name, html, keys: allowedKeys, bind, render });

  /** The widget's type and same-named trait, once. @returns {object} its type */
  function define() {
    injectLibStyles();
    return widget(definition);
  }

  /** A chromeless blit of this widget in `parent`; its contents may come flat or as `contents`. */
  function create(parent, options = {}) {
    define();
    return parent.blit(widgetSpec(name, { chrome: false, ...options }));
  }

  return Object.freeze({ name, define, create });
}

/**
 * The element `current` should be when its tag is a content decision (`text`'s `as`, a divider's
 * orientation): `current` itself when the tag already matches, else a fresh `tag` element carrying its
 * classes, swapped into its place. Nothing moves while the choice is unchanged.
 * @returns {Element} the element in place
 */
export function elementAs(current, tag) {
  if (current.localName === tag) return current;
  const next = document.createElement(tag);
  next.className = current.className;
  current.replaceWith(next);
  return next;
}
