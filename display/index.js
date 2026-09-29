/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The display group (`cloudcanvas/display`): text, badge, avatar, divider,
 * progress, spinner, alert and the keyed list - each a widget (`./widget.js`):
 * one template, one render, contents under the trait of its type's name.
 *
 *   registerDisplay();
 *   app.blit({ type: 'alert', alert: { title: 'Saved', message: 'All good', tone: 'success' } });
 *   createBadge(app, { x: 40, y: 40, text: 'beta', tone: 'info' });
 *
 * Registration is explicit: nothing here runs on import. Each `create<Name>`
 * defines its own widget on first call; `registerDisplay()` defines the set.
 */
import { registerAlert } from './alert.js';
import { registerAvatar } from './avatar.js';
import { registerBadge } from './badge.js';
import { registerDivider } from './divider.js';
import { registerList } from './list.js';
import { registerProgress } from './progress.js';
import { registerSpinner } from './spinner.js';
import { registerText } from './text.js';

export { registerText, createText } from './text.js';
export { registerBadge, createBadge } from './badge.js';
export { registerAvatar, createAvatar } from './avatar.js';
export { registerDivider, createDivider } from './divider.js';
export { registerProgress, createProgress } from './progress.js';
export { registerSpinner, createSpinner } from './spinner.js';
export { registerAlert, createAlert } from './alert.js';
export { registerList, createList } from './list.js';

/**
 * Define every display widget, once each; a second call defines nothing new.
 * @returns {string[]} the type names, in export order
 */
export function registerDisplay() {
  return [
    registerText(), registerBadge(), registerAvatar(), registerDivider(),
    registerProgress(), registerSpinner(), registerAlert(), registerList()
  ].map((defined) => defined.el.getAttribute('data-type'));
}
