/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What the nine components share that is not a template: registration and
 * the factory plumbing.
 *
 * Every component in this library is a `defineComponent` template pair, the
 * same path the base kit and the core's own card walk - build once, mutate
 * after, node identity stable, `allowedKeys` enforced. What differs from the
 * base kit is only that a component here may take a registry (the library's
 * `registerComponentTraits(registry)` contract predates the kit), so the
 * memoisation is per registry, exactly as `lib/list.js` does it.
 *
 * Registration is explicit and lazy. Nothing in this module or in any
 * component module runs at import time; a registrar runs when a factory calls
 * it or when `registerComponentTraits()` does.
 */

import { defineComponent, traitRegistry } from '../../src/index.js';
import { injectComponentStyles } from './styles.js';

/** The class a chromeless widget writes onto the content node it fills. */
export const HOST_CLASS = 'cloudcanvas-component-host';

/**
 * Build a memoised registrar for one component spec.
 *
 * `registry.clear()` drops the definition and replays only its default
 * providers, so a cached handle is re-defined rather than returned when its
 * name is gone - a handle whose name no longer exists throws at `createTrait`.
 *
 * The component sheet is injected from `onAttach` rather than from the
 * factory, so a Pin created by name (`type: 'sticky-note'`) or adopted by
 * `hydrate()` is styled exactly like one the factory made.
 *
 * @param {object} spec `defineComponent` spec minus `registry`
 * @returns {(registry?: TraitRegistry) => import('../../src/pins/traits/define-component.js').ComponentHandle}
 */
export function makeRegistrar(spec) {
  const handles = new WeakMap();
  const onAttach = spec.defaults && spec.defaults.onAttach;

  const defaults = {
    ...(spec.defaults || {}),
    onAttach(pin) {
      injectComponentStyles();
      if (typeof onAttach === 'function') onAttach(pin);
    }
  };

  return function register(registry = traitRegistry) {
    const target = registry || traitRegistry;
    const cached = handles.get(target);
    if (cached && target.has(spec.name)) return cached;

    const handle = defineComponent({ ...spec, defaults, registry: target });
    handles.set(target, handle);
    return handle;
  };
}

/**
 * The live bindings of a rendered component, or `null` before its first render.
 *
 * `DisplayTrait` keeps them on the Pin's display state; a component that
 * needs to touch its own nodes outside the update pass (a pulse, an editor)
 * reads them here rather than re-finding them with a selector.
 */
export function bindingsOf(pin) {
  const state = pin ? pin._display : null;
  return state && state.bindings ? state.bindings : null;
}

/** Mark the content node a chromeless widget fills; see `HOST_CLASS`. */
export function claimHost(contentEl) {
  if (contentEl && contentEl.classList) contentEl.classList.add(HOST_CLASS);
}

/**
 * Split a flat factory options object into Pin options and a contents Map.
 *
 * The factories take a flat shape (`{ title, body, x, y }`) rather than the
 * base kit's `{ contents: {...} }`, because that is the shape every example
 * and every existing consumer already uses. Content keys are lifted into the
 * Map with their defaults; everything else is passed through to `createPin`.
 *
 * @param {object} options the caller's flat options
 * @param {Array<[string, *]>} contentDefaults `[key, default]` pairs, in order
 * @param {object} [pinDefaults] Pin options applied under the caller's
 * @returns {{ pinOptions: object, contents: Map<string, *> }}
 */
export function splitOptions(options, contentDefaults, pinDefaults = {}) {
  const source = options || {};
  const contents = new Map();
  const pinOptions = { ...pinDefaults };
  // An explicit `undefined` is an absence, not a value: the default stands.
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) pinOptions[key] = value;
  }

  for (const [key, fallback] of contentDefaults) {
    const value = source[key];
    contents.set(key, value === undefined ? fallback : value);
    delete pinOptions[key];
  }

  return { pinOptions, contents };
}

/**
 * Create a Pin carrying one component.
 *
 * `chrome` is read from the Pin's own options, not from the trait, so the
 * component's declaration is restated here - and stated *before* the spread,
 * so a caller who wants the card back can say so.
 *
 * @param {CloudCanvasSession} session
 * @param {function} register the component's registrar
 * @param {object} pinOptions Pin options, `registry` included if any
 * @param {Map<string, *>} contents
 * @param {boolean} chrome the component's own chrome default
 * @returns {Pin}
 */
export function createComponentPin(session, register, pinOptions, contents, chrome) {
  if (!session || typeof session.createPin !== 'function') {
    throw new TypeError('lib/components: a CloudCanvasSession is required');
  }

  const { registry, ...rest } = pinOptions;
  const component = register(registry);

  return session.createPin({
    chrome,
    ...rest,
    displayTrait: component.createTrait(),
    contents
  });
}
