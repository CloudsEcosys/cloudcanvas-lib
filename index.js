/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's single door: every widget, the stylesheet, and the one call that
 * registers the whole set.
 *
 * REGISTRATION IS EXPLICIT. Importing this module must not touch the trait
 * registry, and does not: every widget's `register<Name>()` is lazy and
 * memoised, and nothing here runs at import time. The alternative - a top-level
 * `registerDefaults` call, which `src/components/index.js` still carries - makes
 * the mere act of importing a barrel mutate shared global state, so a consumer
 * who wanted one widget silently gets fifteen definitions, and a test that
 * imports the barrel inherits them too. Two ways in instead:
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

/* ------------------ FORM CONTROLS ------------------ */

export { registerButton, createButtonPin } from './button.js';
export { registerInput, createInputPin } from './input.js';
export { registerCheckbox, createCheckboxPin } from './checkbox.js';
export { registerRadio, registerRadioGroup, createRadioPin, createRadioGroupPin } from './radio.js';
export { registerToggle, createTogglePin } from './toggle.js';
export { registerSlider, createSliderPin } from './slider.js';
export { registerSelect, createSelectPin } from './select.js';

/* ------------------ DISPLAY ------------------ */

export { registerText, createTextPin } from './text.js';
export { registerBadge, createBadgePin } from './badge.js';
export { registerAvatar, createAvatarPin } from './avatar.js';
export { registerDivider, createDividerPin } from './divider.js';
export { registerProgress, createProgressPin } from './progress.js';
export { registerSpinner, createSpinnerPin } from './spinner.js';
export { registerAlert, createAlertPin } from './alert.js';
export { registerList, createListPin } from './list.js';

/* ------------------ STYLES ------------------ */

/**
 * The kit's stylesheet and its light-theme supplement. `LIB_LIGHT_THEME` repeats
 * none of the core's keys, so the two spread together:
 * `applyTheme(host, { ...LIGHT_THEME, ...LIB_LIGHT_THEME })`.
 */
export { LIB_DEFAULT_CSS, LIB_LIGHT_THEME, LIB_STYLE_ID, injectLibStyles } from './styles.js';

/* ------------------ REGISTRATION ------------------ */

import { registerButton } from './button.js';
import { registerInput } from './input.js';
import { registerCheckbox } from './checkbox.js';
import { registerRadio, registerRadioGroup } from './radio.js';
import { registerToggle } from './toggle.js';
import { registerSlider } from './slider.js';
import { registerSelect } from './select.js';
import { registerText } from './text.js';
import { registerBadge } from './badge.js';
import { registerAvatar } from './avatar.js';
import { registerDivider } from './divider.js';
import { registerProgress } from './progress.js';
import { registerSpinner } from './spinner.js';
import { registerAlert } from './alert.js';
import { registerList } from './list.js';

/** Every registrar in the kit, in the order the barrel exports them. */
const REGISTRARS = Object.freeze([
  registerButton,
  registerInput,
  registerCheckbox,
  registerRadio,
  registerRadioGroup,
  registerToggle,
  registerSlider,
  registerSelect,
  registerText,
  registerBadge,
  registerAvatar,
  registerDivider,
  registerProgress,
  registerSpinner,
  registerAlert,
  registerList
]);

/**
 * Register every widget in the kit.
 *
 * The explicit, no-side-effects-on-import path: nothing in this module runs
 * until this is called (or until a `create<Name>Pin` factory registers its own
 * component). Safe to call more than once - each registrar memoises its handle -
 * and safe to call before a session exists, since a definition is data.
 *
 * @param {TraitRegistry} [registry] target registry. Each widget's own
 *   registrar decides what to do with it; the kit's convention is the shared
 *   singleton, and a registrar that takes no registry argument uses it.
 * @returns {object[]} the component handles, in registration order
 */
export function registerBaseTypes(registry) {
  return REGISTRARS.map((register) => register(registry));
}
