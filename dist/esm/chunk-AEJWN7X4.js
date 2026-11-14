/*!
 * CloudCanvas lib v0.7.1 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
import{BLIT_ATTR as c,holdPlace as f,parkedStateOf as d,rootOf as i,stateOf as t}from"cloudcanvas/kernel";import{indexBlit as p}from"cloudcanvas/kernel";function N(e,n=!1){let r=e.el;if(e.anchor||!r.parentNode)return!1;let l=i(e);if(l)for(let u of[r,...r.querySelectorAll(`[${c}]`)])p(l,u);n||e.traits?.(e,!1);let o=r.ownerDocument.createComment(`blit ${r.id||""}`);return r.parentNode.insertBefore(o,r),r.parentNode.removeChild(r),e.anchor=o,f(o,e),!0}function m(e,n=!1){let r=e.anchor;return!r||(e.anchor=null,f(r,null),!r.parentNode)?!1:(r.parentNode.insertBefore(e.el,r),r.parentNode.removeChild(r),n||e.traits?.(e,!0),!0)}function x(e){let n=t(e);return n&&n.anchor?n.anchor:e}export{d as a,N as b,m as c,x as d};
