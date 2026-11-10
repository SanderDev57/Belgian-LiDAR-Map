const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function harness(host='127.0.0.1',override){
 const calls=[],id='a'.repeat(32),response=data=>({ok:true,json:async()=>data});
 const good={results:[{type:'mound',engine:'tumulus',scoreKind:'model',score:72,cx:30,cy:30,minX:20,minY:20,maxX:40,maxY:40}],candidates:1};
 const ctx={window:{TerrainScan:require('../js/scan-core.js')},location:{hostname:host},crypto:{randomUUID:()=>id},DOMException,AbortController,ArrayBuffer,DataView,Date,setTimeout,clearTimeout,
 fetch:async(url,options)=>{calls.push({url,options});if(override)return override(url,options,response,good);if(url==='/api/models')return response({service:'belgian-lidar-models',version:1,models:[{id:'tumulus',installed:true}]});if(options.method==='DELETE')return response({cancelled:true});if(options.method==='POST')return response({id});return response({state:'complete',result:good});}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/scan-models.js'),'utf8'),ctx);return {api:ctx.window.TerrainScanModels,calls};
}
const grid={width:64,height:64,halo:104,widthM:40,heightM:40,cellSize:1,values:new Float32Array(4096).fill(123.5)};
test('no startup network; local-only models; binary upload and typed model results',async()=>{
 const h=harness();assert.equal(h.calls.length,0);await h.api.available('tumulus');const out=await h.api.analyze(grid,{model:'tumulus',threshold:.6,signal:new AbortController().signal});assert.equal(out.results.length,1);
 const upload=h.calls.find(c=>c.options.method==='POST');assert.equal(upload.options.body.byteLength,4096*4);assert.equal(new DataView(upload.options.body).getFloat32(0,true),123.5);assert.equal(JSON.parse(upload.options.headers['X-Scan-Metadata']).requestId,'a'.repeat(32));
 const hosted=harness('sanderdev57.github.io');await assert.rejects(hosted.api.probe(),/draaien lokaal/);assert.equal(hosted.calls.length,0);
});
test('cancel during upload sends DELETE for a preallocated ID',async()=>{
 const h=harness('localhost',(url,o,r)=>{if(o.method==='DELETE')return Promise.resolve(r({cancelled:true}));return new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>reject(new DOMException('cancel','AbortError')),{once:true}));});
 const controller=new AbortController(),scan=h.api.analyze(grid,{model:'tumulus',threshold:.6,signal:controller.signal});controller.abort();await assert.rejects(scan,{name:'AbortError'});assert.ok(h.calls.some(c=>c.options.method==='DELETE'&&c.url.endsWith('a'.repeat(32))));
});
test('reject malformed model geometry instead of plotting it',async()=>{
 const h=harness('localhost',(u,o,r,g)=>Promise.resolve(o.method==='POST'?r({id:'a'.repeat(32)}):o.method==='DELETE'?r({cancelled:true}):r({state:'complete',result:{...g,results:[{...g.results[0],score:101}]}})));
 await assert.rejects(h.api.analyze(grid,{model:'tumulus',threshold:.6,signal:new AbortController().signal}),/ongeldige herkenningen/);
});
