(() => {
'use strict';
const app = window.BelgianLidar, {map, $, report} = app;
let started = false, layoutFrame = 0, mapAllowed = false;
function saveView() {
 if(!started) return;
 const c = map.getCenter(), z = map.getZoom();
 $('coords').textContent = c.lat.toFixed(5)+', '+c.lng.toFixed(5)+' · zoom '+z;
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
map.on('moveend zoomend',saveView);
$('menu').onclick = () => $('panel').classList.toggle('closed');
$('terrain').onchange = app.chooseTerrain;
$('background').onchange = app.setBase;
$('opacity').oninput = () => {
 const value = Number($('opacity').value);
 $('opacityValue').textContent = value+'%'; app.setOpacity(value);
};
$('ardennes').onclick = () => map.setView([50.21908,5.61689],17);
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
  const query = new URLSearchParams({q:value,limit:'1',bbox:'2.5,49.45,6.5,51.6'});
  const response = await fetch('https://photon.komoot.io/api/?'+query,{signal:controller.signal,credentials:'omit'});
  if(!response.ok) throw new Error('Search request failed');
  const data = await response.json(), result = data.features?.[0];
  const coords = result?.geometry?.coordinates;
  if(!coords || coords.length < 2 || !coords.every(Number.isFinite)) {report('No location found in Belgium. Try a more complete address.'); return;}
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