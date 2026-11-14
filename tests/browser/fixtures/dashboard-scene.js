/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The dashboard fixture's scene (`./dashboard.html`): every blit the acceptance,
 * smoke, context-menu and dashboard suites address by id, at the positions and
 * with the contents they were written against. Construction only - the HUD
 * wiring is `./dashboard.js`.
 */

import {
  createBreadcrumb,
  createCalendarEvent,
  createChatInput,
  createChatMessage,
  createFlowNode
} from '../../../components/index.js';

/** Latency of the simulated children endpoint, in milliseconds. */
export const PROVIDER_LATENCY_MS = 300;

/** What every movable card on the board opts into. */
const MOVABLE = Object.freeze({ drag: true, select: true });

/** A card widget spec: `contents` are the card's own keys, the rest is spec. */
function card(id, x, y, w, contents, extra = {}) {
  return { id, type: 'card', x, y, w, card: contents, ...MOVABLE, ...extra };
}

/** A top-level window: a card that holds blits, zoomed into and promoted. */
function windowCard(app, { id, x, y, w, h, maxZoom = 2.2, title, body }) {
  return app.blit(card(id, x, y, w, { title, body }, { h, focus: { padding: 30, maxZoom } }));
}

/* ------------------ THE PARENT SCOPE ------------------ */

function buildParentScope(app) {
  const parent = app.blit(card('card_parent_scope', 100, 80, 480, {
    title: 'Parent Scope Frame',
    body: 'Acts as a parent coordinate frame. Child cards can be zoomed into, becoming the new view.',
    badge: { text: 'Parent Scope', color: '#a855f7' }
  }, { focus: { padding: 30, maxZoom: 2.2 } }));
  const focusedChild = parent.blit(card('card_focused_child', 20, 100, 200, {
    title: 'Focused Child Card',
    body: 'Click "Focus Me" to zoom the camera onto this card.',
    badge: { text: 'Focus Target', color: '#f43f5e' },
    actionText: 'Focus Me'
  }, { focus: { padding: 60, maxZoom: 2.8 } }));
  const activeChild = parent.blit(card('card_active_child', 240, 100, 200, {
    title: 'Activation Card',
    body: 'The HUD toggle emits activate and deactivate on this card.',
    badge: { text: 'Inactive', color: '#eab308' }
  }));
  parent.blit(card('card_third_child', 20, 310, 200, {
    title: 'Third Child',
    body: 'A third row in the well, clear of the cards above it.',
    badge: { text: 'Row two', color: '#38bdf8' }
  }));
  return { parent, focusedChild, activeChild };
}

/* ------------------ THE LAZY PROVIDER SCOPE ------------------ */

/** The two child specs the simulated endpoint resolves. */
function providedSpecs() {
  const provided = (id, x, title, body) => card(id, x, 0, 190, { title, body, badge: { text: 'From provider', color: '#34d399' } });
  return [
    provided('card_provided_alpha', 20, 'Provided Card A', 'Created from a spec the provider resolved.'),
    provided('card_provided_beta', 230, 'Provided Card B', 'Made through the lazy add-on, once.')
  ];
}

/** The provider the scope's `lazy` trait loads its children from. */
export function dashboardProvider() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(providedSpecs()), PROVIDER_LATENCY_MS);
  });
}

function buildProviderScope(app) {
  return app.blit(card('card_provider_scope', 100, 700, 460, {
    title: 'Lazy Provider Scope',
    body: 'Holds no children until they are required; the provider then supplies them.',
    badge: { text: 'Lazy Scope', color: '#eab308' }
  }, { lazy: true }));
}

/* ------------------ ROOT SIBLINGS ------------------ */

function buildSiblings(app) {
  app.blit({
    id: 'card_vector', type: 'vector-pointer', x: 640, y: 80, ...MOVABLE,
    vectorPointer: { title: 'Vector Sibling Card', angle: 135, magnitude: 75, color: '#06b6d4', label: 'Gradient: 135° | Mag: 75.0' },
    connect: { connections: ['card_parent_scope'], stroke: '#a855f7' },
    focus: {}
  });
  const floating = app.blit(card('card_floating', 640, 320, 260, {
    title: 'Floating Sibling Card',
    body: 'Drags from anywhere on its surface.',
    badge: { text: 'Movable', color: '#ec4899' }
  }));
  app.blit(card('card_selectable_text', 640, 560, 280, {
    title: 'Selectable Text Card',
    body: 'Drag me by the title bar. Select this paragraph with the pointer: '
      + 'selectable text stands the drag gesture down inside the card.',
    badge: { text: 'selectableText', color: '#818cf8' }
  }, { selectableText: true }));
  return floating;
}

/* ------------------ THE MESSENGER WINDOW ------------------ */

/** The three seeded messages, the third a reply to the first. */
const MESSAGES = Object.freeze([
  {
    id: 'msg_deploy', y: 60, author: 'Sarah Connor', handle: '@s_connor', avatarColor: '#818cf8', time: '10:41 AM',
    text: 'Deploying the blit frame loop to staging.',
    reactions: [{ emoji: '🚀', count: 5, reacted: true }, { emoji: '👍', count: 4, reacted: false }]
  },
  {
    id: 'msg_bench', y: 165, author: 'Miles Dyson', handle: '@miles', avatarColor: '#10b981', time: '10:43 AM',
    text: 'Frame budget verified: 60fps stable, zero layout thrashing.',
    reactions: [{ emoji: '🔥', count: 6, reacted: false }, { emoji: '❤️', count: 3, reacted: false }]
  },
  {
    id: 'msg_tests', y: 270, author: 'John Connor', handle: '@leader', avatarColor: '#f59e0b', time: '10:45 AM',
    text: 'Confirmed. The browser suites are all passing!',
    reactions: [{ emoji: '🎉', count: 7, reacted: false }], replyTo: 'msg_deploy'
  }
]);

function buildChatWindow(app) {
  const chat = windowCard(app, {
    id: 'window_chat', x: 1020, y: 80, w: 440, h: 480,
    title: '💬 #engineering-lounge (Messenger)',
    body: 'Spatial team communication with interactive reactions and reply threads'
  });
  createBreadcrumb(chat, { id: 'crumb_chat', rootName: 'Dashboard', title: '#engineering-lounge' });
  const messages = MESSAGES.map((message) => createChatMessage(chat, {
    ...message, reactions: message.reactions.map((reaction) => ({ ...reaction })), x: 20, w: 370, h: 85
  }));
  createChatInput(chat, { id: 'input_chat', x: 20, y: 375, w: 370, h: 46 });
  return { chat, messages };
}

/* ------------------ THE INCIDENTS WINDOW ------------------ */

const INCIDENTS = Object.freeze([
  { id: 'event_db_spike', x: 20, y: 70, title: 'Gateway Latency Spike', time: '10:40 AM - Active', severity: 'critical', status: 'active' },
  { id: 'event_replica_lag', x: 285, y: 70, title: 'Database Replica Lag', time: '10:42 AM - Active', severity: 'high', status: 'investigating' },
  { id: 'event_sprint_sync', x: 20, y: 195, title: 'Sprint 42 Release Sync', time: '14:00 - 15:00', severity: 'normal', status: 'scheduled' },
  { id: 'event_backup_job', x: 285, y: 195, title: 'Snapshot Backup Routine', time: '02:00 AM Daily', severity: 'info', status: 'scheduled' }
]);

function buildCalendarWindow(app) {
  const calendar = windowCard(app, {
    id: 'window_calendar', x: 1540, y: 80, w: 560, h: 480, maxZoom: 2.0,
    title: '📅 Operations & Incident Command', body: 'Real-time SLA tracking, alert states and scheduled events'
  });
  createBreadcrumb(calendar, { id: 'crumb_calendar', rootName: 'Dashboard', title: 'Incident Command' });
  const events = INCIDENTS.map((incident) => createCalendarEvent(calendar, { ...incident, w: 245, h: 105 }));
  return { calendar, events };
}

/* ------------------ THE PIPELINE WINDOW ------------------ */

const FLOW_NODES = Object.freeze([
  { id: 'node_ingest', x: 20, w: 145, title: 'Stream Ingest', description: 'REST / WebSocket stream', nodeType: 'source', connectTo: ['node_filter'] },
  { id: 'node_filter', x: 185, w: 155, title: 'Vector Filter', description: 'Anomaly detection model', nodeType: 'process', connectTo: ['node_sink'] },
  { id: 'node_sink', x: 360, w: 140, title: 'Data Sink', description: 'Persistent Lakehouse', nodeType: 'sink' }
]);

function buildFlowWindow(app) {
  const flow = windowCard(app, {
    id: 'window_flow', x: 1540, y: 600, w: 540, h: 380,
    title: '⚡ Real-Time Data Pipeline', body: 'Connected node graph with wires and live signal pulse propagation'
  });
  createBreadcrumb(flow, { id: 'crumb_flow', rootName: 'Dashboard', title: 'Pipeline Flow' });
  const nodes = FLOW_NODES.map((node) => createFlowNode(flow, {
    ...node, connectTo: node.connectTo ? [...node.connectTo] : [], y: 80, h: 130
  }));
  return { flow, nodes };
}

/**
 * Build the whole scene on a board.
 * @param {object} app the board's root blit (`createBoard`)
 */
export function buildDashboardScene(app) {
  const scope = buildParentScope(app);
  const provider = buildProviderScope(app);
  const floating = buildSiblings(app);
  const { chat, messages } = buildChatWindow(app);
  const { calendar, events } = buildCalendarWindow(app);
  const { flow, nodes } = buildFlowWindow(app);
  return { ...scope, provider, floating, chat, messages, calendar, events, flow, nodes };
}
