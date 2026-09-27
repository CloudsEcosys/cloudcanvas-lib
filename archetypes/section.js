/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `section`: a titled region of a page whose children nest inside it.
 *
 * The one container the core's own types lack: a real `<section>` with its
 * heading, and a `data-scope` body the core places every child blit into, so a
 * page is built as sections holding content rather than as loose blits:
 *
 *   sectionType();
 *   const pricing = root.blit({ type: 'section', fill: { title: 'Pricing' } });
 *   pricing.blit({ type: 'table', table: { columns: ['Plan', 'Price'], rows: [['Pro', '$9']] } });
 *
 * The title is a text slot, so `fill` can never be markup. Styled by
 * `./styles.js`, by class, on existing core tokens.
 */
import { type } from '../../.plugin/core/index.js';
import { injectArchetypeStyles } from './styles.js';

/** The type name, and the class every part hangs off. */
export const SECTION_TYPE = 'section';
const CLASS = 'cloudcanvas-section';

/** Constant markup, never data: the heading slot and the scope the children land in. */
const SECTION_HTML = `<section class="${CLASS}"><h2 class="${CLASS}-title" data-slot="title"></h2>`
  + `<div class="${CLASS}-body" data-scope></div></section>`;

/**
 * Register the `section` type; its sheet goes in with it. A second call is a
 * no-op, and a `section` defined elsewhere with other markup throws.
 * @returns {object} the type's potential blit
 */
export function sectionType() {
  injectArchetypeStyles();
  return type(SECTION_TYPE, { html: SECTION_HTML });
}
