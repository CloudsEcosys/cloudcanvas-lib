<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->

# CloudCanvas library (`cloudcanvas-lib`)

Every CloudCanvas plugin, one entry each: the engine add-ons (drag, pan, panel, gpu...), the UI kit, the widget
kit, the board components, page archetypes and the board itself. Everything here is written against the core
package, [`cloudcanvas`](https://github.com/CloudsEcosys/cloudcanvas) (`blit`, `type`, the add-on kernel), and
reaches it only by package specifier (`cloudcanvas`, `cloudcanvas/kernel`, ...), which
`tests/unit/addons-boundary.test.js` enforces.

```
npm install cloudcanvas cloudcanvas-lib
```

`cloudcanvas` is a peer dependency (`>=0.7.0 <0.8.0`): one copy of the core per page, however many plugins it
imports. Coming from 0.6, the plugin subpaths move from `cloudcanvas/<name>` to `cloudcanvas-lib/<name>` and
`cloudcanvas-lib` becomes `cloudcanvas-lib` ([CHANGELOG.md](CHANGELOG.md)).

## The widget kit

| Group | Subpath | What |
|---|---|---|
| forms | `cloudcanvas-lib/forms` | button, input, checkbox, radio and radio group, toggle, slider, select (type `dropdown`) |
| display | `cloudcanvas-lib/display` | text, badge, avatar, divider, progress, spinner, alert, list |
| kit | `cloudcanvas-lib` | both groups, the kit stylesheet, `registerBaseTypes()` |
| components | `cloudcanvas-lib/components` | sticky note, task card, telemetry gauge, flow node, workspace group, media card, breadcrumb bar, chat message and composer, calendar event; `editable` and `snapToGrid` traits; `registerComponents()` |
| archetypes | `cloudcanvas-lib/archetypes` | `section` and `table` types |
| sandbox | `cloudcanvas-lib/sandbox` | `createBoard`, save format v2 (`serializeBoard` / `deserializeBoard`, v1 migrated on load), persistence and auto-save, the static-site export and its runtime bundle |
| coerce | `cloudcanvas-lib/coerce` | `asText`, `toNumber`: the kit's value coercion |

Every widget is a `widget()` (`cloudcanvas-lib/widget`): a type whose contents live under its own key and render
through `bind` and `render`. Each has a factory taking the parent blit:

```js
import { createBoard } from 'cloudcanvas-lib/sandbox';
import { createButton, createProgress, registerBaseTypes } from 'cloudcanvas-lib';
import { setContent } from 'cloudcanvas-lib/widget';

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
  through the engine's declared sinks ([the core's SECURITY.md](https://github.com/CloudsEcosys/cloudcanvas/blob/main/SECURITY.md)).

## The add-ons

One subpath each; an add-on imported but unused bundles to nothing (`sideEffects` allowlist). Sizes are
gzipped: what importing that subpath alone costs, the core code it reaches included.

| Subpath | What it adds | gz |
|---|---|---|
| `cloudcanvas-lib/drag` | press past 3px moves the blit; a grip for chromeless controls | 2.0 KB |
| `cloudcanvas-lib/select` | `is-selected`, the `select` event, `setSelected` | 1.2 KB |
| `cloudcanvas-lib/resize` | edge and corner handles, min/max, `resize:*` events | 3.2 KB |
| `cloudcanvas-lib/focus` | a zoom target: framing on click, `focus:change` | 1.4 KB |
| `cloudcanvas-lib/physics` | velocity and damping, stepped in the frame | 1.0 KB |
| `cloudcanvas-lib/connect` | edge-routed SVG connectors between blits | 3.4 KB |
| `cloudcanvas-lib/svg-state` | named SVG states with animated transitions, 3D tilt | 4.8 KB |
| `cloudcanvas-lib/cursors` | focus reticle, selection ring and brackets in the overlay | 4.4 KB |
| `cloudcanvas-lib/pan` | root camera gestures: drag, wheel, trackpad, pinch | 2.8 KB |
| `cloudcanvas-lib/keyboard` | the root as one tab stop; arrows pan, rove, Enter/Space act | 2.4 KB |
| `cloudcanvas-lib/menu` | the root's right-click menu: items by value or a registry, flyouts | 4.7 KB |
| `cloudcanvas-lib/announce` | a polite live region for focus, edits and root changes | 1.3 KB |
| `cloudcanvas-lib/observe` | markup added later becomes blits | 8.0 KB |
| `cloudcanvas-lib/motion` | an easing camera: `view()` flies, reduced motion respected | 2.8 KB |
| `cloudcanvas-lib/types` | display widgets: `card`, `media`, `vector-pointer`, `raw` | 13.4 KB |
| `cloudcanvas-lib/widget` | `widget({name, html, keys, bind, render})`: a type that renders its contents | 8.9 KB |
| `cloudcanvas-lib/keyed-list` | the one keyed list reconciler the add-ons and widgets render lists with | 0.6 KB |
| `cloudcanvas-lib/style` | whitelisted per-blit appearance overrides | 1.6 KB |
| `cloudcanvas-lib/layout` | `layout: row \| column \| grid \| free`, `gap`, scope wells sized to children | 4.1 KB |
| `cloudcanvas-lib/edit` | the edit lock: renders defer while a field has the caret | 0.5 KB |
| `cloudcanvas-lib/place` | free-spot search, `move` (reparent in place), `hit` | 8.9 KB |
| `cloudcanvas-lib/history` | `go` / `back` / `forward` / `reset` over promoted views, `breadcrumb` | 8.4 KB |
| `cloudcanvas-lib/reactions` | "when A emits X, run action Y on B", saved with the board | 12.3 KB |
| `cloudcanvas-lib/lazy` | children loaded on demand from a provider | 0.7 KB |
| `cloudcanvas-lib/offload` | off-screen blits parked out of the DOM, state kept | 1.5 KB |
| `cloudcanvas-lib/gpu` | blits drawn on the GPU (WebGPU, else WebGL2), elements kept as hit proxies; the backend loads on demand (WebGL2 +3.8 KB, WebGPU +4.7 KB); `punch` opens an `over` canvas for DOM blits | 6.5 KB |
| `cloudcanvas-lib/orbit` | Alt + drag turns the camera in 3D, Alt + wheel moves the viewer | 1.0 KB |
| `cloudcanvas-lib/mesh` | lit box, plane and sphere on the GPU, fitted to the blit, turned by `rotate` | 1.3 KB |
| `cloudcanvas-lib/svg-path` | SVG path data filled and stroked as GPU triangles, sharp at any zoom; an inline `<svg>` without a GPU | 8.5 KB |
| `cloudcanvas-lib/sprites` | sheets, frames and animations: one texture per sheet, the CSS background as fallback | 2.5 KB |
| `cloudcanvas-lib/text` | GPU text, re-rastered per zoom bucket; the element keeps the text | 2.1 KB |
| `cloudcanvas-lib/video` | a playing video as a blit, re-uploaded per video frame | 1.6 KB |
| `cloudcanvas-lib/own-canvas` | `ownCanvas(b, draw)`: a blit you draw with Canvas2D | 1.3 KB |
| `cloudcanvas-lib/xml` | `fromXml(parent, source)`: blits from XML, checked whole before anything is built | 1.7 KB |
| `cloudcanvas-lib/html-canvas` | a blit's live HTML drawn by the GPU, where the browser has HTML-in-Canvas (behind a flag today) | 1.1 KB |
| `cloudcanvas-lib/panel` | regions over a host that float, attach to an edge, open as a modal, fill the host, fold away and share a frame as tabs | 23.8 KB |
| `cloudcanvas-lib/defaults` | every DOM add-on named at once, for markup-first pages (the GPU and content add-ons are imported on their own) | 44.0 KB |

`cloudcanvas-lib/graphics` (the board's CSS, or every add-on's at once, 7.0 KB) holds the add-ons' CSS chunks; the
theme, tokens and primitives they read are the core's (`cloudcanvas/theme`, `cloudcanvas/tokens`, `cloudcanvas/primitives`).

## The UI kit

| Subpath | What | gz |
|---|---|---|
| `cloudcanvas-lib/ui` | product-agnostic DOM controls: each `create<Name>(host, callbacks)` returns `{ update(model), destroy() }`, themed through `--cc-*` tokens | 79.0 KB |
| `cloudcanvas-lib/ui/testing` | the kit's minimal Node document (`installDocument`, `makeNode`) for testing kit controls | 2.2 KB |
| `cloudcanvas-lib/sandbox/testing` | the save format's internals for tests (`readDocument`, `LOADER_FUNCTIONS`, `NODE_KEYS`, `V1_NODES_KEY`) | - |

## Bundles

`npm run build` writes `dist/`: `esm/<entry>.js` for every entry above (shared code in `esm/chunk-*.js`, the
core imported by specifier, so a page needs an import map for `cloudcanvas`), `cloudcanvas-lib.esm.js` (the kit)
and `cloudcanvas-ui.esm.js` (the UI kit), both with the core external, and `cloudcanvas.board.iife.js`, the
self-contained board runtime a static export loads from `file://`.

## Repositories

CloudCanvas is four repositories, each with one concern. Clone them side by side.

| Repository | Concern | Depends on |
|---|---|---|
| [cloudcanvas](https://github.com/CloudsEcosys/cloudcanvas) | The core: `blit`, `type`, the add-on kernel, theme, tokens and primitives | nothing |
| [cloudcanvas-lib](https://github.com/CloudsEcosys/cloudcanvas-lib) | Every plugin, one entry each: the add-ons (drag, pan, panel, gpu...), the UI kit, the widgets and the board | `cloudcanvas` |
| [cloudcanvas-site](https://github.com/CloudsEcosys/cloudcanvas-site) (private) | The showcase site and sandbox builder | `cloudcanvas`, `cloudcanvas-lib` |
| [cloudcanvas-mcp](https://github.com/CloudsEcosys/cloudcanvas-mcp) (private) | The MCP server, sync hub and web client | `cloudcanvas`, `cloudcanvas-lib` |

## License

MIT. Written by Richard Christopher, NeoTec, LLC.
