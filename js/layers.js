(() => {
'use strict';
const app = window.BelgianLidar, {map, $, report} = app;
// Visible tiles only. No speculative tile buffer, offline packs or prefetching.
const common = {maxZoom:22,updateWhenIdle:true,updateWhenZooming:false,keepBuffer:0};
const flCredit = 'Bron: <a href="https://www.vlaanderen.be/datavindplaats/catalogus/wmts-digitaal-hoogtemodel-vlaanderen">Digitaal Vlaanderen</a>';
const waCredit = '© <a href="https://geoportail.wallonie.be/catalogue/89b00953-efdb-449b-baec-1c8e7ce483b5.html">SPW · MNT 2021–2022 hillshade</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>';
const deCredit = '© GeoBasis-DE / <a href="https://www.bkg.bund.de">BKG</a> (2026) · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>';
const nrwCredit = '<a href="https://www.bezreg-koeln.nrw.de/geobasis-nrw">Geobasis NRW</a> · <a href="https://www.govdata.de/dl-de/zero-2-0">dl-de/zero-2-0</a>';
const rlpCredit = '©GeoBasis-DE / <a href="https://www.lvermgeo.rlp.de">LVermGeoRP</a> 2026 · <a href="https://www.govdata.de/dl-de/by-2-0">dl-de/by-2-0</a> [Daten bearbeitet]';
const deBounds = [[47.27,5.86],[55.06,15.05]];
const nrwBounds = [[50.057798,5.593338],[52.799797,9.741582]];
const rlpBounds = [[48.897996,6.037773],[51.000893,8.617703]];
const nlBounds = [[50.7,3.3],[53.65,7.25]];
const frBounds = [[41.3,-5.2],[51.15,9.65]];
const luBounds=[[49.438,5.72],[50.185,6.5462]];
const luCredit='© <a href="https://act.public.lu">Administration du cadastre et de la topographie (ACT)</a> / <a href="https://geoportail.lu">Geoportail.lu</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>';
// Cached public Luxembourg basemap and 2025 summer orthophoto. Matrix identifiers
// are zero-padded below z10, as advertised by the service capabilities.
const LuTile=L.TileLayer.extend({getTileUrl(coords){
 return this._url.replace('{z}',String(coords.z).padStart(2,'0')).replace('{x}',coords.x).replace('{y}',coords.y);
}});
function luTile(name,matrix,maxNativeZoom,zIndex,format='png') {
 return new LuTile('https://wmts1.geoportail.lu/opendata/wmts/'+name+'/'+matrix+'/{z}/{x}/{y}.'+format,{
  ...common,pane:'backgroundPane',bounds:luBounds,noWrap:true,maxNativeZoom,zIndex,attribution:luCredit,coverageCountry:'LU',clipCountry:'LU'
 });
}
const ahnCredit = 'Bron: <a href="https://www.ahn.nl/dataroom">AHN</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0 (AHN5/6)</a>; AHN4 CC0 · hillshade via Ellipsis Drive';
const nlPhotoCredit = '© <a href="https://www.beeldmateriaal.nl">Samenwerkingsverband Beeldmateriaal</a> / PDOK · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>';
const frCredit = '© <a href="https://cartes.gouv.fr">IGN / Géoplateforme</a> · <a href="https://www.data.gouv.fr/pages/legal/licences/etalab-2-0">Licence Ouverte 2.0</a> · source dates vary';
function ignTile(layer,matrix,maxNativeZoom,zIndex,pane='terrainPane',format='image/png',style='normal',minZoom=0) {
 return L.tileLayer('https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER='+layer+'&STYLE='+style+'&FORMAT='+encodeURIComponent(format)+'&TILEMATRIXSET='+matrix+'&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',{
  ...common,pane,bounds:frBounds,noWrap:true,maxNativeZoom,minZoom,zIndex,attribution:frCredit,coverageCountry:'FR',allowMissing:layer.includes('LIDAR-HD_MNT')
 });
}
const ahnStyle = {"method":"v2","parameters":{"fill":{"type":"channelMap","channelMap":[{"expression":"255","channel":"red"},{"expression":"255","channel":"green"},{"expression":"255","channel":"blue"}]},"shade":{"bandNumber":1,"exaggerate":1,"azimuth":315,"angle":45,"factor":1},"alphaMultiplier":1}};
function ahn(path,timestamp,zIndex,bounds=nlBounds) {
 return L.tileLayer('https://api.ellipsis-drive.com/v3/path/'+path+'/raster/timestamp/'+timestamp+'/tile/{z}/{x}/{y}?style='+encodeURIComponent(JSON.stringify(ahnStyle)),{
  ...common,pane:'terrainPane',bounds,noWrap:true,minZoom:zIndex>33?12:0,maxNativeZoom:18,zIndex,attribution:ahnCredit,coverageCountry:'NL',paced:true
 });
}
function wms(url,layers,attribution,bounds,maxNativeZoom,pane,zIndex,coverageCountry='DE') {
 return L.tileLayer.wms(url,{...common,layers,styles:'',format:'image/png',transparent:true,
  version:'1.3.0',crs:L.CRS.EPSG3857,bounds,maxNativeZoom,noWrap:true,attribution,pane,zIndex,coverageCountry});
}
// SPW's image export returns transparent tiles outside its true coverage, including
// places inside its rectangular extent. Use Leaflet's normal image lifecycle/retry.
const SpwLayer = L.TileLayer.extend({
 getTileUrl(coords) {
  const bounds = this._tileCoordsToBounds(coords);
  const sw = L.CRS.EPSG3857.project(bounds.getSouthWest());
  const ne = L.CRS.EPSG3857.project(bounds.getNorthEast());
  const size = this.getTileSize();
  const query = new URLSearchParams({f:'image',bbox:[sw.x,sw.y,ne.x,ne.y].join(','),
   bboxSR:'3857',imageSR:'3857',size:size.x+','+size.y,format:'png32',transparent:'true',layers:'show:0',dpi:'96'});
  return this._url+'?'+query;
 }
});
function spw(path,options) {
 return new SpwLayer('https://geoservices.wallonie.be/arcgis/rest/services/'+path+'/MapServer/export',{
  ...common,noWrap:true,coverageCountry:'WA',...options
 });
}
const aerialFl = L.tileLayer('https://geo.api.vlaanderen.be/OMWRGBMRVL/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=omwrgbmrvl&STYLE=&FORMAT=image/png&TILEMATRIXSET=GoogleMapsVL&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
 ...common,coverageCountry:'FB',pane:'backgroundPane',maxNativeZoom:21,zIndex:30,bounds:[[50.685,2.53],[51.52,5.92]],
 attribution:'Bron: Luchtopnamen <a href="https://www.vlaanderen.be/datavindplaats/catalogus/wmts-orthofotomozaiek-middenschalig-winteropnamen-kleur-meest-recent-vlaanderen">Digitaal Vlaanderen</a>'
});
const aerialWa = spw('IMAGERIE/ORTHO_2023_ETE',{
 pane:'backgroundPane',maxNativeZoom:21,zIndex:20,bounds:[[49.49,2.84],[50.85,6.5]],
 attribution:'© <a href="https://geoportail.wallonie.be/catalogue/ad55c2ce-62ad-4c3c-b3cf-8fbc270a6b6e.html">SPW · Orthophotos 2023 Été</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>'
});
function fl(name) {
 return L.tileLayer('https://geo.api.vlaanderen.be/DHMV/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER='+name+'&STYLE=&FORMAT=image/png&TILEMATRIXSET=GoogleMapsVL&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',{...common,coverageCountry:'FL',zIndex:40,pane:'terrainPane',maxNativeZoom:21,attribution:flCredit,bounds:[[50.68,2.53],[51.52,5.95]]});
}
const terrainLu=wms('https://wms.geoportail.lu/public_map_layers/service','2978',luCredit+' · LiDAR 2024 MNT',luBounds,18,'terrainPane',36,'LU');
terrainLu.options.clipCountry='LU';
const terrainSources = [
 terrainLu,
 // Fine sources cover coarser ones; transparent edges and missing tiles reveal the fallback.
 ignTile('ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW','PM_0_15',15,5,'terrainPane','image/png','estompage_grayscale'),
 ignTile('IGNF_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW','PM_6_17',17,15,'terrainPane','image/png','normal',11),
 ignTile('IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW','PM_0_18',18,32,'terrainPane','image/png','normal',12),
 ahn('8b60a159-42ed-480c-ba86-7f181dcf4b8a','54e1e21c-50fe-42a4-b9fb-1f25ccb199af',33),
 ahn('51e11c02-1065-463d-a0b0-263d80293b16','41eaf86f-fa84-48f7-a949-355044ed0e4e',34,[[50.7,3.3],[53.65,6.445]]),
 ahn('231a4c66-9de9-4f41-91af-e4e991df9160','05df775a-ae39-4bb0-a52e-d3044c993d1e',35,[[51.8,3.94],[53.7,7.37]]),
 wms('https://sgx.geodatenzentrum.de/wms_basemapde_schummerung','de_basemapde_web_raster_hillshade',deCredit,deBounds,14,'terrainPane',10),
 wms('https://geo4.service24.rlp.de/wms/shade1m.fcgi','rp_shade1m',rlpCredit,rlpBounds,17,'terrainPane',20,'RLP'),
 spw('RELIEF/WALLONIE_MNT_2021_2022_HILLSHADE',{pane:'terrainPane',zIndex:30,maxNativeZoom:21,attribution:waCredit,bounds:[[49.49,2.84],[50.85,6.5]]}),
 fl('DHMV_II_HILL_25cm'),
 wms('https://www.wms.nrw.de/geobasis/wms_nw_dgm-schummerung','nw_dgm-schummerung_pan',nrwCredit,nrwBounds,19,'terrainPane',50,'NRW')
];
const satelliteOverview = L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg',{
 ...common,pane:'backgroundPane',zIndex:0,maxNativeZoom:14,noWrap:true,
 attribution:'<a href="https://cloudless.eox.at">EOxCloudless</a> by <a href="https://eox.at">EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2016 &amp; 2017) · <a href="https://maps.eox.at/">EOX::Maps</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>'
});
const aerialRlp = wms('https://geo4.service24.rlp.de/wms/rp_dop20.fcgi','rp_dop20',rlpCredit,rlpBounds,19,'backgroundPane',10,'RLP');
const aerialNrw = wms('https://www.wms.nrw.de/geobasis/wms_nw_dop','nw_dop_rgb',nrwCredit,nrwBounds,20,'backgroundPane',40,'NRW');
const streetGlobal = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
 ...common,pane:'backgroundPane',maxNativeZoom:19,noWrap:true,
 attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
});
// Cached public imagery is preferred. Geographic masks prevent opaque no-data
// JPEGs outside national coverage from hiding neighbouring countries.
const aerialNl = L.tileLayer('https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/OGC:1.0:GoogleMapsCompatible/{z}/{x}/{y}.jpeg',{
 ...common,pane:'backgroundPane',zIndex:50,bounds:nlBounds,noWrap:true,maxNativeZoom:20,attribution:nlPhotoCredit,coverageCountry:'NL',clipCountry:'NL'
});
const aerialFr = ignTile('ORTHOIMAGERY.ORTHOPHOTOS','PM_0_19',19,12,'backgroundPane','image/jpeg');
aerialFr.options.clipCountry='FR';
const aerialLu=luTile('ortho_2025','GLOBAL_WEBMERCATOR_4_V3',20,60,'jpeg');
const backgroundSources = {
 satellite:[satelliteOverview],
 aerial:[satelliteOverview,aerialFr,aerialRlp,aerialWa,aerialFl,aerialNrw,aerialNl,aerialLu],
 osm:[streetGlobal]
};
const allBackgrounds = [...new Set(Object.values(backgroundSources).flat())];
// National street tiles and some WMS images include opaque pixels beyond their
// own territory. Clip their display as well as their request footprint.
for(const layer of allBackgrounds) if(layer.options.coverageCountry) layer.options.clipCountry=layer.options.coverageCountry;
// Bounds are only a first filter. Country geometry avoids requesting neighbours'
// rectangular services in areas they do not cover, including individual border tiles.
for(const layer of [...terrainSources,...allBackgrounds]) {
 if(layer.options.coverageCountry) {
  const valid = layer._isValidTile;
  layer._isValidTile = function(coords) {
   return valid.call(this,coords) && app.coverage.intersects(this.options.coverageCountry,this._tileCoordsToBounds(coords));
  };
 }
}
const baseGroup = L.layerGroup(), terrainGroup = L.layerGroup();
let baseKey = '', terrainEnabled = false;
const terrainFailures = new Map(), backgroundFailures = new Map();
const failedCount=(collection,group)=>group.getLayers().reduce((sum,l)=>sum+(collection.get(l)?.size||0),0);
function retryVisibility() {$('retryTiles').hidden=!failedCount(terrainFailures,terrainGroup) && !failedCount(backgroundFailures,baseGroup);}
let statusFrame = 0;
function scheduleStatuses() {
 if(statusFrame) return;
 // Tile events update failure sets immediately, but scan composite layers once
 // per frame rather than once for every completed or discarded tile.
 statusFrame = requestAnimationFrame(() => {
  statusFrame = 0;
  terrainStatus(); backgroundStatus(); retryVisibility();
 });
}
function trackFailures(layer,collection) {
 const failures=new Set();collection.set(layer,failures);
 layer.on('tileerror',e=>{failures.add(e.tile);scheduleStatuses();});
 layer.on('tileload tileunload tileabort',e=>{failures.delete(e.tile);scheduleStatuses();});
 layer.on('loading load',scheduleStatuses);
}

function visible(layer) {
 return map._loaded && map.getZoom() >= (layer.options.minZoom || 0)
  && (!layer.options.bounds || map.getBounds().intersects(L.latLngBounds(layer.options.bounds)))
  && (!layer.options.coverageCountry || app.coverage.intersects(layer.options.coverageCountry,map.getBounds()));
}
function syncGroup(group,sources) {
 const needed = sources.filter(visible);
 for(const layer of group.getLayers()) if(!needed.includes(layer)) group.removeLayer(layer);
 for(const layer of needed) if(!group.hasLayer(layer)) group.addLayer(layer);
 if(needed.length && !map.hasLayer(group)) group.addTo(map);
 if(!needed.length && map.hasLayer(group)) map.removeLayer(group);
}
function terrainStatus() {
 if(!terrainEnabled) return;
 const layers = terrainGroup.getLayers();
 if(!layers.length) {report('No connected terrain coverage here.'); return;}
 if(layers.some(layer => layer.isLoading())) {report('Loading terrain · finer detail appears as tiles arrive…'); return;}
 const failed = failedCount(terrainFailures,terrainGroup)>0;
 report(failed ? 'Some terrain sources failed; available layers remain visible.' : 'Terrain loaded · finest connected detail on top.',!failed);
}
function backgroundStatus() {
 const layers = baseGroup.getLayers();
 const message = failedCount(backgroundFailures,baseGroup)>0
  ? 'Some background sources failed; available imagery remains visible.'
  : layers.some(layer => layer.isLoading()) ? 'Loading background…'
  : layers.length || baseKey === 'none' ? '' : 'No street map coverage here.';
 if($('backgroundStatus').textContent !== message) $('backgroundStatus').textContent = message;
}
function refreshCoverage() {
 // OSMF requires an HTTP Referer; file:// pages cannot provide one.
 const streetBlocked = baseKey === 'osm' && window.location?.protocol === 'file:';
 syncGroup(baseGroup,streetBlocked ? [] : backgroundSources[baseKey] || []);
 syncGroup(terrainGroup,terrainEnabled ? terrainSources : []);
 terrainStatus(); backgroundStatus(); retryVisibility(); applyCoverageMasks();
 if(app.applySplit) app.applySplit();
}
app.setBase = () => {
 baseKey = $('background').value;
 refreshCoverage();
 $('backgroundHint').textContent = baseKey === 'aerial'
  ? 'Aerial imagery: Belgium, Netherlands (5–8 cm), France (about 20 cm), NRW (10 cm), RLP (20 cm), Luxembourg (2025 summer). Capture dates vary. Gaps use the older 2016–17 satellite overview (~10 m). Country-edge masks are generalized.'
  : baseKey === 'satellite' ? 'One worldwide satellite mosaic: EOxCloudless 2016 (2016–17 imagery, about 10 m). Older overview only; use detailed aerial imagery for buildings and small features.'
  : baseKey === 'osm' ? 'One worldwide street map: OpenStreetMap. Same map style across country borders.' : '';
 if(baseKey === 'osm' && window.location?.protocol === 'file:') {
  $('backgroundHint').textContent = 'OpenStreetMap requires a hosted HTTP(S) page. Open the project website or choose satellite / detailed aerial imagery in this downloaded file.';
  $('backgroundStatus').textContent = 'Street map unavailable on file:// pages under the provider policy.';
 }
};
app.chooseTerrain = () => {
 terrainEnabled = $('terrain').value !== 'off';
 
 app.setOpacity(Number($('opacity').value));
 refreshCoverage();
 if(!terrainEnabled) report('LiDAR disabled. Select automatic terrain to enable it.');
};
app.getTerrains = () => terrainGroup.getLayers();
// Set opacity once on the composite, avoiding darker overlaps from stacked translucent layers.
app.setOpacity = value => {map.getPane('terrainPane').style.opacity = String(value/100);};
for(const layer of terrainSources) trackFailures(layer,terrainFailures);
for(const layer of allBackgrounds) trackFailures(layer,backgroundFailures);
app.retryFailedTiles=()=>{
 for(const [collection,group] of [[terrainFailures,terrainGroup],[backgroundFailures,baseGroup]]) {
  for(const layer of group.getLayers()) for(const tile of [...(collection.get(layer)||[])]) {
   if(tile.isConnected && tile.restartRequest){collection.get(layer).delete(tile);tile.restartRequest();}
  }
 }
 retryVisibility();
};
$('retryTiles').onclick=app.retryFailedTiles;
window.addEventListener('online',app.retryFailedTiles);
function applyCoverageMasks() {
 for(const layer of [...baseGroup.getLayers(),...terrainGroup.getLayers()]) app.coverage.applyMask(layer,map);
}
map.on('viewreset zoomend resize layeradd',applyCoverageMasks);
for(const layer of [...terrainSources,...allBackgrounds]) app.tiles.install(layer);
map.on('moveend',refreshCoverage);
})();
