/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The defaults (`cloudcanvas-lib/defaults`): every add-on trait under its name, the
 * board's CSS chunk, the display widgets, and the reaction built-ins, registered
 * on import - so markup alone makes a live board:
 *
 *   <script type="module">import 'cloudcanvas-lib/defaults'; import { blit } from 'cloudcanvas'; blit('#app');</script>
 *   <div id="app" data-pan data-keyboard>
 *     <div data-blit data-type="card" data-card='{"title":"Hi"}' data-drag data-select data-x="40"></div>
 *   </div>
 *
 * The one module with a side effect on import, and the one that costs every
 * add-on; import the subpaths instead to pay only for what a page uses.
 */
import { blit } from 'cloudcanvas';
import { builtinActions } from './plugins/actions.js';
import { announce } from './plugins/announce.js';
import { connect } from './plugins/connect.js';
import { cursors } from './plugins/cursors.js';
import { drag } from './plugins/drag.js';
import { edit } from './plugins/edit.js';
import { focus } from './plugins/focus.js';
import { history } from './plugins/history.js';
import { keyboard } from './plugins/keyboard.js';
import { gap, layout } from './plugins/layout.js';
import { observe } from './plugins/observe.js';
import { offload } from './plugins/offload.js';
import { pan } from './plugins/pan.js';
import { panel } from './plugins/panel.js';
import { physics } from './plugins/physics.js';
import { reactions } from './plugins/reactions.js';
import { resize } from './plugins/resize.js';
import { select } from './plugins/select.js';
import { style } from './plugins/style.js';
import { svgState } from './plugins/svg-state.js';
import { registerDisplayTypes } from './plugins/types.js';
import { injectBoardStyles } from './plugins/styles.js';

/** Every trait `cloudcanvas-lib/defaults` names, by the name markup uses. */
export const DEFAULT_TRAITS = /* @__PURE__ */ Object.freeze({
  drag, select, resize, focus, physics, connect, svgState, edit, layout, gap, style, offload,
  pan, keyboard, announce, cursors, history, reactions, observe, panel
});

blit.use(DEFAULT_TRAITS);
injectBoardStyles();
registerDisplayTypes();
builtinActions();
