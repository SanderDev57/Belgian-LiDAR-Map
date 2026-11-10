// Visible tile requests only. Shared capacity, provider pacing, cancellation and
// bounded recovery; the browser retains control of its ordinary HTTP cache.
(() => {
'use strict';
const app=window.BelgianLidar;
const queue=[],providers=new Map(),missing=new Map();
let active=0,wake,peak=0;
const MAX_ACTIVE=8,MAX_RETRIES=2,TIMEOUT=20000;
function provider(url) {
 const host=new URL(url).hostname;
 if(!providers.has(host)) providers.set(host,{active:0,next:0,
  limit:host==='api.ellipsis-drive.com'?2:host.includes('wallonie')||host==='wms.geoportail.lu'?2:3,
  spacing:host==='api.ellipsis-drive.com'?125:50});
 return providers.get(host);
}
function metrics() {
 const el=document.getElementById('map');if(!el)return;
 el.dataset.activeTileRequests=String(active);el.dataset.queuedTileRequests=String(queue.length);
 el.dataset.peakTileRequests=String(peak);
}
function pump() {
 clearTimeout(wake);if(window.navigator?.onLine===false){metrics();return;}let next=Infinity;
 for(let i=0;i<queue.length && active<MAX_ACTIVE;) {
  const task=queue[i],now=Date.now(),p=task.provider;
  if(task.cancelled){queue.splice(i,1);continue;}
  if(p.active>=p.limit){i++;continue;}
  const ready=Math.max(p.next,task.ready);
  if(ready>now){next=Math.min(next,ready-now);i++;continue;}
  queue.splice(i,1);task.active=true;active++;peak=Math.max(peak,active);p.active++;p.next=now+p.spacing;
  task.start();
 }
 metrics();if(queue.length && next!==Infinity && active<MAX_ACTIVE)wake=setTimeout(pump,Math.max(1,next));
}
function release(task) {
 if(task.released)return;task.released=true;
 if(task.active){active--;task.provider.active--;}
 const i=queue.indexOf(task);if(i>=0)queue.splice(i,1);
 pump();
}
function retryUrl(url,attempt) {
 if(!attempt)return url;
 const parsed=new URL(url);parsed.searchParams.set('_retry',String(attempt));return parsed.href;
}
function install(layer) {
 layer.createTile=function(coords,done) {
  const tile=document.createElement('img');tile.alt='';tile.setAttribute('role','presentation');
  let cancelled=false,task,controller,timer,blobUrl,attempt=0,run=0;
  const original=this.getTileUrl(coords),p=provider(original);
  function clear() {
   clearTimeout(timer);tile.onload=null;tile.onerror=null;
   if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null;}
  }
  function stop() {
   run++;clear();if(controller){controller.abort();controller=null;}
   tile.src=L.Util.emptyImageUrl;if(task)release(task);
  }
  function request() {
   if(cancelled)return;
   const id=++run;
   task={priority:layer.options.pane==='backgroundPane'?0:1,provider:p,ready:Date.now()+(attempt?[1200,3500][attempt-1]+Math.random()*250:0),active:false,released:false,cancelled:false,start(){
    let settled=false;
    const finish=(error,permanent=false)=>{
     if(settled || cancelled || id!==run)return;settled=true;clear();
     if(controller){controller.abort();controller=null;}
     p.failures=error?(p.failures||0)+1:0;
     if(p.failures>=3)p.next=Math.max(p.next,Date.now()+5000);
     release(task);
     if(error && !permanent && attempt<MAX_RETRIES){attempt++;tile.src=L.Util.emptyImageUrl;request();}
     else {tile.tileRequestFailed=!!error;done(error,tile);}
    };
    tile.onload=()=>finish(null);tile.onerror=()=>finish(new Error('Tile image unavailable'));
    timer=setTimeout(()=>finish(new Error('Map service timed out')),TIMEOUT);
    const url=retryUrl(original,attempt);
    if(layer.options.allowMissing) {
     const until=missing.get(original);
     if(until>Date.now()){tile.src=L.Util.emptyImageUrl;return;}
     if(until)missing.delete(original);
     controller=new AbortController();
     fetch(url,{signal:controller.signal,credentials:'omit'}).then(async response=>{
      if(cancelled || id!==run)return;
      if(response.status===404 || response.status===204) {
       if(missing.size>=512)missing.delete(missing.keys().next().value);
       missing.set(original,Date.now()+300000);tile.src=L.Util.emptyImageUrl;return;
      }
      if(!response.ok) {
       if(response.status===429) {
        const header=response.headers.get('Retry-After');
        const delay=/^\d+$/.test(header||'')?Number(header)*1000:Date.parse(header)-Date.now();
        if(Number.isFinite(delay))p.next=Math.max(p.next,Date.now()+Math.min(2147483000,Math.max(0,delay)));
       }
       finish(new Error('Map service HTTP '+response.status),[400,401,403].includes(response.status));return;
      }
      const blob=await response.blob();if(cancelled || id!==run)return;
      blobUrl=URL.createObjectURL(blob);tile.src=blobUrl;
     }).catch(error=>{if(!cancelled && id===run)finish(error);});
    } else tile.src=url;
   }};
   queue.push(task);
   // Backgrounds are useful immediately. Preserve Leaflet's centre-first order
   // within each priority; terrain requests cannot consume every slot first.
   queue.sort((a,b)=>(a.priority||0)-(b.priority||0));pump();
  }
  tile.cancelRequest=()=>{if(cancelled)return;cancelled=true;if(task)task.cancelled=true;stop();};
  tile.restartRequest=()=>{if(cancelled || !tile.tileRequestFailed)return;stop();attempt=0;tile.tileRequestFailed=false;request();};
  request();return tile;
 };
 layer.on('tileunload tileabort',e=>{if(e.tile.cancelRequest)e.tile.cancelRequest();});
}
window.addEventListener('online',pump);
app.tiles={install};
})();
