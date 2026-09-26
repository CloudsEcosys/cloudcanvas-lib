/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * StickyNote: a bulletin-board note - paper, pushpin, a tilt, five colours,
 * and a body you double-click to write in.
 *
 * Three decisions carry this file:
 *
 *   - **The editor is built once.** A `<textarea>` sits beside the body from
 *     the first frame and visibility picks one, the same "hide it, do not
 *     rebuild it" rule `lib/input.js` follows. Opening it takes the Pin's edit
 *     lock (`pin.beginEdit`), so a render during a keystroke cannot destroy the
 *     caret; closing it commits first and releases second, so the one deferred
 *     render lands on the committed body. Escape hides the editor *before*
 *     the blur it causes can commit - which is the race the previous editor
 *     (a textarea created per edit and torn down by `textContent`) lost.
 *   - **A swatch is a real `<button>`**, `aria-pressed` for the current colour
 *     and a full hit target drawing a small dot, so keyboard users can recolour
 *     a note and the sheet's `--cc-control-min` holds.
 *   - **The tilt is a vector, painted as a custom property.** The primary
 *     vector is the note's rotation in degrees; `update` writes it as
 *     `--cc-sticky-tilt` and the sheet does the `rotate()`, so the widget
 *     never writes a `transform` and a theme can neutralise every tilt at once.
 */

import {
  PinEvent,
  makeElement,
  makeTextNode,
  setAttr,
  setText,
  setVisible
} from '../../.plugin/index.js';
import {
  bindingsOf,
  claimHost,
  createComponentPin,
  makeRegistrar,
  splitOptions
} from './registrar.js';
import { asText } from '../coerce.js';

/** Registry name, and the `type` a caller creates a Pin by. */
export const STICKY_NOTE_TYPE = 'sticky-note';

/** The paper colours, in swatch order. A closed set: the value reaches an attribute. */
export const STICKY_THEMES = Object.freeze(['yellow', 'pink', 'cyan', 'lime', 'orange']);

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const STICKY_CLS = Object.freeze({
  ROOT: 'cloudcanvas-sticky-note',
  PINHEAD: 'cloudcanvas-sticky-pinhead',
  HEADER: 'cloudcanvas-sticky-header',
  TITLE: 'cloudcanvas-sticky-title',
  TAG: 'cloudcanvas-sticky-tag',
  BODY: 'cloudcanvas-sticky-body',
  EDITOR: 'cloudcanvas-sticky-editor',
  FOOTER: 'cloudcanvas-sticky-footer',
  SWATCHES: 'cloudcanvas-sticky-swatches',
  SWATCH: 'cloudcanvas-sticky-swatch'
});

const DEFAULT_THEME = 'yellow';
const ALLOWED_KEYS = ['title', 'body', 'color', 'tag'];

/** Seeded tilt range, in degrees either side of upright. */
const TILT_RANGE = 3;

/** The declared theme, or the default for anything that is not one. */
function themeOf(value) {
  return STICKY_THEMES.includes(value) ? value : DEFAULT_THEME;
}

/** The note's rotation, from its primary vector. */
function tiltOf(pin) {
  const tilt = Number(pin.particle.getPrimaryVector());
  return Number.isFinite(tilt) ? tilt : 0;
}

/* ------------------ EDITING ------------------ */

/** Open the body editor, taking the edit lock. */
export function beginStickyEdit(pin) {
  const bindings = bindingsOf(pin);
  if (!bindings || !bindings.editor.hidden) return false;

  bindings.editor.value = asText(pin.contents.get('body'));
  pin.beginEdit(bindings.editor);
  setVisible(bindings.body, false);
  setVisible(bindings.editor, true);
  bindings.editor.focus();
  return true;
}

/**
 * Close the body editor: commit the text or discard it, then release the lock.
 *
 * The editor is hidden *first*. Hiding a focused element blurs it, and the
 * blur listener calls back in here - which finds the editor already hidden
 * and returns, so a cancel can never be turned into a commit by its own blur.
 */
export function endStickyEdit(pin, commit = true) {
  const bindings = bindingsOf(pin);
  if (!bindings || bindings.editor.hidden) return false;

  const next = bindings.editor.value.trim();
  setVisible(bindings.editor, false);
  setVisible(bindings.body, true);

  if (commit) {
    pin.setContent('body', next);
    pin.transmit(new PinEvent('note:edited', { payload: { body: next }, source: pin }));
  }
  pin.endEdit();
  return true;
}

/** Wire the body's double-click and the editor's keys and blur. */
function wireEditor(pin, body, editor) {
  body.addEventListener('dblclick', (event) => {
    event.stopPropagation();
    beginStickyEdit(pin);
  });

  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      endStickyEdit(pin, false);
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      endStickyEdit(pin, true);
    }
  });

  editor.addEventListener('blur', () => endStickyEdit(pin, true));
}

/* ------------------ TEMPLATE ------------------ */

/** One colour swatch: a real button carrying its theme as data and as its name. */
function makeSwatch(pin, theme) {
  const swatch = makeElement('button', STICKY_CLS.SWATCH);
  swatch.setAttribute('type', 'button');
  swatch.setAttribute('data-theme', theme);
  swatch.setAttribute('aria-label', theme);
  swatch.setAttribute('aria-pressed', 'false');
  swatch.setAttribute('title', theme);
  swatch.addEventListener('click', () => pin.setContent('color', theme));
  return swatch;
}

function build(pin, contentEl) {
  claimHost(contentEl);
  const card = makeElement('div', `cloudcanvas-component ${STICKY_CLS.ROOT}`);
  card.appendChild(makeElement('div', STICKY_CLS.PINHEAD));

  const header = makeElement('div', STICKY_CLS.HEADER);
  const title = makeElement('div', STICKY_CLS.TITLE);
  const titleText = makeTextNode(title);
  const tag = makeElement('span', STICKY_CLS.TAG);
  const tagText = makeTextNode(tag);
  header.append(title, tag);

  const body = makeElement('div', STICKY_CLS.BODY);
  const bodyText = makeTextNode(body);
  const editor = makeElement('textarea', STICKY_CLS.EDITOR);
  editor.setAttribute('aria-label', 'Note body');
  editor.hidden = true;
  wireEditor(pin, body, editor);

  const footer = makeElement('div', STICKY_CLS.FOOTER);
  const swatchGroup = makeElement('div', STICKY_CLS.SWATCHES);
  swatchGroup.setAttribute('role', 'group');
  swatchGroup.setAttribute('aria-label', 'Note colour');
  const swatches = STICKY_THEMES.map((theme) => makeSwatch(pin, theme));
  swatchGroup.append(...swatches);
  footer.appendChild(swatchGroup);

  card.append(header, body, editor, footer);
  contentEl.replaceChildren(card);

  return { card, titleText, tag, tagText, body, bodyText, editor, swatches };
}

function update(pin, contents, bindings, cache) {
  const theme = themeOf(contents.get('color'));
  const tag = asText(contents.get('tag'));

  setText(bindings.titleText, contents.get('title'));
  setText(bindings.bodyText, contents.get('body'));
  setText(bindings.tagText, tag === '' ? '' : `#${tag}`);
  setVisible(bindings.tag, tag !== '');

  setAttr(bindings.card, 'data-theme', theme, cache, 'theme');
  setAttr(bindings.card, 'style', `--cc-sticky-tilt:${tiltOf(pin)}deg;`, cache, 'tilt');

  for (const swatch of bindings.swatches) {
    const pressed = swatch.getAttribute('data-theme') === theme ? 'true' : 'false';
    if (swatch.getAttribute('aria-pressed') !== pressed) swatch.setAttribute('aria-pressed', pressed);
  }
}

/** Seed a slight tilt for a note created without one. */
function onAttach(pin) {
  if (pin.particle.getVectors().length === 0) {
    pin.addVector(Number((Math.random() * TILT_RANGE * 2 - TILT_RANGE).toFixed(1)));
  }
}

/* ------------------ REGISTRATION ------------------ */

/** Register the sticky note, once per registry; see `./registrar.js`. */
export const registerStickyNote = makeRegistrar({
  name: STICKY_NOTE_TYPE,
  build,
  update,
  chrome: false,
  allowedKeys: ALLOWED_KEYS,
  defaults: { onAttach }
});

/**
 * Create a sticky note Pin.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options] `title`, `body`, `color`, `tag` become contents;
 *   `tilt` (degrees) seeds the primary vector; the rest are Pin options
 * @returns {Pin}
 */
export function createStickyNotePin(session, options = {}) {
  const { pinOptions, contents } = splitOptions(options, [
    ['title', 'Note'],
    ['body', 'Type your ideas here...'],
    ['color', DEFAULT_THEME],
    ['tag', '']
  ], { x: 100, y: 100, width: 180, height: 180 });

  if (pinOptions.tilt !== undefined) {
    pinOptions.vectors = [Number(pinOptions.tilt)];
    delete pinOptions.tilt;
  }

  return createComponentPin(session, registerStickyNote, pinOptions, contents, false);
}
