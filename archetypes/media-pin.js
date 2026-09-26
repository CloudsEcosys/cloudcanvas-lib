/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * MediaPin Archetype:
 * Polymorphic visual pin representing emojis, raster images, sprites, or vector maps.
 */

import { definePrototype } from '../../.plugin/pins/traits/prototype.js';
import { rotatePin } from '../../.plugin/pins/traits/interaction.js';

export const MEDIA_PIN_TYPE = 'media-pin';

export const MediaPin = definePrototype({
  name: MEDIA_PIN_TYPE,
  schema: {
    mode: { type: 'enum', values: ['emoji', 'image', 'sprite', 'vector'], default: 'emoji' },
    src: { type: 'text', default: '🎨' },
    caption: { type: 'text', default: '' },
    scale: { type: 'number', default: 1.0, min: 0.1, max: 10.0 },
    rotation: { type: 'number', default: 0, min: 0, max: 360 },
    spriteFrame: { type: 'number', default: 0 }
  },
  styles: {
    root: 'display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; padding: var(--cc-space-2, 8px);',
    display: 'font-size: 3rem; line-height: 1; user-select: none; transition: transform 0.15s ease;',
    caption: 'font-size: var(--cc-type-xs, 0.75rem); color: var(--cc-text-muted, #94a3b8); margin-top: 4px; text-align: center;'
  },
  blueprint: [
    ['div.root',
      ['div.display', {
        text: '$src',
        class: '$mode',
        style: { '--cc-pin-rotation': '$rotation' }
      }],
      ['span.caption', { text: '$caption' }]
    ]
  ],
  actions: {
    rotate(pin, deg = 15) {
      const next = (Number(pin.state.rotation || 0) + deg) % 360;
      pin.state.rotation = next;
      rotatePin(pin, deg);
    },
    nextFrame(pin) {
      pin.state.spriteFrame = Number(pin.state.spriteFrame || 0) + 1;
      pin.emit('media:frame', { frame: pin.state.spriteFrame });
    }
  },
  traits: ['draggable', 'selectable', 'resizable'],
  chrome: true
});
