/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The `.addons/` display and feedback widgets: Text, Badge, Avatar, Divider,
 * Progress, Spinner, Alert.
 *
 * The claims under test are the ones the previous component pass got wrong, so
 * each is asserted against the real DOM a root rendered rather than against the
 * template function in isolation:
 *
 *   - a factory produces a *chromeless* blit of its own type,
 *   - definition is a call and idempotent, never an import-time side effect,
 *   - the declared keys actually bite on `setContents`,
 *   - a caller-supplied URL never reaches an `src` (`javascript:` is the case
 *     that shipped once),
 *   - the dismiss convention is one convention: a cancelable `dismiss` event
 *     whose default action is removal, and
 *   - tone text clears 4.5:1 against the surface it is actually printed on,
 *     computed here rather than eyeballed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { compositeOver, contrastTextFor, relativeLuminance } from 'cloudcanvas/primitives';
import { BADGE_SURFACE } from 'cloudcanvas/primitives';
import { LIGHT_THEME } from 'cloudcanvas/theme';
import { setContents } from '../../plugins/widget.js';
import { createText, registerText } from '../../display/text.js';
import { createBadge, registerBadge, toneSurface } from '../../display/badge.js';
import { createAvatar, registerAvatar } from '../../display/avatar.js';
import { createDivider, registerDivider } from '../../display/divider.js';
import { createProgress, registerProgress } from '../../display/progress.js';
import { createSpinner, registerSpinner } from '../../display/spinner.js';
import { createAlert, registerAlert } from '../../display/alert.js';
import { coreScene } from '../helpers/core-scene.js';

/** WCAG AA for body text. */
const MIN_CONTRAST = 4.5;

const XSS = '<img src=x onerror="alert(1)">';

const TONES = ['info', 'success', 'warning', 'danger'];

/** Every widget, its factory, its registrar, and enough contents to render. */
const WIDGETS = [
  { name: 'text', create: createText, register: registerText, contents: { text: 'hello' } },
  { name: 'badge', create: createBadge, register: registerBadge, contents: { text: 'new' } },
  { name: 'avatar', create: createAvatar, register: registerAvatar, contents: { name: 'Ada Lovelace' } },
  { name: 'divider', create: createDivider, register: registerDivider, contents: {} },
  { name: 'progress', create: createProgress, register: registerProgress, contents: { value: 40 } },
  { name: 'spinner', create: createSpinner, register: registerSpinner, contents: {} },
  { name: 'alert', create: createAlert, register: registerAlert, contents: { message: 'saved' } }
];

/** The widget's own root: the single element its template puts under the blit's element. */
function widgetRoot(b) {
  return b.el.firstElementChild;
}

/** Write contents (the render runs at once) and answer the widget's root. */
function write(b, contents) {
  setContents(b, contents);
  return widgetRoot(b);
}

/** One custom property out of an element's literal `style` attribute. */
function customProperty(element, name) {
  const style = element.getAttribute('style') || '';
  const match = new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`).exec(style);
  return match ? match[1].trim() : '';
}

/** WCAG contrast ratio between two hex colours, computed from the library's own luminance. */
function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  assert.ok(Number.isFinite(a), `foreground "${foreground}" is not a readable colour`);
  assert.ok(Number.isFinite(b), `background "${background}" is not a readable colour`);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Dispatch a real bubbling click, the way a pointer would. */
function click(element) {
  element.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
}

/* ------------------ THE SHARED CONTRACT ------------------ */

test('lib display - every factory creates a chromeless blit of its own type', (t) => {
  const { app } = coreScene(t);
  for (const widget of WIDGETS) {
    const b = widget.create(app, { id: `${widget.name}_chrome`, contents: widget.contents });
    assert.equal(b.el.getAttribute('data-type'), widget.name, `${widget.name} is not its own type`);
    assert.equal(b.el.getAttribute('data-chrome'), 'false', `${widget.name} kept the default card chrome`);
    assert.equal(b.el.id, `${widget.name}_chrome`);
    assert.ok(widgetRoot(b), `${widget.name} rendered no subtree`);
  }
});

test('lib display - definition is a call, idempotent, and answers the type', () => {
  for (const widget of WIDGETS) {
    const first = widget.register();
    assert.equal(widget.register(), first, `${widget.name} defined twice`);
    assert.equal(first.el.tagName, 'TEMPLATE');
    assert.equal(first.el.getAttribute('data-type'), widget.name);
  }
});

test('lib display - a key the widget does not declare is refused', (t) => {
  const { app } = coreScene(t);
  for (const widget of WIDGETS) {
    const b = widget.create(app, { id: `${widget.name}_keys`, contents: widget.contents });
    assert.throws(() => setContents(b, { nonsense: 'no' }), /key "nonsense" not permitted/,
      `${widget.name} accepted an unknown content key`);
  }
});

/* ------------------ TEXT ------------------ */

test('lib display - Text is the element `as` names', (t) => {
  const { app } = coreScene(t);
  assert.equal(widgetRoot(createText(app, { id: 'text_default' })).tagName, 'SPAN');

  for (const tag of ['p', 'h1', 'h2', 'h3', 'h4', 'label']) {
    const b = createText(app, { id: `text_${tag}`, as: tag, text: tag });
    assert.equal(widgetRoot(b).tagName, tag.toUpperCase());
    assert.equal(widgetRoot(b).textContent, tag);
  }

  // `as` reaches createElement; an unknown value is the default, not an element.
  assert.equal(widgetRoot(createText(app, { id: 'text_forged', as: 'script', text: 'x' })).tagName, 'SPAN');
});

test('lib display - Text keeps its element until `as` moves, then swaps it and keeps the rest', (t) => {
  const { app } = coreScene(t);
  const b = createText(app, { id: 'text_swap', text: 'Title', as: 'p', size: 'lg' });
  const paragraph = widgetRoot(b);

  assert.equal(write(b, { text: 'Retitled' }), paragraph, 'a write that kept `as` rebuilt the element');
  const heading = write(b, { as: 'h2' });
  assert.equal(heading.tagName, 'H2');
  assert.equal(paragraph.isConnected, false, 'the old element was left behind');
  assert.equal(heading.textContent, 'Retitled');
  assert.equal(heading.classList.contains('cloudcanvas-lib-text'), true);
  assert.equal(heading.classList.contains('cloudcanvas-lib-text-lg'), true);
  assert.equal(b.el.children.length, 1);
});

test('lib display - Text writes through a Text node, so markup stays text', (t) => {
  const { app } = coreScene(t);
  const b = createText(app, { id: 'text_xss', text: XSS });
  const root = widgetRoot(b);

  assert.equal(root.textContent, XSS);
  assert.equal(root.children.length, 0, 'the content key was parsed as markup');

  const node = root.firstChild;
  write(b, { text: 'plain', tone: 'muted', size: 'lg', weight: 'semibold' });
  assert.equal(root.firstChild, node, 'the text node was rebuilt on a content change');
  assert.equal(node.data, 'plain');
  assert.equal(root.classList.contains('cloudcanvas-lib-text-muted'), true);
  assert.equal(root.classList.contains('cloudcanvas-lib-text-lg'), true);
  assert.equal(root.classList.contains('cloudcanvas-lib-text-semibold'), true);

  // A variant swap takes the previous class with it, and never the root class.
  write(b, { tone: 'default', size: 'xs', weight: 'regular' });
  assert.equal(root.classList.contains('cloudcanvas-lib-text-muted'), false);
  assert.equal(root.classList.contains('cloudcanvas-lib-text-lg'), false);
  assert.equal(root.classList.contains('cloudcanvas-lib-text-semibold'), false);
  assert.equal(root.classList.contains('cloudcanvas-lib-text-xs'), true);
  assert.equal(root.classList.contains('cloudcanvas-lib-text'), true);
});

/* ------------------ BADGE / ALERT: THE DISMISS CONVENTION ------------------ */

test('lib display - Badge dismiss emits, then removes the blit', (t) => {
  const { app } = coreScene(t);
  const b = createBadge(app, { id: 'badge_dismiss', text: 'beta', dismissible: true });

  const button = widgetRoot(b).querySelector('button');
  assert.equal(button.getAttribute('type'), 'button');
  assert.equal(button.getAttribute('aria-label'), 'Dismiss');
  assert.equal(button.hidden, false);

  const seen = [];
  b.on('dismiss', (event) => seen.push(event));
  click(button);

  assert.equal(seen.length, 1, 'no dismiss event was emitted');
  assert.equal(seen[0].defaultPrevented, false);
  assert.equal(app.find('badge_dismiss'), null, 'the blit survived its own dismissal');
  assert.equal(b.el.isConnected, false);
});

test('lib display - a prevented dismiss leaves the blit alive', (t) => {
  const { app } = coreScene(t);

  const badge = createBadge(app, { id: 'badge_kept', text: 'beta', dismissible: true });
  badge.on('dismiss', (event) => event.preventDefault());
  click(widgetRoot(badge).querySelector('button'));
  assert.equal(app.find('badge_kept'), badge, 'preventDefault() did not keep the Badge');

  const alert = createAlert(app, { id: 'alert_kept', message: 'careful' });
  alert.on('dismiss', (event) => event.preventDefault());
  click(widgetRoot(alert).querySelector('button'));
  assert.equal(app.find('alert_kept'), alert, 'preventDefault() did not keep the Alert');
});

test('lib display - Alert dismiss removes by default, and each widget keeps its own default', (t) => {
  const { app } = coreScene(t);

  const alert = createAlert(app, { id: 'alert_dismiss', message: 'gone' });
  const alertButton = widgetRoot(alert).querySelector('button');
  assert.equal(alertButton.hidden, false, 'an Alert is dismissible unless told otherwise');
  click(alertButton);
  assert.equal(app.find('alert_dismiss'), null);

  const badge = createBadge(app, { id: 'badge_plain', text: 'v2' });
  assert.equal(widgetRoot(badge).querySelector('button').hidden, true, 'a Badge is not dismissible unless told otherwise');

  const quiet = createAlert(app, { id: 'alert_quiet', message: 'stays', dismissible: false });
  assert.equal(widgetRoot(quiet).querySelector('button').hidden, true);
});

/* ------------------ ALERT: URGENCY FOLLOWS TONE ------------------ */

test('lib display - the Alert role tracks the tone on every render', (t) => {
  const { app } = coreScene(t);
  const b = createAlert(app, { id: 'alert_role', title: 'Heads up', message: 'disk is filling', tone: 'info' });
  const root = widgetRoot(b);

  assert.equal(root.getAttribute('role'), 'status');
  assert.equal(root.querySelector('.cloudcanvas-lib-alert-title').textContent, 'Heads up');
  assert.equal(root.querySelector('.cloudcanvas-lib-alert-body').textContent, 'disk is filling');

  assert.equal(write(b, { tone: 'success' }).getAttribute('role'), 'status');
  assert.equal(write(b, { tone: 'warning' }).getAttribute('role'), 'alert');
  assert.equal(write(b, { tone: 'danger' }).getAttribute('role'), 'alert');
  assert.equal(root.classList.contains('cloudcanvas-lib-alert-danger'), true);
  assert.equal(root.classList.contains('cloudcanvas-lib-alert-warning'), false);
  assert.equal(write(b, { tone: 'info' }).getAttribute('role'), 'status');

  // A title that goes away is hidden, not rebuilt.
  const title = root.querySelector('.cloudcanvas-lib-alert-title');
  write(b, { title: '' });
  assert.equal(title.hidden, true);
  assert.equal(root.querySelector('.cloudcanvas-lib-alert-title'), title);
});

/* ------------------ AVATAR: THE URL GUARD ------------------ */

test('lib display - Avatar refuses an executable URL and falls back to initials', (t) => {
  const { app } = coreScene(t);
  const b = createAvatar(app, { id: 'avatar_xss', name: 'Richard Christopher', src: 'javascript:alert(1)' });
  const root = widgetRoot(b);
  const image = root.querySelector('img');
  const initials = root.querySelector('.cloudcanvas-lib-avatar-initials');

  assert.equal(root.querySelector('img[src]'), null, 'a rejected URL still reached the src attribute');
  assert.equal(b.el.innerHTML.includes('javascript:'), false);
  assert.equal(image.hidden, true);

  assert.equal(initials.hidden, false);
  assert.equal(initials.textContent, 'RC');
  assert.equal(initials.getAttribute('role'), 'img');
  assert.equal(initials.getAttribute('aria-label'), 'Richard Christopher');

  // The other executable form, and the control-character smuggling of it.
  write(b, { src: 'data:text/html,<script>alert(1)</script>' });
  assert.equal(root.querySelector('img[src]'), null);
  write(b, { src: 'java\u0000script:alert(1)' });
  assert.equal(root.querySelector('img[src]'), null);
  assert.equal(image.hidden, true);
});

test('lib display - Avatar shows a real image for a URL that passes', (t) => {
  const { app } = coreScene(t);
  const b = createAvatar(app, { id: 'avatar_image', name: 'Ada Lovelace', src: 'https://example.test/ada.png', size: 'lg' });
  const root = widgetRoot(b);
  const image = root.querySelector('img');

  assert.equal(image.getAttribute('src'), 'https://example.test/ada.png');
  assert.equal(image.getAttribute('alt'), 'Ada Lovelace');
  assert.equal(image.hidden, false);
  assert.equal(root.querySelector('.cloudcanvas-lib-avatar-initials').hidden, true);
  assert.equal(root.classList.contains('cloudcanvas-lib-avatar-lg'), true);
  assert.equal(write(b, { size: 'sm' }).classList.contains('cloudcanvas-lib-avatar-lg'), false);
  assert.equal(root.classList.contains('cloudcanvas-lib-avatar-sm'), true);

  // A one-word name still yields one initial rather than nothing.
  const single = createAvatar(app, { id: 'avatar_single', name: 'prince' });
  assert.equal(widgetRoot(single).querySelector('.cloudcanvas-lib-avatar-initials').textContent, 'P');
});

/* ------------------ DIVIDER ------------------ */

test('lib display - Divider is an <hr> horizontally and a separator vertically', (t) => {
  const { app } = coreScene(t);

  const horizontal = widgetRoot(createDivider(app, { id: 'divider_h' }));
  assert.equal(horizontal.tagName, 'HR');
  assert.equal(horizontal.getAttribute('aria-orientation'), 'horizontal');
  assert.equal(horizontal.hasAttribute('role'), false);
  assert.equal(horizontal.classList.contains('cloudcanvas-lib-divider-vertical'), false);

  const vertical = widgetRoot(createDivider(app, { id: 'divider_v', orientation: 'vertical' }));
  assert.equal(vertical.tagName, 'DIV');
  assert.equal(vertical.getAttribute('role'), 'separator');
  assert.equal(vertical.getAttribute('aria-orientation'), 'vertical');
  assert.equal(vertical.classList.contains('cloudcanvas-lib-divider-vertical'), true);
});

test('lib display - a Divider whose orientation flips becomes the other element', (t) => {
  const { app } = coreScene(t);
  const b = createDivider(app, { id: 'divider_flip' });
  const rule = widgetRoot(b);

  assert.equal(write(b, { orientation: 'horizontal' }), rule, 'an unchanged orientation rebuilt the element');
  const vertical = write(b, { orientation: 'vertical' });
  assert.equal(vertical.tagName, 'DIV');
  assert.equal(vertical.getAttribute('role'), 'separator');
  assert.equal(vertical.classList.contains('cloudcanvas-lib-divider'), true);

  const back = write(b, { orientation: 'horizontal' });
  assert.equal(back.tagName, 'HR');
  assert.equal(back.hasAttribute('role'), false, 'the separator role survived onto the <hr>');
  assert.equal(back.getAttribute('aria-orientation'), 'horizontal');
  assert.equal(back.classList.contains('cloudcanvas-lib-divider-vertical'), false);
  assert.equal(b.el.children.length, 1);
});

/* ------------------ PROGRESS ------------------ */

test('lib display - Progress carries its value on the native element', (t) => {
  const { app } = coreScene(t);
  const b = createProgress(app, { id: 'progress_native', value: 30, max: 60, label: 'Uploading' });
  const root = widgetRoot(b);
  const bar = root.querySelector('progress');

  assert.ok(bar, 'Progress did not build a native <progress>');
  assert.equal(bar.getAttribute('value'), '30');
  assert.equal(bar.getAttribute('max'), '60');
  assert.equal(bar.getAttribute('aria-label'), 'Uploading');
  assert.equal(root.querySelector('.cloudcanvas-lib-progress-label').hidden, false);

  write(b, { value: 45 });
  assert.equal(bar.getAttribute('value'), '45');

  // Out-of-range values are clamped rather than handed to the platform.
  write(b, { value: 999 });
  assert.equal(bar.getAttribute('value'), '60');
  write(b, { value: -5 });
  assert.equal(bar.getAttribute('value'), '0');

  // A non-positive max is not a bar; the default stands.
  write(b, { max: 0 });
  assert.equal(bar.getAttribute('max'), '100');

  const bare = createProgress(app, { id: 'progress_bare', value: 10 });
  const bareRoot = widgetRoot(bare);
  const bareBar = bareRoot.querySelector('progress');
  assert.equal(bareBar.getAttribute('max'), '100');
  assert.equal(bareRoot.querySelector('.cloudcanvas-lib-progress-label').hidden, true);
  assert.equal(bareBar.classList.contains('cloudcanvas-lib-progress'), true);

  write(bare, { tone: 'danger' });
  assert.equal(bareBar.classList.contains('cloudcanvas-lib-progress-danger'), true);
  write(bare, { tone: 'default' });
  assert.equal(bareBar.classList.contains('cloudcanvas-lib-progress-danger'), false);
});

/* ------------------ SPINNER ------------------ */

test('lib display - Spinner is a named status carrying the animated class', (t) => {
  const { app } = coreScene(t);
  const b = createSpinner(app, { id: 'spinner_default' });
  const root = widgetRoot(b);

  assert.equal(root.getAttribute('role'), 'status');
  assert.equal(root.getAttribute('aria-label'), 'Loading');
  assert.equal(
    root.classList.contains('cloudcanvas-lib-spinner'),
    true,
    'the class carrying the keyframes and the reduced-motion override is missing'
  );

  assert.equal(write(b, { label: 'Fetching results' }).getAttribute('aria-label'), 'Fetching results');
  assert.equal(write(b, { label: '' }).getAttribute('aria-label'), 'Loading');
});

/* ------------------ CONTRAST ------------------ */

/**
 * The card surfaces a toned widget is verified against, per theme. A toned
 * Badge/Alert writes its fill *translucent* (so it composites over the live
 * card), so the contrast test has to composite it too: over the dark card in the
 * default theme, over the light card once `LIGHT_THEME` is applied.
 */
const DARK_SURFACE = '#1e293b';
const LIGHT_SURFACE = '#fbfbfc';

/** The foreground a light theme forces onto every toned label and panel. */
const LIGHT_FOREGROUND = LIGHT_THEME['--cc-badge-text-override'];

/** Split a `#rrggbbaa` fill into its `#rrggbb` tint and its 0..1 alpha. */
function splitTint(value) {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(value.trim());
  assert.ok(match, `expected a translucent #rrggbbaa fill, got "${value}"`);
  return { tint: `#${match[1]}`, alpha: parseInt(match[2], 16) / 255 };
}

/**
 * The dark-theme foreground out of a themed `var(--cc-badge-text-override, x)`
 * declaration - `x`, the fallback a page with no theme actually paints. That the
 * value is written *through* the token at all is what lets a light theme win, so
 * the shape is asserted here rather than tolerated.
 */
function darkForeground(value) {
  const match = /^var\(--cc-badge-text-override,\s*([\s\S]*)\)$/.exec(value.trim());
  assert.ok(match, `foreground "${value}" is not written through the override token`);
  return match[1].trim();
}

/** Assert a foreground clears AA on a tint composited over one card surface. */
function assertClears(fg, tint, alpha, surface, label) {
  const bg = compositeOver(tint, alpha, surface);
  const ratio = contrastRatio(fg, bg);
  assert.ok(ratio >= MIN_CONTRAST, `${label}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1`);
}

test('lib display - every tone clears 4.5:1 in both the dark and the light theme', (t) => {
  const { app } = coreScene(t);

  for (const tone of TONES) {
    const badge = widgetRoot(createBadge(app, { id: `badge_${tone}`, text: tone, tone }));
    const badgeFill = splitTint(customProperty(badge, '--cc-badge-bg'));
    assert.match(
      customProperty(badge, '--cc-badge-border'),
      /^#[0-9a-f]{6}[0-9a-f]{2}$/,
      `Badge "${tone}" edge is not a translucent tint`
    );
    const badgeDark = darkForeground(customProperty(badge, '--cc-badge-text'));

    // Dark theme: the computed fallback, on the tint over the dark card.
    assertClears(badgeDark, badgeFill.tint, badgeFill.alpha, DARK_SURFACE, `Badge "${tone}" dark`);
    // Light theme: the theme's own foreground, on the tint over the light card.
    assertClears(LIGHT_FOREGROUND, badgeFill.tint, badgeFill.alpha, LIGHT_SURFACE, `Badge "${tone}" light`);

    const alert = widgetRoot(createAlert(app, {
      id: `alert_${tone}`,
      title: tone,
      message: 'a message long enough to read',
      tone
    }));
    const alertFill = splitTint(customProperty(alert, '--cc-scope-bg'));

    // Both foregrounds, because the sheet prints the message body muted and a
    // muted slate over a tinted panel is the 3.9:1 failure the override exists for.
    for (const token of ['--cc-text', '--cc-text-muted']) {
      const alertDark = darkForeground(customProperty(alert, token));
      assertClears(alertDark, alertFill.tint, alertFill.alpha, DARK_SURFACE, `Alert "${tone}" ${token} dark`);
      assertClears(LIGHT_FOREGROUND, alertFill.tint, alertFill.alpha, LIGHT_SURFACE, `Alert "${tone}" ${token} light`);
    }
  }
});

test('lib display - the dark foreground is chosen on the framework\'s own composite', () => {
  for (const tone of TONES) {
    const { background, text } = toneSurface(tone);
    const { tint, alpha } = splitTint(background);
    assert.equal(text, contrastTextFor(compositeOver(tint, alpha, BADGE_SURFACE)), `${tone}: the composite drifted`);
  }
  assert.equal(toneSurface('neutral'), null);
});

test('lib display - a neutral Badge writes no colour at all', (t) => {
  const { app } = coreScene(t);
  const b = createBadge(app, { id: 'badge_neutral', text: 'draft' });
  const root = widgetRoot(b);

  assert.equal(root.getAttribute('data-tone'), 'neutral');
  assert.equal(root.getAttribute('style'), '', 'neutral overrode the themeable --cc-badge-* tokens');

  // ...and an unknown tone is neutral, not an uncoloured tinted chip.
  assert.equal(write(b, { tone: 'chartreuse' }).getAttribute('data-tone'), 'neutral');
  assert.equal(root.getAttribute('style'), '');
  assert.match(write(b, { tone: 'danger' }).getAttribute('style'), /--cc-badge-bg:#[0-9a-f]{6}/);
});
