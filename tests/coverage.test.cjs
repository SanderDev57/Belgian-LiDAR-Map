const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const frames=[];const flushFrames=()=>{const batch=frames.splice(0);batch.forEach(fn=>fn());};
const ctx={window:{BelgianLidar:{}},requestAnimationFrame:fn=>(frames.push(fn),frames.length)};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/coverage.js'),'utf8'),ctx);
const c=ctx.window.BelgianLidar.coverage;
const bounds=(lat,lon,d=.004)=>({getWest:()=>lon-d,getEast:()=>lon+d,getSouth:()=>lat-d,getNorth:()=>lat+d,intersects(b){return !(this.getEast()<b.getWest()||this.getWest()>b.getEast()||this.getNorth()<b.getSouth()||this.getSouth()>b.getNorth())}});
assert.equal(c.contains('NL',5.927,52.101),true);assert.equal(c.contains('FR',4.72,49.77),true);assert.equal(c.contains('FR',4.2345,50.7338),false);assert.equal(c.contains('NL',4.2345,50.7338),false);assert.equal(c.intersects('FR',bounds(50.7338,4.2345)),false);assert.equal(c.intersects('FR',bounds(49.77,4.72)),true);assert.equal(c.intersects('NL',bounds(52.101,5.927)),true);
const all=[],attached=new Set(),handlers={},pane={style:{}};let center=[50.7338,4.2345],zoom=17;
const map={_loaded:false,on(types,fn){for(const type of types.split(' '))(handlers[type]??=[]).push(fn)},getZoom:()=>zoom,getBounds:()=>bounds(...center),hasLayer:l=>attached.has(l),removeLayer:l=>attached.delete(l),getPane:()=>pane,getPixelOrigin:()=>({x:0,y:0}),latLngToLayerPoint:ll=>({x:ll[1]*100,y:ll[0]*100})};
function tile(url,options){const container={style:{}};const l={url,options,on(types,fn){for(const type of types.split(' '))(this.events[type]??=[]).push(fn);return this},events:{},emit(type,e){this.events[type]?.forEach(fn=>fn(e))},createTile(){},_isValidTile:()=>true,_tileCoordsToBounds:()=>bounds(...center),_url:url,isLoading:()=>false,getContainer:()=>container};all.push(l);return l;}tile.wms=tile;
function group(){const items=new Set();return{getLayers:()=>[...items],hasLayer:l=>items.has(l),addLayer:l=>items.add(l),removeLayer:l=>items.delete(l),addTo(){attached.add(this)}};}
const el={background:{value:'osm'},terrain:{value:'off'},opacity:{value:'100'},backgroundHint:{},backgroundStatus:{},retryTiles:{hidden:true}};let status='',reports=0;
ctx.window.addEventListener=()=>{};Object.assign(ctx,{URL,URLSearchParams,Date,Map,Set,AbortController,setTimeout,clearTimeout,L:{tileLayer:tile,TileLayer:{extend:methods=>class{constructor(url,options){const mock=tile(url,options);Object.assign(this,mock,methods);all[all.indexOf(mock)]=this;}}},layerGroup:group,CRS:{EPSG3857:{}},Util:{emptyImageUrl:'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='},latLngBounds:b=>({getSouth:()=>b[0][0],getWest:()=>b[0][1],getNorth:()=>b[1][0],getEast:()=>b[1][1]})}});
Object.assign(ctx.window.BelgianLidar,{map,$:id=>el[id],report:s=>{status=s;reports++;},applySplit(){},tiles:{install:l=>l.installed=true}});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/layers.js'),'utf8'),ctx);const app=ctx.window.BelgianLidar;
assert.equal(attached.size,0);map._loaded=true;app.setBase();assert.equal(app.getTerrains().length,0);
el.terrain.value='auto';app.chooseTerrain();assert.ok(app.getTerrains().some(l=>l.url.includes('DHMV')));assert.ok(!app.getTerrains().some(l=>['NL','FR'].includes(l.options.coverageCountry)),'No Dutch/French requests while wholly in Belgium');
center=[52.101,5.927];handlers.moveend.forEach(fn=>fn());assert.ok(app.getTerrains().every(l=>l.options.coverageCountry==='NL'),'No German services in Dutch interior');const ahn=app.getTerrains().filter(l=>l.options.paced);assert.ok(ahn.length>=2);assert.ok(ahn[0].url.includes('tile/{z}/{x}/{y}?style='));assert.ok(decodeURIComponent(ahn[0].url).includes('"shade"'));assert.ok(app.getTerrains().every(l=>!['NL','FR'].includes(l.options.coverageCountry)||l.options.coverageCountry==='NL'));
el.background.value='aerial';app.setBase();assert.ok(all.find(l=>l.url.includes('Actueel_orthoHR')).getContainer().style.clipPath.startsWith('path('));
center=[49.77,4.72];handlers.moveend.forEach(fn=>fn());const fr=app.getTerrains().filter(l=>l.options.coverageCountry==='FR');assert.equal(fr.length,3);assert.equal(app.getTerrains().length,3,'No Belgian services in French interior');assert.ok(fr.some(l=>l.url.includes('LIDAR-HD_MNT')));assert.equal(fr.filter(l=>l.options.allowMissing).length,1);assert.ok(!app.getTerrains().some(l=>l.options.paced));
app.setOpacity(50);assert.equal(pane.style.opacity,'0.5');assert.ok(app.getTerrains().every(l=>l.options.opacity===undefined));
el.terrain.value='off';app.chooseTerrain();assert.equal(app.getTerrains().length,0);assert.ok(all.every(l=>l.options.attribution));
assert.ok(all.every(l=>l.installed));
console.log('PASS: geographic coverage, no remote calls before Open map, street-only startup, automatic country transitions, AHN shading and version fallback, French HD + fallback, imagery clipping and composite opacity.');

// Overview defers the additional fine sources while retaining terrain beneath.
center=[49.77,4.72];zoom=8;el.terrain.value='auto';app.chooseTerrain();
assert.equal(app.getTerrains().filter(l=>l.options.coverageCountry==='FR').length,1);
center=[52.101,5.927];handlers.moveend.forEach(fn=>fn());assert.equal(app.getTerrains().filter(l=>l.options.paced).length,1);
// Luxembourg uses 2024 ground hillshade, not a coloured elevation or surface model.
center=[49.755,6.1];zoom=17;handlers.moveend.forEach(fn=>fn());
assert.equal(app.getTerrains().length,1);const lu=app.getTerrains()[0];assert.equal(lu.options.layers,'2978');assert.equal(lu.options.clipCountry,'LU');
assert.ok(all.some(l=>l.url.includes('ortho_2025') && l.options.clipCountry==='LU'));
const luPhoto=all.find(l=>l.url.includes('/ortho_2025/'));assert.ok(luPhoto.getTileUrl({z:8,x:132,y:86}).includes('/08/132/86.jpeg'));
// Opaque map edges must be clipped, including Belgium/Germany at broad zooms.
assert.ok(all.filter(l=>l.options.pane==='backgroundPane' && l.options.coverageCountry).every(l=>l.options.clipCountry===l.options.coverageCountry));
// A loaded/unloaded failed tile clears the warning; retry only the visible failure.
let retries=0;const tileFailure={isConnected:true,restartRequest(){retries++}};
lu.emit('tileerror',{tile:tileFailure});flushFrames();assert.match(status,/failed/);assert.equal(el.retryTiles.hidden,false);
app.retryFailedTiles();assert.equal(retries,1);assert.equal(el.retryTiles.hidden,true);
lu.emit('tileload',{tile:tileFailure});flushFrames();assert.match(status,/loaded/);
lu.emit('tileerror',{tile:tileFailure});lu.emit('tileunload',{tile:tileFailure});flushFrames();assert.equal(el.retryTiles.hidden,true);assert.match(status,/loaded/);
console.log('PASS: Luxembourg sources/matrix IDs, zoom-based deferral, opaque border masks and failure recovery.');

// A burst updates failure bookkeeping immediately and scans status once per frame.
flushFrames();const beforeReports=reports;
for(let i=0;i<100;i++)lu.emit('tileerror',{tile:tileFailure});
assert.equal(reports,beforeReports);assert.equal(frames.length,1);
flushFrames();assert.equal(reports,beforeReports+1);assert.equal(el.retryTiles.hidden,false);
lu.emit('tileunload',{tile:tileFailure});flushFrames();assert.equal(el.retryTiles.hidden,true);
console.log('PASS: tile status scans coalesce across a 100-event burst.');

// Uniform modes attach one global provider and do not clip at country borders.
el.terrain.value='off';app.chooseTerrain();
for(const position of [[50.7,4.2],[51.2,10.4],[52.1,5.9],[49.7,4.7],[49.75,6.1],[40,-100]]) {
 center=position;
 for(const [mode,host] of [['osm','tile.openstreetmap.org'],['satellite','tiles.maps.eox.at']]) {
  el.background.value=mode;app.setBase();
  const active=[...attached].flatMap(g=>g.getLayers());
  assert.equal(active.length,1,mode+' attaches one global layer');
  assert.ok(active[0].url.includes(host));
  assert.equal(active[0].options.bounds,undefined);
  assert.equal(active[0].options.clipCountry,undefined);
 }
}
assert.ok(!all.some(l=>l.url.includes('tile.openstreetmap.be')||l.url.includes('PLANIGNV2')||l.url.includes('brt-achtergrondkaart')));
console.log('PASS: uniform global backgrounds across all five countries and outside Europe.');

ctx.window.location={protocol:'file:'};el.background.value='osm';app.setBase();
assert.equal([...attached].flatMap(g=>g.getLayers()).length,0,'file pages do not send OSM requests without Referer');
assert.match(el.backgroundHint.textContent,/HTTP/);
