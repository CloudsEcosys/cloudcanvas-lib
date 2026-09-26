/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * TelemetryGauge: a live metric with a status chip and a bar.
 *
 * The reading is the Pin's primary vector and its rate of change is the
 * second, so the number a consumer reads off the particle is the number on
 * the card. The thresholds are contents (`warn`, `crit`): they describe the
 * gauge, they survive a snapshot, and `update` reads them from the same Map
 * as everything else.
 *
 * The bar is a native `<progress>`, tinted by `data-status` through the sheet
 * rather than by an inline background. The simulation is a plain interval kept
 * in a module `WeakMap` keyed by Pin and cleared on detach, so a destroyed
 * session leaves no timer behind.
 */

import {
  PinEvent,
  makeElement,
  makeTextNode,
  setAttr,
  setText
} from '../../src/index.js';
import {
  claimHost,
  createComponentPin,
  makeRegistrar,
  splitOptions
} from './registrar.js';
import { toNumber } from '../coerce.js';

/** Registry name, and the `type` a caller creates a Pin by. */
export const TELEMETRY_GAUGE_TYPE = 'telemetry-gauge';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const TELEMETRY_CLS = Object.freeze({
  ROOT: 'cloudcanvas-telemetry-card',
  HEADER: 'cloudcanvas-telemetry-header',
  TITLE: 'cloudcanvas-telemetry-title',
  STATUS: 'cloudcanvas-telemetry-status',
  READOUT: 'cloudcanvas-telemetry-readout',
  VALUE: 'cloudcanvas-telemetry-value',
  UNIT: 'cloudcanvas-telemetry-unit',
  BAR: 'cloudcanvas-telemetry-bar'
});

/** The statuses the sheet has a fill for, in rising order. */
export const TELEMETRY_STATUSES = Object.freeze(['nominal', 'warning', 'critical']);

const DEFAULT_WARN = 70;
const DEFAULT_CRIT = 90;
const DEFAULT_INTERVAL_MS = 600;
const ALLOWED_KEYS = ['title', 'unit', 'description', 'warn', 'crit'];

/** Running simulations, by Pin. */
const simulations = new WeakMap();

/** The thresholds a gauge is currently reading against. */
function thresholdsOf(pin) {
  return {
    warn: toNumber(pin.contents.get('warn'), DEFAULT_WARN),
    crit: toNumber(pin.contents.get('crit'), DEFAULT_CRIT)
  };
}

/** The status a reading falls in. */
export function telemetryStatusOf(value, warn = DEFAULT_WARN, crit = DEFAULT_CRIT) {
  if (value >= crit) return 'critical';
  if (value >= warn) return 'warning';
  return 'nominal';
}

/* ------------------ BEHAVIOUR ------------------ */

/**
 * Write a reading into the vectors and announce a critical breach, once per
 * crossing: an alert fires when the reading enters the critical band, not on
 * every frame it stays there.
 */
export function setTelemetryReading(pin, nextValue) {
  const next = toNumber(nextValue, 0);
  const prev = toNumber(pin.particle.getPrimaryVector(), 0);
  const { crit } = thresholdsOf(pin);

  pin.setVectors([next, next - prev]);

  if (next >= crit && prev < crit) {
    pin.transmit(new PinEvent('telemetry:alert', {
      payload: { value: next, threshold: crit, status: 'critical' },
      bubbles: true,
      source: pin
    }));
  }
  return next;
}

/** Stop a running simulation; a Pin without one is left alone. */
export function stopTelemetrySimulation(pin) {
  const timer = simulations.get(pin);
  if (timer === undefined) return false;
  clearInterval(timer);
  simulations.delete(pin);
  return true;
}

/**
 * Drift the reading on an interval, a random walk clamped to 0..100.
 * Restarting replaces the previous interval rather than stacking a second.
 */
export function startTelemetrySimulation(pin, intervalMs = DEFAULT_INTERVAL_MS) {
  stopTelemetrySimulation(pin);
  const timer = setInterval(() => {
    const current = toNumber(pin.particle.getPrimaryVector(), 50);
    const change = Math.random() * 12 - 5.5;
    setTelemetryReading(pin, Math.max(0, Math.min(100, current + change)));
  }, intervalMs);
  simulations.set(pin, timer);
  return timer;
}

/* ------------------ TEMPLATE ------------------ */

function build(pin, contentEl) {
  claimHost(contentEl);
  const card = makeElement('div', `cloudcanvas-component cloudcanvas-component-card ${TELEMETRY_CLS.ROOT}`);

  const header = makeElement('div', TELEMETRY_CLS.HEADER);
  const title = makeElement('div', TELEMETRY_CLS.TITLE);
  const titleText = makeTextNode(title);
  const status = makeElement('span', `cloudcanvas-component-chip ${TELEMETRY_CLS.STATUS}`);
  const statusText = makeTextNode(status);
  header.append(title, status);

  const readout = makeElement('div', TELEMETRY_CLS.READOUT);
  const value = makeElement('span', TELEMETRY_CLS.VALUE);
  const valueText = makeTextNode(value);
  const unit = makeElement('span', TELEMETRY_CLS.UNIT);
  const unitText = makeTextNode(unit);
  readout.append(value, unit);

  const bar = makeElement('progress', `cloudcanvas-component-meter ${TELEMETRY_CLS.BAR}`);
  bar.setAttribute('max', '100');

  card.append(header, readout, bar);
  contentEl.replaceChildren(card);

  return { card, titleText, status, statusText, valueText, unitText, bar };
}

function update(pin, contents, bindings, cache) {
  const reading = toNumber(pin.particle.getPrimaryVector(), 0);
  const warn = toNumber(contents.get('warn'), DEFAULT_WARN);
  const crit = toNumber(contents.get('crit'), DEFAULT_CRIT);
  const status = telemetryStatusOf(reading, warn, crit);
  const title = contents.get('title');

  setText(bindings.titleText, title);
  setText(bindings.unitText, contents.get('unit'));
  setText(bindings.valueText, String(Math.round(reading)));
  setText(bindings.statusText, status);

  setAttr(bindings.status, 'data-status', status, cache, 'status');
  setAttr(bindings.bar, 'data-status', status, cache, 'barStatus');
  setAttr(bindings.bar, 'value', String(Math.min(100, Math.max(0, reading))), cache, 'value');
  setAttr(bindings.bar, 'aria-label', title === undefined || title === null ? '' : String(title), cache, 'label');
}

/** Seed the `[value, delta]` pair for a gauge created without vectors. */
function onAttach(pin) {
  if (pin.particle.getVectors().length === 0) pin.setVectors([50, 0]);
}

/* ------------------ REGISTRATION ------------------ */

/** Register the gauge, once per registry; see `./registrar.js`. */
export const registerTelemetryGauge = makeRegistrar({
  name: TELEMETRY_GAUGE_TYPE,
  build,
  update,
  chrome: false,
  allowedKeys: ALLOWED_KEYS,
  defaults: { onAttach, onDetach: stopTelemetrySimulation }
});

/**
 * Create a telemetry gauge Pin.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options] `title`, `unit`, `description`, `warn`, `crit`
 *   become contents; `value` seeds the reading; `simulate` (and
 *   `simulateIntervalMs`) starts the random walk; the rest are Pin options
 * @returns {Pin}
 */
export function createTelemetryPin(session, options = {}) {
  const { pinOptions, contents } = splitOptions(options, [
    ['title', 'Live CPU Metric'],
    ['unit', '%'],
    ['description', 'Simulated streaming telemetry'],
    ['warn', DEFAULT_WARN],
    ['crit', DEFAULT_CRIT]
  ], { x: 100, y: 100, width: 210, height: 140 });

  const { value, simulate, simulateIntervalMs, ...rest } = pinOptions;
  rest.vectors = [toNumber(value, 42), 0];

  const pin = createComponentPin(session, registerTelemetryGauge, rest, contents, false);
  if (simulate) startTelemetrySimulation(pin, toNumber(simulateIntervalMs, DEFAULT_INTERVAL_MS));
  return pin;
}
