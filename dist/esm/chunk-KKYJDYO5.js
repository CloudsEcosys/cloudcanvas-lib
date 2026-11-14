/*!
 * CloudCanvas lib v0.7.1 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
import{g as s,j as f,k as a,o as u}from"./chunk-4TAQWWHY.js";import{j as c,q as i}from"./chunk-6ASDR6O6.js";import{rootOf as m,stateOf as d}from"cloudcanvas/kernel";var n=new WeakMap;function S(t){return{selected:!!t.selected}}function p(t,e){e.el&&e.el.classList&&e.el.classList.toggle(s,t.selected)}function r(t,e,o){return t.selected===o?!1:(t.selected=o,p(t,e),e.emit("select",o),!0)}function h(t,e){let o=n.get(t.el);return o?r(o,t,!!e):!1}function C(t){let e=m(d(t.el));if(e)for(let o of e.host.querySelectorAll(`.${s}`))o!==t.el&&n.has(o)&&h(d(o).handle,!1)}function E(t,e){i("select",c),n.set(e.el,t),t.selected&&e.emit("select",!0);let o=e.on("pointerdown",l=>{if(!(!a(l)||!f(e,l))){if(l.shiftKey){r(t,e,!t.selected);return}C(e),r(t,e,!0)}});return()=>{o(),n.delete(e.el)}}var O=u({init:S,attach:p,detach:(t,e)=>r(t,e,!1),mount:E});export{p as a,r as b,h as c,O as d};
