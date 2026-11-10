# Data permissions for the public interactive viewer

Reviewed 10 November 2026 against the provider sources linked below. Scope: normal interactive browser display, comparison, opacity and reprojection. This is a record of permissions and implementation choices, not a blanket legal certification or a licence for unrelated reuse. Service capacity, future terms and deployment-specific responsibilities remain separate from dataset copyright.

| Source used | Permission basis for this viewer | Credits and implementation |
| --- | --- | --- |
| Flanders DHM II 25 cm hillshade | Official metadata allow public access and direct geographic service use; the dataset remains copyrighted and subject to its metadata and the geographic-service usage right. Do not assume MIT, public domain or unrestricted raw redistribution. | Bron: Digitaal Vlaanderen; linked dataset and service terms; mandatory service privacy information shown before requests. |
| Flanders/Brussels winter aerial mosaic | Public WMTS access under Digitaal Vlaanderen's geographic-service usage right and linked dataset conditions. | Bron: Luchtopnamen Digitaal Vlaanderen; metadata and service/privacy links retained. |
| Wallonia 2021–22 hillshade and 2023 summer aerial photos | Dataset metadata specify CC BY 4.0 and public access; SPW service conditions permit free interactive viewing without disproportionate requests. | SPW, dataset names/dates, source and CC BY 4.0 links; reprojection/composite/opacity disclosed. |
| NRW hillshade and 10 cm aerial imagery | Geobasis NRW's published open-data terms apply dl-de/zero-2-0 to its geodata and services. | Geobasis NRW credit and licence/source links retained even though attribution is not a condition of the zero licence. |
| RLP 1 m hillshade and 20 cm aerial imagery | Official open-data catalogue specifies dl-de/by-2-0 for these datasets and services. | ©GeoBasis-DE / LVermGeoRP 2026; licence and provider/dataset links; [Daten bearbeitet] notice. |
| Germany basemap.de hillshade and colour street map | Published basemap.de terms specify CC BY 4.0 (alternative dl-de/by-2-0 also offered). This viewer uses CC BY 4.0. | © GeoBasis-DE / linked BKG (2026), linked CC BY 4.0; changes disclosed. |
| EOxCloudless **2016** satellite overview | The provider explicitly licenses the 2016 vintage under CC BY 4.0 and allows embedded use of its public endpoint, including commercial embedded use, subject to attribution and fair use. | Required EOxCloudless / EOX credit, modified Copernicus Sentinel data 2016 & 2017, CC BY 4.0; old capture period and coarse resolution visibly labelled. Later vintages and their non-commercial licences are not used. |
| OSM Belgium / Champs-Libres street tiles | Provider's published tile policy requires OSM licence attribution and Champs-Libres tile credit. OSM data are ODbL; service access is distinct. | Both visible credits and OSM copyright link; requests restricted to the viewer's Belgian extent; no bulk/offline feature. |
| Netherlands AHN 0.5 m DTM hillshade | AHN4 CC0; AHN5/6 CC BY 4.0; public rendering services linked by the official AHN dataroom. | AHN source/versions, licence and modified hillshade notice; Ellipsis privacy/terms; shared request pacing. |
| Netherlands aerial / BRT street | PDOK publishes the high-resolution aerial mosaic and Kadaster BRT under CC BY 4.0 for public reuse. | Samenwerkingsverband Beeldmateriaal and Kadaster / PDOK credits; cached WMTS, licence/privacy links. |
| Metropolitan France terrain, aerial and street | IGN LiDAR HD MNT, RGE ALTI, BD ORTHO and Plan IGN metadata specify Licence Ouverte 2.0; public cached GeoPlateforme WMTS. | IGN / Géoplateforme, licence, dated source consultation and linked area-specific dates; rendering changes and partial HD coverage disclosed. |
| Generalized country masks | Natural Earth explicitly releases the boundary data to the public domain. | Source/terms, simplified display-only scope; narrow boundary gaps disclosed. |
| Photon / komoot place/address search | User-triggered public demo search, one request at a time, no autocomplete or bulk requests. Service has limited capacity and no availability guarantee. | OSM / Photon credits, provider privacy link, query/IP disclosure before use. Coordinates stay local. |

## Primary sources checked

- Digitaal Vlaanderen service use and privacy: https://www.vlaanderen.be/digitaal-vlaanderen/onze-diensten-en-platformen/geografische-webdiensten/gebruiksrecht-en-privacyverklaring-geografische-webdiensten
- Flanders terrain metadata: https://www.vlaanderen.be/datavindplaats/catalogus/digitaal-hoogtemodel-ii-multidirectionale-hillshade-25-cm
- Flanders aerial WMTS metadata: https://www.vlaanderen.be/datavindplaats/catalogus/wmts-orthofotomozaiek-middenschalig-winteropnamen-kleur-meest-recent-vlaanderen
- Wallonia terrain metadata: https://geoportail.wallonie.be/catalogue/89b00953-efdb-449b-baec-1c8e7ce483b5.html
- Wallonia aerial metadata: https://geoportail.wallonie.be/catalogue/ad55c2ce-62ad-4c3c-b3cf-8fbc270a6b6e.html
- SPW service terms: https://geoportail.wallonie.be/files/documents/ConditionsSPW/LicServicesSPW.pdf
- NRW open-data service/dataset terms: https://www.bezreg-koeln.nrw.de/system/files/media/document/file/lizenzbedingungen_geobasis_nrw.pdf
- NRW terrain product: https://www.bezreg-koeln.nrw.de/geobasis-nrw/produkte-und-dienste/hoehenmodelle/digitale-gelaendemodelle/gelaendeschummerung
- NRW aerial service metadata: https://www.wms.nrw.de/geobasis/wms_nw_dop?SERVICE=WMS&REQUEST=GetCapabilities
- RLP open-data products, terms and source note: https://lvermgeo.rlp.de/geodaten-geoshop/open-data
- RLP aerial service metadata: https://geo4.service24.rlp.de/wms/rp_dop20.fcgi?SERVICE=WMS&REQUEST=GetCapabilities
- RLP terrain metadata: https://www.geoportal.rlp.de/mapbender/php/mod_showMetadata.php?id=49357&layout=tabs&resource=layer
- Basemap.de terms: https://sgx.geodatenzentrum.de/public/gdz/lizenz/deu/nutzungsbedingungen_basemapde.pdf
- EOX vintage-specific licence and required credit: https://cloudless.eox.at/license-non-commercial
- EOX explicit 2016 commercial embedded-use / fair-use guidance: https://cloudless.eox.at/documentation/faq
- EOX public service information: https://maps.eox.at/
- OSM Belgium tile policy: https://github.com/osmbe/openstreetmap-carto-be/wiki/Tile-Usage-Policy
- Photon service: https://github.com/komoot/photon ; provider privacy: https://www.komoot.com/privacy
- Licence texts: https://creativecommons.org/licenses/by/4.0/ ; https://www.govdata.de/dl-de/zero-2-0 ; https://www.govdata.de/dl-de/by-2-0

## Sources deliberately not used

The BKG nationwide DOP20 service requires a licence agreement/access arrangements: https://gdz.bkg.bund.de/index.php/default/wms-digitale-orthophotos-bodenauflosung-20-cm-wms-dop.html . Its availability as a service is not treated as permission for anonymous public use. No licensed credentials are embedded. EOX vintages from 2018 onwards are not used because their free licences restrict commercial use. No Google or Esri imagery is incorporated.

## Operating conditions reflected in the implementation

Map requests wait until Open map. Startup enables street maps only. Terrain and satellite/aerial are opt-in; shortcuts explicitly select them. Only intersecting source extents and visible tiles are requested, with browser caching and at most one delayed retry per failed tile. No prefetch, bulk download, offline pack or raw dataset redistribution feature exists. This is ordinary interactive display, not a promise of unlimited traffic rights or source availability.

The code's MIT licence and Leaflet's BSD licence are separate from the map licences. Credits, source links and display-change notices remain in the map and source panel. Users must retain relevant credits in screenshots and comply with the original licences for reuse. Provider privacy information describes third-party request/IP exposure. Hosting-specific operator/contact/logging disclosures remain the website operator's responsibility; changing a disclaimer cannot replace those disclosures or provider permission.

Wallonia terrain and aerial tiles use SPW’s public ArcGIS REST image-export endpoints under the same SPW dataset and service conditions. The image response is transparent outside actual coverage, preserving the composite fallback. Leaflet’s ordinary image loading, cancellation and bounded retry are retained. No source imagery is downloaded in bulk or rehosted.

## Netherlands and metropolitan France (reviewed 10 November 2026)

- AHN DTM: 0.5 m ground model. AHN4 CC0; AHN5 and AHN6 CC BY 4.0. Bron: Actueel Hoogtebestand Nederland. Public Ellipsis Drive services are linked by the official dataroom: https://www.ahn.nl/dataroom . The viewer requests a modified grayscale hillshade rendering (azimuth 315°, altitude 45°, exaggeration 1); newest available AHN6/5 pixels overlay AHN4. The model contains real filtered/no-data holes. Licence: https://creativecommons.org/licenses/by/4.0/ . Ellipsis service terms: https://ellipsis-drive.com/terms/ ; privacy: https://ellipsis-drive.com/privacy/ . No credentials or private datasets are used.
- Dutch aerial: Samenwerkingsverband Beeldmateriaal / PDOK, CC BY 4.0. Cached `Actueel_orthoHR` WMTS; latest complete nationwide high-resolution mosaic, 2026 release, 5–8 cm. The alias may be updated by PDOK. https://www.pdok.nl/-/hoge-resolutie-luchtfoto-2026-nu-beschikbaar-bij-pdok
- Dutch street map: Kadaster / PDOK BRT Achtergrondkaart, CC BY 4.0. https://www.kadaster.nl/zakelijk/producten/geo-informatie/brt-achtergrondkaart . PDOK conditions: https://www.pdok.nl/copyright ; privacy: https://www.pdok.nl/privacy . Cached WMTS is used instead of the more restricted aerial WMS.
- French terrain: IGN / Géoplateforme LiDAR HD MNT 50 cm, progressively published, with RGE ALTI and broader hillshade fallback. https://www.data.gouv.fr/datasets/mnt-lidar-hd ; https://www.data.gouv.fr/datasets/rge-alti-r
- French imagery and street map: IGN / Géoplateforme BD ORTHO (typically 20 cm, dates vary), https://www.data.gouv.fr/datasets/bd-ortho-r ; Plan IGN, https://www.data.gouv.fr/datasets/plan-ign . All these French datasets use Licence Ouverte / Open Licence 2.0: https://www.etalab.gouv.fr/licence-ouverte-open-licence/ . Source consulted 10 November 2026; capture/update dates are area-specific in linked metadata. Display changes include reprojection, clipping, scaling, layer combination and opacity. Coverage here is metropolitan France including Corsica, not overseas territories. HD gaps, protected-area exclusions and unissued tiles expose the available fallback.
- IGN service: cached public GeoPlateforme WMTS https://data.geopf.fr/wmts . Conditions: https://cartes.gouv.fr/cgu/ ; current limits: https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/limites-d-usage/ . Provider privacy: https://cartes.gouv.fr/donnees-personnelles/ ; https://www.ign.fr/institut/donnees-caractere-personnel . No access key is embedded.
- Natural Earth admin-0 country polygons, 1:10 million, public domain: https://www.naturalearthdata.com/about/terms-of-use/ ; source https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson . Filtered to European Netherlands and metropolitan France, with Belgium and Germany for request filtering, coordinates rounded for display. Generalized masks prevent opaque aerial no-data outside each country from hiding neighbouring sources; they can produce narrow border/coastal gaps and must not be treated as survey boundaries. These small boundary extracts are included in `js/coverage.js`; elevation/imagery databases are not included.

Only visible-area sources are attached. AHN requests share a queue of at most three active images and eight starts per second; stale requests are cancelled. Missing IGN cached tiles (404) are transparent no-data; other errors receive at most one delayed retry. No prefetch, bulk download, offline pack or raw imagery rehosting. Map attribution and privacy information identify the new providers before map requests start.
