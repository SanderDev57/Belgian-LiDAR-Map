const assert=require('node:assert/strict');
const {analyze,classify}=require('../js/scan-core.js');
function grid(shape){const width=128,height=128,values=new Float32Array(width*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++)values[y*width+x]=100+.08*x+.04*y+shape(x-64,y-64);return {width,height,values,cellSize:1};}
(async()=>{
 const flat=await analyze(grid(()=>0));assert.equal(flat.results.length,0,'Sloping plane creates no detections');
 for(const [name,fn] of [
 ['crater',(x,y)=>-2*Math.exp(-(x*x+y*y)/18)],
 ['mound',(x,y)=>2*Math.exp(-(x*x+y*y)/18)],
 ['trench',(x,y)=>Math.abs(x)<2&&Math.abs(y)<24?-1.5:0],
 ['road',(x,y)=>Math.abs(x)<4&&Math.abs(y)<30?1.5:0],
 ['enclosure',(x,y)=>Math.abs(Math.hypot(x,y)-15)<2?2:0],
 ['building',(x,y)=>(Math.abs(x)<18&&Math.abs(y)<12&&(Math.abs(x)>15||Math.abs(y)>9))?2:0]
 ]){const out=await analyze(grid(fn));console.log(name,out.results.map(r=>[r.type,r.score,r.area]));assert.ok(out.results.some(r=>r.type===name),'Find synthetic '+name);assert.ok(out.results.every(r=>r.score<=80));}
 const abort=new AbortController();await assert.rejects(analyze(grid(()=>0),{signal:abort.signal,progress(){abort.abort();}}),{name:'AbortError'});
 const missing=grid(()=>0);missing.values.fill(NaN);await assert.rejects(analyze(missing),/Onvoldoende/);
 console.log('PASS terrain scan: six forms, sloped plane, score bounds, nodata, cooperative cancellation');
})().catch(e=>{console.error(e);process.exitCode=1;});
