# Belgian LiDAR Map

An independent, free static viewer comparing official Belgian and German terrain with aerial photography or an OpenStreetMap street map. No affiliation with or endorsement by the data providers.

## Run
Open `index.html` in a modern browser, or serve the folder on a static web host.
Read the provider notice and select **Open map**. Only OpenStreetMap loads initially. Select aerial imagery and terrain from the menu when needed. Internet access is required for map services.
Coordinates use latitude, longitude, for example `50.7338, 4.2345`. You can also enter a Belgian place name or address and press Search or Enter. Searches use Photon / komoot; coordinates stay local.

## Website structure
- `index.html`: controls, source credits, privacy information
- `css/styles.css`: desktop and mobile styling
- `js/map.js`: shared map
- `js/layers.js`: official imagery, terrain and OSM Belgium
- `js/comparison.js`: mouse/touch/keyboard comparison divider
- `js/app.js`: coordinate navigation and layout-aware startup
- `vendor/leaflet/`: unmodified Leaflet 1.9.4 distribution
- `licenses/Leaflet-BSD-2-Clause.txt`: retained third-party licence
- `build.mjs`: dependency-free standalone bundler

## Standalone download
Run `node build.mjs` using a supported Node.js installation.
It generates `Belgian-LiDAR-Map.html`, including Leaflet, styles, scripts and licence notices. Map imagery still needs internet access.
Regenerate this file after changing source files. Do not edit the generated file as the source of truth.

## Public GitHub / static hosting
The folder is ready for a public source repository. No account keys or backend are required.
For GitHub Pages, publish this folder with `index.html` at the site root; relative asset links also support project Pages URLs.
Keep `LICENSE`, `THIRD_PARTY_NOTICES.md`, `licenses/`, `vendor/` and the in-app credits in forks/distributions.
The application is MIT licensed; this does **not** place map imagery, OSM data or service access under MIT.

Before deploying publicly:
- Identify the website operator and provide its contact and hosting-specific privacy information (host logs, retention, processors) appropriate to the deployment.
- Review the chosen host's current terms and privacy settings. No host has been configured by this project.
- Recheck provider terms when changing sources or scaling traffic. Free access is not an unlimited-capacity or availability guarantee.
- Do not add bulk tile downloads, offline map packs, prefetching, analytics, or another geocoder without reviewing the applicable conditions.
- Retain readable, visible map attribution and include credits in screenshots.

## Data and privacy
See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the in-app **Sources, licences & privacy** panel.
Map requests only begin after **Open map**. Leaflet is served locally; no CDN, Esri basemap, CARTO basemap or Nominatim service is requested.
Providers receive IP/browser/request details and the visible map area. Coordinate input is processed locally; submitted place/address searches go to Photon / komoot, which receives the query and ordinary request information. Navigation results in ordinary map tile requests.
The app sets no cookies and uses no localStorage, tracking analytics or accounts. Map position is stored in the URL fragment.
The website host may independently process page-access logs.

## Coverage and limitations
Official aerial photography covers Flanders/Brussels and Wallonia; other countries are outside the imagery coverage.
Wallonia imagery is the explicitly labelled full-coverage 2023 summer mosaic, not a claim to the latest available imagery.
Automatic terrain displays both region-bounded services, so places near the regional boundary do not depend on a latitude guess. Provider coverage bounds overlap; transparent tiles determine the visible coverage.
Higher zoom does not increase source resolution. Provider outages, blank tiles and data inaccuracies remain possible.
The startup fix uses one map and a dedicated terrain pane above every background.

## Verification
Check initial display without panning, repeated reloads, divider dragging, opacity, terrain/background switching, coordinates and the standalone file.
Actual iPhone/Safari testing is required separately from desktop mobile-viewport testing.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md).


## German layers
Select a regional layer manually: North Rhine-Westphalia has 0.25 m hillshade with NW or NE lighting; Rhineland-Palatinate has 1 m hillshade. The Eifel shortcut opens NRW detailed terrain. The Germany shortcut opens the nationwide DGM5 overview. Automatic terrain selection remains Belgian only.
The nationwide hillshade and combined hillshade use DGM5, with approximately 6.4 m rendered pixels, and are deliberately overzoomed from zoom 14. NRW is overzoomed from 19 and RLP from 17; further zoom adds no detail. Bounds suppress requests outside service extents but do not represent exact state boundaries. Blank areas near borders remain possible.
Germany has its own optional basemap.de colour background. Belgian aerial photography does not cover Germany. German services load only when selected. All layers support the divider and opacity controls.
Place/address search currently covers Belgium; use coordinates or the German shortcuts for Germany.
