/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The markdown subset: what it renders, what it refuses (raw HTML, unsafe
 * links), task toggling, and bounded cost on hostile input.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownView, renderMarkdown, safeHref, toggleTaskLine } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

function html(source, options) {
  const box = document.createElement('div');
  box.append(renderMarkdown(source, options));
  return box;
}

test('blocks: headings, paragraphs with line breaks, lists, quotes, code, rules', () => {
  const box = html('# Title\nfirst line\nsecond line\n\n- a\n- b\n  - nested\n\n3. three\n4. four\n\n> quoted **bold**\n\n```js\nconst x = 1 < 2;\n```\n\n---');
  assert.equal(box.querySelector('h1').textContent, 'Title');
  assert.equal(box.querySelector('p').querySelectorAll('br').length, 1);
  assert.deepEqual([...box.querySelectorAll('ul > li')].map((li) => li.firstChild.textContent), ['a', 'b', 'nested']);
  assert.equal(box.querySelector('ul ul li').textContent, 'nested');
  assert.equal(box.querySelector('ol').getAttribute('start'), '3');
  assert.equal(box.querySelector('blockquote strong').textContent, 'bold');
  assert.equal(box.querySelector('pre code').textContent, 'const x = 1 < 2;');
  assert.equal(box.querySelector('pre code').getAttribute('data-language'), 'js');
  assert.ok(box.querySelector('hr'));
});

test('inline: strong, em, strike, code, and intraword underscores left alone', () => {
  const box = html('**b** *i* _u_ ~~s~~ `a*b` snake_case_name __strong__');
  assert.equal(box.querySelectorAll('strong').length, 2);
  assert.deepEqual([...box.querySelectorAll('em')].map((node) => node.textContent), ['i', 'u']);
  assert.equal(box.querySelector('del').textContent, 's');
  assert.equal(box.querySelector('code').textContent, 'a*b');
  assert.match(box.textContent, /snake_case_name/);
});

test('raw HTML is text: no element, attribute or handler survives', () => {
  const box = html('<script>alert(1)</script> <img src=x onerror=alert(1)> <b>bold</b>\n\n<div onclick="x()">');
  assertSame(box.querySelector('script, img, b, div'), null);
  assert.match(box.textContent, /<script>alert\(1\)<\/script>/);
  assert.equal(box.innerHTML.includes('onerror='), true, 'the characters are there, as escaped text');
  assert.equal([...box.querySelectorAll('*')].some((node) => [...node.attributes].some((attr) => attr.name.startsWith('on'))), false);
});

test('links: safe schemes pass with rel and target; everything else renders as text', () => {
  const box = html('[ok](https://example.com "Site") [mail](mailto:a@b.c) [rel](/notes/1) [js](javascript:alert(1)) [js2](JaVa\tScRiPt:x) [data](data:text/html,x) [proto](//evil.com) <https://auto.example> see https://bare.example/path.');
  const links = [...box.querySelectorAll('a')];
  assert.deepEqual(links.map((link) => link.getAttribute('href')), ['https://example.com', 'mailto:a@b.c', '/notes/1', 'https://auto.example', 'https://bare.example/path']);
  assert.equal(links[0].getAttribute('rel'), 'noopener noreferrer nofollow');
  assert.equal(links[0].getAttribute('target'), '_blank');
  assert.equal(links[0].getAttribute('title'), 'Site');
  assert.equal(links[2].hasAttribute('target'), false, 'a relative link stays in the app');
  assert.match(box.textContent, /js js2 data proto/);
  assertSame(html('[rel](/x)', { allowRelativeLinks: false }).querySelector('a'), null);
  assert.deepEqual(safeHref(' https://ok '), { href: 'https://ok', external: true });
  assert.deepEqual(safeHref('HTTPS://Example.com/A'), { href: 'HTTPS://Example.com/A', external: true }, 'schemes compare case-insensitively');
  assert.deepEqual(safeHref('MailTo:a@b.c'), { href: 'MailTo:a@b.c', external: false });
  const mixed = html('[up](HTTPS://example.com) [bad](JaVaScRiPt:alert(1)) [bad2](DATA:text/html,x)');
  assert.deepEqual([...mixed.querySelectorAll('a')].map((link) => [link.getAttribute('href'), link.getAttribute('target')]), [['HTTPS://example.com', '_blank']]);
  assert.match(mixed.textContent, /bad bad2/);
  assert.equal(safeHref('vbscript:x'), null);
});

test('mentions resolve through the host; unknown handles stay text', () => {
  const people = { ann: { label: 'Ann Lee' }, bob: { label: '@bob', href: 'https://people.example/bob' } };
  const box = html('hi @ann and @bob and @zed, mail me@site.example', { mentions: (handle) => people[handle] ?? null });
  assert.equal(box.querySelector('[data-mention="ann"]').textContent, 'Ann Lee');
  assert.equal(box.querySelector('a').getAttribute('href'), 'https://people.example/bob');
  assert.match(box.textContent, /@zed/);
  assert.match(box.textContent, /me@site\.example/);
});

test('tasks: read-only by default; a view with onTaskToggle reports the source line; toggleTaskLine rewrites it', (t) => {
  const source = 'Todo\n- [ ] milk\n- [x] bread\n  - [ ] nested';
  const box = html(source);
  const boxes = [...box.querySelectorAll('input[type="checkbox"]')];
  assert.deepEqual(boxes.map((node) => [node.checked, node.disabled, node.getAttribute('data-line')]),
    [[false, true, '1'], [true, true, '2'], [false, true, '3']]);
  const host = mount(t);
  const toggles = [];
  const view = createMarkdownView(host, { onTaskToggle: (line, checked) => toggles.push([line, checked]) });
  view.update({ source });
  const first = host.querySelector('input[data-line="3"]');
  assert.equal(first.disabled, false);
  first.checked = true;
  first.dispatchEvent(new Event('change', { bubbles: true }));
  assert.deepEqual(toggles, [[3, true]]);
  assert.equal(toggleTaskLine(source, 3, true), 'Todo\n- [ ] milk\n- [x] bread\n  - [x] nested');
  assert.equal(toggleTaskLine(source, 0, true), source, 'a line that is not a task is left alone');
  view.destroy();
  assert.equal(host.children.length, 0);
});

test('hostile input costs bounded time and depth', () => {
  const started = performance.now();
  html(`${'**'.repeat(20000)}\n${'['.repeat(5000)}](${'('.repeat(3000)}\n${'> '.repeat(500)}deep\n${'- '.repeat(500)}x`);
  html('x'.repeat(200000));
  assert.ok(performance.now() - started < 1500, `took ${performance.now() - started}ms`);
  const deep = html(`${'> '.repeat(50)}deep`);
  assert.ok(deep.querySelectorAll('blockquote').length <= 7);
  assert.match(deep.textContent, /deep/);
});
