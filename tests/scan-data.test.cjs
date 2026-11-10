const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const bounds=(lat=50.21908,lng=5.61689,d=.0005)=>({getWest:()=>lng-d,getEast:()=>lng+d,getSouth:()=>lat-d,getNorth:()=>lat+d});
function harness(){
 let active=0,peak=0,calls=0;const urls=new Map();
 class Image{set src(url){const t=urls.get(url);this.t=t;this.naturalWidth=this.naturalHeight=512;queueMicrotask(()=>this.onload());}}
 const context={window:{TerrainScan:require('../js/scan-core.js')},DOMException,AbortController,setTimeout,clearTimeout,Image,URL:{createObjectURL(blob){const key=String(urls.size);urls.set(key,blob);return key;},revokeObjectURL(){}},
 document:{createElement(){let image;return {getContext(){return {drawImage(i){image=i;},getImageData(){const a=new Uint8ClampedArray(512*512*4);for(let y=0;y<512;y++)for(let x=0;x<512;x++){const height=100+((image.t.x*512+x)%1000)/100+((image.t.y*512+y)%1000)/200,enc=Math.round((height+32768)*256),k=(y*512+x)*4;a[k]=enc>>16;a[k+1]=enc>>8&255;a[k+2]=enc&255;a[k+3]=255;}return {data:a};}};}};}},
 fetch:async(url,{signal})=>{calls++;active++;peak=Math.max(peak,active);const [,x,y]=url.match(/\/(\d+)\/(\d+)\.webp$/).map(Number);try{await new Promise((resolve,reject)=>{const t=setTimeout(resolve,5);signal.addEventListener('abort',()=>{clearTimeout(t);reject(new DOMException('aborted','AbortError'));},{once:true});});return {ok:true,blob:async()=>({x,y})};}finally{active--;}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/scan-data.js'),'utf8'),context);
 return {api:context.window.TerrainScanData,stats:()=>({active,peak,calls})};
}
test('bounded DEM fetch, Terrarium decoding, coordinate alignment across seams, cache and abort',async()=>{
 const {api,stats}=harness();assert.equal(stats().calls,0);
 assert.throws(()=>api.plan(bounds(50,5,.1)),/te groot/);assert.throws(()=>api.plan(bounds(50,5,.00001)),/minstens/);assert.throws(()=>api.plan(bounds(80,0)),/Kies een gebied/);
 const p=api.plan(bounds());assert.ok(p.tiles.length<=36);const c=new AbortController();const grid=await api.load(p,{signal:c.signal,progress(){}});
 assert.ok(stats().peak<=2);assert.equal(stats().active,0);assert.equal(grid.values.length,p.width*p.height);
 for(let y=0;y<p.height;y+=13)for(let x=0;x<p.width;x+=11){
  const gx=Math.floor(p.origin.x+(x+.5)*p.step),gy=Math.floor(p.origin.y+(y+.5)*p.step),expected=100+gx%1000/100+gy%1000/200;
  assert.ok(Math.abs(grid.values[y*p.width+x]-expected)<.004,'Correct height on both sides of tile seams');
 }
 const ll=p.toLatLng(30,30),pixel=api.project(ll.lat,ll.lng);assert.ok(Math.abs(pixel.x-p.origin.x-30.5*p.step)<1e-6);assert.ok(Math.abs(pixel.y-p.origin.y-30.5*p.step)<1e-6);
 const before=stats().calls;await api.load(p,{signal:c.signal,progress(){}});assert.equal(stats().calls,before,'memory cache reused');
 const abort=new AbortController();const loading=api.load(api.plan(bounds(50.3,5.8)),{signal:abort.signal,progress(){}});abort.abort();await assert.rejects(loading,{name:'AbortError'});
});
