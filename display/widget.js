/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A display widget on both engines, from one template and one render.
 *
 * The template is the widget's core type. `define()` registers it with `type()`
 * and gives it a trait of the same name whose options are the contents, so a
 * core root places one and re-renders it by writing that key:
 *
 *   progressType();
 *   const bar = root.blit({ type: 'progress', progress: { value: 40, label: 'Upload' } });
 *   bar.set({ progress: { value: 80, label: 'Upload' } });
 *
 * The legacy Pin component (`register()` / `create(session, options)`) renders
 * through the same template: `defineComponent` clones it into the content
 * element, `bind` finds the nodes, and its update is the same `render`. One
 * structure, one render, two shells; the DOM either shell builds is the same.
 *
 *   bind(host, on, dismiss)            the nodes of the clone under `host`; must be
 *                                      idempotent, since a core trait rebinds on every write
 *   render(bindings, contents, cache)  `contents` (a Map) into them, diff-first through `cache`
 *
 * `on(target, type, listener)` is how `bind` listens: for the life of the Pin, or
 * until the core trait stops. `dismiss()` is the widget asking to go away, one
 * convention on both shells: a cancellable `dismiss` event whose default action -
 * removing the widget - a listener stops with `preventDefault()`.
 */
import { blit, type } from '../../.plugin/core/index.js';
import { deferRender } from '../../.plugin/addons/edit.js';
import { PinEvent, defineComponent } from '../../.plugin/index.js';
import { injectLibStyles } from '../styles.js';

/** The empty Text node leading `element`, made on first bind: the write target `setText` updates. */
export function leadingText(element) {
  const first = element.firstChild;
  if (first && first.nodeType === 3) return first;
  return element.insertBefore(document.createTextNode(''), first);
}

/** On a Pin: transmit a cancellable `dismiss`, then remove the Pin unless a listener said not to. */
function dismissPin(pin) {
  const event = new PinEvent('dismiss', { bubbles: true });
  pin.transmit(event);
  if (event.cancelled) return false;
  const session = pin.session;
  if (!session || typeof session.removePin !== 'function') return false;
  session.removePin(pin.id);
  return true;
}

/** On a blit: emit a cancellable `dismiss`, then remove the blit unless a listener said not to. */
function dismissBlit(b) {
  if (b.emit('dismiss').defaultPrevented) return false;
  b.remove();
  return true;
}

/** A Pin's listeners live as long as its subtree. */
function listenForever(target, eventType, listener) {
  target.addEventListener(eventType, listener);
}

/** A trait's options as contents: none is empty; a key the widget does not have is refused. */
function contentsOf(name, keys, options) {
  if (options === true || options === undefined || options === null || options === '') return new Map();
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError(`${name}: expected {key: value} contents`);
  }
  for (const key of Object.keys(options)) {
    if (!keys.has(key)) throw new TypeError(`${name}: key "${key}" not permitted`);
  }
  return new Map(Object.entries(options));
}

/** The widget as a core trait: bind the blit's clone, render its options (deferred while edited), stop listening on cleanup. */
function coreTrait({ name, bind, render }, keys) {
  return (b, options) => {
    const contents = contentsOf(name, keys, options);
    injectLibStyles();
    const offs = [];
    const on = (target, eventType, listener) => {
      target.addEventListener(eventType, listener);
      offs.push(() => target.removeEventListener(eventType, listener));
    };
    const bindings = bind(b.el, on, () => dismissBlit(b));
    // An open edit (`cloudcanvas/edit`) defers the render; `end` replays the last one, once.
    const paint = () => render(bindings, contents, {});
    if (!deferRender(b, paint)) paint();
    return () => { for (const off of offs) off(); };
  };
}

/**
 * One widget, both shells.
 * @param {{name: string, html: string, allowedKeys: string[], bind: Function, render: Function}} spec
 *   `html` is constant markup, never data
 * @returns {{name: string, register: Function, create: Function, define: Function}}
 */
export function defineWidget(spec) {
  const { name, html, allowedKeys, bind, render } = spec;
  let template = null;
  let handle = null;
  let defined = null;

  /** The widget's `<template>`, parsed once, on first use: both shells clone this one element. */
  const templateOf = () => {
    if (!template) {
      template = document.createElement('template');
      template.innerHTML = html;
    }
    return template;
  };

  /** The legacy Pin component, registered once; a second call returns the same handle. */
  function register() {
    handle ??= defineComponent({
      name,
      template: templateOf,
      build: (pin, contentEl) => bind(contentEl, listenForever, () => dismissPin(pin)),
      update: (pin, contents, bindings, cache) => render(bindings, contents, cache),
      chrome: false,
      allowedKeys
    });
    return handle;
  }

  /** A chromeless Pin of this widget; `type` is written last so a caller cannot break the identity. */
  function create(session, options = {}) {
    register();
    return session.createPin({ chrome: false, ...options, type: name });
  }

  /** The core type, and its same-named trait, registered once. @returns {object} the type's potential blit */
  function define() {
    if (!defined) {
      blit.use({ [name]: coreTrait(spec, new Set(allowedKeys)) });
      defined = type(name, { template: templateOf(), defaults: { [name]: true } });
    }
    return defined;
  }

  return Object.freeze({ name, register, create, define });
}
