(() => {
'use strict';
const {map,$}=window.BelgianLidar,{types,check}=window.TerrainScan;
const marks=L.layerGroup().addTo(map),manualMarks=L.layerGroup().addTo(map),feedback=new Map();
const review=window.TerrainScanReview;
let drawingMode='selection';
let selected=null,selection=null,preview=null,scanOutline=null,anchor=null,drawing=false,selectionPanelCollapsed=false,controller=null,results=[],creditAdded=false;
const status=$('scanStatus'),progress=$('scanProgress');
function message(text){status.textContent=text;}
function busy(value){
 $('scanStart').disabled=value;for(const id of ['scanEngine','scanCompare','scanThreshold','scanModelCheck','scanAnnotate','scanExport','scanExportPackage'])if($(id))$(id).disabled=value;$('scanSelect').disabled=value;$('scanScope').disabled=value;$('scanClear').disabled=value;
 $('scanCancel').hidden=!value;progress.hidden=!value;$('scanResults').setAttribute('aria-busy',String(value));
}
function endSelection(){if(selectionPanelCollapsed){$('panel').classList.remove('closed');selectionPanelCollapsed=false;}if(preview){map.removeLayer(preview);preview=null;}drawing=false;anchor=null;$('scanSelect').setAttribute('aria-pressed','false');map.getContainer().classList.remove('scan-selecting');}
function selectBounds(bounds){
 if(selection)map.removeLayer(selection);
 selected=bounds;selection=L.rectangle(bounds,{color:'#f8dc7d',weight:2,dashArray:'6 5',fillOpacity:.03,interactive:false}).addTo(map);
}
$('scanSelect').onclick=()=>{
 if(drawing){endSelection();message('Selectie geannuleerd.');return;}
 drawingMode='selection';drawing=true;anchor=null;if(window.matchMedia?.('(max-width: 600px)').matches){$('panel').classList.add('closed');selectionPanelCollapsed=true;}$('scanScope').value='selection';$('scanSelect').setAttribute('aria-pressed','true');
 map.getContainer().classList.add('scan-selecting');message('Tik twee tegenoverliggende hoeken aan op de kaart. Escape annuleert.');
};
map.on('click',event=>{
 if(!drawing)return;
 if(!anchor){anchor=event.latlng;message('Tik nu de tegenoverliggende hoek aan.');return;}
 const bounds=L.latLngBounds(anchor,event.latlng);
 if(drawingMode==='annotation'){
  try{review.addAnnotation(bounds,$('scanAnnotationType').value);L.rectangle(bounds,{color:'#ffffff',weight:2,dashArray:'2 5',fillOpacity:.1,interactive:false}).addTo(manualMarks);endSelection();message('Gemiste structuur toegevoegd als onbevestigde gebruikersannotatie. Exporteer je testpakket om deze te bewaren.');}
  catch(error){endSelection();message(error.message);}return;
 }
 selectBounds(bounds);endSelection();message('Zone geselecteerd. Druk op Scan gebied om te beginnen.');
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
 const evidence=document.createElement('p');evidence.textContent=result.scoreKind==='model'
  ? `Model: ${result.engine}. Modelscore: ${(result.score/100).toFixed(3)}; geen gekalibreerde vindkans. ${result.footprint||'Benaderende begrenzing'}.`
  : `Vormscore: ${result.score}/100; geen vindkans. Terreincontrast: ${result.relief} m; oppervlak: circa ${result.area} m².`;
 const question=document.createElement('p');question.textContent='Lijkt deze herkenning correct?';
 const row=document.createElement('div');row.className='row';
 const key=result.key;
 for(const [value,label] of [['yes','Lijkt correct'],['no','Lijkt onjuist'],['unknown','Onzeker']]) {
  const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-pressed',String((review?.rating(key)||feedback.get(key))===value));
  button.onclick=()=>{feedback.set(key,value);while(feedback.size>500)feedback.delete(feedback.keys().next().value);for(const b of row.children)b.setAttribute('aria-pressed',String(b===button));const saved=review?.rate(result,value);question.textContent=review?(saved?'Beoordeling lokaal bewaard in deze browser. Dit traint geen model.':'Opslag niet beschikbaar. Exporteer je testpakket om je beoordeling te bewaren.'):'Beoordeling bewaard voor deze sessie. Dit traint geen model.';};row.append(button);
 }
 const note=document.createElement('p');note.textContent='Vermoeden op basis van terreinvorm. Geen bevestigde vondst of datering. De markering toont een benaderende begrenzing.';
 box.append(title,detail,evidence,question,row,note);
 if(review){const correction=document.createElement('select');correction.setAttribute('aria-label','Correct vermoedelijk type');
  const empty=document.createElement('option');empty.value='';empty.textContent='Verkeerd type? Kies een correctie';correction.append(empty);
  for(const [type,data]of Object.entries(types)){const option=document.createElement('option');option.value=type;option.textContent=data.label;correction.append(option);}
  correction.onchange=()=>{if(correction.value){review.rate(result,'wrong-type',correction.value);question.textContent='Typecorrectie lokaal bewaard; geen bevestigde identificatie.';for(const b of row.children)b.setAttribute('aria-pressed','false');}};box.append(correction);
 }
 return box;
}
function render(){
 marks.clearLayers();$('scanResults').replaceChildren();
 const enabled=new Set([...filters.querySelectorAll('input:checked')].map(i=>i.value));
 const shown=results.filter(r=>enabled.has(r.type));$('scanCount').textContent=`${shown.length} van ${results.length} vermoedens zichtbaar`;
 for(const result of shown){
  const color=types[result.type].color;
  const marker=L.circleMarker(result.center,{radius:7,color:result.scoreKind==='model'?'#ffffff':'#162630',weight:2,fillColor:color,fillOpacity:1}).bindPopup(()=>popup(result),{maxWidth:320}).addTo(marks);
  L.rectangle(result.bounds,{color,weight:2,dashArray:result.scoreKind==='model'?'':'4 3',fillOpacity:.06}).bindPopup(()=>popup(result),{maxWidth:320}).addTo(marks);
  const button=document.createElement('button');button.type='button';button.className='scan-result';button.style.borderLeftColor=color;
  button.textContent=`${types[result.type].label} · ${result.scoreKind==='model'?result.engine+' '+(result.score/100).toFixed(2):'vorm '+result.score+'/100'}`;button.onclick=()=>{map.panTo(result.center);marker.openPopup();};$('scanResults').append(button);
 }
}
$('scanClear').onclick=()=>{endSelection();results=[];marks.clearLayers();manualMarks.clearLayers();review?.clear();if(scanOutline){map.removeLayer(scanOutline);scanOutline=null;}if(selection){map.removeLayer(selection);selection=null;}selected=null;render();message('Resultaten en selectie gewist.');};
$('scanCancel').onclick=()=>{if(controller){controller.abort();message('Scan wordt geannuleerd…');}};
$('scanStart').onclick=async()=>{
 if(controller)return;
 endSelection();
 const engine=$('scanEngine')?.value||'rules',compare=engine!=='rules'&&!!$('scanCompare')?.checked;
 let p,bounds;
 try {
  bounds=$('scanScope').value==='selection'?selected:map.getBounds();
  if(!bounds)throw new Error('Selecteer eerst een zone met twee hoeken op de kaart.');
  p=window.TerrainScanData.plan(bounds,{halo:engine==='rules'?16:104});
 }catch(error){message(error.message);return;}
 const current=new AbortController();controller=current;busy(true);progress.value=0;
 const update=value=>{if(current.signal.aborted)return;progress.value=Math.round(value);message(value<45?`Hoogtegegevens laden… ${Math.round(value)}%`:`Terreinvormen analyseren… ${Math.round(value)}%`);};
 try {
  // Keep visible credit while scan results or data are in use, independently of terrain visibility.
  if(!creditAdded){creditAdded=true;map.attributionControl.addAttribution('<a href="https://mapterhorn.com/attribution">© Mapterhorn · terreinbronnen</a>');}
  if(engine!=='rules'){message('Lokale AI-service controleren…');await window.TerrainScanModels.available(engine,current.signal);check(current.signal);}
  const grid=await window.TerrainScanData.load(p,{signal:current.signal,progress:update});check(current.signal);
  let output={results:[],candidates:0};
  if(engine==='rules'||compare){output=await window.TerrainScan.analyze(grid,{signal:current.signal,progress:value=>update(compare?45+(value-45)*.4:value)});check(current.signal);}
  if(engine!=='rules'){
   const modelOutput=await window.TerrainScanModels.analyze(grid,{signal:current.signal,model:engine,threshold:Number($('scanThreshold').value)||.6,progress:(value,text)=>{if(!current.signal.aborted){progress.value=Math.round(65+value*.34);message(text);}}});check(current.signal);
   output={...modelOutput,results:[...output.results.map(r=>({...r,engine:'rules',scoreKind:'shape'})),...modelOutput.results],candidates:output.candidates+modelOutput.candidates};
  }
  results=output.results.filter(r=>r.cx>=p.halo && r.cy>=p.halo && r.cx<p.halo+p.widthM && r.cy<p.halo+p.heightM).map(r=>{
   const center=p.toLatLng(r.cx,r.cy);
   return {...r,center,bounds:L.latLngBounds(p.toLatLng(r.minX-.5,r.minY-.5),p.toLatLng(r.maxX+.5,r.maxY+.5)),key:`${r.engine||'rules'}:${r.modelRevision||'morphology-v1'}:${r.type}:${center.lat.toFixed(5)},${center.lng.toFixed(5)}`};
  });
  manualMarks.clearLayers();review?.setScan({grid,bounds,results,metadata:{engine,compare,threshold:engine==='rules'?null:Number($('scanThreshold').value)||.6,modelInfo:output.modelInfo||null,details:output.details||null,warning:output.warning||'Unvalidated shape hypotheses'}});
  if(scanOutline)map.removeLayer(scanOutline);
  scanOutline=L.rectangle(bounds,{color:'#d9edf4',weight:1,dashArray:'3 6',fill:false,interactive:false}).addTo(map);
  render();progress.value=100;
  message(`Scan voltooid: ${results.length} vermoedens. ${engine==='rules'?'Vormregels':engine+(compare?' + vormregels':'')}. Rasterstap 1 m; bronresolutie varieert. ${output.candidates>150?'Per methode worden maximaal 150 resultaten getoond. ':''}${output.details?.proposalLimitReached?'Voorstellimiet bereikt; kies een kleiner gebied. ':''}${results.length?'Controleer elk resultaat visueel.':'Geen vormen boven de detectiedrempel; dit sluit structuren niet uit.'}`);
 }catch(error){message(current.signal.aborted?'Scan geannuleerd. Eerdere resultaten blijven behouden.':`Scan mislukt: ${error.message} Eerdere resultaten blijven behouden.`);}
 finally{current.abort();if(controller===current){controller=null;busy(false);}}
};
$('scanModelCheck').onclick=async()=>{
 $('scanModelCheck').disabled=true;
 try{const data=await window.TerrainScanModels.probe();$('scanModelStatus').textContent='Lokale service verbonden. Beschikbaar: '+data.models.filter(m=>m.installed).map(m=>m.name).join(', ')+'.';}
 catch(error){$('scanModelStatus').textContent=error.message;}
 finally{$('scanModelCheck').disabled=false;}
};
$('scanAnnotate').onclick=()=>{
 if(!review){message('Annotaties niet beschikbaar.');return;}
 endSelection();drawingMode='annotation';drawing=true;anchor=null;
 if(window.matchMedia?.('(max-width: 600px)').matches){$('panel').classList.add('closed');selectionPanelCollapsed=true;}
 map.getContainer().classList.add('scan-selecting');message('Tik twee hoeken van de gemiste structuur aan binnen het gescande gebied.');
};
for(const [id,includeGrid]of [['scanExport',false],['scanExportPackage',true]])$(id).onclick=()=>{try{review.exportData(includeGrid);message('Export gemaakt. Gebruikersannotaties zijn geen bevestigde vondsten.');}catch(error){message(error.message);}};
$('scanForgetReviews').onclick=()=>{review?.erase();feedback.clear();message('Bewaarde beoordelingen uit deze browser gewist.');};
render();
})();
