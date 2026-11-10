# Belgian LiDAR Map

An independent, free static viewer comparing official Belgian, German, Dutch and French terrain with aerial photography or an OpenStreetMap street map. No affiliation with or endorsement by the data providers.

## Run
Open `index.html` in a modern browser, or serve the folder on a static web host.
Read the provider notice and select **Open map**. Only the local street-map sources load initially. Select aerial imagery and terrain from the menu when needed. Internet access is required for map services.
Coordinates use latitude, longitude, for example `50.7338, 4.2345`. You can also enter a place name or address in the Belgium/Germany/Netherlands/metropolitan France region and press Search or Enter. Searches use Photon / komoot; coordinates stay local.

## Website structure
- `index.html`: controls, source credits, privacy information
- `css/styles.css`: desktop and mobile styling
- `js/map.js`: shared map
- `js/coverage.js`: public-domain country display masks and viewport intersection
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

## Automatic terrain and imagery
Select **Automatic · finest connected detail** once. The viewer combines connected sources without jumping or requiring a regional selection: French broader terrain below French LiDAR HD 0.5 m (where published), Dutch AHN4/5/6 0.5 m (newest available pixels on top), and German DGM5 overview below RLP 1 m, Wallonia 0.5 m, Flanders 0.25 m and NRW 0.25 m hillshade. Transparent edges reveal the lower source, so overlapping bounding rectangles no longer cause blank state selections. "Finest" means the finest connected source with available pixels, not every dataset that might exist. This update does not claim sub-metre terrain everywhere in Germany.
Only sources whose bounds intersect the viewport are attached. Panning updates coverage, credits and comparison clipping. Overzoom does not create source detail. Composite opacity is applied once to the terrain pane to avoid double blending in overlaps. Existing vertical and horizontal comparison modes remain available.
**Satellite / aerial** combines EOX's older 2016–17 satellite overview with official Belgian aerial photos, NRW 10 cm aerial photos RLP 20 cm aerial photos, Dutch PDOK 5–8 cm imagery and French IGN BD ORTHO (typically 20 cm). The detailed sources sit above the overview; transparent gaps reveal it. Outside connected aerial regions the image is an older, roughly 10 m satellite overview, visibly labelled in the menu. Wallonia remains the labelled 2023 summer mosaic; other providers have varying capture dates. Imagery is not live.
Street maps combine OSM Belgium / Champs-Libres with basemap.de for Germany, PDOK BRT for the Netherlands and IGN Plan IGN for metropolitan France. Only street maps load on startup. Terrain and imagery are enabled by the visitor. Eifel, Germany, Netherlands and France shortcuts enable automatic terrain and satellite/aerial comparison. Place/address search covers the wider Belgium/Germany/Netherlands/metropolitan France region; coordinates remain local.

## Data permissions and service use
See [DATA_PERMISSIONS.md](DATA_PERMISSIONS.md) for the dated source-by-source review, and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution, source, service and privacy links. A disclaimer cannot override provider conditions. Data are not relicensed under the application's MIT licence.
The EOX **2016** vintage was selected deliberately: it permits this embedded use under CC BY 4.0, whereas later vintages have non-commercial restrictions. The licensed BKG nationwide DOP20 service is not used. Public services offer no uptime guarantee. Ordinary browser caching, visible-area requests and one delayed retry per failed tile are used; no bulk download, prefetching or offline map packs.

## Verification
Rebuild using `node build.mjs`. Check startup before/after Open map; Belgium, NRW, RLP and Germany outside those states, Dutch AHN4/5/6 regions, French HD and fallback areas; panning across borders; fallback through transparent source pixels; both comparison directions; composite opacity; source errors; geocoding; and the standalone build. Actual iPhone/Safari testing remains a separate device check.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md).

Wallonia terrain and aerial tiles use SPW’s public ArcGIS REST image-export endpoints under the same SPW dataset and service conditions. The image response is transparent outside actual coverage, preserving the composite fallback. Leaflet’s ordinary image loading, cancellation and bounded retry are retained. No source imagery is downloaded in bulk or rehosted.

## Netherlands and metropolitan France (reviewed 10 November 2026)

- AHN DTM: 0.5 m ground model. AHN4 CC0; AHN5 and AHN6 CC BY 4.0. Bron: Actueel Hoogtebestand Nederland. Public Ellipsis Drive services are linked by the official dataroom: https://www.ahn.nl/dataroom . The viewer requests a modified grayscale hillshade rendering (azimuth 315°, altitude 45°, exaggeration 1); newest available AHN6/5 pixels overlay AHN4. The model contains real filtered/no-data holes. Licence: https://creativecommons.org/licenses/by/4.0/ . Ellipsis service terms: https://ellipsis-drive.com/terms/ ; privacy: https://ellipsis-drive.com/privacy/ . No credentials or private datasets are used.
- Dutch aerial: Samenwerkingsverband Beeldmateriaal / PDOK, CC BY 4.0. Cached `Actueel_orthoHR` WMTS; latest complete nationwide high-resolution mosaic, 2026 release, 5–8 cm. The alias may be updated by PDOK. https://www.pdok.nl/-/hoge-resolutie-luchtfoto-2026-nu-beschikbaar-bij-pdok
- Dutch street map: Kadaster / PDOK BRT Achtergrondkaart, CC BY 4.0. https://www.kadaster.nl/zakelijk/producten/geo-informatie/brt-achtergrondkaart . PDOK conditions: https://www.pdok.nl/copyright ; privacy: https://www.pdok.nl/privacy . Cached WMTS is used instead of the more restricted aerial WMS.
- French terrain: IGN / Géoplateforme LiDAR HD MNT 50 cm, progressively published, with RGE ALTI and broader hillshade fallback. https://www.data.gouv.fr/datasets/mnt-lidar-hd ; https://www.data.gouv.fr/datasets/rge-alti-r
- French imagery and street map: IGN / Géoplateforme BD ORTHO (typically 20 cm, dates vary), https://www.data.gouv.fr/datasets/bd-ortho-r ; Plan IGN, https://www.data.gouv.fr/datasets/plan-ign . All these French datasets use Licence Ouverte / Open Licence 2.0: https://www.etalab.gouv.fr/licence-ouverte-open-licence/ . Source consulted 10 November 2026; capture/update dates are area-specific in linked metadata. Display changes include reprojection, clipping, scaling, layer combination and opacity. Coverage here is metropolitan France including Corsica, not overseas territories. HD gaps, protected-area exclusions and unissued tiles expose the available fallback.
- IGN service: cached public GeoPlateforme WMTS https://data.geopf.fr/wmts . Conditions: https://cartes.gouv.fr/cgu/ ; current limits: https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/limites-d-usage/ . Provider privacy: https://cartes.gouv.fr/donnees-personnelles/ ; https://www.ign.fr/institut/donnees-caractere-personnel . No access key is embedded.
- Natural Earth admin-0 country polygons, 1:10 million, public domain: https://www.naturalearthdata.com/about/terms-of-use/ ; source https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson . Filtered to European Netherlands and metropolitan France, with Belgium and Germany for request filtering, coordinates rounded for display. Generalized masks prevent opaque aerial no-data outside each country from hiding neighbouring sources; they can produce narrow border/coastal gaps and must not be treated as survey boundaries. These small boundary extracts are included in `js/coverage.js`; elevation/imagery databases are not included.

Only visible-area sources are attached. AHN requests share a queue of at most three active images and eight starts per second; stale requests are cancelled. IGN requests share at most six active fetches, with cancellation and a 30-second timeout. Missing IGN cached tiles (404) are transparent no-data; other errors receive at most one delayed retry. No prefetch, bulk download, offline pack or raw imagery rehosting. Map attribution and privacy information identify the new providers before map requests start.
