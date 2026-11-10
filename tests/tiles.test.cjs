const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/tiles.js'),'utf8');
function harness(plan=()=> 'load',fetchPlan=()=>({status:200,ok:true,headers:{get:()=>null},blob:async()=>({})})) {
 let now=0,id=0,starts=[],fetches=[],timers=new Map(),created=0,revoked=0;
 const dataset={},events={},app={};
 const timeout=(fn,ms=0)=>{timers.set(++id,{at:now+ms,fn});return id};
 const ctx={window:{BelgianLidar:app,navigator:{onLine:true},addEventListener(n,fn){events[n]=fn}},
  document:{getElementById:()=>({dataset}),createElement(){let generation=0;return {dataset:{},setAttribute(){},set src(url){this._src=url;const g=++generation;if(url.startsWith('data:'))return;starts.push({url,at:now});const action=plan(url);if(action!=='hang')timeout(()=>{if(g===generation)this[action==='error'?'onerror':'onload']?.()},300)},get src(){return this._src}}}},
  URL:class extends URL{static createObjectURL(){created++;return 'blob:test'}static revokeObjectURL(){revoked++}},
  Date:class extends Date{static now(){return now}},Math:Object.assign(Object.create(Math),{random:()=>0}),AbortController,
  setTimeout:timeout,clearTimeout:n=>timers.delete(n),L:{Util:{emptyImageUrl:'data:transparent'}},
  fetch:async(url,options)=>{fetches.push({url,at:now,signal:options.signal});return fetchPlan(url,options)}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const layer=(host='one.test',options={})=>{const handlers={},l={options:{pane:'backgroundPane',...options},getTileUrl:c=>`https://${host}/${c.x}.png`,on(types,fn){for(const type of types.split(' '))(handlers[type]??=[]).push(fn)}};app.tiles.install(l);l.emit=(n,tile)=>handlers[n]?.forEach(fn=>fn({tile}));return l};
 async function tick(ms){const end=now+ms;let limit=10000;for(;;){for(let i=0;i<10;i++)await Promise.resolve();const due=[...timers].filter(([,x])=>x.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;if(!--limit)throw Error('timer loop');now=due[1].at;timers.delete(due[0]);due[1].fn();}now=end;for(let i=0;i<10;i++)await Promise.resolve();}
 return {ctx,layer,tick,dataset,starts,fetches,events,get created(){return created},get revoked(){return revoked}};
}
test('burst across providers is bounded globally and per provider; queued tiles all finish',async()=>{
 const h=harness(),layers=['a.test','b.test','c.test','api.ellipsis-drive.com'].map(x=>h.layer(x));let completed=0;
 for(let n=0;n<80;n++)layers[n%4].createTile({x:n},e=>{assert.ifError(e);completed++});
 assert.ok(Number(h.dataset.activeTileRequests)<=8);await h.tick(10000);
 assert.equal(completed,80);assert.equal(Number(h.dataset.peakTileRequests),8);
 for(const start of h.starts){const host=new URL(start.url).hostname;const simultaneous=h.starts.filter(s=>new URL(s.url).hostname===host && s.at<=start.at && s.at>start.at-300).length;assert.ok(simultaneous<=(host==='api.ellipsis-drive.com'?2:3));}assert.equal(h.dataset.activeTileRequests,'0');assert.equal(h.dataset.queuedTileRequests,'0');
 const ahn=h.starts.filter(x=>x.url.includes('ellipsis'));for(let i=1;i<ahn.length;i++)assert.ok(ahn[i].at-ahn[i-1].at>=125);
});
test('pan/zoom cancels both active and queued requests, frees capacity, ignores late completion',async()=>{
 const h=harness(()=> 'hang'),l=h.layer();let completed=0;
 const tiles=Array.from({length:10},(_,x)=>l.createTile({x},()=>completed++));
 tiles.forEach(t=>l.emit('tileunload',t));await h.tick(100000);
 assert.equal(completed,0);assert.equal(h.dataset.activeTileRequests,'0');assert.equal(h.dataset.queuedTileRequests,'0');assert.equal(h.starts.length,1);
});
test('transient errors back off and revalidate once; permanent outage stops after three attempts and can be retried manually',async()=>{
 let available=false;const h=harness(url=>available||url.includes('_retry=1')&&!url.includes('/2.png')?'load':'error'),l=h.layer();const results=[];
 l.createTile({x:1},e=>results.push(e));const bad=l.createTile({x:2},e=>results.push(e));
 await h.tick(20000);assert.equal(results.length,2);assert.equal(results[0],null);assert.ok(results[1]);
 const attempts=h.starts.filter(x=>x.url.includes('/2.png'));assert.equal(attempts.length,3);assert.ok(attempts[1].at-attempts[0].at>=1200);assert.ok(attempts[2].at-attempts[1].at>=3500);
 available=true;bad.restartRequest();await h.tick(10000);assert.equal(results.length,3);assert.equal(results[2],null);
});
test('timeouts do not permanently occupy slots',async()=>{
 const h=harness(()=> 'hang'),l=h.layer();let failures=0;l.createTile({x:1},e=>{assert.ok(e);failures++});
 await h.tick(120000);assert.equal(failures,1);assert.equal(h.starts.length,3);assert.equal(h.dataset.activeTileRequests,'0');
});
test('IGN missing coverage is transparent, cached briefly, and not retried',async()=>{
 const h=harness(undefined,()=>({status:404,ok:false})),l=h.layer('data.geopf.fr',{allowMissing:true});let completed=0;
 // The test image models the browser load event for a transparent data URL.
 const make=()=>{const tile=l.createTile({x:1},e=>{assert.ifError(e);completed++});return tile};
 const first=make();await h.tick(10);first.onload();const second=make();await h.tick(100);second.onload();
 assert.equal(completed,2);assert.equal(h.fetches.length,1);assert.equal(h.dataset.activeTileRequests,'0');
});
test('fetch abort releases capacity and late responses do not revive removed tiles',async()=>{
 let resolve;const h=harness(undefined,()=>new Promise(r=>resolve=r)),l=h.layer('data.geopf.fr',{allowMissing:true});let completed=0;
 const tile=l.createTile({x:1},()=>completed++);l.emit('tileabort',tile);assert.equal(h.fetches[0].signal.aborted,true);
 resolve({status:200,ok:true,blob:async()=>({})});await h.tick(1000);assert.equal(completed,0);assert.equal(h.created,0);assert.equal(h.dataset.activeTileRequests,'0');
});
test('HTTP Retry-After postpones new requests to that provider',async()=>{
 let n=0;const h=harness(undefined,()=>++n===1?{status:429,ok:false,headers:{get:()=> '9'}}:{status:200,ok:true,blob:async()=>({})}),l=h.layer('data.geopf.fr',{allowMissing:true});
 l.createTile({x:1},()=>{});await h.tick(8999);assert.equal(h.fetches.length,1);await h.tick(2000);assert.equal(h.fetches.length,2);assert.ok(h.fetches[1].at>=9000);
});
test('offline queue waits for connectivity without attempting requests',async()=>{
 const h=harness(),l=h.layer();h.ctx.window.navigator.onLine=false;let completed=0;l.createTile({x:1},()=>completed++);await h.tick(100000);assert.equal(h.starts.length,0);
 h.ctx.window.navigator.onLine=true;h.events.online();await h.tick(1000);assert.equal(completed,1);
});
