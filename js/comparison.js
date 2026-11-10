(() => {
'use strict';
const app = window.BelgianLidar, {map, $} = app;
let split = 50, frame = 0, dragging = false, dragBounds = null;
const divider = $('divider');
const vertical = $('compare'), horizontal = $('compareHorizontal');
const isHorizontal = () => horizontal.checked;
const knob = divider.querySelector('.knob');
function setStyle(element, property, value) {
 if(element.style[property] !== value) element.style[property] = value;
}
app.applySplit = () => {
 const across = isHorizontal();
 const layers = app.getTerrains();
 const enabled = (vertical.checked || across) && layers.length > 0;
 divider.classList.toggle('horizontal',across);
 const orientation = across ? 'vertical' : 'horizontal';
 if(divider.getAttribute('aria-orientation') !== orientation) divider.setAttribute('aria-orientation',orientation);
 const label = across ? '\u2191 \u2193' : '\u2190 \u2192';
 if(knob.textContent !== label) knob.textContent = label;
 setStyle(divider,'display',enabled ? 'block' : 'none');
 setStyle(divider,'left',across ? '0px' : split+'%');
 setStyle(divider,'top',across ? split+'%' : '0px');
 // No layer coordinates exist before the privacy gate initializes the view.
 if(!map._loaded) return;
 let clip = 'auto';
 if(enabled) {
  const size = map.getSize();
  const topLeft = map.containerPointToLayerPoint(across ? [0,size.y*split/100] : [size.x*split/100,0]);
  const bottomRight = map.containerPointToLayerPoint([size.x,size.y]);
  clip = 'rect('+topLeft.y+'px, '+bottomRight.x+'px, '+bottomRight.y+'px, '+topLeft.x+'px)';
 }
 for(const layer of layers) {
  const container = layer.getContainer();
  if(container) setStyle(container,'clip',clip);
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
 dragBounds = map.getContainer().getBoundingClientRect();
 dragging = true; divider.setPointerCapture(e.pointerId); e.preventDefault();
});
divider.addEventListener('pointermove',e => {
 if(!dragging) return;
 const bounds = dragBounds || (dragBounds = map.getContainer().getBoundingClientRect());
 if(bounds.width && bounds.height) setSplit(isHorizontal() ? (e.clientY-bounds.top)/bounds.height*100 : (e.clientX-bounds.left)/bounds.width*100);
});
for(const event of ['pointerup','pointercancel','lostpointercapture']) divider.addEventListener(event,() => {dragging = false; dragBounds = null;});
divider.addEventListener('keydown',e => {
 const decrease = isHorizontal() ? 'ArrowUp' : 'ArrowLeft';
 const increase = isHorizontal() ? 'ArrowDown' : 'ArrowRight';
 if(e.key === decrease || e.key === increase) {e.preventDefault(); setSplit(split+(e.key === decrease?-5:5));}
});
// Coalesce movement events; preserve synchronous first display and final clipping.
map.on('move zoom',schedule);
map.on('moveend zoomend viewreset resize layeradd',app.applySplit);
map.on('resize',() => {dragBounds = null;});
for(const [control,other] of [[vertical,horizontal],[horizontal,vertical]]) {
 control.addEventListener('change',() => {
  if(control.checked) other.checked = false;
  dragging = false; dragBounds = null;
  setSplit(50);
  app.applySplit();
 });
}
setSplit(50);
})();
