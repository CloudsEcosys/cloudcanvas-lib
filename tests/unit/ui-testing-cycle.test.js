/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Every kit control an app mounts, mounted on the kit's own test document (`cloudcanvas/ui/testing`).
 *
 * The test document is the minimal DOM an app's `node` tests run on, and it carries what the kit asks of a document
 * and nothing else. A control's own suite runs on a real DOM, and an app's view test is the wrong place to find out
 * that the kit started asking for more: it would fail three calls below the thing the test is about. So the question
 * is asked here, once per control, with nothing else in the way: mount it in a host that is in the document, give it
 * the model its own header documents, and destroy it. A throw anywhere in that cycle fails the case and names the DOM
 * feature the test document is missing.
 *
 * It is the kit's case and not an app's: it first lived in Momentum as `tests/kit-mount.test.js`, which proved the
 * kit's own document mounts the kit's own controls. `ui-testing-mounts.test.js` holds what the controls added in
 * phase 28 asked of the document, `ui-testing-dom.test.js` each DOM call by itself; this file is the cycle of the
 * twenty-one the apps drew first, and the three cases that a stub would also have satisfied.
 *
 * WHAT IT DOES NOT CLAIM. Nothing here presses a key or drags a card, so what only an interaction reaches (pointer
 * capture, measured sizes, the speech service) is not established by this file. Nor is a native dialog: the document
 * has no `showModal`, and the kit opens the dialog by its `open` attribute instead, so that is the path the dialog
 * case takes.
 *
 * Proven red where it stood, in Momentum, on the document as it stood before the file: all nineteen failed (the
 * dialog's case first), each read
 *
 *   TypeError: A host element attached to a document is required
 *
 * (thrown by `documentOf`, which asks a host for its `ownerDocument`) and then, one feature at a time: `doc.getElementById
 * is not a function` (all nineteen again), `Cannot read properties of undefined (reading 'data')` where a node had no
 * `firstChild`, `(reading 'trim')` where a text area had no `value`, `(reading 'children')` where a node had no
 * `firstElementChild`, `doc.createDocumentFragment is not a function`, `doc.createElementNS is not a function` and
 * `g.viewport.getBoundingClientRect is not a function`.
 *
 * Moved with its cases, and seen to fail here with the document changed as each case says. On the kit the controls are
 * imported from `ui/index.js` itself, so a name the kit does not export fails the load with a SyntaxError, where it
 * was handed over as `undefined` through Momentum's seam.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDocument } from '../../ui/testing/index.js';
import {
  createBadge, createBreadcrumbs, createCalendar, createChips, createComposer, createDialog, createDrawer,
  createEmptyState, createGraph, createKanban, createMarkdownView, createMenu, createNavBar, createProgress,
  createResults, createSplitter, createStatus, createTabs, createTimeline, createTree, createVoiceInput,
} from '../../ui/index.js';

/** A callback that is never the subject: no case here triggers one. */
const noop = () => {};

/**
 * One row per control: its name, its factory, the callbacks it is created with and the model it is updated with.
 * Each model is the example in that control's own header, so "minimal and valid" is the kit's word. It is a function
 * of the document because two of them carry a node.
 *
 * @type {Array<[string, Function, object|undefined, (doc: any) => object]>}
 */
const CONTROLS = [
  ['createDialog', createDialog, { onClose: noop },
    (doc) => ({ open: true, title: 'Rename', content: doc.createElement('form') })],
  ['createTabs', createTabs, { onSelect: noop, onClose: noop },
    () => ({ label: 'Views', activeId: 'today', items: [{ id: 'today', label: 'Today' }] })],
  ['createSplitter', createSplitter, { onChange: noop },
    () => ({ value: 50, min: 20, max: 80, label: 'Resize panes' })],
  ['createResults', createResults, { onActivate: noop },
    () => ({ label: 'Matches', items: [{ id: 'a', label: 'Plan', detail: 'Note' }], activeId: 'a', emptyText: 'Nothing found' })],
  ['createStatus', createStatus, undefined,
    () => ({ status: 'error', message: 'Could not load.', retry: noop })],
  ['createBadge', createBadge, undefined,
    () => ({ count: 120, label: '{count} unread' })],
  ['createBreadcrumbs', createBreadcrumbs, { onOpen: noop },
    () => ({ label: 'Folder path', items: [{ id: 'p', label: 'Projects' }], current: 'Plan' })],
  ['createComposer', createComposer, { onSubmit: noop },
    () => ({ label: 'Message', placeholder: 'Write a message', contextKey: 'thread-1' })],
  ['createVoiceInput', createVoiceInput, { onApply: noop },
    () => ({ contextKey: 'thread-1', disabled: false })],
  ['createMarkdownView', createMarkdownView, { onTaskToggle: noop },
    () => ({ source: '# Plan\n\n- [ ] Call the printer\n- [x] Draft' })],
  ['createTree', createTree, { onActivate: noop, onToggle: noop },
    () => ({ label: 'Notebooks', expanded: ['w'], selectedId: 'p',
      items: [{ id: 'w', label: 'Work', count: 12 }, { id: 'p', parentId: 'w', label: 'Plan', tone: '2' }] })],
  ['createProgress', createProgress, undefined,
    () => ({ value: 3, max: 5, label: '3 of 5 done' })],
  ['createChips', createChips, { onToggle: noop, onRemove: noop },
    () => ({ label: 'Categories', items: [{ id: 'w', label: 'Work', tone: '3', pressed: true, removable: true }] })],
  ['createNavBar', createNavBar, { onSelect: noop },
    () => ({ label: 'Workspace views', activeId: 'today', placement: 'top',
      items: [{ id: 'today', label: 'Today' }, { id: 'people', label: 'People', badge: { count: 3, label: '{count} unread' } }] })],
  ['createEmptyState', createEmptyState, { onAction: noop },
    () => ({ title: 'No notes yet', body: 'Notes you write appear here.', actionLabel: 'New note' })],
  ['createKanban', createKanban, { onMove: noop, onActivate: noop },
    () => ({ label: 'Plan', columns: [{ id: 'todo', label: 'To do', cards: [{ id: 'a', title: 'Call' }] }] })],
  ['createCalendar', createCalendar, { onNavigate: noop, onPick: noop, onActivate: noop, onMove: noop },
    () => ({ view: 'month', date: '2026-09-29', events: [{ id: 'a', title: 'Call', start: '2026-09-29' }] })],
  ['createTimeline', createTimeline, { onActivate: noop, onChange: noop },
    () => ({ scale: 'week', items: [{ id: 'a', title: 'Draft', start: '2026-09-28', end: '2026-10-02', group: 'Writing' }] })],
  ['createGraph', createGraph, { onActivate: noop, onMove: noop },
    () => ({ nodes: [{ id: 'a', label: 'Plan' }, { id: 'b', label: 'Launch' }], edges: [{ from: 'a', to: 'b' }] })],
  // The drawer a menu of pages folds into. Its first model is a state, not a change, so nothing here travels.
  ['createDrawer', createDrawer, undefined,
    (doc) => ({ open: true, label: 'Menu', collapseTo: doc.createElement('button') })],
  // The tab menu and every item menu, with a submenu and a disabled entry.
  ['createMenu', createMenu, { onSelect: noop, onClose: noop },
    () => ({ open: true, label: 'Tab actions', items: [{ id: 'close', label: 'Close tab', disabled: true },
      { id: 'view', label: 'View in', items: [{ id: 'feed', label: 'Feed' }] }] })],
];

/**
 * Every event type something starts listening for on `target`, noted as it is asked for, so a case can say afterwards
 * which of them is still listened for.
 *
 * @param {any} target
 * @returns {Set<string>}
 */
function typesHeardOn(target) {
  /** @type {Set<string>} */ const types = new Set();
  const add = target.addEventListener;
  target.addEventListener = (/** @type {string} */ type, /** @type {any[]} */ ...rest) => {
    types.add(type);
    return add(type, ...rest);
  };
  return types;
}

/**
 * One whole cycle of one control - mount, model, destroy - in a document of its own, so every control is the first to
 * mount in its document and no case passes on what the one before it left behind.
 *
 * It returns what is judged at the two moments that matter: how many children the host has, and which event types the
 * control is listening for on the DOCUMENT - the one place a destroyed control can keep hearing from. While it is
 * mounted, the text it drew is kept too.
 *
 * @param {Function} create
 * @param {object|undefined} callbacks
 * @param {(doc: any) => object} model
 */
function cycle(create, callbacks, model) {
  const doc = installDocument();
  const host = doc.createElement('div');
  doc.body.append(host);
  const heard = typesHeardOn(doc);
  const now = () => ({
    children: host.childNodes.length,
    onDocument: [...heard].filter((type) => doc.listeners(type).length > 0),
  });
  const control = create(host, callbacks);
  control.update(model(doc));
  const mounted = { ...now(), text: String(host.textContent) };
  control.destroy();
  return { mounted, destroyed: now() };
}

test('every kit control an app mounts: the twenty-one are each once, and each the function its row names', () => {
  // Proven red in Momentum by taking `createGraph` out of the seam's re-export list:
  //   AssertionError: expected [ 'createGraph' ] to deeply equal []
  // and again for the twentieth, with `createDrawer` taken out of it, and for the twenty-first, with `createMenu`.
  assert.equal(new Set(CONTROLS.map(([name]) => name)).size, 21);
  assert.equal(CONTROLS.length, 21);
  const notThatFunction = CONTROLS
    .filter(([name, create]) => typeof create !== 'function' || create.name !== name)
    .map(([name]) => name);
  assert.deepEqual(notThatFunction, []);
});

for (const [name, create, callbacks, model] of CONTROLS) {
  test(`every kit control an app mounts: ${name} mounts, takes a model and is destroyed`, () => {
    const { mounted, destroyed } = cycle(create, callbacks, model);
    // It drew INTO THE HOST: a factory that returned a handle and mounted nothing would have made the three calls
    // without throwing too.
    assert.ok(mounted.children > 0, 'it drew nothing into its host');
    // TEARDOWN IS HALF THE CYCLE, and the half that fails quietly. A control that is still in the host, or still
    // listening on the document, throws nothing - it answers the next key press on behalf of a view that is gone.
    //
    // Proven red in Momentum with the document ignoring the `{signal}` a listener is added with, which is how the kit
    // lets go. Five of the nineteen there were then failed - the voice input on `visibilitychange`; the kanban,
    // calendar, timeline and graph on `keydown`:
    //   AssertionError: expected { children: +0, …(1) } to deeply equal { children: +0, onDocument: [] }
    //   -   "onDocument": [],
    //   +   "onDocument": [ "keydown" ],
    assert.deepEqual(destroyed, { children: 0, onDocument: [] });
  });
}

test('every kit control an app mounts: some listen on the document while mounted, so letting go is a claim about something', () => {
  // Most of the twenty-one bind nothing on the document, and for those the `onDocument: []` above is true before and
  // after. This is the count of the ones it is a real claim for.
  const listening = CONTROLS
    .filter(([, create, callbacks, model]) => cycle(create, callbacks, model).mounted.onDocument.length > 0);
  assert.ok(listening.length > 0, 'no control listens on the document: the teardown claim holds nothing');
});

/* ==========================================================================
 * TWO THINGS THE CYCLE NEEDS THAT A STUB WOULD ALSO SATISFY
 *
 * The cycle fails on a document with no `getElementById` and no `createDocumentFragment`. It does not fail on ones
 * that answer wrongly, so each is held to what it is for.
 * ========================================================================== */

test('test document: it gives a document one kit stylesheet, however many controls mount in it', () => {
  // EVERY CONTROL INJECTS THE SHEET ON ITS FIRST MOUNT IN A DOCUMENT, and it knows a mount is not the first by finding
  // the sheet by its id. A `getElementById` that found nothing would throw nothing: the document would grow a sheet per
  // mount.
  //
  // Proven red in Momentum with the document's `getElementById` answering null:
  //   AssertionError: expected 3 to be 1 // Object.is equality
  const doc = installDocument();
  for (const create of [createBadge, createProgress, createBadge]) {
    const host = doc.createElement('div');
    doc.body.append(host);
    create(host).destroy();
  }
  assert.equal(doc.head.childNodes.length, 1);
});

test('test document: it shows the words of a markdown view, which reach the tree through a fragment', () => {
  // THE ONE CONTROL THAT BUILDS OFF THE TREE. The view renders into a document fragment and inserts that, and
  // inserting a fragment puts its CHILDREN in the tree. A document that inserted the fragment itself would throw
  // nothing: the view would hold one child with no tag and no text.
  //
  // Proven red in Momentum with the document inserting a fragment as a node:
  //   AssertionError: expected '' to be 'PlanCall the printer' // Object.is equality
  const { mounted } = cycle(createMarkdownView, {}, () => ({ source: '# Plan\n\nCall the printer' }));
  assert.equal(mounted.text, 'PlanCall the printer');
});

test('test document: it turns a board column\'s heading into a button, in its own place, when the column comes to stand for an item', () => {
  // THE BOARD ASKS A HEADING'S LABEL WHAT IT IS (`localName`) AND PUTS ANOTHER IN ITS PLACE (`replaceWith`) when a
  // column that was only a column comes to stand for an item, or stops (kit `11cf55c`). With neither on the document,
  // every board mounted here died in its first draw. Proven red three ways, in Momentum:
  //   - with neither (the document as it stood), observed:
  //       TypeError: heading.firstChild.replaceWith is not a function
  //   - with `replaceWith` and no `localName`: a label is "not a span" on every draw, so each redraw makes a new one
  //     and whatever held the old is holding a node that has left the page, observed:
  //       AssertionError: expected [ 'SPAN', false, 2, 'Garden1' ] to deeply equal [ 'SPAN', true, 2, 'Garden1' ]
  //   - with a `replaceWith` that puts the new node at the end of its parent, observed:
  //       AssertionError: expected [ 'SPAN', null, 2, '11' ] to deeply equal [ 'BUTTON', 'garden', 2, 'Garden1' ]
  //       (the count had become the heading's first child, and was written over as its label)
  const doc = installDocument(), host = doc.createElement('div');
  doc.body.append(host);
  const board = createKanban(host, { onMove() {}, onActivate() {} });
  const draw = (itemId) => board.update({ label: 'Plan', columns: [{ id: 'col', label: 'Garden', ...(itemId ? { itemId } : {}), cards: [{ id: 'a', title: 'Beds' }] }] });
  const heading = () => host.querySelector('.cloudcanvas-ui-kanban-heading');
  const read = () => [heading().firstChild.tagName, heading().firstChild.getAttribute('data-ui-id'), heading().childNodes.length, heading().textContent];
  draw(null);
  const plain = heading().firstChild;
  draw(null);
  // A label that is what the model asks for is kept: the same node, drawn again.
  assert.deepEqual([plain.tagName, heading().firstChild === plain, heading().childNodes.length, heading().textContent], ['SPAN', true, 2, 'Garden1']);
  draw('garden');
  // The button stands where the label stood, before the count, and the label has left the page.
  assert.deepEqual(read(), ['BUTTON', 'garden', 2, 'Garden1']);
  assert.deepEqual([plain.parentNode, heading().firstChild.parentNode === heading()], [null, true]);
  // A heading that holds the focus and is still a button keeps it through a redraw (`matches('button.…')`).
  // Proven red in Momentum with the document's `matches` reading `button.class` as one tag name, observed:
  //   AssertionError: expected false to be true // Object.is equality
  heading().firstChild.focus(); draw('garden');
  assert.equal(doc.activeElement === heading().firstChild, true);
  draw(null);
  assert.deepEqual(read(), ['SPAN', null, 2, 'Garden1']);
  board.destroy();
});
