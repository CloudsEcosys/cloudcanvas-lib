/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Chat: a message Pin with reaction toggles, and a composer Pin that adds one.
 *
 * Reactions are real toggle buttons - `aria-pressed` is both the state a
 * screen reader hears and the hook the sheet styles - reconciled by emoji so
 * the button under the pointer is the button that stays. The emoji and the
 * count are text nodes written through `setText`; nothing a caller supplies
 * is ever parsed as markup, which closes the injection the previous
 * `innerHTML` pill left open.
 *
 * A caller-supplied avatar colour is a per-instance value, so it lands as two
 * custom properties the sheet reads - the fill, and a foreground picked by
 * `contrastTextFor` to read on it - exactly as `lib/badge.js` publishes a
 * tone. With no colour supplied the sheet falls back to the badge tokens,
 * which the theme already keeps readable.
 */

import {
  KEY_ATTR,
  PinEvent,
  ConnectableTrait,
  FocussableTrait,
  ScopeTrait,
  contrastTextFor,
  makeElement,
  makeTextNode,
  reconcileKeyedList,
  setAttr,
  setText
} from '../../src/index.js';
import {
  claimHost,
  createComponentPin,
  makeRegistrar,
  splitOptions
} from './registrar.js';

/** Registry names, and the `type` a caller creates each Pin by. */
export const CHAT_MESSAGE_TYPE = 'chat-message';
export const CHAT_INPUT_TYPE = 'chat-input';

/** Every class these widgets emit. Styled by `COMPONENT_DEFAULT_CSS`. */
export const CHAT_CLS = Object.freeze({
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

/** The events the two widgets transmit, bubbling up the scope chain. */
export const REACTION_EVENT = 'chat:reaction';
export const SENT_EVENT = 'chat:sent';

const MESSAGE_KEYS = ['author', 'handle', 'avatarColor', 'time', 'text', 'reactions'];
const INPUT_KEYS = ['placeholder'];

/** Only a hex colour has a luminance to pick a foreground against. */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** A content value as a string; `undefined` and `null` are the empty string. */
function asText(value) {
  return value === undefined || value === null ? '' : String(value);
}

/** First letter of each of the first two words, or `U` for nobody. */
function initialsOf(author) {
  const initials = asText(author)
    .trim()
    .split(/\s+/)
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
 * Toggle one reaction, immutably, and announce it.
 *
 * @returns {boolean} whether a reaction was toggled
 */
export function toggleChatReaction(pin, index) {
  const reactions = pin.contents.get('reactions');
  if (!Array.isArray(reactions) || !reactions[index]) return false;

  const current = reactions[index];
  const count = Number(current.count) || 0;
  const reaction = current.reacted
    ? { ...current, reacted: false, count: Math.max(0, count - 1) }
    : { ...current, reacted: true, count: count + 1 };

  const next = reactions.map((entry, position) => (position === index ? reaction : entry));
  pin.setContent('reactions', next);

  pin.transmit(new PinEvent(REACTION_EVENT, {
    payload: { reaction, messageId: pin.id },
    bubbles: true,
    source: pin
  }));
  return true;
}

/** Resolve the pill a click landed on and toggle its reaction. */
function onReactionClick(pin, container, event) {
  const target = event.target;
  const pill = target && typeof target.closest === 'function' ? target.closest(`.${CHAT_CLS.PILL}`) : null;
  if (!pill || !container.contains(pill)) return;

  const reactions = pin.contents.get('reactions');
  const key = pill.getAttribute(KEY_ATTR);
  const index = Array.isArray(reactions)
    ? reactions.findIndex((entry, position) => String(reactionKey(entry, position)) === key)
    : -1;
  if (index !== -1) toggleChatReaction(pin, index);
}

/* ------------------ MESSAGE TEMPLATE ------------------ */

/** One reaction: a toggle button holding two text nodes. */
function makePill() {
  const pill = makeElement('button', CHAT_CLS.PILL);
  pill.setAttribute('type', 'button');
  pill.setAttribute('aria-pressed', 'false');
  const emoji = makeElement('span', CHAT_CLS.PILL_EMOJI);
  makeTextNode(emoji);
  const count = makeElement('span', CHAT_CLS.PILL_COUNT);
  makeTextNode(count);
  pill.append(emoji, count);
  return pill;
}

function updatePill(pill, reaction) {
  const pressed = reaction && reaction.reacted ? 'true' : 'false';
  setText(pill.firstElementChild.firstChild, reaction && reaction.emoji);
  setText(pill.lastElementChild.firstChild, reaction && reaction.count);
  if (pill.getAttribute('aria-pressed') !== pressed) pill.setAttribute('aria-pressed', pressed);
}

function buildMessage(pin, contentEl) {
  claimHost(contentEl);
  const card = makeElement('article', `cloudcanvas-component cloudcanvas-component-card ${CHAT_CLS.ROOT}`);

  const avatar = makeElement('span', CHAT_CLS.AVATAR);
  avatar.setAttribute('aria-hidden', 'true');
  const avatarText = makeTextNode(avatar);

  const content = makeElement('div', CHAT_CLS.CONTENT);
  const meta = makeElement('div', CHAT_CLS.META);
  const author = makeElement('span', CHAT_CLS.AUTHOR);
  const authorText = makeTextNode(author);
  const time = makeElement('span', CHAT_CLS.TIME);
  const timeText = makeTextNode(time);
  meta.append(author, time);

  const text = makeElement('div', CHAT_CLS.TEXT);
  const bodyText = makeTextNode(text);

  const reactions = makeElement('div', CHAT_CLS.REACTIONS);
  reactions.addEventListener('click', (event) => onReactionClick(pin, reactions, event));

  content.append(meta, text, reactions);
  card.append(avatar, content);
  contentEl.replaceChildren(card);

  return { card, avatar, avatarText, authorText, timeText, bodyText, reactions };
}

function updateMessage(pin, contents, bindings, cache) {
  const author = asText(contents.get('author'));
  const handle = asText(contents.get('handle'));
  const reactions = contents.get('reactions');

  setText(bindings.avatarText, initialsOf(author));
  setAttr(bindings.avatar, 'style', avatarStyle(contents.get('avatarColor')), cache, 'avatarStyle');
  setText(bindings.authorText, handle === '' ? author : `${author} (${handle})`);
  setText(bindings.timeText, contents.get('time'));
  setText(bindings.bodyText, contents.get('text'));

  reconcileKeyedList(bindings.reactions, Array.isArray(reactions) ? reactions : [], {
    key: reactionKey,
    create: makePill,
    update: updatePill
  });
}

/* ------------------ COMPOSER TEMPLATE ------------------ */

/**
 * Add a message to the channel the composer sits in, and announce it.
 *
 * @returns {Pin|null} the message Pin, or null when the composer has no channel
 */
export function sendChatMessage(pin, text) {
  const value = asText(text).trim();
  if (value === '') return null;

  const session = pin.session;
  const channel = pin.parent;
  let message = null;
  if (session && channel) {
    // Below the channel's existing children, which include this composer.
    const count = channel.children ? channel.children.size : 0;
    message = createChatMessagePin(session, {
      parent: channel,
      x: 20,
      y: 70 + (count - 1) * 85,
      width: 360,
      height: 75,
      author: 'You',
      handle: '@you',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: value
    });
  }

  pin.transmit(new PinEvent(SENT_EVENT, {
    payload: { text: value, channel: channel ? channel.id : null },
    bubbles: true,
    source: pin
  }));
  return message;
}

function buildInput(pin, contentEl) {
  claimHost(contentEl);
  const bar = makeElement('form', `cloudcanvas-component cloudcanvas-component-card ${CHAT_CLS.INPUT_BAR}`);

  const field = makeElement('input', CHAT_CLS.INPUT_FIELD);
  field.setAttribute('type', 'text');
  field.setAttribute('aria-label', 'Message');
  field.setAttribute('autocomplete', 'off');

  const send = makeElement('button', `cloudcanvas-component-btn ${CHAT_CLS.SEND}`);
  send.setAttribute('type', 'submit');
  send.appendChild(document.createTextNode('Send'));

  // A form gives Enter its native meaning; the submit is what both routes reach.
  bar.addEventListener('submit', (event) => {
    event.preventDefault();
    if (sendChatMessage(pin, field.value)) field.value = '';
  });

  bar.append(field, send);
  contentEl.replaceChildren(bar);
  return { bar, field, send };
}

function updateInput(pin, contents, bindings, cache) {
  setAttr(bindings.field, 'placeholder', asText(contents.get('placeholder')), cache, 'placeholder');
}

/* ------------------ REGISTRATION ------------------ */

/** Register the chat message, once per registry; see `./registrar.js`. */
export const registerChatMessage = makeRegistrar({
  name: CHAT_MESSAGE_TYPE,
  build: buildMessage,
  update: updateMessage,
  chrome: false,
  allowedKeys: MESSAGE_KEYS
});

/** Register the composer, once per registry; see `./registrar.js`. */
export const registerChatInput = makeRegistrar({
  name: CHAT_INPUT_TYPE,
  build: buildInput,
  update: updateInput,
  chrome: false,
  allowedKeys: INPUT_KEYS
});

/**
 * Create a chat message Pin; `replyTo` draws a dashed thread to another message.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options]
 * @returns {Pin}
 */
export function createChatMessagePin(session, options = {}) {
  const { pinOptions, contents } = splitOptions(options, [
    ['author', 'User'],
    ['handle', ''],
    ['avatarColor', ''],
    ['time', '12:00 PM'],
    ['text', ''],
    ['reactions', [
      { emoji: '👍', count: 1, reacted: false },
      { emoji: '❤️', count: 2, reacted: false }
    ]]
  ], { x: 20, y: 80, width: 360, height: 85 });

  const { replyTo, ...rest } = pinOptions;
  const traits = Array.isArray(rest.traits) ? [...rest.traits] : [];
  if (replyTo) {
    // No stroke stated: the trait's own default is the `--cc-connector` token.
    traits.push(new ConnectableTrait({ connections: [replyTo], strokeWidth: 2, dashed: true }));
  }
  rest.traits = traits;

  return createComponentPin(session, registerChatMessage, rest, contents, false);
}

/**
 * Create a composer Pin: fixed, unselectable, chromeless.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options] `placeholder` becomes content; the rest are Pin options
 * @returns {Pin}
 */
export function createChatInputPin(session, options = {}) {
  const { pinOptions, contents } = splitOptions(options, [
    ['placeholder', 'Type a message... (Press Enter to send)']
  ], { x: 20, y: 420, width: 360, height: 48, draggable: false, selectable: false });

  return createComponentPin(session, registerChatInput, pinOptions, contents, false);
}

/**
 * Create a channel: a plain focussable scope Pin on the core card, which the
 * messages and the composer are placed inside.
 */
export function createChatChannelPin(session, options = {}) {
  return session.createPin({
    id: options.id || 'chat_channel',
    x: options.x !== undefined ? options.x : 60,
    y: options.y !== undefined ? options.y : 60,
    width: options.width || 420,
    height: options.height || 500,
    contents: new Map([
      ['title', options.title || '#general-lounge'],
      ['body', options.topic || 'Engineering discussion and threads']
    ]),
    traits: [new ScopeTrait(), new FocussableTrait({ padding: 40, maxZoom: 2.2 })]
  });
}
