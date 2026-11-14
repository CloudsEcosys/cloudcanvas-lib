/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Release-time bundler: the lib's single-file artifacts and every public entry
 * split into `dist/esm/` - one file per entry, shared chunks. The core package
 * (`cloudcanvas`, `cloudcanvas/*`) stays external everywhere except the board
 * runtime, which a static export loads alone.
 *
 *   node scripts/build.js            rebuild `dist/` and print the size report
 *   node scripts/build.js --check    rebuild in memory; exit 1 if `dist/` differs
 *
 * Every artifact is built in memory first and written to a staging directory
 * beside `dist/`, which is then swapped in whole: a build that fails leaves the
 * committed `dist/` as it was, and a file the build no longer makes is gone.
 * `--check` names any file under `dist/` that differs, is missing or is not built.
 *
 * `dist/` is committed and load-bearing: the browser suites fetch the board
 * runtime over http and the sandbox's static export embeds it, so a stale dist
 * is a real defect and `--check` is the gate that catches one. The unit suites
 * import the source directly and never see it. It exists for consumers the
 * source tree cannot serve:
 *
 *   - `cloudcanvas-lib.esm.js`   the kit (`.`) as one module, core external.
 *   - `cloudcanvas-ui.esm.js`    the UI kit (`./ui`) as one module, core external.
 *   - `cloudcanvas.board.iife.js` the board runtime an exported static site loads
 *                           from `file://`, self-contained (core included): a plain
 *                           non-module `<script src>` is the *only* form that
 *                           loads from a `file://` URL, because Chromium fetches
 *                           module scripts in CORS mode.
 *   - `esm/<entry>.js`      each public entry (`./entries.js`) as its own
 *                           minified module, their shared code in
 *                           `esm/chunk-*.js`, the core imported by specifier:
 *                           pay-for-use over http(s) with one import map and one
 *                           copy of the core however many add-ons a page imports.
 *
 * A Node script rather than a package.json one-liner: related outputs
 * share one config, and the size report below is the only place raw/gzip
 * numbers are measured rather than guessed.
 *
 * Single dependency: esbuild, a devDependency.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { CORE_EXTERNAL, ROOT, publicEntries, readManifest } from './entries.js';

/** The output directory, relative to the root. */
const DIST_DIR = 'dist';

const OUT_DIR = path.join(ROOT, DIST_DIR);

/** The split output's directory, relative to the root. */
const ESM_DIR = 'dist/esm';

const pkg = readManifest();

/**
 * Survives minification (`legalComments: 'inline'` would move it; a banner is
 * emitted verbatim ahead of everything either way).
 */
const BANNER = [
  '/*!',
  ` * CloudCanvas lib v${pkg.version} - ${pkg.description}`,
  ' * Written by Richard Christopher, Copyright 2026 NeoTec, LLC',
  ` * ${pkg.license} License. ${pkg.homepage}`,
  ' */'
].join('\n');

/**
 * Baseline shared by every artifact.
 *
 * `target` is the floor the framework already assumes - private class fields,
 * `structuredClone`-era DOM, top-level `??=` - so esbuild transpiles nothing it
 * does not have to and the ESM output stays close to the source it came from.
 */
const SHARED = {
  absWorkingDir: ROOT,
  bundle: true,
  platform: 'browser',
  target: ['es2022'],
  charset: 'utf8',
  banner: { js: BANNER },
  logLevel: 'silent',
  metafile: true
};

/** The single-file artifacts, in report order. */
const TARGETS = [
  { outfile: 'dist/cloudcanvas-lib.esm.js', entry: 'index.js', format: 'esm', minify: false, external: CORE_EXTERNAL },
  { outfile: 'dist/cloudcanvas-ui.esm.js', entry: 'ui/index.js', format: 'esm', minify: false, external: CORE_EXTERNAL },
  // The board runtime an exported static site loads from file:// (`sandbox/export-static.js`): core included.
  {
    outfile: 'dist/cloudcanvas.board.iife.js',
    entry: 'sandbox/runtime.js',
    format: 'iife',
    globalName: 'CloudCanvas',
    minify: true
  }
];

/** esbuild messages are reported, never swallowed - a clean build says so. */
function reportMessages(label, messages, kind) {
  if (messages.length === 0) return;
  console.log(`\n${label}: ${messages.length} ${kind}(s)`);
  console.log(esbuild.formatMessagesSync(messages, { kind, color: false }).join('\n'));
}

/**
 * Bundle one artifact, in memory: the caller writes it, or compares it with the
 * committed file, so `--check` sees the same bytes a build would.
 * @returns {Promise<{outfile: string, bytes: Uint8Array, modules: number}>}
 */
async function buildTarget(target) {
  const { outfile, entry, ...options } = target;
  const result = await esbuild.build({
    ...SHARED,
    ...options,
    entryPoints: [path.join(ROOT, entry)],
    write: false,
    outfile: path.join(ROOT, outfile)
  });

  reportMessages(outfile, result.warnings, 'warning');

  const output = Object.values(result.metafile.outputs)[0];
  return { outfile, bytes: result.outputFiles[0].contents, modules: Object.keys(output.inputs).length };
}

/**
 * Split every public entry into `dist/esm/`, minified, shared code in
 * content-hashed chunks, the core external. Always built in memory: the caller writes
 * the files, or compares them, so `--check` sees the same bytes a build would.
 * @returns {Promise<Array<{outfile: string, bytes: Uint8Array, modules: number}>>}
 */
async function buildSplit() {
  const entries = publicEntries(pkg);
  const entryPoints = Object.fromEntries(entries.map(({ name, file }) => [name, path.join(ROOT, file)]));
  const result = await esbuild.build({
    ...SHARED,
    entryPoints,
    format: 'esm',
    minify: true,
    splitting: true,
    external: CORE_EXTERNAL,
    outdir: path.join(ROOT, ESM_DIR),
    write: false
  });

  reportMessages(ESM_DIR, result.warnings, 'warning');

  const built = result.outputFiles.map(({ path: absolute, contents }) => {
    const outfile = path.relative(ROOT, absolute);
    const output = result.metafile.outputs[outfile];
    return { outfile, bytes: contents, modules: Object.keys(output.inputs).length };
  });
  return built.sort(byEntryThenChunk(entries.map(({ name }) => `${ESM_DIR}/${name}.js`)));
}

/** Report order: the entries as `exports` lists them, then the chunks by name. */
function byEntryThenChunk(entryFiles) {
  const rank = (outfile) => {
    const index = entryFiles.indexOf(outfile);
    return index === -1 ? entryFiles.length : index;
  };
  return (a, b) => rank(a.outfile) - rank(b.outfile) || a.outfile.localeCompare(b.outfile);
}

/**
 * Make `outDir` hold exactly `built` (each `outfile` relative to `root`): write
 * them into a staging directory beside it, then swap that in. A failure while
 * writing leaves `outDir` untouched and removes the staging directory.
 * @param {string} outDir absolute
 * @param {Array<{outfile: string, bytes: Uint8Array}>} built
 */
export function replaceDir(outDir, built, root = ROOT) {
  const staging = fs.mkdtempSync(`${outDir}.staging-`);
  try {
    for (const { outfile, bytes } of built) {
      const target = path.join(staging, path.relative(outDir, path.join(root, outfile)));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes);
    }
  } catch (error) {
    fs.rmSync(staging, { recursive: true, force: true });
    throw error;
  }
  swapIn(staging, outDir);
}

/** Rename `staging` to `outDir`, retiring the old one; restore it if the rename fails. */
function swapIn(staging, outDir) {
  const retired = `${outDir}.retired-${process.pid}`;
  const hadOld = fs.existsSync(outDir);
  if (hadOld) fs.renameSync(outDir, retired);
  try {
    fs.renameSync(staging, outDir);
  } catch (error) {
    if (hadOld) fs.renameSync(retired, outDir);
    fs.rmSync(staging, { recursive: true, force: true });
    throw error;
  }
  fs.rmSync(retired, { recursive: true, force: true });
}

/** Every file under `dir` (relative to `root`), recursively; none when it is absent. */
function filesUnder(dir, root) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)));
}

/** Raw, gzip and (informational) module count for one artifact. */
function measure({ outfile, bytes, modules }) {
  return {
    outfile,
    raw: bytes.length,
    gzip: zlib.gzipSync(bytes, { level: 9 }).length,
    modules
  };
}

/**
 * Any file under `dist/` the build no longer makes (a chunk whose hash moved, a
 * renamed artifact), then each artifact whose committed bytes differ from a
 * fresh build or are missing; empty is a pass.
 * @param {Array<{outfile: string, bytes: Uint8Array}>} built
 * @returns {string[]}
 */
export function findStale(built, root = ROOT) {
  const expected = new Set(built.map(({ outfile }) => outfile));
  const stale = filesUnder(DIST_DIR, root).filter((file) => !expected.has(file)).map((file) => `${file}: not built`);
  for (const { outfile, bytes } of built) {
    const committed = path.join(root, outfile);
    if (!fs.existsSync(committed)) {
      stale.push(`${outfile}: missing`);
      continue;
    }
    if (!fs.readFileSync(committed).equals(Buffer.from(bytes))) stale.push(`${outfile}: differs`);
  }
  return stale;
}

function check(built) {
  const stale = findStale(built);
  if (stale.length === 0) {
    console.log('\nDist check passed: dist/ matches the source.');
    return;
  }
  console.error(`\nDist check failed:\n  ${stale.join('\n  ')}`);
  console.error('Run `npm run build:dist` and commit dist/.');
  process.exitCode = 1;
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function printReport(rows) {
  console.log(`\nCloudCanvas lib v${pkg.version} - esbuild ${esbuild.version}`);
  console.log(`${'artifact'.padEnd(30)}${'raw'.padStart(12)}${'gzip'.padStart(12)}   modules`);

  for (const row of rows) {
    const name = path.relative(OUT_DIR, path.join(ROOT, row.outfile)).padEnd(30);
    console.log(`${name}${kib(row.raw).padStart(12)}${kib(row.gzip).padStart(12)}   ${row.modules}`);
  }
}

async function main() {
  const flag = process.argv[2];
  if (flag !== undefined && flag !== '--check') throw new Error(`Unknown flag ${flag}; expected --check`);

  const built = [];
  for (const target of TARGETS) built.push(await buildTarget(target));
  built.push(...(await buildSplit()));

  if (flag !== '--check') replaceDir(OUT_DIR, built);
  printReport(built.map(measure));
  if (flag === '--check') check(built);
}

/** esbuild's own messages when it has them, else the error. */
function reportFailure(error) {
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    console.error(esbuild.formatMessagesSync(error.errors, { kind: 'error', color: true }).join('\n'));
  } else {
    console.error(error);
  }
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(reportFailure);
