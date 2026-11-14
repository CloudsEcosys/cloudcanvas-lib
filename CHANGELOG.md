# Changelog
<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->

All notable changes to `cloudcanvas-lib`. Versions follow semantic versioning; this file records the migration
surface, not the commit history. Releases before 0.7.0, when these files shipped inside the `cloudcanvas`
package, are recorded in [the cloudcanvas CHANGELOG](https://github.com/CloudsEcosys/cloudcanvas/blob/main/CHANGELOG.md).

## 0.7.0

The split release. `cloudcanvas-lib` is the package every CloudCanvas plugin is pulled from, one entry each,
written against the core package `cloudcanvas` (peer dependency, `>=0.7.0 <0.8.0`). The files moved here fresh,
without their history; behaviour and APIs are 0.6.0's.

### Moved here from `cloudcanvas`

| 0.6 location | 0.7 location |
|---|---|
| `addons/<name>.js` (58 modules: 36 add-ons and their internal helpers) | `plugins/<name>.js` |
| `graphics/css/*.js` (the add-ons' CSS chunks) | `plugins/css/*.js` |
| `graphics/styles.js`, `graphics/styles-css.js` | `plugins/styles.js`, `plugins/styles-css.js` |
| `ui/` (the UI kit) | `ui/` |
| `defaults.js` | `defaults.js` |

The widget kit, the components, the archetypes and the board (`forms/`, `display/`, `components/`,
`archetypes/`, `sandbox/`, `index.js`) were already this repository's and stay where they are.

### Breaking

- **Import specifiers.** Every plugin subpath moves from `cloudcanvas/<name>` to `cloudcanvas-lib/<name>`:

  | 0.6 | 0.7 |
  |---|---|
  | `cloudcanvas/<add-on>`: `drag`, `select`, `resize`, `focus`, `physics`, `connect`, `svg-state`, `cursors`, `pan`, `keyboard`, `menu`, `announce`, `observe`, `motion`, `types`, `widget`, `keyed-list`, `style`, `layout`, `edit`, `place`, `history`, `reactions`, `lazy`, `offload`, `gpu`, `orbit`, `mesh`, `svg-path`, `sprites`, `text`, `video`, `own-canvas`, `xml`, `html-canvas`, `panel` | `cloudcanvas-lib/<add-on>` |
  | `cloudcanvas/ui`, `cloudcanvas/ui/testing` | `cloudcanvas-lib/ui`, `cloudcanvas-lib/ui/testing` |
  | `cloudcanvas/lib` | `cloudcanvas-lib` |
  | `cloudcanvas/forms`, `display`, `components`, `archetypes`, `sandbox` | `cloudcanvas-lib/forms`, `display`, `components`, `archetypes`, `sandbox` |
  | `cloudcanvas/defaults`, `cloudcanvas/graphics` | `cloudcanvas-lib/defaults`, `cloudcanvas-lib/graphics` |
  | `cloudcanvas`, `cloudcanvas/core`, `/log`, `/theme`, `/primitives` | unchanged (the core) |

  The `cloudcanvas` repository's `node scripts/migrate-0.7.js <dir>` lists every moved import in a codebase with its 0.7 specifier.
- **The core is reached by package specifier only.** The add-ons import `cloudcanvas` (`blit`, `type`) and
  `cloudcanvas/kernel` (the frame, per-element state, root index, default port and spec codec), never a core
  file by path; a browser page loading the source needs an import map for `cloudcanvas` and `cloudcanvas-lib`.
- **Bundles.** `dist/` is this package's: `esm/<entry>.js` per entry with the core external,
  `cloudcanvas-lib.esm.js` (the kit) and `cloudcanvas-ui.esm.js` (the UI kit) with the core external, and
  `cloudcanvas.board.iife.js`, the self-contained board runtime a static export embeds. `cloudcanvas-graphics.esm.js`
  is no longer built; `dist/esm/graphics.js` replaces it.
