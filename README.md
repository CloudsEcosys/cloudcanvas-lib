<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->

# CloudCanvas library (`.addons/`)

The widget kit, the board components, page archetypes and the board itself, built on the CloudCanvas engine.
Everything here reaches the engine only through its published entries (`cloudcanvas`, `cloudcanvas/<add-on>`),
which `tests/unit/addons-boundary.test.js` enforces.

| Group | Subpath | What |
|---|---|---|
| forms | `cloudcanvas/forms` | button, input, checkbox, radio and radio group, toggle, slider, select (type `dropdown`) |
| display | `cloudcanvas/display` | text, badge, avatar, divider, progress, spinner, alert, list |
| kit | `cloudcanvas/lib` | both groups, the kit stylesheet, `registerBaseTypes()` |
| components | `cloudcanvas/components` | sticky note, task card, telemetry gauge, flow node, workspace group, media card, breadcrumb bar, chat message and composer, calendar event; `editable` and `snapToGrid` traits; `registerComponents()` |
| archetypes | `cloudcanvas/archetypes` | `section` and `table` types |
| sandbox | `cloudcanvas/sandbox` | `createBoard`, save format v2 (`serializeBoard` / `deserializeBoard`, v1 migrated on load), persistence and auto-save, the static-site export and its runtime bundle |

Every widget is a `widget()` (`cloudcanvas/widget`): a type whose contents live under its own key and render
through `bind` and `render`. Each has a factory taking the parent blit:

```js
import { createBoard } from 'cloudcanvas/sandbox';
import { createButton, createProgress, registerBaseTypes } from 'cloudcanvas/lib';
import { setContent } from 'cloudcanvas/widget';

registerBaseTypes();
const app = createBoard('#app');
const save = createButton(app, { x: 40, y: 40, label: 'Save', variant: 'primary', drag: true });
const bar = createProgress(app, { x: 40, y: 100, value: 20, label: 'Upload' });
save.el.addEventListener('click', () => setContent(bar, 'value', 100));
```

Three properties hold across the kit:

- **Native controls first.** A button is a `<button>`, a field an `<input>`, a bar a `<progress>`: keyboard
  operation, form semantics and the accessibility tree come from the platform.
- **Fully tokenized.** Every themable value is a `var(--cc-*, <dark default>)` read, so a page that defines
  nothing still looks designed, and `LIB_LIGHT_THEME` (or any token set) re-skins it on one host.
- **Text by default.** Contents render as text; a URL goes through `safeUrl`; markup reaches the DOM only
  through the engine's declared sinks (the repository's SECURITY.md).
