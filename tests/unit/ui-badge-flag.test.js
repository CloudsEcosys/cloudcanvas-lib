/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Badge shapes: the pill is what it always was, to the byte; the flag draws
 * the same figure inside an inline SVG marker - a staff under a finial, a
 * pennant that grows with the figure, a notch cut into its trailing edge -
 * given depth by light and shade, coloured by the sheet alone, standing in
 * front of what it is planted on, and silent to assistive technology.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { SR_ONLY_CLASS, UI_CSS, UI_TOKENS, createBadge } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const FLAG = 'cloudcanvas-ui-badge-flag';

/** The pill's markup as it was before a badge had a shape: each model beside what it draws. */
const PILLS = Object.freeze([
  [{ count: 5, label: '{count} unread' },
    '<span class="cloudcanvas-ui-badge"><span class="cloudcanvas-ui-badge-figure" aria-hidden="true">5</span><span class="cloudcanvas-ui-sr-only">5 unread</span></span>'],
  [{ count: 120, tone: 'danger', live: true },
    '<span class="cloudcanvas-ui-badge" role="status" aria-live="polite" data-tone="danger"><span class="cloudcanvas-ui-badge-figure" aria-hidden="true">99+</span><span class="cloudcanvas-ui-sr-only">120</span></span>'],
  [{ count: 3, dot: true, tone: 'warning' },
    '<span class="cloudcanvas-ui-badge is-dot" data-tone="warning"><span class="cloudcanvas-ui-badge-figure" aria-hidden="true"></span><span class="cloudcanvas-ui-sr-only">3</span></span>'],
  [{ count: 0 },
    '<span class="cloudcanvas-ui-badge" hidden=""><span class="cloudcanvas-ui-badge-figure" aria-hidden="true">0</span><span class="cloudcanvas-ui-sr-only"></span></span>']
]);

/** Every rule of the kit sheet, comments aside, as its selector and its declarations; and those that draw the flag. */
const RULES = [...UI_CSS.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selector, body]) => ({ selector: selector.trim(), body }));
const FLAG_RULES = RULES.filter((rule) => rule.selector.includes(FLAG) || rule.selector.includes('[data-shape="flag"]'));
const bodyOf = (selector) => RULES.find((rule) => rule.selector === selector)?.body ?? '';

/** A flag badge's parts, and its size as the SVG states it. */
function flagOf(host) {
  const root = host.querySelector('.cloudcanvas-ui-badge');
  const svg = root.querySelector(`.${FLAG}`);
  return { root, svg, figure: root.querySelector('.cloudcanvas-ui-badge-figure'), spoken: root.querySelector(`.${SR_ONLY_CLASS}`),
    width: Number(svg?.getAttribute('width')), height: Number(svg?.getAttribute('height')) };
}

test('badge: the pill is the default, and with or without its name it draws exactly what it drew', (t) => {
  for (const shape of [undefined, 'pill', 'star']) {
    const host = mount(t);
    const badge = createBadge(host);
    for (const [model, markup] of PILLS) {
      badge.update(shape === undefined ? model : { ...model, shape });
      assert.equal(host.innerHTML, markup, `shape ${String(shape)}: ${JSON.stringify(model)}`);
    }
    badge.destroy();
  }
});

test('badge: a flag is an inline SVG marker - staff, pennant and figure - that assistive technology never meets', (t) => {
  const host = mount(t);
  const badge = createBadge(host);
  badge.update({ count: 9, label: '{count} unread', shape: 'flag' });
  const { root, svg, figure, spoken } = flagOf(host);
  assert.equal(root.getAttribute('data-shape'), 'flag', 'where the sheet looks for the shape');
  assert.ok(svg, 'the flag is drawn');
  assert.equal(svg.namespaceURI, SVG_NS);
  assert.equal(svg.localName, 'svg');
  assert.equal(svg.getAttribute('aria-hidden'), 'true');
  assert.equal(svg.getAttribute('focusable'), 'false');
  assert.equal(figure.contains(svg), true, 'the marker is the figure: it sits where the eye already looked');
  assert.equal(figure.getAttribute('aria-hidden'), 'true');
  for (const part of ['staff', 'pennant', 'figure']) {
    const node = svg.querySelector(`.${FLAG}-${part}`);
    assert.ok(node, `the ${part} is drawn`);
    assert.equal(node.namespaceURI, SVG_NS, `the ${part} is SVG, not an unknown HTML element`);
  }
  assert.equal(svg.querySelectorAll(`.${FLAG}-staff`).length, 2, 'the staff is a rod under a finial');
  assert.equal(svg.querySelector(`.${FLAG}-figure`).localName, 'text');
  assert.equal(svg.querySelector(`.${FLAG}-figure`).textContent, '9');
  assert.equal(figure.textContent, '9', 'the figure is written once');
  assert.equal(spoken.textContent, '9 unread', 'the ear hears what it heard from the pill');
  badge.update({ count: 120, label: '{count} unread', shape: 'flag' });
  assert.equal(figure.textContent, '99+');
  assert.equal(spoken.textContent, '120 unread');
  assert.equal(root.querySelectorAll(`.${FLAG}`).length, 1, 'one marker, however often it is redrawn');
  badge.destroy();
});

test('badge: the flag is sized to its figure in whole pixels, and a dot is an empty pennant', (t) => {
  const host = mount(t);
  const badge = createBadge(host);
  const sizes = {};
  for (const count of [9, 42, 120]) {
    badge.update({ count, shape: 'flag' });
    const { svg, width, height, figure } = flagOf(host);
    sizes[figure.textContent] = width;
    assert.ok(Number.isInteger(width) && Number.isInteger(height), `${figure.textContent}: ${width}x${height} lands on the pixel grid`);
    assert.equal(svg.getAttribute('viewBox'), `0 0 ${width} ${height}`, 'one unit is one pixel: nothing is resampled at 1x or 2x');
    assert.ok(height >= 16 && height <= 22, `a ${height}px marker holds a 16px pennant and its staff`);
  }
  assert.ok(sizes['9'] >= 18 && sizes['9'] <= 20, `one digit is about the smallest flag: ${sizes['9']}`);
  assert.ok(sizes['42'] > sizes['9'] && sizes['99+'] > sizes['42'], `the pennant grows with the figure: ${JSON.stringify(sizes)}`);
  badge.update({ count: 3, dot: true, label: '{count} alerts', shape: 'flag' });
  const dot = flagOf(host);
  assert.equal(dot.svg.querySelector(`.${FLAG}-figure`).textContent, '', 'a dot draws no figure');
  assert.ok(dot.svg.querySelector(`.${FLAG}-pennant`).getAttribute('d'), 'and keeps its pennant');
  assert.ok(dot.width >= 16 && dot.width <= sizes['9'], `an empty pennant is the smallest flag: ${dot.width}`);
  assert.equal(dot.spoken.textContent, '3 alerts', 'and is still spoken');
  badge.update({ count: 0, shape: 'flag' });
  assert.equal(dot.root.hidden, true, 'no count, no flag');
  badge.destroy();
});

test('badge: the flag has depth - a sheen of its own, lit and shaded parts, a cast shadow - drawn in light and shade the sheet names', (t) => {
  const host = mount(t);
  const first = createBadge(host);
  const second = createBadge(host);
  first.update({ count: 4, shape: 'flag' });
  second.update({ count: 4, shape: 'flag' });
  const [one, two] = [...host.querySelectorAll(`.${FLAG}`)];
  const sheen = one.querySelector('defs linearGradient');
  assert.ok(sheen?.id, 'the sheen is a gradient the marker carries');
  assert.notEqual(sheen.id, two.querySelector('defs linearGradient').id, 'each flag has its own: an id is the document\'s');
  const lit = one.querySelector(`path[fill="url(#${sheen.id})"]`);
  assert.ok(lit, 'and lays it over the cloth');
  assert.equal(lit.getAttribute('d'), one.querySelector(`.${FLAG}-pennant`).getAttribute('d'), 'edge to edge');
  assert.deepEqual([...sheen.querySelectorAll('stop')].map((stop) => stop.getAttribute('class')),
    [`${FLAG}-lit`, `${FLAG}-lit`, `${FLAG}-shaded`, `${FLAG}-shaded`], 'light above, shade below');
  assert.ok(one.querySelectorAll(`:not(stop).${FLAG}-lit`).length >= 2, 'the top edge and the staff are lit');
  assert.ok(one.querySelectorAll(`:not(stop).${FLAG}-shaded`).length >= 2, 'the hoist and the folded tail are in shade');
  for (const node of one.querySelectorAll(`.${FLAG}-lit, .${FLAG}-shaded`)) {
    const strength = Number(node.getAttribute(node.localName === 'stop' ? 'stop-opacity' : 'opacity'));
    assert.ok(strength >= 0 && strength < 1, `light and shade lie over the tone, they do not replace it: ${strength}`);
  }
  assert.match(bodyOf(`.${FLAG}`), /filter: drop-shadow\([^;]*var\(--cc-ui-flag-shadow, [^;]+\)/, 'the marker casts a shadow');
  assert.match(bodyOf(`.${FLAG}-lit`), /fill: var\(--cc-ui-flag-light, [^;]+;\s*stop-color: var\(--cc-ui-flag-light, /);
  assert.match(bodyOf(`.${FLAG}-shaded`), /fill: var\(--cc-ui-flag-shade, [^;]+;\s*stop-color: var\(--cc-ui-flag-shade, /);
  for (const name of ['--cc-ui-flag-light', '--cc-ui-flag-shade', '--cc-ui-flag-shadow']) assert.equal(UI_TOKENS[name]?.category, 'color', `${name} is catalogued`);
  first.destroy();
  second.destroy();
});

test('badge: the flag stands in front of what it is planted on, and rises out of it by the room a host gives', () => {
  const flag = bodyOf('.cloudcanvas-ui-badge[data-shape="flag"]');
  assert.match(flag, /z-index: var\(--cc-z-ui-raised, /, 'in front: whatever it overlaps is behind it');
  assert.match(flag, /transform: translateY\(calc\(-1 \* var\(--cc-ui-flag-rise, 0px\)\)\)/, 'no rise unless a host asks for one');
  assert.equal(UI_TOKENS['--cc-ui-flag-rise']?.category, 'size');
  assert.match(bodyOf(`.${FLAG}`), /overflow: visible/, 'the marker is never cut by its own box');
  for (const strip of ['.cloudcanvas-ui-tabs', '.cloudcanvas-ui-navbar-list']) {
    assert.match(bodyOf(strip), /padding-top: var\(--cc-ui-flag-rise, 0px\)/, `${strip} scrolls, so it keeps the room a risen flag stands in`);
  }
});

test('badge: the flag takes its colours from the sheet - the tone as currentColor, the rest from tokens', (t) => {
  const host = mount(t);
  const badge = createBadge(host);
  badge.update({ count: 4, tone: 'danger', shape: 'flag' });
  const { root, svg } = flagOf(host);
  assert.equal(root.getAttribute('data-tone'), 'danger');
  for (const node of [svg, ...svg.querySelectorAll('*')]) {
    for (const name of ['stroke', 'color', 'style', 'stop-color', 'flood-color']) {
      assert.equal(node.hasAttribute(name), false, `<${node.localName}> carries no ${name} of its own`);
    }
    if (node.hasAttribute('fill')) assert.match(node.getAttribute('fill'), /^url\(#[\w-]+\)$/, 'the one fill written is a reference, not a colour');
  }
  assert.ok(FLAG_RULES.length >= 8, `the sheet draws the flag: ${FLAG_RULES.length} rules`);
  const fills = FLAG_RULES.flatMap((rule) => [...rule.body.matchAll(/(?:^|;)\s*(?:fill|stroke|stop-color):\s*([^;]+)/g)].map((match) => match[1].trim()));
  assert.ok(fills.includes('currentColor'), 'the pennant is the badge colour');
  assert.ok(fills.some((value) => value.startsWith('var(--cc-ui-on-accent,')), 'the figure is the on-tone text token');
  for (const value of fills) assert.match(value, /^(?:currentColor|none|var\(--cc-[a-z0-9-]+, [^()]+\))$/, `${value} is a literal colour`);
  const base = FLAG_RULES.find((rule) => rule.selector === '.cloudcanvas-ui-badge[data-shape="flag"]');
  assert.match(base.body, /(?:^|;)\s*color:\s*var\(--cc-accent,/, 'the accent unless a tone says otherwise');
  for (const tone of ['success', 'warning', 'danger']) {
    const rule = FLAG_RULES.find((entry) => entry.selector.includes('[data-shape="flag"]') && entry.selector.includes(`[data-tone="${tone}"]`));
    assert.ok(rule, `no flag rule for ${tone}`);
    assert.match(rule.body, new RegExp(`color:\\s*var\\(--cc-tone-${tone},`), `${tone} colours the flag from its own token`);
  }
  badge.destroy();
});

test('badge: a badge changes shape in place, and back to the pill leaves nothing of the flag behind', (t) => {
  const host = mount(t);
  const badge = createBadge(host);
  const [model, markup] = PILLS[0];
  badge.update(model);
  const root = host.querySelector('.cloudcanvas-ui-badge');
  badge.update({ ...model, shape: 'flag' });
  assertSame(host.querySelector('.cloudcanvas-ui-badge'), root, 'the same badge, not a rebuilt one');
  assert.ok(root.querySelector(`.${FLAG}`));
  badge.update(model);
  assert.equal(host.innerHTML, markup, 'the pill again, to the byte');
  badge.update({ ...model, shape: 'flag' });
  badge.destroy();
  assert.equal(host.children.length, 0);
  assert.doesNotThrow(() => badge.update({ count: 9, shape: 'flag' }));
  assert.equal(host.children.length, 0);
});
