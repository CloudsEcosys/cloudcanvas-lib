<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->

# CloudCanvas UI Kit (`lib/`)

A base widget kit built on `defineComponent` — fifteen small, native-controls-first
Pin types that compose into layouts rather than replacing them.

Three properties define it:

- **Native controls first.** A button is a `<button>`, a field is an `<input>`, a
  bar is a `<progress>`. Keyboard operation, form semantics and the accessibility
  tree come from the platform; the stylesheet's job is to not take the focus ring
  away, which is why the one `:focus-visible` rule matches on the class attribute
  rather than on a list of names.
- **Fully tokenized.** Every themable value is a `var(--cc-*, <dark default>)`
  read. There is no `:root` block — the dark theme *is* the fallback chain — so a
  page that defines nothing still looks designed, and a page that defines one
  token changes exactly one thing.
- **`chrome: false` by default.** A widget is not a card. It paints only itself,
  so a Pin can hold one or a layout can hold twenty.

This layer is optional and additive: nothing in `src/` imports it, and
importing it registers nothing. It ships as its own package export
(`cloudcanvas/lib`).

## Quick start

```js
import { createButtonPin, injectLibStyles } from '../lib/index.js';

injectLibStyles();
const btn = createButtonPin(session, { x: 40, y: 40, contents: { label: 'Save' } });
```

Registration is lazy: `createButtonPin` defines the component the first time it
is called. To register the whole kit up front — before any Pin is created, or
into a registry of your own — call it explicitly. Importing the barrel alone
never touches the registry.

```js
import { registerBaseTypes } from '../lib/index.js';
registerBaseTypes();
```

## Widgets

| Widget   | Factory                | Registrar            |
| -------- | ---------------------- | -------------------- |
| Button   | `createButtonPin`      | `registerButton`     |
| Input    | `createInputPin`       | `registerInput`      |
| Checkbox | `createCheckboxPin`    | `registerCheckbox`   |
| Radio    | `createRadioPin`       | `registerRadio`      |
| Radio group | `createRadioGroupPin` | `registerRadioGroup` |
| Toggle   | `createTogglePin`      | `registerToggle`     |
| Slider   | `createSliderPin`      | `registerSlider`     |
| Select   | `createSelectPin`      | `registerSelect`     |
| Text     | `createTextPin`        | `registerText`       |
| Badge    | `createBadgePin`       | `registerBadge`      |
| Avatar   | `createAvatarPin`      | `registerAvatar`     |
| Divider  | `createDividerPin`     | `registerDivider`    |
| Progress | `createProgressPin`    | `registerProgress`   |
| Spinner  | `createSpinnerPin`     | `registerSpinner`    |
| Alert    | `createAlertPin`       | `registerAlert`      |
| List     | `createListPin`        | `registerList`       |

## Class contract

Every widget names its root `cloudcanvas-lib-<widget>` and every child
`cloudcanvas-lib-<widget>-<part>`. Variants are flat modifier classes in the same
shape (`cloudcanvas-lib-button-primary`, `cloudcanvas-lib-badge-danger`) carried
alongside the root class. One more level of namespacing than the core's own
`cloudcanvas-pin-*`, because this layer is separate and optional.

## Theming

The kit adds nine tokens the core does not define (`--cc-tone-*`, `--cc-input-*`,
`--cc-track-bg`, `--cc-thumb-bg`). Their dark defaults are baked into the sheet as
fallbacks; for light mode, spread both override sets into one call:

```js
applyTheme(host, { ...LIGHT_THEME, ...LIB_LIGHT_THEME });
```

`LIB_LIGHT_THEME` repeats none of the core's keys, so neither object shadows the
other.

## Selection, and who owns it

`createListPin` is the pattern for stateful widgets in this kit: the widget owns
no state. Clicking a row transmits `list:select` with the item's id and stops
there — `items` is read-only, exactly as the reconciler's contract requires. The
consumer decides what selection means and calls `setContent('items', next)` back
with the flags it wants painted.

The event is namespaced deliberately: a bare `select` is a core Pin *signal*, and
transmitting one would move the session's selection cursor onto the list on every
row click.

```js
list.addEventListener('list:select', ({ payload }) => {
  list.setContent('items', items.map((item) => ({ ...item, selected: item.id === payload.id })));
});
```

## `lib/components/` — the pre-built pin-board library

A second, separate collection lives at `lib/components/` (package export
`cloudcanvas/components`): sticky notes, task cards, telemetry gauges, flow
nodes, workspace groups, media cards, a breadcrumb bar, chat messages, and
calendar events — app-shaped widgets rather than base primitives, which is why
they sit in their own directory instead of alongside the base kit above.

Same explicit-registration discipline as the base kit: importing
`lib/components/index.js` registers nothing. Call `registerComponentTraits()`
yourself if you want these names resolvable by string (a `type:` option, or
`hydrate()`'s `data-cc-type` attribute) — most call sites don't need to, since
every `create*Pin` factory constructs its trait directly.

```js
import { createStickyNotePin } from '../lib/components/index.js';

const note = createStickyNotePin(session, { x: 40, y: 40, contents: { title: 'Ship it' } });
```

It is held to the same three properties as the base kit. Every widget is a
`defineComponent` template; every control is a real `<button>`, `<input>`,
`<textarea>` or `<progress>` (a task's checklist is checkboxes with labels, a
reaction is an `aria-pressed` toggle, a note's editor is a textarea under the
Pin's edit lock); and the sheet reads only `var(--cc-*, <dark default>)` and
passes `checkStyleDiscipline` whole. The widgets that draw their own complete
surface - the note, the cards, the crumb - are `chrome: false`; the workspace
group is the one that keeps the core card, because it is a scope and the well
its children sit in is the core's.

The behaviours a widget exposes are functions taking the Pin, not methods on
its trait: `toggleTaskItem`, `setTelemetryReading` / `startTelemetrySimulation`
/ `stopTelemetrySimulation`, `transmitFlowPulse`, `focusWorkspace`,
`navigateBreadcrumbBack`, `toggleChatReaction` / `sendChatMessage`,
`acknowledgeCalendarEvent` / `resolveCalendarEvent`, `beginStickyEdit` /
`endStickyEdit`.

The library adds eleven theme-dependent tokens (`--cc-priority-*`,
`--cc-status-*`, `--cc-severity-*`), each a filled chip's background printed
with `--cc-bg` as its ink, and every pair is measured at 4.5:1 or better in
both themes by `tests/unit/lib-components-styles.test.js`. Their light values
are `COMPONENTS_LIGHT_THEME`, which repeats no key of the other two sets:

```js
applyTheme(host, { ...LIGHT_THEME, ...LIB_LIGHT_THEME, ...COMPONENTS_LIGHT_THEME });
```

## `lib/sandbox/` — taking a canvas off the page and putting it back

A third collection lives at `lib/sandbox/`: not widgets at all, but the five
utilities that turn a live session into something you can store, ship or reopen.

| Module | What it is |
| --- | --- |
| `serialize.js` | A session as a plain JSON tree, and back — `serializeSession` / `deserializeSession` |
| `persistence.js` | Named snapshots in `localStorage` — `saveSandbox` / `loadSandbox` / `listSandboxKeys` / `deleteSandbox`, plus the debounced `autoSaveSession` |
| `custom-types.js` | User-defined Pin presets in `localStorage`, global to the origin and separate from any snapshot — `saveCustomType` / `getCustomType` / `listCustomTypes` / `deleteCustomType`, with `normalizeCustomType` / `customTypeContents` for placing one |
| `zip.js` | A dependency-free STORE-mode ZIP writer — `createZip` / `downloadZip` |
| `export-static.js` | A session as a standalone, serverless static site — `buildStaticSite` / `downloadStaticSite` |

Same optional-and-additive rule as the rest of `lib/`: nothing in `src/` imports
it, and importing it registers nothing. `index.js` is a barrel only — every
module stands alone and they import each other downwards and no other way
(`export-static` → `serialize` + `zip`, `persistence` → `serialize`), so a page
that only wants a zip writer pays for a zip writer.

```js
import { saveSandbox, loadSandbox } from '../lib/sandbox/index.js';

saveSandbox('my-board', session);
const { pins, warnings } = loadSandbox('my-board', freshSession);
```

What a snapshot does and does not carry is stated in full at the top of
`serialize.js`, and it is worth reading before relying on one: position, size,
`contents`, `chrome`, `bordered` and the display type survive; traits come back
by **name only** (freshly initialised, not the instances you had), and particle
physics state does not come back at all. Anything that must survive the
round-trip belongs in `pin.contents`. Missing trait or type names are collected
into `warnings` rather than thrown, so a snapshot that restores nine Pins out of
ten still restores nine.

`persistence.js` also carries `autoSaveSession(key, session, options)` — a
debounced writer for a session someone is actively editing, so the day-to-day
case needs no Save click:

```js
const saver = autoSaveSession('current', session, {
  debounceMs: 800,          // trailing edge: a burst writes once, after the last call
  onSave: (key) => status.setContent('text', `saved ${key}`),
  onError: (error) => status.setContent('text', error.message)
});

saver.markDirty();          // after every edit; each call restarts the window
saver.flush();              // write now, if there is anything to write
saver.stop();               // cancel, detach, and go inert
```

It is **caller-driven**: `markDirty()` is a call you make, because there is no
"the session changed" event in this codebase to subscribe to. A `beforeunload`
hook flushes a mid-debounce edit, and `stop()` removes it — nothing outlives the
`stop()`. One attempt clears the dirty flag whatever its outcome, so a store
that refuses the write reports once through `onError` (a full quota is the real
case) instead of retrying in a loop; asking again is another `markDirty()`. On a
runtime with no `localStorage`, it no-ops silently: neither `onSave` nor
`onError` fires, on the same reasoning as the rest of this module.

Unlike the two collections above, this one has **no package export yet**. The
`exports` map in `package.json` lists no `./sandbox` entry and carries no
wildcard, so a consumer installing the package cannot reach these modules at
all — in-repo and bundled use only until that entry is added.
