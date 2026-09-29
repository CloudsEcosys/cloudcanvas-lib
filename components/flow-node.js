/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * FlowNode: a graph node with two ports, a description and a transmit button.
 *
 *   registerFlowNode();
 *   createFlowNode(app, { id: 'a', title: 'Ingest', connectTo: ['b'] });
 *   createFlowNode(app, { id: 'b', title: 'Process' });
 *   transmitFlowPulse(app.find('a'));        // a flashes, then b
 *
 * The wires are the `connect` trait (`cloudcanvas/connect`), and the pulse
 * travels them: a node hearing `flow:pulse` on itself flashes and emits it on
 * each blit its `connect.connections` names. Each hop carries the `relayChain`
 * of ids it has passed through, and a node never forwards into its own chain,
 * so a cycle of wires terminates.
 *
 * The flash is a state class (`is-pulsing`) the sheet animates, removed by a
 * timer kept per element and cleared when the blit is removed - never an
 * inline border or shadow. The transmit control is a real `<button>`, which
 * the drag add-on already treats as the page's, not a gesture.
 */
import { blit } from '../../.plugin/core/index.js';
import { connect } from '../../.plugin/addons/connect.js';
import { leadingText, setText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { withDefaults } from './registrar.js';
import { injectComponentStyles } from './styles.js';

/** The type name. */
export const FLOW_NODE_TYPE = 'flow-node';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const FLOW_CLS = /* @__PURE__ */ Object.freeze({
  ROOT: 'cloudcanvas-flow-node',
  PULSING: 'is-pulsing',
  PORT: 'cloudcanvas-flow-port',
  PORT_IN: 'cloudcanvas-flow-port-in',
  PORT_OUT: 'cloudcanvas-flow-port-out',
  HEADER: 'cloudcanvas-flow-header',
  TITLE: 'cloudcanvas-flow-title',
  TYPE: 'cloudcanvas-flow-type',
  BODY: 'cloudcanvas-flow-body',
  ACTION: 'cloudcanvas-flow-action-btn'
});

/** The event a node emits, and reacts to. */
export const FLOW_PULSE_EVENT = 'flow:pulse';

/** How long the pulse class stays on. */
const PULSE_MS = 400;
const DEFAULT_NODE_TYPE = 'process';

/** Pending pulse timers, by element. */
const PULSES = /* @__PURE__ */ new WeakMap();

/* ------------------ BEHAVIOUR ------------------ */

/** Clear a pending pulse timer, leaving the class wherever it is. */
function cancelPulse(element) {
  const timer = PULSES.get(element);
  if (timer === undefined) return;
  clearTimeout(timer);
  PULSES.delete(element);
}

/**
 * Flash the node. A pulse arriving during a pulse restarts the timer rather
 * than stacking a second removal.
 * @returns {boolean} whether the node had a card to flash
 */
export function pulseFlowNode(b) {
  const card = b.el.querySelector(`.${FLOW_CLS.ROOT}`);
  if (!card) return false;
  cancelPulse(b.el);
  card.classList.add(FLOW_CLS.PULSING);
  PULSES.set(b.el, setTimeout(() => {
    card.classList.remove(FLOW_CLS.PULSING);
    PULSES.delete(b.el);
  }, PULSE_MS));
  return true;
}

/** Emit a pulse from this node: it flashes, and the pulse travels its wires. @returns {CustomEvent} */
export function transmitFlowPulse(b) {
  return b.emit(FLOW_PULSE_EVENT, { origin: b.el.id, timestamp: Date.now(), relayChain: [] });
}

/** The ids this node's `connect` trait wires it to. */
function connectionsOf(b) {
  const options = b.spec.connect;
  const ids = options && typeof options === 'object' ? options.connections ?? options.targets ?? options.connectTo : null;
  return Array.isArray(ids) ? ids : [];
}

/** A pulse on this node: flash, then forward one hop to each connection not already in the chain. */
function receivePulse(b, payload) {
  pulseFlowNode(b);
  const relayChain = [...(Array.isArray(payload?.relayChain) ? payload.relayChain : []), b.el.id];
  for (const id of connectionsOf(b)) {
    if (relayChain.includes(id)) continue;
    const target = b.find(id);
    if (target && target !== b) target.emit(FLOW_PULSE_EVENT, { ...payload, relayChain });
  }
}

/* ------------------ TEMPLATE ------------------ */

const HTML = `<div class="cloudcanvas-component cloudcanvas-component-card ${FLOW_CLS.ROOT}">`
  + `<div class="${FLOW_CLS.PORT} ${FLOW_CLS.PORT_IN}"></div><div class="${FLOW_CLS.PORT} ${FLOW_CLS.PORT_OUT}"></div>`
  + `<div class="${FLOW_CLS.HEADER}"><div class="${FLOW_CLS.TITLE}"></div><span class="${FLOW_CLS.TYPE}"></span></div>`
  + `<div class="${FLOW_CLS.BODY}"></div>`
  + `<button class="cloudcanvas-component-btn ${FLOW_CLS.ACTION}" type="button">⚡ Transmit Pulse</button></div>`;

/** The nodes, and the listeners: the button transmits, a pulse on this node is received, removal stops the timer. */
function bind(host, on) {
  const b = blit(host);
  const find = (className) => host.querySelector(`.${className}`);
  on(find(FLOW_CLS.ACTION), 'click', () => transmitFlowPulse(b));
  on(host, FLOW_PULSE_EVENT, (event) => {
    if (event.target === host) receivePulse(b, event.detail?.payload);
  });
  on(host, 'remove', (event) => {
    if (event.target === host) cancelPulse(host);
  });
  return {
    titleText: leadingText(find(FLOW_CLS.TITLE)), typeText: leadingText(find(FLOW_CLS.TYPE)),
    bodyText: leadingText(find(FLOW_CLS.BODY))
  };
}

function render(bindings, contents) {
  const type = contents.get('nodeType');
  setText(bindings.titleText, contents.get('title'));
  setText(bindings.bodyText, contents.get('description'));
  setText(bindings.typeText, type === undefined || type === null || type === '' ? DEFAULT_NODE_TYPE : type);
}

/* ------------------ REGISTRATION ------------------ */

const SPEC = Object.freeze({ name: FLOW_NODE_TYPE, html: HTML, keys: ['title', 'description', 'nodeType'], bind, render });

/** Define the flow node widget, once, and name the `connect` trait its wires are. @returns {object} its type */
export function registerFlowNode() {
  injectComponentStyles();
  blit.use({ connect });
  return widget(SPEC);
}

/**
 * A flow node in `parent`, wired by default. `title`, `description` and `nodeType` are
 * contents; `connectTo` (or `connections`) lists the ids it is wired to, `stroke` and
 * `strokeWidth` style the wires, and `connectable: false` leaves it unwired; the rest is spec.
 */
export function createFlowNode(parent, options = {}) {
  registerFlowNode();
  const { connectable, connectTo, connections, targets, stroke, strokeWidth, ...rest } = options;
  const wired = connectable === false ? {} : { connect: { connections: connectTo || connections || targets || [], stroke, strokeWidth } };
  return parent.blit(widgetSpec(FLOW_NODE_TYPE, withDefaults({
    x: 100, y: 100, w: 210, h: 140, chrome: false,
    title: 'Pipeline Node', description: 'Data flow logic block', nodeType: DEFAULT_NODE_TYPE, ...wired
  }, rest)));
}
