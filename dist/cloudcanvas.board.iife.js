/*!
 * CloudCanvas lib v0.7.0 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
var CloudCanvas=(()=>{var lr=Object.defineProperty;var ws=Object.getOwnPropertyDescriptor;var Ts=Object.getOwnPropertyNames;var Ss=Object.prototype.hasOwnProperty;var J=(e,t,r)=>()=>{if(r)throw r[0];try{return e&&(t=e(e=0)),t}catch(n){throw r=[n],n}};var Es=(e,t)=>{for(var r in t)lr(e,r,{get:t[r],enumerable:!0})},As=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of Ts(t))!Ss.call(e,o)&&o!==r&&lr(e,o,{get:()=>t[o],enumerable:!(n=ws(t,o))||n.enumerable});return e};var Os=e=>As(lr({},"__esModule",{value:!0}),e);function ht(e,t){t?dr.set(e,t):dr.delete(e)}function gt(e,t=[]){for(let r of e.childNodes){let n=r.nodeType===8?dr.get(r):null;n?t.push(n.el):r.nodeType===1&&(r.hasAttribute(O)?t.push(r):gt(r,t))}return t}function g(e){return nt.get(e)}function ur(e){let t={el:e,handle:null,x:0,y:0,z:0,w:null,h:null,mw:0,mh:0,sx:0,sy:0,changed:new Set,painted:!1,port:null,root:null,anchor:null,with:null,cleanups:null,traits:null,id:null};return nt.set(e,t),e.setAttribute(O,""),t}function R(e){let t=e.el.closest(`[${ne}]`);return t&&nt.get(t)?.root||null}function fr(e){return nt.get(e)?.anchor?.parentNode||e.parentNode}function $(e){let t=fr(e);return t&&typeof t.closest=="function"?t.closest(`[${O}]`):null}function fe(e,t){let r=$(t);for(let n=0;r&&r!==e&&n<Fe;n+=1)r=$(r);return!!r&&r===e}function _e(e){return{w:e.mw>0?e.mw:e.w??0,h:e.mh>0?e.mh:e.h??0}}function Ue(e){let t=e.fx??e.x,r=e.fy??e.y,n=$(e.el);for(let o=0;n&&o<Fe;o+=1){let a=nt.get(n);if(!a||a.root)break;t+=(a.fx??a.x)+a.sx,r+=(a.fy??a.y)+a.sy,n=$(n)}return{x:t,y:r,..._e(e)}}function Ce(e){let t=e.querySelector(`[${ks}]`);return t&&t.closest(`[${O}]`)===e?t:e}var O,ne,ks,je,mt,ue,Fe,nt,dr,xe=J(()=>{O="data-blit",ne="data-blit-root",ks="data-scope",je="data-slot",mt="data-slot-html",ue=Object.freeze(["x","y","z","w","h"]),Fe=4096,nt=new WeakMap,dr=new WeakMap});function _s({level:e,message:t,args:r}){if(typeof console>"u")return;let n=typeof console[e]=="function"?console[e]:console.log;typeof n=="function"&&n.call(console,`[CloudCanvas] ${t}`,...r)}function Ls(e,t,r,n){if(!(Sn===null||pr[e]<Cs))try{Sn({level:e,scope:t,message:r,args:n})}catch{}}function P(e){let t=typeof e=="string"&&e!==""?e:"cloudcanvas";return Object.freeze(Object.fromEntries(Object.keys(pr).map(r=>[r,(n,...o)=>Ls(r,t,String(n),o)])))}var pr,Sn,Cs,ce=J(()=>{pr=Object.freeze({debug:10,info:20,warn:30,error:40});Sn=_s,Cs=pr.error});function pe(e){return e.replace(/-([a-z])/g,(t,r)=>r.toUpperCase())}function bt(e){return e.replace(/[A-Z]/g,t=>`-${t.toLowerCase()}`)}function Ns(e,t,r,n){if(n.numeric.has(e)){let o=t.trim()===""?NaN:Number(t);if(Number.isFinite(o))return o;throw new TypeError(`${n.label}: ${r}="${t}" is not a number`)}return n.boolean.has(e)&&(t==="true"||t==="false")?t==="true":t}function Is(e,t,r,n){let o={};for(let a of e.attributes){if(!a.name.startsWith(t)||r.has(a.name))continue;let c=pe(a.name.slice(t.length));o[c]=Ns(c,a.value,a.name,n)}return o}function xt(e){return Is(e,An,$s,Rs)}function vt(e,t="data-*"){if(e===""||e==="true")return!0;if(e==="false")return!1;if(/^-?\d+(\.\d+)?$/.test(e))return Number(e);if(!/^[[{]/.test(e))return e;try{return JSON.parse(e,(r,n)=>{if(!Ms.has(r))return n;En.warn(`blit: ${t} drops the key "${r}"`)})}catch(r){En.warn(`blit: ${t} is not valid JSON and is ignored (${r.name})`);return}}function ve(e,t,r){let n=`${An}${bt(t)}`;r==null?e.removeAttribute(n):e.setAttribute(n,typeof r=="object"?JSON.stringify(r):String(r))}var En,Rs,An,$s,Ms,yt=J(()=>{ce();xe();En=P("blit"),Rs=Object.freeze({numeric:new Set(ue),boolean:new Set,label:"blit"}),An="data-",$s=new Set([O,ne]);Ms=new Set(["__proto__","constructor","prototype"])});function Tt(e,t,r=0,n=1){let o=`translate3d(${e.toFixed(2)}px, ${t.toFixed(2)}px, ${r.toFixed(2)}px)`;return n===1?o:`${o} scale(${n.toFixed(4)})`}function St(e){return wt.delete(e)}function Ye(e){let t=e.el;if(!t.style)return!1;let{x:r,y:n,z:o}=e;wt.has(t)||wt.set(t,new Float64Array(5).fill(NaN));let a=wt.get(t),c=!1;return(a[0]!==r||a[1]!==n||a[2]!==o)&&(t.style.transform=Tt(r,n,o),a.set([r,n,o]),c=!0),Ps(t,g(t),a)||c}function Ps(e,t,r){let{w:n,h:o}=t,a=!1;return n!==null&&r[3]!==n&&(e.style.width=`${n}px`,r[3]=n,a=!0),o!==null&&r[4]!==o&&(e.style.height=`${o}px`,r[4]=o,a=!0),a}var wt,Et=J(()=>{xe();wt=new WeakMap});function kn(e={}){let t={host:e.host||null,plane:e.plane||null,overlay:e.overlay||null,camera:e.camera,hostRect:mr,running:e.running!==!1,rafId:null,_lastTs:null,loop:null,frameCount:0,applied:null,dirty:new Set,measure:new Set,hooks:{structure:new Set,read:new Set,write:new Set,busy:new Set},view:null,chain:null,ids:new Map};return t.loop=r=>Fs(t,r),t}function Bs(e,t){let r=e._lastTs;return e._lastTs=Number.isFinite(t)?t:null,r===null||e._lastTs===null?1:Math.min(Math.max(t-r,0),Ds)/ot}function js(e){if(e.dirty.size>0||e.measure.size>0||e.camera.isAnimating===!0)return!0;for(let t of e.hooks.busy)if(t())return!0;return!1}function v(e){return!e.running||e.rafId!==null||typeof requestAnimationFrame>"u"?!1:(e.rafId=requestAnimationFrame(e.loop),!0)}function Fs(e,t){e.running&&(e.rafId=null,Us(e,Bs(e,t)),js(e)&&v(e),e.rafId===null&&(e._lastTs=null))}function Us(e,t=1){e.camera.update?.(t*ot);let r=Ys(e);r&&e.host&&(e.hostRect=e.host.getBoundingClientRect());let n={dt:t,camera:e.camera,hostRect:e.hostRect,cameraMoved:r};for(let o of e.hooks.structure)o(n);for(let o of e.hooks.read)o(n);for(let o of e.hooks.write)o(n);e.frameCount+=1}function Ys(e){let{x:t,y:r,scale:n,perspective:o,rotateX:a,rotateY:c}=e.camera,i=e.applied;return i&&i.x===t&&i.y===r&&i.scale===n&&i.perspective===o&&i.rotateX===a&&i.rotateY===c?!1:(e.applied={x:t,y:r,scale:n,perspective:o,rotateX:a,rotateY:c},!0)}function _n(e,t){if(e.size===0)return;let r=Array.from(e);e.clear();for(let n of r)n.el.isConnected&&t(n)}function Cn(e){_n(e.measure,Gs)}function Ln(e){_n(e.dirty,t=>hr(e,t))}function Gs(e){let t=e.el,r=t.offsetWidth,n=t.offsetHeight;r>0&&n>0&&(e.mw=r,e.mh=n);let o=Ce(t);o!==t&&(e.sx=Number(o.offsetLeft)||0,e.sy=Number(o.offsetTop)||0)}function hr(e,t){let r=t.port||Ye,n=t.changed.has("w")||t.changed.has("h");try{r(t.handle,{changed:t.changed,first:!t.painted,camera:e?e.camera:null})}catch(o){zs.error("a port threw; the blit falls back to the default port",o),t.port=null,Ye(t.handle)}t.painted=!0,t.changed.clear(),e&&n&&e.measure.add(t)}var zs,ot,Ds,On,mr,At=J(()=>{ce();Et();xe();zs=P("frame"),ot=16.67,Ds=50,On=Object.freeze(["read","write"]),mr=Object.freeze({width:800,height:600,left:0,top:0})});function Ot(...e){for(let t of e)if(t!==null&&Number.isFinite(Number(t)))return Number(t);return null}function kt(e,t){return e===null?NaN:Number(e)-t}function Hs(e){if(!e||typeof e!="object")throw new TypeError("zoomToFit: bounds must be a box object");let t=Ot(e.minX,e.x,e.left),r=Ot(e.minY,e.y,e.top),n=Ot(e.width,kt(e.maxX,t),kt(e.right,t)),o=Ot(e.height,kt(e.maxY,r),kt(e.bottom,r));if([t,r,n,o].includes(null))throw new TypeError("zoomToFit: bounds needs {minX,minY,maxX,maxY}, {x,y,width,height} or a DOMRect");return{x:t,y:r,w:n,h:o}}function Ge(e,t){let r=new Float64Array(16);for(let n=0;n<4;n+=1)for(let o=0;o<4;o+=1){let a=0;for(let c=0;c<4;c+=1)a+=e[c*4+o]*t[n*4+c];r[n*4+o]=a}return r}function Vs(e,t){let[r,n]=[e*Math.PI/180,t*Math.PI/180],o=Float64Array.of(1,0,0,0,0,Math.cos(r),Math.sin(r),0,0,-Math.sin(r),Math.cos(r),0,0,0,0,1),a=Float64Array.of(Math.cos(n),0,-Math.sin(n),0,0,1,0,0,Math.sin(n),0,Math.cos(n),0,0,0,0,1);return Ge(o,a)}var Rn,$n,Le,gr=J(()=>{Rn=1e-6;$n=(e,t,r=0)=>Float64Array.of(1,0,0,0,0,1,0,0,0,0,1,0,e,t,r,1);Le=class{constructor(t={}){this.x=Number(t.x)||0,this.y=Number(t.y)||0,this.scale=Number(t.scale)||1,this.minScale=Number(t.minScale)||.1,this.maxScale=Number(t.maxScale)||8,this.perspective=Number(t.perspective)>0?Number(t.perspective):null,this.rotateX=Number(t.rotateX)||0,this.rotateY=Number(t.rotateY)||0}get is3d(){return this.perspective!==null||this.rotateX!==0||this.rotateY!==0}clamp(t){return Math.min(this.maxScale,Math.max(this.minScale,Number(t)))}panBy(t,r){this.x+=Number(t),this.y+=Number(r)}panTo(t,r){this.x=Number(t),this.y=Number(r)}setZoom(t){this.scale=this.clamp(t)}zoomAt(t,r=0,n=0,o=null){let a=this.scale,c=this.clamp(a*t);if(c!==a){if(o&&this.is3d){let i=this.unproject(r,n,o);if(!i)return;this.scale=c;let s=this.unproject(r,n,o)??i;this.x+=c*(s.x-i.x),this.y+=c*(s.y-i.y);return}this.x=r-(r-this.x)/a*c,this.y=n-(n-this.y)/a*c,this.scale=c}}fitTarget(t,r={},n={}){let{x:o,y:a,w:c,h:i}=Hs(t),s=n.padding!==void 0?Number(n.padding):60,l=r.width||800,u=r.height||600,d=this.clamp(Math.min(Math.max(l-s*2,100)/Math.max(c||100,40),Math.max(u-s*2,100)/Math.max(i||80,40),n.maxZoom||2.5));return{x:l/2-(o+c/2)*d,y:u/2-(a+i/2)*d,scale:d}}fit(t,r,n){let o=this.fitTarget(t,r,n);return Object.assign(this,o),o}get matrix(){let t=this.scale;return Float64Array.of(t,0,0,0,0,t,0,0,0,0,1,0,this.x,this.y,0,1)}view(t={}){if(this.rotateX===0&&this.rotateY===0)return this.matrix;let r=(t.width||800)/2,n=(t.height||600)/2;return Ge(Ge($n(r,n),Ge(Vs(this.rotateX,this.rotateY),$n(-r,-n))),this.matrix)}projected(t={}){let r=this.view(t),n=this.perspective;if(n===null)return r;let o=(t.width||800)/2,a=(t.height||600)/2;return Ge(Float64Array.of(1,0,0,0,0,1,0,0,-o/n,-a/n,1,-1/n,0,0,0,1),r)}project(t,r,n={},o=0){let a=this.projected(n),c=a[3]*t+a[7]*r+a[11]*o+a[15];return c<=Rn?null:{x:(a[0]*t+a[4]*r+a[8]*o+a[12])/c,y:(a[1]*t+a[5]*r+a[9]*o+a[13])/c}}unproject(t,r,n={}){let o=this.projected(n),a=o[0]-t*o[3],c=o[4]-t*o[7],i=o[1]-r*o[3],s=o[5]-r*o[7],l=a*s-c*i;if(Math.abs(l)<1e-12)return null;let u=t*o[15]-o[12],d=r*o[15]-o[13],f=(u*s-c*d)/l,x=(a*d-u*i)/l;return o[3]*f+o[7]*x+o[15]>Rn?{x:f,y:x}:null}}});function Xs(e,t){return`
[data-blit-root] { position: relative; overflow: hidden; }
[${e}] { position: absolute; inset: 0; transform-origin: 0 0; }
[${t}] { position: absolute; inset: 0; pointer-events: none; }
[data-blit-root] [data-blit] { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
[data-blit] [data-scope] { position: relative; }
[data-blit-root] [data-blit][hidden] { display: none; }
`}function at(e,t){if(typeof document>"u")return null;let r=document.getElementById(e);return r||(r=document.createElement("style"),r.id=e,r.textContent=t,document.head.appendChild(r)),r}var Nn,br,xr,In,vr=J(()=>{Nn="blit-css",br="data-blit-plane",xr="data-blit-overlay";In=Xs(br,xr)});function Pn(e,t=null){if(typeof e!="string"||!e)throw new TypeError("type: name must be a non-empty string");let r=$e(e);if(!t)return r;let n=t.with;if(n!==void 0&&!(Array.isArray(n)&&n.every(a=>typeof a=="function")))throw new TypeError("type: with must be an array of functions");let o=Ws(t);if(r&&r!==o&&r.innerHTML!==o.innerHTML)throw new TypeError(`type: "${e}" is already defined with different markup`);return n&&Mn.set(e,n),r||(o.setAttribute(Re,e),yr.set(e,o),o)}function Ws({html:e,template:t}){if(t!==void 0){if(!t||!Ne(t))throw new TypeError("type: template must be a <template>");return t}let r=document.createElement("template");return r.innerHTML=typeof e=="string"?e:"",r}function $e(e){let t=yr.get(e);if(t)return t;if(typeof document>"u")return null;let r=Array.from(document.querySelectorAll(`template[${Re}]`)).find(n=>n.getAttribute(Re)===e);return r&&yr.set(e,r),r||null}function zn(e){return e&&Mn.get(e)||[]}function Ne(e){return e.tagName==="TEMPLATE"&&!!e.content}function Dn(e){let t=document.createElement("div");return e&&t.appendChild(e.content.cloneNode(!0)),t}var Re,yr,Mn,_t=J(()=>{Re="data-type",yr=new Map,Mn=new Map});function ct(e){if(e===void 0)return Object.freeze(Array.from(Q.keys()));if(!e||typeof e!="object")throw new TypeError("blit.use: expected {name: fn}");for(let[t,r]of Object.entries(e)){if(!Ks.test(t)||qs.has(t))throw new TypeError(`blit.use: "${t}" cannot be a name`);if(typeof r!="function")throw new TypeError(`blit.use: "${t}" is not a function`);if(Q.get(t)!==r){if(Q.has(t))throw new TypeError(`blit.use: "${t}" is already in use by another function`);Q.set(t,r),el(t)}}}function Fn(e,t,r){if(t==="port")e.port=Zs(r);else if(t==="with")Js(e,r);else if(Q.has(t))it(e,t),ve(e.el,t,r===!0?"":r===!1?null:r);else return!1;return!0}function Zs(e){if(e==null||typeof e=="function")return e??null;if(!Q.has(e))throw new TypeError(`blit.set: no port named "${String(e)}"`);return Q.get(e)}function Js(e,t){let r=t??[];if(!(Array.isArray(r)&&r.every(o=>typeof o=="function")))throw new TypeError("blit.set: with must be an array of functions");for(let o of(e.with??[]).filter(a=>!r.includes(a)))it(e,o);e.with=r}function Un(e,t){for(let n of Object.keys(t))Q.has(n)&&(t[n]=vt(t[n],`data-${bt(n)}`)),t[n]===void 0&&delete t[n];let r=e.heldPort??e.port;for(let n of[...e.with??[],...r?[r]:[]]){let o=n===r?"port":"trait",a=Array.from(Q.keys()).find(c=>Q.get(c)===n);a?o==="port"?t.port=a:t[a]??=!0:jn.warn(`blit.spec: an anonymous ${o} is not serialised; name it with blit.use()`)}}function Ie(e){let t=R(e);if(!t||!e.handle)return;e.traits=Qs,e.retryTraits=!1;let r=[...zn(e.el.getAttribute(Re)),...e.with??[]];for(let n of r)Bn(e,t,n,n,!0);for(let{name:n,value:o}of Array.from(e.el.attributes)){let a=n.startsWith("data-")?pe(n.slice(5)):"",c=Q.has(a)?vt(o,n):void 0;c!==void 0&&c!==!1&&Bn(e,t,a,Q.get(a),c)}}function Bn(e,t,r,n,o){if(!e.cleanups?.has(r)){(e.cleanups??=new Map).set(r,null);try{let a=n(e.handle,o,t);typeof a=="function"&&e.cleanups.set(r,a)}catch(a){throw e.cleanups.delete(r),typeof r=="string"?ve(e.el,r,null):e.retryTraits=!0,a}}}function it(e,t){for(let r of t===void 0?Array.from(e.cleanups?.keys()??[]):[t]){let n=e.cleanups?.get(r);if(!(!e.cleanups?.delete(r)||!n))try{n()}catch(o){jn.error(`blit: the cleanup of ${typeof r=="string"?`"${r}"`:"a trait"} threw`,o)}}}function Qs(e,t){for(let r of[e.el,...e.el.querySelectorAll(`[${O}]`)]){let n=g(r);n&&t?Ie(n):n&&it(n)}}function el(e){if(typeof document>"u")return;let t=`data-${bt(e)}`;for(let r of document.querySelectorAll(`[${ne}][${t}], [${ne}] [${t}]`)){let n=g(r);n&&Ie(n)}}var jn,Ks,qs,Q,Ct=J(()=>{ce();yt();xe();_t();jn=P("blit"),Ks=/^[a-z][a-zA-Z0-9]*$/,qs=new Set(["blit","blitRoot","id","port","with","fill","type","slot",...ue]),Q=new Map});function Yn(e,t){let r=e.querySelector(`:scope > [${t}]`);if(r)return r;let n=document.createElement("div");return n.setAttribute(t,""),e.appendChild(n),n}function Gn(e){let t=e.el;at(Nn,In),t.setAttribute(ne,"");let r=Yn(t,br),n=kn({host:t,plane:r,overlay:Yn(t,xr),camera:new Le});return n.hostRect=ol(t),n.demoted=new Set,n.hooks.read.add(()=>Cn(n)),n.hooks.write.add(()=>Ln(n)),n.hooks.write.add(o=>rl(n,o)),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{n.applied=null,v(n)}).observe(t),e.root=n,n}function rl(e,t){if(!t.cameraMoved){e.refocusDue&&(e.refocusDue=!1,e.plane.style.willChange="");return}let r=e.camera,{x:n,y:o,scale:a}=r,c=!r.is3d;(!c||e.wrote3d)&&(e.host.style.perspective=r.perspective?`${r.perspective}px`:"",e.plane.style.transformStyle=c?"":"preserve-3d",e.wrote3d=!c),e.plane.style.willChange!=="transform"&&(e.plane.style.willChange="transform"),e.plane.style.transform=c?Tt(n,o,0,a):`matrix3d(${Array.from(r.view(t.hostRect),i=>+i.toFixed(6)).join(",")})`,nl(e)}function nl(e){typeof setTimeout=="function"&&(clearTimeout(e.refocusTimer),e.refocusTimer=setTimeout(()=>{e.refocusTimer=null,e.refocusDue=!0,v(e)},tl))}function ol(e){let t=e.getBoundingClientRect();return t.width>0&&t.height>0?t:mr}function Rt(e){let t=R(e);$(e.el)===t.host&&e.el.parentElement!==t.plane&&t.plane.appendChild(e.el),t.dirty.add(e),t.measure.add(e),He(t,e.el),t.view&&Hn(t,e.el),v(t),Ie(e)}function $t(e){let t=e;for(let r=0;t&&!g(t)?.root&&r<Fe;r+=1)t=$(t);return t?g(t)?.root??null:null}function Tr(e,t){for(let n of[t,...t.querySelectorAll(`[${O}]`)]){let o=g(n);e.demoted?.delete(n),wr(e,n),e.dirty.delete(o),e.measure.delete(o),o&&it(o)}if(!t.ownerDocument.createTreeWalker(t,NodeFilter.SHOW_COMMENT).nextNode())return;let r=Array.from(e.ids.values()).filter(n=>!n.isConnected&&fe(t,n));for(let n of r)wr(e,n)}function He(e,t,r=t.id){wr(e,t);let n=g(t);!r||!n||(e.ids.set(String(r),t),n.id=String(r))}function wr(e,t){let r=g(t)?.id;r&&e.ids.get(r)===t&&e.ids.delete(r)}function Sr(e,t){let r=String(t);return e.ids.get(r)??e.host?.querySelector(`[${O}][id="${r.replace(/["\\]/g,"\\$&")}"]`)??null}function Er(e,t){let r=t&&t!==e.host?t:null;if(r===e.view)return!1;e.view=r,e.chain=r?new Set:null;for(let n=r,o=0;n&&o<Fe;o+=1,n=$(n))e.chain.add(n);return!0}function Lt(e,t){return!e.view||e.chain.has(t)||fe(e.view,t)}function Ar(e){for(let t of e.demoted)t.hidden=!1;if(e.demoted.clear(),!!e.view)for(let t of e.host.querySelectorAll(`[${O}]`))Hn(e,t)}function Hn(e,t){t.hidden||Lt(e,t)||!Lt(e,$(t))||(t.hidden=!0,e.demoted.add(t))}var tl,Or=J(()=>{gr();vr();At();Et();xe();Ct();tl=150});function h(e){let t=typeof e=="string"?document.querySelector(e):e instanceof Nt?e.el:e;if(!t||t.nodeType!==1)throw new TypeError(`blit: no element for ${String(e)}`);let r=g(t);if(r)return r.handle;let n=ur(t),o=new Nt(n),a=Ne(t)||!t.isConnected,c=t.parentElement?.closest(`[${ne}]`);if(a||c&&g(c))return dl(n),ul(n),a||Rt(n),o;let i=Gn(n);Ie(n);for(let s of i.host.querySelectorAll(`[${O}]`))try{h(s)}catch(l){al.error(`blit: #${s.id||"?"} could not be adopted`,l)}return o}function oe(e,t){let r=Pn(e,t);if(!r)return null;let n=h(r);return t?.defaults&&n.set(t.defaults),n}function cl(e,t,r){let n=(t==="w"||t==="h")&&r==null;if(!n&&!Number.isFinite(Number(r)))throw new TypeError(`blit.set: ${t}=${String(r)} is not a number`);e[t]=n?null:Number(r)}function il(e,t){t==null||t===""?e.el.removeAttribute("id"):e.el.id=String(t);let r=$t(e.el);r&&r.host!==e.el&&He(r,e.el)}function sl(e,t){if(!t||typeof t!="object")throw new TypeError("blit.set: fill must be an object");let r=Xn(e);for(let[n,o]of Object.entries(t)){let a=r.find(c=>c.getAttribute(je)===n);if(!a)throw new TypeError(`blit.set: no slot "${n}"`);a.hasAttribute(mt)?a.innerHTML=String(o??""):a.textContent=String(o??"")}}function ll(e){return e.hasAttribute(mt)?e.innerHTML:e.textContent}function Xn(e){let t=Ne(e)?e.content:e;return Array.from(t.querySelectorAll(`[${je}]`)).filter(r=>{let n=r.parentElement?.closest(`[${je}]`);return!(!!n&&n!==e&&t.contains(n))&&(t!==e||r.closest(`[${O}]`)===e)})}function kr(e,t){let r=R(e);if(!r)throw new TypeError(`blit.${t}: a potential blit has no root`);return r}function dl(e){let t=Ne(e.el)?null:$e(e.el.getAttribute(Re)??"");if(!t)return;e.el.children.length===0&&e.el.appendChild(t.content.cloneNode(!0));let r=xt(e.el);for(let[n,o]of Object.entries(h(t).spec))!(n in r)&&!Vn.has(n)&&n!=="fill"&&ve(e.el,n,o===!0?"":o)}function ul(e){let t=xt(e.el);for(let r of ue)t[r]!==void 0&&(e[r]=t[r],ve(e.el,r,null),e.changed.add(r))}var Vn,al,Nt,_r=J(()=>{xe();ce();yt();At();Or();_t();Ct();Vn=new Set(ue),al=P("blit"),Nt=class e{#e;constructor(t){this.#e=t,t.handle=this}get el(){return this.#e.el}get x(){return this.#e.x}get y(){return this.#e.y}get z(){return this.#e.z}get size(){return _e(this.#e)}get bounds(){return Ue(this.#e)}get parent(){let t=$(this.#e.el);return t?h(t):null}get blits(){return gt(this.#e.el).map(h)}get spec(){let t=this.#e,r=xt(t.el);for(let o of ue)delete r[o];Un(t,r),t.el.id&&(r.id=t.el.id),r.x=t.x,r.y=t.y,t.z!==0&&(r.z=t.z),t.w!==null&&(r.w=t.w),t.h!==null&&(r.h=t.h);let n=Xn(t.el).map(o=>[o.getAttribute(je),ll(o)]);return n.length>0&&(r.fill=Object.fromEntries(n)),r}set(t){if(!t||typeof t!="object")throw new TypeError("blit.set: expected an object");let r=this.#e;if(r.root&&ue.some(c=>c in t))throw new TypeError("blit.set: a root has no placement; move its camera with view()");let n=!1,o=!1;for(let[c,i]of Object.entries(t))Vn.has(c)?cl(r,c,i):c==="id"?il(r,i):c==="fill"?(sl(r.el,i),n=!0):Fn(r,c,i)?o=!0:(ve(r.el,c,i),n=!0,o||=c==="type"),r.changed.add(c);if((o||r.retryTraits)&&Ie(r),r.root||Ne(r.el))return r.changed.clear(),this;let a=R(r);return a?(a.dirty.add(r),n&&a.measure.add(r),v(a),this):(hr(null,r),this)}blit(t={}){let r=this.#e,n=t.type===void 0?null:$e(t.type);if(t.type!==void 0&&!n)throw new TypeError(`blit: unknown type "${t.type}"`);let o=Dn(n),a=new e(ur(o)),c=n?h(n).spec:{},i={...c,...t};return c.fill&&t.fill&&(i.fill={...c.fill,...t.fill}),a.set(i),(r.root?r.root.plane:Ce(r.el)).appendChild(o),Rt(a.#e),a}on(t,r,n){return this.#e.el.addEventListener(t,r,n),()=>this.#e.el.removeEventListener(t,r,n)}emit(t,r=null){let n=new CustomEvent(t,{bubbles:!0,cancelable:!0,detail:{payload:r,source:this}});return this.#e.el.dispatchEvent(n),n}remove(){let t=this.#e;this.emit("remove");let r=$t(t.el);r&&Tr(r,t.el),r?.view&&(r.view===t.el||t.el.contains(r.view))&&Er(r,null)&&Ar(r),t.anchor?.remove(),t.anchor=null,t.el.remove()}get root(){return this.#e.root?h(this.#e.root.view||this.#e.el):null}set root(t){let r=this.#e.root;if(!r)throw new TypeError("blit.root: only a root collection has a root to set");let n=h(t??r.host).el;if(n!==r.host&&!fe(r.host,n))throw new TypeError("blit.root: not a blit of this root");Er(r,n)&&(Ar(r),v(r))}find(t){let r=Sr(kr(this.#e,"find"),t);return r?h(r):null}view(t,r){let n=kr(this.#e,"view"),o=h(t===void 0?n.view||n.host:t);if(!Lt(n,o.el))throw new TypeError("blit.view: the target is hidden by the current root");let a=o.el===n.host,{x:c,y:i,w:s,h:l}=a?{x:0,y:0,w:n.hostRect.width,h:n.hostRect.height}:o.bounds,u=n.camera.fit({x:c,y:i,width:s,height:l},n.hostRect,a?{...r,padding:0,maxZoom:1}:r);return v(n),u}tick(t,r="write"){let n=kr(this.#e,"tick");if(typeof t!="function")throw new TypeError("blit.tick: expected a function");if(!On.includes(r))throw new TypeError(`blit.tick: unknown phase "${r}"`);return n.hooks[r].add(t),v(n),()=>{n.hooks[r].delete(t)}}};h.use=ct});var y=J(()=>{_r();Ct();At();vr();gr();Et();Or();yt();_t();xe()});var Ab={};Es(Ab,{allBlits:()=>bs,applyTheme:()=>fc,blit:()=>h,createBoard:()=>gs,go:()=>De,loaderApi:()=>xs,reactionsOf:()=>an,registerKit:()=>Eb,type:()=>oe});y();y();y();ce();var Wn="edit",Kn="data-editing",pl='input, textarea, select, [contenteditable=""], [contenteditable="true"]',Ve=new WeakMap;function qn(e){return Ve.has(e.el)}function Me(e,t=null){return Ve.has(e.el)?!1:(Ve.set(e.el,{node:t||null,replay:null}),e.el.setAttribute(Kn,""),e.emit(Wn,!0),!0)}function ye(e){let t=Ve.get(e.el);return t?(Ve.delete(e.el),e.el.removeAttribute(Kn),t.replay?.(),e.emit(Wn,!1),!0):!1}function Zn(e,t){let r=Ve.get(e.el);return r?(typeof t=="function"&&(r.replay=t),!0):!1}function Jn(e){let t=n=>{let o=n.target;typeof o?.matches=="function"&&o.matches(pl)&&Me(e,o)},r=n=>{(!n.relatedTarget||!e.el.contains(n.relatedTarget))&&ye(e)};return e.el.addEventListener("focusin",t),e.el.addEventListener("focusout",r),()=>{e.el.removeEventListener("focusin",t),e.el.removeEventListener("focusout",r),ye(e)}}var Qn=P("widget"),ml=new Set(["__proto__","constructor","prototype"]),Xe=new Map,Cr=new WeakMap;function m(e,t){let r=t==null?"":String(t);e.data!==r&&(e.data=r)}function E(e,t){e.hidden!==!t&&(e.hidden=!t)}function b(e,t,r,n,o){n[o]!==r&&(n[o]=r,e.setAttribute(t,r))}function We(e,t,r,n,o){r[n]!==o&&(r[n]=o,e.innerHTML=t)}function p(e){let t=e.firstChild;return t&&t.nodeType===3?t:e.insertBefore(document.createTextNode(""),t)}function eo(e,t){return e?e.has(t):!ml.has(t)}function hl(e,t,r){if(r===!0||r===void 0||r===null||r==="")return new Map;if(typeof r!="object"||Array.isArray(r))return Qn.warn(`${e}: expected {key: value} contents; rendering none`),new Map;let n=new Map;for(let[o,a]of Object.entries(r))eo(t,o)?n.set(o,a):Qn.warn(`${e}: key "${o}" not permitted`);return n}function gl(e){return e.emit("dismiss").defaultPrevented?!1:(e.remove(),!0)}function bl(e){let t=e?.content.firstElementChild;return t?Array.from(t.classList,n=>`.${CSS.escape(n)}`).join("")||t.localName:null}function xl(e,t){let r=$e(t),n=bl(r);n&&!e.querySelector(`:scope > ${n}`)&&e.prepend(r.content.cloneNode(!0))}function vl({name:e,bind:t,render:r},n){return(o,a)=>{let c=hl(e,n,a);xl(o.el,e);let i=[],s=(d,f,x)=>{d.addEventListener(f,x),i.push(()=>d.removeEventListener(f,x))},l=t(o.el,s,()=>gl(o));Cr.has(o.el)||Cr.set(o.el,{});let u=()=>r(l,c,Cr.get(o.el));return Zn(o,u)||u(),()=>{for(let d of i)d()}}}function w(e){let{name:t,html:r,keys:n}=e,o=Xe.get(t);if(o&&o!==e)throw new TypeError(`widget: "${t}" is already defined`);if(!o){let a=pe(t);h.use({[a]:vl(e,n?new Set(n):null)}),oe(t,{html:r,defaults:{...e.defaults,[a]:!0}}),Xe.set(t,e)}return oe(t)}function to(){return Array.from(Xe.keys(),e=>pe(e))}function ie(e){let t=e.el.getAttribute("data-type");return t&&Xe.has(t)?pe(t):null}function _(e){let t=ie(e),r=t?e.spec[t]:null;return r&&typeof r=="object"?{...r}:{}}function we(e,t){let r=ie(e),n=e.el.getAttribute("data-type");if(!r)throw new TypeError(`setContents: "${n}" is not a widget`);let{keys:o}=Xe.get(n),a=o?new Set(o):null;for(let i of Object.keys(t))if(!eo(a,i))throw new TypeError(`${n}: key "${i}" not permitted`);let c={..._(e),...t};for(let i of Object.keys(c))c[i]===void 0&&delete c[i];return e.set({[r]:Object.keys(c).length>0?c:!0})}function X(e,t,r){return we(e,{[t]:r})}function N(e,t={}){let r=Xe.get(e);if(!r)throw new TypeError(`widgetSpec: "${e}" is not a widget`);let n=new Set(r.keys??[]),o={...t.contents??{}},a={};for(let[c,i]of Object.entries(t))c==="contents"||i===void 0||(n.has(c)?o[c]=i:a[c]=i);return a.type=e,Object.keys(o).length>0&&(a[pe(e)]=o),a}var ro=`
/* ------------------ FOUNDATION ------------------ */

/* Matched on the attribute, not on a class list: the kit's own geometry must
   hold for every widget in it, including the ones added after this line. */
[class*="cloudcanvas-lib-"] {
  box-sizing: border-box;
}

/*
 * The whole accessibility argument for using native controls, in one rule. It
 * matches any focused element that is - or sits inside - a kit widget, so a new
 * widget inherits the ring instead of having to remember it, and it fires only
 * for keyboard focus, which is what \`:focus-visible\` is for.
 */
[class*="cloudcanvas-lib-"]:focus-visible,
[class*="cloudcanvas-lib-"] button:focus-visible,
[class*="cloudcanvas-lib-"] input:focus-visible,
[class*="cloudcanvas-lib-"] select:focus-visible,
[class*="cloudcanvas-lib-"] textarea:focus-visible,
[class*="cloudcanvas-lib-"] [role="switch"]:focus-visible,
[class*="cloudcanvas-lib-"] [tabindex]:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

/* ------------------ BUTTON ------------------ */

.cloudcanvas-lib-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  color: var(--cc-btn-text, #7dd3fc);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-medium, 500);
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.cloudcanvas-lib-button:hover:not(:disabled) {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-lib-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/*
 * A filled variant needs a foreground that clears its own fill in both themes,
 * and the token that already flips with the surface is the canvas background:
 * dark ink on the light-blue dark-theme accent, light ink on the deeper light-
 * theme accent. That is why no new "on-accent" token is invented here.
 */
.cloudcanvas-lib-button-primary {
  background: var(--cc-accent, #38bdf8);
  border-color: var(--cc-accent, #38bdf8);
  color: var(--cc-bg, #0f1117);
}

.cloudcanvas-lib-button-primary:hover:not(:disabled) {
  background: var(--cc-accent, #38bdf8);
  border-color: var(--cc-accent, #38bdf8);
  opacity: 0.88;
}

.cloudcanvas-lib-button-secondary {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border-color: var(--cc-card-border, rgba(255, 255, 255, 0.1));
  color: var(--cc-text, #e2e8f0);
}

.cloudcanvas-lib-button-secondary:hover:not(:disabled) {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border-color: var(--cc-scope-border, rgba(255, 255, 255, 0.15));
}

.cloudcanvas-lib-button-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--cc-text-muted, #94a3b8);
}

.cloudcanvas-lib-button-ghost:hover:not(:disabled) {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border-color: transparent;
  color: var(--cc-text, #e2e8f0);
}

.cloudcanvas-lib-button-danger {
  background: var(--cc-tone-danger, #f87171);
  border-color: var(--cc-tone-danger, #f87171);
  color: var(--cc-bg, #0f1117);
}

.cloudcanvas-lib-button-danger:hover:not(:disabled) {
  background: var(--cc-tone-danger, #f87171);
  border-color: var(--cc-tone-danger, #f87171);
  opacity: 0.88;
}

/* ------------------ FIELD SHELLS ------------------ */

.cloudcanvas-lib-input,
.cloudcanvas-lib-select,
.cloudcanvas-lib-slider {
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-1, 4px);
  width: 100%;
}

.cloudcanvas-lib-input-label,
.cloudcanvas-lib-select-label,
.cloudcanvas-lib-slider-label,
.cloudcanvas-lib-progress-label {
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
  line-height: 1.35;
}

.cloudcanvas-lib-input-control,
.cloudcanvas-lib-select-control {
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid var(--cc-input-border, rgba(255, 255, 255, 0.16));
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-input-bg, rgba(255, 255, 255, 0.06));
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.35;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.cloudcanvas-lib-input-control::placeholder {
  color: var(--cc-text-muted, #94a3b8);
  opacity: 1;
}

/* Stated for the pointer path too: \`:focus-visible\` carries the ring, this
   carries the field's own border, and a mouse user gets the second. */
.cloudcanvas-lib-input-control:focus,
.cloudcanvas-lib-select-control:focus {
  border-color: var(--cc-input-border-focus, var(--cc-accent, #38bdf8));
}

.cloudcanvas-lib-input-control:disabled,
.cloudcanvas-lib-select-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cloudcanvas-lib-select-control {
  cursor: pointer;
}

/* ------------------ CHECKBOX / RADIO ------------------ */

.cloudcanvas-lib-checkbox,
.cloudcanvas-lib-radio,
.cloudcanvas-lib-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-height: var(--cc-control-min, 28px);
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.35;
  cursor: pointer;
}

.cloudcanvas-lib-checkbox-control,
.cloudcanvas-lib-radio-control {
  flex: none;
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--cc-accent, #38bdf8);
  cursor: pointer;
}

.cloudcanvas-lib-checkbox-label,
.cloudcanvas-lib-radio-label,
.cloudcanvas-lib-toggle-label {
  min-width: 0;
}

.cloudcanvas-lib-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-1, 4px);
}

.cloudcanvas-lib-radio-group-label {
  color: var(--cc-text-muted, #94a3b8);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-medium, 500);
  line-height: 1.35;
}

/* ------------------ TOGGLE ------------------ */

/*
 * One element, no JavaScript: \`appearance: none\` turns the checkbox itself into
 * the track and its \`::after\` into the thumb, so the switch keeps the native
 * checkbox's keyboard operation, focus behaviour and checked state entirely.
 * The alternative - a visually hidden input beside two spans - needs the same
 * CSS plus a label association to stay operable, and buys nothing.
 */
.cloudcanvas-lib-toggle-control {
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  flex: none;
  width: 34px;
  height: 18px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--cc-input-border, rgba(255, 255, 255, 0.16));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-track-bg, rgba(255, 255, 255, 0.16));
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cloudcanvas-lib-toggle-control::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-thumb-bg, #e2e8f0);
  transition: transform 0.15s ease;
}

.cloudcanvas-lib-toggle-control:checked {
  background: var(--cc-accent, #38bdf8);
  border-color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-lib-toggle-control:checked::after {
  transform: translateX(16px);
}

.cloudcanvas-lib-toggle-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ------------------ SLIDER ------------------ */

/*
 * \`accent-color\` rather than a rebuilt track: styling a range input from
 * scratch means \`appearance: none\` plus a per-engine thumb rule, and every one
 * of those rules is a place the keyboard affordance can be lost. The native
 * control tinted to the theme is the better trade.
 */
.cloudcanvas-lib-slider-control {
  width: 100%;
  margin: 0;
  accent-color: var(--cc-accent, #38bdf8);
  cursor: pointer;
}

.cloudcanvas-lib-slider-row {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
}

.cloudcanvas-lib-slider-value,
.cloudcanvas-lib-progress-value {
  flex: none;
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-xs, 11px);
  font-variant-numeric: tabular-nums;
  line-height: 1.35;
}
`;var no=`

/* ------------------ SLOTTED CUSTOM TYPES ------------------ */

/*
 * A slotted custom type (cloudcanvas-site \`slotted-type.js\`) stacks its named regions -
 * a header over a body - and the separation is the whole point of the shape, so
 * it is drawn here rather than left to the content flow: a border between
 * adjacent regions, and the first (header) region carried in the body text
 * colour and a heavier weight so it reads as the title of the ones below it.
 */
.cloudcanvas-card-slots {
  display: flex;
  flex-direction: column;
}

.cloudcanvas-card-slot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--cc-space-2, 8px) 0;
}

.cloudcanvas-card-slot + .cloudcanvas-card-slot {
  border-top: 1px solid var(--cc-border, #334155);
}

.cloudcanvas-card-slot-field {
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-sm, 12px);
  line-height: 1.4;
}

.cloudcanvas-card-slot:first-child .cloudcanvas-card-slot-field {
  color: var(--cc-text, #e2e8f0);
  font-weight: var(--cc-weight-semibold, 600);
}

/* ------------------ TEXT ------------------ */

.cloudcanvas-lib-text {
  margin: 0;
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.45;
}

.cloudcanvas-lib-text-xs {
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-lib-text-sm {
  font-size: var(--cc-type-sm, 12px);
}

.cloudcanvas-lib-text-md {
  font-size: var(--cc-type-md, 13px);
}

.cloudcanvas-lib-text-lg {
  font-size: var(--cc-type-lg, 15px);
}

.cloudcanvas-lib-text-medium {
  font-weight: var(--cc-weight-medium, 500);
}

.cloudcanvas-lib-text-semibold {
  font-weight: var(--cc-weight-semibold, 600);
}

.cloudcanvas-lib-text-muted {
  color: var(--cc-text-muted, #94a3b8);
}

/* ------------------ BADGE ------------------ */

.cloudcanvas-lib-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
  color: var(--cc-badge-text, #38bdf8);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  white-space: nowrap;
}

/*
 * No per-tone badge modifier class: a tone's contrast depends on what it sits
 * on, so badge.js computes --cc-badge-bg/-border/-text per instance (see
 * toneSurface(), composited over the assumed card surface) and writes them as
 * inline custom properties instead. A class here would print the raw tone hue
 * as text - unreadable at low alpha - which is the exact defect an earlier
 * pass shipped and a ship-readiness review caught.
 */

.cloudcanvas-lib-badge-dismiss,
.cloudcanvas-lib-alert-dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: var(--cc-radius-pill, 9999px);
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  line-height: 1;
  cursor: pointer;
}

.cloudcanvas-lib-badge-dismiss:hover,
.cloudcanvas-lib-alert-dismiss:hover {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

/* ------------------ AVATAR ------------------ */

.cloudcanvas-lib-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  overflow: hidden;
  width: 32px;
  height: 32px;
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  text-transform: uppercase;
  user-select: none;
}

.cloudcanvas-lib-avatar-sm {
  width: 24px;
  height: 24px;
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-lib-avatar-lg {
  width: 48px;
  height: 48px;
  font-size: var(--cc-type-lg, 15px);
}

.cloudcanvas-lib-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cloudcanvas-lib-avatar-initials {
  letter-spacing: 0.02em;
}

/* ------------------ DIVIDER ------------------ */

.cloudcanvas-lib-divider {
  width: 100%;
  height: 0;
  margin: var(--cc-space-2, 8px) 0;
  border: 0;
  border-top: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
}

.cloudcanvas-lib-divider-vertical {
  align-self: stretch;
  width: 0;
  height: auto;
  margin: 0 var(--cc-space-2, 8px);
  border-top: 0;
  border-left: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
}

/* ------------------ PROGRESS ------------------ */

/*
 * A native \`<progress>\` paints through engine pseudo-elements, so the same two
 * colours have to be stated three times: the WebKit bar and value, and Gecko's
 * single value element. \`background\` on the element itself is the Gecko track.
 */
.cloudcanvas-lib-progress {
  appearance: none;
  -webkit-appearance: none;
  display: block;
  overflow: hidden;
  width: 100%;
  height: 6px;
  border: 0;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-track-bg, rgba(255, 255, 255, 0.16));
  color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-lib-progress::-webkit-progress-bar {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-track-bg, rgba(255, 255, 255, 0.16));
}

.cloudcanvas-lib-progress::-webkit-progress-value {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
  transition: width 0.2s ease;
}

.cloudcanvas-lib-progress::-moz-progress-bar {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
}

.cloudcanvas-lib-progress-success::-webkit-progress-value {
  background: var(--cc-tone-success, #22c55e);
}
.cloudcanvas-lib-progress-success::-moz-progress-bar {
  background: var(--cc-tone-success, #22c55e);
}

.cloudcanvas-lib-progress-warning::-webkit-progress-value {
  background: var(--cc-tone-warning, #eab308);
}
.cloudcanvas-lib-progress-warning::-moz-progress-bar {
  background: var(--cc-tone-warning, #eab308);
}

.cloudcanvas-lib-progress-danger::-webkit-progress-value {
  background: var(--cc-tone-danger, #f87171);
}
.cloudcanvas-lib-progress-danger::-moz-progress-bar {
  background: var(--cc-tone-danger, #f87171);
}

/* Column, not row: the caption sits above the bar, full width, per contract. */
.cloudcanvas-lib-progress-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--cc-space-1, 4px);
}

.cloudcanvas-lib-progress-label {
  color: var(--cc-text-muted, #94a3b8);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-sm, 12px);
  line-height: 1.35;
}

/* ------------------ SPINNER ------------------ */

.cloudcanvas-lib-spinner {
  display: inline-block;
  flex: none;
  width: 16px;
  height: 16px;
  border: 2px solid var(--cc-track-bg, rgba(255, 255, 255, 0.16));
  border-top-color: var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-pill, 9999px);
  animation: cloudcanvas-lib-spin 0.8s linear infinite;
}

.cloudcanvas-lib-spinner-sm {
  width: 12px;
  height: 12px;
}

.cloudcanvas-lib-spinner-lg {
  width: 24px;
  height: 24px;
  border-width: 3px;
}

@keyframes cloudcanvas-lib-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ------------------ ALERT ------------------ */

.cloudcanvas-lib-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--cc-space-2, 8px);
  width: 100%;
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 3px solid var(--cc-tone-info, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.45;
}

.cloudcanvas-lib-alert-info {
  border-left-color: var(--cc-tone-info, #38bdf8);
}

.cloudcanvas-lib-alert-success {
  border-left-color: var(--cc-tone-success, #22c55e);
}

.cloudcanvas-lib-alert-warning {
  border-left-color: var(--cc-tone-warning, #eab308);
}

.cloudcanvas-lib-alert-danger {
  border-left-color: var(--cc-tone-danger, #f87171);
}

.cloudcanvas-lib-alert-content {
  flex: 1;
  min-width: 0;
}

.cloudcanvas-lib-alert-title {
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1.35;
}

.cloudcanvas-lib-alert-body {
  color: var(--cc-text-muted, #94a3b8);
}

/* ------------------ LIST ------------------ */

.cloudcanvas-lib-list {
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-1, 4px);
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cloudcanvas-lib-list-item {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid transparent;
  border-radius: var(--cc-radius-sm, 6px);
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.35;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cloudcanvas-lib-list-item:hover {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-lib-list-item-selected {
  border-color: var(--cc-accent, #38bdf8);
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
}

.cloudcanvas-lib-list-item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ------------------ ENVIRONMENT ------------------ */

/* A coarse pointer gets the full 44px target without moving the desktop look,
   which is the rule the core sheet already states for its own action button. */
@media (pointer: coarse) {
  .cloudcanvas-lib-button,
  .cloudcanvas-lib-input-control,
  .cloudcanvas-lib-select-control,
  .cloudcanvas-lib-checkbox,
  .cloudcanvas-lib-radio,
  .cloudcanvas-lib-toggle,
  .cloudcanvas-lib-list-item {
    min-height: var(--cc-control-min-coarse, 44px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-lib-button,
  .cloudcanvas-lib-input-control,
  .cloudcanvas-lib-select-control,
  .cloudcanvas-lib-toggle-control,
  .cloudcanvas-lib-toggle-control::after,
  .cloudcanvas-lib-list-item {
    transition: none;
  }

  .cloudcanvas-lib-progress::-webkit-progress-value {
    transition: none !important;
  }

  /* Slowed rather than stopped: the spinner's whole job is to say "still
     working", and a frozen ring says the opposite. One turn every six seconds
     carries no motion signal worth triggering on. */
  .cloudcanvas-lib-spinner {
    animation-duration: 6s;
  }
}
`;var oo=`${ro}${no}`,ao="cloudcanvas-lib-styles";function z(e=""){if(typeof document>"u")return null;let t=document.getElementById(ao);return t||(t=document.createElement("style"),t.id=ao,t.textContent=typeof e=="string"&&e.trim()!==""?`${oo}
${e}`:oo,document.head.appendChild(t),t)}var yl="button",It="cloudcanvas-lib-button",wl=new Set(["primary","secondary","ghost","danger"]),Tl="secondary";function Sl(e){let t=e.querySelector(`.${It}`);return{root:t,label:p(t)}}function El(e,t,r){m(e.label,t.get("label")),Al(e.root,t.get("variant"),r);let n=t.get("disabled")===!0;e.root.disabled!==n&&(e.root.disabled=n)}function Al(e,t,r){let n=wl.has(t)?t:Tl;r.variant!==n&&(r.variant&&e.classList.remove(`${It}-${r.variant}`),r.variant=n,e.classList.add(`${It}-${n}`))}var Ol=Object.freeze({name:yl,html:`<button class="${It}" type="button"></button>`,keys:["label","variant","disabled"],bind:Sl,render:El});function co(){return z(),w(Ol)}_r();function k(e){return e==null?"":String(e)}function ee(e,t){let r=Number(e);return Number.isFinite(r)?r:t}var Lr=new WeakMap,io=0;function so(e){return e.id?e.id:(Lr.has(e)||(io+=1,Lr.set(e,`cc-control-${io}`)),Lr.get(e))}function Mt(e,t,r="control"){let n=`${so(e)}-${r}`;return t.id!==n&&(t.id=n),n}function se(e,t,r,n="control"){let o=Mt(e,t,n);r.getAttribute("for")!==o&&r.setAttribute("for",o)}function q(e,t,r){m(t,r),E(e,!!r)}function Y(e,t,r){let n=r===!0;e[t]!==n&&(e[t]=n)}function Te(e){e.stopPropagation()}function Se(e,t,r,n,o,a){e(r,n,c=>{Te(c);let i=a(r);X(t,o,i),t.emit(n,i)})}var kl="input",po="cloudcanvas-lib-input",mo="cloudcanvas-lib-input-label",lo="cloudcanvas-lib-input-control",_l=new Set(["text","email","password","number"]),Cl="text";function Ll(e,t){X(e,"value",t.value),ye(e),e.emit("change",t.value)}function uo(e,t,r){t(r,"focus",()=>Me(e,r)),t(r,"input",n=>{Te(n),e.emit("input",r.value)}),t(r,"change",Te),t(r,"blur",()=>Ll(e,r))}function Rl(e,t){let r=h(e),n=e.querySelector(`.${po}`),o=n.querySelector(`.${mo}`),a=n.querySelector("input"),c=n.querySelector("textarea");return Mt(e,a,"control"),Mt(e,c,"control-multiline"),uo(r,t,a),uo(r,t,c),{root:n,label:o,labelText:p(o),single:a,multi:c}}function fo(e,t,r,n){b(e,"placeholder",k(t.get("placeholder")),r,`${n}:placeholder`),Y(e,"disabled",t.get("disabled")),Y(e,"required",t.get("required"))}function $l(e,t,r){let n=t.get("multiline")===!0,o=n?e.multi:e.single;E(e.single,!n),E(e.multi,n),b(e.label,"for",o.id,r,"for"),q(e.label,e.labelText,t.get("label"));let a=t.get("type");b(e.single,"type",_l.has(a)?a:Cl,r,"type"),fo(e.single,t,r,"single"),fo(e.multi,t,r,"multi");let c=k(t.get("value"));o.value!==c&&(o.value=c)}var Nl=Object.freeze({name:kl,html:`<div class="${po}"><label class="${mo}"></label><input class="${lo}"><textarea class="${lo}" hidden></textarea></div>`,keys:["label","value","placeholder","type","multiline","disabled","required"],bind:Rl,render:$l});function ho(){return z(),w(Nl)}var Il="checkbox",go="cloudcanvas-lib-checkbox",bo="cloudcanvas-lib-checkbox-control",xo="cloudcanvas-lib-checkbox-label";function Ml(e,t){let r=e.querySelector(`.${go}`),n=r.querySelector(`.${bo}`),o=r.querySelector(`.${xo}`);return se(e,n,o),Se(t,h(e),n,"change","checked",a=>a.checked),{root:r,control:n,label:o,labelText:p(o)}}function Pl(e,t){q(e.label,e.labelText,t.get("label")),Y(e.control,"checked",t.get("checked")),Y(e.control,"disabled",t.get("disabled"))}var zl=Object.freeze({name:Il,html:`<div class="${go}"><input class="${bo}" type="checkbox"><label class="${xo}"></label></div>`,keys:["label","checked","disabled"],bind:Ml,render:Pl});function vo(){return z(),w(zl)}var Dl="radio",Bl="radio-group",yo="cloudcanvas-lib-radio",wo="cloudcanvas-lib-radio-control",To="cloudcanvas-lib-radio-label",jl="cloudcanvas-lib-radio-group",So="cloudcanvas-lib-radio-group-label";function Fl(e,t){if(!(!e.parent||!t))for(let r of e.parent.blits){if(r===e)continue;let n=_(r);n.group===t&&n.checked===!0&&X(r,"checked",!1)}}function Ul(e,t,r){if(Te(r),!t.checked)return;X(e,"checked",!0);let{group:n,value:o}=_(e);Fl(e,n),e.emit("change",{value:o})}function Yl(e,t){let r=h(e),n=e.querySelector(`.${yo}`),o=n.querySelector(`.${wo}`),a=n.querySelector(`.${To}`);return se(e,o,a),t(o,"change",c=>Ul(r,o,c)),{root:n,control:o,label:a,labelText:p(a)}}function Gl(e,t,r){let{control:n}=e;q(e.label,e.labelText,t.get("label")),b(n,"name",k(t.get("group")),r,"name"),b(n,"value",k(t.get("value")),r,"value");let o=t.get("checked")===!0;r.checked!==o&&(r.checked=o,n.checked=o),Y(n,"disabled",t.get("disabled"))}function Hl(e){let t=e.querySelector(`.${So}`);return{label:t,labelText:p(t)}}function Vl(e,t){q(e.label,e.labelText,t.get("label"))}var Xl=Object.freeze({name:Dl,html:`<div class="${yo}"><input class="${wo}" type="radio"><label class="${To}"></label></div>`,keys:["label","group","value","checked","disabled"],bind:Yl,render:Gl}),Wl=Object.freeze({name:Bl,html:`<div class="${jl}" data-scope><span class="${So}"></span></div>`,keys:["label"],bind:Hl,render:Vl});function Eo(){return z(),w(Xl)}function Ao(){return z(),w(Wl)}var Kl="toggle",Oo="cloudcanvas-lib-toggle",ko="cloudcanvas-lib-toggle-control",_o="cloudcanvas-lib-toggle-label";function ql(e,t){let r=e.querySelector(`.${Oo}`),n=r.querySelector(`.${ko}`),o=r.querySelector(`.${_o}`);return se(e,n,o),Se(t,h(e),n,"change","checked",a=>a.checked),{root:r,control:n,label:o,labelText:p(o)}}function Zl(e,t){let{control:r}=e;q(e.label,e.labelText,t.get("label"));let n=t.get("checked")===!0;Y(r,"checked",n),r.getAttribute("aria-checked")!==String(n)&&r.setAttribute("aria-checked",String(n)),Y(r,"disabled",t.get("disabled"))}var Jl=Object.freeze({name:Kl,html:`<div class="${Oo}"><input class="${ko}" type="checkbox" role="switch"><label class="${_o}"></label></div>`,keys:["label","checked","disabled"],bind:ql,render:Zl});function Co(){return z(),w(Jl)}var Ql="slider",$o="cloudcanvas-lib-slider",No="cloudcanvas-lib-slider-label",ed="cloudcanvas-lib-slider-row",Io="cloudcanvas-lib-slider-control",Mo="cloudcanvas-lib-slider-value",td=0,Lo=100,Ro=1;function rd(e,t){let r=h(e),n=e.querySelector(`.${$o}`),o=n.querySelector(`.${No}`),a=n.querySelector(`.${Io}`),c=n.querySelector(`.${Mo}`),i=p(c);return se(e,a,o),t(a,"input",s=>{Te(s),m(i,a.value),r.emit("input",Number(a.value))}),Se(t,r,a,"change","value",s=>Number(s.value)),{root:n,label:o,labelText:p(o),control:a,readout:c,readoutText:i}}function nd(e,t,r){let{control:n}=e;q(e.label,e.labelText,t.get("label"));let o=ee(t.get("min"),td),a=ee(t.get("max"),Lo),c=a>o?a:Lo,i=ee(t.get("step"),Ro);b(n,"min",String(o),r,"min"),b(n,"max",String(c),r,"max"),b(n,"step",String(i>0?i:Ro),r,"step");let s=String(Math.min(Math.max(ee(t.get("value"),o),o),c));n.value!==s&&(n.value=s),m(e.readoutText,s),Y(n,"disabled",t.get("disabled"))}var od=Object.freeze({name:Ql,html:`<div class="${$o}"><label class="${No}"></label><div class="${ed}"><input class="${Io}" type="range"><span class="${Mo}"></span></div></div>`,keys:["label","value","min","max","step","disabled"],bind:rd,render:nd});function Po(){return z(),w(od)}var Ee="data-cc-key";function ad(e,t){if(e&&typeof e=="object"){if(e.id!==void 0&&e.id!==null)return e.id;if(e.key!==void 0&&e.key!==null)return e.key}return t}function zo(e){let t=e.firstElementChild;for(;t&&!t.hasAttribute(Ee);)t=t.nextElementSibling;return t}function Do(e){let t=e?e.nextElementSibling:null;for(;t&&!t.hasAttribute(Ee);)t=t.nextElementSibling;return t}function cd(e){let t=new Map;for(let r=zo(e);r;r=Do(r)){let n=r.getAttribute(Ee);t.has(n)||t.set(n,r)}return t}function le(e,t,r={}){if(!e||typeof e.insertBefore!="function")return[];if(typeof r.create!="function")throw new TypeError("reconcileKeyedList: options.create must be a function");let n=typeof r.key=="function"?r.key:ad,o=typeof r.update=="function"?r.update:null,a=cd(e),c=[],i=zo(e),s=0;for(let l of t||[]){let u=String(n(l,s)),d=a.get(u)||id(r.create,l,s,u);a.delete(u),o&&o(d,l,s),d===i?i=Do(i):e.insertBefore(d,i),c.push(d),s+=1}for(let l of a.values())l.remove();return c}function id(e,t,r,n){let o=e(t,r);if(!o||typeof o.setAttribute!="function")throw new TypeError(`reconcileKeyedList: create() returned no element for key "${n}"`);return o.setAttribute(Ee,n),o}var sd="dropdown",Bo="cloudcanvas-lib-select",jo="cloudcanvas-lib-select-label",Fo="cloudcanvas-lib-select-control";function Uo(e){return k(e&&e.value)}function ld(e){let t=document.createElement("option");return t.value=Uo(e),p(t),t}function dd(e,t){let r=e.querySelector(`.${Bo}`),n=r.querySelector(`.${jo}`),o=r.querySelector(`.${Fo}`);return se(e,o,n),Se(t,h(e),o,"change","value",a=>a.value),{root:r,label:n,labelText:p(n),control:o}}function ud(e,t){let{control:r}=e;q(e.label,e.labelText,t.get("label"));let n=t.get("options");if(le(r,Array.isArray(n)?n:[],{key:Uo,create:ld,update:(o,a)=>m(p(o),a&&a.label)}),t.has("value")){let o=k(t.get("value"));r.value!==o&&(r.value=o)}Y(r,"disabled",t.get("disabled"))}var fd=Object.freeze({name:sd,html:`<div class="${Bo}"><label class="${jo}"></label><select class="${Fo}"></select></div>`,keys:["label","value","options","disabled"],bind:dd,render:ud});function Yo(){return z(),w(fd)}function Go(){return[co(),ho(),vo(),Eo(),Ao(),Co(),Po(),Yo()].map(e=>e.el.getAttribute("data-type"))}var pd=/^#([0-9a-f]{3,8})$/i,md="#f8fafc",hd="#0b1220";function $r(e){if(typeof e!="string")return null;let t=pd.exec(e.trim());if(!t)return null;let r=t[1],n=r.length===3||r.length===4;if(!n&&r.length!==6&&r.length!==8)return null;let o=a=>parseInt(n?r[a].repeat(2):r.slice(a*2,a*2+2),16);return{r:o(0),g:o(1),b:o(2)}}function Rr(e){let t=e/255;return t<=.03928?t/12.92:Math.pow((t+.055)/1.055,2.4)}function Pt(e){let t=$r(e);return t?.2126*Rr(t.r)+.7152*Rr(t.g)+.0722*Rr(t.b):Number.NaN}function Ho(e,t){let r=Math.max(e,t),n=Math.min(e,t);return(r+.05)/(n+.05)}function Pe(e,t=md,r=hd){let n=Pt(e);if(!Number.isFinite(n))return t;let o=Ho(n,Pt(t)),a=Ho(n,Pt(r));return o>=a?t:r}function st(e,t,r){let n=$r(e),o=$r(r);if(!n||!o)return r;let a=(i,s)=>Math.round(i*t+s*(1-t)),c=i=>i.toString(16).padStart(2,"0");return`#${c(a(n.r,o.r))}${c(a(n.g,o.g))}${c(a(n.b,o.b))}`}var gd={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function Ko(e){return e==null?"":String(e).replace(/[&<>"']/g,t=>gd[t])}var bd=64,xd=/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,vd=/^(?:rgb|rgba|hsl|hsla)\([0-9.,%/\s+-]+\)$/i,yd=/^[a-z0-9_,()\- ]+$/i,wd=/^var\(\s*--[a-z0-9_-]+\s*(?:,\s*([^;"'<>]*?)\s*)?\)$/i,Vo="#38bdf8";function Nr(e){if(typeof e!="string")return!1;let t=e.trim();if(t===""||t.length>bd)return!1;if(xd.test(t)||vd.test(t)||yd.test(t))return!0;let r=wd.exec(t);return r?r[1]===void 0||Nr(r[1]):!1}function G(e,t=Vo){return Nr(e)?e.trim():Nr(t)?t.trim():Vo}function T(e,t=0){let r=Number(e);return Number.isFinite(r)?r:Number.isFinite(t)?t:0}var Td=/[\u0000-\u0020\u007F]/g,Sd=/^([a-z][a-z0-9+.-]*):/i,Ed=/^data:image\//i;function de(e,t=""){if(typeof e!="string")return t;let r=e.trim();if(r==="")return t;let n=Sd.exec(r.replace(Td,""));if(!n)return r;let o=n[1].toLowerCase();return o==="http"||o==="https"||o==="data"&&Ed.test(r)?r:t}function qo(e,t={}){let r=t.angle!==void 0?t.angle:(T(e,0)||0)*(t.isRadians?180/Math.PI:1),n=T(r,0),o=G(t.color,"#38bdf8"),a=T(t.size||24,24);return`
<svg width="${a}" height="${a}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${n.toFixed(1)}deg); transform-origin: center; transition: transform 0.2s ease;">
  <line x1="12" y1="20" x2="12" y2="4" stroke="${o}" stroke-width="2.5" stroke-linecap="round"/>
  <polyline points="7,9 12,4 17,9" fill="none" stroke="${o}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="20" r="2.5" fill="${o}"/>
</svg>`.trim()}function Zo(e,t=0,r=100,n={}){let o=T(e,0),a=T(t,0),i=T(r,100)-a,s=i===0?0:Math.min(100,Math.max(0,(o-a)/i*100)),l=G(n.color,"#6366f1");return`
<div style="width: 100%; height: ${T(n.height||6,6)}px; background: var(--cc-meter-track, rgba(255,255,255,0.1)); border-radius: var(--cc-radius-pill, 9999px); overflow: hidden; position: relative;">
  <div style="width: ${s.toFixed(1)}%; height: 100%; background: linear-gradient(90deg, ${l}, var(--cc-meter-end, #ec4899)); border-radius: var(--cc-radius-pill, 9999px); transition: width 0.3s ease;"></div>
</div>`.trim()}function Jo(e,t,r,n){let o=T(e,0),a=T(t,0),c=T(r,0),i=T(n,0),s=(c-o)*.5;return`M ${o} ${a} C ${o+s} ${a}, ${c-s} ${i}, ${c} ${i}`}function Qo(e,t){let r=T(t.centerX,0)-T(e.centerX,0),n=T(t.centerY,0)-T(e.centerY,0),o=Math.abs(r)>=Math.abs(n),a=(o?r:n)>=0?1:-1,c=a*Math.max(40,Math.abs(o?r:n)*.4),i=(V,pt)=>o?[pt?V.maxX:V.minX,V.centerY]:[V.centerX,pt?V.maxY:V.minY],[s,l]=i(e,a>0).map(V=>T(V,0)),[u,d]=i(t,a<0).map(V=>T(V,0)),[f,x,A,M]=o?[s+c,l,u-c,d]:[s,l+c,u,d-c],re=V=>V.toFixed(1);return`M ${re(s)} ${re(l)} C ${re(f)} ${re(x)}, ${re(A)} ${re(M)}, ${re(u)} ${re(d)}`}var Ad=/^#[0-9a-f]{6}$/i,Ir="#1e293b",lt="--cc-badge-text-override",Od=64,kd=102,_d=38,Cd=77;function Xo(e){return e.toString(16).padStart(2,"0")}function ea(e,t="#38bdf8",r={}){let n=G(t,"#38bdf8"),o=Ad.test(n),a=G(r.surface,Ir),c=o?Od:_d,i=o?kd:Cd,s=o?Pe(st(n,c/255,a)):n;return`
<span class="cloudcanvas-primitive-badge" style="color: var(${lt}, ${s}); --cc-badge-border: ${n}${Xo(i)}; --cc-badge-bg: ${n}${Xo(c)};">
  <span style="width: var(--cc-badge-dot, 6px); height: var(--cc-badge-dot, 6px); border-radius: 50%; background: ${n};"></span>
  ${Ko(e)}
</span>`.trim()}var Wo=.35;function zt(e,t,r,n,o){let a=r-e,c=n-t,i=Math.hypot(a,c);if(!(i>0))return"";let s=e+a*Wo,l=t+c*Wo,u=-c/i*o,d=a/i*o;return`M ${(e+u).toFixed(1)} ${(t+d).toFixed(1)} L ${s.toFixed(1)} ${l.toFixed(1)} L ${(e-u).toFixed(1)} ${(t-d).toFixed(1)} Z`}function ta(e,t,r={}){let n=G(r.stroke,"#833446"),o=T(r.strokeWidth||3,3)/2,a=T(r.opacity!==void 0?r.opacity:.85,.85),c=T(e.minX,0),i=T(e.minY,0),s=T(e.maxX,0),l=T(e.maxY,0),u=T(t.minX,0),d=T(t.minY,0),f=T(t.maxX,0),x=T(t.maxY,0),A=[zt(c,i,u,d,o),zt(s,i,f,d,o),zt(s,l,f,x,o),zt(c,l,u,x,o)].filter(Boolean).join(" ");return`
<g class="cloudcanvas-frustum-projection" opacity="${a}">
  <path d="${A}" fill="${n}" stroke="none" />
</g>`.trim()}var Ld="var(--cc-cursor-label, var(--cc-text, #e2e8f0))";function ra(e,t={}){let r=G(t.color,"#9f3a52"),n=G(t.labelColor,Ld),o=T(t.cornerSize||16,16),a=T(t.padding||8,8),c=T(e.minX,0),i=T(e.minY,0),s=c-a,l=i-a,u=T(e.maxX,0)-c+a*2,d=T(e.maxY,0)-i+a*2;return`
<g class="cloudcanvas-focus-cursor">
  <path d="${`
    M ${s} ${l+o} L ${s} ${l} L ${s+o} ${l}
    M ${s+u-o} ${l} L ${s+u} ${l} L ${s+u} ${l+o}
    M ${s+u} ${l+d-o} L ${s+u} ${l+d} L ${s+u-o} ${l+d}
    M ${s+o} ${l+d} L ${s} ${l+d} L ${s} ${l+d-o}
  `.trim()}" fill="none" stroke="${r}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  ${t.label?`
    <text class="cloudcanvas-focus-cursor-label" x="${s+u/2}" y="${l-8}" text-anchor="middle" fill="${n}" font-size="11" font-weight="600" font-family="sans-serif">${Ko(t.label)}</text>
  `:""}
</g>`.trim()}var Rd="<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48' viewBox='0 0 64 48'><rect width='64' height='48' rx='4' fill='#1e293b'/><circle cx='20' cy='16' r='5' fill='#475569'/><path d='M8 40l14-16 10 11 8-7 16 12z' fill='#334155'/></svg>",$d=`data:image/svg+xml,${encodeURIComponent(Rd)}`;function na(){return $d}function j(e){let{name:t,html:r,allowedKeys:n,bind:o,render:a}=e,c=Object.freeze({name:t,html:r,keys:n,bind:o,render:a});function i(){return z(),w(c)}function s(l,u={}){return i(),l.blit(N(t,{chrome:!1,...u}))}return Object.freeze({name:t,define:i,create:s})}function Dt(e,t){if(e.localName===t)return e;let r=document.createElement(t);return r.className=e.className,e.replaceWith(r),r}var Nd="badge",ca="cloudcanvas-lib-badge",ia="cloudcanvas-lib-badge-dismiss",sa=Object.freeze({info:"#38bdf8",success:"#4ade80",warning:"#fbbf24",danger:"#f87171"}),oa=64,Id=115;function aa(e){return e.toString(16).padStart(2,"0")}var Md="neutral";function Mr(e){let t=sa[e];if(!t)return null;let r=st(t,oa/255,Ir);return{background:`${t}${aa(oa)}`,border:`${t}${aa(Id)}`,text:Pe(r)}}function Pd(e){let t=Mr(e);return t?`--cc-badge-bg:${t.background};--cc-badge-border:${t.border};--cc-badge-text:var(${lt}, ${t.text});`:""}function zd(e,t,r){let n=e.querySelector(`.${ca}`),o=n.querySelector(`.${ia}`);return t(o,"click",r),{root:n,label:p(n),dismiss:o}}function Dd(e,t,r){let n=sa[t.get("tone")]?t.get("tone"):Md;m(e.label,t.get("text")),b(e.root,"data-tone",n,r,"tone"),b(e.root,"style",Pd(n),r,"toneStyle"),E(e.dismiss,t.get("dismissible")===!0)}var la=j({name:Nd,html:`<span class="${ca}"><button class="${ia}" type="button" aria-label="Dismiss">×</button></span>`,allowedKeys:["text","tone","dismissible"],bind:zd,render:Dd}),da=la.define,Fv=la.create;var Bd="alert",Pr="cloudcanvas-lib-alert",jd="cloudcanvas-lib-alert-content",ua="cloudcanvas-lib-alert-title",fa="cloudcanvas-lib-alert-body",pa="cloudcanvas-lib-alert-dismiss",ma=["info","success","warning","danger"],Fd=new Set(["warning","danger"]);function Ud(e){let t=e.get("tone");return ma.includes(t)?t:"info"}function Yd(e){let t=Mr(e);if(!t)return"";let r=`var(${lt}, ${t.text})`;return`--cc-scope-bg:${t.background};--cc-card-border:${t.border};--cc-text:${r};--cc-text-muted:${r};`}function Gd(e,t,r){let n=e.querySelector(`.${Pr}`),o=n.querySelector(`.${ua}`),a=n.querySelector(`.${fa}`),c=n.querySelector(`.${pa}`);return t(c,"click",r),{root:n,title:o,titleText:p(o),body:a,bodyText:p(a),dismiss:c}}function Hd(e,t,r){let n=Ud(t),o=t.get("title"),a=o==null?"":String(o);b(e.root,"role",Fd.has(n)?"alert":"status",r,"role"),b(e.root,"data-tone",n,r,"tone"),b(e.root,"style",Yd(n),r,"toneStyle");for(let c of ma)e.root.classList.toggle(`${Pr}-${c}`,c===n);m(e.titleText,a),E(e.title,a!==""),m(e.bodyText,t.get("message")),E(e.dismiss,t.get("dismissible")!==!1)}var ha=j({name:Bd,html:`<div class="${Pr}"><div class="${jd}"><strong class="${ua}"></strong><p class="${fa}"></p></div><button class="${pa}" type="button" aria-label="Dismiss">×</button></div>`,allowedKeys:["title","message","tone","dismissible"],bind:Gd,render:Hd}),ga=ha.define,Xv=ha.create;var Vd="avatar",zr="cloudcanvas-lib-avatar",ba="cloudcanvas-lib-avatar-image",xa="cloudcanvas-lib-avatar-initials",Xd=["sm","lg"];function Wd(e){return e.trim().split(/\s+/).filter(t=>t.length>0).slice(0,2).map(t=>t[0].toUpperCase()).join("")}function Kd(e){let t=e.querySelector(`.${zr}`),r=t.querySelector(`.${xa}`);return{root:t,image:t.querySelector(`.${ba}`),initials:r,initialsText:p(r)}}function qd(e,t,r){let n=t.get("name"),o=n==null?"":String(n),a=de(t.get("src"),""),c=a!=="",i=t.get("size");for(let s of Xd)e.root.classList.toggle(`${zr}-${s}`,s===i);c&&(b(e.image,"src",a,r,"src"),b(e.image,"alt",o,r,"alt")),E(e.image,c),m(e.initialsText,Wd(o)),b(e.initials,"aria-label",o,r,"initialsLabel"),E(e.initials,!c)}var va=j({name:Vd,html:`<div class="${zr}"><img class="${ba}"><span class="${xa}" role="img"></span></div>`,allowedKeys:["name","src","size"],bind:Kd,render:qd}),ya=va.define,Jv=va.create;var Br="cloudcanvas-lib-divider",Dr="vertical",Zd="horizontal";function Jd(e){return{root:e.querySelector(`.${Br}`)}}function Qd(e,t){let r=t.get("orientation")===Dr,n=Dt(e.root,r?"div":"hr");r&&n.getAttribute("role")!=="separator"&&n.setAttribute("role","separator"),n.classList.toggle(`${Br}-${Dr}`,r);let o=r?Dr:Zd;n.getAttribute("aria-orientation")!==o&&n.setAttribute("aria-orientation",o)}var wa=j({name:"divider",html:`<hr class="${Br}">`,allowedKeys:["orientation"],bind:Jd,render:Qd}),Ta=wa.define,ty=wa.create;var eu="lib-list",Ae=Object.freeze({ROOT:"cloudcanvas-lib-list",ITEM:"cloudcanvas-lib-list-item",ITEM_LABEL:"cloudcanvas-lib-list-item-label",ITEM_SELECTED:"cloudcanvas-lib-list-item-selected"}),tu="list:select",ru=new Set(["Enter"," ","Spacebar"]);function Ea(e,t){return e&&e.id!==void 0&&e.id!==null?e.id:t}function nu(){let e=document.createElement("li");e.className=Ae.ITEM,e.setAttribute("tabindex","0"),e.setAttribute("data-cc-control","");let t=document.createElement("span");return t.className=Ae.ITEM_LABEL,p(t),e.appendChild(t),e}function ou(e,t){let r=e.querySelector(`.${Ae.ITEM_LABEL}`);r&&m(p(r),t&&t.label);let n=!!(t&&t.selected);e.classList.contains(Ae.ITEM_SELECTED)!==n&&(e.classList.toggle(Ae.ITEM_SELECTED,n),n?e.setAttribute("aria-current","true"):e.removeAttribute("aria-current"))}function Sa(e,t,r,n){let o=typeof r.target?.closest=="function"?r.target.closest(`.${Ae.ITEM}`):null;if(!o||!t.contains(o))return;let a=_(e).items,c=o.getAttribute(Ee),i=Array.isArray(a)?a.findIndex((s,l)=>String(Ea(s,l))===c):-1;i!==-1&&(n&&(r.preventDefault(),r.stopPropagation()),e.emit(tu,{id:a[i].id}))}function au(e,t){let r=h(e),n=e.querySelector(`.${Ae.ROOT}`);return t(n,"click",o=>Sa(r,n,o,!1)),t(n,"keydown",o=>{ru.has(o.key)&&Sa(r,n,o,!0)}),{root:n}}function cu(e,t){let r=t.get("items");le(e.root,Array.isArray(r)?r:[],{key:Ea,create:nu,update:ou})}var Aa=j({name:eu,html:`<ul class="${Ae.ROOT}"></ul>`,allowedKeys:["items"],bind:au,render:cu}),Oa=Aa.define,iy=Aa.create;var iu="progress",_a="cloudcanvas-lib-progress-row",Ca="cloudcanvas-lib-progress-label",jr="cloudcanvas-lib-progress",su=["success","warning","danger"],ka=100;function lu(e){let t=e.querySelector(`.${_a}`),r=t.querySelector(`.${Ca}`);return{root:t,caption:r,captionText:p(r),bar:t.querySelector(`.${jr}`)}}function du(e,t,r){let n=ee(t.get("max"),ka),o=n>0?n:ka,a=Math.min(Math.max(ee(t.get("value"),0),0),o),c=t.get("label"),i=c==null?"":String(c),s=t.get("tone");m(e.captionText,i),E(e.caption,i!==""),b(e.bar,"value",String(a),r,"value"),b(e.bar,"max",String(o),r,"max"),b(e.bar,"aria-label",i,r,"ariaLabel");for(let l of su)e.bar.classList.toggle(`${jr}-${l}`,l===s)}var La=j({name:iu,html:`<div class="${_a}"><span class="${Ca}"></span><progress class="${jr}"></progress></div>`,allowedKeys:["value","max","label","tone"],bind:lu,render:du}),Ra=La.define,fy=La.create;var uu="spinner",$a="cloudcanvas-lib-spinner",fu="Loading";function pu(e){return{root:e.querySelector(`.${$a}`)}}function mu(e,t,r){let n=t.get("label"),o=n==null||String(n)===""?fu:String(n);b(e.root,"aria-label",o,r,"label")}var Na=j({name:uu,html:`<div class="${$a}" role="status"></div>`,allowedKeys:["label"],bind:pu,render:mu}),Ia=Na.define,gy=Na.create;var dt="cloudcanvas-lib-text",hu=new Set(["span","p","h1","h2","h3","h4","label"]),gu="span",Ma=["xs","sm","md","lg"],Pa=["medium","semibold"];function za(e,t,r){return e.includes(t)?t:r}function bu(e){return{root:e.querySelector(`.${dt}`)}}function xu(e,t){let r=t.get("as"),n=Dt(e.root,hu.has(r)?r:gu);m(p(n),t.get("text"));let o=za(Ma,t.get("size"),"md"),a=za(Pa,t.get("weight"),"regular");for(let c of Ma)n.classList.toggle(`${dt}-${c}`,c===o);for(let c of Pa)n.classList.toggle(`${dt}-${c}`,c===a);n.classList.toggle(`${dt}-muted`,t.get("tone")==="muted")}var Da=j({name:"text",html:`<span class="${dt}"></span>`,allowedKeys:["text","as","tone","size","weight"],bind:bu,render:xu}),Ba=Da.define,yy=Da.create;function ja(){return[Ba(),da(),ya(),Ta(),Ra(),Ia(),ga(),Oa()].map(e=>e.el.getAttribute("data-type"))}function Fa(){return[...Go(),...ja()]}var Ua=`
/* ------------------ FOUNDATION ------------------ */

.cloudcanvas-component {
  box-sizing: border-box;
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
}

.cloudcanvas-component *,
.cloudcanvas-component *::before,
.cloudcanvas-component *::after {
  box-sizing: inherit;
}

.cloudcanvas-component button:focus-visible,
.cloudcanvas-component input:focus-visible,
.cloudcanvas-component textarea:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

/* The one card surface every boxed widget shares; a widget adds its own class
   beside it for layout, never a second background. */
.cloudcanvas-component-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--cc-space-3, 12px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  color: var(--cc-text, #e2e8f0);
}

/* A real <button>, on the core action button's tokens - the pair the framework
   already keeps readable in both themes. */
.cloudcanvas-component-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  color: var(--cc-btn-text, #7dd3fc);
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-medium, 500);
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cloudcanvas-component-btn:hover {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-color: var(--cc-accent, #38bdf8);
}

/* A filled chip: priority, telemetry status, event status. The fill is set by
   the widget's data attribute; the ink is the canvas background. The resting
   fill is the text colour - inverted, and readable by construction. */
.cloudcanvas-component-chip {
  display: inline-flex;
  align-items: center;
  flex: none;
  min-height: 18px;
  padding: 0 var(--cc-space-2, 8px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-text, #e2e8f0);
  color: var(--cc-bg, #0f1117);
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* A native <progress>: the engine pseudo-elements paint it, so the two colours
   are stated for WebKit's bar and value and for Gecko's single value element. */
.cloudcanvas-component-meter {
  appearance: none;
  -webkit-appearance: none;
  display: block;
  flex: none;
  overflow: hidden;
  width: 100%;
  height: 6px;
  margin: 0;
  border: 0;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-meter-track, rgba(255, 255, 255, 0.12));
  color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-component-meter::-webkit-progress-bar {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-meter-track, rgba(255, 255, 255, 0.12));
}

.cloudcanvas-component-meter::-webkit-progress-value {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
  transition: width 0.25s ease;
}

.cloudcanvas-component-meter::-moz-progress-bar {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
}

/* The inline editor \`EditableTrait\` drops into a title. */
.cloudcanvas-editable-input {
  width: 100%;
  padding: 0 var(--cc-space-1, 4px);
  border: 1px solid var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: inherit;
  font: inherit;
  line-height: inherit;
}

/* ------------------ STICKY NOTE ------------------ */

.cloudcanvas-sticky-note {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--cc-space-3, 12px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-sticky-yellow, #fef08a);
  color: var(--cc-sticky-yellow-ink, #713f12);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  transform: rotate(var(--cc-sticky-tilt, 0deg));
  transition: box-shadow 0.2s ease;
  user-select: none;
}

.cloudcanvas-sticky-note:hover {
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55));
}

.cloudcanvas-sticky-note[data-theme="pink"] {
  background: var(--cc-sticky-pink, #fbcfe8);
  color: var(--cc-sticky-pink-ink, #831843);
}

.cloudcanvas-sticky-note[data-theme="cyan"] {
  background: var(--cc-sticky-cyan, #bae6fd);
  color: var(--cc-sticky-cyan-ink, #0c4a6e);
}

.cloudcanvas-sticky-note[data-theme="lime"] {
  background: var(--cc-sticky-lime, #d9f99d);
  color: var(--cc-sticky-lime-ink, #365314);
}

.cloudcanvas-sticky-note[data-theme="orange"] {
  background: var(--cc-sticky-orange, #fed7aa);
  color: var(--cc-sticky-orange-ink, #7c2d12);
}

.cloudcanvas-sticky-pinhead {
  position: absolute;
  top: -8px;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translateX(-50%);
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-sticky-pinhead, #e11d48);
  box-shadow: var(--cc-sticky-pinhead-shadow, 0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5));
  pointer-events: none;
}

.cloudcanvas-sticky-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
  margin-bottom: var(--cc-space-2, 8px);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  letter-spacing: 0.02em;
}

.cloudcanvas-sticky-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-sticky-tag {
  flex: none;
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-sticky-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  font-size: var(--cc-type-md, 13px);
  line-height: 1.45;
  word-break: break-word;
  white-space: pre-wrap;
}

.cloudcanvas-sticky-editor {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: var(--cc-space-1, 4px);
  border: 1px solid var(--cc-sticky-rule, rgba(0, 0, 0, 0.2));
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-sticky-editor-bg, rgba(255, 255, 255, 0.7));
  color: inherit;
  font: inherit;
  line-height: 1.45;
  resize: none;
}

.cloudcanvas-sticky-footer {
  display: flex;
  align-items: center;
  margin-top: var(--cc-space-2, 8px);
  padding-top: var(--cc-space-1, 4px);
  border-top: 1px dashed var(--cc-sticky-rule, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-sticky-swatches {
  display: flex;
}

/* A swatch is a full-size hit target drawing a small dot: the control keeps
   its minimum, the note keeps its look. */
.cloudcanvas-sticky-swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--cc-control-min, 28px);
  height: var(--cc-control-min, 28px);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.cloudcanvas-sticky-swatch::before {
  content: "";
  width: 14px;
  height: 14px;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-sticky-yellow, #fef08a);
  box-shadow: var(--cc-sticky-swatch-ring, 0 0 0 1px rgba(0, 0, 0, 0.2));
  transition: transform 0.1s ease;
}

.cloudcanvas-sticky-swatch[data-theme="pink"]::before {
  background: var(--cc-sticky-pink, #fbcfe8);
}

.cloudcanvas-sticky-swatch[data-theme="cyan"]::before {
  background: var(--cc-sticky-cyan, #bae6fd);
}

.cloudcanvas-sticky-swatch[data-theme="lime"]::before {
  background: var(--cc-sticky-lime, #d9f99d);
}

.cloudcanvas-sticky-swatch[data-theme="orange"]::before {
  background: var(--cc-sticky-orange, #fed7aa);
}

.cloudcanvas-sticky-swatch:hover::before {
  transform: scale(1.25);
}

.cloudcanvas-sticky-swatch[aria-pressed="true"]::before {
  box-shadow: var(--cc-sticky-swatch-ring-active, 0 0 0 2px currentColor);
}

/* ------------------ TASK / KANBAN CARD ------------------ */

/* A checklist longer than the card scrolls inside it rather than spilling
   past the rounded corners. */
.cloudcanvas-task-card {
  overflow: hidden;
}

.cloudcanvas-task-header,
.cloudcanvas-telemetry-header,
.cloudcanvas-flow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
  margin-bottom: var(--cc-space-2, 8px);
}

.cloudcanvas-task-title,
.cloudcanvas-telemetry-title,
.cloudcanvas-flow-title,
.cloudcanvas-media-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: var(--cc-type-md, 13px);
  font-weight: var(--cc-weight-semibold, 600);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-task-priority[data-priority="urgent"] {
  background: var(--cc-priority-urgent, #fb7185);
}

.cloudcanvas-task-priority[data-priority="high"] {
  background: var(--cc-priority-high, #fb923c);
}

.cloudcanvas-task-priority[data-priority="normal"] {
  background: var(--cc-priority-normal, #38bdf8);
}

.cloudcanvas-task-priority[data-priority="low"] {
  background: var(--cc-priority-low, #94a3b8);
}

.cloudcanvas-task-checklist {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--cc-space-1, 4px);
  min-height: 0;
  overflow-y: auto;
  margin: var(--cc-space-1, 4px) 0;
  padding: 0;
  list-style: none;
}

.cloudcanvas-check-item {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-1, 4px);
  border-radius: var(--cc-radius-sm, 6px);
  font-size: var(--cc-type-sm, 12px);
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.cloudcanvas-check-item:hover {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-check-box {
  flex: none;
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--cc-accent, #38bdf8);
  cursor: pointer;
}

.cloudcanvas-check-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

/* Done is the strike alone: muted ink over a hovered row measured 4.25:1 on
   the light card, and a finished item is still an item someone has to read. */
.cloudcanvas-check-item.is-done .cloudcanvas-check-label {
  text-decoration: line-through;
}

.cloudcanvas-task-progress,
.cloudcanvas-telemetry-bar {
  margin-top: var(--cc-space-2, 8px);
}
`;var Ya=`
/* ------------------ TELEMETRY GAUGE ------------------ */

/* Header at the top, readout in the middle, bar at the foot, whatever the height. */
.cloudcanvas-telemetry-card {
  justify-content: space-between;
}

.cloudcanvas-telemetry-status[data-status="nominal"] {
  background: var(--cc-status-nominal, #34d399);
}

.cloudcanvas-telemetry-status[data-status="warning"] {
  background: var(--cc-status-warning, #fbbf24);
}

.cloudcanvas-telemetry-status[data-status="critical"] {
  background: var(--cc-status-critical, #f87171);
  animation: cloudcanvas-component-pulse 1s infinite alternate;
}

@keyframes cloudcanvas-component-pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.6;
  }
}

.cloudcanvas-telemetry-readout {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  margin: var(--cc-space-2, 8px) 0;
}

.cloudcanvas-telemetry-value {
  font-size: var(--cc-type-display, 28px);
  font-weight: var(--cc-weight-bold, 700);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.cloudcanvas-telemetry-unit {
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-sm, 12px);
}

.cloudcanvas-telemetry-bar[data-status="nominal"] {
  color: var(--cc-status-nominal, #34d399);
}
.cloudcanvas-telemetry-bar[data-status="nominal"]::-webkit-progress-value {
  background: var(--cc-status-nominal, #34d399);
}
.cloudcanvas-telemetry-bar[data-status="nominal"]::-moz-progress-bar {
  background: var(--cc-status-nominal, #34d399);
}

.cloudcanvas-telemetry-bar[data-status="warning"] {
  color: var(--cc-status-warning, #fbbf24);
}
.cloudcanvas-telemetry-bar[data-status="warning"]::-webkit-progress-value {
  background: var(--cc-status-warning, #fbbf24);
}
.cloudcanvas-telemetry-bar[data-status="warning"]::-moz-progress-bar {
  background: var(--cc-status-warning, #fbbf24);
}

.cloudcanvas-telemetry-bar[data-status="critical"] {
  color: var(--cc-status-critical, #f87171);
}
.cloudcanvas-telemetry-bar[data-status="critical"]::-webkit-progress-value {
  background: var(--cc-status-critical, #f87171);
}
.cloudcanvas-telemetry-bar[data-status="critical"]::-moz-progress-bar {
  background: var(--cc-status-critical, #f87171);
}

/* ------------------ FLOW NODE ------------------ */

.cloudcanvas-flow-node {
  position: relative;
  transition: box-shadow 0.1s ease, border-color 0.1s ease;
}

.cloudcanvas-flow-node.is-pulsing {
  border-color: var(--cc-accent, #38bdf8);
  box-shadow: var(--cc-flow-pulse, 0 0 20px rgba(56, 189, 248, 0.6));
}

.cloudcanvas-flow-port {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  transform: translateY(-50%);
  border: 2px solid var(--cc-bg, #0f1117);
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
}

.cloudcanvas-flow-port-in {
  left: -5px;
}

.cloudcanvas-flow-port-out {
  right: -5px;
}

.cloudcanvas-flow-type {
  flex: none;
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-xs, 11px);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.cloudcanvas-flow-body {
  flex: 1;
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-sm, 12px);
  line-height: 1.4;
}

.cloudcanvas-flow-action-btn {
  width: 100%;
  margin-top: var(--cc-space-2, 8px);
}

/* ------------------ WORKSPACE GROUP ------------------ */

/* The one widget that holds blits: its children sit in its own scope, placed
   by the core, under the shared card surface. So no surface here, only a header. */
.cloudcanvas-workspace-card {
  display: flex;
  flex-direction: column;
  color: var(--cc-text, #e2e8f0);
}

.cloudcanvas-workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
}

.cloudcanvas-workspace-title {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-width: 0;
  font-size: var(--cc-type-lg, 15px);
  font-weight: var(--cc-weight-semibold, 600);
}

.cloudcanvas-workspace-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-workspace-focus-btn {
  flex: none;
}

.cloudcanvas-workspace-badge {
  display: inline-flex;
  align-items: center;
  flex: none;
  min-height: 18px;
  padding: 0 var(--cc-space-2, 8px);
  border: 1px solid var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
  color: var(--cc-badge-text, #38bdf8);
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  white-space: nowrap;
}

/* ------------------ MEDIA CARD ------------------ */

.cloudcanvas-media-card {
  padding: 0;
  overflow: hidden;
}

.cloudcanvas-media-viewport {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  overflow: hidden;
  width: 100%;
  height: var(--cc-media-max-height, 120px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: var(--cc-text, #e2e8f0);
}

.cloudcanvas-media-img,
.cloudcanvas-media-placeholder {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.cloudcanvas-media-img {
  object-fit: cover;
}

/* The render toggles image and placeholder with the hidden attribute; the block display above must not undo it. */
.cloudcanvas-media-img[hidden],
.cloudcanvas-media-placeholder[hidden] {
  display: none;
}

.cloudcanvas-media-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--cc-space-1, 4px);
  min-height: 0;
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
}

.cloudcanvas-media-caption {
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-sm, 12px);
  line-height: 1.4;
}
`;var Ga=`
/* ------------------ BREADCRUMB BAR ------------------ */

.cloudcanvas-breadcrumb-card {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  max-width: 100%;
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  -webkit-backdrop-filter: blur(var(--cc-card-blur, 12px));
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-sm, 12px);
  user-select: none;
}

.cloudcanvas-breadcrumb-back-btn {
  flex: none;
  border-radius: var(--cc-radius-pill, 9999px);
}

.cloudcanvas-breadcrumb-path {
  display: flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  min-width: 0;
  color: var(--cc-text-muted, #94a3b8);
}

/* The root crumb is a real button on the trail's own colours. */
.cloudcanvas-breadcrumb-crumb {
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-1, 4px);
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  background: transparent;
  color: inherit;
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.cloudcanvas-breadcrumb-crumb:hover {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: var(--cc-text, #e2e8f0);
}

.cloudcanvas-breadcrumb-separator {
  flex: none;
}

.cloudcanvas-breadcrumb-current {
  min-width: 0;
  overflow: hidden;
  color: var(--cc-text, #e2e8f0);
  font-weight: var(--cc-weight-semibold, 600);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ------------------ CHAT MESSAGE ------------------ */

.cloudcanvas-chat-message-card {
  flex-direction: row;
  gap: var(--cc-space-2, 8px);
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  user-select: none;
  transition: border-color 0.15s ease;
}

.cloudcanvas-chat-message-card:hover {
  border-color: var(--cc-card-border-hover, rgba(255, 255, 255, 0.18));
}

/*
 * A caller-supplied avatar colour arrives as two custom properties written by
 * the widget (the fill, and a foreground computed to read on it); with none
 * supplied, the badge tokens stand in, which the theme already keeps readable.
 */
.cloudcanvas-chat-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 34px;
  height: 34px;
  border: 1px solid var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-chat-avatar-bg, var(--cc-badge-bg, rgba(56, 189, 248, 0.15)));
  color: var(--cc-chat-avatar-text, var(--cc-badge-text, #38bdf8));
  font-size: var(--cc-type-md, 13px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  text-transform: uppercase;
}

.cloudcanvas-chat-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--cc-space-1, 4px);
  min-width: 0;
}

.cloudcanvas-chat-meta {
  display: flex;
  align-items: baseline;
  gap: var(--cc-space-2, 8px);
  min-width: 0;
}

.cloudcanvas-chat-author {
  min-width: 0;
  overflow: hidden;
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-md, 13px);
  font-weight: var(--cc-weight-semibold, 600);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-chat-time {
  flex: none;
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-chat-text {
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.45;
  word-break: break-word;
}

.cloudcanvas-chat-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cc-space-1, 4px);
  margin-top: var(--cc-space-1, 4px);
}

/* A reaction is a toggle button; \`aria-pressed\` is both its state and its style hook. */
.cloudcanvas-chat-reaction-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-2, 8px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: var(--cc-text, #e2e8f0);
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  line-height: 1;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.cloudcanvas-chat-reaction-pill:hover {
  border-color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-chat-reaction-emoji {
  line-height: 1;
}

.cloudcanvas-chat-reaction-count {
  font-variant-numeric: tabular-nums;
}

.cloudcanvas-chat-reaction-pill[aria-pressed="true"] {
  border-color: var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
  color: var(--cc-badge-text, #38bdf8);
  font-weight: var(--cc-weight-semibold, 600);
}

/* ------------------ CHAT COMPOSER ------------------ */

.cloudcanvas-chat-input-bar {
  flex-direction: row;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  padding: var(--cc-space-2, 8px);
}

.cloudcanvas-chat-input-field {
  flex: 1;
  min-width: 0;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-sm, 6px);
  /* The border is the field: a tinted well put the muted placeholder at
     4.25:1 on the light card, and the card itself already clears it. */
  background: transparent;
  color: var(--cc-text, #e2e8f0);
  font-family: inherit;
  font-size: var(--cc-type-md, 13px);
  line-height: 1.35;
  transition: border-color 0.15s ease;
}

.cloudcanvas-chat-input-field::placeholder {
  color: var(--cc-text-muted, #94a3b8);
  opacity: 1;
}

.cloudcanvas-chat-input-field:focus {
  border-color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-chat-send-btn {
  flex: none;
}

/* ------------------ CALENDAR EVENT ------------------ */

.cloudcanvas-event-card {
  gap: var(--cc-space-1, 4px);
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  border-left: 4px solid var(--cc-severity-normal, #38bdf8);
  user-select: none;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.cloudcanvas-event-card:hover {
  transform: translateY(-1px);
}

.cloudcanvas-event-card[data-severity="critical"] {
  border-left-color: var(--cc-severity-critical, #f87171);
  animation: cloudcanvas-component-alarm 2s infinite ease-in-out;
}

.cloudcanvas-event-card[data-severity="high"] {
  border-left-color: var(--cc-severity-high, #fbbf24);
}

.cloudcanvas-event-card[data-severity="info"] {
  border-left-color: var(--cc-severity-info, #34d399);
}

@keyframes cloudcanvas-component-alarm {
  0%, 100% {
    box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  }
  50% {
    box-shadow: var(--cc-severity-critical-glow, 0 0 16px rgba(248, 113, 113, 0.6));
  }
}

.cloudcanvas-event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
}

.cloudcanvas-event-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-event-badge[data-severity="critical"] {
  background: var(--cc-severity-critical, #f87171);
}

.cloudcanvas-event-badge[data-severity="high"] {
  background: var(--cc-severity-high, #fbbf24);
}

.cloudcanvas-event-badge[data-severity="normal"] {
  background: var(--cc-severity-normal, #38bdf8);
}

.cloudcanvas-event-badge[data-severity="info"] {
  background: var(--cc-severity-info, #34d399);
}

.cloudcanvas-event-time {
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-event-actions {
  display: flex;
  gap: var(--cc-space-1, 4px);
  margin-top: var(--cc-space-1, 4px);
}

.cloudcanvas-event-btn {
  flex: 1;
}

/* Two equal actions; the one that closes the event reads as the primary. */
.cloudcanvas-event-ack {
  font-weight: var(--cc-weight-medium, 500);
}

.cloudcanvas-event-resolve {
  font-weight: var(--cc-weight-semibold, 600);
}

/* ------------------ ENVIRONMENT ------------------ */

@media (pointer: coarse) {
  .cloudcanvas-component-btn,
  .cloudcanvas-check-item,
  .cloudcanvas-chat-reaction-pill,
  .cloudcanvas-chat-input-field,
  .cloudcanvas-breadcrumb-crumb {
    min-height: var(--cc-control-min-coarse, 44px);
  }

  .cloudcanvas-sticky-swatch {
    width: var(--cc-control-min-coarse, 44px);
    height: var(--cc-control-min-coarse, 44px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-component-btn,
  .cloudcanvas-component-meter::-webkit-progress-value,
  .cloudcanvas-sticky-note,
  .cloudcanvas-sticky-swatch::before,
  .cloudcanvas-check-item,
  .cloudcanvas-flow-node,
  .cloudcanvas-chat-message-card,
  .cloudcanvas-chat-reaction-pill,
  .cloudcanvas-chat-input-field,
  .cloudcanvas-breadcrumb-crumb,
  .cloudcanvas-event-card {
    transition: none;
  }

  .cloudcanvas-telemetry-status[data-status="critical"],
  .cloudcanvas-event-card[data-severity="critical"] {
    animation: none;
  }

  .cloudcanvas-event-card:hover {
    transform: none;
  }
}
`;var Ha="cloudcanvas-components-styles",vu=`${Ua}${Ya}${Ga}`;function I(){if(typeof document>"u")return null;let e=document.getElementById(Ha);if(e)return e;let t=document.createElement("style");return t.id=Ha,t.textContent=vu,document.head.appendChild(t),t}var yu="sticky-note",Va=Object.freeze(["yellow","pink","cyan","lime","orange"]),F=Object.freeze({ROOT:"cloudcanvas-sticky-note",PINHEAD:"cloudcanvas-sticky-pinhead",HEADER:"cloudcanvas-sticky-header",TITLE:"cloudcanvas-sticky-title",TAG:"cloudcanvas-sticky-tag",BODY:"cloudcanvas-sticky-body",EDITOR:"cloudcanvas-sticky-editor",FOOTER:"cloudcanvas-sticky-footer",SWATCHES:"cloudcanvas-sticky-swatches",SWATCH:"cloudcanvas-sticky-swatch"}),wu="yellow";function Tu(e){return Va.includes(e)?e:wu}function Ur(e){let t=r=>e.querySelector(`.${r}`);return{card:t(F.ROOT),body:t(F.BODY),editor:t(F.EDITOR)}}function Su(e){let{body:t,editor:r}=Ur(e.el);return!r||!r.hidden?!1:(r.value=k(e.spec.stickyNote?.body),Me(e,r),E(t,!1),E(r,!0),r.focus(),!0)}function Fr(e,t=!0){let{body:r,editor:n}=Ur(e.el);if(!n||n.hidden)return!1;let o=n.value.trim();return E(n,!1),E(r,!0),t&&(X(e,"body",o),e.emit("note:edited",{body:o})),ye(e),!0}function Eu(e){return`<button class="${F.SWATCH}" type="button" data-theme="${e}" aria-label="${e}" aria-pressed="false" title="${e}"></button>`}var Au=`<div class="cloudcanvas-component ${F.ROOT}"><div class="${F.PINHEAD}"></div><div class="${F.HEADER}"><div class="${F.TITLE}"></div><span class="${F.TAG}"></span></div><div class="${F.BODY}"></div><textarea class="${F.EDITOR}" aria-label="Note body" hidden></textarea><div class="${F.FOOTER}"><div class="${F.SWATCHES}" role="group" aria-label="Note colour">`+Va.map(Eu).join("")+"</div></div></div>";function Ou(e,t){let r=h(e),{card:n,body:o,editor:a}=Ur(e);t(o,"dblclick",l=>{l.stopPropagation(),Su(r)}),t(a,"keydown",l=>{l.key==="Escape"?(l.stopPropagation(),Fr(r,!1)):l.key==="Enter"&&(l.ctrlKey||l.metaKey)&&(l.preventDefault(),Fr(r,!0))}),t(a,"blur",()=>Fr(r,!0));let c=Array.from(e.querySelectorAll(`.${F.SWATCH}`));for(let l of c)t(l,"click",()=>X(r,"color",l.getAttribute("data-theme")));let i=e.querySelector(`.${F.TITLE}`),s=e.querySelector(`.${F.TAG}`);return{card:n,titleText:p(i),tag:s,tagText:p(s),bodyText:p(o),swatches:c}}function ku(e,t,r){let n=Tu(t.get("color")),o=k(t.get("tag")),a=Number(t.get("tilt"));m(e.titleText,t.get("title")),m(e.bodyText,t.get("body")),m(e.tagText,o===""?"":`#${o}`),E(e.tag,o!==""),b(e.card,"data-theme",n,r,"theme"),b(e.card,"style",`--cc-sticky-tilt:${Number.isFinite(a)?a:0}deg;`,r,"tilt");for(let c of e.swatches){let i=c.getAttribute("data-theme")===n?"true":"false";c.getAttribute("aria-pressed")!==i&&c.setAttribute("aria-pressed",i)}}var _u=Object.freeze({name:yu,html:Au,keys:["title","body","color","tag","tilt"],bind:Ou,render:ku});function Xa(){return I(),w(_u)}var Cu="[data-blit-root]";function Bt(e){let t=e.el.closest(Cu);return t?h(t):null}function jt(e,t,r,n,o){let a=typeof t?.closest=="function"?t.closest(`.${r}`):null;if(!a||!e.contains(a)||!Array.isArray(n))return-1;let c=a.getAttribute(Ee);return n.findIndex((i,s)=>String(o(i,s))===c)}function ut(e,t={}){let r={...e};for(let[n,o]of Object.entries(t))o!==void 0&&(r[n]=o);return r}var Lu="task-card",U=Object.freeze({ROOT:"cloudcanvas-task-card",HEADER:"cloudcanvas-task-header",TITLE:"cloudcanvas-task-title",PRIORITY:"cloudcanvas-task-priority",CHECKLIST:"cloudcanvas-task-checklist",ITEM:"cloudcanvas-check-item",ITEM_DONE:"is-done",BOX:"cloudcanvas-check-box",LABEL:"cloudcanvas-check-label",PROGRESS:"cloudcanvas-task-progress"}),Ru=Object.freeze(["urgent","high","normal","low"]),$u="task:updated",Nu="normal",Yr=new WeakMap,Iu=0;function Gr(e,t){return e&&e.id!==void 0&&e.id!==null?e.id:t}function Mu(e){let t=typeof e=="string"?e.toLowerCase():"";return Ru.includes(t)?t:Nu}function Wa(e){if(!Array.isArray(e)||e.length===0)return 0;let t=e.filter(r=>r&&r.done).length;return Math.round(t/e.length*100)}function Pu(e,t){let r=_(e).items;if(!Array.isArray(r)||!r[t])return!1;let n=r.map((a,c)=>c===t?{...a,done:!a.done}:a),o=Wa(n);return we(e,{items:n,progress:o}),e.emit($u,{index:t,item:n[t],progress:o}),!0}var zu=`<div class="cloudcanvas-component cloudcanvas-component-card ${U.ROOT}"><div class="${U.HEADER}"><div class="${U.TITLE}"></div><span class="cloudcanvas-component-chip ${U.PRIORITY}"></span></div><ul class="${U.CHECKLIST}"></ul><progress class="cloudcanvas-component-meter ${U.PROGRESS}" max="100" aria-label="Checklist progress"></progress></div>`;function Du(e){return e.id?e.id:(Yr.has(e)||Yr.set(e,`cc-task-${Iu+=1}`),Yr.get(e))}function Bu(e){return(t,r)=>{let n=document.createElement("li");n.className=U.ITEM;let o=document.createElement("input");o.className=U.BOX,o.setAttribute("type","checkbox"),o.id=`${e}-item-${String(Gr(t,r))}`;let a=document.createElement("label");return a.className=U.LABEL,a.setAttribute("for",o.id),p(a),n.append(o,a),n}}function ju(e,t,r){let n=e.firstElementChild,o=e.lastElementChild,a=!!(t&&t.done),c=t&&t.text!==void 0&&t.text!==null?t.text:`Item ${r+1}`;n.checked!==a&&(n.checked=a),m(o.firstChild,c),e.classList.contains(U.ITEM_DONE)!==a&&e.classList.toggle(U.ITEM_DONE,a)}function Fu(e,t){let r=h(e),n=c=>e.querySelector(`.${c}`),o=n(U.CHECKLIST);t(o,"change",c=>{let i=jt(o,c.target,U.ITEM,_(r).items,Gr);i!==-1&&Pu(r,i)});let a=n(U.PRIORITY);return{titleText:p(n(U.TITLE)),priority:a,priorityText:p(a),checklist:o,progress:n(U.PROGRESS),makeRow:Bu(Du(e))}}function Uu(e,t,r){let n=Mu(t.get("priority")),o=t.get("items"),a=Array.isArray(o)?o:[];m(e.titleText,t.get("title")),m(e.priorityText,n),b(e.priority,"data-priority",n,r,"priority"),le(e.checklist,a,{key:Gr,create:e.makeRow,update:ju}),b(e.progress,"value",String(Wa(a)),r,"progress")}var Yu=Object.freeze({name:Lu,html:zu,keys:["title","priority","items","assignee","progress"],bind:Fu,render:Uu});function Ka(){return I(),w(Yu)}var Gu="telemetry-gauge",Z=Object.freeze({ROOT:"cloudcanvas-telemetry-card",HEADER:"cloudcanvas-telemetry-header",TITLE:"cloudcanvas-telemetry-title",STATUS:"cloudcanvas-telemetry-status",READOUT:"cloudcanvas-telemetry-readout",VALUE:"cloudcanvas-telemetry-value",UNIT:"cloudcanvas-telemetry-unit",BAR:"cloudcanvas-telemetry-bar"});var qa=70,Za=90;function Hu(e,t=qa,r=Za){return e>=r?"critical":e>=t?"warning":"nominal"}var Vu=`<div class="cloudcanvas-component cloudcanvas-component-card ${Z.ROOT}"><div class="${Z.HEADER}"><div class="${Z.TITLE}"></div><span class="cloudcanvas-component-chip ${Z.STATUS}"></span></div><div class="${Z.READOUT}"><span class="${Z.VALUE}"></span><span class="${Z.UNIT}"></span></div><progress class="cloudcanvas-component-meter ${Z.BAR}" max="100"></progress></div>`;function Xu(e){let t=n=>e.querySelector(`.${n}`),r=t(Z.STATUS);return{titleText:p(t(Z.TITLE)),status:r,statusText:p(r),valueText:p(t(Z.VALUE)),unitText:p(t(Z.UNIT)),bar:t(Z.BAR)}}function Wu(e,t,r){let n=ee(t.get("value"),0),o=Hu(n,ee(t.get("warn"),qa),ee(t.get("crit"),Za)),a=t.get("title");m(e.titleText,a),m(e.unitText,t.get("unit")),m(e.valueText,String(Math.round(n))),m(e.statusText,o),b(e.status,"data-status",o,r,"status"),b(e.bar,"data-status",o,r,"barStatus"),b(e.bar,"value",String(Math.min(100,Math.max(0,n))),r,"value"),b(e.bar,"aria-label",a==null?"":String(a),r,"label")}var Ku=Object.freeze({name:Gu,html:Vu,keys:["title","unit","description","warn","crit","value","delta"],bind:Xu,render:Wu});function Ja(){return I(),w(Ku)}y();y();var Ft="http://www.w3.org/2000/svg",qu=new Set(["svg","g","defs","symbol","use","marker","clipPath","mask","pattern","path","rect","circle","ellipse","line","polyline","polygon","text","tspan","textPath","foreignObject","linearGradient","radialGradient","stop","filter","feGaussianBlur","feOffset","feBlend","feColorMatrix","feMerge","feMergeNode","title","desc","image"]);function Zu(e){return qu.has(e)?document.createElementNS(Ft,e):document.createElement(e)}function Ju(e,t,r){if(r!=null){if(t==="class"||t==="className"){e.setAttribute("class",String(r));return}if(t==="style"){Qu(e,r);return}if(t.length>2&&t.startsWith("on")&&typeof r=="function"){e.addEventListener(t.slice(2).toLowerCase(),r);return}if(typeof r=="boolean"){r?e.setAttribute(t,""):e.removeAttribute(t);return}e.setAttribute(t,String(r))}}function Qu(e,t){if(typeof t=="string"){e.setAttribute("style",t);return}if(t&&typeof t=="object")for(let[r,n]of Object.entries(t))n!=null&&e.style.setProperty(r,String(n))}function Qa(e,t){if(!(t==null||t===!1||t===!0)){if(Array.isArray(t)){for(let r of t)Qa(e,r);return}if(typeof t=="string"||typeof t=="number"){e.appendChild(document.createTextNode(String(t)));return}t&&typeof t.nodeType=="number"&&e.appendChild(t)}}function ze(e,t,...r){let n=Zu(e);if(t&&typeof t=="object")for(let[o,a]of Object.entries(t))Ju(n,o,a);for(let o of r)Qa(n,o);return n}y();y();var ec=`/* ------------------ BOARD ------------------ */

[data-blit-root] {
  background-color: var(--cc-bg, #0f1117);
  background-image: radial-gradient(
    circle at var(--cc-grid-dot-size, 1px) var(--cc-grid-dot-size, 1px),
    var(--cc-grid-dot, rgba(255, 255, 255, 0.12)) var(--cc-grid-dot-size, 1px),
    transparent 0
  );
  background-size: var(--cc-grid-size, 24px) var(--cc-grid-size, 24px);
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  user-select: none;
  -webkit-user-select: none;
}

[data-blit-root] [data-blit] {
  transition: box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.2s ease;
}

/* The root is one tab stop and its blits are roving targets (the keyboard
   add-on); both show the same ring, and only for keyboard focus. */
[data-blit-root]:focus-visible,
[data-blit-root] [data-blit]:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

/* A compositor hint is a promise to keep a layer alive: made only while a blit
   actually moves, so a board of still blits costs no layers. */
[data-blit].cc-moving {
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  [data-blit-root] [data-blit] {
    transition: none;
  }
}

`;var tc=`/* ------------------ UTILITY ------------------ */

/* Announcement target for assistive technology: in the accessibility tree,
   out of the visual one. */
.cloudcanvas-live-region {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

`;var ef=`/* ------------------ DISPLAY WIDGETS ------------------ */

:is([data-type="card"], [data-type="media"], [data-type="vector-pointer"])[data-blit]:not([data-chrome="false"]),
[data-blit][data-chrome="true"] {
  box-sizing: border-box;
  padding: var(--cc-space-3, 12px) var(--cc-space-4, 16px);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  -webkit-backdrop-filter: blur(var(--cc-card-blur, 12px));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06));
  max-width: var(--cc-card-max-width, 340px);
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
}

[data-blit][style*="width"]:not([data-chrome="false"]) {
  max-width: none;
}

:is([data-type="card"], [data-type="media"], [data-type="vector-pointer"])[data-blit]:not([data-chrome="false"]):hover,
[data-blit][data-chrome="true"]:hover {
  border-color: var(--cc-card-border-hover, rgba(255, 255, 255, 0.18));
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
}

/* After the hover lift, each at its specificity, so the toggle outranks it under the pointer too.
   Transparent rather than removed: the box keeps its border width and moves by nothing. */
:is([data-type="card"], [data-type="media"], [data-type="vector-pointer"])[data-blit][data-bordered="false"],
:is([data-type="card"], [data-type="media"], [data-type="vector-pointer"])[data-blit][data-bordered="false"]:hover,
[data-blit][data-bordered="false"],
[data-blit][data-bordered="false"]:hover {
  border-color: transparent;
}

/* A widget toggles its empty sections with the hidden attribute; a host rule giving one a display must not show it. */
[data-type] [hidden] {
  display: none;
}

/* Selectable text takes the caret; the header stays the drag handle. */
[data-blit][data-selectable-text="true"] {
  user-select: text;
  -webkit-user-select: text;
  cursor: auto;
}

[data-blit][data-selectable-text="true"] [data-drag-handle] {
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
}

`,tf=`.cloudcanvas-primitive-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
  color: var(--cc-badge-text, #38bdf8);
  border: 1px solid var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  white-space: nowrap;
}

`,rf=`.cloudcanvas-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-3, 12px);
  margin-bottom: var(--cc-space-2, 8px);
}

.cloudcanvas-card-title {
  font-size: var(--cc-type-lg, 15px);
  font-weight: var(--cc-weight-semibold, 600);
  color: var(--cc-text, #e2e8f0);
  line-height: 1.25;
}

.cloudcanvas-card-badge-slot {
  display: inline-flex;
  align-items: center;
  flex: none;
}

.cloudcanvas-card-body {
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text-muted, #94a3b8);
  line-height: 1.45;
}

.cloudcanvas-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
  margin-top: var(--cc-space-3, 12px);
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
}

/* A single-line ellipsised run states its line-height, or the footer's height moves with the host page's. */
.cloudcanvas-card-author {
  font-size: var(--cc-type-xs, 11px);
  line-height: 1.45;
  color: var(--cc-text-muted, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-card-action-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  color: var(--cc-btn-text, #7dd3fc);
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-medium, 500);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.cloudcanvas-card-action-btn:hover {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-color: var(--cc-accent, #38bdf8);
}

/* A coarse pointer gets the full 44px target without changing the desktop look. */
@media (pointer: coarse) {
  .cloudcanvas-card-action-btn {
    min-height: var(--cc-control-min-coarse, 44px);
  }
}

.cloudcanvas-card-html {
  min-width: 0;
}

`,nf=`.cloudcanvas-card-media {
  display: block;
  width: 100%;
  max-height: var(--cc-media-max-height, 120px);
  object-fit: cover;
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-card-caption {
  margin: var(--cc-space-2, 8px) 0 0;
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
  line-height: 1.35;
}

.cloudcanvas-card-gauge-row {
  display: flex;
  align-items: center;
  gap: var(--cc-space-3, 12px);
  padding: var(--cc-space-1, 4px) 0;
}

.cloudcanvas-card-needle-slot {
  display: flex;
  align-items: center;
  flex: none;
}

.cloudcanvas-card-gauge {
  flex: 1;
  min-width: 0;
}

.cloudcanvas-card-label {
  margin-bottom: var(--cc-space-1, 4px);
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
}

.cloudcanvas-card-meter-slot {
  display: block;
}

`,of=`.cloudcanvas-card-scope {
  width: 100%;
  min-height: 0;
  margin: 0;
}

[data-scope].cloudcanvas-card-scope:empty {
  display: none;
}

.cloudcanvas-card-scope.cc-populated {
  box-sizing: border-box;
  margin-top: var(--cc-space-2, 8px);
  min-height: var(--cc-scope-min-height, 40px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  outline: 1px dashed var(--cc-scope-border, rgba(255, 255, 255, 0.15));
  outline-offset: -1px;
  overflow: var(--cc-scope-overflow, hidden);
}

@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-card-action-btn {
    transition: none;
  }

  /* The SVG generators write their own inline transitions. */
  .cloudcanvas-card-needle-slot svg,
  .cloudcanvas-card-meter-slot * {
    transition: none !important;
  }
}

`,rc=[ef,tf,rf,nf,of].join("");var nc=`/* ------------------ DRAG ------------------ */

:where([data-blit][data-drag]) {
  cursor: grab;
}

:where([data-blit][data-drag]:active, [data-blit].is-dragging) {
  cursor: grabbing;
}

/* A dragged blit clears its neighbours; a scope's children stay inside its well. */
[data-blit].is-dragging {
  z-index: var(--cc-z-drag, 1100);
}

.cloudcanvas-grab-handle {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  width: var(--cc-grab-handle-size, 12px);
  height: var(--cc-grab-handle-size, 12px);
  transform: translate(-50%, -50%);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-grab-handle-bg, radial-gradient(var(--cc-grab-handle-dot, rgba(255, 255, 255, 0.7)) 0.75px, transparent 1px) 0 0 / 4px 4px, var(--cc-grab-handle-fill, rgba(30, 41, 59, 0.92)));
  box-shadow: var(--cc-grab-handle-ring, 0 0 0 1px rgba(8, 10, 16, 0.65));
  cursor: grab;
  z-index: var(--cc-z-grab, 1101);
  touch-action: none;
}

:where([data-blit][data-chrome="false"].is-selected) > .cloudcanvas-grab-handle,
:where([data-blit].is-selected) > .cloudcanvas-grab-handle:where([data-cc-grab="always"]) {
  display: block;
}

.cloudcanvas-grab-handle:active {
  cursor: grabbing;
}

/* A coarse pointer gets a target it can actually hit. */
@media (pointer: coarse) {
  .cloudcanvas-grab-handle {
    width: var(--cc-grab-handle-size-coarse, 20px);
    height: var(--cc-grab-handle-size-coarse, 20px);
  }
}

`;var oc=`/* ------------------ FOCUS ------------------ */

[data-blit].is-focused {
  box-shadow: var(
    --cc-shadow-focus,
    0 0 0 2px var(--cc-focus, #833446),
    0 10px 30px var(--cc-focus-glow, rgba(131, 52, 70, 0.35))
  ) !important;
}

`;var ac=`
[data-blit].is-layout-row, [data-scope].is-layout-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}
[data-blit].is-layout-column, [data-scope].is-layout-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}
[data-blit].is-layout-grid, [data-scope].is-layout-grid {
  display: grid;
  grid-auto-flow: row;
  align-items: start;
  justify-items: start;
  grid-template-columns: var(--cc-grid-columns, repeat(auto-fill, minmax(120px, 1fr)));
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}
[data-blit-root] [data-blit].is-flow-child {
  position: relative;
  top: auto;
  left: auto;
}
`;var cc=`/* ------------------ PAN ------------------ */

[data-blit-root][data-pan] {
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

`;var ic=`/*
 * Resize handles, appended by the resize trait: direct children of the blit, so
 * a content render never takes them away. Each carries \`data-cc-control\`, which
 * is what makes the pan add-on decline the deferred capture and the drag add-on
 * stand down on it (\`CONTROL_SELECTOR\`, \`../trait.js\`).
 *
 * Visibility is the \`hidden\` property, written by the trait - so no \`display\` is
 * declared here, and the user-agent \`[hidden]\` rule keeps working on a page that
 * never loaded this stylesheet. The reset below only defends it from a host
 * sheet that gives every div a display value.
 */
.cloudcanvas-resize-handle {
  position: absolute;
  box-sizing: border-box;
  width: var(--cc-resize-handle-size, 10px);
  height: var(--cc-resize-handle-size, 10px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-resize-handle-bg, var(--cc-accent, #38bdf8));
  box-shadow: var(--cc-resize-handle-ring, 0 0 0 1px rgba(8, 10, 16, 0.65));
  z-index: var(--cc-z-drag, 1100);
  touch-action: none;
}

.cloudcanvas-resize-handle[hidden] {
  display: none !important;
}

/* A coarse pointer gets a target it can actually hit. */
@media (pointer: coarse) {
  .cloudcanvas-resize-handle {
    width: var(--cc-resize-handle-size-coarse, 20px);
    height: var(--cc-resize-handle-size-coarse, 20px);
  }
}

/*
 * One rule per direction: where the handle sits on the box, and what the pointer
 * says it will do. The \`translate\` is what centres it *on* the edge rather than
 * inside it, so the affordance straddles the boundary it moves.
 */
.cloudcanvas-resize-handle[data-cc-resize-handle="nw"] {
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  cursor: nwse-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="n"] {
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: ns-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="ne"] {
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  cursor: nesw-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="w"] {
  top: 50%;
  left: 0;
  transform: translate(-50%, -50%);
  cursor: ew-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="e"] {
  top: 50%;
  right: 0;
  transform: translate(50%, -50%);
  cursor: ew-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="sw"] {
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
  cursor: nesw-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="s"] {
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  cursor: ns-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="se"] {
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
  cursor: nwse-resize;
}

/* A resize is a drag of the box: it clears its neighbours the same way, and the
   grab cursor must not fight the direction cursor under the pointer. */
[data-blit].is-resizing {
  z-index: var(--cc-z-drag, 1100);
  cursor: default;
}

`;var sc=`/* ------------------ SELECTION ------------------ */

[data-blit].is-selected {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-accent, #38bdf8);
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

`;var lc=`/* ------------------ SVG STATE & 3D INTERPOLATION ------------------ */

.cloudcanvas-svg-state-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  pointer-events: none;
  transform-style: preserve-3d;
}

.cloudcanvas-svg-state-host {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  pointer-events: none;
  transform-style: preserve-3d;
  transform-origin: center center;
}

.cloudcanvas-svg-state-path {
  vector-effect: non-scaling-stroke;
  transform-box: fill-box;
  transform-origin: center center;
}

/* The interpolation writes its own inline transitions. */
@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-svg-state-path,
  .cloudcanvas-svg-state-host {
    transition: none !important;
  }
}

`;var dc=`/* ------------------ TOASTS ------------------ */

.cloudcanvas-toasts {
  position: absolute;
  right: 24px;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 360px;
  z-index: var(--cc-z-overlay, 60);
  pointer-events: none;
}

.cloudcanvas-toast {
  padding: var(--cc-space-3, 12px) var(--cc-space-4, 16px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.12));
  border-left: 4px solid var(--cc-accent, #3b82f6);
  border-radius: var(--cc-radius-md, 8px);
  background: var(--cc-menu-bg, rgba(15, 23, 42, 0.92));
  color: var(--cc-text, #f8fafc);
  font-family: var(--cc-font, system-ui, sans-serif);
  font-size: var(--cc-type-sm, 13px);
  line-height: 1.4;
  box-shadow: var(--cc-shadow-2, 0 10px 25px -5px rgba(0, 0, 0, 0.5));
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}

.cloudcanvas-toast.is-shown { opacity: 1; transform: translateY(0); }
.cloudcanvas-toast-success { border-left-color: #22c55e; }
.cloudcanvas-toast-warning { border-left-color: #eab308; }

`;var uc="--cc-";function fc(e,t){let r=e?e.style:null;if(!r)return null;if(t==null)return af(r),e;for(let[n,o]of Object.entries(t))n.startsWith(uc)&&(o==null?r.removeProperty(n):r.setProperty(n,String(o)));return e}function af(e){let t=[];for(let r=0;r<e.length;r+=1){let n=e.item(r);n&&n.startsWith(uc)&&t.push(n)}for(let r of t)e.removeProperty(r)}var cf="cloudcanvas-styles";function C(e,t){return typeof document>"u"?null:document.getElementById(cf)??at(`blit-css-${e}`,t)}function pc(){return C("board",ec)}var Hr=3,mc=5,Vr="data-cc-control",sf=["button","a[href]","input","select","textarea","label",'[contenteditable=""]','[contenteditable="true"]',`[${Vr}]`].join(", ");function Ut(e){return!e||typeof e.closest!="function"?!1:!!e.closest(sf)}function me(e){return Number.isFinite(e)?e:null}function Yt(e,t){return e._downX===null||e._downY===null||!Number.isFinite(t?.clientX)||!Number.isFinite(t?.clientY)?!0:Math.hypot(t.clientX-e._downX,t.clientY-e._downY)>Hr}var Gt="is-selected";function Ht(e){let t=e.getAttribute("aria-label");if(t)return t;let r=e.getAttribute("data-type"),n=r?e.getAttribute(`data-${r}`):null;if(n&&n.startsWith("{"))try{let{title:o}=JSON.parse(n);if(typeof o=="string"&&o)return o}catch{}return e.getAttribute("data-title")??""}function hc(e){return!!(e.el&&e.el.classList.contains(Gt))}function Xr(e,t){let r=t?t.target:null;return!!(r&&typeof r.closest=="function"&&r.closest(`[${O}]`)===e.el)}function Wr(e){return e.isPrimary!==!1&&e.button===0}function te(e,t,r,n){for(let o of t)e.addEventListener(o,r,n);return()=>{for(let o of t)e.removeEventListener(o,r,n)}}function Oe(e,t,r){let n=t??g(e.el)?.root;if(!n||n.host!==e.el)throw new TypeError(`${r}: expected a root collection, blit('#app')`);return n}function lf(e){let t={x:0,y:0};return{root:e,point(r){let n=e.host.getBoundingClientRect(),o=e.camera;return o.is3d?(t=o.unproject(r.clientX-n.left,r.clientY-n.top,n)??t,t):{x:(r.clientX-n.left-o.x)/o.scale,y:(r.clientY-n.top-o.y)/o.scale}}}}function df(e,t,r,n){let o=s=>{n.move&&n.move(e,t,s,r)},a=s=>{c(),n.release&&n.release(e,t,s,r)},c=()=>{window.removeEventListener("pointermove",o),window.removeEventListener("pointerup",a),window.removeEventListener("pointercancel",a)},i=t.on("pointerdown",s=>{!Wr(s)||!Xr(t,s)||n.press(e,t,s,r)&&(c(),window.addEventListener("pointermove",o),window.addEventListener("pointerup",a),window.addEventListener("pointercancel",a))});return()=>{i(),c()}}function W(e,t={}){let r={...e,...t};return(o,a,c)=>{let i=r.init(a&&typeof a=="object"?a:{});r.attach&&r.attach(i,o);let s=[];return r.press&&s.push(df(i,o,lf(c),r)),r.mount&&s.push(r.mount(i,o,c)),()=>{for(let l of s)typeof l=="function"&&l();r.detach&&r.detach(i,o)}}}var xc="var(--cc-connector, rgba(56, 189, 248, 0.6))",gc="data-blit-svg",uf="connectable",Kr=new WeakMap;function ff(e){return{connections:new Set(e.connections||e.targets||e.connectTo||[]),stroke:e.stroke||xc,strokeWidth:e.strokeWidth||2,dashed:e.dashed!==void 0?e.dashed:!0,revision:0,_dependencies:[]}}function pf(e,t,r,n){let o=Number.isFinite(t.minX)&&Number.isFinite(r.minX);return{key:e,d:o?Qo(t,r):Jo(t.centerX,t.centerY,r.centerX,r.centerY),stroke:G(n.stroke,xc),strokeWidth:T(n.strokeWidth||2,2),dashed:n.dashed}}function mf(e,t){let r=e._ccConnector||(e._ccConnector={}),n=t.dashed?"6,4":"none";r.d!==t.d&&(r.d=t.d,e.setAttribute("d",t.d)),r.stroke!==t.stroke&&(r.stroke=t.stroke,e.setAttribute("stroke",t.stroke)),r.strokeWidth!==t.strokeWidth&&(r.strokeWidth=t.strokeWidth,e.setAttribute("stroke-width",String(t.strokeWidth))),r.dash!==n&&(r.dash=n,e.setAttribute("stroke-dasharray",n))}function hf(e,t){le(e,t,{key:r=>r.key,create:()=>ze("path",{fill:"none","vector-effect":"non-scaling-stroke"}),update:mf})}function gf(e){let t=e.plane.querySelector(`:scope > svg[${gc}]`);if(t)return t;let r=document.createElementNS(Ft,"svg");return r.setAttribute(gc,""),r.setAttribute("aria-hidden","true"),r.style.cssText="position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible;pointer-events:none",e.plane.appendChild(r),r}function bc(e){let{x:t,y:r,w:n,h:o}=e.bounds;return{minX:t,minY:r,maxX:t+n,maxY:r+o,centerX:t+n/2,centerY:r+o/2}}function vc(e){return e.isConnected&&!e.closest("[hidden]")}function bf(e,t){let r=e.host.ownerDocument.getElementById(String(t)),n=r&&vc(r)?g(r):null;return n&&n.handle?n.handle:null}function xf(e,t){let r=[];for(let[n,o]of t.sources)if(vc(n.el))for(let a of o.connections){let c=bf(e,a);c&&c!==n&&r.push(pf(`${n.el.id}->${a}`,bc(n),bc(c),o))}hf(t.host,r)}function vf(e,t,r){let n=Kr.get(r);if(!n){let o=document.createElementNS(Ft,"g");o.setAttribute("data-trait",uf),gf(r).appendChild(o),n={host:o,sources:new Map,pass:null},n.pass=()=>xf(r,n),r.hooks.write.add(n.pass),Kr.set(r,n)}return n.sources.set(t,e),v(r),()=>{if(n.sources.delete(t),n.sources.size>0){v(r);return}r.hooks.write.delete(n.pass),n.host.remove(),Kr.delete(r)}}var Ke=W({init:ff,mount:vf});var yf="flow-node",D=Object.freeze({ROOT:"cloudcanvas-flow-node",PULSING:"is-pulsing",PORT:"cloudcanvas-flow-port",PORT_IN:"cloudcanvas-flow-port-in",PORT_OUT:"cloudcanvas-flow-port-out",HEADER:"cloudcanvas-flow-header",TITLE:"cloudcanvas-flow-title",TYPE:"cloudcanvas-flow-type",BODY:"cloudcanvas-flow-body",ACTION:"cloudcanvas-flow-action-btn"}),qr="flow:pulse",wf=400,Tf="process",Vt=new WeakMap;function yc(e){let t=Vt.get(e);t!==void 0&&(clearTimeout(t),Vt.delete(e))}function Sf(e){let t=e.el.querySelector(`.${D.ROOT}`);return t?(yc(e.el),t.classList.add(D.PULSING),Vt.set(e.el,setTimeout(()=>{t.classList.remove(D.PULSING),Vt.delete(e.el)},wf)),!0):!1}function Ef(e){return e.emit(qr,{origin:e.el.id,timestamp:Date.now(),relayChain:[]})}function Af(e){let t=e.spec.connect,r=t&&typeof t=="object"?t.connections??t.targets??t.connectTo:null;return Array.isArray(r)?r:[]}function Of(e,t){Sf(e);let r=[...Array.isArray(t?.relayChain)?t.relayChain:[],e.el.id];for(let n of Af(e)){if(r.includes(n))continue;let o=e.find(n);o&&o!==e&&o.emit(qr,{...t,relayChain:r})}}var kf=`<div class="cloudcanvas-component cloudcanvas-component-card ${D.ROOT}"><div class="${D.PORT} ${D.PORT_IN}"></div><div class="${D.PORT} ${D.PORT_OUT}"></div><div class="${D.HEADER}"><div class="${D.TITLE}"></div><span class="${D.TYPE}"></span></div><div class="${D.BODY}"></div><button class="cloudcanvas-component-btn ${D.ACTION}" type="button">⚡ Transmit Pulse</button></div>`;function _f(e,t){let r=h(e),n=o=>e.querySelector(`.${o}`);return t(n(D.ACTION),"click",()=>Ef(r)),t(e,qr,o=>{o.target===e&&Of(r,o.detail?.payload)}),t(e,"remove",o=>{o.target===e&&yc(e)}),{titleText:p(n(D.TITLE)),typeText:p(n(D.TYPE)),bodyText:p(n(D.BODY))}}function Cf(e,t){let r=t.get("nodeType");m(e.titleText,t.get("title")),m(e.bodyText,t.get("description")),m(e.typeText,r==null||r===""?Tf:r)}var Lf=Object.freeze({name:yf,html:kf,keys:["title","description","nodeType"],bind:_f,render:Cf});function wc(){return I(),h.use({connect:Ke}),w(Lf)}y();y();var qe="is-focused";function Rf(e){return{padding:e.padding!==void 0?Number(e.padding):50,maxZoom:e.maxZoom!==void 0?Number(e.maxZoom):3,focusOnClick:!!e.focusOnClick,frame:e.frame!==!1,_downX:null,_downY:null}}function $f(e,t,r){return e._downX=me(r?.clientX),e._downY=me(r?.clientY),!0}function Nf(e,t){let r=e._downX,n=e._downY;return e._downX=null,e._downY=null,r===null||n===null||!Number.isFinite(t?.clientX)||!Number.isFinite(t?.clientY)?!1:Math.hypot(t.clientX-r,t.clientY-n)<mc}function If(e,t,r){C("focus",oc);let n=r.host.querySelector(`.${qe}`);if(n&&n!==t.el&&(n.classList.remove(qe),g(n)?.handle?.emit("focus:change",!1)),t.el.classList.contains(qe)||(t.el.classList.add(qe),t.emit("focus:change",!0)),e.frame===!1)return{x:r.camera.x,y:r.camera.y,scale:r.camera.scale};let{x:o,y:a,w:c,h:i}=t.bounds,s=r.camera.fit({x:o,y:a,width:c,height:i},r.hostRect,{padding:e.padding,maxZoom:e.maxZoom});return v(r),s}function Mf(e,t,r,n){return!Nf(e,r)||!e.focusOnClick?!1:(If(e,t,n.root),!0)}function Pf(e,t){return()=>{t.el.classList.contains(qe)&&(t.el.classList.remove(qe),t.emit("focus:change",!1))}}var Ze=W({init:Rf,press:$f,release:Mf,mount:Pf});y();y();y();var zf="view:change",Zr=new WeakMap;function Tc(e,t){let r=g(e.el)?.root;if(!r)throw new TypeError(`${t}: expected a root collection, blit('#app')`);return r}function Jr(e){let t=Zr.get(e);return t||(t={back:[],forward:[]},Zr.set(e,t)),t}function Qr(e,t){for(let r of[t.back,t.forward]){let n=r.filter(o=>o.root===null||fe(e.host,o.root.el));n.length!==r.length&&r.splice(0,r.length,...n)}return t}function Sc(e){return{root:e.view?h(e.view):null,camera:{x:e.camera.x,y:e.camera.y,scale:e.camera.scale}}}function Ec(e,t,r,n){let{x:o,y:a,scale:c}=n,i=t.view?h(t.view):null,{back:s,forward:l}=Qr(t,r);e.emit(zf,{root:i,camera:{x:o,y:a,scale:c},back:s.length,forward:l.length})}function Df(e,t,r,n){e.root=r.root;let{x:o,y:a,scale:c}=r.camera;typeof t.camera.animateTo=="function"&&!n.immediate?t.camera.animateTo(o,a,c,n):Object.assign(t.camera,{x:o,y:a,scale:c}),v(t)}function De(e,t,r={}){let n=Tc(e,"history.go"),o=Qr(n,Jr(n)),a=typeof t=="string"?e.find(t):h(t);if(!a)throw new TypeError(`history.go: no blit "${String(t)}" in this root`);let c=r.promote!==!1,i=c&&(n.view??n.host)===a.el;return o.forward.length=0,i||o.back.push(Sc(n)),c&&(e.root=a),Ec(e,n,o,e.view(a,r)),a}function Ac(e,t={}){let r=Tc(e,"history.back"),n=Qr(r,Jr(r));if(n.back.length===0)return!1;let o=n.back.pop();return n.forward.push(Sc(r)),Df(e,r,o,t),Ec(e,r,n,o.camera),!0}function Oc(e,t,r=g(e.el)?.root){if(!r||r.host!==e.el)throw new TypeError("history: expected a root collection, blit('#app')");return Jr(r),()=>{Zr.delete(r)}}var Bf="workspace-group",he=Object.freeze({ROOT:"cloudcanvas-workspace-card",HEADER:"cloudcanvas-workspace-header",TITLE:"cloudcanvas-workspace-title",TITLE_TEXT:"cloudcanvas-workspace-title-text",BADGE:"cloudcanvas-workspace-badge",FOCUS:"cloudcanvas-workspace-focus-btn"}),jf=80,Ff=2.5,Xt=new WeakMap;function Uf(e,t={}){let r=Bt(e);if(!r||r.el===e.el)return!1;let n=e.spec.focus,{padding:o=jf,maxZoom:a=Ff}=n&&typeof n=="object"?n:{};return De(r,e,{promote:!0,padding:o,maxZoom:a,...t}),!0}function kc(e){let t=0;for(let r of e.children)r.hasAttribute("data-blit")&&(t+=1);return t}function _c(e){return`${e} ${e===1?"item":"items"}`}function Yf(e,t,r){if(Xt.has(e)||typeof MutationObserver>"u")return;let n=new MutationObserver(()=>m(r,_c(kc(t))));n.observe(t,{childList:!0}),Xt.set(e,n)}function Gf(e){Xt.get(e)?.disconnect(),Xt.delete(e)}var Hf=`<div class="cloudcanvas-component cloudcanvas-component-card ${he.ROOT}"><div class="${he.HEADER}"><div class="${he.TITLE}"><span aria-hidden="true">📁</span><span class="${he.TITLE_TEXT}"></span><span class="${he.BADGE}"></span></div><button class="cloudcanvas-component-btn ${he.FOCUS}" type="button">🔍 Focus View</button></div><div data-scope></div></div>`;function Vf(e,t){let r=h(e),n=c=>e.querySelector(`.${c}`),o=e.querySelector("[data-scope]"),a=p(n(he.BADGE));return t(n(he.FOCUS),"click",()=>Uf(r)),t(e,"remove",c=>{c.target===e&&Gf(e)}),Yf(e,o,a),{titleText:p(n(he.TITLE_TEXT)),badgeText:a,scope:o}}function Xf(e,t){m(e.titleText,t.get("title")),m(e.badgeText,_c(kc(e.scope)))}var Wf=Object.freeze({name:Bf,html:Hf,keys:["title","category"],bind:Vf,render:Xf,defaults:{layout:"free"}});function Cc(){return I(),h.use({focus:Ze}),w(Wf)}var Kf="media-card",ae=Object.freeze({ROOT:"cloudcanvas-media-card",VIEWPORT:"cloudcanvas-media-viewport",IMAGE:"cloudcanvas-media-img",PLACEHOLDER:"cloudcanvas-media-placeholder",CONTENT:"cloudcanvas-media-content",TITLE:"cloudcanvas-media-title",CAPTION:"cloudcanvas-media-caption"}),qf=`<svg class="${ae.PLACEHOLDER}" viewBox="0 0 300 180" aria-hidden="true"><rect fill="currentColor" width="100%" height="100%" opacity="0.08"></rect><path fill="currentColor" d="M50 140 L110 80 L160 120 L210 60 L270 140 Z" opacity="0.45"></path><circle fill="currentColor" cx="80" cy="50" r="18" opacity="0.7"></circle></svg>`,Zf=`<div class="cloudcanvas-component cloudcanvas-component-card ${ae.ROOT}"><div class="${ae.VIEWPORT}"><img class="${ae.IMAGE}" hidden>${qf}</div><div class="${ae.CONTENT}"><div class="${ae.TITLE}"></div><div class="${ae.CAPTION}"></div></div></div>`;function Jf(e){let t=r=>e.querySelector(`.${r}`);return{image:t(ae.IMAGE),placeholder:t(ae.PLACEHOLDER),titleText:p(t(ae.TITLE)),captionText:p(t(ae.CAPTION))}}function Qf(e,t,r){let n=k(t.get("title")),o=de(t.get("src"),""),a=o!=="";m(e.titleText,n),m(e.captionText,t.get("caption")),a&&(b(e.image,"src",o,r,"src"),b(e.image,"alt",n,r,"alt")),E(e.image,a),e.placeholder.hasAttribute("hidden")!==a&&e.placeholder.toggleAttribute("hidden",a)}var ep=Object.freeze({name:Kf,html:Zf,keys:["title","caption","src"],bind:Jf,render:Qf});function Lc(){return I(),h.use({focus:Ze}),w(ep)}var tp="breadcrumb-bar",ge=Object.freeze({ROOT:"cloudcanvas-breadcrumb-card",BACK:"cloudcanvas-breadcrumb-back-btn",PATH:"cloudcanvas-breadcrumb-path",CRUMB:"cloudcanvas-breadcrumb-crumb",SEPARATOR:"cloudcanvas-breadcrumb-separator",CURRENT:"cloudcanvas-breadcrumb-current"}),rp="navigation:back",np="Dashboard";function Rc(e){let t=Bt(e),r=t!==null&&t.el!==e.el&&Ac(t);return e.emit(rp,{from:e.el.id}),r}var op=`<nav class="cloudcanvas-component ${ge.ROOT}" aria-label="Breadcrumb"><button class="cloudcanvas-component-btn ${ge.BACK}" type="button">⬅ Back</button><div class="${ge.PATH}"><button class="${ge.CRUMB}" type="button"></button><span class="${ge.SEPARATOR}" aria-hidden="true">›</span><span class="${ge.CURRENT}" aria-current="page"></span></div></nav>`;function ap(e){let t=e.parent;return t?_(t).title:void 0}function cp(e,t){let r=h(e),n=a=>e.querySelector(`.${a}`),o=n(ge.CRUMB);return t(n(ge.BACK),"click",()=>Rc(r)),t(o,"click",()=>Rc(r)),{rootText:p(o),currentText:p(n(ge.CURRENT)),parentTitle:ap(r)}}function ip(e,t){let r=t.get("rootName"),n=t.get("title"),o=n==null||n===""?e.parentTitle||"Focused Scope":n;m(e.rootText,`🏠 ${r??np}`),m(e.currentText,o)}var sp=Object.freeze({name:tp,html:op,keys:["title","rootName"],bind:cp,render:ip});function $c(){return I(),w(sp)}var Nc="chat-message",lp="chat-input",L=Object.freeze({ROOT:"cloudcanvas-chat-message-card",AVATAR:"cloudcanvas-chat-avatar",CONTENT:"cloudcanvas-chat-content",META:"cloudcanvas-chat-meta",AUTHOR:"cloudcanvas-chat-author",TIME:"cloudcanvas-chat-time",TEXT:"cloudcanvas-chat-text",REACTIONS:"cloudcanvas-chat-reactions",PILL:"cloudcanvas-chat-reaction-pill",PILL_EMOJI:"cloudcanvas-chat-reaction-emoji",PILL_COUNT:"cloudcanvas-chat-reaction-count",INPUT_BAR:"cloudcanvas-chat-input-bar",INPUT_FIELD:"cloudcanvas-chat-input-field",SEND:"cloudcanvas-chat-send-btn"}),dp="chat:reaction",up="chat:sent",fp=/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,pp=20,mp=70,hp=85;function gp(e){let t=k(e).trim().split(/\s+/).filter(r=>r.length>0).slice(0,2).map(r=>r[0].toUpperCase()).join("");return t===""?"U":t}function bp(e){let t=k(e).trim();return fp.test(t)?`--cc-chat-avatar-bg:${t};--cc-chat-avatar-text:${Pe(t)};`:""}function Ic(e,t){return e&&e.emoji!==void 0&&e.emoji!==null?e.emoji:t}function xp(e,t){let r=_(e).reactions;if(!Array.isArray(r)||!r[t])return!1;let n=r[t],o=Number(n.count)||0,a=n.reacted?{...n,reacted:!1,count:Math.max(0,o-1)}:{...n,reacted:!0,count:o+1};return X(e,"reactions",r.map((c,i)=>i===t?a:c)),e.emit(dp,{reaction:a,messageId:e.el.id}),!0}function vp(e){let t=e.parent;return t&&!t.el.hasAttribute("data-blit-root")?t:null}function yp(e,t){let r=k(t).trim();if(r==="")return null;let n=vp(e),o=n?Rp(n,{x:pp,y:mp+(n.blits.length-1)*hp,w:360,h:75,author:"You",handle:"@you",text:r,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}):null;return e.emit(up,{text:r,channel:n&&n.el.id||null}),o}var wp=`<article class="cloudcanvas-component cloudcanvas-component-card ${L.ROOT}"><span class="${L.AVATAR}" aria-hidden="true"></span><div class="${L.CONTENT}"><div class="${L.META}"><span class="${L.AUTHOR}"></span><span class="${L.TIME}"></span></div><div class="${L.TEXT}"></div><div class="${L.REACTIONS}"></div></div></article>`;function Tp(){let e=document.createElement("button");e.className=L.PILL,e.setAttribute("type","button"),e.setAttribute("aria-pressed","false");for(let t of[L.PILL_EMOJI,L.PILL_COUNT]){let r=document.createElement("span");r.className=t,p(r),e.appendChild(r)}return e}function Sp(e,t){let r=t&&t.reacted?"true":"false";m(e.firstElementChild.firstChild,t&&t.emoji),m(e.lastElementChild.firstChild,t&&t.count),e.getAttribute("aria-pressed")!==r&&e.setAttribute("aria-pressed",r)}function Ep(e,t){let r=h(e),n=c=>e.querySelector(`.${c}`),o=n(L.REACTIONS);t(o,"click",c=>{let i=jt(o,c.target,L.PILL,_(r).reactions,Ic);i!==-1&&xp(r,i)});let a=n(L.AVATAR);return{avatar:a,avatarText:p(a),authorText:p(n(L.AUTHOR)),timeText:p(n(L.TIME)),bodyText:p(n(L.TEXT)),reactions:o}}function Ap(e,t,r){let n=k(t.get("author")),o=k(t.get("handle")),a=t.get("reactions");m(e.avatarText,gp(n)),b(e.avatar,"style",bp(t.get("avatarColor")),r,"avatarStyle"),m(e.authorText,o===""?n:`${n} (${o})`),m(e.timeText,t.get("time")),m(e.bodyText,t.get("text")),le(e.reactions,Array.isArray(a)?a:[],{key:Ic,create:Tp,update:Sp})}var Op=`<form class="cloudcanvas-component cloudcanvas-component-card ${L.INPUT_BAR}"><input class="${L.INPUT_FIELD}" type="text" aria-label="Message" autocomplete="off"><button class="cloudcanvas-component-btn ${L.SEND}" type="submit">Send</button></form>`;function kp(e,t){let r=h(e),n=e.querySelector(`.${L.INPUT_BAR}`),o=e.querySelector(`.${L.INPUT_FIELD}`);return t(n,"submit",a=>{a.preventDefault(),yp(r,o.value)&&(o.value="")}),{field:o}}function _p(e,t,r){b(e.field,"placeholder",k(t.get("placeholder")),r,"placeholder")}var Cp=Object.freeze({name:Nc,html:wp,keys:["author","handle","avatarColor","time","text","reactions"],bind:Ep,render:Ap}),Lp=Object.freeze({name:lp,html:Op,keys:["placeholder"],bind:kp,render:_p});function en(){return I(),h.use({connect:Ke}),w(Cp)}function Mc(){return I(),w(Lp)}function Rp(e,t={}){en();let{replyTo:r,...n}=t,o=r?{connect:{connections:[r],strokeWidth:2,dashed:!0}}:{};return e.blit(N(Nc,ut({x:20,y:80,w:360,h:85,chrome:!1,author:"User",handle:"",avatarColor:"",time:"12:00 PM",text:"",reactions:[{emoji:"👍",count:1,reacted:!1},{emoji:"❤️",count:2,reacted:!1}],...o},n)))}var $p="calendar-event",H=Object.freeze({ROOT:"cloudcanvas-event-card",HEADER:"cloudcanvas-event-header",TITLE:"cloudcanvas-event-title",BADGE:"cloudcanvas-event-badge",TIME:"cloudcanvas-event-time",ACTIONS:"cloudcanvas-event-actions",BUTTON:"cloudcanvas-event-btn",ACK:"cloudcanvas-event-ack",RESOLVE:"cloudcanvas-event-resolve"}),Np=Object.freeze(["critical","high","normal","info"]),Ip="alert:acknowledged",Mp="alert:resolved",Pp="normal";function zp(e){return Np.includes(e)?e:Pp}function zc(e,t,r,n){we(e,t);let o=k(_(e).title);e.emit("announce",`${o} ${r}`),e.emit(n,{eventId:e.el.id,title:o})}function Dp(e){let t=_(e).severity==="critical";zc(e,t?{status:"acknowledged",severity:"high"}:{status:"acknowledged"},"acknowledged",Ip)}function Bp(e){zc(e,{status:"resolved",severity:"info"},"resolved",Mp)}function Pc(e,t){return`<button class="cloudcanvas-component-btn ${H.BUTTON} ${e}" type="button">${t}</button>`}var jp=`<div class="cloudcanvas-component cloudcanvas-component-card ${H.ROOT}"><div class="${H.HEADER}"><div class="${H.TITLE}"></div><span class="cloudcanvas-component-chip ${H.BADGE}"></span></div><div class="${H.TIME}"></div><div class="${H.ACTIONS}">${Pc(H.ACK,"Ack")}${Pc(H.RESOLVE,"Resolve")}</div></div>`;function Fp(e,t){let r=h(e),n=a=>e.querySelector(`.${a}`);t(n(H.ACK),"click",()=>Dp(r)),t(n(H.RESOLVE),"click",()=>Bp(r));let o=n(H.BADGE);return{card:n(H.ROOT),titleText:p(n(H.TITLE)),badge:o,badgeText:p(o),timeText:p(n(H.TIME))}}function Up(e,t,r){let n=zp(t.get("severity"));m(e.titleText,t.get("title")),m(e.timeText,t.get("time")),m(e.badgeText,t.get("status")),b(e.card,"data-severity",n,r,"severity"),b(e.badge,"data-severity",n,r,"badgeSeverity")}var Yp=Object.freeze({name:$p,html:jp,keys:["title","time","severity","status"],bind:Fp,render:Up});function Dc(){return I(),w(Yp)}var Gp="cloudcanvas-editable-input",Hp="edited",Vp=[".cloudcanvas-card-title",".cloudcanvas-sticky-title",".cloudcanvas-task-title",".cloudcanvas-telemetry-title",".cloudcanvas-flow-title",".cloudcanvas-media-title",".cloudcanvas-workspace-title-text"].join(", ");function Xp(e,t){for(let r of e.el.querySelectorAll(t))if(r.closest("[data-blit]")===e.el)return r;return null}function Wp(e,t,r){X(e,t,r),e.emit(Hp,{key:t,value:r})}function Kp(e,t,r){let n=document.createElement("input");n.className=Gp,n.setAttribute("type","text"),n.setAttribute("aria-label",`Edit ${t}`);let o=_(e)[t];return n.value=o==null?r.textContent:String(o),n}function qp(e,t,r="title"){if(!ie(e)||qn(e)||!t?.parentNode)return null;let n=t.textContent,o=Kp(e,r,t);Me(e,o),t.hidden=!0,t.parentNode.insertBefore(o,t.nextSibling),o.focus(),o.select();let a=!0,c=i=>{a&&(a=!1,o.remove(),t.hidden=!1,i&&Wp(e,r,o.value.trim()||n),ye(e))};return o.addEventListener("keydown",i=>{i.key==="Enter"?(i.preventDefault(),c(!0)):i.key==="Escape"&&(i.stopPropagation(),c(!1))}),o.addEventListener("blur",()=>c(!0)),c}function Bc(e,t){let{targetKey:r="title",selector:n=Vp}=t&&typeof t=="object"?t:{},o=null,a=c=>{let i=Xp(e,n);!i||!i.contains(c.target)||(c.stopPropagation(),o=qp(e,i,r)??o)};return e.el.addEventListener("dblclick",a),()=>{e.el.removeEventListener("dblclick",a),o?.(!1)}}var jc="drag:end",tn="resize:end";function Wt(e,t){return Math.round(e/t)*t}function Fc(e,t=24){let r=Wt(e.x,t),n=Wt(e.y,t);return(r!==e.x||n!==e.y)&&e.set({x:r,y:n}),{x:r,y:n}}function Zp(e,t=24,r=null){let{w:n,h:o}=e.size,a=Number.isFinite(r?.width)?r.width:n,c=Number.isFinite(r?.height)?r.height:o,i=Math.max(t,Wt(a,t)),s=Math.max(t,Wt(c,t));(i!==a||s!==c)&&e.set({w:i,h:s});let{x:l,y:u}=Fc(e,t);return{x:l,y:u,width:i,height:s}}function Uc(e,t){let{gridSize:r,enabled:n=!0}=t&&typeof t=="object"?t:{},o=Number(r)>0?Number(r):24,a=c=>{let i=c.detail?.payload;!n||c.target!==e.el||i?.cancelled||(c.type===tn?Zp(e,o,i):Fc(e,o))};return e.el.addEventListener(jc,a),e.el.addEventListener(tn,a),()=>{e.el.removeEventListener(jc,a),e.el.removeEventListener(tn,a)}}var Jp=Object.freeze([Xa,Ka,Ja,wc,Cc,Lc,$c,en,Mc,Dc]);function Yc(){let e=Jp.map(t=>t().el.getAttribute("data-type"));return h.use({editable:Bc,snapToGrid:Uc}),e}y();ce();y();y();var Qp=Object.freeze([{value:"",label:"None (default)"},{value:"0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.25)",label:"Raised"},{value:"inset 0 2px 4px rgba(0, 0, 0, 0.45), inset 0 -1px 0 rgba(255, 255, 255, 0.06)",label:"Inset (pressed)"},{value:"0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)",label:"Floating"}]),em=Object.freeze([{value:"",label:"(default)"},{value:"400",label:"Regular (400)"},{value:"500",label:"Medium (500)"},{value:"600",label:"Semibold (600)"},{value:"700",label:"Bold (700)"}]),tm=Object.freeze([{value:"",label:"(default)"},{value:'var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)',label:"System"},{value:'Georgia, "Times New Roman", serif',label:"Serif"},{value:"var(--cc-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)",label:"Monospace"}]),rm=Object.freeze([{value:"",label:"(default)"},{value:"left",label:"Left"},{value:"center",label:"Center"},{value:"right",label:"Right"},{value:"justify",label:"Justify"}]),Gc=Object.freeze([{value:"start",label:"Start"},{value:"center",label:"Center"},{value:"end",label:"End"},{value:"stretch",label:"Stretch"}]),Kt=Object.freeze([Object.freeze({property:"color",label:"Text colour",control:"color",reflow:!1}),Object.freeze({property:"background-color",label:"Background",control:"color",reflow:!1}),Object.freeze({property:"border-radius",label:"Corner radius",control:"length",reflow:!1}),Object.freeze({property:"box-shadow",label:"Bevel / shadow",control:"select",options:Qp,reflow:!1}),Object.freeze({property:"padding",label:"Padding",control:"length",reflow:!0}),Object.freeze({property:"margin",label:"Margin",control:"length",reflow:!0}),Object.freeze({property:"font-size",label:"Font size",control:"length",reflow:!0}),Object.freeze({property:"font-weight",label:"Font weight",control:"select",options:em,reflow:!0}),Object.freeze({property:"font-family",label:"Font family",control:"select",options:tm,reflow:!0}),Object.freeze({property:"text-align",label:"Text align",control:"select",options:rm,reflow:!1}),Object.freeze({property:"align-self",label:"Align self",control:"presets",options:Gc,reflow:!0,flowOnly:!0}),Object.freeze({property:"justify-self",label:"Justify self",control:"presets",options:Gc,reflow:!0,flowOnly:!0})]),nm=new Map(Kt.map(e=>[e.property,e])),om=Object.freeze({radius:"border-radius",background:"background-color",shadow:"box-shadow"});function Hc(e){let t=om[e]??String(e).replace(/[A-Z]/g,n=>`-${n.toLowerCase()}`),r=nm.get(t);if(!r)throw new TypeError(`style: "${e}" is not a styleable property; expected one of `+Kt.map(n=>n.property).join(", "));return r}function Vc(e,t){if(typeof t=="number"&&Number.isFinite(t))return e.control==="length"?`${t}px`:String(t);if(typeof t=="string")return t.trim();throw new TypeError(`style: the value for "${e.property}" must be a string or a finite number`)}function rn(e){let t=g(e),r=t&&R(t);r&&(r.measure.add(t),v(r))}function Xc(e,t,r){let n=Hc(t),o=Vc(n,r),a=e.el.style;return o===""?a.removeProperty(n.property):a.setProperty(n.property,o),n.reflow&&rn(e.el),a.getPropertyValue(n.property)}function am(e){if(e===!0)return[];if(!e||typeof e!="object"||Array.isArray(e))throw new TypeError("style: expected a {property: value} map");return Object.entries(e).map(([t,r])=>{let n=Hc(t);return[n,Vc(n,r)]})}function Wc(e,t){let r;try{r=am(t)}catch(o){throw e.el.removeAttribute("data-style"),o}let n=[];for(let[o,a]of r)a!==""&&(e.el.style.setProperty(o.property,a),n.push(o));return n.some(o=>o.reflow)&&rn(e.el),()=>{for(let o of n)e.el.style.removeProperty(o.property);n.some(o=>o.reflow)&&rn(e.el)}}var cm=Object.freeze(["text","number","checkbox","select"]),im=2800,sm=300;function lm(e,t){if(e.control==="number"){let n=Number(t);return Number.isFinite(n)?{value:n}:{error:`"${e.key}" must be a number`}}if(e.control==="checkbox")return{value:!!t};let r=t==null?"":String(t);return e.control==="select"&&!e.options.some(n=>n.value===r)?{error:`"${e.key}" is not one of the offered values`}:{value:r}}function Kc(e,t){let r=t&&typeof t=="object"?t:{},n={};for(let o of e.params){if(!Object.hasOwn(r,o.key)){if(o.required)return{valid:!1,error:`missing parameter "${o.key}"`};continue}let a=lm(o,r[o.key]);if(a.error)return{valid:!1,error:a.error};n[o.key]=a.value}return{valid:!0,params:n}}function dm(e,t){let r=typeof e?.key=="string"?e.key:"";if(r==="")throw new Error(`ActionRegistry: action "${t}" has a parameter with no key`);if(!cm.includes(e.control))throw new Error(`ActionRegistry: parameter "${r}" of "${t}" has an unknown control`);if(e.control==="select"&&!Array.isArray(e.options))throw new Error(`ActionRegistry: select parameter "${r}" of "${t}" needs options`);return Object.freeze({key:r,label:e.label||r,control:e.control,required:e.required!==!1,options:e.control==="select"?Object.freeze([...e.options]):null,placeholder:e.placeholder||""})}var nn=class{constructor(){this._definitions=new Map}register(t,r){if(typeof t!="string"||t==="")throw new Error("ActionRegistry.register: type must be a non-empty string");if(typeof r?.run!="function")throw new Error(`ActionRegistry.register: "${t}" requires a run function`);if(this._definitions.has(t))throw new Error(`ActionRegistry.register: "${t}" is already registered`);let n=Array.isArray(r.params)?r.params:[],o=Object.freeze({type:t,label:r.label||t,params:Object.freeze(n.map(a=>dm(a,t))),run:r.run});return this._definitions.set(t,o),o}has(t){return this._definitions.has(t)}get(t){return this._definitions.get(t)}unregister(t){return this._definitions.delete(t)}list(){return Array.from(this._definitions.values())}describe(t){return this._definitions.get(t)?.params??[]}validate(t,r){let n=this._definitions.get(t);return n?Kc(n,r):{valid:!1,error:`unknown action type "${t}"`}}run(t,r,n,o={}){let a=this._definitions.get(t);if(!a)throw new TypeError(`ActionRegistry.run: unknown action type "${t}"`);let c=Kc(a,n);if(!c.valid)throw new TypeError(`ActionRegistry.run: ${c.error}`);return a.run(r,c.params,o)}},um=Object.freeze(Kt.map(e=>Object.freeze({value:e.property,label:e.label}))),fm=Object.freeze([{value:"toggle",label:"Toggle"},{value:"hide",label:"Hide"},{value:"show",label:"Show"}]),pm=Object.freeze([{value:"info",label:"Info"},{value:"success",label:"Success"},{value:"warning",label:"Warning"}]);function qt(e,t){return(ie(e)?_(e)[t]:e.spec.fill?.[t])??""}function mm(e){return e==="html"||e==="__proto__"||e==="constructor"||e==="prototype"||e.startsWith("cc:")}function qc(e,t){let r=Object.keys(t).find(mm);if(r!==void 0)throw new TypeError(`reactions: the content key "${r}" is reserved`);return ie(e)?we(e,t):e.set({fill:t})}function hm(e,{mode:t}){let r=e.el.style.getPropertyValue("visibility")==="hidden",n=t==="hide"||t!=="show"&&!r;return n?e.el.style.setProperty("visibility","hidden"):e.el.style.removeProperty("visibility"),n}function gm(e,{key:t="count",step:r}){let n=t||"count",o=(Number(qt(e,n))||0)+(Number.isFinite(r)?r:1),a={[n]:ie(e)?o:String(o)},c=String(qt(e,"title"));return n!=="title"&&c.includes(":")&&(a.title=`${c.split(":")[0].trim()}: ${o}`),qc(e,a),o}function bm(e,t,r="info"){if(typeof document>"u")return null;C("toast",dc);let n=e?.el.querySelector(":scope > [data-blit-overlay]")??document.body,o=n.querySelector(":scope > .cloudcanvas-toasts");o||(o=n.appendChild(document.createElement("div")),o.className="cloudcanvas-toasts",o.setAttribute("role","status"));let a=o.appendChild(document.createElement("div"));return a.className=`cloudcanvas-toast cloudcanvas-toast-${r}`,a.textContent=t,requestAnimationFrame(()=>a.classList.add("is-shown")),setTimeout(()=>{a.classList.remove("is-shown"),setTimeout(()=>a.remove(),sm)},im),a}function xm(e,t){return e.blits.find(r=>qt(r,"title")===t||qt(r,"name")===t)??null}function Zc(e=Zt){return e.has("set-content")||(e.register("set-content",{label:"Set content",params:[{key:"key",label:"Content key",control:"text",placeholder:"title"},{key:"value",label:"Value",control:"text"}],run:(t,{key:r,value:n})=>qc(t,{[r]:n})}),e.register("set-style",{label:"Set style",params:[{key:"property",label:"Property",control:"select",options:um},{key:"value",label:"CSS value",control:"text",placeholder:"e.g. #ff0000"}],run:(t,{property:r,value:n})=>Xc(t,r,n)}),e.register("toggle-visibility",{label:"Toggle visibility",params:[{key:"mode",label:"Mode",control:"select",options:fm,required:!1}],run:hm}),e.register("focus",{label:"Focus (zoom to)",params:[{key:"promote",label:"Zoom in",control:"checkbox",required:!1}],run:(t,{promote:r},{app:n})=>De(n,t,{promote:!!r})}),e.register("increment-counter",{label:"Increment counter",params:[{key:"key",label:"Content key",control:"text",placeholder:"count"},{key:"step",label:"Step",control:"number",required:!1}],run:gm}),e.register("notify",{label:"Show notification",params:[{key:"message",label:"Message",control:"text",placeholder:"Action completed successfully"},{key:"variant",label:"Variant",control:"select",options:pm,required:!1}],run:(t,{message:r,variant:n},{app:o})=>!!bm(o,r||"Notification",n||"info")}),e.register("navigate-page",{label:"Navigate to page",params:[{key:"page",label:"Page name",control:"text",placeholder:"index.html"}],run:(t,{page:r},{app:n})=>De(n,xm(n,r.trim())??t)})),e}var Zt=new nn;var vm=P("reactions"),Qc=Object.freeze(["press","select","drag:start","drag:end","resize:start","resize:end","edit","action","focus:change"]),ym=Object.freeze({press:"click"}),wm=new Set(Qc);function Tm(){return`rx_${Math.random().toString(36).slice(2,10)}`}var on=class{constructor(t=Zt){this.registry=t,this._bindings=new Map}add(t){let{id:r,source:n,signal:o,action:a={}}=t&&typeof t=="object"?t:{};if(typeof n!="string"||n==="")throw new TypeError("reactions.add: a source is required");if(!wm.has(o))throw new TypeError(`reactions.add: "${o}" is not a signal`);if(typeof a?.target!="string"||a.target==="")throw new TypeError("reactions.add: an action.target is required");let c=this.registry.validate(a.type,a.params);if(!c.valid)throw new TypeError(`reactions.add: ${c.error}`);let i={id:typeof r=="string"&&r?r:Tm(),source:n,signal:o,action:{type:a.type,target:a.target,params:c.params}};return this._bindings.set(i.id,i),i}remove(t){return this._bindings.delete(t)}get(t){return this._bindings.get(t)}all(){return Array.from(this._bindings.values())}forSource(t){return this.all().filter(r=>r.source===t)}matching(t,r){return this.all().filter(n=>n.source===t&&n.signal===r)}references(t){return this.all().some(r=>r.source===t||r.action.target===t)}prune(t){let r=0;for(let[n,o]of this._bindings)t(o.source)&&t(o.action.target)||(this._bindings.delete(n),r+=1);return r}clear(){this._bindings.clear()}toJSON(){return this.all().map(({id:t,source:r,signal:n,action:o})=>({id:t,source:r,signal:n,action:{type:o.type,target:o.target,params:{...o.params}}}))}load(t,{exists:r,warn:n}={}){this.clear();let o=[],a=c=>{o.push(c),n?.(c)};for(let c of Array.isArray(t)?t:[]){let i=r?[c?.source,c?.action?.target].find(s=>s&&!r(s)):void 0;if(i){a(`reaction skipped: blit "${i}" is gone`);continue}try{this.add(c)}catch(s){a(`reaction skipped: ${s.message}`)}}return o}},Jc=new WeakMap;function an(e){let t=Jc.get(e.el);return t||(t=new on,Jc.set(e.el,t)),t}function Sm(e){let t=e.detail?.source;if(t?.el)return t;let r=e.target?.closest?.("[data-blit]");return r?g(r)?.handle??null:null}function Em(e,t,r,n,o){let a=e.find(r.action.target);if(a)try{t.registry.run(r.action.type,a,r.action.params,{app:e,source:n,target:a,event:o})}catch(c){vm.error(`reaction "${r.id}" (${r.action.type}) failed`,c)}}function ei(e,t,r){Oe(e,r,"reactions");let n=an(e);n.registry===Zt&&Zc();let o=Qc.map(a=>te(e.el,[ym[a]??a],c=>{if(a==="select"&&c.detail?.payload===!1)return;let i=Sm(c);if(!(!i||i===e||!i.el.id))for(let s of n.matching(i.el.id,a))Em(e,n,s,i,c)}));return()=>{for(let a of o)a()}}var Am="cloudcanvas-live-region",Om="position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;",km=" ";function _m(e){if(typeof document>"u"||!e)return null;let t=document.createElement("div");return t.className=Am,t.setAttribute("role","status"),t.setAttribute("aria-live","polite"),t.setAttribute("aria-atomic","true"),t.setAttribute("style",Om),e.appendChild(t),t}function Be(e,t){if(!e)return!1;let r=t==null?"":String(t).trim();return r===""?!1:(e.textContent=e.textContent===r?r+km:r,!0)}function ti(e){return Ht(e)||e.id||"item"}function Cm(e,t){let r=!1,n=()=>{r=!1,t.querySelector(".is-focused")||Be(e,"Focus cleared")};return o=>{let{payload:a}=o.detail??{},c=ti(o.target);o.type==="announce"?Be(e,a):o.type==="children:load"?Be(e,`${a?.length??0} items loaded in ${c}`):o.type==="children:error"?Be(e,`Failed to load ${c}`):o.type==="edit"?Be(e,a?`Editing ${c}`:`Finished editing ${c}`):a?Be(e,`Focused ${c}`):r||(r=!0,queueMicrotask(n))}}function ri(e,t,r){Oe(e,r,"announce"),C("announce",tc);let n=e.el,o=_m(n),a=te(n,["focus:change","edit","announce","children:load","children:error"],Cm(o,n)),c=e.root.el,i=e.tick(()=>{e.root.el!==c&&(c=e.root.el,Be(o,c===n?"Viewing the whole canvas":`Viewing ${ti(c)}`))},"read");return()=>{a(),i(),o?.remove()}}y();y();var cn="http://www.w3.org/2000/svg",Je="cursor-focus",Qe="cursor-selected",et="cursor-activated",Lm=Object.freeze([Je,Qe,et]),ni="cloudcanvas-cursor-layer",Rm="var(--cc-cursor-focus, var(--cc-focus, #833446))",$m="var(--cc-cursor-selected, #38bdf8)",Nm="var(--cc-cursor-activated, #34d399)",Im="var(--cc-cursor-label, var(--cc-text, #e2e8f0))",ci=-1,Mm=Object.freeze({width:800,height:600,left:0,top:0}),Pm="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;",zm=Object.freeze({[Je]:Object.freeze({name:Je,color:Rm,padding:8,label:""}),[Qe]:Object.freeze({name:Qe,color:$m,padding:6}),[et]:Object.freeze({name:et,color:Nm,padding:4})});function Dm(e){if(!e||typeof document>"u")return null;let t=e.querySelector(`svg.${ni}`);if(t)return t;let r=document.createElementNS(cn,"svg");return r.setAttribute("class",ni),r.setAttribute("style",Pm),r.setAttribute("aria-hidden","true"),e.appendChild(r),r}function Bm(e){let{x:t,y:r,w:n,h:o}=e.bounds;return{minX:t,minY:r,maxX:t+n,maxY:r+o,width:n,height:o}}function ii(e,t={}){let r=t.hostRect||Mm,n=t.viewport,o=Bm(e);if(!n||typeof n.canvasToScreen!="function")return o;let a=[[o.minX,o.minY],[o.maxX,o.minY],[o.minX,o.maxY],[o.maxX,o.maxY]].map(([s,l])=>n.canvasToScreen(s,l,r)).filter(Boolean);if(a.length===0)return null;let c=a.map(s=>s.x-(r.left||0)),i=a.map(s=>s.y-(r.top||0));return{minX:Math.min(...c),minY:Math.min(...i),maxX:Math.max(...c),maxY:Math.max(...i)}}function jm(e,t={}){if(!e||e.active===!1)return!1;let r=e.element??e.el??null;if(r&&(r.isConnected===!1||r.closest?.("[hidden]")))return!1;let n=t.participates;return!(typeof n=="function"&&!n(e))}function Fm(e,t){return{layer:e.layer||null,color:G(e.color,t.color),padding:T(e.padding!==void 0?e.padding:t.padding,8),label:e.label!==void 0?e.label:t.label||"",target:null,_group:null,_shape:null,_drawnTarget:void 0,_drawnVersion:ci,_visible:!1}}var Um={setTarget(e){let t=e||null;return t===this.target?!1:(this.target=t,!0)},setLayer(e){let t=e||null;return t===this.layer?this.layer:(this.layer=t,this._reset(),this.layer)},visibleTarget(e={}){return jm(this.target,e)?this.target:null},renderCursor(e){if(!this.layer||!e||!e.context)return!1;let t=this.visibleTarget(e.context);if(!this._changed(t,e))return!1;if(this._drawnTarget=t,this._drawnVersion=e.viewportVersion,!t)return this._setVisible(!1);let r=ii(t,e.context);return r?(this.draw(this.group(),r,e.context),this._setVisible(!0),!0):this._setVisible(!1)},_changed(e,t){return this._drawnTarget!==e||this._drawnVersion!==t.viewportVersion?!0:!!(e&&typeof t.isDirty=="function"&&t.isDirty(e))},group(){if(this._group)return this._group;let e=document.createElementNS(cn,"g");return e.setAttribute("data-cursor",this.name),this.layer.appendChild(e),this._group=e,e},shape(e,t={}){if(this._shape)return this._shape;let r=document.createElementNS(cn,e);for(let[n,o]of Object.entries(t))r.setAttribute(n,o);return this.group().appendChild(r),this._shape=r,r},_setVisible(e){return!this._group||this._visible===e?!1:(this._group.setAttribute("display",e?"inline":"none"),this._visible=e,!0)},resolveLabel(){if(this.label===null)return"";if(this.label)return this.label;let e=this.target?.el??this.target?.element??null;return e?Ht(e):""},_reset(){this._group=null,this._shape=null,this._drawnTarget=void 0,this._drawnVersion=ci,this._visible=!1},onDetach(){this._group&&this._group.remove(),this._reset()}};function Ym(e,t,r){let n=e.minX-t,o=e.minY-t,a=e.maxX+t,c=e.maxY+t;return[`M ${n} ${o+r} L ${n} ${o} L ${n+r} ${o}`,`M ${a-r} ${o} L ${a} ${o} L ${a} ${o+r}`,`M ${a} ${c-r} L ${a} ${c} L ${a-r} ${c}`,`M ${n+r} ${c} L ${n} ${c} L ${n} ${c-r}`].join(" ")}var Gm=Object.freeze({[Je]:{extra:e=>({showFrustum:e.showFrustum!==void 0?!!e.showFrustum:!0,labelColor:G(e.labelColor,Im)}),methods:{draw(e,t,r){e.innerHTML=this.frustum(t,r)+ra(t,{color:this.color,labelColor:this.labelColor,label:this.resolveLabel(),padding:this.padding})},frustum(e,t){if(!this.showFrustum)return"";let r=this.target?this.target.parent:null;if(!r)return"";let n=ii(r,t);return n?.maxX-n?.minX>0?ta(n,e,{stroke:this.color}):""}}},[Qe]:{extra:()=>({}),methods:{draw(e,t){let r=this.shape("rect",{class:"cloudcanvas-cursor-selected",fill:"none",rx:6,"stroke-width":2,"stroke-dasharray":"3,3"});r.setAttribute("stroke",this.color),r.setAttribute("x",(t.minX-this.padding).toFixed(1)),r.setAttribute("y",(t.minY-this.padding).toFixed(1)),r.setAttribute("width",(t.maxX-t.minX+this.padding*2).toFixed(1)),r.setAttribute("height",(t.maxY-t.minY+this.padding*2).toFixed(1))}}},[et]:{extra:e=>({armLength:T(e.armLength,12)}),methods:{draw(e,t){let r=this.shape("path",{class:"cloudcanvas-cursor-activated",fill:"none","stroke-width":2,"stroke-linecap":"round"});r.setAttribute("stroke",this.color),r.setAttribute("d",Ym(t,this.padding,this.armLength))}}}});function Hm(e,t){let r=Gm[e],n=Object.assign(Object.create(Um),r.methods);return Object.assign(n,{name:e},Fm(t,zm[e]),r.extra(t))}var oi=Object.freeze({select:e=>[Qe,!!e],"focus:change":e=>[Je,!!e],activate:()=>[et,!0],deactivate:()=>[et,!1]});function ai(e){let{x:t,y:r,w:n,h:o}=e.bounds;return`${t},${r},${n},${o}`}function Vm(e){return{canvasToScreen:(t,r,n={})=>{if(!e.is3d)return{x:t*e.scale+e.x+(n.left||0),y:r*e.scale+e.y+(n.top||0)};let o=e.project(t,r,n);return o&&{x:o.x+(n.left||0),y:o.y+(n.top||0)}}}}function Xm(e,t,r){let n={context:t,viewportVersion:r,isDirty:o=>ai(o)!==e._drawnKey};e.renderCursor(n)&&(e._drawnKey=e._drawnTarget?ai(e._drawnTarget):void 0)}function Wm(e,t,r){let n=Dm(r.overlay),o=Lm.map(d=>Hm(d,{...e.options[d]||{},layer:n})),a=new Map(o.map(d=>[d.name,d])),c=Vm(r.camera),i=0,s=d=>{let f=g(d.target)?.handle;if(!f||f.el===r.host)return;let[x,A]=oi[d.type](d.detail?d.detail.payload:null),M=a.get(x);A?M.setTarget(f):M.target===f&&M.setTarget(null),v(r)},l=(d,f)=>{let x=Array.from(r.host.querySelectorAll(f)).pop(),A=x&&g(x)?.handle;A&&a.get(d).setTarget(A)};l(Je,".is-focused"),l(Qe,".is-selected");let u=Object.keys(oi).map(d=>Km(r.host,d,s));return u.push(t.tick(d=>{d.cameraMoved&&(i+=1);let f={hostRect:d.hostRect,viewport:c};for(let x of o)Xm(x,f,i)},"write")),()=>{for(let d of u)d();for(let d of o)d.onDetach()}}function Km(e,t,r){return e.addEventListener(t,r),()=>e.removeEventListener(t,r)}var si=W({init:e=>({options:e}),mount:Wm});var qm="cloudcanvas-grab-handle",Zm="data-cc-grab",Jm="data-drag-handle",di="is-dragging";function Qm(e={}){return{dragging:!1,dragOffset:{x:0,y:0},_downX:null,_downY:null,_translating:!1,handle:typeof e.handle=="boolean"?e.handle:null}}function eh(e,t,r,n){if(Ut(r?r.target:null))return!1;e.dragging=!0,e._translating=!1,e._downX=me(r?.clientX),e._downY=me(r?.clientY),t.el&&t.el.classList&&t.el.classList.add(di);let o=n.point(r);return e.dragOffset={x:o.x-t.x,y:o.y-t.y},!0}function th(e,t,r,n){if(!e.dragging||!e._translating&&!Yt(e,r))return;e._translating||(e._translating=!0,t.emit("drag:start",{x:t.x,y:t.y}));let o=n.point(r);t.set({x:o.x-e.dragOffset.x,y:o.y-e.dragOffset.y})}function rh(e,t){let r=e._translating;return e._downX=null,e._downY=null,e._translating=!1,e.dragging&&(e.dragging=!1,t.el&&t.el.classList&&t.el.classList.remove(di)),r}function nh(e,t){return e.emit("drag:end",{x:e.x,y:e.y,cancelled:t===void 0}),!0}function li(e,t,r){return rh(e,t)?nh(t,r):!1}function oh(e,t){let r=t?.closest?.("[data-selectable-text]");return r===e.el&&r.getAttribute("data-selectable-text")!=="false"&&!t.closest(`[${Jm}]`)}function ah(e,t){if(C("drag",nc),e.handle===!1)return;let r=document.createElement("div");return r.className=qm,r.setAttribute("aria-hidden","true"),e.handle===!0&&r.setAttribute(Zm,"always"),t.el.appendChild(r),()=>r.remove()}var ui=W({init:Qm,press:(e,t,r,n)=>!oh(t,r?.target)&&eh(e,t,r,n),move:th,release:li,detach:(e,t)=>li(e,t),mount:ah});y();y();var ch=40,ih=4,fi=1.2,pi=24,sh=200,lh="application",dh="canvas",uh="Interactive canvas";function gi(e){for(let t of Object.values(e))t&&typeof t=="object"&&gi(t);return Object.freeze(e)}var mi=gi({host:{ArrowLeft:{action:"pan",dx:-1,dy:0},ArrowRight:{action:"pan",dx:1,dy:0},ArrowUp:{action:"pan",dx:0,dy:-1},ArrowDown:{action:"pan",dx:0,dy:1},"+":{action:"zoom",direction:1},"=":{action:"zoom",direction:1},"-":{action:"zoom",direction:-1},_:{action:"zoom",direction:-1},0:{action:"reset"},Enter:{action:"enter-blits"},Escape:{action:"back"},Home:{action:"unfocus"}},blit:{ArrowDown:{action:"step",delta:1},ArrowRight:{action:"step",delta:1},ArrowUp:{action:"step",delta:-1},ArrowLeft:{action:"step",delta:-1},Enter:{action:"focus"}," ":{action:"act"},Escape:{action:"exit"}}}),fh=new Set(["INPUT","TEXTAREA","SELECT","OPTION","BUTTON","SUMMARY"]);function ph(e){return!e||typeof e!="object"?!1:e.isContentEditable===!0||fh.has(e.tagName)}function mh(e,t=uh){let r=[],n=[["role",lh],["aria-roledescription",dh],["aria-label",t]];for(let[o,a]of n)!e||typeof e.setAttribute!="function"||e.hasAttribute?.(o)||(e.setAttribute(o,a),r.push(o));return r}function hh(e,t){for(let r of t??[])e.removeAttribute(r)}function gh(e,t,r){return{host:e,root:t,camera:t.camera,wake:()=>v(t),...r}}function bh(e,t,r){if(!t||ph(t.target))return!1;let n=r.targetOf(t),o=(n?mi.blit:mi.host)[t.key];if(!o)return!1;let a=n?vh(e,o,n,t,r):xh(e,o,t,r);return a&&typeof t.preventDefault=="function"&&t.preventDefault(),a}function xh(e,t,r,n){let{camera:o,actions:a}=n;if(t.action==="pan"){let c=ch*(r.shiftKey===!0?ih:1);o.panBy(t.dx*c,t.dy*c)}else if(t.action==="zoom"){let c=n.root.hostRect;o.zoomAt(t.direction>0?fi:1/fi,c.width/2,c.height/2,c)}else{if(t.action==="enter-blits")return wh(e,n);if(typeof a[t.action]=="function")a[t.action]();else return!1}return n.wake(),!0}function vh(e,t,r,n,o){switch(t.action){case"step":return Sh(e,r,t.delta,o);case"focus":return o.actions.focus(r),!0;case"act":return o.actions.act(r,n)?(typeof n.stopPropagation=="function"&&n.stopPropagation(),!0):!1;case"exit":return Th(e,o);default:return!1}}function yh(e){return e.sort((t,r)=>t.bounds.minY!==r.bounds.minY?t.bounds.minY-r.bounds.minY:t.bounds.minX!==r.bounds.minX?t.bounds.minX-r.bounds.minX:t.id<r.id?-1:1),e.map(t=>t.target)}function wh(e,t){let r=bi(e,t);if(r.length===0)return!1;let n=t.current();return xi(e,n&&r.includes(n)?n:r[0],t)}function Th(e,t){return e.current=null,!t.host||typeof t.host.focus!="function"?!1:(t.host.focus({preventScroll:!0}),!0)}function Sh(e,t,r,n){let o=e.order?.includes(t)?e.order:bi(e,n);if(o.length===0)return!1;let a=o.indexOf(t);return xi(e,a<0?o[0]:o[(a+r+o.length)%o.length],n)}function bi(e,t){return e.order=t.order(),e.order}function xi(e,t,r){let n=t?r.elementOf(t):null;return!n||typeof n.focus!="function"?!1:(n.hasAttribute("tabindex")||(n.setAttribute("tabindex","-1"),e.tabbed?.add(n)),n.focus({preventScroll:!0}),e.current=t,Ah(r,r.boundsOf(t)),!0)}function Eh(e,t,r,n){return e>=r&&t<=n?0:t-e>n-r||e<r?r-e:n-t}function Ah(e,t){if(!t)return!1;let{camera:r}=e,n=e.root.hostRect,o=(i,s,l,u,d)=>Eh(i*r.scale+l+u-pi,s*r.scale+l+u+pi,l,l+(d||0)),a=o(t.minX,t.maxX,n.left||0,r.x,n.width),c=o(t.minY,t.maxY,n.top||0,r.y,n.height);return a===0&&c===0?!1:(typeof r.animateTo=="function"?r.animateTo(r.x+a,r.y+c,r.scale,{duration:sh}):r.panBy(a,c),e.wake(),!0)}function Oh(e,t,r){let n=Object.assign(r.state??{},{current:null,order:[],tabbed:new Set});n.tabindexAdded=r.tabStop!==!1&&!e.hasAttribute("tabindex"),n.tabindexAdded&&e.setAttribute("tabindex","0"),n.aria=mh(e,r.label);let o=gh(e,t,r.hooks),a=te(e,["keydown"],c=>bh(n,c,o));return()=>{a(),n.tabindexAdded&&e.removeAttribute("tabindex"),hh(e,n.aria);for(let c of n.tabbed)c.removeAttribute("tabindex")}}function hi(e){let{x:t,y:r,w:n,h:o}=g(e).handle.bounds;return{minX:t,minY:r,maxX:t+n,maxY:r+o}}function kh(e){let t=e.el,r=(n,o)=>g(n).handle.emit("action",{key:o});return{targetOf(n){let o=n.target&&typeof n.target.closest=="function"?n.target.closest(`[${O}]`):null;return o&&o!==t?o:null},order:()=>yh(Array.from(t.querySelectorAll(`[${O}]`)).filter(n=>!n.closest("[hidden]")).map(n=>({target:n,bounds:hi(n),id:n.id}))),elementOf:n=>n,boundsOf:hi,current:()=>t.querySelector(".is-focused"),actions:{focus:n=>r(n,"Enter"),act:n=>r(n," ").defaultPrevented,reset:()=>e.view(),back:()=>{e.root.el!==t&&(e.root=e.root.parent),e.view()},unfocus:()=>{e.root=null,e.view()}}}}function vi(e,t,r){let{label:n,tabStop:o}=t&&typeof t=="object"?t:{};return Oh(e.el,Oe(e,r,"keyboard"),{label:n,tabStop:o,hooks:kh(e)})}y();y();y();y();y();y();function yi(e,t=!1){let r=e.el;if(e.anchor||!r.parentNode)return!1;let n=R(e);if(n)for(let a of[r,...r.querySelectorAll(`[${O}]`)])He(n,a);t||e.traits?.(e,!1);let o=r.ownerDocument.createComment(`blit ${r.id||""}`);return r.parentNode.insertBefore(o,r),r.parentNode.removeChild(r),e.anchor=o,ht(o,e),!0}function sn(e,t=!1){let r=e.anchor;return!r||(e.anchor=null,ht(r,null),!r.parentNode)?!1:(r.parentNode.insertBefore(e.el,r),r.parentNode.removeChild(r),t||e.traits?.(e,!0),!0)}var Qt=Object.freeze({FREE:"free",ROW:"row",COLUMN:"column",GRID:"grid"}),wi=new Set(Object.values(Qt)),Ti=Object.freeze({row:"is-layout-row",column:"is-layout-column",grid:"is-layout-grid"}),ln="is-flow-child",Si="--cc-layout-gap",Ai="cc-populated",be=new WeakMap,Jt=new WeakMap;function tt(e){return!!e&&e!==Qt.FREE}function _h(e){if(e==null||e===!0)return Qt.FREE;if(!wi.has(e))throw new TypeError(`layout: unknown mode "${e}"; expected one of ${Array.from(wi).join(", ")}`);return e}function Ch(e,{height:t,populated:r,flow:n}){e.style.minHeight=r&&!n?`${t}px`:"",e.classList.toggle(Ai,r)}function er(e){return e.root?e.root.plane:Ce(e.el)}function ft(e,t){let r=e.el;if(!tt(be.get($(r))))return Ye(e);let n=g(r),{w:o,h:a}=n;return o!==null&&(t.first||t.changed.has("w"))&&(r.style.width=`${o}px`),a!==null&&(t.first||t.changed.has("h"))&&(r.style.height=`${a}px`),n.heldPort?.inFlow&&n.heldPort(e,{...t,flow:!0}),!1}function Oi(e){return e.port===ft?!1:(e.heldPort=e.port,e.port=ft,!0)}function ki(e,t){return e.fx=null,e.fy=null,e.port!==ft?!1:(e.port=e.heldPort??null,e.heldPort=null,St(e.el),e.changed.add("x"),t&&(t.dirty.add(e),v(t)),!0)}function _i(e,t){let r=e.el;r.classList.contains(ln)!==t&&(r.classList.toggle(ln,t),t&&(r.style.transform=""),St(r))}function Ci(e,t,r){t?Oi(e):ki(e,r),_i(e,t)}function tr(e){let t=er(g(e));return Array.from(t.querySelectorAll("[data-blit]")).filter(r=>$(r)===e).map(g).filter(Boolean)}function Lh(e){let t=0,r=!1;for(let n of tr(e))!n.el.isConnected||n.el.hidden||(r=!0,t=Math.max(t,n.y+_e(n).h));return{height:Math.ceil(t),populated:r,flow:tt(be.get(e))}}function Rh(e,t){for(let r of t.dirty){let n=$(r.el),o=e.parentOf.get(r.el);o!==n&&(o&&e.invalidated.add(o),e.parentOf.set(r.el,n)),be.has(n)&&e.invalidated.add(n);let a=tt(be.get(n));a&&Oi(r),(a||r.port===ft)&&e.flowSync.push([r,a])}for(let r of e.invalidated)be.has(r)&&r.isConnected&&!g(r).root&&e.wells.push([r,Lh(r)]);e.invalidated.clear(),Nh(e,t)}function $h(e){let t=[];for(let r of tr(e)){let n=r.el;!n.isConnected||n.hidden||!n.classList.contains(ln)||(r.fx=Number(n.offsetLeft)||0,r.fy=Number(n.offsetTop)||0,t.push(r.fx,r.fy,r.mw,r.mh))}return t.join()}function Nh(e,t){for(let r of e.containers){if(!tt(be.get(r))||!r.isConnected)continue;let n=$h(r);if(e.boxes.get(r)===n)continue;e.boxes.set(r,n);let o=g(r);o.root||t.measure.add(o),v(t)}}function Ih(e,t){for(let[r,n]of e.flowSync)n||ki(r,t),_i(r,n);e.flowSync.length>0&&v(t),e.flowSync.length=0;for(let[r,n]of e.wells){let o=e.applied.get(r);if(o&&o.height===n.height&&o.populated===n.populated&&o.flow===n.flow)continue;e.applied.set(r,n);let a=g(r);Ch(er(a),n),t.measure.add(a),v(t)}e.wells.length=0}function Mh(e){let t=Jt.get(e);if(t)return t;t={count:0,invalidated:new Set,parentOf:new WeakMap,applied:new WeakMap,flowSync:[],wells:[],offs:[],containers:new Set,boxes:new WeakMap};let r=g(e.host).handle;return t.offs.push(r.tick(()=>Rh(t,e),"read"),r.tick(()=>Ih(t,e),"write")),Jt.set(e,t),C("layout",ac),ct({flow:ft}),t}function Li(e,t){for(let r of Object.values(Ti))e.classList.remove(r);tt(t)&&e.classList.add(Ti[t])}function Ri(e,t,r=R(g(e.el))){let n;try{n=_h(t)}catch(i){throw e.el.removeAttribute("data-layout"),i}if(!r)throw new TypeError("layout: a potential blit has no root");let o=Mh(r),a=er(g(e.el));o.count+=1,o.containers.add(e.el),be.set(e.el,n),Li(a,n);for(let i of tr(e.el))Ci(i,tt(n),r);Ei(e);let c=e.on("remove",i=>{i.detail?.source!==e&&Ei(e)});return()=>{c(),Ph(e,r,o,a)}}function Ph(e,t,r,n){be.delete(e.el),r.containers.delete(e.el),r.boxes.delete(e.el),Li(n,Qt.FREE);for(let o of tr(e.el))Ci(o,!1,t);if(n.style.minHeight="",n.classList.remove(Ai),r.applied.delete(e.el),r.count-=1,!(r.count>0)){for(let o of r.offs)o();Jt.delete(t)}}function $i(e,t){let r=er(g(e.el)),n=t===null||t===!0?NaN:Number(t);if(!(!Number.isFinite(n)||n<0))return r.style.setProperty(Si,`${n}px`),()=>r.style.removeProperty(Si)}function Ei(e){let t=R(g(e.el)),r=t&&Jt.get(t);return!r||!be.has(e.el)?!1:(r.invalidated.add(e.el),v(t),!0)}y();y();y();ce();var zh=P("motion"),dn=Object.freeze({linear:e=>e,"ease-out-cubic":e=>1-Math.pow(1-e,3),"ease-in-out":e=>e<.5?4*e*e*e:1-Math.pow(-2*e+2,3)/2}),Dh="ease-out-cubic",un="cc-moving",Ni="(prefers-reduced-motion: reduce)";function Bh(e){return typeof e=="function"?e:Object.hasOwn(dn,e)?dn[e]:dn[Dh]}function jh(e,t,r){return e===t?t:e<=0||t<=0?e+(t-e)*r:e*Math.pow(t/e,r)}var Ii=null;function Fh(){let e={matches:!1,query:null,onChange:null};if(typeof globalThis.matchMedia!="function")return e;try{e.query=globalThis.matchMedia(Ni)}catch(r){return zh.debug(`matchMedia rejected "${Ni}"`,r),e}let t=e.query;return t&&(e.matches=!!t.matches,e.onChange=r=>{e.matches=!!(r&&"matches"in r?r.matches:t.matches)},typeof t.addEventListener=="function"?t.addEventListener("change",e.onChange):typeof t.addListener=="function"&&t.addListener(e.onChange)),e}function Mi(){return Ii??=Fh(),Ii.matches}var rr=class extends Le{constructor(t){super(t),this.animation=null,this.onWake=null}_wake(){typeof this.onWake=="function"&&this.onWake()}panBy(t,r){this.stopAnimation(),super.panBy(t,r),this._wake()}panTo(t,r){this.stopAnimation(),super.panTo(t,r),this._wake()}setZoom(t){this.stopAnimation(),super.setZoom(t),this._wake()}zoomAt(t,r,n,o){this.stopAnimation(),super.zoomAt(t,r,n,o),this._wake()}fit(t,r,n={}){if(n.immediate){let c=super.fit(t,r,n);return this.stopAnimation(),this._wake(),c}let o=this.fitTarget(t,r,n),a=n.duration!==void 0?Number(n.duration):400;return this.animateTo(o.x,o.y,o.scale,{duration:a,easing:n.easing}),o}animateTo(t,r,n,o={}){let a=typeof o.onComplete=="function"?o.onComplete:null;if(Mi()){this.animation=null,this.x=Number(t),this.y=Number(r),this.scale=Number(n),a&&a(),this._wake();return}this.animation={startX:this.x,startY:this.y,startScale:this.scale,targetX:t,targetY:r,targetScale:n,duration:o.duration||400,easing:Bh(o.easing),elapsed:0,onComplete:a},this._wake()}stopAnimation(){this.animation=null}get isAnimating(){return!!this.animation}update(t=16){let r=this.animation;if(!r)return;r.elapsed+=t;let n=Math.min(1,r.elapsed/r.duration);if(n>=1){this.x=r.targetX,this.y=r.targetY,this.scale=r.targetScale,this.animation=null,r.onComplete&&r.onComplete();return}let o=r.easing(n);this.x=r.startX+(r.targetX-r.startX)*o,this.y=r.startY+(r.targetY-r.startY)*o,this.scale=jh(r.startScale,r.targetScale,o)}screenToCanvas(t,r,n={}){let[o,a]=[n.left||0,n.top||0];return this.is3d?this.unproject(t-o,r-a,n):{x:(t-o-this.x)/this.scale,y:(r-a-this.y)/this.scale}}canvasToScreen(t,r,n={}){let[o,a]=[n.left||0,n.top||0];if(this.is3d){let c=this.project(t,r,n);return c&&{x:c.x+o,y:c.y+a}}return{x:t*this.scale+this.x+o,y:r*this.scale+this.y+a}}};function Pi(e){let t=R(g(e.el));if(!t)throw new TypeError("motion: a potential blit has no root");return t.camera instanceof rr||(t.camera=new rr(t.camera)),t.camera.onWake=()=>v(t),t.camera}y();y();var Uh=400,fn=new WeakMap,Yh=32,Gh=24,Hh=Object.freeze({minX:1/0,minY:1/0,maxX:-1/0,maxY:-1/0});function Vh(e,t){let{x:r,y:n,scale:o}=e;return e.is3d?Xh(e,t):{minX:-r/o,minY:-n/o,maxX:(t.width-r)/o,maxY:(t.height-n)/o}}function Xh(e,t){let{width:r,height:n}=t,o=e.unproject(r/2,n/2,t);if(!o)return Hh;let a=[[0,0],[r,0],[r,n],[0,n]],c=a.map(([d,f])=>e.unproject(d,f,t)),i=c.filter(Boolean);c.forEach((d,f)=>{let x=(f+1)%4;if(!d==!c[x])return;let[A,M]=d?[a[f],a[x]]:[a[x],a[f]];i.push(Wh(e,t,A,M))});let s=Yh*Math.max(r,n)/e.scale,l=i.map(d=>d.x),u=i.map(d=>d.y);return{minX:Math.max(Math.min(...l),o.x-s),minY:Math.max(Math.min(...u),o.y-s),maxX:Math.min(Math.max(...l),o.x+s),maxY:Math.min(Math.max(...u),o.y+s)}}function Wh(e,t,[r,n],[o,a]){let c=l=>e.unproject(r+(o-r)*l,n+(a-n)*l,t),[i,s]=[0,1];for(let l=0;l<Gh;l+=1){let u=(i+s)/2;c(u)?i=u:s=u}return c(i)}function Kh(e,t,r){return e.x+e.w<t.minX-r||e.x>t.maxX+r||e.y+e.h<t.minY-r||e.y>t.maxY+r}function qh(e,t,r){if(!r.cameraMoved&&!t.pending)return;t.pending=!1;let n=Vh(e.camera,r.hostRect);for(let[o,a]of t.members){let c=Kh(Ue(o),n,a/e.camera.scale);c!==!!o.anchor&&(c?yi(o,!0):sn(o,!0)&&e.measure.add(o))}}function Zh(e){let t=fn.get(e);if(!t){t={members:new Map,pending:!0,off:null};let r=n=>qh(e,t,n);e.hooks.structure.add(r),t.off=()=>e.hooks.structure.delete(r),fn.set(e,t)}return t}function zi(e,t,r){if(!r||$(e.el)!==r.host)return;let n=g(e.el),o=Number.isFinite(t?.margin)?t.margin:Uh,a=Zh(r);return a.members.set(n,o),a.pending=!0,v(r),()=>{a.members.delete(n),n.anchor&&sn(n,!0),a.members.size===0&&(a.off(),fn.delete(r))}}ce();y();y();var Jh=P("pan"),Qh=16,eg=800,Di=160,tg=.01,rg=.0015,ng=40;function og(e,t){return e===1?Qh:e===2?Number(t)||eg:1}function Bi(e){return Math.min(Di,Math.max(-Di,e))}function ag(e,t){let r=og(Number(e.deltaMode)||0,t);return{dx:Bi((Number(e.deltaX)||0)*r),dy:Bi((Number(e.deltaY)||0)*r)}}function cg(e){if((Number(e.deltaMode)||0)!==0)return!0;let t=Number(e.deltaY)||0;return(Number(e.deltaX)||0)===0&&Math.abs(t)>=ng&&Number.isInteger(t)}function ig(e,t){return Math.exp(-e*t)}var sg="[data-cc-scroll]";function lg(e){let t=e?e.target:null;return!t||typeof t.closest!="function"?null:t.closest(sg)}function pn(e){if(!Array.isArray(e)||e.length<2)return null;let[t,r]=e;return{dist:Math.hypot(r.x-t.x,r.y-t.y),midX:(t.x+r.x)/2,midY:(t.y+r.y)/2}}var dg="_ccTextRegion";function ug(e={}){return e.isPanning=!1,e.lastPointer={x:0,y:0},e.activePointers=new Map,e.pinch=null,e._pendingCapture=null,e}function fg(e,t,r){return{host:e,camera:t.camera,wake:()=>v(t),target:r}}function pg(e){return{press(t){let r=t.target&&typeof t.target.closest=="function"?t.target.closest(`[${O}]`):null;return r&&r!==e?r:null}}}function nr(e){return Array.from(e.activePointers.values())}function mn(e,t,r){if(!e||t===void 0||typeof e[r]!="function")return!1;try{let n=typeof e.hasPointerCapture!="function"||e.hasPointerCapture(t);return r==="releasePointerCapture"&&!n?!1:(e[r](t),!0)}catch(n){return Jh.debug(`${r}(${t}) refused`,n),!1}}function mg(e,t){return e._pendingCapture={pointerId:t.pointerId,x:Number(t.clientX),y:Number(t.clientY),declined:Ut(t?t.target:null)||t[dg]===!0},e._pendingCapture}function hg(e,t,r){let n=e._pendingCapture;return!n||n.declined||n.pointerId!==t.pointerId||!(Math.hypot(t.clientX-n.x,t.clientY-n.y)>Hr)?!1:(e._pendingCapture=null,mn(r,t.pointerId,"setPointerCapture"))}function gg(e,t){e.isPanning=!1;for(let r of e.activePointers.keys())mn(t.host,r,"setPointerCapture");return e._pendingCapture=null,e.pinch=pn(nr(e)),e.pinch}function bg(e,t){let r=e.pinch,n=pn(nr(e));if(!n)return e.pinch=null,!1;let o=t.host.getBoundingClientRect();return r.dist>0&&n.dist>0&&t.camera.zoomAt(n.dist/r.dist,r.midX-o.left,r.midY-o.top,o),ji(t,{x:r.midX,y:r.midY},{x:n.midX,y:n.midY}),t.wake(),e.pinch=n,!0}function xg(e){if(e.activePointers.size>=2)return e.pinch=pn(nr(e)),!0;e.pinch=null;let[t]=nr(e);return t?(e.lastPointer={x:t.x,y:t.y},e.isPanning=!0,!0):!1}function ji(e,t,r){let n=e.camera;if(!n.is3d)return n.panBy(r.x-t.x,r.y-t.y),!0;let o=e.host.getBoundingClientRect(),a=n.unproject(t.x-o.left,t.y-o.top,o),c=n.unproject(r.x-o.left,r.y-o.top,o);return!a||!c?!1:(n.panBy(n.scale*(c.x-a.x),n.scale*(c.y-a.y)),!0)}function Fi(e){return!!(e.isPanning||e.pinch)}function Ui(e){return e.pinch=null,e.isPanning=!1,e.activePointers.clear(),e._pendingCapture=null,!0}function vg(e,t,r){let n=t.button===0&&e.activePointers.size===1;if(!(t.isPrimary===!0&&t.button===0)&&!n)return null;if(mg(e,t),e.activePointers.set(t.pointerId,{x:t.clientX,y:t.clientY}),e.activePointers.size>=2)return gg(e,r),null;let o=r.target?.press?.(t);return o||(r.noPress||(e.isPanning=!0,e.lastPointer={x:t.clientX,y:t.clientY}),null)}function yg(e,t,r){let n=e.activePointers.get(t.pointerId);if(n&&(n.x=t.clientX,n.y=t.clientY),e.pinch)return n?bg(e,r):!1;if(n&&Fi(e)&&hg(e,t,r.host),!e.isPanning)return!1;let o={x:t.clientX,y:t.clientY};return ji(r,e.lastPointer,o)&&(e.lastPointer=o),r.wake(),!0}function wg(e,t,r){if(mn(r.host,t?t.pointerId:void 0,"releasePointerCapture"),t&&t.pointerId!==void 0&&e.activePointers.delete(t.pointerId),e._pendingCapture=null,e.pinch&&xg(e))return!1;let n=e.isPanning;return e.isPanning=!1,n}function Tg(e,t){return Fi(e)?(t&&typeof t.preventDefault=="function"&&t.preventDefault(),Ui(e),!0):!1}function Sg(e,t){let r=!!(e.ctrlKey||e.metaKey);if(!r&&lg(e)||(e.preventDefault(),!t.host))return!1;let n=t.host.getBoundingClientRect(),{dx:o,dy:a}=ag(e,n.height);if(o===0&&a===0)return!1;if(a!==0&&(r||cg(e))){let c=ig(a,r?tg:rg);t.camera.zoomAt(c,e.clientX-n.left,e.clientY-n.top,n)}else t.camera.panBy(-o,-a);return t.wake(),!0}function Eg(e,t,r){let n=r.state??ug(),o=fg(e,t,r.target);o.noPress=r.press===!1;let a=[te(e,["pointerdown"],c=>vg(n,c,o)),te(window,["pointermove"],c=>yg(n,c,o)),te(window,["pointerup","pointercancel"],c=>wg(n,c,o)),te(e,["contextmenu"],c=>Tg(n,c))];return r.wheel!==!1&&a.push(te(e,["wheel"],c=>Sg(c,o),{passive:!1})),()=>{for(let c of a)c();r.state||Ui(n)}}function Yi(e,t,r){let n=t&&typeof t=="object"?t:{};return C("pan",cc),Eg(e.el,Oe(e,r,"pan"),{wheel:n.wheel!==!1,press:n.press!==!1,target:pg(e.el)})}var Ag=Object.freeze(["n","s","e","w","ne","nw","se","sw"]),hn="data-cc-resize-handle",Og="cloudcanvas-resize-handle",Wi="is-resizing",Gi=Object.freeze({width:40,height:24}),Ki=Object.freeze({n:Object.freeze({x:0,y:-1}),s:Object.freeze({x:0,y:1}),e:Object.freeze({x:1,y:0}),w:Object.freeze({x:-1,y:0}),ne:Object.freeze({x:1,y:-1}),nw:Object.freeze({x:-1,y:-1}),se:Object.freeze({x:1,y:1}),sw:Object.freeze({x:-1,y:1})});function kg(e){let t=Vi(e.minWidth,Gi.width),r=Vi(e.minHeight,Gi.height);return{directions:zg(e.directions),minWidth:t,minHeight:r,maxWidth:Xi(e.maxWidth,t),maxHeight:Xi(e.maxHeight,r),alwaysVisibleHandles:!!e.alwaysVisibleHandles,handles:new Map,resizing:!1,_downX:null,_downY:null,_sizing:!1,_origin:null,_downCanvas:null,_direction:null,_applied:null,_reportApplied:!1,_onSelect:null,_offSelect:null}}function _g(e,t){Lg(e,t),gn(e,t),e._onSelect=()=>gn(e,t),e._offSelect=t.on("select",e._onSelect)}function Cg(e,t){Zi(e,t),e._offSelect&&e._offSelect(),e._onSelect=null,e._offSelect=null;for(let r of e.handles.values())r.remove();e.handles.clear()}function Lg(e,t){if(!t.el||typeof document>"u")return 0;for(let r of e.directions){if(e.handles.has(r))continue;let n=document.createElement("div");n.className=Og,n.setAttribute(hn,r),n.setAttribute(Vr,"resize"),n.setAttribute("aria-hidden","true"),n.hidden=!0,t.el.appendChild(n),e.handles.set(r,n)}return e.handles.size}function Rg(e,t){return e.alwaysVisibleHandles||e.resizing?!0:!!(t&&hc(t))}function gn(e,t){let r=Rg(e,t);for(let n of e.handles.values())n.hidden=!r;return r}function qi(e,t){return!e||!Number.isFinite(t?.clientX)||!Number.isFinite(t?.clientY)?null:e.point(t)}function $g(e,t,r,n){let o=Ig(e,r);if(!o)return!1;e.resizing=!0,e._sizing=!1,e._direction=o,e._downX=me(r?.clientX),e._downY=me(r?.clientY),e._downCanvas=qi(n,r);let{w:a,h:c}=t.size;return e._origin={x:t.x,y:t.y,width:a,height:c},t.el&&t.el.classList&&t.el.classList.add(Wi),!0}function Ng(e,t,r,n){if(!e.resizing||!e._sizing&&!Yt(e,r))return;e._sizing||(e._sizing=!0,t.emit("resize:start",{width:e._origin.width,height:e._origin.height,direction:e._direction}));let o=qi(n,r);!o||!e._downCanvas||(e._applied=Pg(t,Mg(e,o.x-e._downCanvas.x,o.y-e._downCanvas.y)))}function Zi(e,t,r){let n=e._sizing;e._downX=null,e._downY=null,e._downCanvas=null,e._sizing=!1,e.resizing&&(e.resizing=!1,e._direction=null,t.el&&t.el.classList&&t.el.classList.remove(Wi),gn(e,t)),e._origin=null;let o=e._applied;if(e._applied=null,!n)return!1;let{w:a,h:c}=e._reportApplied&&o?{w:o.width,h:o.height}:t.size;return t.emit("resize:end",{width:a,height:c,cancelled:r===void 0}),!0}function Ig(e,t){let r=t?t.target:null;if(!r||typeof r.closest!="function")return null;let n=r.closest(`[${hn}]`);if(!n)return null;let o=n.getAttribute(hn);return e.handles.get(o)===n?o:null}function Mg(e,t,r){let n=Ki[e._direction],o=e._origin,a=Hi(n.x,o.width,t,e.minWidth,e.maxWidth,o.x),c=Hi(n.y,o.height,r,e.minHeight,e.maxHeight,o.y);return{x:a.origin,y:c.origin,width:a.size,height:c.size}}function Pg(e,t){return(t.x!==e.x||t.y!==e.y)&&e.set({x:t.x,y:t.y}),e.set({w:t.width,h:t.height}),t}function Hi(e,t,r,n,o,a){if(e===0)return{size:t,origin:a};let c=Math.min(Math.max(t+e*r,n),o);return{size:c,origin:e<0?a+(t-c):a}}function zg(e){if(e==null)return[...Ag];if(!Array.isArray(e))throw new TypeError("ResizableTrait: `directions` must be an array of direction strings");let t=[];for(let r of e){if(Ki[r]===void 0)throw new Error(`ResizableTrait: unknown resize direction "${r}"`);t.includes(r)||t.push(r)}if(t.length===0)throw new Error("ResizableTrait: `directions` cannot be empty");return t}function Vi(e,t){let r=Number(e);return Number.isFinite(r)&&r>0?r:t}function Xi(e,t){let r=Number(e);return Number.isFinite(r)?Math.max(r,t):1/0}var Ji=W({init:kg,attach:_g,detach:Cg,press:$g,move:Ng,release:Zi,mount:e=>{e._reportApplied=!0,C("resize",ic)}});y();var or=new WeakMap;function Dg(e){return{selected:!!e.selected}}function Qi(e,t){t.el&&t.el.classList&&t.el.classList.toggle(Gt,e.selected)}function ar(e,t,r){return e.selected===r?!1:(e.selected=r,Qi(e,t),t.emit("select",r),!0)}function Bg(e,t){let r=or.get(e.el);return r?ar(r,e,!!t):!1}function jg(e){let t=R(g(e.el));if(t)for(let r of t.host.querySelectorAll(`.${Gt}`))r!==e.el&&or.has(r)&&Bg(g(r).handle,!1)}function Fg(e,t){C("select",sc),or.set(t.el,e),e.selected&&t.emit("select",!0);let r=t.on("pointerdown",n=>{if(!(!Wr(n)||!Xr(t,n))){if(n.shiftKey){ar(e,t,!e.selected);return}jg(t),ar(e,t,!0)}});return()=>{r(),or.delete(t.el)}}var es=W({init:Dg,attach:Qi,detach:(e,t)=>ar(e,t,!1),mount:Fg});y();y();ce();y();y();var Ug=new WeakMap,ts=new WeakMap;function bn(e,t){let r=g(e.el);if(!r)throw new TypeError("gpuContent: not a blit");t?ts.set(r,t):ts.delete(r);let n=Yg(r);return n&&(n.touched.add(r),v(n.root)),e}function Yg(e){let t=R(e);return t&&Ug.get(t)||null}var rt=P("sprites"),cr=4096,ke=new Map,rs=new WeakMap;function Gg(e){return`url("${e.replace(/["\\]/g,"\\$&").replace(/[\n\r\f]/g,r=>`\\${r.charCodeAt(0).toString(16)} `)}")`}function os(e,t){return e.frames.get(String(t))??null}function Hg(e,t){let r=Number(t.w),n=Number(t.h)||r;if(!(r>0&&n>0))throw new TypeError("sheet: grid needs a positive w (and h)");let o=Math.floor(e.width/r),a=o*Math.floor(e.height/n);a>cr&&!(Number(t.count)<=cr)&&rt.warn(`a ${r}x${n} grid cuts ${a} frames; the first ${cr} are kept`);let c=Math.min(Number(t.count)||1/0,a,cr);for(let i=0;i<c;i+=1)e.frames.set(String(i),[i%o*r,Math.floor(i/o)*n,r,n])}function Vg(e,t){if(typeof e!="string"||!e)throw new TypeError("sheet: name must be a non-empty string");if(t===void 0)return ke.get(e)??null;let r=t.src===void 0?"":de(t.src);if(t.src!==void 0&&!r)throw new TypeError(`sheet: "${String(t.src)}" is not a safe image URL`);let n=t.image;if(!n&&r&&(n=new Image,n.crossOrigin="anonymous",n.src=r),!n)throw new TypeError("sheet: needs a src or an image");let o={image:n,url:r,width:0,height:0,loaded:!1,animations:t.animations??{},frames:new Map(Object.entries(t.frames??{}))},a=typeof n.decode=="function"&&!n.complete?n.decode():Promise.resolve();return o.ready=a.then(()=>{o.width=n.naturalWidth||n.width||0,o.height=n.naturalHeight||n.height||0,t.grid&&Hg(o,t.grid),o.loaded=!0}),o.ready.catch(c=>rt.warn(`sheet "${e}" did not load`,c)),ke.set(e,o),o}function as(e,t,r){let[n,o,a,c]=r,{width:i,height:s}=t;if(bn(e,{texture:t.image,uv:[n/i,o/s,(n+a)/i,(o+c)/s]}),!t.url)return;let l=e.size,u=(l.w||a)/a,d=(l.h||c)/c;Object.assign(e.el.style,{backgroundImage:Gg(t.url),backgroundSize:`${i*u}px ${s*d}px`,backgroundPosition:`${-n*u}px ${-o*d}px`,backgroundRepeat:"no-repeat"})}function ns(e){let t=rs.get(e);return t||(t={playing:new Set},e.hooks.write.add(r=>{for(let n of Array.from(t.playing))Xg(t,n,r.dt*ot)}),e.hooks.busy.add(()=>Array.from(t.playing).some(r=>cs(r.b.el))),rs.set(e,t),t)}var cs=e=>e.isConnected&&!e.closest("[hidden]");function Xg(e,t,r){let{animation:n,record:o,b:a}=t;if(!cs(a.el))return;t.time+=r;let c=Math.floor(t.time*(Number(n.fps)||12)/1e3);if(n.loop===!1&&c>=n.frames.length){e.playing.delete(t),a.emit("sprite:end",{animation:t.name});return}let i=c%n.frames.length;if(i===t.index)return;t.index=i;let s=os(o,n.frames[i]);s&&as(a,o,s)}function Wg(e){if(e.sheet!==void 0)return ke.has(e.sheet)?{record:ke.get(e.sheet),release(){}}:void 0;if(typeof e.src!="string")return;let t={src:e.src,frames:e.frames,grid:e.grid,animations:e.animations},r=`inline:${JSON.stringify(t)}`;if(!ke.has(r))try{Vg(r,t).users=0}catch(a){rt.warn("an inline sheet was refused",a);return}let n=ke.get(r);n.users+=1;let o=!1;return{record:n,release(){o||(o=!0,(n.users-=1)===0&&ke.get(r)===n&&ke.delete(r))}}}function is(e,t,r){let n=t&&typeof t=="object"?t:{},o=Wg(n);if(!o){rt.warn(`no sheet named "${String(n.sheet??n.src)}"`);return}let{record:a}=o,c=!0,i=null;return a.ready.then(()=>{if(!c||!g(e.el))return;let s=n.play===void 0||!Object.hasOwn(a.animations,n.play)?null:a.animations[n.play];n.play!==void 0&&!s?.frames?.length&&rt.warn(`sheet "${n.sheet}" has no animation "${n.play}"`);let l=s?s.frames[0]:n.frame??0,u=os(a,l);if(!u){rt.warn(`sheet "${n.sheet}" has no frame "${String(l)}"`);return}as(e,a,u),s&&r&&(i={b:e,record:a,animation:s,name:n.play,time:0,index:0},ns(r).playing.add(i),v(r))},()=>{}),()=>{c=!1,o.release(),i&&r&&ns(r).playing.delete(i),bn(e,null),Object.assign(e.el.style,{backgroundImage:"",backgroundSize:"",backgroundPosition:"",backgroundRepeat:""})}}function Kg(e,t=1.5){if(!Array.isArray(e)||e.length<=2)return e?[...e]:[];if(t<=0)return[...e];let r=t*t;function n(c,i,s){let l=i.x,u=i.y,d=s.x-l,f=s.y-u;if(d!==0||f!==0){let x=((c.x-l)*d+(c.y-u)*f)/(d*d+f*f);x>1?(l=s.x,u=s.y):x>0&&(l+=d*x,u+=f*x)}return d=c.x-l,f=c.y-u,d*d+f*f}function o(c,i,s,l,u){let d=l,f=-1;for(let x=i+1;x<s;x+=1){let A=n(c[x],c[i],c[s]);A>d&&(f=x,d=A)}f!==-1&&(f-i>1&&o(c,i,f,l,u),u.push(c[f]),s-f>1&&o(c,f,s,l,u))}let a=[e[0]];return o(e,0,e.length-1,r,a),a.push(e[e.length-1]),a}function ss(e,t={}){if(!Array.isArray(e)||e.length===0)return"";let r=typeof t.precision=="number"?t.precision:2,n=f=>Number(f).toFixed(r),o=[];for(let f of e)if(f&&typeof f=="object"){let x=Number(f.x!==void 0?f.x:f[0]),A=Number(f.y!==void 0?f.y:f[1]);Number.isFinite(x)&&Number.isFinite(A)&&o.push({x,y:A})}if(o.length===0)return"";if(o.length===1){let f=o[0];return`M ${n(f.x)} ${n(f.y)} L ${n(f.x+.1)} ${n(f.y+.1)}`}let a=t.tolerance!==void 0?Number(t.tolerance):1.5,c=a>0&&o.length>2?Kg(o,a):o;if(c.length===2){let f=c[0],x=c[1];return`M ${n(f.x)} ${n(f.y)} L ${n(x.x)} ${n(x.y)}`}let i=!!t.closed,s=typeof t.smoothing=="number"?t.smoothing:.25,l=c.length,u=`M ${n(c[0].x)} ${n(c[0].y)}`,d=i?l:l-1;for(let f=0;f<d;f+=1){let x=i?c[(f-1+l)%l]:f===0?c[0]:c[f-1],A=c[f],M=i?c[(f+1)%l]:c[f+1],re=i?c[(f+2)%l]:f+2<l?c[f+2]:M,V=A.x+(M.x-x.x)*s,pt=A.y+(M.y-x.y)*s,vs=M.x-(re.x-A.x)*s,ys=M.y-(re.y-A.y)*s;u+=` C ${n(V)} ${n(pt)}, ${n(vs)} ${n(ys)}, ${n(M.x)} ${n(M.y)}`}return i&&(u+=" Z"),u}function qg(e,t=100,r=100,n={}){if(!e||e.length<3)return"";let o=e.length,a=[],c=Math.PI*2/o;for(let i=0;i<o;i+=1){let s=i*c,l=Math.max(0,Number(e[i])||0);a.push({x:t+l*Math.cos(s),y:r+l*Math.sin(s)})}return ss(a,{...n,tolerance:0,closed:!0})}function ir(e,t=16,r={}){let n=Math.max(4,Number(t)||16),o=Number(r.cx!==void 0?r.cx:100),a=Number(r.cy!==void 0?r.cy:100),c=Number(r.defaultRadius||50);if(Array.isArray(e)&&e.length>=3){let s=[],l=e.length;for(let u=0;u<n;u+=1){let d=u/n*l,f=Math.floor(d),x=d-f,A=e[f%l],M=e[(f+1)%l];s.push({x:A.x+(M.x-A.x)*x,y:A.y+(M.y-A.y)*x})}return ss(s,{...r,tolerance:0,closed:!0})}if(typeof e=="string"&&e.trim().length>0){let s=e.match(/-?\d+(?:\.\d+)?/g);if(s&&s.length>=6){let l=[];for(let u=0;u<s.length-1;u+=2)l.push({x:parseFloat(s[u]),y:parseFloat(s[u+1])});if(l.length>=3)return ir(l,n,r)}}let i=new Float32Array(n).fill(c);return qg(i,o,a,r)}var Zg="cloudcanvas-svg-state-wrapper",Jg="cloudcanvas-svg-state-host",Qg="cloudcanvas-svg-state-path",eb=350,tb="cubic-bezier(0.16, 1, 0.3, 1)",ds="var(--cc-surface-2, rgba(56, 189, 248, 0.15))",us="var(--cc-accent, #38bdf8)",ls=new WeakMap;function rb(e){let t={viewBox:e.viewBox||"0 0 200 200",perspective:Number(e.perspective)||800,rx:Number(e.rx)||0,ry:Number(e.ry)||0,rz:Number(e.rz)||0,depth:Number(e.depth)||0,duration:typeof e.duration=="number"?e.duration:eb,easing:e.easing||tb,normalizeSegments:typeof e.normalizeSegments=="number"?e.normalizeSegments:0,bindVector:typeof e.bindVector=="number"?e.bindVector:null,states:new Map,currentState:void 0,bindings:null},r=e.states&&typeof e.states=="object"?e.states:{};for(let[o,a]of Object.entries(r))t.states.set(o,ob(t,a));t.states.size===0&&t.states.set("default",nb(t));let n=Array.from(t.states.keys());return t.currentState=e.initialState&&t.states.has(e.initialState)?e.initialState:n[0],t}function nb(e){return{d:e.normalizeSegments>0?ir("",e.normalizeSegments,{cx:100,cy:100,defaultRadius:50}):"M 100 50 A 50 50 0 1 0 100 150 A 50 50 0 1 0 100 50 Z",fill:ds,stroke:us,strokeWidth:2,transform:"none"}}function ob(e,t){if(!t||typeof t!="object")return{d:"",fill:"none",stroke:"currentColor",strokeWidth:2};let r=t.d||"";return e.normalizeSegments>0&&r&&(r=ir(r,e.normalizeSegments,{cx:100,cy:100})),{d:r,fill:t.fill!==void 0?t.fill:ds,stroke:t.stroke!==void 0?t.stroke:us,strokeWidth:t.strokeWidth!==void 0?t.strokeWidth:2,strokeDasharray:t.strokeDasharray||"none",strokeDashoffset:t.strokeDashoffset!==void 0?t.strokeDashoffset:0,opacity:t.opacity!==void 0?t.opacity:1,transform:t.transform||"none",filter:t.filter||"",bloom:t.bloom!==void 0?t.bloom:!1}}function ab(e,t,r){let n=ze("path",{class:Qg,"vector-effect":"non-scaling-stroke"}),o=ze("defs",{}),a=ze("svg",{class:Jg,viewBox:e.viewBox,preserveAspectRatio:"xMidYMid meet"},[o,n]),c=ze("div",{class:Zg,style:`perspective: ${e.perspective}px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: visible;`},[a]);r.appendChild(c);let i=()=>{sr(t),t.emit("svg:transitionend",{state:e.currentState})};return n.addEventListener("transitionend",i),e.bindings={wrapper:c,svg:a,defs:o,path:n,cleanupTimer:null,_onTransitionEnd:i},sb(e,t,e.currentState,!0),ib(e,{rx:e.rx,ry:e.ry,rz:e.rz,depth:e.depth}),e.bindings}function cb(e,t){let r=e.bindings;r&&(r.cleanupTimer&&clearTimeout(r.cleanupTimer),r.cleanupTimer=null,r.path.removeEventListener("transitionend",r._onTransitionEnd),r.wrapper.remove(),sr(t),e.bindings=null)}function ib(e,{rx:t,ry:r,rz:n,depth:o}={}){t!==void 0&&(e.rx=Number(t)||0),r!==void 0&&(e.ry=Number(r)||0),n!==void 0&&(e.rz=Number(n)||0),o!==void 0&&(e.depth=Number(o)||0),!(!e.bindings||!e.bindings.svg)&&(e.bindings.svg.style.transform=`translateZ(${e.depth}px) rotateX(${e.rx}deg) rotateY(${e.ry}deg) rotateZ(${e.rz}deg)`)}function sb(e,t,r,n=!1,o={}){let a=e.states.get(r);if(!e.bindings||!e.bindings.path||!a)return;let c=e.bindings.path;n?(c.style.transition="none",sr(t)):lb(e,t,c,o),a.d&&(c.setAttribute("d",a.d),c.style.d=`path("${a.d}")`),c.setAttribute("fill",a.fill),c.setAttribute("stroke",a.stroke),c.setAttribute("stroke-width",String(a.strokeWidth)),c.setAttribute("stroke-dasharray",a.strokeDasharray),c.setAttribute("stroke-dashoffset",String(a.strokeDashoffset)),c.setAttribute("opacity",String(a.opacity)),c.style.transform=a.transform&&a.transform!=="none"?a.transform:"",c.style.filter=db(a)}function lb(e,t,r,n){let o=typeof n.duration=="number"?n.duration:e.duration,a=n.easing||e.easing;r.style.transition=`d ${o}ms ${a}, transform ${o}ms ${a}, fill ${o}ms ease, stroke ${o}ms ease, stroke-width ${o}ms ease, filter ${o}ms ease`,ub(t);let c=e.bindings;c.cleanupTimer&&clearTimeout(c.cleanupTimer),c.cleanupTimer=setTimeout(()=>{sr(t),c.cleanupTimer=null},o+80)}function db(e){if(!e.bloom)return e.filter||"";let t=typeof e.bloom=="number"?e.bloom:1,r=`drop-shadow(0 0 ${4*t}px ${e.stroke}) drop-shadow(0 0 ${12*t}px ${e.fill})`;return e.filter?`${e.filter} ${r}`:r}function ub(e){e.el&&e.el.classList&&e.el.classList.add(un)}function sr(e){e.el&&e.el.classList&&e.el.classList.remove(un)}var fs=W({init:rb,attach:(e,t)=>ab(e,t,t.el),detach:cb,mount:(e,t)=>(C("svg-state",lc),ls.set(t.el,e),()=>ls.delete(t.el))});var S=Object.freeze({HEADER:"cloudcanvas-card-header",TITLE:"cloudcanvas-card-title",BADGE_SLOT:"cloudcanvas-card-badge-slot",BODY:"cloudcanvas-card-body",GAUGE_ROW:"cloudcanvas-card-gauge-row",FOOTER:"cloudcanvas-card-footer",AUTHOR:"cloudcanvas-card-author",ACTION_BTN:"cloudcanvas-card-action-btn",NEEDLE_SLOT:"cloudcanvas-card-needle-slot",GAUGE:"cloudcanvas-card-gauge",LABEL:"cloudcanvas-card-label",METER_SLOT:"cloudcanvas-card-meter-slot",MEDIA:"cloudcanvas-card-media",CAPTION:"cloudcanvas-card-caption",HTML:"cloudcanvas-card-html",SCOPE:"cloudcanvas-card-scope"});var ms="#38bdf8",fb=36,pb=0,mb=100,B=(e,t,r="",n="")=>`<${e} class="${t}"${n}>${r}</${e}>`,xn=B("div",S.HEADER,B("div",S.TITLE)+B("span",S.BADGE_SLOT)," data-drag-handle"),hb=B("div",S.HTML,""," hidden"),vn=B("div",S.SCOPE,""," data-scope");function K(e,t){for(let r of e.querySelectorAll(`.${t}`))if(r.closest("[data-blit]")===e)return r;return null}function gb(e,t){return e==null?{text:"",color:t}:typeof e=="object"?{text:e.text==null?"":String(e.text),color:G(e.color,t)}:{text:String(e),color:t}}function yn(e,t,r,n=gb(t.get("badge"),ms)){m(e.title,t.get("title")),We(e.badge,n.text?ea(n.text,n.color):"",r,"badge",`${n.text}|${n.color}`),E(e.badge,!!n.text)}function wn(e){return{header:K(e,S.HEADER),title:p(K(e,S.TITLE)),badge:K(e,S.BADGE_SLOT),html:K(e,S.HTML)}}function bb(e,t,r,n){let o=t.has("html")?String(t.get("html")??""):null;for(let a of n)a&&E(a,o===null);return e.html?(E(e.html,o!==null),o!==null&&We(e.html,o,r,"html",o),o!==null):!1}var Tn=Object.freeze({layout:"free"}),xb={name:"card",defaults:Tn,html:xn+B("div",S.BODY)+B("div",S.FOOTER,B("span",S.AUTHOR)+B("button",S.ACTION_BTN,"",' type="button"'))+hb+vn,keys:null,bind:e=>{let t={...wn(e),body:K(e,S.BODY),footer:K(e,S.FOOTER),action:K(e,S.ACTION_BTN)};return{...t,bodyText:p(t.body),authorText:p(K(e,S.AUTHOR)),actionText:p(t.action)}},render(e,t,r){if(bb(e,t,r,[e.header,e.body,e.footer]))return;yn(e,t,r);let n=t.get("body")??"",o=t.get("author")??"",a=t.get("actionText")??"";m(e.bodyText,n),E(e.body,n!==""),m(e.authorText,o),m(e.actionText,a),b(e.action,"data-action",String(a),r,"action"),E(e.action,a!==""),E(e.footer,o!==""||a!=="")}},vb={name:"media",defaults:Tn,html:xn+B("div",S.BODY,`<img class="${S.MEDIA}">`+B("p",S.CAPTION))+vn,keys:["title","badge","src","alt","caption"],bind:e=>{let t=K(e,S.CAPTION);return{...wn(e),image:K(e,S.MEDIA),caption:t,captionText:p(t)}},render(e,t,r){yn(e,t,r),b(e.image,"src",de(t.get("src"),na()),r,"src"),b(e.image,"alt",String(t.get("alt")??""),r,"alt");let n=t.get("caption")??"";m(e.captionText,n),E(e.caption,n!=="")}},yb={name:"vector-pointer",defaults:Tn,html:xn+B("div",`${S.BODY} ${S.GAUGE_ROW}`,B("div",S.NEEDLE_SLOT)+B("div",S.GAUGE,B("div",S.LABEL)+B("div",S.METER_SLOT)))+vn,keys:["title","angle","magnitude","color","label"],bind:e=>({...wn(e),needle:K(e,S.NEEDLE_SLOT),label:p(K(e,S.LABEL)),meter:K(e,S.METER_SLOT)}),render(e,t,r){let n=Number(t.get("angle"))||0,o=Number(t.get("magnitude"))||0,a=G(t.get("color"),ms);yn(e,t,r,{text:`${n.toFixed(0)}°`,color:a}),We(e.needle,qo(n,{color:a,size:fb}),r,"needle",`${n}|${a}`),m(e.label,t.get("label")??`Mag: ${o.toFixed(1)}`),We(e.meter,Zo(o,pb,mb,{color:a}),r,"meter",`${o}|${a}`)}},wb={name:"raw",html:B("div",S.HTML),keys:["html"],bind:e=>({html:K(e,S.HTML)}),render:(e,t,r)=>{let n=String(t.get("html")??"");We(e.html,n,r,"html",n)}},ps=Object.freeze([xb,vb,yb,wb]);function hs(){C("card",rc);for(let e of ps)w(e);return ps.map(e=>e.name)}var Tb=Object.freeze({drag:ui,select:es,resize:Ji,focus:Ze,connect:Ke,edit:Jn,layout:Ri,gap:$i,style:Wc,offload:zi,svgState:fs,sprite:is,pan:Yi,keyboard:vi,announce:ri,cursors:si,history:Oc,reactions:ei});function gs(e,{label:t="Board"}={}){h.use(Tb),pc(),hs();let r=h(e);return Pi(r),r.set({pan:!0,keyboard:{label:t},announce:!0,cursors:!0,history:!0,reactions:!0}),r}function bs(e){let t=[],r=n=>{for(let o of n.blits)t.push(o),r(o)};return r(e),t}function Sb(e){let t=oe(e);return t?ie(t):null}var xs=Object.freeze({blit:h,type:oe,contentKey:Sb,contentKeys:to,safeUrl:de});function Eb(){return[...Fa(),...Yc()]}return Os(Ab);})();
