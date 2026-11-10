/* On-demand numeric Terrarium DEM tiles. Never use displayed hillshade pixels as heights. */
(() => {
'use strict';
const core=window.TerrainScan,cache=new Map(),Z=17,SIZE=512,WORLD=SIZE*2**Z;
const project=(lat,lon)=>({x:(lon+180)/360*WORLD,y:(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*WORLD});
const unproject=(x,y)=>({lat:Math.atan(Math.sinh(Math.PI*(1-2*y/WORLD)))*180/Math.PI,lng:x/WORLD*360-180});
function plan(bounds,{halo=16}={}) {
 const south=bounds.getSouth(),north=bounds.getNorth(),west=bounds.getWest(),east=bounds.getEast();
 if(![south,north,west,east].every(Number.isFinite)||south>=north||west>=east||south<41||north>56||west< -5.5||east>16)throw new Error('Kies een gebied in België, Nederland, Frankrijk, Duitsland of Luxemburg.');
 const lat=(south+north)/2,scale=40075016.68557849*Math.cos(lat*Math.PI/180)/WORLD;
 const nw=project(north,west),se=project(south,east),widthM=(se.x-nw.x)*scale,heightM=(se.y-nw.y)*scale;
 if(widthM>600 || heightM>600)throw new Error('Het gebied is te groot. Zoom in of selecteer een zone van maximaal 600 × 600 meter.');
 if(widthM<30 || heightM<30)throw new Error('Kies een zone van minstens 30 × 30 meter.');
 if(![16,104].includes(halo))throw new Error('Ongeldige analysemarge.');
 const cellSize=1,step=cellSize/scale;
 const width=Math.ceil(widthM)+2*halo,height=Math.ceil(heightM)+2*halo;
 const origin={x:nw.x-halo*step,y:nw.y-halo*step};
 const x0=Math.floor(origin.x/SIZE),y0=Math.floor(origin.y/SIZE),x1=Math.floor((origin.x+width*step)/SIZE),y1=Math.floor((origin.y+height*step)/SIZE);
 const tiles=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)tiles.push({x,y,key:`${Z}/${x}/${y}`});
 if(tiles.length>36)throw new Error('Te veel hoogtetegels. Selecteer een kleiner gebied.');
 return {width,height,cellSize,step,origin,tiles,halo,widthM,heightM,toLatLng:(x,y)=>unproject(origin.x+(x+.5)*step,origin.y+(y+.5)*step)};
}
async function tile(t,signal) {
 core.check(signal);
 if(cache.has(t.key)){const data=cache.get(t.key);cache.delete(t.key);cache.set(t.key,data);return data;}
 const controller=new AbortController(),abort=()=>controller.abort();signal.addEventListener('abort',abort,{once:true});
 const timeout=setTimeout(abort,20000);
 try {
  const response=await fetch('https://tiles.mapterhorn.com/'+t.key+'.webp',{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw new Error(`Hoogtetegel niet beschikbaar (HTTP ${response.status}). Probeer later opnieuw.`);
  const blob=await response.blob();core.check(signal);
  // Image + canvas also works in Safari; no WebGL/OffscreenCanvas requirement.
  const url=URL.createObjectURL(blob),img=new Image();
  try {
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Hoogtetegel kon niet worden gelezen.'));img.src=url;});core.check(signal);
   if(img.naturalWidth!==SIZE||img.naturalHeight!==SIZE)throw new Error('Onverwacht formaat hoogtetegel.');
   const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;
   const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(img,0,0);
   const rgba=context.getImageData(0,0,SIZE,SIZE).data,values=new Float32Array(SIZE*SIZE);
   for(let k=0;k<values.length;k++){const i=k*4,v=rgba[i]*256+rgba[i+1]+rgba[i+2]/256-32768;values[k]=rgba[i+3]===255 && v>-500 && v<9000 ? v:NaN;}
   core.check(signal);cache.set(t.key,values);while(cache.size>8)cache.delete(cache.keys().next().value);
   return values;
  }finally{URL.revokeObjectURL(url);}
 }catch(error){core.check(signal);if(controller.signal.aborted)throw new Error('Timeout bij hoogtegegevens. Probeer opnieuw.');throw error;}
 finally{clearTimeout(timeout);signal.removeEventListener('abort',abort);}
}
async function load(p,{signal,progress}) {
 const values=new Float32Array(p.width*p.height);values.fill(NaN);
 let next=0,done=0;
 // Two concurrent requests; each decoded tile is sampled then released from this scan.
 async function run(){while(next<p.tiles.length){core.check(signal);const t=p.tiles[next++],data=await tile(t,signal);core.check(signal);
  const x0=Math.max(0,Math.ceil((t.x*SIZE-p.origin.x)/p.step-.5)),x1=Math.min(p.width,Math.ceil(((t.x+1)*SIZE-p.origin.x)/p.step-.5));
  const y0=Math.max(0,Math.ceil((t.y*SIZE-p.origin.y)/p.step-.5)),y1=Math.min(p.height,Math.ceil(((t.y+1)*SIZE-p.origin.y)/p.step-.5));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const px=Math.floor(p.origin.x+(x+.5)*p.step)-t.x*SIZE,py=Math.floor(p.origin.y+(y+.5)*p.step)-t.y*SIZE;values[y*p.width+x]=data[py*SIZE+px];}
  progress(5+40*(++done)/p.tiles.length);
 }}
 await Promise.all([run(),run()]);core.check(signal);return {...p,values};
}
window.TerrainScanData={plan,load,project,unproject};
})();
