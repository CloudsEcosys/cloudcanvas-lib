/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The xml add-on: tags name types, attributes are keys, slot-named children and loose text fill slots, other
 * children nest; nothing reaches markup (an html slot needs `{html: true}`), refused keys are skipped, and a
 * document that fails any check builds nothing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from 'cloudcanvas';
import { PLAIN_TAG, fromXml, parseXml } from '../../plugins/xml.js';
import { coreScene } from '../helpers/core-scene.js';

type('xml-note', { html: '<b data-slot="title"></b><p data-slot="body"></p><div data-scope></div>' });
type('xml-tag', { html: '<span data-slot="label"></span>' });
type('xml-rich', { html: '<div data-slot="content" data-slot-html></div>' });

test('xml - tags are types, attributes keys, slot children and loose text fill, other children nest', (t) => {
  const { app } = coreScene(t);
  const built = fromXml(app, `
    <board>
      <xml-note id="n1" x="10" y="20" w="100" z="2" drag="true" data-tone="warm">
        <title>Hi &amp; bye</title><body>Body</body>
        <xml-tag x="5" y="6">Label</xml-tag>
      </xml-note>
      <${PLAIN_TAG} x="1" y="2" w="3" h="4"/>
    </board>`);

  assert.equal(built.length, 2);
  assert.deepEqual(app.blits.map((b) => b.el), built.map((b) => b.el));
  const [note, plain] = built;
  assert.equal(note.el.id, 'n1');
  assert.deepEqual([note.x, note.y, note.z], [10, 20, 2]);
  assert.equal(note.el.getAttribute('data-type'), 'xml-note');
  assert.deepEqual(note.spec.fill, { title: 'Hi & bye', body: 'Body' });
  assert.equal(note.spec.drag, true);
  assert.equal(note.spec.tone, 'warm', 'a data- prefix is optional');
  const [tag] = note.blits;
  assert.deepEqual([tag.x, tag.y, tag.spec.fill.label], [5, 6, 'Label']);
  assert.equal(plain.el.hasAttribute('data-type'), false);
  assert.deepEqual([plain.x, plain.y, plain.spec.w, plain.spec.h], [1, 2, 3, 4]);
});

test('xml - no markup from XML: an html slot is skipped unless {html: true}; refused keys never land', (t) => {
  const { app } = coreScene(t);
  const hostile = '<b><xml-rich onclick="alert(1)" type="xml-note" with="x" fill="y" __proto__="z">'
    + '<content>&lt;img src=x onerror=alert(1)&gt;</content></xml-rich></b>';
  const [rich] = fromXml(app, hostile);
  assert.equal(rich.el.querySelector('img'), null);
  assert.equal(rich.el.querySelector('[data-slot="content"]').innerHTML, '');
  assert.equal(rich.el.getAttribute('data-type'), 'xml-rich', 'type comes from the tag alone');
  assert.equal(rich.el.onclick, null);
  assert.equal(rich.el.hasAttribute('onclick'), false, 'an attribute becomes a data key, never a handler');
  assert.equal(rich.el.getAttribute('data-onclick'), 'alert(1)');
  assert.equal(rich.el.hasAttribute('data-with'), false);
  assert.equal(Object.getPrototypeOf(rich.spec), Object.prototype);

  const [trusted] = fromXml(app, '<b><xml-rich><content>&lt;em&gt;ok&lt;/em&gt;</content></xml-rich></b>', { html: true });
  assert.equal(trusted.el.querySelector('em').textContent, 'ok');
});

test('xml - allowlists narrow tags and keys', (t) => {
  const { app } = coreScene(t);
  assert.throws(() => fromXml(app, '<b><xml-note/></b>', { types: ['xml-tag'] }), /<xml-note> is not a type/);
  const [tag] = fromXml(app, '<b><xml-tag x="1" y="2" drag="true" tone="x">Hi</xml-tag></b>', { types: ['xml-tag'], keys: ['tone'] });
  assert.deepEqual([tag.x, tag.y, tag.spec.tone, tag.spec.drag], [1, 2, 'x', undefined]);
});

test('xml - a document that fails any check builds nothing', (t) => {
  const { app } = coreScene(t);
  const bad = [
    ['<b><xml-note></b>', /xml: /],
    ['<b><xml-tag/><unknown-type/></b>', /<unknown-type> is not a type/],
    ['<b><xml-tag x="1"/><xml-tag x="left"/></b>', /x="left" is not a number/],
    [`<b>${'<blit/>'.repeat(4)}</b>`, /more than 3 elements/]
  ];
  for (const [source, error] of bad) assert.throws(() => fromXml(app, source, { limit: 3 }), error);
  assert.equal(app.blits.length, 0);
  assert.throws(() => parseXml(42), /expected a string/);
  assert.throws(() => fromXml(app, {}), /expected XML text/);
});

test('xml - a port attribute is honoured only for a name in ports: a port and a trait share one namespace', (t) => {
  const { app } = coreScene(t);
  const [refused] = fromXml(app, '<b><blit x="1" y="1" port="drag"/></b>');
  assert.equal(refused.spec.port, undefined);
  blit.use({ xmlTestPort: () => {} });
  const [allowed] = fromXml(app, '<b><blit x="1" y="1" port="xmlTestPort"/></b>', { ports: ['xmlTestPort'] });
  assert.equal(allowed.spec.port, 'xmlTestPort');
});
