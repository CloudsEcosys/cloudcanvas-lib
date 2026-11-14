/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Tones one to eight: a palette for the host's own categories. Each is a
 * catalogued colour token, each colours the same five kinds of thing, and the
 * tones that mean something (success, warning, danger) are still there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_CSS, UI_TOKENS, createCalendar, createChips, createKanban, createTimeline, createTree } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

const TONES = Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8']);

/** The five kinds a category tone colours, by the class each one carries. */
const KINDS = Object.freeze({
  'calendar event': 'cloudcanvas-ui-calendar-event',
  'timeline bar': 'cloudcanvas-ui-timeline-bar',
  'kanban card': 'cloudcanvas-ui-kanban-card',
  chip: 'cloudcanvas-ui-chips-chip',
  'tree item': 'cloudcanvas-ui-tree-row'
});

/** Every rule of the kit sheet, innermost blocks included, as its selector and its declarations. */
const RULES = [...UI_CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim(), body }));
const rulesFor = (tone) => RULES.filter((rule) => rule.selector.includes(`[data-tone="${tone}"]`));

test('tones: one to eight are catalogued as colour tokens, each with a purpose', () => {
  for (const tone of TONES) {
    const entry = UI_TOKENS[`--cc-ui-tone-${tone}`];
    assert.ok(entry, `--cc-ui-tone-${tone} is not catalogued`);
    assert.equal(entry.category, 'color');
    assert.ok(entry.purpose.length > 10);
  }
  assert.equal(Object.keys(UI_TOKENS).filter((name) => name.startsWith('--cc-ui-tone-')).length, TONES.length, 'eight, and only eight');
});

test('tones: each colours a calendar event, a timeline bar, a kanban card, a chip and a tree item, from its own token alone', () => {
  assert.ok(RULES.length > 150, 'the sheet was read');
  const defaults = [];
  for (const tone of TONES) {
    const rules = rulesFor(tone);
    assert.ok(rules.length > 0, `no rule for tone ${tone}`);
    const selectors = rules.map((rule) => rule.selector).join(' ');
    for (const [kind, className] of Object.entries(KINDS)) {
      assert.ok(selectors.includes(`.${className}`), `tone ${tone} does not colour a ${kind}`);
    }
    const reads = new Set(rules.flatMap((rule) => [...rule.body.matchAll(/var\((--cc-[a-z0-9-]+),\s*([^)]+)\)/g)].map((match) => `${match[1]} ${match[2]}`)));
    assert.equal(reads.size, 1, `tone ${tone} reads ${[...reads].join(' | ')}`);
    const [name, fallback] = [...reads][0].split(' ');
    assert.equal(name, `--cc-ui-tone-${tone}`);
    assert.match(fallback, /^#[0-9a-f]{6}$/, 'the default is a colour a host with no tokens still gets');
    defaults.push(fallback);
  }
  assert.equal(new Set(defaults).size, TONES.length, 'eight defaults that can be told apart');
});

test('tones: success, warning and danger still colour what they coloured', () => {
  for (const tone of ['success', 'warning', 'danger']) {
    const rules = rulesFor(tone);
    const selectors = rules.map((rule) => rule.selector).join(' ');
    for (const className of ['cloudcanvas-ui-kanban-card', 'cloudcanvas-ui-calendar-event', 'cloudcanvas-ui-timeline-bar', 'cloudcanvas-ui-graph-node',
      'cloudcanvas-ui-badge', 'cloudcanvas-ui-toast']) {
      assert.ok(selectors.includes(`.${className}`), `${tone} no longer colours .${className}`);
    }
    assert.ok(rules.every((rule) => rule.body.includes(`var(--cc-tone-${tone},`)), `${tone} reads another token`);
  }
});

test('tones: each of the five kinds carries the tone its model names, where the sheet looks for it', (t) => {
  const host = mount(t);
  const controls = [
    createCalendar(host), createTimeline(host), createKanban(host), createChips(host), createTree(host)
  ];
  const [calendar, timeline, kanban, chips, tree] = controls;
  calendar.update({ view: 'month', events: [{ id: 'e', title: 'Review', start: new Date(), tone: '4' }] });
  timeline.update({ items: [{ id: 'x', title: 'Ship', start: new Date(), tone: '5' }] });
  kanban.update({ columns: [{ id: 'a', cards: [{ id: '1', title: 'One', tone: '6' }] }] });
  chips.update({ items: [{ id: 'c', label: 'Work', tone: '7' }, { id: 'plain', label: 'Plain' }] });
  tree.update({ items: [{ id: 'n', label: 'Notes', tone: 8 }, { id: 'plain', label: 'Plain' }] });
  const toneOf = (className) => host.querySelector(`.${className}`).getAttribute('data-tone');
  assert.deepEqual(Object.values(KINDS).map(toneOf), ['4', '5', '6', '7', '8']);
  assert.equal(host.querySelectorAll('.cloudcanvas-ui-chips-chip[data-tone]').length, 1, 'a chip with no tone carries none');
  assert.equal(host.querySelectorAll('.cloudcanvas-ui-tree-row[data-tone]').length, 1, 'nor does a tree item');
  for (const control of controls) control.destroy();
  assert.equal(host.children.length, 0);
});
