/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Chat: a message with reaction toggles, and a composer that adds one.
 *
 *   registerChatMessage(); registerChatInput();
 *   createChatMessage(channel, { author: 'Ada', text: 'Hi', replyTo: 'msg-1' });
 *   createChatInput(channel, { placeholder: 'Say it' });   // submit: chat:sent
 *
 * Reactions are real toggle buttons - `aria-pressed` is both the state a screen
 * reader hears and the hook the sheet styles - reconciled by emoji so the button
 * under the pointer is the button that stays. The emoji and the count are Text
 * nodes; nothing a caller supplies is ever parsed as markup.
 *
 * A caller-supplied avatar colour is a per-instance value, so it lands as two
 * custom properties the sheet reads - the fill, and a foreground picked by
 * `contrastTextFor` to read on it. With no colour the sheet falls back to the
 * badge tokens. `replyTo` draws a dashed thread through the `connect` trait.
 * The composer is a `<form>`, so Enter and the Send button reach one `submit`;
 * it places the message in the container it sits in (its channel).
 */
import { blit } from '../../.plugin/core/index.js';
import { connect } from '../../.plugin/addons/connect.js';
import { reconcileKeyedList } from '../../.plugin/addons/keyed-list.js';
import { contentOf, leadingText, setAttr, setContent, setText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { contrastTextFor } from '../../.plugin/graphics/primitives/primitives.js';
import { asText } from '../coerce.js';
import { keyedIndexOf, withDefaults } from './registrar.js';
import { injectComponentStyles } from './styles.js';

/** The type names. */
export const CHAT_MESSAGE_TYPE = 'chat-message';
export const CHAT_INPUT_TYPE = 'chat-input';

/** Every class these widgets emit. Styled by `COMPONENT_DEFAULT_CSS`. */
export const CHAT_CLS = /* @__PURE__ */ Object.freeze({
  ROOT: 'cloudcanvas-chat-message-card',
  AVATAR: 'cloudcanvas-chat-avatar',
  CONTENT: 'cloudcanvas-chat-content',
  META: 'cloudcanvas-chat-meta',
  AUTHOR: 'cloudcanvas-chat-author',
  TIME: 'cloudcanvas-chat-time',
  TEXT: 'cloudcanvas-chat-text',
  REACTIONS: 'cloudcanvas-chat-reactions',
  PILL: 'cloudcanvas-chat-reaction-pill',
  PILL_EMOJI: 'cloudcanvas-chat-reaction-emoji',
  PILL_COUNT: 'cloudcanvas-chat-reaction-count',
  INPUT_BAR: 'cloudcanvas-chat-input-bar',
  INPUT_FIELD: 'cloudcanvas-chat-input-field',
  SEND: 'cloudcanvas-chat-send-btn'
});

/** The events the two widgets emit. */
export const REACTION_EVENT = 'chat:reaction';
export const SENT_EVENT = 'chat:sent';

/** Only a hex colour has a luminance to pick a foreground against. */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Where a sent message lands in its channel: below the channel's blits, one row each. */
const SENT_X = 20;
const SENT_TOP = 70;
const SENT_ROW = 85;

/** First letter of each of the first two words, or `U` for nobody. */
function initialsOf(author) {
  const initials = asText(author).trim().split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
  return initials === '' ? 'U' : initials;
}

/** The avatar's custom properties for a colour, or nothing for no colour. */
function avatarStyle(color) {
  const value = asText(color).trim();
  if (!HEX_COLOR.test(value)) return '';
  return `--cc-chat-avatar-bg:${value};--cc-chat-avatar-text:${contrastTextFor(value)};`;
}

/** A reaction's key: its emoji, or its position when it has none. */
function reactionKey(reaction, index) {
  return reaction && reaction.emoji !== undefined && reaction.emoji !== null ? reaction.emoji : index;
}

/* ------------------ BEHAVIOUR ------------------ */

/**
 * Toggle one reaction, immutably, and emit `chat:reaction`.
 * @returns {boolean} whether a reaction was toggled
 */
export function toggleChatReaction(b, index) {
  const reactions = contentOf(b).reactions;
  if (!Array.isArray(reactions) || !reactions[index]) return false;
  const current = reactions[index];
  const count = Number(current.count) || 0;
  const reaction = current.reacted
    ? { ...current, reacted: false, count: Math.max(0, count - 1) }
    : { ...current, reacted: true, count: count + 1 };
  setContent(b, 'reactions', reactions.map((entry, position) => (position === index ? reaction : entry)));
  b.emit(REACTION_EVENT, { reaction, messageId: b.el.id });
  return true;
}

/** The container a composer sends into: its parent blit, unless that is the root itself. */
function channelOf(b) {
  const parent = b.parent;
  return parent && !parent.el.hasAttribute('data-blit-root') ? parent : null;
}

/**
 * Add a message to the channel the composer sits in, and emit `chat:sent`.
 * @returns {object|null} the message blit, or null for empty text or no channel
 */
export function sendChatMessage(b, text) {
  const value = asText(text).trim();
  if (value === '') return null;
  const channel = channelOf(b);
  // Below the channel's existing blits, which include this composer.
  const message = channel ? createChatMessage(channel, {
    x: SENT_X, y: SENT_TOP + (channel.blits.length - 1) * SENT_ROW, w: 360, h: 75,
    author: 'You', handle: '@you', text: value,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }) : null;
  b.emit(SENT_EVENT, { text: value, channel: channel ? channel.el.id || null : null });
  return message;
}

/* ------------------ MESSAGE TEMPLATE ------------------ */

const MESSAGE_HTML = `<article class="cloudcanvas-component cloudcanvas-component-card ${CHAT_CLS.ROOT}">`
  + `<span class="${CHAT_CLS.AVATAR}" aria-hidden="true"></span>`
  + `<div class="${CHAT_CLS.CONTENT}"><div class="${CHAT_CLS.META}"><span class="${CHAT_CLS.AUTHOR}"></span>`
  + `<span class="${CHAT_CLS.TIME}"></span></div><div class="${CHAT_CLS.TEXT}"></div>`
  + `<div class="${CHAT_CLS.REACTIONS}"></div></div></article>`;

/** One reaction: a toggle button holding two Text nodes. */
function makePill() {
  const pill = document.createElement('button');
  pill.className = CHAT_CLS.PILL;
  pill.setAttribute('type', 'button');
  pill.setAttribute('aria-pressed', 'false');
  for (const className of [CHAT_CLS.PILL_EMOJI, CHAT_CLS.PILL_COUNT]) {
    const part = document.createElement('span');
    part.className = className;
    leadingText(part);
    pill.appendChild(part);
  }
  return pill;
}

function updatePill(pill, reaction) {
  const pressed = reaction && reaction.reacted ? 'true' : 'false';
  setText(pill.firstElementChild.firstChild, reaction && reaction.emoji);
  setText(pill.lastElementChild.firstChild, reaction && reaction.count);
  if (pill.getAttribute('aria-pressed') !== pressed) pill.setAttribute('aria-pressed', pressed);
}

/** The nodes, and one click listener on the reactions resolving the pill it landed on. */
function bindMessage(host, on) {
  const b = blit(host);
  const find = (className) => host.querySelector(`.${className}`);
  const reactions = find(CHAT_CLS.REACTIONS);
  on(reactions, 'click', (event) => {
    const index = keyedIndexOf(reactions, event.target, CHAT_CLS.PILL, contentOf(b).reactions, reactionKey);
    if (index !== -1) toggleChatReaction(b, index);
  });
  const avatar = find(CHAT_CLS.AVATAR);
  return {
    avatar, avatarText: leadingText(avatar), authorText: leadingText(find(CHAT_CLS.AUTHOR)),
    timeText: leadingText(find(CHAT_CLS.TIME)), bodyText: leadingText(find(CHAT_CLS.TEXT)), reactions
  };
}

function renderMessage(bindings, contents, cache) {
  const author = asText(contents.get('author'));
  const handle = asText(contents.get('handle'));
  const reactions = contents.get('reactions');
  setText(bindings.avatarText, initialsOf(author));
  setAttr(bindings.avatar, 'style', avatarStyle(contents.get('avatarColor')), cache, 'avatarStyle');
  setText(bindings.authorText, handle === '' ? author : `${author} (${handle})`);
  setText(bindings.timeText, contents.get('time'));
  setText(bindings.bodyText, contents.get('text'));
  reconcileKeyedList(bindings.reactions, Array.isArray(reactions) ? reactions : [], {
    key: reactionKey, create: makePill, update: updatePill
  });
}

/* ------------------ COMPOSER TEMPLATE ------------------ */

const INPUT_HTML = `<form class="cloudcanvas-component cloudcanvas-component-card ${CHAT_CLS.INPUT_BAR}">`
  + `<input class="${CHAT_CLS.INPUT_FIELD}" type="text" aria-label="Message" autocomplete="off">`
  + `<button class="cloudcanvas-component-btn ${CHAT_CLS.SEND}" type="submit">Send</button></form>`;

/** The field, and the form's `submit`: Enter and Send both reach it. */
function bindInput(host, on) {
  const b = blit(host);
  const form = host.querySelector(`.${CHAT_CLS.INPUT_BAR}`);
  const field = host.querySelector(`.${CHAT_CLS.INPUT_FIELD}`);
  on(form, 'submit', (event) => {
    event.preventDefault();
    if (sendChatMessage(b, field.value)) field.value = '';
  });
  return { field };
}

function renderInput(bindings, contents, cache) {
  setAttr(bindings.field, 'placeholder', asText(contents.get('placeholder')), cache, 'placeholder');
}

/* ------------------ REGISTRATION ------------------ */

const MESSAGE_SPEC = Object.freeze({
  name: CHAT_MESSAGE_TYPE, html: MESSAGE_HTML,
  keys: ['author', 'handle', 'avatarColor', 'time', 'text', 'reactions'], bind: bindMessage, render: renderMessage
});

const INPUT_SPEC = Object.freeze({
  name: CHAT_INPUT_TYPE, html: INPUT_HTML, keys: ['placeholder'], bind: bindInput, render: renderInput
});

/** Define the chat message widget, once, and name the `connect` trait a reply thread is. @returns {object} its type */
export function registerChatMessage() {
  injectComponentStyles();
  blit.use({ connect });
  return widget(MESSAGE_SPEC);
}

/** Define the composer widget, once. @returns {object} its type */
export function registerChatInput() {
  injectComponentStyles();
  return widget(INPUT_SPEC);
}

/**
 * A chat message in `parent`. `author`, `handle`, `avatarColor`, `time`, `text` and
 * `reactions` are contents; `replyTo` (an id) draws a dashed thread to that message;
 * the rest is spec.
 */
export function createChatMessage(parent, options = {}) {
  registerChatMessage();
  const { replyTo, ...rest } = options;
  // No stroke stated: the trait's own default is the `--cc-connector` token.
  const thread = replyTo ? { connect: { connections: [replyTo], strokeWidth: 2, dashed: true } } : {};
  return parent.blit(widgetSpec(CHAT_MESSAGE_TYPE, withDefaults({
    x: 20, y: 80, w: 360, h: 85, chrome: false,
    author: 'User', handle: '', avatarColor: '', time: '12:00 PM', text: '',
    reactions: [{ emoji: '👍', count: 1, reacted: false }, { emoji: '❤️', count: 2, reacted: false }],
    ...thread
  }, rest)));
}

/** A composer in `parent` (its channel). `placeholder` is content; the rest is spec. */
export function createChatInput(parent, options = {}) {
  registerChatInput();
  return parent.blit(widgetSpec(CHAT_INPUT_TYPE, withDefaults({
    x: 20, y: 420, w: 360, h: 48, chrome: false, placeholder: 'Type a message... (Press Enter to send)'
  }, options)));
}
