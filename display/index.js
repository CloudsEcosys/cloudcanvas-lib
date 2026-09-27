/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The display group (`cloudcanvas/display`): text, badge, avatar, divider,
 * progress, spinner, alert and the keyed list.
 *
 * Five are core types as well as Pins - `badge`, `avatar`, `progress`,
 * `spinner`, `alert` - built from one template and one render (`./widget.js`),
 * so a core root places them with no Pin at all:
 *
 *   displayTypes();
 *   root.blit({ type: 'alert', alert: { title: 'Saved', message: 'All good', tone: 'success' } });
 *
 * The other three stay on the Pin shell: `text` and `divider` choose their
 * element from their contents at build time, and `list` reads the Pin's live
 * contents when a row is activated and transmits a `PinEvent`.
 *
 * Registration is explicit: nothing here runs on import. `registerDisplay()`
 * registers the Pin components, `displayTypes()` the core types.
 */
import { alertType, registerAlert } from './alert.js';
import { avatarType, registerAvatar } from './avatar.js';
import { badgeType, registerBadge } from './badge.js';
import { registerDivider } from './divider.js';
import { registerList } from './list.js';
import { progressType, registerProgress } from './progress.js';
import { registerSpinner, spinnerType } from './spinner.js';
import { registerText } from './text.js';

export { registerText, createTextPin } from './text.js';
export { registerBadge, createBadgePin, badgeType } from './badge.js';
export { registerAvatar, createAvatarPin, avatarType } from './avatar.js';
export { registerDivider, createDividerPin } from './divider.js';
export { registerProgress, createProgressPin, progressType } from './progress.js';
export { registerSpinner, createSpinnerPin, spinnerType } from './spinner.js';
export { registerAlert, createAlertPin, alertType } from './alert.js';
export { registerList, createListPin } from './list.js';

/**
 * Register every display Pin component, once each; `registry` reaches the list,
 * the one component whose registration is per registry.
 * @returns {object[]} the component handles, in export order
 */
export function registerDisplay(registry) {
  return [
    registerText(), registerBadge(), registerAvatar(), registerDivider(),
    registerProgress(), registerSpinner(), registerAlert(), registerList(registry)
  ];
}

/**
 * Register the five core display types and their traits, once each.
 * @returns {object[]} the types' potential blits: badge, avatar, progress, spinner, alert
 */
export function displayTypes() {
  return [badgeType(), avatarType(), progressType(), spinnerType(), alertType()];
}
