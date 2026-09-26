/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Whole-session operations over a live canvas that every builder surface
 * shares, kept here so no page carries its own half-right copy.
 *
 * `clearSession` is the inverse of `deserializeSession` (`./serialize.js`): it
 * empties exactly the four things a snapshot restores - the Pin tree, the
 * reaction bindings, the page store and the host's theme tokens - so a canvas
 * cleared here and then restored is byte-identical to one restored fresh. A
 * clear that dropped the Pins but kept the sitemap naming them was the sandbox's
 * standing defect (`tests/unit/website-sandbox-templates-golden.test.js`).
 */

import { applyTheme, reactionsFor } from '../../src/index.js';
import { pagesFor } from './pages.js';

/**
 * Empty a session: every root Pin (and so every descendant), every reaction
 * binding, every page entry, and the theme tokens inline on the host.
 *
 * Roots are snapshotted before removal because `removePin` mutates the set
 * being walked. A session with no host no-ops the theme through `applyTheme`'s
 * own guard.
 *
 * @param {CloudCanvasSession} session
 * @returns {number} how many root Pins were removed
 */
export function clearSession(session) {
  if (!session || !session.pinManager || typeof session.removePin !== 'function') {
    throw new TypeError('clearSession: a CloudCanvasSession is required');
  }

  const roots = Array.from(session.pinManager.getRootPins());
  for (const pin of roots) session.removePin(pin.id);

  reactionsFor(session).clear();
  pagesFor(session).clear();
  applyTheme(session.hostElement, null);
  return roots.length;
}
