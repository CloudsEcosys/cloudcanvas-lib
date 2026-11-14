/*!
 * CloudCanvas lib v0.7.1 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
import{a as E,b as R}from"./chunk-VOZFMESQ.js";import{b as Se,c as Ce}from"./chunk-QSVXIBUE.js";import{i as D}from"./chunk-BRVWKQTL.js";import{f as M}from"./chunk-IOF743KE.js";import"./chunk-4TAQWWHY.js";import"./chunk-6ASDR6O6.js";import{a as s,b as C,c as u,e as i,f as v,j as Oe,k as y,l as L,m as N,n as f}from"./chunk-T6Z33S5T.js";import{c as ke,e as _,f as I}from"./chunk-RH5IHBE6.js";import{a as Ae,b as P}from"./chunk-JSSN4ILA.js";import{blit as rc}from"cloudcanvas";import{blit as kt}from"cloudcanvas";var Re=`
/* ------------------ FOUNDATION ------------------ */

.cloudcanvas-component {
  box-sizing: border-box;
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
}

.cloudcanvas-component *,
.cloudcanvas-component *::before,
.cloudcanvas-component *::after {
  box-sizing: inherit;
}

.cloudcanvas-component button:focus-visible,
.cloudcanvas-component input:focus-visible,
.cloudcanvas-component textarea:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

/* The one card surface every boxed widget shares; a widget adds its own class
   beside it for layout, never a second background. */
.cloudcanvas-component-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--cc-space-3, 12px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  color: var(--cc-text, #e2e8f0);
}

/* A real <button>, on the core action button's tokens - the pair the framework
   already keeps readable in both themes. */
.cloudcanvas-component-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  color: var(--cc-btn-text, #7dd3fc);
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-medium, 500);
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cloudcanvas-component-btn:hover {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-color: var(--cc-accent, #38bdf8);
}

/* A filled chip: priority, telemetry status, event status. The fill is set by
   the widget's data attribute; the ink is the canvas background. The resting
   fill is the text colour - inverted, and readable by construction. */
.cloudcanvas-component-chip {
  display: inline-flex;
  align-items: center;
  flex: none;
  min-height: 18px;
  padding: 0 var(--cc-space-2, 8px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-text, #e2e8f0);
  color: var(--cc-bg, #0f1117);
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* A native <progress>: the engine pseudo-elements paint it, so the two colours
   are stated for WebKit's bar and value and for Gecko's single value element. */
.cloudcanvas-component-meter {
  appearance: none;
  -webkit-appearance: none;
  display: block;
  flex: none;
  overflow: hidden;
  width: 100%;
  height: 6px;
  margin: 0;
  border: 0;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-meter-track, rgba(255, 255, 255, 0.12));
  color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-component-meter::-webkit-progress-bar {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-meter-track, rgba(255, 255, 255, 0.12));
}

.cloudcanvas-component-meter::-webkit-progress-value {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
  transition: width 0.25s ease;
}

.cloudcanvas-component-meter::-moz-progress-bar {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
}

/* The inline editor \`EditableTrait\` drops into a title. */
.cloudcanvas-editable-input {
  width: 100%;
  padding: 0 var(--cc-space-1, 4px);
  border: 1px solid var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: inherit;
  font: inherit;
  line-height: inherit;
}

/* ------------------ STICKY NOTE ------------------ */

.cloudcanvas-sticky-note {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--cc-space-3, 12px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-sticky-yellow, #fef08a);
  color: var(--cc-sticky-yellow-ink, #713f12);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  transform: rotate(var(--cc-sticky-tilt, 0deg));
  transition: box-shadow 0.2s ease;
  user-select: none;
}

.cloudcanvas-sticky-note:hover {
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55));
}

.cloudcanvas-sticky-note[data-theme="pink"] {
  background: var(--cc-sticky-pink, #fbcfe8);
  color: var(--cc-sticky-pink-ink, #831843);
}

.cloudcanvas-sticky-note[data-theme="cyan"] {
  background: var(--cc-sticky-cyan, #bae6fd);
  color: var(--cc-sticky-cyan-ink, #0c4a6e);
}

.cloudcanvas-sticky-note[data-theme="lime"] {
  background: var(--cc-sticky-lime, #d9f99d);
  color: var(--cc-sticky-lime-ink, #365314);
}

.cloudcanvas-sticky-note[data-theme="orange"] {
  background: var(--cc-sticky-orange, #fed7aa);
  color: var(--cc-sticky-orange-ink, #7c2d12);
}

.cloudcanvas-sticky-pinhead {
  position: absolute;
  top: -8px;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translateX(-50%);
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-sticky-pinhead, #e11d48);
  box-shadow: var(--cc-sticky-pinhead-shadow, 0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5));
  pointer-events: none;
}

.cloudcanvas-sticky-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
  margin-bottom: var(--cc-space-2, 8px);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  letter-spacing: 0.02em;
}

.cloudcanvas-sticky-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-sticky-tag {
  flex: none;
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-sticky-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  font-size: var(--cc-type-md, 13px);
  line-height: 1.45;
  word-break: break-word;
  white-space: pre-wrap;
}

.cloudcanvas-sticky-editor {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: var(--cc-space-1, 4px);
  border: 1px solid var(--cc-sticky-rule, rgba(0, 0, 0, 0.2));
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-sticky-editor-bg, rgba(255, 255, 255, 0.7));
  color: inherit;
  font: inherit;
  line-height: 1.45;
  resize: none;
}

.cloudcanvas-sticky-footer {
  display: flex;
  align-items: center;
  margin-top: var(--cc-space-2, 8px);
  padding-top: var(--cc-space-1, 4px);
  border-top: 1px dashed var(--cc-sticky-rule, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-sticky-swatches {
  display: flex;
}

/* A swatch is a full-size hit target drawing a small dot: the control keeps
   its minimum, the note keeps its look. */
.cloudcanvas-sticky-swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--cc-control-min, 28px);
  height: var(--cc-control-min, 28px);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.cloudcanvas-sticky-swatch::before {
  content: "";
  width: 14px;
  height: 14px;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-sticky-yellow, #fef08a);
  box-shadow: var(--cc-sticky-swatch-ring, 0 0 0 1px rgba(0, 0, 0, 0.2));
  transition: transform 0.1s ease;
}

.cloudcanvas-sticky-swatch[data-theme="pink"]::before {
  background: var(--cc-sticky-pink, #fbcfe8);
}

.cloudcanvas-sticky-swatch[data-theme="cyan"]::before {
  background: var(--cc-sticky-cyan, #bae6fd);
}

.cloudcanvas-sticky-swatch[data-theme="lime"]::before {
  background: var(--cc-sticky-lime, #d9f99d);
}

.cloudcanvas-sticky-swatch[data-theme="orange"]::before {
  background: var(--cc-sticky-orange, #fed7aa);
}

.cloudcanvas-sticky-swatch:hover::before {
  transform: scale(1.25);
}

.cloudcanvas-sticky-swatch[aria-pressed="true"]::before {
  box-shadow: var(--cc-sticky-swatch-ring-active, 0 0 0 2px currentColor);
}

/* ------------------ TASK / KANBAN CARD ------------------ */

/* A checklist longer than the card scrolls inside it rather than spilling
   past the rounded corners. */
.cloudcanvas-task-card {
  overflow: hidden;
}

.cloudcanvas-task-header,
.cloudcanvas-telemetry-header,
.cloudcanvas-flow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
  margin-bottom: var(--cc-space-2, 8px);
}

.cloudcanvas-task-title,
.cloudcanvas-telemetry-title,
.cloudcanvas-flow-title,
.cloudcanvas-media-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: var(--cc-type-md, 13px);
  font-weight: var(--cc-weight-semibold, 600);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-task-priority[data-priority="urgent"] {
  background: var(--cc-priority-urgent, #fb7185);
}

.cloudcanvas-task-priority[data-priority="high"] {
  background: var(--cc-priority-high, #fb923c);
}

.cloudcanvas-task-priority[data-priority="normal"] {
  background: var(--cc-priority-normal, #38bdf8);
}

.cloudcanvas-task-priority[data-priority="low"] {
  background: var(--cc-priority-low, #94a3b8);
}

.cloudcanvas-task-checklist {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--cc-space-1, 4px);
  min-height: 0;
  overflow-y: auto;
  margin: var(--cc-space-1, 4px) 0;
  padding: 0;
  list-style: none;
}

.cloudcanvas-check-item {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-1, 4px);
  border-radius: var(--cc-radius-sm, 6px);
  font-size: var(--cc-type-sm, 12px);
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.cloudcanvas-check-item:hover {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-check-box {
  flex: none;
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--cc-accent, #38bdf8);
  cursor: pointer;
}

.cloudcanvas-check-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

/* Done is the strike alone: muted ink over a hovered row measured 4.25:1 on
   the light card, and a finished item is still an item someone has to read. */
.cloudcanvas-check-item.is-done .cloudcanvas-check-label {
  text-decoration: line-through;
}

.cloudcanvas-task-progress,
.cloudcanvas-telemetry-bar {
  margin-top: var(--cc-space-2, 8px);
}
`;var Ne=`
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

/* The one widget that holds blits: its children sit in its own scope, placed
   by the core, under the shared card surface. So no surface here, only a header. */
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
`;var Le=`
/* ------------------ BREADCRUMB BAR ------------------ */

.cloudcanvas-breadcrumb-card {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  max-width: 100%;
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  -webkit-backdrop-filter: blur(var(--cc-card-blur, 12px));
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-sm, 12px);
  user-select: none;
}

.cloudcanvas-breadcrumb-back-btn {
  flex: none;
  border-radius: var(--cc-radius-pill, 9999px);
}

.cloudcanvas-breadcrumb-path {
  display: flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  min-width: 0;
  color: var(--cc-text-muted, #94a3b8);
}

/* The root crumb is a real button on the trail's own colours. */
.cloudcanvas-breadcrumb-crumb {
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-1, 4px);
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  background: transparent;
  color: inherit;
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.cloudcanvas-breadcrumb-crumb:hover {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: var(--cc-text, #e2e8f0);
}

.cloudcanvas-breadcrumb-separator {
  flex: none;
}

.cloudcanvas-breadcrumb-current {
  min-width: 0;
  overflow: hidden;
  color: var(--cc-text, #e2e8f0);
  font-weight: var(--cc-weight-semibold, 600);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ------------------ CHAT MESSAGE ------------------ */

.cloudcanvas-chat-message-card {
  flex-direction: row;
  gap: var(--cc-space-2, 8px);
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  user-select: none;
  transition: border-color 0.15s ease;
}

.cloudcanvas-chat-message-card:hover {
  border-color: var(--cc-card-border-hover, rgba(255, 255, 255, 0.18));
}

/*
 * A caller-supplied avatar colour arrives as two custom properties written by
 * the widget (the fill, and a foreground computed to read on it); with none
 * supplied, the badge tokens stand in, which the theme already keeps readable.
 */
.cloudcanvas-chat-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 34px;
  height: 34px;
  border: 1px solid var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-chat-avatar-bg, var(--cc-badge-bg, rgba(56, 189, 248, 0.15)));
  color: var(--cc-chat-avatar-text, var(--cc-badge-text, #38bdf8));
  font-size: var(--cc-type-md, 13px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  text-transform: uppercase;
}

.cloudcanvas-chat-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--cc-space-1, 4px);
  min-width: 0;
}

.cloudcanvas-chat-meta {
  display: flex;
  align-items: baseline;
  gap: var(--cc-space-2, 8px);
  min-width: 0;
}

.cloudcanvas-chat-author {
  min-width: 0;
  overflow: hidden;
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-md, 13px);
  font-weight: var(--cc-weight-semibold, 600);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-chat-time {
  flex: none;
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-chat-text {
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.45;
  word-break: break-word;
}

.cloudcanvas-chat-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cc-space-1, 4px);
  margin-top: var(--cc-space-1, 4px);
}

/* A reaction is a toggle button; \`aria-pressed\` is both its state and its style hook. */
.cloudcanvas-chat-reaction-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-2, 8px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: var(--cc-text, #e2e8f0);
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  line-height: 1;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.cloudcanvas-chat-reaction-pill:hover {
  border-color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-chat-reaction-emoji {
  line-height: 1;
}

.cloudcanvas-chat-reaction-count {
  font-variant-numeric: tabular-nums;
}

.cloudcanvas-chat-reaction-pill[aria-pressed="true"] {
  border-color: var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
  color: var(--cc-badge-text, #38bdf8);
  font-weight: var(--cc-weight-semibold, 600);
}

/* ------------------ CHAT COMPOSER ------------------ */

.cloudcanvas-chat-input-bar {
  flex-direction: row;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  padding: var(--cc-space-2, 8px);
}

.cloudcanvas-chat-input-field {
  flex: 1;
  min-width: 0;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-sm, 6px);
  /* The border is the field: a tinted well put the muted placeholder at
     4.25:1 on the light card, and the card itself already clears it. */
  background: transparent;
  color: var(--cc-text, #e2e8f0);
  font-family: inherit;
  font-size: var(--cc-type-md, 13px);
  line-height: 1.35;
  transition: border-color 0.15s ease;
}

.cloudcanvas-chat-input-field::placeholder {
  color: var(--cc-text-muted, #94a3b8);
  opacity: 1;
}

.cloudcanvas-chat-input-field:focus {
  border-color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-chat-send-btn {
  flex: none;
}

/* ------------------ CALENDAR EVENT ------------------ */

.cloudcanvas-event-card {
  gap: var(--cc-space-1, 4px);
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  border-left: 4px solid var(--cc-severity-normal, #38bdf8);
  user-select: none;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.cloudcanvas-event-card:hover {
  transform: translateY(-1px);
}

.cloudcanvas-event-card[data-severity="critical"] {
  border-left-color: var(--cc-severity-critical, #f87171);
  animation: cloudcanvas-component-alarm 2s infinite ease-in-out;
}

.cloudcanvas-event-card[data-severity="high"] {
  border-left-color: var(--cc-severity-high, #fbbf24);
}

.cloudcanvas-event-card[data-severity="info"] {
  border-left-color: var(--cc-severity-info, #34d399);
}

@keyframes cloudcanvas-component-alarm {
  0%, 100% {
    box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  }
  50% {
    box-shadow: var(--cc-severity-critical-glow, 0 0 16px rgba(248, 113, 113, 0.6));
  }
}

.cloudcanvas-event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
}

.cloudcanvas-event-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-event-badge[data-severity="critical"] {
  background: var(--cc-severity-critical, #f87171);
}

.cloudcanvas-event-badge[data-severity="high"] {
  background: var(--cc-severity-high, #fbbf24);
}

.cloudcanvas-event-badge[data-severity="normal"] {
  background: var(--cc-severity-normal, #38bdf8);
}

.cloudcanvas-event-badge[data-severity="info"] {
  background: var(--cc-severity-info, #34d399);
}

.cloudcanvas-event-time {
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-event-actions {
  display: flex;
  gap: var(--cc-space-1, 4px);
  margin-top: var(--cc-space-1, 4px);
}

.cloudcanvas-event-btn {
  flex: 1;
}

/* Two equal actions; the one that closes the event reads as the primary. */
.cloudcanvas-event-ack {
  font-weight: var(--cc-weight-medium, 500);
}

.cloudcanvas-event-resolve {
  font-weight: var(--cc-weight-semibold, 600);
}

/* ------------------ ENVIRONMENT ------------------ */

@media (pointer: coarse) {
  .cloudcanvas-component-btn,
  .cloudcanvas-check-item,
  .cloudcanvas-chat-reaction-pill,
  .cloudcanvas-chat-input-field,
  .cloudcanvas-breadcrumb-crumb {
    min-height: var(--cc-control-min-coarse, 44px);
  }

  .cloudcanvas-sticky-swatch {
    width: var(--cc-control-min-coarse, 44px);
    height: var(--cc-control-min-coarse, 44px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-component-btn,
  .cloudcanvas-component-meter::-webkit-progress-value,
  .cloudcanvas-sticky-note,
  .cloudcanvas-sticky-swatch::before,
  .cloudcanvas-check-item,
  .cloudcanvas-flow-node,
  .cloudcanvas-chat-message-card,
  .cloudcanvas-chat-reaction-pill,
  .cloudcanvas-chat-input-field,
  .cloudcanvas-breadcrumb-crumb,
  .cloudcanvas-event-card {
    transition: none;
  }

  .cloudcanvas-telemetry-status[data-status="critical"],
  .cloudcanvas-event-card[data-severity="critical"] {
    animation: none;
  }

  .cloudcanvas-event-card:hover {
    transform: none;
  }
}
`;var ae="cloudcanvas-components-styles",_e=`${Re}${Ne}${Le}`,Et=Object.freeze({"--cc-priority-urgent":"#fb7185","--cc-priority-high":"#fb923c","--cc-priority-normal":"#38bdf8","--cc-priority-low":"#94a3b8","--cc-status-nominal":"#34d399","--cc-status-warning":"#fbbf24","--cc-status-critical":"#f87171","--cc-severity-critical":"#f87171","--cc-severity-critical-glow":"0 0 16px rgba(248, 113, 113, 0.6)","--cc-severity-high":"#fbbf24","--cc-severity-normal":"#38bdf8","--cc-severity-info":"#34d399","--cc-flow-pulse":"0 0 20px rgba(56, 189, 248, 0.6)","--cc-type-display":"28px","--cc-weight-bold":"700","--cc-chat-avatar-bg":"var(--cc-badge-bg, rgba(56, 189, 248, 0.15))","--cc-chat-avatar-text":"var(--cc-badge-text, #38bdf8)","--cc-sticky-yellow":"#fef08a","--cc-sticky-yellow-ink":"#713f12","--cc-sticky-pink":"#fbcfe8","--cc-sticky-pink-ink":"#831843","--cc-sticky-cyan":"#bae6fd","--cc-sticky-cyan-ink":"#0c4a6e","--cc-sticky-lime":"#d9f99d","--cc-sticky-lime-ink":"#365314","--cc-sticky-orange":"#fed7aa","--cc-sticky-orange-ink":"#7c2d12","--cc-sticky-pinhead":"#e11d48","--cc-sticky-pinhead-shadow":"0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5)","--cc-sticky-rule":"rgba(0, 0, 0, 0.2)","--cc-sticky-swatch-ring":"0 0 0 1px rgba(0, 0, 0, 0.2)","--cc-sticky-swatch-ring-active":"0 0 0 2px currentColor","--cc-sticky-editor-bg":"rgba(255, 255, 255, 0.7)","--cc-sticky-tilt":"0deg"}),wt=Object.freeze({"--cc-priority-urgent":"#be123c","--cc-priority-high":"#9a3412","--cc-priority-normal":"#0369a1","--cc-priority-low":"#475569","--cc-status-nominal":"#047857","--cc-status-warning":"#92400e","--cc-status-critical":"#b91c1c","--cc-severity-critical":"#b91c1c","--cc-severity-high":"#92400e","--cc-severity-normal":"#0369a1","--cc-severity-info":"#047857"});function p(){if(typeof document>"u")return null;let e=document.getElementById(ae);if(e)return e;let t=document.createElement("style");return t.id=ae,t.textContent=_e,document.head.appendChild(t),t}var ce="sticky-note",re=Object.freeze(["yellow","pink","cyan","lime","orange"]),g=Object.freeze({ROOT:"cloudcanvas-sticky-note",PINHEAD:"cloudcanvas-sticky-pinhead",HEADER:"cloudcanvas-sticky-header",TITLE:"cloudcanvas-sticky-title",TAG:"cloudcanvas-sticky-tag",BODY:"cloudcanvas-sticky-body",EDITOR:"cloudcanvas-sticky-editor",FOOTER:"cloudcanvas-sticky-footer",SWATCHES:"cloudcanvas-sticky-swatches",SWATCH:"cloudcanvas-sticky-swatch"}),Pe="yellow",Ie=3;function Ot(e){return re.includes(e)?e:Pe}function oe(e){let t=a=>e.querySelector(`.${a}`);return{card:t(g.ROOT),body:t(g.BODY),editor:t(g.EDITOR)}}function De(e){let{body:t,editor:a}=oe(e.el);return!a||!a.hidden?!1:(a.value=E(e.spec.stickyNote?.body),_(e,a),C(t,!1),C(a,!0),a.focus(),!0)}function $(e,t=!0){let{body:a,editor:c}=oe(e.el);if(!c||c.hidden)return!1;let r=c.value.trim();return C(c,!1),C(a,!0),t&&(N(e,"body",r),e.emit("note:edited",{body:r})),I(e),!0}function At(e){return`<button class="${g.SWATCH}" type="button" data-theme="${e}" aria-label="${e}" aria-pressed="false" title="${e}"></button>`}var St=`<div class="cloudcanvas-component ${g.ROOT}"><div class="${g.PINHEAD}"></div><div class="${g.HEADER}"><div class="${g.TITLE}"></div><span class="${g.TAG}"></span></div><div class="${g.BODY}"></div><textarea class="${g.EDITOR}" aria-label="Note body" hidden></textarea><div class="${g.FOOTER}"><div class="${g.SWATCHES}" role="group" aria-label="Note colour">`+re.map(At).join("")+"</div></div></div>";function Ct(e,t){let a=kt(e),{card:c,body:r,editor:o}=oe(e);t(r,"dblclick",T=>{T.stopPropagation(),De(a)}),t(o,"keydown",T=>{T.key==="Escape"?(T.stopPropagation(),$(a,!1)):T.key==="Enter"&&(T.ctrlKey||T.metaKey)&&(T.preventDefault(),$(a,!0))}),t(o,"blur",()=>$(a,!0));let n=Array.from(e.querySelectorAll(`.${g.SWATCH}`));for(let T of n)t(T,"click",()=>N(a,"color",T.getAttribute("data-theme")));let l=e.querySelector(`.${g.TITLE}`),O=e.querySelector(`.${g.TAG}`);return{card:c,titleText:i(l),tag:O,tagText:i(O),bodyText:i(r),swatches:n}}function Rt(e,t,a){let c=Ot(t.get("color")),r=E(t.get("tag")),o=Number(t.get("tilt"));s(e.titleText,t.get("title")),s(e.bodyText,t.get("body")),s(e.tagText,r===""?"":`#${r}`),C(e.tag,r!==""),u(e.card,"data-theme",c,a,"theme"),u(e.card,"style",`--cc-sticky-tilt:${Number.isFinite(o)?o:0}deg;`,a,"tilt");for(let n of e.swatches){let l=n.getAttribute("data-theme")===c?"true":"false";n.getAttribute("aria-pressed")!==l&&n.setAttribute("aria-pressed",l)}}var Nt=Object.freeze({name:ce,html:St,keys:["title","body","color","tag","tilt"],bind:Ct,render:Rt});function U(){return p(),v(Nt)}function Lt(e,t={}){U();let a=t.tilt??Number((Math.random()*Ie*2-Ie).toFixed(1));return e.blit(f(ce,{x:100,y:100,w:180,h:180,chrome:!1,title:"Note",body:"Type your ideas here...",color:Pe,tag:"",...t,tilt:a}))}import{blit as Pt}from"cloudcanvas";import{blit as _t}from"cloudcanvas";var It="[data-blit-root]";function B(e){let t=e.el.closest(It);return t?_t(t):null}function j(e,t,a,c,r){let o=typeof t?.closest=="function"?t.closest(`.${a}`):null;if(!o||!e.contains(o)||!Array.isArray(c))return-1;let n=o.getAttribute(Ae);return c.findIndex((l,O)=>String(r(l,O))===n)}function b(e,t={}){let a={...e};for(let[c,r]of Object.entries(t))r!==void 0&&(a[c]=r);return a}var se="task-card",h=Object.freeze({ROOT:"cloudcanvas-task-card",HEADER:"cloudcanvas-task-header",TITLE:"cloudcanvas-task-title",PRIORITY:"cloudcanvas-task-priority",CHECKLIST:"cloudcanvas-task-checklist",ITEM:"cloudcanvas-check-item",ITEM_DONE:"is-done",BOX:"cloudcanvas-check-box",LABEL:"cloudcanvas-check-label",PROGRESS:"cloudcanvas-task-progress"}),Me=Object.freeze(["urgent","high","normal","low"]),$e="task:updated",Ue="normal",ne=new WeakMap,Dt=0;function ie(e,t){return e&&e.id!==void 0&&e.id!==null?e.id:t}function Mt(e){let t=typeof e=="string"?e.toLowerCase():"";return Me.includes(t)?t:Ue}function H(e){if(!Array.isArray(e)||e.length===0)return 0;let t=e.filter(a=>a&&a.done).length;return Math.round(t/e.length*100)}function Be(e,t){let a=y(e).items;if(!Array.isArray(a)||!a[t])return!1;let c=a.map((o,n)=>n===t?{...o,done:!o.done}:o),r=H(c);return L(e,{items:c,progress:r}),e.emit($e,{index:t,item:c[t],progress:r}),!0}var $t=`<div class="cloudcanvas-component cloudcanvas-component-card ${h.ROOT}"><div class="${h.HEADER}"><div class="${h.TITLE}"></div><span class="cloudcanvas-component-chip ${h.PRIORITY}"></span></div><ul class="${h.CHECKLIST}"></ul><progress class="cloudcanvas-component-meter ${h.PROGRESS}" max="100" aria-label="Checklist progress"></progress></div>`;function Ut(e){return e.id?e.id:(ne.has(e)||ne.set(e,`cc-task-${Dt+=1}`),ne.get(e))}function Bt(e){return(t,a)=>{let c=document.createElement("li");c.className=h.ITEM;let r=document.createElement("input");r.className=h.BOX,r.setAttribute("type","checkbox"),r.id=`${e}-item-${String(ie(t,a))}`;let o=document.createElement("label");return o.className=h.LABEL,o.setAttribute("for",r.id),i(o),c.append(r,o),c}}function jt(e,t,a){let c=e.firstElementChild,r=e.lastElementChild,o=!!(t&&t.done),n=t&&t.text!==void 0&&t.text!==null?t.text:`Item ${a+1}`;c.checked!==o&&(c.checked=o),s(r.firstChild,n),e.classList.contains(h.ITEM_DONE)!==o&&e.classList.toggle(h.ITEM_DONE,o)}function Ht(e,t){let a=Pt(e),c=n=>e.querySelector(`.${n}`),r=c(h.CHECKLIST);t(r,"change",n=>{let l=j(r,n.target,h.ITEM,y(a).items,ie);l!==-1&&Be(a,l)});let o=c(h.PRIORITY);return{titleText:i(c(h.TITLE)),priority:o,priorityText:i(o),checklist:r,progress:c(h.PROGRESS),makeRow:Bt(Ut(e))}}function Gt(e,t,a){let c=Mt(t.get("priority")),r=t.get("items"),o=Array.isArray(r)?r:[];s(e.titleText,t.get("title")),s(e.priorityText,c),u(e.priority,"data-priority",c,a,"priority"),P(e.checklist,o,{key:ie,create:e.makeRow,update:jt}),u(e.progress,"value",String(H(o)),a,"progress")}var Yt=Object.freeze({name:se,html:$t,keys:["title","priority","items","assignee","progress"],bind:Ht,render:Gt});function G(){return p(),v(Yt)}function Ft(e,t={}){G();let a=t.items??[{text:"Initial design review",done:!0},{text:"Refactor core abstractions",done:!0},{text:"Write automated test suite",done:!1}];return e.blit(f(se,b({x:100,y:100,w:220,h:190,chrome:!1,title:"Feature Checklist",priority:Ue,assignee:"Engineer",progress:H(a)},{...t,items:a})))}var le="telemetry-gauge",w=Object.freeze({ROOT:"cloudcanvas-telemetry-card",HEADER:"cloudcanvas-telemetry-header",TITLE:"cloudcanvas-telemetry-title",STATUS:"cloudcanvas-telemetry-status",READOUT:"cloudcanvas-telemetry-readout",VALUE:"cloudcanvas-telemetry-value",UNIT:"cloudcanvas-telemetry-unit",BAR:"cloudcanvas-telemetry-bar"}),zt=Object.freeze(["nominal","warning","critical"]),je="telemetry:alert",de=70,Y=90,Vt=42;function He(e,t=de,a=Y){return e>=a?"critical":e>=t?"warning":"nominal"}function Kt(e,t){let a=y(e),c=R(t,0),r=R(a.value,0),o=R(a.crit,Y);return L(e,{value:c,delta:c-r}),c>=o&&r<o&&e.emit(je,{value:c,threshold:o,status:"critical"}),c}var Wt=`<div class="cloudcanvas-component cloudcanvas-component-card ${w.ROOT}"><div class="${w.HEADER}"><div class="${w.TITLE}"></div><span class="cloudcanvas-component-chip ${w.STATUS}"></span></div><div class="${w.READOUT}"><span class="${w.VALUE}"></span><span class="${w.UNIT}"></span></div><progress class="cloudcanvas-component-meter ${w.BAR}" max="100"></progress></div>`;function qt(e){let t=c=>e.querySelector(`.${c}`),a=t(w.STATUS);return{titleText:i(t(w.TITLE)),status:a,statusText:i(a),valueText:i(t(w.VALUE)),unitText:i(t(w.UNIT)),bar:t(w.BAR)}}function Xt(e,t,a){let c=R(t.get("value"),0),r=He(c,R(t.get("warn"),de),R(t.get("crit"),Y)),o=t.get("title");s(e.titleText,o),s(e.unitText,t.get("unit")),s(e.valueText,String(Math.round(c))),s(e.statusText,r),u(e.status,"data-status",r,a,"status"),u(e.bar,"data-status",r,a,"barStatus"),u(e.bar,"value",String(Math.min(100,Math.max(0,c))),a,"value"),u(e.bar,"aria-label",o==null?"":String(o),a,"label")}var Zt=Object.freeze({name:le,html:Wt,keys:["title","unit","description","warn","crit","value","delta"],bind:qt,render:Xt});function F(){return p(),v(Zt)}function Jt(e,t={}){return F(),e.blit(f(le,b({x:100,y:100,w:210,h:140,chrome:!1,title:"Live CPU Metric",unit:"%",description:"Simulated streaming telemetry",warn:de,crit:Y,delta:0},{...t,value:R(t.value,Vt)})))}import{blit as Ge}from"cloudcanvas";var ue="flow-node",m=Object.freeze({ROOT:"cloudcanvas-flow-node",PULSING:"is-pulsing",PORT:"cloudcanvas-flow-port",PORT_IN:"cloudcanvas-flow-port-in",PORT_OUT:"cloudcanvas-flow-port-out",HEADER:"cloudcanvas-flow-header",TITLE:"cloudcanvas-flow-title",TYPE:"cloudcanvas-flow-type",BODY:"cloudcanvas-flow-body",ACTION:"cloudcanvas-flow-action-btn"}),V="flow:pulse",Qt=400,Ye="process",z=new WeakMap;function Fe(e){let t=z.get(e);t!==void 0&&(clearTimeout(t),z.delete(e))}function ze(e){let t=e.el.querySelector(`.${m.ROOT}`);return t?(Fe(e.el),t.classList.add(m.PULSING),z.set(e.el,setTimeout(()=>{t.classList.remove(m.PULSING),z.delete(e.el)},Qt)),!0):!1}function Ve(e){return e.emit(V,{origin:e.el.id,timestamp:Date.now(),relayChain:[]})}function ea(e){let t=e.spec.connect,a=t&&typeof t=="object"?t.connections??t.targets??t.connectTo:null;return Array.isArray(a)?a:[]}function ta(e,t){ze(e);let a=[...Array.isArray(t?.relayChain)?t.relayChain:[],e.el.id];for(let c of ea(e)){if(a.includes(c))continue;let r=e.find(c);r&&r!==e&&r.emit(V,{...t,relayChain:a})}}var aa=`<div class="cloudcanvas-component cloudcanvas-component-card ${m.ROOT}"><div class="${m.PORT} ${m.PORT_IN}"></div><div class="${m.PORT} ${m.PORT_OUT}"></div><div class="${m.HEADER}"><div class="${m.TITLE}"></div><span class="${m.TYPE}"></span></div><div class="${m.BODY}"></div><button class="cloudcanvas-component-btn ${m.ACTION}" type="button">⚡ Transmit Pulse</button></div>`;function ca(e,t){let a=Ge(e),c=r=>e.querySelector(`.${r}`);return t(c(m.ACTION),"click",()=>Ve(a)),t(e,V,r=>{r.target===e&&ta(a,r.detail?.payload)}),t(e,"remove",r=>{r.target===e&&Fe(e)}),{titleText:i(c(m.TITLE)),typeText:i(c(m.TYPE)),bodyText:i(c(m.BODY))}}function ra(e,t){let a=t.get("nodeType");s(e.titleText,t.get("title")),s(e.bodyText,t.get("description")),s(e.typeText,a==null||a===""?Ye:a)}var oa=Object.freeze({name:ue,html:aa,keys:["title","description","nodeType"],bind:ca,render:ra});function K(){return p(),Ge.use({connect:D}),v(oa)}function na(e,t={}){K();let{connectable:a,connectTo:c,connections:r,targets:o,stroke:n,strokeWidth:l,...O}=t,T=a===!1?{}:{connect:{connections:c||r||o||[],stroke:n,strokeWidth:l}};return e.blit(f(ue,b({x:100,y:100,w:210,h:140,chrome:!1,title:"Pipeline Node",description:"Data flow logic block",nodeType:Ye,...T},O)))}import{blit as Ke}from"cloudcanvas";var pe="workspace-group",A=Object.freeze({ROOT:"cloudcanvas-workspace-card",HEADER:"cloudcanvas-workspace-header",TITLE:"cloudcanvas-workspace-title",TITLE_TEXT:"cloudcanvas-workspace-title-text",BADGE:"cloudcanvas-workspace-badge",FOCUS:"cloudcanvas-workspace-focus-btn"}),We=80,qe=2.5,W=new WeakMap;function Xe(e,t={}){let a=B(e);if(!a||a.el===e.el)return!1;let c=e.spec.focus,{padding:r=We,maxZoom:o=qe}=c&&typeof c=="object"?c:{};return Se(a,e,{promote:!0,padding:r,maxZoom:o,...t}),!0}function Ze(e){let t=0;for(let a of e.children)a.hasAttribute("data-blit")&&(t+=1);return t}function Je(e){return`${e} ${e===1?"item":"items"}`}function sa(e,t,a){if(W.has(e)||typeof MutationObserver>"u")return;let c=new MutationObserver(()=>s(a,Je(Ze(t))));c.observe(t,{childList:!0}),W.set(e,c)}function ia(e){W.get(e)?.disconnect(),W.delete(e)}var la=`<div class="cloudcanvas-component cloudcanvas-component-card ${A.ROOT}"><div class="${A.HEADER}"><div class="${A.TITLE}"><span aria-hidden="true">📁</span><span class="${A.TITLE_TEXT}"></span><span class="${A.BADGE}"></span></div><button class="cloudcanvas-component-btn ${A.FOCUS}" type="button">🔍 Focus View</button></div><div data-scope></div></div>`;function da(e,t){let a=Ke(e),c=n=>e.querySelector(`.${n}`),r=e.querySelector("[data-scope]"),o=i(c(A.BADGE));return t(c(A.FOCUS),"click",()=>Xe(a)),t(e,"remove",n=>{n.target===e&&ia(e)}),sa(e,r,o),{titleText:i(c(A.TITLE_TEXT)),badgeText:o,scope:r}}function ua(e,t){s(e.titleText,t.get("title")),s(e.badgeText,Je(Ze(e.scope)))}var pa=Object.freeze({name:pe,html:la,keys:["title","category"],bind:da,render:ua,defaults:{layout:"free"}});function q(){return p(),Ke.use({focus:M}),v(pa)}function va(e,t={}){q();let{padding:a,...c}=t;return e.blit(f(pe,b({x:50,y:50,w:500,title:"Workspace Section",category:"General",focus:{padding:a||We,maxZoom:qe}},c)))}import{blit as fa}from"cloudcanvas";import{safeUrl as ma}from"cloudcanvas/primitives";var ve="media-card",k=Object.freeze({ROOT:"cloudcanvas-media-card",VIEWPORT:"cloudcanvas-media-viewport",IMAGE:"cloudcanvas-media-img",PLACEHOLDER:"cloudcanvas-media-placeholder",CONTENT:"cloudcanvas-media-content",TITLE:"cloudcanvas-media-title",CAPTION:"cloudcanvas-media-caption"}),ga=`<svg class="${k.PLACEHOLDER}" viewBox="0 0 300 180" aria-hidden="true"><rect fill="currentColor" width="100%" height="100%" opacity="0.08"></rect><path fill="currentColor" d="M50 140 L110 80 L160 120 L210 60 L270 140 Z" opacity="0.45"></path><circle fill="currentColor" cx="80" cy="50" r="18" opacity="0.7"></circle></svg>`,ba=`<div class="cloudcanvas-component cloudcanvas-component-card ${k.ROOT}"><div class="${k.VIEWPORT}"><img class="${k.IMAGE}" hidden>${ga}</div><div class="${k.CONTENT}"><div class="${k.TITLE}"></div><div class="${k.CAPTION}"></div></div></div>`;function ha(e){let t=a=>e.querySelector(`.${a}`);return{image:t(k.IMAGE),placeholder:t(k.PLACEHOLDER),titleText:i(t(k.TITLE)),captionText:i(t(k.CAPTION))}}function xa(e,t,a){let c=E(t.get("title")),r=ma(t.get("src"),""),o=r!=="";s(e.titleText,c),s(e.captionText,t.get("caption")),o&&(u(e.image,"src",r,a,"src"),u(e.image,"alt",c,a,"alt")),C(e.image,o),e.placeholder.hasAttribute("hidden")!==o&&e.placeholder.toggleAttribute("hidden",o)}var Ta=Object.freeze({name:ve,html:ba,keys:["title","caption","src"],bind:ha,render:xa});function X(){return p(),fa.use({focus:M}),v(Ta)}function ya(e,t={}){return X(),e.blit(f(ve,b({x:100,y:100,w:240,h:210,chrome:!1,title:"Visual Asset",caption:"Architecture diagram preview",src:"",focus:{padding:50,maxZoom:3.5}},t)))}import{blit as Ea}from"cloudcanvas";var me="breadcrumb-bar",S=Object.freeze({ROOT:"cloudcanvas-breadcrumb-card",BACK:"cloudcanvas-breadcrumb-back-btn",PATH:"cloudcanvas-breadcrumb-path",CRUMB:"cloudcanvas-breadcrumb-crumb",SEPARATOR:"cloudcanvas-breadcrumb-separator",CURRENT:"cloudcanvas-breadcrumb-current"}),Qe="navigation:back",et="Dashboard";function fe(e){let t=B(e),a=t!==null&&t.el!==e.el&&Ce(t);return e.emit(Qe,{from:e.el.id}),a}var wa=`<nav class="cloudcanvas-component ${S.ROOT}" aria-label="Breadcrumb"><button class="cloudcanvas-component-btn ${S.BACK}" type="button">⬅ Back</button><div class="${S.PATH}"><button class="${S.CRUMB}" type="button"></button><span class="${S.SEPARATOR}" aria-hidden="true">›</span><span class="${S.CURRENT}" aria-current="page"></span></div></nav>`;function ka(e){let t=e.parent;return t?y(t).title:void 0}function Oa(e,t){let a=Ea(e),c=o=>e.querySelector(`.${o}`),r=c(S.CRUMB);return t(c(S.BACK),"click",()=>fe(a)),t(r,"click",()=>fe(a)),{rootText:i(r),currentText:i(c(S.CURRENT)),parentTitle:ka(a)}}function Aa(e,t){let a=t.get("rootName"),c=t.get("title"),r=c==null||c===""?e.parentTitle||"Focused Scope":c;s(e.rootText,`🏠 ${a??et}`),s(e.currentText,r)}var Sa=Object.freeze({name:me,html:wa,keys:["title","rootName"],bind:Oa,render:Aa});function Z(){return p(),v(Sa)}function Ca(e,t={}){return Z(),e.blit(f(me,b({x:20,y:16,w:260,h:42,chrome:!1,title:"Workspace View",rootName:et},t)))}import{blit as ge}from"cloudcanvas";import{contrastTextFor as Ra}from"cloudcanvas/primitives";var be="chat-message",he="chat-input",d=Object.freeze({ROOT:"cloudcanvas-chat-message-card",AVATAR:"cloudcanvas-chat-avatar",CONTENT:"cloudcanvas-chat-content",META:"cloudcanvas-chat-meta",AUTHOR:"cloudcanvas-chat-author",TIME:"cloudcanvas-chat-time",TEXT:"cloudcanvas-chat-text",REACTIONS:"cloudcanvas-chat-reactions",PILL:"cloudcanvas-chat-reaction-pill",PILL_EMOJI:"cloudcanvas-chat-reaction-emoji",PILL_COUNT:"cloudcanvas-chat-reaction-count",INPUT_BAR:"cloudcanvas-chat-input-bar",INPUT_FIELD:"cloudcanvas-chat-input-field",SEND:"cloudcanvas-chat-send-btn"}),tt="chat:reaction",at="chat:sent",Na=/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,La=20,_a=70,Ia=85;function Pa(e){let t=E(e).trim().split(/\s+/).filter(a=>a.length>0).slice(0,2).map(a=>a[0].toUpperCase()).join("");return t===""?"U":t}function Da(e){let t=E(e).trim();return Na.test(t)?`--cc-chat-avatar-bg:${t};--cc-chat-avatar-text:${Ra(t)};`:""}function ct(e,t){return e&&e.emoji!==void 0&&e.emoji!==null?e.emoji:t}function rt(e,t){let a=y(e).reactions;if(!Array.isArray(a)||!a[t])return!1;let c=a[t],r=Number(c.count)||0,o=c.reacted?{...c,reacted:!1,count:Math.max(0,r-1)}:{...c,reacted:!0,count:r+1};return N(e,"reactions",a.map((n,l)=>l===t?o:n)),e.emit(tt,{reaction:o,messageId:e.el.id}),!0}function Ma(e){let t=e.parent;return t&&!t.el.hasAttribute("data-blit-root")?t:null}function ot(e,t){let a=E(t).trim();if(a==="")return null;let c=Ma(e),r=c?nt(c,{x:La,y:_a+(c.blits.length-1)*Ia,w:360,h:75,author:"You",handle:"@you",text:a,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}):null;return e.emit(at,{text:a,channel:c&&c.el.id||null}),r}var $a=`<article class="cloudcanvas-component cloudcanvas-component-card ${d.ROOT}"><span class="${d.AVATAR}" aria-hidden="true"></span><div class="${d.CONTENT}"><div class="${d.META}"><span class="${d.AUTHOR}"></span><span class="${d.TIME}"></span></div><div class="${d.TEXT}"></div><div class="${d.REACTIONS}"></div></div></article>`;function Ua(){let e=document.createElement("button");e.className=d.PILL,e.setAttribute("type","button"),e.setAttribute("aria-pressed","false");for(let t of[d.PILL_EMOJI,d.PILL_COUNT]){let a=document.createElement("span");a.className=t,i(a),e.appendChild(a)}return e}function Ba(e,t){let a=t&&t.reacted?"true":"false";s(e.firstElementChild.firstChild,t&&t.emoji),s(e.lastElementChild.firstChild,t&&t.count),e.getAttribute("aria-pressed")!==a&&e.setAttribute("aria-pressed",a)}function ja(e,t){let a=ge(e),c=n=>e.querySelector(`.${n}`),r=c(d.REACTIONS);t(r,"click",n=>{let l=j(r,n.target,d.PILL,y(a).reactions,ct);l!==-1&&rt(a,l)});let o=c(d.AVATAR);return{avatar:o,avatarText:i(o),authorText:i(c(d.AUTHOR)),timeText:i(c(d.TIME)),bodyText:i(c(d.TEXT)),reactions:r}}function Ha(e,t,a){let c=E(t.get("author")),r=E(t.get("handle")),o=t.get("reactions");s(e.avatarText,Pa(c)),u(e.avatar,"style",Da(t.get("avatarColor")),a,"avatarStyle"),s(e.authorText,r===""?c:`${c} (${r})`),s(e.timeText,t.get("time")),s(e.bodyText,t.get("text")),P(e.reactions,Array.isArray(o)?o:[],{key:ct,create:Ua,update:Ba})}var Ga=`<form class="cloudcanvas-component cloudcanvas-component-card ${d.INPUT_BAR}"><input class="${d.INPUT_FIELD}" type="text" aria-label="Message" autocomplete="off"><button class="cloudcanvas-component-btn ${d.SEND}" type="submit">Send</button></form>`;function Ya(e,t){let a=ge(e),c=e.querySelector(`.${d.INPUT_BAR}`),r=e.querySelector(`.${d.INPUT_FIELD}`);return t(c,"submit",o=>{o.preventDefault(),ot(a,r.value)&&(r.value="")}),{field:r}}function Fa(e,t,a){u(e.field,"placeholder",E(t.get("placeholder")),a,"placeholder")}var za=Object.freeze({name:be,html:$a,keys:["author","handle","avatarColor","time","text","reactions"],bind:ja,render:Ha}),Va=Object.freeze({name:he,html:Ga,keys:["placeholder"],bind:Ya,render:Fa});function J(){return p(),ge.use({connect:D}),v(za)}function Q(){return p(),v(Va)}function nt(e,t={}){J();let{replyTo:a,...c}=t,r=a?{connect:{connections:[a],strokeWidth:2,dashed:!0}}:{};return e.blit(f(be,b({x:20,y:80,w:360,h:85,chrome:!1,author:"User",handle:"",avatarColor:"",time:"12:00 PM",text:"",reactions:[{emoji:"👍",count:1,reacted:!1},{emoji:"❤️",count:2,reacted:!1}],...r},c)))}function Ka(e,t={}){return Q(),e.blit(f(he,b({x:20,y:420,w:360,h:48,chrome:!1,placeholder:"Type a message... (Press Enter to send)"},t)))}import{blit as Wa}from"cloudcanvas";var xe="calendar-event",x=Object.freeze({ROOT:"cloudcanvas-event-card",HEADER:"cloudcanvas-event-header",TITLE:"cloudcanvas-event-title",BADGE:"cloudcanvas-event-badge",TIME:"cloudcanvas-event-time",ACTIONS:"cloudcanvas-event-actions",BUTTON:"cloudcanvas-event-btn",ACK:"cloudcanvas-event-ack",RESOLVE:"cloudcanvas-event-resolve"}),it=Object.freeze(["critical","high","normal","info"]),lt="alert:acknowledged",dt="alert:resolved",ut="normal";function qa(e){return it.includes(e)?e:ut}function pt(e,t,a,c){L(e,t);let r=E(y(e).title);e.emit("announce",`${r} ${a}`),e.emit(c,{eventId:e.el.id,title:r})}function vt(e){let t=y(e).severity==="critical";pt(e,t?{status:"acknowledged",severity:"high"}:{status:"acknowledged"},"acknowledged",lt)}function ft(e){pt(e,{status:"resolved",severity:"info"},"resolved",dt)}function st(e,t){return`<button class="cloudcanvas-component-btn ${x.BUTTON} ${e}" type="button">${t}</button>`}var Xa=`<div class="cloudcanvas-component cloudcanvas-component-card ${x.ROOT}"><div class="${x.HEADER}"><div class="${x.TITLE}"></div><span class="cloudcanvas-component-chip ${x.BADGE}"></span></div><div class="${x.TIME}"></div><div class="${x.ACTIONS}">${st(x.ACK,"Ack")}${st(x.RESOLVE,"Resolve")}</div></div>`;function Za(e,t){let a=Wa(e),c=o=>e.querySelector(`.${o}`);t(c(x.ACK),"click",()=>vt(a)),t(c(x.RESOLVE),"click",()=>ft(a));let r=c(x.BADGE);return{card:c(x.ROOT),titleText:i(c(x.TITLE)),badge:r,badgeText:i(r),timeText:i(c(x.TIME))}}function Ja(e,t,a){let c=qa(t.get("severity"));s(e.titleText,t.get("title")),s(e.timeText,t.get("time")),s(e.badgeText,t.get("status")),u(e.card,"data-severity",c,a,"severity"),u(e.badge,"data-severity",c,a,"badgeSeverity")}var Qa=Object.freeze({name:xe,html:Xa,keys:["title","time","severity","status"],bind:Za,render:Ja});function ee(){return p(),v(Qa)}function ec(e,t={}){return ee(),e.blit(f(xe,b({x:20,y:80,w:210,h:105,chrome:!1,title:"Event / Alert",time:"10:00 - 11:00 AM",severity:ut,status:"scheduled"},t)))}var mt="cloudcanvas-editable-input",gt="edited",bt=[".cloudcanvas-card-title",".cloudcanvas-sticky-title",".cloudcanvas-task-title",".cloudcanvas-telemetry-title",".cloudcanvas-flow-title",".cloudcanvas-media-title",".cloudcanvas-workspace-title-text"].join(", ");function tc(e,t){for(let a of e.el.querySelectorAll(t))if(a.closest("[data-blit]")===e.el)return a;return null}function ac(e,t,a){N(e,t,a),e.emit(gt,{key:t,value:a})}function cc(e,t,a){let c=document.createElement("input");c.className=mt,c.setAttribute("type","text"),c.setAttribute("aria-label",`Edit ${t}`);let r=y(e)[t];return c.value=r==null?a.textContent:String(r),c}function ht(e,t,a="title"){if(!Oe(e)||ke(e)||!t?.parentNode)return null;let c=t.textContent,r=cc(e,a,t);_(e,r),t.hidden=!0,t.parentNode.insertBefore(r,t.nextSibling),r.focus(),r.select();let o=!0,n=l=>{o&&(o=!1,r.remove(),t.hidden=!1,l&&ac(e,a,r.value.trim()||c),I(e))};return r.addEventListener("keydown",l=>{l.key==="Enter"?(l.preventDefault(),n(!0)):l.key==="Escape"&&(l.stopPropagation(),n(!1))}),r.addEventListener("blur",()=>n(!0)),n}function Te(e,t){let{targetKey:a="title",selector:c=bt}=t&&typeof t=="object"?t:{},r=null,o=n=>{let l=tc(e,c);!l||!l.contains(n.target)||(n.stopPropagation(),r=ht(e,l,a)??r)};return e.el.addEventListener("dblclick",o),()=>{e.el.removeEventListener("dblclick",o),r?.(!1)}}var xt="drag:end",ye="resize:end";function te(e,t){return Math.round(e/t)*t}function Ee(e,t=24){let a=te(e.x,t),c=te(e.y,t);return(a!==e.x||c!==e.y)&&e.set({x:a,y:c}),{x:a,y:c}}function Tt(e,t=24,a=null){let{w:c,h:r}=e.size,o=Number.isFinite(a?.width)?a.width:c,n=Number.isFinite(a?.height)?a.height:r,l=Math.max(t,te(o,t)),O=Math.max(t,te(n,t));(l!==o||O!==n)&&e.set({w:l,h:O});let{x:T,y:yt}=Ee(e,t);return{x:T,y:yt,width:l,height:O}}function we(e,t){let{gridSize:a,enabled:c=!0}=t&&typeof t=="object"?t:{},r=Number(a)>0?Number(a):24,o=n=>{let l=n.detail?.payload;!c||n.target!==e.el||l?.cancelled||(n.type===ye?Tt(e,r,l):Ee(e,r))};return e.el.addEventListener(xt,o),e.el.addEventListener(ye,o),()=>{e.el.removeEventListener(xt,o),e.el.removeEventListener(ye,o)}}var oc=Object.freeze([U,G,F,K,q,X,Z,J,Q,ee]);function $r(){let e=oc.map(t=>t().el.getAttribute("data-type"));return rc.use({editable:Te,snapToGrid:we}),e}export{lt as ACKNOWLEDGED_EVENT,Qe as BACK_EVENT,me as BREADCRUMB_BAR_TYPE,S as BREADCRUMB_CLS,xe as CALENDAR_EVENT_TYPE,d as CHAT_CLS,he as CHAT_INPUT_TYPE,be as CHAT_MESSAGE_TYPE,wt as COMPONENTS_LIGHT_THEME,_e as COMPONENT_DEFAULT_CSS,ae as COMPONENT_STYLE_ID,Et as COMPONENT_TOKENS,bt as DEFAULT_EDITABLE_SELECTOR,mt as EDITABLE_INPUT_CLASS,gt as EDITED_EVENT,x as EVENT_CLS,it as EVENT_SEVERITIES,m as FLOW_CLS,ue as FLOW_NODE_TYPE,V as FLOW_PULSE_EVENT,ve as MEDIA_CARD_TYPE,k as MEDIA_CLS,tt as REACTION_EVENT,dt as RESOLVED_EVENT,at as SENT_EVENT,g as STICKY_CLS,ce as STICKY_NOTE_TYPE,re as STICKY_THEMES,se as TASK_CARD_TYPE,h as TASK_CLS,Me as TASK_PRIORITIES,$e as TASK_UPDATED_EVENT,je as TELEMETRY_ALERT_EVENT,w as TELEMETRY_CLS,le as TELEMETRY_GAUGE_TYPE,zt as TELEMETRY_STATUSES,A as WORKSPACE_CLS,pe as WORKSPACE_GROUP_TYPE,vt as acknowledgeCalendarEvent,ht as beginInlineEdit,De as beginStickyEdit,Ca as createBreadcrumb,ec as createCalendarEvent,Ka as createChatInput,nt as createChatMessage,na as createFlowNode,ya as createMediaCard,Lt as createStickyNote,Ft as createTaskCard,Jt as createTelemetry,va as createWorkspace,Te as editable,$ as endStickyEdit,Xe as focusWorkspace,p as injectComponentStyles,fe as navigateBreadcrumbBack,ze as pulseFlowNode,Z as registerBreadcrumbBar,ee as registerCalendarEvent,Q as registerChatInput,J as registerChatMessage,$r as registerComponents,K as registerFlowNode,X as registerMediaCard,U as registerStickyNote,G as registerTaskCard,F as registerTelemetryGauge,q as registerWorkspaceGroup,ft as resolveCalendarEvent,ot as sendChatMessage,Kt as setTelemetryReading,Tt as snapBox,Ee as snapPosition,we as snapToGrid,H as taskProgressOf,He as telemetryStatusOf,rt as toggleChatReaction,Be as toggleTaskItem,Ve as transmitFlowPulse};
