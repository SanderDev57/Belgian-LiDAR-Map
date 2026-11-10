/* Optional same-origin companion API. No requests at page startup. */
(() => {
'use strict';
const check=window.TerrainScan.check;
function localOnly(){if(!['localhost','127.0.0.1'].includes(location.hostname))throw new Error('AI-modellen draaien lokaal: start python companion/server.py en open http://127.0.0.1:8765.');}
async function json(url,options={}){
 const controller=new AbortController(),abort=()=>controller.abort();
 if(options.signal?.aborted)throw new DOMException('Geannuleerd','AbortError');
 options.signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(abort,20000);
 try{
  const response=await fetch(url,{...options,signal:controller.signal,credentials:'omit',cache:'no-store'});
  let data;try{data=await response.json();}catch{throw new Error('Lokale AI-service niet gevonden. Start python companion/server.py en open de kaart via die server.');}
  if(!response.ok)throw new Error(data.error||`AI-service: HTTP ${response.status}`);
  return data;
 }finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}
}

async function probe(signal){
 localOnly();const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(()=>controller.abort(),5000);
 try{const data=await json('/api/models',{signal:controller.signal});if(data.service!=='belgian-lidar-models'||data.version!==1)throw new Error('Onbekende AI-service.');return data;}
 catch(error){if(signal?.aborted)check(signal);throw new Error(error.name==='AbortError'?'Lokale AI-service reageert niet.':error.message);}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
async function available(key,signal){const data=await probe(signal);const model=data.models.find(m=>m.id===key);if(!model?.installed)throw new Error(`Model ontbreekt. Installeer met: python companion/setup_models.py ${key}`);return model;}
async function analyze(grid,{signal,model,threshold,progress=()=>{}}){
 check(signal);localOnly();let id=crypto.randomUUID().replaceAll('-','');
 const cancel=()=>{if(id)json('/api/scans/'+id,{method:'DELETE',keepalive:true}).catch(()=>{});};
 signal.addEventListener('abort',cancel,{once:true});
 try{
  const metadata={requestId:id,model,threshold,width:grid.width,height:grid.height,cellSize:grid.cellSize,halo:grid.halo,widthM:grid.widthM,heightM:grid.heightM};
  // Explicit little-endian payload; no JSON expansion of hundreds of thousands of numbers.
  const body=new ArrayBuffer(grid.values.length*4),view=new DataView(body);for(let i=0;i<grid.values.length;i++)view.setFloat32(i*4,grid.values[i],true);
  const created=await json('/api/scans',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Scan-Metadata':JSON.stringify(metadata)},body,signal});
  id=created.id;
  if(!/^[0-9a-f]{32}$/.test(id))throw new Error('Ongeldig scan-ID van de AI-service.');
  check(signal);
  const deadline=Date.now()+300000;
  while(true){
   if(Date.now()>deadline)throw new Error('AI-scan duurde langer dan vijf minuten en is gestopt. Kies een kleiner gebied.');
   const job=await json('/api/scans/'+id,{signal});check(signal);progress(job.progress||0,job.message||'AI-analyse');
   if(job.state==='complete'){
    const data=job.result;
    if(!data||!Array.isArray(data.results)||data.results.length>150)throw new Error('Ongeldig AI-resultaat.');
    for(const r of data.results){
     if(!window.TerrainScan.types[r.type]||r.scoreKind!=='model'||r.engine!==model||![r.score,r.cx,r.cy,r.minX,r.minY,r.maxX,r.maxY].every(Number.isFinite)||r.score<0||r.score>100||r.minX<0||r.minY<0||r.maxX>grid.width||r.maxY>grid.height||r.minX>=r.maxX||r.minY>=r.maxY)throw new Error('AI-service gaf ongeldige herkenningen terug.');
    }
    id=null;return data;
   }
   if(job.state==='failed')throw new Error(job.message||'Modelanalyse mislukt');
   if(job.state==='cancelled')throw new DOMException('Geannuleerd','AbortError');
   await new Promise((resolve,reject)=>{const done=()=>{signal.removeEventListener('abort',abort);resolve();},timer=setTimeout(done,400),abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(new DOMException('Geannuleerd','AbortError'));};signal.addEventListener('abort',abort,{once:true});});
  }
 }finally{cancel();signal.removeEventListener('abort',cancel);}
}
window.TerrainScanModels={probe,available,analyze};
})();
