/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Unit tests for the logging seam (`.plugin/log.js`): the default sink's threshold,
 * sink installation, containment of a throwing sink, and the one production
 * path that must still reach the console - a failing reaction.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { LOG_LEVELS, consoleLogSink, createLogger, setLogSink } from 'cloudcanvas/log';
import { blit } from 'cloudcanvas';
import { actionRegistry, reactions, reactionsOf } from '../../plugins/reactions.js';
import { select, setSelected } from '../../plugins/select.js';
import { coreScene } from '../helpers/core-scene.js';

blit.use({ reactions, select });

/** A root running reactions, with a binding from `source` selecting to an action that throws `failure`. */
function failingReaction(t, failure) {
  const { app } = coreScene(t);
  app.set({ reactions: true });
  const source = app.blit({ id: 'source', x: 0, y: 0, w: 100, h: 50, select: true });
  app.blit({ id: 'target', x: 200, y: 0, w: 100, h: 50 });
  actionRegistry.register('explode', { run: () => { throw failure; } });
  t.after(() => actionRegistry.unregister('explode'));
  const binding = reactionsOf(app).add({ source: 'source', signal: 'select', action: { type: 'explode', target: 'target' } });
  return { source, binding };
}

/** Swap `console.error` for a recorder for the duration of `run`. */
function withConsoleError(run) {
  const calls = [];
  const original = console.error;
  console.error = (...args) => { calls.push(args); };
  try {
    run(calls);
  } finally {
    console.error = original;
  }
  return calls;
}

test.afterEach(() => setLogSink(consoleLogSink));

/* ------------------ LEVELS AND DEFAULTS ------------------ */

test('LOG_LEVELS ranks the four levels and is frozen', () => {
  assert.deepEqual(Object.keys(LOG_LEVELS), ['debug', 'info', 'warn', 'error']);
  assert.ok(LOG_LEVELS.debug < LOG_LEVELS.info && LOG_LEVELS.info < LOG_LEVELS.warn && LOG_LEVELS.warn < LOG_LEVELS.error);
  assert.ok(Object.isFrozen(LOG_LEVELS));
});

test('createLogger returns a frozen logger with the four methods, defaulting an empty scope', () => {
  const logger = createLogger('probe');
  assert.deepEqual(Object.keys(logger), ['debug', 'info', 'warn', 'error']);
  assert.ok(Object.isFrozen(logger));
  for (const level of Object.keys(LOG_LEVELS)) assert.equal(typeof logger[level], 'function');

  const records = [];
  setLogSink((record) => records.push(record), { level: 'debug' });
  createLogger('').debug('x');
  createLogger(42).debug('y');
  assert.deepEqual(records.map((record) => record.scope), ['cloudcanvas', 'cloudcanvas']);
});

test('the default sink sends error to console.error with the [CloudCanvas] prefix and drops the rest', () => {
  const logger = createLogger('probe');
  const failure = new Error('boom');
  const calls = withConsoleError(() => {
    logger.debug('quiet');
    logger.info('quiet');
    logger.warn('quiet');
    logger.error('loud', failure);
  });
  assert.deepEqual(calls, [['[CloudCanvas] loud', failure]]);
});

test('consoleLogSink routes each level to its console method and survives a missing one', () => {
  const seen = [];
  const originals = {};
  for (const level of ['debug', 'info', 'warn', 'error']) {
    originals[level] = console[level];
    console[level] = (...args) => seen.push([level, ...args]);
  }
  try {
    for (const level of ['debug', 'info', 'warn', 'error']) {
      consoleLogSink({ level, scope: 's', message: level, args: [1] });
    }
    assert.deepEqual(seen, [
      ['debug', '[CloudCanvas] debug', 1],
      ['info', '[CloudCanvas] info', 1],
      ['warn', '[CloudCanvas] warn', 1],
      ['error', '[CloudCanvas] error', 1]
    ]);

    // A console without `debug` falls back to `log`.
    console.debug = undefined;
    const originalLog = console.log;
    console.log = (...args) => seen.push(['log', ...args]);
    try {
      consoleLogSink({ level: 'debug', scope: 's', message: 'fallback', args: [] });
    } finally {
      console.log = originalLog;
    }
    assert.deepEqual(seen.at(-1), ['log', '[CloudCanvas] fallback']);
  } finally {
    for (const level of Object.keys(originals)) console[level] = originals[level];
  }
});

/* ------------------ SINK INSTALLATION ------------------ */

test('setLogSink installs a sink at the given level, returns the previous, and null silences', () => {
  const records = [];
  const previous = setLogSink((record) => records.push(record), { level: 'warn' });
  assert.equal(previous, consoleLogSink, 'the default sink was not returned as the previous one');

  const logger = createLogger('probe');
  logger.debug('no');
  logger.info('no');
  logger.warn('yes', 1, 2);
  logger.error('yes too');
  assert.deepEqual(records, [
    { level: 'warn', scope: 'probe', message: 'yes', args: [1, 2] },
    { level: 'error', scope: 'probe', message: 'yes too', args: [] }
  ]);

  const custom = setLogSink(null);
  assert.equal(typeof custom, 'function', 'the custom sink was not returned as the previous one');
  const calls = withConsoleError(() => logger.error('nobody hears this'));
  assert.deepEqual(calls, []);
  assert.equal(records.length, 2, 'a silenced logger still delivered a record');
});

test('setLogSink without a level defaults to error, and rejects a bad sink or level', () => {
  const records = [];
  setLogSink((record) => records.push(record.level));
  const logger = createLogger('probe');
  logger.warn('dropped');
  logger.error('kept');
  assert.deepEqual(records, ['error']);

  assert.throws(() => setLogSink('not a function'), TypeError);
  assert.throws(() => setLogSink(() => {}, { level: 'loud' }), RangeError);
  // A rejected call leaves the installed sink in place.
  logger.error('still kept');
  assert.deepEqual(records, ['error', 'error']);
});

test('a throwing sink is contained: the caller never sees it', () => {
  let attempts = 0;
  setLogSink(() => { attempts += 1; throw new Error('sink is broken'); }, { level: 'debug' });
  const logger = createLogger('probe');
  assert.doesNotThrow(() => logger.debug('a'));
  assert.doesNotThrow(() => logger.error('b'));
  assert.equal(attempts, 2, 'the sink was not invoked for both records');
});

test('a message is coerced to a string and extra arguments ride along untouched', () => {
  const records = [];
  setLogSink((record) => records.push(record), { level: 'debug' });
  const detail = { id: 7 };
  createLogger('probe').info(12, detail, null);
  assert.deepEqual(records, [{ level: 'info', scope: 'probe', message: '12', args: [detail, null] }]);
});

/* ------------------ THE REACTION FAILURE PATH ------------------ */

test('a failing reaction reaches the sink as an error record carrying the thrown error', (t) => {
  const failure = new Error('action exploded');
  const { source, binding } = failingReaction(t, failure);

  const records = [];
  setLogSink((record) => records.push(record));
  assert.doesNotThrow(() => setSelected(source, true));

  assert.equal(records.length, 1, 'the reaction failure was not reported exactly once');
  assert.equal(records[0].level, 'error');
  assert.equal(records[0].scope, 'reactions');
  assert.equal(records[0].message, `reaction "${binding.id}" (explode) failed`);
  assert.equal(records[0].args[0], failure, 'the thrown error was not carried on the record');
});

test('with the default sink, a failing reaction still lands on console.error as before', (t) => {
  const { source, binding } = failingReaction(t, new Error('action exploded'));
  const calls = withConsoleError(() => setSelected(source, true));
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], `[CloudCanvas] reaction "${binding.id}" (explode) failed`);
  assert.ok(calls[0][1] instanceof Error);
});
