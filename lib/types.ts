export type SiteCondition = "TURF_PRIMARY" | "MINIMAL_TURF" | "HARDSCAPE_HEAVY";
export type Archetype =
  | "standard_big_box"
  | "small_box_discount"
  | "auto_service"
  | "bank_branch"
  | "strip_anchor"
  | "strip_mid_tenant";

export type AIVerdict = "complete" | "defect" | "flag_for_review" | "request_more";
export type CaptureStatus = "captured_recent" | "captured_stale" | "missing" | "flagged";

export interface Capture {
  capture_id: string;
  photo_url: string;
  captured_at: string;
  provider_name: string;
  ai_verdict: AIVerdict;
  ai_confidence: number;
  ai_notes?: string;
}

export interface SlotTemplate {
  slot_id: string;
  display_name: string;
  display_name_short: string;
  standpoint_instruction: string;
  facing_instruction: string;
  provider_full_instruction: string;
  frame_targets: string[];
  why_it_matters?: string;
  zone_default: string;
}

export interface PhotoPoint {
  point_id: string;
  slot_id: string;
  lat: number;
  lng: number;
  camera_bearing: number;
  zone: string;
  slot: SlotTemplate;
  captures: Capture[];
  capture_status: CaptureStatus;
}

export interface Property {
  property_id: string;
  name: string;
  address: string;
  customer: string;
  archetype: Archetype;
  site_condition: SiteCondition;
  storefront_bearing: number;
  center_lat: number;
  center_lng: number;
  parcel_polygon: [number, number][] | null;
  photo_points: PhotoPoint[];
  diagram_image?: string;
  folder_id: string;
}
