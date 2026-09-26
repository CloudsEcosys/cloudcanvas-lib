/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * FlowNode: a graph node with two ports, a description and a transmit button.
 *
 * The pulse a node shows on receiving `flow:pulse` is a state class
 * (`is-pulsing`) the sheet animates, added from the trait's `onTransmit` hook
 * and removed by a timer - never an inline border or shadow. The timer is
 * kept per Pin and cleared on detach, so a destroyed node leaves nothing
 * behind. The transmit control is a real `<button>`: the framework's
 * `CONTROL_SELECTOR` already keeps a press on it from starting a drag.
 */

import {
  ConnectableTrait,
  PinEvent,
  TransmitterTrait,
  makeElement,
  makeTextNode,
  setText
} from '../../.plugin/index.js';
import {
  bindingsOf,
  claimHost,
  createComponentPin,
  makeRegistrar,
  splitOptions
} from './registrar.js';

/** Registry name, and the `type` a caller creates a Pin by. */
export const FLOW_NODE_TYPE = 'flow-node';

/** Every class this widget emits. Styled by `COMPONENT_DEFAULT_CSS`. */
export const FLOW_CLS = Object.freeze({
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

/** The event a node transmits, and reacts to. */
export const FLOW_PULSE_EVENT = 'flow:pulse';

/** How long the pulse class stays on. */
const PULSE_MS = 400;
const DEFAULT_NODE_TYPE = 'process';
const ALLOWED_KEYS = ['title', 'description', 'nodeType'];

/** Pending pulse timers, by Pin. */
const pulses = new WeakMap();

/* ------------------ BEHAVIOUR ------------------ */

/** Clear a pending pulse timer, leaving the class wherever it is. */
function cancelPulse(pin) {
  const timer = pulses.get(pin);
  if (timer === undefined) return;
  clearTimeout(timer);
  pulses.delete(pin);
}

/**
 * Flash the node. A pulse arriving during a pulse restarts the timer rather
 * than stacking a second removal.
 *
 * @returns {boolean} whether the node had a rendered card to flash
 */
export function pulseFlowNode(pin) {
  const bindings = bindingsOf(pin);
  if (!bindings) return false;

  cancelPulse(pin);
  bindings.card.classList.add(FLOW_CLS.PULSING);
  pulses.set(pin, setTimeout(() => {
    bindings.card.classList.remove(FLOW_CLS.PULSING);
    pulses.delete(pin);
  }, PULSE_MS));
  return true;
}

/** Transmit a pulse from this node; the `TransmitterTrait` carries it along the wires. */
export function transmitFlowPulse(pin) {
  pulseFlowNode(pin);
  pin.transmit(new PinEvent(FLOW_PULSE_EVENT, {
    payload: { origin: pin.id, timestamp: Date.now() },
    bubbles: true,
    source: pin
  }));
}

function onTransmit(pin, event) {
  if (event && event.type === FLOW_PULSE_EVENT) pulseFlowNode(pin);
}

function onDetach(pin) {
  cancelPulse(pin);
}

/* ------------------ TEMPLATE ------------------ */

function build(pin, contentEl) {
  claimHost(contentEl);
  const card = makeElement('div', `cloudcanvas-component cloudcanvas-component-card ${FLOW_CLS.ROOT}`);
  card.appendChild(makeElement('div', `${FLOW_CLS.PORT} ${FLOW_CLS.PORT_IN}`));
  card.appendChild(makeElement('div', `${FLOW_CLS.PORT} ${FLOW_CLS.PORT_OUT}`));

  const header = makeElement('div', FLOW_CLS.HEADER);
  const title = makeElement('div', FLOW_CLS.TITLE);
  const titleText = makeTextNode(title);
  const type = makeElement('span', FLOW_CLS.TYPE);
  const typeText = makeTextNode(type);
  header.append(title, type);

  const body = makeElement('div', FLOW_CLS.BODY);
  const bodyText = makeTextNode(body);

  const action = makeElement('button', `cloudcanvas-component-btn ${FLOW_CLS.ACTION}`);
  action.setAttribute('type', 'button');
  action.appendChild(document.createTextNode('⚡ Transmit Pulse'));
  action.addEventListener('click', () => transmitFlowPulse(pin));

  card.append(header, body, action);
  contentEl.replaceChildren(card);

  return { card, titleText, typeText, bodyText, action };
}

function update(pin, contents, bindings) {
  const type = contents.get('nodeType');
  setText(bindings.titleText, contents.get('title'));
  setText(bindings.bodyText, contents.get('description'));
  setText(bindings.typeText, type === undefined || type === null || type === '' ? DEFAULT_NODE_TYPE : type);
}

/* ------------------ REGISTRATION ------------------ */

/** Register the flow node, once per registry; see `./registrar.js`. */
export const registerFlowNode = makeRegistrar({
  name: FLOW_NODE_TYPE,
  build,
  update,
  chrome: false,
  allowedKeys: ALLOWED_KEYS,
  defaults: { onTransmit, onDetach }
});

/**
 * Create a flow node Pin, connectable and transmitting by default.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options] `title`, `description`, `nodeType` become
 *   contents; `connectTo` (or `connections`) wires the node, `connectable:
 *   false` leaves it unwired; `stroke` / `strokeWidth` style the wires
 * @returns {Pin}
 */
export function createFlowNodePin(session, options = {}) {
  const { pinOptions, contents } = splitOptions(options, [
    ['title', 'Pipeline Node'],
    ['description', 'Data flow logic block'],
    ['nodeType', DEFAULT_NODE_TYPE]
  ], { x: 100, y: 100, width: 210, height: 140 });

  const { connectable, connectTo, connections, targets, stroke, strokeWidth, ...rest } = pinOptions;
  const traits = Array.isArray(rest.traits) ? [...rest.traits] : [];
  if (connectable !== false) {
    traits.push(new ConnectableTrait({
      connections: connectTo || connections || targets || [],
      stroke,
      strokeWidth
    }));
  }
  traits.push(new TransmitterTrait({ forwardToConnections: true }));
  rest.traits = traits;

  return createComponentPin(session, registerFlowNode, rest, contents, false);
}
