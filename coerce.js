/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The two content coercions every form and component template shares.
 *
 * A template reads its blit's contents through these, never through `String()`
 * or `Number()` directly, so an absent key and an unparsable value are
 * handled one way across the library: text is the empty string, a number is
 * the template's stated default. One implementation, imported everywhere.
 */

/** A content value as a string; `undefined` and `null` are the empty string. */
export function asText(value) {
  return value === undefined || value === null ? '' : String(value);
}

/** A finite number, or the stated default. */
export function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
