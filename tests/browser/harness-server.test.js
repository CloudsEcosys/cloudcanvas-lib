/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The harness's static server under a failing read: a file it can stat but not
 * open answers 500 instead of an unhandled stream error, and the server keeps
 * answering afterwards. Needs no browser.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startStaticServer } from './harness.js';

/** A hung response is a failure, not a stalled suite. */
const get = (url) => fetch(url, { signal: AbortSignal.timeout(5000) });

let root;
let server;

before(async () => {
  root = mkdtempSync(path.join(os.tmpdir(), 'cc-harness-'));
  writeFileSync(path.join(root, 'ok.js'), 'export {};\n');
  for (const name of ['locked.js', 'locked.html']) {
    writeFileSync(path.join(root, name), 'unreadable\n');
    chmodSync(path.join(root, name), 0o000);
  }
  server = await startStaticServer(root);
});

after(async () => {
  await server?.close();
  rmSync(root, { recursive: true, force: true });
});

test('harness server - an unreadable file answers 500 and the server stays up', { skip: process.getuid?.() === 0 && 'root reads any file' }, async () => {
  for (const name of ['locked.js', 'locked.html']) {
    const response = await get(`${server.url}/${name}`);
    assert.equal(response.status, 500, name);
    await response.arrayBuffer();
  }
  const response = await get(`${server.url}/ok.js`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'export {};\n');
});
