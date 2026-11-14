/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The board components, second half: the three communication widgets
 * (breadcrumb, chat, calendar event) and the two function traits. The board
 * widgets and the registration contract are in `./lib-components.test.js`; the
 * stylesheet and its contrast are in `./lib-components-styles.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { announce, LIVE_REGION_CLASS } from '../../plugins/announce.js';
import { go, VIEW_CHANGE_EVENT } from '../../plugins/history.js';
import { contentOf, setContent } from '../../plugins/widget.js';
import {
  BREADCRUMB_CLS,
  CHAT_CLS,
  EDITABLE_INPUT_CLASS,
  EVENT_CLS,
  STICKY_CLS,
  acknowledgeCalendarEvent,
  createBreadcrumb,
  createCalendarEvent,
  createChatInput,
  createChatMessage,
  createStickyNote,
  createWorkspace,
  editable,
  navigateBreadcrumbBack,
  registerComponents,
  resolveCalendarEvent,
  sendChatMessage,
  snapPosition,
  snapToGrid,
  toggleChatReaction
} from '../../components/index.js';
import { coreScene, signals } from '../helpers/core-scene.js';

registerComponents();
blit.use({ announce });

const query = (b, className) => b.el.querySelector(`.${className}`);
const queryAll = (b, className) => Array.from(b.el.querySelectorAll(`.${className}`));
const click = (element) => element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const dblclick = (element) => element.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
const key = (element, name) => element.dispatchEvent(new window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
const heard = (b, type) => {
  const seen = signals(b, type);
  return { get list() { return seen.map((each) => each.payload); } };
};

/* ------------------ BREADCRUMB ------------------ */

test('BreadcrumbBar - two buttons and one aria-current crumb; Back steps the root history', (t) => {
  const { app, host } = coreScene(t);
  const scope = createWorkspace(app, { id: 'ws', title: 'Alpha Engineering' });
  const crumb = createBreadcrumb(scope, { id: 'crumb', rootName: 'Home', title: '' });

  assert.equal(query(crumb, BREADCRUMB_CLS.BACK).tagName, 'BUTTON');
  assert.equal(query(crumb, BREADCRUMB_CLS.CRUMB).tagName, 'BUTTON');
  assert.equal(query(crumb, BREADCRUMB_CLS.CRUMB).textContent, '🏠 Home');
  assert.equal(query(crumb, BREADCRUMB_CLS.CURRENT).getAttribute('aria-current'), 'page');
  assert.equal(query(crumb, BREADCRUMB_CLS.CURRENT).textContent, 'Alpha Engineering', 'an empty title did not fall back to the parent');
  setContent(crumb, 'title', 'Named');
  assert.equal(query(crumb, BREADCRUMB_CLS.CURRENT).textContent, 'Named');

  go(app, scope);
  assert.equal(app.root, scope);
  const views = signals(app, VIEW_CHANGE_EVENT);
  const back = heard(crumb, 'navigation:back');
  click(query(crumb, BREADCRUMB_CLS.BACK));
  assert.equal(app.root.el, host, 'Back did not return to the whole canvas');
  assert.equal(views.length, 1);
  assert.equal(navigateBreadcrumbBack(crumb), false, 'an empty history still stepped');
  click(query(crumb, BREADCRUMB_CLS.CRUMB));
  assert.deepEqual(back.list, [{ from: 'crumb' }, { from: 'crumb' }, { from: 'crumb' }]);
});

/* ------------------ CHAT ------------------ */

test('ChatMessage - reactions are aria-pressed buttons, toggled immutably, and never markup', (t) => {
  const { app } = coreScene(t);
  const payload = '<img src=x onerror="window.__pwned=1">';
  const msg = createChatMessage(app, {
    id: 'msg',
    author: 'Ada Lovelace',
    handle: '@ada',
    avatarColor: '#6366f1',
    text: payload,
    reactions: [{ emoji: payload, count: 4, reacted: false }, { emoji: '🚀', count: 1, reacted: true }]
  });

  assert.ok(query(msg, CHAT_CLS.AUTHOR).textContent.includes('Ada Lovelace (@ada)'));
  assert.equal(query(msg, CHAT_CLS.TEXT).textContent, payload);
  assert.equal(msg.el.querySelector('img'), null, 'caller text became markup');
  assert.equal(query(msg, CHAT_CLS.AVATAR).textContent, 'AL');
  assert.equal(query(msg, CHAT_CLS.AVATAR).getAttribute('style'), '--cc-chat-avatar-bg:#6366f1;--cc-chat-avatar-text:#f8fafc;');

  const pills = queryAll(msg, CHAT_CLS.PILL);
  assert.equal(pills.length, 2);
  assert.ok(pills.every((pill) => pill.tagName === 'BUTTON'));
  assert.deepEqual(pills.map((pill) => pill.getAttribute('aria-pressed')), ['false', 'true']);
  assert.equal(pills[1].textContent, '🚀1');

  const reactions = heard(msg, 'chat:reaction');
  const before = contentOf(msg).reactions;
  click(pills[0].firstElementChild);
  assert.deepEqual(reactions.list, [{ reaction: { emoji: payload, count: 5, reacted: true }, messageId: 'msg' }]);
  assert.equal(before[0].reacted, false, 'the previous array was mutated');
  assert.equal(pills[0].getAttribute('aria-pressed'), 'true');
  assert.equal(pills[0], queryAll(msg, CHAT_CLS.PILL)[0], 'the pressed pill was rebuilt');

  toggleChatReaction(msg, 1);
  assert.equal(contentOf(msg).reactions[1].count, 0);
  assert.equal(toggleChatReaction(msg, 7), false);

  // No colour, no inline style: the sheet's badge tokens carry the avatar.
  setContent(msg, 'avatarColor', 'rebeccapurple');
  assert.equal(query(msg, CHAT_CLS.AVATAR).getAttribute('style'), '');

  // A reply draws a dashed thread through the connect trait.
  const reply = createChatMessage(app, { id: 'reply', replyTo: 'msg' });
  assert.deepEqual(reply.spec.connect, { connections: ['msg'], strokeWidth: 2, dashed: true });
  assert.equal(msg.spec.connect, undefined);
});

test('ChatInput - a real form: submit adds a message to the channel and emits chat:sent', (t) => {
  const { app } = coreScene(t);
  const channel = createWorkspace(app, { id: 'channel' });
  const composer = createChatInput(channel, { id: 'composer', placeholder: 'Say it' });
  const form = composer.el.firstElementChild;
  const field = query(composer, CHAT_CLS.INPUT_FIELD);
  assert.equal(form.tagName, 'FORM');
  assert.equal(field.getAttribute('placeholder'), 'Say it');
  assert.equal(query(composer, CHAT_CLS.SEND).getAttribute('type'), 'submit');

  const sent = heard(channel, 'chat:sent');
  field.value = '   ';
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  assert.deepEqual(sent.list, []);

  field.value = 'Live smoke test';
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(field.value, '');
  assert.deepEqual(sent.list, [{ text: 'Live smoke test', channel: 'channel' }]);
  const message = channel.blits.find((child) => contentOf(child).text === 'Live smoke test');
  assert.ok(message, 'no message was placed in the channel');
  assert.equal(message.el.getAttribute('data-type'), 'chat-message');
  assert.equal(contentOf(message).author, 'You');
  assert.equal(contentOf(message).avatarColor, '', 'the composer painted its own avatar colour');
  assert.equal(message.y, 70, 'the message did not land below the composer');
  assert.equal(sendChatMessage(composer, ''), null);

  // A composer on the root itself has no channel: nothing is placed, the send is still said.
  const loose = createChatInput(app, { id: 'loose' });
  assert.equal(sendChatMessage(loose, 'hello'), null);
});

/* ------------------ CALENDAR ------------------ */

test('CalendarEvent - severity rides data attributes; Ack and Resolve are buttons that announce', (t) => {
  const { app, host } = coreScene(t);
  app.set({ announce: true });
  const region = host.querySelector(`.${LIVE_REGION_CLASS}`);
  const event = createCalendarEvent(app, { id: 'event', title: 'Database Spike', severity: 'critical', status: 'active' });
  const card = query(event, EVENT_CLS.ROOT);
  const badge = query(event, EVENT_CLS.BADGE);
  assert.equal(card.getAttribute('data-severity'), 'critical');
  assert.equal(badge.getAttribute('data-severity'), 'critical');
  assert.equal(badge.textContent, 'active');
  assert.equal(badge.getAttribute('style'), null, 'the badge was painted inline');
  assert.equal(query(event, EVENT_CLS.ACK).tagName, 'BUTTON');
  assert.equal(query(event, EVENT_CLS.RESOLVE).tagName, 'BUTTON');

  const acked = heard(event, 'alert:acknowledged');
  const resolved = heard(event, 'alert:resolved');
  click(query(event, EVENT_CLS.ACK));
  assert.deepEqual(acked.list, [{ eventId: 'event', title: 'Database Spike' }]);
  assert.equal(contentOf(event).status, 'acknowledged');
  assert.equal(card.getAttribute('data-severity'), 'high');
  assert.ok(region.textContent.includes('Database Spike acknowledged'));

  resolveCalendarEvent(event);
  assert.deepEqual(resolved.list, [{ eventId: 'event', title: 'Database Spike' }]);
  assert.equal(contentOf(event).severity, 'info');
  assert.equal(badge.getAttribute('data-severity'), 'info');
  assert.ok(region.textContent.includes('Database Spike resolved'));

  acknowledgeCalendarEvent(event);
  assert.equal(contentOf(event).severity, 'info', 'acknowledging a resolved event re-raised it');
  setContent(event, 'severity', 'bogus');
  assert.equal(card.getAttribute('data-severity'), 'normal');
});

/* ------------------ FUNCTION TRAITS ------------------ */

test('editable - edits beside the title under the edit lock; Enter keeps, Escape drops', (t) => {
  const { app } = coreScene(t);
  const note = createStickyNote(app, { id: 'note', title: 'Before' });
  note.set({ editable: true });
  const title = query(note, STICKY_CLS.TITLE);
  const titleText = title.firstChild;
  const edited = heard(note, 'edited');

  dblclick(title);
  const input = title.nextElementSibling;
  assert.ok(input && input.classList.contains(EDITABLE_INPUT_CLASS), 'no editor was inserted beside the title');
  assert.equal(input.tagName, 'INPUT');
  assert.equal(input.value, 'Before');
  assert.equal(title.hidden, true);
  assert.equal(title.firstChild, titleText, 'the title\'s text node was replaced');
  assert.equal(note.el.hasAttribute('data-editing'), true);

  input.value = 'After';
  key(input, 'Enter');
  assert.equal(note.el.hasAttribute('data-editing'), false);
  assert.equal(title.hidden, false);
  assert.equal(input.parentNode, null);
  assert.equal(contentOf(note).title, 'After');
  assert.equal(titleText.data, 'After', 'the render after the edit missed the title');
  assert.deepEqual(edited.list, [{ key: 'title', value: 'After' }]);

  dblclick(title);
  const second = title.nextElementSibling;
  second.value = 'Dropped';
  key(second, 'Escape');
  second.dispatchEvent(new window.Event('blur'));
  assert.equal(contentOf(note).title, 'After');
  assert.equal(edited.list.length, 1);
  assert.equal(note.el.hasAttribute('data-editing'), false);

  // A double-click anywhere else is not an edit; stopping the trait cancels an open one.
  dblclick(query(note, STICKY_CLS.FOOTER));
  assert.equal(note.el.hasAttribute('data-editing'), false);
  dblclick(title);
  note.set({ editable: false });
  assert.equal(note.el.hasAttribute('data-editing'), false, 'stopping the trait left the edit open');
  assert.equal(title.nextElementSibling.classList.contains(EDITABLE_INPUT_CLASS), false);
  dblclick(title);
  assert.equal(title.nextElementSibling.classList.contains(EDITABLE_INPUT_CLASS), false);
  assert.equal(typeof editable, 'function');
});

test('snapToGrid - rides drag:end, and leaves a cancelled or a nested drag alone', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ id: 'snap', x: 47, y: 95, snapToGrid: { gridSize: 20 } });
  const inner = card.blit({ id: 'inner', x: 13, y: 13 });

  card.emit('drag:end', { x: 47, y: 95, cancelled: true });
  assert.deepEqual([card.x, card.y], [47, 95]);
  inner.emit('drag:end', { x: 13, y: 13, cancelled: false });
  assert.deepEqual([card.x, card.y], [47, 95], 'a nested blit\'s drag snapped its parent');

  card.emit('drag:end', { x: 47, y: 95, cancelled: false });
  assert.deepEqual([card.x, card.y], [40, 100]);
  assert.deepEqual(snapPosition(card, 20), { x: 40, y: 100 });

  card.set({ snapToGrid: false, x: 33, y: 33 });
  card.emit('drag:end', { x: 33, y: 33, cancelled: false });
  assert.deepEqual([card.x, card.y], [33, 33], 'a removed trait still snapped');
  assert.equal(typeof snapToGrid, 'function');
});
