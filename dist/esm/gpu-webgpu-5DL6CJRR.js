/*!
 * CloudCanvas lib v0.7.0 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
import{a as l,b as v,c as U,d as p}from"./chunk-6D6FFVHK.js";import{createLogger as G}from"cloudcanvas/log";var T=G("gpu-webgpu-mesh"),m=144,g=Object.freeze({transform:0,normal:16,color:28,lit:32}),A=`
struct Mesh {
  transform: mat4x4f,
  normal: mat3x3f,
  color: vec4f,
  lit: f32,
};

struct Varyings {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
};

const LIGHT = vec3f(${U.join(", ")});

@group(0) @binding(0) var<uniform> clip: mat4x4f;
@group(0) @binding(1) var<uniform> item: Mesh;

@vertex
fn vs(@location(0) p: vec3f, @location(1) n: vec3f) -> Varyings {
  var v: Varyings;
  v.position = clip * item.transform * vec4f(p, 1.0);
  v.normal = item.normal * n;
  return v;
}

@fragment
fn fs(v: Varyings) -> @location(0) vec4f {
  let facing = select(0.0, dot(normalize(v.normal), normalize(LIGHT)), dot(v.normal, v.normal) > 0.0);
  let shade = select(1.0, 0.35 + 0.65 * max(facing, 0.0), item.lit > 0.5);
  return vec4f(item.color.rgb * shade * item.color.a, item.color.a);
}
`,R=Object.freeze({arrayStride:v*4,stepMode:"vertex",attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]});function M(e){return e.createBindGroupLayout({label:"gpu-webgpu-mesh",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform",hasDynamicOffset:!0,minBindingSize:m}}]})}async function S(e,r,t){let a=await r.compile(e,A,"gpu-webgpu-mesh");return e.createRenderPipelineAsync({label:"gpu-webgpu-mesh",layout:e.createPipelineLayout({bindGroupLayouts:[t]}),vertex:{module:a,entryPoint:"vs",buffers:[R]},fragment:{module:a,entryPoint:"fs",targets:[{format:r.format,blend:r.blend}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{format:r.depthFormat,depthCompare:"less-equal",depthWriteEnabled:!0}})}function B(e,r,t){h(e,r);let{vertices:a,indices:i}=t??{};if(!(a instanceof Float32Array)||!(i instanceof Uint16Array||i instanceof Uint32Array)){T.warn(`mesh ${r} needs Float32Array vertices and Uint16Array or Uint32Array indices; not uploaded`);return}if(!a.length||!i.length){T.warn(`mesh ${r} has no triangles; not uploaded`);return}let o=i instanceof Uint32Array?"uint32":"uint16",n=i;i.byteLength%4!==0&&(n=new Uint16Array(i.length+1),n.set(i));let{device:s,shared:c}=e;e.geometries.set(r,{vertices:c.bufferWith(s,a,GPUBufferUsage.VERTEX),indices:c.bufferWith(s,n,GPUBufferUsage.INDEX),format:o,count:i.length})}function h(e,r){let t=e.geometries.get(r);t&&(t.vertices.destroy(),t.indices.destroy(),e.geometries.delete(r))}function L(e,r){if(r<=e.capacity)return;let{device:t}=e;e.capacity=Math.max(r,e.capacity*2,8),e.uniforms?.destroy();let a=GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST;e.uniforms=t.createBuffer({size:e.capacity*e.slot,usage:a}),e.staging=new Float32Array(e.capacity*e.slot/4),e.group=t.createBindGroup({layout:e.layout,entries:[{binding:0,resource:{buffer:e.shared.clip}},{binding:1,resource:{buffer:e.uniforms,size:m}}]})}function O(e,r,{transform:t,normal:a,color:i,lit:o}){e.set(t,r+g.transform);for(let n=0;n<3;n+=1)e.set(a.subarray(n*3,n*3+3),r+g.normal+n*4);e.set(i,r+g.color),e[r+g.lit]=o?1:0}function z(e,r){let t=r.filter(i=>"mesh"in i);if(t.length===0)return;L(e,t.length);let a=e.slot/4;t.forEach((i,o)=>O(e.staging,o*a,i)),e.device.queue.writeBuffer(e.uniforms,0,e.staging,0,t.length*a)}function F(e,r,t,a){let i=e.geometries.get(t.mesh);i&&(r.setPipeline(e.pipeline),r.setBindGroup(0,e.group,[a*e.slot]),r.setVertexBuffer(0,i.vertices),r.setIndexBuffer(i.indices,i.format),r.drawIndexed(i.count))}function V(e){for(let r of Array.from(e.geometries.keys()))h(e,r);e.uniforms?.destroy(),Object.assign(e,{uniforms:null,group:null,capacity:0})}async function E(e,r){let t=M(e),a=await S(e,r,t),i=e.limits.minUniformBufferOffsetAlignment,o={device:e,shared:r,layout:t,pipeline:a,geometries:new Map,slot:Math.ceil(m/i)*i,uniforms:null,staging:null,group:null,capacity:0};return{upload:(n,s)=>B(o,n,s),drop:n=>h(o,n),prepare:n=>z(o,n),draw:(n,s,c)=>F(o,n,s,c),destroy:()=>V(o)}}import{createLogger as C}from"cloudcanvas/log";var f=C("gpu-webgpu"),D=`
struct Varyings {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) tint: vec4f,
};

@group(0) @binding(0) var<uniform> clip: mat4x4f;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var tex: texture_2d<f32>;

@vertex
fn vs(@location(0) corner: vec2f, @location(1) box: vec4f, @location(2) depth: vec2f,
      @location(3) tint: vec4f, @location(4) rect: vec4f) -> Varyings {
  let mid = box.zw * 0.5;
  let offset = box.zw * corner - mid;
  let s = sin(depth.y);
  let c = cos(depth.y);
  let turned = vec2f(offset.x * c - offset.y * s, offset.x * s + offset.y * c);
  var v: Varyings;
  v.position = clip * vec4f(box.xy + mid + turned, depth.x, 1.0);
  v.uv = mix(rect.xy, rect.zw, corner);
  v.tint = tint;
  return v;
}

@fragment
fn fs(v: Varyings) -> @location(0) vec4f {
  let c = textureSample(tex, samp, v.uv) * v.tint;
  return vec4f(c.rgb * c.a, c.a);
}
`,y=Object.freeze({srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}),N=Object.freeze({srcFactor:"zero",dstFactor:"one-minus-src-alpha",operation:"add"}),x="depth24plus",I=Float32Array.of(0,0,1,0,0,1,1,1),_=Object.freeze({arrayStride:8,stepMode:"vertex",attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}),q=Object.freeze({arrayStride:l*4,stepMode:"instance",attributes:[{shaderLocation:1,offset:p.x*4,format:"float32x4"},{shaderLocation:2,offset:p.z*4,format:"float32x2"},{shaderLocation:3,offset:p.r*4,format:"float32x4"},{shaderLocation:4,offset:p.u0*4,format:"float32x4"}]});async function H(e,r){let t=globalThis.navigator?.gpu;if(!t)throw new Error("gpu-webgpu: navigator.gpu is unavailable");let a=await t.requestAdapter({powerPreference:r.powerPreference});if(!a)throw new Error("gpu-webgpu: no WebGPU adapter");let i=await a.requestDevice(),o=e.getContext("webgpu");if(!o)throw i.destroy(),new Error("gpu-webgpu: the canvas has no webgpu context");let n=t.getPreferredCanvasFormat(),s=GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC;return o.configure({device:i,format:n,alphaMode:"premultiplied",usage:s}),{device:i,context:o,format:n}}async function P(e,r,t){let a=e.createShaderModule({label:t,code:r}),i=await a.getCompilationInfo();for(let o of i.messages)(o.type==="error"?f.error:f.warn)(`shader ${o.type} at ${o.lineNum}:${o.linePos}: ${o.message}`);return a}function Y(e){return e.createBindGroupLayout({label:"gpu-webgpu",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]})}async function $(e,r,t){let a=await P(e,D,"gpu-webgpu"),i=e.createPipelineLayout({bindGroupLayouts:[t]}),o=(c,u)=>e.createRenderPipelineAsync({label:u,layout:i,vertex:{module:a,entryPoint:"vs",buffers:[_,q]},fragment:{module:a,entryPoint:"fs",targets:[{format:r,blend:{color:c,alpha:c}}]},primitive:{topology:"triangle-strip",cullMode:"none"},depthStencil:{format:x,depthCompare:"always",depthWriteEnabled:!1}}),[n,s]=await Promise.all([o(y,"gpu-webgpu"),o(N,"gpu-webgpu-erase")]);return{paint:n,erase:s}}function b(e,r,t){let a=e.createBuffer({size:r.byteLength,usage:t|GPUBufferUsage.COPY_DST});return e.queue.writeBuffer(a,0,r),a}async function X(e,r){let t=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),a={format:r,depthFormat:x,blend:{color:y,alpha:y},clip:t},i=Y(e),[o,n]=await Promise.all([$(e,r,i),E(e,{...a,compile:P,bufferWith:b})]),s=GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST,c=e.createTexture({size:[1,1],format:"rgba8unorm",usage:s});return e.queue.writeTexture({texture:c},Uint8Array.of(255,255,255,255),{bytesPerRow:4},[1,1]),{layout:i,quads:o,meshes:n,white:c,uniform:t,corners:b(e,I,GPUBufferUsage.VERTEX),sampler:e.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"})}}function j(e,r,t){let a=t.videoWidth||t.naturalWidth||t.width,i=t.videoHeight||t.naturalHeight||t.height;if(!a||!i){f.warn(`texture ${r} has no size yet; not uploaded`);return}let o=e.textures.get(r);if(!o||o.width!==a||o.height!==i){o?.texture.destroy();let n=GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT;o={texture:e.device.createTexture({size:[a,i],format:"rgba8unorm",usage:n}),width:a,height:i},e.textures.set(r,o),e.groups.delete(r)}try{e.device.queue.copyExternalImageToTexture({source:t,flipY:!1},{texture:o.texture,premultipliedAlpha:!1},[a,i])}catch(n){f.error(`texture ${r} upload failed`,n)}}function W(e,r){let t=e.groups.get(r);if(t)return t;let a=r!==null&&e.textures.get(r)?.texture||e.resources.white,{layout:i,uniform:o,sampler:n}=e.resources,s=e.device.createBindGroup({layout:i,entries:[{binding:0,resource:{buffer:o}},{binding:1,resource:n},{binding:2,resource:a.createView()}]});return e.groups.set(r,s),s}function k(e,r){let{instances:t,dirty:a}=r;if(!e.instances||t.byteLength>e.instances.size){e.instances?.destroy(),e.instances=b(e.device,t,GPUBufferUsage.VERTEX);return}if(!a)return;let i=Math.max(0,a[0]),o=Math.min(a[1],t.length/l);if(o<=i)return;let n=i*l;e.device.queue.writeBuffer(e.instances,n*4,t,n,(o-i)*l)}function Q(e,r){let{depth:t}=e;if(t&&t.width===r.width&&t.height===r.height)return t;t?.destroy();let a=[r.width,r.height];return e.depth=e.device.createTexture({size:a,format:x,usage:GPUTextureUsage.RENDER_ATTACHMENT}),e.depth}function J(e,r,t){let{resources:a}=e,i=0,o=null;for(let n of t){if("mesh"in n){a.meshes.draw(r,n,i++),o=null;continue}let s=n.erase?a.quads.erase:a.quads.paint;o!==s&&(r.setPipeline(s),r.setVertexBuffer(0,a.corners),r.setVertexBuffer(1,e.instances),o=s),r.setBindGroup(0,W(e,n.texture)),r.draw(4,n.count,0,n.first)}}function K(e,r){if(e.lost)return;let{device:t,context:a,resources:i}=e;k(e,r),t.queue.writeBuffer(i.uniform,0,r.clip),i.meshes.prepare(r.batches);let o=a.getCurrentTexture(),[n,s,c,u]=r.clear,d=t.createCommandEncoder(),w=d.beginRenderPass({colorAttachments:[{view:o.createView(),loadOp:"clear",storeOp:"store",clearValue:{r:n,g:s,b:c,a:u}}],depthStencilAttachment:{view:Q(e,o).createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"discard"}});J(e,w,r.batches),w.end(),t.queue.submit([d.finish()]),e.target=o}function Z(e,r,t,a,i){let o=new Uint8Array(r*t*4);for(let n=0;n<t;n+=1)o.set(e.subarray(n*a,n*a+r*4),n*r*4);if(!i)return o;for(let n=0;n<o.length;n+=4)[o[n],o[n+2]]=[o[n+2],o[n]];return o}async function ee(e){let{device:r,target:t,format:a}=e;if(!t)throw new Error("gpu-webgpu: nothing drawn to read");let{width:i,height:o}=t,n=Math.ceil(i*4/256)*256,s=GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST,c=r.createBuffer({size:n*o,usage:s}),u=r.createCommandEncoder();u.copyTextureToBuffer({texture:t},{buffer:c,bytesPerRow:n},[i,o]),r.queue.submit([u.finish()]);try{await c.mapAsync(GPUMapMode.READ);let d=Z(new Uint8Array(c.getMappedRange()),i,o,n,a==="bgra8unorm");return c.unmap(),{width:i,height:o,data:d}}finally{c.destroy()}}function re(e){let{resources:r}=e;e.lost=!0,e.target=null,e.instances?.destroy(),e.depth?.destroy(),r.meshes.destroy();for(let{texture:t}of e.textures.values())t.destroy();e.textures.clear(),e.groups.clear();for(let t of[r.corners,r.uniform,r.white])t.destroy();e.context.unconfigure()}async function ce(e,r={}){let{device:t,context:a,format:i}=await H(e,r),o=await X(t,i).catch(s=>{throw a.unconfigure(),t.destroy(),s}),n={device:t,context:a,format:i,resources:o,textures:new Map,groups:new Map,instances:null,depth:null,target:null,lost:!1};return t.lost.then(s=>{s.reason!=="destroyed"&&f.error(`device lost (${s.reason}): ${s.message}`),n.lost=!0}),t.addEventListener("uncapturederror",s=>f.error("uncaptured error",s.error)),{kind:"webgpu",depthRange:"zero-to-one",texture:(s,c)=>j(n,s,c),dropTexture(s){n.textures.get(s)?.texture.destroy(),n.textures.delete(s),n.groups.delete(s)},mesh:(s,c)=>o.meshes.upload(s,c),dropMesh:s=>o.meshes.drop(s),draw:s=>K(n,s),read:()=>ee(n),destroy:()=>re(n)}}export{ce as createBackend};
