/*!
 * CloudCanvas lib v0.7.0 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
import{d as vr,e as xr,h as Kt,i as yr,j as wr}from"./chunk-Z364TTVO.js";import{b as he,c as ge}from"./chunk-HT7DV4PQ.js";import{d as Ne}from"./chunk-6HIJVUYD.js";import{c as F,d as Ic}from"./chunk-I4CIJRQK.js";import{a as br}from"./chunk-ROQVRMHD.js";import{b as U}from"./chunk-IT2G5KV5.js";function b(e){let t=e?.ownerDocument??null;if(!e||typeof e.append!="function"||!t?.createElement)throw new TypeError("A host element attached to a document is required");return t}function Tc(e,t){for(let[n,a]of Object.entries(t??{}))a==null||a===!1||e.setAttribute(n,a===!0?"":String(a))}function d(e,t,{className:n="",text:a,attrs:r}={}){let o=e.createElement(t);return n&&(o.className=n),a!=null&&o.append(e.createTextNode(String(a))),Tc(o,r),o}var Mc="http://www.w3.org/2000/svg";function k(e,t,n={}){let a=e.createElementNS(Mc,t);for(let[r,o]of Object.entries(n))a.setAttribute(r,String(o));return a}function x(e,t,n=""){let a=e.createTextNode(String(n??""));return t.append(a),a}function h(e,t){let n=String(t??"");e.data!==n&&(e.data=n)}var Kn="cloudcanvas-ui-button";function Ar(e){return e.getAttribute("aria-disabled")==="true"}function Sr(e,t){t?e.setAttribute("aria-disabled","true"):e.removeAttribute("aria-disabled")}function $(e,{label:t,className:n="",ariaLabel:a,title:r,disabled:o=!1,off:i=!1,onClick:s,signal:c,attrs:l}={}){let u=d(e,"button",{className:n?`${Kn} ${n}`:Kn,text:t,attrs:l});return u.type="button",a&&u.setAttribute("aria-label",a),r&&(u.title=r),u.disabled=!!o,Sr(u,i),typeof s=="function"&&u.addEventListener("click",f=>{Ar(u)||s(f)},c?{signal:c}:void 0),u}var xt="cloudcanvas-ui-field",Ee="cloudcanvas-ui-sr-only";function De(e,t={}){let{type:n="text",label:a,value:r,placeholder:o,name:i,className:s="",required:c=!1}=t,l=s?`${xt} ${s}`:xt,u=d(e,n==="textarea"?"textarea":"input",{className:l,attrs:t.attrs});return n!=="textarea"&&(u.type=n),a&&!u.hasAttribute("aria-labelledby")&&u.setAttribute("aria-label",String(a)),o&&(u.placeholder=String(o)),i&&(u.name=String(i)),r!=null&&(u.value=String(r)),u.required=!!c,typeof t.onInput=="function"&&u.addEventListener("input",()=>t.onInput(u.value),t.signal?{signal:t.signal}:void 0),u}function N(e,t,n){return Math.min(n,Math.max(t,e))}function Ve(e){let t=e.visualViewport;return{left:t?.offsetLeft??0,top:t?.offsetTop??0,width:t?.width??e.innerWidth,height:t?.height??e.innerHeight}}var $r="data-ui-id",Ir="data-ui-for";function Xe(e,t=null){let a=(e?.nodeType===3?e.parentElement:e)?.closest?.(`[${$r}], [${Ir}]`)??null;return a&&(t===null||t.contains(a))?a:null}function ie(e){let t=Xe(e);return t?t.getAttribute($r)??t.getAttribute(Ir):null}function Z(e,t){e.classList.toggle("is-selected",t),t?e.setAttribute("aria-current","true"):e.removeAttribute("aria-current")}function D(e,t){if(!Array.isArray(e))throw new TypeError(`${t} items must be an array`);let n=new Set;for(let a of e){let r=a?.id;if(typeof r!="string"||r.trim()===""||n.has(r))throw new TypeError(`Invalid or duplicate ${t} id: ${String(r)}`);n.add(r)}return e}function ae(e){return Array.from(e.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(n=>!n.disabled&&!n.closest("[hidden]")&&n.getAttribute("tabindex")!=="-1")}var kr=0;function M(e){return kr+=1,`${e}-${kr}`}function g(){let e=new AbortController,t=new Set,n=[];return{get signal(){return e.signal},get dead(){return e.signal.aborted},on(a,r,o,i={}){e.signal.aborted||a.addEventListener(r,o,{...i,signal:e.signal})},later(a,r){if(e.signal.aborted)return()=>{};let o=setTimeout(()=>{t.delete(o),a()},r);return t.add(o),()=>{clearTimeout(o),t.delete(o)}},add(a){n.push(a)},destroy(){if(e.signal.aborted)return!1;e.abort();for(let a of t)clearTimeout(a);t.clear();for(let a of n.splice(0).reverse())a();return!0}}}function Nc(e,t){let n=String(t??"");return e.ownerDocument.activeElement===e||e.value===n?!1:(e.value=n,!0)}function Ec(e,t){let n=String(t??""),a=!1;for(let r of["aria-label","title"])e.getAttribute(r)!==n&&(e.setAttribute(r,n),a=!0);return a}function Dc(e,t){let n=!t;return e.hidden===n?!1:(e.hidden=n,!0)}function se(e,t){return!t||typeof t.focus!="function"||!e.contains(t)||t.ownerDocument.activeElement===t?!1:(t.focus(),!0)}function ce(e,t){for(t.forEach((n,a)=>{let r=e.childNodes[a]??null;r!==n&&e.insertBefore(n,r)});e.childNodes.length>t.length;)e.lastChild.remove()}function Lc(e,t,n,a){if(e.has(a))return e.get(a);let r=t(n);if(!r?.node)throw new TypeError(`rowCache: create() returned no node for key "${a}"`);return e.set(a,r),r}function yt({create:e,update:t,key:n=a=>a.id}={}){if(typeof e!="function")throw new TypeError("rowCache: create must be a function");let a=new Map;return{sync(r){let o=new Set,i=[];for(let s of r){let c=String(n(s));if(o.has(c))throw new TypeError(`Duplicate row key: ${c}`);o.add(c);let l=Lc(a,e,s,c);t?.(l,s),i.push(l.node)}for(let s of[...a.keys()])o.has(s)||a.delete(s);return i},get:r=>a.get(String(r))??null}}var Cc=Object.freeze({horizontal:{ArrowLeft:-1,ArrowRight:1},vertical:{ArrowUp:-1,ArrowDown:1},both:{ArrowLeft:-1,ArrowRight:1,ArrowUp:-1,ArrowDown:1}});function Q(e,t,n,{orientation:a="vertical",wrap:r=!1}={}){if(n<=0)return null;if(e==="Home")return 0;if(e==="End")return n-1;let o=Cc[a]?.[e];if(o===void 0)return null;let s=(t<0?o>0?-1:n:t)+o;return r?(s+n)%n:Math.min(n-1,Math.max(0,s))}function C(e,t){for(let n of e)n.setAttribute("tabindex",n===t?"0":"-1")}function Oc(e){let t=e.target;return!t||typeof t.closest!="function"?!1:!!t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')}var Tr=`${br}/* ------------------ UI KIT: CONTROLS ------------------ */

.cloudcanvas-ui-button {
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  font: inherit;
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-btn-text, #7dd3fc);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-button:hover:not(:disabled):not([aria-disabled="true"]) { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }
.cloudcanvas-ui-button.is-primary { color: var(--cc-ui-on-accent, #0f172a); background: var(--cc-accent, #38bdf8); }
/* A danger button keeps the page's ink and says so by its border: the tone's colour is not one ink that clears 4.5:1 on both the dark and the light page. */
.cloudcanvas-ui-button.is-danger { color: var(--cc-text, #e2e8f0); border-color: var(--cc-tone-danger, #f87171); border-width: 2px; font-weight: var(--cc-weight-semibold, 600); }
/* Off is unavailable for now: drawn as disabled is, and still there to be focused and read. */
.cloudcanvas-ui-button:disabled, .cloudcanvas-ui-button[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
.cloudcanvas-ui-field {
  box-sizing: border-box;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  font: inherit;
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-input-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--cc-input-border, rgba(255, 255, 255, 0.16));
  border-radius: var(--cc-radius-sm, 6px);
}
:is(.cloudcanvas-ui-button, .cloudcanvas-ui-field, .cloudcanvas-ui-splitter, .cloudcanvas-ui-results-option,
  .cloudcanvas-ui-dialog-panel, .cloudcanvas-ui-kanban-card, .cloudcanvas-ui-kanban-label[data-ui-id], .cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head,
  .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-calendar-more, .cloudcanvas-ui-calendar-scroller, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-timeline-group-label, .cloudcanvas-ui-graph-node,
  .cloudcanvas-ui-breadcrumbs-open, .cloudcanvas-ui-tree-row, .cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-remove,
  .cloudcanvas-ui-navbar-link):focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}
/* Its parent clips what is drawn outside it, so the hour grid wears the ring inside. */
.cloudcanvas-ui-calendar-scroller:focus-visible { outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px)); }
.cloudcanvas-ui-dialog, .cloudcanvas-ui-tabs, .cloudcanvas-ui-results, .cloudcanvas-ui-status, .cloudcanvas-ui-toasts,
.cloudcanvas-ui-composer, .cloudcanvas-ui-voice, .cloudcanvas-ui-markdown, .cloudcanvas-ui-breadcrumbs, .cloudcanvas-ui-tree,
.cloudcanvas-ui-progress, .cloudcanvas-ui-chips, .cloudcanvas-ui-navbar, .cloudcanvas-ui-empty, .cloudcanvas-ui-menu-panel {
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  color: var(--cc-text, #e2e8f0);
}
[class^="cloudcanvas-ui-"][hidden], [class*=" cloudcanvas-ui-"][hidden] { display: none; }
.cloudcanvas-ui-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Centred by its own margin: a host that resets every margin takes the browser's away. One that is not modal stands above the toasts. */
.cloudcanvas-ui-dialog {
  z-index: var(--cc-z-ui-dialog, 1350);
  width: min(var(--cc-ui-dialog-width, 36rem), calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  margin: auto;
  padding: 0;
  background: transparent;
  border: 0;
  overflow: visible;
}
.cloudcanvas-ui-dialog::backdrop { background: var(--cc-ui-backdrop, rgba(2, 6, 23, 0.6)); }
.cloudcanvas-ui-dialog.is-modal:not([open]) { display: none; }
.cloudcanvas-ui-dialog-panel {
  display: grid;
  gap: var(--cc-space-3, 12px);
  max-height: calc(100dvh - 2rem);
  overflow: auto;
  padding: var(--cc-space-4, 16px);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
}
.cloudcanvas-ui-dialog-header { display: flex; align-items: center; justify-content: space-between; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-dialog-title { margin: 0; font-size: var(--cc-type-lg, 15px); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-dialog-description { margin: 0; color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-dialog-body { min-width: 0; }

/* A drawer's place and size are the host's; the sheet says where it folds to: its control's aim, or its own top edge. */
.cloudcanvas-ui-drawer { transform-origin: var(--drawer-origin-x, 50%) var(--drawer-origin-y, 0%); }

.cloudcanvas-ui-splitter { flex: none; position: relative; min-width: 8px; min-height: 8px; touch-action: none; cursor: col-resize; }
.cloudcanvas-ui-splitter[aria-orientation="horizontal"] { cursor: row-resize; }
.cloudcanvas-ui-splitter::before {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 2px;
  background: var(--cc-card-border, rgba(255, 255, 255, 0.1));
}
.cloudcanvas-ui-splitter[aria-orientation="horizontal"]::before { width: auto; height: 2px; }
.cloudcanvas-ui-splitter:hover::before, .cloudcanvas-ui-splitter.is-dragging::before { background: var(--cc-accent, #38bdf8); }

.cloudcanvas-ui-results-list { display: grid; gap: 2px; }
.cloudcanvas-ui-results-option {
  display: grid;
  padding: var(--cc-space-2, 8px);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-results-option[aria-selected="true"], .cloudcanvas-ui-results-option:hover { background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))); }
.cloudcanvas-ui-results-detail { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-results-empty { margin: 0; padding: var(--cc-space-2, 8px); color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-status-message { color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-status[data-status="error"] .cloudcanvas-ui-status-label { color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-status[data-status="unavailable"] .cloudcanvas-ui-status-label { color: var(--cc-tone-warning, #eab308); }

/* Held off each edge by a token of its own, and by nothing else: no margin a host gives its sections moves it. */
.cloudcanvas-ui-toasts {
  position: fixed;
  inset: auto var(--cc-ui-toast-inset-right, var(--cc-space-3, 12px)) var(--cc-ui-toast-inset-bottom, var(--cc-ui-toast-offset, 16px)) var(--cc-ui-toast-inset-left, var(--cc-space-3, 12px));
  z-index: var(--cc-z-ui-toast, 1300);
  display: grid;
  justify-items: center;
  margin: 0;
  gap: var(--cc-space-2, 8px);
  pointer-events: none;
}
.cloudcanvas-ui-toast {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  max-width: min(32rem, 100%);
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 4px solid var(--cc-tone-info, #38bdf8);
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  pointer-events: auto;
}
.cloudcanvas-ui-toast[data-tone="success"] { border-left-color: var(--cc-tone-success, #22c55e); }
.cloudcanvas-ui-toast[data-tone="warning"] { border-left-color: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-toast[data-tone="danger"] { border-left-color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-toast-message { flex: 1; }

.cloudcanvas-ui-composer { display: grid; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-composer-input { width: 100%; min-height: 4.5rem; resize: vertical; }
.cloudcanvas-ui-composer-actions { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: flex-end; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-composer-voice { margin-right: auto; }
.cloudcanvas-ui-composer.is-pending .cloudcanvas-ui-composer-input { opacity: 0.7; }

.cloudcanvas-ui-voice { display: grid; gap: var(--cc-space-2, 8px); justify-items: start; }
.cloudcanvas-ui-voice.is-listening .cloudcanvas-ui-voice-mic { color: var(--cc-ui-on-accent, #0f172a); background: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-voice-consent, .cloudcanvas-ui-voice-review { display: flex; flex-wrap: wrap; gap: var(--cc-space-2, 8px); align-items: center; }
.cloudcanvas-ui-voice-consent-text { flex-basis: 100%; margin: 0; font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-voice-status { margin: 0; font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-voice-status:empty { display: none; }
.cloudcanvas-ui-voice-preview { flex-basis: 100%; min-height: 3rem; }

.cloudcanvas-ui-markdown { line-height: 1.5; overflow-wrap: anywhere; }
.cloudcanvas-ui-markdown :is(p, ul, ol, blockquote, pre) { margin: 0 0 var(--cc-space-2, 8px); }
.cloudcanvas-ui-markdown :is(h1, h2, h3, h4, h5, h6) { margin: var(--cc-space-3, 12px) 0 var(--cc-space-1, 4px); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-markdown :is(ul, ol) { padding-left: var(--cc-space-4, 16px); }
.cloudcanvas-ui-markdown blockquote {
  padding: 0 var(--cc-space-3, 12px);
  color: var(--cc-text-muted, #94a3b8);
  border-left: 3px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
}
.cloudcanvas-ui-markdown :is(code, pre) { font-family: var(--cc-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: var(--cc-type-sm, 12px); }
.cloudcanvas-ui-markdown pre { padding: var(--cc-space-2, 8px); overflow-x: auto; background: var(--cc-input-bg, rgba(255, 255, 255, 0.06)); border-radius: var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-markdown a { color: var(--cc-accent, #38bdf8); }
.cloudcanvas-ui-markdown-task-item { list-style: none; }
.cloudcanvas-ui-markdown-mention { color: var(--cc-accent, #38bdf8); font-weight: var(--cc-weight-medium, 500); }

.cloudcanvas-ui-breadcrumbs { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-breadcrumbs-list { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-1, 4px); margin: 0; padding: 0; list-style: none; }
.cloudcanvas-ui-breadcrumbs-item { position: relative; display: inline-flex; align-items: center; gap: var(--cc-space-1, 4px); min-width: 0; overflow-wrap: anywhere; }
.cloudcanvas-ui-breadcrumbs-item + .cloudcanvas-ui-breadcrumbs-item::before {
  content: "";
  flex: none;
  width: 0.4em;
  height: 0.4em;
  border-top: 1px solid var(--cc-text-muted, #94a3b8);
  border-right: 1px solid var(--cc-text-muted, #94a3b8);
  transform: rotate(45deg);
}
.cloudcanvas-ui-breadcrumbs-open {
  padding: 0 var(--cc-space-1, 4px);
  font: inherit;
  color: var(--cc-accent, #38bdf8);
  background: transparent;
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-breadcrumbs-open:hover { text-decoration: underline; }
.cloudcanvas-ui-breadcrumbs-item[aria-current="page"] { color: var(--cc-text, #e2e8f0); font-weight: var(--cc-weight-semibold, 600); }

.cloudcanvas-ui-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 var(--cc-space-1, 4px);
  font: inherit;
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  color: var(--cc-ui-on-accent, #0f172a);
  background: var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-pill, 9999px);
  box-sizing: border-box;
}
.cloudcanvas-ui-badge.is-dot {
  min-width: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  padding: 0;
}
.cloudcanvas-ui-badge[data-tone="danger"] { background: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-badge[data-tone="warning"] { background: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-badge[data-tone="success"] { background: var(--cc-tone-success, #22c55e); }
/* A flag is its SVG: the box keeps only the tone, stands in front of what it is planted on, and rises by what a host gives it. */
.cloudcanvas-ui-badge[data-shape="flag"] {
  z-index: var(--cc-z-ui-raised, 2);
  width: auto;
  min-width: 0;
  height: auto;
  padding: 0;
  color: var(--cc-accent, #38bdf8);
  background: transparent;
  border-radius: 0;
  transform: translateY(calc(-1 * var(--cc-ui-flag-rise, 0px)));
}
.cloudcanvas-ui-badge[data-shape="flag"][data-tone="danger"] { color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-badge[data-shape="flag"][data-tone="warning"] { color: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-badge[data-shape="flag"][data-tone="success"] { color: var(--cc-tone-success, #22c55e); }
.cloudcanvas-ui-badge-flag { display: block; flex: none; overflow: visible; filter: drop-shadow(0 1px 1px var(--cc-ui-flag-shadow, rgba(2, 6, 23, 0.4))); }
.cloudcanvas-ui-badge-flag-pennant { fill: currentColor; }
.cloudcanvas-ui-badge-flag-staff { fill: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-badge-flag-lit { fill: var(--cc-ui-flag-light, #ffffff); stop-color: var(--cc-ui-flag-light, #ffffff); }
.cloudcanvas-ui-badge-flag-shaded { fill: var(--cc-ui-flag-shade, #020617); stop-color: var(--cc-ui-flag-shade, #020617); }
.cloudcanvas-ui-badge-flag-figure { fill: var(--cc-ui-on-accent, #0f172a); font-variant-numeric: tabular-nums; text-anchor: middle; }

/* One column as wide as the tree, whatever its rows hold: a label the tree has no room for ends in an ellipsis (and is said whole in its row's title), it does not widen the tree. */
.cloudcanvas-ui-tree { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; }
.cloudcanvas-ui-tree-row {
  display: flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-2, 8px);
  font: inherit;
  text-align: left;
  color: inherit;
  background: transparent;
  border: 0;
  border-left: 3px solid transparent;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-tree-row:hover, .cloudcanvas-ui-tree-row[aria-selected="true"] { background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))); }
.cloudcanvas-ui-tree-row[aria-selected="true"] { font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-tree-indent { flex: none; width: calc(var(--tree-level, 0) * var(--cc-space-4, 16px)); }
.cloudcanvas-ui-tree-twisty { flex: none; display: inline-grid; place-items: center; width: 1.25em; height: 1.25em; visibility: hidden; }
.cloudcanvas-ui-tree-twisty::before {
  content: "";
  width: 0.4em;
  height: 0.4em;
  border-top: 1px solid var(--cc-text-muted, #94a3b8);
  border-right: 1px solid var(--cc-text-muted, #94a3b8);
  transform: rotate(45deg);
}
.cloudcanvas-ui-tree-row[aria-expanded] .cloudcanvas-ui-tree-twisty { visibility: visible; }
.cloudcanvas-ui-tree-row[aria-expanded="true"] .cloudcanvas-ui-tree-twisty::before { transform: rotate(135deg); }
.cloudcanvas-ui-tree-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cloudcanvas-ui-tree-count { flex: none; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-tree-row > .cloudcanvas-ui-badge { flex: none; }
.cloudcanvas-ui-tree[data-movable] .cloudcanvas-ui-tree-row { cursor: grab; }
.cloudcanvas-ui-tree.is-drag-active { cursor: grabbing; }
.cloudcanvas-ui-tree-row.is-dragging { pointer-events: none; opacity: 0.6; }
.cloudcanvas-ui-tree-row.is-drop-target { outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8)); outline-offset: -2px; }
.cloudcanvas-ui-tree-row.is-unmatched { opacity: 0.45; }
/* What a search that found nothing says, beside the rows: a polite live region, in the words the tree holds; empty, it takes no room. */
.cloudcanvas-ui-tree-status:empty { padding: 0; }
.cloudcanvas-ui-tree-status { margin: 0; padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px); font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif); font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-progress { display: grid; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-progress-label { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-progress-bar { width: 100%; height: 0.5rem; accent-color: var(--cc-accent, #38bdf8); }

.cloudcanvas-ui-chips { display: flex; flex-wrap: wrap; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-chips-chip {
  display: inline-flex;
  align-items: stretch;
  max-width: 100%;
  font-size: var(--cc-type-sm, 12px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-sm, 6px);
}
.cloudcanvas-ui-chips-chip[data-tone] { border-left-width: 3px; }
.cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-label, .cloudcanvas-ui-chips-remove {
  display: inline-flex;
  align-items: center;
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-2, 8px);
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
}
.cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-remove { cursor: pointer; }
.cloudcanvas-ui-chips-toggle:hover, .cloudcanvas-ui-chips-remove:hover { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }
.cloudcanvas-ui-chips-toggle[aria-pressed="true"] {
  font-weight: var(--cc-weight-semibold, 600);
  background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
}
.cloudcanvas-ui-chips-remove { padding: 0 var(--cc-space-1, 4px); color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-navbar-list {
  display: flex;
  gap: var(--cc-space-1, 4px);
  margin: 0;
  padding: 0;
  padding-top: var(--cc-ui-flag-rise, 0px);
  overflow-x: auto;
  list-style: none;
}
.cloudcanvas-ui-navbar-item { flex: none; }
.cloudcanvas-ui-navbar-icon { display: inline-flex; flex: none; }
/* A kit icon is as large as the text beside it and drawn in that text's colour, so what recolours the text recolours it. */
.cloudcanvas-ui-icon { flex: none; width: 1.25em; height: 1.25em; }
.cloudcanvas-ui-navbar-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  font: inherit;
  color: var(--cc-text-muted, #94a3b8);
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.cloudcanvas-ui-navbar-link:hover { color: var(--cc-text, #e2e8f0); }
.cloudcanvas-ui-navbar-link[aria-current="page"] {
  font-weight: var(--cc-weight-semibold, 600);
  color: var(--cc-text, #e2e8f0);
  border-bottom-color: var(--cc-accent, #38bdf8);
}
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-list { gap: 0; overflow-x: visible; }
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-item { flex: 1; min-width: 0; }
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-link { border-bottom: 0; border-top: 2px solid transparent; }
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-link[aria-current="page"] { border-top-color: var(--cc-accent, #38bdf8); }

.cloudcanvas-ui-empty { display: grid; justify-items: center; gap: var(--cc-space-2, 8px); padding: var(--cc-space-4, 16px); text-align: center; }
/* The icon is a graphic, told by its tone: muted for nothing and for loading, the info tone for what needs something first, the danger tone for what failed. */
.cloudcanvas-ui-empty-icon { display: inline-flex; color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-empty-icon > .cloudcanvas-ui-icon { width: 2.5rem; height: 2.5rem; }
.cloudcanvas-ui-empty[data-kind="locked"] .cloudcanvas-ui-empty-icon { color: var(--cc-tone-info, #38bdf8); }
.cloudcanvas-ui-empty[data-kind="error"] .cloudcanvas-ui-empty-icon { color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-empty-title { margin: 0; font-size: var(--cc-type-lg, 15px); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-empty-body { margin: 0; color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-combobox {
  position: absolute;
  z-index: var(--cc-z-ui-raised, 2);
  display: flex;
  flex-direction: column;
  max-width: min(24rem, calc(100vw - 2rem));
  max-height: 16rem;
  overflow: hidden;
  padding: var(--cc-space-1, 4px);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
}
/* The list is what scrolls, not the popup around it: the field controls the list (aria-controls), the one scroller a keyboard need not reach, since the field is operated through aria-activedescendant. The popup's max-height, the kit's or a host's, is what the list gives way to. */
.cloudcanvas-ui-combobox > .cloudcanvas-ui-results { display: flex; flex-direction: column; min-height: 0; }
.cloudcanvas-ui-combobox .cloudcanvas-ui-results-list { min-height: 0; overflow: auto; }

@media (pointer: coarse) {
  :is(.cloudcanvas-ui-button, .cloudcanvas-ui-field, .cloudcanvas-ui-breadcrumbs-open,
    .cloudcanvas-ui-tree-row, .cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-remove, .cloudcanvas-ui-navbar-link) { min-height: var(--cc-control-min-coarse, 44px); }
  /* A toast's controls say so themselves, whatever a host does to its buttons. */
  .cloudcanvas-ui-toast :is(.cloudcanvas-ui-toast-action, .cloudcanvas-ui-toast-dismiss) { min-width: var(--cc-control-min-coarse, 44px); min-height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-splitter { min-width: 20px; min-height: 20px; }
}
@media (max-width: 40rem) {
  .cloudcanvas-ui-dialog { width: 100vw; max-width: 100vw; margin: auto 0 0; }
  .cloudcanvas-ui-dialog-panel { border-radius: var(--cc-radius-md, 10px) var(--cc-radius-md, 10px) 0 0; }
}
`;var Mr=`
/* ------------------ UI KIT: SETTINGS ROWS ------------------ */

/* The words take the row; the box keeps its own column at the end. The row is the target, so the box can stay small. */
.cloudcanvas-ui-switch { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: var(--cc-space-3, 12px); min-height: 2.75rem; font: inherit; color: inherit; cursor: pointer; }
.cloudcanvas-ui-switch-text { display: flex; flex-wrap: wrap; align-items: baseline; min-width: 0; }
.cloudcanvas-ui-switch-label { min-width: 0; overflow-wrap: anywhere; }
.cloudcanvas-ui-switch-box { grid-column: 2; margin: 0; width: 1.25rem; height: 1.25rem; accent-color: var(--cc-accent, #38bdf8); cursor: inherit; }
.cloudcanvas-ui-switch-detail { flex-basis: 100%; font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-switch-detail[hidden] { display: none; }
/* The status is there before it has words, so it takes no room and no gap until it has some. Its words are the page's own ink: a tone's colour is a marker, never the only ink a note has. */
.cloudcanvas-ui-switch-status { font-size: var(--cc-type-sm, 12px); color: var(--cc-text, #e2e8f0); }
.cloudcanvas-ui-switch-status:not(:empty) { margin-inline-start: var(--cc-space-2, 8px); }
/* The marker a tone is told by: one dot, before the words of a status and of an invalid select's error. It is a :where(), with no specificity of its own, so the rule for each tone that follows it is the one that colours it. */
:where(.cloudcanvas-ui-switch-status:not(:empty), .cloudcanvas-ui-select-status:not(:empty), .cloudcanvas-ui-select[data-invalid] .cloudcanvas-ui-select-hint)::before {
  content: "";
  display: inline-block;
  width: 0.5em;
  height: 0.5em;
  margin-inline-end: 0.4em;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-text-muted, #94a3b8);
}
.cloudcanvas-ui-switch-status[data-tone="success"]::before, .cloudcanvas-ui-select-status[data-tone="success"]::before { background: var(--cc-tone-success, #22c55e); }
.cloudcanvas-ui-switch-status[data-tone="warning"]::before, .cloudcanvas-ui-select-status[data-tone="warning"]::before { background: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-switch-status[data-tone="danger"]::before, .cloudcanvas-ui-select-status[data-tone="danger"]::before { background: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-switch-status[data-tone="muted"]::before, .cloudcanvas-ui-select-status[data-tone="muted"]::before { background: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-switch-status[aria-live="assertive"], .cloudcanvas-ui-select-status[aria-live="assertive"] { font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-switch:has(.cloudcanvas-ui-switch-box:disabled) { opacity: 0.6; cursor: default; }
.cloudcanvas-ui-switch-box:focus-visible { outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8)); outline-offset: 2px; }

/* The select reads as the switch does: words first, the control at the end of the line. The row wraps, so on a phone the control stands under its words and never reaches past the row. */
.cloudcanvas-ui-select { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--cc-space-1, 4px) var(--cc-space-3, 12px); min-height: 2.75rem; font: inherit; color: inherit; }
.cloudcanvas-ui-select-label { flex: 1 1 10rem; min-width: 0; overflow-wrap: anywhere; }
.cloudcanvas-ui-select-control { flex: 0 1 14rem; min-width: 0; max-width: 100%; }
.cloudcanvas-ui-select-hint { flex-basis: 100%; margin: 0; font-size: var(--cc-type-sm, 12px); color: var(--cc-text, #e2e8f0); }
.cloudcanvas-ui-select-hint[hidden] { display: none; }
/* The status is a line of its own under the hint. Empty it is out of the row and not hidden: a region that comes with its words is not reliably read. */
.cloudcanvas-ui-select-status { flex-basis: 100%; margin: 0; font-size: var(--cc-type-sm, 12px); color: var(--cc-text, #e2e8f0); }
.cloudcanvas-ui-select-status:empty { position: absolute; flex-basis: auto; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.cloudcanvas-ui-select[data-invalid] .cloudcanvas-ui-select-control { border-color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-select[data-invalid] .cloudcanvas-ui-select-hint::before { background: var(--cc-tone-danger, #f87171); }
`;var Nr=`
/* ------------------ UI KIT: OVERLAYS ------------------ */

.cloudcanvas-ui-confirm-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--cc-space-2, 8px); }

/* A popover stands in the viewport, sized by its content and held by the screen's width: placed by the control, so no ancestor clips it. */
.cloudcanvas-ui-popover {
  position: fixed;
  z-index: var(--cc-z-ui-popover, 1375);
  box-sizing: border-box;
  width: max-content;
  overflow: auto;
  overscroll-behavior: contain;
  padding: var(--cc-space-3, 12px);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
}
/* The popover clips what is drawn outside it, so it wears its ring inside. */
.cloudcanvas-ui-popover:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
`;var Rc='var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)',J="var(--cc-ui-grid-line, var(--cc-card-border, rgba(255, 255, 255, 0.1)))",Er=`/* ------------------ UI KIT: VIEWS ------------------ */

.cloudcanvas-ui-kanban, .cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline, .cloudcanvas-ui-graph {
  font-family: ${Rc};
  color: var(--cc-text, #e2e8f0);
}
:is(.cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline, .cloudcanvas-ui-graph) { --item-more-size: 1.5rem; --item-more-room: calc(var(--item-more-size) + 6px); }
.cloudcanvas-ui-item-more {
  position: absolute;
  z-index: var(--cc-z-ui-raised, 2);
  box-sizing: border-box;
  display: grid;
  place-items: center;
  width: var(--item-more-size);
  height: var(--item-more-size);
  padding: 0;
  font: inherit;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid ${J};
  border-radius: var(--cc-radius-pill, 9999px);
  cursor: pointer;
}
.cloudcanvas-ui-item-more > .cloudcanvas-ui-icon { width: 1rem; height: 1rem; }
.cloudcanvas-ui-item-more:is(:hover, :focus-visible) { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }
.cloudcanvas-ui-item-more:focus-visible { outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8)); outline-offset: var(--cc-focus-ring-offset, 2px); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node)[data-tone="success"] { border-left-color: var(--cc-tone-success, #22c55e); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node)[data-tone="warning"] { border-left-color: var(--cc-tone-warning, #eab308); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node)[data-tone="danger"] { border-left-color: var(--cc-tone-danger, #f87171); }
/* Category tones one to eight: the host's own palette, on the same edge. */
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="1"] { border-left-color: var(--cc-ui-tone-1, #60a5fa); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="2"] { border-left-color: var(--cc-ui-tone-2, #a78bfa); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="3"] { border-left-color: var(--cc-ui-tone-3, #f472b6); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="4"] { border-left-color: var(--cc-ui-tone-4, #fb923c); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="5"] { border-left-color: var(--cc-ui-tone-5, #facc15); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="6"] { border-left-color: var(--cc-ui-tone-6, #4ade80); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="7"] { border-left-color: var(--cc-ui-tone-7, #2dd4bf); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="8"] { border-left-color: var(--cc-ui-tone-8, #94a3b8); }
:is(.cloudcanvas-ui-kanban-item, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node).is-grabbed,
.cloudcanvas-ui-kanban-item.is-grabbed .cloudcanvas-ui-kanban-card {
  outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  outline-offset: 2px;
}
/* Selected: a ring inside the item. */
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-kanban-label[data-ui-id], .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-timeline-group-label).is-selected {
  box-shadow: var(--cc-ui-selected-ring, inset 0 0 0 2px var(--cc-accent, #38bdf8));
}
/* A heading that stands for an item: a button that reads as the heading it is. */
:is(.cloudcanvas-ui-kanban-label[data-ui-id], .cloudcanvas-ui-timeline-group-label) {
  padding: 0 var(--cc-space-1, 4px);
  font: inherit;
  text-align: start;
  color: var(--cc-text, #e2e8f0);
  background: transparent;
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}

/* Kanban */
.cloudcanvas-ui-kanban-lane {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(15rem, 1fr);
  gap: var(--cc-space-3, 12px);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  isolation: isolate;
}
.cloudcanvas-ui-kanban-column {
  display: flex;
  flex-direction: column;
  min-height: 8rem;
  padding: var(--cc-space-2, 8px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border: 1px solid ${J};
  border-radius: var(--cc-radius-md, 10px);
  scroll-snap-align: start;
}
.cloudcanvas-ui-kanban-column.is-drop-target { outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8)); }
.cloudcanvas-ui-kanban-column.is-refused { outline: 2px dashed var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-kanban-heading {
  display: flex;
  justify-content: space-between;
  margin: 0 0 var(--cc-space-2, 8px);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
}
.cloudcanvas-ui-kanban-count { color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-kanban-cards { flex: 1; display: grid; align-content: start; gap: var(--cc-space-2, 8px); margin: 0; padding: 0; list-style: none; }
.cloudcanvas-ui-kanban-item.is-dragging { position: relative; z-index: var(--cc-z-ui-raised, 2); pointer-events: none; opacity: 0.85; }
.cloudcanvas-ui-kanban-card {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  font: inherit;
  text-align: left;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 4px solid var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: grab;
  touch-action: manipulation;
}
.cloudcanvas-ui-kanban-title { font-weight: var(--cc-weight-medium, 500); }
.cloudcanvas-ui-kanban-detail, .cloudcanvas-ui-kanban-meta { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }

/* Calendar */
.cloudcanvas-ui-calendar { display: grid; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-calendar-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-calendar-nav, .cloudcanvas-ui-calendar-views { display: flex; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-calendar-title { flex: 1 1 10rem; margin: 0; font-size: var(--cc-type-lg, 15px); font-weight: var(--cc-weight-semibold, 600); }
:is(.cloudcanvas-ui-calendar-view, .cloudcanvas-ui-timeline-scale)[aria-pressed="true"] { color: var(--cc-ui-on-accent, #0f172a); background: var(--cc-accent, #38bdf8); }
:is(.cloudcanvas-ui-calendar-month, .cloudcanvas-ui-calendar-time) { border: 1px solid ${J}; border-radius: var(--cc-radius-md, 10px); overflow: hidden; }
:is(.cloudcanvas-ui-calendar-weekdays, .cloudcanvas-ui-calendar-week) { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.cloudcanvas-ui-calendar-weekday { padding: var(--cc-space-1, 4px); font-size: var(--cc-type-xs, 11px); text-align: center; color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-calendar-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  min-height: 5.5rem;
  padding: var(--cc-space-1, 4px);
  border-top: 1px solid ${J};
  border-left: 1px solid ${J};
  cursor: pointer;
}
.cloudcanvas-ui-calendar-cell:first-child { border-left: 0; }
.cloudcanvas-ui-calendar-cell.is-outside { opacity: 0.55; }
:is(.cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head, .cloudcanvas-ui-calendar-more) {
  font: inherit;
  font-size: var(--cc-type-sm, 12px);
  color: var(--cc-text, #e2e8f0);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.cloudcanvas-ui-calendar-day { align-self: flex-end; min-width: 1.75rem; min-height: 1.75rem; border-radius: var(--cc-radius-pill, 9999px); }
:is(.cloudcanvas-ui-calendar-cell.is-today .cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head.is-today) {
  color: var(--cc-ui-on-accent, #0f172a);
  background: var(--cc-ui-today, var(--cc-accent, #38bdf8));
}
.cloudcanvas-ui-calendar-more { padding: 0 var(--cc-space-1, 4px); text-align: left; color: var(--cc-accent, #38bdf8); }
.cloudcanvas-ui-calendar-events { display: grid; gap: 2px; min-width: 0; }
.cloudcanvas-ui-calendar-event {
  position: relative;
  display: flex;
  gap: var(--cc-space-1, 4px);
  min-width: 0;
  padding: 0 var(--cc-space-1, 4px);
  overflow: hidden;
  font: inherit;
  font-size: var(--cc-type-xs, 11px);
  text-align: left;
  white-space: nowrap;
  color: var(--cc-ui-bar-text, var(--cc-text, #e2e8f0));
  background: var(--cc-ui-bar, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
  border: 0;
  border-left: 3px solid var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-calendar-event[data-movable] { cursor: grab; }
.cloudcanvas-ui-calendar-event-title { overflow: hidden; text-overflow: ellipsis; }
.cloudcanvas-ui-calendar-event-time { opacity: 0.8; }
:is(.cloudcanvas-ui-calendar-time-head, .cloudcanvas-ui-calendar-allday, .cloudcanvas-ui-calendar-time-grid) {
  display: grid;
  grid-template-columns: 3.5rem repeat(var(--calendar-days), minmax(0, 1fr));
}
.cloudcanvas-ui-calendar-day-head { padding: var(--cc-space-1, 4px); border-left: 1px solid ${J}; }
.cloudcanvas-ui-calendar-gutter { padding: var(--cc-space-1, 4px); font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-calendar-allday { border-top: 1px solid ${J}; }
.cloudcanvas-ui-calendar-allday-cell { display: grid; align-content: start; gap: 2px; min-height: 1.75rem; min-width: 0; padding: var(--cc-space-1, 4px); border-left: 1px solid ${J}; }
.cloudcanvas-ui-calendar-scroller { max-height: var(--cc-ui-time-height, 32rem); overflow-y: auto; border-top: 1px solid ${J}; }
.cloudcanvas-ui-calendar-time-grid { height: calc(var(--calendar-hours) * var(--cc-ui-hour-height, 48px)); }
.cloudcanvas-ui-calendar-hours { display: grid; grid-template-rows: repeat(var(--calendar-hours), 1fr); }
.cloudcanvas-ui-calendar-hour { padding: 0 var(--cc-space-1, 4px); font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); border-top: 1px solid ${J}; }
.cloudcanvas-ui-calendar-column {
  position: relative;
  min-width: 0;
  border-left: 1px solid ${J};
  background-image: var(--cc-ui-hour-lines, repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px var(--cc-ui-hour-height, 48px)));
  cursor: pointer;
}
.cloudcanvas-ui-calendar-timed {
  position: absolute;
  top: calc(var(--calendar-top) * var(--cc-ui-hour-height, 48px) / 60);
  left: calc(var(--calendar-lane) * 100% / var(--calendar-lanes) + 1px);
  width: calc(100% / var(--calendar-lanes) - 2px);
  height: calc(var(--calendar-length) * var(--cc-ui-hour-height, 48px) / 60 - 2px);
  flex-direction: column;
  white-space: normal;
}

@media (max-width: 40rem) {
  .cloudcanvas-ui-kanban-lane { grid-auto-columns: 85%; }
  :is(.cloudcanvas-ui-calendar-time-head, .cloudcanvas-ui-calendar-allday, .cloudcanvas-ui-calendar-time-grid) {
    grid-template-columns: 2.5rem repeat(var(--calendar-days), minmax(0, 1fr));
  }
  .cloudcanvas-ui-calendar-cell { min-height: 4rem; }
}
@media (pointer: coarse) {
  /*
   * A button a view's toolbar draws is 44px wide as it is tall: the glyphs (zoom, previous, next) and the short words (Fit).
   * A day's number and a day's heading keep what is drawn - the number's circle, the heading's fill - and the rest of the
   * 44px is transparent border round it, which is part of the button and takes the press; a "more" link is as tall as a finger.
   */
  :is(.cloudcanvas-ui-graph-toolbar, .cloudcanvas-ui-calendar-toolbar, .cloudcanvas-ui-timeline-toolbar) .cloudcanvas-ui-button { min-width: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-calendar-day { min-width: var(--cc-control-min-coarse, 44px); min-height: var(--cc-control-min-coarse, 44px); padding: 0; border: calc((var(--cc-control-min-coarse, 44px) - 1.75rem) / 2) solid transparent; }
  .cloudcanvas-ui-calendar-day-head { min-height: var(--cc-control-min-coarse, 44px); border-block: calc((var(--cc-control-min-coarse, 44px) - 2.25rem) / 2) solid transparent; }
  :is(.cloudcanvas-ui-calendar-cell.is-today .cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head.is-today) { background-clip: padding-box; }
  .cloudcanvas-ui-calendar-more { min-height: var(--cc-control-min-coarse, 44px); }
  :is(.cloudcanvas-ui-kanban-label[data-ui-id], .cloudcanvas-ui-timeline-group-label) { min-height: var(--cc-control-min-coarse, 44px); }
  /* Room for one whole target: the all-day strip, and a day of the month under its number. A timeline row sets its own height, in ./timeline.js: its rule comes later in the sheet. */
  .cloudcanvas-ui-calendar-allday-cell { min-height: calc(var(--cc-control-min-coarse, 44px) + 2 * var(--cc-space-1, 4px)); }
  .cloudcanvas-ui-calendar-cell { min-height: 6.25rem; }

  /* The 44px targets of what is drawn smaller: see the head of this file. */
  :is(.cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline, .cloudcanvas-ui-graph) { --target: var(--cc-control-min-coarse, 44px); --target-under: -1; }
  :is(.cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline) { --item-more-size: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-item-more > .cloudcanvas-ui-icon { width: 1.25rem; height: 1.25rem; }
  .cloudcanvas-ui-graph-node { --target: calc(var(--cc-control-min-coarse, 44px) / var(--graph-k, 1)); }
  .cloudcanvas-ui-calendar-month { isolation: isolate; }
  .cloudcanvas-ui-calendar-day { position: relative; z-index: var(--cc-z-ui-raised, 2); }
  :is(.cloudcanvas-ui-calendar-events, .cloudcanvas-ui-calendar-allday-cell, .cloudcanvas-ui-calendar-column, .cloudcanvas-ui-timeline-track, .cloudcanvas-ui-graph-nodes) { isolation: isolate; }
  :is(.cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar.is-point) { overflow: visible; }
  /* A chip cuts nothing itself now: its time does, as its title does, and still gives way last. */
  .cloudcanvas-ui-calendar-event-time { flex: none; max-width: 100%; max-height: 100%; overflow: hidden; }
  .cloudcanvas-ui-timeline-bar.is-point::before { border-radius: inherit; }
  :is(.cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar.is-point, .cloudcanvas-ui-graph-node)::after {
    content: "";
    position: absolute;
    top: 50%;
    left: calc(50% - 1.5px);
    z-index: var(--target-under);
    width: max(100%, var(--target));
    height: max(100%, var(--target));
    translate: -50% -50%;
  }
  .cloudcanvas-ui-calendar .cloudcanvas-ui-calendar-event::after { top: 0; translate: -50% 0; }
  .cloudcanvas-ui-calendar .cloudcanvas-ui-calendar-timed::after { left: 0; width: 100%; translate: none; }
  .cloudcanvas-ui-timeline-bar.is-point::after { rotate: -45deg; }
  /* A dimmed node is faded by opacity, a stacking context of its own: its reach could not lie under the node drawn before it, so it has none. */
  .cloudcanvas-ui-graph-node:is(.is-dim, .is-unmatched)::after { pointer-events: none; }
}
`;var jn="var(--cc-ui-grid-line, var(--cc-card-border, rgba(255, 255, 255, 0.1)))",q="var(--cc-accent, #38bdf8)",Dr="max(100%, calc(var(--cc-control-min-coarse, 44px) / var(--graph-k, 1)))",Ye=e=>`max(100%, min(calc(24px / var(--graph-k, 1)), ${e}))`,Lr=`/* ------------------ UI KIT: GRAPH ------------------ */

.cloudcanvas-ui-graph { display: grid; gap: var(--cc-space-2, 8px); min-width: 0; }
.cloudcanvas-ui-graph-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-graph-search { flex: 1 1 10rem; min-width: 0; max-width: 20rem; }
.cloudcanvas-ui-graph-hint { margin: 0; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-graph-viewport {
  position: relative;
  height: var(--cc-ui-graph-height, 24rem);
  overflow: hidden;
  touch-action: none;
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border: 1px solid ${jn};
  border-radius: var(--cc-radius-md, 10px);
  cursor: grab;
}
.cloudcanvas-ui-graph-viewport:is(.is-panning, .is-drag-active) { cursor: grabbing; }
:is(.cloudcanvas-ui-graph-world, .cloudcanvas-ui-graph-edges, .cloudcanvas-ui-graph-nodes) { position: absolute; top: 0; left: 0; transform-origin: 0 0; overflow: visible; }
.cloudcanvas-ui-graph-edges { pointer-events: none; }
.cloudcanvas-ui-graph-overlay { z-index: var(--cc-z-ui-raised, 2); }

.cloudcanvas-ui-graph-edge { fill: none; stroke: var(--cc-connector, rgba(56, 189, 248, 0.6)); stroke-width: 1.5; }
.cloudcanvas-ui-graph-edge.is-related { stroke-dasharray: 6 5; }
.cloudcanvas-ui-graph-edge.is-depends-on { stroke: ${q}; stroke-width: 2; }
.cloudcanvas-ui-graph-arrow { fill: ${q}; }
/* A label is a chip on its edge: the surface's colour behind its words, so the line does not run through them. */
.cloudcanvas-ui-graph-edge-label-back { fill: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))); stroke: ${jn}; stroke-width: 1px; }
.cloudcanvas-ui-graph-edge-label-text { fill: var(--cc-text-muted, #94a3b8); font-size: var(--cc-type-xs, 11px); }
.cloudcanvas-ui-graph-draft { fill: none; stroke: ${q}; stroke-width: 2; stroke-dasharray: 4 4; }

.cloudcanvas-ui-graph-node {
  position: absolute;
  top: var(--graph-y);
  left: var(--graph-x);
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto auto;
  align-content: space-between;
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  font: inherit;
  font-size: var(--cc-type-md, 13px);
  line-height: 1.3;
  text-align: left;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 4px solid ${q};
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06));
  cursor: pointer;
  user-select: none;
}
.cloudcanvas-ui-graph[data-can-move] .cloudcanvas-ui-graph-node { cursor: grab; }
/* Two lines of the title, then an ellipsis: the node's tooltip and name hold the rest. */
.cloudcanvas-ui-graph-node-label {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
  font-weight: var(--cc-weight-medium, 500);
}
.cloudcanvas-ui-graph-node-meta { display: flex; align-items: center; gap: var(--cc-space-1, 4px); min-width: 0; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-graph-status {
  flex: none;
  max-width: 50%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 var(--cc-space-1, 4px);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  border-radius: var(--cc-radius-pill, 9999px);
}
.cloudcanvas-ui-graph-time { flex: 0 1 auto; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.cloudcanvas-ui-graph-toggle {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  padding: 0 var(--cc-space-1, 4px);
  font-variant-numeric: tabular-nums;
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-pill, 9999px);
}
/* A toggle that folds wears a chevron after its count: right to open what is folded, left to fold it back. */
.cloudcanvas-ui-graph[data-can-fold] .cloudcanvas-ui-graph-toggle { cursor: pointer; }
.cloudcanvas-ui-graph[data-can-fold] .cloudcanvas-ui-graph-toggle::before {
  content: "";
  order: 1;
  width: 0.35em;
  height: 0.35em;
  border-top: 1px solid currentColor;
  border-right: 1px solid currentColor;
  rotate: -135deg;
}
.cloudcanvas-ui-graph[data-can-fold] .cloudcanvas-ui-graph-node[aria-expanded="false"] .cloudcanvas-ui-graph-toggle::before { rotate: 45deg; }
.cloudcanvas-ui-graph-node[aria-expanded="false"] .cloudcanvas-ui-graph-toggle { color: var(--cc-ui-on-accent, #0f172a); background: ${q}; border-color: ${q}; }
.cloudcanvas-ui-graph-handle {
  position: absolute;
  top: 50%;
  right: 0;
  display: none;
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  translate: 50% -50%;
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  border: 2px solid ${q};
  border-radius: var(--cc-radius-pill, 9999px);
  opacity: 0;
  cursor: crosshair;
}
.cloudcanvas-ui-graph[data-can-link] .cloudcanvas-ui-graph-handle { display: block; }
.cloudcanvas-ui-graph-node:is(:hover, :focus-visible, .is-selected) .cloudcanvas-ui-graph-handle { opacity: 1; }
/* A mouse gets a whole target of what is drawn small: the fold toggle (24x16) and the link handle (12) reach 24px on the screen, kept within the node's own room - 30 world units tall, so a map at the first view's least scale, 0.8, still has them whole. The reach of the handle starts at its own edge and runs out from the node. */
:where(.cloudcanvas-ui-graph[data-can-fold]) .cloudcanvas-ui-graph-toggle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${Ye("40px")};
  height: ${Ye("30px")};
  translate: -50% -50%;
}
.cloudcanvas-ui-graph-handle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: -2px;
  width: ${Ye("40px")};
  height: ${Ye("30px")};
  translate: 0 -50%;
}

/* The "more" button of the selected node: its top right corner, the title keeping its room. Its reach is its own. */
.cloudcanvas-ui-graph-more { top: 3px; right: 3px; }
.cloudcanvas-ui-graph-more::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${Ye("36px")};
  height: ${Ye("36px")};
  translate: -50% -50%;
}
/* Drawn at the graph's zoom it would shrink to a dot on a map zoomed out to the 0.5 a big one opens at: it holds 16px on the screen, up to 36 of the graph's own units. */
.cloudcanvas-ui-graph-node { --item-more-size: min(max(1.5rem, calc(16px / var(--graph-k, 1))), 2.25rem); --item-more-room: calc(var(--item-more-size) + 4px); }
.cloudcanvas-ui-graph[data-can-menu] .cloudcanvas-ui-graph-node.is-selected .cloudcanvas-ui-graph-node-label { padding-right: var(--item-more-room); }

.cloudcanvas-ui-graph-node.is-selected {
  box-shadow: var(--cc-ui-selected-ring, inset 0 0 0 2px ${q}), var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
}
.cloudcanvas-ui-graph-node.is-path { border-color: ${q}; }
:is(.cloudcanvas-ui-graph-node, .cloudcanvas-ui-graph-edge, .cloudcanvas-ui-graph-edge-label).is-dim, .cloudcanvas-ui-graph-node.is-unmatched { opacity: 0.4; }
.cloudcanvas-ui-graph-node.is-drop-target { outline: 2px dashed var(--cc-ui-drop, ${q}); outline-offset: 3px; }
.cloudcanvas-ui-graph-node.is-dragging {
  z-index: var(--cc-z-ui-raised, 2);
  pointer-events: none;
  opacity: 0.85;
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55));
}

.cloudcanvas-ui-graph-minimap {
  position: absolute;
  right: var(--cc-space-2, 8px);
  bottom: var(--cc-space-2, 8px);
  z-index: var(--cc-z-ui-raised, 2);
  width: 10rem;
  height: 6.25rem;
  overflow: hidden;
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid ${jn};
  border-radius: var(--cc-radius-sm, 6px);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  touch-action: none;
  cursor: pointer;
}
.cloudcanvas-ui-graph-minimap-picture { display: block; width: 100%; height: 100%; }
.cloudcanvas-ui-graph-minimap-node { fill: var(--cc-text-muted, #94a3b8); fill-opacity: 0.6; }
.cloudcanvas-ui-graph-minimap-node.is-selected { fill: ${q}; fill-opacity: 1; }
.cloudcanvas-ui-graph-minimap-view { fill: var(--cc-btn-bg, rgba(56, 189, 248, 0.12)); stroke: ${q}; stroke-width: 2; vector-effect: non-scaling-stroke; }

@media (max-width: 40rem) {
  .cloudcanvas-ui-graph-minimap { width: 6.5rem; height: 4.25rem; }
}
@media (pointer: coarse) {
  /* The toggle and the handle are drawn small, at the graph's zoom: a finger gets 44px of each on the screen. */
  :is(.cloudcanvas-ui-graph-toggle, .cloudcanvas-ui-graph-handle)::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: ${Dr};
    height: ${Dr};
    translate: -50% -50%;
  }
  /* The handle's reach starts at the node's right edge and runs out from it, never over the node: the pill is the pill's, a node's middle is the node's. It is there for the node that is pointed at, focused or selected, as the handle is drawn. */
  .cloudcanvas-ui-graph-handle { pointer-events: none; }
  .cloudcanvas-ui-graph-node:is(:hover, :focus-visible, .is-selected) .cloudcanvas-ui-graph-handle { pointer-events: auto; }
  .cloudcanvas-ui-graph-handle::after { left: 7px; translate: 0 -50%; }
  /* The button is drawn at 24px and reaches a finger's 44px, which the room at a node's corner allows. */
  .cloudcanvas-ui-graph-more::after { width: max(100%, min(calc(var(--cc-control-min-coarse, 44px) / var(--graph-k, 1)), 52px)); height: max(100%, min(calc(var(--cc-control-min-coarse, 44px) / var(--graph-k, 1)), 52px)); }
  .cloudcanvas-ui-graph-node { --item-more-room: calc(var(--item-more-size) + 14px); }
}
`;var Ze="var(--cc-ui-grid-line, var(--cc-card-border, rgba(255, 255, 255, 0.1)))",Qe="var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)))",be="var(--cc-accent, #38bdf8)",Gn="var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8))",Cr=`/* ------------------ UI KIT: TIMELINE ------------------ */

.cloudcanvas-ui-timeline { --timeline-gutter: var(--cc-ui-gutter, 10rem); display: grid; gap: var(--cc-space-2, 8px); min-width: 0; }
.cloudcanvas-ui-timeline-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-timeline-scales { display: flex; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-timeline-range { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-hint { margin: 0; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-sheet { position: relative; isolation: isolate; max-height: var(--cc-ui-timeline-height, 28rem); overflow: auto; touch-action: pan-x pan-y; border: 1px solid ${Ze}; border-radius: var(--cc-radius-md, 10px); }
.cloudcanvas-ui-timeline-sheet.is-drag-active { user-select: none; }
.cloudcanvas-ui-timeline-grid { position: relative; width: calc(var(--timeline-gutter) + var(--timeline-width)); min-width: 100%; padding-bottom: var(--cc-space-2, 8px); }
.cloudcanvas-ui-timeline-axis { position: sticky; top: 0; z-index: var(--cc-z-ui-sticky, 3); display: flex; height: 1.75rem; background: ${Qe}; border-bottom: 1px solid ${Ze}; }
.cloudcanvas-ui-timeline-corner { position: sticky; left: 0; z-index: var(--cc-z-ui-raised, 2); flex: none; width: var(--timeline-gutter); background: ${Qe}; }
.cloudcanvas-ui-timeline-ticks { position: relative; flex: none; width: var(--timeline-width); }
.cloudcanvas-ui-timeline-tick {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--timeline-x);
  padding: var(--cc-space-1, 4px);
  font-size: var(--cc-type-xs, 11px);
  white-space: nowrap;
  color: var(--cc-text-muted, #94a3b8);
  border-left: 1px solid ${Ze};
}

/* The gutter's separator: a grip on the corner's edge, a cursor that says what a drag does. */
.cloudcanvas-ui-timeline-gutter-handle { position: absolute; top: 0; right: -3px; bottom: 0; width: 6px; cursor: col-resize; touch-action: none; border-radius: var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-timeline-gutter-handle::after { content: ""; position: absolute; top: 6px; bottom: 6px; left: 2px; width: 2px; border-radius: var(--cc-radius-sm, 6px); background: var(--cc-text-muted, #94a3b8); opacity: 0.5; }
.cloudcanvas-ui-timeline-gutter-handle:is(:hover, :focus-visible, .is-grabbed)::after { background: ${be}; opacity: 1; }
/* The separator is drawn 6px wide and takes a mouse 24px: it stands on the axis alone, so its reach has no neighbour to take a press from. */
.cloudcanvas-ui-timeline-gutter-handle::before { content: ""; position: absolute; top: 0; bottom: 0; left: 50%; width: 24px; translate: -50% 0; }
.cloudcanvas-ui-timeline-gutter-handle:focus-visible { outline: ${Gn}; outline-offset: 0; }

/* A group's heading: a row of its own, level 1 of the treegrid. */
/* It is as wide as the sheet's content, so the empty track beside its name takes a dragged span; the name stays in view as the sheet is scrolled. */
.cloudcanvas-ui-timeline-group { position: relative; display: flex; }
.cloudcanvas-ui-timeline-group > .cloudcanvas-ui-timeline-track { position: absolute; top: 0; bottom: 0; left: var(--timeline-gutter); height: auto; }
/* The heading's cell is the title column's, as a row's title is: at least as wide, on its surface, so a summary or a band scrolled under it is hidden as a bar is under a title. */
.cloudcanvas-ui-timeline-group-cell { position: sticky; left: 0; z-index: var(--cc-z-ui-raised, 2); flex: none; box-sizing: border-box; min-width: var(--timeline-gutter); display: flex; align-items: center; gap: var(--cc-space-1, 4px); padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px); font-size: var(--cc-type-sm, 12px); font-weight: var(--cc-weight-semibold, 600); color: var(--cc-text-muted, #94a3b8); background: ${Qe}; }
.cloudcanvas-ui-timeline-group-label:focus-visible { outline: ${Gn}; outline-offset: var(--cc-focus-ring-offset, 2px); }
/* The chevron: drawn, not written, so the heading's words are its name alone; it points down when the group is open and right when it is folded. */
.cloudcanvas-ui-timeline-group-toggle {
  position: relative;
  order: -1;
  flex: none;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-group-toggle::before {
  content: "";
  position: absolute;
  top: calc(50% - 4px);
  left: calc(50% - 3px);
  width: 6px;
  height: 6px;
  border-right: 2px solid currentcolor;
  border-bottom: 2px solid currentcolor;
  rotate: 45deg;
}
.cloudcanvas-ui-timeline-group-toggle[aria-expanded="false"]::before { top: calc(50% - 3px); left: calc(50% - 4px); rotate: -45deg; }
.cloudcanvas-ui-timeline-group-toggle:is(:hover, :focus-visible) { color: var(--cc-text, #e2e8f0); background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }
.cloudcanvas-ui-timeline-group-toggle:focus-visible { outline: ${Gn}; outline-offset: 0; }
.cloudcanvas-ui-timeline-group-count { padding: 0 var(--cc-space-1, 4px); font-weight: var(--cc-weight-medium, 500); color: var(--cc-text-muted, #94a3b8); border: 1px solid ${Ze}; border-radius: var(--cc-radius-sm, 6px); }

.cloudcanvas-ui-timeline-row { display: flex; align-items: center; min-height: 2.25rem; border-bottom: 1px solid ${Ze}; }
.cloudcanvas-ui-timeline-label {
  position: sticky;
  left: 0;
  z-index: var(--cc-z-ui-raised, 2);
  flex: none;
  box-sizing: border-box;
  width: var(--timeline-gutter);
  padding: 0 var(--cc-space-2, 8px);
  overflow: hidden;
  font-size: var(--cc-type-sm, 12px);
  white-space: nowrap;
  text-overflow: ellipsis;
  background: ${Qe};
  cursor: pointer;
}
.cloudcanvas-ui-timeline-label::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; border-right: 1px solid ${Ze}; }
.cloudcanvas-ui-timeline-row.is-current .cloudcanvas-ui-timeline-label { font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-timeline-track { position: relative; flex: none; width: var(--timeline-width); height: 2.25rem; }
.cloudcanvas-ui-timeline[data-can-create] .cloudcanvas-ui-timeline-track { cursor: crosshair; }
/* The span being made: a band of the days it covers - its border within them - and its dates in a tag of their own. A title drawn beside a short bar or a milestone is centred on the row, where a band over those days would write its dates too, so the tag hangs below that line: its top is the row's middle (the band's own) and 0.85em down, past a title's half height at the line height of 1.6 a page may inherit, which on the last row is below the row, so the grid keeps room for it and the sheet does not grow when it is drawn - on the sheet's surface so it is read at 4.5:1 whatever is under it, in the page's text colour (see the calendar's band). */
.cloudcanvas-ui-timeline-draft {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: var(--timeline-x);
  width: var(--timeline-w);
  box-sizing: border-box;
  overflow: visible;
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border: 2px dashed var(--cc-ui-drop, ${be});
  border-radius: var(--cc-radius-sm, 6px);
  pointer-events: none;
}
.cloudcanvas-ui-timeline-draft-words {
  position: absolute;
  top: calc(50% + 0.85em);
  left: -2px;
  padding: 0 var(--cc-space-1, 4px);
  font-size: var(--cc-type-xs, 11px);
  line-height: 1;
  white-space: nowrap;
  color: var(--cc-text, #e2e8f0);
  background: ${Qe};
  border-radius: var(--cc-radius-sm, 6px);
}

/* A folded group's summary: the days its items cover, its name and count in the page's text; a press opens the group's item, so it points, and it is no row to drag a span across. */
.cloudcanvas-ui-timeline-summary {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: var(--timeline-x);
  width: var(--timeline-w);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 var(--cc-space-2, 8px);
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text, #e2e8f0);
  background: ${Qe};
  border: 1px dashed var(--cc-text-muted, #94a3b8);
  border-left: 4px solid var(--cc-text-muted, #94a3b8);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-summary-title { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* A bar: its title inside (or beside it), its status in its outline and fill, its progress as the fill that is done. */
.cloudcanvas-ui-timeline-bar {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: var(--timeline-x);
  width: var(--timeline-w);
  min-width: 1.25rem;
  display: flex;
  align-items: center;
  padding: 0 var(--cc-space-2, 8px);
  font: inherit;
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-ui-bar-text, var(--cc-text, #e2e8f0));
  background: var(--cc-ui-bar, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
  border: 1px solid var(--timeline-tone, ${be});
  border-left-width: 4px;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-bar[data-movable] { cursor: grab; }
.cloudcanvas-ui-timeline-bar[data-status-tone="success"] { --timeline-tone: var(--cc-tone-success, #22c55e); }
.cloudcanvas-ui-timeline-bar[data-status-tone="warning"] { --timeline-tone: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-timeline-bar[data-status-tone="danger"] { --timeline-tone: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-timeline-bar[data-status-tone="muted"] { --timeline-tone: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-bar::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(var(--timeline-progress, 0) * 100%);
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-radius: inherit;
}
.cloudcanvas-ui-timeline-bar[data-status-tone]::before { background: color-mix(in oklab, var(--timeline-tone) var(--timeline-fill, 40%), transparent); }
.cloudcanvas-ui-timeline-bar.is-point { top: 50%; bottom: auto; left: calc(var(--timeline-x) - 7px); width: 14px; height: 14px; padding: 0; translate: 0 -50%; rotate: 45deg; }
.cloudcanvas-ui-timeline-bar.is-short { padding: 0; }
.cloudcanvas-ui-timeline-bar-title { position: relative; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* The title of a milestone, or of a bar too short to hold it: beside it, a part of the same item. */
.cloudcanvas-ui-timeline-outside {
  position: absolute;
  top: 50%;
  left: calc(var(--timeline-x) + var(--timeline-w) + 22px);
  translate: 0 -50%;
  font-size: var(--cc-type-xs, 11px);
  white-space: nowrap;
  color: var(--cc-text, #e2e8f0);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-outside.is-point { left: calc(var(--timeline-x) + 12px); }
.cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-outside { left: calc(var(--timeline-x) + var(--timeline-w) + 30px); }
.cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-outside.is-point { left: calc(var(--timeline-x) + 32px); }

/* The handle a link is dragged from: beside a bar's right edge, drawn when the host can link and the row is hovered, focused or selected. */
.cloudcanvas-ui-timeline-link {
  position: absolute;
  top: 50%;
  left: calc(var(--timeline-x) + var(--timeline-w) + 6px);
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  z-index: var(--cc-z-ui-raised, 2);
  translate: 0 -50%;
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  border: 2px solid ${be};
  border-radius: var(--cc-radius-pill, 9999px);
  opacity: 0;
  cursor: crosshair;
}
.cloudcanvas-ui-timeline-link.is-point { left: calc(var(--timeline-x) + 16px); }
/* A mouse gets 24px of the handle: from the bar's edge, a whole target, clear of the title drawn beside it. */
.cloudcanvas-ui-timeline-link::after { content: ""; position: absolute; top: 50%; left: -6px; width: 24px; height: 24px; translate: 0 -50%; }
.cloudcanvas-ui-timeline-row:is(:hover, :focus-within, .is-current) .cloudcanvas-ui-timeline-link { opacity: 1; }
.cloudcanvas-ui-timeline-bar.is-drop-target { outline: 2px dashed var(--cc-ui-drop, ${be}); outline-offset: 2px; }

/* The dependencies: connectors in a layer of their own over the bars, a picture the pointer passes through everywhere - the bars are the pointer's, and so is the handle a link is dragged from, which stands above the layer where a connector starts. */
.cloudcanvas-ui-timeline-links {
  position: absolute;
  top: 0;
  left: var(--timeline-gutter);
  z-index: var(--cc-z-ui-raised, 2);
  width: var(--timeline-width);
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.cloudcanvas-ui-timeline-connector-line { fill: none; stroke: var(--cc-connector, rgba(56, 189, 248, 0.6)); stroke-width: 1.5; }
.cloudcanvas-ui-timeline-arrow { fill: ${be}; }
.cloudcanvas-ui-timeline-draft-link { fill: none; stroke: ${be}; stroke-width: 2; stroke-dasharray: 6 5; }

/* The handles at a bar's ends: each resizes, and says so under the pointer. */
:is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start) { position: absolute; top: 0; bottom: 0; width: min(10px, 30%); cursor: ew-resize; background: ${be}; opacity: 0.4; }
.cloudcanvas-ui-timeline-handle { right: 0; border-radius: 0 var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0; }
.cloudcanvas-ui-timeline-handle-start { left: 0; border-radius: var(--cc-radius-sm, 6px) 0 0 var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-timeline-row:is(:hover, :focus-within, .is-current) :is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start) { opacity: 0.75; }
/* A mouse gets 24px of each end: inward from the bar's edge, never past a third of what is inside its borders (4px at the start, 1px at the end), so its middle is its own to move - a bar of half an hour is 20px wide, and its body is still its body; the handle is as tall as the bar. */
:is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start)::after { content: ""; position: absolute; top: 50%; width: min(24px, calc((var(--timeline-w) - 5px) / 3)); height: max(100%, 24px); translate: 0 -50%; }
.cloudcanvas-ui-timeline-handle::after { right: 0; }
.cloudcanvas-ui-timeline-handle-start::after { left: 0; }

/* The "more" button of the selected bar: where a title beside the bar would begin, which the selected row's title gives way to. */
.cloudcanvas-ui-timeline-more { top: 50%; left: calc(var(--timeline-x) + var(--timeline-w) + 22px); translate: 0 -50%; }
.cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-more { left: calc(var(--timeline-x) + var(--timeline-w) + 30px); }
.cloudcanvas-ui-timeline-more.is-point { left: calc(var(--timeline-x) + 12px); }
.cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-more.is-point { left: calc(var(--timeline-x) + 32px); }
.cloudcanvas-ui-timeline[data-can-menu] .cloudcanvas-ui-timeline-row.is-current:not(.is-crowded) .cloudcanvas-ui-timeline-outside { margin-left: var(--item-more-room); }
.cloudcanvas-ui-timeline-now {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--timeline-gutter) + var(--timeline-x));
  width: 2px;
  pointer-events: none;
  background: var(--cc-tone-danger, #f87171);
}

@media (max-width: 40rem) {
  .cloudcanvas-ui-timeline { --timeline-gutter: var(--cc-ui-gutter, 6rem); }
}
@media (pointer: coarse) {
  /* A finger gets a whole target at everything that is dragged or pressed: the toggle, the separator, a bar's handles. */
  .cloudcanvas-ui-timeline-group-toggle { width: var(--cc-control-min-coarse, 44px); height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-timeline-gutter-handle { right: calc(-0.5 * var(--cc-control-min-coarse, 44px)); width: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-timeline-gutter-handle::after { left: calc(50% - 1px); }
  :is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start) { width: min(14px, 30%); }
  /* A bar's ends reach inward a third of the bar at most, so its body keeps a third; a bar too short for three targets is one, its ends inert. */
  :is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start)::after {
    content: "";
    position: absolute;
    top: 50%;
    width: min(var(--cc-control-min-coarse, 44px), calc(var(--timeline-w) / 3));
    height: var(--cc-control-min-coarse, 44px);
    translate: 0 -50%;
  }
  .cloudcanvas-ui-timeline-bar.is-short :is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start) { pointer-events: none; }
  /* The grab area of a bar drawn narrower than a finger is padding round it: it lies under the bar, so the bar keeps its own look. A folded group's summary is a whole target the same way. */
  .cloudcanvas-ui-timeline-bar { overflow: visible; }
  /* A milestone's reach stands over the title drawn beside it - a part of the same item - so a finger 12 to 22px from its middle moves the milestone, not just opens it. */
  .cloudcanvas-ui-timeline-bar.is-point { z-index: var(--cc-z-ui-raised, 2); }
  .cloudcanvas-ui-timeline-bar:not(.is-point)::after, .cloudcanvas-ui-timeline-summary::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: var(--target-under);
    width: max(100%, var(--target));
    height: max(100%, var(--target));
    translate: -50% -50%;
  }
  .cloudcanvas-ui-timeline-handle::after { right: 0; }
  .cloudcanvas-ui-timeline-handle-start::after { left: 0; }
  /*
   * THE LINK HANDLE'S REACH lies past the bar's right end - the whole 44px of it, starting at the bar's edge (a milestone's
   * right corner) - never over the bar: the middle of every bar is the bar's, to tap, to hold and to drag. Where a bar is
   * narrower than two targets the handle is there only for the item that is selected or focused; its title, drawn beside
   * it, stands clear of the reach.
   */
  .cloudcanvas-ui-timeline-link::after { content: ""; position: absolute; top: 50%; left: -6px; width: var(--cc-control-min-coarse, 44px); height: var(--cc-control-min-coarse, 44px); translate: 0 -50%; }
  .cloudcanvas-ui-timeline-link.is-point::after { left: 0; }
  .cloudcanvas-ui-timeline-link.is-narrow { pointer-events: none; }
  .cloudcanvas-ui-timeline-row:is(.is-current, :focus-within) .cloudcanvas-ui-timeline-link.is-narrow { pointer-events: auto; }
  .cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-outside { left: calc(var(--timeline-x) + var(--timeline-w) + var(--cc-control-min-coarse, 44px) + 8px); }
  .cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-outside.is-point { left: calc(var(--timeline-x) + var(--cc-control-min-coarse, 44px) + 20px); }
  .cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-more { left: calc(var(--timeline-x) + var(--timeline-w) + var(--cc-control-min-coarse, 44px) + 8px); }
  .cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-more.is-point { left: calc(var(--timeline-x) + var(--cc-control-min-coarse, 44px) + 20px); }
  .cloudcanvas-ui-timeline[data-can-link] .cloudcanvas-ui-timeline-row.is-current .cloudcanvas-ui-timeline-link { opacity: 1; }
  /* A row is one whole target tall, and so is its track: a bar's grab area and the link handle's reach lie within it. */
  .cloudcanvas-ui-timeline-row { min-height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-timeline-track { height: var(--cc-control-min-coarse, 44px); }
  /* The axis is a target tall too, for the separator on its corner: 44px of content and its 1px rule below, whichever box a host sizes by. A row's title in the gutter, and the title beside a short bar, are the bar's: the whole height of the row. */
  .cloudcanvas-ui-timeline-axis { box-sizing: content-box; height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-timeline-tick { display: flex; align-items: center; }
  .cloudcanvas-ui-timeline-label { align-self: stretch; line-height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-timeline-outside { min-width: var(--cc-control-min-coarse, 44px); line-height: var(--cc-control-min-coarse, 44px); }
}
`;var Or=`/* ------------------ UI KIT: CALENDAR ------------------ */

/* A drag across the grid selects no text on its way. */
.cloudcanvas-ui-calendar-body.is-drag-active { user-select: none; }

/* The line under the toolbar: what the selection can do. */
.cloudcanvas-ui-calendar-hint { margin: 0; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }

/* The handle on a timed event's bottom edge: it resizes, and says so under the pointer. */
.cloudcanvas-ui-calendar-event-handle { position: absolute; right: 0; bottom: 0; left: 0; height: 6px; cursor: ns-resize; }
.cloudcanvas-ui-calendar-event-handle::before {
  content: "";
  position: absolute;
  bottom: 2px;
  left: calc(50% - 7px);
  width: 14px;
  height: 2px;
  background: currentcolor;
  border-radius: var(--cc-radius-sm, 6px);
  opacity: 0;
}
.cloudcanvas-ui-calendar-event:is(:hover, :focus-visible, .is-selected, .is-grabbed) .cloudcanvas-ui-calendar-event-handle::before { opacity: 0.7; }

/* The "more" button of the selected event, and the room its chip keeps for it. */
:is(.cloudcanvas-ui-calendar-events, .cloudcanvas-ui-calendar-allday-cell) { position: relative; }
.cloudcanvas-ui-calendar-event.is-holding-more { padding-right: var(--item-more-room); }
:is(.cloudcanvas-ui-calendar-events, .cloudcanvas-ui-calendar-allday-cell) > .cloudcanvas-ui-calendar-more-actions { grid-column: 1 / 2; top: 50%; right: 3px; translate: 0 -50%; }
.cloudcanvas-ui-calendar-more-actions.is-timed {
  top: calc(var(--calendar-top) * var(--cc-ui-hour-height, 48px) / 60 + 2px);
  right: auto;
  left: calc((var(--calendar-lane) + 1) * 100% / var(--calendar-lanes) - var(--item-more-size) - 3px);
  translate: none;
}

/* The range being made: a band of slots with their times in it down a column; the days of a month or the strip, lit. Its words are the page's text: the band is a wash over the page, and a bar's text colour is for a bar's accent fill. */
.cloudcanvas-ui-calendar-draft {
  position: absolute;
  top: calc(var(--calendar-top) * var(--cc-ui-hour-height, 48px) / 60);
  right: 1px;
  left: 1px;
  height: calc(var(--calendar-length) * var(--cc-ui-hour-height, 48px) / 60);
  padding: 0 var(--cc-space-1, 4px);
  overflow: hidden;
  font-size: var(--cc-type-xs, 11px);
  white-space: nowrap;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  border-radius: var(--cc-radius-sm, 6px);
  pointer-events: none;
}
.cloudcanvas-ui-calendar-cell.is-range, .cloudcanvas-ui-calendar-allday-cell.is-range { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8)); outline-offset: -2px; }

@media (pointer: coarse) {
  .cloudcanvas-ui-calendar-event-handle { height: 14px; }
  /* The handle's reach runs on from it, down over the ground below the event and out over its edge: under every event, so a neighbour below keeps its own. */
  .cloudcanvas-ui-calendar-event-handle::after { content: ""; position: absolute; top: 0; right: 0; left: -3px; z-index: var(--target-under); height: var(--cc-control-min-coarse, 44px); }
}
`;var Rr=`
.cloudcanvas-ui-context-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cc-space-1, 4px);
}
.cloudcanvas-ui-context-actions-pin[aria-pressed="true"] {
  background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
  font-weight: var(--cc-weight-semibold, 600);
}
.cloudcanvas-ui-context-window {
  position: fixed;
  box-sizing: border-box;
  top: calc(var(--context-viewport-top, 0px) + var(--context-viewport-height, 100dvh) - var(--cc-space-2, 8px) - env(safe-area-inset-bottom, 0px));
  right: calc(var(--context-viewport-right, 0px) + var(--cc-space-2, 8px) + env(safe-area-inset-right, 0px));
  transform: translateY(-100%);
  z-index: var(--cc-z-ui-context, 1200);
  width: min(28rem, calc(var(--context-viewport-width, 100vw) - 2 * var(--cc-space-2, 8px) - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)));
  max-height: calc(var(--context-viewport-height, 100dvh) - 2 * var(--cc-space-2, 8px) - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-2, 8px);
  overflow: auto;
  padding: var(--cc-space-3, 12px);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  overflow-wrap: anywhere;
}
.cloudcanvas-ui-context-window:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
.cloudcanvas-ui-context-window-header, .cloudcanvas-ui-context-window-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-width: 0;
  flex: none;
}
.cloudcanvas-ui-context-window-header { justify-content: space-between; }
.cloudcanvas-ui-context-window-title {
  flex: 1 1 100%;
  min-width: 0;
  margin: 0;
  font-size: var(--cc-type-lg, 15px);
  font-weight: var(--cc-weight-semibold, 600);
}
.cloudcanvas-ui-context-window-tools { justify-content: flex-end; width: 100%; }
.cloudcanvas-ui-context-window-description { flex: none; margin: 0; color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-context-window-body { min-width: 0; min-height: 0; overflow: auto; }
.cloudcanvas-ui-context-window-body > * { max-width: 100%; box-sizing: border-box; }
`;var _r=`
/* ------------------ UI KIT: MENU ------------------ */

/* The menu's own box draws nothing and takes no room where it is mounted: the control places its panels in the viewport. */
.cloudcanvas-ui-menu { display: contents; }
.cloudcanvas-ui-menu-panel {
  position: fixed;
  z-index: var(--cc-z-ui-menu, 1400);
  box-sizing: border-box;
  display: grid;
  min-width: var(--cc-menu-min-width, 168px);
  overflow: auto;
  padding: var(--cc-space-1, 4px);
  font-size: var(--cc-type-md, 13px);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
}
.cloudcanvas-ui-menu-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-3, 12px);
  min-width: 0;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  font: inherit;
  text-align: start;
  white-space: nowrap;
  color: inherit;
  background: transparent;
  border: 0;
  border-left: 3px solid transparent;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-menu-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.cloudcanvas-ui-menu-icon { display: inline-flex; flex: none; }
/* One highlight: the pointer moves focus, so the item under it and the item the keys are on are the same item. An open submenu's item keeps it. */
.cloudcanvas-ui-menu-item:is(:hover, :focus, [aria-expanded="true"]):not(:disabled) { background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))); }
.cloudcanvas-ui-menu-item:disabled { opacity: 0.5; cursor: not-allowed; }
/* The panel clips what is drawn outside it, so an item - and a menu with nothing to choose - wears the ring inside. */
:is(.cloudcanvas-ui-menu-item, .cloudcanvas-ui-menu-panel):focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
/* A dangerous item wears its tone as text. Under the highlight that tone loses its contrast: there the label is text again, and the edge carries the tone. */
.cloudcanvas-ui-menu-item[data-tone="danger"] { color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-menu-item[data-tone="danger"]:is(:hover, :focus):not(:disabled) { color: inherit; border-left-color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-menu-item[aria-haspopup="menu"]::after {
  content: "";
  flex: none;
  width: 0.4em;
  height: 0.4em;
  border-top: 1px solid currentColor;
  border-right: 1px solid currentColor;
  transform: rotate(45deg);
}
.cloudcanvas-ui-menu-separator { height: 1px; margin: var(--cc-space-1, 4px) 0; background: var(--cc-card-border, rgba(255, 255, 255, 0.1)); }

@media (pointer: coarse) {
  .cloudcanvas-ui-menu-item { min-height: var(--cc-control-min-coarse, 44px); }
}
`;var zr=`
/* ------------------ UI KIT: TABS ------------------ */

/* A strip that scrolls clips, so it keeps the room a risen flag stands in. */
.cloudcanvas-ui-tabs {
  --tab-close: var(--cc-control-min, 28px);
  --tab-close-back: calc(-1 * var(--tab-close));
  display: flex;
  gap: var(--cc-space-1, 4px);
  padding-top: var(--cc-ui-flag-rise, 0px);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}
.cloudcanvas-ui-tabs-item { display: inline-flex; align-items: center; flex: none; overflow-x: clip; scroll-snap-align: start; }
.cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close {
  min-height: var(--cc-control-min, 28px);
  font: inherit;
  color: var(--cc-text, #e2e8f0);
  background: transparent;
  border: 0;
  cursor: pointer;
}
/* A tab is one row: its mark, its label, its badge. The label is what gives way. */
.cloudcanvas-ui-tabs-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  max-width: var(--cc-ui-tab-width, 16rem);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  white-space: nowrap;
  border-bottom: 2px solid transparent;
}
.cloudcanvas-ui-tabs-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
/* The icon is a mark in the tab's own ink; it never shrinks, so the label is what gives way. A kit icon is as large as the label's text, so it makes no tab taller; a host's own element is as large as the host draws it. */
.cloudcanvas-ui-tabs-icon { display: inline-flex; flex: none; }
.cloudcanvas-ui-tabs-icon > .cloudcanvas-ui-icon { width: 1em; height: 1em; }
.cloudcanvas-ui-tabs-tab > .cloudcanvas-ui-badge { flex: none; }
.cloudcanvas-ui-tabs-tab[aria-selected="true"] { border-bottom-color: var(--cc-accent, #38bdf8); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-tabs-tab:disabled { opacity: 0.5; cursor: not-allowed; }
/* A badge needs the height a tab's padding takes: the label is centred in the whole tab instead, where it already sat. */
.cloudcanvas-ui-tabs-tab.is-badged { padding-top: 0; padding-bottom: 0; }
/* A pinned tab stays put and cannot be closed: a small mark before its label says so, in the label's own colour. */
.cloudcanvas-ui-tabs-tab[data-pinned="true"]::before {
  content: "";
  flex: none;
  width: 0.375em;
  height: 0.375em;
  background: currentColor;
  border-radius: var(--cc-radius-pill, 9999px);
}
/* The close control stands back over the far end of its tab, in the room the tab keeps for it. */
.cloudcanvas-ui-tabs .is-closable > .cloudcanvas-ui-tabs-tab { padding-right: var(--tab-close); }
.cloudcanvas-ui-tabs-close { position: relative; flex: none; align-self: stretch; width: var(--tab-close); margin-left: var(--tab-close-back); padding: 0; }
/* The ring is worn inside: a strip cuts what is drawn outside its tabs. */
.cloudcanvas-ui-tabs-tab:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}

/* The folder face: opaque, the tab in front of whatever is behind it in its row. */
.cloudcanvas-ui-tabs[data-face="folder"] {
  --tab-face: linear-gradient(var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))), var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))));
  --layer-shade: linear-gradient(var(--cc-ui-tab-layer, var(--cc-scope-bg, rgba(0, 0, 0, 0.2))), var(--cc-ui-tab-layer, var(--cc-scope-bg, rgba(0, 0, 0, 0.2))));
}
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-tab {
  position: relative;
  align-self: stretch;
  background-color: var(--cc-bg, #0f1117);
  background-image: var(--tab-face);
  border-top: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-right: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0 0;
  box-shadow: var(--cc-ui-tab-layer-shadow, var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)));
}
/* One step back: a step lower, under one wash of shade. A flag that rises keeps its height. */
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-item:not(.is-active) { padding-top: var(--cc-ui-tab-layer-step, 3px); }
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-item:not(.is-active) > .cloudcanvas-ui-tabs-tab { background-image: var(--layer-shade), var(--tab-face); }
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-item:not(.is-active) .cloudcanvas-ui-badge[data-shape="flag"] {
  transform: translateY(calc(-1 * (var(--cc-ui-flag-rise, 0px) + min(var(--cc-ui-flag-rise, 0px), var(--cc-ui-tab-layer-step, 3px)))));
}

/* A tab in hand, and the bar where it would land. */
.cloudcanvas-ui-tabs.is-drag-active, .cloudcanvas-ui-tabs.is-drag-active button { cursor: grabbing; }
.cloudcanvas-ui-tabs-item.is-dragging > .cloudcanvas-ui-tabs-tab {
  outline: var(--cc-focus-ring-width, 2px) dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
.cloudcanvas-ui-tabs-item[data-drop] { position: relative; }
.cloudcanvas-ui-tabs-item[data-drop]::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  z-index: var(--cc-z-ui-raised, 2);
  width: var(--cc-focus-ring-width, 2px);
  background: var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  outline: 1px solid var(--cc-bg, #0f1117);
}
.cloudcanvas-ui-tabs-item[data-drop="after"]::after { inset: 0 0 0 auto; }

/* Under a finger a tab is 44px tall and its close control 44px wide. */
@media (pointer: coarse) {
  .cloudcanvas-ui-tabs { --tab-close: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close { min-height: var(--cc-control-min-coarse, 44px); }
}
`;var Br=`
/* ------------------ UI KIT: TAB LAYERS ------------------ */

.cloudcanvas-ui-tabs-layers { display: inline-flex; align-self: stretch; }
.cloudcanvas-ui-tabs-layer {
  position: relative;
  flex: none;
  box-sizing: border-box;
  min-height: var(--cc-control-min, 28px);
  padding: 0;
  font: inherit;
  font-size: var(--cc-type-sm, 12px);
  color: var(--cc-text, #e2e8f0);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.cloudcanvas-ui-tabs-layer:disabled { opacity: 0.5; cursor: not-allowed; }
/* The face carries the label, and cuts one that is too long for it. */
.cloudcanvas-ui-tabs-layer-face { box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* The ring is the face's, inside it: on a folder strip the face is in front of every neighbour by then, and wider than the place it left. */
.cloudcanvas-ui-tabs-layer:focus-visible { outline: none; }
.cloudcanvas-ui-tabs-layer:focus-visible > .cloudcanvas-ui-tabs-layer-face {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
/* The fold's menu is mounted beside the strip and takes no room there. */
.cloudcanvas-ui-tabs-menu { display: contents; }

/* On a line strip: the label in line, then a mark that points on to the tab. */
.cloudcanvas-ui-tabs[data-face="line"] .cloudcanvas-ui-tabs-layer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  max-width: var(--cc-ui-tab-layer-width, 12rem);
}
.cloudcanvas-ui-tabs[data-face="line"] .cloudcanvas-ui-tabs-layer-face { min-width: 0; padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px); border-radius: var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-tabs[data-face="line"] .cloudcanvas-ui-tabs-layer::after {
  content: "";
  flex: none;
  width: 0.4em;
  height: 0.4em;
  border-top: 1px solid currentColor;
  border-right: 1px solid currentColor;
  transform: rotate(45deg);
}
.cloudcanvas-ui-tabs[data-face="line"] .cloudcanvas-ui-tabs-layer:is(:hover, :focus-visible):not(:disabled) > .cloudcanvas-ui-tabs-layer-face { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }

/* On a folder strip: a stack. The button is what peeks out; its face is free of the row. */
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer { width: var(--cc-ui-tab-layer-peek, 4.5rem); }
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer.is-fold { width: var(--cc-control-min, 28px); }
/* The label starts at the face's near edge, at its top as on a folder's tab, and ends before the corner the face is tucked under. */
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer-face {
  position: absolute;
  inset: var(--cc-ui-tab-layer-step, 3px) auto 0 0;
  width: max-content;
  min-width: calc(100% + var(--cc-radius-sm, 6px));
  max-width: calc(100% + var(--cc-radius-sm, 6px));
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px) 0 var(--cc-space-2, 8px);
  line-height: 1.2;
  text-align: start;
  background-color: var(--cc-bg, #0f1117);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-width: 1px 0 0 1px;
  border-radius: var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0 0;
  box-shadow: var(--cc-ui-tab-layer-shadow, var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)));
}
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer.is-fold > .cloudcanvas-ui-tabs-layer-face { padding-right: var(--cc-space-2, 8px); text-align: center; }
/* One step back, one step lower and one wash of shade more over the tab's own face. */
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer[data-depth="1"] > .cloudcanvas-ui-tabs-layer-face { background-image: var(--layer-shade), var(--tab-face); }
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer[data-depth="2"] > .cloudcanvas-ui-tabs-layer-face {
  top: calc(2 * var(--cc-ui-tab-layer-step, 3px));
  background-image: var(--layer-shade), var(--layer-shade), var(--tab-face);
}
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer[data-depth="3"] > .cloudcanvas-ui-tabs-layer-face {
  top: calc(3 * var(--cc-ui-tab-layer-step, 3px));
  background-image: var(--layer-shade), var(--layer-shade), var(--layer-shade), var(--tab-face);
}
/* Behind a tab a step back: one wash more. No heavier than the rules above, so a layer brought forward is still lit. */
.cloudcanvas-ui-tabs[data-face="folder"] :where(.cloudcanvas-ui-tabs-item:not(.is-active)) .cloudcanvas-ui-tabs-layer[data-depth="1"] > .cloudcanvas-ui-tabs-layer-face { background-image: var(--layer-shade), var(--layer-shade), var(--tab-face); }
.cloudcanvas-ui-tabs[data-face="folder"] :where(.cloudcanvas-ui-tabs-item:not(.is-active)) .cloudcanvas-ui-tabs-layer[data-depth="2"] > .cloudcanvas-ui-tabs-layer-face { background-image: var(--layer-shade), var(--layer-shade), var(--layer-shade), var(--tab-face); }
.cloudcanvas-ui-tabs[data-face="folder"] :where(.cloudcanvas-ui-tabs-item:not(.is-active)) .cloudcanvas-ui-tabs-layer[data-depth="3"] > .cloudcanvas-ui-tabs-layer-face {
  background-image: var(--layer-shade), var(--layer-shade), var(--layer-shade), var(--layer-shade), var(--tab-face);
}
/* Under the pointer or the keys a layer comes to the front and opens out to its label, over what stood in front of it:
   whole now, and lit as a control is under the pointer rather than shaded as something behind. */
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer:is(:hover, :focus-visible):not(:disabled) { z-index: var(--cc-z-ui-raised, 2); }
.cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer:is(:hover, :focus-visible):not(:disabled) > .cloudcanvas-ui-tabs-layer-face {
  max-width: var(--cc-ui-tab-layer-width, 12rem);
  background-image: linear-gradient(var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)), var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))), var(--tab-face);
  border-right-width: 1px;
}

/* A folder layer eases open only for a user who has not asked for less motion. */
@media (prefers-reduced-motion: no-preference) {
  .cloudcanvas-ui-tabs[data-face="folder"] .cloudcanvas-ui-tabs-layer-face { transition: max-width 120ms ease-out; }
}
@media (pointer: coarse) {
  .cloudcanvas-ui-tabs-layer { min-width: var(--cc-control-min-coarse, 44px); min-height: var(--cc-control-min-coarse, 44px); }
}
`;var qn="cloudcanvas-ui-styles",Pr=`${Tr}${Mr}${Nr}${Er}${Or}${Lr}${Cr}${Rr}${_r}${zr}${Br}`;function v(e=globalThis.document,{nonce:t}={}){if(!e?.createElement||!e.head)return null;let n=e.getElementById(qn);if(n)return n;let a=e.createElement("style");return a.id=qn,t&&a.setAttribute("nonce",String(t)),a.textContent=Pr,e.head.append(a),a}var y=Object.freeze({COLOR:"color",SIZE:"size",SHADOW:"shadow",Z_INDEX:"z-index"}),_c=Object.freeze({"--cc-ui-surface":{category:y.COLOR,purpose:"Surface of dialogs, toasts and sticky timeline chrome"},"--cc-ui-backdrop":{category:y.COLOR,purpose:"Dimming layer behind a modal dialog"},"--cc-ui-selected":{category:y.COLOR,purpose:"Fill of a highlighted result option"},"--cc-ui-on-accent":{category:y.COLOR,purpose:"Text on an accent fill (primary button, pressed view, today)"},"--cc-ui-grid-line":{category:y.COLOR,purpose:"Rules between calendar, board and timeline cells"},"--cc-ui-hour-lines":{category:y.COLOR,purpose:"Hour-rule background pattern of the week and day grids"},"--cc-ui-bar":{category:y.COLOR,purpose:"Fill of a calendar event and a timeline bar"},"--cc-ui-bar-text":{category:y.COLOR,purpose:"Text on a calendar event and a timeline bar"},"--cc-ui-drop":{category:y.COLOR,purpose:"Outline of a drop target and of an item being moved"},"--cc-ui-today":{category:y.COLOR,purpose:"Fill marking today's date"},"--cc-ui-flag-light":{category:y.COLOR,purpose:"Light on a flag badge: its sheen, its top edge and the lit side of its staff"},"--cc-ui-flag-shade":{category:y.COLOR,purpose:"Shade on a flag badge: under its sheen, at its staff and in its folded tail"},"--cc-ui-flag-shadow":{category:y.COLOR,purpose:"Shadow a flag badge casts on what it is planted on"},"--cc-ui-tab-layer":{category:y.COLOR,purpose:"Shade a folder layer behind a tab takes, once for each step back it stands"},"--cc-ui-tone-1":{category:y.COLOR,purpose:"Category tone 1 of 8: the edge of a card, event, bar, chip or tree item marked tone 1"},"--cc-ui-tone-2":{category:y.COLOR,purpose:"Category tone 2 of 8: the edge of a card, event, bar, chip or tree item marked tone 2"},"--cc-ui-tone-3":{category:y.COLOR,purpose:"Category tone 3 of 8: the edge of a card, event, bar, chip or tree item marked tone 3"},"--cc-ui-tone-4":{category:y.COLOR,purpose:"Category tone 4 of 8: the edge of a card, event, bar, chip or tree item marked tone 4"},"--cc-ui-tone-5":{category:y.COLOR,purpose:"Category tone 5 of 8: the edge of a card, event, bar, chip or tree item marked tone 5"},"--cc-ui-tone-6":{category:y.COLOR,purpose:"Category tone 6 of 8: the edge of a card, event, bar, chip or tree item marked tone 6"},"--cc-ui-tone-7":{category:y.COLOR,purpose:"Category tone 7 of 8: the edge of a card, event, bar, chip or tree item marked tone 7"},"--cc-ui-tone-8":{category:y.COLOR,purpose:"Category tone 8 of 8: the edge of a card, event, bar, chip or tree item marked tone 8"},"--cc-ui-dialog-width":{category:y.SIZE,purpose:"Maximum width of a dialog panel"},"--cc-ui-flag-rise":{category:y.SIZE,purpose:"How far a flag badge stands out of the top of what holds it; tabs and the nav bar keep that room"},"--cc-ui-tab-width":{category:y.SIZE,purpose:"Most room a tab takes; a longer label is cut with an ellipsis"},"--cc-ui-tab-layer-peek":{category:y.SIZE,purpose:"How much of a folder layer shows past whatever stands in front of it"},"--cc-ui-tab-layer-step":{category:y.SIZE,purpose:"How much lower a folder layer stands for each step back from its tab"},"--cc-ui-tab-layer-width":{category:y.SIZE,purpose:"Most room a folder layer takes when it comes forward to be read"},"--cc-ui-toast-offset":{category:y.SIZE,purpose:"Gap between the toast stack and the bottom of the viewport"},"--cc-ui-toast-inset-bottom":{category:y.SIZE,purpose:"Room kept clear under the toast stack, for a bar or a button a host floats there; the toast offset when unset"},"--cc-ui-toast-inset-left":{category:y.SIZE,purpose:"Room kept clear to the left of the toast stack"},"--cc-ui-toast-inset-right":{category:y.SIZE,purpose:"Room kept clear to the right of the toast stack"},"--cc-ui-hour-height":{category:y.SIZE,purpose:"Height of one hour in the week and day grids"},"--cc-ui-time-height":{category:y.SIZE,purpose:"Visible height of the scrolling hour grid"},"--cc-ui-timeline-height":{category:y.SIZE,purpose:"Visible height of the timeline sheet"},"--cc-ui-gutter":{category:y.SIZE,purpose:"Width of the timeline label column"},"--cc-ui-graph-height":{category:y.SIZE,purpose:"Height of the relationship-graph viewport"},"--cc-ui-tab-layer-shadow":{category:y.SHADOW,purpose:"Shadow a folder tab casts on the layer behind it"},"--cc-ui-selected-ring":{category:y.SHADOW,purpose:"Ring inside a card, chip, bar or heading a view marks as the selected item"},"--cc-z-ui-context":{category:y.Z_INDEX,purpose:"Nonmodal floating context windows: the lowest of the floating layers, below toasts, dialogs and menus"},"--cc-z-ui-toast":{category:y.Z_INDEX,purpose:"Toast stack: above the floating context windows, below a dialog and below a menu, which it must not cover"},"--cc-z-ui-dialog":{category:y.Z_INDEX,purpose:"A dialog that is not modal: above toasts, below a menu opened over it (a modal dialog is in the top layer)"},"--cc-z-ui-popover":{category:y.Z_INDEX,purpose:"Popovers: above a dialog that is not modal and the toasts, below a menu opened from one"},"--cc-z-ui-menu":{category:y.Z_INDEX,purpose:"Menus: the top floating layer, above the context windows, toasts and dialogs one may be opened over"},"--cc-z-ui-raised":{category:y.Z_INDEX,purpose:"Parts raised inside a UI view: sticky labels, a card being dragged"},"--cc-z-ui-sticky":{category:y.Z_INDEX,purpose:"Sticky headers inside a UI view, above raised parts (the timeline axis)"}});var zc=4,Bc=350,Pc=10;function Wn(e){return{x:e.clientX,y:e.clientY}}function Hc(e,t){return Math.hypot(t.clientX-e.x,t.clientY-e.y)}function Uc(e,t){let n=a=>{a.preventDefault(),a.stopPropagation()};t.addEventListener("click",n,{capture:!0,once:!0,signal:e.signal}),e.later(()=>t.removeEventListener("click",n,{capture:!0}),0)}function Fc(e,t,n){e.dragging=!0;try{t.setPointerCapture?.(e.press.id)}catch{}t.classList.add("is-drag-active"),n.onStart?.(e.press.item,{x:e.press.x,y:e.press.y},e.press.target)}function wt(e,t,n,a){let r=e.dragging;return e.cancelTouch?.(),e.cancelTouch=null,e.press=null,e.dragging=!1,t.classList.remove("is-drag-active"),r&&n.onEnd?.(a),r}function Kc(e,t,n,a,r){if(r.button!==0||t.press)return;let o=r.target.closest?.(a.selector);if(!o||!n.contains(o)||a.canStart?.(o,r)===!1)return;let i=r.pointerType==="touch";t.press={id:r.pointerId,item:o,target:r.target,x:r.clientX,y:r.clientY,touch:i,ready:!i},i&&(t.cancelTouch=e.later(()=>{t.press&&(t.press.ready=!0)},a.touchDelay??350))}function jc(e,t){return e.touch&&e.ready?t.touchThreshold??10:t.threshold??4}function Gc(e,t,n,a){let r=e.press;if(!(!r||a.pointerId!==r.id)){if(e.dragging){n.onMove?.(Wn(a));return}if(!(Hc(r,a)<=jc(r,n))){if(!r.ready){wt(e,t,n,null);return}Fc(e,t,n),n.onMove?.(Wn(a))}}}function L(e,t,n){let a={press:null,dragging:!1,cancelTouch:null};e.on(t,"pointerdown",o=>Kc(e,a,t,n,o)),e.on(t,"pointermove",o=>Gc(a,t,n,o)),e.on(t,"pointerup",o=>{a.press?.id===o.pointerId&&wt(a,t,n,Wn(o))&&Uc(e,t)}),e.on(t,"pointercancel",o=>{a.press?.id===o.pointerId&&wt(a,t,n,null)}),e.on(t,"touchmove",o=>{(a.dragging||a.press?.touch&&a.press.ready)&&o.preventDefault()},{passive:!1}),e.on(t,"contextmenu",o=>{a.press?.touch&&o.preventDefault()});let r=t.ownerDocument;return e.on(r,"keydown",o=>{o.key==="Escape"&&a.dragging&&(o.preventDefault(),wt(a,t,n,null))}),e.add(()=>{a.cancelTouch?.(),a.press=null,a.dragging=!1}),{cancel(){wt(a,t,n,null)},get dragging(){return a.dragging}}}var le="cloudcanvas-ui-dialog";function qc(e,t,n){let a=d(e,"dialog",{className:le}),r=d(e,"div",{className:`${le}-panel`,attrs:{tabindex:"-1"}}),o=d(e,"div",{className:`${le}-header`}),i=d(e,"h2",{className:`${le}-title`,attrs:{id:M(le)}}),s=x(e,i),c=$(e,{className:`${le}-close`,label:"Close",signal:t.signal,onClick:()=>n("button")}),l=d(e,"p",{className:`${le}-description`,attrs:{id:M(le),hidden:!0}}),u=d(e,"div",{className:`${le}-body`});return o.append(i,c),r.append(o,l,u),a.append(r),a.setAttribute("aria-labelledby",i.id),{root:a,panel:r,title:i,titleText:s,close:c,description:l,body:u}}function Wc(e,t){let n=ae(t.panel);if(n.length===0){e.preventDefault(),t.panel.focus();return}let a=t.root.ownerDocument.activeElement,r=n[0],o=n[n.length-1];e.shiftKey&&(a===r||!t.panel.contains(a)||a===t.panel)?(e.preventDefault(),o.focus()):!e.shiftKey&&(a===o||!t.panel.contains(a))&&(e.preventDefault(),r.focus())}function Vc(e,t,n,a){e.on(t.root,"keydown",r=>{r.key==="Escape"?(r.preventDefault(),r.stopPropagation(),n.escapeHandled=!0,queueMicrotask(()=>{n.escapeHandled=!1}),n.dismissible&&a("escape")):r.key==="Tab"&&n.modal&&Wc(r,t)}),e.on(t.root,"cancel",r=>{r.preventDefault(),!n.escapeHandled&&n.dismissible&&a("escape")}),e.on(t.root,"click",r=>{r.target===t.root&&n.dismissible&&a("backdrop")})}function Xc(e,t,n){h(e.titleText,n.title??""),e.close.hidden=n.closeButton===!1,e.close.setAttribute("aria-label",String(n.closeLabel??"Close")),h(e.close.firstChild,n.closeLabel??"Close");let a=n.description?String(n.description):"";e.description.hidden=a==="",e.description.textContent=a,a?e.root.setAttribute("aria-describedby",e.description.id):e.root.removeAttribute("aria-describedby"),t.dismissible=n.dismissible!==!1,t.modal=n.modal!==!1,n.content&&e.body.firstChild!==n.content&&e.body.replaceChildren(n.content)}function Yc(e,t,n){let a=t.root.ownerDocument;n.previous=a.activeElement,t.root.isConnected||e.append(t.root),n.modal&&typeof t.root.showModal=="function"?t.root.showModal():typeof t.root.show=="function"?t.root.show():t.root.setAttribute("open",""),t.root.classList.toggle("is-modal",n.modal),(ae(t.body)[0]??t.panel).focus()}function Hr(e,t){typeof e.root.close=="function"&&e.root.open&&e.root.close(),e.root.removeAttribute("open");let n=t.previous;t.previous=null,n?.isConnected&&typeof n.focus=="function"&&n.focus()}function Vn(e,{onClose:t}={}){let n=b(e);v(n);let a=g(),r={open:!1,modal:!0,dismissible:!0,previous:null,escapeHandled:!1},o=s=>{!a.dead&&r.open&&t?.(s)},i=qc(n,a,o);return Vc(a,i,r,o),{body:i.body,update(s={}){a.dead||(Xc(i,r,s),s.open&&!r.open?Yc(e,i,r):!s.open&&r.open&&Hr(i,r),r.open=!!s.open)},destroy(){a.destroy()&&(r.open&&Hr(i,r),r.open=!1,i.root.remove())}}}var Xn="cloudcanvas-ui-confirm";function Zc({title:e,body:t,confirmLabel:n,cancelLabel:a}){let r=String(e??"").trim();if(r==="")throw new TypeError("A confirmation needs a title");return{heading:r,body:String(t??""),confirm:String(n??"Confirm"),cancel:String(a??"Cancel")}}function Qc(e,t,n,a,r){let o=d(e,"div",{className:`${Xn}-actions`}),i=$(e,{label:n.cancel,className:`${Xn}-cancel`,signal:t.signal,onClick:()=>r(!1)}),s=$(e,{label:n.confirm,className:`${Xn}-confirm ${a?"is-danger":"is-primary"}`,signal:t.signal,onClick:()=>r(!0)});return o.append(i,s),{row:o,cancel:i,confirm:s}}function Jc(e,t){let n=Zc(e),a=e.host??globalThis.document?.body,r=b(a),o=g(),i=null,s=f=>{o.dead||(i.update({open:!1,title:n.heading}),i.destroy(),o.destroy(),t(f))};i=Vn(a,{onClose:()=>s(!1)});let{row:c,cancel:l,confirm:u}=Qc(r,o,n,e.danger===!0,s);return i.update({open:!0,title:n.heading,description:n.body,closeButton:!1,content:c}),(e.danger===!0?l:u).focus(),s}function el(e={}){let t=()=>{},n=new Promise(a=>{t=Jc(e,a)});return Object.assign(n,{close:(a=!1)=>t(!!a)})}var Kr="cloudcanvas-ui-context-actions";function Ur(e,t,n,a,r){let o=$(e,{className:`${Kr}-${n}`,label:a,signal:t.signal,onClick:()=>{!t.dead&&!o.disabled&&r?.()}});return o}function Fr(e,t,n){h(e.firstChild,t),e.setAttribute("aria-label",String(t)),e.disabled=!!n}function Yn(e,{onPin:t,onExpand:n}={}){let a=b(e);v(a);let r=g(),o=d(a,"div",{className:Kr}),i=Ur(a,r,"pin","Pin",t),s=Ur(a,r,"expand","Expand",n);return i.setAttribute("aria-pressed","false"),o.append(i,s),e.append(o),{update(c={}){r.dead||(o.setAttribute("aria-busy",String(!!c.busy)),i.setAttribute("aria-pressed",String(!!c.pinned)),Fr(i,c.pinLabel??"Pin",c.busy||c.pinDisabled),Fr(s,c.expandLabel??"Expand",c.busy||c.expandDisabled))},destroy(){r.destroy()&&o.remove()}}}function tl(e,t){let{left:n,top:a,width:r,height:o}=Ve(t);r>0&&o>0&&(e.style.setProperty("--context-viewport-width",`${r}px`),e.style.setProperty("--context-viewport-height",`${o}px`),e.style.setProperty("--context-viewport-top",`${Math.max(0,a)}px`),e.style.setProperty("--context-viewport-right",`${Math.max(0,t.innerWidth-n-r)}px`))}function jr(e,t){let n=e.ownerDocument.defaultView;if(!n)return;let a=()=>tl(e,n);t.on(n,"resize",a),n.visualViewport&&(t.on(n.visualViewport,"resize",a),t.on(n.visualViewport,"scroll",a)),a()}var re="cloudcanvas-ui-context-window";function nl(e,t,n){let a=d(e,"section",{className:re,attrs:{role:"dialog","aria-modal":"false",tabindex:"-1",hidden:!0,"data-cc-control":!0}}),r=d(e,"div",{className:`${re}-header`}),o=d(e,"h2",{className:`${re}-title`,attrs:{id:M(re)}}),i=x(e,o),s=d(e,"div",{className:`${re}-tools`}),c=d(e,"div",{className:`${re}-actions`}),l=$(e,{className:`${re}-close`,label:"Close",signal:t.signal,onClick:()=>n("button")}),u=d(e,"p",{className:`${re}-description`,attrs:{id:M(re),hidden:!0}}),f=d(e,"div",{className:`${re}-body`});return s.append(c,l),r.append(o,s),a.append(r,u,f),a.setAttribute("aria-labelledby",o.id),{root:a,titleText:i,close:l,description:u,body:f,actionHost:c}}function al(e,t,n,a){h(e.titleText,a.title??""),h(e.close.firstChild,a.closeLabel??"Close"),e.close.setAttribute("aria-label",String(a.closeLabel??"Close"));let r=a.description?String(a.description):"";e.description.hidden=r==="",e.description.textContent!==r&&(e.description.textContent=r),r?e.root.setAttribute("aria-describedby",e.description.id):e.root.removeAttribute("aria-describedby"),e.root.setAttribute("aria-busy",String(!!a.busy)),t.dismissible=a.dismissible!==!1,Object.hasOwn(a,"content")&&e.body.firstChild!==a.content&&e.body.replaceChildren(...a.content==null?[]:[a.content]),n.update(a)}function Gr(e,t){let n=e.root.contains(e.root.ownerDocument.activeElement);e.root.hidden=!0;let a=t.previous;t.previous=null,n&&a?.isConnected&&typeof a.focus=="function"&&a.focus()}function rl(e,t){t.previous=e.root.ownerDocument.activeElement,e.root.hidden=!1,(ae(e.body)[0]??e.root).focus()}function ol(e,t,n,a){e.on(t.root,"keydown",r=>{r.key!=="Escape"||r.defaultPrevented||!n.open||(r.preventDefault(),r.stopPropagation(),n.dismissible&&a("escape"))})}function il(e,{onClose:t,onPin:n,onExpand:a}={}){let r=b(e);v(r);let o=g(),i={open:!1,dismissible:!0,previous:null},s=u=>{!o.dead&&i.open&&t?.(u)},c=nl(r,o,s),l=Yn(c.actionHost,{onPin:()=>{i.open&&n?.()},onExpand:()=>{i.open&&a?.()}});return o.add(()=>l.destroy()),e.append(c.root),ol(o,c,i,s),jr(c.root,o),{body:c.body,update(u={}){o.dead||(!u.open&&i.open&&Gr(c,i),al(c,i,l,u),u.open&&!i.open&&rl(c,i),i.open=!!u.open)},destroy(){o.dead||(i.open&&Gr(c,i),i.open=!1,o.destroy(),c.root.remove())}}}var qr="cloudcanvas-ui-drawer",sl=160,cl=Object.freeze([{transform:"translateY(0)"},{transform:"translateY(-100%)"}]),ll=Object.freeze([{opacity:1,transform:"scale(1)"},{opacity:0,transform:"scale(0.2)"}]),Wr="--drawer-origin-x",Vr="--drawer-origin-y",Je=new WeakMap;function Yr(e){return Je.get(e)?.at(-1)??null}function Zr(e){let t=Yr(e);if(!t){e.removeAttribute("aria-expanded"),e.removeAttribute("aria-controls");return}e.setAttribute("aria-controls",t.root.id),e.setAttribute("aria-expanded",String(t.state.open===!0))}function dl(e,t){let n=t?.getBoundingClientRect();if(!n||!(n.width>0)||!(n.height>0)){e.style.removeProperty(Wr),e.style.removeProperty(Vr);return}let a=e.getBoundingClientRect();e.style.setProperty(Wr,`${n.left+n.width/2-a.left}px`),e.style.setProperty(Vr,`${n.top+n.height/2-a.top}px`)}function ul(e,t){let n=e.contains(e.ownerDocument.activeElement);e.hidden=!0,e.inert=!0,n&&t?.isConnected&&typeof t.focus=="function"&&t.focus()}function fl(e){e.hidden=!1,e.inert=!1}function Zn(e){let{root:t,state:n}=e;n.open||ul(t,n.anchor),n.motion?.cancel(),n.motion=null}function pl(e,t){let{root:n,state:a}=e;if(a.motion){a.motion.reverse();return}if(a.open&&fl(n),!t||Ne()){Zn(e);return}dl(n,a.anchor),a.motion=n.animate(a.direction==="up"?cl:ll,{duration:sl,easing:"ease-in",fill:"both",direction:a.open?"reverse":"normal"}),a.motion.onfinish=()=>Zn(e)}function Xr(e){let t=e.motion;t&&(e.motion=null,t.onfinish=null,t.finish(),t.cancel())}function Qr(e){let t=e.state.anchor;if(!t)return;e.state.anchor=null,e.press&&t.removeEventListener("click",e.press);let n=Je.get(t).filter(a=>a!==e);n.length>0?Je.set(t,n):Je.delete(t),Zr(t)}function ml(e,t){e.state.anchor!==t&&(Qr(e),e.state.anchor=t,t&&(Je.set(t,[...Je.get(t)??[],e]),e.press&&t.addEventListener("click",e.press)))}function hl(e,{onToggle:t}={}){let n=b(e);v(n);let a=g(),r=d(n,"div",{className:qr,attrs:{id:M(qr),role:"region",hidden:!0,inert:!0}});e.append(r);let o={open:null,anchor:null,motion:null,direction:"anchor"},i={root:r,state:o,press:null};return typeof t=="function"&&(i.press=()=>{Yr(o.anchor)===i&&t(!o.open)}),a.add(()=>Qr(i)),a.add(()=>Xr(o)),{panel:r,update(s={}){if(a.dead)return;let c=o.open,l=s.collapseDirection??"anchor";if(!["up","anchor"].includes(l))throw new TypeError("Invalid drawer collapse direction");l!==o.direction&&(Xr(o),Zn(i)),o.direction=l,o.open=!!s.open,r.setAttribute("aria-label",String(s.label??"Side panel")),ml(i,s.collapseTo??null),o.anchor&&Zr(o.anchor),o.open!==c&&pl(i,c!==null)},destroy(){a.destroy()&&r.remove()}}}var W="cloudcanvas-ui-badge-flag",de=Object.freeze({height:20,top:2,bottom:18,hoist:3,pad:3,glyph:6.5,notch:4,min:19}),Le=Object.freeze({sheen:.26,under:.18,edge:.3,staff:.45,glint:.7,hoist:.25,fold:.18});function gl(e){let{hoist:t,pad:n,glyph:a,notch:r,min:o}=de;return Math.max(o,Math.ceil(t+n*2+e.length*a+r))}function bl(e){let{top:t,bottom:n,hoist:a,notch:r}=de;return`M${a} ${t}H${e-1}Q${e} ${t} ${e-.5} ${t+.9}L${e-r} ${(t+n)/2}L${e-.5} ${n-.9}Q${e} ${n} ${e-1} ${n}H${a}Z`}function vl(e){let{top:t,bottom:n,notch:a}=de;return`M${e-a} ${(t+n)/2}L${e-.5} ${n-.9}Q${e} ${n} ${e-1} ${n}H${e-a-2}Z`}function xl(e,t){let n=k(e,"linearGradient",{id:t,x1:0,y1:0,x2:0,y2:1}),a=[[0,"lit",Le.sheen],[.55,"lit",0],[.55,"shaded",0],[1,"shaded",Le.under]];n.append(...a.map(([o,i,s])=>k(e,"stop",{class:`${W}-${i}`,offset:o,"stop-opacity":s})));let r=k(e,"defs");return r.append(n),r}function yl(e){let{height:t,top:n,hoist:a}=de;return{rod:[k(e,"rect",{class:`${W}-staff`,x:1,y:1,width:a-1,height:t-1,rx:1}),k(e,"rect",{class:`${W}-lit`,x:1,y:n+1,width:1,height:t-n-2,opacity:Le.staff})],finial:[k(e,"circle",{class:`${W}-staff`,cx:2,cy:2,r:2}),k(e,"circle",{class:`${W}-lit`,cx:1.5,cy:1.5,r:.8,opacity:Le.glint})]}}function wl(e,t){let{top:n,bottom:a,hoist:r}=de;return{pennant:k(e,"path",{class:`${W}-pennant`}),sheen:k(e,"path",{fill:`url(#${t})`}),hoist:k(e,"rect",{class:`${W}-shaded`,x:r,y:n,width:1,height:a-n,opacity:Le.hoist}),fold:k(e,"path",{class:`${W}-shaded`,opacity:Le.fold}),edge:k(e,"rect",{class:`${W}-lit`,x:r,y:n,height:1,opacity:Le.edge})}}function kl(e,t,n,a){let{height:r,hoist:o,notch:i}=de,s=bl(a);e.setAttribute("width",String(a)),e.setAttribute("viewBox",`0 0 ${a} ${r}`),t.pennant.setAttribute("d",s),t.sheen.setAttribute("d",s),t.fold.setAttribute("d",vl(a)),t.edge.setAttribute("width",String(a-o-1)),n.setAttribute("x",String((o+a-i)/2))}function Jr(e){let t=M(W),n=k(e,"svg",{class:W,height:de.height,"aria-hidden":"true",focusable:"false"}),a=yl(e),r=wl(e,t),o=k(e,"text",{class:`${W}-figure`,y:(de.top+de.bottom)/2,dy:"0.35em"}),i=x(e,o);n.append(xl(e,t),...a.rod,...Object.values(r),...a.finial,o);let s=0;return{node:n,write(c){let l=gl(c);h(i,c),l!==s&&(s=l,kl(n,r,o,l))}}}var eo="cloudcanvas-ui-badge",to=99,Al=new Set(["success","warning","danger"]);function no(e){let t=Number(e);return Number.isFinite(t)?Math.max(0,Math.floor(t)):null}function ao(e,t=to){let n=no(e);if(n===null)return"";let a=Number(t),r=Number.isFinite(a)&&a>=1?Math.floor(a):to;return n>r?`${r}+`:String(n)}function ro(e,t){return typeof e=="function"?String(e(t)??""):typeof e=="string"&&e!==""?e.replaceAll("{count}",String(t)):String(t)}function Qn(e){return typeof e=="number"?{count:e}:e&&typeof e=="object"?e:{}}function jt(e,t,n){if(n==null)return e?.destroy(),null;let a=e??Gt(t);return a.update(Qn(n)),a}function Sl(e){let t=d(e,"span",{className:eo,attrs:{hidden:!0}}),n=d(e,"span",{className:`${eo}-figure`,attrs:{"aria-hidden":"true"}}),a=d(e,"span",{className:Ee});return t.append(n,a),{root:t,figure:n,figureText:x(e,n),spoken:x(e,a),flag:null}}function $l(e,t,n){if(h(e.figureText,t?"":n),!t){e.root.removeAttribute("data-shape"),e.flag?.node.remove();return}e.root.setAttribute("data-shape","flag"),e.flag??=Jr(e.root.ownerDocument),e.flag.write(n),e.flag.node.parentNode!==e.figure&&e.figure.append(e.flag.node)}function Il(e,t){t?(e.setAttribute("role","status"),e.setAttribute("aria-live","polite")):(e.removeAttribute("role"),e.removeAttribute("aria-live"))}function Tl(e,t){let n=no(t.count)??0,a=n>0||t.showZero===!0,r=t.dot===!0;e.root.hidden=!a,e.root.classList.toggle("is-dot",r),Al.has(t.tone)?e.root.setAttribute("data-tone",t.tone):e.root.removeAttribute("data-tone"),$l(e,t.shape==="flag",r?"":ao(n,t.max)),h(e.spoken,a?ro(t.label,n):"")}function Gt(e){let t=b(e);v(t);let n=g(),a=Sl(t);return e.append(a.root),{update(r={}){n.dead||(Il(a.root,r.live===!0),Tl(a,r))},destroy(){n.destroy()&&a.root.remove()}}}var Jn=Object.freeze({back:["m12 19-7-7 7-7","M19 12H5"],check:["M20 6 9 17l-5-5"],close:["M18 6 6 18","m6 6 12 12"],empty:["M22 12h-6l-2 3h-4l-2-3H2","M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"],error:["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","M12 8v4","M12 16h.01"],info:["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","M12 16v-4","M12 8h.01"],loading:["M21 12a9 9 0 1 1-6.219-8.56"],locked:["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","M7 11V7a5 5 0 0 1 10 0v4"],more:["M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z","M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z","M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],open:["M7 7h10v10","M7 17 17 7"],plus:["M12 5v14","M5 12h14"],search:["M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","m21 21-4.34-4.34"]}),ea=Object.freeze(Object.keys(Jn)),io="cloudcanvas-ui-icon";function qt(e,t){let n=Jn[t];if(!Object.hasOwn(Jn,t))throw new TypeError(`The kit has no icon named ${String(t)}`);let a=k(e,"svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":1.7,"stroke-linecap":"round","stroke-linejoin":"round","aria-hidden":"true",focusable:"false",class:io,"data-icon":t});for(let r of n)a.append(k(e,"path",{d:r}));return a}var oo=new WeakMap;function ve(e,t){return d(e,"span",{className:t,attrs:{"aria-hidden":"true",hidden:!0}})}function xe(e,t){let n=t===void 0||t===""?null:t;if(n===(oo.get(e)??null))return;if(n!==null&&typeof n!="string"&&typeof n!="object")throw new TypeError("An icon is a kit icon name or an element");let a=typeof n=="string"?qt(e.ownerDocument,n):n;a?e.replaceChildren(a):e.replaceChildren(),oo.set(e,n),e.hidden=a===null}var ue="cloudcanvas-ui-menu",ta='[role="menuitem"]';function Wt(e){return Array.isArray(e?.items)&&e.items.length>0}function so(e){let t=D(e,"menu").flatMap(n=>n.items??[]);if(t.some(Wt))throw new TypeError("A menu has one level of submenu: an item inside one cannot have items of its own");return D([...e,...t],"menu"),e}function Ml(e){return e.flatMap((t,n)=>{let a={key:`item:${t.id}`,item:t};return t.separatorBefore===!0&&n>0?[{key:`separator:${t.id}`,item:null},a]:[a]})}function Nl(e,t){if(!t.item)return{node:d(e,"div",{className:`${ue}-separator`,attrs:{role:"separator"}})};let n=d(e,"button",{className:`${ue}-item`,attrs:{type:"button",role:"menuitem",tabindex:"-1","data-ui-id":t.item.id}}),a=ve(e,`${ue}-icon`),r=d(e,"span",{className:`${ue}-label`});return n.append(a,r),{node:n,slot:a,text:x(e,r)}}function El(e,t){if(!t){for(let n of["aria-haspopup","aria-expanded","aria-controls"])e.removeAttribute(n);return}e.setAttribute("aria-haspopup","menu"),e.hasAttribute("aria-expanded")||e.setAttribute("aria-expanded","false")}function Dl(e,{item:t}){t&&(h(e.text,t.label??t.id),xe(e.slot,t.icon),t.title?e.node.setAttribute("title",String(t.title)):e.node.removeAttribute("title"),e.node.disabled=t.disabled===!0,t.danger===!0?e.node.setAttribute("data-tone","danger"):e.node.removeAttribute("data-tone"),El(e.node,Wt(t)))}function na(e,t){let n=d(e,"div",{className:t,attrs:{id:M(ue),role:"menu",tabindex:"-1"}}),a=yt({key:r=>r.key,create:r=>Nl(e,r),update:Dl});return{node:n,draw(r,o){n.setAttribute("aria-label",String(r)),ce(n,a.sync(Ml(o)))},item:r=>a.get(`item:${r}`)?.node??null,reachable:()=>[...n.querySelectorAll(ta)].filter(r=>!r.disabled)}}var ye=8;function co(e,t,n){return Math.max(t,Math.min(e,n))}function lo(e){let t=e.ownerDocument.defaultView;if(!t)return null;let n=Ve(t);return e.style.maxWidth=`${n.width-2*ye}px`,e.style.maxHeight=`${n.height-2*ye}px`,e.style.left="0px",e.style.top="0px",{room:n,at:e.getBoundingClientRect()}}function aa(e,{room:t,at:n},a,r){let o=co(a,t.left+ye,t.left+t.width-n.width-ye),i=co(r,t.top+ye,t.top+t.height-n.height-ye);e.style.left=`${o-n.left}px`,e.style.top=`${i-n.top}px`}function uo(e,t,n){let a=lo(e);if(!a)return;if(Number.isFinite(t?.x)&&Number.isFinite(t?.y)){aa(e,a,t.x,t.y);return}let r=n?.isConnected?n.getBoundingClientRect():null;aa(e,a,r?.left??0,r?.bottom??0)}function fo(e,t){let n=lo(e);if(!n)return;let{room:a,at:r}=n,o=t.getBoundingClientRect(),i=o.right+r.width<=a.left+a.width-ye,s=o.left-r.width>=a.left+ye;aa(e,n,i||!s?o.right:o.left-r.width,o.top)}function Ll(e){let t=na(e,`${ue}-panel`),n=d(e,"div",{className:ue,attrs:{hidden:!0,role:"region","aria-labelledby":t.node.id,"data-cc-control":!0}}),a=na(e,`${ue}-panel is-submenu`);return a.node.hidden=!0,n.append(t.node,a.node),{root:n,panel:t,flyout:a}}function po(e){return!!e?.isConnected&&e.disabled!==!0&&!e.closest("[hidden]")}function At(e){e?.focus({preventScroll:!0})}function mo(e){return e?.getAttribute("aria-haspopup")==="menu"}function oa(e){At(e.reachable()[0]??e.node)}function ho(e){return[e.anchor,e.previous].find(t=>t?.isConnected&&typeof t.focus=="function")??null}function ia({nodes:e,state:t}){let n=e.panel.item(t.sub);return t.sub=null,e.flyout.node.hidden=!0,n?.setAttribute("aria-expanded","false"),n}function sa(e){let t=e.nodes.flyout.node.contains(e.doc.activeElement),n=ia(e);t&&At(n)}function go({nodes:e,state:t}){let n=t.items.find(r=>r.id===t.sub),a=e.panel.item(n.id);e.flyout.draw(n.label??n.id,n.items),e.flyout.node.hidden=!1,a.setAttribute("aria-expanded","true"),a.setAttribute("aria-controls",e.flyout.node.id),fo(e.flyout.node,a)}function bo(e,t){e.state.sub!==null&&ia(e),e.state.sub=t,go(e),oa(e.nodes.flyout)}function vo(e){let{doc:t,nodes:n,state:a}=e,r=n.root.contains(t.activeElement),o=ho(a);a.sub!==null&&ia(e),a.opening.destroy(),Object.assign(a,{open:!1,opening:null,anchor:null,previous:null}),n.root.hidden=!0,r&&At(o)}function kt(e,t,n){vo(e),e.callbacks.onClose?.(t),n!==void 0&&e.callbacks.onSelect?.(n)}function Cl(e){let{doc:t,nodes:n,state:a}=e,r=t.activeElement===t.body?null:t.activeElement;Object.assign(a,{open:!0,previous:r,opening:g()}),n.root.hidden=!1,a.opening.on(t,"pointerdown",o=>{n.root.contains(o.target)||kt(e,"outside")},{capture:!0})}function Ol(e,t){let{doc:n,nodes:a,state:r}=e;t&&(po(t)&&se(a.root,t)||a.root.contains(n.activeElement)&&po(n.activeElement)||oa(r.sub===null?a.panel:a.flyout))}function Rl(e,t,n){let{doc:a,nodes:r,state:o}=e,i=!o.open;i&&Cl(e);let s=n.find(l=>l.id===o.sub);o.sub!==null&&!(Wt(s)&&s.disabled!==!0)&&sa(e);let c=r.root.contains(a.activeElement)?a.activeElement:null;o.items=n,o.anchor=t.anchor??null,r.panel.draw(t.label??"Menu",n),uo(r.panel.node,t.at,ho(o)),o.sub!==null&&go(e),i?oa(r.panel):Ol(e,c)}function xo(e,t){let n=t.getAttribute("data-ui-id");mo(t)?e.state.sub===n?sa(e):bo(e,n):kt(e,"select",n)}function _l(e,t,n){let a=e.reachable(),r=Q(n,a.indexOf(t),a.length,{orientation:"vertical",wrap:!0});return r===null?!1:(At(a[r]),!0)}function ra(e){let t=e.target.closest?.(ta)??null;return t&&!t.disabled?t:null}function zl(e,t){let{panel:n,flyout:a}=e.nodes,{key:r}=t,o=a.node.contains(t.target),i=ra(t);if(r==="Tab")kt(e,"tab");else if(o&&(r==="Escape"||r==="ArrowLeft"))sa(e);else if(r==="Escape")kt(e,"escape");else if(r==="ArrowRight"&&mo(i))bo(e,i.getAttribute("data-ui-id"));else if(i&&(r==="Enter"||r===" "))xo(e,i);else return _l(o?a:n,i,r);return!0}function Bl(e,t){let{nodes:n,state:a}=t;e.on(n.root,"keydown",r=>{!a.open||!zl(t,r)||(r.preventDefault(),r.stopPropagation())}),e.on(n.root,"click",r=>{let o=ra(r);a.open&&o&&xo(t,o)}),e.on(n.root,"pointerover",r=>{let o=ra(r);!a.open||!o||a.sub!==null&&n.panel.node.contains(o)||At(o)})}function ca(e,{onSelect:t,onClose:n}={}){let a=b(e);v(a);let r=g(),o=Ll(a);e.append(o.root);let i={open:!1,items:[],sub:null,anchor:null,previous:null,opening:null},s={doc:a,nodes:o,state:i,callbacks:{onSelect:t,onClose:n}};return Bl(r,s),{update(c={}){if(r.dead)return;let l=c.open?so(c.items??[]):[];l.length>0?Rl(s,c,l):i.open&&kt(s,"update")},destroy(){r.dead||(i.open&&vo(s),r.destroy(),o.root.remove())}}}var St="cloudcanvas-ui-tabs",la=3;function wo(e){return D(e.layers??[],"tab layer")}function ko(e){return e.length<=la?{folded:[],shown:e}:{folded:e.slice(0,1-la),shown:e.slice(1-la)}}var Vt=e=>String(e.label??e.id);function yo(e,t,n){let a=d(e,"button",{className:t,attrs:{type:"button",...n}}),r=d(e,"span",{className:`${St}-layer-face`});return a.append(r),{node:a,text:x(e,r)}}function Pl(e,t){h(e.text,Vt(t)),e.node.setAttribute("aria-label",`Up to ${Vt(t)}`),e.node.title=Vt(t)}function Hl(e,t){let n=d(e,"div",{className:`${St}-layers`,attrs:{role:"group","data-ui-layers":t}}),a=yo(e,`${St}-layer is-fold`,{"data-ui-fold":t,"aria-haspopup":"menu","aria-expanded":"false"});h(a.text,"…");let r=yt({create:o=>yo(e,`${St}-layer`,{"data-ui-layer":o.id}),update:Pl});return{group:n,fold:a.node,rows:r}}function Ao(e,t,n,a){let{folded:r,shown:o}=ko(n.layers??[]);if(o.length===0){t.layers?.group.remove(),t.layers=null;return}t.layers??=Hl(e,n.id);let{group:i,fold:s,rows:c}=t.layers;i.setAttribute("aria-label",`Parent scopes of ${String(n.label)}`),s.setAttribute("aria-label",`${r.length} more parent scopes`);let l=r.length>0?[s,...c.sync(o)]:c.sync(o);ce(i,l),l.forEach((u,f)=>{u.setAttribute("data-depth",String(l.length-f)),u.setAttribute("tabindex",a?"0":"-1"),u.disabled=n.disabled===!0}),i.parentNode!==t.row&&t.row.insertBefore(i,t.tab)}function da(e){return e.views.get(e.tabId)?.layers?.fold??null}function So(e,t){e.open=t,da(e)?.setAttribute("aria-expanded",String(t))}function Xt(e){e.shut?.life.destroy(),e.shut=null}function Ul(e){Xt(e),e.shut={tabId:e.tabId,life:g()};let t=e.host.ownerDocument;e.shut.life.on(t,"pointerdown",()=>Xt(e),{capture:!0}),e.shut.life.on(t,"click",()=>Xt(e))}function Fl(e){e.mount=d(e.host.ownerDocument,"div",{className:`${St}-menu`}),e.host.append(e.mount),e.menu=ca(e.mount,{onClose(t){So(e,!1),t==="outside"&&Ul(e)},onSelect:t=>e.callbacks.onLayer?.(e.tabId,t)})}function $o(e,t){if(!e.open)return;let n=t.find(r=>r.id===e.tabId),a=n&&n.disabled!==!0?ko(n.layers??[]).folded:[];if(a.length===0){e.menu.update({open:!1});return}So(e,!0),e.menu.update({open:!0,label:`More parent scopes of ${String(n.label)}`,anchor:da(e),items:a.map(r=>({id:r.id,label:Vt(r)}))})}function Kl(e,t,n){if(e.shut?.tabId===t)return;let a=e.open&&e.tabId===t;e.open&&e.menu.update({open:!1}),!a&&(e.menu||Fl(e),Object.assign(e,{tabId:t,open:!0}),$o(e,n))}function Io(e,t,n){let a={host:e,views:t,callbacks:n,mount:null,menu:null,tabId:null,open:!1,shut:null};return{get open(){return a.open},holds:r=>!!r&&a.mount?.contains(r)===!0,button:()=>da(a),press:(r,o)=>Kl(a,r,o),sync:r=>$o(a,r),destroy(){Xt(a),a.menu?.destroy(),a.mount?.remove()}}}var jl="cloudcanvas-ui-tabs",ua=`.${jl}-item`,Gl=Object.freeze({ArrowLeft:-1,ArrowRight:1});function fa(e,t,n){let a=e.findIndex(o=>o.id===t);if(a===-1||e[a].pinned===!0)return;let r=Math.max(0,Math.min(n,e.length));for(;r<e.length&&e[r].pinned===!0;)r+=1;if(!(r===a||r===a+1))return r<e.length?e[r].id:null}function ql(e,t,n){if(n>0)return t+2;for(let a=t-1;a>=0;a-=1)if(e[a].pinned!==!0)return a;return t}function To(e,t){let n=Array.from(e.querySelectorAll(ua)),a=n.findIndex(r=>{let o=r.getBoundingClientRect();return t<o.left+o.width/2});return a===-1?n.length:a}function Mo(e){for(let t of e.querySelectorAll("[data-drop]"))t.removeAttribute("data-drop")}function Wl(e,t,n,a){Mo(e);let r=fa(t.items,n,To(e,a));if(r===void 0)return;let o=Array.from(e.querySelectorAll(ua));(r===null?o.at(-1):o[t.items.findIndex(s=>s.id===r)])?.setAttribute("data-drop",r===null?"after":"before")}function Vl(e,t,n,a){let r=null;L(e,t,{selector:'[role="tab"]',canStart:i=>!i.disabled&&i.getAttribute("data-pinned")!=="true",onStart(i){r={id:i.getAttribute("data-ui-id"),row:i.closest(ua)},r.row.classList.add("is-dragging")},onMove:i=>Wl(t,n,r.id,i.x),onEnd:i=>{let{id:s,row:c}=r;r=null,c.classList.remove("is-dragging"),Mo(t);let l=i?fa(n.items,s,To(t,i.x)):void 0;l!==void 0&&a(s,l)}})}function No(e,t,n,a){let r=a.onReorder;return typeof r!="function"?{key:()=>!1}:(t.setAttribute("data-reorder","true"),Vl(e,t,n,r),{key(o,i){let s=o.altKey?Gl[o.key]:void 0;if(s===void 0)return!1;let c=n.items.findIndex(u=>u.id===i),l=c===-1?void 0:fa(n.items,i,ql(n.items,c,s));return l!==void 0&&r(i,l),!0}})}function Xl(e){let t=e.items.find(n=>n.id===e.activeId);return t?JSON.stringify([t.id,...(t.layers??[]).map(n=>n.id)]):null}function Yl(e,t,n){return e>=0&&t<=n?0:e<0||t-e>n?e:t-n}function Zl(e,t){let n=e.getBoundingClientRect().left,a=e.clientWidth,r=t.row.getBoundingClientRect().right-n,o=t.tab.getBoundingClientRect().left-n,i=t.layers?.group.lastElementChild??null,s=i?i.getBoundingClientRect().left-n:o;return Yl(r-s<=a?s:o,r,a)}function Eo(e,t){let n,a=!1;return{sync(r){let o=Xl(r);if(o===n)return;let i=t.get(r.activeId);if(i&&e.clientWidth<=0||(n=o,!i))return;let s=Zl(e,i);s!==0&&e.scrollTo({left:e.scrollLeft+s,behavior:a&&!Ne()?"smooth":"instant"}),a=!0}}}var Ce="cloudcanvas-ui-tabs",Do=Object.freeze(["line","folder"]);function Ql(e){let t=e??Do[0];if(!Do.includes(t))throw new TypeError(`A tab strip's face is 'line' or 'folder', not ${String(t)}`);return t}function Jl(e){let t=d(e,"div",{className:`${Ce}-item`,attrs:{role:"presentation"}}),n=d(e,"button",{className:`${Ce}-tab`,attrs:{id:M("ui-tab"),role:"tab",type:"button"}}),a=d(e,"span",{className:`${Ce}-label`});n.append(a);let r=d(e,"button",{className:`${Ce}-close`,text:"×",attrs:{type:"button",tabindex:"-1"}});return t.append(n,r),{row:t,tab:n,name:a,label:x(e,a),close:r,icon:null,badge:null,layers:null}}function ed(e,t,n){if(n==null||n===""){t.icon?.remove();return}t.icon??=ve(e,`${Ce}-icon`),xe(t.icon,n),t.icon.parentNode!==t.tab&&t.tab.prepend(t.icon)}function pa(e){return e?.closable===!0&&e.pinned!==!0}function td(e,t,n){e.close.setAttribute("data-ui-close",t.id),e.close.setAttribute("data-ui-for",t.id),e.close.setAttribute("aria-label",`${n} ${String(t.label)}`),e.close.hidden=!pa(t),e.row.classList.toggle("is-closable",pa(t)),t.pinned===!0?e.close.remove():e.close.parentNode!==e.row&&e.row.append(e.close)}function nd(e,t){e.badge=jt(e.badge,e.tab,t),e.tab.classList.toggle("is-badged",e.badge!==null)}function Lo(e,t){t===null?e.removeAttribute("title"):e.title=t}function ad(e,t){let n=String(t.label??"");h(e.label,n),Lo(e.tab,e.badge===null?n:null),Lo(e.name,e.badge===null?null:n)}function rd(e,t,n,a){let r=n.id===a.activeId;t.tab.setAttribute("data-ui-id",n.id),t.tab.setAttribute("aria-selected",String(r)),t.row.classList.toggle("is-active",r),n.panelId?t.tab.setAttribute("aria-controls",String(n.panelId)):t.tab.removeAttribute("aria-controls"),n.pinned===!0?t.tab.setAttribute("data-pinned","true"):t.tab.removeAttribute("data-pinned"),t.tab.disabled=n.disabled===!0,ed(e,t,n.icon),nd(t,n.badge),ad(t,n),td(t,n,a.closeLabel),Ao(e,t,n,r)}function od(e,t){let n=e.get(t);n.badge?.destroy(),n.row.remove(),e.delete(t)}function Co(e){return e.items.filter(t=>t.disabled!==!0)}function id(e){return(e.items.find(n=>n.id===e.activeId)??Co(e)[0]??e.items[0])?.id??null}function sd(e,t,n,a){let r=new Set(a.items.map(o=>o.id));for(let o of[...n.keys()])r.has(o)||od(n,o);a.items.some(o=>(o.layers??[]).length>0)?e.setAttribute("data-layered","true"):e.removeAttribute("data-layered"),ce(e,a.items.map(o=>{n.has(o.id)||n.set(o.id,Jl(t));let i=n.get(o.id);return rd(t,i,o,a),i.row})),n.has(a.focusId)||(a.focusId=id(a)),C([...n.values()].map(o=>o.tab),n.get(a.focusId)?.tab??null)}function cd(e,t,n){let a=t.activeElement,r=n.holds(a),o=e.contains(a)?a:null,i=r?n.button():o,s=i?.closest(`.${Ce}-item`)?.querySelector('[role="tab"]')??null;return{node:i,inMenu:r,tabId:s?.getAttribute("data-ui-id")??null}}function ld(e,t,n,a,r){if(!r.node||r.inMenu&&a.open)return;if(e.contains(r.node)){se(e,r.node);return}let o=t.get(r.tabId)?.tab;o&&!o.disabled&&(n.focusId=r.tabId,C([...t.values()].map(i=>i.tab),o)),t.get(n.focusId)?.tab.focus()}function dd(e,t,n,a){let r=n.items.map(o=>t.get(o.id).tab.id);e.setAttribute("aria-label",a),e.setAttribute("aria-orientation","horizontal"),e.hidden=r.length===0,r.length?e.setAttribute("aria-owns",r.join(" ")):e.removeAttribute("aria-owns")}function ud(e,t,n,a,r){let o=e.target.closest?.('[role="tab"]');if(!o)return;let i=o.getAttribute("data-ui-id");if(a.key(e,i)){e.preventDefault();return}let s=Co(n),c=n.items.find(u=>u.id===i);if(e.key==="Delete"&&pa(c)){e.preventDefault(),r.onClose?.(i);return}if((e.key==="Enter"||e.key===" ")&&c?.disabled!==!0){e.preventDefault(),i!==n.activeId&&r.onSelect?.(i);return}let l=Q(e.key,s.findIndex(u=>u.id===i),s.length,{orientation:"horizontal",wrap:!0});l!==null&&(e.preventDefault(),n.focusId=s[l].id,C([...t.values()].map(u=>u.tab),t.get(n.focusId).tab),t.get(n.focusId).tab.focus(),n.activation==="auto"&&n.focusId!==n.activeId&&r.onSelect?.(n.focusId))}function fd(e,t,n,a){let r=u=>e.target.closest?.(u)??null,o=r("[data-ui-close]"),i=r("[data-ui-layer]"),s=r("[data-ui-fold]"),c=r('[role="tab"]'),l=c?.getAttribute("data-ui-id");o&&!o.hidden?a.onClose?.(o.getAttribute("data-ui-close")):i?a.onLayer?.(i.parentElement.getAttribute("data-ui-layers"),i.getAttribute("data-ui-layer")):s?n.press(s.getAttribute("data-ui-fold"),t.items):l&&!c.disabled&&l!==t.activeId&&a.onSelect?.(l)}function pd(e,t,n,a,r,o){let i=No(e,t,a,o);e.on(t,"click",s=>fd(s,a,r,o)),e.on(t,"keydown",s=>ud(s,n,a,i,o))}function md({icon:e}){if(!(e==null||e===""||typeof e=="object"||ea.includes(e)))throw new TypeError(typeof e=="string"?`The kit has no icon named ${e}`:"A tab's icon is a kit icon name or an element")}function hd(e){for(let t of D(e,"tab"))wo(t),md(t);return e}function gd(e,t={}){let n=b(e),a=Ql(t.face);v(n);let r=g(),o=d(n,"div",{className:Ce,attrs:{"data-face":a}}),i=d(n,"div",{className:Ee,attrs:{role:"tablist",hidden:!0}});e.append(i,o);let s=new Map,c={items:[],activeId:null,focusId:null,activation:"auto",closeLabel:"Close"},l=Io(e,s,t),u=Eo(o,s);return pd(r,o,s,c,l,t),{update(f={}){if(r.dead)return;c.items=hd(f.items??[]),c.activeId!==(f.activeId??null)&&(c.focusId=f.activeId??null),c.activeId=f.activeId??null,c.activation=f.activation==="manual"?"manual":"auto",c.closeLabel=String(f.closeLabel??"Close");let w=cd(o,n,l);sd(o,n,s,c),l.sync(c.items),ld(o,s,c,l,w),dd(i,s,c,String(f.label??"Tabs")),u.sync(c)},destroy(){if(r.destroy()){l.destroy();for(let f of s.values())f.badge?.destroy();s.clear(),o.remove(),i.remove()}}}}var et=8,Yt=4,bd=80;function vd(e){let t=typeof e?.getBoundingClientRect=="function"?e.getBoundingClientRect():e;if(!t||typeof t!="object")return null;let n=Number.isFinite(t.left)?t.left:t.x,a=Number.isFinite(t.top)?t.top:t.y,r=Number.isFinite(t.right)?t.right:n+t.width,o=Number.isFinite(t.bottom)?t.bottom:a+t.height;return![n,a,r,o].every(Number.isFinite)||r<=n||o<=a?null:{left:n,top:a,right:r,bottom:o}}function xd(e){return[e].flat().map(vd).filter(Boolean)}var yd=(e,t)=>e.left<t.right&&t.left<e.right&&e.top<t.bottom&&t.top<e.bottom,wd=(e,t,n)=>e.filter(a=>a.left<n&&t<a.right);function kd(e,{down:t,height:n,avoid:a}){return[...a].sort((o,i)=>t?o.top-i.top:i.bottom-o.bottom).reduce((o,i)=>(t?i.bottom>o&&i.top<o+n:i.top<o&&i.bottom>o-n)?t?i.bottom+Yt:i.top-Yt:o,e)}function Oo(e,{anchor:t,size:n,inner:a,avoid:r},o=!1){let i=Math.min(n.width,a.right-a.left),s=N(t.left,a.left,a.right-i),c=e==="bottom",l=c?t.bottom+Yt:t.top-Yt,u=o?kd(l,{down:c,height:n.height,avoid:wd(r,s,s+i)}):l,f=c?Math.max(u,a.top):Math.min(u,a.bottom),w=Math.max(0,c?a.bottom-f:f-a.top),S=Math.min(n.height,w),E=c?Math.min(f,a.bottom-S):f-S,Me={left:s,top:E,right:s+i,bottom:E+S};return{side:e,left:s,top:E,width:i,height:S,maxWidth:a.right-a.left,maxHeight:w,space:w,fits:n.height<=w,clear:!r.some(Fn=>yd(Me,Fn))}}var _o=e=>e.reduce((t,n)=>n.space>(t?.space??-1)?n:t,null),Ro=e=>e.find(t=>t.clear&&t.fits)??_o(e.filter(t=>t.clear&&t.space>=bd));function Ad({anchor:e,size:t,room:n,avoid:a=[],prefer:r="bottom"}){let o={left:n.left+et,top:n.top+et,right:n.left+n.width-et,bottom:n.top+n.height-et},i=r==="top"?["top","bottom"]:["bottom","top"],s={anchor:e,size:t,inner:o,avoid:a},c=i.map(u=>Oo(u,s)),l=a.length>0?i.map(u=>Oo(u,s,!0)):[];return Ro(c)??Ro(l)??c.find(u=>u.fits)??_o(c)}function zo(e,t,{avoid:n,prefer:a="bottom"}={}){let r=e.ownerDocument.defaultView;if(!r)return null;let o=Ve(r);e.style.maxWidth=`${Math.max(0,o.width-2*et)}px`,e.style.maxHeight=`${Math.max(0,o.height-2*et)}px`,e.style.left="0px",e.style.top="0px";let i=e.getBoundingClientRect(),s=t.getBoundingClientRect(),c=Ad({anchor:{left:s.left,top:s.top,right:s.right,bottom:s.bottom},size:{width:i.width,height:i.height},room:o,avoid:xd(n),prefer:a});return e.style.maxWidth=`${c.maxWidth}px`,e.style.maxHeight=`${c.maxHeight}px`,e.style.left=`${c.left-i.left}px`,e.style.top=`${c.top-i.top}px`,e.setAttribute("data-side",c.side),c}var Sd="cloudcanvas-ui-popover";function $d(e){return e.options.host??e.anchor.closest?.("dialog")??e.doc.body}function ma(e){let{options:t,state:n}=e;zo(e.root,e.anchor,{avoid:n.avoid??t.avoid,prefer:n.placement??t.placement})}function Zt(e,t,n=!0){let{doc:a,root:r,state:o}=e,i=r.contains(a.activeElement);o.opening?.destroy(),Object.assign(o,{open:!1,opening:null}),r.remove(),i&&e.anchor.focus({preventScroll:!0}),n&&e.options.onClose?.(t)}function Bo(e,t){t.key==="Escape"&&(t.preventDefault(),t.stopPropagation(),Zt(e,"escape"))}function Id(e,t,n){t&&(e.on(t,"resize",n),e.on(t,"scroll",n))}function Td(e){let{doc:t,root:n,anchor:a}=e,r=g(),o=()=>ma(e);r.on(t,"pointerdown",s=>{!n.contains(s.target)&&!a.contains(s.target)&&Zt(e,"outside")},{capture:!0}),r.on(n,"keydown",s=>Bo(e,s)),r.on(a,"keydown",s=>Bo(e,s));let i=t.defaultView;return i&&(r.on(i,"resize",o),r.on(t,"scroll",o,{capture:!0,passive:!0}),Id(r,i.visualViewport,o)),r}function Md(e){let{root:t,state:n}=e;$d(e).append(t),n.open=!0,n.opening=Td(e),ma(e),(ae(t)[0]??t).focus({preventScroll:!0})}function Nd(e,t){let n=String(t.label??"").trim();if(n==="")throw new TypeError("A popover needs a label");if(!t.content||typeof t.content!="object")throw new TypeError("A popover needs content");e.root.setAttribute("aria-label",n),(e.root.childNodes.length!==1||e.root.firstChild!==t.content)&&e.root.replaceChildren(t.content),e.state.avoid=t.avoid,e.state.placement=t.placement}function Ed(e,t={}){let n=b(e);v(n);let a=g(),r=d(n,"div",{className:Sd,attrs:{role:"dialog",tabindex:"-1"}}),o={doc:n,anchor:e,root:r,options:t,state:{open:!1,opening:null,avoid:void 0,placement:void 0}};return{update(i={}){if(!a.dead){if(!i.open){o.state.open&&Zt(o,"update");return}Nd(o,i),o.state.open?ma(o):Md(o)}},destroy(){a.destroy()&&o.state.open&&Zt(o,"update",!1)}}}var Dd="cloudcanvas-ui-splitter";function $t(e){let t=Number.isFinite(e.min)?N(e.min,0,100):0,n=Number.isFinite(e.max)?N(e.max,t,100):100,a=N(Number.isFinite(e.value)?e.value:50,t,n);return{min:t,max:n,value:a}}function Po(e,t){let{min:n,max:a,value:r}=$t(t),o=Number.isFinite(t.step)&&t.step>0?t.step:1,i=t.orientation!=="horizontal",s=i?"ArrowRight":"ArrowDown",c=i?"ArrowLeft":"ArrowUp",l={Home:n,End:a,PageUp:r-10,PageDown:r+10,[s]:r+o,[c]:r-o};return Object.hasOwn(l,e)?N(l[e],n,a):null}function Ld(e,t,n,a){let r=a.model.orientation!=="horizontal",o=n.getBoundingClientRect(),i=r?o.width:o.height;i>0&&(e.preventDefault(),t.setPointerCapture?.(e.pointerId),a.drag={id:e.pointerId,vertical:r,length:i,start:r?e.clientX:e.clientY,value:$t(a.model).value},t.classList.add("is-dragging"))}function Cd(e,t,n,a,r){e.on(t,"keydown",i=>{let s=Po(i.key,a.model);s!==null&&(i.preventDefault(),r?.(s))}),e.on(t,"pointerdown",i=>{i.button===0&&Ld(i,t,n,a)}),e.on(t,"pointermove",i=>{let s=a.drag;if(!s||i.pointerId!==s.id)return;let c=(s.vertical?i.clientX:i.clientY)-s.start,{min:l,max:u}=$t(a.model);r?.(N(Math.round(s.value+c/s.length*100),l,u))});let o=i=>{a.drag?.id===i.pointerId&&(a.drag=null,t.classList.remove("is-dragging"))};e.on(t,"pointerup",o),e.on(t,"pointercancel",o),e.on(t,"lostpointercapture",o)}function Od(e,{onChange:t}={}){let n=b(e);v(n);let a=g(),r=d(n,"div",{className:Dd,attrs:{role:"separator",tabindex:"0",[F]:!0}});e.append(r);let o={model:{value:50},drag:null};return Cd(a,r,e,o,t),{update(i={}){if(a.dead)return;o.model=i;let{min:s,max:c,value:l}=$t(i);r.setAttribute("aria-orientation",i.orientation==="horizontal"?"horizontal":"vertical"),r.setAttribute("aria-label",String(i.label??"Resize panes")),r.setAttribute("aria-valuemin",String(s)),r.setAttribute("aria-valuemax",String(c)),r.setAttribute("aria-valuenow",String(l)),i.controls?r.setAttribute("aria-controls",String(i.controls)):r.removeAttribute("aria-controls")},destroy(){a.destroy()&&(o.drag=null,r.remove())}}}var Oe="cloudcanvas-ui-results";function Rd(e,t){let n=d(e,"div",{className:`${Oe}-option`,attrs:{role:"option",[F]:!0}}),a=d(e,"span",{className:`${Oe}-label`}),r=d(e,"span",{className:`${Oe}-detail`});return n.append(a,r),n._uiText={label:x(e,a),detail:x(e,r),listId:t},n}function _d(e,t,n){e.id=`${e._uiText.listId}-${t.id}`,e.setAttribute("data-ui-id",t.id),e.setAttribute("aria-selected",String(t.id===n.highlightId)),e.classList.toggle("is-active",t.id===n.activeId),h(e._uiText.label,t.label),h(e._uiText.detail,t.detail??""),e._uiText.detail.parentNode.hidden=!t.detail}function ha(e,t,n,{focus:a}){let r=t.highlightId!==n;t.highlightId=n;let o=e.find(i=>i.getAttribute("data-ui-id")===n)??null;for(let i of e)i.setAttribute("aria-selected",String(i===o));t.input?(o?t.input.setAttribute("aria-activedescendant",o.id):t.input.removeAttribute("aria-activedescendant"),o?.scrollIntoView?.({block:"nearest"})):(C(e,o??e[0]??null),a&&o?.focus()),r&&t.onHighlight?.(n)}function Ho(e,t,n){let a=Array.from(t.children),r=a.findIndex(s=>s.getAttribute("data-ui-id")===n.highlightId);if((e.key==="Enter"||e.key===" "&&!n.input)&&n.highlightId){e.preventDefault(),n.onActivate?.(n.highlightId);return}if(e.key==="Escape"&&n.input&&n.highlightId){e.preventDefault(),ha(a,n,null,{focus:!1});return}if(!(n.input?["ArrowUp","ArrowDown"]:["ArrowUp","ArrowDown","Home","End"]).includes(e.key))return;let i=Q(e.key,r,a.length,{orientation:"vertical"});i!==null&&(e.preventDefault(),ha(a,n,a[i].getAttribute("data-ui-id"),{focus:!n.input}))}function zd(e,t,n,a,r){let o=U(n,r.items,{key:c=>c.id,create:()=>Rd(e,n.id),update:(c,l)=>_d(c,l,r)}),i=c=>r.items.some(l=>l.id===c),s=r.highlightId;i(s)||(s=r.activeId??null),i(s)||(s=r.input?null:r.items[0]?.id??null),ha(o,r,s,{focus:!1}),a.hidden=r.items.length>0||!r.emptyText,a.textContent=r.emptyText,t.classList.toggle("is-empty",r.items.length===0)}function ga(e,{onActivate:t,onHighlight:n}={}){let a=b(e);v(a);let r=g(),o=d(a,"div",{className:Oe}),i=d(a,"div",{className:`${Oe}-list`,attrs:{role:"listbox",id:M(Oe)}}),s=d(a,"p",{className:`${Oe}-empty`,attrs:{role:"status",hidden:!0}});o.append(i,s),e.append(o);let c={items:[],activeId:null,highlightId:null,emptyText:"",input:null,onActivate:t,onHighlight:n};return r.on(i,"click",l=>{let u=l.target.closest?.('[role="option"]');u&&t?.(u.getAttribute("data-ui-id"))}),r.on(i,"keydown",l=>{c.input||Ho(l,i,c)}),{update(l={}){r.dead||(c.items=D(l.items??[],"result"),c.activeId!==(l.activeId??null)&&(c.highlightId=l.activeId??null),c.activeId=l.activeId??null,c.emptyText=String(l.emptyText??""),i.setAttribute("aria-label",String(l.label??"Results")),zd(a,o,i,s,c),c.input?.setAttribute("aria-expanded",String(c.items.length>0)))},attachInput(l){if(r.dead)return()=>{};c.input=l,l.setAttribute("role","combobox"),l.setAttribute("aria-controls",i.id),l.setAttribute("aria-autocomplete","list"),l.setAttribute("aria-expanded",String(c.items.length>0));let u=f=>Ho(f,i,c);return l.addEventListener("keydown",u,{signal:r.signal}),()=>{l.removeEventListener("keydown",u);for(let f of["role","aria-controls","aria-autocomplete","aria-expanded","aria-activedescendant"])l.removeAttribute(f);c.input===l&&(c.input=null)}},destroy(){r.destroy()&&(c.input?.removeAttribute("aria-activedescendant"),c.input=null,o.remove())}}}var Qt="cloudcanvas-ui-status",ba=Object.freeze({idle:"",loading:"Loading",empty:"Nothing here yet",error:"Something went wrong",unavailable:"Unavailable",ready:""});function Bd(e,t,n){let a=d(e,"div",{className:Qt,attrs:{role:"status","aria-live":"polite"}}),r=d(e,"strong",{className:`${Qt}-label`}),o=d(e,"span",{className:`${Qt}-message`}),i=$(e,{className:`${Qt}-retry`,label:"Retry",signal:t.signal,onClick:()=>n.retry?.()});return a.append(r,o,i),{root:a,label:r,labelText:x(e,r),message:o,messageText:x(e,o),retry:i}}function Pd(e,t){let n=b(e);v(n);let{labels:a,retryLabel:r}=t??{},o=g(),i={retry:null},s=Bd(n,o,i);e.append(s.root);let c=l=>{let u=l.status??"idle";if(!Object.hasOwn(ba,u))throw new TypeError(`Unknown status: ${String(u)}`);let f=String(l.labels?.[u]??a?.[u]??ba[u]),w=String(l.message??"");s.root.setAttribute("data-status",u),s.root.setAttribute("aria-live",u==="error"?"assertive":"polite"),s.root.classList.toggle("is-quiet",f===""&&w===""),h(s.labelText,f),s.label.hidden=f==="",h(s.messageText,w),s.message.hidden=w==="";let S=(u==="error"||u==="unavailable")&&typeof l.retry=="function";i.retry=S?l.retry:null,s.retry.hidden=!S,h(s.retry.firstChild,l.retryLabel??r??"Retry")};return c({}),{update(l={}){o.dead||c(l)},destroy(){o.destroy()&&(i.retry=null,s.root.remove())}}}var It="cloudcanvas-ui-breadcrumbs";function Hd(e){let t=D(e.items??[],"breadcrumb");for(let n of t)if(String(n.label??"").trim()==="")throw new TypeError(`A breadcrumb needs a label: ${n.id}`);return t}function Ud(e){if(e.message)return[{kind:"message",key:"message",label:e.message}];if(e.items.length===0)return[];let t=e.items.map(n=>({kind:"crumb",key:`crumb:${n.id}`,id:n.id,label:n.label}));return e.complete||t.unshift({kind:"more",key:"more",label:e.moreLabel}),e.current&&t.push({kind:"current",key:"current",label:e.current}),t}function Fd(e,t,n){let a=d(e,"li",{className:`${It}-item`}),r=a;return t.kind==="more"?(a.append(d(e,"span",{text:"…",attrs:{"aria-hidden":"true"}})),r=d(e,"span",{className:Ee})):t.kind==="crumb"&&n?r=d(e,"button",{className:`${It}-open`,attrs:{type:"button","data-ui-id":t.id}}):t.kind==="current"&&a.setAttribute("aria-current","page"),r!==a&&a.append(r),a._uiText=x(e,r),a}function Kd(e,t,n){t.items=Hd(n),t.current=String(n.current??""),t.complete=n.complete!==!1,t.message=String(n.message??""),t.moreLabel=String(n.moreLabel??"Earlier levels are not shown"),e.setAttribute("aria-label",String(n.label??"Breadcrumb"))}function jd(e,{onOpen:t}={}){let n=b(e);v(n);let a=g(),r=typeof t=="function",o=d(n,"nav",{className:It,attrs:{hidden:!0}}),i=d(n,"ol",{className:`${It}-list`});o.append(i),e.append(o);let s={items:[],current:"",complete:!0,message:"",moreLabel:""};return r&&a.on(i,"click",c=>{let l=c.target.closest?.(`.${It}-open`);if(!l||!i.contains(l))return;let u=l.getAttribute("data-ui-id");t(u,s.items.find(f=>f.id===u))}),{update(c={}){if(a.dead)return;Kd(o,s,c);let l=Ud(s);o.hidden=l.length===0,U(i,l,{key:u=>u.key,create:u=>Fd(n,u,r),update:(u,f)=>h(u._uiText,f.label)})},destroy(){a.destroy()&&o.remove()}}}function ee(e,t){let n=String(t??"").trim().toLowerCase();return n===""||String(e).toLowerCase().includes(n)}function tt(e,t){t!==e.target&&(e.target?.classList.remove("is-drop-target"),t?.classList.add("is-drop-target"),e.target=t)}var we="cloudcanvas-ui-tree",Re='[role="treeitem"]',Gd=Object.freeze({noMatches:"Nothing matches “{query}”"});function qd(e){let t=new Set(e.map(a=>a.id)),n=new Map([[null,[]]]);for(let a of e){let r=a.parentId===null||a.parentId===void 0?null:String(a.parentId),o=r!==null&&r!==a.id&&t.has(r)?r:null;n.has(o)||n.set(o,[]),n.get(o).push(a)}return n}function Wd(e){let t=qd(e),n=new Set,a=r=>{for(let o of t.get(r)??[])n.add(o.id),a(o.id)};a(null);for(let r of e){if(n.has(r.id))continue;let o=t.get(String(r.parentId));o.splice(o.indexOf(r),1),t.get(null).push(r),n.add(r.id),a(r.id)}return t}function Vd(e,t){let n=[],a=(r,o)=>{let i=e.get(r)??[];i.forEach((s,c)=>{let l=(e.get(s.id)??[]).length>0,u=l&&t.has(s.id);n.push({id:s.id,item:s,parentId:r,level:o,position:c+1,size:i.length,hasChildren:l,expanded:u}),u&&a(s.id,o+1)})};return a(null,1),n}function Xd(e,t){let n=new Map;for(let[r,o]of t)for(let i of o)n.set(i.id,r);let a=new Set(e.rows.map(r=>r.id));for(let r=e.focusId;r!=null;r=n.get(r)??null)if(a.has(r))return r;return a.has(e.selectedId)?e.selectedId:e.rows[0]?.id??null}var Yd=e=>e.trim()!=="";function Zd(e){let t=d(e,"button",{className:`${we}-row`,attrs:{type:"button",role:"treeitem",tabindex:"-1"}}),n=d(e,"span",{className:`${we}-label`}),a=d(e,"span",{className:`${we}-count`});return t.append(d(e,"span",{className:`${we}-indent`,attrs:{"aria-hidden":"true"}}),d(e,"span",{className:`${we}-twisty`,attrs:{"aria-hidden":"true"}}),n,a),t._uiText={label:x(e,n),count:x(e,a)},t._uiLabel=n,t._uiBadge=null,t}function Qd(e,t){let n=e._uiBadge;e._uiBadge=jt(n,e,t),e._uiBadge&&!n&&e.insertBefore(e.lastChild,e._uiText.count.parentNode)}function Jd(e,t,n){let{item:a}=t,r=a.count!==void 0&&a.count!==null;e.setAttribute("data-ui-id",t.id),e.setAttribute("aria-level",String(t.level)),e.setAttribute("aria-posinset",String(t.position)),e.setAttribute("aria-setsize",String(t.size)),n.selectedId===null?e.removeAttribute("aria-selected"):e.setAttribute("aria-selected",String(t.id===n.selectedId)),t.hasChildren?e.setAttribute("aria-expanded",String(t.expanded)):e.removeAttribute("aria-expanded"),a.tone?e.setAttribute("data-tone",String(a.tone)):e.removeAttribute("data-tone"),e.style.setProperty("--tree-level",String(t.level-1)),e.classList.toggle("is-unmatched",!n.nothingMatches&&!ee(a.label??t.id,n.query)),h(e._uiText.label,a.label??t.id),h(e._uiText.count,r?a.count:""),e._uiText.count.parentNode.hidden=!r,Qd(e,a.badge)}function Uo(e,t=null){for(let n of e)t!==null&&n.parentNode===t||(n._uiBadge?.destroy(),n._uiBadge=null)}var eu=e=>e._uiLabel.scrollWidth>e._uiLabel.clientWidth;function Fo(e){let t=Array.from(e.querySelectorAll(Re)),n=t.map(eu);t.forEach((a,r)=>{n[r]?a.setAttribute("title",a._uiLabel.textContent):a.removeAttribute("title")})}function tu(e){let t=e.doc.defaultView?.ResizeObserver;if(typeof t!="function")return;let n=new t(()=>{e.life.dead||Fo(e.root)});n.observe(e.root),e.life.add(()=>n.disconnect())}function va(e,t,{focus:n}){let a=Array.from(e.root.querySelectorAll(Re)),r=a.find(o=>o.getAttribute("data-ui-id")===t)??null;e.state.focusId=t,C(a,r),n&&r?.focus()}function nu(e){let{doc:t,root:n,state:a}=e,r=n.contains(t.activeElement),o=Array.from(n.querySelectorAll(Re));U(n,a.rows,{key:i=>i.id,create:()=>Zd(t),update:(i,s)=>Jd(i,s,a)}),Uo(o,n),va(e,a.focusId,{focus:r&&!n.contains(t.activeElement)}),Fo(n)}function au(e,t,n){let a=n[t];if(e==="Enter")return{activate:a.id};if(e==="ArrowRight")return a.hasChildren?a.expanded?{focus:n[t+1].id}:{toggle:a.id,expanded:!0}:null;if(e==="ArrowLeft")return a.expanded?{toggle:a.id,expanded:!1}:a.parentId===null?null:{focus:a.parentId};let r=Q(e,t,n.length,{orientation:"vertical"});return r===null?null:{focus:n[r].id}}function ru(e){let{root:t,state:n,callbacks:a}=e,r=o=>{let i=o.target.closest?.(Re);return i&&t.contains(i)?n.rows.findIndex(c=>c.id===i.getAttribute("data-ui-id")):-1};e.life.on(t,"keydown",o=>{let i=r(o),s=i<0?null:au(o.key,i,n.rows);s&&(o.preventDefault(),s.focus!==void 0?va(e,s.focus,{focus:!0}):s.toggle!==void 0?a.onToggle?.(s.toggle,s.expanded):a.onActivate?.(s.activate))}),e.life.on(t,"click",o=>{let i=n.rows[r(o)];i&&(va(e,i.id,{focus:!1}),i.hasChildren&&o.target.closest?.(`.${we}-twisty`)?a.onToggle?.(i.id,!i.expanded):a.onActivate?.(i.id))})}function ou(e){let{root:t,doc:n,callbacks:a}=e,r=null;t.setAttribute("data-movable",""),L(e.life,t,{selector:Re,onStart(o){r={id:o.getAttribute("data-ui-id"),row:o,target:null},o.classList.add("is-dragging")},onMove(o){if(!r)return;let i=n.elementFromPoint?.(o.x,o.y)?.closest?.(Re)??null;tt(r,i&&t.contains(i)&&i!==r.row?i:null)},onEnd(o){if(!r)return;let{id:i,row:s,target:c}=r;tt(r,null),r=null,s.classList.remove("is-dragging"),o&&c&&a.onMove(i,c.getAttribute("data-ui-id"))}})}function iu(e,t={}){let n=b(e);v(n);let a=g(),r=d(n,"div",{className:we,attrs:{role:"tree",[F]:!0}});e.append(r);let o=d(n,"p",{className:`${we}-status`,attrs:{"aria-live":"polite"}});e.append(o);let i={...Gd,...t.labels},s={doc:n,root:r,life:a,callbacks:t,state:{rows:[],focusId:null,selectedId:null,query:"",nothingMatches:!1}},c=x(n,o);return ru(s),tu(s),typeof t.onMove=="function"&&ou(s),{update(l={}){if(a.dead)return;let u=Wd(D(l.items??[],"tree")),f=l.selectedId??null;f!==null&&f!==s.state.selectedId&&(s.state.focusId=f),s.state.selectedId=f,s.state.query=String(l.query??""),s.state.nothingMatches=Yd(s.state.query)&&!(l.items??[]).some(w=>ee(w.label??w.id,s.state.query)),h(c,s.state.nothingMatches?i.noMatches.replace("{query}",s.state.query.trim()):""),s.state.rows=Vd(u,new Set((l.expanded??[]).map(String))),s.state.focusId=Xd(s.state,u),r.setAttribute("aria-label",String(l.label??"Tree")),nu(s)},destroy(){a.destroy()&&(Uo(Array.from(r.querySelectorAll(Re))),r.remove(),o.remove())}}}var Jt="cloudcanvas-ui-progress";function Ko(e){if(e==null||e==="")return null;let t=Number(e);return Number.isFinite(t)?t:null}function su(e){let t=Ko(e.max),n=t!==null&&t>0?t:1,a=Ko(e.value);return{max:n,value:a===null?null:N(a,0,n)}}function cu(e){let t=b(e);v(t);let n=g(),a=d(t,"div",{className:Jt}),r=d(t,"span",{className:`${Jt}-label`,attrs:{id:M(Jt)}}),o=x(t,r),i=d(t,"progress",{className:`${Jt}-bar`,attrs:{"aria-labelledby":r.id}});return a.append(r,i),e.append(a),{update(s={}){if(n.dead)return;let c=String(s.label??"").trim();if(c==="")throw new TypeError("A progress bar needs a label");let{max:l,value:u}=su(s);h(o,c),i.setAttribute("max",String(l)),u===null?i.removeAttribute("value"):i.setAttribute("value",String(u))},destroy(){n.destroy()&&a.remove()}}}var lu=new Set(["success","warning","danger","muted"]);function en(e,t){let n=d(e,"span",{className:t,attrs:{id:M(t),role:"status","aria-live":"polite","aria-atomic":"true"}});return{node:n,text:x(e,n)}}function tn(e,t){let n=String(t?.text??"").trim(),a=lu.has(t?.tone)?t.tone:"muted";return n===""?e.node.removeAttribute("data-tone"):e.node.setAttribute("data-tone",a),e.node.setAttribute("aria-live",a==="danger"&&n!==""?"assertive":"polite"),h(e.text,n),n!==""}var ke="cloudcanvas-ui-switch";function du(e){let t=d(e,"label",{className:ke}),n=d(e,"span",{className:`${ke}-text`}),a=d(e,"span",{className:`${ke}-label`,attrs:{id:M(ke)}}),r=en(e,`${ke}-status`),o=d(e,"span",{className:`${ke}-detail`,attrs:{id:M(`${ke}-detail`)}}),i=d(e,"input",{className:`${ke}-box`,attrs:{type:"checkbox",role:"switch"}});return n.append(a,r.node,o),t.append(n,i),{root:t,box:i,words:a,status:r,detail:o,texts:{words:x(e,a),detail:x(e,o)}}}function uu(e,t,n){let a=[t.detail?e.detail.id:null,n?e.status.node.id:null].filter(Boolean);a.length>0?e.box.setAttribute("aria-describedby",a.join(" ")):e.box.removeAttribute("aria-describedby")}function fu(e,{onChange:t}={}){let n=b(e);v(n);let a=g(),r=du(n),{root:o,box:i}=r;e.append(o);let s=!1;return a.on(i,"change",()=>{let c=!!i.checked;i.checked=s,!a.dead&&!i.disabled&&t?.(c)}),{update(c={}){if(a.dead)return;let l=String(c.label??"").trim();if(l==="")throw new TypeError("A switch needs a label");s=!!c.checked,h(r.texts.words,l),h(r.texts.detail,String(c.detail??"")),r.detail.hidden=!c.detail,i.checked=s,i.disabled=!!c.disabled,i.setAttribute("aria-labelledby",r.words.id),i.setAttribute("aria-checked",String(s)),uu(r,c,tn(r.status,c.status))},destroy(){a.destroy()&&o.remove()}}}var _e="cloudcanvas-ui-select";function pu(e){let t=d(e,"div",{className:_e}),n=d(e,"select",{className:`${xt} ${_e}-control`,attrs:{id:M(_e)}}),a=d(e,"label",{className:`${_e}-label`,attrs:{for:n.id}}),r=d(e,"p",{className:`${_e}-hint`,attrs:{id:M(`${_e}-hint`),hidden:!0}}),o=en(e,`${_e}-status`);return t.append(a,n,r,o.node),{root:t,control:n,label:a,hint:r,status:o,texts:{label:x(e,a),hint:x(e,r)}}}function mu(e){if(!Array.isArray(e))throw new TypeError("A select needs options");let t=new Set;for(let n of e){let a=String(n?.value);if(n?.value===void 0||n?.value===null||t.has(a))throw new TypeError(`Missing or duplicate select value: ${a}`);t.add(a)}return e}function hu(e,t){return t.map(n=>{let a=d(e,"option",{text:n.label??n.value});return a.value=String(n.value),a.disabled=n.disabled===!0,a})}function gu(e,t,n){let a=JSON.stringify(n.map(r=>[String(r.value),String(r.label??r.value),r.disabled===!0]));a!==t.signature&&(t.control.replaceChildren(...hu(e,n)),t.signature=a),t.values=new Map(n.map(r=>[String(r.value),r.value]))}function bu(e,t,n){let a=[t?e.hint.id:null,n?e.status.node.id:null].filter(Boolean);a.length>0?e.control.setAttribute("aria-describedby",a.join(" ")):e.control.removeAttribute("aria-describedby")}function vu(e,t){let n=String(t.hint??"").trim();h(e.texts.hint,n),e.hint.hidden=n==="",bu(e,n!=="",tn(e.status,t.status)),t.invalid===!0?(e.control.setAttribute("aria-invalid","true"),e.root.setAttribute("data-invalid","true")):(e.control.removeAttribute("aria-invalid"),e.root.removeAttribute("data-invalid"))}function xu(e,{onChange:t}={}){let n=b(e);v(n);let a=g(),r=pu(n),{root:o,control:i}=r,s={control:i,signature:null,values:new Map,shown:""};return e.append(o),a.on(i,"change",()=>{let c=i.value;i.value=s.shown,!a.dead&&!i.disabled&&t?.(s.values.has(c)?s.values.get(c):c)}),{update(c={}){if(a.dead)return;let l=String(c.label??"").trim();if(l==="")throw new TypeError("A select needs a label");gu(n,s,mu(c.options)),h(r.texts.label,l),s.shown=String(c.value??""),i.value=s.shown,i.disabled=!!c.disabled,vu(r,c)},destroy(){a.destroy()&&o.remove()}}}var ze="cloudcanvas-ui-chips",yu=`.${ze}-chip`,nn=`.${ze}-toggle`;function wu(e,{toggles:t,removes:n}){let a=d(e,"span",{className:`${ze}-chip`}),r=t?d(e,"button",{className:`${ze}-toggle`,attrs:{type:"button"}}):d(e,"span",{className:`${ze}-label`}),o=n?d(e,"button",{className:`${ze}-remove`,text:"×",attrs:{type:"button"}}):null;return a.append(r),o&&a.append(o),a._uiChip={face:r,text:x(e,r),remove:o},a}function ku(e,t,n){let{face:a,text:r,remove:o}=e._uiChip,i=String(t.label??t.id);h(r,i),t.tone?e.setAttribute("data-tone",String(t.tone)):e.removeAttribute("data-tone"),n.toggles&&(a.setAttribute("data-ui-id",t.id),a.setAttribute("aria-pressed",String(n.single?t.id===n.state.value:t.pressed===!0))),o&&(o.setAttribute("data-ui-remove",t.id),o.setAttribute("aria-label",`${n.state.removeLabel} ${i}`),o.hidden=t.removable!==!0)}function Au(e){let{doc:t,root:n,state:a}=e,r=t.activeElement,o=r?.closest?.(yu)??null,i=o&&n.contains(o)?Array.from(n.children).indexOf(o):-1,s=U(n,a.items,{key:c=>c.id,create:()=>wu(t,e),update:(c,l)=>ku(c,l,e)});if(i>=0&&!n.contains(t.activeElement)){let c=s.includes(o)?o:s[Math.min(i,s.length-1)],l=c?ae(c):[];(l.includes(r)?r:l[0])?.focus()}Su(e)}function xa(e){return[...e.root.querySelectorAll(nn)]}function Su(e){if(!e.single||!e.toggles)return;let t=xa(e),n=t.find(r=>r===e.doc.activeElement),a=t.find(r=>r.getAttribute("aria-pressed")==="true");t.length>0&&C(t,n??a??t[0])}function $u(e){let{root:t,life:n}=e;n.on(t,"keydown",a=>{let r=a.target.closest?.(nn);if(!r||!t.contains(r)||a.altKey||a.ctrlKey||a.metaKey)return;let o=xa(e),i=Q(a.key,o.indexOf(r),o.length,{orientation:"both",wrap:!0});i!==null&&(a.preventDefault(),C(o,o[i]),o[i].focus())}),n.on(t,"focusin",a=>{let r=a.target.closest?.(nn);r&&t.contains(r)&&C(xa(e),r)})}function Iu(e,{onToggle:t,onRemove:n,onChange:a}){let{root:r,state:o}=e;e.life.on(r,"click",i=>{let s=i.target.closest?.("[data-ui-remove]");if(s&&r.contains(s)){s.hidden||n(s.getAttribute("data-ui-remove"));return}let c=i.target.closest?.(nn);if(!c||!r.contains(c))return;let l=c.getAttribute("data-ui-id");e.single?l!==o.value&&a(l):t(l,o.items.find(u=>u.id===l)?.pressed!==!0)}),e.single&&$u(e)}function Tu(e,t={}){let n=b(e);v(n);let a=g(),r=d(n,"div",{className:ze,attrs:{role:"group"}});e.append(r);let o=t.single===!0,i={doc:n,root:r,life:a,single:o,toggles:typeof(o?t.onChange:t.onToggle)=="function",removes:!o&&typeof t.onRemove=="function",state:{items:[],removeLabel:"Remove",value:null}};return Iu(i,t),{update(s={}){a.dead||(i.state.items=D(s.items??[],"chip"),i.state.removeLabel=String(s.removeLabel??"Remove"),i.state.value=s.value??null,r.setAttribute("aria-label",String(s.label??"Chips")),Au(i))},destroy(){a.destroy()&&r.remove()}}}var Be="cloudcanvas-ui-navbar";function Mu(e,t){let n=d(e,"li",{className:`${Be}-item`}),a=d(e,"button",{className:`${Be}-link`,attrs:{type:"button","data-ui-id":t}}),r=ve(e,`${Be}-icon`),o=d(e,"span",{className:`${Be}-label`});return a.append(r,o),n.append(a),{node:n,link:a,slot:r,text:x(e,o),badge:Gt(a)}}function Nu(e,t,n){let{doc:a,list:r,entries:o}=e,i=new Set(t.map(c=>c.id));for(let[c,l]of o)i.has(c)||(l.badge.destroy(),o.delete(c));let s=a.activeElement;ce(r,t.map(c=>{o.has(c.id)||o.set(c.id,Mu(a,c.id));let l=o.get(c.id);return h(l.text,c.label??c.id),xe(l.slot,c.icon),c.title?l.link.setAttribute("title",String(c.title)):l.link.removeAttribute("title"),c.id===n?l.link.setAttribute("aria-current","page"):l.link.removeAttribute("aria-current"),l.badge.update(Qn(c.badge)),l.node})),se(r,s)}function Eu(e,{onSelect:t}={}){let n=b(e);v(n);let a=g(),r=d(n,"nav",{className:Be}),o=d(n,"ul",{className:`${Be}-list`,attrs:{role:"list"}});r.append(o),e.append(r);let i={doc:n,list:o,entries:new Map};return a.on(o,"click",s=>{let c=s.target.closest?.(`.${Be}-link`);c&&o.contains(c)&&t?.(c.getAttribute("data-ui-id"))}),a.add(()=>{for(let s of i.entries.values())s.badge.destroy()}),{update(s={}){if(a.dead)return;let c=D(s.items??[],"navbar");r.setAttribute("aria-label",String(s.label??"Navigation")),r.setAttribute("data-placement",s.placement==="bottom"?"bottom":"top"),Nu(i,c,s.activeId??null)},destroy(){a.destroy()&&r.remove()}}}var Tt="cloudcanvas-ui-empty",Du=new Set(["empty","error","locked","loading"]);function Lu(e){if(e.kind===void 0||e.kind===null)return null;if(!Du.has(e.kind))throw new TypeError(`Unknown empty-state kind: ${String(e.kind)}`);return e.kind}function ya(e,t,n){let a=String(n??"").trim();return h(t,a),e.hidden=a==="",a!==""}function Cu(e,{onAction:t}={}){let n=b(e);v(n);let a=g(),r=typeof t=="function",o=d(n,"div",{className:Tt}),i=ve(n,`${Tt}-icon`),s=d(n,"p",{className:`${Tt}-title`,attrs:{hidden:!0}}),c=d(n,"p",{className:`${Tt}-body`,attrs:{hidden:!0}}),l=$(n,{className:`${Tt}-action`,label:"",signal:a.signal,onClick:()=>t?.(),attrs:{hidden:!0}}),u={title:x(n,s),body:x(n,c)};return o.append(i,s,c,l),e.append(o),{update(f={}){if(a.dead)return;let w=Lu(f);xe(i,w??void 0),w?o.setAttribute("data-kind",w):o.removeAttribute("data-kind"),w==="loading"?o.setAttribute("aria-busy","true"):o.removeAttribute("aria-busy"),ya(s,u.title,f.title),ya(c,u.body,f.body);let S=ya(l,l.firstChild,f.actionLabel);l.hidden=!(r&&S)},destroy(){a.destroy()&&o.remove()}}}var Ou="cloudcanvas-ui-combobox";function Ru(e,{onPick:t}={}){let n=b(e);v(n);let a=g(),r=d(n,"div",{className:Ou,attrs:{hidden:!0}});e.after(r);let o={options:[]},i=ga(r,{onActivate:c=>t?.(c,o.options.find(l=>l.id===c))}),s=i.attachInput(e);return a.on(r,"mousedown",c=>c.preventDefault()),a.add(()=>{s(),i.destroy(),r.remove()}),{update(c={}){if(a.dead)return;let l=c.open===!0?c.options??[]:[];i.update({label:c.label??"Suggestions",items:l}),o.options=l,r.hidden=l.length===0},destroy(){a.destroy()}}}var Mt="cloudcanvas-ui-toast",_u=new Set(["info","success","warning","danger"]),zu=1500,Bu=2,wa=new WeakMap;function Pu(e,t,n){let a=wa.get(e)??new Map;wa.set(e,a);let r=a.get(n)??{node:d(e,"section",{className:`${Mt}s`,attrs:{"aria-label":n}}),holders:0,count:0};return a.set(n,r),r.holders+=1,r.node.isConnected||t.append(r.node),r}function Hu(e,t,n){n.holders-=1,!(n.holders>0)&&(n.node.remove(),wa.get(e).delete(t))}function Uu(e,t,n,a,r){let o=d(e,"div",{className:Mt,attrs:{role:n.tone==="danger"?"alert":"status","data-tone":n.tone,"data-ui-id":n.id}});o.append(d(e,"span",{className:`${Mt}-message`,text:n.message}));for(let i of n.actions)o.append($(e,{className:`${Mt}-action`,label:i.label,signal:t.signal,attrs:{"data-ui-action":i.id},onClick:()=>r.take(n.id,i)}));return o.append($(e,{className:`${Mt}-dismiss`,label:"×",ariaLabel:a.dismiss,signal:t.signal,onClick:()=>r.close(n.id,"dismiss")})),o}function Fu(e){if(typeof e.run!="function"||!String(e.label??"").trim())throw new TypeError("A toast action needs a label and a run function");return[{id:null,label:String(e.label),run:e.run}]}function Ku(e,t,n){if(e.action&&e.actions)throw new TypeError("A toast takes action or actions, not both");if(e.action)return Fu(e.action);let a=D(e.actions??[],"toast action");if(a.length>Bu)throw new TypeError("A toast takes at most two actions");return a.map(r=>{if(!String(r.label??"").trim())throw new TypeError(`The toast action ${r.id} needs a label`);return{id:r.id,label:String(r.label),run:()=>n?.(t,r.id)}})}function ju(e,t,n,a){let r=String(e?.message??"").trim();if(r==="")throw new TypeError("A toast needs a message");let o=_u.has(e.tone)?e.tone:"info",i=Number.isFinite(e.timeout)&&e.timeout>=0?e.timeout:n;return{id:t,message:r,tone:o,actions:Ku(e,t,a),timeout:i}}function jo(e,t,n){if(t.cancel?.(),t.cancel=null,t.timeout===0||t.paused)return;let a=Math.max(t.remaining??t.timeout,t.remaining===void 0?0:zu);t.deadline=Date.now()+a,t.cancel=e.later(()=>n(t.id,"timeout"),a)}function Gu(e,t,n,a){let r=()=>{n.paused||(n.paused=!0,n.deadline&&(n.remaining=Math.max(0,n.deadline-Date.now())),n.cancel?.(),n.cancel=null)},o=()=>{!n.paused||t.matches(":hover")||t.contains(t.ownerDocument.activeElement)||(n.paused=!1,jo(e,n,a))};e.on(t,"pointerenter",r),e.on(t,"focusin",r),e.on(t,"pointerleave",o),e.on(t,"focusout",()=>queueMicrotask(o)),e.on(t,"keydown",i=>{i.key==="Escape"&&(i.preventDefault(),a(n.id,"escape"))})}function qu(e,{max:t=3,timeout:n=6e3,labels:a={},onAction:r,onClose:o}={}){let i=b(e);v(i);let s=g(),c={region:a.region??"Notifications",dismiss:a.dismiss??"Dismiss"},l=Pu(i,e,c.region),u=new Map,f=(S,E="api")=>{let Me=u.get(S);return Me?(Me.cancel?.(),u.delete(S),Me.node.remove(),o?.(S,E),!0):!1},w=(S,E)=>{if(u.has(S))try{E.run()}finally{f(S,"action")}};return{show(S){if(s.dead)return null;let E=ju(S,`toast-${l.count+1}`,n,r);for(l.count+=1,E.node=Uu(i,s,E,c,{close:f,take:w}),u.set(E.id,E),l.node.isConnected||e.append(l.node),l.node.append(E.node),Gu(s,E.node,E,f),jo(s,E,f);u.size>Math.max(1,t);)f(u.keys().next().value,"max");return E.id},dismiss:S=>f(S,"api"),clear(){for(let S of[...u.keys()])f(S,"clear")},destroy(){if(s.destroy()){for(let S of u.values())S.node.remove();u.clear(),Hu(i,c.region,l)}}}}var ka=16e3,Go=Object.freeze({listening:"Listening. Stop when you are done.",denied:"Voice input is unavailable or was denied. You can still type.",failed:"Voice input could not start. You can still type."});function Nt(e){let t=e.device;if(e.device=null,e.sequence+=1,!!t){t.onresult=null,t.onerror=null,t.onend=null;try{t.abort()}catch{}}}function Wu(e,t,n){let a=()=>!e.dead&&n===e.sequence&&!e.disabled;t.continuous=!1,t.interimResults=!0,t.maxAlternatives=1,t.onresult=r=>{a()&&(e.text=Array.from(r.results).map(o=>o[0]?.transcript??"").join(" ").slice(0,16e3),e.emit())},t.onend=()=>{a()&&(e.listening=!1,e.emit(),e.onEnd?.())},t.onerror=()=>{a()&&(Nt(e),e.listening=!1,e.message=e.messages.denied,e.emit())}}function Vu(e,t){if(!t||e.dead||e.disabled||e.listening||!e.createRecognition)return;Nt(e);let n=e.sequence;e.text="",e.message=e.messages.listening,e.listening=!0;try{let a=e.createRecognition();e.device=a,Wu(e,a,n),a.start()}catch{Nt(e),e.listening=!1,e.message=e.messages.failed}e.emit()}function Xu(e,{contextKey:t,disabled:n=!1}={},a){if(e.dead)return;let r=t!==e.contextKey||n&&!e.disabled;e.contextKey=t,e.disabled=n,r?a():e.emit()}function Aa({createRecognition:e,onApply:t,onEnd:n,messages:a={}}={}){let r=new Set,o={createRecognition:e,onEnd:n,device:null,sequence:0,dead:!1,disabled:!1,listening:!1,text:"",message:"",messages:{...Go,...a}},i=()=>({supported:!!e,listening:o.listening,text:o.text,message:o.message,disabled:o.disabled});o.emit=()=>{if(!o.dead)for(let c of r)c(i())};let s=()=>{Nt(o),o.listening=!1,o.text="",o.message="",o.emit()};return{get state(){return i()},start:c=>Vu(o,c),stop(){try{o.device?.stop()}catch{s()}},edit(c){o.dead||o.disabled||o.listening||(o.text=String(c).slice(0,16e3),o.emit())},apply(){if(o.dead||o.disabled||o.listening||!o.text.trim())return;let c=o.text.trim();s(),t?.(c)},update:c=>Xu(o,c,s),cancel:s,subscribe(c){return r.add(c),c(i()),()=>r.delete(c)},destroy(){o.dead||(o.dead=!0,Nt(o),o.text="",r.clear())}}}var te="cloudcanvas-ui-voice",Wo=Object.freeze({voice:"Voice",stop:"Stop",allow:"Allow and start",decline:"Not now",add:"Add",discard:"Discard",preview:"Voice draft",consent:"Voice uses your browser’s speech service, which may process audio online. Nothing is sent or saved until you choose to."});function Yu(e,t){let n=d(e,"div",{className:te}),a=$(e,{className:`${te}-mic`,label:t.voice,attrs:{"aria-pressed":"false"}}),r=d(e,"div",{className:`${te}-consent`,attrs:{hidden:!0}}),o=d(e,"p",{className:`${te}-consent-text`,text:t.consent}),i=$(e,{className:`${te}-allow is-primary`,label:t.allow}),s=$(e,{className:`${te}-decline`,label:t.decline});r.append(o,i,s);let c=d(e,"p",{className:`${te}-status`,attrs:{role:"status"}}),l=x(e,c),u=d(e,"div",{className:`${te}-review`,attrs:{hidden:!0}}),f=De(e,{type:"textarea",label:t.preview,className:`${te}-preview`});f.maxLength=16e3;let w=$(e,{className:`${te}-add is-primary`,label:t.add}),S=$(e,{className:`${te}-discard`,label:t.discard});return u.append(f,w,S),n.append(a,r,c,u),{root:n,mic:a,consent:r,allow:i,decline:s,statusText:l,review:u,preview:f,add:w,discard:S}}function qo(e,t,n,a){e.root.hidden=!t.supported,e.mic.disabled=t.disabled,e.mic.setAttribute("aria-pressed",String(t.listening)),h(e.mic.firstChild,t.listening?n.stop:n.voice),e.root.classList.toggle("is-listening",t.listening),e.consent.hidden=!a.asking||t.listening||t.disabled;let r=a.review&&!t.listening&&t.text.trim()!=="";e.review.hidden=!r,e.preview.value!==t.text&&(e.preview.value=t.text),e.add.disabled=t.disabled||!r,h(e.statusText,t.message)}function Zu(e,t,n,a){e.on(t.mic,"click",()=>{if(n.state.listening){n.stop();return}if(a.consented){n.start(!0);return}a.asking=!0,a.rerender(),t.allow.focus()}),e.on(t.allow,"click",()=>{a.consented=!0,a.asking=!1,n.start(!0),t.mic.focus()}),e.on(t.decline,"click",()=>{a.asking=!1,a.rerender(),t.mic.focus()}),e.on(t.preview,"input",()=>n.edit(t.preview.value)),e.on(t.add,"click",()=>n.apply()),e.on(t.discard,"click",()=>n.cancel())}function Qu(e,t){if(t)return t;let n=e.defaultView??globalThis,a=n.SpeechRecognition??n.webkitSpeechRecognition;return a?()=>new a:void 0}function Sa(e,{onApply:t,createRecognition:n,review:a=!1,labels:r={},messages:o}={}){let i=b(e);v(i);let s=g(),c={...Wo,...r},l=Yu(i,c);e.append(l.root);let u={review:a,consented:!1,asking:!1,contextKey:void 0,disabled:!1,rerender:null},f=Aa({onApply:t,messages:o,createRecognition:Qu(i,n),onEnd:()=>{u.review||f.apply()}});u.rerender=()=>qo(l,f.state,c,u),s.add(f.subscribe(S=>qo(l,S,c,u))),s.add(()=>f.destroy()),Zu(s,l,f,u);let w=i.defaultView;return w?.addEventListener&&s.on(w,"offline",()=>f.cancel()),s.on(i,"visibilitychange",()=>{i.hidden&&f.cancel()}),{update(S={}){if(s.dead)return;let E=S.disabled===!0;(S.contextKey!==u.contextKey||E&&!u.disabled)&&(u.consented=!1,u.asking=!1),u.contextKey=S.contextKey,u.disabled=E,f.update({contextKey:S.contextKey,disabled:E})},cancel(){s.dead||f.cancel()},destroy(){s.destroy()&&l.root.remove()}}}var nt="cloudcanvas-ui-composer";function Ju(e,t){let n=d(e,"div",{className:nt}),a=De(e,{type:"textarea",label:"Compose",className:`${nt}-input`});a.maxLength=t;let r=d(e,"div",{className:`${nt}-actions`}),o=d(e,"div",{className:`${nt}-voice`}),i=$(e,{className:`${nt}-cancel`,label:"Cancel"}),s=$(e,{className:`${nt}-submit is-primary`,label:"Send"});return r.append(o,i,s),n.append(a,r),{root:n,field:a,voiceSlot:o,cancel:i,submit:s}}function Pe(e,t){let n=t.disabled||t.pending||t.inFlight;e.field.disabled=t.disabled,e.field.readOnly=t.pending||t.inFlight,e.submit.disabled=n||e.field.value.trim()==="",e.cancel.disabled=n,e.root.classList.toggle("is-pending",t.pending||t.inFlight),t.voice?.update({contextKey:t.contextKey,disabled:n})}function an(e,t,n,a){t.inFlight=!1,a.ok&&a.value!==!1?n.clear():Pe(e,t),a.ok||(t.onError??globalThis.reportError??console.error)(a.error)}function Vo(e,t,n){let a=e.field.value.trim();if(a===""||t.disabled||t.pending||t.inFlight||t.composing)return;let r;try{r=t.onSubmit?.(a)}catch(o){an(e,t,n,{ok:!1,error:o});return}if(typeof r?.then!="function"){an(e,t,n,{ok:!0,value:r});return}t.inFlight=!0,Pe(e,t),r.then(o=>{t.life.dead||an(e,t,n,{ok:!0,value:o})},o=>{t.life.dead||an(e,t,n,{ok:!1,error:o})})}function ef(e,t,n,a){e.on(t.field,"input",()=>{Pe(t,n),n.onChange?.(t.field.value)}),e.on(t.field,"compositionstart",()=>{n.composing=!0}),e.on(t.field,"compositionend",()=>{n.composing=!1}),e.on(t.field,"keydown",r=>{r.key!=="Enter"||!(r.ctrlKey||r.metaKey)||r.isComposing||(r.preventDefault(),Vo(t,n,a))}),e.on(t.submit,"click",()=>Vo(t,n,a)),e.on(t.cancel,"click",()=>{n.disabled||n.pending||n.inFlight||(a.clear(),n.onCancel?.())})}function tf(e,t,n){if(!n)return null;let a=n===!0?{}:n;return Sa(e.voiceSlot,{...a,onApply:r=>{if(t.life.dead||t.disabled||t.pending||t.inFlight)return;let o=e.field.value.trimEnd();e.field.value=o?`${o}
${r}`:r,Pe(e,t),t.onChange?.(e.field.value)}})}function nf(e,t,n){n.contextKey!==t.contextKey?(t.contextKey=n.contextKey,e.field.value=String(n.text??""),t.lastText=n.text):Object.hasOwn(n,"text")&&n.text!==t.lastText&&(e.field.value=String(n.text??""),t.lastText=n.text),t.pending=n.pending===!0,t.disabled=n.disabled===!0,e.field.setAttribute("aria-label",String(n.label??"Compose")),e.field.placeholder=String(n.placeholder??""),h(e.submit.firstChild,n.submitLabel??"Send"),h(e.cancel.firstChild,n.cancelLabel??"Cancel"),e.cancel.hidden=n.showCancel===!1}function af(e,t={}){let n=b(e);v(n);let a=g(),r=Ju(n,t.maxLength??16e3);e.append(r.root);let o={life:a,onChange:t.onChange,onSubmit:t.onSubmit,onCancel:t.onCancel,onError:t.onError,pending:!1,disabled:!1,inFlight:!1,composing:!1,contextKey:void 0,lastText:void 0,voice:null},i={update(s={}){a.dead||(nf(r,o,s),Pe(r,o))},clear(){a.dead||(r.field.value="",o.voice?.cancel(),Pe(r,o),o.onChange?.(""))},focus(){a.dead||r.field.focus()},destroy(){a.destroy()&&r.root.remove()}};return o.voice=tf(r,o,t.voice),o.voice&&a.add(()=>o.voice.destroy()),ef(a,r,o,i),Pe(r,o),i}var rf=new Set(["http","https","mailto","tel"]),of=/^([a-z][a-z0-9+.-]*):/i,sf=/[\u0000- \u007F-\u009F]/g,rn=/[\p{L}\p{N}_]/u,cf=/[.,;:!?)\]'"]+$/,lf=/^@([\p{L}\p{N}_][\p{L}\p{N}_.-]{0,63})/u,df=1e3,uf=4;function sn(e,{allowRelative:t=!0}={}){let n=String(e??"").trim();if(n===""||n.length>2048)return null;let a=n.replace(sf,""),r=of.exec(a);if(r){let o=r[1].toLowerCase();return!rf.has(o)||a!==n.replace(/\s/g,"")?null:{href:n,external:o==="http"||o==="https"}}return!t||a.startsWith("//")||a.startsWith("\\")||a!==n?null:{href:n,external:!1}}function ff(e){let t=new Map;return(n,a)=>{let r=t.get(n);if(r!==void 0&&(r===-1||r>=a))return r;let o=e.indexOf(n,a);return t.set(n,o),o}}function on(e,t,n,a,r){let o=sn(a,e);if(!o){t.append(e.doc.createTextNode(n));return}let i=e.doc.createElement("a");i.setAttribute("href",o.href),i.setAttribute("rel","noopener noreferrer nofollow"),o.external&&e.externalTarget!==!1&&i.setAttribute("target","_blank"),r&&i.setAttribute("title",r),i.append(e.doc.createTextNode(n)),t.append(i)}function pf(e,t){let n=0,a=Math.min(e.length,t+2048);for(let r=t;r<a;r+=1){let o=e[r];if(o===`
`)return-1;if(o==="(")n+=1;else{if(o===")"&&n===0)return r;o===")"&&(n-=1)}}return-1}function mf(e,t,n){let a=n("](",t+1);if(a===-1||a-t>df||e.slice(t+1,a).includes(`
`))return null;let r=pf(e,a+2);if(r===-1)return null;let o=e.slice(a+2,r).trim(),i=/^(\S+)\s+"([^"]*)"$/.exec(o);return{label:e.slice(t+1,a),target:i?i[1]:o,title:i?.[2]??"",next:r+1}}function hf(e,t){if(t>0&&rn.test(e[t-1]))return null;let n=e.slice(t,t+8).toLowerCase();if(!n.startsWith("http://")&&!n.startsWith("https://"))return null;let a=t;for(;a<e.length&&!/\s|</.test(e[a]);)a+=1;let r=e.slice(t,a).replace(cf,"");return r.length>8?{url:r,next:t+r.length}:null}function gf(e,t,n){if(!e.mentions||n>0&&rn.test(t[n-1]))return null;let a=lf.exec(t.slice(n,n+66));if(!a)return null;let r=a[1].replace(/[.-]+$/,""),o=e.mentions(r);return o?{handle:r,resolved:o,next:n+1+r.length}:null}function bf(e,t,{handle:n,resolved:a}){let r=String(a.label??`@${n}`);if(a.href&&sn(a.href,e)){on(e,t,r,a.href,"");return}let o=e.doc.createElement("span");o.className="cloudcanvas-ui-markdown-mention",o.setAttribute("data-mention",n),o.append(e.doc.createTextNode(r)),t.append(o)}var vf=Object.freeze([["**","strong"],["__","strong"],["~~","del"],["*","em"],["_","em"]]);function xf(e,t,n){for(let[a,r]of vf){if(!e.startsWith(a,t))continue;if(a[0]==="_"&&t>0&&rn.test(e[t-1]))return null;let o=t+a.length,i=n(a,o+1);if(!(i===-1||/\s/.test(e[o]??" ")||/\s/.test(e[i-1]))&&!(a[0]==="_"&&rn.test(e[i+a.length]??"")))return{tag:r,inner:e.slice(o,i),next:i+a.length}}return null}function yf(e,t,n,a,r,o){let i=t[n];if(i==="\\"&&n+1<t.length&&/[\\`*_~[\]()@<>#!-]/.test(t[n+1]))return a.append(e.doc.createTextNode(t[n+1])),n+2;if(i==="`"){let s=o("`",n+1);if(s===-1)return-1;let c=e.doc.createElement("code");return c.append(e.doc.createTextNode(t.slice(n+1,s))),a.append(c),s+1}if(i==="["){let s=mf(t,n,o);return s?(on(e,a,s.label,s.target,s.title),s.next):-1}if(i==="<"&&/^<https?:\/\/[^\s>]+>/i.test(t.slice(n,n+2050))){let s=t.indexOf(">",n);return on(e,a,t.slice(n+1,s),t.slice(n+1,s),""),s+1}return wf(e,t,n,a,r,o)}function wf(e,t,n,a,r,o){let i=t[n];if(i==="h"||i==="H"){let l=hf(t,n);return l?(on(e,a,l.url,l.url,""),l.next):-1}if(i==="@"){let l=gf(e,t,n);return l?(bf(e,a,l),l.next):-1}if(r>=uf||!"*_~".includes(i))return-1;let s=xf(t,n,o);if(!s)return-1;let c=e.doc.createElement(s.tag);return at(e,s.inner,c,r+1),a.append(c),s.next}var kf="\\`[<hH@*_~";function at(e,t,n,a=0){let r=ff(t),o="",i=0;for(;i<t.length;){let s=kf.includes(t[i])?e.doc.createDocumentFragment():null,c=s?yf(e,t,i,s,a,r):-1;if(c===-1){o+=t[i],i+=1;continue}o&&n.append(e.doc.createTextNode(o)),o="",n.append(s),i=c}o&&n.append(e.doc.createTextNode(o))}var cn="cloudcanvas-ui-markdown",Af=6,$a=/^ {0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$/,Xo=/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/,Yo=/^ {0,3}([-*_])(\s*\1){2,}\s*$/,ln=/^ {0,3}>\s?/,He=/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/,Sf=/^\[([ xX])\]\s+(.*)$/;function Zo(e){return $a.test(e)||Xo.test(e)||Yo.test(e)||ln.test(e)||He.test(e)}function rt(e){return e.length-e.trimStart().length}function $f(e,t,n,a){let r=$a.exec(t[n]),o=n+1;for(;o<t.length&&!t[o].trim().startsWith(r[1]);)o+=1;let i=e.doc.createElement("pre"),s=e.doc.createElement("code");return r[2]&&s.setAttribute("data-language",r[2]),s.append(e.doc.createTextNode(t.slice(n+1,o).join(`
`))),i.append(s),a.append(i),Math.min(o+1,t.length)}function If(e,t,n,a,r,o){let i=n;for(;i<t.length&&ln.test(t[i]);)i+=1;let s=e.doc.createElement("blockquote");return Ia(e,t.slice(n,i).map(c=>c.replace(ln,"")),s,r+1,o+n),a.append(s),i}function Tf(e,t,n,a){let r=n;for(;r<t.length&&t[r].trim()!==""&&(r===n||!Zo(t[r]));)r+=1;let o=e.doc.createElement("p");return t.slice(n,r).forEach((i,s)=>{s>0&&o.append(e.doc.createElement("br")),at(e,i.trim(),o)}),a.append(o),r}function Mf(e,t){let n=rt(e[t]),a=/\d/.test(He.exec(e[t])[2]),r=t+1;for(;r<e.length;){let o=e[r],i=He.exec(o);if(i&&rt(o)===n&&/\d/.test(i[2])===a){r+=1;continue}if(o.trim()===""&&r+1<e.length&&rt(e[r+1])>n){r+=1;continue}if(o.trim()!==""&&rt(o)>n){r+=1;continue}break}return{base:n,ordered:a,end:r}}function Nf(e,t,n){let a=e.doc.createElement("input");return a.type="checkbox",a.checked=t,a.className=`${cn}-task`,a.setAttribute("data-line",String(n)),a.disabled=!e.tasks,a}function Ef(e,t,n,a,r,o,i){let s=e.doc.createElement("li"),c=He.exec(t[n])[3],l=Sf.exec(c),u=[l?l[2]:c,...t.slice(n+1,a).map(f=>f.slice(Math.min(rt(f),i+2)))];if(l){s.className=`${cn}-task-item`;let f=e.doc.createElement("label");f.append(Nf(e,l[1]!==" ",o+n),e.doc.createTextNode(" ")),at(e,u[0],f),s.append(f),u.shift()}return u.length===1&&!Zo(u[0])?at(e,u[0].trim(),s):u.length>0&&Ia(e,u,s,r+1,o+n+(l?1:0)),s}function Df(e,t,n,a,r,o){let{base:i,ordered:s,end:c}=Mf(t,n),l=e.doc.createElement(s?"ol":"ul"),u=Number.parseInt(He.exec(t[n])[2],10);s&&u!==1&&l.setAttribute("start",String(u));let f=n;for(let w=n+1;w<=c;w+=1){let S=w<c?He.exec(t[w]):null;(w===c||S&&rt(t[w])===i)&&(l.append(Ef(e,t,f,w,r,o,i)),f=w)}return a.append(l),c}function Lf(e,t,n,a,r,o){let i=t[n];if($a.test(i))return $f(e,t,n,a);let s=Xo.exec(i);if(s){let c=Math.min(6,s[1].length+e.headingOffset),l=d(e.doc,`h${c}`);return at(e,s[2],l),a.append(l),n+1}return Yo.test(i)?(a.append(e.doc.createElement("hr")),n+1):ln.test(i)?If(e,t,n,a,r,o):He.test(i)?Df(e,t,n,a,r,o):Tf(e,t,n,a)}function Ia(e,t,n,a,r){if(a>Af){n.append(e.doc.createTextNode(t.join(`
`)));return}let o=0;for(;o<t.length;){if(t[o].trim()===""){o+=1;continue}o=Lf(e,t,o,n,a,r)}}function Qo(e,t={}){let n=t.doc??globalThis.document,a=String(e??"").slice(0,t.maxLength??1e5).replace(/\r\n?/g,`
`),r={doc:n,mentions:t.mentions,allowRelative:t.allowRelativeLinks!==!1,externalTarget:t.externalTarget,headingOffset:Math.max(0,t.headingOffset??0),tasks:t.tasks===!0},o=n.createDocumentFragment();return Ia(r,a.split(`
`),o,0,0),o}function Cf(e,t,n){let a=String(e??"").split(`
`),r=/^(\s*(?:[-*+]|\d{1,9}[.)])\s+\[)([ xX])(\].*)$/.exec(a[t]??"");return r?(a[t]=`${r[1]}${n?"x":" "}${r[3]}`,a.join(`
`)):String(e??"")}function Of(e,t={}){let n=b(e);v(n);let a=g(),r=d(n,"div",{className:cn});e.append(r);let o=null;return a.on(r,"change",i=>{let s=i.target.closest?.(`.${cn}-task`);s&&t.onTaskToggle?.(Number(s.getAttribute("data-line")),s.checked)}),{update(i={}){a.dead||i.source===o||(o=i.source??"",r.replaceChildren(Qo(o,{...t,doc:n,tasks:typeof t.onTaskToggle=="function"})))},destroy(){a.destroy()&&r.remove()}}}var dn=".cloudcanvas-ui-kanban-card";function fn(e){return Array.from(e.lane.querySelectorAll(dn))}function pn(e,t){for(let n of e.model.columns){let a=n.cards.findIndex(r=>r.id===t);if(a!==-1)return{columnId:n.id,index:a}}return null}function mn(e,t,{move:n}){let a=fn(e),r=a.find(o=>o.getAttribute("data-ui-id")===t)??null;e.state.focusId=r?t:null,C(a,r??a[0]??null),n&&r?.focus()}function ei(e,t){for(let n of e.model.columns){let a=n.cards.find(r=>r.id===t);if(a)return String(a.title??a.id)}return t}function un(e,t){let n=e.model.columns.findIndex(a=>a.id===t);return{index:n,column:e.model.columns[n]}}function Rf(e,t,n){let a=pn(e,n);if(!a)return null;let{index:r,column:o}=un(e,a.columnId);if(t==="ArrowUp"||t==="ArrowDown"||t==="Home"||t==="End"){let s=o.cards.length-1,c={ArrowUp:a.index-1,ArrowDown:a.index+1,Home:0,End:s}[t];return o.cards[Math.max(0,Math.min(s,c))].id}let i=t==="ArrowRight"?1:-1;for(let s=r+i;s>=0&&s<e.model.columns.length;s+=i){let c=e.model.columns[s].cards;if(c.length)return c[Math.min(a.index,c.length-1)].id}return null}function _f(e){let t=e.state.grab,n=Array.from(e.lane.children).find(l=>l.getAttribute("data-column-id")===t.columnId),a=fn(e).find(l=>l.getAttribute("data-ui-id")===t.id);if(!n||!a)return;let r=n.lastChild,o=Array.from(r.children).filter(l=>l!==a.parentNode);r.insertBefore(a.parentNode,o[t.index]??null),a.focus();let{column:i}=un(e,t.columnId),s=`${String(i.label??i.id)}, position ${t.index+1} of ${o.length+1}`,c=e.verdict(t.id,t.from,t.columnId);n.classList.toggle("is-refused",c!==!0),e.say(c===!0?s:`${s}. ${c}`)}function zf(e,t){let n=e.state.grab,{index:a}=un(e,n.columnId);if(t==="ArrowLeft"||t==="ArrowRight"){let r=e.model.columns[a+(t==="ArrowRight"?1:-1)];if(!r)return;n.columnId=r.id;let o=r.cards.filter(i=>i.id!==n.id).length;n.index=Math.min(n.index,o)}else{let r=un(e,n.columnId).column.cards.filter(o=>o.id!==n.id).length;n.index=Math.max(0,Math.min(r,n.index+(t==="ArrowDown"?1:-1)))}_f(e)}function Jo(e,t){let n=e.state.grab;e.state.grab=null;for(let a of e.lane.querySelectorAll(".is-grabbed, .is-refused"))a.classList.remove("is-grabbed","is-refused");t&&e.commit(n.id,n.from,n.columnId,n.index)?e.say(`Dropped ${ei(e,n.id)}.`):t||(e.render(),e.say("Move cancelled.")),mn(e,n.id,{move:!0})}function Bf(e,t,n){let a=pn(e,t);a&&(e.state.grab={id:t,from:a.columnId,columnId:a.columnId,index:a.index},n.parentNode.classList.add("is-grabbed"),e.say(`Picked up ${ei(e,t)}. Arrow keys move it, Space drops it, Escape cancels.`))}function Pf(e,t){let n=t.target.closest?.(dn);if(!n)return;let a=n.getAttribute("data-ui-id"),r=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"];if(t.repeat&&(t.key===" "||t.key==="Enter")){t.preventDefault();return}if(e.state.grab){if(r.includes(t.key))zf(e,t.key);else if(t.key===" "||t.key==="Enter")Jo(e,!0);else if(t.key==="Escape"||t.key==="Tab")Jo(e,!1);else return;t.key!=="Tab"&&t.preventDefault();return}if(t.key===" "){t.preventDefault(),Bf(e,a,n);return}let o=[...r,"Home","End"].includes(t.key)?Rf(e,t.key,a):null;o!==null&&(t.preventDefault(),mn(e,o,{move:!0}))}function ti(e){e.verdict=(t,n,a)=>e.moveVerdict(e.callbacks.canMove,t,n,a),e.life.on(e.lane,"keydown",t=>Pf(e,t)),e.life.on(e.lane,"keyup",t=>{t.key===" "&&t.target.closest?.(dn)&&t.preventDefault()}),e.life.on(e.lane,"focusin",t=>{let n=t.target.closest?.(dn);n&&!e.state.grab&&(e.state.focusId=n.getAttribute("data-ui-id"))})}var R="cloudcanvas-ui-kanban";function Hf(e){let t=d(e,"li",{className:`${R}-item`}),n=d(e,"button",{className:`${R}-card`,attrs:{type:"button",tabindex:"-1"}});return n.append(d(e,"span",{className:`${R}-title`}),d(e,"span",{className:`${R}-detail`}),d(e,"span",{className:`${R}-meta`})),t.append(n),t}function Uf(e,t){let n=t.time?.iso&&t.time?.text?t.time:null;if(e.textContent=n?"":String(t.detail??""),n){let a=e.ownerDocument.createElement("time");a.setAttribute("datetime",String(n.iso)),a.setAttribute("title",String(n.title??n.iso)),a.textContent=String(n.text),e.append(a)}e.hidden=!n&&!t.detail}function Ff(e,t,n,a){let r=e.firstChild,[o,i,s]=r.children;r.setAttribute("data-ui-id",t.id),r.setAttribute("data-column-id",n.id),t.tone?r.setAttribute("data-tone",String(t.tone)):r.removeAttribute("data-tone"),o.textContent=String(t.title??""),Uf(i,t),s.textContent=String(t.meta??""),s.hidden=!t.meta,Z(r,t.id===a)}function Kf(e,t){let n=d(e,"section",{className:`${R}-column`}),a=d(e,"h3",{className:`${R}-heading`,attrs:{id:M(R)}});a.append(d(e,"span",{className:`${R}-label`}),d(e,"span",{className:`${R}-count`}));let r=d(e,"ul",{className:`${R}-cards`,attrs:{role:"list"}});return n.setAttribute("aria-labelledby",a.id),n.append(a,r),n.setAttribute("data-column-id",t.id),n}function jf(e,t,n){let a=n===null?"span":"button",r=t.firstChild;return r.localName!==a&&(r=d(e,a,{className:`${R}-label`,attrs:{type:n===null?null:"button"}}),t.firstChild.replaceWith(r)),n!==null&&r.setAttribute("data-ui-id",n),r}function Gf(e,t,{doc:n,model:a}){let r=e.firstChild,o=jf(n,r,t.itemId);o.textContent=String(t.label??t.id),Z(o,t.itemId!==null&&t.itemId===a.selectedId),r.lastChild.textContent=String(t.cards.length),U(e.lastChild,t.cards,{key:i=>i.id,create:()=>Hf(n),update:(i,s)=>Ff(i,s,t,a.selectedId)})}function qf(e){let t=e.itemId??null;if(t!==null&&(typeof t!="string"||t.trim()===""))throw new TypeError(`Invalid item id for column ${e.id}: ${String(t)}`);return t}function Wf(e){let t=D(e.columns??[],"column").map(n=>({...n,itemId:qf(n),cards:Array.isArray(n.cards)?n.cards:[]}));return D(t.flatMap(n=>n.cards),"card"),{...e,selectedId:e.selectedId??null,columns:t}}function Vf(e,t){let n=t?.matches(`button.${R}-label`)===!0&&e.root.contains(t);mn(e,e.state.focusId,{move:t!==null&&!n}),n&&se(e.root,t)}function Xf(e,t){let n=t.columns;e.model=t,e.root.setAttribute("aria-label",String(t.label??"Board"));let a=e.root.contains(e.doc.activeElement)?e.doc.activeElement:null;U(e.lane,n,{key:o=>o.id,create:o=>Kf(e.doc,o),update:(o,i)=>Gf(o,i,e)});let r=fn(e).map(o=>o.getAttribute("data-ui-id"));r.includes(e.state.focusId)||(e.state.focusId=r.includes(t.selectedId)?t.selectedId:r[0]??null),Vf(e,a)}function ni(e,t,n){let r=e.doc.elementFromPoint?.(t.x,t.y)?.closest?.(`.${R}-column`);if(!r||!e.lane.contains(r))return null;let o=Array.from(r.querySelectorAll(`.${R}-card`)).filter(s=>s.getAttribute("data-ui-id")!==n),i=o.findIndex(s=>{let c=s.getBoundingClientRect();return t.y<c.top+c.height/2});return{columnId:r.getAttribute("data-column-id"),index:i===-1?o.length:i,section:r}}function hn(e,t,n,a){if(n===a||typeof e!="function")return!0;let r=e(t,n,a);return r===!0||r===void 0?!0:typeof r=="string"&&r.trim()?r:"This move is not allowed."}function ai(e){for(let t of e.lane.querySelectorAll(".is-drop-target, .is-refused"))t.classList.remove("is-drop-target","is-refused")}function Yf(e){L(e.life,e.lane,{selector:`.${R}-card`,onStart(t,n){e.drag={id:t.getAttribute("data-ui-id"),from:t.getAttribute("data-column-id"),origin:n,card:t},t.closest("li").classList.add("is-dragging")},onMove(t){let n=e.drag;n.card.closest("li")?.style.setProperty("transform",`translate(${t.x-n.origin.x}px, ${t.y-n.origin.y}px)`);let a=e.lane.getBoundingClientRect();t.x>a.right-32?e.lane.scrollLeft+=12:t.x<a.left+32&&(e.lane.scrollLeft-=12),ai(e);let r=ni(e,t,n.id);r&&r.section.classList.add(hn(e.callbacks.canMove,n.id,n.from,r.columnId)===!0?"is-drop-target":"is-refused")},onEnd(t){let n=e.drag;e.drag=null,n.card.closest("li")?.classList.remove("is-dragging"),n.card.closest("li")?.style.removeProperty("transform"),ai(e);let a=t?ni(e,t,n.id):null;a?e.commit(n.id,n.from,a.columnId,a.index):e.render()}})}function Zf(e,t={}){let n=b(e);v(n);let a=g(),r=d(n,"div",{className:R,attrs:{role:"group",[F]:!0}}),o=d(n,"div",{className:`${R}-lane`});r.append(o),e.append(r);let i={doc:n,life:a,root:r,lane:o,callbacks:t,model:{selectedId:null,columns:[]},state:{focusId:null,grab:null},drag:null,region:he(r),moveVerdict:hn};return i.say=s=>ge(i.region,s),i.render=()=>Xf(i,i.model),i.commit=(s,c,l,u)=>{let f=hn(t.canMove,s,c,l);if(f!==!0)return i.say(f),i.render(),!1;let w=pn(i,s);return w&&w.columnId===l&&w.index===u?(i.render(),!1):(t.onMove?.(s,l,u),i.render(),!0)},a.on(o,"click",s=>{let c=Xe(s.target,o);c&&!i.state.grab&&t.onActivate?.(ie(c))}),ti(i),Yf(i),{update(s={}){a.dead||(i.model=Wf(s),!i.state.grab&&!i.drag&&i.render())},destroy(){a.destroy()&&r.remove()}}}var oe="cloudcanvas-ui-item-more",ot="More actions for {title}",gn="Touch and hold, Shift+F10 or right-click for more",Qf=3;function bn(e,t){return!(e>0&&t*Qf>e)}function it(e,t){let n=d(e,"button",{className:`${oe} ${t}`,attrs:{type:"button"}});return n.append(qt(e,"more")),n}function st(e,t,n){let a=t.replace("{title}",n);e.setAttribute("aria-label",a),e.setAttribute("title",a)}function ne(e){return!!e?.closest?.(`.${oe}`)}function ct(e){let t=e.getBoundingClientRect();return{x:t.left,y:t.bottom}}var Et=Object.freeze(["month","week","day"]);function H(e){if(e instanceof Date)return Number.isNaN(e.getTime())?null:new Date(e.getTime());if(typeof e=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(e))return z(e);if(typeof e=="string"||typeof e=="number"){let t=new Date(e);return Number.isNaN(t.getTime())?null:t}return null}function T(e){return new Date(e.getFullYear(),e.getMonth(),e.getDate())}function A(e,t){let n=new Date(e.getTime());return n.setDate(n.getDate()+t),n}function lt(e,t){let n=new Date(e.getTime());return n.setMinutes(n.getMinutes()+t),n}function vn(e,t){return new Date(e.getFullYear(),e.getMonth()+t,1)}function xn(e){return new Date(e.getFullYear(),e.getMonth(),1)}function Ae(e,t=0){let n=T(e);return A(n,-((n.getDay()-t+7)%7))}function I(e){let t=n=>String(n).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}`}function z(e){let t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(e??""));if(!t)return null;let n=new Date(Number(t[1]),Number(t[2])-1,Number(t[3]));return I(n)===e?n:null}function V(e,t){return I(e)===I(t)}function dt(e,t){return Math.round((T(t).getTime()-T(e).getTime())/864e5)}function Ue(e){return e.getHours()*60+e.getMinutes()}function B(e,t){let n=T(e);return n.setMinutes(t),n}function ri(e,t=0){let n=Ae(xn(e),t);return Array.from({length:42},(a,r)=>A(n,r))}function ut(e,t,n=0){if(e==="month")return ri(t,n);if(e==="week"){let a=Ae(t,n);return Array.from({length:7},(r,o)=>A(a,o))}return[T(t)]}function Dt(e,t,n){return e==="month"?vn(t,n):A(T(t),n*(e==="week"?7:1))}function Ta(e,t,n){let a=T(n),r=A(a,1),o=t&&t>e?t:new Date(e.getTime()+1);return e<r&&o>a}var Jf=60;function ep(e){let t=e?.id;if(typeof t!="string"||t.trim()==="")throw new TypeError("Calendar event needs a string id");let n=H(e.start);if(!n)throw new TypeError(`Calendar event ${t} has no valid start`);let a=e.end===void 0||e.end===null?null:H(e.end);if(a===null&&e.end!==void 0&&e.end!==null)throw new TypeError(`Calendar event ${t} has an invalid end`);return{id:t,start:n,end:a&&a>n?a:null,allDay:e.allDay===!0,title:String(e.title??t),tone:e.tone?String(e.tone):"",movable:e.movable!==!1}}function oi(e){if(!Array.isArray(e))throw new TypeError("Calendar events must be an array");let t=new Set,n=[];for(let a of e.map(ep)){if(t.has(a.id))throw new TypeError(`Duplicate calendar event id: ${a.id}`);t.add(a.id),n.push(a)}return n.sort((a,r)=>a.start-r.start||a.id.localeCompare(r.id))}function G(e,t){return e.state.events.find(n=>n.id===t)??null}function Se(e){return e.end?e.end:e.allDay?A(T(e.start),1):lt(e.start,Jf)}function X(e){return e.allDay||I(e.start)!==I(lt(Se(e),-1))}function yn(e,t){let n=new Map(t.map(a=>[I(a),[]]));for(let a of e)for(let r of t)Ta(a.start,Se(a),r)&&n.get(I(r)).push(a);return n}function ii(e){let t=[];return{placed:e.map(a=>{let r=Ue(a.start),o=Math.max(r+15,r+(Se(a)-a.start)/6e4),i=t.findIndex(s=>s<=r);return i===-1&&(i=t.length),t[i]=o,{event:a,lane:i,start:r,stop:o}}),lanes:Math.max(1,t.length)}}function si(e){let t=n=>new Intl.DateTimeFormat(e,n);return{title:{month:t({month:"long",year:"numeric"}),day:t({weekday:"long",month:"long",day:"numeric",year:"numeric"})},weekday:t({weekday:"short"}),weekdayLong:t({weekday:"long"}),dayNumber:t({day:"numeric"}),dayHead:t({weekday:"short",day:"numeric"}),full:t({weekday:"long",month:"long",day:"numeric",year:"numeric"}),time:t({hour:"numeric",minute:"2-digit"}),hour:t({hour:"numeric"})}}function ci(e,t,n){if(e==="day")return n.title.day.format(t[0]);if(e==="month")return n.title.month.format(t[15]);let a=t[0],r=t[t.length-1];return n.title.month.formatRange?.(a,r)??n.title.month.format(a)}function $e(e,t){return X(e)?`${e.title}, ${t.full.format(e.start)}, all day`:`${e.title}, ${t.full.format(e.start)}, ${t.time.format(e.start)} to ${t.time.format(Se(e))}`}var p="cloudcanvas-ui-calendar",Ma=3;function wn(e,t,{showTime:n}){let{doc:a,format:r}=e,o=$e(t,r),i=d(a,"button",{className:`${p}-event`,attrs:{type:"button","data-ui-id":t.id,"aria-label":o,title:o,tabindex:"-1","data-tone":t.tone||null,"data-movable":t.movable?"true":null}});return n&&!X(t)&&i.append(d(a,"span",{className:`${p}-event-time`,text:r.time.format(t.start)})),i.append(d(a,"span",{className:`${p}-event-title`,text:t.title})),e.state.pending?.id===t.id&&i.classList.add("is-grabbed"),Z(i,t.id===e.state.selectedId),i}function tp(e,t){let n=d(e.doc,"div",{className:`${p}-weekdays`,attrs:{role:"row"}});for(let a of t.slice(0,7))n.append(d(e.doc,"div",{className:`${p}-weekday`,text:e.format.weekday.format(a),attrs:{role:"columnheader","aria-label":e.format.weekdayLong.format(a)}}));return n}function np(e,t,n){let{doc:a,state:r,format:o}=e,i=I(t),s=d(a,"div",{className:`${p}-cell`,attrs:{role:"gridcell","data-date":i}});s.classList.toggle("is-outside",t.getMonth()!==r.anchor.getMonth()),s.classList.toggle("is-today",V(t,r.now));let c=n.length?`, ${n.length} event${n.length===1?"":"s"}`:"";s.append(d(a,"button",{className:`${p}-day`,text:o.dayNumber.format(t),attrs:{type:"button","data-date":i,tabindex:"-1","aria-label":`${o.full.format(t)}${c}`,"aria-current":V(t,r.now)?"date":null}}));let l=d(a,"div",{className:`${p}-events`});for(let u of n.slice(0,Ma))l.append(wn(e,u,{showTime:!0}));return n.length>Ma&&l.append(d(a,"button",{className:`${p}-more`,text:`+${n.length-Ma}`,attrs:{type:"button","data-open-day":i,tabindex:"-1","aria-label":`Show all ${n.length} events on ${o.full.format(t)}`}})),s.append(l),s}function li(e,t,n){let a=d(e.doc,"div",{className:`${p}-month`,attrs:{role:"grid","aria-label":e.title}});a.append(tp(e,t));let r=yn(n,t);for(let o=0;o<6;o+=1){let i=d(e.doc,"div",{className:`${p}-week`,attrs:{role:"row"}});for(let s of t.slice(o*7,o*7+7))i.append(np(e,s,r.get(I(s))));a.append(i)}e.body.replaceChildren(a)}function ap(e,t){let n=d(e.doc,"div",{className:`${p}-time-head`});n.append(d(e.doc,"div",{className:`${p}-gutter`}));for(let a of t){let r=V(a,e.state.now),o=d(e.doc,"button",{className:`${p}-day-head`,text:e.format.dayHead.format(a),attrs:{type:"button","data-date":I(a),tabindex:"-1","aria-label":e.format.full.format(a),"aria-current":r?"date":null}});o.classList.toggle("is-today",r),n.append(o)}return n}function rp(e,t,n){let a=d(e.doc,"div",{className:`${p}-allday`});a.append(d(e.doc,"div",{className:`${p}-gutter`,text:e.labels.allDay}));for(let r of t){let o=d(e.doc,"div",{className:`${p}-allday-cell`,attrs:{"data-date":I(r)}});for(let i of n.get(I(r)).filter(X))o.append(wn(e,i,{showTime:!1}));a.append(o)}return a}function op(e){let t=d(e.doc,"div",{className:`${p}-hours`,attrs:{"aria-hidden":"true"}}),n=new Date(2e3,0,1);for(let a=e.state.hours.start;a<e.state.hours.end;a+=1)n.setHours(a,0,0,0),t.append(d(e.doc,"div",{className:`${p}-hour`,text:e.format.hour.format(n)}));return t}function ip(e,t,n,a){let r=e.state.hours.start*60,o=e.state.hours.end*60,i=Math.max(0,Math.min(o-r-15,n.start-r)),s=Math.max(15,Math.min(o,n.stop)-Math.max(r,n.start));t.style.setProperty("--calendar-top",String(i)),t.style.setProperty("--calendar-length",String(s)),t.style.setProperty("--calendar-lane",String(n.lane)),t.style.setProperty("--calendar-lanes",String(a))}function sp(e,t,n){let a=d(e.doc,"div",{className:`${p}-column`,attrs:{"data-date":I(t)}});a.classList.toggle("is-today",V(t,e.state.now));let r=n.filter(s=>!X(s)),{placed:o,lanes:i}=ii(r);for(let s of o){let c=wn(e,s.event,{showTime:!0});c.classList.add(`${p}-timed`),s.event.movable&&typeof e.callbacks.onMove=="function"&&c.append(d(e.doc,"span",{className:`${p}-event-handle`,attrs:{"aria-hidden":"true"}})),ip(e,c,s,i),a.append(c)}return a}function cp(e,t,n,a,r){let o=`${e.state.view}:${I(e.state.anchor)}`;if(e.scrolledFor===o){r!==null&&(t.scrollTop=r);return}e.scrolledFor=o;let i=e.state.hours.end-e.state.hours.start,s=n.getBoundingClientRect().height/i;if(!(s>0))return;let c=a.find(u=>!X(u)),l=Math.max(e.state.hours.start,c?c.start.getHours():8);t.scrollTop=(l-e.state.hours.start)*s}function di(e,t,n){let a=d(e.doc,"div",{className:`${p}-time`,attrs:{role:"group","aria-label":e.title}});a.style.setProperty("--calendar-days",String(t.length));let r=yn(n,t),o=d(e.doc,"div",{className:`${p}-scroller`,attrs:{tabindex:"0",role:"group","aria-label":e.labels.hours}}),i=d(e.doc,"div",{className:`${p}-time-grid`});i.style.setProperty("--calendar-hours",String(e.state.hours.end-e.state.hours.start)),i.append(op(e),...t.map(c=>sp(e,c,r.get(I(c))))),o.append(i),a.append(ap(e,t),rp(e,t,r),o);let s=e.body.querySelector(`.${p}-scroller`)?.scrollTop??null;e.body.replaceChildren(a),cp(e,o,i,n,s)}function fe(e,t,n,{slot:a=!1,edge:r=!1}={}){let o=t.getBoundingClientRect(),i=e.state.hours.end-e.state.hours.start;if(!(o.height>0))return null;let s=e.state.hours.start*60+(n-o.top)/o.height*i*60,c=e.state.snap,l=(a?Math.floor(s/c):Math.round(s/c))*c,u=e.state.hours.end*60-(r?0:c);return Math.max(e.state.hours.start*60,Math.min(u,l))}function kn(e){return(e.key==="n"||e.key==="N")&&!e.ctrlKey&&!e.metaKey&&!e.altKey}function ft(e){return`${e.split(" · ").join(", ")}.`}function An(e,t,{active:n,cancel:a}){e.on(t,"pointerdown",()=>{n()&&a()},{capture:!0}),e.on(t,"focusout",()=>{n()&&e.later(()=>{n()&&!t.contains(t.ownerDocument.activeElement)&&a()},0)})}var fi=Object.freeze(["--calendar-top","--calendar-lane","--calendar-lanes","--calendar-length"]);function lp(e,t){return Array.from(e.body.querySelectorAll(`.${p}-event`)).find(n=>n.getAttribute("data-ui-id")===t)??null}function dp(e,t){let n=Array.from(t.parentElement.children).filter(a=>a!==e).indexOf(t)+1;e.style.setProperty("grid-row",`${n} / ${n+1}`);for(let a of fi)e.style.removeProperty(a)}function up(e,t){e.style.removeProperty("grid-row");for(let n of fi)e.style.setProperty(n,t.style.getPropertyValue(n))}var fp=400;function ui(e,t){let n=e.more!==void 0&&e.doc.activeElement===e.more;e.more?.remove(),t?.classList.remove("is-holding-more"),n&&t?.focus({preventScroll:!0})}function Na(e){let{state:t}=e,a=typeof e.callbacks.onMenu=="function"&&!t.pending&&!t.creating&&t.selectedId!==null?lp(e,t.selectedId):null;if(e.pressing&&a)return;for(let o of e.body.querySelectorAll(".is-holding-more"))o!==a&&o.classList.remove("is-holding-more");if(e.crowded=!1,!a){ui(e,null);return}e.more??=it(e.doc,`${p}-more-actions`),st(e.more,e.labels.more,t.events.find(o=>o.id===t.selectedId)?.title??""),e.more.setAttribute("data-more-for",t.selectedId);let r=a.classList.contains(`${p}-timed`);e.more.classList.toggle("is-timed",r),e.more.previousElementSibling!==a&&a.after(e.more),(r?up:dp)(e.more,a),e.crowded=!bn(a.getBoundingClientRect().width,e.more.getBoundingClientRect().width),e.crowded?ui(e,a):a.classList.add("is-holding-more")}function pi(e,t){if(!ne(t))return!1;let n=t.closest(`.${oe}`);return e.callbacks.onMenu?.(n.getAttribute("data-more-for"),ct(n)),!0}function mi(e){let t=()=>{e.pressing&&(e.pressing=!1,Na(e))};e.life.on(e.body,"pointerdown",()=>{e.pressing=!0},{capture:!0}),e.life.on(e.body,"click",t),e.life.on(e.body,"pointerup",()=>e.life.later(t,fp)),e.life.on(e.body,"pointercancel",t)}var pp=`.${p}-event-handle`,mp=`.${p}-event`;function Lt(e,t){return!!t&&t.movable&&e.state.view!=="month"&&!X(t)&&typeof e.callbacks.onMove=="function"}function hi(e,t,n){let a=Ue(t.start)+e.state.snap,r=B(t.start,Math.min(e.state.hours.end*60,Math.max(n,a)));return r.getTime()===Se(t).getTime()?t.end:r}function hp(e,t){let n=G(e,t.closest(mp).getAttribute("data-ui-id"));if(!Lt(e,n))return!1;let a={start:n.start,end:n.end,allDay:n.allDay};return e.state.pending={id:n.id,keyboard:!1,mode:"resize",original:a,times:a,offset:0},!0}function gp(e,t){let{pending:n}=e.state,a=G(e,n.id),r=e.body.querySelector(`.${p}-column[data-date="${I(a.start)}"]`),o=r?fe(e,r,t.y,{edge:!0}):null;if(o===null)return;let i=hi(e,a,o);(i?.getTime()??null)!==(n.times.end?.getTime()??null)&&(n.times={...n.times,end:i},e.render())}function bp(e,t){let{pending:n}=e.state;e.state.pending=null;let a=(n.times.end?.getTime()??null)!==(n.original.end?.getTime()??null);t&&a&&(e.callbacks.onMove(n.id,{...n.times}),e.say(`${e.labels.resized} ${$e({...G(e,n.id),...n.times},e.format)}.`)),e.render()}function gi(e,t,n){let a={ArrowDown:1,ArrowUp:-1}[n.key],r=G(e,t.getAttribute("data-ui-id"));if(!n.altKey||!n.shiftKey||a===void 0||!Lt(e,r))return!1;n.preventDefault();let o=Math.round((Se(r)-T(r.start))/6e4),i=hi(e,r,o+a*e.state.snap);if(!i||i.getTime()===Se(r).getTime())return!0;let s={start:r.start,end:i,allDay:r.allDay};return e.callbacks.onMove(r.id,s),e.say(`${e.labels.resized} ${$e({...r,...s},e.format)}.`),!0}function bi(e){L(e.life,e.body,{selector:pp,canStart:()=>!e.state.pending,onStart(t){hp(e,t)},onMove(t){e.state.pending?.mode==="resize"&&gp(e,t)},onEnd(t){e.state.pending?.mode==="resize"&&bp(e,t!==null)}})}function vp(e,t){let{labels:n,callbacks:a}=e,r=t.movable&&typeof a.onMove=="function";return[a.onActivate&&n.hintOpen,r&&n.hintMove,Lt(e,t)&&n.hintResize,Lt(e,t)&&n.hintKeys,a.onMenu&&(e.crowded?n.hintMoreHeld:n.hintMore)]}function xp(e){let t=e.state.view==="month"?e.labels.hintCreateDays:e.labels.hintCreate;return[e.labels.hintNone,e.callbacks.onPick&&t,e.callbacks.onMenu&&e.labels.hintMore,e.callbacks.onPick&&e.labels.hintDraw]}function yp(e,{kind:t,anchor:n}){let{labels:a}=e;return t==="days"?n===null?a.hintDrawDays:a.hintDrawDaysEnd:n===null?a.hintDrawTime:a.hintDrawTimeEnd}function Sn(e){if(e.state.drawing)return yp(e,e.state.drawing);let t=G(e,e.state.selectedId);return(t?vp(e,t):xp(e)).filter(Boolean).join(" · ")}function Ie(e){for(let n of e.body.querySelectorAll(`.${p}-event`))Z(n,n.getAttribute("data-ui-id")===e.state.selectedId);Na(e);let t=Sn(e);h(e.hintText,t),e.hint.hidden=t===""}function Ea(e,t){e.state.selectedId!==t&&(e.state.selectedId=t,Ie(e))}var wp=8,vi=e=>e.state.view==="month"?"days":"time";function Da(e){let{at:t,anchor:n}=e.state.drawing;return{from:Math.min(t,n??t),to:Math.min(e.state.hours.end*60,Math.max(t,n??t)+e.state.snap)}}function La(e){let t=I(e.state.focusDate);return[e.state.drawing.anchor??t,t].sort()}function pt(e,{day:t=!1}={}){let{format:n}=e;if(e.state.drawing.kind==="days"){let[l,u]=La(e).map(z);return l.getTime()===u.getTime()?n.full.format(l):`${n.full.format(l)} to ${n.full.format(u)}`}let{from:a,to:r}=Da(e),{at:o,anchor:i}=e.state.drawing,s=l=>n.time.format(B(e.state.focusDate,l)),c=i===null?s(o):`${s(a)} to ${s(r)}`;return t?`${n.full.format(e.state.focusDate)}, ${c}`:c}function kp(e){let{hours:t,snap:n}=e.state,a=e.body.querySelector(`.${p}-scroller`),r=a?.querySelector(`.${p}-time-grid`)?.getBoundingClientRect().height??0,o=r>0?t.start*60+a.scrollTop/r*(t.end-t.start)*60:wp*60;return N(Math.ceil(o/n)*n,t.start*60,t.end*60-n)}function xi(e){let t=e.body.querySelector(`.${p}-scroller`),n=t?.querySelector(`.${p}-time-grid`)?.getBoundingClientRect().height??0,a=t?.clientHeight||0;if(!(n>0)||!(a>0))return;let r=n/((e.state.hours.end-e.state.hours.start)*60),o=(e.state.drawing.at-e.state.hours.start*60)*r,i=o+e.state.snap*r;o<t.scrollTop?t.scrollTop=o:i>t.scrollTop+a&&(t.scrollTop=i-a)}function yi(e){e.drawBand?.remove();let t=I(e.state.focusDate),n=Array.from(e.body.querySelectorAll(`.${p}-column`)).find(s=>s.getAttribute("data-date")===t);if(!n)return;let{from:a,to:r}=Da(e),o=d(e.doc,"div",{className:`${p}-draft is-keyboard`,attrs:{"aria-hidden":"true"}});o.style.setProperty("--calendar-top",String(a-e.state.hours.start*60)),o.style.setProperty("--calendar-length",String(r-a));let i=s=>e.format.time.format(B(e.state.focusDate,s));o.textContent=`${i(a)} – ${i(r)}`,n.append(o),e.drawBand=o}function wi(e,t){let[n,a]=t??["",""];for(let r of e.body.querySelectorAll(`.${p}-cell`)){let o=r.getAttribute("data-date");r.classList.toggle("is-range",t!==null&&o>=n&&o<=a)}}function Ca(e){let t=e.state.drawing;if(t){if(t.kind!==vi(e)){Oa(e);return}t.kind==="days"?wi(e,La(e)):yi(e)}}function ki(e){e.drawBand?.remove(),e.drawBand=null,wi(e,null),e.state.drawing=null,Ie(e)}function Oa(e){e.state.drawing&&(ki(e),e.say(e.labels.drawCancelled))}function Ai(e,t){if(typeof e.callbacks.onPick!="function"||e.state.pending||e.state.creating)return!1;e.state.focusDate=z(t.getAttribute("data-date"))??e.state.focusDate;let n=vi(e);e.state.drawing={kind:n,at:n==="time"?kp(e):null,anchor:null},Ca(e),n==="time"&&xi(e),Ie(e);let a=n==="time"?pt(e,{day:!0}):pt(e);return e.say(`${e.labels.drawStart.replace("{when}",a)} ${ft(Sn(e))}`),!0}function Si(e){e.state.drawing&&e.say(pt(e,{day:e.state.drawing.kind==="time"}))}function Ap(e){let t=e.state.drawing;if(t.anchor===null){t.anchor=t.kind==="time"?t.at:I(e.state.focusDate),Ie(e);let r=t.kind==="time"?e.format.time.format(B(e.state.focusDate,t.at)):pt(e);e.say(`${e.labels.drawAnchor.replace("{when}",r)} ${ft(Sn(e))}`);return}let n=e.labels.drawn.replace("{range}",pt(e,{day:!0})),a=t.kind==="days"?Sp(La(e)):$p(e);ki(e),e.callbacks.onPick(a),e.say(n)}var Sp=([e,t])=>({date:e,start:z(e),end:A(z(t),1),allDay:!0});function $p(e){let{from:t,to:n}=Da(e);return{date:I(e.state.focusDate),start:B(e.state.focusDate,t),end:B(e.state.focusDate,n)}}function Ip(e,t){let{hours:n,snap:a}=e.state;e.state.drawing.at=N(e.state.drawing.at+t*a,n.start*60,n.end*60-a),yi(e),xi(e),e.say(pt(e))}var Tp=new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End","PageUp","PageDown"]);function $i(e,t){let n=e.state.drawing,a=n.kind==="time"?{ArrowUp:-1,ArrowDown:1}[t.key]:void 0;if((t.key===" "||t.key==="Enter")&&t.repeat)return t.preventDefault(),!0;if(a!==void 0)Ip(e,a);else if(Tp.has(t.key)){if(n.kind==="days"||n.anchor===null)return!1}else if(t.key===" "||t.key==="Enter")e.spaceTaken=t.key===" ",Ap(e);else if(t.key==="Escape"||t.key==="Tab")Oa(e);else return!0;return t.key!=="Tab"&&t.preventDefault(),!0}function Ii(e){An(e.life,e.body,{active:()=>e.state.drawing!==null,cancel:()=>Oa(e)})}var Ti=`.${p}-column`,Ra=`.${p}-cell, .${p}-allday-cell`;function Mp(e,t){return t===e||e.matches(Ra)&&t.classList.contains(`${p}-events`)}function Np(e,t,n){let a=fe(e,t,n.y,{slot:!0});if(a===null)return null;let r=d(e.doc,"div",{className:`${p}-draft`,attrs:{"aria-hidden":"true"}});return t.append(r),{kind:"time",column:t,band:r,from:a,date:t.getAttribute("data-date"),range:null}}function Ep(e,t,n){let a=fe(e,t.column,n.y,{slot:!0});if(a===null)return;let r=Math.min(t.from,a),o=Math.min(e.state.hours.end*60,Math.max(t.from,a)+e.state.snap),{band:i}=t;i.style.setProperty("--calendar-top",String(r-e.state.hours.start*60)),i.style.setProperty("--calendar-length",String(o-r));let s=z(t.date);i.textContent=`${e.format.time.format(B(s,r))} – ${e.format.time.format(B(s,o))}`,t.range={date:t.date,start:B(s,r),end:B(s,o)}}function Dp(e,t){return{kind:"days",from:t.getAttribute("data-date"),range:null,lit:[]}}function Lp(e,t,n){let a=e.doc.elementFromPoint?.(n.x,n.y)?.closest?.("[data-date]")?.getAttribute("data-date")??t.from,[r,o]=[t.from,a].sort();for(let i of e.body.querySelectorAll(`${Ra}`)){let s=i.getAttribute("data-date");i.classList.toggle("is-range",s>=r&&s<=o)}t.range={date:r,start:z(r),end:A(z(o),1),allDay:!0}}function Cp(e,t){let n=e.state.creating;e.state.creating=null,n.band?.remove();for(let a of e.body.querySelectorAll(".is-range"))a.classList.remove("is-range");t!==null&&n.range&&e.callbacks.onPick({...n.range}),e.render()}function Mi(e){L(e.life,e.body,{selector:`${Ti}, ${Ra}`,canStart:(t,n)=>typeof e.callbacks.onPick=="function"&&!e.state.pending&&Mp(t,n.target),onStart(t,n){e.state.creating=t.matches(Ti)?Np(e,t,n):Dp(e,t)},onMove(t){let n=e.state.creating;n&&(n.kind==="time"?Ep(e,n,t):Lp(e,n,t))},onEnd(t){e.state.creating&&Cp(e,t)}})}var Fe=`.${p}-event`,Ni=`.${p}-day, .${p}-day-head`;function _a(e,t,n){let a=z(t);a&&(e.state.focusDate=a,e.callbacks.onPick?.(n?{date:t,start:n}:{date:t}))}function Op(e,t){if(e.state.pending)return;let n=t.target;if(pi(e,n))return;let a=n.closest?.(Fe);if(a){Ea(e,a.getAttribute("data-ui-id")),e.callbacks.onActivate?.(a.getAttribute("data-ui-id"));return}let r=n.closest?.(`.${p}-more`);if(r&&e.state.views.includes("day")){e.navigate("day",z(r.getAttribute("data-open-day")),{focus:!0});return}let o=n.closest?.(Ni);if(o){_a(e,o.getAttribute("data-date"));return}let i=n.closest?.(`.${p}-column`);if(i&&n===i){let c=fe(e,i,t.clientY),l=i.getAttribute("data-date");_a(e,l,c===null?void 0:B(z(l),c));return}let s=n.closest?.(`.${p}-cell, .${p}-allday-cell`);s&&(n===s||n.classList.contains(`${p}-events`))&&_a(e,s.getAttribute("data-date"))}function Rp(e,t){let{view:n,focusDate:a,weekStartsOn:r}=e.state,o=n==="month"?{ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}:{ArrowLeft:-1,ArrowRight:1};if(Object.hasOwn(o,t))return A(a,o[t]);if(t==="Home")return Ae(a,r);if(t==="End")return A(Ae(a,r),6);if(t!=="PageUp"&&t!=="PageDown")return null;let i=Dt(n,a,t==="PageUp"?-1:1);if(n!=="month")return i;let s=new Date(i.getFullYear(),i.getMonth()+1,0).getDate();return new Date(i.getFullYear(),i.getMonth(),Math.min(a.getDate(),s))}function Ba(e,t){if(!ut(e.state.view,e.state.anchor,e.state.weekStartsOn).some(a=>V(a,t))){e.navigate(e.state.view,t,{focus:!0});return}e.state.focusDate=t,e.focusAfter={day:!0},e.render()}function _p(e,t){let n=ut(e.state.view,e.state.anchor,e.state.weekStartsOn).some(a=>V(a,t));if(e.focusAfter={eventId:e.state.pending.id},n){e.render();return}e.navigate(e.state.view,t,{focus:!1}),e.focusAfter=null}function zp(e,{days:t=0,minutes:n=0}){let a=r=>r?lt(A(r,t),n):null;return{...e,start:a(e.start),end:a(e.end)}}function Ei(e,t,n){let a=G(e,t.getAttribute("data-ui-id"));if(!a?.movable)return!1;let r={start:a.start,end:a.end,allDay:a.allDay};return e.state.pending={id:a.id,keyboard:n,original:r,times:r,offset:0},n&&e.say(`Picked up ${a.title}. Arrow keys move it, Space drops it, Escape cancels.`),!0}function za(e,t){let n=e.state.pending;e.state.pending=null,e.focusAfter=n.keyboard?{eventId:n.id}:null;let a=n.times.start.getTime()!==n.original.start.getTime();t&&a?(e.callbacks.onMove?.(n.id,{...n.times}),e.say(`Moved to ${$e({...G(e,n.id),...n.times},e.format)}.`)):n.keyboard&&e.say(t?"Not moved.":"Move cancelled."),e.render()}function Bp(e,t){let n=e.state.pending,a=e.state.view!=="month"&&!X({...G(e,n.id),...n.times}),r=e.state.view==="month"?{days:7}:a?{minutes:e.state.snap}:null,o={ArrowLeft:{days:-1},ArrowRight:{days:1}};if(r&&(o.ArrowDown=r,o.ArrowUp={days:-(r.days??0),minutes:-(r.minutes??0)}),t.key===" "||t.key==="Enter")za(e,!0);else if(t.key==="Escape"||t.key==="Tab")za(e,!1);else if(Object.hasOwn(o,t.key))n.times=zp(n.times,o[t.key]),_p(e,n.times.start),e.say($e({...G(e,n.id),...n.times},e.format));else return;t.key!=="Tab"&&t.preventDefault()}function Pp(e,t){if(t.repeat&&(t.key===" "||t.key==="Enter")&&t.target.closest?.(Fe)){t.preventDefault();return}if(e.state.pending?.keyboard){Bp(e,t);return}if(e.state.drawing&&$i(e,t))return;let n=t.target.closest?.(Fe);if(n&&(gi(e,n,t)||Fp(e,n,t)))return;if(n&&t.key===" "){t.preventDefault(),Ei(e,n,!0)?(e.focusAfter={eventId:e.state.pending.id},e.render()):e.say("This event cannot be moved.");return}let a=t.target.closest?.(Ni);if(!a)return;if(!e.state.drawing&&kn(t)&&Ai(e,a)){t.preventDefault();return}e.state.focusDate=z(a.getAttribute("data-date"))??e.state.focusDate;let r=Rp(e,t.key);r&&(t.preventDefault(),Ba(e,r),Si(e))}function Hp(e,t){let n=e.doc.elementFromPoint?.(t.x,t.y),a=e.state.pending,r=n?.closest?.("[data-date]");if(!r||!e.body.contains(r))return null;let o=z(r.getAttribute("data-date")),i=a.original,s=A(i.start,dt(i.start,o)),c=n.closest(`.${p}-column`);if(c&&!X({...G(e,a.id),...i})){let u=fe(e,c,t.y);u!==null&&(s=B(o,Math.max(0,u-a.offset)))}let l=i.end?new Date(s.getTime()+(i.end-i.start)):null;return{...i,start:s,end:l}}function Up(e){L(e.life,e.body,{selector:`${Fe}[data-movable]`,canStart:(t,n)=>!e.state.pending&&!n.target.closest?.(`.${p}-event-handle`),onStart(t,n){if(!Ei(e,t,!1))return;let a=t.closest(`.${p}-column`),r=a?fe(e,a,n.y):null;e.state.pending.offset=r===null?0:r-Ue(e.state.pending.original.start),t.classList.add("is-grabbed")},onMove(t){let n=e.state.pending&&Hp(e,t);!n||n.start.getTime()===e.state.pending.times.start.getTime()||(e.state.pending.times=n,e.render())},onEnd(t){e.state.pending&&za(e,t!==null)}})}function Fp(e,t,n){if(typeof e.callbacks.onMenu!="function"||!(n.key==="ContextMenu"||n.key==="F10"&&n.shiftKey))return!1;n.preventDefault();let a=t.getBoundingClientRect();return e.callbacks.onMenu(t.getAttribute("data-ui-id"),{x:a.left,y:a.bottom}),!0}function Kp(e,t){let n=t.target.closest?.(Fe);!n||typeof e.callbacks.onMenu!="function"||(t.preventDefault(),e.callbacks.onMenu(n.getAttribute("data-ui-id"),{x:t.clientX,y:t.clientY}))}function jp(e,t){let n=t.target.closest?.(Fe);n&&!e.drawing&&!e.state.pending&&Ea(e,n.getAttribute("data-ui-id"))}function Di(e){e.life.on(e.body,"click",t=>Op(e,t)),e.life.on(e.body,"keydown",t=>Pp(e,t)),e.life.on(e.body,"contextmenu",t=>Kp(e,t)),e.life.on(e.body,"focusin",t=>jp(e,t)),e.life.on(e.body,"keyup",t=>{t.key===" "&&(t.target.closest?.(Fe)||e.spaceTaken)&&t.preventDefault(),t.key===" "&&(e.spaceTaken=!1)}),Ii(e),Up(e),bi(e),Mi(e),mi(e)}var Li=Object.freeze({previous:"Previous",next:"Next",today:"Today",allDay:"All day",views:"View",month:"Month",week:"Week",day:"Day",hours:"Hours",resized:"Now",hintNone:"Select an event to see what it can do",hintCreate:"drag across empty slots to add one",hintCreateDays:"drag across days to add one",hintOpen:"Enter opens",hintMove:"drag to move",hintResize:"drag the bottom edge to resize",hintKeys:"Alt+Shift+Up or Down resizes",hintDraw:"N on a day draws one",hintMore:"Shift+F10 or right-click for more",hintMoreHeld:gn,more:ot,hintDrawTime:"Up and Down move the time · Left and Right the day · Enter or Space starts the range · Escape cancels",hintDrawTimeEnd:"Up and Down set the end · Enter or Space adds the range · Escape cancels",hintDrawDays:"The arrows move the day · Enter or Space starts the range · Escape cancels",hintDrawDaysEnd:"The arrows set the end · Enter or Space adds the range · Escape cancels",drawStart:"Drawing a range: {when}.",drawAnchor:"Starts {when}.",drawn:"Range drawn: {range}.",drawCancelled:"No range drawn."});function Gp(e){let{doc:t,labels:n,life:a}=e,r=d(t,"div",{className:`${p}-toolbar`}),o=d(t,"div",{className:`${p}-nav`});o.append($(t,{className:`${p}-prev`,label:"‹",ariaLabel:n.previous,signal:a.signal,onClick:()=>e.shift(-1)}),$(t,{className:`${p}-today`,label:n.today,signal:a.signal,onClick:()=>e.navigate(e.state.view,T(new Date),{focus:!1})}),$(t,{className:`${p}-next`,label:"›",ariaLabel:n.next,signal:a.signal,onClick:()=>e.shift(1)}));let i=d(t,"h2",{className:`${p}-title`,attrs:{"aria-live":"polite"}});return e.titleText=x(t,i),e.viewGroup=d(t,"div",{className:`${p}-views`,attrs:{role:"group","aria-label":n.views}}),r.append(o,i,e.viewGroup),r}function qp(e){let{views:t}=e.state,n=e.viewGroup,a=Array.from(n.children,o=>o.getAttribute("data-view")).join()===t.join(),r=!a&&n.contains(e.doc.activeElement)?e.doc.activeElement.getAttribute("data-view"):null;a||n.replaceChildren(...t.map(o=>$(e.doc,{className:`${p}-view`,label:"",signal:e.life.signal,attrs:{"data-view":o},onClick:()=>e.navigate(o,e.state.focusDate,{focus:!1})})));for(let o of n.children){let i=o.getAttribute("data-view");h(o.firstChild,e.labels[i]??i),o.setAttribute("aria-pressed",String(i===e.state.view)),i===r&&o.focus({preventScroll:!0})}}function Wp(e){let t=I(e.state.focusDate),n=Array.from(e.body.querySelectorAll(`.${p}-day, .${p}-day-head`)),a=n.find(o=>o.getAttribute("data-date")===t)??n.find(o=>!o.closest(".is-outside"))??n[0];for(let o of n)o.setAttribute("tabindex",o===a?"0":"-1");let r=a?.getAttribute("data-date");for(let o of e.body.querySelectorAll(`.${p}-event, .${p}-more`))o.setAttribute("tabindex",o.closest("[data-date]")?.getAttribute("data-date")===r?"0":"-1")}function Vp(e){let t=e.doc.activeElement;return!t||!e.body.contains(t)?null:t.matches(`.${p}-event`)?{eventId:t.getAttribute("data-ui-id"),keep:!0}:t.matches(`.${p}-day, .${p}-day-head`)?{day:!0,keep:!0}:t.matches(`.${p}-scroller`)?{scroller:!0,keep:!0}:null}function Xp(e){let t=e.focusAfter;if(e.focusAfter=null,!t)return;let n=t.keep?{preventScroll:!0}:void 0;if(t.scroller){e.body.querySelector(`.${p}-scroller`)?.focus(n);return}let a=t.eventId?`.${p}-event`:`.${p}-day, .${p}-day-head`,r=Array.from(e.body.querySelectorAll(a)).find(o=>t.eventId?o.getAttribute("data-ui-id")===t.eventId:o.getAttribute("data-date")===I(e.state.focusDate));r&&(r.setAttribute("tabindex","0"),r.focus(n))}function Yp(e){let{state:t}=e;e.focusAfter===null&&(e.focusAfter=Vp(e));let n=e.more!==void 0&&e.doc.activeElement===e.more,a=ut(t.view,t.anchor,t.weekStartsOn);a.some(i=>V(i,t.focusDate))||(t.focusDate=T(t.view==="month"?t.anchor:a[0])),e.title=ci(t.view,a,e.format),h(e.titleText,e.title),qp(e);let r=t.pending,o=r?t.events.map(i=>i.id===r.id?{...i,...r.times}:i):t.events;return e.root.setAttribute("data-view",t.view),t.view==="month"?li(e,a,o):di(e,a,o),Ca(e),Wp(e),e.drawing=!0,Xp(e),e.drawing=!1,Ie(e),n&&e.more.focus({preventScroll:!0}),a}function Zp(e,t){let{state:n}=e;if(n.views=(Array.isArray(t.views)?t.views:Et).filter(s=>Et.includes(s)),n.views.length===0)throw new TypeError("Calendar needs at least one of month, week, day");t.view!==e.last.view&&n.views.includes(t.view)&&(n.view=t.view),n.views.includes(n.view)||(n.view=n.views[0]);let a=t.date===void 0?null:H(t.date);if(t.date!==void 0&&!a)throw new TypeError(`Calendar date is not a date: ${String(t.date)}`);a&&I(a)!==e.last.date&&(n.anchor=T(a),n.focusDate=n.anchor),e.last={view:t.view,date:a?I(a):e.last.date,selectedId:e.last.selectedId},n.events=oi(t.events??[]);let r=t.selectedId??null;r!==e.last.selectedId&&(e.last.selectedId=r,n.selectedId=r),n.weekStartsOn=Number.isInteger(t.weekStartsOn)?(t.weekStartsOn%7+7)%7:0,n.now=H(t.now)??new Date,n.snap=Number.isInteger(t.snapMinutes)&&t.snapMinutes>0&&t.snapMinutes<=240?t.snapMinutes:15;let o=Number.isInteger(t.hours?.start)?N(t.hours.start,0,23):0,i=Number.isInteger(t.hours?.end)?N(t.hours.end,1,24):24;n.hours=i>o?{start:o,end:i}:{start:0,end:24},(t.locale!==n.locale||!e.format)&&(n.locale=t.locale,e.format=si(t.locale)),e.root.setAttribute("aria-label",String(t.label??"Calendar"))}function Qp(e,t,n){let a=b(e),r=g(),o=d(a,"div",{className:p,attrs:{role:"region",[F]:!0}}),i=T(new Date),s={doc:a,life:r,root:o,callbacks:t,labels:{...Li,...n},format:null,last:{},focusAfter:null,state:{view:"month",anchor:i,focusDate:i,events:[],views:[...Et],pending:null,creating:null,drawing:null,selectedId:null}};return o.append(Gp(s)),s.hint=d(a,"p",{className:`${p}-hint`}),s.hintText=x(a,s.hint),o.append(s.hint),s.body=d(a,"div",{className:`${p}-body`}),o.append(s.body),s.region=he(o),s.say=c=>ge(s.region,c),s.render=()=>Yp(s),s}function Jp(e){let t=e.doc.defaultView?.ResizeObserver;if(typeof t!="function")return;let n=new t(()=>{!e.life.dead&&!e.pressing&&!e.state.pending&&!e.state.creating&&Ie(e)});n.observe(e.body),e.life.add(()=>n.disconnect())}function em(e,t={}){let n=Qp(e,t,t.labels);return v(n.doc),n.navigate=(a,r,{focus:o})=>{n.state.view=a,n.state.anchor=T(r),n.state.focusDate=T(r),o&&(n.focusAfter={day:!0});let i=n.render();t.onNavigate?.({view:a,date:I(n.state.anchor),start:i[0],end:A(i[i.length-1],1)})},n.shift=a=>n.navigate(n.state.view,Dt(n.state.view,n.state.anchor,a),{focus:!1}),Di(n),Jp(n),e.append(n.root),{update(a={}){n.life.dead||(Zp(n,a),!n.state.pending&&!n.state.creating&&n.render())},focusDay(a){let r=H(a);return n.life.dead||!r||n.state.pending||n.state.creating?!1:(Ba(n,T(r)),!0)},destroy(){n.life.destroy()&&n.root.remove()}}}var m="cloudcanvas-ui-timeline",_=Object.freeze({day:{perDay:64,pad:2},week:{perDay:20,pad:7},month:{perDay:5,pad:31}}),Ha=864e5,tm=Object.freeze(["success","warning","danger","muted"]),Pa=Object.freeze(["day","week","month"]);function nm(e){let{group:t}=e;if(t===null||typeof t!="object"){let a=typeof e.groupId=="string"&&e.groupId.trim()!==""?e.groupId:null;return{group:t?String(t):"",groupId:a,collapsed:!1}}let n=t.id??null;if(n!==null&&(typeof n!="string"||n.trim()===""))throw new TypeError(`Timeline item ${e.id} has a group with an invalid id: ${String(n)}`);return{group:String(t.label??n??""),groupId:n,collapsed:t.collapsed===!0}}function am(e){let t=e!==null&&typeof e=="object";return{status:String((t?e.label:e)??""),statusTone:t&&tm.includes(e.tone)?e.tone:""}}function rm(e){let t=Array.isArray(e.depends)?e.depends.filter(n=>typeof n=="string"&&n!==e.id):[];return[...new Set(t)]}function om(e,t){let n=H(e.start);if(!n)throw new TypeError(`Timeline item ${t} has no valid start`);let a=e.end===void 0||e.end===null?null:H(e.end);if(e.end!==void 0&&e.end!==null&&!a)throw new TypeError(`Timeline item ${t} has an invalid end`);let r=Number.isFinite(e.progress)?Math.min(1,Math.max(0,e.progress)):null;return{id:t,title:String(e.title??t),start:n,end:a&&a>n&&e.milestone!==!0?a:null,...nm(e),...am(e.status),depends:rm(e),tone:e.tone?String(e.tone):"",progress:r,movable:e.movable!==!1}}function Ci(e){if(!Array.isArray(e))throw new TypeError("Timeline items must be an array");let t=new Set;return e.map(n=>{let a=n?.id;if(typeof a!="string"||a.trim()===""||t.has(a))throw new TypeError(`Invalid or duplicate timeline id: ${String(a)}`);return t.add(a),om(n,a)})}function Ua(e,t,n){let{pad:a}=_[t],r=T(n),o=T(n);for(let i of e){i.start<r&&(r=T(i.start));let s=i.end??i.start;s>o&&(o=T(s))}return{start:A(r,-a),end:A(o,a+1)}}function In(e){return Math.round((e.end.getTime()-e.start.getTime())/Ha)}function P(e,t,n){return(e.getTime()-t.start.getTime())/Ha*_[n].perDay}function mt(e,t){return P(e.end,e,t)}var $n=20;function Ct(e,t,n){let a=P(e.start,t,n);if(!e.end)return{left:a,width:0,point:!0};let r=P(e.end,t,n)-a;return r<$n?{left:a,width:$n,point:!1,clamped:!0}:{left:a,width:r,point:!1}}function Oi(e,t,n=1){let a=[],r=t==="month"?xn(e.start):t==="week"?Ae(e.start,n):e.start;for(;r<e.end;)r>=e.start&&a.push(r),r=t==="month"?vn(r,1):A(r,t==="week"?7:1);return a}function Ot(e,t,n="move"){let a=n===!0?"end":n===!1?"move":n;if(a==="end"){let r=A(e.end??e.start,t);return{start:e.start,end:r>e.start?r:e.end??null}}if(a==="start"){let r=A(e.start,t);return e.end&&r<e.end?{start:r,end:e.end}:{start:e.start,end:e.end??null}}return{start:A(e.start,t),end:e.end?A(e.end,t):null}}function Ri(e,t){return Math.floor(e/_[t].perDay)}function _i(e,t){let n=Pa.indexOf(e)+t;return Pa[Math.max(0,Math.min(Pa.length-1,n))]}function pe(e,t,n){return new Date(t.start.getTime()+e/_[n].perDay*Ha)}var ht=64,zi=480,im=16,sm=64,cm=160,lm=96,Bi=`.${m}-gutter-handle`;function Fa(e){let t=e.sheet.clientWidth>0?e.sheet.clientWidth-lm:zi;return Math.max(ht,Math.min(zi,t))}function O(e){if(e.state.gutter!==null)return e.state.gutter;let t=e.gutterNode?.parentElement?.getBoundingClientRect().width??0;return t>0?t:cm}function Pi(e){let t=e.gutterNode;t&&(t.setAttribute("aria-valuenow",String(Math.round(O(e)))),t.setAttribute("aria-valuemax",String(Math.round(Fa(e)))))}function Rt(e,t){let n=Math.round(N(t,ht,Fa(e)));return e.state.gutter=n,e.root.style.setProperty("--timeline-gutter",`${n}px`),Pi(e),e.windowMoved?.(),n}function Hi(e){let t=d(e.doc,"div",{className:`${m}-gutter-handle`,attrs:{role:"separator","aria-orientation":"vertical",tabindex:"0","aria-label":e.labels.gutter,"aria-valuemin":ht,title:e.labels.gutter}});return e.gutterNode=t,e.root.setAttribute("data-can-gutter",""),Pi(e),t}function dm(e,t){if(!t.target.closest?.(Bi))return;let a=t.shiftKey?sm:im,r={ArrowLeft:O(e)-a,ArrowRight:O(e)+a,Home:ht,End:Fa(e)}[t.key];if(r===void 0)return;t.preventDefault();let o=O(e),i=Rt(e,r);i!==Math.round(o)&&e.callbacks.onGutter?.(i)}function Ui(e){let t=null;L(e.life,e.sheet,{selector:Bi,onStart(n,a){t={x:a.x,width:O(e)},n.classList.add("is-grabbed")},onMove(n){t&&Rt(e,t.width+n.x-t.x)},onEnd(n){e.gutterNode?.classList.remove("is-grabbed"),n===null&&t?Rt(e,t.width):t&&e.callbacks.onGutter?.(O(e)),t=null}}),e.life.on(e.sheet,"keydown",n=>dm(e,n))}var um=`.${m}-track`;function Ka(e,t,n){let a=Math.min(t,n),r=Math.abs(n-t)+1,o=A(e.domain.start,a);return{start:o,end:A(o,r),first:a,days:r}}function ja(e,t=`${m}-draft`){let n=d(e.doc,"div",{className:t,attrs:{"aria-hidden":"true"}});return n.append(d(e.doc,"span",{className:`${m}-draft-words`})),n}function Ga(e,t,n){let a=_[e.state.scale].perDay;t.style.setProperty("--timeline-x",`${n.first*a}px`),t.style.setProperty("--timeline-w",`${n.days*a}px`);let r=A(n.end,-1);t.firstChild.textContent=n.days===1?e.format.format(n.start):`${e.format.format(n.start)} – ${e.format.format(r)}`}function Fi(e,t,n){let a=Ri(n.x-t.track.getBoundingClientRect().left,e.state.scale);return Math.min(In(e.domain)-1,Math.max(0,a))}function fm(e,t,n){let a=Ka(e,t.from,Fi(e,t,n));Ga(e,t.band,a),t.span=a}function pm(e,t){let n=e.state.creating;e.state.creating=null,n.band.remove(),t!==null&&n.span&&e.callbacks.onCreate({groupId:n.groupId,start:n.span.start,end:n.span.end}),e.render()}function Ki(e){let t=n=>{e.state.creating&&fm(e,e.state.creating,n)};L(e.life,e.sheet,{selector:um,canStart:(n,a)=>typeof e.callbacks.onCreate=="function"&&!e.state.pending&&a.target===n,onStart(n,a){let r=ja(e);n.append(r),e.state.creating={track:n,band:r,groupId:n.getAttribute("data-group-id"),span:null,from:0},e.state.creating.from=Fi(e,e.state.creating,a),e.paint()},onMove(n){t(n),e.edge.follow(n,t)},onEnd(n){e.edge.stop(),e.state.creating&&pm(e,n)}})}var mm=56;function Tn({start:e,end:t},n){let a=T(t),r=t.getTime()===a.getTime()?A(t,-1):a;return r>T(e)?`${n(e)} to ${n(r)}`:n(e)}function qa(e,t){let n=c=>e.format.format(c),a=t.end?Tn(t,n):`${n(t.start)}, ${e.labels.milestone}`,r=t.end&&Ct(t,e.domain,e.state.scale).clamped?`, ${e.labels.clamped}`:"",o=t.status?`, ${t.status}`:"",i=t.progress===null?"":`, ${Math.round(t.progress*100)}% ${e.labels.done}`,s=t.depends.filter(c=>e.byId.has(c)).map(c=>e.byId.get(c).title);return`${t.title}, ${a}${r}${o}${i}${s.length?`, ${e.labels.dependsOn} ${s.join(", ")}`:""}`}function Mn(e,t){e.style.setProperty("--timeline-x",`${t.left}px`),e.style.setProperty("--timeline-w",`${t.width}px`)}function hm(e,t,n,a){let{doc:r}=e,o=qa(e,t),i=d(r,"button",{className:`${m}-bar`,attrs:{type:"button",tabindex:"-1","data-ui-id":t.id,title:o,"aria-label":o,"data-tone":t.tone||null,"data-status-tone":t.statusTone||null,"data-movable":t.movable?"true":null}});if(i.classList.toggle("is-point",n.point),i.classList.toggle("is-short",!n.point&&!a),i.classList.toggle("is-grabbed",e.state.pending?.id===t.id),Mn(i,n),t.progress!==null&&i.style.setProperty("--timeline-progress",String(t.progress)),a&&i.append(d(r,"span",{className:`${m}-bar-title`,text:t.title})),t.movable&&!n.point)for(let s of["handle-start","handle"])i.append(d(r,"span",{className:`${m}-${s}`,attrs:{"aria-hidden":"true"}}));return i}function gm(e,t,n){let a=d(e.doc,"span",{className:`${m}-outside`,text:t.title,attrs:{"aria-hidden":"true","data-ui-for":t.id}});return a.classList.toggle("is-point",n.point),Mn(a,n),a}var bm=88;function vm(e,t,n){let a=d(e.doc,"span",{className:`${m}-link`,attrs:{"aria-hidden":"true","data-link-from":t.id,title:e.labels.link}});return a.classList.toggle("is-point",n.point),a.classList.toggle("is-narrow",n.width<bm),Mn(a,n),a}function xm(e,t){let n=d(e.doc,"div",{className:`${m}-track`,attrs:{role:"gridcell","data-group-id":t.groupId}}),a=Ct(t,e.domain,e.state.scale),r=!a.point&&a.width>=mm;return n.append(hm(e,t,a,r)),typeof e.callbacks.onLink=="function"&&n.append(vm(e,t,a)),r||n.append(gm(e,t,a)),n}function ym(e,t){let n=t.group?2:1,a=d(e.doc,"div",{className:`${m}-row`,attrs:{role:"row","aria-level":n,"data-row-id":t.id}});return a.append(d(e.doc,"div",{className:`${m}-label`,text:t.title,attrs:{"aria-hidden":"true","data-ui-for":t.id,title:t.title}}),xm(e,t)),a}function wm(e,t){let n=t.collapsed?e.labels.expand:e.labels.collapse;return d(e.doc,"button",{className:`${m}-group-toggle`,attrs:{type:"button",tabindex:"-1","data-group-id":t.groupId,"aria-expanded":String(!t.collapsed),"aria-label":n.replace("{group}",t.group),title:n.replace("{group}",t.group)}})}function km(e,t){let n=e.state.items.filter(a=>a.groupId===t.groupId).length;return d(e.doc,"span",{className:`${m}-group-count`,text:n,attrs:{title:e.labels.hidden.replace("{count}",String(n))}})}function Am(e,t){return e.state.items.filter(n=>n.groupId===t.groupId&&(t.groupId!==null||n.group===t.group))}function Wa(e,t){let n=Am(e,t),a=new Date(Math.max(e.domain.start,Math.min(...n.map(i=>i.start)))),r=new Date(Math.min(e.domain.end,Math.max(...n.map(i=>i.end??i.start)))),o=P(a,e.domain,e.state.scale);return{left:o,width:Math.max($n,P(r,e.domain,e.state.scale)-o),count:n.length}}function Sm(e,t){let n=Wa(e,t),a=(n.count===1?e.labels.summaryOne:e.labels.summary).replace("{group}",t.group).replace("{count}",String(n.count)),r=d(e.doc,"span",{className:`${m}-summary`,attrs:{"aria-hidden":"true",title:a,"data-ui-for":t.groupId}});return r.append(d(e.doc,"span",{className:`${m}-summary-title`,text:a})),Mn(r,n),r}function $m(e,t){let n=d(e.doc,"div",{className:`${m}-track`,attrs:{role:"gridcell","aria-hidden":"true","data-group-id":t.groupId}});return t.collapsed&&n.append(Sm(e,t)),n}function Im(e,t){let n=d(e.doc,"div",{className:`${m}-group`,attrs:{role:"row","aria-level":1}}),a=d(e.doc,"div",{className:`${m}-group-cell`,attrs:{role:"gridcell"}});return n.append(a),(typeof e.callbacks.onCreate=="function"||t.collapsed)&&n.append($m(e,t)),t.groupId===null?(a.textContent=t.group,n):(a.append(d(e.doc,"button",{className:`${m}-group-label`,text:t.group,attrs:{type:"button","data-ui-id":t.groupId}})),typeof e.callbacks.onToggleGroup!="function"||(n.setAttribute("aria-expanded",String(!t.collapsed)),a.append(wm(e,t)),t.collapsed&&a.append(km(e,t))),n)}var Tm=(e,t)=>!t||e.group!==t.group||e.groupId!==t.groupId;function ji(e,t){let n=d(e.doc,"div",{className:`${m}-rows`,attrs:{role:"treegrid","aria-label":e.root.getAttribute("aria-label")}}),a=null;for(let r of t)Tm(r,a)&&r.group&&n.append(Im(e,r)),a=r,r.collapsed||n.append(ym(e,r));return n}function Gi(e){let t=d(e.doc,"div",{className:`${m}-axis`}),n=d(e.doc,"div",{className:`${m}-corner`});n.append(Hi(e));let a=d(e.doc,"div",{className:`${m}-ticks`,attrs:{"aria-hidden":"true"}}),r=e.tickFormats[e.state.scale];for(let o of Oi(e.domain,e.state.scale)){let i=d(e.doc,"div",{className:`${m}-tick`,text:r.format(o)});i.style.setProperty("--timeline-x",`${P(o,e.domain,e.state.scale)}px`),a.append(i)}return t.append(n,a),t}var qi=7,Mm=44;function Va(e){return Math.max(0,O(e)+mt(e.domain,e.state.scale)-(e.sheet.clientWidth||0))}function Vi(e,t,[n,a],r){return r&&a-n<=t?(n+a)/2-t/2:n<e||r&&a-n>t?n:a-t}var Nm=(e,t,n)=>n?Math.min(Math.max(e,Mm),t/4):0;function Nn(e,t,n,{centre:a=!1}={}){let{sheet:r}=e,o=(r.clientWidth||0)-O(e),i=r.scrollLeft,s=Nm(n-t,o,a);return!(o>0)||!e.domain||t-s>=i&&n+s<=i+o?!1:(r.scrollLeft=N(Vi(i,o,[t,n],a),0,Va(e)),e.windowMoved(),r.scrollLeft!==i)}function En(e,t,{centre:n=!1}={}){let{sheet:a}=e,r=a.clientHeight||0,o=t?.getBoundingClientRect();if(!(r>0)||!o||!(o.height>0))return;let i=a.querySelector(`.${m}-axis`)?.getBoundingClientRect().height||0,s=a.scrollTop,c=o.top-a.getBoundingClientRect().top+s,l=r-i;c>=s+i&&c+o.height<=s+r||(a.scrollTop=Math.max(0,Vi(s,l,[c-i,c+o.height-i],n)))}function Wi(e,t,n){return Array.from(e.sheet.querySelectorAll(`.${m}-${t}`)).find(a=>a.getAttribute("data-ui-id")===n)??null}function Xi(e,t){let n=e.byId.get(t)??null,a=n&&Wi(e,"bar",t);if(a){let{left:l,width:u,point:f}=Ct(n,e.domain,e.state.scale);return Nn(e,f?l-qi:l,f?l+qi:l+u,{centre:!0}),En(e,a.closest(`.${m}-row`),{centre:!0}),!0}let r=n?n.groupId:t,o=e.state.items.find(l=>l.groupId===r),i=r!==null&&o?Wi(e,"group-label",r)?.closest(`.${m}-group`):null;if(!i)return!1;let{left:s,width:c}=Wa(e,o);return Nn(e,s,s+c,{centre:!0}),En(e,i,{centre:!0}),!0}var Dn=`.${m}-track`,Em=864e5;function Ln(e,t){let n=t.parentElement,a=n?.getAttribute("data-row-id");if(a)return e.byId.get(a)?.group||e.labels.noGroup;let r=n?.querySelector(`.${m}-group-cell`);return(r?.querySelector(`.${m}-group-label`)??r)?.textContent||e.labels.noGroup}function Ya(e){let t=new Map;return Array.from(e.sheet.querySelectorAll(Dn),n=>{let a=n.parentElement?.getAttribute("data-row-id");if(a)return{track:n,key:`item ${a}`};let r=`heading ${n.getAttribute("data-group-id")??""} ${Ln(e,n)}`;return t.set(r,(t.get(r)??0)+1),{track:n,key:`${r} ${t.get(r)}`}})}function Dm(e){let t=e.end??A(T(e.start),1);return T(t).getTime()===t.getTime()?t:A(T(t),1)}function Xa(e,t){return N(Math.round((T(t).getTime()-e.domain.start.getTime())/Em),0,In(e.domain)-1)}function Lm(e,t){let n=t.days===1?e.labels.oneDay:e.labels.days.replace("{count}",String(t.days));return`${Tn(t,a=>e.format.format(a))}, ${n}`}function gt(e){let t=e.state.cursor,n=t&&Ya(e).find(o=>o.key===t.key);if(!n)return t&&Za(e),null;let a=Xa(e,t.at);t.at=A(e.domain.start,a);let r=Ka(e,t.anchor?Xa(e,t.anchor):a,a);return t.band?.parentElement!==n.track&&(t.band?.remove(),t.band=ja(e,`${m}-draft is-keyboard`),n.track.append(t.band)),Ga(e,t.band,r),{span:r,track:n.track}}function Yi(e,t){let n=_[e.state.scale].perDay,a=Xa(e,e.state.cursor.at)*n;Nn(e,a,a+n),En(e,t.parentElement)}function Zi(e){e.state.cursor.band?.remove(),e.state.cursor=null,e.paint()}function Za(e){e.state.cursor&&(Zi(e),e.say(e.labels.drawCancelled))}function Qi(e,t){if(typeof e.callbacks.onCreate!="function"||e.busy())return!1;let n=t.closest(Dn)??t.closest(`.${m}-group`)?.querySelector(Dn),a=n&&Ya(e).find(s=>s.track===n);if(!a)return!1;let r=t.closest(Dn)?e.byId.get(t.getAttribute("data-ui-id")):null,o=r?Dm(r):T(e.state.now);e.state.cursor={key:a.key,at:o,anchor:null,band:null},gt(e),Yi(e,n),e.paint();let i=e.labels.drawStart.replace("{group}",Ln(e,n)).replace("{date}",e.format.format(e.state.cursor.at));return e.say(`${i} ${ft(e.labels.hintDrawing)}`),!0}function Ji(e,{row:t=!1}={}){let n=gt(e);if(!n)return;let a=e.state.cursor;Yi(e,n.track);let r=a.anchor?Lm(e,n.span):e.format.format(a.at);e.say(t?`${Ln(e,n.track)}: ${r}`:r)}function Cm(e,t){let n=e.state.cursor,a=Ya(e),r=a.findIndex(o=>o.key===n.key);n.key=a[N(r+t,0,a.length-1)].key,Ji(e,{row:!0})}function Om(e){let t=e.state.cursor;if(!t.anchor){t.anchor=t.at,gt(e),e.paint(),e.say(`${e.labels.drawAnchor.replace("{date}",e.format.format(t.at))} ${ft(e.labels.hintSpanning)}`);return}let n=gt(e);if(!n)return;let{span:a,track:r}=n,o=Ln(e,r);Zi(e),e.callbacks.onCreate({groupId:r.getAttribute("data-group-id"),start:a.start,end:a.end}),e.say(e.labels.drawn.replace("{range}",Tn(a,i=>e.format.format(i))).replace("{group}",o))}function es(e,t){let n={ArrowLeft:-1,ArrowRight:1}[t.key],a={ArrowUp:-1,ArrowDown:1}[t.key];if((t.key===" "||t.key==="Enter")&&t.repeat){t.preventDefault();return}if(n!==void 0)e.state.cursor.at=A(e.state.cursor.at,n),Ji(e);else if(a!==void 0)Cm(e,a);else if(t.key===" "||t.key==="Enter")e.spaceTaken=t.key===" ",Om(e);else if(t.key==="Escape"||t.key==="Tab")Za(e);else return;t.key!=="Tab"&&t.preventDefault()}function ts(e){let t=e.state.cursor;return t?t.anchor?e.labels.hintSpanning:e.labels.hintDrawing:null}function ns(e){An(e.life,e.sheet,{active:()=>e.state.cursor!==null,cancel:()=>Za(e)})}var Ke=48,Rm=16,_m=24,zm=250,Bm=64;function as(e,t){let{sheet:n}=e,a=n.getBoundingClientRect().left+O(e),r=n.getBoundingClientRect().left+(n.clientWidth||0);return r-a>2*Ke?t<a+Ke?-Math.min(1,(a+Ke-t)/Ke):t>r-Ke?Math.min(1,(t-r+Ke)/Ke):0:0}function Pm(e,t,n){if(!n)return Math.sign(t)*Math.max(1,Math.round(_m*Math.abs(t)));let{perDay:a}=_[e.state.scale];return Math.sign(t)*a*Math.max(1,Math.round(Bm/a))}function rs(e){let t={point:null,onScroll:null,cancel:null},n=()=>Ne()?zm:Rm,a=()=>{t.cancel=null;let r=t.point?as(e,t.point.x):0;if(r===0)return;let o=e.sheet.scrollLeft;e.sheet.scrollLeft=N(o+Pm(e,r,Ne()),0,Va(e)),e.sheet.scrollLeft!==o&&(t.onScroll(t.point),e.windowMoved(),t.cancel=e.life.later(a,n()))};e.edge={follow(r,o){Object.assign(t,{point:r,onScroll:o}),t.cancel===null&&as(e,r.x)!==0&&(t.cancel=e.life.later(a,n()))},stop(){t.cancel?.(),Object.assign(t,{point:null,onScroll:null,cancel:null})}}}var K=`.${m}-bar`,Hm=`.${m}-handle`,Um=`.${m}-handle-start`;function Y(e){return Array.from(e.sheet.querySelectorAll(K))}function Cn(e,t){return e.state.items.find(n=>n.id===t)??null}function Fm(e){return e?.closest?.(Um)?"start":e?.closest?.(Hm)?"end":"move"}function is(e,t,{keyboard:n,mode:a}){let r=Cn(e,t);if(!r?.movable)return!1;let o={start:r.start,end:r.end};return e.state.pending={id:t,keyboard:n,mode:a,original:o,times:o,days:0,domain:e.domain},n&&e.say(e.labels.pickedUp.replace("{title}",r.title)),!0}var os=(e,t)=>(e?.getTime()??null)===(t?.getTime()??null);function Qa(e,t){let n=e.state.pending;e.state.pending=null,e.focusAfter=n.keyboard;let a=!os(n.times.start,n.original.start)||!os(n.times.end,n.original.end);t&&a?(e.callbacks.onChange?.(n.id,{...n.times}),e.say(`${e.labels.moved}: ${e.describe({...Cn(e,n.id),...n.times})}.`)):n.keyboard&&e.say(t?e.labels.notMoved:e.labels.cancelled),e.render()}function Km(e,t,n){let a=e.state.pending;a.times=Ot(a.times,t,n),e.focusAfter=!0,e.render(),e.say(e.describe({...Cn(e,a.id),...a.times}))}function ss(e,t){if(t.repeat&&(t.key===" "||t.key==="Enter"))return!0;if(t.key==="ArrowLeft"||t.key==="ArrowRight")Km(e,t.key==="ArrowRight"?1:-1,t.shiftKey?"end":"move");else if(t.key===" "||t.key==="Enter")Qa(e,!0);else if(t.key==="Escape"||t.key==="Tab")Qa(e,!1);else return!1;return t.key!=="Tab"&&t.preventDefault(),!0}function cs(e,t){return is(e,t.getAttribute("data-ui-id"),{keyboard:!0,mode:"move"})?(e.focusAfter=!0,e.render(),!0):!1}function ls(e,t,n){e.callbacks.onChange?.(t,n),e.say(`${e.labels.moved}: ${e.describe({...Cn(e,t),...n})}.`)}function jm(e,t){let n=e.state.pending;if(!n)return;let a=t.x-n.originX+e.sheet.scrollLeft-n.originScroll,r=Math.round(a/_[e.state.scale].perDay);r!==n.days&&(n.days=r,n.times=Ot(n.original,r,n.mode),e.render())}function ds(e){let t=n=>jm(e,n);L(e.life,e.sheet,{selector:`${K}[data-movable]`,canStart:()=>!e.state.pending,onStart(n,a,r){is(e,n.getAttribute("data-ui-id"),{keyboard:!1,mode:Fm(r)})&&Object.assign(e.state.pending,{originX:a.x,originScroll:e.sheet.scrollLeft})},onMove(n){t(n),e.state.pending&&e.edge.follow(n,t)},onEnd(n){e.edge.stop(),e.state.pending&&Qa(e,n!==null)}})}function Gm(e,t){let{labels:n,callbacks:a}=e,r=!!a.onChange&&t.movable;return[a.onActivate&&n.hintOpen,r&&n.hintMove,r&&t.end&&n.hintResize,r&&n.hintKeys,a.onLink&&n.hintLink,a.onDelete&&n.hintDelete,a.onMenu&&(e.crowded===t.id?n.hintMoreHeld:n.hintMore),a.onCreate&&n.hintDraw]}function qm(e,t){let{labels:n,callbacks:a}=e,r=!!a.onToggleGroup&&e.groups.has(t);return[a.onActivate&&n.hintOpen,a.onAdd&&n.hintAdd,r&&n.hintFold,a.onMenu&&n.hintMore,a.onCreate&&n.hintDraw]}function Wm(e){let{labels:t,callbacks:n}=e;return[t.hintNone,n.onCreate&&t.hintCreate,n.onMenu&&t.hintMore,n.onCreate&&t.hintDraw]}function us(e){let{selectedId:t}=e.state,n=ts(e);if(n!==null)return n;let a=Wm(e);return e.byId.has(t)?a=Gm(e,e.byId.get(t)):e.groups.has(t)&&(a=qm(e,t)),a.filter(Boolean).join(" · ")}var Vm=Object.freeze(["--timeline-x","--timeline-w"]),fs=`${m}-row`;function ps(e,t){let n=e.more!==void 0&&e.doc.activeElement===e.more;e.more?.remove(),n&&t?.focus({preventScroll:!0})}function Xm(e,t){return!t.classList.contains("is-point")&&!bn(t.getBoundingClientRect().width,e.more.getBoundingClientRect().width)}function ms(e){let t=e.state.selectedId,n=t!==null&&typeof e.callbacks.onMenu=="function"&&!e.busy()?Y(e).find(r=>r.getAttribute("data-ui-id")===t):null;e.crowded=null;for(let r of e.sheet.querySelectorAll(`.${fs}.is-crowded`))r.classList.remove("is-crowded");if(!n){ps(e,null);return}e.more??=it(e.doc,`${m}-more`),st(e.more,e.labels.more,e.byId.get(t).title),e.more.setAttribute("data-more-for",t),e.more.classList.toggle("is-point",n.classList.contains("is-point"));for(let r of Vm)e.more.style.setProperty(r,n.style.getPropertyValue(r));let a=n.parentElement;e.more.parentElement!==a&&a.append(e.more),Xm(e,n)&&(e.crowded=t,n.closest(`.${fs}`)?.classList.add("is-crowded"),ps(e,n))}function hs(e,t){if(!ne(t))return!1;let n=t.closest(`.${oe}`);return e.callbacks.onMenu?.(n.getAttribute("data-more-for"),ct(n)),!0}function On(e){let{selectedId:t}=e.state;for(let a of e.sheet.querySelectorAll(`.${m}-bar, .${m}-group-label`))Z(a,a.getAttribute("data-ui-id")===t);for(let a of e.sheet.querySelectorAll(`.${m}-row`))a.classList.toggle("is-current",a.getAttribute("data-row-id")===t);ms(e);let n=us(e);h(e.hintText,n),e.hint.hidden=n===""}function _t(e,t){let{state:n}=e;n.selectedId!==t&&(n.selectedId=t,On(e))}var Ja=`.${m}-group-label`;function Ym(e){return Array.from(e.sheet.querySelectorAll(`${K}, ${Ja}`))}function gs(e,t){let n=t.getAttribute("data-ui-id");t.matches(K)&&(e.state.focusId=n,C(Y(e),t)),t.focus(),_t(e,n)}function Zm(e,t,n){let a=Ym(e),r=a.indexOf(t),o={ArrowUp:r-1,ArrowDown:r+1,Home:0,End:a.length-1}[n.key];return o===void 0?!1:(n.preventDefault(),gs(e,a[Math.max(0,Math.min(a.length-1,o))]),!0)}function Qm(e,t,n){let a={ArrowLeft:-1,ArrowRight:1}[n.key];if(a===void 0)return!1;n.preventDefault();let r=Y(e),o=c=>e.byId.get(c.getAttribute("data-ui-id")).start.getTime(),i=[...r].sort((c,l)=>o(c)-o(l)||r.indexOf(c)-r.indexOf(l)),s=i[Math.max(0,Math.min(i.length-1,i.indexOf(t)+a))];return gs(e,s),!0}function Jm(e,t,n){let a={ArrowLeft:-1,ArrowRight:1}[n.key];if(!n.altKey||a===void 0||typeof e.callbacks.onChange!="function")return!1;n.preventDefault();let r=e.byId.get(t.getAttribute("data-ui-id"));if(!r.movable)return!0;let o=n.shiftKey;return o&&!r.end||ls(e,r.id,Ot({start:r.start,end:r.end},a,o?"end":"move")),!0}function eh(e){let t=e.getBoundingClientRect();return{x:t.left,y:t.bottom}}function th(e,t,n){let a=e.callbacks,r=t.getAttribute("data-ui-id"),o=t.matches(K),i=o?e.byId.get(r).groupId:r;return n.key==="ContextMenu"||n.key==="F10"&&n.shiftKey?a.onMenu?()=>a.onMenu(r,eh(t)):null:n.key==="Enter"?o&&a.onActivate?()=>a.onActivate(r):null:n.key==="+"||n.key==="Insert"?a.onAdd&&i!==null?()=>a.onAdd(i):null:(n.key==="Delete"||n.key==="Backspace")&&o&&a.onDelete?()=>a.onDelete(r):null}function nh(e,t,n){let a=t.getAttribute("data-ui-id"),r=e.groups.get(a)===!0,o={" ":!r,ArrowLeft:r?null:!0,ArrowRight:r?!1:null}[n.key];return o===void 0||typeof e.callbacks.onToggleGroup!="function"?!1:(n.preventDefault(),o!==null&&e.fold(a,o),!0)}function ah(e,t,n){let a=t.matches(K);if(!a&&nh(e,t,n)||Zm(e,t,n)||a&&Jm(e,t,n)||a&&!n.altKey&&Qm(e,t,n))return;let r=th(e,t,n);r&&(n.preventDefault(),r())}function rh(e,t){if(e.state.cursor){es(e,t);return}let n=t.target.closest?.(`${K}, ${Ja}`);if(n){if(e.state.pending?.keyboard){ss(e,t);return}if(kn(t)&&Qi(e,n)){t.preventDefault();return}if(t.key===" "&&n.matches(K)){t.preventDefault(),t.repeat||cs(e,n);return}ah(e,n,t)}}function bs(e){e.life.on(e.sheet,"keydown",t=>rh(e,t)),e.life.on(e.sheet,"keyup",t=>{let n=t.target.closest?.(`${K}, ${Ja}`);t.key===" "&&n&&(n.matches(K)||e.callbacks.onToggleGroup||e.spaceTaken)&&t.preventDefault(),t.key===" "&&(e.spaceTaken=!1)})}var oh=`${m}-links`,er=12;function ih(e,t){if(t.x-e.x>=2*er)return`M${e.x} ${e.y} H${Math.round((e.x+t.x)/2)} V${t.y} H${t.x}`;let n=Math.round((e.y+t.y)/2);return`M${e.x} ${e.y} H${e.x+er} V${n} H${t.x-er} V${t.y} H${t.x}`}function vs(e,t){let n=t.getBoundingClientRect(),a=Math.round(n.top-e.top+n.height/2);return{end:{x:Math.round(n.right-e.left),y:a},start:{x:Math.round(n.left-e.left),y:a}}}function sh(e,t){return e.state.items.flatMap(n=>n.depends.filter(a=>t.has(a)&&t.has(n.id)).map(a=>[a,n.id]))}function ch(e,[t,n],a){let r=k(e.doc,"g",{class:`${m}-connector`,"data-from":t,"data-to":n});return r.append(k(e.doc,"path",{class:`${m}-connector-line`,d:ih(a.get(t).end,a.get(n).start),"marker-end":`url(#${e.id}-arrow)`})),r}function lh(e){let t=k(e.doc,"marker",{id:`${e.id}-arrow`,viewBox:"0 0 10 10",refX:10,refY:5,markerWidth:7,markerHeight:7,orient:"auto"});t.append(k(e.doc,"path",{d:"M0,0 L10,5 L0,10 z",class:`${m}-arrow`}));let n=k(e.doc,"defs",{});return n.append(t),n}function xs(e){return e.links=k(e.doc,"svg",{class:oh,width:1,height:1,"aria-hidden":"true"}),e.links}function ys(e){let t=e.links.getBoundingClientRect(),n=new Map(Y(e).map(a=>[a.getAttribute("data-ui-id"),vs(t,a)]));e.links.replaceChildren(lh(e),...sh(e,n).map(a=>ch(e,a,n)))}function dh(e,t,n){let a=ie(e.doc.elementFromPoint?.(t.x,t.y));return a!==null&&a!==n&&Y(e).some(r=>r.getAttribute("data-ui-id")===a)?a:null}function ws(e,t){for(let n of Y(e))n.classList.toggle("is-drop-target",n.getAttribute("data-ui-id")===t)}function uh(e,t,n){let a=e.links.getBoundingClientRect();t.draft.setAttribute("d",`M${t.from.x} ${t.from.y} L${Math.round(n.x-a.left)} ${Math.round(n.y-a.top)}`)}function fh(e,t){let n=t.getAttribute("data-link-from"),a=Y(e).find(i=>i.getAttribute("data-ui-id")===n),r=vs(e.links.getBoundingClientRect(),a).end,o=k(e.doc,"path",{class:`${m}-draft-link`,d:`M${r.x} ${r.y}`});e.links.append(o),e.state.linking={fromId:n,from:r,draft:o,target:null},e.paint()}function ph(e,t){let{fromId:n,draft:a,target:r}=e.state.linking;e.state.linking=null,a.remove(),ws(e,null),e.state.focusId=n,e.focusAfter="keep",t!==null&&r&&e.callbacks.onLink(n,r),e.render()}function ks(e){L(e.life,e.sheet,{selector:`.${m}-link`,canStart:()=>typeof e.callbacks.onLink=="function"&&!e.state.pending&&!e.state.creating,onStart(t){fh(e,t)},onMove(t){let n=e.state.linking;n&&(uh(e,n,t),n.target=dh(e,t,n.fromId),ws(e,n.target))},onEnd(t){e.state.linking&&ph(e,t)}})}var bt=3660,mh=14,hh=e=>Math.max(0,e.sheet.clientWidth-ht);function tr(e){e.reach.room=Math.max(e.reach.room,hh(e));let{room:t}=e.reach;return t===0?0:Math.max(mh,Math.ceil(t/_[e.state.scale].perDay))}function nr(e){let{reach:t,state:n}=e,a=Ua(n.items,n.scale,n.now),r=tr(e);return{start:A(a.start,-Math.max(t.before,r)),end:A(a.end,Math.max(t.after,r)),home:a.start}}function As(e,t){let{reach:n,state:a}=e,r=Ua(a.items,a.scale,a.now),o=tr(e);n.before=Math.min(bt,Math.max(n.before,dt(t,r.start)+o)),n.after=Math.min(bt,Math.max(n.after,dt(r.end,t)+2*o))}function Ss(e){return e.domain?{date:pe(e.sheet.scrollLeft,e.domain,e.domainScale),scale:e.domainScale,start:e.domain.start}:null}function $s(e,t){let{domain:n,state:a}=e;e.domainScale=a.scale,t===null?e.sheet.scrollLeft=P(n.home??n.start,n,a.scale):t.scale===a.scale&&t.start.getTime()!==n.start.getTime()&&(e.sheet.scrollLeft=P(t.date,n,a.scale))}function gh(e){let{reach:t,state:n}=e,a=Math.max(0,e.sheet.clientWidth-O(e)),r=e.sheet.scrollLeft,o=mt(e.domain,n.scale)-r-a;return{before:r<a/2&&t.before<bt,after:o<a/2&&t.after<bt}}function bh(e){if(!e.domain||e.busy()||e.drawing)return;let{before:t,after:n}=gh(e);if(!t&&!n)return;let a=tr(e);t&&(e.reach.before=Math.min(bt,Math.max(e.reach.before,a)+a)),n&&(e.reach.after=Math.min(bt,Math.max(e.reach.after,a)+a)),e.render()}function Is(e){if(!e.domain||e.busy()||e.drawing)return;let t=nr(e);(t.start.getTime()!==e.domain.start.getTime()||t.end.getTime()!==e.domain.end.getTime())&&e.render()}function Ts(e){e.life.on(e.sheet,"scroll",()=>bh(e))}var zt=e=>typeof e.sheet.getClientRects!="function"||e.sheet.getClientRects().length>0;function Ms(e){return e.domain?{date:pe(e.sheet.scrollLeft,e.domain,e.domainScale),top:e.sheet.scrollTop}:null}function ar(e){e.domain&&zt(e)&&(e.held=Ms(e))}function Ns(e){let t=e.asked??(zt(e)?Ms(e):e.held);return t&&{date:new Date(t.date.getTime()),top:t.top??e.sheet.scrollTop}}function Es(e,t,n){let a=H(t);return a?(e.asked={date:a,top:Number.isFinite(n)?n:null},e.domain&&!e.busy()&&e.render(),!0):!1}function Ds(e){let{asked:t}=e,n=e.away?e.held:null;return Object.assign(e,{asked:null,away:!1}),t?(As(e,t.date),t):n}function Ls(e,t){e.sheet.scrollLeft=Math.max(0,P(t.date,e.domain,e.state.scale)),t.top!==null&&(e.sheet.scrollTop=t.top)}function Cs(e){!e.life.dead&&e.away&&zt(e)&&!e.busy()&&e.render()}function Os(e){e.away=!0;let t=e.doc.defaultView?.requestAnimationFrame;e.looking||typeof t!="function"||(e.looking=!0,t(()=>{e.looking=!1,Cs(e)}))}function vh(e){Cs(e),Is(e),e.windowMoved()}function Rs(e){e.life.on(e.sheet,"scroll",()=>ar(e));let t=e.doc.defaultView?.ResizeObserver;if(typeof t!="function")return;let n=new t(()=>vh(e));n.observe(e.sheet),e.life.add(()=>n.disconnect())}var xh=150;function _s(e){let{sheet:t,domain:n,state:a}=e,r=(t.clientWidth||0)-O(e);if(!n||r<=0)return null;let o=Math.max(0,t.scrollLeft);return{from:pe(o,n,a.scale),to:pe(o+r-1,n,a.scale)}}function yh(e){let t=_s(e);return t&&{from:I(t.from),to:I(t.to)}}function wh(e){let t=_s(e);h(e.rangeText,t?`${e.format.format(t.from)} – ${e.format.format(t.to)}`:"")}function kh(e,t){let n=yh(e);n===null||t.last&&t.last.from===n.from&&t.last.to===n.to||(t.last=n,e.callbacks.onWindow(n))}function zs(e){let t={last:null,cancel:()=>{}},n=typeof e.callbacks.onWindow=="function";e.windowMoved=()=>{wh(e),n&&(t.cancel(),t.cancel=e.life.later(()=>kh(e,t),t.last===null?0:xh))},e.life.on(e.sheet,"scroll",()=>e.windowMoved())}var Ah=50,Sh=300,rr=1.5;function Bs(e,t){let{sheet:n}=e,a=O(e),r=Math.max(a,t);return{date:pe(r+n.scrollLeft-a,e.domain,e.state.scale),gutter:a,offset:r}}var $h=(e,t)=>Bs(e,t-e.sheet.getBoundingClientRect().left),Ih=e=>Bs(e,O(e)+Math.max(0,(e.sheet.clientWidth||0)-O(e))/2);function Th(e,t){let n=P(t.date,e.domain,e.state.scale);e.sheet.scrollLeft=Math.max(0,t.gutter+n-t.offset)}function Ps(e,t,n){e.state.scale=t,e.render(),Th(e,n),e.windowMoved(),e.callbacks.onScale?.(t)}function Hs(e,t,n){let a=_i(e.state.scale,t);a===e.state.scale||e.busy()||Ps(e,a,$h(e,n))}function Mh(e){let t=0,n=()=>{};e.life.on(e.sheet,"wheel",a=>{if(!(!a.ctrlKey&&!a.metaKey)){if(a.preventDefault(),t+=Kt(a,e.sheet.getBoundingClientRect().height).dy,n(),Math.abs(t)>=Ah){let r=t<0?-1:1;t=0,Hs(e,r,a.clientX);return}n=e.life.later(()=>{t=0},Sh)}},{passive:!1})}var or=e=>Math.abs(e[0].x-e[1].x),Nh=e=>(e[0].x+e[1].x)/2;function Eh(e){let t=new Map,n=0;e.life.on(e.sheet,"pointerdown",r=>{r.pointerType==="touch"&&(t.set(r.pointerId,{x:r.clientX}),t.size===2&&(n=Math.max(1,or([...t.values()]))))}),e.life.on(e.sheet,"pointermove",r=>{if(!t.has(r.pointerId)||(t.set(r.pointerId,{x:r.clientX}),t.size!==2))return;let o=[...t.values()],i=Math.max(1,or(o))/n;i<rr&&i>1/rr||(n=Math.max(1,or(o)),Hs(e,i>=rr?-1:1,Nh(o)))});let a=r=>t.delete(r.pointerId);e.life.on(e.sheet,"pointerup",a),e.life.on(e.sheet,"pointercancel",a)}function Us(e){e.setScale=t=>Ps(e,t,Ih(e)),Mh(e),Eh(e)}function Dh(e){let t=Y(e),n=r=>t.find(o=>o.getAttribute("data-ui-id")===r),a=n(e.state.focusId)??n(e.state.selectedId)??t[0]??null;e.state.focusId=a?.getAttribute("data-ui-id")??null,C(t,a),e.focusAfter&&a&&a.focus(e.focusAfter==="keep"?{preventScroll:!0}:void 0),e.focusAfter=!1}var Fs=Object.freeze({summary:!0}),Ks=e=>e.classList.contains(`${m}-summary`);function Lh(e,t){if(hs(e,t.target))return;let n=t.target.closest?.(`.${m}-group-toggle`);if(n){e.fold(n.getAttribute("data-group-id"),n.getAttribute("aria-expanded")==="true");return}let a=Xe(t.target,e.sheet);if(!a||e.state.pending)return;let r=ie(a);_t(e,r),Ks(a)?e.callbacks.onActivate?.(r,Fs):e.callbacks.onActivate?.(r)}function Ch(e,t){let n=t.target.closest?.(`${K}, .${m}-group-label`);if(!n||e.state.pending||e.drawing)return;let a=n.getAttribute("data-ui-id");n.matches(K)&&(e.state.focusId=a),_t(e,a)}function Oh(e,t){let n=Xe(t.target,e.sheet);if(!n||typeof e.callbacks.onMenu!="function")return;t.preventDefault();let a={x:t.clientX,y:t.clientY};Ks(n)?e.callbacks.onMenu(ie(n),a,Fs):e.callbacks.onMenu(ie(n),a)}function js(e){e.writeTabStops=()=>Dh(e),e.fold=(t,n)=>e.callbacks.onToggleGroup?.(t,n),e.life.on(e.sheet,"click",t=>Lh(e,t)),e.life.on(e.sheet,"contextmenu",t=>Oh(e,t)),e.life.on(e.sheet,"focusin",t=>Ch(e,t)),ns(e),rs(e),bs(e),ds(e),Ki(e),ks(e),Ui(e),Us(e),Ts(e),Rs(e),zs(e)}var Gs=Object.freeze({scale:"Zoom",day:"Days",week:"Weeks",month:"Months",today:"Today",done:"done",milestone:"milestone",gutter:"Resize the title column",moved:"Moved",notMoved:"Not moved.",cancelled:"Move cancelled.",pickedUp:"Picked up {title}. Left and Right move it a day, Shift resizes, Space drops it, Escape cancels.",hintNone:"Select a bar to see what it can do",hintCreate:"drag on a row to add one",hintOpen:"Enter opens",hintMove:"drag to move",hintResize:"drag an edge to resize",hintKeys:"Alt+arrows move a day, Alt+Shift+arrows resize",hintLink:"drag the dot to link",hintDelete:"Delete removes",hintAdd:"+ or Insert to add one here",hintFold:"Space folds",hintMore:"Shift+F10 or right-click for more",hintMoreHeld:gn,more:ot,clamped:"shown wider than it lasts",link:"Drag to another bar to link them",dependsOn:"depends on",collapse:"Collapse {group}",expand:"Expand {group}",hidden:"{count} hidden",summary:"{group}, {count} items",summaryOne:"{group}, 1 item",hintDraw:"N draws a span",hintDrawing:"Left and Right move the day · Up and Down the row · Enter or Space starts the span · Escape cancels",hintSpanning:"Left and Right set the end · Enter or Space adds the span · Escape cancels",drawStart:"Drawing a span in {group}: {date}.",drawAnchor:"Starts {date}.",drawn:"Span drawn: {range}, {group}.",drawCancelled:"No span drawn.",days:"{count} days",oneDay:"1 day",noGroup:"no group"});function Rh(e){let t=d(e.doc,"div",{className:`${m}-toolbar`});e.scaleGroup=d(e.doc,"div",{className:`${m}-scales`,attrs:{role:"group","aria-label":e.labels.scale}});let n=$(e.doc,{className:`${m}-today`,label:e.labels.today,signal:e.life.signal,onClick:()=>e.scrollToNow()}),a=d(e.doc,"span",{className:`${m}-range`});return e.rangeText=x(e.doc,a),t.append(e.scaleGroup,n,a),t}function _h(e){e.scaleGroup.firstChild||e.scaleGroup.append(...Object.keys(_).map(t=>$(e.doc,{className:`${m}-scale`,label:"",signal:e.life.signal,attrs:{"data-scale":t},onClick:()=>e.setScale(t)})));for(let t of e.scaleGroup.children){let n=t.getAttribute("data-scale");h(t.firstChild,e.labels[n]),t.setAttribute("aria-pressed",String(n===e.state.scale))}}function zh(e){let t=e.sheet.contains(e.doc.activeElement)?e.doc.activeElement:null;return{bar:!!t?.closest(`.${m}-bar`),gutter:!!t?.closest(`.${m}-gutter-handle`),more:!!t?.closest(`.${oe}`),groupId:t?.closest(`.${m}-group-label`)?.getAttribute("data-ui-id")??null}}function Bh(e,t){return t===null?null:Array.from(e.sheet.querySelectorAll(`.${m}-group-label`)).find(n=>n.getAttribute("data-ui-id")===t)??null}function Ph(e){let{pending:t}=e;return t?e.items.map(n=>n.id===t.id?{...n,...t.times}:n):e.items}function Hh(e,t){let{state:n}=e,a=d(e.doc,"div",{className:`${m}-grid`});a.style.setProperty("--timeline-width",`${mt(e.domain,n.scale)}px`);let r=d(e.doc,"div",{className:`${m}-now`,attrs:{"aria-hidden":"true"}});return r.style.setProperty("--timeline-x",`${P(n.now,e.domain,n.scale)}px`),a.append(Gi(e),xs(e),ji(e,t),r),a}function Uh(e){if(!zt(e)){Os(e);return}let{state:t}=e,n=Ss(e),a=Ds(e);e.domain=t.pending?.domain??nr(e);let r=zh(e);e.drawing=!0,e.sheet.replaceChildren(Hh(e,Ph(t))),$s(e,n),a&&Ls(e,a),ys(e),gt(e);let o=Bh(e,r.groupId);!e.focusAfter&&!o&&(r.bar||r.groupId!==null)&&(e.focusAfter="keep"),_h(e),e.writeTabStops(),On(e),o?.focus({preventScroll:!0}),r.more&&e.more?.focus({preventScroll:!0}),r.gutter&&e.gutterNode?.focus({preventScroll:!0}),e.drawing=!1,e.reveal!==null&&!e.busy()&&Xi(e,e.reveal)&&(e.reveal=null),e.windowMoved(),ar(e)}function Fh(e,t){e.locale=t,e.format=new Intl.DateTimeFormat(t,{month:"short",day:"numeric"}),e.tickFormats={day:new Intl.DateTimeFormat(t,{weekday:"short",day:"numeric"}),week:e.format,month:new Intl.DateTimeFormat(t,{month:"short",year:"numeric"})}}function Kh(e,t){let{seen:n,state:a}=e,r=t.selectedId??null;r!==n.selectedId&&(n.selectedId=r,a.selectedId=r);let o=Number.isFinite(t.gutter)?t.gutter:null;o!==n.gutter&&(n.gutter=o,o!==null&&Rt(e,o));let i=t.focusId??null;i!==n.focusId&&(n.focusId=i,i!==null&&(e.reveal=i,a.focusId=i))}function jh(e,t){let{state:n}=e;t.scale!==e.lastScale&&Object.hasOwn(_,t.scale)&&(n.scale=t.scale),e.lastScale=t.scale,n.items=Ci(t.items??[]),e.byId=new Map(n.items.map(a=>[a.id,a])),e.groups=new Map(n.items.filter(a=>a.groupId!==null).map(a=>[a.groupId,a.collapsed])),n.now=H(t.now)??new Date,(t.locale!==e.locale||!e.format)&&Fh(e,t.locale),e.root.setAttribute("aria-label",String(t.label??"Timeline")),Kh(e,t)}function Gh(e,t){for(let[n,a]of[["data-can-move","onChange"],["data-can-create","onCreate"],["data-can-link","onLink"],["data-can-fold","onToggleGroup"],["data-can-menu","onMenu"]])typeof t[a]=="function"&&e.setAttribute(n,"")}function qh(e,t,n,a){return{doc:e,life:t,root:n,callbacks:a,id:M(m),labels:{...Gs,...a.labels},format:null,lastScale:void 0,byId:new Map,groups:new Map,seen:{selectedId:void 0,gutter:void 0,focusId:void 0},reach:{before:0,after:0,room:0},reveal:null,asked:null,held:null,away:!1,looking:!1,state:{scale:"week",items:[],now:new Date,pending:null,creating:null,linking:null,cursor:null,focusId:null,selectedId:null,gutter:null}}}function Wh(e,t={}){let n=b(e);v(n);let a=g(),r=d(n,"div",{className:m,attrs:{role:"region",[F]:!0}});Gh(r,t);let o=qh(n,a,r,t);return r.append(Rh(o)),o.hint=d(n,"p",{className:`${m}-hint`}),o.hintText=x(n,o.hint),o.sheet=d(n,"div",{className:`${m}-sheet`}),r.append(o.hint,o.sheet),o.region=he(r),o.say=i=>ge(o.region,i),o.render=()=>Uh(o),o.paint=()=>On(o),o.busy=()=>!!(o.state.pending||o.state.creating||o.state.linking),o.describe=i=>qa(o,i),o.scrollToNow=()=>{let i=P(o.state.now,o.domain,o.state.scale);o.sheet.scrollLeft=Math.max(0,i-o.sheet.clientWidth/2)},js(o),e.append(r),{update(i={}){a.dead||(jh(o,i),o.busy()||o.render())},visibleStart:()=>Ns(o),scrollToDate:(i,{top:s}={})=>!a.dead&&Es(o,i,s),destroy(){a.destroy()&&r.remove()}}}var Vh=Object.freeze(["parent","related","depends-on"]),je=e=>e==null?"":String(e);function Xh(e){return typeof e=="string"?e.trim()===""?null:{iso:"",text:e,title:""}:!e||typeof e!="object"||!e.text?null:{iso:je(e.iso),text:String(e.text),title:je(e.title??e.iso)}}function Yh(e,t){let n=e?.id;if(typeof n!="string"||n.trim()===""||t.has(n))throw new TypeError(`Invalid or duplicate graph node id: ${String(n)}`);t.add(n);let a=Number(e.childCount);return{id:n,label:je(e.label??n),detail:je(e.detail),status:je(e.status),tone:je(e.tone),time:Xh(e.time),childCount:Number.isInteger(a)&&a>0?a:null,collapsed:!!e.collapsed}}function qs(e,t){if(!Array.isArray(e)||!Array.isArray(t))throw new TypeError("Graph nodes and edges must be arrays");let n=new Set,a=e.map(o=>Yh(o,n)),r=[];return t.forEach((o,i)=>{if(!n.has(o?.from)||!n.has(o?.to)||o.from===o.to)return;let s=Vh.includes(o.kind)?o.kind:"related";r.push({id:String(o.id??`${o.from}->${o.to}#${i}`),from:o.from,to:o.to,kind:s,label:je(o.label)})}),{nodes:a,edges:r}}function Zh(e,t){let n=new Map(e.map((a,r)=>[a.id,r]));for(let a of e){let r=[],o=new Set,i=a.id;for(;t.has(i)&&!o.has(i);)o.add(i),r.push(i),i=t.get(i);if(!o.has(i))continue;let s=r.slice(r.indexOf(i));t.delete(s.reduce((c,l)=>n.get(l)<n.get(c)?l:c))}}function Rn(e,t){let n=new Map;for(let o of t)o.kind==="parent"&&!n.has(o.to)&&n.set(o.to,o.from);Zh(e,n);let a=new Map(e.map(o=>[o.id,[]])),r=[];for(let o of e)(n.has(o.id)?a.get(n.get(o.id)):r).push(o.id);return{parent:n,children:a,roots:r}}function Ws(e){let t=[],n=(a,r,o)=>a.forEach((i,s)=>{t.push({id:i,level:r,position:s+1,size:a.length,parentId:o}),n(e.children.get(i),r+1,i)});return n(e.roots,1,null),t}function sr(e){let t=new Map,n=0,a=(r,o)=>{let i=e.children.get(r);for(let c of i)a(c,o+1);let s=i.length===0?n:(t.get(i[0]).y+t.get(i.at(-1)).y)/2;i.length===0&&(n+=84),t.set(r,{x:o*288,y:s})};return e.roots.forEach((r,o)=>{o>0&&(n+=28),a(r,0)}),t}function Qh(e,t){return sr(Rn(e,t))}var ir=e=>Math.round(e*10)/10;function Vs(e,t){let n=e.y+34,a=t.y+68/2;if(t.x>=e.x+208){let o=Math.max(24,(t.x-e.x-208)/2);return[{x:e.x+208,y:n},{x:e.x+208+o,y:n},{x:t.x-o,y:a},{x:t.x,y:a}]}if(t.x+208<=e.x){let o=Math.max(24,(e.x-t.x-208)/2);return[{x:e.x,y:n},{x:e.x-o,y:n},{x:t.x+208+o,y:a},{x:t.x+208,y:a}]}let r=Math.max(e.x,t.x)+208+40+Math.abs(a-n)/4;return[{x:e.x+208,y:n},{x:r,y:n},{x:r,y:a},{x:t.x+208,y:a}]}function cr(e,t,n){let[a,r,o,i]=Vs(e,t),s=1-n,c=l=>ir(s*s*s*a[l]+3*s*s*n*r[l]+3*s*n*n*o[l]+n*n*n*i[l]);return{x:c("x"),y:c("y")}}function Xs(e,t){let[n,a,r,o]=Vs(e,t).map(i=>({x:ir(i.x),y:ir(i.y)}));return{d:`M${n.x} ${n.y} C${a.x} ${a.y} ${r.x} ${r.y} ${o.x} ${o.y}`,mid:cr(e,t,.5)}}function Bt(e){let t=[...e.values()];if(t.length===0)return null;let n=t.map(r=>r.x),a=t.map(r=>r.y);return{left:Math.min(...n),top:Math.min(...a),right:Math.max(...n)+208,bottom:Math.max(...a)+68}}function Ys(e,t,n){if(e===null||!t.children.has(e))return null;let a=new Set([e]);for(let o=t.parent.get(e);o!==void 0;o=t.parent.get(o))a.add(o);let r=new Set(a);for(let o of n)o.from===e&&r.add(o.to),o.to===e&&r.add(o.from);return{path:a,lit:r}}function Zs(e,t,n){return e.from===t||e.to===t?!0:e.kind==="parent"&&n.path.has(e.from)&&n.path.has(e.to)}function Qs(e,t,n,a){if(a==="Home")return t[0]?.id??null;if(a==="End")return t.at(-1)?.id??null;let r=e.parent.get(n);if(a==="ArrowLeft")return r??null;if(a==="ArrowRight")return e.children.get(n)?.[0]??null;let o=r===void 0?e.roots:e.children.get(r),i={ArrowUp:-1,ArrowDown:1}[a];return i===void 0?null:o[o.indexOf(n)+i]??null}var Jh=e=>({width:Math.ceil(e.length*6.6)+8,height:16}),eg=(e,t)=>Math.max(0,Math.min(e.x+e.width/2,t.x+t.width/2)-Math.max(e.x-e.width/2,t.x-t.width/2)+2)*Math.max(0,Math.min(e.y+e.height/2,t.y+t.height/2)-Math.max(e.y-e.height/2,t.y-t.height/2)+2),tg=Array.from({length:Math.round(11.999999999999998)*2+1},(e,t)=>t===0?0:(t%2===1?1:-1)*Math.ceil(t/2)*.025);function Js(e){let t=[];for(let{text:n,at:a}of e){let r=Jh(n),o=tg.map(s=>({...a(.5+s),...r})),i=s=>t.reduce((c,l)=>c+eg(s,l),0);t.push(o.find(s=>i(s)===0)??o.reduce((s,c)=>i(c)<i(s)?c:s))}return t}var vt="cloudcanvas-ui-graph";function ng(e){let t=k(e.doc,"marker",{id:e.markerId,viewBox:"0 0 10 10",refX:10,refY:5,markerWidth:7,markerHeight:7,orient:"auto-start-reverse"});t.append(k(e.doc,"path",{d:"M0,0 L10,5 L0,10 z",class:`${vt}-arrow`}));let n=k(e.doc,"defs",{});return n.append(t),n}function ag(e,t,n){if(n&&!Zs(t,e.state.selectedId,n))return!0;let a=r=>e.byId.get(r)?.label??"";return!ee(a(t.from),e.state.query)&&!ee(a(t.to),e.state.query)}function rg(e,t,n){let a=e.positions.get(t.from),r=e.positions.get(t.to);if(!a||!r)return null;let{d:o}=Xs(a,r),i=ag(e,t,n)?" is-dim":"",s=k(e.doc,"path",{d:o,class:`${vt}-edge is-${t.kind}${i}`,"data-kind":t.kind});return t.kind==="depends-on"&&s.setAttribute("marker-end",`url(#${e.markerId})`),{path:s,label:t.label?{text:t.label,dim:i,at:c=>cr(a,r,c)}:null}}function og(e,{text:t,dim:n},a){let r=k(e.doc,"g",{class:`${vt}-edge-label${n}`});r.append(k(e.doc,"rect",{class:`${vt}-edge-label-back`,x:a.x-a.width/2,y:a.y-a.height/2,width:a.width,height:a.height,rx:4}));let o=k(e.doc,"text",{class:`${vt}-edge-label-text`,x:a.x,y:a.y,"text-anchor":"middle","dominant-baseline":"central"});return o.textContent=t,r.append(o),r}function _n(e,t){let n=e.state.edges.map(o=>rg(e,o,t)).filter(Boolean),a=n.map(o=>o.label).filter(Boolean),r=Js(a);e.chips=r,e.svg.replaceChildren(ng(e),...n.map(o=>o.path),...a.map((o,i)=>og(e,o,r[i])))}function lr(e,t,n){if(n===null){e.draft?.remove(),e.draft=null;return}let a=e.positions.get(t),r=a.x+208,o=a.y+68/2,i=Math.round(Math.max(24,Math.abs(n.x-r)/2));e.draft||(e.draft=k(e.doc,"path",{class:`${vt}-draft`}),e.overlay.append(e.draft)),e.draft.setAttribute("d",`M${r} ${o} C${r+i} ${o} ${Math.round(n.x-i)} ${Math.round(n.y)} ${Math.round(n.x)} ${Math.round(n.y)}`)}var Ge="cloudcanvas-ui-graph",Pt=`${Ge}-node`,Ht=`${Ge}-toggle`,zn=`${Ge}-handle`;function ec(e){let t=d(e,"div",{className:Pt,attrs:{role:"treeitem",tabindex:"-1"}}),n=d(e,"span",{className:`${Ge}-node-meta`,attrs:{"aria-hidden":"true"}});return n.append(d(e,"span",{className:`${Ge}-status`}),d(e,"time",{className:`${Ge}-time`}),d(e,"span",{className:Ht})),t.append(d(e,"span",{className:`${Ge}-node-label`,attrs:{"aria-hidden":"true"}}),n,d(e,"span",{className:zn,attrs:{"aria-hidden":"true"}})),t}function ig(e,t){return(t===1?e.child:e.children).replace("{count}",String(t))}function sg(e,t){let n=r=>e.byId.get(r)?.label??r,a={dependsOn:[],neededBy:[],relatedTo:[]};for(let r of e.state.edges){if(r.kind==="parent"||r.from!==t&&r.to!==t)continue;let o=r.from===t?r.to:r.from;r.kind==="related"?a.relatedTo.push(n(o)):a[r.from===t?"dependsOn":"neededBy"].push(n(o))}return Object.entries(a).filter(([,r])=>r.length>0).map(([r,o])=>`${e.labels[r]} ${o.join(", ")}`)}function cg(e,t,n){return[...[t.label,t.detail,t.status,t.time?.text,n>0?ig(e.labels,n):""].filter(Boolean),...sg(e,t.id)].join("; ")}function tc(e,t){e.textContent=t,e.hidden=t===""}function lg(e,t){e.textContent=t?.text??"",e.hidden=!t;for(let[n,a]of[["datetime",t?.iso],["title",t?.title]])a?e.setAttribute(n,a):e.removeAttribute(n)}function dg(e,t,n,a){tc(t,a>0?String(a):""),t.setAttribute("title",n.collapsed?e.labels.expand:e.labels.collapse)}function ug(e,t,n,a){e.setAttribute("aria-level",String(t.level)),e.setAttribute("aria-posinset",String(t.position)),e.setAttribute("aria-setsize",String(t.size)),a>0?e.setAttribute("aria-expanded",String(!n.collapsed)):e.removeAttribute("aria-expanded")}function dr(e,t){e.style.setProperty("--graph-x",`${t.x}px`),e.style.setProperty("--graph-y",`${t.y}px`),e.style.setProperty("width",`${208}px`),e.style.setProperty("height",`${68}px`)}function nc(e,t,n){let a=e.byId.get(n.id),r=e.countOf(n.id),[o,i,s]=t.children,[c,l,u]=i.children;t.setAttribute("data-ui-id",a.id),t.setAttribute("title",a.label),t.setAttribute("aria-label",cg(e,a,r)),ug(t,n,a,r),a.tone?t.setAttribute("data-tone",a.tone):t.removeAttribute("data-tone"),o.textContent=a.label,tc(c,a.status),lg(l,a.time),dg(e,u,a,r),s.setAttribute("title",e.labels.link),dr(t,e.positions.get(n.id))}var fg=new Set(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Home","End"]);function ur(e,t,n){return!e.callbacks.onToggle||e.countOf(t)===0?!1:(e.callbacks.onToggle(t,n),!0)}function pg(e,t,n){let a=e.countOf(t)>0&&!e.byId.get(t).collapsed;if(n==="ArrowRight"&&!a&&ur(e,t,!1)||n==="ArrowLeft"&&a&&ur(e,t,!0))return;let r=Qs(e.forest,e.rows,t,n);r!==null&&e.select(r,{focus:!0})}function mg(e){let t=e.getBoundingClientRect();return{x:t.left,y:t.bottom}}function hg(e,t,n,a){let r=e.callbacks;return n.key==="ContextMenu"||n.key==="F10"&&n.shiftKey?r.onMenu?()=>r.onMenu(t,mg(a)):null:n.key==="Enter"?r.onActivate?()=>r.onActivate(t):null:n.key==="+"||n.key==="Insert"?r.onAdd?()=>r.onAdd(t):null:n.key==="Delete"||n.key==="Backspace"?r.onDelete?()=>r.onDelete(t):null:n.key===" "?r.onToggle?()=>ur(e,t,!e.byId.get(t).collapsed):null:n.key==="/"?()=>{e.search.focus(),e.search.select?.()}:n.key==="0"?()=>e.fit({report:!0}):null}function ac(e,t){let n=t.target.closest?.(`.${Pt}`);if(!n||!e.nodeLayer.contains(n)||ne(t.target)||t.altKey||t.ctrlKey||t.metaKey)return;let a=n.getAttribute("data-ui-id");if(!e.byId.has(a))return;if(fg.has(t.key)){t.preventDefault(),pg(e,a,t.key);return}let r=hg(e,a,t,n);r&&(t.preventDefault(),r())}var rc="cloudcanvas-ui-graph";function gg(e,t){return Array.from(e.nodeLayer.children).find(n=>n.getAttribute("data-ui-id")===t)??null}function Bn(e){let t=e.state.selectedId,n=t!==null&&typeof e.callbacks.onMenu=="function"&&e.drag===null?gg(e,t):null;if(!n){e.more?.remove();return}e.more??=it(e.doc,`${rc}-more`),st(e.more,e.labels.more,e.byId.get(t).label),e.more.parentElement!==n&&n.append(e.more)}function oc(e,t){if(!ne(t))return!1;let n=t.closest(`.${rc}-node`);return e.callbacks.onMenu?.(n.getAttribute("data-ui-id"),ct(t.closest(`.${oe}`))),!0}var qe=`.${Pt}`,bg=".cloudcanvas-ui-graph-minimap";function fr(e,t){return!t.closest?.(qe)||t.closest(`.${Ht}`)||ne(t)?null:t.closest(`.${zn}`)?e.callbacks.onConnect?"link":null:e.callbacks.onDropOn?"move":null}function vg(e,t){let n=e.viewport.getBoundingClientRect();return{x:(t.x-n.left-e.view.x)/e.view.k,y:(t.y-n.top-e.view.y)/e.view.k}}function xg(e,t,n){let a=e.doc.elementFromPoint?.(n.x,n.y)?.closest?.(qe)??null;return a&&e.nodeLayer.contains(a)&&a!==t.element?a:null}function yg(e,t,n,a){let r=t.getAttribute("data-ui-id");e.drag={mode:a,id:r,element:t,press:n,origin:{...e.positions.get(r)},target:null},a==="move"&&t.classList.add("is-dragging"),Bn(e)}function wg(e,t){let n=e.drag;if(n.mode==="move"){let a={x:n.origin.x+(t.x-n.press.x)/e.view.k,y:n.origin.y+(t.y-n.press.y)/e.view.k};e.positions.set(n.id,a),dr(n.element,a),_n(e,e.emphasis)}else lr(e,n.id,vg(e,t));tt(n,xg(e,n,t))}function kg(e,t){let{mode:n,id:a,element:r,target:o}=e.drag;if(tt(e.drag,null),e.drag=null,r.classList.remove("is-dragging"),lr(e,a,null),e.render(),!t||!o)return;let i=o.getAttribute("data-ui-id");n==="move"?e.callbacks.onDropOn(a,i):e.callbacks.onConnect(a,i)}function Ag(e){L(e.life,e.viewport,{selector:qe,canStart:(t,n)=>!e.drag&&fr(e,n.target)!==null,onStart:(t,n,a)=>yg(e,t,n,fr(e,a)),onMove:t=>{e.drag&&wg(e,t)},onEnd:t=>{e.drag&&kg(e,t)}})}var sc=(e,t)=>({x:(e.x+t.x)/2,y:(e.y+t.y)/2}),pr=(e,t)=>Math.hypot(e.x-t.x,e.y-t.y);function Sg(e,t,n){let a=[...n.values()],r=e.viewport.getBoundingClientRect();if(a.length===1)e.view={...t.view,x:t.view.x+a[0].x-t.at.x,y:t.view.y+a[0].y-t.at.y};else{let o=sc(a[0],a[1]),i={x:(t.at.x-r.left-t.view.x)/t.view.k,y:(t.at.y-r.top-t.view.y)/t.view.k},s=e.clampScale(t.view.k*pr(a[0],a[1])/t.span);e.view={k:s,x:o.x-r.left-i.x*s,y:o.y-r.top-i.y*s}}e.fitted=!0,e.applyView({report:!0})}function ic(e,t){let n=[...t.values()].slice(0,2);return{at:n.length===2?sc(n[0],n[1]):n[0],view:{...e.view},span:n.length===2?Math.max(1,pr(n[0],n[1])):1}}var $g=4;function Ig(e){e.panned=!0,e.life.later(()=>{e.panned=!1},0)}function Tg(e,t){try{e.viewport.setPointerCapture?.(t)}catch{}}function Mg(e){let t=new Map,n=null;e.life.on(e.viewport,"pointerdown",r=>{let o=r.target;r.button!==0||e.drag||o.closest?.(bg)||t.size>=2||o.closest?.(qe)&&(fr(e,o)!==null||o.closest(`.${Ht}`)||ne(o))||(t.set(r.pointerId,{x:r.clientX,y:r.clientY}),n={...ic(e,t),moved:t.size>1})}),e.life.on(e.viewport,"pointermove",r=>{if(!(!t.has(r.pointerId)||e.drag)&&(t.set(r.pointerId,{x:r.clientX,y:r.clientY}),!n.moved&&pr(n.at,{x:r.clientX,y:r.clientY})>$g&&(n.moved=!0),!!n.moved)){for(let o of t.keys())Tg(e,o);e.viewport.classList.add("is-panning"),Sg(e,n,t)}});let a=r=>{t.delete(r.pointerId)&&(n?.moved&&Ig(e),n=t.size>0?{...ic(e,t),moved:!0}:null,n||e.viewport.classList.remove("is-panning"))};e.life.on(e.viewport,"pointerup",a),e.life.on(e.viewport,"pointercancel",a)}function Ng(e){e.life.on(e.viewport,"wheel",t=>{t.preventDefault();let n=e.viewport.getBoundingClientRect(),{dx:a,dy:r}=Kt(t,n.height),o=t.ctrlKey||t.metaKey;if(o||yr(t)){e.zoomAt(wr(r,o?vr:xr),{x:t.clientX,y:t.clientY});return}e.view={...e.view,x:e.view.x-a,y:e.view.y-r},e.fitted=!0,e.applyView({report:!0})},{passive:!1})}function Eg(e,t){if(oc(e,t.target))return;let n=t.target.closest?.(qe);if(!n||!e.nodeLayer.contains(n)||!e.byId.has(n.getAttribute("data-ui-id")))return;let a=n.getAttribute("data-ui-id");if(!e.panned){if(t.target.closest(`.${Ht}`)){e.callbacks.onToggle&&e.countOf(a)>0&&e.callbacks.onToggle(a,!e.byId.get(a).collapsed);return}t.target.closest(`.${zn}`)||(e.select(a,{focus:!1}),e.callbacks.onActivate?.(a))}}function Dg(e,t){let n=t.target.closest?.(qe);!e.callbacks.onMenu||!n||!e.nodeLayer.contains(n)||(t.preventDefault(),e.callbacks.onMenu(n.getAttribute("data-ui-id"),{x:t.clientX,y:t.clientY}))}function cc(e){e.life.on(e.viewport,"click",t=>Eg(e,t)),e.life.on(e.viewport,"contextmenu",t=>Dg(e,t)),e.life.on(e.viewport,"keydown",t=>ac(e,t)),e.life.on(e.viewport,"focusin",t=>{let n=t.target.closest?.(qe);n&&e.nodeLayer.contains(n)&&(e.state.focusId=n.getAttribute("data-ui-id"))}),Mg(e),Ng(e),Ag(e)}var Pn="cloudcanvas-ui-graph-minimap",Hn=40;function Lg(e,t,n){let{x:a,y:r,k:o}=e.view;return t.left*o+a>=0&&t.top*o+r>=0&&t.right*o+a<=n.width&&t.bottom*o+r<=n.height}function Cg(e,t){let n=e.element.getBoundingClientRect(),{box:a}=e,r=a.right-a.left,o=a.bottom-a.top,i=Math.min(n.width/r,n.height/o);if(!(i>0))return null;let s=n.left+(n.width-r*i)/2,c=n.top+(n.height-o*i)/2;return{x:a.left+(t.clientX-s)/i,y:a.top+(t.clientY-c)/i}}function lc(e,t,n){let a=t.box?Cg(t,n):null,r=e.viewport.getBoundingClientRect();if(!a)return;let{k:o}=e.view;e.view={k:o,x:r.width/2-a.x*o,y:r.height/2-a.y*o},e.fitted=!0,e.applyView({report:!0})}function Og(e,t){let n=null;e.life.on(t.element,"pointerdown",r=>{if(r.button===0){r.preventDefault(),n=r.pointerId;try{t.element.setPointerCapture?.(r.pointerId)}catch{}lc(e,t,r)}}),e.life.on(t.element,"pointermove",r=>{r.pointerId===n&&lc(e,t,r)});let a=r=>{r.pointerId===n&&(n=null)};e.life.on(t.element,"pointerup",a),e.life.on(t.element,"pointercancel",a)}function dc(e){let t=d(e.doc,"div",{className:Pn,attrs:{"aria-hidden":"true"}}),n=k(e.doc,"svg",{class:`${Pn}-picture`,preserveAspectRatio:"xMidYMid meet"}),a=k(e.doc,"g",{}),r=k(e.doc,"rect",{class:`${Pn}-view`});n.append(a,r),t.append(n),t.hidden=!0;let o={element:t,box:null};return o.drawNodes=()=>{let i=Bt(e.positions??new Map);o.box=i&&{left:i.left-Hn,top:i.top-Hn,right:i.right+Hn,bottom:i.bottom+Hn},o.box&&n.setAttribute("viewBox",`${o.box.left} ${o.box.top} ${o.box.right-o.box.left} ${o.box.bottom-o.box.top}`),a.replaceChildren(...[...e.positions??new Map].map(([s,c])=>k(e.doc,"rect",{x:c.x,y:c.y,width:208,height:68,rx:8,class:`${Pn}-node${s===e.state.selectedId?" is-selected":""}`})))},o.drawView=()=>{let i=e.viewport.getBoundingClientRect(),s=Bt(e.positions??new Map);if(t.hidden=!s||!(i.width>0)||!(i.height>0)||Lg(e,s,i),t.hidden)return;let{x:c,y:l,k:u}=e.view,f=o.box,w=Math.max(f.left,-c/u),S=Math.max(f.top,-l/u),E={x:w,y:S,width:Math.min(f.right,(i.width-c)/u)-w,height:Math.min(f.bottom,(i.height-l)/u)-S};r.setAttribute("visibility",E.width>0&&E.height>0?"visible":"hidden");for(let[Me,Fn]of Object.entries(E))r.setAttribute(Me,String(Math.round(Math.max(0,Fn))))},Og(e,o),o}var Un=.2,mr=3,Rg=1,uc=.8,Ut=24,We=16,_g=300;function zg(e){e.cancelReport?.(),e.cancelReport=e.life.later(()=>{e.cancelReport=null;let t={x:Math.round(e.view.x),y:Math.round(e.view.y),scale:Math.round(e.view.k*1e3)/1e3};e.seen.viewport=`${t.x},${t.y},${t.scale}`,e.callbacks.onViewport?.(t)},_g)}function Ft(e,t){let{x:n,y:a,k:r}=e.view;e.world.style.setProperty("transform",`translate(${n}px, ${a}px) scale(${r})`),e.world.style.setProperty("--graph-k",String(r)),e.minimap.drawView(),t&&(e.wait.focusId=null,zg(e))}function pc(e){let t=Bt(e.positions),n=e.viewport.getBoundingClientRect();if(!t||!(n.width>0)||!(n.height>0))return null;for(let a of e.chips??[])t.left=Math.min(t.left,a.x-a.width/2),t.right=Math.max(t.right,a.x+a.width/2),t.top=Math.min(t.top,a.y-a.height/2),t.bottom=Math.max(t.bottom,a.y+a.height/2);return{box:t,rect:n}}function mc({box:e,rect:t}){return Math.min((t.width-Ut*2)/(e.right-e.left),(t.height-Ut*2)/(e.bottom-e.top))}function hc(e,t){e.auto={x:e.view.x,y:e.view.y,k:e.view.k,width:t}}function Bg(e,t){let n=e.auto;return n!==null&&n.width!==t&&n.x===e.view.x&&n.y===e.view.y&&n.k===e.view.k}function gc(e,t){let n=pc(e);if(!n)return!1;let{box:a,rect:r}=n,o=N(mc(n),Un,Rg);return e.view={k:o,x:(r.width-(a.right-a.left)*o)/2-a.left*o,y:(r.height-(a.bottom-a.top)*o)/2-a.top*o},e.fitted=!0,hc(e,r.width),Ft(e,t),!0}function bc(e){let t=pc(e);if(!t)return;if(mc(t)>=uc){gc(e,!1);return}let{box:n,rect:a}=t,r=uc,o=e.positions.get(e.forest.roots[0]),i=Ut-n.left*r,c=(n.bottom-n.top)*r<=a.height-Ut*2?Ut-n.top*r:a.height/2-(o.y+68/2)*r;e.view={k:r,x:i,y:c},e.fitted=!0,e.state.selectedId!==null&&vc(e,e.state.selectedId,{report:!1,nearest:!0}),hc(e,a.width)}function Pg(e,t,n){let a=e.viewport.getBoundingClientRect(),r=Number.isFinite(n?.x)&&Number.isFinite(n?.y),o=r?n.x-a.left:a.width/2,i=r?n.y-a.top:a.height/2,s=N(e.view.k*t,Un,mr);e.view={k:s,x:o-(o-e.view.x)*(s/e.view.k),y:i-(i-e.view.y)*(s/e.view.k)},e.fitted=!0,Ft(e,!0)}var fc=(e,t,n)=>e<We?We-e:n-We-(e+t);function vc(e,t,{report:n,nearest:a=!1}){let r=e.positions.get(t),o=e.viewport.getBoundingClientRect();if(!r||!(o.width>0)||!(o.height>0))return;let{k:i}=e.view,{x:s,y:c}=e.view,l=r.x*i+s,u=r.y*i+c;(l<We||l+208*i>o.width-We)&&(s=a?s+fc(l,208*i,o.width):o.width/2-(r.x+208/2)*i),(u<We||u+68*i>o.height-We)&&(c=a?c+fc(u,68*i,o.height):o.height/2-(r.y+68/2)*i),!(s===e.view.x&&c===e.view.y)&&(e.view={k:i,x:s,y:c},e.fitted=!0,Ft(e,n))}function Hg(e,t,n){if(!t||![t.x,t.y,t.scale].every(Number.isFinite)){n&&(e.fitted=!1);return}let a=`${t.x},${t.y},${t.scale}`;a!==e.seen.viewport&&(e.seen.viewport=a,e.view={x:t.x,y:t.y,k:N(t.scale,Un,mr)},e.fitted=!0)}function Ug(e){let t=e.doc.defaultView?.ResizeObserver;if(typeof t!="function")return;let n=new t(()=>{e.life.dead||e.drag||((!e.fitted||Bg(e,e.viewport.getBoundingClientRect().width))&&bc(e),Ft(e,!1))});n.observe(e.viewport),e.life.add(()=>n.disconnect())}function xc(e){return e.clampScale=t=>N(t,Un,mr),e.applyView=({report:t=!1}={})=>Ft(e,t),e.fit=({report:t=!1}={})=>gc(e,t),e.zoomAt=(t,n)=>Pg(e,t,n),Ug(e),{start:()=>bc(e),reveal:(t,n)=>vc(e,t,n),adopt:(t,n)=>Hg(e,t,n)}}var j="cloudcanvas-ui-graph",yc=Object.freeze({zoomIn:"Zoom in",zoomOut:"Zoom out",fit:"Fit",search:"Search the map",searchPlaceholder:"Search",child:"1 child",children:"{count} children",dependsOn:"depends on",neededBy:"needed by",relatedTo:"related to",expand:"Show children",collapse:"Hide children",link:"Drag to another node to link them",matches:"{count} matching",noMatches:"Nothing matches “{query}”",more:ot,hintNone:"Select a node to see what it can do · drag the background to pan",hintSearch:"/ searches",hintOpen:"Enter opens",hintAdd:"+ or Insert to add a child",hintCollapse:"Space collapses",hintExpand:"Space expands",hintMove:"drag onto a node to move it",hintLink:"drag the dot to link",hintDelete:"Delete removes",hintMore:"Shift+F10 or right-click for more"});function wc(e){let{query:t,nodes:n}=e.state;return t.trim()!==""&&!n.some(a=>ee(a.label,t))}var kc=e=>e.labels.noMatches.replace("{query}",e.state.query.trim());function Fg(e){let{labels:t,callbacks:n}=e,a=e.state.selectedId;if(wc(e))return kc(e);if(a===null)return[t.hintNone,n.onMenu&&t.hintMore,t.hintSearch].filter(Boolean).join(" · ");let r=n.onToggle&&e.countOf(a)>0;return[n.onActivate&&t.hintOpen,n.onAdd&&t.hintAdd,r&&(e.byId.get(a).collapsed?t.hintExpand:t.hintCollapse),n.onDropOn&&t.hintMove,n.onConnect&&t.hintLink,n.onDelete&&t.hintDelete,n.onMenu&&t.hintMore].filter(Boolean).join(" · ")}function hr(e){let{selectedId:t,query:n}=e.state,a=!wc(e);e.emphasis=Ys(t,e.forest,e.state.edges);for(let o of e.nodeLayer.children){let i=o.getAttribute("data-ui-id"),s=i===t;Z(o,s),t===null?o.removeAttribute("aria-selected"):o.setAttribute("aria-selected",String(s)),o.classList.toggle("is-path",!!e.emphasis&&!s&&e.emphasis.path.has(i)),o.classList.toggle("is-dim",!!e.emphasis&&!e.emphasis.lit.has(i)),o.classList.toggle("is-unmatched",a&&!ee(e.byId.get(i).label,n))}Bn(e),_n(e,e.emphasis);let r=Fg(e);h(e.hintText,r),e.hint.hidden=r===""}function Kg(e){let{focusId:t,selectedId:n}=e.state;return e.byId.has(t)?t:e.byId.has(n)?n:e.rows[0]?.id??null}function gr(e,{focus:t}){let n=Kg(e);e.state.focusId=n;let a=null;for(let r of e.nodeLayer.children){let o=r.getAttribute("data-ui-id")===n;r.setAttribute("tabindex",o?"0":"-1"),o&&(a=r)}t&&a?.focus({preventScroll:!0})}function Ac(e){let{nodes:t,edges:n}=e.state;e.byId=new Map(t.map(r=>[r.id,r])),e.forest=Rn(t,n),e.rows=Ws(e.forest),e.positions=sr(e.forest),e.byId.has(e.state.selectedId)||jg(e);let a=e.nodeLayer.contains(e.doc.activeElement);U(e.nodeLayer,e.rows,{key:r=>r.id,create:()=>ec(e.doc),update:(r,o)=>nc(e,r,o)}),hr(e),gr(e,{focus:a&&!e.nodeLayer.contains(e.doc.activeElement)}),e.minimap.drawNodes(),e.fitted||e.views.start(),e.applyView()}function jg(e){let t=e.state.selectedId;t!==null&&t===e.seen.selectedId&&(e.wait.selectedId=t),e.state.selectedId=null}function Sc(e,t,{focus:n}){Object.assign(e.wait,{selectedId:null,focusId:null}),e.state.selectedId=t,e.state.focusId=t,hr(e),e.minimap.drawNodes(),gr(e,{focus:n}),n&&e.views.reveal(t,{report:!0})}function $c(e,t){e.state.query=t,hr(e);let n=e.state.nodes.filter(a=>ee(a.label,t)).length;t.trim()!==""&&e.say(n===0?kc(e):e.labels.matches.replace("{count}",String(n))),e.callbacks.onQuery?.(t)}function Gg(e,t){if(t.key==="Escape"){t.preventDefault(),e.search.value!==""&&(e.search.value="",$c(e,"")),gr(e,{focus:!0});return}if(t.key!=="Enter"&&t.key!=="ArrowDown")return;let n=e.state.query.trim()===""?null:e.rows.find(a=>ee(e.byId.get(a.id).label,e.state.query));n&&(t.preventDefault(),Sc(e,n.id,{focus:!0}))}function qg(e){let{doc:t,labels:n,life:a}=e,r=d(t,"div",{className:`${j}-toolbar`});return e.search=De(t,{type:"search",label:n.search,placeholder:n.searchPlaceholder,className:`${j}-search`,signal:a.signal,onInput:o=>$c(e,String(o??""))}),a.on(e.search,"keydown",o=>Gg(e,o)),r.append(e.search,$(t,{className:`${j}-zoom-out`,label:"−",ariaLabel:n.zoomOut,signal:a.signal,onClick:()=>e.zoomAt(.8)}),$(t,{className:`${j}-zoom-in`,label:"+",ariaLabel:n.zoomIn,signal:a.signal,onClick:()=>e.zoomAt(1.25)}),$(t,{className:`${j}-fit`,label:n.fit,signal:a.signal,onClick:()=>e.fit({report:!0})})),r}function Wg(e,t,n){let{seen:a,wait:r,state:o}=e,i=t.selectedId??null;i!==a.selectedId&&(a.selectedId=i,r.selectedId=i,i===null&&(o.selectedId=null));let s=String(t.query??"");s!==a.query&&(a.query=s,o.query=s,e.search.value=s),e.views.adopt(t.viewport,n);let c=t.focusId??null;c!==a.focusId&&(a.focusId=c,r.focusId=c)}function Vg(e){let{wait:t,state:n}=e,a=o=>o!==null&&n.nodes.some(i=>i.id===o);if(a(t.selectedId)&&(n.selectedId=t.selectedId,n.focusId=t.selectedId,t.selectedId=null),!a(t.focusId))return null;let r=t.focusId;return t.focusId=null,n.focusId=r,r}function Xg(e){let{doc:t}=e;e.viewport=d(t,"div",{className:`${j}-viewport`}),e.world=d(t,"div",{className:`${j}-world`}),e.svg=k(t,"svg",{class:`${j}-edges`,"aria-hidden":"true",width:1,height:1}),e.nodeLayer=d(t,"div",{className:`${j}-nodes`,attrs:{role:"tree"}}),e.overlay=k(t,"svg",{class:`${j}-edges ${j}-overlay`,"aria-hidden":"true",width:1,height:1}),e.world.append(e.svg,e.nodeLayer,e.overlay),e.minimap=dc(e),e.viewport.append(e.world,e.minimap.element),e.hint=d(t,"p",{className:`${j}-hint`}),e.hintText=x(t,e.hint)}function Yg(e,t){for(let[n,a]of[["data-can-move","onDropOn"],["data-can-link","onConnect"],["data-can-fold","onToggle"],["data-can-menu","onMenu"]])typeof t[a]=="function"&&e.setAttribute(n,"")}function Zg(e,t,n,a){let r={doc:e,life:t,root:n,callbacks:a,labels:{...yc,...a.labels},markerId:M(`${j}-arrow`),view:{x:0,y:0,k:1},fitted:!1,auto:null,positions:new Map,byId:new Map,forest:Rn([],[]),rows:[],emphasis:null,drag:null,draft:null,panned:!1,state:{nodes:[],edges:[],selectedId:null,focusId:null,query:""},seen:{selectedId:void 0,query:void 0,focusId:void 0,viewport:void 0},wait:{selectedId:null,focusId:null}};return r.countOf=o=>r.byId.get(o)?.childCount??r.forest.children.get(o)?.length??0,r.render=()=>Ac(r),r.select=(o,i)=>Sc(r,o,i),r}function Qg(e,t={}){let n=b(e);v(n);let a=g(),r=d(n,"div",{className:j,attrs:{role:"region",[F]:!0}});Yg(r,t);let o=Zg(n,a,r,t);return Xg(o),o.views=xc(o),r.append(qg(o),o.hint,o.viewport),o.region=he(r),o.say=i=>ge(o.region,i),cc(o),e.append(r),{update(i={}){if(a.dead)return;let{nodes:s,edges:c}=qs(i.nodes??[],i.edges??[]),l=o.state.nodes.length>0&&!s.some(w=>o.byId.has(w.id));Object.assign(o.state,{nodes:s,edges:c});let u=String(i.label??"Relationships");if(r.setAttribute("aria-label",u),o.nodeLayer.setAttribute("aria-label",u),Wg(o,i,l),o.drag)return;let f=Vg(o);Ac(o),f!==null&&o.views.reveal(f,{report:!1})},fit:()=>a.dead?!1:o.fit({report:!0}),destroy(){a.destroy()&&r.remove()}}}export{Kn as BUTTON_CLASS,Li as CALENDAR_LABELS,Et as CALENDAR_VIEWS,zc as DRAG_START_PX,xt as FIELD_CLASS,yc as GRAPH_LABELS,io as ICON_CLASS,ea as ICON_NAMES,Ee as SR_ONLY_CLASS,ba as STATUS_LABELS,Gs as TIMELINE_LABELS,_ as TIMELINE_SCALES,Bc as TOUCH_DRAG_DELAY_MS,Pc as TOUCH_DRAG_START_PX,Pr as UI_CSS,qn as UI_STYLE_ID,_c as UI_TOKENS,Wo as VOICE_LABELS,ka as VOICE_MAX_LENGTH,Go as VOICE_MESSAGES,A as addDays,lt as addMinutes,vn as addMonths,B as atMinutes,$ as button,N as clamp,el as confirmDialog,ro as countLabel,Gt as createBadge,jd as createBreadcrumbs,em as createCalendar,Tu as createChips,Ru as createCombobox,af as createComposer,Yn as createContextActions,il as createContextWindow,Vn as createDialog,hl as createDrawer,Cu as createEmptyState,Qg as createGraph,qt as createIcon,Zf as createKanban,g as createLife,Of as createMarkdownView,ca as createMenu,Eu as createNavBar,Ed as createPopover,cu as createProgress,ga as createResults,xu as createSelect,Od as createSplitter,Pd as createStatus,fu as createSwitch,gd as createTabs,Wh as createTimeline,qu as createToaster,iu as createTree,Aa as createVoiceDraft,Sa as createVoiceInput,I as dayKey,dt as daysBetween,b as documentOf,d as el,ae as focusablesIn,ao as formatCount,z as fromDayKey,v as injectUiStyles,De as input,Ic as isControlTarget,Ar as isOff,Oc as isTypingTarget,ie as itemIdOf,se as keepFocus,Qh as layoutGraph,Ue as minutesOfDay,ri as monthGrid,hn as moveVerdict,Q as nextIndex,ce as placeChildren,U as reconcileKeyedList,Qo as renderMarkdown,yt as rowCache,sn as safeHref,V as sameDay,Ec as setLabel,Sr as setOff,C as setTabStop,Nc as setValue,Dt as shiftAnchor,Dc as show,Po as splitterKeyValue,$t as splitterLimits,T as startOfDay,xn as startOfMonth,Ae as startOfWeek,x as textNode,H as toDate,Cf as toggleTaskLine,Ta as touchesDay,L as trackDrag,M as uniqueId,D as uniqueItems,ut as viewDays,h as writeText};
