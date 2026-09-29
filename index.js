/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's single door (`cloudcanvas/lib`): the forms group
 * (`./forms/index.js`, `cloudcanvas/forms`), the display group
 * (`./display/index.js`, `cloudcanvas/display`), the kit stylesheet, and the one
 * call that defines the whole set. Import a group directly to pay for one.
 *
 * REGISTRATION IS EXPLICIT. Importing this module defines no type and names no
 * trait: every widget's `register<Name>()` is a call, idempotent, and nothing here
 * runs at import time. A top-level definition would make the mere act of
 * importing a barrel change shared global state, so a consumer who wanted one
 * widget would silently get fifteen, and so would every test that imports it.
 * Two ways in instead:
 *
 *   - `registerBaseTypes()` defines the whole kit, when you want it, once.
 *   - any `create<Name>(parent, options)` defines just its own widget on first
 *     call, which is what makes the quick-start snippet a single import.
 *
 * Both are idempotent: `widget()` treats the same definition again as a no-op.
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
 * Define every widget in the kit: the forms, then the display widgets. Safe to
 * call more than once, and before any root exists, since a definition is data.
 * @returns {string[]} the type names, in registration order
 */
export function registerBaseTypes() {
  return [...registerForms(), ...registerDisplay()];
}
