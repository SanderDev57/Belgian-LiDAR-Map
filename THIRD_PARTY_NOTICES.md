# Third-party software, maps and services

## Uniform backgrounds and credits — 10 November 2026

- Street map: one worldwide OpenStreetMap Standard layer, https://tile.openstreetmap.org/{z}/{x}/{y}.png . OSM data: ODbL, https://www.openstreetmap.org/copyright . Service: https://operations.osmfoundation.org/policies/tiles/ ; privacy: https://osmfoundation.org/wiki/Privacy_Policy . Keep the short credit visible on the map. Ordinary interactive viewing only, browser HTTP caching and valid Referer required; no prefetch/offline downloads. Serve the viewer over HTTP(S) for this service; a file:// document cannot supply a valid HTTP Referer.
- Satellite: one worldwide EOxCloudless 2016 mosaic (~10 m, 2016–17 imagery), CC BY 4.0; https://maps.eox.at/ and https://cloudless.eox.at/license-non-commercial . No country-specific overlays in this mode. High zoom enlarges older pixels.
- Detailed aerial imagery remains a separate opt-in composite of the official regional sources and EOX fallback. These sources retain their individual licences. All previous national street basemaps (OSM Belgium, basemap.de colour, PDOK BRT, IGN Plan IGN and ACT Carte de base) are retired; historical references below are not active services.
- Full source, licence and privacy information is on the start screen in an expandable section, reopenable with **Sources, licences & privacy**. Required active-layer credits remain visible in Leaflet's attribution control. Credits are not hidden solely by a disclaimer.
- Esri World Imagery is not integrated: the item's linked terms summary requires Esri software or an ArcGIS Online subscription for this use, https://goto.arcgis.com/termsofuse/viewsummary . Anonymous technical access is not a licence. A high-resolution uniform global service would require a separately licensed provider; no account, key or paid plan is configured.


Reviewed: 10 November 2026. Provider conditions can change. This document records the current implementation and source links; it is not a blanket legal warranty.

## Application versus data
The original application code is MIT licensed (LICENSE). The source repository contains no copies of elevation or imagery databases (only public-domain generalized country display masks); it contains no copies of the underlying map databases, aerial mosaics or elevation datasets. Linking to a service does not transfer ownership or grant unlimited service access.

## Leaflet 1.9.4
Copyright (c) 2010–2023 Volodymyr Agafonkin; copyright (c) 2010–2011 CloudMade.
BSD-2-Clause licence, reproduced in licenses/Leaflet-BSD-2-Clause.txt and the application's source panel. Unmodified distribution files and icons are in vendor/leaflet.
Upstream: https://github.com/Leaflet/Leaflet/tree/v1.9.4
The standalone build inlines the distribution and preserves its licence information.

## Digitaal Vlaanderen
Terrain:
- DHM II multidirectional hillshade, 25 cm: https://www.vlaanderen.be/datavindplaats/catalogus/digitaal-hoogtemodel-ii-multidirectionale-hillshade-25-cm
- WMTS: https://www.vlaanderen.be/datavindplaats/catalogus/wmts-digitaal-hoogtemodel-vlaanderen
- Required map credit: Bron: Digitaal Vlaanderen.

Aerial imagery:
- Most recent winter colour mosaic: https://www.vlaanderen.be/datavindplaats/catalogus/wmts-orthofotomozaiek-middenschalig-winteropnamen-kleur-meest-recent-vlaanderen
- Dataset metadata: https://www.vlaanderen.be/datavindplaats/catalogus/orthofotomozaiek-middenschalig-winteropnamen-kleur-meest-recent-vlaanderen-202504
- Required imagery credit: Bron: Luchtopnamen Digitaal Vlaanderen.

Services are publicly accessible under the geographic-web-service usage right and applicable dataset conditions; they are not relicensed under MIT or assumed to be public domain.
Service use and privacy: https://www.vlaanderen.be/digitaal-vlaanderen/onze-diensten-en-platformen/geografische-webdiensten/gebruiksrecht-en-privacyverklaring-geografische-webdiensten
Visitors see privacy information before requests start, including security logging, IP retention up to 90 days and a link to rights/controller/contact information.

## Service public de Wallonie (SPW)
- Terrain: Relief de la Wallonie – MNT 2021–2022 – Hillshade; © SPW 2021–2022.
  https://geoportail.wallonie.be/catalogue/89b00953-efdb-449b-baec-1c8e7ce483b5.html
- Imagery: Orthophotos 2023 Été; © SPW 2023.
  https://geoportail.wallonie.be/catalogue/ad55c2ce-62ad-4c3c-b3cf-8fbc270a6b6e.html
- Both datasets: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/
- Geographic visualization service terms: https://geoportail.wallonie.be/files/documents/ConditionsSPW/LicServicesSPW.pdf
- Privacy information: https://geoportail.wallonie.be/vie-privee.html

Source titles, provider credits, metadata links and licence links are displayed in the app. Services reproject images; the viewer clips/scales them and changes display opacity. No edits are made to the original datasets.
No endorsement is implied. SPW prohibits disproportionate service calls. This app uses ordinary interactive requests, browser caching and at most two delayed retries per failed tile; it has no bulk-download or prefetch feature.
The presence of ArcGIS software in an SPW endpoint does not make the map an Esri-owned World Imagery basemap: the SPW dataset/service conditions apply.

## OpenStreetMap Belgium / Champs-Libres
Data: © OpenStreetMap contributors; ODbL information: https://www.openstreetmap.org/copyright
Tiles generated by Champs-Libres: https://www.champs-libres.coop/
Tile service policy: https://github.com/osmbe/openstreetmap-carto-be/wiki/Tile-Usage-Policy
Endpoint: https://tile.openstreetmap.be/osmbe/{z}/{x}/{y}.png
Both required credits and the OSM licence link are visible when selected.
The separate tile.openstreetmap.org service is not used. OSM database rights do not impose the ODbL on this independent viewer's application code.

## Services deliberately excluded
No calls are made to Esri World Imagery, CARTO, public Nominatim, or a third-party library CDN.
Place and address search uses https://photon.komoot.io/api/ only after Search or Enter. Photon / komoot receives the submitted query and IP/browser information. Numeric coordinates are parsed locally. Search data: © OpenStreetMap contributors (ODbL). Photon service information: https://github.com/komoot/photon; provider privacy: https://www.komoot.com/privacy. The public demo has limited capacity and no availability guarantee; only one user-triggered search runs at a time, without autocomplete or bulk requests.

## Hosting
The official site at https://sanderdev57.github.io/Belgian-LiDAR-Map/ is maintained by SanderDev57 (https://github.com/SanderDev57) and hosted on GitHub Pages. Project contact: https://github.com/SanderDev57/Belgian-LiDAR-Map/issues ; this is public, so visitors should not post private information there.
GitHub receives page/asset requests before Open map and logs and stores visitors' IP addresses for security. Provider documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection . Retention policy, processing purposes, international transfers, rights and private GitHub contact options: https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement . No fixed host-log retention period is asserted by this project. The viewer adds no analytics or separate visitor database. Operators of other deployments must supply their own contact and host-specific privacy information.
A public repository does not grant permission to overload providers, remove credits, resell imagery or ignore future service changes.


## German terrain and background (reviewed 10 November 2026)
- Nationwide hillshade and combined hillshade: https://sgx.geodatenzentrum.de/wms_basemapde_schummerung
- Colour background: https://sgx.geodatenzentrum.de/wms_basemapde
- © GeoBasis-DE / BKG (2026), CC BY 4.0. BKG: https://www.bkg.bund.de ; licence: https://creativecommons.org/licenses/by/4.0/
- Product: https://basemap.de/produkte-und-dienste/web-raster-schummerung/
- Terms: https://sgx.geodatenzentrum.de/public/gdz/lizenz/deu/nutzungsbedingungen_basemapde.pdf
- NRW 0.25 m hillshade, NW lighting: https://www.wms.nrw.de/geobasis/wms_nw_dgm-schummerung
- Geobasis NRW, dl-de/zero-2-0: https://www.govdata.de/dl-de/zero-2-0
- Product: https://www.bezreg-koeln.nrw.de/geobasis-nrw/produkte-und-dienste/hoehenmodelle/digitale-gelaendemodelle/gelaendeschummerung
- RLP 1 m hillshade: https://geo4.service24.rlp.de/wms/shade1m.fcgi
- ©GeoBasis-DE / LVermGeoRP 2026, dl-de/by-2-0, https://www.lvermgeo.rlp.de [Daten bearbeitet]. Licence: https://www.govdata.de/dl-de/by-2-0
- Metadata: https://www.geoportal.rlp.de/mapbender/php/mod_showMetadata.php?id=49357&layout=tabs&resource=layer
- Source conditions: https://lvermgeo.rlp.de/geodaten-geoshop/open-data
Changes in display: reprojection, clipping, scaling and opacity only; source datasets are not edited. Providers receive requests and IP/browser details when their layer is selected. No prefetching or bulk downloads. See in-app provider privacy links.

## Combined imagery and source selection
Automatic terrain overlays the connected finer regional sources on the German overview. Only visible-area services are attached. Transparency exposes lower sources; pane opacity affects the composite once. This is a display combination, not a transfer of dataset ownership.
NRW aerial: https://www.wms.nrw.de/geobasis/wms_nw_dop , layer nw_dop_rgb, 10 cm; Geobasis NRW, dl-de/zero-2-0. Provider terms: https://www.bezreg-koeln.nrw.de/system/files/media/document/file/lizenzbedingungen_geobasis_nrw.pdf
RLP aerial: https://geo4.service24.rlp.de/wms/rp_dop20.fcgi , layer rp_dop20, 20 cm; ©GeoBasis-DE / LVermGeoRP 2026, dl-de/by-2-0, https://www.lvermgeo.rlp.de [Daten bearbeitet]. Official source and reuse terms: https://lvermgeo.rlp.de/geodaten-geoshop/open-data

## EOX satellite fallback — 2016 vintage only
EOxCloudless https://cloudless.eox.at by EOX IT Services GmbH https://eox.at (Contains modified Copernicus Sentinel data 2016 & 2017). CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
Service: https://tiles.maps.eox.at/wmts/1.0.0/WMTSCapabilities.xml ; layer s2cloudless_3857, GoogleMapsCompatible. Native imagery is an approximately 10 m, older satellite mosaic; the viewer enlarges it at high zoom. It is not current aerial photography.
The 2016 product's specific licence permits embedded public interactive viewing with attribution, including commercial embedded use. Later vintages are not used: their non-commercial restrictions do not apply to the selected 2016 layer. Licence and attribution: https://cloudless.eox.at/license-non-commercial ; service / fair-use guidance: https://cloudless.eox.at/documentation/faq ; https://maps.eox.at/ . No uptime guarantee, bulk use or standalone raw tile redistribution is assumed.
The source provider receives IP/browser and tile requests only when satellite/aerial is selected and the viewed area intersects the viewer's coverage. Privacy: https://eox.at/privacy-notice/

## Scope of the permission review
See DATA_PERMISSIONS.md. Reviewed for this application's ordinary public interactive display, on 10 November 2026. This does not declare every source public domain, grant unlimited service traffic, or license raw data extraction under MIT. Operator-specific hosting disclosures remain the deployer's responsibility.

Wallonia terrain and aerial tiles use SPW’s public ArcGIS REST image-export endpoints under the same SPW dataset and service conditions. The image response is transparent outside actual coverage, preserving the composite fallback. Leaflet’s ordinary image loading, cancellation and bounded retry are retained. No source imagery is downloaded in bulk or rehosted.

## Netherlands and metropolitan France (reviewed 10 November 2026)

- AHN DTM: 0.5 m ground model. AHN4 CC0; AHN5 and AHN6 CC BY 4.0. Bron: Actueel Hoogtebestand Nederland. Public Ellipsis Drive services are linked by the official dataroom: https://www.ahn.nl/dataroom . The viewer requests a modified grayscale hillshade rendering (azimuth 315°, altitude 45°, exaggeration 1); newest available AHN6/5 pixels overlay AHN4. The model contains real filtered/no-data holes. Licence: https://creativecommons.org/licenses/by/4.0/ . Ellipsis service terms: https://ellipsis-drive.com/terms/ ; privacy: https://ellipsis-drive.com/privacy/ . No credentials or private datasets are used.
- Dutch aerial: Samenwerkingsverband Beeldmateriaal / PDOK, CC BY 4.0. Cached `Actueel_orthoHR` WMTS; latest complete nationwide high-resolution mosaic, 2026 release, 5–8 cm. The alias may be updated by PDOK. https://www.pdok.nl/-/hoge-resolutie-luchtfoto-2026-nu-beschikbaar-bij-pdok
- Dutch street map: Kadaster / PDOK BRT Achtergrondkaart, CC BY 4.0. https://www.kadaster.nl/zakelijk/producten/geo-informatie/brt-achtergrondkaart . PDOK conditions: https://www.pdok.nl/copyright ; privacy: https://www.pdok.nl/privacy . Cached WMTS is used instead of the more restricted aerial WMS.
- French terrain: IGN / Géoplateforme LiDAR HD MNT 50 cm, progressively published, with RGE ALTI and broader hillshade fallback. https://www.data.gouv.fr/datasets/mnt-lidar-hd ; https://www.data.gouv.fr/datasets/rge-alti-r
- French imagery and street map: IGN / Géoplateforme BD ORTHO (typically 20 cm, dates vary), https://www.data.gouv.fr/datasets/bd-ortho-r ; Plan IGN, https://www.data.gouv.fr/datasets/plan-ign . All these French datasets use Licence Ouverte / Open Licence 2.0: https://www.data.gouv.fr/pages/legal/licences/etalab-2-0 . Source consulted 10 November 2026; capture/update dates are area-specific in linked metadata. Display changes include reprojection, clipping, scaling, layer combination and opacity. Coverage here is metropolitan France including Corsica, not overseas territories. HD gaps, protected-area exclusions and unissued tiles expose the available fallback.
- IGN service: cached public GeoPlateforme WMTS https://data.geopf.fr/wmts . Conditions: https://cartes.gouv.fr/cgu/ ; current limits: https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/limites-d-usage/ . Provider privacy: https://cartes.gouv.fr/donnees-personnelles/ ; https://www.ign.fr/institut/donnees-caractere-personnel . No access key is embedded.
- Natural Earth admin-0/admin-1 country and region polygons, 1:10 million, public domain: https://www.naturalearthdata.com/about/terms-of-use/ ; source https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson and https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_1_states_provinces.geojson . Filtered to European Netherlands and metropolitan France, with Belgium, Germany, Luxembourg and connected regional footprints for request filtering, coordinates rounded for display. Generalized masks prevent opaque aerial no-data outside each country from hiding neighbouring sources; they can produce narrow border/coastal gaps and must not be treated as survey boundaries. These small boundary extracts are included in `js/coverage.js`; elevation/imagery databases are not included.

Only visible-area sources are attached. The shared scheduler and recovery policy are described below. Missing French LiDAR HD cached tiles (404) are transparent no-data. No prefetch, bulk download, offline pack or raw imagery rehosting. Provider attribution and privacy information remain visible before requests start.

## Luxembourg (reviewed 10 November 2026)

- Terrain: ACT / Geoportail.lu, BD-L-Lidar2024 MNT ground hillshade; 50 cm source elevation model, 2024 survey. CC0: https://data.public.lu/fr/datasets/lidar-2024-releve-3d-du-territoire-luxembourgeois/ . The public WMS advertises layer `2978` (Ombrage MNT 2024): https://wms.geoportail.lu/public_map_layers/service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities . No point cloud or large GeoTIFF is copied into the viewer. We display the public provider rendering as supplied, including any no-data or generalization; no restricted layer or credentials are used. The older 2019 coloured public MNT is not presented as the 2024 hillshade.
- Aerial imagery: ACT / Geoportail.lu `ortho_2025`, summer 2025; CC0 open-data service: https://data.public.lu/fr/datasets/bd-l-ortho-webservices-wms-et-wmts/ . Cached WMTS: https://wmts1.geoportail.lu/opendata/wmts/1.0.0/WMTSCapabilities.xml ; matrix set `GLOBAL_WEBMERCATOR_4_V3`, zero-padded matrix identifiers below zoom 10.
- Street basemap: ACT Carte de base, CC0: https://data.public.lu/fr/datasets/carte-de-base-webservices-wms-et-wmts/ . Same open-data WMTS, layer `basemap`, matrix set `GLOBAL_WEBMERCATOR`.
- Visible credits identify ACT / Geoportail.lu and CC0 even though CC0 does not require attribution. Reprojection, scaling, opacity, source combination and generalized country clipping are display changes; original source datasets are not edited. The Natural Earth public-domain country extract now includes Luxembourg.
- Public interactive service use and provider privacy information: https://www.geoportail.lu/en/about-us/terms-conditions/ . Avoid abusive workloads. Providers receive IP/browser and tile/view coordinates; this is disclosed before Open map. Dataset CC0 permissions do not imply unlimited service capacity. Operator-specific hosting/privacy duties remain separate.

## Loading and recovery

All map sources now share a visible-tile scheduler: at most eight active requests overall, at most three per provider, and at most two for AHN, SPW and the Luxembourg WMS. AHN starts remain at most eight per second. Background requests have queue priority. A request times out after 20 seconds; transient failures receive at most two delayed retries (about 1.2 and 3.5 seconds, with jitter). Retries revalidate only the failed URL using a stable retry parameter. Repeated failures slow that provider; HTTP Retry-After is respected by fetched IGN tiles. Panning, zooming, source changes and unload cancel obsolete queued/in-flight work. The queue pauses offline and resumes online. A visitor can retry remaining visible failures; completed tiles are not bulk-refetched. Failure indicators clear when failed tiles leave the view or subsequently load. French LiDAR HD cached 404/204 responses are transparent no-data with a bounded five-minute in-memory negative cache (maximum 512 entries), retaining lower terrain sources. No raw-data download, offline pack, speculative prefetch or service-worker cache is added.

France HD and the newer AHN5/6 sources activate from zoom 12; French high-resolution fallback activates from zoom 11. Their broader connected terrain remains beneath them. Automatic selection still puts the finest connected available source on top at detail zooms. All national/regional backgrounds are geographically clipped, so opaque out-of-area pixels cannot hide neighbouring maps at overview zooms. Generalized edges can have narrow gaps and are not survey boundaries.

Complete French basemaps, aerial and fallback terrain use ordinary image loading through the shared scheduler, avoiding a CORS requirement. Only progressively published LiDAR HD uses fetched tiles to distinguish missing coverage (404/204) from service failures.

## On-demand numerical terrain scans · Mapterhorn

`Scan gebied` retrieves Terrarium-encoded 512 px WebP numerical elevation tiles
from `https://tiles.mapterhorn.com/{z}/{x}/{y}.webp`, at zoom 17. These are elevation
values, not interpreted hillshade colours. The single-tile endpoint is explicitly
published at https://mapterhorn.com/data-access/ . The viewer requests only the
chosen area plus a 16 m analysis margin (104 m for pretrained models): maximum 600 × 600 m, 36 tiles, two concurrent
requests, a 20 second request timeout and eight decoded tiles in memory. No bulk
extraction, background scan, persistent tile store or offline pack is added.

Retain the scan attribution linking to https://mapterhorn.com/attribution/ .
Underlying datasets keep their own licences, not the application's MIT licence.
The provider's full source/producer/licence list is available at
https://download.mapterhorn.com/attribution.json . Checked 2026-11-10, including:

- **Digitaal Hoogtemodel Vlaanderen II, DTM, raster, 1 m**, agentschap Digitaal
  Vlaanderen: Model license for free reuse (source `beflanders`).
- **Relief de la Wallonie - MNT 2021–2022**, Service public de Wallonie (SPW):
  CC BY 4.0, 0.5 m (source `bewallonie`).
- **LiDAR 2019 MNT**, Administration du cadastre et de la topographie Luxembourg:
  CC0, 0.5 m (source `lu`). This is independent of the viewer's newer imagery layer.
- Netherlands' listed **AHN5 5 m**, AHN.nl: CC BY 4.0
  (`nlahn5lowresfilled`). Other countries and source footprints can use coarser
  fallback data. Displayed terrain tiles and scan data are separate sources.

The provider receives request/IP details and tile coordinates only when the user
starts a scan. User feedback is retained only in localStorage in the current browser (up to 1,000 reviews);
it is not transmitted or used to train a model and can be erased. An explicit
test export can include the raw bounded DEM, scan metadata and review coordinates. Candidate output is an unvalidated
morphological hypothesis, not evidence of archaeological identity, age or absence.

## Pretrained model lab · Tumulus and ADAF

### Tumulus detector

Source: https://github.com/ObuObuHub/tumulus-lidar-detector , pinned at
`70ea999bc274db9aab11798737eb68a4c4a31352`.
Author: Chiper-Leferman Andrei. Numerical helpers (`lib_channels.py`,
`lib_tumul.py`) are vendored under MIT; fingerprint and pretrained weights retain
the upstream CC BY 4.0 attribution. The original notice is retained in
`licenses/Tumulus-MIT-and-CC-BY-4.0.txt`. Vendored numerical helpers are unchanged;
our surrounding inference adapter is new. Renamed bundled assets:

- `companion/models/tumulus-multichannel.pt` = `multichannel_cnn.pt`;
  SHA-256 `08df9120a68bada89105229a1c07f8ed5c50fe9108409e8dc23b1574975af376`.
- `companion/models/tumulus-single.pt` = `combined_cnn.pt`;
  SHA-256 `f4eecca0def383b3937bf913bc06986886e8d54be828cab9dd261ff649f8e4a5`.

This project adapts the original proposal/channel recipes and reports raw CNN
scores. It does not reproduce the complete Romanian fusion/filter pipeline or
claim its reported benchmark results. The single-channel asset is retained for
reproducibility; the map currently uses the multichannel model.

### ADAF

Original project: https://github.com/EarthObservation/adaf , inspected at
`a44acdd678773666458ea50f544b5d2292bcef51`.
Code is Apache-2.0; original notice retained in `licenses/ADAF-Apache-2.0.txt`.
Official checkpoints: https://zenodo.org/records/15848663 , version 1.0.0.
The official record's API metadata identifies model weights as CC BY-SA 4.0.
Authors: Ana Kostovska, Dragi Kocev, Nejc Čož, Žiga Kokalj, Susan Curran and
Anthony Corns; copyright © 2025 ZRC SAZU and Bias Variance Labs.

ADAF weights are downloaded only by an explicit setup command, with the published
MD5 verified, and are not committed to this repository. Our CPU adapter follows
ADAF's object-detection architecture and SLRM preprocessing but omits the full
AiTLAS/GDAL application. No converted or fine-tuned ADAF checkpoint is distributed.
Keep original attribution/licensing with any redistribution or adapted model.
These notices do not change underlying terrain data licences.

The optional companion receives only the explicitly requested DEM over loopback;
it does not send rasters or reviews to an external AI service. Models were not
validated for Belgian historical identification or dating. Exported user reviews
are not independently confirmed training labels. Local/browser exports retain
source/model provenance and should not be confused with validated ground truth.
