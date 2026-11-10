/* Optional actual-DOM + Leaflet + HTTP + real-model integration.
 * LIDAR_JSDOM_PATH=/path/to/jsdom LIDAR_TEST_PYTHON=/path/to/venv/python node tests/scan-dom.integration.cjs
 * This checks behaviour, not browser rendering/layout or Canvas WebP decoding.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {JSDOM,VirtualConsole}=require(process.env.LIDAR_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),python=process.env.LIDAR_TEST_PYTHON||'python';
const child=spawn(python,['companion/server.py','--port','0'],{cwd:root,stdio:['ignore','pipe','pipe']});
let dom;
(async()=>{
 const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Server startup timeout')),15000);child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});child.on('error',reject);child.on('exit',code=>reject(Error('Server exited '+code)));});
 const errors=[],calls=[],downloads=[];const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
 dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:base,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console});
 const w=dom.window;
 w.AbortController=AbortController;w.DOMException=DOMException;w.ArrayBuffer=ArrayBuffer;w.DataView=DataView;
 Object.defineProperties(w.HTMLElement.prototype,{clientWidth:{get(){return this.id==='map'?1200:360;}},clientHeight:{get(){return this.id==='map'?900:800;}}});
 w.HTMLElement.prototype.getBoundingClientRect=function(){return {x:0,y:0,left:0,top:0,right:1200,bottom:900,width:this.clientWidth,height:this.clientHeight};};
 if(w.SVGSVGElement)w.SVGSVGElement.prototype.createSVGRect=()=>({});
 w.fetch=(url,options={})=>{calls.push({url,method:options.method||'GET'});return fetch(new URL(url,base),options);};
 w.URL.createObjectURL=blob=>(downloads.push(blob),'blob:test');w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(root,script.getAttribute('src').split('?')[0]),'utf8'));
 const $=id=>w.document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
 assert.equal(calls.length,0,'no initial AI request');$('startMap').click();await wait(50);assert.equal(calls.length,0,'no AI request when map opens');
 $('scanEngine').value='adaf-barrow';$('scanCompare').checked=true;$('scanThreshold').value='0.35';
 w.BelgianLidar.map.setView([50.21908,5.61689],19);
 w.TerrainScanData.load=async p=>{
  const values=new Float32Array(p.width*p.height),cx=p.width/2,cy=p.height/2;
  for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)values[y*p.width+x]=100+.01*x+.02*y+2*Math.exp(-((x-cx)**2+(y-cy)**2)/(2*7**2));
  return {...p,values};
 };
 await $('scanModelCheck').onclick();assert.match($('scanModelStatus').textContent,/verbonden/);
 await $('scanStart').onclick();assert.match($('scanStatus').textContent,/Scan voltooid/);assert.match($('scanCount').textContent,/[1-9]/);assert.ok(calls.some(c=>c.method==='POST'));
 const rows=[...$('scanResults').children];assert.ok(rows.some(r=>r.textContent.includes('adaf-barrow')));assert.ok(rows.some(r=>r.textContent.includes('vorm')));
 rows.find(r=>r.textContent.includes('adaf-barrow')).click();await wait(20);
 const popup=w.document.querySelector('.scan-popup');assert.ok(popup);assert.match(popup.textContent,/Modelscore/);popup.querySelector('button').click();assert.ok(w.localStorage.getItem('belgian-lidar-scan-reviews-v1').includes('yes'));
 w.matchMedia=()=>({matches:true});$('scanAnnotate').click();assert.ok($('panel').classList.contains('closed'));const c=w.BelgianLidar.map.getCenter();w.BelgianLidar.map.fire('click',{latlng:w.L.latLng(c.lat-.00003,c.lng-.00003)});w.BelgianLidar.map.fire('click',{latlng:w.L.latLng(c.lat+.00003,c.lng+.00003)});assert.ok(!$('panel').classList.contains('closed'));
 $('scanExportPackage').click();assert.equal(downloads.length,1);assert.match($('scanStatus').textContent,/Export gemaakt/);
 // Read this real browser-generated Blob in jsdom, then check the package's binary DEM.
 const text=await new Promise((resolve,reject)=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(downloads[0]);});
 const pkg=JSON.parse(text);assert.equal(pkg.schema,'belgian-lidar-test-package');assert.equal(pkg.dem.halo,104);assert.ok(pkg.geojson.features.some(f=>f.properties.annotation==='missed-feature'));assert.ok(pkg.geojson.features.some(f=>f.properties.engine==='adaf-barrow'&&f.properties.review?.verdict==='yes'));
 if(process.env.LIDAR_TEST_EXPORT)fs.writeFileSync(process.env.LIDAR_TEST_EXPORT,text);
 assert.deepEqual(errors,[]);process.stdout.write('PASS actual DOM + Leaflet + local HTTP + real ADAF + rule comparison + popup review + binary test export\n');
})().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1;}).finally(()=>{dom?.window.close();child.kill('SIGTERM');});
