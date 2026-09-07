/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The pre-built pin-board library's single door: nine components, two
 * behaviour traits, the stylesheet, and the one call that registers the set.
 *
 * Every component is a `defineComponent` template pair (see `./registrar.js`)
 * with a lazy, memoised `register<Name>(registry?)` and a `create<Name>Pin`
 * factory; the behaviours a component exposes are plain functions taking the
 * Pin (`toggleTaskItem`, `setTelemetryReading`, ...), not methods on a trait
 * you have to fish out of it.
 *
 * REGISTRATION IS EXPLICIT. Importing this module registers nothing - that
 * was the exact defect two prior reviews flagged in the old
 * `src/components/index.js`, where importing a barrel mutated the shared
 * registry. Two ways in instead: `registerComponentTraits()` registers the
 * whole set (needed for a `type: 'sticky-note'` option or `hydrate()`'s
 * `data-cc-type`), and any factory registers just its own component on first
 * call, so most callers never need the first.
 */

import { traitRegistry } from '../../src/index.js';

/* ------------------ BOARD WIDGETS ------------------ */

export {
  STICKY_NOTE_TYPE,
  STICKY_THEMES,
  STICKY_CLS,
  registerStickyNote,
  createStickyNotePin,
  beginStickyEdit,
  endStickyEdit
} from './sticky-note.js';

export {
  TASK_CARD_TYPE,
  TASK_CLS,
  TASK_PRIORITIES,
  registerTaskCard,
  createTaskCardPin,
  toggleTaskItem,
  taskProgressOf
} from './task-card.js';

export {
  TELEMETRY_GAUGE_TYPE,
  TELEMETRY_CLS,
  TELEMETRY_STATUSES,
  registerTelemetryGauge,
  createTelemetryPin,
  setTelemetryReading,
  startTelemetrySimulation,
  stopTelemetrySimulation,
  telemetryStatusOf
} from './telemetry-gauge.js';

export {
  FLOW_NODE_TYPE,
  FLOW_CLS,
  FLOW_PULSE_EVENT,
  registerFlowNode,
  createFlowNodePin,
  pulseFlowNode,
  transmitFlowPulse
} from './flow-node.js';

export {
  WORKSPACE_GROUP_TYPE,
  WORKSPACE_CLS,
  registerWorkspaceGroup,
  createWorkspacePin,
  focusWorkspace
} from './workspace-group.js';

export {
  MEDIA_CARD_TYPE,
  MEDIA_CLS,
  registerMediaCard,
  createMediaCardPin
} from './media-card.js';

/* ------------------ COMMUNICATION WIDGETS ------------------ */

export {
  BREADCRUMB_BAR_TYPE,
  BREADCRUMB_CLS,
  BACK_EVENT,
  registerBreadcrumbBar,
  createBreadcrumbPin,
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
  createChatMessagePin,
  createChatInputPin,
  createChatChannelPin,
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
  createCalendarEventPin,
  createCalendarBoardPin,
  acknowledgeCalendarEvent,
  resolveCalendarEvent
} from './calendar-event.js';

/* ------------------ BEHAVIOUR TRAITS ------------------ */

export { EditableTrait, EDITABLE_INPUT_CLASS, EDITED_EVENT, DEFAULT_EDITABLE_SELECTOR } from './traits/editable.js';
export { SnapToGridTrait } from './traits/snap-to-grid.js';

/* ------------------ STYLES ------------------ */

/**
 * The library's stylesheet and its light-theme supplement. `COMPONENTS_LIGHT_THEME`
 * repeats none of the core's or the base kit's keys, so the three spread together:
 * `applyTheme(host, { ...LIGHT_THEME, ...LIB_LIGHT_THEME, ...COMPONENTS_LIGHT_THEME })`.
 */
export {
  COMPONENT_DEFAULT_CSS,
  COMPONENT_STYLE_ID,
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
import { EditableTrait } from './traits/editable.js';
import { SnapToGridTrait } from './traits/snap-to-grid.js';

/** Every component registrar, in the order the barrel exports them. */
const REGISTRARS = Object.freeze([
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

/** The two behaviour traits, registered by constructor with their defaults. */
const BEHAVIOUR_TRAITS = Object.freeze([
  ['editable', EditableTrait, { targetKey: 'title' }],
  ['snap-to-grid', SnapToGridTrait, { gridSize: 24 }]
]);

/**
 * Register every component and behaviour trait in the library.
 *
 * Safe to call more than once - each registrar memoises its handle, and a
 * behaviour trait already present is left alone - and safe to call before a
 * session exists, since a definition is data.
 *
 * @param {TraitRegistry} [registry] target registry; the shared singleton by default
 * @returns {object[]} the component handles, in registration order
 */
export function registerComponentTraits(registry = traitRegistry) {
  if (!registry || typeof registry.register !== 'function') return [];

  const handles = REGISTRARS.map((register) => register(registry));
  for (const [name, ctor, defaults] of BEHAVIOUR_TRAITS) {
    if (!registry.has(name)) registry.register(name, ctor, defaults);
  }
  return handles;
}
