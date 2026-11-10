# Scan gebied validation · 2026-11-10

Branch: `feature/scan-gebied`. Based on main commit `f8a4055`.

## Automated verification

Run `node --test tests/*.test.cjs` and `node build.mjs`.

- Existing coverage, tile lifecycle, map/comparison and performance tests pass.
- Numerical synthetic fixtures cover crater, mound, trench, road, circular wall
  and rectangular wall on a sloping plane. All six requested morphology labels
  are produced. A featureless sloping plane yields no detections.
- Scores remain bounded, missing data fails safely, and cancellation interrupts
  analysis. Strong shapes can produce neighbouring residual lobes; nested
  duplicate footprints are suppressed, but false positives remain possible.
- Data tests verify Terrarium decoding, sample coordinates across tile seams,
  two-request concurrency, region/size limits, cache reuse and fetch cancellation.
- UI lifecycle tests use DOM/map doubles: no automatic data load, custom rectangle
  selection, markers/popups, filtering, session feedback, failed rerun preserving
  results, cancellation preserving results, clear and Escape.
- The standalone bundle is regenerated and contains the same scan modules.

## Live data verification

Four actual Mapterhorn zoom-17 WebP tiles around 50.21908, 5.61689 (Wallonia)
were retrieved and decoded using Pillow for an independent numeric sample.
The tile endpoint returned HTTP 200 and `Access-Control-Allow-Origin: *`.
A 180 × 180 grid sampled at 1 m had 100% valid heights, ranging from
515.40625 to 540.859375 m. Analysis of that grid completed in approximately
43 ms in Node, with four candidate shapes at the 0.22 m threshold.
This confirms numeric data ingestion/analysis, not archaeological correctness.
Timing excludes network and image decode time and is not a device benchmark.

## Browser limitation

A full visual browser test could not be completed in this environment. The local
Chromium process failed creating its process-singleton socket (Operation not
permitted); the shared browser could not reach the local HTTP preview and its
security policy blocks file URLs. No claim of visual/iPhone/Safari validation is
made. Manual hosted-browser and real-device checks remain necessary for layout,
canvas WebP decoding, touch selection and popup ergonomics.

## Expected use and limits

Maximum selected/visible zone: 600 × 600 m; minimum: 30 × 30 m. Native data detail
varies and is independent of sample step and displayed hillshade. Low resolution
models cannot reveal small trenches or craters. Labels and 35–80 scores are
experimental terrain-shape hypotheses; none is a confirmed identity or date.
Feedback stays in memory and is not used to train a classifier. No code has been
pushed or deployed as part of this local development task.
