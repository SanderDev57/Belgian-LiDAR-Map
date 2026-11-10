# Local model lab · user-test beta

This optional companion runs the actual pretrained models on your computer. The
static website and shape-rule scan still work without it. It is a user-testing
workflow, not a validated archaeological detector for Belgium.

## Windows: first setup

Install **Python 3.12 (64-bit)**. Open a terminal in the repository root:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --index-url https://download.pytorch.org/whl/cpu torch==2.6.0 torchvision==0.21.0
.\.venv\Scripts\python.exe -m pip install -r companion/requirements.txt
```

The small Tumulus weights are bundled. To add ADAF's official mound model:

```powershell
.\.venv\Scripts\python.exe companion/setup_models.py adaf-barrow
```

Optional additional checkpoints:

```powershell
.\.venv\Scripts\python.exe companion/setup_models.py adaf-enclosure
.\.venv\Scripts\python.exe companion/setup_models.py adaf-ringfort
```

Each ADAF download is approximately 518 MB. Downloads are explicit and resumable;
published checksums are verified. Files with a wrong checksum are rejected.
Do not rename checkpoints or load arbitrary weights from the internet.

## Start the map

Double-click **start-scan-lab.cmd**, or run:

```powershell
.\.venv\Scripts\python.exe companion/server.py
```

Open **http://127.0.0.1:8765** in your browser and leave the terminal open.
Use this map address for AI tests, rather than Live Server or GitHub Pages.
No external AI account, API key or GPU is needed. CPU processing can be slower.
Stop with Ctrl+C. Change the port with `--port 8766` if necessary.

Linux/macOS: create the virtual environment using `python3.12 -m venv .venv`,
then substitute `.venv/bin/python` for `.\.venv\Scripts\python.exe` above. The CPU
PyTorch index command is appropriate for supported Windows/Linux wheels; on
macOS install `torch==2.6.0 torchvision==0.21.0` from the normal PyPI index.

## A useful first test

1. Open the map; choose a small area, initially around **100–200 m across**.
2. Under **Scan gebied**, click **Controleer lokale AI-service**. It lists
   installed checkpoints. Missing models produce installation instructions;
   they never silently fall back to shape rules.
3. Select Tumulus or ADAF and enable **Vergelijk AI met vormregels**. Start the
   scan. Model scores and shape scores remain separate. Models only cover the
   classes printed in their names; trenches/roads/craters/buildings remain
   shape-rule hypotheses in comparison mode.
4. AI markers have a white outline and solid boxes; rules have a dark outline
   and dashed boxes. The result list identifies each engine. Open a result and
   choose correct, incorrect, uncertain, or a corrected type.
5. Add a missed feature with **Duid gemiste structuur aan**, choosing its type
   and two opposite corners within the scanned area. These are user suggestions,
   not confirmed historical identifications.
6. Export **GeoJSON** for GIS inspection or **testpakket + hoogteraster** to keep
   the exact raster, provenance, threshold, results and reviews for replay. Export
   before scanning a new area: raw rasters/manual annotations are not retained
   across scans. Per-detection reviews remain in this browser until erased.

Maximum selected area: 600 × 600 m; minimum 30 × 30 m. Model scans retrieve an
additional 104 m context margin, at most 36 tiles and two concurrent requests.
The 1 m sample step is independent of native source resolution. Incomplete or
implausible DEMs are rejected, rather than filled with invented terrain.

Try positive areas, ordinary negative areas and confusing recent/natural forms.
Keep test areas geographically separate from future training areas. First tune
thresholds on development areas, then freeze them before an independent test.
A high model score or a user vote does not establish a feature's identity or age.

## Replay without further terrain downloads

```powershell
.\.venv\Scripts\python.exe companion/replay.py lidar-scan-test-package.json --model adaf-barrow --threshold 0.6 --output adaf-results.geojson
```

Use a package exported from model/comparison mode (104 m context margin).
A shape-only package has insufficient context for this model workflow and is
rejected. Replay reads the exported float32 values; it does not re-fetch tiles.

## Measure quality with independent references

Prepare a GeoJSON FeatureCollection with Point or Polygon geometries in WGS84.
Each independently verified reference object needs:

```json
{"type":"Feature","geometry":{"type":"Point","coordinates":[5.0,50.0]},"properties":{"type":"mound","verified":true}}
```

This coordinate is a format example, not a known site. Supported types are
`mound`, `enclosure`, `trench`, `crater`, `building`, `road`. Ordinary browser
reviews/manual suggestions deliberately lack `verified:true` and cannot directly
be used as ground truth. References must cover the same area completely.

```powershell
.\.venv\Scripts\python.exe companion/evaluate.py confirmed-reference.geojson lidar-scan-results.geojson --match-metres 20 --area-km2 0.04 --output metrics.json
```

The evaluator uses class-aware, one-to-one centre-distance matching and reports
precision, recall, F1 and false positives/km² separately for each engine. Duplicate
predictions count as false positives. Pretrained engines are evaluated only on
their supported classes; they are not penalised for classes they cannot predict.
The 20 m match distance is a configurable test protocol, not a claimed accuracy.
This is centre-based detection evaluation, not segmentation IoU or dating.
Files with no predictions still declare `scanEngines`, so all relevant misses
are counted. Do not mix model scores with shape scores into a single ranking.

## Model details and adaptations

- **Tumulus:** original four-channel CNN weights by Chiper-Leferman Andrei,
  upstream revision `70ea999bc274db9aab11798737eb68a4c4a31352`. We retain the
  upstream 2 m multi-scale matched-filter proposals and numerical channel recipes:
  hillshade, SLRM, slope, roughness; 80 m context, nine offsets, 128 px stamps.
  At most 100 ranked proposals are classified per area; limit warnings are shown.
  We report the maximum raw CNN score. The upstream Romanian fusion/post-filter
  system and its published operating figures are **not** reproduced here.
  Footprints are approximate. Mounds outside the proposal set can be missed.
- **ADAF:** official object-detection checkpoint, Faster R-CNN ResNet50-FPN v2,
  loaded strictly into TorchVision with no additional pretrained download.
  Preprocessing follows the upstream 10 m SLRM radius, fixed [-0.5,+0.5] stretch,
  RGB channel replication, 512 px patches; overlap is consolidated with IoU 0.3
  NMS. This lightweight CPU adapter omits AiTLAS/GDAL/UI dependencies. It is not
  the full ADAF application. Original code and checkpoints remain separately
  licensed. See the model notices and main THIRD_PARTY_NOTICES.md.

Neither model was trained on the browser reviews. There is no automatic training,
no calibrated Belgian find probability and no evidence of improved Belgian
precision/recall yet. This beta makes those comparisons possible and reproducible.

## Local service and privacy

The server binds only to 127.0.0.1 and accepts only its own localhost/127.0.0.1
origin and Host header. It does not expose an externally reachable API. Only
allowlisted static app files are served; model files, Git metadata and local
exports are not served. Requests are size/dimension limited. One model job runs
at a time; its progress/results remain in memory (up to 16 jobs, 30 min access).
Cancellation is cooperative between model passes; a CPU forward already in
progress finishes before the worker stops. Cancelled results are discarded.
No raw rasters or feedback are written to the server's disk. Model installs are
separate explicit commands. Checkpoints are checksum-verified and loaded with
`weights_only=True`; there is no unsafe pickle fallback.

Normal map/elevation providers still receive the requests you make. Browser
reviews use localStorage (up to 1,000). Exports include coordinates and potentially
raw DEM data and retain the terrain/model source attribution. You decide whether
to share them. See the main source/licence notices before redistributing assets.

## Verification

```powershell
node --test tests/*.test.cjs
.\.venv\Scripts\python.exe -m unittest discover -s companion -p "test_*.py"
```

To exercise actual installed weights as well:

```powershell
$env:RUN_MODEL_SMOKE="1"
.\.venv\Scripts\python.exe -m unittest discover -s companion -p "test_*.py"
```

This includes a synthetic numerical smoke test, not a Belgian accuracy benchmark.
See `../MODEL_LAB_VALIDATION.md` for observed validation and remaining limits.
