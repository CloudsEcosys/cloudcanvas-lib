/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Progress: a native `<progress>` named by the label shown beside it, a value
 * held inside its range, and no claim at all when there is no value.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgress } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

/** The bar's `value` and `max` as the document holds them. */
const reading = (bar) => [bar.getAttribute('value'), bar.getAttribute('max')];

test('progress: a <progress> named by its visible label, with the value and the range it was given', (t) => {
  const host = mount(t);
  const progress = createProgress(host);
  progress.update({ value: 3, max: 5, label: '3 of 5 done' });
  const bar = host.querySelector('progress');
  const label = host.querySelector('.cloudcanvas-ui-progress-label');
  assert.deepEqual(reading(bar), ['3', '5']);
  assert.equal(label.textContent, '3 of 5 done');
  assert.equal(label.hidden, false, 'the label is on screen, not only for a screen reader');
  assertSame(document.getElementById(bar.getAttribute('aria-labelledby')), label);
  progress.update({ value: 4, max: 5, label: '4 of 5 done' });
  assertSame(host.querySelector('progress'), bar, 'an update writes into the bar it has');
  assert.deepEqual(reading(bar), ['4', '5']);
  assert.equal(label.textContent, '4 of 5 done');
  progress.destroy();
});

test('progress: the value is held to its range, a range that is no range is the platform\'s 0 to 1, and no value is no claim', (t) => {
  const host = mount(t);
  const progress = createProgress(host);
  const bar = host.querySelector('progress');
  const read = (model) => { progress.update({ label: 'Done', ...model }); return reading(bar); };
  assert.deepEqual(read({ value: 9, max: 5 }), ['5', '5'], 'above the range is the top of it');
  assert.deepEqual(read({ value: -2, max: 5 }), ['0', '5'], 'below it is zero');
  assert.deepEqual(read({ value: 0.25 }), ['0.25', '1'], 'no max is the platform default');
  assert.deepEqual(read({ value: 0, max: 0 }), ['0', '1'], 'none of none is an empty bar, not a broken one');
  assert.deepEqual(read({ value: 3, max: -4 }), ['1', '1']);
  assert.deepEqual(read({ value: '2', max: '4' }), ['2', '4'], 'numbers that arrive as text are numbers');
  assert.deepEqual(read({ max: 5 }), [null, '5'], 'no value leaves the bar indeterminate rather than claiming zero');
  assert.deepEqual(read({ value: 'soon', max: 5 }), [null, '5']);
  assert.deepEqual(read({ value: 2, max: 5 }), ['2', '5'], 'and a value brings it back');
  progress.destroy();
});

test('progress: a bar with no label has no name, so it is refused; destroy removes it and is safe to repeat', (t) => {
  const host = mount(t);
  const progress = createProgress(host);
  assert.throws(() => progress.update({ value: 1, max: 2 }), /A progress bar needs a label/);
  assert.throws(() => progress.update({ value: 1, max: 2, label: '  ' }), /A progress bar needs a label/);
  progress.update({ value: 1, max: 2, label: 'Half' });
  progress.destroy();
  progress.destroy();
  assert.equal(host.children.length, 0);
  assert.doesNotThrow(() => progress.update({ value: 2, max: 2, label: 'All' }));
  assert.equal(host.children.length, 0);
});
