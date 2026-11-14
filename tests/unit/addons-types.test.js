/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The display types add-on (`plugins/types.js`): card, media, raw and
 * vector-pointer are widgets rendering their contents. The build-once, inert
 * text, hostile colour and input-gated slot cases ported from
 * `display.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from 'cloudcanvas';
import { CLS, mountType, registerDisplayTypes } from '../../plugins/types.js';
import { contentOf, setContent, setContents } from '../../plugins/widget.js';
import { createPlaceholderDataURI } from 'cloudcanvas/primitives';
import { runFrame } from 'cloudcanvas/testing';
import { coreScene } from '../helpers/core-scene.js';
import { layout } from '../../plugins/layout.js';

test('display types - registered by a call, idempotently, as widgets', () => {
  assert.deepEqual(registerDisplayTypes(), ['card', 'media', 'vector-pointer', 'raw']);
  assert.deepEqual(registerDisplayTypes(), ['card', 'media', 'vector-pointer', 'raw'], 'a second call is a no-op');
  for (const name of ['card', 'media', 'vector-pointer', 'raw']) {
    assert.equal(type(name).el.getAttribute('data-type'), name);
    assert.ok(blit.use().includes(name.replace(/-(\w)/g, (_, c) => c.toUpperCase())), `${name} has no same-named trait`);
  }
  assert.throws(() => type('card', { html: '<p></p>' }), /already defined with different markup/);
});

test('display types - a card renders its contents as text, hiding what is empty', (t) => {
  registerDisplayTypes();
  const { app } = coreScene(t);
  const card = app.blit({ type: 'card', card: { title: 'Hi', body: '<img src=x onerror=alert(1)>' } });

  assert.equal(card.el.querySelector(`.${CLS.TITLE}`).textContent, 'Hi');
  assert.equal(card.el.querySelector('img'), null, 'a text field of the card took markup');
  assert.equal(card.el.querySelector(`.${CLS.BODY}`).textContent, '<img src=x onerror=alert(1)>');
  assert.equal(card.el.querySelector(`.${CLS.FOOTER}`).hidden, true);
  assert.equal(card.el.querySelector(`.${CLS.BADGE_SLOT}`).hidden, true);

  setContent(card, 'badge', { text: 'new', color: '#22c55e' });
  setContent(card, 'actionText', 'Go');
  assert.match(card.el.querySelector(`.${CLS.BADGE_SLOT}`).textContent, /new/);
  assert.equal(card.el.querySelector(`.${CLS.ACTION_BTN}`).getAttribute('data-action'), 'Go');
  assert.equal(card.el.querySelector(`.${CLS.FOOTER}`).hidden, false);
  assert.deepEqual(contentOf(card), { title: 'Hi', body: '<img src=x onerror=alert(1)>', badge: { text: 'new', color: '#22c55e' }, actionText: 'Go' });
  setContent(card, 'extra', 'kept');
  assert.equal(contentOf(card).extra, 'kept', 'a card holds any contents');
  assert.throws(() => setContent(card, '__proto__', 1), /not permitted/);
});

test('display types - markup only through raw, or a card given the html key', (t) => {
  registerDisplayTypes();
  const { app } = coreScene(t);
  const raw = app.blit({ type: 'raw', raw: { html: '<b>ok</b>' } });
  assert.equal(raw.el.querySelector(`.${CLS.HTML} b`).textContent, 'ok');

  const card = app.blit({ type: 'card', card: { title: 'T', html: '<em>m</em>' } });
  assert.equal(card.el.querySelector(`.${CLS.HTML} em`).textContent, 'm');
  assert.equal(card.el.querySelector(`.${CLS.HEADER}`).hidden, true);
  setContent(card, 'html', undefined);
  assert.equal(card.el.querySelector(`.${CLS.HTML}`).hidden, true);
  assert.equal(card.el.querySelector(`.${CLS.HEADER}`).hidden, false);
});

test('display types - media refuses a script URL; the gauge draws its needle and meter', (t) => {
  registerDisplayTypes();
  const { app } = coreScene(t);
  const media = app.blit({ type: 'media', media: { src: 'javascript:alert(1)', caption: 'c' } });
  assert.match(media.el.querySelector('img').getAttribute('src'), /^data:image/);
  assert.equal(media.el.querySelector(`.${CLS.CAPTION}`).textContent, 'c');

  const gauge = app.blit({ type: 'vector-pointer', vectorPointer: { angle: 90, magnitude: 40 } });
  assert.match(gauge.el.querySelector(`.${CLS.NEEDLE_SLOT}`).innerHTML, /<svg/);
  assert.equal(gauge.el.querySelector(`.${CLS.LABEL}`).textContent, 'Mag: 40.0');
});

test('display types - children go into the scope well after the content', (t) => {
  registerDisplayTypes();
  const { app, root } = coreScene(t);
  const card = app.blit({ type: 'card', card: { title: 'Parent' } });
  const child = card.blit({ type: 'card', card: { title: 'Child' } });
  runFrame(root, 1);
  assert.equal(child.el.parentElement, card.el.querySelector(`[data-scope]`));
  assert.equal(child.parent, card);
  assert.equal(card.el.querySelector(`.${CLS.TITLE}`).textContent, 'Parent', 'the parent rendered the child\'s title');
});

test('display types - mountType clones into the element and returns its slots', () => {
  registerDisplayTypes();
  const element = document.createElement('div');
  element.innerHTML = '<p>stale</p>';
  const template = document.createElement('template');
  template.innerHTML = '<h3 data-slot="title"></h3><span data-slot="badge"></span><p data-slot="caption"></p><i data-slot="title"></i>';
  const slots = mountType(template, element);

  assert.equal(element.textContent.includes('stale'), false, 'the old children survived');
  assert.deepEqual(Object.keys(slots).sort(), ['badge', 'caption', 'title']);
  assert.equal(Object.getPrototypeOf(slots), null);
  assert.equal(slots.title.tagName, 'H3', 'the first slot of a name does not win');
  assert.throws(() => mountType('never-registered', element), /no type "never-registered"/);
  mountType('card', element);
  assert.ok(element.querySelector(`.${CLS.TITLE}`), 'a registered name did not mount');
});

test('display types - a refused content key writes nothing; one arriving by the spec is dropped, not thrown', (t) => {
  registerDisplayTypes();
  const { app } = coreScene(t);
  const media = app.blit({ type: 'media', media: { title: 'Kept' } });
  const before = media.el.getAttribute('data-media');
  assert.throws(() => setContent(media, 'nonsense', 1), /not permitted/);
  assert.equal(media.el.getAttribute('data-media'), before);
  setContent(media, 'title', 'Still live');
  assert.equal(media.el.querySelector(`.${CLS.TITLE}`).textContent, 'Still live');

  const loaded = app.blit({ type: 'media', media: { title: 'T', nonsense: 1 } });
  assert.equal(loaded.el.querySelector(`.${CLS.TITLE}`).textContent, 'T');
  assert.doesNotThrow(() => loaded.set({ x: 5 }), 'a bad key kept every later write throwing');
});

test('display types - a card is a container by default: its well grows to hold its children', (t) => {
  blit.use({ layout });
  registerDisplayTypes();
  const { app, root } = coreScene(t);
  const card = app.blit({ type: 'card', card: { title: 'Box' } });
  assert.equal(card.spec.layout, 'free');
  const child = card.blit({ x: 10, y: 20, w: 50, h: 30 });
  runFrame(root, 1);
  runFrame(root, 1);
  const well = card.el.querySelector('[data-scope]');
  assert.ok(well.classList.contains('cc-populated'), 'the well was not granted');
  assert.equal(child.el.parentElement, well);
});

test('display types - INV-1: only the exact key "html" reaches markup; a padded or cased key is inert', (t) => {
  registerDisplayTypes();
  const { app } = coreScene(t);
  const card = app.blit({ type: 'card', card: { title: 'T' } });
  setContent(card, ' html ', '<b id="padded">x</b>');
  setContent(card, 'HTML', '<b id="cased">x</b>');
  assert.equal(card.el.querySelector('#padded, #cased'), null);
  assert.equal(card.el.querySelector(`.${CLS.HTML}`).hidden, true);
});

/* ------------------ RENDERING ------------------ */

const XSS = '<img src=x onerror="alert(1)">';

/** A root, and a maker of display blits on it: `make(name, contents)`. */
function displays(t) {
  registerDisplayTypes();
  const { app } = coreScene(t);
  return (name, contents) => app.blit({ type: name, [name.replace(/-(\w)/g, (_, c) => c.toUpperCase())]: contents });
}

const part = (b, className) => b.el.querySelector(`.${className}`);

test('display types - a card builds its nodes once and mutates them after, hiding what is empty', (t) => {
  const make = displays(t);
  const card = make('card', { title: 'Zero', body: 'body 0', author: 'ada', actionText: 'Go' });
  const nodes = Array.from(card.el.querySelectorAll('*'));
  for (let i = 1; i <= 20; i += 1) {
    setContents(card, { title: `Title ${i}`, body: `body ${i}`, author: `author ${i}`, actionText: `Act ${i}` });
  }
  assert.deepEqual(Array.from(card.el.querySelectorAll('*')), nodes, 'an update rebuilt the subtree');
  assert.equal(part(card, CLS.TITLE).textContent, 'Title 20');
  assert.equal(part(card, CLS.ACTION_BTN).getAttribute('data-action'), 'Act 20');

  setContents(card, { body: '', author: '', actionText: '' });
  assert.deepEqual([part(card, CLS.BODY).hidden, part(card, CLS.FOOTER).hidden, part(card, CLS.ACTION_BTN).hidden], [true, true, true]);
  assert.deepEqual(Array.from(card.el.querySelectorAll('*')), nodes, 'hiding a section rebuilt the subtree');
});

test('display types - every text value renders inert, in every type', (t) => {
  const make = displays(t);
  const card = make('card', { title: XSS, body: XSS, author: XSS, actionText: XSS });
  assert.equal(card.el.querySelector('img'), null, 'a content value became a live element');
  assert.ok(card.el.textContent.includes(XSS));
  assert.equal(part(card, CLS.ACTION_BTN).getAttribute('data-action'), XSS);

  const media = make('media', { title: 'M', caption: XSS, alt: XSS, badge: { text: XSS, color: '#eab308' } });
  assert.equal(media.el.querySelectorAll('img').length, 1, 'only the media img may exist');
  assert.equal(part(media, CLS.MEDIA).getAttribute('alt'), XSS);

  const vector = make('vector-pointer', { title: 'V', label: XSS, angle: 10, magnitude: 20 });
  assert.equal(vector.el.querySelector('img'), null);
  assert.ok(vector.el.textContent.includes(XSS));
});

test('display types - a hostile badge or vector colour cannot break out; a valid one reaches every slot', (t) => {
  const make = displays(t);
  t.after(() => { delete globalThis.__xssColor; });
  const card = make('card', { title: 'C', badge: { text: 'B', color: '#fff;"><img src=q onerror=window.__xssColor=1>' } });
  const badge = part(card, CLS.BADGE_SLOT);
  assert.equal(badge.querySelector('img'), null, 'the colour payload became a live element');
  assert.ok(!badge.innerHTML.includes('onerror'));
  assert.ok(badge.innerHTML.includes('#38bdf8'), 'the badge did not fall back to the accent colour');
  assert.equal(globalThis.__xssColor, undefined);

  const vector = make('vector-pointer', { title: 'V', angle: 30, magnitude: 40, color: '#fff" onload="window.__xss=1' });
  const slots = [CLS.NEEDLE_SLOT, CLS.METER_SLOT, CLS.BADGE_SLOT].map((name) => part(vector, name));
  assert.equal(slots[0].querySelector('line').getAttribute('stroke'), '#38bdf8', 'the stroke did not fall back');
  assert.ok(slots.every((slot) => !slot.innerHTML.includes('onload')), 'an attribute was injected');
  setContent(vector, 'color', 'var(--cc-accent)');
  assert.ok(slots.every((slot) => slot.innerHTML.includes('var(--cc-accent)')));
});

test('display types - a media src is validated as a URL', (t) => {
  const make = displays(t);
  const media = make('media', { title: 'M' });
  const image = part(media, CLS.MEDIA);
  setContent(media, 'src', 'data:text/html,<script>window.__xssSrc=1</script>');
  assert.equal(image.getAttribute('src'), createPlaceholderDataURI(), 'a data:text/html URL reached src');
  setContent(media, 'src', 'https://example.test/a.avif');
  assert.equal(image.getAttribute('src'), 'https://example.test/a.avif', 'a valid URL was rejected');
});

test('display types - an SVG slot re-renders only when its own inputs change', (t) => {
  const make = displays(t);
  const card = make('card', { title: 'Slots', badge: { text: 'Live', color: '#38bdf8' } });
  const badge = part(card, CLS.BADGE_SLOT);
  const node = badge.firstElementChild;
  setContent(card, 'title', 'Slots changed');
  assert.equal(badge.firstElementChild, node, 'unrelated content re-rendered the badge slot');
  setContent(card, 'badge', { text: 'Live', color: '#f43f5e' });
  assert.ok(badge.innerHTML.includes('#f43f5e'), 'a badge colour change did not reach the slot');
  setContent(card, 'badge', undefined);
  assert.deepEqual([badge.innerHTML, badge.hidden], ['', true]);

  const vector = make('vector-pointer', { title: 'Needle', color: '#06b6d4', angle: 45, magnitude: 60 });
  const [needle, meter] = [part(vector, CLS.NEEDLE_SLOT), part(vector, CLS.METER_SLOT)];
  const [needleMarkup, meterMarkup] = [needle.innerHTML, meter.innerHTML];
  assert.ok(needleMarkup.includes('rotate(45.0deg)'));
  setContent(vector, 'title', 'Needle 2');
  assert.deepEqual([needle.innerHTML, meter.innerHTML], [needleMarkup, meterMarkup], 'a title change re-rendered a gauge slot');
  setContent(vector, 'angle', 90);
  assert.ok(needle.innerHTML.includes('rotate(90.0deg)'));
  assert.equal(meter.innerHTML, meterMarkup, 'a rotation re-rendered the meter');
  setContent(vector, 'magnitude', 100);
  assert.notEqual(meter.innerHTML, meterMarkup);
  assert.equal(part(vector, CLS.LABEL).textContent, 'Mag: 100.0');
});

test('display types - a card from markup with author children gets its structure, and the rest of the markup still adopts', (t) => {
  registerDisplayTypes();
  const { app } = coreScene(t, '<div data-blit id="a" data-type="card" data-card=\'{"title":"A"}\'><em>author</em></div>'
    + '<div data-blit id="b" data-x="40">after</div>');
  const a = app.find('a');
  assert.equal(a.el.querySelector(`.${CLS.TITLE}`).textContent, 'A');
  assert.equal(a.el.querySelector('em').textContent, 'author', 'the author children were lost');
  assert.equal(app.find('b').x, 40, 'the markup after the card was never adopted');
});
