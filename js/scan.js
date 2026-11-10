(() => {
'use strict';
const {map,$}=window.BelgianLidar,{types,check}=window.TerrainScan;
const marks=L.layerGroup().addTo(map),feedback=new Map();
let selected=null,selection=null,preview=null,scanOutline=null,anchor=null,drawing=false,selectionPanelCollapsed=false,controller=null,results=[],creditAdded=false;
const status=$('scanStatus'),progress=$('scanProgress');
function message(text){status.textContent=text;}
function busy(value){
 $('scanStart').disabled=value;$('scanSelect').disabled=value;$('scanScope').disabled=value;$('scanClear').disabled=value;
 $('scanCancel').hidden=!value;progress.hidden=!value;$('scanSection').setAttribute('aria-busy',String(value));
}
function endSelection(){if(selectionPanelCollapsed){$('panel').classList.remove('closed');selectionPanelCollapsed=false;}if(preview){map.removeLayer(preview);preview=null;}drawing=false;anchor=null;$('scanSelect').setAttribute('aria-pressed','false');map.getContainer().classList.remove('scan-selecting');}
function selectBounds(bounds){
 if(selection)map.removeLayer(selection);
 selected=bounds;selection=L.rectangle(bounds,{color:'#f8dc7d',weight:2,dashArray:'6 5',fillOpacity:.03,interactive:false}).addTo(map);
}
$('scanSelect').onclick=()=>{
 if(drawing){endSelection();message('Selectie geannuleerd.');return;}
 drawing=true;anchor=null;if(window.matchMedia?.('(max-width: 600px)').matches){$('panel').classList.add('closed');selectionPanelCollapsed=true;}$('scanScope').value='selection';$('scanSelect').setAttribute('aria-pressed','true');
 map.getContainer().classList.add('scan-selecting');message('Tik twee tegenoverliggende hoeken aan op de kaart. Escape annuleert.');
};
map.on('click',event=>{
 if(!drawing)return;
 if(!anchor){anchor=event.latlng;message('Tik nu de tegenoverliggende hoek aan.');return;}
 selectBounds(L.latLngBounds(anchor,event.latlng));endSelection();message('Zone geselecteerd. Druk op Scan gebied om te beginnen.');
});
map.on('mousemove',event=>{if(drawing&&anchor){const bounds=L.latLngBounds(anchor,event.latlng);if(preview)preview.setBounds(bounds);else preview=L.rectangle(bounds,{color:'#f8dc7d',weight:1,dashArray:'3 5',fillOpacity:0,interactive:false}).addTo(map);}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&drawing){endSelection();message('Selectie geannuleerd.');}});
$('scanScope').onchange=()=>{endSelection();if(selection){selection.setStyle({opacity:$('scanScope').value==='selection'?1:0,fillOpacity:0});}};
const filters=$('scanFilters');
for(const [key,type] of Object.entries(types)) {
 const label=document.createElement('label');label.className='scan-filter';const input=document.createElement('input');input.type='checkbox';input.value=key;input.checked=true;
 input.onchange=render;label.append(input,document.createTextNode(type.label.replace(/^Mogelijk(e)? /,'')));filters.append(label);
}
function popup(result){
 const box=document.createElement('div');box.className='scan-popup';
 const title=document.createElement('strong');title.textContent=types[result.type].label;
 const detail=document.createElement('p');detail.textContent=types[result.type].detail;
 const evidence=document.createElement('p');evidence.textContent=`Indicatieve betrouwbaarheid: ${result.score}/100 (vormovereenkomst, geen vindkans). Terreincontrast: ${result.relief} m; oppervlak: circa ${result.area} m².`;
 const question=document.createElement('p');question.textContent='Lijkt deze herkenning correct?';
 const row=document.createElement('div');row.className='row';
 const key=result.key;
 for(const [value,label] of [['yes','Lijkt correct'],['no','Lijkt onjuist'],['unknown','Onzeker']]) {
  const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-pressed',String(feedback.get(key)===value));
  button.onclick=()=>{feedback.set(key,value);while(feedback.size>500)feedback.delete(feedback.keys().next().value);for(const b of row.children)b.setAttribute('aria-pressed',String(b===button));question.textContent='Beoordeling bewaard voor deze sessie. Dit traint geen model.';};row.append(button);
 }
 const note=document.createElement('p');note.textContent='Vermoeden op basis van terreinvorm. Geen bevestigde vondst of datering. De markering toont een benaderende begrenzing.';
 box.append(title,detail,evidence,question,row,note);return box;
}
function render(){
 marks.clearLayers();$('scanResults').replaceChildren();
 const enabled=new Set([...filters.querySelectorAll('input:checked')].map(i=>i.value));
 const shown=results.filter(r=>enabled.has(r.type));$('scanCount').textContent=`${shown.length} van ${results.length} vermoedens zichtbaar`;
 for(const result of shown){
  const color=types[result.type].color;
  const marker=L.circleMarker(result.center,{radius:7,color:'#162630',weight:2,fillColor:color,fillOpacity:1}).bindPopup(()=>popup(result),{maxWidth:320}).addTo(marks);
  L.rectangle(result.bounds,{color,weight:2,dashArray:'4 3',fillOpacity:.06}).bindPopup(()=>popup(result),{maxWidth:320}).addTo(marks);
  const button=document.createElement('button');button.type='button';button.className='scan-result';button.style.borderLeftColor=color;
  button.textContent=`${types[result.type].label} · ${result.score}/100`;button.onclick=()=>{map.panTo(result.center);marker.openPopup();};$('scanResults').append(button);
 }
}
$('scanClear').onclick=()=>{endSelection();results=[];marks.clearLayers();if(scanOutline){map.removeLayer(scanOutline);scanOutline=null;}if(selection){map.removeLayer(selection);selection=null;}selected=null;render();message('Resultaten en selectie gewist.');};
$('scanCancel').onclick=()=>{if(controller){controller.abort();message('Scan wordt geannuleerd…');}};
$('scanStart').onclick=async()=>{
 if(controller)return;
 endSelection();
 let p,bounds;
 try {
  bounds=$('scanScope').value==='selection'?selected:map.getBounds();
  if(!bounds)throw new Error('Selecteer eerst een zone met twee hoeken op de kaart.');
  p=window.TerrainScanData.plan(bounds);
 }catch(error){message(error.message);return;}
 const current=new AbortController();controller=current;busy(true);progress.value=0;
 const update=value=>{if(current.signal.aborted)return;progress.value=Math.round(value);message(value<45?`Hoogtegegevens laden… ${Math.round(value)}%`:`Terreinvormen analyseren… ${Math.round(value)}%`);};
 try {
  // Keep visible credit while scan results or data are in use, independently of terrain visibility.
  if(!creditAdded){creditAdded=true;map.attributionControl.addAttribution('<a href="https://mapterhorn.com/attribution">© Mapterhorn · terreinbronnen</a>');}
  const grid=await window.TerrainScanData.load(p,{signal:current.signal,progress:update});check(current.signal);
  const output=await window.TerrainScan.analyze(grid,{signal:current.signal,progress:update});check(current.signal);
  results=output.results.filter(r=>r.minX>=p.halo && r.minY>=p.halo && r.maxX<p.halo+p.widthM && r.maxY<p.halo+p.heightM).map(r=>{
   const center=p.toLatLng(r.cx,r.cy);
   return {...r,center,bounds:L.latLngBounds(p.toLatLng(r.minX-.5,r.minY-.5),p.toLatLng(r.maxX+.5,r.maxY+.5)),key:`${r.type}:${center.lat.toFixed(5)},${center.lng.toFixed(5)}`};
  });
  if(scanOutline)map.removeLayer(scanOutline);
  scanOutline=L.rectangle(bounds,{color:'#d9edf4',weight:1,dashArray:'3 6',fill:false,interactive:false}).addTo(map);
  render();progress.value=100;
  message(`Scan voltooid: ${results.length} vermoedens. Rasterstap 1 m; bronresolutie varieert. ${output.candidates>150?'Alleen de 150 hoogst scorende vormen werden verwerkt. ':''}${results.length?'Controleer elk resultaat visueel.':'Geen vormen boven de detectiedrempel; dit sluit structuren niet uit.'}`);
 }catch(error){message(current.signal.aborted?'Scan geannuleerd. Eerdere resultaten blijven behouden.':`Scan mislukt: ${error.message} Eerdere resultaten blijven behouden.`);}
 finally{current.abort();if(controller===current){controller=null;busy(false);}}
};
render();
})();
