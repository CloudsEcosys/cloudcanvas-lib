/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Toasts (the Undo shape), the composer's draft contract, and voice input over
 * a fake recognition device.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_CSS, UI_TOKENS, createComposer, createToaster, createVoiceDraft, createVoiceInput } from '../../ui/index.js';
import { assertSame, key, mount } from '../helpers/ui.js';

test('toast: a status in a labelled region; the action runs once and closes it; max drops the oldest', (t) => {
  const host = mount(t);
  const toaster = createToaster(host, { max: 2, timeout: 0 });
  let undone = 0;
  const id = toaster.show({ message: 'Note deleted', action: { label: 'Undo', run: () => { undone += 1; } } });
  const region = host.querySelector('.cloudcanvas-ui-toasts');
  assert.equal(region.getAttribute('aria-label'), 'Notifications');
  const toast = region.querySelector(`[data-ui-id="${id}"]`);
  assert.equal(toast.getAttribute('role'), 'status');
  toast.querySelector('.cloudcanvas-ui-toast-action').click();
  assert.equal(undone, 1);
  assert.equal(region.children.length, 0);
  toaster.show({ message: 'one' });
  toaster.show({ message: 'two', tone: 'danger' });
  toaster.show({ message: 'three' });
  assert.deepEqual([...region.children].map((node) => node.textContent.replace('×', '')), ['two', 'three']);
  assert.equal(region.children[0].getAttribute('role'), 'alert');
  key(region.children[0], 'Escape');
  assert.equal(region.children.length, 1);
  assert.throws(() => toaster.show({ message: ' ' }), TypeError);
  assert.throws(() => toaster.show({ message: 'x', action: { label: 'Undo' } }), TypeError);
  toaster.destroy();
  assertSame(host.querySelector('.cloudcanvas-ui-toasts'), null);
  assert.equal(toaster.show({ message: 'late' }), null);
});

test('toast: leaves after its timeout, and the countdown pauses while focus is inside', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const host = mount(t);
  const toaster = createToaster(host, { timeout: 5000 });
  toaster.show({ message: 'Saved' });
  const region = host.querySelector('.cloudcanvas-ui-toasts');
  t.mock.timers.tick(4999);
  assert.equal(region.children.length, 1);
  t.mock.timers.tick(1);
  assert.equal(region.children.length, 0);
  toaster.show({ message: 'Deleted', action: { label: 'Undo', run: () => {} } });
  const toast = region.children[0];
  t.mock.timers.tick(2000);
  toast.querySelector('.cloudcanvas-ui-toast-action').focus();
  t.mock.timers.tick(10000);
  assert.equal(region.children.length, 1, 'paused while focused');
  toaster.destroy();
});

/*
 * Written first and seen to fail on a toaster that knew one action, the Undo shape, and no other:
 *
 *   ✖ toast: takes two actions, each reported once through onAction(toastId, actionId) and closing its toast
 *     AssertionError [ERR_ASSERTION]: two actions, in the order given, before the dismiss control
 *     actual: [ '×' ]   expected: [ 'Snooze', 'Open', '×' ]
 */
test('toast: takes two actions, each reported once through onAction(toastId, actionId) and closing its toast', (t) => {
  const host = mount(t);
  const chosen = [];
  const toaster = createToaster(host, { timeout: 0, onAction: (toastId, actionId) => chosen.push([toastId, actionId]) });
  const actions = [{ id: 'snooze', label: 'Snooze' }, { id: 'open', label: 'Open' }];
  const first = toaster.show({ message: 'Stand-up in five minutes', actions });
  const second = toaster.show({ message: 'Review is due', actions: actions.slice(1) });
  const toast = (id) => host.querySelector(`[data-ui-id="${id}"]`);
  const buttons = (id) => [...toast(id).querySelectorAll('button')];
  assert.deepEqual(buttons(first).map((node) => node.textContent), ['Snooze', 'Open', '×'], 'two actions, in the order given, before the dismiss control');
  assert.deepEqual(buttons(first).map((node) => [node.type, node.className.includes('cloudcanvas-ui-toast-action'), node.getAttribute('data-ui-action')]),
    [['button', true, 'snooze'], ['button', true, 'open'], ['button', false, null]], 'each a kit button that says which action it is');
  buttons(first)[1].click();
  assert.deepEqual(chosen, [[first, 'open']], 'the toast and the action, so one handler serves every toast');
  assertSame(toast(first), null, 'an action closes its toast');
  assert.ok(toast(second), 'and no other');
  buttons(second)[0].click();
  assert.deepEqual(chosen, [[first, 'open'], [second, 'open']]);
  const kept = toaster.show({ message: 'Later', actions });
  const stale = buttons(kept)[0];
  toaster.dismiss(kept);
  stale.click();
  assert.equal(chosen.length, 2, 'a toast that has gone reports nothing');
  const quiet = createToaster(mount(t), { timeout: 0 });
  const id = quiet.show({ message: 'No handler', actions });
  assert.doesNotThrow(() => quiet.show({ message: 'x', actions: [] }), 'no actions is no actions');
  assert.doesNotThrow(() => host.ownerDocument.querySelector(`[data-ui-id="${id}"] button`).click(), 'no onAction given, none called');
  quiet.destroy();
  toaster.destroy();
});

/* Seen to fail with the first: `AssertionError [ERR_ASSERTION]: Missing expected exception.` (`expected: /at most two actions/`). */
test('toast: at most two actions, each with an id of its own and a label; action and actions do not mix; the single action still works', (t) => {
  const host = mount(t);
  const chosen = [];
  const toaster = createToaster(host, { timeout: 0, onAction: (...args) => chosen.push(args) });
  const region = host.querySelector('.cloudcanvas-ui-toasts');
  const three = ['a', 'b', 'c'].map((id) => ({ id, label: id }));
  assert.throws(() => toaster.show({ message: 'x', actions: three }), /at most two actions/);
  assert.throws(() => toaster.show({ message: 'x', actions: [{ id: 'a', label: 'A' }, { id: 'a', label: 'Again' }] }), /duplicate toast action id: a/);
  assert.throws(() => toaster.show({ message: 'x', actions: [{ id: 'a', label: ' ' }] }), /needs a label/);
  assert.throws(() => toaster.show({ message: 'x', actions: 'undo' }), TypeError);
  assert.throws(() => toaster.show({ message: 'x', action: { label: 'Undo', run() {} }, actions: three.slice(0, 1) }), /action or actions, not both/);
  assert.equal(region.children.length, 0, 'a refused toast is not shown');
  let undone = 0;
  toaster.show({ message: 'Note deleted', action: { label: 'Undo', run: () => { undone += 1; } } });
  const undo = region.querySelector('.cloudcanvas-ui-toast-action');
  assert.deepEqual([undo.textContent, undo.hasAttribute('data-ui-action'), region.querySelectorAll('.cloudcanvas-ui-toast-action').length], ['Undo', false, 1],
    'the Undo shape is the button it always was');
  undo.click();
  assert.deepEqual([undone, chosen.length, region.children.length], [1, 0, 0], 'it runs its own function, not onAction, and closes its toast');
  toaster.destroy();
});

/*
 * Written first and seen to fail on a region held off the edges by one fixed gap and one offset:
 *
 *   ✖ toast: the region keeps clear of a host's floating controls through inset tokens, and its targets are 44px on a coarse pointer
 *     AssertionError [ERR_ASSERTION]: --cc-ui-toast-inset-bottom is not catalogued
 */
test('toast: the region keeps clear of a host\'s floating controls through inset tokens, and its targets are 44px on a coarse pointer', () => {
  for (const side of ['bottom', 'left', 'right']) {
    assert.equal(UI_TOKENS[`--cc-ui-toast-inset-${side}`]?.category, 'size', `--cc-ui-toast-inset-${side} is not catalogued`);
  }
  const region = /\.cloudcanvas-ui-toasts \{([^}]*)\}/.exec(UI_CSS)[1];
  assert.match(region, /inset: auto var\(--cc-ui-toast-inset-right, var\(--cc-space-3, 12px\)\) var\(--cc-ui-toast-inset-bottom, var\(--cc-ui-toast-offset, 16px\)\) var\(--cc-ui-toast-inset-left, var\(--cc-space-3, 12px\)\);/,
    'each side a host can move on its own; with none set the region is where it was, and the offset a host already sets still lifts it');
  assert.match(region, /margin: 0;/, 'the region is a section: a host that gives its sections a margin must not move it (the kit\'s own browser fixture did, by 24px)');
  const coarse = /@media \(pointer: coarse\) \{((?:[^{}]|\{[^{}]*\})*)\}/g;
  const targets = [...UI_CSS.matchAll(coarse)].map((match) => /:is\(\.cloudcanvas-ui-toast-action, \.cloudcanvas-ui-toast-dismiss\) \{([^}]*)\}/.exec(match[1])?.[1]).find(Boolean);
  assert.ok(targets, 'the toast\'s own controls are in a coarse-pointer rule');
  assert.match(targets, /min-height: var\(--cc-control-min-coarse, 44px\);/);
  assert.match(targets, /min-width: var\(--cc-control-min-coarse, 44px\);/, 'the dismiss control is as wide as it is tall');
});

test('composer: Submit refuses a blank draft, sends trimmed text, and clears on success', (t) => {
  const host = mount(t);
  const sent = [];
  const changes = [];
  const composer = createComposer(host, { onSubmit: (text) => { sent.push(text); }, onChange: (text) => changes.push(text) });
  composer.update({ label: 'Message', placeholder: 'Write' });
  const field = host.querySelector('textarea');
  const submit = host.querySelector('.cloudcanvas-ui-composer-submit');
  assert.equal(field.getAttribute('aria-label'), 'Message');
  assert.equal(submit.disabled, true);
  field.value = '   ';
  field.dispatchEvent(new Event('input'));
  assert.equal(submit.disabled, true);
  key(field, 'Enter', { ctrlKey: true });
  assert.deepEqual(sent, []);
  field.value = '  hello  ';
  field.dispatchEvent(new Event('input'));
  assert.equal(submit.disabled, false);
  key(field, 'Enter', { metaKey: true });
  assert.deepEqual(sent, ['hello']);
  assert.equal(field.value, '');
  assert.equal(changes.at(-1), '');
});

test('composer: Cancel clears the draft first; a false or rejected submit keeps it', async (t) => {
  const host = mount(t);
  const errors = [];
  let cancelled = 0;
  let answer = false;
  const composer = createComposer(host, {
    onSubmit: () => answer, onCancel: () => { cancelled += 1; }, onError: (error) => errors.push(error.message)
  });
  composer.update({});
  const field = host.querySelector('textarea');
  const submit = host.querySelector('.cloudcanvas-ui-composer-submit');
  field.value = 'abc';
  field.dispatchEvent(new Event('input'));
  host.querySelector('.cloudcanvas-ui-composer-cancel').click();
  assert.equal(field.value, '', 'what is on screen is what would be sent: nothing');
  assert.equal(cancelled, 1);
  field.value = 'keep';
  field.dispatchEvent(new Event('input'));
  submit.click();
  assert.equal(field.value, 'keep', 'false keeps the draft');
  answer = Promise.reject(new Error('offline'));
  submit.click();
  assert.equal(submit.disabled, true, 'pending while the promise runs');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(field.value, 'keep');
  assert.deepEqual(errors, ['offline']);
  answer = Promise.resolve();
  submit.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(field.value, '');
});

test('composer: while a send is pending Cancel is disabled and cannot clear the draft; a rejected send keeps the text', async (t) => {
  const host = mount(t);
  const errors = [];
  let cancelled = 0;
  let fail;
  const composer = createComposer(host, {
    onSubmit: () => new Promise((resolve, reject) => { fail = reject; }),
    onCancel: () => { cancelled += 1; }, onError: (error) => errors.push(error.message)
  });
  composer.update({ contextKey: 'a' });
  const field = host.querySelector('textarea');
  const cancel = host.querySelector('.cloudcanvas-ui-composer-cancel');
  /** A click that gets through to Cancel whatever its `disabled` says: the handler has to refuse it too. */
  const press = () => {
    const disabled = cancel.disabled;
    cancel.disabled = false;
    cancel.click();
    cancel.disabled = disabled;
  };
  field.value = 'in flight';
  field.dispatchEvent(new Event('input'));
  composer.update({ contextKey: 'a', pending: true });
  assert.equal(cancel.disabled, true, 'the host says a send is pending');
  press();
  assert.equal(field.value, 'in flight', 'text in flight is not Cancel\'s to clear');
  assert.equal(cancelled, 0);
  composer.update({ contextKey: 'a', pending: false });
  assert.equal(cancel.disabled, false);
  host.querySelector('.cloudcanvas-ui-composer-submit').click();
  composer.update({ contextKey: 'a', pending: true });
  assert.equal(cancel.disabled, true);
  fail(new Error('offline'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(errors, ['offline']);
  assert.equal(cancel.disabled, true, 'the promise settled, but the host has not lowered its flag');
  press();
  assert.equal(field.value, 'in flight', 'the failed send still has its draft');
  assert.equal(cancelled, 0);
  composer.update({ contextKey: 'a', pending: false });
  assert.equal(field.value, 'in flight', 'a rejected send keeps the text');
  assert.equal(cancel.disabled, false);
  press();
  assert.equal(field.value, '', 'and once nothing is pending, Cancel is the user\'s again');
  assert.equal(cancelled, 1);
  composer.destroy();
});

test('composer: model text applies only when it changes; a new context resets the draft', (t) => {
  const host = mount(t);
  const composer = createComposer(host, {});
  composer.update({ text: 'prefill', contextKey: 'a' });
  const field = host.querySelector('textarea');
  assert.equal(field.value, 'prefill');
  field.value = 'typed';
  composer.update({ text: 'prefill', contextKey: 'a' });
  assert.equal(field.value, 'typed', 're-render keeps typing');
  composer.update({ text: '', contextKey: 'a' });
  assert.equal(field.value, '');
  field.value = 'draft for a';
  composer.update({ contextKey: 'b' });
  assert.equal(field.value, '', 'a draft never follows into another context');
  composer.update({ contextKey: 'b', disabled: true });
  assert.equal(field.disabled, true);
  composer.destroy();
  assertSame(host.querySelector('textarea'), null);
});

/** A recognition device the test drives by hand. */
function fakeRecognition() {
  const devices = [];
  const create = () => {
    const device = { started: 0, aborted: 0, start() { this.started += 1; }, stop() { this.onend?.(); }, abort() { this.aborted += 1; } };
    devices.push(device);
    return device;
  };
  const speak = (words) => devices.at(-1).onresult?.({ results: [[{ transcript: words }]] });
  return { devices, create, speak };
}

test('voice: consent first, then one tap listens and a second stops; words go to the draft', (t) => {
  const host = mount(t);
  const applied = [];
  const speech = fakeRecognition();
  const voice = createVoiceInput(host, { createRecognition: speech.create, onApply: (text) => applied.push(text) });
  voice.update({ contextKey: 'a' });
  const mic = host.querySelector('.cloudcanvas-ui-voice-mic');
  const consent = host.querySelector('.cloudcanvas-ui-voice-consent');
  assert.equal(consent.hidden, true);
  mic.click();
  assert.equal(consent.hidden, false);
  assert.equal(speech.devices.length, 0, 'nothing listens before consent');
  host.querySelector('.cloudcanvas-ui-voice-allow').click();
  assert.equal(speech.devices[0].started, 1);
  assert.equal(mic.getAttribute('aria-pressed'), 'true');
  speech.speak('buy milk');
  mic.click();
  assert.deepEqual(applied, ['buy milk']);
  mic.click();
  assert.equal(speech.devices.length, 2, 'consent is remembered within a context');
  voice.update({ contextKey: 'b' });
  assert.ok(speech.devices[1].aborted >= 1, 'a context change stops listening');
  mic.click();
  assert.equal(consent.hidden, false, 'a new context asks again');
  voice.destroy();
  assertSame(host.querySelector('.cloudcanvas-ui-voice'), null);
});

test('voice: review mode holds words for Add or Discard; no support renders hidden', (t) => {
  const host = mount(t);
  const applied = [];
  const speech = fakeRecognition();
  const voice = createVoiceInput(host, { createRecognition: speech.create, review: true, onApply: (text) => applied.push(text) });
  voice.update({});
  host.querySelector('.cloudcanvas-ui-voice-mic').click();
  host.querySelector('.cloudcanvas-ui-voice-allow').click();
  speech.speak('call mum');
  speech.devices[0].stop();
  const review = host.querySelector('.cloudcanvas-ui-voice-review');
  assert.equal(review.hidden, false);
  assert.equal(host.querySelector('.cloudcanvas-ui-voice-preview').value, 'call mum');
  host.querySelector('.cloudcanvas-ui-voice-add').click();
  assert.deepEqual(applied, ['call mum']);
  const bare = mount(t);
  createVoiceInput(bare, {}).update({});
  assert.equal(bare.querySelector('.cloudcanvas-ui-voice').hidden, true);
});

test('voice: every word is the caller\'s - labels on the controls and the consent, messages on the status line', (t) => {
  const host = mount(t);
  const speech = fakeRecognition();
  const labels = { voice: 'Dictate', stop: 'Finish', allow: 'Yes, listen', decline: 'No thanks', add: 'Insert', discard: 'Drop',
    preview: 'What was heard', consent: 'Audio may leave this device.' };
  const voice = createVoiceInput(host, { createRecognition: speech.create, review: true, labels,
    messages: { listening: 'Go ahead.', denied: 'Blocked.' } });
  voice.update({});
  const part = (name) => host.querySelector(`.cloudcanvas-ui-voice-${name}`);
  for (const [name, word] of [['mic', 'voice'], ['consent-text', 'consent'], ['allow', 'allow'], ['decline', 'decline'], ['add', 'add'], ['discard', 'discard']]) {
    assert.equal(part(name).textContent, labels[word], name);
  }
  assert.equal(part('preview').getAttribute('aria-label'), 'What was heard');
  part('mic').click();
  part('allow').click();
  assert.equal(part('mic').textContent, 'Finish');
  assert.equal(part('status').textContent, 'Go ahead.');
  speech.devices[0].onerror();
  assert.equal(part('status').textContent, 'Blocked.');
  voice.destroy();
  const composer = createComposer(mount(t), { voice: { createRecognition: speech.create, labels: { voice: 'Dictate' } } });
  composer.update({});
  assert.equal(document.querySelector('.cloudcanvas-ui-composer .cloudcanvas-ui-voice-mic').textContent, 'Dictate', 'the composer hands the words through');
  composer.destroy();
});

test('voice draft: late results from a replaced device are ignored; errors leave a message', () => {
  const speech = fakeRecognition();
  const draft = createVoiceDraft({ createRecognition: speech.create });
  draft.start(true);
  const first = speech.devices[0];
  const firstResult = first.onresult;
  draft.cancel();
  firstResult?.({ results: [[{ transcript: 'stale' }]] });
  assert.equal(draft.state.text, '');
  draft.start(true);
  speech.devices[1].onerror();
  assert.match(draft.state.message, /unavailable or was denied/);
  draft.start(false);
  assert.equal(speech.devices.length, 2, 'no consent, no device');
  draft.destroy();
});
