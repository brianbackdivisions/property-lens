# Property Lens v0 — Decision Log

Judgment calls made during the v0 build. Each entry documents what was ambiguous, what was chosen, and why.

---

## MapLibre GL JS instead of Mapbox GL JS

**Context:** PRD specifies "Mapbox GL JS (or MapLibre if avoiding licensing)."

**Decision:** Used MapLibre GL JS with free OSM raster tiles (streets) and Esri World Imagery (satellite).

**Why:** Mapbox requires a public access token even for free-tier use. MapLibre is API-compatible and eliminates any friction for demo sharing — no `.env` setup, no token rotation, no usage caps during stakeholder reviews. For v1 production, swap `MAP_STYLE_STREETS`/`MAP_STYLE_SATELLITE` in `components/PropertyMap.tsx` for Mapbox style URLs and add `NEXT_PUBLIC_MAPBOX_TOKEN` to the environment.

---

## ADDRESS.txt as the authoritative property name

**Context:** Property names could come from the KML Document name or from `ADDRESS.txt`.

**Decision:** `ADDRESS.txt` `Property:` field takes precedence; KML document name is the fallback.

**Why:** The KML document name often includes noise like "— Enriched Photo Plots (v01)". ADDRESS.txt is already canonical (produced by the `enrich-photo-plots` skill pipeline). The script strips that field and uses the clean name.

---

## Parcel polygon in enriched KML takes precedence over separate parcel-boundary.kml

**Context:** Some properties have the parcel polygon embedded in the enriched KML (Newport); others have a separate `*-parcel-boundary.kml`.

**Decision:** Parse the polygon from whichever file has it — enriched KML first, then fall back to the standalone parcel file.

**Why:** Avoids needing two separate parse passes for properties that already embed the parcel. For properties with only a standalone file, the fallback kicks in automatically.

---

## Mock Hawk-Eye verdicts per-slot, hardcoded in build-data.ts

**Context:** PRD says "mock the verdicts" for v0. No real Hawk-Eye API is available.

**Decision:** Verdicts and confidence scores are hardcoded in a per-slot map in `scripts/build-data.ts` under `NEWPORT_VERDICTS`. Newport is the only property with captures, so only Newport has verdicts.

**Why:** Centralizing the mock data in build-data means the JSON output is the same format as a real API response. Swapping in real Hawk-Eye data in v1 only requires changing the data source, not the component contracts.

---

## Heatmap uses separate hardcoded mock data from the real captures

**Context:** The Analytics heatmap should show all 7 properties, but only Newport has real photos.

**Decision:** `AnalyticsClient.tsx` defines its own `HEATMAP_DATA` constant with plausible mock coverage for all 7 properties. This intentionally diverges from `properties.json` for visual demo completeness.

**Why:** A real heatmap with 6 all-red rows and 1 all-green row would show a failure state, not demonstrate the product. Mock data lets the demo show the full range of statuses (green, yellow, orange, red) for all properties. Clearly labeled "mock data (v0)" in the UI.

---

## Map tile rendering appears blank at library zoom level (known limitation)

**Context:** At zoom level 10 with 7 scattered properties, the map initializes centered on the midpoint. OSM tiles render via WebGL and may appear blank in automated screenshot tools that don't capture the WebGL canvas layer.

**Decision:** Accepted as a known screenshot artifact. The map renders correctly in live browser sessions (verified via zoomed screenshots and direct pixel inspection).

**Why:** The critical demo path (Property Detail View at zoom 17) renders cleanly and is the stakeholder-facing surface. Library map navigation is supplementary in v0; the list panel is primary.

---

## Diagram overlay uses bounding-box coordinates, not georeferenced

**Context:** The `*-diagram.png` files are annotated screenshots, not georeferenced raster images. They don't have precise GPS corners.

**Decision:** The diagram is overlaid using the parcel bounding box as corner coordinates. It fills the parcel extent but won't be pixel-perfect aligned to the underlying map.

**Why:** The diagram is a reference aid (shows photo standpoints and camera directions) not a precision overlay. Approximate alignment is sufficient for the demo. True georeferencing would require running the image through a GIS process to produce GCPs — out of scope for v0.

---

## Slot spec comes from SLOT_LIBRARY.yaml, hardcoded in build-data.ts

**Context:** PRD references `SLOT_LIBRARY.yaml` as the source of truth. The build script could parse the YAML directly, or the slot definitions could be hardcoded.

**Decision:** Slot definitions are hardcoded as a TypeScript constant in `scripts/build-data.ts` rather than parsing the YAML at runtime.

**Why:** The YAML format is not a direct one-to-one map to the `SlotTemplate` type (it has additional fields like `variants_supported`, `complete_indicators`, etc.). Parsing it correctly adds complexity. The slot definitions are stable enough for v0 that a direct TypeScript copy is lower risk than a fragile YAML parser. For v1, the slot library should be served from a backend endpoint and versioned separately.

---

## Property Detail renders as a dynamic route, Library renders as static

**Context:** Next.js will try to statically prerender all pages at build time.

**Decision:** Property Library (`/`) and Analytics (`/analytics`) are static. Property Detail (`/property/[id]`) is dynamic (server-rendered on demand).

**Why:** `generateStaticParams()` is implemented for the detail page, but the actual rendering is `ƒ` (dynamic) because `searchParams` is async and the slot query param needs to be read at request time. This is correct behavior — the slot query param drives which card opens on load. For v1 with a real backend, all three routes would be dynamic with proper cache headers.
