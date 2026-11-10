# Pretrained model lab · user-test beta validation

Date: 2026-11-10. Branch: `feature/scan-gebied`.

## Implemented and exercised

- Actual checksum-verified Tumulus multichannel CNN inference on CPU, with
  upstream proposal/channel helpers and explicit adapted-pipeline provenance.
- Official ADAF mound and enclosure object-detection checkpoints, strictly loaded
  into the matching TorchVision Faster R-CNN v2 architecture. No random/backbone
  weights are downloaded in place of the archaeological checkpoints.
- Loopback map/API server, explicit model installation, bounded float32 uploads,
  single-job progress polling, cancellation (including interrupted-upload race),
  failed-scan preservation and no automatic model/network startup work.
- AI/rule comparison on the same grid, separate score semantics, persistent local
  reviews/type corrections, missed-feature rectangles and source-aware exports.
- Bit-preserving float32 test packages, offline model replay and independent,
  class-aware one-to-one reference evaluation, including zero-detection misses.

## Verification results

- **22 JavaScript tests pass** (`node --test tests/*.test.cjs`), including existing
  map/tile/comparison behaviour, height decoding and alignment, model API lifecycle,
  cancellation, review persistence and DEM export bits.
- **8 Python tests pass with `RUN_MODEL_SMOKE=1`**, including live HTTP handlers,
  malformed requests, complete-grid validation, cancellation race, job concurrency,
  origin/Host/static-file boundaries, evaluator semantics and real model forwards.
- An additional **actual DOM + actual Leaflet + live local HTTP + real ADAF**
  integration test passes through jsdom 26.1.0: map opening makes no AI requests;
  selecting ADAF and comparing with rules produces separate results; popup review
  persists; mobile-mode annotation collapses/reopens the menu; test export includes
  model provenance, review, missed feature and the exact raster. This is a DOM
  integration test, not a rendered browser/device test.
- Replaying that exported synthetic raster reproduces the **same ADAF scores and
  geographic boxes** (coordinate difference <1e-9 degrees). The evaluator pipeline
  was checked against an independently positioned synthetic peak. Synthetic metrics
  are deliberately not presented as real-world archaeological accuracy.
- `node build.mjs` succeeds, regenerating the standalone HTML with all new modules.
  `git diff --check` passes. Scientific dependencies are confined to the companion.

### Numerical smoke tests

On a 320 × 320 synthetic DEM with a mound on a sloping plane, the official ADAF
mound checkpoint returns a mound candidate. On a synthetic ring earthwork the
ADAF enclosure checkpoint returns an enclosure candidate. The Tumulus adapter
classifies its matched-filter proposals and returns none on a flat DEM. Its
rejection of the synthetic Gaussian peak at the exploratory threshold is retained;
thresholds were not tuned to make the synthetic fixture look successful.

A second smoke test used four actual Mapterhorn zoom-17 tiles around the existing
viewer start region in Wallonia, sampled to a complete 320 × 320 grid at 1 m.
Heights ranged from 502.578125 to 549.578125 m. Tumulus, ADAF barrow and ADAF enclosure
all completed at threshold 0.6 without candidates in the selected 112 × 112 m
interior. This area has no independent archaeological reference labels, so zero
candidates is neither a correct-negative benchmark nor evidence of absence.
Observed CPU elapsed times were approximately 1.02, 4.47 and 3.39 seconds,
respectively, excluding terrain fetching/decoding. These are environment-specific
smoke timings, not device performance guarantees.

## Reproducible integration command

The optional DOM test needs jsdom, Node and the configured Python environment:

```bash
LIDAR_JSDOM_PATH=/path/to/jsdom \
LIDAR_TEST_PYTHON=/path/to/venv/python \
node tests/scan-dom.integration.cjs
```

Install jsdom from its official npm package in a test-only directory. It is not a
production dependency of the static viewer or companion. The test uses a synthetic
DEM to avoid provider availability being confused with UI/API correctness.

## Remaining validation for the user-test round

- No claim of rendered Chrome/Safari/iPhone/Android validation. Local system
  Chromium could not create its process-singleton socket in this environment.
  Installing the official Playwright headless shell returned a Site Unavailable
  HTML document instead of a browser ZIP. The shared browser cannot access this
  local preview. DOM tests do not replace visual layout, touch ergonomics or
  actual browser Canvas/WebP tests.
- No geographically independent, fully labelled Belgian benchmark has been
  supplied. Therefore no precision/recall improvement over the rules is claimed.
  User reviews/missed-feature suggestions are not automatically promoted to truth
  or used to retrain weights. Use separately verified, complete labels and freeze
  thresholds before evaluating geographically separate held-out areas.
- The ringfort checkpoint is an explicit optional install using the same adapter;
  its checksum is registered, but it was not downloaded or inference-tested here.
- Models cover mounds/enclosures, not all six requested classes. Remaining class
  results in comparison mode are clearly identified as rule hypotheses.
- Tumulus's adapted proposal classifier is not the author's full Romanian fusion
  pipeline. Its published performance is not transferred to this integration.
  A 1 m sampling grid does not add native source detail, and coarse fallback data
  can miss small structures. Scores are not calibrated find probabilities.

Start a first supervised user-test round with small known-positive, negative and
confusing areas, record reviews and exports, then use independent labels to decide
which model/threshold actually improves useful detections at an acceptable false
positive rate. See `companion/README.md` for the runnable workflow.
