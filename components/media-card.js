/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * MediaCard: an image with a title and caption, a zoom target for inspection.
 *
 *   registerMediaCard();
 *   createMediaCard(app, { title: 'Topology', caption: 'Overview', src: 'https://example.com/a.png' });
 *
 * The `src` goes through `safeUrl` before it reaches the attribute, and a URL
 * that does not survive the check is *no* image: the placeholder shows
 * instead. The placeholder is inline SVG painted in `currentColor`, so it takes
 * the theme's muted text colour rather than carrying a hex of its own; it sits
 * in the template beside the `<img>` and the `hidden` attribute picks one (an
 * SVG element has no `hidden` property, so the attribute is written directly).
 * `src` is written only while an image is showing, and only when it moved: an
 * `<img>` re-fetches on every assignment. The `focus` spec key frames it.
 */
import { blit } from '../../.plugin/core/index.js';
import { focus } from '../../.plugin/addons/focus.js';
import { leadingText, setAttr, setText, setVisible, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { safeUrl } from '../../.plugin/graphics/primitives/primitives.js';
import { asText } from '../coerce.js';
import { withDefaults } from './registrar.js';
import { injectComponentStyles } from './styles.js';

/** The type name. */
export const MEDIA_CARD_TYPE = 'media-card';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const MEDIA_CLS = /* @__PURE__ */ Object.freeze({
  ROOT: 'cloudcanvas-media-card',
  VIEWPORT: 'cloudcanvas-media-viewport',
  IMAGE: 'cloudcanvas-media-img',
  PLACEHOLDER: 'cloudcanvas-media-placeholder',
  CONTENT: 'cloudcanvas-media-content',
  TITLE: 'cloudcanvas-media-title',
  CAPTION: 'cloudcanvas-media-caption'
});

/* ------------------ TEMPLATE ------------------ */

/** The stand-in diagram: a horizon, a sun, nothing that needs a colour of its own. */
const PLACEHOLDER = `<svg class="${MEDIA_CLS.PLACEHOLDER}" viewBox="0 0 300 180" aria-hidden="true">`
  + '<rect fill="currentColor" width="100%" height="100%" opacity="0.08"></rect>'
  + '<path fill="currentColor" d="M50 140 L110 80 L160 120 L210 60 L270 140 Z" opacity="0.45"></path>'
  + '<circle fill="currentColor" cx="80" cy="50" r="18" opacity="0.7"></circle></svg>';

const HTML = `<div class="cloudcanvas-component cloudcanvas-component-card ${MEDIA_CLS.ROOT}">`
  + `<div class="${MEDIA_CLS.VIEWPORT}"><img class="${MEDIA_CLS.IMAGE}" hidden>${PLACEHOLDER}</div>`
  + `<div class="${MEDIA_CLS.CONTENT}"><div class="${MEDIA_CLS.TITLE}"></div>`
  + `<div class="${MEDIA_CLS.CAPTION}"></div></div></div>`;

function bind(host) {
  const find = (className) => host.querySelector(`.${className}`);
  return {
    image: find(MEDIA_CLS.IMAGE), placeholder: find(MEDIA_CLS.PLACEHOLDER),
    titleText: leadingText(find(MEDIA_CLS.TITLE)), captionText: leadingText(find(MEDIA_CLS.CAPTION))
  };
}

function render(bindings, contents, cache) {
  const title = asText(contents.get('title'));
  const url = safeUrl(contents.get('src'), '');
  const showImage = url !== '';
  setText(bindings.titleText, title);
  setText(bindings.captionText, contents.get('caption'));
  if (showImage) {
    setAttr(bindings.image, 'src', url, cache, 'src');
    setAttr(bindings.image, 'alt', title, cache, 'alt');
  }
  setVisible(bindings.image, showImage);
  if (bindings.placeholder.hasAttribute('hidden') !== showImage) bindings.placeholder.toggleAttribute('hidden', showImage);
}

/* ------------------ REGISTRATION ------------------ */

const SPEC = Object.freeze({ name: MEDIA_CARD_TYPE, html: HTML, keys: ['title', 'caption', 'src'], bind, render });

/** Define the media card widget, once, and name the `focus` trait that frames it. @returns {object} its type */
export function registerMediaCard() {
  injectComponentStyles();
  blit.use({ focus });
  return widget(SPEC);
}

/**
 * A media card in `parent`, framed by `focus` (padding 50, maxZoom 3.5). `title`,
 * `caption` and `src` are contents; the rest is spec.
 */
export function createMediaCard(parent, options = {}) {
  registerMediaCard();
  return parent.blit(widgetSpec(MEDIA_CARD_TYPE, withDefaults({
    x: 100, y: 100, w: 240, h: 210, chrome: false,
    title: 'Visual Asset', caption: 'Architecture diagram preview', src: '',
    focus: { padding: 50, maxZoom: 3.5 }
  }, options)));
}
