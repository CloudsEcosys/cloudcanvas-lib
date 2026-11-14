/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The edit add-on on core blits: while a blit is edited, a widget render into it
 * is deferred, and `end` replays the last one exactly once. Driven through a real
 * `defineWidget` whose render rebuilds its host - the shape an editor cannot
 * survive. Ported from the edit-lock half of `content-funnel.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { EDITING_ATTR, EDIT_EVENT, begin, deferRender, edit, editNode, end, isEditing } from '../../plugins/edit.js';
import { defineWidget } from '../../display/widget.js';
import { coreScene, signals } from '../helpers/core-scene.js';

blit.use({ edit });

const renders = { count: 0 };

/** A widget whose render throws its host's content away and rebuilds it. */
const rebuilder = defineWidget({
  name: 'rebuilder',
  html: '<p></p>',
  allowedKeys: ['body'],
  bind: (host) => ({ host }),
  render: ({ host }, contents) => {
    renders.count += 1;
    const line = document.createElement('p');
    line.textContent = String(contents.get('body') ?? '');
    host.replaceChildren(line);
  }
});

function widget(t, body) {
  const { app } = coreScene(t);
  rebuilder.define();
  return { app, card: app.blit({ type: 'rebuilder', rebuilder: { body } }) };
}

test('edit - a live editor survives every widget write made during the edit', (t) => {
  const { card } = widget(t, 'first');
  const before = renders.count;
  const input = document.createElement('input');
  input.value = 'half-typed';
  card.el.appendChild(input);

  assert.equal(begin(card, input), true);
  assert.equal(isEditing(card), true);
  assert.equal(editNode(card), input);
  for (const body of ['second', 'third', 'fourth']) card.set({ rebuilder: { body } });

  assert.equal(renders.count, before, 'a render ran into a live editor');
  assert.equal(input.parentNode, card.el, 'the editor was destroyed mid-edit');
  assert.equal(input.value, 'half-typed');

  assert.equal(end(card), true);
  assert.equal(isEditing(card), false);
  assert.equal(editNode(card), null);
  assert.equal(renders.count, before + 1, 'the deferred renders did not collapse into one');
  assert.equal(card.el.textContent, 'fourth');
});

test('edit - an edit that changed nothing owes no render; ending no edit is a no-op', (t) => {
  const { card } = widget(t, 'unchanged');
  const before = renders.count;
  begin(card);
  assert.equal(end(card), true);
  assert.equal(renders.count, before, 'an idle edit cost a render');
  assert.equal(end(card), false);
  assert.equal(renders.count, before);
});

test('edit - begin is idempotent and keeps the deferred work and its node', (t) => {
  const { card } = widget(t, 'one');
  const seen = signals(card, 'edit');
  const before = renders.count;
  const first = document.createElement('input');
  assert.equal(begin(card, first), true);
  card.set({ rebuilder: { body: 'two' } });

  assert.equal(begin(card, document.createElement('textarea')), false);
  assert.equal(editNode(card), first, 're-entry retargeted the edit');
  assert.deepEqual(seen.map((each) => each.payload), [true], 're-entry announced a second edit');
  end(card);
  assert.equal(renders.count, before + 1, 're-entry dropped the deferred render');
  assert.equal(card.el.textContent, 'two');
});

test('edit - the event is emitted on the blit and bubbles, once per transition, under one name', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({});
  const seen = signals(app, 'edit');
  begin(card);
  begin(card);
  end(card);
  end(card);
  assert.deepEqual(seen.map((each) => each.payload), [true, false]);
  assert.equal(EDIT_EVENT, 'edit');
});

test('edit - data-editing mirrors the lock on the element', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({});
  begin(card);
  assert.equal(card.el.hasAttribute(EDITING_ATTR), true);
  end(card);
  assert.equal(card.el.hasAttribute(EDITING_ATTR), false);
});

test('edit - deferRender answers false and keeps nothing when no edit is open', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({});
  let ran = 0;
  assert.equal(deferRender(card, () => { ran += 1; }), false);
  begin(card);
  end(card);
  assert.equal(ran, 0, 'a replay recorded outside an edit ran at its end');
});

test('edit - the trait begins on an editor taking focus and ends when focus leaves the blit', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ edit: true });
  const input = document.createElement('input');
  const other = document.createElement('input');
  card.el.append(input, other);
  input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  assert.equal(editNode(card), input);
  input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: other }));
  assert.equal(isEditing(card), true, 'focus moving inside the blit ended the edit');
  other.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
  assert.equal(isEditing(card), false);
});

test('edit - removing a blit mid-edit closes the lock before it leaves', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ edit: true });
  const seen = signals(app, 'edit');
  begin(card);
  card.remove();
  assert.equal(isEditing(card), false, 'the removed blit still holds the lock');
  assert.deepEqual(seen.map((each) => each.payload), [true, false], "removal never announced the edit's end");
});
