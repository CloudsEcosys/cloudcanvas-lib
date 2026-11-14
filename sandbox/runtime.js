/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The board runtime: what an exported page loads as `window.CloudCanvas`
 * (`dist/cloudcanvas.board.iife.js`, built from this entry). The core, a board
 * with its add-ons, the whole widget kit, and exactly what the loader an
 * exported page embeds (`./restore-tree.js`) and its boot script call.
 */
import { registerBaseTypes } from '../index.js';
import { registerComponents } from '../components/index.js';

export { blit, type } from 'cloudcanvas';
export { go } from '../plugins/history.js';
export { reactionsOf } from '../plugins/reactions.js';
export { applyTheme } from 'cloudcanvas/theme';
export { allBlits, createBoard } from './board.js';
export { LOADER_API as loaderApi } from './serialize.js';

/** Register every widget an exported page may hold: the base kit and the board components. */
export function registerKit() {
  return [...registerBaseTypes(), ...registerComponents()];
}
