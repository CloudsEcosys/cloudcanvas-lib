/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel's window module loads by `import()` only: in the split build it is a chunk of its own that no static
 * chunk carries, and a bundle of `cloudcanvas/panel` that leaves on-demand files out (as `scripts/size.js` measures
 * a row) carries none of it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { ROOT } from '../../scripts/entries.js';

/** A string only the window module holds: the stylesheets it copies into a window. */
const MARKER = 'link[rel~="stylesheet"], style';

test('panel window - one chunk of dist/esm of its own, in no static chunk or entry', () => {
  const esm = path.join(ROOT, 'dist/esm');
  const files = fs.readdirSync(esm).filter((file) => file.endsWith('.js'));
  const holders = files.filter((file) => fs.readFileSync(path.join(esm, file), 'utf8').includes(MARKER));
  assert.equal(holders.length, 1, `held by ${holders.join(', ') || 'nothing'}`);
  assert.match(holders[0], /^panel-window-[A-Z0-9]+\.js$/);
  const loaders = files.filter((file) => /import\(["']\.\/panel-window-/.test(fs.readFileSync(path.join(esm, file), 'utf8')));
  assert.ok(loaders.length > 0, 'nothing loads it by import()');
});

test('panel window - the panel bundled with on-demand files left out carries none of it', async () => {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, 'plugins/panel.js')],
    bundle: true,
    format: 'esm',
    write: false,
    platform: 'browser',
    logLevel: 'silent',
    plugins: [{
      name: 'on-demand',
      setup(build) {
        build.onResolve({ filter: /^\.\/panel-window\.js$/ }, (args) => (args.kind === 'dynamic-import' ? { path: args.path, external: true } : undefined));
      }
    }]
  });
  const text = new TextDecoder().decode(result.outputFiles[0].contents);
  assert.ok(text.includes('./panel-window.js'), 'the panel does not import the window module');
  assert.equal(text.includes(MARKER), false, 'the window module was bundled statically');
});
