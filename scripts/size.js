/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Bundle-size report and regression gate. Nothing is written to `dist/`; each
 * entry is bundled in memory with the same esbuild options `scripts/build.js`
 * ships with, then measured minified and gzip -9.
 *
 Every row bundles the core
 * (`cloudcanvas`, from `node_modules`) it reaches, so a row is what a page pays
 * for that import; the core's own rows are the `cloudcanvas` package's.
 *
 * The fixed rows below, then one row per public entry, each answering a
 * different question:
 *
 *   minimal+drag  the core quick start plus the drag add-on - what one pay-for-use trait costs.
 *   minimal+pan   the quick start plus the pan root add-on, attached by name.
 *   minimal+menu  the quick start plus the menu root add-on, its items by value.
 *   <entry>  each public entry (`./entries.js`: the kit, its groups, the UI
 *            kit, the defaults, the add-on CSS, every add-on) with all its
 *            exports kept - what that import costs on its own, the core code it
 *            reaches included.
 *   +<file>  each file an add-on loads by `import()` only, on its own.
 *
 *   node scripts/size.js            print the table
 *   node scripts/size.js --check    exit 1 if any row grew past the baseline, has
 *                                   no baseline row, or a baseline row is stale
 *   node scripts/size.js --update   rewrite `scripts/size-baseline.json`
 *
 * Single dependency: esbuild, a devDependency.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import * as esbuild from 'esbuild';
import { ROOT, publicEntries } from './entries.js';

const BASELINE = path.join(ROOT, 'scripts/size-baseline.json');

/** Mirrors `scripts/build.js`; minified and held in memory. */
const SHARED = {
  bundle: true,
  format: 'esm',
  minify: true,
  write: false,
  platform: 'browser',
  target: ['es2022'],
  charset: 'utf8',
  logLevel: 'silent'
};

/** The core with one native add-on trait. */
const DRAG_SOURCE = `
import { blit } from 'cloudcanvas';
import { drag } from './plugins/drag.js';
blit.use({ drag });
blit('#app').blit({ x: 100, y: 100, drag: true });
`;

/** The core with the pan root add-on, attached to the root by name. */
const PAN_SOURCE = `
import { blit } from 'cloudcanvas';
import { pan } from './plugins/pan.js';
blit.use({ pan });
blit('#app').set({ pan: true });
`;

/** The core with the menu root add-on, one command by value. */
const MENU_SOURCE = `
import { blit } from 'cloudcanvas';
import { menu } from './plugins/menu.js';
menu(blit('#app'), { items: [{ id: 'hello', label: 'Hello', action: () => {} }] });
`;

/** Files loaded by `import()` only: a row counts what a page loads up front, so these stay out of it and are
 * measured as rows of their own. */
const ON_DEMAND = /* @__PURE__ */ Object.freeze(['./gpu-webgl2.js', './gpu-webgpu.js', './panel-window.js']);

/** Leaves each on-demand file out of a bundle that reaches it. */
const onDemandExternal = {
  name: 'on-demand-external',
  setup(build) {
    build.onResolve({ filter: /^\.\/(gpu-web(gl2|gpu)|panel-window)\.js$/ }, (args) => (
      ON_DEMAND.includes(args.path) && args.kind === 'dynamic-import' ? { path: args.path, external: true } : undefined
    ));
  }
};

/** The rows, in report order: the fixed questions, each public entry (the defaults among them), then the on-demand files. */
const ROWS = [
  { name: 'minimal+drag', stdin: DRAG_SOURCE },
  { name: 'minimal+pan', stdin: PAN_SOURCE },
  { name: 'minimal+menu', stdin: MENU_SOURCE },
  ...publicEntries().map(({ name, file }) => ({ name, entryPoints: [path.join(ROOT, file)] })),
  { name: '+webgl2', entryPoints: [path.join(ROOT, 'plugins/gpu-webgl2.js')] },
  { name: '+webgpu', entryPoints: [path.join(ROOT, 'plugins/gpu-webgpu.js')] },
  { name: '+panel-window', entryPoints: [path.join(ROOT, 'plugins/panel-window.js')] }
];

async function measureRow(row) {
  const options = row.stdin
    ? { stdin: { contents: row.stdin, resolveDir: ROOT, loader: 'js' } }
    : { entryPoints: row.entryPoints };

  const result = await esbuild.build({ ...SHARED, ...options, plugins: [onDemandExternal] });
  const bytes = result.outputFiles[0].contents;

  return {
    name: row.name,
    min: bytes.length,
    gzip: zlib.gzipSync(bytes, { level: 9 }).length
  };
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function printTable(rows) {
  console.log(`\nCloudCanvas lib size - esbuild ${esbuild.version}`);
  console.log(`${'entry'.padEnd(14)}${'min'.padStart(12)}${'gzip'.padStart(12)}`);
  for (const row of rows) {
    console.log(`${row.name.padEnd(14)}${kib(row.min).padStart(12)}${kib(row.gzip).padStart(12)}`);
  }
}

function readBaseline() {
  if (!fs.existsSync(BASELINE)) {
    throw new Error(`No baseline at ${path.relative(ROOT, BASELINE)}; run with --update first`);
  }
  return JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
}

function writeBaseline(rows) {
  const baseline = Object.fromEntries(rows.map(({ name, min, gzip }) => [name, { min, gzip }]));
  fs.writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`\nBaseline written to ${path.relative(ROOT, BASELINE)}`);
}

/**
 * One line per problem; an empty list is a pass. A row grew past its baseline,
 * a row has no baseline (a new entry is ratcheted with `--update`, never waved
 * through), or a baseline row names an entry no longer measured (stale).
 * @param {Array<{name: string, min: number, gzip: number}>} rows
 * @param {Record<string, {min: number, gzip: number}>} baseline
 * @returns {string[]}
 */
export function sizeProblems(rows, baseline) {
  const problems = [];
  for (const row of rows) {
    const base = baseline[row.name];
    if (!base) {
      problems.push(`${row.name}: no baseline row`);
      continue;
    }
    for (const metric of ['min', 'gzip']) {
      if (row[metric] > base[metric]) {
        problems.push(`${row.name} ${metric}: ${base[metric]} -> ${row[metric]} (+${row[metric] - base[metric]} B)`);
      }
    }
  }
  const measured = new Set(rows.map(({ name }) => name));
  for (const name of Object.keys(baseline).filter((key) => !measured.has(key))) {
    problems.push(`${name}: stale baseline row (no such entry)`);
  }
  return problems;
}

function check(rows) {
  const problems = sizeProblems(rows, readBaseline());
  if (problems.length === 0) {
    console.log('\nSize check passed: no row grew; the baseline names every entry and no other.');
    return;
  }
  console.error(`\nSize check failed:\n  ${problems.join('\n  ')}`);
  console.error('Intentional? Re-run with --update.');
  process.exitCode = 1;
}

async function main() {
  const flag = process.argv[2];
  const rows = [];
  for (const row of ROWS) rows.push(await measureRow(row));

  printTable(rows);
  if (flag === '--check') check(rows);
  else if (flag === '--update') writeBaseline(rows);
  else if (flag !== undefined) throw new Error(`Unknown flag ${flag}; expected --check or --update`);
}

/** esbuild's own messages when it has them, else the error's. */
function reportFailure(error) {
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    console.error(esbuild.formatMessagesSync(error.errors, { kind: 'error', color: true }).join('\n'));
  } else {
    console.error(error.message ?? error);
  }
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(reportFailure);
