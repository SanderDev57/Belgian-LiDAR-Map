const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function harness(storage=new Map()){
 let download=null,blob=null;
 const context={window:{},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},Date,Blob,Uint8Array,DataView,btoa:s=>Buffer.from(s,'binary').toString('base64'),setTimeout:f=>f(),URL:{createObjectURL:b=>(blob=b,'blob:export'),revokeObjectURL(){}},document:{body:{append(){}},createElement:()=>({click(){download=this.download;},remove(){}})}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/scan-review.js'),'utf8'),context);return {api:context.window.TerrainScanReview,storage,exported:async()=>({name:download,data:JSON.parse(await blob.text())})};
}
const bounds={getWest:()=>5,getEast:()=>5.001,getSouth:()=>50,getNorth:()=>50.001};
test('persistent per-engine reviews, missed structures and bit-exact DEM export',async()=>{
 const h=harness(),r={key:'tumulus:v1:mound:50,5',type:'mound',engine:'tumulus',scoreKind:'model',score:70,center:{lat:50,lng:5},bounds};
 assert.equal(h.api.rate(r,'yes'),true);assert.equal(harness(h.storage).api.rating(r.key),'yes');
 h.api.setScan({bounds,grid:{width:2,height:2,cellSize:1,halo:104,widthM:30,heightM:30,origin:{x:1,y:2},step:3,values:new Float32Array([123.5,124,125.125,126])},results:[r],metadata:{engine:'tumulus'}});
 h.api.addAnnotation(bounds,'trench');h.api.exportData(true);const exported=await h.exported();assert.equal(exported.name,'lidar-scan-test-package.json');assert.equal(exported.data.geojson.features.length,2);assert.equal(exported.data.geojson.features[0].properties.review.verdict,'yes');assert.equal(exported.data.geojson.features[1].properties.verification,'user-suggested-unconfirmed');
 const b=Buffer.from(exported.data.dem.data,'base64');assert.equal(b.readFloatLE(0),123.5);assert.equal(b.readFloatLE(8),125.125);
 h.api.erase();assert.equal(h.api.rating(r.key),undefined);h.api.clear();assert.throws(()=>h.api.exportData(false),/eerst/);
});
