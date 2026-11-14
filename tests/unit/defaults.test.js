/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `cloudcanvas-lib/defaults` (`defaults.js`): the one module with a side
 * effect on import. Every other entry point names nothing: `cloudcanvas` and
 * each add-on subpath leave `blit.use()`, the action registry and the type
 * table empty until the defaults are imported, and then every add-on is named,
 * the display types are defined and the built-in actions are registered. The
 * import checks run in a fresh Node process, because this suite's own setup
 * installs the defaults.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blit } from 'cloudcanvas';
import { DEFAULT_TRAITS } from '../../defaults.js';
import { drag } from '../../plugins/drag.js';
import { pan } from '../../plugins/pan.js';
import { gap, layout } from '../../plugins/layout.js';
import { svgState } from '../../plugins/svg-state.js';
import { coreScene } from '../helpers/core-scene.js';
import { stateOf } from 'cloudcanvas/kernel';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PACKAGE = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

/** Every add-on and UI kit subpath (the defaults are the root's `defaults.js`), as the file it resolves to. */
const ADDON_FILES = Object.values(PACKAGE.exports)
  .filter((file) => /^\.\/(plugins|ui)\/.+\.js$/.test(file));

const DISPLAY_TYPES = ['card', 'media', 'vector-pointer', 'raw'];
const BUILT_IN_ACTIONS = ['set-content', 'set-style', 'toggle-visibility', 'focus', 'increment-counter', 'notify', 'navigate-page'];

/** Run an ES module body in a fresh Node process at the repository root, under a DOM; its stdout as JSON. */
function inFreshProcess(body) {
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', body], { cwd: ROOT, encoding: 'utf8' });
  return JSON.parse(output);
}

/** The names, actions and display types in force after `imports`. */
const NAMES_AFTER = (imports) => `
  const { GlobalRegistrator } = await import('@happy-dom/global-registrator');
  GlobalRegistrator.register({ url: 'http://localhost/' });
  const { blit, type } = await import('cloudcanvas');
  const { actionRegistry } = await import('./plugins/actions.js');
  ${imports}
  console.log(JSON.stringify({
    names: blit.use(),
    actions: actionRegistry.list().map((each) => each.type),
    types: ${JSON.stringify(DISPLAY_TYPES)}.filter((name) => type(name) !== null)
  }));
  await GlobalRegistrator.unregister();
`;

test('defaults - importing the core and every add-on subpath names nothing', () => {
  const imports = ADDON_FILES.map((file) => `await import('${file}');`).join('\n');
  assert.ok(ADDON_FILES.includes('./plugins/drag.js'), 'the subpath list is not the package exports');
  assert.deepEqual(inFreshProcess(NAMES_AFTER(imports)), { names: [], actions: [], types: [] });
});

test('defaults - importing the defaults names every add-on, the display types and the built-in actions', () => {
  const found = inFreshProcess(NAMES_AFTER(`await import('./defaults.js');`));
  assert.deepEqual(found.names, [...Object.keys(DEFAULT_TRAITS), 'card', 'media', 'vectorPointer', 'raw']);
  assert.deepEqual(found.actions, BUILT_IN_ACTIONS);
  assert.deepEqual(found.types, DISPLAY_TYPES);
});

test('defaults - DEFAULT_TRAITS is frozen and names each add-on by its own export', () => {
  assert.ok(Object.isFrozen(DEFAULT_TRAITS));
  assert.equal(DEFAULT_TRAITS.drag, drag);
  assert.equal(DEFAULT_TRAITS.pan, pan);
  assert.equal(DEFAULT_TRAITS.layout, layout);
  assert.equal(DEFAULT_TRAITS.gap, gap);
  assert.equal(DEFAULT_TRAITS.svgState, svgState);
  for (const [name, fn] of Object.entries(DEFAULT_TRAITS)) assert.equal(typeof fn, 'function', name);
  assert.doesNotThrow(() => blit.use(DEFAULT_TRAITS), 'naming the same pairs again is not a no-op');
});

test('defaults - markup alone starts the named traits; a spec alone makes a display card', (t) => {
  const { app } = coreScene(t, '<div id="note" data-blit data-drag data-select data-x="40"></div>');
  app.set({ pan: true, keyboard: true });
  const note = app.find('note');
  const running = Array.from(stateOf(note.el).cleanups.keys());
  assert.deepEqual(running.sort(), ['drag', 'select'], `running: ${running.join(', ')}`);
  assert.equal(note.x, 40);
  assert.ok(['pan', 'keyboard'].every((name) => stateOf(app.el).cleanups.has(name)));

  const card = app.blit({ type: 'card', card: { title: 'Hi' }, drag: true });
  assert.ok(stateOf(card.el).cleanups.has('card') && stateOf(card.el).cleanups.has('drag'));
  assert.equal(card.el.textContent.includes('Hi'), true, 'the card did not render its title');
});
