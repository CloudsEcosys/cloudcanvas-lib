/*!
 * CloudCanvas lib v0.7.1 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
import{a as f,b as T,c as m,d as u}from"./chunk-PMW52N5Q.js";import{createLogger as L}from"cloudcanvas/log";var B=L("gpu-webgl2"),h=4,R=0,x=1,_=`#version 300 es
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
uniform mat4 clip;
uniform mat4 transform;
uniform mat3 normalMatrix;
out vec3 turnedNormal;
void main() {
  gl_Position = clip * transform * vec4(position, 1.0);
  turnedNormal = normalMatrix * normal;
}
`,p=`#version 300 es
precision highp float;
uniform vec4 color;
uniform bool lit;
uniform vec3 light;
in vec3 turnedNormal;
out vec4 outColor;
void main() {
  float facing = dot(turnedNormal, turnedNormal) > 0.0 ? dot(normalize(turnedNormal), normalize(light)) : 0.0;
  float shade = lit ? 0.35 + 0.65 * max(facing, 0.0) : 1.0;
  outColor = vec4(color.rgb * shade * color.a, color.a);
}
`;function w(e,o){return o?.vertices instanceof Float32Array?o.indices instanceof Uint16Array?e.UNSIGNED_SHORT:o.indices instanceof Uint32Array?e.UNSIGNED_INT:null:null}var l=class{#e;#t;#o;#r=new Map;constructor(o,r){let t=n=>o.getUniformLocation(r,n);this.#e=o,this.#t=r,this.#o={clip:t("clip"),transform:t("transform"),normal:t("normalMatrix"),color:t("color"),lit:t("lit")},o.useProgram(r),o.uniform3fv(t("light"),m)}upload(o,r){let t=this.#e,n=w(t,r);if(n===null){B.warn(`mesh ${o} skipped: expected {vertices: Float32Array, indices: Uint16Array|Uint32Array}`);return}let i=this.#r.get(o)??this.#i(o);t.bindVertexArray(i.vao),t.bindBuffer(t.ARRAY_BUFFER,i.vertices),t.bufferData(t.ARRAY_BUFFER,r.vertices,t.STATIC_DRAW),t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,i.indices),t.bufferData(t.ELEMENT_ARRAY_BUFFER,r.indices,t.STATIC_DRAW),t.bindVertexArray(null),i.type=n,i.count=r.indices.length}drop(o){let r=this.#r.get(o);r&&(this.#r.delete(o),this.#n(r))}begin(o){this.#e.useProgram(this.#t),this.#e.uniformMatrix4fv(this.#o.clip,!1,o)}draw(o){let r=this.#e,t=this.#r.get(o.mesh);if(!t||t.count===0)return;let n=this.#o;r.useProgram(this.#t),r.enable(r.DEPTH_TEST),r.uniformMatrix4fv(n.transform,!1,o.transform),r.uniformMatrix3fv(n.normal,!1,o.normal),r.uniform4fv(n.color,o.color),r.uniform1i(n.lit,o.lit?1:0),r.bindVertexArray(t.vao),r.drawElements(r.TRIANGLES,t.count,t.type,0),r.bindVertexArray(null)}destroy(){for(let o of this.#r.values())this.#n(o);this.#r.clear(),this.#e.deleteProgram(this.#t)}#i(o){let r=this.#e,t={vao:r.createVertexArray(),vertices:r.createBuffer(),indices:r.createBuffer(),count:0},n=T*h;return r.bindVertexArray(t.vao),r.bindBuffer(r.ARRAY_BUFFER,t.vertices),r.enableVertexAttribArray(R),r.vertexAttribPointer(R,3,r.FLOAT,!1,n,0),r.enableVertexAttribArray(x),r.vertexAttribPointer(x,3,r.FLOAT,!1,n,3*h),r.bindVertexArray(null),this.#r.set(o,t),t}#n(o){this.#e.deleteVertexArray(o.vao),this.#e.deleteBuffer(o.vertices),this.#e.deleteBuffer(o.indices)}};import{createLogger as F}from"cloudcanvas/log";var d=F("gpu-webgl2"),b=4,E=f*b,N=Object.freeze({alpha:!0,premultipliedAlpha:!0,depth:!0,antialias:!1,preserveDrawingBuffer:!1}),v=0,S=Object.freeze([[1,4,u.x],[2,2,u.z],[3,4,u.r],[4,4,u.u0]]),P=`#version 300 es
layout(location = 0) in vec2 corner;
layout(location = 1) in vec4 box;
layout(location = 2) in vec2 depthTurn;
layout(location = 3) in vec4 tint;
layout(location = 4) in vec4 uvRect;
uniform mat4 clip;
out vec2 uv;
out vec4 color;
void main() {
  vec2 halfSize = box.zw * 0.5;
  vec2 local = box.zw * corner - halfSize;
  float s = sin(depthTurn.y);
  float c = cos(depthTurn.y);
  vec2 turned = vec2(local.x * c - local.y * s, local.x * s + local.y * c);
  gl_Position = clip * vec4(box.xy + halfSize + turned, depthTurn.x, 1.0);
  uv = mix(uvRect.xy, uvRect.zw, corner);
  color = tint;
}
`,D=`#version 300 es
precision highp float;
uniform sampler2D tex;
in vec2 uv;
in vec4 color;
out vec4 outColor;
void main() {
  vec4 c = texture(tex, uv) * color;
  outColor = vec4(c.rgb * c.a, c.a);
}
`;function y(e,o,r){let t=e.createShader(o);if(e.shaderSource(t,r),e.compileShader(t),e.getShaderParameter(t,e.COMPILE_STATUS))return t;let n=e.getShaderInfoLog(t),i=o===e.VERTEX_SHADER?"vertex":"fragment";throw e.deleteShader(t),d.error(`${i} shader failed to compile`,n),new Error(`gpu-webgl2: ${i} shader failed to compile: ${n}`)}function I(e,o,r){let t=e.createProgram(),n=[];try{n.push(y(e,e.VERTEX_SHADER,o)),n.push(y(e,e.FRAGMENT_SHADER,r));for(let i of n)e.attachShader(t,i);if(e.linkProgram(t),!e.getProgramParameter(t,e.LINK_STATUS)){let i=e.getProgramInfoLog(t);throw d.error("program failed to link",i),new Error(`gpu-webgl2: program failed to link: ${i}`)}return t}catch(i){throw e.deleteProgram(t),i}finally{for(let i of n)e.deleteShader(i)}}function O(e,o){let r=[];try{for(let[t,n]of o)r.push(I(e,t,n));return r}catch(t){for(let n of r)e.deleteProgram(n);throw t}}function C(e){let o=e.createVertexArray(),r=e.createBuffer(),t=e.createBuffer();e.bindVertexArray(o),e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,Float32Array.of(0,0,1,0,0,1,1,1),e.STATIC_DRAW),e.enableVertexAttribArray(v),e.vertexAttribPointer(v,2,e.FLOAT,!1,0,0);for(let[n]of S)e.enableVertexAttribArray(n),e.vertexAttribDivisor(n,1);return e.bindVertexArray(null),{vao:o,corners:r,instances:t}}function U(e){let o=e.createTexture();return e.bindTexture(e.TEXTURE_2D,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),o}function M(e,o){let[r,t]=O(e,[[P,D],[_,p]]);e.useProgram(r),e.uniform1i(e.getUniformLocation(r,"tex"),0),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.depthFunc(e.LEQUAL),e.clearDepth(1),e.disable(e.CULL_FACE);let n=U(e);return e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,Uint8Array.of(255,255,255,255)),{gl:e,canvas:o,program:r,white:n,...C(e),meshes:new l(e,t),clip:e.getUniformLocation(r,"clip"),textures:new Map,instanceBytes:0,lost:!1,destroyed:!1}}function G(e){return[e.videoWidth||e.naturalWidth||e.width,e.videoHeight||e.naturalHeight||e.height]}function g(e,o,r){let{gl:t,textures:n}=e;if(e.lost||e.destroyed)return;let i=n.get(o);i||(i={texture:U(t),width:-1,height:-1},n.set(o,i));let[c,a]=G(r);t.bindTexture(t.TEXTURE_2D,i.texture),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1);try{if(i.width===c&&i.height===a){t.texSubImage2D(t.TEXTURE_2D,0,0,0,t.RGBA,t.UNSIGNED_BYTE,r);return}t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,r),i.width=c,i.height=a}catch(s){d.warn(`texture ${o} could not be uploaded`,s)}}function V(e,o){let r=e.textures.get(o);r&&(e.textures.delete(o),e.destroyed||e.gl.deleteTexture(r.texture))}function X(e,o){let{gl:r}=e,{instances:t,dirty:n}=o;if(r.bindBuffer(r.ARRAY_BUFFER,e.instances),t.byteLength>e.instanceBytes)r.bufferData(r.ARRAY_BUFFER,t,r.DYNAMIC_DRAW),e.instanceBytes=t.byteLength;else if(n&&n[1]>n[0]){let[i,c]=n;r.bufferSubData(r.ARRAY_BUFFER,i*E,t,i*f,(c-i)*f)}}function Y(e,o){let r=o*E;for(let[t,n,i]of S)e.vertexAttribPointer(t,n,e.FLOAT,!1,E,r+i*b)}function H(e,o){return o!==null&&e.textures.get(o)?.texture||e.white}function z(e,o){let{gl:r}=e;o.count<=0||(r.useProgram(e.program),r.disable(r.DEPTH_TEST),r.bindVertexArray(e.vao),r.bindBuffer(r.ARRAY_BUFFER,e.instances),r.bindTexture(r.TEXTURE_2D,H(e,o.texture)),Y(r,o.first),r.drawArraysInstanced(r.TRIANGLE_STRIP,0,4,o.count),r.bindVertexArray(null))}function W(e,o){let{gl:r,canvas:t}=e;if(e.lost||e.destroyed)return;let[n,i,c,a]=o.clear;r.viewport(0,0,t.width,t.height),r.clearColor(n,i,c,a),r.depthMask(!0),r.clear(r.COLOR_BUFFER_BIT|r.DEPTH_BUFFER_BIT),X(e,o),r.useProgram(e.program),r.uniformMatrix4fv(e.clip,!1,o.clip),e.meshes.begin(o.clip),r.activeTexture(r.TEXTURE0);for(let s of o.batches){let A="mesh"in s;r.blendFunc(!A&&s.erase===!0?r.ZERO:r.ONE,r.ONE_MINUS_SRC_ALPHA),A?e.meshes.draw(s):z(e,s)}}function k(e,o,r){let t=o*4,n=new Uint8Array(e.length);for(let i=0;i<r;i+=1)n.set(e.subarray((r-1-i)*t,(r-i)*t),i*t);return n}function $(e){let{gl:o,canvas:r}=e,{width:t,height:n}=r,i=new Uint8Array(t*n*4);return!e.lost&&!e.destroyed&&o.readPixels(0,0,t,n,o.RGBA,o.UNSIGNED_BYTE,i),Promise.resolve({width:t,height:n,data:k(i,t,n)})}function j(e){let{gl:o}=e;if(!e.destroyed){for(let r of e.textures.values())o.deleteTexture(r.texture);e.textures.clear(),o.deleteTexture(e.white),o.deleteBuffer(e.corners),o.deleteBuffer(e.instances),o.deleteVertexArray(e.vao),o.deleteProgram(e.program),e.meshes.destroy(),e.destroyed=!0,o.getExtension("WEBGL_lose_context")?.loseContext()}}async function re(e,o={}){let r=e.getContext("webgl2",N);if(!r||r.isContextLost())throw new Error("gpu-webgl2: no WebGL2 context on this canvas");let t=M(r,e),n,i=new Promise(a=>{n=a}),c=a=>{a.preventDefault(),t.lost=!0,d.warn("WebGL2 context lost; drawing stops"),n("context lost")};return e.addEventListener("webglcontextlost",c),Object.freeze({kind:"webgl2",depthRange:"minus-one-to-one",lost:i,texture:(a,s)=>g(t,a,s),dropTexture:a=>V(t,a),mesh:(a,s)=>{!t.lost&&!t.destroyed&&t.meshes.upload(a,s)},dropMesh:a=>{t.destroyed||t.meshes.drop(a)},draw:a=>W(t,a),read:()=>$(t),destroy:()=>{e.removeEventListener("webglcontextlost",c),j(t)}})}export{re as createBackend};
