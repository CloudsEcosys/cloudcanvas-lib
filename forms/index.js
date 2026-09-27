/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The forms group (`cloudcanvas/forms`): seven native controls as Pins - button,
 * input, checkbox, radio (and radio group), toggle, slider, select.
 *
 * Every control is a `defineComponent` template on a real form element that
 * re-issues its native `input`/`change` as the Pin's own event. They stay on the
 * Pin shell until the Pin is retired: each one names its control by the Pin's id,
 * commits through `pin.setContent` and transmits a `PinEvent` up the scope chain.
 *
 * Registration is explicit: nothing here runs on import. Each `create<Name>Pin`
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

export { registerButton, createButtonPin } from './button.js';
export { registerInput, createInputPin } from './input.js';
export { registerCheckbox, createCheckboxPin } from './checkbox.js';
export { registerRadio, registerRadioGroup, createRadioPin, createRadioGroupPin } from './radio.js';
export { registerToggle, createTogglePin } from './toggle.js';
export { registerSlider, createSliderPin } from './slider.js';
export { registerSelect, createSelectPin } from './select.js';

/**
 * Register every form control, once each; a second call returns the same handles.
 * @returns {object[]} the component handles, in export order
 */
export function registerForms() {
  return [
    registerButton(), registerInput(), registerCheckbox(), registerRadio(), registerRadioGroup(),
    registerToggle(), registerSlider(), registerSelect()
  ];
}
