/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * CalendarEvent: a scheduled item or an incident, with a severity, a status
 * and two actions.
 *
 * Severity is published as `data-severity` on the card and on its chip, and
 * the sheet decides what each one looks like through the `--cc-severity-*`
 * tokens - no inline background, so a theme can restate every severity in
 * one place. Acknowledging and resolving are real buttons; both also speak
 * through the session's live region, because a change of state a sighted
 * user sees as a colour is a change a screen reader has to be told about.
 */

import {
  FocussableTrait,
  PinEvent,
  ScopeTrait,
  announce,
  makeElement,
  makeTextNode,
  setAttr,
  setText
} from '../../.plugin/index.js';
import {
  claimHost,
  createComponentPin,
  makeRegistrar,
  splitOptions
} from './registrar.js';
import { asText } from '../coerce.js';

/** Registry name, and the `type` a caller creates a Pin by. */
export const CALENDAR_EVENT_TYPE = 'calendar-event';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const EVENT_CLS = Object.freeze({
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
export const EVENT_SEVERITIES = Object.freeze(['critical', 'high', 'normal', 'info']);

/** The events the actions transmit, bubbling up the scope chain. */
export const ACKNOWLEDGED_EVENT = 'alert:acknowledged';
export const RESOLVED_EVENT = 'alert:resolved';

const DEFAULT_SEVERITY = 'normal';
const ALLOWED_KEYS = ['title', 'time', 'severity', 'status'];

/** The declared severity, or the default for anything that is not one. */
function severityOf(value) {
  return EVENT_SEVERITIES.includes(value) ? value : DEFAULT_SEVERITY;
}

/* ------------------ BEHAVIOUR ------------------ */

/** Acknowledge: a critical event steps down to high, and the status says so. */
export function acknowledgeCalendarEvent(pin) {
  pin.setContent('status', 'acknowledged');
  if (pin.contents.get('severity') === 'critical') pin.setContent('severity', 'high');

  const title = asText(pin.contents.get('title'));
  announce(pin.session, `${title} acknowledged`);
  pin.transmit(new PinEvent(ACKNOWLEDGED_EVENT, {
    payload: { eventId: pin.id, title },
    bubbles: true,
    source: pin
  }));
}

/** Resolve: the event becomes informational, and the status says so. */
export function resolveCalendarEvent(pin) {
  pin.setContent('status', 'resolved');
  pin.setContent('severity', 'info');

  const title = asText(pin.contents.get('title'));
  announce(pin.session, `${title} resolved`);
  pin.transmit(new PinEvent(RESOLVED_EVENT, {
    payload: { eventId: pin.id, title },
    bubbles: true,
    source: pin
  }));
}

/* ------------------ TEMPLATE ------------------ */

/** One action: a real button with its label and its handler. */
function makeAction(className, label, onClick) {
  const button = makeElement('button', `cloudcanvas-component-btn ${EVENT_CLS.BUTTON} ${className}`);
  button.setAttribute('type', 'button');
  button.appendChild(document.createTextNode(label));
  button.addEventListener('click', onClick);
  return button;
}

function build(pin, contentEl) {
  claimHost(contentEl);
  const card = makeElement('div', `cloudcanvas-component cloudcanvas-component-card ${EVENT_CLS.ROOT}`);

  const header = makeElement('div', EVENT_CLS.HEADER);
  const title = makeElement('div', EVENT_CLS.TITLE);
  const titleText = makeTextNode(title);
  const badge = makeElement('span', `cloudcanvas-component-chip ${EVENT_CLS.BADGE}`);
  const badgeText = makeTextNode(badge);
  header.append(title, badge);

  const time = makeElement('div', EVENT_CLS.TIME);
  const timeText = makeTextNode(time);

  const actions = makeElement('div', EVENT_CLS.ACTIONS);
  const ack = makeAction(EVENT_CLS.ACK, 'Ack', () => acknowledgeCalendarEvent(pin));
  const resolve = makeAction(EVENT_CLS.RESOLVE, 'Resolve', () => resolveCalendarEvent(pin));
  actions.append(ack, resolve);

  card.append(header, time, actions);
  contentEl.replaceChildren(card);

  return { card, titleText, badge, badgeText, timeText, ack, resolve };
}

function update(pin, contents, bindings, cache) {
  const severity = severityOf(contents.get('severity'));

  setText(bindings.titleText, contents.get('title'));
  setText(bindings.timeText, contents.get('time'));
  setText(bindings.badgeText, contents.get('status'));
  setAttr(bindings.card, 'data-severity', severity, cache, 'severity');
  setAttr(bindings.badge, 'data-severity', severity, cache, 'badgeSeverity');
}

/* ------------------ REGISTRATION ------------------ */

/** Register the calendar event, once per registry; see `./registrar.js`. */
export const registerCalendarEvent = makeRegistrar({
  name: CALENDAR_EVENT_TYPE,
  build,
  update,
  chrome: false,
  allowedKeys: ALLOWED_KEYS
});

/**
 * Create a calendar event Pin.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options] `title`, `time`, `severity`, `status` become
 *   contents; the rest are Pin options
 * @returns {Pin}
 */
export function createCalendarEventPin(session, options = {}) {
  const { pinOptions, contents } = splitOptions(options, [
    ['title', 'Event / Alert'],
    ['time', '10:00 - 11:00 AM'],
    ['severity', DEFAULT_SEVERITY],
    ['status', 'scheduled']
  ], { x: 20, y: 80, width: 210, height: 105 });

  return createComponentPin(session, registerCalendarEvent, pinOptions, contents, false);
}

/**
 * Create a board: a plain focussable scope Pin on the core card, which the
 * events are placed inside.
 */
export function createCalendarBoardPin(session, options = {}) {
  return session.createPin({
    id: options.id || 'calendar_board',
    x: options.x !== undefined ? options.x : 540,
    y: options.y !== undefined ? options.y : 60,
    width: options.width || 560,
    height: options.height || 480,
    contents: new Map([
      ['title', options.title || '📅 Incident & Event Tracking Board'],
      ['body', options.description || 'Live SLA monitor, scheduled milestones and alerts']
    ]),
    traits: [new ScopeTrait(), new FocussableTrait({ padding: 40, maxZoom: 2.0 })]
  });
}
