/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * TablePin Archetype:
 * Interactive tabular grid / spreadsheet interface with reactive calculation.
 */

import { definePrototype } from '../../src/pins/traits/prototype.js';

export const TABLE_PIN_TYPE = 'table-pin';

export const TablePin = definePrototype({
  name: TABLE_PIN_TYPE,
  schema: {
    title: { type: 'text', default: 'Ledger Table' },
    colA: { type: 'text', default: 'Items' },
    colB: { type: 'text', default: 'Amount' },
    valA: { type: 'number', default: 10 },
    valB: { type: 'number', default: 25 },
    total: { type: 'number', default: 35 }
  },
  styles: {
    root: 'display: flex; flex-direction: column; gap: var(--cc-space-2, 8px); min-width: 240px;',
    title: 'font-weight: var(--cc-type-weight-semibold, 600); font-size: var(--cc-type-sm, 0.875rem);',
    grid: 'display: grid; grid-template-columns: 2fr 1fr; gap: 4px; border: 1px solid var(--cc-card-border, #334155); border-radius: var(--cc-radius-sm, 4px); padding: 4px;',
    header: 'font-weight: 600; font-size: var(--cc-type-xs, 0.75rem); background: var(--cc-bg-muted, rgba(255, 255, 255, 0.05)); padding: 2px 4px;',
    cell: 'font-size: var(--cc-type-sm, 0.875rem); padding: 2px 4px; font-family: var(--cc-font-mono, monospace);',
    footer: 'display: flex; align-items: center; justify-content: space-between; font-weight: 700; border-top: 1px solid var(--cc-card-border, #334155); padding-top: 4px; font-size: var(--cc-type-sm, 0.875rem);'
  },
  blueprint: [
    ['div.root',
      ['div.title', { text: '$title' }],
      ['div.grid',
        ['div.header', { text: '$colA' }],
        ['div.header', { text: '$colB' }],
        ['div.cell', 'Item #1'],
        ['div.cell', { text: '$valA' }],
        ['div.cell', 'Item #2'],
        ['div.cell', { text: '$valB' }]
      ],
      ['div.footer',
        ['span', 'Total:'],
        ['span.total', { text: '$total' }]
      ]
    ]
  ],
  actions: {
    recalc(pin) {
      const a = Number(pin.state.valA) || 0;
      const b = Number(pin.state.valB) || 0;
      const total = a + b;
      pin.state.total = total;
      pin.emit('table:recalc', { total });
    }
  },
  traits: ['draggable', 'selectable', 'resizable'],
  chrome: true
});
