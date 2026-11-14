/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit in real Chromium: focus trapping and Escape, real pointer drags
 * on the board, calendar, timeline and graph, keyboard moves, the toast pause,
 * the composer, the flag badge as it is actually drawn, the drawer's travel,
 * a tab strip in its two faces - line and folder, with a stack and with none,
 * moved, cut short and scrolled into view - the menu, over a toast too, a tree
 * with flags, a toast with two actions, a host that resets every margin, the
 * views' items under a finger - held still, and as 44px targets - and a 390px
 * phone viewport with no sideways scroll.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-kit.html';

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui kit browser', { skip: 'playwright is not installed' }, () => {});
} else {
  const scope = { server: null, browser: null };
  before(async () => {
    scope.server = await startStaticServer();
    scope.browser = await chromium.launch();
  });
  after(async () => {
    await scope.browser?.close();
    await scope.server?.close();
  });

  /** A fresh page on the fixture; any page error or console error fails the test. `device` adds to the page's context (a touch screen). */
  async function open(viewport = { width: 1100, height: 900 }, device = {}) {
    const page = await scope.browser.newPage({ viewport, ...device });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}`);
    await page.waitForFunction(() => window.ready === true);
    return { page, errors };
  }

  const keys = async (page, ...names) => { for (const name of names) await page.keyboard.press(name); return page.evaluate(() => window.focusName()); };
  /** A test on a fresh page (`open`'s arguments) that must end with no page error and no console error. */
  const onPage = (body, ...device) => () => open(...device).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));

  async function drag(page, from, to, steps = 8) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps });
    await page.mouse.up();
  }

  const centre = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

  /** Bring a section to the top of the viewport before measuring: the mouse only reaches what is on screen. */
  const reveal = (page, id) => page.evaluate((hostId) => document.getElementById(hostId).scrollIntoView({ block: 'start' }), id);
  const log = (page) => page.evaluate(() => window.log);

  test('dialog: opens with focus inside, Tab stays inside, Escape closes and focus returns', onPage(async (page) => {
    await page.click('#open-dialog');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'dialog-name');
    for (let i = 0; i < 5; i += 1) await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => Boolean(document.activeElement.closest('dialog'))), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').evaluate((node) => node.open), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'open-dialog');
    await page.click('#open-dialog');
    await page.mouse.click(5, 5);
    assert.deepEqual((await log(page)).filter((entry) => entry[0] === 'dialog-close').map((entry) => entry[1]), ['escape', 'backdrop']);
  }));

  test('tabs and splitter: arrows select; a drag and a key resize', onPage(async (page) => {
    await page.locator('[role="tab"]', { hasText: 'Today' }).focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tabs-host [role="tab"][aria-selected="true"]').textContent(), 'Notes');
    const bar = await page.locator('.cloudcanvas-ui-splitter').boundingBox();
    await drag(page, centre(bar), { x: centre(bar).x + 100, y: centre(bar).y });
    const value = Number(await page.locator('.cloudcanvas-ui-splitter').getAttribute('aria-valuenow'));
    assert.ok(value > 55, `drag right grew the left pane: ${value}`);
    await page.locator('.cloudcanvas-ui-splitter').focus();
    await page.keyboard.press('Home');
    assert.equal(await page.locator('.cloudcanvas-ui-splitter').getAttribute('aria-valuenow'), '10');
  }));

  test('kanban: a pointer drag moves a card to another column; Space-arrow-Space moves one by keyboard', onPage(async (page) => {
    await reveal(page, 'kanban-host');
    const card = await page.locator('[data-ui-id="a"]').boundingBox();
    const done = await page.locator('.cloudcanvas-ui-kanban-column[data-column-id="done"]').boundingBox();
    await drag(page, centre(card), { x: centre(done).x, y: done.y + 60 });
    assert.deepEqual((await log(page)).at(-1), ['move-card', 'a', 'done', 0]);
    assert.equal(await page.locator('[data-column-id="done"] [data-ui-id="a"]').count(), 1);
    await page.locator('[data-ui-id="b"]').focus();
    await keys(page, 'Space', 'ArrowRight', 'Space');
    assert.deepEqual((await log(page)).at(-1), ['move-card', 'b', 'doing', 0]);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-ui-id')), 'b');
    await page.locator('[data-ui-id="c"]').click();
  }));

  test('calendar: drag an event to another day in the month; drag it two hours later in the week', onPage(async (page) => {
    await reveal(page, 'calendar-host');
    const chip = await page.locator('.cloudcanvas-ui-calendar-event[data-ui-id="call"]').boundingBox();
    const target = await page.locator('.cloudcanvas-ui-calendar-cell[data-date="2026-10-01"]').boundingBox();
    await drag(page, centre(chip), centre(target));
    const moved = (await log(page)).at(-1);
    assert.equal(moved[0], 'move-event');
    assert.equal(await page.evaluate((iso) => new Date(iso).getDate(), moved[2]), 1);
    await page.click('.cloudcanvas-ui-calendar-view[data-view="week"]');
    await reveal(page, 'calendar-host');
    const event = page.locator('.cloudcanvas-ui-calendar-timed[data-ui-id="call"]');
    await event.scrollIntoViewIfNeeded();
    const box = await event.boundingBox();
    const hour = await page.evaluate(() => document.querySelector('.cloudcanvas-ui-calendar-time-grid').getBoundingClientRect().height / 16);
    await drag(page, { x: centre(box).x, y: box.y + 6 }, { x: centre(box).x, y: box.y + 6 + hour * 2 });
    const later = (await log(page)).at(-1);
    assert.equal(await page.evaluate((iso) => new Date(iso).getHours(), later[2]), 11);
  }));

  test('timeline: a bar drags by whole days', onPage(async (page) => {
    await reveal(page, 'timeline-host');
    const bar = await page.locator('.cloudcanvas-ui-timeline-bar[data-ui-id="draft"]').boundingBox();
    await drag(page, { x: bar.x + 20, y: centre(bar).y }, { x: bar.x + 20 + 61, y: centre(bar).y });
    const moved = (await log(page)).at(-1);
    assert.equal(await page.evaluate((iso) => new Date(iso).getDate(), moved[2]), 1, '61px at 20px a day is three days: Sep 28 to Oct 1');
  }));

  test('toast: an Undo toast pauses while hovered and leaves after', onPage(async (page) => {
    await page.evaluate(() => window.toaster.show({ message: 'Deleted', timeout: 400, action: { label: 'Undo', run: () => window.log.push(['undo']) } }));
    const toast = page.locator('.cloudcanvas-ui-toast');
    await toast.hover();
    await page.waitForTimeout(800);
    assert.equal(await toast.count(), 1, 'kept while hovered');
    await page.mouse.move(2, 2);
    await page.waitForTimeout(1800);
    assert.equal(await toast.count(), 0);
    await page.evaluate(() => window.toaster.show({ message: 'Deleted', timeout: 0, action: { label: 'Undo', run: () => window.log.push(['undo']) } }));
    await page.click('.cloudcanvas-ui-toast-action');
    assert.deepEqual((await log(page)).at(-1), ['undo']);
  }));

  test('composer: blank is refused, Ctrl+Enter sends and clears, Cancel clears', onPage(async (page) => {
    const field = page.locator('.cloudcanvas-ui-composer-input');
    await field.fill('   ');
    assert.equal(await page.locator('.cloudcanvas-ui-composer-submit').isDisabled(), true);
    await field.fill(' hello ');
    await field.press('Control+Enter');
    assert.deepEqual((await log(page)).at(-1), ['submit', 'hello']);
    assert.equal(await field.inputValue(), '');
    await field.fill('draft');
    await page.click('.cloudcanvas-ui-composer-cancel');
    assert.equal(await field.inputValue(), '');
  }));

  /** Each flag in `scope` as Chromium drew it (the fixture's `flagsIn`): its box, its cloth, its figure's ink, its colours and where it stacks. */
  const flagsIn = (page, scope) => page.evaluate((selector) => window.flagsIn(selector), scope);

  test('flag badge: drawn on the pixel grid in its tone, its figure inside the pennant and centred; lit, shaded and themed by tokens alone', onPage(async (page) => {
    const flags = await flagsIn(page, '#badge-host');
    assert.deepEqual(flags.map((flag) => flag.figure), ['9', '42', '99+', '']);
    for (const flag of flags) {
      assert.deepEqual(flag.size, flag.attrs, `"${flag.figure}" is laid out at the size it states`);
      assert.equal(flag.cloth.height, 16, 'the pennant is 16px tall');
      assert.equal(flag.plate, 'rgba(0, 0, 0, 0)', 'the pill behind the marker is gone');
      assert.equal(flag.onTone, 'rgb(15, 23, 42)', 'the figure is the on-tone text');
      assert.equal(flag.staff, 'rgb(148, 163, 184)', 'the staff is the muted text colour');
      assert.match(flag.shadow, /^drop-shadow\(/, 'it casts a shadow');
      assert.equal(flag.layer, '2', 'it stacks in front of what it is planted on');
      if (flag.figure === '') continue;
      assert.ok(flag.fontSize >= 10 && flag.fontSize <= 11 && flag.fontWeight === '600', `figure type: ${flag.fontSize}px ${flag.fontWeight}`);
      assert.ok(flag.inkLeft >= flag.cloth.left + 1 && flag.inkRight <= flag.cloth.right - 5,
        `"${flag.figure}" sits clear of the staff and the notch: ${JSON.stringify(flag)}`);
      assert.ok(Math.abs(flag.inkMiddle - flag.cloth.middle) <= 1, `"${flag.figure}" is centred in the pennant: ${flag.inkMiddle} in ${flag.cloth.middle}`);
    }
    assert.deepEqual(flags.map((flag) => flag.tone), ['rgb(56, 189, 248)', 'rgb(34, 197, 94)', 'rgb(248, 113, 113)', 'rgb(234, 179, 8)'],
      'accent, success, danger, warning');
    await page.addStyleTag({ content: ':root { --cc-accent: rgb(1, 2, 3); --cc-tone-danger: rgb(4, 5, 6); --cc-ui-on-accent: rgb(7, 8, 9); --cc-text-muted: rgb(10, 11, 12); }' });
    const themed = await flagsIn(page, '#badge-host');
    assert.deepEqual([themed[0].tone, themed[2].tone, themed[0].onTone, themed[0].staff], ['rgb(1, 2, 3)', 'rgb(4, 5, 6)', 'rgb(7, 8, 9)', 'rgb(10, 11, 12)'],
      'a theme changes the flag through tokens');
  }));

  test('flag badge: given a rise it sticks out of its tab strip, whole and in front of what it overlaps', onPage(async (page) => {
    const planted = await page.evaluate(() => window.feedFlag());
    assert.ok(planted.above <= 0 && planted.under <= 0, `with no rise the flag stays inside its tab: ${JSON.stringify(planted)}`);
    const risen = await page.evaluate(() => window.feedFlag('8px'));
    assert.ok(risen.above >= 3, `it stands out of the top of its tab: ${risen.above}px`);
    assert.equal(risen.tab, planted.tab, 'the tab it is planted in keeps its height');
    assert.deepEqual([risen.cut <= 0, risen.scrolls], [true, 0], 'the strip scrolls, and still does not cut it; nor does it start to scroll');
    assert.ok(risen.under >= 3, `it overlaps what is above the strip by ${risen.under}px`);
    assert.equal(risen.front, true, 'and is drawn in front of it, though that is a layer of its own');
  }));

  test('tabs with flags: the count is part of the tab\'s name, the tab is no taller, and nothing is selected until asked', onPage(async (page) => {
    const feed = page.locator('#feed-tabs-host');
    assert.equal(await feed.locator('[role="tab"][aria-selected="true"]').count(), 0, 'activeId null: no tab is selected');
    for (const name of ['Alerts 3 unread', 'Updates 120 unread', 'Reminders']) assert.equal(await feed.getByRole('tab', { name, exact: true }).count(), 1, `named "${name}": the ear gets the whole count, not "99+"`);
    const heights = await feed.locator('[role="tab"]').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
    assert.equal(new Set(heights).size, 1, `a flag does not grow its tab: ${heights}`);
    await page.keyboard.press('Tab');
    for (let i = 0; i < 12 && !(await page.evaluate(() => Boolean(document.activeElement.closest('#feed-tabs-host')))); i += 1) await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent.startsWith('Alerts')), true, 'the first tab is the way in');
    await feed.locator('.cloudcanvas-ui-badge-flag').nth(1).click();
    assert.equal(await feed.locator('[role="tab"][aria-selected="true"]').getAttribute('data-ui-id'), 'updates', 'a press on the flag is a press on its tab');
  }));

  /** The drawer as the page has it right now (the fixture's `drawerState`). */
  const drawerState = (page) => page.evaluate(() => window.drawerState());
  const travelsEnd = (page) => page.evaluate(() => Promise.all(document.querySelector('.cloudcanvas-ui-drawer').getAnimations().map((motion) => motion.finished)));

  test('drawer: folds toward its control and only then leaves the page; a press brings it back; a change of mind turns it round', onPage(async (page) => {
    await reveal(page, 'drawer-stage');
    const open0 = await drawerState(page);
    assert.deepEqual([open0.hidden, open0.inert, open0.travels, open0.expanded, open0.controls], [false, false, 0, 'true', true]);
    await page.focus('#drawer-field');
    await page.keyboard.press('Escape');
    assert.equal((await drawerState(page)).hidden, false, 'Escape is not its key');
    await page.focus('#drawer-close');
    await page.keyboard.press('Enter');
    const closing = await drawerState(page);
    assert.deepEqual([closing.hidden, closing.travels, closing.expanded, closing.focus], [false, 1, 'false', 'drawer-close'], 'on the page, and still holding focus, while it travels');
    await travelsEnd(page);
    const closed = await drawerState(page);
    assert.deepEqual([closed.hidden, closed.inert, closed.travels, closed.focus], [true, true, 0, 'drawer-toggle'], 'then hidden and inert, its focus handed to the control');
    assert.ok(closed.main > open0.main, 'and the page takes its room back');
    assert.deepEqual((await log(page)).filter((entry) => entry[0] === 'drawer'), [['drawer', false]]);
    await page.click('#drawer-toggle');
    const opening = await drawerState(page);
    assert.deepEqual([opening.hidden, opening.inert, opening.travels, opening.expanded], [false, false, 1, 'true']);
    assert.ok(Math.abs(opening.origin[0] - open0.aim[0]) <= 1 && Math.abs(opening.origin[1] - open0.aim[1]) <= 1,
      `it unfolds from the centre of its control, measured from where the panel rests: ${opening.origin} for ${open0.aim}`);
    await travelsEnd(page);
    assert.deepEqual((({ hidden, travels, focus }) => [hidden, travels, focus])(await drawerState(page)), [false, 0, 'drawer-toggle'], 'opening moves no focus');
    await page.evaluate(() => { document.getElementById('drawer-toggle').click(); document.getElementById('drawer-toggle').click(); });
    assert.equal((await drawerState(page)).travels, 1, 'the same travel, turned round');
    await travelsEnd(page);
    assert.deepEqual((({ hidden, inert, travels }) => [hidden, inert, travels])(await drawerState(page)), [false, false, 0]);
  }));

  test('drawer: with reduced motion asked for there is no travel at all', onPage(async (page) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await reveal(page, 'drawer-stage');
    await page.click('#drawer-toggle');
    assert.deepEqual((({ hidden, inert, travels }) => [hidden, inert, travels])(await drawerState(page)), [true, true, 0], 'closed at once');
    await page.click('#drawer-toggle');
    assert.deepEqual((({ hidden, inert, travels }) => [hidden, inert, travels])(await drawerState(page)), [false, false, 0], 'open at once');
  }));

  test('tabs keep focus across a redraw, and a drawer letting go of a shared control leaves the other drawer\'s state on it', onPage(async (page) => {
    const seen = await page.evaluate(() => window.redrawAndRelease('/ui/index.js'));
    assert.deepEqual(seen.focus, [true, true], 'the same model again leaves focus on the tab');
    assert.equal(seen.stop, true, 'and focus on a tab that goes moves to the tab stop');
    assert.deepEqual(seen.held, [true, 'true']);
    assert.deepEqual(seen.afterRelease, [true, 'true'], 'the control still says what its owner says');
    assert.deepEqual(seen.bare, [null, null], 'and is bare once no drawer names it');
  }));

  test('folder tabs on a phone: stacks of 0, 2 and 5 layers - each layer tucked behind what is in front of it, a step lower, its label\'s start showing; the fold\'s menu', onPage(async (page) => {
    const stacks = await page.evaluate(() => ['pinned', 'near', 'deep'].map((id) => window.stackOf(id)));
    const fold = stacks[2].layers[0].box;
    assert.deepEqual([stacks.map((stack) => stack.layers.map((layer) => layer.text)), stacks[0].close], [[[], ['Work', 'Fourth quarter planning'], ['…', 'Launch', 'Copy review']], false], 'the pinned tab has nothing behind it, and no close');
    for (const { layers, tab } of stacks) {
      const tops = [...layers.map((layer) => layer.box[1]), tab[1]];
      assert.ok(tops.every((top, at) => at === 0 || tops[at - 1] - top === 3), `back to front each stands 3px taller, the tab tallest: ${tops}`);
      const stacked = (layer) => layer.overlap === 6 && layer.behind && layer.box[3] === tab[3] && layer.room >= layer.six && layer.target >= 44;
      assert.ok(layers.every(stacked), `each runs 6px under what is in front and is behind it there, stands on the tab's baseline, shows six characters, is a 44px target: ${JSON.stringify(layers)}`);
    }
    await page.touchscreen.tap(fold[0] + 10, fold[1] + 10);
    const [menu, ...items] = await page.evaluate(() => window.boxesOf('#folder-tabs-host :is([role="menu"]:not([hidden]), [role="menuitem"])'));
    assert.ok(menu[0] >= 8 && menu[2] <= 382 && menu[1] >= fold[3] - 1 && items.every((box) => box[3] - box[1] >= 44), `its menu opens below it, in view, with 44px items: ${menu}`);
    await page.touchscreen.tap(fold[0] + 10, fold[1] + 10);
    assert.deepEqual(await page.evaluate(() => window.boxesOf('#folder-tabs-host [role="menu"]')), [null, null], 'a second tap on the fold shuts its menu, and the click it ends in does not open it again');
  }, { width: 390, height: 844 }, { hasTouch: true, isMobile: true }));

  test('folder tabs: under the pointer or the keys a layer comes to the front and opens out to its label, its ring whole; not eased under reduced motion', onPage(async (page) => {
    const long = () => page.evaluate(() => ({ ...window.stackOf('near').layers[1], tab: window.stackOf('near').tab }));
    const eased = async (reducedMotion) => { await page.emulateMedia({ reducedMotion }); return page.evaluate(() => getComputedStyle(document.querySelector('.cloudcanvas-ui-tabs-layer-face')).transitionDuration); };
    const rest = await long();
    assert.deepEqual([await eased('no-preference'), await eased('reduce')], ['0.12s', '0s'], 'it eases open, unless less motion was asked for');
    await page.hover('#folder-tabs-host [data-ui-layer="q4"]');
    const hovered = await long();
    assert.deepEqual([rest.cut, rest.title, rest.behind, hovered.cut, hovered.behind], [true, 'Fourth quarter planning', true, false, false], 'cut short (whole in its title) and behind its tab at rest; whole and in front of it under the pointer');
    assert.ok(hovered.box[2] > rest.box[2] && hovered.box[2] - hovered.box[0] <= 192 && hovered.box[0] === rest.box[0] && String(hovered.tab) === String(rest.tab), `wider, to its limit, from where it stood, and its tab has not moved: ${hovered.box}`);
    await page.mouse.move(2, 2);
    await page.getByRole('tab', { name: 'Board' }).click();
    assert.equal(await keys(page, 'Shift+Tab'), 'Up to Fourth quarter planning', 'back from the tab, its nearest parent is the next stop');
    const focused = await long();
    assert.deepEqual([focused.cut, focused.behind, focused.ring, focused.whole], [false, false, 'solid', true], 'the keys bring it forward the same way, and no neighbour is over its ring');
  }));

  /*
   * What Momentum ran into, as Chromium draws it. Before K2: the 72-character tab was 564px wide, a close control under a
   * finger 17px, a toast's dismiss 34px, and under `* { margin: 0 }` the dialog opened in the corner. On the kit K2 built
   * (`dist/`, before K3): every strip was a row of folders, asked or not; a close control was a box of its own beside
   * its tab (`inside: false`); and a tab with a flag was never cut.
   */
  const LONG = 'The quarterly review of everything the team said it would ship this year';
  const moveStrip = (page) => page.evaluate(() => window.moveStrip());
  const middle = (row) => ({ x: (row.box[0] + row.box[2]) / 2, y: (row.box[1] + row.box[3]) / 2 });
  const facesOf = (page, ...hosts) => page.evaluate((ids) => ids.map((id) => window.facesOf(id)), hosts);
  const drawn = (tabs, what) => [...new Set(tabs.map((tab) => what(tab).join(' ')))];

  test('a strip is quiet underlined tabs unless it asks for folders; a folder strip is the same folders with a stack or with none, the active one in front; a long label cut at 16rem; a ring that is whole', onPage(async (page) => {
    const [plain, line, folder, stacked, movable] = await facesOf(page, 'tabs-host', 'line-face-host', 'folder-face-host', 'folder-tabs-host', 'move-tabs-host');
    assert.deepEqual(drawn([...plain, ...line], (tab) => [tab.corners, tab.edges, tab.shadow, tab.page, tab.washes, tab.ink]), ['0px,0px 0px,0px,0px false rgba(0, 0, 0, 0) 0 rgb(226, 232, 240)'],
      'unasked, a strip is the line face: no corner, no edge, no shadow, no ground of its own');
    assert.deepEqual([drawn(line, (tab) => [tab.box[1], tab.box[3]]).length, line.map((tab) => tab.line)], [1, ['rgba(0, 0, 0, 0)', 'rgb(56, 189, 248)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)']], 'its tabs stand on one line, and the selected one is underlined');
    const [front, ...back] = [folder[1], folder[0], folder[2], folder[3]];
    assert.deepEqual([front.active, front.washes, ...back.map((tab) => tab.washes)], [true, 1, 2, 2, 2], 'asked for folders: the tab in front is on the lit face; each of the others takes one wash of shade');
    assert.ok(back.every((tab) => tab.box[1] - front.box[1] === 3 && tab.box[3] === front.box[3]), `and stands a step lower, on the same baseline: ${JSON.stringify(folder.map((tab) => tab.box))}`);
    assert.deepEqual(drawn([...folder, ...stacked, ...movable], (tab) => [tab.corners, tab.edges, tab.shadow, tab.page, tab.ink]), ['6px,6px 1px,1px,1px true rgb(15, 17, 23) rgb(226, 232, 240)'],
      'with a stack or with none, closing or not: two corners, three edges, one shadow, one opaque face, one ink');
    const long = (await moveStrip(page)).rows[1];
    assert.deepEqual([long.box[2] - long.box[0], long.cut, long.title, await page.getByRole('tab', { name: LONG, exact: true }).count()], [256, true, LONG, 1], 'the 72-character label is cut at 16rem, and whole in its title and in its name');
    await page.locator('#tabs-host [role="tab"]', { hasText: 'Today' }).focus();
    await page.keyboard.press('ArrowRight');
    assert.deepEqual(await page.evaluate(() => window.ringOf()), { line: 'solid', offset: '-2px', whole: true }, 'a tab wears its ring inside, where its strip does not cut it');
  }));

  test('on either face a close control stands inside its tab and draws nothing of its own; a tab with a flag is cut like any other; layers on a line strip are read in line', onPage(async (page) => {
    const FLAGGED = 'Everything the team agreed to deliver before the end of the quarter';
    for (const tabs of await facesOf(page, 'line-face-host', 'folder-face-host')) {
      const closes = tabs.filter((tab) => tab.close).map((tab) => tab.close);
      assert.ok(closes.length === 3 && closes.every((close) => close.inside && close.found && close.own === 'rgba(0, 0, 0, 0) none 0px 0px none' && close.size[0] === 28),
        `each is inside its tab's face, with no ground, edge or shadow of its own, and is what a pointer finds there: ${JSON.stringify(closes)}`);
      assert.deepEqual([tabs[2].box[2] - tabs[2].box[0], tabs[2].cut, tabs[2].badge >= 0], [256, true, true], 'the flagged tab is cut at 16rem: its label gives way, and its flag stands after it');
    }
    assert.equal(await page.getByRole('tab', { name: `${FLAGGED} 3 unread`, exact: true }).count(), 2, 'its name is whole, flag and all, as it was');
    await page.click('#folder-face-host [data-ui-close="f-long"]');
    assert.deepEqual((await log(page)).at(-1), ['close', 'folder', 'f-long'], 'a press on it closes its tab, and selects nothing');
    const { boxes: [work, q4, tab], cut } = await page.evaluate(() => window.layersInLine('line-face-host', 'f-deep'));
    assert.ok(work[2] <= q4[0] && q4[2] <= tab[0] && work[1] >= tab[1] && work[3] <= tab[3], `each layer before the next and all before their tab, in its line: ${[work, q4, tab].join(' | ')}`);
    assert.deepEqual(cut, [['Work', false], ['Fourth quarter planning', false]], 'and whole: nothing is tucked behind anything');
  }));

  test('tabs that can be moved: a drag marks where the tab would land and a drop reports it; a pinned tab stays, and nothing lands before it; Alt+arrow moves one from the keys', onPage(async (page) => {
    const [start, long, , budget] = (await moveStrip(page)).rows;
    await page.mouse.move(middle(budget).x, middle(budget).y);
    await page.mouse.down();
    await page.mouse.move(long.box[0] + 20, middle(long).y, { steps: 6 });
    const marked = (await moveStrip(page)).rows.filter((row) => row.dragging || row.drop).map((row) => [row.id, row.dragging, row.drop]);
    const bar = await page.evaluate(() => { const style = getComputedStyle(document.querySelector('#move-tabs-host [data-drop]'), '::after'); return [style.width, style.backgroundColor]; });
    assert.deepEqual([marked, bar], [[['long', false, 'before'], ['budget', true, null]], ['2px', 'rgb(56, 189, 248)']], 'the tab is outlined and a bar stands where it would land');
    await page.mouse.up();
    assert.deepEqual([(await log(page)).at(-1), (await moveStrip(page)).rows.map((row) => row.id).slice(0, 3)], [['reorder', 'budget', 'long'], ['start', 'budget', 'long']], 'the drop is reported, and the caller answers with the new order');
    assert.equal(await page.locator('#move-tabs-host [aria-selected="true"]').count(), 0, 'a drag is not a press: nothing was selected');
    const journal = (await moveStrip(page)).rows.find((row) => row.id === 'journal');
    await drag(page, middle(journal), { x: start.box[0] + 3, y: middle(start).y });
    assert.deepEqual((await log(page)).at(-1), ['reorder', 'journal', 'budget'], 'dropped before the pinned tab, it lands right after it');
    await drag(page, middle(start), { x: start.box[0] + 300, y: middle(start).y });
    assert.equal((await log(page)).filter((entry) => entry[0] === 'reorder').length, 2, 'the pinned tab is not picked up');
    await page.locator('#move-tabs-host [data-ui-id="long"]').focus();
    await page.keyboard.press('Alt+ArrowLeft');
    assert.deepEqual([(await log(page)).at(-1), await page.evaluate(() => document.activeElement.getAttribute('data-ui-id'))], [['reorder', 'long', 'budget'], 'long'], 'Alt+ArrowLeft moves it one place, and focus stays on it');
  }));

  test('the active tab comes into view: the strip scrolls itself - eased, unless less motion was asked for - to the tab and the layer right behind it, and moves nothing else', onPage(async (page) => {
    const go = (id, layers) => page.evaluate(([tabId, behind]) => { window.showMoveTab(tabId, behind); return window.moveStrip().scroll; }, [id, layers]);
    const inView = async (id) => { await page.evaluate(() => window.moveSettled()); const { left, right, rows } = await moveStrip(page); const row = rows.find((one) => one.id === id); return (row.nearest ?? row.box[0]) >= left && row.end <= right; };
    assert.ok(await go('garden') > 0, 'the first tab shown is shown at once');
    assert.equal(await inView('garden'), true, 'the last tab, which the strip had cut off');
    assert.ok(await go('start') > 0, 'the next is eased to: the strip has not arrived when the redraw returns');
    assert.deepEqual([await inView('start'), (await moveStrip(page)).scroll], [true, 0]);
    await go('garden', [{ id: 'work', label: 'Work' }, { id: 'q4', label: 'Fourth quarter' }]);
    assert.equal(await inView('garden'), true, 'with a stack: the tab, its close control and its nearest layer');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await go('start'), 0, 'under reduced motion the strip is simply there');
    assert.equal(await page.evaluate(() => scrollY), 0, 'and the page around the strip never moved');
  }));

  test('under a finger a close control and every control of a toast are 44px targets; a toast takes two actions; its region keeps clear of what a host floats', onPage(async (page) => {
    const closes = (await facesOf(page, 'move-tabs-host'))[0].map((tab) => tab.close).filter(Boolean);
    assert.ok(closes.length === 5 && closes.every(({ size, inside }) => size[0] >= 44 && size[1] >= 44 && inside), `each close control, inside its tab: ${JSON.stringify(closes)}`);
    const id = await page.evaluate(() => window.toaster.show({ message: 'Stand-up in five minutes', timeout: 0, actions: [{ id: 'snooze', label: 'Snooze' }, { id: 'open', label: 'Open' }] }));
    const [toast, ...controls] = await page.evaluate(() => window.boxesOf('.cloudcanvas-ui-toast, .cloudcanvas-ui-toast button'));
    assert.ok(controls.length === 3 && controls.every((box) => box[2] - box[0] >= 44 && box[3] - box[1] >= 44), `Snooze, Open and the dismiss control: ${controls.join(' | ')}`);
    assert.ok(toast[0] >= 12 && toast[2] <= 378 && controls.every((box) => box[2] <= toast[2]), `all inside the toast, and the toast inside the phone: ${toast}`);
    assert.deepEqual((await page.evaluate(() => window.marginsOf('.cloudcanvas-ui-toasts'))).filter((_, side) => side !== 1), [12, 12, 16], 'with no token set the region is where it was');
    await page.addStyleTag({ content: ':root { --cc-ui-toast-inset-left: 20px; --cc-ui-toast-inset-right: 64px; --cc-ui-toast-inset-bottom: 72px; }' });
    assert.deepEqual((await page.evaluate(() => window.marginsOf('.cloudcanvas-ui-toasts'))).filter((_, side) => side !== 1), [20, 64, 72], 'each side moves by its own token');
    await page.tap('.cloudcanvas-ui-toast-action');
    assert.deepEqual([(await log(page)).at(-1), await page.locator('.cloudcanvas-ui-toast').count()], [['toast-action', id, 'snooze'], 0], 'an action is reported with its toast, and closes it');
  }, { width: 390, height: 844 }, { hasTouch: true, isMobile: true }));

  test('tree: a row takes a flag between its label and its count, and says what the flag says once', onPage(async (page) => {
    const tree = page.locator('#tree-host');
    for (const name of ['Work 3 unread 12', 'Planning 120 unread', 'Shipping 4', 'Home 2']) assert.equal(await tree.getByRole('treeitem', { name, exact: true }).count(), 1, `named "${name}"`);
    const [label, flag, count] = await page.evaluate(() => window.boxesOf('#tree-host [data-ui-id="work"] :is(.cloudcanvas-ui-tree-label, .cloudcanvas-ui-badge-flag, .cloudcanvas-ui-tree-count)'));
    assert.ok(label[2] <= flag[0] && flag[2] <= count[0] && flag[1] >= label[1] - 4 && flag[3] <= label[3] + 4, `label, flag, count, on one line: ${[label, flag, count].join(' | ')}`);
  }));

  test('a host that resets every margin: the dialog is still centred, and still a sheet on a phone; the menu and the toasts are where they were', onPage(async (page) => {
    await page.addStyleTag({ content: '* { box-sizing: border-box; margin: 0; padding: 0; }' });
    await page.click('#open-dialog');
    const [left, top, right, bottom] = await page.evaluate(() => window.marginsOf('.cloudcanvas-ui-dialog-panel'));
    assert.ok(left > 100 && top > 100 && Math.abs(left - right) <= 1 && Math.abs(top - bottom) <= 1, `centred both ways: ${[left, top, right, bottom]}`);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.deepEqual((await page.evaluate(() => window.marginsOf('.cloudcanvas-ui-dialog-panel'))).filter((_, side) => side !== 1), [0, 0, 0], 'under 40rem it sits on the bottom edge, edge to edge');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.click('#menu-open');
    const [anchor, panel] = await page.evaluate(() => window.boxesOf('#menu-open, #menu-host [role="menu"]'));
    await page.evaluate(() => window.toaster.show({ message: 'Saved', timeout: 0 }));
    const [toasts, toast] = await page.evaluate(() => ['.cloudcanvas-ui-toasts', '.cloudcanvas-ui-toast'].map((selector) => window.marginsOf(selector)));
    assert.deepEqual([panel[0], panel[1], toasts[0], toasts[2], toasts[3], Math.abs(toast[0] - toast[2]) <= 1], [anchor[0], anchor[3], 12, 12, 16, true],
      'neither leans on a margin of the browser\'s: the menu is placed by its own numbers, the toast region by its own insets, a toast centred in it');
  }));

  /*
   * The views as Momentum uses them. On the kit K2 built (`dist/`, before K3): a column had no heading to press, a finger
   * held still for 600ms had picked its card up (`[ 'is-drag-active', 'is-dragging' ]`), a chip under a finger was 12px
   * tall and a milestone found 21px from its middle by nothing (`[ false, false, false, false ]`).
   */
  test('a column and a group that stand for an item open it from their heading, by key or press; the label beside a bar is the bar; the selected item wears its ring and says so', onPage(async (page) => {
    await reveal(page, 'kanban-host');
    await page.locator('#kanban-host').getByRole('button', { name: 'Doing', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.locator('#timeline-host').getByRole('button', { name: 'Writing', exact: true }).click();
    await page.click('#timeline-host [data-row-id="draft"] .cloudcanvas-ui-timeline-label');
    assert.deepEqual((await log(page)).filter((entry) => entry[0].startsWith('open-')), [['open-card', 'goal'], ['open-item', 'book'], ['open-item', 'draft']]);
    const marks = await page.evaluate(() => window.marksOf(['#kanban-host [data-ui-id="c"]', '#kanban-host [data-ui-id="a"]', '#calendar-host [data-ui-id="trip"]', '#calendar-host [data-ui-id="call"]',
      '#timeline-host .cloudcanvas-ui-timeline-bar[data-ui-id="draft"]', '#timeline-host [data-ui-id="ship"]']));
    assert.deepEqual(marks, [['c', 'true', true], ['a', null, false], ['trip', 'true', true], ['call', null, false], ['draft', 'true', true], ['ship', null, false]], 'the selected card, chip and bar, and no other');
    assert.equal(await page.evaluate(() => window.ui.itemIdOf(document.querySelector('#timeline-host .cloudcanvas-ui-timeline-label'))), 'draft', 'and a host asks which item an element belongs to');
  }));

  test('a finger held still on a card picks nothing up, however long; once it has rested, its travel is the drag', onPage(async (page) => {
    await reveal(page, 'kanban-host');
    const touch = await page.context().newCDPSession(page);
    const finger = (type, at) => touch.send('Input.dispatchTouchEvent', { type, touchPoints: at ? [{ x: at.x, y: at.y }] : [] });
    const marks = () => page.evaluate(() => ['is-drag-active', 'is-dragging'].filter((mark) => document.querySelector(`#kanban-host .${mark}`)));
    const card = centre(await page.locator('[data-ui-id="a"]').boundingBox());
    const done = await page.locator('.cloudcanvas-ui-kanban-column[data-column-id="done"]').boundingBox();
    await finger('touchStart', card);
    await page.waitForTimeout(600);
    assert.deepEqual(await marks(), [], 'held for longer than a host waits to open its menu: the card is as it was');
    await finger('touchEnd');
    assert.equal((await log(page)).filter((entry) => entry[0] === 'move-card').length, 0, 'and let go, it has not moved');
    await finger('touchStart', card);
    await page.waitForTimeout(450);
    for (let step = 1; step <= 6; step += 1) await finger('touchMove', { x: card.x + ((centre(done).x - card.x) * step) / 6, y: card.y + ((done.y + 60 - card.y) * step) / 6 });
    assert.deepEqual(await marks(), ['is-drag-active', 'is-dragging'], 'rested, then moved: now it is in hand');
    await finger('touchEnd');
    assert.deepEqual((await log(page)).at(-1), ['move-card', 'a', 'done', 0]);
  }, { width: 1100, height: 900 }, { hasTouch: true }));

  /*
   * Seen to fail on the kit of `ba0f72d`. A milestone: {"drawn":[24,24],"middle":true,"around":[true,false,true,true]} - the title beside it took the 21px to its right.
   * Two nodes at zoom 0.2: {"drawn":[42,14],"middle":false,"around":[false,false,true,false]} - `translate` made each node a stacking context, so the later reached over the earlier.
   */
  test('under a finger a chip, a short event, a milestone and a node are 44px targets though drawn smaller; what is drawn is never taken by a neighbour\'s reach; an open menu stands over a toast', onPage(async (page) => {
    const reach = (selector) => page.evaluate((one) => window.reachOf(one), selector);
    await page.evaluate(() => window.zoomGraph(0.2)); // a node is 208x68 at full size, a target by itself; zoomed out it is drawn smaller than one
    const found = { first: await reach('#calendar-host [data-ui-id="call"]'), last: await reach('#calendar-host [data-ui-id="sync"]'), lone: await reach('#calendar-host [data-ui-id="trip"]'),
      milestone: await reach('#timeline-host [data-ui-id="ship"]'), node: await reach('#graph-host [data-ui-id="plan"]') };
    const siblings = [await reach('#graph-host [data-ui-id="build"]'), await reach('#graph-host [data-ui-id="test"]')];
    assert.ok(siblings.every((one) => one.drawn[1] < 44 && one.middle), `two nodes drawn one under the other 17px apart are each found at their own middle: the later one's reach never covers the earlier one: ${JSON.stringify(siblings)}`);
    assert.ok(Object.values(found).every((item) => item.drawn[1] < 44 && item.middle), `each is drawn smaller than a target, and is found at its own middle whatever reaches over it: ${JSON.stringify(found)}`);
    assert.deepEqual([found.milestone.around, found.node.around], [Array(4).fill(true), Array(4).fill(true)], 'a milestone and a node are found 21px from their middle every way');
    const { first, last, lone } = found;
    assert.ok(lone.below === 44 && last.below >= 40 && first.below >= first.drawn[1] && first.below <= first.drawn[1] + 3 && !first.around[2] && !lone.around[2],
      `a chip alone in its day is found 44px down from its top; the last of two as far as the next week's number; the first down to the second; and none reaches up over what is above it: ${JSON.stringify([first, last, lone])}`);
    await page.click('#calendar-host .cloudcanvas-ui-calendar-view[data-view="week"]');
    const [short, allDay] = [await reach('#calendar-host .cloudcanvas-ui-calendar-timed[data-ui-id="sync"]'), await reach('#calendar-host .cloudcanvas-ui-calendar-allday [data-ui-id="trip"]')];
    assert.ok(short.drawn[1] < 20 && short.below === 44 && allDay.below === 44, `a quarter-hour event is drawn its length and found 44px down from its top; so is a chip in the all-day strip: ${JSON.stringify([short, allDay])}`);
    await page.evaluate(() => window.toaster.show({ message: 'Stand-up in five minutes', timeout: 0, actions: [{ id: 'snooze', label: 'Snooze' }, { id: 'open', label: 'Open' }] }));
    assert.deepEqual(await page.evaluate(() => window.menuOverToast()), ['cloudcanvas-ui-toast', 'cloudcanvas-ui-menu-panel'], 'where a menu opens over a toast, the menu is what is seen and pressed');
  }, { width: 390, height: 844 }, { hasTouch: true, isMobile: true }));

  test('menu: opens below its anchor with focus in it; a submenu opens beside its item; a far point is held in view; nothing moves', onPage(async (page) => {
    await page.focus('#menu-open');
    const on = await keys(page, 'Enter', 'ArrowDown');
    const [anchor, panel] = await page.evaluate(() => window.boxesOf('#menu-open, #menu-host [role="menu"]'));
    assert.deepEqual([panel[0], panel[1], on, await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)], [anchor[0], anchor[3], 'Move to', 'solid'], 'below its anchor, the keys in it, their item ringed');
    const inside = await keys(page, 'ArrowRight');
    const [, item, flyout] = await page.evaluate(() => window.boxesOf('#menu-host :is([role="menu"], [data-ui-id="move"])'));
    assert.deepEqual([inside, flyout[0], flyout[1], await page.evaluate(() => document.getAnimations().length)], ['Left', item[2], item[1], 0], 'the submenu starts where its item ends, level with it; nothing travelled there');
    assert.equal(await keys(page, 'ArrowLeft', 'Escape'), 'Tab actions', 'Escape steps out of the submenu, then closes the menu: focus is back on the anchor');
    const [corner] = await page.evaluate(() => { window.openMenu({ x: 5000, y: 5000 }); return window.boxesOf('#menu-host [role="menu"]'); });
    assert.ok(corner[2] <= 1092 && corner[3] <= 892 && corner[0] > 0 && corner[1] > 0, `a point past the corner: still inside: ${corner}`);
    await page.mouse.click(5, 5);
    assert.deepEqual((await log(page)).filter((entry) => entry[0] === 'menu-close'), [['menu-close', 'escape'], ['menu-close', 'outside']]);
  }));

  test('390px: no sideways scroll; every view fits; the dialog is a bottom sheet', onPage(async (page) => {
    const widths = await page.evaluate(() => window.widthsOf('.cloudcanvas-ui-kanban, .cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline, .cloudcanvas-ui-graph, .cloudcanvas-ui-composer, .cloudcanvas-ui-tabs'));
    assert.ok(widths.page <= 390, `page scrolls sideways: ${widths.page}`);
    assert.ok(widths.views.every((right) => right <= 390), `a view overflows: ${widths.views}`);
    await page.click('.cloudcanvas-ui-calendar-view[data-view="week"]');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 390, 'the week view fits');
    await page.click('#open-dialog');
    const panel = await page.locator('.cloudcanvas-ui-dialog-panel').boundingBox();
    assert.ok(panel.width <= 390 && panel.x >= 0, `dialog panel ${JSON.stringify(panel)}`);
    assert.ok(Math.abs(panel.y + panel.height - 844) <= 2, 'the dialog sits on the bottom edge');
  }, { width: 390, height: 844 }));
}
