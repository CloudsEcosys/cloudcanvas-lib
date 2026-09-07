/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The component stylesheet, third of three: the communication widgets
 * (breadcrumb bar, chat message and composer, calendar event) and the two
 * environment queries that close the sheet.
 *
 * The discipline and the token groups are stated in `./styles-cards-css.js`,
 * the third that opens the sheet. The environment queries live here because a
 * media block has to come last to win: `@media (pointer: coarse)` raises every
 * control in all three thirds to 44px, and `@media (prefers-reduced-motion:
 * reduce)` stands the animations down.
 */

/** Communication-widget rules, plus the closing environment queries. */
export const COMPONENTS_COMMS_CSS = `
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
`;
