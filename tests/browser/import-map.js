/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The import map every served page gets: the bare specifiers a module may use
 * (`cloudcanvas`, `cloudcanvas/kernel`, ..., `cloudcanvas-lib`, `cloudcanvas-lib/drag`,
 * ...) onto files the harness serves, read from each package's own `exports` so
 * a page resolves exactly what Node and a bundler resolve. The core is served
 * from `/node_modules/cloudcanvas/`, this package from the root.
 *
 * Fixtures carry no map of their own: the harness writes this one into each
 * HTML response's `<head>`, ahead of any module script.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** `{specifier: url}` for one package's module exports (no wildcards, `.js` targets only). */
export function packageImports(manifest, urlBase) {
  const imports = {};
  for (const [key, target] of Object.entries(manifest.exports)) {
    if (key.includes('*') || !target.endsWith('.js')) continue;
    const specifier = key === '.' ? manifest.name : `${manifest.name}/${key.slice(2)}`;
    imports[specifier] = `${urlBase}${target.slice(2)}`;
  }
  return imports;
}

/** The map for a page served from `rootDir`: the installed core, then this package. */
export function importMapFor(rootDir) {
  const read = (file) => JSON.parse(readFileSync(path.join(rootDir, file), 'utf8'));
  return {
    imports: {
      ...packageImports(read('node_modules/cloudcanvas/package.json'), '/node_modules/cloudcanvas/'),
      ...packageImports(read('package.json'), '/')
    }
  };
}

/** `html` with `map` as the first child of its `<head>`. */
export function withImportMap(html, map) {
  const tag = `<script type="importmap">${JSON.stringify(map)}</script>`;
  const at = html.search(/<head[^>]*>/i);
  if (at === -1) return `${tag}\n${html}`;
  const end = html.indexOf('>', at) + 1;
  return `${html.slice(0, end)}\n${tag}${html.slice(end)}`;
}
