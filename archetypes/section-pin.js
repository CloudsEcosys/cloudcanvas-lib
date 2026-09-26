/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * SectionPin Archetype:
 * Canvas scope container representing a named section, folder, or artboard.
 * Supports fluid child layouts (free, row, column, grid), child counts, and group saving.
 */

import { definePrototype } from '../../.plugin/pins/traits/prototype.js';
import { saveGroup } from '../../.plugin/pins/group.js';

export const SECTION_PIN_TYPE = 'canvas-section';

export const SectionPin = definePrototype({
  name: SECTION_PIN_TYPE,
  schema: {
    name: { type: 'text', default: 'New Section' },
    color: { type: 'enum', values: ['neutral', 'blue', 'green', 'amber', 'purple'], default: 'blue' },
    layoutMode: { type: 'enum', values: ['free', 'row', 'column', 'grid'], default: 'free' },
    childCount: { type: 'number', default: 0, min: 0 }
  },
  styles: {
    section: 'display: flex; flex-direction: column; gap: var(--cc-space-2, 8px); min-width: 280px; min-height: 120px;',
    header: 'display: flex; align-items: center; justify-content: space-between; border-bottom: 2px dashed var(--cc-card-border, #334155); padding-bottom: 6px;',
    left: 'display: flex; align-items: center; gap: 8px;',
    icon: 'user-select: none;',
    title: 'font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: var(--cc-type-sm, 0.875rem);',
    badge: 'background: var(--cc-bg-muted, rgba(255, 255, 255, 0.1)); padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem;',
    ctrls: 'display: flex; gap: 4px;'
  },
  blueprint: [
    ['div.section',
      ['div.header',
        ['div.left',
          ['span.icon', '📁'],
          ['span.title', { text: '$name', class: '$color' }],
          ['span.badge', { text: '$childCount' }]
        ],
        ['div.ctrls',
          ['button.cloudcanvas-lib-button', { on: { click: 'cycleLayout' } }, '⊞ Flow'],
          ['button.cloudcanvas-lib-button', { on: { click: 'focusSection' } }, '🔍 Focus'],
          ['button.cloudcanvas-lib-button-primary', { on: { click: 'saveSection' } }, '💾 Save']
        ]
      ]
    ]
  ],
  actions: {
    cycleLayout(pin) {
      const current = pin.layout || 'free';
      const order = ['free', 'row', 'column', 'grid'];
      const next = order[(order.indexOf(current) + 1) % order.length];
      pin.layout = next;
      pin.state.layoutMode = next;
      pin.emit('section:layout', { layout: next });
    },
    focusSection(pin) {
      if (pin.session && typeof pin.session.focus === 'function') {
        pin.session.focus(pin);
      }
    },
    saveSection(pin) {
      const data = saveGroup(pin, pin.state.name || 'section');
      pin.emit('section:saved', { name: pin.state.name, data });
    }
  },
  traits: ['scope', 'focussable', 'draggable', 'selectable', 'resizable'],
  chrome: true
});
