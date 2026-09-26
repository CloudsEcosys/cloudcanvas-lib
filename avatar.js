/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Avatar: a person, as an image or as their initials.
 *
 * The `src` is validated through `primitives.safeUrl` before it ever reaches the
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

import {
  defineComponent,
  makeElement,
  makeTextNode,
  primitives,
  setAttr,
  setText,
  setVisible
} from '../.plugin/index.js';

const NAME = 'avatar';
const ROOT_CLASS = 'cloudcanvas-lib-avatar';
const IMAGE_CLASS = 'cloudcanvas-lib-avatar-image';
const INITIALS_CLASS = 'cloudcanvas-lib-avatar-initials';

/** `md` is the base rule, so it is the absence of a size modifier. */
const SIZES = ['sm', 'lg'];

const ALLOWED_KEYS = ['name', 'src', 'size'];

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

function build(pin, contentEl) {
  const root = makeElement('div', ROOT_CLASS);
  const image = makeElement('img', IMAGE_CLASS);
  const initials = makeElement('span', INITIALS_CLASS);
  const initialsText = makeTextNode(initials);

  initials.setAttribute('role', 'img');
  root.appendChild(image);
  root.appendChild(initials);
  contentEl.replaceChildren(root);

  return { root, image, initials, initialsText };
}

function update(pin, contents, bindings, cache) {
  const name = contents.get('name');
  const label = name === undefined || name === null ? '' : String(name);
  // `safeUrl` answers with the fallback - here, the empty string - for anything
  // it will not vouch for, so "unsafe" and "absent" collapse into one branch.
  const url = primitives.safeUrl(contents.get('src'), '');
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

let handle = null;

/** Register the Avatar display type once; a second call returns the same handle. */
export function registerAvatar() {
  if (!handle) {
    handle = defineComponent({
      name: NAME,
      build,
      update,
      chrome: false,
      allowedKeys: ALLOWED_KEYS
    });
  }
  return handle;
}

/** Create an Avatar Pin on `session`; see `./text.js` on the option order. */
export function createAvatarPin(session, options = {}) {
  registerAvatar();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
