/* Numerical terrain morphology. No imagery, historical database or dating model. */
(function(root) {
'use strict';
const types = {
 trench:{label:'Mogelijke loopgraaf',color:'#ef8f61',detail:'Smalle, langgerekte verlaging. Ook afwatering of een natuurlijke geul kan deze vorm geven.'},
 crater:{label:'Mogelijke krater',color:'#ef7292',detail:'Compacte, afgeronde verlaging. Ook een groeve, boomval of natuurlijke kuil is mogelijk.'},
 mound:{label:'Mogelijke grafheuvel',color:'#d5b352',detail:'Compacte, afgeronde verhoging. Een natuurlijke heuvel of recente grondhoop kan dezelfde vorm hebben.'},
 enclosure:{label:'Mogelijke omwalling',color:'#b99bf7',detail:'Een verhoging omsluit een lager binnengebied. Ook perceelsranden kunnen dit patroon geven.'},
 building:{label:'Mogelijk verdwenen gebouw',color:'#6dd6e8',detail:'Rechthoekige terreinranden of een rechthoekig platform. Een recente constructie of perceel is ook mogelijk.'},
 road:{label:'Mogelijke oude weg',color:'#83d79d',detail:'Langgerekte, relatief brede terreinbaan. De vorm toont geen ouderdom; ook recente wegen en natuurlijke ruggen zijn mogelijk.'}
};
const pause = () => new Promise(resolve=>setTimeout(resolve,0));
function check(signal) {if(signal?.aborted) throw new DOMException('Geannuleerd','AbortError');}
function classify(m) {
 if(m.elongation>=3) return m.sign<0 && m.width<5 ? 'trench':'road';
 if(m.sign>0 && m.hole && m.rectangular) return 'building';
 if(m.sign>0 && m.hole) return 'enclosure';
 if(m.sign>0 && m.rectangular && m.fill>.72) return 'building';
 return m.sign<0?'crater':'mound';
}
async function analyze(grid,{signal,progress=()=>{}}={}) {
 const {width:w,height:h,values:z,cellSize:s}=grid;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<32||h<32||w*h>700000||z.length!==w*h||!(s>=.5&&s<=2)) throw new Error('Ongeldig of te groot hoogteraster.');
 const stride=w+1,total=(w+1)*(h+1),sum=new Float64Array(total),count=new Uint32Array(total);
 let valid=0;
 for(let y=0;y<h;y++) {
  let row=0,n=0;
  for(let x=0;x<w;x++) {const v=z[y*w+x];if(Number.isFinite(v)){row+=v;n++;valid++;} const k=(y+1)*stride+x+1;sum[k]=sum[k-stride]+row;count[k]=count[k-stride]+n;}
  if(y%32===0){check(signal);progress(45+10*y/h);await pause();}
 }
 if(valid<w*h*.98) throw new Error('Onvoldoende volledige hoogtegegevens (meer dan 2% ontbreekt). Geen scan uitgevoerd.');
 function mean(x,y,r) {
  const x0=Math.max(0,x-r),x1=Math.min(w,x+r+1),y0=Math.max(0,y-r),y1=Math.min(h,y+r+1);
  const a=y0*stride+x0,b=y0*stride+x1,c=y1*stride+x0,d=y1*stride+x1;
  const n=count[d]-count[b]-count[c]+count[a];
  return n ? (sum[d]-sum[b]-sum[c]+sum[a])/n:NaN;
 }
 const r=Math.ceil(12/s),residual=new Float32Array(w*h),noise=[];
 // Symmetric local means remove a planar hillside; smoothing reduces quantization noise.
 for(let y=r;y<h-r;y++) {
  for(let x=r;x<w-r;x++) {const k=y*w+x;residual[k]=Number.isFinite(z[k])?mean(x,y,1)-mean(x,y,r):NaN;if(k%23===0 && Number.isFinite(residual[k]))noise.push(Math.abs(residual[k]));}
  if(y%32===0){check(signal);progress(55+15*y/h);await pause();}
 }
 noise.sort((a,b)=>a-b);
 const threshold=Math.max(.22,(noise[Math.floor(noise.length*.5)]||0)*2.5);
 const visited=new Uint8Array(w*h),queue=new Int32Array(w*h),results=[];

 for(let y=r;y<h-r;y++) {
  for(let x=r;x<w-r;x++) {
   const start=y*w+x,v=residual[start];
   if(visited[start] || !Number.isFinite(v) || Math.abs(v)<threshold)continue;
   const sign=Math.sign(v);let head=0,tail=1;queue[0]=start;visited[start]=1;
   let sx=0,sy=0,sxx=0,syy=0,sxy=0,amplitude=0,minX=w,minY=h,maxX=0,maxY=0,edge=false;
   while(head<tail) {
    const k=queue[head++],px=k%w,py=Math.floor(k/w);
    sx+=px;sy+=py;sxx+=px*px;syy+=py*py;sxy+=px*py;amplitude+=Math.abs(residual[k]);
    minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);
    if(px<=r || py<=r || px>=w-r-1 || py>=h-r-1)edge=true;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
     const nx=px+dx,ny=py+dy,nk=ny*w+nx;
     if(nx<r||ny<r||nx>=w-r||ny>=h-r||visited[nk])continue;
     if(Number.isFinite(residual[nk]) && sign*residual[nk]>=threshold){visited[nk]=1;queue[tail++]=nk;}
    }
    if(head%4096===0){check(signal);await pause();}
   }
   const area=tail*s*s;
   if(edge||area<6||area>6000)continue;
   if(grid.halo!=null && (minX<grid.halo || minY<grid.halo || maxX>=grid.halo+grid.widthM || maxY>=grid.halo+grid.heightM))continue;
   const cx=sx/tail,cy=sy/tail,a=sxx/tail-cx*cx,b=syy/tail-cy*cy,c=sxy/tail-cx*cy;
   const disc=Math.hypot(a-b,2*c),major=Math.max(.1,(a+b+disc)/2),minor=Math.max(.1,(a+b-disc)/2);
   const elongation=Math.sqrt(major/minor),width=Math.sqrt(12*minor)*s,span=Math.sqrt(12*major)*s;
   if(span>220 || width>65)continue;
   // Oriented bounding box, rather than screen axes, makes rectangle evidence rotation invariant.
   const angle=.5*Math.atan2(2*c,a-b),co=Math.cos(angle),si=Math.sin(angle);
   let u0=Infinity,u1=-Infinity,t0=Infinity,t1=-Infinity;
   for(let j=0;j<tail;j++){const k=queue[j],dx=k%w-cx,dy=Math.floor(k/w)-cy,u=co*dx+si*dy,t=-si*dx+co*dy;u0=Math.min(u0,u);u1=Math.max(u1,u);t0=Math.min(t0,t);t1=Math.max(t1,t);}
   let boundary=0;const band=Math.max(1.5,Math.min(u1-u0,t1-t0)*.16);
   for(let j=0;j<tail;j++){const k=queue[j],dx=k%w-cx,dy=Math.floor(k/w)-cy,u=co*dx+si*dy,t=-si*dx+co*dy;if(Math.min(u-u0,u1-u,t-t0,t1-t)<band)boundary++;}
   const fill=tail/((u1-u0+1)*(t1-t0+1)),hole=fill<.6 && elongation<2.5;
   const rectangular=hole?boundary/tail>.86:fill>.86;
   const type=classify({sign,elongation,width,fill,hole,rectangular});
   // This score ranks geometric evidence only; it is deliberately never a probability of a find.
   const contrast=amplitude/tail;
   const score=Math.round(Math.min(80,35+Math.min(20,contrast/threshold*7)+Math.min(15,Math.log2(tail)*1.5)+(hole||rectangular||elongation>=3?10:0)));
   results.push({type,score,cx,cy,minX,minY,maxX,maxY,area:Math.round(area),relief:+contrast.toFixed(2)});

  }
  if(y%8===0){check(signal);progress(70+28*y/h);await pause();}
 }
 check(signal);
 results.sort((a,b)=>b.score-a.score || b.area-a.area);
 // A ring/rectangle can produce an opposite-sign residual inside its own footprint.
 // Retain the strongest shape instead of labelling its interior as a second find.
 const distinct=[];
 for(const result of results){
  const contained=distinct.some(other=>{
   const overlap=Math.max(0,Math.min(result.maxX,other.maxX)-Math.max(result.minX,other.minX)+1)*Math.max(0,Math.min(result.maxY,other.maxY)-Math.max(result.minY,other.minY)+1);
   const box=r=>(r.maxX-r.minX+1)*(r.maxY-r.minY+1);
   return overlap/Math.min(box(result),box(other))>.6;
  });if(!contained)distinct.push(result);
  if(distinct.length>150)break;
 }
 return {results:distinct.slice(0,150),candidates:distinct.length,threshold,validFraction:valid/(w*h)};
}
const api={types,classify,analyze,check};
if(typeof module==='object' && module.exports) module.exports=api;else root.TerrainScan=api;
})(typeof window==='object'?window:globalThis);
