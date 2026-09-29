/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The forms group (`cloudcanvas/forms`): seven native controls as widgets -
 * button, input, checkbox, radio (and radio group), toggle, slider, select.
 *
 *   const ok = createButton(app, { x: 40, y: 40, label: 'Save' });
 *   const agree = createCheckbox(app, { x: 40, y: 80, label: 'Agree' });
 *
 * Every control is a `widget()` (`cloudcanvas/widget`) on a real form element:
 * its contents are the trait of its type's name, it names its control from the
 * blit's element id, commits through `setContent`, and re-issues the native
 * `input`/`change` as the blit's own (`b.emit`, bubbling). A button's press is
 * the native `click`.
 *
 * Registration is explicit: nothing here runs on import. Each `create<Name>`
 * registers its own control on first call; `registerForms()` registers the set.
 * The stylesheet is the kit's (`../styles.js`), shared with the display group.
 */
import { registerButton } from './button.js';
import { registerInput } from './input.js';
import { registerCheckbox } from './checkbox.js';
import { registerRadio, registerRadioGroup } from './radio.js';
import { registerToggle } from './toggle.js';
import { registerSlider } from './slider.js';
import { registerSelect } from './select.js';

export { registerButton, createButton } from './button.js';
export { registerInput, createInput } from './input.js';
export { registerCheckbox, createCheckbox } from './checkbox.js';
export { registerRadio, registerRadioGroup, createRadio, createRadioGroup } from './radio.js';
export { registerToggle, createToggle } from './toggle.js';
export { registerSlider, createSlider } from './slider.js';
export { registerSelect, createSelect } from './select.js';

/**
 * Define every form control, once each; a second call defines nothing new.
 * @returns {string[]} the type names, in export order
 */
export function registerForms() {
  return [
    registerButton(), registerInput(), registerCheckbox(), registerRadio(), registerRadioGroup(),
    registerToggle(), registerSlider(), registerSelect()
  ].map((defined) => defined.el.getAttribute('data-type'));
}
