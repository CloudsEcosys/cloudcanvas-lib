/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The public ESM entries - the kit, its groups, the UI kit, the defaults, the
 * add-on CSS and one per add-on - read from the root `package.json` `exports`,
 * the single build and publish truth. `build.js` splits them into `dist/esm/`,
 * `size.js` measures one row each, and the packaging test proves each one
 * sheds to nothing when imported unused.
 *
 * An entry is any key whose target is a `.js` module; `./package.json` and
 * `./dist/*` are not. Internal add-on helpers have no key, so they are never an
 * entry. The `.` entry (the kit) is named `index`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root: this file lives one directory below it. */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** What every lib bundle leaves to the page: the core package, at any subpath. */
export const CORE_EXTERNAL = Object.freeze(['cloudcanvas', 'cloudcanvas/*']);

/** The root manifest, parsed. */
export function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
}

/**
 * Every module entry, in `exports` order.
 * @param {{name: string, exports: Record<string, string>}} manifest
 * @returns {Array<{name: string, specifier: string, file: string}>} `name` is
 *   the subpath without `./` (`index` for `.`); `file` is the target, relative
 *   to the root
 */
export function publicEntries(manifest = readManifest()) {
  return Object.entries(manifest.exports)
    .filter(([key, target]) => !key.includes('*') && target.endsWith('.js'))
    .map(([key, target]) => ({
      name: key === '.' ? 'index' : key.slice(2),
      specifier: key === '.' ? manifest.name : `${manifest.name}/${key.slice(2)}`,
      file: target
    }));
}
