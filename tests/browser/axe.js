/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * axe-core in a real page: the rules a screen reader's and a keyboard's
 * reader would hold the kit to, run on what is drawn. Not a suite: the runner's
 * `*.test.js` glob does not pick it up.
 *
 * The source is the `axe-core` devDependency; `CLOUDCANVAS_AXE_SOURCE` names
 * another build of it (an `axe.min.js`), which is how a host's own is tried.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const RULESETS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const source = () => readFileSync(process.env.CLOUDCANVAS_AXE_SOURCE ?? createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

/**
 * What axe finds wrong in `page` (or inside `include`, a selector), one line each: `rule (impact): the nodes' selectors`.
 * An empty list is a page axe has nothing to say about.
 * @returns {Promise<string[]>}
 */
export async function axeViolations(page, { include = null } = {}) {
  if (!(await page.evaluate(() => typeof window.axe === 'object'))) await page.addScriptTag({ content: source() });
  const found = await page.evaluate(async ([scope, tags]) => {
    const result = await window.axe.run(scope ? { include: [[scope]] } : document, { runOnly: { type: 'tag', values: tags } });
    return result.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target.join(' ')) }));
  }, [include, RULESETS]);
  return found.map(({ id, impact, targets }) => `${id} (${impact}): ${targets.join(' | ')}`);
}
