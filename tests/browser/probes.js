/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * In-page probes shared by the browser suites.
 *
 * Everything here is a function *serialized into the page*, so it may close over
 * nothing and import nothing - which is exactly why it lives in its own module
 * rather than being copied into each suite that needs it. `smoke.test.js` and
 * `acceptance.test.js` both measure badge contrast; there is one implementation
 * of that measurement, and it is this one.
 */
import assert from 'node:assert/strict';

/** WCAG AA floor for normal-size text. */
export const AA_CONTRAST = 4.5;

/** Selector for the badges the design-system sweeps measure. */
export const BADGE_SELECTOR = '.cloudcanvas-primitive-badge';

/** Selector for the focus reticle's caption, drawn into the cursor overlay. */
export const RETICLE_LABEL_SELECTOR = '.cloudcanvas-focus-cursor-label';

/**
 * Measure every element matching `selector` against the backdrop it is actually
 * painted on.
 *
 * Computed styles report an element's own translucent fill, not what a reader
 * sees, so the ancestor chain is composited down to the first opaque colour -
 * the only way to test the real rendered contrast rather than the intended one.
 * SVG text paints through `fill` rather than `color`; both are read here so one
 * measurement serves the HTML badges and the overlay's reticle caption alike.
 *
 * Serialized into the page, so it closes over nothing: the selector arrives as
 * an argument, which is the whole reason there is one of these and not three.
 *
 * @param {string} selector
 * @returns {Array<{text: string, color: string, ratio: number}>}
 */
export const READ_CONTRAST = (selector) => {
  const parse = (value) => {
    const match = /rgba?\(([^)]+)\)/.exec(value || '');
    if (!match) return null;
    const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };

  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1
  });

  const luminance = ({ r, g, b }) => {
    const channel = (value) => {
      const c = value / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };

  const backdropOf = (element) => {
    const stack = [];
    for (let node = element; node; node = node.parentElement) {
      const color = parse(getComputedStyle(node).backgroundColor);
      if (!color || color.a === 0) continue;
      stack.push(color);
      if (color.a === 1) break;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let index = stack.length - 1; index >= 0; index -= 1) base = over(stack[index], base);
    return base;
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';

  return Array.from(document.querySelectorAll(selector)).map((node) => {
    const style = getComputedStyle(node);
    const paint = node.namespaceURI === SVG_NS ? style.fill : style.color;
    const surface = backdropOf(node);
    const text = over(parse(paint), surface);
    const lighter = Math.max(luminance(text), luminance(surface));
    const darker = Math.min(luminance(text), luminance(surface));
    return {
      text: node.textContent.trim(),
      color: paint,
      ratio: (lighter + 0.05) / (darker + 0.05)
    };
  });
};

/**
 * Assert a whole page of readings clears AA, naming the worst offender.
 *
 * @param {Array<{text: string, color: string, ratio: number}>} readings
 * @param {string} where which theme / page the reading was taken on
 * @param {number} least how many elements the sweep must have found
 */
export function assertContrast(readings, where, least = 5) {
  assert.ok(readings.length >= least, `${where}: expected >= ${least} readings, saw ${readings.length}`);
  for (const reading of readings) {
    assert.ok(
      reading.ratio >= AA_CONTRAST,
      `${where}: "${reading.text}" is ${reading.ratio.toFixed(2)}:1 in ${reading.color}`
    );
  }
}
