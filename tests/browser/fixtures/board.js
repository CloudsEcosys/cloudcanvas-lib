/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The board fixture's scene (`./board.html`): the component library's widgets
 * on one board - three sticky notes (two with in-place title editing), a
 * workspace of two task cards, two telemetry gauges, a three-stage flow
 * pipeline wired by connectors, and a media card.
 */

import {
  createFlowNode,
  createMediaCard,
  createStickyNote,
  createTaskCard,
  createTelemetry,
  createWorkspace,
  registerComponents
} from '../../../components/index.js';
import { createBoard } from '../../../sandbox/board.js';

const NOTE_SIZE = Object.freeze({ w: 190, h: 190 });

const NOTES = Object.freeze([
  {
    id: 'sticky_roadmap', x: 60, y: 80, title: 'Product Vision', color: 'yellow', tilt: -2.0, tag: 'core', editable: true,
    body: 'Build a modular, zero-layout-thrashing board engine with composable traits.'
  },
  {
    id: 'sticky_architecture', x: 270, y: 95, title: 'Frame Loop', color: 'cyan', tilt: 2.2, tag: 'arch', editable: true,
    body: 'Structure, then read, then write. A settled root runs no frame at all.'
  },
  {
    id: 'sticky_release', x: 160, y: 290, title: 'Release Target', color: 'pink', tilt: -1.2, tag: 'ship', editable: false,
    body: 'Unit, integration and browser suites all green before the tag.'
  }
]);

const TASKS = Object.freeze([
  {
    id: 'task_frame', x: 24, title: 'Frame Loop', priority: 'urgent',
    items: ['Batched layout reads', 'Write-phase ports', 'Idle roots run no frame']
  },
  {
    id: 'task_a11y', x: 276, title: 'Accessibility & WCAG', priority: 'high',
    items: ['ARIA live region announcer', '4.5:1 Contrast verification', 'Roving reading order tabindex']
  }
]);

const GAUGES = Object.freeze([
  { id: 'gauge_cpu', y: 80, title: 'Cluster CPU Load', value: 48, warn: 75, crit: 90 },
  { id: 'gauge_mem', y: 245, title: 'Memory Utilization', value: 62, warn: 80, crit: 92 }
]);

const FLOW = Object.freeze([
  { id: 'flow_ingest', x: 520, w: 160, title: 'Data Ingest', description: 'REST & WS streaming ingestion', nodeType: 'source', connectTo: ['flow_processor'] },
  { id: 'flow_processor', x: 740, w: 170, title: 'Anomaly Filter', description: 'Real-time vector classification', nodeType: 'process', connectTo: ['flow_sink'] },
  { id: 'flow_sink', x: 970, w: 160, title: 'Storage Sink', description: 'Persistent Lakehouse archive', nodeType: 'sink' }
]);

function buildNotes(app) {
  for (const { editable, ...note } of NOTES) {
    createStickyNote(app, { ...note, ...NOTE_SIZE, drag: true, select: true, ...(editable ? { editable: true } : {}) });
  }
}

function buildSprint(app) {
  const sprint = createWorkspace(app, { id: 'workspace_sprint', x: 520, y: 80, w: 540, title: 'Sprint 42: Production Release' });
  for (const task of TASKS) {
    createTaskCard(sprint, { ...task, y: 70, w: 230, h: 180, items: task.items.map((text) => ({ text, done: true })) });
  }
}

function buildGaugesAndFlow(app) {
  for (const gauge of GAUGES) createTelemetry(app, { ...gauge, x: 1110, w: 220, h: 140, unit: '%' });
  for (const node of FLOW) createFlowNode(app, { ...node, connectTo: node.connectTo ? [...node.connectTo] : [], y: 350, h: 130 });
  createMediaCard(app, {
    id: 'media_architecture', x: 60, y: 510, w: 280, h: 220,
    title: 'System Architecture', caption: 'Frame loop, ports and the plane the camera moves'
  });
}

function boot() {
  registerComponents();
  const app = createBoard('#canvas-container', { label: 'Component board' });
  buildNotes(app);
  buildSprint(app);
  buildGaugesAndFlow(app);
  window.cloudcanvas = app;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
