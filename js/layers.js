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
const belgiumBounds = [[49.49,2.53],[51.52,6.5]];
const combinedBounds = [[47.2,2.5],[55.1,15.1]];
function wms(url,layers,attribution,bounds,maxNativeZoom,pane,zIndex) {
 return L.tileLayer.wms(url,{...common,layers,styles:'',format:'image/png',transparent:true,
  version:'1.3.0',crs:L.CRS.EPSG3857,bounds,maxNativeZoom,noWrap:true,attribution,pane,zIndex});
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
  ...common,noWrap:true,...options
 });
}
const aerialFl = L.tileLayer('https://geo.api.vlaanderen.be/OMWRGBMRVL/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=omwrgbmrvl&STYLE=&FORMAT=image/png&TILEMATRIXSET=GoogleMapsVL&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
 ...common,pane:'backgroundPane',maxNativeZoom:21,zIndex:30,bounds:[[50.685,2.53],[51.52,5.92]],
 attribution:'Bron: Luchtopnamen <a href="https://www.vlaanderen.be/datavindplaats/catalogus/wmts-orthofotomozaiek-middenschalig-winteropnamen-kleur-meest-recent-vlaanderen">Digitaal Vlaanderen</a>'
});
const aerialWa = spw('IMAGERIE/ORTHO_2023_ETE',{
 pane:'backgroundPane',maxNativeZoom:21,zIndex:20,bounds:[[49.49,2.84],[50.85,6.5]],
 attribution:'© <a href="https://geoportail.wallonie.be/catalogue/ad55c2ce-62ad-4c3c-b3cf-8fbc270a6b6e.html">SPW · Orthophotos 2023 Été</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>'
});
function fl(name) {
 return L.tileLayer('https://geo.api.vlaanderen.be/DHMV/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER='+name+'&STYLE=&FORMAT=image/png&TILEMATRIXSET=GoogleMapsVL&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',{...common,zIndex:40,pane:'terrainPane',maxNativeZoom:21,attribution:flCredit,bounds:[[50.68,2.53],[51.52,5.95]]});
}
const terrainSources = [
 // Fine sources cover coarser ones; transparent edges and missing tiles reveal the fallback.
 wms('https://sgx.geodatenzentrum.de/wms_basemapde_schummerung','de_basemapde_web_raster_hillshade',deCredit,deBounds,14,'terrainPane',10),
 wms('https://geo4.service24.rlp.de/wms/shade1m.fcgi','rp_shade1m',rlpCredit,rlpBounds,17,'terrainPane',20),
 spw('RELIEF/WALLONIE_MNT_2021_2022_HILLSHADE',{pane:'terrainPane',zIndex:30,maxNativeZoom:21,attribution:waCredit,bounds:[[49.49,2.84],[50.85,6.5]]}),
 fl('DHMV_II_HILL_25cm'),
 wms('https://www.wms.nrw.de/geobasis/wms_nw_dgm-schummerung','nw_dgm-schummerung_pan',nrwCredit,nrwBounds,19,'terrainPane',50)
];
const satelliteOverview = L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg',{
 ...common,pane:'backgroundPane',zIndex:0,bounds:combinedBounds,maxNativeZoom:14,noWrap:true,
 attribution:'<a href="https://cloudless.eox.at">EOxCloudless</a> by <a href="https://eox.at">EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2016 &amp; 2017) · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>'
});
const aerialRlp = wms('https://geo4.service24.rlp.de/wms/rp_dop20.fcgi','rp_dop20',rlpCredit,rlpBounds,19,'backgroundPane',10);
const aerialNrw = wms('https://www.wms.nrw.de/geobasis/wms_nw_dop','nw_dop_rgb',nrwCredit,nrwBounds,20,'backgroundPane',40);
const streetBe = L.tileLayer('https://tile.openstreetmap.be/osmbe/{z}/{x}/{y}.png',{
 ...common,pane:'backgroundPane',zIndex:0,bounds:belgiumBounds,maxNativeZoom:18,
 attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Tiles generated by <a href="https://www.champs-libres.coop/">Champs-Libres</a>'
});
const streetDe = wms('https://sgx.geodatenzentrum.de/wms_basemapde','de_basemapde_web_raster_farbe',deCredit,deBounds,19,'backgroundPane',1);
const backgroundSources = {
 satellite:[satelliteOverview,aerialRlp,aerialWa,aerialFl,aerialNrw],
 osm:[streetBe,streetDe]
};
const allBackgrounds = [...backgroundSources.satellite,...backgroundSources.osm];
const baseGroup = L.layerGroup(), terrainGroup = L.layerGroup();
let baseKey = '', terrainEnabled = false;
const terrainFailures = new Set(), backgroundFailures = new Set();
function visible(layer) {
 return map._loaded && (!layer.options.bounds || map.getBounds().intersects(L.latLngBounds(layer.options.bounds)));
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
 if(layers.some(layer => layer.isLoading())) {report('Loading terrain · finest detail appears as tiles arrive…'); return;}
 const failed = layers.some(layer => terrainFailures.has(layer));
 report(failed ? 'Some terrain sources failed; available layers remain visible.' : 'Terrain loaded · finest connected detail on top.',!failed);
}
function backgroundStatus() {
 const layers = baseGroup.getLayers();
 if(layers.some(layer => backgroundFailures.has(layer))) {
  $('backgroundStatus').textContent = 'Some background sources failed; available imagery remains visible.';
 } else if(layers.some(layer => layer.isLoading())) {
  $('backgroundStatus').textContent = 'Loading background…';
 } else $('backgroundStatus').textContent = layers.length || baseKey === 'none' ? '' : 'No street map coverage here.';
}
function refreshCoverage() {
 syncGroup(baseGroup,backgroundSources[baseKey] || []);
 syncGroup(terrainGroup,terrainEnabled ? terrainSources : []);
 terrainStatus(); backgroundStatus();
 if(app.applySplit) app.applySplit();
}
app.setBase = () => {
 baseKey = $('background').value;
 backgroundFailures.clear(); refreshCoverage();
 $('backgroundHint').textContent = baseKey === 'satellite'
  ? 'Detailed aerial photos in Belgium, NRW (10 cm) and Rhineland-Palatinate (20 cm). Elsewhere: older Sentinel-2 overview (2016–17, about 10 m), enlarged at high zoom.'
  : baseKey === 'osm' ? 'Street maps for Belgium and Germany.' : '';
};
app.chooseTerrain = () => {
 terrainEnabled = $('terrain').value !== 'off';
 terrainFailures.clear();
 app.setOpacity(Number($('opacity').value));
 refreshCoverage();
 if(!terrainEnabled) report('LiDAR disabled. Select automatic terrain to enable it.');
};
app.getTerrains = () => terrainGroup.getLayers();
// Set opacity once on the composite, avoiding darker overlaps from stacked translucent layers.
app.setOpacity = value => {map.getPane('terrainPane').style.opacity = String(value/100);};
for(const layer of terrainSources) {
 layer.on('loading',() => {terrainFailures.delete(layer); if(terrainGroup.hasLayer(layer)) terrainStatus();});
 layer.on('tileerror',() => {terrainFailures.add(layer); if(terrainGroup.hasLayer(layer)) terrainStatus();});
 layer.on('load',() => {if(terrainGroup.hasLayer(layer)) terrainStatus();});
}
for(const layer of allBackgrounds) {
 layer.on('loading',() => {backgroundFailures.delete(layer); if(baseGroup.hasLayer(layer)) backgroundStatus();});
 layer.on('tileerror',() => {backgroundFailures.add(layer); if(baseGroup.hasLayer(layer)) backgroundStatus();});
 layer.on('load',() => {if(baseGroup.hasLayer(layer)) backgroundStatus();});
}
// Retry each failed image at most once, cancelling delayed retries when tiles leave the view.
for(const layer of [...terrainSources,...allBackgrounds]) {
 const createTile = layer.createTile;
 layer.createTile = function(coords,done) {
  let retried = false;
  return createTile.call(this,coords,(error,tile) => {
   if(error && !retried) {
    retried = true;
    tile.retryTimer = setTimeout(() => {
     if(this._map && tile.isConnected) tile.src = this.getTileUrl(coords);
    },1500);
   } else done(error,tile);
  });
 };
 layer.on('tileunload tileabort',e => clearTimeout(e.tile.retryTimer));
}
map.on('moveend',refreshCoverage);
})();
