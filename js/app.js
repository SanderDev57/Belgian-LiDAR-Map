(() => {
'use strict';
const app = window.BelgianLidar, {map, $, report} = app;
let started = false, layoutFrame = 0, mapAllowed = false;
function saveView() {
 if(!started) return;
 const c = map.getCenter(), z = map.getZoom();
 const coordinates = c.lat.toFixed(5)+', '+c.lng.toFixed(5)+' · zoom '+z;
 if($('coords').textContent !== coordinates) $('coords').textContent = coordinates;
 const hash = '#'+c.lat.toFixed(5)+','+c.lng.toFixed(5)+','+z;
 try {if(location.hash !== hash) history.replaceState(null,'',location.pathname+location.search+hash);} catch {}
}
function layout() {
 if(!mapAllowed) return;
 const bounds = map.getContainer().getBoundingClientRect();
 if(!bounds.width || !bounds.height) return;
 map.invalidateSize({pan:false,animate:false});
 if(!started) {
  // Set the initial view only after the browser has given the map its final size.
  map.setView(app.start.slice(0,2),app.start[2],{animate:false});
  app.setBase();
  started = true; saveView();
 }
 app.applySplit();
}
function scheduleLayout() {
 if(layoutFrame) return;
 layoutFrame = requestAnimationFrame(() => {layoutFrame = 0; layout();});
}
window.addEventListener('resize',scheduleLayout);
window.addEventListener('pageshow',scheduleLayout);
window.addEventListener('load',scheduleLayout);
if(window.visualViewport) window.visualViewport.addEventListener('resize',scheduleLayout);
if(window.ResizeObserver) new ResizeObserver(scheduleLayout).observe(map.getContainer());
// Leaflet also emits moveend after a completed zoom.
map.on('moveend',saveView);
$('menu').onclick = () => $('panel').classList.toggle('closed');
$('terrain').onchange = app.chooseTerrain;
$('background').onchange = app.setBase;
$('opacity').oninput = () => {
 const value = Number($('opacity').value);
 $('opacityValue').textContent = value+'%'; app.setOpacity(value);
};
$('ardennes').onclick = () => map.setView([50.21908,5.61689],17);
function visitCoverage(center, zoom) {
 $('terrain').value = 'auto';
 $('background').value = 'satellite';
 // Navigate before adding the new services to avoid a discarded request batch.
 map.setView(center,zoom,{animate:false}); app.setBase(); app.chooseTerrain();
}
$('eifel').onclick = () => visitCoverage([50.581,6.397],15);
$('luxembourg').onclick = () => visitCoverage([49.755,6.1],16);
$('netherlands').onclick = () => visitCoverage([52.101,5.927],16);
$('france').onclick = () => visitCoverage([49.77,4.72],16);
$('germany').onclick = () => visitCoverage([51.16,10.45],6);
$('belgium').onclick = () => map.fitBounds([[49.5,2.6],[51.5,6.35]]);
map.on('click',e => {$('selected').textContent = 'Selected: '+e.latlng.lat.toFixed(6)+', '+e.latlng.lng.toFixed(6);});
let searching = false;
async function go() {
 const value = $('search').value.trim();
 if(!value) return;
 const match = value.match(/^(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)$/);
 if(match) {
  const lat = Number(match[1]), lon = Number(match[2]);
  if(Math.abs(lat)>90 || Math.abs(lon)>180) {report('Enter valid latitude and longitude.'); return;}
  map.setView([lat,lon],18); return;
 }
 if(searching) return;
 searching = true; $('go').disabled = true;
 report('Searching for location.');
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(),12000);
 try {
  const query = new URLSearchParams({q:value,limit:'1',bbox:'-5.2,41.3,15.5,55.8'});
  const response = await fetch('https://photon.komoot.io/api/?'+query,{signal:controller.signal,credentials:'omit'});
  if(!response.ok) throw new Error('Search request failed');
  const data = await response.json(), result = data.features?.[0];
  const coords = result?.geometry?.coordinates;
  if(!coords || coords.length < 2 || !coords.every(Number.isFinite)) {report('No location found in the selected search area. Try a more complete address.'); return;}
  map.setView([coords[1],coords[0]],17);
  const p = result.properties || {};
  $('selected').textContent = 'Found: '+[p.name,p.street,p.housenumber,p.postcode,p.city].filter(Boolean).join(', ');
  report('Location found.',true);
 } catch {
  report('Location search unavailable. Try again or enter latitude, longitude.');
 } finally {
  clearTimeout(timeout); searching = false; $('go').disabled = false;
 }
}
$('go').onclick = go;
$('search').onkeydown = e => {if(e.key === 'Enter') go();};
// Two frames also cover cached CSS and browsers restoring a tab from background.
$('startMap').onclick = () => {
 mapAllowed = true;
 $('privacyGate').hidden = true;
 $('map').inert = false;
 $('panel').inert = false;
 $('startMap').blur();
 scheduleLayout();
};
})();
