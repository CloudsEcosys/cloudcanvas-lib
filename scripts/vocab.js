#!/usr/bin/env node
/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The vocabulary gate: the removed engine's words stay removed. Every line of
 * the add-ons, the UI kit, the widgets, `tests` and `scripts` (never
 * `node_modules` or `dist`) is read against `VOCAB_PATTERN`, and each hit is reported as
 * `file:line`. Exit code 1 when anything was found; `npm test` runs it through
 * `tests/unit/vocab.test.js`.
 *
 *   node scripts/vocab.js           one line per hit, then the count
 *   node scripts/vocab.js --json    the hits as JSON
 *
 * The exemptions are whole files, each with its reason: release history, and
 * the 0.4 / v1 formats' own vocabulary where a file must speak it to read them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root, derived from this file's location. */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The removed vocabulary, case-sensitive, whole-token. */
export const VOCAB_PATTERN = /\b[pP]in(s|[A-Z]\w*)?\b|\bpin[A-Z]\w*|particle|cloudcanvas-pin|data-pin-id/;

/** The trees (and root modules) the gate reads, from the root. */
export const SCANNED = Object.freeze([
  'plugins', 'ui', 'archetypes', 'components', 'display', 'forms', 'sandbox', 'tests', 'scripts',
  'index.js', 'defaults.js', 'styles.js', 'coerce.js'
]);

/** Directories never walked. */
const SKIPPED_DIRS = new Set(['node_modules', 'dist', '.git']);

/** These controls use pinning as a product-neutral action, not the retired scene runtime. */
export const DOMAIN_PIN_FILES = new Set([
  'ui/context-actions.js', 'ui/context-window.js', 'ui/css/context.js',
  'tests/unit/ui-context-actions.test.js', 'tests/unit/ui-context-window.test.js',
  'tests/browser/fixtures/ui-kit.html'
]);
const RETIRED_RUNTIME = /\b(?:PinManager|PinTrait|PinRegistry|createCanvasSession|defineComponent|particle)\b|\bnew\s+Pin\b|\bPin\s*\(|\.plugin\/pins\/|cloudcanvas-pin|data-pin-id|\bimport\s*\{[^}]*\bPin\b/;

/** `[root-relative path pattern, reason]`: the files that must keep the old words. */
export const EXEMPT = Object.freeze([
  [/^sandbox\/migrate-v1\.js$/, 'reads the v1 format, whose keys are its own'],
  [/^tests\/fixtures\/sandbox\/[^/]+\.v1\.[a-z]+$/, 'v1 documents and a v1 export, as the v1 engine wrote them'],
  [/^plugins\/panel(-[a-z]+)?\.js$/, "the panel add-on's `pin` control (plans/panel-addon.md): an edge panel's own word, not the removed engine's"],
  [/^tests\/(unit\/addons-panel(-[a-z]+)?|browser\/panel)\.test\.js$/, 'the panel suites press and name the `pin` control'],
  [/^scripts\/vocab\.js$/, 'the gate: it has to spell the pattern'],
  [/^tests\/unit\/vocab\.test\.js$/, "the gate's own test: a probe for each alternative"]
]);

/** Whether a root-relative path is exempt. */
export function isExempt(relative) {
  return EXEMPT.some(([pattern]) => pattern.test(relative));
}

/** Every file under `dir` (or `dir` itself, a file), root-relative with `/` separators, skipping the never-walked directories. */
function filesUnder(dir, out = []) {
  if (fs.statSync(path.join(ROOT, dir)).isFile()) return [dir];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (SKIPPED_DIRS.has(entry.name)) continue;
    const relative = `${dir}/${entry.name}`;
    if (entry.isDirectory()) filesUnder(relative, out);
    else if (entry.isFile()) out.push(relative);
  }
  return out;
}

/** The hits in one text. @returns {Array<{line: number, text: string}>} */
export function scanText(text, pattern = VOCAB_PATTERN) {
  const hits = [];
  text.split('\n').forEach((line, index) => {
    if (pattern.test(line)) hits.push({ line: index + 1, text: line.trim() });
  });
  return hits;
}

export function scanFile(file, text) {
  return scanText(text, DOMAIN_PIN_FILES.has(file) ? RETIRED_RUNTIME : VOCAB_PATTERN);
}

/** Every hit outside the exemptions. @returns {Array<{file: string, line: number, text: string}>} */
export function scan(trees = SCANNED) {
  const hits = [];
  for (const tree of trees) {
    for (const file of filesUnder(tree)) {
      if (isExempt(file)) continue;
      for (const hit of scanFile(file, fs.readFileSync(path.join(ROOT, file), 'utf8'))) hits.push({ file, ...hit });
    }
  }
  return hits;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hits = scan();
  if (process.argv.includes('--json')) process.stdout.write(`${JSON.stringify(hits, null, 2)}\n`);
  else {
    for (const hit of hits) process.stdout.write(`${hit.file}:${hit.line}: ${hit.text}\n`);
    process.stdout.write(`${hits.length} hit(s) of the removed vocabulary\n`);
  }
  process.exit(hits.length > 0 ? 1 : 0);
}
