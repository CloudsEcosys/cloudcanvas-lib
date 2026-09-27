/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `table`: a data table - pricing, specs, a schedule - from plain rows.
 *
 * A real `<table>` with a `<caption>` slot, a header row of `<th scope="col">`
 * and one `<tr>` per row. The data is the options of the same-named trait, so
 * a write re-renders it and the spec carries it:
 *
 *   tableType();
 *   const plans = root.blit({ type: 'table', fill: { caption: 'Plans' },
 *     table: { columns: ['Plan', 'Price'], rows: [['Free', '$0'], ['Pro', '$9']] } });
 *   plans.set({ table: { columns: ['Plan', 'Price'], rows: [['Pro', '$12']] } });
 *
 * Every cell is text (`textContent`), never markup. A row shorter than the
 * header is padded with empty cells so the grid stays rectangular; a longer one
 * keeps its extra cells.
 */
import { blit, type } from '../../.plugin/core/index.js';
import { injectArchetypeStyles } from './styles.js';

/** The type name, which is also the trait its data rides on. */
export const TABLE_TYPE = 'table';
const CLASS = 'cloudcanvas-table';

/** Constant markup, never data. */
const TABLE_HTML = `<table class="${CLASS}"><caption class="${CLASS}-caption" data-slot="caption"></caption>`
  + '<thead></thead><tbody></tbody></table>';

/** Validated `{columns, rows}`; none is an empty table. @throws {TypeError} on any other shape */
function tableData(options) {
  if (options === true || options === undefined || options === null || options === '') return { columns: [], rows: [] };
  const columns = options.columns ?? [];
  const rows = options.rows ?? [];
  if (!Array.isArray(columns) || !Array.isArray(rows) || !rows.every(Array.isArray)) {
    throw new TypeError('table: expected {columns: [], rows: [[]]}');
  }
  return { columns, rows };
}

/** One row of `tag` cells, `width` wide at least, each cell's value as text. */
function rowOf(tag, values, width) {
  const tr = document.createElement('tr');
  for (let index = 0; index < Math.max(width, values.length); index += 1) {
    const cell = document.createElement(tag);
    if (tag === 'th') cell.setAttribute('scope', 'col');
    const value = values[index];
    cell.textContent = value === undefined || value === null ? '' : String(value);
    tr.appendChild(cell);
  }
  return tr;
}

/** The trait: the header and body rebuilt from the options on every write. */
function renderTable(b, options) {
  const { columns, rows } = tableData(options);
  const table = b.el.querySelector(`.${CLASS}`);
  table.tHead.replaceChildren(...(columns.length > 0 ? [rowOf('th', columns, 0)] : []));
  table.tBodies[0].replaceChildren(...rows.map((row) => rowOf('td', row, columns.length)));
}

/**
 * Register the `table` type and its trait; its sheet goes in with it. A second
 * call is a no-op.
 * @returns {object} the type's potential blit
 */
export function tableType() {
  injectArchetypeStyles();
  blit.use({ [TABLE_TYPE]: renderTable });
  return type(TABLE_TYPE, { html: TABLE_HTML, defaults: { [TABLE_TYPE]: true } });
}
