/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The component stylesheet, second of three: the four remaining board widgets
 * (telemetry gauge, flow node, workspace group, media card).
 *
 * The discipline, the token groups and the shared surfaces (`-card`, `-btn`,
 * `-chip`, `-meter`) are stated in `./styles-cards-css.js`, the third that
 * opens the sheet; `./styles-comms-css.js` closes it with the environment
 * queries. `./styles.js` joins the three and nothing else imports any of them.
 */

/** Telemetry, flow, workspace and media rules. Concatenated by `./styles.js`. */
export const COMPONENTS_BOARD_CSS = `
/* ------------------ TELEMETRY GAUGE ------------------ */

/* Header at the top, readout in the middle, bar at the foot, whatever the height. */
.cloudcanvas-telemetry-card {
  justify-content: space-between;
}

.cloudcanvas-telemetry-status[data-status="nominal"] {
  background: var(--cc-status-nominal, #34d399);
}

.cloudcanvas-telemetry-status[data-status="warning"] {
  background: var(--cc-status-warning, #fbbf24);
}

.cloudcanvas-telemetry-status[data-status="critical"] {
  background: var(--cc-status-critical, #f87171);
  animation: cloudcanvas-component-pulse 1s infinite alternate;
}

@keyframes cloudcanvas-component-pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.6;
  }
}

.cloudcanvas-telemetry-readout {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  margin: var(--cc-space-2, 8px) 0;
}

.cloudcanvas-telemetry-value {
  font-size: var(--cc-type-display, 28px);
  font-weight: var(--cc-weight-bold, 700);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.cloudcanvas-telemetry-unit {
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-sm, 12px);
}

.cloudcanvas-telemetry-bar[data-status="nominal"] {
  color: var(--cc-status-nominal, #34d399);
}
.cloudcanvas-telemetry-bar[data-status="nominal"]::-webkit-progress-value {
  background: var(--cc-status-nominal, #34d399);
}
.cloudcanvas-telemetry-bar[data-status="nominal"]::-moz-progress-bar {
  background: var(--cc-status-nominal, #34d399);
}

.cloudcanvas-telemetry-bar[data-status="warning"] {
  color: var(--cc-status-warning, #fbbf24);
}
.cloudcanvas-telemetry-bar[data-status="warning"]::-webkit-progress-value {
  background: var(--cc-status-warning, #fbbf24);
}
.cloudcanvas-telemetry-bar[data-status="warning"]::-moz-progress-bar {
  background: var(--cc-status-warning, #fbbf24);
}

.cloudcanvas-telemetry-bar[data-status="critical"] {
  color: var(--cc-status-critical, #f87171);
}
.cloudcanvas-telemetry-bar[data-status="critical"]::-webkit-progress-value {
  background: var(--cc-status-critical, #f87171);
}
.cloudcanvas-telemetry-bar[data-status="critical"]::-moz-progress-bar {
  background: var(--cc-status-critical, #f87171);
}

/* ------------------ FLOW NODE ------------------ */

.cloudcanvas-flow-node {
  position: relative;
  transition: box-shadow 0.1s ease, border-color 0.1s ease;
}

.cloudcanvas-flow-node.is-pulsing {
  border-color: var(--cc-accent, #38bdf8);
  box-shadow: var(--cc-flow-pulse, 0 0 20px rgba(56, 189, 248, 0.6));
}

.cloudcanvas-flow-port {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  transform: translateY(-50%);
  border: 2px solid var(--cc-bg, #0f1117);
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
}

.cloudcanvas-flow-port-in {
  left: -5px;
}

.cloudcanvas-flow-port-out {
  right: -5px;
}

.cloudcanvas-flow-type {
  flex: none;
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-xs, 11px);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.cloudcanvas-flow-body {
  flex: 1;
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-sm, 12px);
  line-height: 1.4;
}

.cloudcanvas-flow-action-btn {
  width: 100%;
  margin-top: var(--cc-space-2, 8px);
}

/* ------------------ WORKSPACE GROUP ------------------ */

/* The one widget that keeps the Pin's own card: it is a scope, and the well
   its children sit in is the core's. So no surface here, only a header. */
.cloudcanvas-workspace-card {
  display: flex;
  flex-direction: column;
  color: var(--cc-text, #e2e8f0);
}

.cloudcanvas-workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
}

.cloudcanvas-workspace-title {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-width: 0;
  font-size: var(--cc-type-lg, 15px);
  font-weight: var(--cc-weight-semibold, 600);
}

.cloudcanvas-workspace-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-workspace-focus-btn {
  flex: none;
}

.cloudcanvas-workspace-badge {
  display: inline-flex;
  align-items: center;
  flex: none;
  min-height: 18px;
  padding: 0 var(--cc-space-2, 8px);
  border: 1px solid var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
  color: var(--cc-badge-text, #38bdf8);
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  white-space: nowrap;
}

/* ------------------ MEDIA CARD ------------------ */

.cloudcanvas-media-card {
  padding: 0;
  overflow: hidden;
}

.cloudcanvas-media-viewport {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  overflow: hidden;
  width: 100%;
  height: var(--cc-media-max-height, 120px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: var(--cc-text, #e2e8f0);
}

.cloudcanvas-media-img,
.cloudcanvas-media-placeholder {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.cloudcanvas-media-img {
  object-fit: cover;
}

/* The render toggles image and placeholder with the hidden attribute; the block display above must not undo it. */
.cloudcanvas-media-img[hidden],
.cloudcanvas-media-placeholder[hidden] {
  display: none;
}

.cloudcanvas-media-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--cc-space-1, 4px);
  min-height: 0;
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
}

.cloudcanvas-media-caption {
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-sm, 12px);
  line-height: 1.4;
}
`;
