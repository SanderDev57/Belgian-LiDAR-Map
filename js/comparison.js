(() => {
'use strict';
const app = window.BelgianLidar, {map, $} = app;
let split = 50, frame = 0, dragging = false;
const divider = $('divider');
const vertical = $('compare'), horizontal = $('compareHorizontal');
const isHorizontal = () => horizontal.checked;
app.applySplit = () => {
 const across = isHorizontal();
 const enabled = (vertical.checked || across) && app.getTerrains().length > 0;
 divider.classList.toggle('horizontal',across);
 divider.setAttribute('aria-orientation',across ? 'vertical' : 'horizontal');
 divider.querySelector('.knob').textContent = across ? '\u2191 \u2193' : '\u2190 \u2192';
 divider.style.display = enabled ? 'block' : 'none';
 divider.style.left = across ? '0' : split+'%';
 divider.style.top = across ? split+'%' : '0';
 // No layer coordinates exist before the privacy gate initializes the view.
 if(!map._loaded) return;
 const size = map.getSize();
 const topLeft = map.containerPointToLayerPoint(across ? [0,size.y*split/100] : [size.x*split/100,0]);
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
 const size = map.getSize(), length = Math.max(54,isHorizontal() ? size.y : size.x);
 split = Math.max(100*27/length,Math.min(100-100*27/length,value));
 divider.setAttribute('aria-valuenow',String(Math.round(split)));
 schedule();
}
divider.addEventListener('pointerdown',e => {
 dragging = true; divider.setPointerCapture(e.pointerId); e.preventDefault();
});
divider.addEventListener('pointermove',e => {
 if(!dragging) return;
 const bounds = map.getContainer().getBoundingClientRect();
 setSplit(isHorizontal() ? (e.clientY-bounds.top)/bounds.height*100 : (e.clientX-bounds.left)/bounds.width*100);
});
for(const event of ['pointerup','pointercancel','lostpointercapture']) divider.addEventListener(event,() => {dragging = false;});
divider.addEventListener('keydown',e => {
 const decrease = isHorizontal() ? 'ArrowUp' : 'ArrowLeft';
 const increase = isHorizontal() ? 'ArrowDown' : 'ArrowRight';
 if(e.key === decrease || e.key === increase) {e.preventDefault(); setSplit(split+(e.key === decrease?-5:5));}
});
map.on('move zoom viewreset resize layeradd',app.applySplit);
for(const [control,other] of [[vertical,horizontal],[horizontal,vertical]]) {
 control.addEventListener('change',() => {
  if(control.checked) other.checked = false;
  dragging = false;
  setSplit(50);
  app.applySplit();
 });
}
setSplit(50);
})();