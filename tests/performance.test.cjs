const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function harness() {
 const frames=new Map(),elements=new Map(),events={};let id=0,reads=0,geometry=0,statusWrites=0,coordinateWrites=0,center={lat:50.2,lng:5.6};
 function element(name){
  if(!elements.has(name))elements.set(name,{value:'',checked:false,style:{},attrs:{},events:{},
   get textContent(){return this.text||''},set textContent(s){this.text=s;if(name==='status')statusWrites++;if(name==='coords')coordinateWrites++;},
   classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},
   addEventListener(k,fn){this.events[k]=fn},querySelector(){return element('knob')},
   getBoundingClientRect(){reads++;return {left:0,top:0,width:1000,height:800}},setPointerCapture(){},blur(){}});
  return elements.get(name);
 }
 element('compare').checked=true;
 const layers=[{getContainer:()=>element('tilesA')},{getContainer:()=>element('tilesB')}];
 const map={_loaded:true,on(names,fn){for(const name of names.split(' '))(events[name]??=[]).push(fn)},
  fire(name){for(const fn of events[name]||[])fn()},createPane(){},getPane:()=>({style:{}}),
  getSize:()=>({x:1000,y:800}),getContainer:()=>element('map'),
  containerPointToLayerPoint(p){geometry++;return {x:p[0],y:p[1]}},
  getCenter:()=>center,getZoom:()=>17,invalidateSize(){},setView(c){center={lat:c[0],lng:c[1]}}};
 const ctx={document:{getElementById:element},location:{hash:'',pathname:'/',search:''},history:{replaceState(){}},
  requestAnimationFrame:fn=>{frames.set(++id,fn);return id},L:{map:()=>map,control:{zoom:()=>({addTo(){}}),scale:()=>({addTo(){}})}}};
 ctx.window=ctx;ctx.addEventListener=()=>{};vm.createContext(ctx);
 const load=name=>vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+name+'.js'),'utf8'),ctx);
 load('map');const app=ctx.BelgianLidar;Object.assign(app,{getTerrains:()=>layers,setBase(){},chooseTerrain(){},setOpacity(){}});load('comparison');
 const flush=()=>{const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn())};
 flush();return {app,map,element,flush,load,frames,get reads(){return reads},get geometry(){return geometry},get statusWrites(){return statusWrites},get coordinateWrites(){return coordinateWrites}};
}
test('movement events share a comparison frame, with immediate final clipping',()=>{
 const h=harness();let calls=0;const apply=h.app.applySplit;h.app.applySplit=()=>{calls++;apply()};
 for(let i=0;i<100;i++){h.map.fire('move');h.map.fire('zoom')}
 assert.equal(calls,0);h.flush();assert.equal(calls,1);
 const geometry=h.geometry;h.map.fire('moveend');assert.equal(h.geometry,geometry+2);
 assert.equal(h.element('tilesA').style.clip,h.element('tilesB').style.clip);
});
test('status burst writes only the latest text, and avoids identical writes',()=>{
 const h=harness();for(let i=0;i<100;i++)h.app.report('Loaded '+i,true);
 h.flush();assert.equal(h.statusWrites,1);assert.equal(h.element('status').textContent,'Loaded 99');
 h.app.report('Loaded 99',true);h.flush();assert.equal(h.statusWrites,1);
});
test('horizontal/vertical controls, keyboard and disabled clipping keep behavior',()=>{
 const h=harness(),divider=h.element('divider'),horizontal=h.element('compareHorizontal'),vertical=h.element('compare');
 assert.equal(divider.style.left,'50%');assert.match(h.element('tilesA').style.clip,/500px/);
 horizontal.checked=true;horizontal.events.change();h.flush();assert.equal(vertical.checked,false);assert.equal(divider.style.top,'50%');
 divider.events.keydown({key:'ArrowDown',preventDefault(){}});h.flush();assert.equal(divider.style.top,'55%');
 horizontal.checked=false;horizontal.events.change();h.flush();assert.equal(h.element('tilesA').style.clip,'auto');
 const before=h.geometry;h.app.applySplit();assert.equal(h.geometry,before,'Disabled comparison does not project coordinates');
});
test('pointer movement reuses bounds, invalidates on resize and retains end clamps',()=>{
 const h=harness(),divider=h.element('divider');
 divider.events.pointerdown({pointerId:1,preventDefault(){}});const reads=h.reads;
 for(let i=0;i<100;i++)divider.events.pointermove({clientX:i*20,clientY:0});
 h.flush();assert.equal(h.reads,reads);assert.equal(divider.style.left,'97.3%');
 h.map.fire('resize');divider.events.pointermove({clientX:0,clientY:0});h.flush();
 assert.equal(h.reads,reads+1);assert.equal(divider.style.left,'2.7%');
 divider.events.pointercancel();divider.events.pointermove({clientX:500});h.flush();assert.equal(divider.style.left,'2.7%');
});
test('completed zoom saves coordinates once, and unchanged coordinates skip writes',()=>{
 const h=harness();h.load('app');h.element('startMap').onclick();h.flush();const before=h.coordinateWrites;
 h.map.setView([51.2,4.4]);h.map.fire('zoomend');assert.equal(h.coordinateWrites,before);
 h.map.fire('moveend');assert.equal(h.coordinateWrites,before+1);
 h.map.fire('moveend');assert.equal(h.coordinateWrites,before+1);
});
