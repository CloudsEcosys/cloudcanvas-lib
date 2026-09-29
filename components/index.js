/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The board components' single door: nine widgets (ten types - chat has a
 * message and a composer), two function traits, the stylesheet, and the one
 * call that registers the set.
 *
 * Every component is a widget (`cloudcanvas/widget`) with a `register<Name>()`
 * that defines it once and a `create<Name>(parent, options)` factory; the
 * behaviours a component exposes are plain functions taking the blit
 * (`toggleTaskItem`, `setTelemetryReading`, ...).
 *
 * REGISTRATION IS EXPLICIT. Importing this module registers nothing. Two ways
 * in: `registerComponents()` defines the whole set and names the two traits
 * (needed before a `type: 'sticky-note'` spec or a restore), and any factory
 * defines just its own widget on first call, so most callers never need the first.
 *
 *   registerComponents();
 *   app.blit({ type: 'task-card', taskCard: { title: 'Ship' }, editable: true, snapToGrid: { gridSize: 20 } });
 */
import { blit } from '../../.plugin/core/index.js';

/* ------------------ BOARD WIDGETS ------------------ */

export {
  STICKY_NOTE_TYPE,
  STICKY_THEMES,
  STICKY_CLS,
  registerStickyNote,
  createStickyNote,
  beginStickyEdit,
  endStickyEdit
} from './sticky-note.js';

export {
  TASK_CARD_TYPE,
  TASK_CLS,
  TASK_PRIORITIES,
  TASK_UPDATED_EVENT,
  registerTaskCard,
  createTaskCard,
  toggleTaskItem,
  taskProgressOf
} from './task-card.js';

export {
  TELEMETRY_GAUGE_TYPE,
  TELEMETRY_CLS,
  TELEMETRY_STATUSES,
  TELEMETRY_ALERT_EVENT,
  registerTelemetryGauge,
  createTelemetry,
  setTelemetryReading,
  telemetryStatusOf
} from './telemetry-gauge.js';

export {
  FLOW_NODE_TYPE,
  FLOW_CLS,
  FLOW_PULSE_EVENT,
  registerFlowNode,
  createFlowNode,
  pulseFlowNode,
  transmitFlowPulse
} from './flow-node.js';

export {
  WORKSPACE_GROUP_TYPE,
  WORKSPACE_CLS,
  registerWorkspaceGroup,
  createWorkspace,
  focusWorkspace
} from './workspace-group.js';

export {
  MEDIA_CARD_TYPE,
  MEDIA_CLS,
  registerMediaCard,
  createMediaCard
} from './media-card.js';

/* ------------------ COMMUNICATION WIDGETS ------------------ */

export {
  BREADCRUMB_BAR_TYPE,
  BREADCRUMB_CLS,
  BACK_EVENT,
  registerBreadcrumbBar,
  createBreadcrumb,
  navigateBreadcrumbBack
} from './breadcrumb-bar.js';

export {
  CHAT_MESSAGE_TYPE,
  CHAT_INPUT_TYPE,
  CHAT_CLS,
  REACTION_EVENT,
  SENT_EVENT,
  registerChatMessage,
  registerChatInput,
  createChatMessage,
  createChatInput,
  toggleChatReaction,
  sendChatMessage
} from './chat-message.js';

export {
  CALENDAR_EVENT_TYPE,
  EVENT_CLS,
  EVENT_SEVERITIES,
  ACKNOWLEDGED_EVENT,
  RESOLVED_EVENT,
  registerCalendarEvent,
  createCalendarEvent,
  acknowledgeCalendarEvent,
  resolveCalendarEvent
} from './calendar-event.js';

/* ------------------ BEHAVIOUR TRAITS ------------------ */

export { editable, beginInlineEdit, EDITABLE_INPUT_CLASS, EDITED_EVENT, DEFAULT_EDITABLE_SELECTOR } from './traits/editable.js';
export { snapToGrid, snapPosition, snapBox } from './traits/snap-to-grid.js';

/* ------------------ STYLES ------------------ */

/**
 * The library's stylesheet, its token catalogue and its light-theme supplement. `COMPONENTS_LIGHT_THEME`
 * repeats none of the core's or the base kit's keys, so the three spread together:
 * `applyTheme(host, { ...LIGHT_THEME, ...LIB_LIGHT_THEME, ...COMPONENTS_LIGHT_THEME })`.
 */
export {
  COMPONENT_DEFAULT_CSS,
  COMPONENT_STYLE_ID,
  COMPONENT_TOKENS,
  COMPONENTS_LIGHT_THEME,
  injectComponentStyles
} from './styles.js';

/* ------------------ REGISTRATION ------------------ */

import { registerStickyNote } from './sticky-note.js';
import { registerTaskCard } from './task-card.js';
import { registerTelemetryGauge } from './telemetry-gauge.js';
import { registerFlowNode } from './flow-node.js';
import { registerWorkspaceGroup } from './workspace-group.js';
import { registerMediaCard } from './media-card.js';
import { registerBreadcrumbBar } from './breadcrumb-bar.js';
import { registerChatMessage, registerChatInput } from './chat-message.js';
import { registerCalendarEvent } from './calendar-event.js';
import { editable } from './traits/editable.js';
import { snapToGrid } from './traits/snap-to-grid.js';

/** Every component's registration, in the order the barrel exports them. */
const REGISTRARS = /* @__PURE__ */ Object.freeze([
  registerStickyNote,
  registerTaskCard,
  registerTelemetryGauge,
  registerFlowNode,
  registerWorkspaceGroup,
  registerMediaCard,
  registerBreadcrumbBar,
  registerChatMessage,
  registerChatInput,
  registerCalendarEvent
]);

/**
 * Define every component widget and name the two traits (`editable`, `snapToGrid`).
 * Safe to call more than once: each definition and name is idempotent.
 * @returns {string[]} the type names, in registration order
 */
export function registerComponents() {
  const names = REGISTRARS.map((register) => register().el.getAttribute('data-type'));
  blit.use({ editable, snapToGrid });
  return names;
}
