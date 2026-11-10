window.BelgianLidar = (() => {
'use strict';
const $ = id => document.getElementById(id);
const parts = location.hash.slice(1).split(',').map(Number);
const valid = parts.length === 3 && parts.every(Number.isFinite) && Math.abs(parts[0]) <= 90 && Math.abs(parts[1]) <= 180 && parts[2] >= 0 && parts[2] <= 22;
const start = valid ? parts : [50.21908, 5.61689, 17];
// One map owns every layer: no second map to initialize or synchronize.
const map = L.map('map', {zoomControl:false,maxZoom:22,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false});
// Terrain always stays above backgrounds, independent of asynchronous startup order.
map.createPane('backgroundPane');
map.getPane('backgroundPane').style.zIndex = '200';
map.createPane('terrainPane');
map.getPane('terrainPane').style.zIndex = '250';
map.getPane('terrainPane').style.pointerEvents = 'none';
L.control.zoom({position:'bottomright'}).addTo(map);
L.control.scale({imperial:false}).addTo(map);
const status = $('status');
let statusFrame = 0, statusMessage = '', statusGood = false;
function report(message, good=false) {
  statusMessage = message; statusGood = good;
  if(statusFrame) return;
  // Tile batches can complete together; write only the latest status per frame.
  statusFrame = requestAnimationFrame(() => {
    statusFrame = 0;
    if(status.textContent !== statusMessage) status.textContent = statusMessage;
    status.classList.toggle('good', statusGood);
  });
}
return {$, map, start, report};
})();
