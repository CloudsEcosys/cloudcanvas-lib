/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Browser acceptance suite for the multi-window dashboard board
 * (`fixtures/dashboard.html`) and the component board (`fixtures/board.html`):
 * 1. Window promotion into a card's branch, and the breadcrumb's Back out
 * 2. Messenger chat reactions, and the live composer adding a message
 * 3. Incident operations alerts (Ack, Resolve)
 * 4. Flow pipeline pulse propagation along the connect add-on's wires
 * 5. Component board checks (in-place sticky note editing, connector wires)
 */

import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  frames,
  loadChromium,
  openBootedPage,
  openPage,
  startStaticServer
} from './harness.js';

const chromium = await loadChromium();

if (!chromium) {
  test('dashboard browser suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  test('Dashboard - a window is promoted, and its breadcrumb Back returns to the whole board', async () => {
    const { page, errors } = await openPage(ctx.browser, ctx.server.url);
    try {
      await frames(page, 500);
      assert.equal(await page.evaluate(() => window.cloudcanvas.root === window.cloudcanvas), true, 'the board did not start at its root');

      await page.click('#btn-focus-chat');
      await frames(page, 700);

      const promoted = await page.evaluate(() => ({
        root: window.cloudcanvas.root.el.id,
        siblingsHidden: ['card_parent_scope', 'window_calendar', 'window_flow'].every((id) => document.getElementById(id).hidden),
        scale: window.fixture.camera.scale
      }));
      assert.deepEqual({ root: promoted.root, siblingsHidden: promoted.siblingsHidden }, { root: 'window_chat', siblingsHidden: true });
      assert.ok(promoted.scale > 1, 'the camera did not frame the window');

      // Inside the window, the breadcrumb names where the board came from and where it is.
      const breadcrumbText = await page.textContent('#crumb_chat .cloudcanvas-breadcrumb-path');
      assert.ok(breadcrumbText.includes('Dashboard'), 'breadcrumb contains root Dashboard');
      assert.ok(breadcrumbText.includes('#engineering-lounge'), 'breadcrumb contains window title');

      await page.click('#crumb_chat .cloudcanvas-breadcrumb-back-btn');
      await frames(page, 600);

      const popped = await page.evaluate(() => ({
        atRoot: window.cloudcanvas.root === window.cloudcanvas,
        hidden: document.querySelectorAll('#canvas-container [data-blit][hidden]').length
      }));
      assert.deepEqual(popped, { atRoot: true, hidden: 0 }, 'Back did not return to the whole board');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('Messenger App - emoji reactions toggle and change the count', async () => {
    const { page, errors } = await openPage(ctx.browser, ctx.server.url);
    try {
      await frames(page, 500);
      await page.click('#btn-focus-chat');
      await frames(page, 600);

      const pill = page.locator('#msg_deploy .cloudcanvas-chat-reaction-pill').first();
      const textBefore = (await pill.textContent()).trim();
      assert.ok(textBefore.includes('🚀'), 'first pill has rocket emoji');

      await pill.click();
      await frames(page, 200);

      const textAfter = (await pill.textContent()).trim();
      assert.notEqual(textBefore, textAfter, 'reaction count toggled');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('Messenger App - the live composer adds a new chat message blit to the channel', async () => {
    const { page, errors } = await openPage(ctx.browser, ctx.server.url);
    try {
      await frames(page, 500);
      await page.click('#btn-focus-chat');
      await frames(page, 600);

      const count = () => page.evaluate(() => document.querySelectorAll('#window_chat .cloudcanvas-chat-message-card').length);
      const countBefore = await count();

      await page.locator('#input_chat .cloudcanvas-chat-input-field').fill('Live deployment smoke test verified!');
      await page.click('#input_chat .cloudcanvas-chat-send-btn');
      await frames(page, 400);

      assert.equal(await count(), countBefore + 1, 'no new message blit was added inside the chat window');
      const lastMessage = await page.evaluate(() => {
        const texts = document.querySelectorAll('#window_chat .cloudcanvas-chat-text');
        const last = texts[texts.length - 1];
        return { text: last?.textContent, owner: last?.closest('[data-blit]').parentElement.closest('[data-blit]').id };
      });
      assert.deepEqual(lastMessage, { text: 'Live deployment smoke test verified!', owner: 'window_chat' });
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('Incident Operations - Ack and Resolve buttons update severity and status', async () => {
    const { page, errors } = await openPage(ctx.browser, ctx.server.url);
    try {
      await frames(page, 500);
      await page.click('#btn-focus-cal');
      await frames(page, 600);

      const contents = () => page.evaluate(() => window.cloudcanvas.find('event_db_spike').spec.calendarEvent);
      const card = page.locator('#event_db_spike .cloudcanvas-event-card');
      assert.equal(await card.getAttribute('data-severity'), 'critical', 'incident starts with critical severity');

      // A real <button>, so the drag add-on stands down on it.
      await page.click('#event_db_spike .cloudcanvas-event-ack');
      await frames(page, 300);
      assert.equal((await contents()).status, 'acknowledged');

      await page.click('#event_db_spike .cloudcanvas-event-resolve');
      await frames(page, 300);
      const resolved = await contents();
      assert.deepEqual({ status: resolved.status, severity: resolved.severity }, { status: 'resolved', severity: 'info' });
      assert.equal(await card.getAttribute('data-severity'), 'info', 'the card never repainted the new severity');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('Pipeline Flow - Transmit pulse reaches the connected downstream node', async () => {
    const { page, errors } = await openPage(ctx.browser, ctx.server.url);
    try {
      await frames(page, 500);
      await page.click('#btn-focus-flow');
      await frames(page, 600);

      const wired = await page.evaluate(() => window.cloudcanvas.find('node_ingest').spec.connect.connections);
      assert.deepEqual(wired, ['node_filter'], 'node_ingest is wired to node_filter');

      await page.click('#node_ingest .cloudcanvas-flow-action-btn');
      await frames(page, 80);

      // The downstream node flashes: the `is-pulsing` state class the sheet animates.
      const filterPulsing = await page.evaluate(() => {
        const card = document.querySelector('#node_filter .cloudcanvas-flow-node');
        return card ? card.classList.contains('is-pulsing') : false;
      });
      assert.equal(filterPulsing, true, 'node_filter never received the pulse');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('Component board - a sticky note edits in place under the edit lock, and connectors are drawn', async () => {
    const { page, errors } = await openBootedPage(ctx.browser, {
      pageOptions: { viewport: { width: 1280, height: 800 } },
      boot: async (fresh) => {
        await fresh.goto(`${ctx.server.url}/tests/browser/fixtures/board.html`, { waitUntil: 'load' });
        await fresh.waitForFunction(() => Boolean(window.cloudcanvas), null, { timeout: 10000 });
      }
    });
    try {
      await frames(page, 500);

      await page.locator('#sticky_roadmap .cloudcanvas-sticky-body').dispatchEvent('dblclick');
      await frames(page, 200);

      // The editor is built once and hidden; double-click reveals it and takes
      // the edit lock, so visibility - not existence - is the state to check.
      const editing = await page.evaluate(() => {
        const textarea = document.querySelector('#sticky_roadmap textarea.cloudcanvas-sticky-editor');
        return Boolean(textarea) && !textarea.hidden && document.getElementById('sticky_roadmap').hasAttribute('data-editing');
      });
      assert.equal(editing, true, 'double clicking did not reveal the editor under the edit lock');

      const textarea = page.locator('#sticky_roadmap textarea.cloudcanvas-sticky-editor');
      await textarea.fill('Updated note via inline editing!');
      await textarea.blur();
      await frames(page, 200);

      const committed = await page.evaluate(() => ({
        body: window.cloudcanvas.find('sticky_roadmap').spec.stickyNote.body,
        rendered: document.querySelector('#sticky_roadmap .cloudcanvas-sticky-body').textContent,
        locked: document.getElementById('sticky_roadmap').hasAttribute('data-editing')
      }));
      assert.deepEqual(committed, { body: 'Updated note via inline editing!', rendered: 'Updated note via inline editing!', locked: false });

      const connectorCount = await page.evaluate(() => document.querySelectorAll('svg[data-blit-svg] g[data-trait="connectable"] path').length);
      assert.ok(connectorCount >= 2, `expected at least 2 connector paths on the board, found ${connectorCount}`);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}
