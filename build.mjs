import {readFile,writeFile} from 'node:fs/promises';
const root = new URL('./',import.meta.url);
const read = file => readFile(new URL(file,root),'utf8');
let html = await read('index.html');
let leafletCss = await read('vendor/leaflet/leaflet.css');
for(const image of ['layers.png','layers-2x.png','marker-icon.png','marker-icon-2x.png','marker-shadow.png']) {
 const data = await readFile(new URL('vendor/leaflet/images/'+image,root));
 leafletCss = leafletCss.replaceAll('images/'+image,'data:image/png;base64,'+data.toString('base64'));
}
html = html.replace('<link rel="stylesheet" href="vendor/leaflet/leaflet.css">',() => '<style>\n'+leafletCss+'\n</style>');
const stylesheet = await read('css/styles.css');
html = html.replace('<link rel="stylesheet" href="css/styles.css">',() => '<style>\n'+stylesheet+'\n</style>');
for(const file of ['vendor/leaflet/leaflet.js','js/map.js','js/coverage.js','js/tiles.js','js/layers.js','js/comparison.js','js/app.js','js/scan-core.js','js/scan-data.js','js/scan.js']) {
 const code = (await read(file)).replace(/\/\/# sourceMappingURL=[^\r\n]*/g,'');
 const scriptTag = new RegExp('<script src="'+file.replaceAll('.', '\\.')+'(?:\\?[^"]*)?"></script>');
 html = html.replace(scriptTag,() => '<script>\n'+code+'\n</script>');
}
const licence = await read('LICENSE');
html = html.replace('<!doctype html>','<!doctype html>\n<!-- Original application code licence:\n'+licence+'\n-->');
// Protect the downloadable file against accidental missing assets after template edits.
if(/(?:src|href)="(?:js|css|vendor)\//.test(html)) throw new Error('Unbundled local asset remains');
await writeFile(new URL('Belgian-LiDAR-Map.html',root),html);
console.log('Built Belgian-LiDAR-Map.html');

