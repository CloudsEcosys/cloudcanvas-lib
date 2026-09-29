/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * CalendarEvent: a scheduled item or an incident, with a severity, a status
 * and two actions.
 *
 *   registerCalendarEvent();
 *   const incident = createCalendarEvent(app, { title: 'DB spike', severity: 'critical', status: 'active' });
 *   acknowledgeCalendarEvent(incident);       // critical steps down to high; alert:acknowledged
 *
 * Severity is published as `data-severity` on the card and on its chip, and the
 * sheet decides what each one looks like through the `--cc-severity-*` tokens -
 * no inline background, so a theme can restate every severity in one place.
 * Acknowledging and resolving are real buttons; both also emit `announce` (the
 * announce add-on speaks it through the root's live region), because a change
 * of state a sighted user sees as a colour is one a screen reader must be told.
 */
import { blit } from '../../.plugin/core/index.js';
import { contentOf, leadingText, setAttr, setContents, setText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { asText } from '../coerce.js';
import { withDefaults } from './registrar.js';
import { injectComponentStyles } from './styles.js';

/** The type name. */
export const CALENDAR_EVENT_TYPE = 'calendar-event';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const EVENT_CLS = /* @__PURE__ */ Object.freeze({
  ROOT: 'cloudcanvas-event-card',
  HEADER: 'cloudcanvas-event-header',
  TITLE: 'cloudcanvas-event-title',
  BADGE: 'cloudcanvas-event-badge',
  TIME: 'cloudcanvas-event-time',
  ACTIONS: 'cloudcanvas-event-actions',
  BUTTON: 'cloudcanvas-event-btn',
  ACK: 'cloudcanvas-event-ack',
  RESOLVE: 'cloudcanvas-event-resolve'
});

/** The severities the sheet has a colour for, most urgent first. */
export const EVENT_SEVERITIES = /* @__PURE__ */ Object.freeze(['critical', 'high', 'normal', 'info']);

/** The events the actions emit. */
export const ACKNOWLEDGED_EVENT = 'alert:acknowledged';
export const RESOLVED_EVENT = 'alert:resolved';

const DEFAULT_SEVERITY = 'normal';

/** The declared severity, or the default for anything that is not one. */
function severityOf(value) {
  return EVENT_SEVERITIES.includes(value) ? value : DEFAULT_SEVERITY;
}

/* ------------------ BEHAVIOUR ------------------ */

/** Write `patch`, then say what happened: `announce` for the live region, and `type` for listeners. */
function transition(b, patch, verb, type) {
  setContents(b, patch);
  const title = asText(contentOf(b).title);
  b.emit('announce', `${title} ${verb}`);
  b.emit(type, { eventId: b.el.id, title });
}

/** Acknowledge: a critical event steps down to high, and the status says so. */
export function acknowledgeCalendarEvent(b) {
  const critical = contentOf(b).severity === 'critical';
  transition(b, critical ? { status: 'acknowledged', severity: 'high' } : { status: 'acknowledged' }, 'acknowledged', ACKNOWLEDGED_EVENT);
}

/** Resolve: the event becomes informational, and the status says so. */
export function resolveCalendarEvent(b) {
  transition(b, { status: 'resolved', severity: 'info' }, 'resolved', RESOLVED_EVENT);
}

/* ------------------ TEMPLATE ------------------ */

/** One action: a real button with its label. */
function actionHtml(className, label) {
  return `<button class="cloudcanvas-component-btn ${EVENT_CLS.BUTTON} ${className}" type="button">${label}</button>`;
}

const HTML = `<div class="cloudcanvas-component cloudcanvas-component-card ${EVENT_CLS.ROOT}">`
  + `<div class="${EVENT_CLS.HEADER}"><div class="${EVENT_CLS.TITLE}"></div>`
  + `<span class="cloudcanvas-component-chip ${EVENT_CLS.BADGE}"></span></div>`
  + `<div class="${EVENT_CLS.TIME}"></div>`
  + `<div class="${EVENT_CLS.ACTIONS}">${actionHtml(EVENT_CLS.ACK, 'Ack')}${actionHtml(EVENT_CLS.RESOLVE, 'Resolve')}</div></div>`;

/** The nodes, and the two actions. */
function bind(host, on) {
  const b = blit(host);
  const find = (className) => host.querySelector(`.${className}`);
  on(find(EVENT_CLS.ACK), 'click', () => acknowledgeCalendarEvent(b));
  on(find(EVENT_CLS.RESOLVE), 'click', () => resolveCalendarEvent(b));
  const badge = find(EVENT_CLS.BADGE);
  return {
    card: find(EVENT_CLS.ROOT), titleText: leadingText(find(EVENT_CLS.TITLE)), badge, badgeText: leadingText(badge),
    timeText: leadingText(find(EVENT_CLS.TIME))
  };
}

function render(bindings, contents, cache) {
  const severity = severityOf(contents.get('severity'));
  setText(bindings.titleText, contents.get('title'));
  setText(bindings.timeText, contents.get('time'));
  setText(bindings.badgeText, contents.get('status'));
  setAttr(bindings.card, 'data-severity', severity, cache, 'severity');
  setAttr(bindings.badge, 'data-severity', severity, cache, 'badgeSeverity');
}

/* ------------------ REGISTRATION ------------------ */

const SPEC = Object.freeze({ name: CALENDAR_EVENT_TYPE, html: HTML, keys: ['title', 'time', 'severity', 'status'], bind, render });

/** Define the calendar event widget, once. @returns {object} its type */
export function registerCalendarEvent() {
  injectComponentStyles();
  return widget(SPEC);
}

/** A calendar event in `parent`. `title`, `time`, `severity` and `status` are contents; the rest is spec. */
export function createCalendarEvent(parent, options = {}) {
  registerCalendarEvent();
  return parent.blit(widgetSpec(CALENDAR_EVENT_TYPE, withDefaults({
    x: 20, y: 80, w: 210, h: 105, chrome: false,
    title: 'Event / Alert', time: '10:00 - 11:00 AM', severity: DEFAULT_SEVERITY, status: 'scheduled'
  }, options)));
}
