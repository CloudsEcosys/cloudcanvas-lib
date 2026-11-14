#!/usr/bin/env node
/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The GPU benchmark: the synchronous CPU cost of a frame with `count` sprites on the `gpu` port (both tiers)
 * against the same boxes on the default DOM port - the first frame, a camera pan, one blit moved, every blit
 * moved - each the median of seven runs, in milliseconds. GPU time is the driver's and not counted.
 *
 *   node scripts/bench-gpu.js            10000 sprites
 *   node scripts/bench-gpu.js 50000
 */
import { GPU_ARGS, loadChromium, startStaticServer } from '../tests/browser/harness.js';

/** One benchmark page: `query` selects the tier, the count and the port. */
export async function benchmark(browser, url, query) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`${url}/tests/browser/fixtures/gpu-bench.html?${query}`);
  const result = await page.evaluate(() => window.__bench);
  await page.close();
  return result;
}

async function main() {
  const count = Number(process.argv[2]) || 10000;
  const chromium = await loadChromium();
  if (!chromium) throw new Error('playwright is not installed');
  const server = await startStaticServer();
  const browser = await chromium.launch({ args: [...GPU_ARGS] });
  const rows = [];
  for (const [label, query] of [
    ['gpu webgpu', `backend=webgpu&count=${count}`],
    ['gpu webgl2', `backend=webgl2&count=${count}`],
    ['dom', `port=dom&count=${count}`]
  ]) rows.push([label, await benchmark(browser, server.url, query)]);
  await browser.close();
  await server.close();

  const ms = (value) => (typeof value === 'number' ? value.toFixed(2).padStart(9) : String(value).padStart(9));
  console.log(`\nCloudCanvas GPU benchmark - ${count} sprites, CPU ms per frame (median of 7)`);
  console.log(`${'port'.padEnd(12)}${'build'.padStart(9)}${'first'.padStart(9)}${'pan'.padStart(9)}${'move 1'.padStart(9)}${'move all'.padStart(9)}`);
  for (const [label, r] of rows) {
    if (r.error) console.log(`${label.padEnd(12)}${r.error}`);
    else console.log(`${label.padEnd(12)}${ms(r.build)}${ms(r.first)}${ms(r.pan)}${ms(r.one)}${ms(r.all)}`);
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
