#!/usr/bin/env tsx
/**
 * build-data.ts — KML → properties.json
 *
 * Walks /Users/brian.back/photo-plots/ for folders matching NN_*
 * Parses *-enriched.kml for property metadata + photo points
 * Parses *-parcel-boundary.kml for the parcel polygon
 * Copies Newport Pavilion photos to public/photos/03_pavilion_newport/
 * Emits src/data/properties.json (but file lives at data/properties.json relative to project root)
 */

import { XMLParser } from "fast-xml-parser";
import * as fs from "fs";
import * as path from "path";

const PHOTO_PLOTS_DIR = "/Users/brian.back/photo-plots";
const OUTPUT_JSON = path.join(__dirname, "../data/properties.json");
const PUBLIC_PHOTOS_DIR = path.join(__dirname, "../public/photos");

// ---------------------------------------------------------------------------
// Slot library — sourced from SLOT_LIBRARY.yaml
// ---------------------------------------------------------------------------
const SLOT_LIBRARY: Record<string, {
  display_name: string;
  display_name_short: string;
  zone_default: string;
  standpoint_instruction: string;
  facing_instruction: string;
  provider_full_instruction: string;
  frame_targets: string[];
  why_it_matters: string;
}> = {
  "PP-01": {
    display_name: "Front Lot — Drive Lane View",
    display_name_short: "Front Lot (drive view)",
    zone_default: "A",
    standpoint_instruction: "Stand at the LEFT corner of the front parking area (left as a customer would see it facing the storefront).",
    facing_instruction: "Face along the front of the store, looking from left to right across the storefront toward the right side of the building.",
    provider_full_instruction: "Stand at the left corner of the front parking lot (left as a customer faces the storefront). Face across the front of the store, looking to the right. Capture the front drive lane, parking islands, and the right end of the building in one shot.",
    frame_targets: ["Front drive lane (running along the storefront)", "Parking islands", "Far corner of the building", "Front landscape beds running along building base"],
    why_it_matters: "Establishes the condition of the front drive lane and parking islands — the first impression for any customer arriving by car.",
  },
  "PP-02": {
    display_name: "Side Transition (Near)",
    display_name_short: "Side Transition",
    zone_default: "A or C (boundary)",
    standpoint_instruction: "From the same standpoint as PP-01 (left front corner), turn left so you are facing along the LEFT side of the property toward the rear.",
    facing_instruction: "Face along the left side of the store, looking from the front of the property toward the rear.",
    provider_full_instruction: "From the same spot as Photo 1, turn left so you are looking along the left side of the property toward the rear. Capture the left side turf strip, any landscape beds along the building side, and the curb line running toward the rear.",
    frame_targets: ["Side turf strip", "Side landscape beds (if present)", "Side curb line continuing toward rear"],
    why_it_matters: "Documents the condition of the side property transition — often missed in routine inspections.",
  },
  "PP-03": {
    display_name: "Storefront — Wide Angle (Near End)",
    display_name_short: "Storefront (wide)",
    zone_default: "A",
    standpoint_instruction: "Stand at the RIGHT corner of the front parking area (right as a customer faces the storefront), close to the building wall where the parking lot meets the building.",
    facing_instruction: "Face along the front of the store, looking from right to left across the storefront toward the left end of the building.",
    provider_full_instruction: "Stand at the right corner of the front parking lot, close to the building (right as a customer faces the storefront). Face across the front of the store, looking to the left. Capture the full length of the storefront, front landscape beds, and the main entrance in one shot.",
    frame_targets: ["Storefront extending the length of the building", "Front landscape beds along the base of the building", "Main entrance", "Walkway between parking and building"],
    why_it_matters: "Wide establishing shot of the customer's view of the property — captures beds, entrance, and walkway condition in a single frame.",
  },
  "PP-04": {
    display_name: "Front Lot — Road View",
    display_name_short: "Front Lot (road view)",
    zone_default: "A",
    standpoint_instruction: "From the same standpoint as PP-03 (right front corner), turn 180 degrees so you are facing away from the building toward the public road.",
    facing_instruction: "Face away from the storefront, toward the road frontage. The storefront should now be behind you.",
    provider_full_instruction: "From the same spot as Photo 3, turn around to face the road (the storefront is now behind you). Capture the front turf, parking islands, and the road-facing curb line.",
    frame_targets: ["Front turf", "Parking islands", "Road-facing curb line", "Transition into Zone B road frontage"],
    why_it_matters: "Captures the road-facing presentation of the front lot — the view drivers see as they approach the property.",
  },
  "PP-05": {
    display_name: "Road Frontage — Boundary View",
    display_name_short: "Road Frontage (boundary)",
    zone_default: "B",
    standpoint_instruction: "Stand at the RIGHT corner of the property where it meets the public road (right as a customer faces the storefront).",
    facing_instruction: "Face into the property, looking from the road back toward the storefront along the right-side boundary.",
    provider_full_instruction: "Stand at the right corner of the property where it meets the road (right as a customer faces the storefront). Face into the property, looking back toward the building along the right-side boundary. Capture the right-side boundary landscape strip and the transition into the front lot.",
    frame_targets: ["Side boundary turf or landscape strip", "Transition into front parking / front lot", "Side property line"],
    why_it_matters: "Documents the property boundary condition visible from the road — the side strip that frames the customer's approach.",
  },
  "PP-06": {
    display_name: "Road Frontage — Full Strip",
    display_name_short: "Road Frontage (full)",
    zone_default: "B",
    standpoint_instruction: "Stand at the LEFT corner of the property where it meets the road (left as a customer faces the storefront — the opposite corner from PP-05).",
    facing_instruction: "Face along the road frontage, looking from the left corner toward the right corner — across the entire road-side landscape strip.",
    provider_full_instruction: "Stand at the left road corner of the property (left as a customer faces the storefront). Face along the road frontage, looking toward the right corner. Capture the full length of the landscape strip running between the property and the road.",
    frame_targets: ["Full road-frontage landscape strip end-to-end", "Road curb line", "Perimeter turf"],
    why_it_matters: "The single frame that shows whether the road-facing landscape strip is maintained from end to end.",
  },
  "PP-07": {
    display_name: "Back of Store — Approach 1",
    display_name_short: "Back of Store (approach 1)",
    zone_default: "D",
    standpoint_instruction: "Walk around to the LEFT rear corner of the property (left as a customer faces the storefront — the rear corner on the building's left side).",
    facing_instruction: "Face along the back of the store, looking from the left rear corner toward the right rear corner.",
    provider_full_instruction: "Walk around behind the building to the left rear corner of the property (left as a customer faces the storefront). Face along the back of the store, looking toward the right rear corner. Capture rear turf, rear landscape beds, and the loading dock approach. Do not photograph the dock interior — that is lot sweeping scope.",
    frame_targets: ["Rear turf", "Rear landscape beds", "Loading dock approach (exterior, not interior)", "Rear curb line"],
    why_it_matters: "Back-of-store landscaping is the most frequently missed scope area. This angle documents approach condition and loading dock surround.",
  },
  "PP-08": {
    display_name: "Back of Store — Approach 2",
    display_name_short: "Back of Store (approach 2)",
    zone_default: "D",
    standpoint_instruction: "Walk to the RIGHT rear corner of the property (right as a customer faces the storefront — opposite corner from PP-07).",
    facing_instruction: "Face along the back of the store, looking from the right rear corner toward the left rear corner. This is the mirror angle of Photo 7.",
    provider_full_instruction: "Walk to the right rear corner of the property (right as a customer faces the storefront — opposite from where you took Photo 7). Face along the back of the store, looking toward the left rear corner. Capture rear turf, rear landscape beds, the rear curb line, and the loading dock area from this opposite angle.",
    frame_targets: ["Rear turf (from opposite angle)", "Rear landscape beds", "Loading dock area (exterior)", "Rear curb line"],
    why_it_matters: "Mirror angle of PP-07 — together they document both ends of the rear zone with no blind spots.",
  },
  "PP-09": {
    display_name: "Back Wall — Detail",
    display_name_short: "Back Wall",
    zone_default: "D",
    standpoint_instruction: "From the same standpoint as PP-08, turn ninety degrees so you are facing the rear wall of the building head-on.",
    facing_instruction: "Face the back of the store, perpendicular to the rear building wall.",
    provider_full_instruction: "From the same spot as Photo 8, turn to face the rear wall of the building head-on. Capture the back wall, the rear landscape beds at the building base, and the rear curb line.",
    frame_targets: ["Back wall of the building", "Rear landscape beds at building base", "Rear curb line"],
    why_it_matters: "Close-in detail of the rear building base — where weeds and debris accumulate and where Hawk-Eye focuses for rear-zone defects.",
  },
  "PP-10": {
    display_name: "Storefront — Head-On (Setback)",
    display_name_short: "Storefront (head-on)",
    zone_default: "A",
    standpoint_instruction: "Walk back into the front parking area, away from the building, until the entire width of the storefront fits in your phone-camera frame. Stand roughly centered on the building.",
    facing_instruction: "Face the storefront head-on, perpendicular to the building.",
    provider_full_instruction: "Walk back into the front parking lot until the entire width of the building fits in one phone-camera frame. Center yourself roughly on the storefront. Face the building head-on. Capture the full storefront, front landscape beds along the base of the building, the main entrance, and the drive lane in the foreground.",
    frame_targets: ["Entire storefront, edge to edge of building", "Main entrance centered or visible in frame", "Front landscape beds running along building base", "Drive lane in foreground"],
    why_it_matters: "The high-value establishing shot. Anchors the property's overall appearance in a single image and is the primary frame for customer-facing reports.",
  },
};

// ---------------------------------------------------------------------------
// XML parser config
// ---------------------------------------------------------------------------
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  isArray: (name) => name === "Placemark",
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function extractText(html: string, label: string): string | null {
  const pattern = new RegExp(
    `<b>${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^<]*</b>\\s*([^<]+)`,
    "i"
  );
  const m = html.match(pattern);
  return m ? m[1].trim().replace(/\s+/g, " ") : null;
}

function parseStorefrontBearing(text: string | null): number {
  if (!text) return 0;
  const m = text.match(/bearing\s*(\d+)/i) || text.match(/(\d+)°/);
  return m ? parseInt(m[1], 10) : 0;
}

function parseCaptureStatus(captures: any[]): "captured_recent" | "captured_stale" | "missing" | "flagged" {
  if (captures.length === 0) return "missing";
  const latest = captures[0];
  const verdict = latest.ai_verdict as string;
  if (verdict === "flag_for_review" || verdict === "request_more") return "flagged";
  const daysAgo = (Date.now() - new Date(latest.captured_at).getTime()) / (1000 * 60 * 60 * 24);
  return daysAgo <= 14 ? "captured_recent" : "captured_stale";
}

// ---------------------------------------------------------------------------
// Mock captures for Newport Pavilion
// ---------------------------------------------------------------------------
const NEWPORT_VERDICTS: Record<string, { verdict: string; confidence: number; notes: string }> = {
  "PP-01": { verdict: "complete", confidence: 0.96, notes: "Front drive lane clean, island beds maintained." },
  "PP-02": { verdict: "complete", confidence: 0.91, notes: "Side turf strip continuous, curb edged." },
  "PP-03": { verdict: "complete", confidence: 0.94, notes: "Storefront beds maintained, walkway clear, entrance visible." },
  "PP-04": { verdict: "complete", confidence: 0.89, notes: "Front lot even, islands maintained." },
  "PP-05": { verdict: "flag_for_review", confidence: 0.72, notes: "Boundary strip partially visible — reposition recommended for better coverage." },
  "PP-06": { verdict: "complete", confidence: 0.88, notes: "Road frontage strip maintained end-to-end." },
  "PP-07": { verdict: "complete", confidence: 0.93, notes: "Rear turf mowed, dock approach clear." },
  "PP-08": { verdict: "complete", confidence: 0.90, notes: "Rear curb edged, beds maintained." },
  "PP-09": { verdict: "defect", confidence: 0.85, notes: "Weeds visible at building base near loading dock." },
  "PP-10": { verdict: "complete", confidence: 0.97, notes: "Full storefront in frame, beds maintained, entrance clear." },
};

function makeNewportCapture(slotId: string, photoNum: string): any {
  const v = NEWPORT_VERDICTS[slotId] ?? { verdict: "complete", confidence: 0.88, notes: "" };
  return {
    capture_id: `newport-${slotId.toLowerCase()}-001`,
    photo_url: `/photos/03_pavilion_newport/PP${photoNum}.jpeg`,
    captured_at: "2026-05-11T09:30:00Z",
    provider_name: "J. Martinez",
    ai_verdict: v.verdict,
    ai_confidence: v.confidence,
    ai_notes: v.notes,
  };
}

// ---------------------------------------------------------------------------
// KML parsing
// ---------------------------------------------------------------------------
interface ParsedProperty {
  name: string;
  address: string;
  customer: string;
  archetype: string;
  site_condition: string;
  storefront_bearing: number;
  center_lat: number;
  center_lng: number;
  parcel_polygon: [number, number][] | null;
  photo_points: any[];
  diagram_image: string | undefined;
  folder_id: string;
}

function parseKML(kmlPath: string): ParsedProperty | null {
  if (!fs.existsSync(kmlPath)) return null;

  const raw = fs.readFileSync(kmlPath, "utf-8");
  let parsed: any;
  try {
    parsed = parser.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${kmlPath}:`, e);
    return null;
  }

  const doc = parsed?.kml?.Document;
  if (!doc) return null;

  // Property metadata from Document description
  const docDesc: string = (doc.description?.__cdata ?? doc.description ?? "") as string;
  const folderPath = path.dirname(kmlPath);
  const folderId = path.basename(folderPath);

  // Read ADDRESS.txt for authoritative name, address, customer
  let name = "";
  let address = "";
  let customer = "DMG";
  const addrTxt = path.join(folderPath, "ADDRESS.txt");
  if (fs.existsSync(addrTxt)) {
    const lines = fs.readFileSync(addrTxt, "utf-8").split("\n");
    for (const line of lines) {
      if (line.startsWith("Property:")) name = line.replace("Property:", "").trim();
      if (line.startsWith("Address:")) address = line.replace("Address:", "").trim();
      if (line.startsWith("Customer:")) customer = line.replace("Customer:", "").trim();
    }
  }

  // Fallback name from KML doc name
  if (!name) {
    const docName: string = (doc.name ?? "") as string;
    name = docName.replace(/—.*$/, "").replace(/Enriched.*$/i, "").trim();
  }

  // Fallback address from KML description <h2>
  if (!address) {
    const h2Match = docDesc.match(/<h2>([^<]+)<\/h2>/);
    address = h2Match ? h2Match[1].trim() : "";
  }

  // Infer customer from folder name if not in ADDRESS.txt
  if (customer === "DMG") {
    if (folderId.includes("kroger") || folderId.includes("pavilion") ||
        folderId.includes("paxton") || folderId.includes("beechmont") ||
        folderId.includes("corry") || folderId.includes("bryan") ||
        folderId.includes("euclid") || folderId.includes("waterstone") ||
        folderId.includes("glen_este") || folderId.includes("eastgate") ||
        folderId.includes("harrison") || folderId.includes("crossroads") ||
        folderId.includes("spiral") || folderId.includes("oh28")) {
      customer = "Kroger";
    } else if (folderId.includes("kohl")) {
      customer = "Kohl's";
    }
  }

  // Extract property metadata
  const archRaw = extractText(docDesc, "Property archetype") ?? "standard_big_box";
  const archetype = archRaw.split(" ")[0].replace(/[()]/g, "").trim();
  const siteCondRaw = extractText(docDesc, "Site condition") ?? "TURF_PRIMARY";
  const site_condition = siteCondRaw.split(" ")[0].trim();
  const storefrontOrient = extractText(docDesc, "Storefront orientation");
  const storefront_bearing = parseStorefrontBearing(storefrontOrient ?? "");

  // Extract placemarks
  const placemarks: any[] = Array.isArray(doc.Placemark) ? doc.Placemark : doc.Placemark ? [doc.Placemark] : [];

  let parcel_polygon: [number, number][] | null = null;
  const photo_points: any[] = [];
  const lats: number[] = [];
  const lngs: number[] = [];

  for (const pm of placemarks) {
    const pmName: string = pm.name ?? "";
    const desc: string = (pm.description?.__cdata ?? pm.description ?? "") as string;

    // Parcel polygon
    if (pm.Polygon) {
      const coordStr: string = pm.Polygon?.outerBoundaryIs?.LinearRing?.coordinates ?? "";
      parcel_polygon = parseCoordString(coordStr);
      continue;
    }

    // Photo point
    const slotMatch = pmName.match(/^(PP-\d{2})/);
    if (!slotMatch || !pm.Point) continue;

    const slotId = slotMatch[1];
    const coordStr: string = pm.Point?.coordinates ?? "";
    const [lng, lat] = coordStr.trim().split(",").map(Number);
    if (isNaN(lat) || isNaN(lng)) continue;

    lats.push(lat);
    lngs.push(lng);

    const bearing = pm.LookAt?.heading ? Number(pm.LookAt.heading) : 0;

    // Parse zone from description
    const zoneRaw = extractText(desc, "Zone") ?? SLOT_LIBRARY[slotId]?.zone_default ?? "A";
    const zone = zoneRaw.split(" ")[0].trim();

    const slotTemplate = SLOT_LIBRARY[slotId];
    if (!slotTemplate) {
      console.warn(`Unknown slot ${slotId} in ${kmlPath}`);
      continue;
    }

    // For Newport, attach mock captures
    const captures: any[] = [];
    if (folderId === "03_pavilion_newport") {
      const photoNum = slotId.replace("PP-", "").padStart(2, "0");
      captures.push(makeNewportCapture(slotId, photoNum));
    }

    const capture_status = parseCaptureStatus(captures);

    photo_points.push({
      point_id: `${folderId}-${slotId.toLowerCase()}`,
      slot_id: slotId,
      lat,
      lng,
      camera_bearing: bearing,
      zone,
      slot: {
        slot_id: slotId,
        display_name: slotTemplate.display_name,
        display_name_short: slotTemplate.display_name_short,
        zone_default: slotTemplate.zone_default,
        standpoint_instruction: slotTemplate.standpoint_instruction,
        facing_instruction: slotTemplate.facing_instruction,
        provider_full_instruction: slotTemplate.provider_full_instruction,
        frame_targets: slotTemplate.frame_targets,
        why_it_matters: slotTemplate.why_it_matters,
      },
      captures,
      capture_status,
    });
  }

  // Sort photo points by slot number
  photo_points.sort((a, b) => {
    const na = parseInt(a.slot_id.replace("PP-", ""), 10);
    const nb = parseInt(b.slot_id.replace("PP-", ""), 10);
    return na - nb;
  });

  // Compute center from photo point coords (or parcel centroid)
  let center_lat = 0;
  let center_lng = 0;
  if (parcel_polygon && parcel_polygon.length > 0) {
    center_lat = parcel_polygon.reduce((s, c) => s + c[1], 0) / parcel_polygon.length;
    center_lng = parcel_polygon.reduce((s, c) => s + c[0], 0) / parcel_polygon.length;
  } else if (lats.length > 0) {
    center_lat = lats.reduce((a, b) => a + b, 0) / lats.length;
    center_lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
  }

  // Check for parcel-boundary.kml to load separate parcel
  const files = fs.readdirSync(folderPath);
  const parcelKML = files.find((f) => f.includes("parcel-boundary") && f.endsWith(".kml"));
  if (parcelKML && !parcel_polygon) {
    const parcelData = parseParcelKML(path.join(folderPath, parcelKML));
    if (parcelData) parcel_polygon = parcelData;
  }

  // Find diagram image
  const diagramFile = files.find((f) => f.includes("diagram") && !f.includes("hires") && (f.endsWith(".png") || f.endsWith(".jpg")));
  const diagram_image = diagramFile ? `/photos/${folderId}/${diagramFile}` : undefined;

  return {
    name,
    address,
    customer,
    archetype: archetype || "standard_big_box",
    site_condition: site_condition || "TURF_PRIMARY",
    storefront_bearing,
    center_lat,
    center_lng,
    parcel_polygon,
    photo_points,
    diagram_image,
    folder_id: folderId,
  };
}

function parseParcelKML(kmlPath: string): [number, number][] | null {
  if (!fs.existsSync(kmlPath)) return null;
  const raw = fs.readFileSync(kmlPath, "utf-8");
  let parsed: any;
  try {
    parsed = parser.parse(raw);
  } catch {
    return null;
  }
  const doc = parsed?.kml?.Document;
  if (!doc) return null;
  const pms: any[] = Array.isArray(doc.Placemark) ? doc.Placemark : doc.Placemark ? [doc.Placemark] : [];
  for (const pm of pms) {
    if (pm.Polygon) {
      const coordStr: string = pm.Polygon?.outerBoundaryIs?.LinearRing?.coordinates ?? "";
      return parseCoordString(coordStr);
    }
  }
  return null;
}

function parseCoordString(raw: string): [number, number][] {
  return raw
    .trim()
    .split(/\s+/)
    .map((triplet) => {
      const parts = triplet.split(",").map(Number);
      return [parts[0], parts[1]] as [number, number];
    })
    .filter(([lng, lat]) => !isNaN(lat) && !isNaN(lng));
}

// ---------------------------------------------------------------------------
// Copy photos
// ---------------------------------------------------------------------------
function copyPhotos(folderPath: string, folderId: string): void {
  const destDir = path.join(PUBLIC_PHOTOS_DIR, folderId);
  fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const src = path.join(folderPath, file);
    const dest = path.join(destDir, file);
    if (fs.existsSync(dest)) continue;
    const ext = path.extname(file).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
      fs.copyFileSync(src, dest);
      console.log(`  Copied: ${file}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  console.log("Building property data from KML files...\n");

  // Find all NN_* folders
  const allDirs = fs.readdirSync(PHOTO_PLOTS_DIR).filter((d) => /^\d+_/.test(d));

  const properties: any[] = [];

  for (const dir of allDirs) {
    const folderPath = path.join(PHOTO_PLOTS_DIR, dir);
    const stat = fs.statSync(folderPath);
    if (!stat.isDirectory()) continue;

    console.log(`Processing ${dir}...`);

    const files = fs.readdirSync(folderPath);
    const enrichedKML = files.find((f) => f.includes("-enriched") && f.endsWith(".kml"));

    if (!enrichedKML) {
      console.log(`  No enriched KML found — skipping`);
      continue;
    }

    const parsed = parseKML(path.join(folderPath, enrichedKML));
    if (!parsed) {
      console.log(`  Failed to parse KML — skipping`);
      continue;
    }

    // Copy all photos and diagrams for every property (not just Newport)
    copyPhotos(folderPath, dir);

    properties.push({
      property_id: dir,
      name: parsed.name,
      address: parsed.address,
      customer: parsed.customer,
      archetype: parsed.archetype,
      site_condition: parsed.site_condition,
      storefront_bearing: parsed.storefront_bearing,
      center_lat: parsed.center_lat,
      center_lng: parsed.center_lng,
      parcel_polygon: parsed.parcel_polygon,
      photo_points: parsed.photo_points,
      diagram_image: parsed.diagram_image,
      folder_id: parsed.folder_id,
    });

    console.log(`  ✓ ${parsed.photo_points.length} photo points, parcel: ${parsed.parcel_polygon ? "yes" : "no"}`);
  }

  // Write output
  const outputDir = path.dirname(OUTPUT_JSON);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(properties, null, 2));
  console.log(`\nWrote ${properties.length} properties to ${OUTPUT_JSON}`);
}

main();
