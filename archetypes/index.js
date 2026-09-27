/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The archetypes (`cloudcanvas/archetypes`): page-building types on the core
 * alone, for a site built of blits.
 *
 *   - `section`: a titled region whose children nest inside it (`./section.js`)
 *   - `table`: a data table from plain rows (`./table.js`)
 *
 * Registration is a call, never an import side effect: `registerArchetypes()`
 * defines both, or each `<name>Type()` defines one. The module imports only
 * `cloudcanvas/core`, so an unused import bundles to nothing.
 */
import { sectionType } from './section.js';
import { tableType } from './table.js';

export { SECTION_TYPE, sectionType } from './section.js';
export { TABLE_TYPE, tableType } from './table.js';
export { ARCHETYPE_CSS, ARCHETYPE_STYLE_ID, injectArchetypeStyles } from './styles.js';

/**
 * Define every archetype; a second call is a no-op.
 * @returns {object[]} the types' potential blits: section, table
 */
export function registerArchetypes() {
  return [sectionType(), tableType()];
}
