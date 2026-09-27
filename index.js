/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's single door (`cloudcanvas/lib`): the forms group
 * (`./forms/index.js`, `cloudcanvas/forms`), the display group
 * (`./display/index.js`, `cloudcanvas/display`), the kit stylesheet, and the one
 * call that registers the whole set. Import a group directly to pay for one.
 *
 * REGISTRATION IS EXPLICIT. Importing this module must not touch the trait
 * registry, and does not: every widget's `register<Name>()` is lazy and
 * memoised, and nothing here runs at import time. The alternative - a top-level
 * `registerDefaults` call - makes the mere act of importing a barrel mutate
 * shared global state, so a consumer who wanted one widget silently gets fifteen
 * definitions, and a test that imports the barrel inherits them too. Two ways in instead:
 *
 *   - `registerBaseTypes()` registers the whole kit, when you want it, once.
 *   - any `create<Name>Pin()` registers just its own component on first call,
 *     which is what makes the quick-start snippet a single import.
 *
 * Both are idempotent. `defineComponent` refuses a name that is already taken -
 * a registry that silently replaced a definition would make two components
 * behind one name invisible - so re-registration returns the first handle rather
 * than throwing.
 */

export * from './forms/index.js';
export * from './display/index.js';

/**
 * The kit's stylesheet, its token catalogue and its light-theme supplement.
 * `LIB_LIGHT_THEME` repeats none of the core's keys, so the two spread together:
 * `applyTheme(host, { ...LIGHT_THEME, ...LIB_LIGHT_THEME })`.
 */
export { LIB_DEFAULT_CSS, LIB_LIGHT_THEME, LIB_STYLE_ID, LIB_TOKENS, injectLibStyles } from './styles.js';

import { registerForms } from './forms/index.js';
import { registerDisplay } from './display/index.js';

/**
 * Register every widget in the kit: the forms, then the display widgets.
 *
 * The explicit, no-side-effects-on-import path: nothing in this module runs
 * until this is called (or until a `create<Name>Pin` factory registers its own
 * component). Safe to call more than once - each registrar memoises its handle -
 * and safe to call before a session exists, since a definition is data.
 *
 * @param {TraitRegistry} [registry] reaches the list, whose definition is per
 *   registry; every other widget registers on the shared singleton
 * @returns {object[]} the component handles, in registration order
 */
export function registerBaseTypes(registry) {
  return [...registerForms(), ...registerDisplay(registry)];
}
