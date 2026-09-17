/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * DocumentPin Archetype:
 * Formatted prose, note, or article pin.
 */

import { definePrototype } from '../../src/pins/traits/prototype.js';

export const DOCUMENT_PIN_TYPE = 'document-pin';

export const DocumentPin = definePrototype({
  name: DOCUMENT_PIN_TYPE,
  schema: {
    title: { type: 'text', default: 'Untitled Document' },
    author: { type: 'text', default: 'Author' },
    content: { type: 'text', default: 'Document contents go here...' },
    readingTime: { type: 'number', default: 1, min: 1 }
  },
  styles: {
    doc: 'display: flex; flex-direction: column; gap: var(--cc-space-2, 8px); min-width: 260px; max-width: 500px;',
    header: 'border-bottom: 1px solid var(--cc-card-border, #334155); padding-bottom: 4px;',
    title: 'font-weight: var(--cc-type-weight-bold, 700); font-size: var(--cc-type-md, 1rem); margin: 0;',
    meta: 'font-size: var(--cc-type-xs, 0.75rem); color: var(--cc-text-muted, #94a3b8); margin-top: 2px;',
    body: 'font-family: var(--cc-font-sans, system-ui); font-size: var(--cc-type-sm, 0.875rem); line-height: 1.5; white-space: pre-wrap; color: var(--cc-text, inherit);'
  },
  blueprint: [
    ['article.doc',
      ['header.header',
        ['h3.title', { text: '$title' }],
        ['div.meta', { text: '$author' }]
      ],
      ['section.body', { text: '$content' }]
    ]
  ],
  traits: ['draggable', 'selectable', 'resizable', 'focussable'],
  chrome: true
});
