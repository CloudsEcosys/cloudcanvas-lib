/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The words on the band a span is drawn as - the calendar's range, the
 * timeline's span - are the page's text colour, not a bar's: the band is a
 * wash of the accent over the page, and a bar's text colour is for the
 * accent fill a bar has. Held for the kit's own two themes here; the browser
 * suite reads it again on a host's (`tests/browser/ui-ghost.test.js`).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, colour, contrast, declared, over, pageOf, resolve } from './ui-sheet.js';

/*
 * Seen to fail on the sheet of `2617e8f`, whose band took `--cc-ui-bar-text` for its words:
 *
 *   ✖ ghost: the band's words are the page's text colour, 4.5:1 or more on the band, in both themes
 *     AssertionError [ERR_ASSERTION]: .cloudcanvas-ui-calendar-draft reads in --cc-text
 *       'var(--cc-ui-bar-text, var(--cc-text, #e2e8f0))' !== 'var(--cc-text, #e2e8f0)'
 *
 * K8: the timeline's dates are no longer the band's own text but a tag hung below it (`-draft-words`, on the sheet's surface, so they are
 * read against that and not against the wash of the band; the calendar's are still the band's). Run on the sheet of `8f8720e`, which had no tag:
 *
 *   ✖ ghost: the band's words are the page's text colour, 4.5:1 or more on the band, in both themes
 *     AssertionError [ERR_ASSERTION]: the sheet declares no color for .cloudcanvas-ui-timeline-draft-words
 */
test('ghost: the band\'s words are the page\'s text colour, 4.5:1 or more on the band, in both themes', () => {
  for (const part of ['.cloudcanvas-ui-calendar-draft', '.cloudcanvas-ui-timeline-draft-words']) {
    assert.equal(declared(part, 'color'), 'var(--cc-text, #e2e8f0)', `${part} reads in --cc-text`);
    for (const [name, theme] of Object.entries(THEMES)) {
      const band = over(colour(resolve(declared(part, 'background'), theme)), pageOf(theme));
      const words = colour(resolve(declared(part, 'color'), theme)).slice(0, 3);
      assert.ok(contrast(words, band) >= 4.5, `${part}, ${name}: ${contrast(words, band).toFixed(1)}:1`);
    }
  }
});
