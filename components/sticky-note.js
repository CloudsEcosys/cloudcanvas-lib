/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * StickyNote: a bulletin-board note - paper, pushpin, a tilt, five colours,
 * and a body you double-click to write in.
 *
 *   registerStickyNote();
 *   const note = createStickyNote(app, { x: 80, y: 60, title: 'Idea', color: 'pink' });
 *
 * Three decisions carry this file:
 *
 *   - **The editor is in the template.** A `<textarea>` sits beside the body from
 *     the start and visibility picks one. Opening it takes the blit's edit lock
 *     (`cloudcanvas/edit`), so a render during a keystroke cannot destroy the
 *     caret; closing it commits first and releases second, so the one deferred
 *     render lands on the committed body. Escape hides the editor *before* the
 *     blur it causes can commit.
 *   - **A swatch is a real `<button>`**, `aria-pressed` for the current colour
 *     and a full hit target drawing a small dot, so keyboard users can recolour
 *     a note and the sheet's `--cc-control-min` holds.
 *   - **The tilt is a content key, painted as a custom property.** `tilt` is the
 *     note's rotation in degrees (seeded when a note is created without one);
 *     `render` writes it as `--cc-sticky-tilt` and the sheet does the `rotate()`,
 *     so the widget never writes a `transform` and a theme can neutralise every tilt.
 */
import { blit } from '../../.plugin/core/index.js';
import { begin, end } from '../../.plugin/addons/edit.js';
import { leadingText, setAttr, setContent, setText, setVisible, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { asText } from '../coerce.js';
import { injectComponentStyles } from './styles.js';

/** The type name. */
export const STICKY_NOTE_TYPE = 'sticky-note';

/** The paper colours, in swatch order. A closed set: the value reaches an attribute. */
export const STICKY_THEMES = /* @__PURE__ */ Object.freeze(['yellow', 'pink', 'cyan', 'lime', 'orange']);

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const STICKY_CLS = /* @__PURE__ */ Object.freeze({
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

/** Seeded tilt range, in degrees either side of upright. */
const TILT_RANGE = 3;

/** The declared theme, or the default for anything that is not one. */
function themeOf(value) {
  return STICKY_THEMES.includes(value) ? value : DEFAULT_THEME;
}

/** A note's nodes, found under its element. */
function nodesOf(host) {
  const find = (className) => host.querySelector(`.${className}`);
  return { card: find(STICKY_CLS.ROOT), body: find(STICKY_CLS.BODY), editor: find(STICKY_CLS.EDITOR) };
}

/* ------------------ EDITING ------------------ */

/** Open the body editor, taking the edit lock. @returns {boolean} whether it opened */
export function beginStickyEdit(b) {
  const { body, editor } = nodesOf(b.el);
  if (!editor || !editor.hidden) return false;
  editor.value = asText(b.spec.stickyNote?.body);
  begin(b, editor);
  setVisible(body, false);
  setVisible(editor, true);
  editor.focus();
  return true;
}

/**
 * Close the body editor: commit the text or discard it, then release the lock.
 * The editor is hidden *first*: hiding a focused element blurs it, and the blur
 * listener calls back in here, finds it hidden and returns - so a cancel can
 * never be turned into a commit by its own blur.
 * @returns {boolean} whether it closed
 */
export function endStickyEdit(b, commit = true) {
  const { body, editor } = nodesOf(b.el);
  if (!editor || editor.hidden) return false;
  const next = editor.value.trim();
  setVisible(editor, false);
  setVisible(body, true);
  if (commit) {
    setContent(b, 'body', next);
    b.emit('note:edited', { body: next });
  }
  end(b);
  return true;
}

/* ------------------ TEMPLATE ------------------ */

/** One colour swatch: a real button carrying its theme as data and as its name. */
function swatchHtml(theme) {
  return `<button class="${STICKY_CLS.SWATCH}" type="button" data-theme="${theme}" aria-label="${theme}"`
    + ` aria-pressed="false" title="${theme}"></button>`;
}

const HTML = `<div class="cloudcanvas-component ${STICKY_CLS.ROOT}">`
  + `<div class="${STICKY_CLS.PINHEAD}"></div>`
  + `<div class="${STICKY_CLS.HEADER}"><div class="${STICKY_CLS.TITLE}"></div><span class="${STICKY_CLS.TAG}"></span></div>`
  + `<div class="${STICKY_CLS.BODY}"></div>`
  + `<textarea class="${STICKY_CLS.EDITOR}" aria-label="Note body" hidden></textarea>`
  + `<div class="${STICKY_CLS.FOOTER}"><div class="${STICKY_CLS.SWATCHES}" role="group" aria-label="Note colour">`
  + STICKY_THEMES.map(swatchHtml).join('') + '</div></div></div>';

/** The nodes, and the listeners: double-click opens the editor, its keys and blur close it, a swatch recolours. */
function bind(host, on) {
  const b = blit(host);
  const { card, body, editor } = nodesOf(host);
  on(body, 'dblclick', (event) => {
    event.stopPropagation();
    beginStickyEdit(b);
  });
  on(editor, 'keydown', (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      endStickyEdit(b, false);
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      endStickyEdit(b, true);
    }
  });
  on(editor, 'blur', () => endStickyEdit(b, true));
  const swatches = Array.from(host.querySelectorAll(`.${STICKY_CLS.SWATCH}`));
  for (const swatch of swatches) on(swatch, 'click', () => setContent(b, 'color', swatch.getAttribute('data-theme')));
  const title = host.querySelector(`.${STICKY_CLS.TITLE}`);
  const tag = host.querySelector(`.${STICKY_CLS.TAG}`);
  return { card, titleText: leadingText(title), tag, tagText: leadingText(tag), bodyText: leadingText(body), swatches };
}

function render(bindings, contents, cache) {
  const theme = themeOf(contents.get('color'));
  const tag = asText(contents.get('tag'));
  const tilt = Number(contents.get('tilt'));
  setText(bindings.titleText, contents.get('title'));
  setText(bindings.bodyText, contents.get('body'));
  setText(bindings.tagText, tag === '' ? '' : `#${tag}`);
  setVisible(bindings.tag, tag !== '');
  setAttr(bindings.card, 'data-theme', theme, cache, 'theme');
  setAttr(bindings.card, 'style', `--cc-sticky-tilt:${Number.isFinite(tilt) ? tilt : 0}deg;`, cache, 'tilt');
  for (const swatch of bindings.swatches) {
    const pressed = swatch.getAttribute('data-theme') === theme ? 'true' : 'false';
    if (swatch.getAttribute('aria-pressed') !== pressed) swatch.setAttribute('aria-pressed', pressed);
  }
}

/* ------------------ REGISTRATION ------------------ */

const SPEC = Object.freeze({ name: STICKY_NOTE_TYPE, html: HTML, keys: ['title', 'body', 'color', 'tag', 'tilt'], bind, render });

/** Define the sticky note widget, once. @returns {object} its type */
export function registerStickyNote() {
  injectComponentStyles();
  return widget(SPEC);
}

/**
 * A sticky note in `parent`. `title`, `body`, `color`, `tag` and `tilt` (degrees; seeded
 * when absent) are contents; the rest is spec.
 */
export function createStickyNote(parent, options = {}) {
  registerStickyNote();
  const tilt = options.tilt ?? Number((Math.random() * TILT_RANGE * 2 - TILT_RANGE).toFixed(1));
  return parent.blit(widgetSpec(STICKY_NOTE_TYPE, {
    x: 100, y: 100, w: 180, h: 180, chrome: false,
    title: 'Note', body: 'Type your ideas here...', color: DEFAULT_THEME, tag: '',
    ...options, tilt
  }));
}
