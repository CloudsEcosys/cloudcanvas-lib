/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The voice draft (`createVoiceDraft`): the Web Speech API as an optional text source, never a command, over a
 * recognition device the test drives by hand. It listens only after consent, collects one utterance, lets the words be
 * edited and hands them to `onApply` only when asked; a device that is stale (the context changed, the control was
 * turned off or destroyed) is let go of, and its late results are ignored. The control that draws it, `createVoiceInput`,
 * and the one late result of a cancelled draft are in `ui-toast-composer.test.js`; these are the draft's own contract.
 *
 * They first lived in Momentum as `tests/unified-voice.test.js`, red then by construction (`ERR_MODULE_NOT_FOUND` for
 * the voice draft module). Momentum draws no voice draft of its own: it takes the kit's `createVoiceInput`, so what
 * the draft does is the kit's to prove. The second case holds what the kit's other voice cases did not: the context
 * change and the turned-off control, each fencing a device that was listening.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceDraft } from '../../ui/index.js';

/** A recognition device that counts what it was asked, and says nothing until the test makes it. */
function fixture() {
  const devices = [], applied = [];
  const createRecognition = () => {
    const device = { starts: 0, stops: 0, aborts: 0, start() { this.starts += 1; }, stop() { this.stops += 1; }, abort() { this.aborts += 1; } };
    devices.push(device);
    return device;
  };
  return { voice: createVoiceDraft({ createRecognition, onApply: (text) => applied.push(text) }), devices, applied };
}

const heard = (words) => ({ results: [[{ transcript: words }]] });

test('voice draft: it requires explicit consent, previews speech, and only applies text on confirmation', () => {
  const { voice, devices, applied } = fixture();
  voice.start();
  assert.equal(devices.length, 0, 'no consent, no device');
  voice.start(true);
  assert.equal(devices[0].starts, 1);
  devices[0].onresult(heard('Draft only'));
  assert.equal(voice.state.text, 'Draft only');
  assert.deepEqual(applied, [], 'what was heard is a preview');
  voice.stop();
  assert.equal(devices[0].stops, 1);
  devices[0].onend();
  voice.edit('Reviewed draft');
  voice.apply();
  assert.deepEqual(applied, ['Reviewed draft']);
  assert.equal(voice.state.text, '');
  voice.destroy();
});

test('voice draft: it cancels and fences old results on a context change, a turned-off control and teardown', () => {
  const { voice, devices, applied } = fixture();
  voice.update({ contextKey: 'room-a' });
  voice.start(true);
  const stale = devices[0].onresult;
  voice.update({ contextKey: 'room-b' });
  stale(heard('Wrong room'));
  assert.equal(devices[0].aborts, 1);
  assert.equal(voice.state.text, '');
  voice.start(true);
  voice.update({ contextKey: 'room-b', disabled: true });
  voice.start(true);
  assert.equal(devices.length, 2, 'a control that is off starts nothing');
  voice.apply();
  assert.deepEqual(applied, []);
  voice.destroy();
  voice.update({});
  voice.start(true);
  assert.equal(devices.length, 2, 'a destroyed draft starts nothing');
});

test('voice draft: it surfaces speech that is unavailable or denied without committing anything', () => {
  const unavailable = createVoiceDraft({});
  unavailable.start(true);
  assert.equal(unavailable.state.supported, false);
  const { voice, devices, applied } = fixture();
  voice.start(true);
  devices[0].onerror({ error: 'not-allowed' });
  assert.match(voice.state.message, /unavailable|denied/i);
  assert.equal(voice.state.listening, false);
  assert.deepEqual(applied, []);
  voice.destroy();
  unavailable.destroy();
});
