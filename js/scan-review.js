/* Local review journal + reproducible, user-triggered export. No feedback server. */
(() => {
'use strict';
const KEY='belgian-lidar-scan-reviews-v1',MAX=1000;
let journal=new Map(),lastScan=null,annotations=[];
try{
 const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');
 if(Array.isArray(parsed))for(const entry of parsed.slice(-MAX))if(entry&&typeof entry.key==='string'&&['yes','no','unknown','wrong-type'].includes(entry.verdict))journal.set(entry.key,entry);
}catch{}
function persist(){try{localStorage.setItem(KEY,JSON.stringify([...journal.values()].slice(-MAX)));return true;}catch{return false;}}
function rating(key){return journal.get(key)?.verdict;}
function rate(result,verdict,correctedType){
 const entry={key:result.key,verdict,correctedType:correctedType||null,type:result.type,engine:result.engine||'rules',modelRevision:result.modelRevision||null,score:result.score,center:{lat:result.center.lat,lng:result.center.lng},updatedAt:new Date().toISOString()};
 journal.delete(result.key);journal.set(result.key,entry);while(journal.size>MAX)journal.delete(journal.keys().next().value);
 return persist();
}
function setScan(value){lastScan=value;annotations=[];}
function addAnnotation(bounds,type){
 if(!lastScan)throw new Error('Voer eerst een scan uit om gemiste structuren in hetzelfde testpakket te bewaren.');
 const area=lastScan.bounds;
 if(bounds.getWest()<area.getWest()||bounds.getEast()>area.getEast()||bounds.getSouth()<area.getSouth()||bounds.getNorth()>area.getNorth())throw new Error('Duid de gemiste structuur binnen het laatst gescande gebied aan.');
 annotations.push({type,bounds});
}
function polygon(bounds){return {type:'Polygon',coordinates:[[[bounds.getWest(),bounds.getSouth()],[bounds.getEast(),bounds.getSouth()],[bounds.getEast(),bounds.getNorth()],[bounds.getWest(),bounds.getNorth()],[bounds.getWest(),bounds.getSouth()]]]};}
function collection(){
 if(!lastScan)throw new Error('Voer eerst een scan uit.');
 return {type:'FeatureCollection',terrainSource:'Mapterhorn Terrarium',terrainAttribution:'https://mapterhorn.com/attribution/',pipelineVersion:'scan-model-lab-v1',modelInfo:lastScan.metadata.modelInfo||null,scanEngines:[lastScan.metadata.engine,...(lastScan.metadata.compare?['rules']:[])],features:[...lastScan.results.map(r=>({type:'Feature',geometry:polygon(r.bounds),properties:{id:r.key,type:r.type,engine:r.engine||'rules',score:r.score,scoreKind:r.scoreKind||'shape',modelRevision:r.modelRevision||null,review:journal.get(r.key)||null}})),...annotations.map((a,i)=>({type:'Feature',geometry:polygon(a.bounds),properties:{id:'manual-'+i,type:a.type,engine:'manual',annotation:'missed-feature',verification:'user-suggested-unconfirmed'}}))]};
}
function download(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportData(includeGrid){
 const geojson=collection();
 if(!includeGrid){download(geojson,'lidar-scan-results.geojson');return;}
 const g=lastScan.grid,bytes=new Uint8Array(g.values.length*4),view=new DataView(bytes.buffer);for(let i=0;i<g.values.length;i++)view.setFloat32(i*4,g.values[i],true);
 let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
 const data={schema:'belgian-lidar-test-package',version:1,createdAt:new Date().toISOString(),verification:'Unconfirmed user test data. Not ground truth.',scan:lastScan.metadata,
  dem:{encoding:'float32-little-endian-base64',width:g.width,height:g.height,cellSize:g.cellSize,halo:g.halo,widthM:g.widthM,heightM:g.heightM,origin:g.origin,step:g.step,projection:'Web Mercator pixel coordinates, zoom 17, tileSize 512',source:'Mapterhorn Terrarium',sourceAttribution:'https://mapterhorn.com/attribution/',nativeResolution:'Variable; 1 m sampling does not establish native detail',data:btoa(binary)},geojson};
 download(data,'lidar-scan-test-package.json');
}
function erase(){journal.clear();try{localStorage.removeItem(KEY);}catch{}}
window.TerrainScanReview={rating,rate,setScan,addAnnotation,exportData,erase,clear(){lastScan=null;annotations=[];}};
})();
