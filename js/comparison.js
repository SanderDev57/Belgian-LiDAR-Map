(() => {
'use strict';
const app = window.BelgianLidar, {map, $} = app;
let split = 50, frame = 0, dragging = false;
const divider = $('divider');
app.applySplit = () => {
 const enabled = $('compare').checked && app.getTerrains().length > 0;
 divider.style.display = enabled ? 'block' : 'none';
 divider.style.left = split+'%';
 // No layer coordinates exist before the privacy gate initializes the view.
 if(!map._loaded) return;
 const size = map.getSize();
 const topLeft = map.containerPointToLayerPoint([size.x*split/100,0]);
 const bottomRight = map.containerPointToLayerPoint([size.x,size.y]);
 for(const layer of app.getTerrains()) {
  const container = layer.getContainer();
  if(container) container.style.clip = enabled
   ? 'rect('+topLeft.y+'px, '+bottomRight.x+'px, '+bottomRight.y+'px, '+topLeft.x+'px)'
   : 'auto';
 }
};
function schedule() {
 if(frame) return;
 frame = requestAnimationFrame(() => {frame = 0; app.applySplit();});
}
divider.setAttribute('role','slider');
divider.setAttribute('aria-label','Background and LiDAR comparison');
divider.setAttribute('aria-valuemin','0');
divider.setAttribute('aria-valuemax','100');
divider.tabIndex = 0;
function setSplit(value) {
 split = Math.max(100*27/Math.max(54,map.getSize().x),Math.min(100-100*27/Math.max(54,map.getSize().x),value));
 divider.setAttribute('aria-valuenow',String(Math.round(split)));
 schedule();
}
divider.addEventListener('pointerdown',e => {
 dragging = true; divider.setPointerCapture(e.pointerId); e.preventDefault();
});
divider.addEventListener('pointermove',e => {
 if(!dragging) return;
 const bounds = map.getContainer().getBoundingClientRect();
 setSplit((e.clientX-bounds.left)/bounds.width*100);
});
for(const event of ['pointerup','pointercancel','lostpointercapture']) divider.addEventListener(event,() => {dragging = false;});
divider.addEventListener('keydown',e => {
 if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') {e.preventDefault(); setSplit(split+(e.key === 'ArrowLeft'?-5:5));}
});
map.on('move zoom viewreset resize layeradd',app.applySplit);
$('compare').addEventListener('change',app.applySplit);
setSplit(50);
})();