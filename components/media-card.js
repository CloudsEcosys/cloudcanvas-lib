/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * MediaCard: an image with a title and caption, focussable for inspection.
 *
 * The `src` goes through `primitives.safeUrl` before it reaches the
 * attribute - the same reasoning as `lib/avatar.js`, and the same fallback:
 * a URL that does not survive the check is *no* image, and the placeholder
 * shows instead. The placeholder is inline SVG painted in `currentColor`, so
 * it takes the theme's muted text colour rather than carrying a hex of its
 * own, and it is built once beside the `<img>` with visibility picking one.
 * `src` is written only while an image is showing, and only when it moved:
 * an `<img>` re-fetches on every assignment.
 */

import {
  FocussableTrait,
  makeElement,
  makeTextNode,
  primitives,
  setAttr,
  setText,
  setVisible
} from '../../src/index.js';
import {
  claimHost,
  createComponentPin,
  makeRegistrar,
  splitOptions
} from './registrar.js';

/** Registry name, and the `type` a caller creates a Pin by. */
export const MEDIA_CARD_TYPE = 'media-card';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const MEDIA_CLS = Object.freeze({
  ROOT: 'cloudcanvas-media-card',
  VIEWPORT: 'cloudcanvas-media-viewport',
  IMAGE: 'cloudcanvas-media-img',
  PLACEHOLDER: 'cloudcanvas-media-placeholder',
  CONTENT: 'cloudcanvas-media-content',
  TITLE: 'cloudcanvas-media-title',
  CAPTION: 'cloudcanvas-media-caption'
});

const SVG_NS = 'http://www.w3.org/2000/svg';
const ALLOWED_KEYS = ['title', 'caption', 'src'];

/** A content value as a string; `undefined` and `null` are the empty string. */
function asText(value) {
  return value === undefined || value === null ? '' : String(value);
}

/** The stand-in diagram: a horizon, a sun, nothing that needs a colour of its own. */
function makePlaceholder() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', MEDIA_CLS.PLACEHOLDER);
  svg.setAttribute('viewBox', '0 0 300 180');
  svg.setAttribute('aria-hidden', 'true');

  const shapes = [
    ['rect', { width: '100%', height: '100%', opacity: '0.08' }],
    ['path', { d: 'M50 140 L110 80 L160 120 L210 60 L270 140 Z', opacity: '0.45' }],
    ['circle', { cx: '80', cy: '50', r: '18', opacity: '0.7' }]
  ];
  for (const [tag, attributes] of shapes) {
    const shape = document.createElementNS(SVG_NS, tag);
    shape.setAttribute('fill', 'currentColor');
    for (const [name, value] of Object.entries(attributes)) shape.setAttribute(name, value);
    svg.appendChild(shape);
  }
  return svg;
}

/* ------------------ TEMPLATE ------------------ */

function build(pin, contentEl) {
  claimHost(contentEl);
  const card = makeElement('div', `cloudcanvas-component cloudcanvas-component-card ${MEDIA_CLS.ROOT}`);

  const viewport = makeElement('div', MEDIA_CLS.VIEWPORT);
  const image = makeElement('img', MEDIA_CLS.IMAGE);
  const placeholder = makePlaceholder();
  viewport.append(image, placeholder);

  const content = makeElement('div', MEDIA_CLS.CONTENT);
  const title = makeElement('div', MEDIA_CLS.TITLE);
  const titleText = makeTextNode(title);
  const caption = makeElement('div', MEDIA_CLS.CAPTION);
  const captionText = makeTextNode(caption);
  content.append(title, caption);

  card.append(viewport, content);
  contentEl.replaceChildren(card);

  return { card, image, placeholder, titleText, captionText };
}

function update(pin, contents, bindings, cache) {
  const title = asText(contents.get('title'));
  const url = primitives.safeUrl(contents.get('src'), '');
  const showImage = url !== '';

  setText(bindings.titleText, title);
  setText(bindings.captionText, contents.get('caption'));

  if (showImage) {
    setAttr(bindings.image, 'src', url, cache, 'src');
    setAttr(bindings.image, 'alt', title, cache, 'alt');
  }
  setVisible(bindings.image, showImage);
  setVisible(bindings.placeholder, !showImage);
}

/* ------------------ REGISTRATION ------------------ */

/** Register the media card, once per registry; see `./registrar.js`. */
export const registerMediaCard = makeRegistrar({
  name: MEDIA_CARD_TYPE,
  build,
  update,
  chrome: false,
  allowedKeys: ALLOWED_KEYS
});

/**
 * Create a media card Pin, focussable for inspection.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options] `title`, `caption`, `src` become contents; the
 *   rest are Pin options
 * @returns {Pin}
 */
export function createMediaCardPin(session, options = {}) {
  const { pinOptions, contents } = splitOptions(options, [
    ['title', 'Visual Asset'],
    ['caption', 'Architecture diagram preview'],
    ['src', '']
  ], { x: 100, y: 100, width: 240, height: 210 });

  pinOptions.traits = [
    new FocussableTrait({ padding: 50, maxZoom: 3.5 }),
    ...(Array.isArray(pinOptions.traits) ? pinOptions.traits : [])
  ];

  return createComponentPin(session, registerMediaCard, pinOptions, contents, false);
}
