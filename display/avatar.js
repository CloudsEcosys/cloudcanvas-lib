/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Avatar: a person, as an image or as their initials.
 *
 *   const ada = createAvatar(app, { x: 40, y: 40, name: 'Ada Lovelace', src: 'https://example.test/ada.png' });
 *
 * The `src` is validated through `safeUrl` (`cloudcanvas/primitives`) before it ever reaches the
 * attribute. `setAttribute` stops markup injection but not navigation-time
 * execution - `javascript:` and `data:text/html` both run script out of an
 * otherwise inert `src` - and an avatar URL is the most caller-supplied string
 * in this whole kit. A URL that does not survive the check is not a broken
 * image, it is *no* image: the initials fallback renders instead, so the widget
 * degrades into its own designed state rather than into a browser error glyph.
 *
 * Both states carry the same accessible name. When there is an image, the `<img>`
 * carries `alt`; when there are initials, the initials span is `role="img"` with
 * `aria-label`, so "AB" is never spelled out letter by letter. The name lives on
 * whichever node is showing rather than on the wrapper, because the hidden one is
 * out of the accessibility tree and a wrapper role would suppress the `<img>`'s
 * own alt when the image *is* showing.
 */

import { leadingText, setAttr, setText, setVisible } from '../../.plugin/addons/widget.js';
import { safeUrl } from '../../.plugin/graphics/primitives/primitives.js';
import { defineWidget } from './widget.js';

const NAME = 'avatar';
const ROOT_CLASS = 'cloudcanvas-lib-avatar';
const IMAGE_CLASS = 'cloudcanvas-lib-avatar-image';
const INITIALS_CLASS = 'cloudcanvas-lib-avatar-initials';

/** `md` is the base rule, so it is the absence of a size modifier. */
const SIZES = ['sm', 'lg'];

/** First letter of each of the first two words, uppercased. */
function initialsOf(name) {
  return name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

function bind(host) {
  const root = host.querySelector(`.${ROOT_CLASS}`);
  const initials = root.querySelector(`.${INITIALS_CLASS}`);
  return { root, image: root.querySelector(`.${IMAGE_CLASS}`), initials, initialsText: leadingText(initials) };
}

function render(bindings, contents, cache) {
  const name = contents.get('name');
  const label = name === undefined || name === null ? '' : String(name);
  // `safeUrl` answers with the fallback - here, the empty string - for anything
  // it will not vouch for, so "unsafe" and "absent" collapse into one branch.
  const url = safeUrl(contents.get('src'), '');
  const showImage = url !== '';
  const size = contents.get('size');

  for (const variant of SIZES) {
    bindings.root.classList.toggle(`${ROOT_CLASS}-${variant}`, variant === size);
  }

  // Written only while the image is the shown state: a `src` is never cleared to
  // the empty string, which browsers re-resolve against the document URL.
  if (showImage) {
    setAttr(bindings.image, 'src', url, cache, 'src');
    setAttr(bindings.image, 'alt', label, cache, 'alt');
  }
  setVisible(bindings.image, showImage);

  setText(bindings.initialsText, initialsOf(label));
  setAttr(bindings.initials, 'aria-label', label, cache, 'initialsLabel');
  setVisible(bindings.initials, !showImage);
}

const widget = /* @__PURE__ */ defineWidget({
  name: NAME,
  html: `<div class="${ROOT_CLASS}"><img class="${IMAGE_CLASS}"><span class="${INITIALS_CLASS}" role="img"></span></div>`,
  allowedKeys: ['name', 'src', 'size'],
  bind,
  render
});

/** Define the Avatar widget, once. @returns {object} its type */
export const registerAvatar = widget.define;

/** A chromeless Avatar blit in `parent`: `createAvatar(app, { x, y, name, src, size })`. */
export const createAvatar = widget.create;
