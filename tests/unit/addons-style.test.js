/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The style add-on on core blits: one whitelist, direct inline properties, a
 * trait whose cleanup takes off what it wrote, and a spec round trip through
 * `data-style`. Ported from the 0.4 style suite.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import {
  BEVEL_PRESETS, STYLE_PROPERTIES, getStyle, isStyleProperty, setStyle, style, styleMap, stylePropertyInfo
} from '../../plugins/style.js';
import { coreScene } from '../helpers/core-scene.js';

blit.use({ style });

test('style - the property table and the whitelist are one source', () => {
  for (const entry of STYLE_PROPERTIES) {
    assert.equal(isStyleProperty(entry.property), true, `${entry.property} should be allowed`);
    assert.equal(stylePropertyInfo(entry.property), entry);
  }
  assert.equal(isStyleProperty('position'), false);
  assert.equal(isStyleProperty('width'), false);
  assert.ok(BEVEL_PRESETS.length > 0 && BEVEL_PRESETS.every((preset) => preset.label && typeof preset.value === 'string'));
});

test('style - a property off the whitelist is rejected, not written', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({});
  assert.throws(() => setStyle(card, 'position', 'absolute'), /not a styleable property/);
  assert.throws(() => getStyle(card, 'content'), /not a styleable property/);
  assert.throws(() => card.set({ style: { radius: 4, position: 'fixed' } }), /not a styleable property/);
  assert.equal(card.el.style.getPropertyValue('position'), '');
  assert.equal(card.el.style.getPropertyValue('border-radius'), '', 'a bad map wrote its good keys');
  assert.equal(card.el.hasAttribute('data-style'), false, 'the refused map stayed in the spec');
});

test('style - a value that is neither a string nor a finite number is rejected', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({});
  assert.throws(() => setStyle(card, 'border-radius', {}), /must be a string or a finite number/);
  assert.throws(() => setStyle(card, 'border-radius', NaN), /must be a string or a finite number/);
});

test('style - set({style}) writes the property directly inline, where it outranks the sheet', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ style: { radius: 18 } });
  assert.equal(card.el.style.getPropertyValue('border-radius'), '18px');
  assert.equal(card.el.style.getPropertyValue('--cc-radius-md'), '');
  assert.equal(getStyle(card, 'borderRadius'), '18px', 'camel case names the same property');
});

test('style - a bevel preset is written as its box-shadow value', (t) => {
  const { app } = coreScene(t);
  const raised = BEVEL_PRESETS.find((preset) => preset.label === 'Raised');
  const card = app.blit({ style: { shadow: raised.value } });
  assert.equal(card.el.style.getPropertyValue('box-shadow'), raised.value);
});

test('style - an empty value clears the override', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({});
  setStyle(card, 'color', '#ff0000');
  assert.equal(getStyle(card, 'color'), '#ff0000');
  assert.equal(setStyle(card, 'color', ''), '');
  assert.equal(getStyle(card, 'color'), '');
});

test('style - setStyle returns what is in force, not the raw input, when the CSSOM rejects it', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({});
  const returned = setStyle(card, 'border-radius', 'banana');
  assert.equal(card.el.style.getPropertyValue('border-radius'), '',
    'happy-dom kept an invalid border-radius, so this test no longer proves the point');
  assert.equal(returned, '');
});

test('style - stopping the trait removes every property it wrote, and a new map replaces the old', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ style: { padding: 12, radius: 4 } });
  card.set({ style: { radius: 9 } });
  assert.equal(card.el.style.getPropertyValue('padding'), '', 'the replaced map left its padding');
  assert.equal(card.el.style.getPropertyValue('border-radius'), '9px');
  card.set({ style: false });
  assert.equal(card.el.style.getPropertyValue('border-radius'), '');
  assert.deepEqual(styleMap(card), {});
});

test('style - align-self is written inline whether or not the blit is a flow child', (t) => {
  const { app, host } = coreScene(t);
  const card = app.blit({ style: { 'align-self': 'center' } });
  assert.equal(card.parent.el, host, 'a top-level blit is no flow child');
  assert.equal(card.el.style.getPropertyValue('align-self'), 'center');
});

test('style - a box-changing property queues a re-measure; a paint-only one does not', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({});
  root.measure.clear();
  setStyle(card, 'border-radius', '4px');
  assert.equal(root.measure.size, 0, 'a paint-only write re-measured');
  setStyle(card, 'padding', '20px');
  assert.equal(root.measure.size, 1, 'a box-changing write owed no re-measure');
});

test('style - styleMap returns only the overrides that are set', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({});
  assert.deepEqual(styleMap(card), {});
  card.set({ style: { radius: 10, 'align-self': 'end' } });
  assert.deepEqual(styleMap(card), { 'border-radius': '10px', 'align-self': 'end' });
});

test('style - the map round-trips through the spec as data-style', (t) => {
  const { app } = coreScene(t);
  const source = app.blit({ style: { radius: 10, color: '#123456', padding: '' } });
  const spec = source.spec;
  assert.deepEqual(spec.style, { radius: 10, color: '#123456', padding: '' });
  const copy = app.blit(spec);
  assert.equal(getStyle(copy, 'border-radius'), '10px');
  assert.equal(getStyle(copy, 'color'), '#123456');
  assert.equal(getStyle(copy, 'padding'), '', 'the empty value was written');
});
