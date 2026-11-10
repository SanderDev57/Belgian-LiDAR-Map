const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.style={};this.value='';this.checked=false;this.disabled=false;this.hidden=false;this.textContent='';this.classList={add(){},remove(){}};}
 append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}setAttribute(k,v){this.attrs[k]=v;}
 querySelectorAll(q){return this.children.flatMap(e=>{if(typeof e==='string')return [];return e.tag==='input'&&e.checked?[e]:e.querySelectorAll(q);});}
}
function harness(){
 const els=new Map(),$=id=>{if(!els.has(id))els.set(id,new Element());return els.get(id);};$('scanScope').value='visible';
 const events={},layers=new Set(),popups=[],keys={};let loads=0,fail=false,delay=false;
 const map={on(k,f){events[k]=f;},getBounds:()=>box({lat:50.2187,lng:5.6165},{lat:50.2194,lng:5.6172}),getContainer:()=>new Element(),removeLayer:l=>layers.delete(l),panTo(){},attributionControl:{addAttribution(){}}};
 function box(a,b){if(Array.isArray(a)&&a.length===2&&Array.isArray(a[0]))[a,b]=a;if(Array.isArray(a))a={lat:a[0],lng:a[1]};if(Array.isArray(b))b={lat:b[0],lng:b[1]};return {getWest:()=>Math.min(a.lng,b.lng),getEast:()=>Math.max(a.lng,b.lng),getSouth:()=>Math.min(a.lat,b.lat),getNorth:()=>Math.max(a.lat,b.lat)};}
 function layer(){return {addTo(target){if(target===map)layers.add(this);return this;},bindPopup(fn){this.popup=fn;popups.push(this);return this;},openPopup(){this.box=this.popup();},setStyle(){},setBounds(){}};}
 const markGroup={addTo(){return this;},clearLayers(){popups.length=0;}};
 const context={window:{BelgianLidar:{map,$},TerrainScan:{...require('../js/scan-core.js'),analyze:async(grid,{signal})=>{if(delay)await new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('cancel','AbortError')),{once:true}));return {results:[{type:'mound',score:65,cx:40,cy:40,minX:35,minY:35,maxX:45,maxY:45,area:70,relief:1}],candidates:1};}}},L:{layerGroup:()=>markGroup,rectangle:layer,circleMarker:layer,latLngBounds:box},document:{createElement:tag=>new Element(tag),createTextNode:s=>s,addEventListener:(k,f)=>keys[k]=f},AbortController,DOMException};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/scan-data.js'),'utf8'),context);
 context.window.TerrainScanData.load=async(p,{signal})=>{loads++;if(fail)throw Error('offline');return p;};
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/scan.js'),'utf8'),context);
 return {$,events,keys,popups,loads:()=>loads,setFail:v=>fail=v,setDelay:v=>delay=v};
}
test('explicit scans, bounds, markers, filters, feedback, failed reruns, cancellation and selection',async()=>{
 const h=harness(),$=h.$;assert.equal(h.loads(),0,'no unsolicited DEM requests');
 $('scanScope').value='selection';await $('scanStart').onclick();assert.match($('scanStatus').textContent,/Selecteer eerst/);assert.equal(h.loads(),0);
 $('scanSelect').onclick();h.events.click({latlng:{lat:50.2187,lng:5.6165}});h.events.click({latlng:{lat:50.2194,lng:5.6172}});
 await $('scanStart').onclick();assert.match($('scanStatus').textContent,/voltooid: 1/);assert.equal($('scanResults').children.length,1);assert.equal($('scanStart').disabled,false);
 $('scanResults').children[0].onclick();const popup=h.popups[0].box,row=popup.children[4];row.children[0].onclick();assert.equal(row.children[0].attrs['aria-pressed'],'true');assert.match(popup.children[3].textContent,/sessie/);
 const filter=$('scanFilters').children[2].children[0];filter.checked=false;filter.onchange();assert.equal($('scanResults').children.length,0);filter.checked=true;filter.onchange();assert.equal($('scanResults').children.length,1);
 h.setFail(true);await $('scanStart').onclick();assert.match($('scanStatus').textContent,/mislukt/);assert.equal($('scanResults').children.length,1);h.setFail(false);
 h.setDelay(true);const scan=$('scanStart').onclick();await new Promise(resolve=>setImmediate(resolve));assert.equal($('scanStart').disabled,true);$('scanCancel').onclick();await scan;assert.match($('scanStatus').textContent,/geannuleerd/);assert.equal($('scanResults').children.length,1);assert.equal($('scanCancel').hidden,true);
 $('scanClear').onclick();assert.equal($('scanResults').children.length,0);
 $('scanSelect').onclick();h.events.click({latlng:{lat:50.2,lng:5.6}});h.keys.keydown({key:'Escape'});assert.equal($('scanSelect').attrs['aria-pressed'],'false');
});
