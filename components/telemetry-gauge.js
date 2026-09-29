/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * TelemetryGauge: a live metric with a status chip and a bar.
 *
 *   registerTelemetryGauge();
 *   const gauge = createTelemetry(app, { title: 'CPU', value: 45, warn: 75, crit: 90 });
 *   setTelemetryReading(gauge, 95);           // telemetry:alert, once per crossing
 *
 * The reading is the `value` content key and its last change is `delta`, so
 * the number a consumer reads off the blit is the number on the card. The
 * thresholds are contents too (`warn`, `crit`): they describe the gauge and
 * survive a snapshot.
 *
 * The bar is a native `<progress>`, tinted by `data-status` through the sheet
 * rather than by an inline background. The reading is fed by the caller through
 * `setTelemetryReading`; the gallery's random walk is the site's own
 * (`.site/telemetry-simulation.js`).
 */
import { contentOf, leadingText, setAttr, setContents, setText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { toNumber } from '../coerce.js';
import { withDefaults } from './registrar.js';
import { injectComponentStyles } from './styles.js';

/** The type name. */
export const TELEMETRY_GAUGE_TYPE = 'telemetry-gauge';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const TELEMETRY_CLS = /* @__PURE__ */ Object.freeze({
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
export const TELEMETRY_STATUSES = /* @__PURE__ */ Object.freeze(['nominal', 'warning', 'critical']);

/** The event a reading entering the critical band emits. */
export const TELEMETRY_ALERT_EVENT = 'telemetry:alert';

const DEFAULT_WARN = 70;
const DEFAULT_CRIT = 90;
const DEFAULT_VALUE = 42;

/** The status a reading falls in. */
export function telemetryStatusOf(value, warn = DEFAULT_WARN, crit = DEFAULT_CRIT) {
  if (value >= crit) return 'critical';
  if (value >= warn) return 'warning';
  return 'nominal';
}

/* ------------------ BEHAVIOUR ------------------ */

/**
 * Write a reading and its change, and emit `telemetry:alert` once per crossing:
 * when the reading enters the critical band, not on every write it stays there.
 * @returns {number} the reading written
 */
export function setTelemetryReading(b, nextValue) {
  const contents = contentOf(b);
  const next = toNumber(nextValue, 0);
  const prev = toNumber(contents.value, 0);
  const crit = toNumber(contents.crit, DEFAULT_CRIT);
  setContents(b, { value: next, delta: next - prev });
  if (next >= crit && prev < crit) {
    b.emit(TELEMETRY_ALERT_EVENT, { value: next, threshold: crit, status: 'critical' });
  }
  return next;
}

/* ------------------ TEMPLATE ------------------ */

const HTML = `<div class="cloudcanvas-component cloudcanvas-component-card ${TELEMETRY_CLS.ROOT}">`
  + `<div class="${TELEMETRY_CLS.HEADER}"><div class="${TELEMETRY_CLS.TITLE}"></div>`
  + `<span class="cloudcanvas-component-chip ${TELEMETRY_CLS.STATUS}"></span></div>`
  + `<div class="${TELEMETRY_CLS.READOUT}"><span class="${TELEMETRY_CLS.VALUE}"></span>`
  + `<span class="${TELEMETRY_CLS.UNIT}"></span></div>`
  + `<progress class="cloudcanvas-component-meter ${TELEMETRY_CLS.BAR}" max="100"></progress></div>`;

function bind(host) {
  const find = (className) => host.querySelector(`.${className}`);
  const status = find(TELEMETRY_CLS.STATUS);
  return {
    titleText: leadingText(find(TELEMETRY_CLS.TITLE)), status, statusText: leadingText(status),
    valueText: leadingText(find(TELEMETRY_CLS.VALUE)), unitText: leadingText(find(TELEMETRY_CLS.UNIT)),
    bar: find(TELEMETRY_CLS.BAR)
  };
}

function render(bindings, contents, cache) {
  const reading = toNumber(contents.get('value'), 0);
  const status = telemetryStatusOf(reading, toNumber(contents.get('warn'), DEFAULT_WARN), toNumber(contents.get('crit'), DEFAULT_CRIT));
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

/* ------------------ REGISTRATION ------------------ */

const SPEC = Object.freeze({
  name: TELEMETRY_GAUGE_TYPE, html: HTML,
  keys: ['title', 'unit', 'description', 'warn', 'crit', 'value', 'delta'], bind, render
});

/** Define the telemetry gauge widget, once. @returns {object} its type */
export function registerTelemetryGauge() {
  injectComponentStyles();
  return widget(SPEC);
}

/**
 * A telemetry gauge in `parent`. `title`, `unit`, `description`, `warn`, `crit`, `value`
 * (the reading) and `delta` (its last change) are contents; the rest is spec.
 */
export function createTelemetry(parent, options = {}) {
  registerTelemetryGauge();
  return parent.blit(widgetSpec(TELEMETRY_GAUGE_TYPE, withDefaults({
    x: 100, y: 100, w: 210, h: 140, chrome: false,
    title: 'Live CPU Metric', unit: '%', description: 'Simulated streaming telemetry',
    warn: DEFAULT_WARN, crit: DEFAULT_CRIT, delta: 0
  }, { ...options, value: toNumber(options.value, DEFAULT_VALUE) })));
}
