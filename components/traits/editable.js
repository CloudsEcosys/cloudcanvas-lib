/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * editable: double-click a widget's title, type, Enter to keep it, Escape to
 * drop it. A function trait, named by `registerComponents()`:
 *
 *   blit.use({ editable });
 *   note.set({ editable: true });                 // or { targetKey, selector }
 *
 * It renders nothing of its own and works on any widget whose template paints
 * a title it recognises (`DEFAULT_EDITABLE_SELECTOR`). Two rules keep it from
 * fighting the widget that owns the title:
 *
 *   - **The title's own node is never replaced.** The input is inserted
 *     *beside* the title and the title hidden; the Text node the widget writes
 *     through survives, so the next render still reaches it.
 *   - **The edit lock is taken** (`cloudcanvas/edit`). A render landing mid-edit
 *     is deferred; the commit writes the content with `setContent` and `end`
 *     then replays the one render, onto the committed value.
 *
 * A commit emits `edited` `{key, value}`. Escape cannot become a commit: the
 * input is closed before its blur can fire, and the blur finds the edit over.
 * Stopping the trait cancels an open edit.
 */
import { begin, end, isEditing } from '../../../.plugin/addons/edit.js';
import { contentKeyOf, contentOf, setContent } from '../../../.plugin/addons/widget.js';

/** The class the input carries; styled by `COMPONENT_DEFAULT_CSS`. */
export const EDITABLE_INPUT_CLASS = 'cloudcanvas-editable-input';

/** The event a committed edit emits. */
export const EDITED_EVENT = 'edited';

/** The title nodes the trait recognises, the display card's first. */
export const DEFAULT_EDITABLE_SELECTOR = [
  '.cloudcanvas-pin-title',
  '.cloudcanvas-sticky-title',
  '.cloudcanvas-task-title',
  '.cloudcanvas-telemetry-title',
  '.cloudcanvas-flow-title',
  '.cloudcanvas-media-title',
  '.cloudcanvas-workspace-title-text'
].join(', ');

/** The first node matching `selector` that is `b`'s own, not a nested blit's. */
function ownTitleOf(b, selector) {
  for (const node of b.el.querySelectorAll(selector)) {
    if (node.closest('[data-blit]') === b.el) return node;
  }
  return null;
}

/** Write the committed value and say so. */
function commit(b, key, value) {
  setContent(b, key, value);
  b.emit(EDITED_EVENT, { key, value });
}

/** The editor: a text input holding the content's current value, or the title's text without one. */
function makeInput(b, key, target) {
  const input = document.createElement('input');
  input.className = EDITABLE_INPUT_CLASS;
  input.setAttribute('type', 'text');
  input.setAttribute('aria-label', `Edit ${key}`);
  const current = contentOf(b)[key];
  input.value = current === undefined || current === null ? target.textContent : String(current);
  return input;
}

/**
 * Open an editor beside `target` under the edit lock.
 * @returns {Function|null} its close, `(commit: boolean) => void`; null when the blit is no widget or already editing
 */
export function beginInlineEdit(b, target, key = 'title') {
  if (!contentKeyOf(b) || isEditing(b) || !target?.parentNode) return null;
  const original = target.textContent;
  const input = makeInput(b, key, target);
  begin(b, input);
  target.hidden = true;
  target.parentNode.insertBefore(input, target.nextSibling);
  input.focus();
  input.select();

  let open = true;
  const close = (keep) => {
    if (!open) return;
    open = false;
    input.remove();
    target.hidden = false;
    if (keep) commit(b, key, input.value.trim() || original);
    end(b);
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      close(false);
    }
  });
  input.addEventListener('blur', () => close(true));
  return close;
}

/**
 * The trait. @param {{targetKey?: string, selector?: string}|true} [options] the content key a
 * commit writes (`title`) and the title nodes it recognises
 * @returns {() => void} off, which also cancels an open edit
 */
export function editable(b, options) {
  const { targetKey = 'title', selector = DEFAULT_EDITABLE_SELECTOR } = options && typeof options === 'object' ? options : {};
  let close = null;
  const onDoubleClick = (event) => {
    const target = ownTitleOf(b, selector);
    if (!target || !target.contains(event.target)) return;
    event.stopPropagation();
    close = beginInlineEdit(b, target, targetKey) ?? close;
  };
  b.el.addEventListener('dblclick', onDoubleClick);
  return () => {
    b.el.removeEventListener('dblclick', onDoubleClick);
    close?.(false);
  };
}
