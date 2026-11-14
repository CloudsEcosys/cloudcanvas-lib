/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The archetypes as core types: `section` (a titled region its children nest
 * in) and `table` (a data table whose rows ride on its trait). Registration is
 * a call, never an import; every value is text.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { type } from 'cloudcanvas';
import {
  ARCHETYPE_STYLE_ID,
  SECTION_TYPE,
  TABLE_TYPE,
  registerArchetypes
} from '../../archetypes/index.js';
import { coreScene } from '../helpers/core-scene.js';

const XSS = '<img src=x onerror="alert(1)">';

/** Every row of a rendered table as arrays of cell text; the header first when there is one. */
function cells(table) {
  return Array.from(table.el.querySelectorAll('tr'))
    .map((row) => Array.from(row.children).map((cell) => cell.textContent));
}

test('archetypes - importing registers nothing; registerArchetypes defines both, once', () => {
  assert.equal(type(SECTION_TYPE), null);
  assert.equal(type(TABLE_TYPE), null);
  assert.equal(document.getElementById(ARCHETYPE_STYLE_ID), null);

  const [section, table] = registerArchetypes();
  assert.equal(section.el.tagName, 'TEMPLATE');
  assert.equal(section.el.getAttribute('data-type'), SECTION_TYPE);
  assert.equal(table.el.getAttribute('data-type'), TABLE_TYPE);
  assert.deepEqual(registerArchetypes(), [section, table], 'a second call re-registered');
  assert.equal(document.querySelectorAll(`#${ARCHETYPE_STYLE_ID}`).length, 1);
});

test('section - a titled <section> whose children nest in its body', (t) => {
  registerArchetypes();
  const { app } = coreScene(t);
  const section = app.blit({ type: SECTION_TYPE, fill: { title: XSS } });

  const heading = section.el.querySelector('h2');
  assert.equal(section.el.querySelector('section').className, 'cloudcanvas-section');
  assert.equal(heading.textContent, XSS);
  assert.equal(heading.children.length, 0, 'the title was parsed as markup');

  const child = section.blit({ type: TABLE_TYPE });
  assert.equal(child.el.parentElement, section.el.querySelector('[data-scope]'));
  assert.equal(child.parent, section);
  assert.deepEqual(section.spec.fill, { title: XSS });
});

test('table - columns and rows render as text cells, short rows padded', (t) => {
  registerArchetypes();
  const { app } = coreScene(t);
  const table = app.blit({
    type: TABLE_TYPE,
    fill: { caption: 'Plans' },
    table: { columns: ['Plan', 'Price'], rows: [['Free', 0], ['Pro'], [XSS, '$9', 'extra']] }
  });

  assert.equal(table.el.querySelector('caption').textContent, 'Plans');
  assert.deepEqual(cells(table), [['Plan', 'Price'], ['Free', '0'], ['Pro', ''], [XSS, '$9', 'extra']]);
  assert.equal(table.el.querySelector('td img'), null, 'a cell was parsed as markup');
  assert.equal(table.el.querySelector('th').getAttribute('scope'), 'col');
});

test('table - a write re-renders, and the spec carries the data', (t) => {
  registerArchetypes();
  const { app } = coreScene(t);
  const data = { columns: ['Day'], rows: [['Mon'], ['Tue']] };
  const table = app.blit({ type: TABLE_TYPE, table: data });

  table.set({ table: { columns: ['Day', 'Slot'], rows: [['Wed', '9:00']] } });
  assert.deepEqual(cells(table), [['Day', 'Slot'], ['Wed', '9:00']]);

  const copy = app.blit(table.spec);
  assert.deepEqual(copy.spec.table, { columns: ['Day', 'Slot'], rows: [['Wed', '9:00']] });
  assert.deepEqual(cells(copy), cells(table));
});

test('table - no data is an empty table; a malformed shape throws', (t) => {
  registerArchetypes();
  const { app } = coreScene(t);
  const empty = app.blit({ type: TABLE_TYPE });
  assert.deepEqual(cells(empty), []);

  assert.throws(() => app.blit({ type: TABLE_TYPE, table: { rows: 'nope' } }), /table: expected/);
  assert.throws(() => app.blit({ type: TABLE_TYPE, table: { columns: ['a'], rows: ['not a row'] } }), TypeError);
});
