/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * ReactableCardPin Archetype:
 * Social/engagement pin supporting likes, hearts, bookmarks, and shares with reactive counts.
 */

import { definePrototype } from '../../.plugin/pins/traits/prototype.js';

export const REACTABLE_PIN_TYPE = 'reactable-card';

export const ReactableCardPin = definePrototype({
  name: REACTABLE_PIN_TYPE,
  schema: {
    title: { type: 'text', default: 'Interactive Pin' },
    body: { type: 'text', default: 'React with thumbs up, heart, bookmark, or share.' },
    likes: { type: 'number', default: 0, min: 0 },
    liked: { type: 'boolean', default: false },
    saved: { type: 'boolean', default: false },
    shares: { type: 'number', default: 0, min: 0 }
  },
  styles: {
    card: 'display: flex; flex-direction: column; gap: var(--cc-space-2, 8px); min-width: 220px;',
    title: 'font-weight: var(--cc-type-weight-semibold, 600); font-size: var(--cc-type-md, 1rem);',
    body: 'font-size: var(--cc-type-sm, 0.875rem); color: var(--cc-text-muted, #94a3b8); line-height: 1.4;',
    bar: 'display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--cc-card-border, #334155); padding-top: 6px; margin-top: 4px;',
    btn: 'background: transparent; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: var(--cc-text, inherit); padding: 2px 6px; border-radius: var(--cc-radius-sm, 4px);'
  },
  blueprint: [
    ['div.card',
      ['div.title', { text: '$title' }],
      ['div.body', { text: '$body' }],
      ['div.bar',
        ['button.btn', { on: { click: 'toggleLike' } },
          ['span', '❤️'],
          ['span.likes', { text: '$likes' }]
        ],
        ['button.btn', { on: { click: 'toggleSave' } },
          ['span', '🔖']
        ],
        ['button.btn', { on: { click: 'share' } },
          ['span', '🔗'],
          ['span.shares', { text: '$shares' }]
        ]
      ]
    ]
  ],
  actions: {
    toggleLike(pin) {
      const liked = !pin.state.liked;
      pin.state.liked = liked;
      pin.state.likes = Math.max(0, (Number(pin.state.likes) || 0) + (liked ? 1 : -1));
      pin.emit('pin:react', { type: 'like', liked, total: pin.state.likes });
    },
    toggleSave(pin) {
      const saved = !pin.state.saved;
      pin.state.saved = saved;
      pin.emit('pin:react', { type: 'bookmark', saved });
    },
    share(pin) {
      pin.state.shares = (Number(pin.state.shares) || 0) + 1;
      pin.emit('pin:share', { id: pin.id, total: pin.state.shares });
    }
  },
  traits: ['draggable', 'selectable', 'resizable'],
  chrome: true
});
