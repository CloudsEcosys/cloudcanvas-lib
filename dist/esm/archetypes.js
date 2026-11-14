/*!
 * CloudCanvas lib v0.7.1 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
import{type as h}from"cloudcanvas";var i="cloudcanvas-archetype-styles",y=`
.cloudcanvas-section {
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-2, 8px);
  min-width: 280px;
}
.cloudcanvas-section-title {
  margin: 0;
  padding-bottom: var(--cc-space-1, 4px);
  border-bottom: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-lg, 15px);
  font-weight: var(--cc-weight-semibold, 600);
}
.cloudcanvas-section-body {
  position: relative;
  min-height: var(--cc-scope-min-height, 40px);
}
.cloudcanvas-table {
  border-collapse: collapse;
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-sm, 12px);
}
.cloudcanvas-table-caption {
  padding-bottom: var(--cc-space-1, 4px);
  color: var(--cc-text-muted, #94a3b8);
  text-align: left;
}
.cloudcanvas-table th,
.cloudcanvas-table td {
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border-bottom: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  text-align: left;
}
.cloudcanvas-table th {
  font-weight: var(--cc-weight-semibold, 600);
}
`;function n(){if(typeof document>"u")return null;let t=document.getElementById(i);if(t)return t;let e=document.createElement("style");return e.id=i,e.textContent=y,document.head.appendChild(e),e}var f="section",d="cloudcanvas-section",x=`<section class="${d}"><h2 class="${d}-title" data-slot="title"></h2><div class="${d}-body" data-scope></div></section>`;function p(){return n(),h(f,{html:x})}import{blit as v,type as T}from"cloudcanvas";var l="table",u="cloudcanvas-table",E=`<table class="${u}"><caption class="${u}-caption" data-slot="caption"></caption><thead></thead><tbody></tbody></table>`;function g(t){if(t===!0||t===void 0||t===null||t==="")return{columns:[],rows:[]};let e=t.columns??[],c=t.rows??[];if(!Array.isArray(e)||!Array.isArray(c)||!c.every(Array.isArray))throw new TypeError("table: expected {columns: [], rows: [[]]}");return{columns:e,rows:c}}function b(t,e,c){let a=document.createElement("tr");for(let o=0;o<Math.max(c,e.length);o+=1){let r=document.createElement(t);t==="th"&&r.setAttribute("scope","col");let s=e[o];r.textContent=s==null?"":String(s),a.appendChild(r)}return a}function A(t,e){let{columns:c,rows:a}=g(e),o=t.el.querySelector(`.${u}`);o.tHead.replaceChildren(...c.length>0?[b("th",c,0)]:[]),o.tBodies[0].replaceChildren(...a.map(r=>b("td",r,c.length)))}function m(){return n(),v.use({[l]:A}),T(l,{html:E,defaults:{[l]:!0}})}function $(){return[p(),m()]}export{y as ARCHETYPE_CSS,i as ARCHETYPE_STYLE_ID,f as SECTION_TYPE,l as TABLE_TYPE,n as injectArchetypeStyles,$ as registerArchetypes,p as sectionType,m as tableType};
