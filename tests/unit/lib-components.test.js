/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The board components as widgets on the blit core: registration is explicit,
 * every factory makes a widget blit with a closed schema, a no-op re-render
 * writes nothing, and caller-supplied text is never markup. This file carries
 * the registration contract and the six board widgets; the communication
 * widgets and the two traits are in `./lib-components-comms.test.js`, the
 * stylesheet and its contrast in `./lib-components-styles.test.js`.
 *
 * The first test asserts that importing the barrel registered nothing, and has
 * to run first: node's test runner runs a file's tests in order, and every
 * file is its own process, so nothing outside this file can have registered
 * a component before it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from 'cloudcanvas';
import { VIEW_CHANGE_EVENT } from '../../plugins/history.js';
import { contentOf, setContent } from '../../plugins/widget.js';
import {
  COMPONENT_STYLE_ID,
  FLOW_CLS,
  MEDIA_CLS,
  STICKY_CLS,
  TASK_CLS,
  TELEMETRY_CLS,
  WORKSPACE_CLS,
  beginStickyEdit,
  createBreadcrumb,
  createCalendarEvent,
  createChatInput,
  createChatMessage,
  createFlowNode,
  createMediaCard,
  createStickyNote,
  createTaskCard,
  createTelemetry,
  createWorkspace,
  endStickyEdit,
  focusWorkspace,
  registerComponents,
  setTelemetryReading,
  toggleTaskItem,
  transmitFlowPulse
} from '../../components/index.js';
import { coreScene, signals } from '../helpers/core-scene.js';
import { spyInnerHTML } from '../helpers/dom.js';

const COMPONENT_NAMES = [
  'sticky-note', 'task-card', 'telemetry-gauge', 'flow-node', 'workspace-group',
  'media-card', 'breadcrumb-bar', 'chat-message', 'chat-input', 'calendar-event'
];
const TRAIT_NAMES = ['editable', 'snapToGrid'];
const camel = (name) => name.replace(/-(\w)/g, (_, c) => c.toUpperCase());

const query = (b, className) => b.el.querySelector(`.${className}`);
const queryAll = (b, className) => Array.from(b.el.querySelectorAll(`.${className}`));
const click = (element) => element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const key = (element, name) => element.dispatchEvent(new window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
const payloads = (b, type) => {
  const seen = signals(b, type);
  return { get list() { return seen.map((each) => each.payload); } };
};
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

/* ------------------ REGISTRATION ------------------ */

test('Components - importing the barrel registers nothing; registerComponents registers the set', () => {
  const named = blit.use();
  for (const name of COMPONENT_NAMES) {
    assert.equal(type(name), null, `"${name}" was defined at import time`);
    assert.equal(named.includes(camel(name)), false, `"${camel(name)}" was named at import time`);
  }
  for (const name of TRAIT_NAMES) assert.equal(named.includes(name), false, `"${name}" was named at import time`);

  assert.deepEqual(registerComponents(), COMPONENT_NAMES);
  for (const name of COMPONENT_NAMES) {
    assert.equal(type(name).el.getAttribute('data-type'), name);
    assert.ok(blit.use().includes(camel(name)), `"${name}" has no same-named trait`);
  }
  for (const name of [...TRAIT_NAMES, 'connect', 'focus']) assert.ok(blit.use().includes(name), `"${name}" is not named`);
  assert.deepEqual(registerComponents(), COMPONENT_NAMES, 'a second call is not idempotent');
});

test('Components - every factory yields a widget blit of its type with a closed schema', (t) => {
  const { app } = coreScene(t);
  const parent = createWorkspace(app, { id: 'ws', title: 'Frame' });
  const blits = [
    [createStickyNote(app, { id: 'a' }), 'sticky-note'],
    [createTaskCard(app, { id: 'b' }), 'task-card'],
    [createTelemetry(app, { id: 'c' }), 'telemetry-gauge'],
    [createFlowNode(app, { id: 'd' }), 'flow-node'],
    [parent, 'workspace-group'],
    [createMediaCard(app, { id: 'f' }), 'media-card'],
    [createBreadcrumb(parent, { id: 'g' }), 'breadcrumb-bar'],
    [createChatMessage(app, { id: 'h' }), 'chat-message'],
    [createChatInput(parent, { id: 'i' }), 'chat-input'],
    [createCalendarEvent(app, { id: 'j' }), 'calendar-event']
  ];

  for (const [b, name] of blits) {
    assert.equal(b.el.getAttribute('data-type'), name);
    assert.equal(app.find(b.el.id), b);
    assert.ok(b.el.firstElementChild.classList.contains('cloudcanvas-component'), `${name} root`);
    assert.equal(b.el.getAttribute('data-chrome'), name === 'workspace-group' ? null : 'false', `${name} chrome`);
    assert.throws(() => setContent(b, 'nope', 1), /not permitted/, `${name} accepted an unknown key`);
  }
  assert.equal(blits[6][0].parent, parent, 'the breadcrumb did not land in the workspace');

  // The sheet arrived with the first widget, exactly once.
  assert.equal(document.querySelectorAll(`#${COMPONENT_STYLE_ID}`).length, 1);
  // An explicit undefined is an absence: the default stands.
  assert.equal(contentOf(createTaskCard(app, { title: undefined })).title, 'Feature Checklist');
});

test('Components - a no-op re-render rebuilds nothing and reuses every keyed row', (t) => {
  const { app } = coreScene(t);
  const items = Object.freeze([Object.freeze({ text: 'One', done: false }), Object.freeze({ text: 'Two', done: true })]);
  const task = createTaskCard(app, { id: 'task', items });
  const chat = createChatMessage(app, { id: 'chat', reactions: [{ emoji: '🚀', count: 2, reacted: false }] });

  for (const [b, key] of [[task, 'items'], [chat, 'reactions']]) {
    const root = b.el.firstElementChild;
    const rows = Array.from(b.el.querySelectorAll('[data-cc-key]'));
    assert.ok(rows.length > 0);
    const writes = spyInnerHTML(root);
    setContent(b, key, contentOf(b)[key]);
    setContent(b, key, contentOf(b)[key]);
    assert.deepEqual(writes, [], `${b.el.id} wrote innerHTML on a no-op render`);
    assert.equal(b.el.firstElementChild, root, `${b.el.id} rebuilt its root`);
    assert.deepEqual(Array.from(b.el.querySelectorAll('[data-cc-key]')), rows, `${b.el.id} rebuilt its rows`);
  }
});

/* ------------------ STICKY NOTE ------------------ */

test('StickyNote - paper theme, tilt content, and swatches that are real toggle buttons', (t) => {
  const { app } = coreScene(t);
  const note = createStickyNote(app, { id: 'note', title: 'Idea', color: 'pink', tilt: 2.5, tag: 'core' });
  assert.equal(contentOf(note).tilt, 2.5);

  const card = query(note, STICKY_CLS.ROOT);
  assert.equal(card.getAttribute('data-theme'), 'pink');
  assert.equal(card.getAttribute('style'), '--cc-sticky-tilt:2.5deg;');
  assert.equal(query(note, STICKY_CLS.TAG).textContent, '#core');
  assert.ok(query(note, STICKY_CLS.PINHEAD));

  const swatches = queryAll(note, STICKY_CLS.SWATCH);
  assert.equal(swatches.length, 5);
  assert.ok(swatches.every((swatch) => swatch.tagName === 'BUTTON' && swatch.getAttribute('type') === 'button'));
  assert.deepEqual(swatches.map((swatch) => swatch.getAttribute('aria-pressed')), ['false', 'true', 'false', 'false', 'false']);

  click(swatches[2]);
  assert.equal(contentOf(note).color, 'cyan');
  assert.equal(card.getAttribute('data-theme'), 'cyan');
  assert.equal(swatches[2].getAttribute('aria-pressed'), 'true');

  // An unknown colour paints the default rather than an unstyled card.
  setContent(note, 'color', 'plaid');
  assert.equal(card.getAttribute('data-theme'), 'yellow');

  // A note born without a tilt is seeded one, inside the stated range.
  const seeded = createStickyNote(app, { id: 'seeded' });
  assert.equal(typeof contentOf(seeded).tilt, 'number');
  assert.ok(Math.abs(contentOf(seeded).tilt) <= 3);
});

test('StickyNote - the body editor takes the edit lock, commits on blur, and Escape cannot commit', (t) => {
  const { app } = coreScene(t);
  const note = createStickyNote(app, { id: 'note', body: 'first draft' });
  const body = query(note, STICKY_CLS.BODY);
  const editor = query(note, STICKY_CLS.EDITOR);
  const edited = payloads(note, 'note:edited');
  assert.equal(editor.tagName, 'TEXTAREA');
  assert.equal(editor.hidden, true);

  body.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  assert.equal(note.el.hasAttribute('data-editing'), true);
  assert.equal(editor.hidden, false);
  assert.equal(body.hidden, true);
  assert.equal(editor.value, 'first draft');
  assert.equal(beginStickyEdit(note), false, 'a second editor opened over the first');

  // A render during the edit is deferred, not painted over the caret.
  setContent(note, 'body', 'from elsewhere');
  assert.equal(body.textContent, 'first draft');

  editor.value = '  second draft  ';
  editor.dispatchEvent(new window.Event('blur'));
  assert.equal(note.el.hasAttribute('data-editing'), false);
  assert.equal(editor.hidden, true);
  assert.equal(contentOf(note).body, 'second draft');
  assert.equal(body.textContent, 'second draft');
  assert.deepEqual(edited.list, [{ body: 'second draft' }]);

  // Escape: the editor closes first, so the blur it causes finds nothing to commit.
  beginStickyEdit(note);
  editor.value = 'never';
  key(editor, 'Escape');
  editor.dispatchEvent(new window.Event('blur'));
  assert.equal(contentOf(note).body, 'second draft');
  assert.equal(note.el.hasAttribute('data-editing'), false);
  assert.equal(edited.list.length, 1);
  assert.equal(endStickyEdit(note), false);
});

/* ------------------ TASK CARD ------------------ */

test('TaskCard - native checkboxes, immutable items, and a progress content kept in step', (t) => {
  const { app } = coreScene(t);
  const items = Object.freeze([Object.freeze({ text: 'Item A', done: false }), Object.freeze({ text: 'Item B', done: false })]);
  const task = createTaskCard(app, { id: 'task', priority: 'URGENT', items });
  assert.equal(contentOf(task).progress, 0);

  const rows = queryAll(task, TASK_CLS.ITEM);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.tagName === 'LI'));
  const box = rows[0].querySelector(`.${TASK_CLS.BOX}`);
  const label = rows[0].querySelector(`.${TASK_CLS.LABEL}`);
  assert.equal(box.tagName, 'INPUT');
  assert.equal(box.getAttribute('type'), 'checkbox');
  assert.equal(label.tagName, 'LABEL');
  assert.equal(label.getAttribute('for'), box.id);
  assert.equal(box.id, 'task-item-0');
  assert.equal(label.textContent, 'Item A');
  assert.equal(query(task, TASK_CLS.PRIORITY).getAttribute('data-priority'), 'urgent');
  assert.equal(query(task, TASK_CLS.PROGRESS).tagName, 'PROGRESS');
  assert.equal(query(task, TASK_CLS.PROGRESS).getAttribute('value'), '0');

  const updates = payloads(task, 'task:updated');
  assert.equal(toggleTaskItem(task, 0), true);
  assert.equal(contentOf(task).progress, 50);
  assert.deepEqual(updates.list, [{ index: 0, item: { text: 'Item A', done: true }, progress: 50 }]);
  assert.equal(items[0].done, false, 'the caller\'s item was mutated');
  assert.equal(box.checked, true);
  assert.equal(rows[0].classList.contains(TASK_CLS.ITEM_DONE), true);

  // A change on the checkbox itself reaches the same path, through the list.
  const secondBox = rows[1].querySelector(`.${TASK_CLS.BOX}`);
  secondBox.checked = true;
  secondBox.dispatchEvent(new window.Event('change', { bubbles: true }));
  assert.equal(contentOf(task).progress, 100);
  assert.equal(updates.list.length, 2);
  assert.equal(query(task, TASK_CLS.PROGRESS).getAttribute('value'), '100');

  assert.equal(toggleTaskItem(task, 9), false);
  setContent(task, 'items', []);
  assert.equal(queryAll(task, TASK_CLS.ITEM).length, 0);

  // Two cards without ids never share a checkbox id.
  const [first, second] = [createTaskCard(app), createTaskCard(app)].map((b) => query(b, TASK_CLS.BOX).id);
  assert.notEqual(first, second);
});

/* ------------------ TELEMETRY ------------------ */

test('TelemetryGauge - readings drive value and delta, the status, and one alert per crossing', (t) => {
  const { app } = coreScene(t);
  const gauge = createTelemetry(app, { id: 'gauge', title: 'Core Temperature', unit: '°C', value: 45, warn: 75, crit: 90 });
  assert.deepEqual([contentOf(gauge).value, contentOf(gauge).delta, contentOf(gauge).crit], [45, 0, 90]);

  const alerts = payloads(gauge, 'telemetry:alert');
  const status = query(gauge, TELEMETRY_CLS.STATUS);
  const bar = query(gauge, TELEMETRY_CLS.BAR);
  assert.equal(status.getAttribute('data-status'), 'nominal');
  assert.equal(bar.tagName, 'PROGRESS');
  assert.equal(bar.getAttribute('aria-label'), 'Core Temperature');
  assert.equal(query(gauge, TELEMETRY_CLS.UNIT).textContent, '°C');

  assert.equal(setTelemetryReading(gauge, 80), 80);
  assert.deepEqual([contentOf(gauge).value, contentOf(gauge).delta], [80, 35]);
  assert.equal(status.getAttribute('data-status'), 'warning');
  assert.equal(bar.getAttribute('data-status'), 'warning');
  assert.deepEqual(alerts.list, []);

  setTelemetryReading(gauge, 95);
  setTelemetryReading(gauge, 97);
  assert.equal(status.getAttribute('data-status'), 'critical');
  assert.equal(query(gauge, TELEMETRY_CLS.VALUE).textContent, '97');
  assert.equal(bar.getAttribute('value'), '97');
  assert.deepEqual(alerts.list, [{ value: 95, threshold: 90, status: 'critical' }]);
  assert.equal(contentOf(createTelemetry(app)).value, 42, 'a gauge without a value was not seeded');
});

/* ------------------ FLOW NODE ------------------ */

test('FlowNode - the transmit control is a button, and a pulse flashes every node it reaches', (t) => {
  const { app } = coreScene(t);
  const nodeA = createFlowNode(app, { id: 'node_a', title: 'Ingest', nodeType: 'source', connectTo: ['node_b'] });
  const nodeB = createFlowNode(app, { id: 'node_b', title: 'Processor', connectTo: ['node_a'] });

  assert.deepEqual(nodeA.spec.connect.connections, ['node_b']);
  assert.equal(query(nodeA, FLOW_CLS.ACTION).tagName, 'BUTTON');
  assert.equal(query(nodeA, FLOW_CLS.TYPE).textContent, 'source');
  assert.ok(query(nodeA, FLOW_CLS.PORT_IN));
  assert.ok(query(nodeA, FLOW_CLS.PORT_OUT));

  const onA = payloads(nodeA, 'flow:pulse');
  const onB = payloads(nodeB, 'flow:pulse');
  click(query(nodeA, FLOW_CLS.ACTION));
  // Wired both ways: A reaches B once, and B does not send it back into its chain.
  assert.equal(onA.list.length, 1);
  assert.equal(onB.list.length, 1);
  assert.equal(onB.list[0].origin, 'node_a');
  assert.deepEqual(onB.list[0].relayChain, ['node_a']);
  assert.equal(query(nodeA, FLOW_CLS.ROOT).classList.contains(FLOW_CLS.PULSING), true);
  assert.equal(query(nodeB, FLOW_CLS.ROOT).classList.contains(FLOW_CLS.PULSING), true);

  transmitFlowPulse(nodeA);
  assert.equal(onB.list.length, 2);
  nodeA.remove();
  const unwired = createFlowNode(app, { id: 'lone', connectable: false });
  assert.equal(unwired.spec.connect, undefined);
});

/* ------------------ WORKSPACE ------------------ */

test('WorkspaceGroup - children land in its well, the badge counts them, and Focus promotes it', async (t) => {
  const { app } = coreScene(t);
  const workspace = createWorkspace(app, { id: 'ws', title: 'Project Alpha', padding: 10 });
  assert.deepEqual(workspace.spec.focus, { padding: 10, maxZoom: 2.5 });
  assert.equal(query(workspace, WORKSPACE_CLS.BADGE).textContent, '0 items');
  assert.equal(query(workspace, WORKSPACE_CLS.TITLE_TEXT).textContent, 'Project Alpha');

  const child = createStickyNote(workspace, { id: 'child' });
  assert.equal(child.el.parentElement, workspace.el.querySelector('[data-scope]'));
  assert.equal(child.parent, workspace);
  await settled();
  assert.equal(query(workspace, WORKSPACE_CLS.BADGE).textContent, '1 item');
  child.remove();
  await settled();
  assert.equal(query(workspace, WORKSPACE_CLS.BADGE).textContent, '0 items');

  const views = signals(app, VIEW_CHANGE_EVENT);
  click(query(workspace, WORKSPACE_CLS.FOCUS));
  assert.equal(app.root, workspace, 'the workspace was not promoted');
  assert.equal(views.length, 1);
  assert.equal(views[0].payload.back, 1);
  assert.equal(focusWorkspace(workspace), true);
  assert.equal(views.length, 2);
  assert.equal(views[1].payload.back, 1, 'a second Focus on the promoted view stacked another entry');
});

/* ------------------ MEDIA ------------------ */

test('MediaCard - a placeholder until a safe src arrives, and the image carries the title as alt', (t) => {
  const { app } = coreScene(t);
  const media = createMediaCard(app, { id: 'media', title: 'System Topology', caption: 'Overview' });
  const image = query(media, MEDIA_CLS.IMAGE);
  const placeholder = query(media, MEDIA_CLS.PLACEHOLDER);

  assert.deepEqual(media.spec.focus, { padding: 50, maxZoom: 3.5 });
  assert.equal(query(media, MEDIA_CLS.TITLE).textContent, 'System Topology');
  assert.equal(image.hidden, true);
  assert.equal(placeholder.hasAttribute('hidden'), false);
  assert.equal(placeholder.tagName.toLowerCase(), 'svg');
  assert.equal(image.hasAttribute('src'), false);

  setContent(media, 'src', 'https://example.com/a.png');
  assert.equal(image.hidden, false);
  assert.equal(placeholder.hasAttribute('hidden'), true);
  assert.equal(image.getAttribute('src'), 'https://example.com/a.png');
  assert.equal(image.getAttribute('alt'), 'System Topology');

  setContent(media, 'src', 'javascript:alert(1)');
  assert.equal(image.hidden, true, 'an unsafe URL still showed the image');
  assert.equal(image.getAttribute('src'), 'https://example.com/a.png', 'the src was cleared to an empty string');
});
