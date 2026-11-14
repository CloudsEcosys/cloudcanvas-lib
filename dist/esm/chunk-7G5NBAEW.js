/*!
 * CloudCanvas lib v0.7.0 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
var l="edit",s="data-editing",c='input, textarea, select, [contenteditable=""], [contenteditable="true"]',n=new WeakMap;function f(e){return n.has(e.el)}function d(e){return n.get(e.el)?.node??null}function a(e,t=null){return n.has(e.el)?!1:(n.set(e.el,{node:t||null,replay:null}),e.el.setAttribute(s,""),e.emit(l,!0),!0)}function i(e){let t=n.get(e.el);return t?(n.delete(e.el),e.el.removeAttribute(s),t.replay?.(),e.emit(l,!1),!0):!1}function p(e,t){let r=n.get(e.el);return r?(typeof t=="function"&&(r.replay=t),!0):!1}function E(e){let t=o=>{let u=o.target;typeof u?.matches=="function"&&u.matches(c)&&a(e,u)},r=o=>{(!o.relatedTarget||!e.el.contains(o.relatedTarget))&&i(e)};return e.el.addEventListener("focusin",t),e.el.addEventListener("focusout",r),()=>{e.el.removeEventListener("focusin",t),e.el.removeEventListener("focusout",r),i(e)}}export{l as a,s as b,f as c,d,a as e,i as f,p as g,E as h};
