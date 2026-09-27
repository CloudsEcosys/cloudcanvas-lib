/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The archetypes' sheet: the section and the table, by class, on core tokens
 * only - every value a `var()` read whose fallback is the core's dark default,
 * so a theme that restyles the canvas restyles these with it.
 */

/** Id of the single archetype stylesheet element. */
export const ARCHETYPE_STYLE_ID = 'cloudcanvas-archetype-styles';

/** The section and table rules. */
export const ARCHETYPE_CSS = `
.cloudcanvas-section {
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-2, 8px);
  min-width: 280px;
}
.cloudcanvas-section-title {
  margin: 0;
  padding-bottom: var(--cc-space-1, 4px);
  border-bottom: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-lg, 15px);
  font-weight: var(--cc-weight-semibold, 600);
}
.cloudcanvas-section-body {
  position: relative;
  min-height: var(--cc-scope-min-height, 40px);
}
.cloudcanvas-table {
  border-collapse: collapse;
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-sm, 12px);
}
.cloudcanvas-table-caption {
  padding-bottom: var(--cc-space-1, 4px);
  color: var(--cc-text-muted, #94a3b8);
  text-align: left;
}
.cloudcanvas-table th,
.cloudcanvas-table td {
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border-bottom: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  text-align: left;
}
.cloudcanvas-table th {
  font-weight: var(--cc-weight-semibold, 600);
}
`;

/** Put the sheet in the document once; an existing element is returned untouched. @returns {HTMLStyleElement|null} */
export function injectArchetypeStyles() {
  if (typeof document === 'undefined') return null;
  const existing = document.getElementById(ARCHETYPE_STYLE_ID);
  if (existing) return existing;
  const style = document.createElement('style');
  style.id = ARCHETYPE_STYLE_ID;
  style.textContent = ARCHETYPE_CSS;
  document.head.appendChild(style);
  return style;
}
