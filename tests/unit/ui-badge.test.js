/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Badge: a capped figure for the eye, the whole count for the ear, hidden at
 * zero, a closed set of tones, and announcements only when asked for.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { SR_ONLY_CLASS, UI_CSS, countLabel, createBadge, formatCount } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

test('formatCount shows a whole, non-negative figure, capped as "max+"; a count that is no number shows nothing', () => {
  assert.equal(formatCount(5), '5');
  assert.equal(formatCount(99), '99');
  assert.equal(formatCount(100), '99+');
  assert.equal(formatCount(120, 99), '99+');
  assert.equal(formatCount(12, 9), '9+');
  assert.equal(formatCount(3.9), '3');
  assert.equal(formatCount(-4), '0');
  assert.equal(formatCount('7'), '7');
  assert.equal(formatCount('x'), '');
  assert.equal(formatCount(Infinity), '');
  for (const cap of [0, -5, 0.5, 'x', null, NaN]) {
    assert.equal(formatCount(150, cap), '99+', `a cap of ${String(cap)} is no cap: the default stands`);
  }
  assert.equal(formatCount(150, 120.7), '120+', 'a fractional cap is floored');
});

test('countLabel speaks the whole count: a function, a {count} template, or the bare number', () => {
  assert.equal(countLabel('{count} unread', 3), '3 unread');
  assert.equal(countLabel('{count} of {count}', 2), '2 of 2');
  assert.equal(countLabel((count) => `${count} items`, 7), '7 items');
  assert.equal(countLabel(() => null, 7), '');
  assert.equal(countLabel(undefined, 4), '4');
  assert.equal(countLabel('', 4), '4');
});

test('badge: hidden until it has a count; the figure is capped and the whole count is spoken', (t) => {
  const host = mount(t);
  const badge = createBadge(host);
  const root = host.querySelector('.cloudcanvas-ui-badge');
  const figure = root.querySelector('.cloudcanvas-ui-badge-figure');
  const spoken = root.querySelector(`.${SR_ONLY_CLASS}`);
  assert.equal(root.hidden, true, 'no model yet: no empty pill');
  badge.update({ count: 5, label: '{count} unread' });
  assert.equal(root.hidden, false);
  assert.equal(figure.textContent, '5');
  assert.equal(figure.getAttribute('aria-hidden'), 'true', 'the figure is for the eye');
  assert.equal(spoken.textContent, '5 unread');
  badge.update({ count: 120, label: '{count} unread' });
  assert.equal(figure.textContent, '99+');
  assert.equal(spoken.textContent, '120 unread', 'the ear hears the whole count');
  badge.update({ count: 12, max: 9 });
  assert.equal(figure.textContent, '9+');
  assert.equal(spoken.textContent, '12');
  badge.update({ count: 0, label: '{count} unread' });
  assert.equal(root.hidden, true);
  assert.equal(spoken.textContent, '', 'a hidden badge says nothing');
  badge.update({ count: 0, showZero: true });
  assert.equal(root.hidden, false);
  assert.equal(figure.textContent, '0');
  badge.update({ count: 'many' });
  assert.equal(root.hidden, true, 'a count that is no number is no count');
  assert.ok(UI_CSS.includes(`.${SR_ONLY_CLASS} {`), 'the kit sheet hides the spoken text visually');
  badge.destroy();
});

test('badge: a dot keeps its meaning, tones are a closed set, and it announces only when live', (t) => {
  const host = mount(t);
  const badge = createBadge(host);
  const root = host.querySelector('.cloudcanvas-ui-badge');
  badge.update({ count: 3, dot: true, tone: 'danger', live: true, label: '{count} alerts' });
  assert.equal(root.classList.contains('is-dot'), true);
  assert.equal(root.querySelector('.cloudcanvas-ui-badge-figure').textContent, '', 'a dot draws no figure');
  assert.equal(root.querySelector(`.${SR_ONLY_CLASS}`).textContent, '3 alerts', 'and is still spoken');
  assert.equal(root.getAttribute('data-tone'), 'danger');
  assert.equal(root.getAttribute('role'), 'status');
  assert.equal(root.getAttribute('aria-live'), 'polite');
  for (const tone of ['success', 'warning']) {
    badge.update({ count: 3, tone });
    assert.equal(root.getAttribute('data-tone'), tone);
  }
  badge.update({ count: 3, tone: 'purple' });
  assert.equal(root.hasAttribute('data-tone'), false, 'an unknown tone is the default look, not a styleless attribute');
  assert.equal(root.classList.contains('is-dot'), false);
  assert.equal(root.hasAttribute('role'), false, 'quiet unless asked: a count that ticks is not an interruption');
  assert.equal(root.hasAttribute('aria-live'), false);
  badge.destroy();
  assertSame(host.querySelector('.cloudcanvas-ui-badge'), null);
  assert.doesNotThrow(() => badge.update({ count: 9 }));
  assertSame(host.querySelector('.cloudcanvas-ui-badge'), null);
});
