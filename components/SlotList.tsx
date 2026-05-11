"use client";

import Image from "next/image";
import type { PhotoPoint, CaptureStatus } from "@/lib/types";
import { assetPath } from "@/lib/assetPath";

interface Props {
  points: PhotoPoint[];
  activeSlot: string | null;
  onSelectSlot: (slotId: string) => void;
}

const STATUS_LABEL: Record<CaptureStatus, string> = {
  captured_recent: "Recent",
  captured_stale: "Stale",
  missing: "Missing",
  flagged: "Review",
};

const STATUS_DOT: Record<CaptureStatus, string> = {
  captured_recent: "bg-green-500",
  captured_stale: "bg-yellow-400",
  missing: "bg-red-500",
  flagged: "bg-orange-500",
};

export default function SlotList({ points, activeSlot, onSelectSlot }: Props) {
  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {points.map((point) => {
        const isActive = activeSlot === point.slot_id;
        const hasPhoto = point.captures.length > 0;
        const photo = hasPhoto ? point.captures[0].photo_url : null;

        return (
          <button
            key={point.slot_id}
            onClick={() => onSelectSlot(point.slot_id)}
            className={`flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 text-left transition-colors hover:bg-blue-50 flex-shrink-0 ${
              isActive ? "bg-blue-50 border-l-2 border-l-[#1976d2]" : ""
            }`}
          >
            {/* Number */}
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white`}
              style={{
                background: statusColor(point.capture_status),
              }}
            >
              {point.slot_id.replace("PP-", "")}
            </span>

            {/* Thumbnail */}
            <div className="w-12 h-9 rounded overflow-hidden bg-gray-100 flex-shrink-0 relative">
              {photo ? (
                <Image
                  src={assetPath(photo)}
                  alt={point.slot.display_name}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-300 text-lg">—</span>
                </div>
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate leading-tight">
                {point.slot.display_name_short}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[point.capture_status]}`}
                />
                <span className="text-[10px] text-gray-400">
                  {STATUS_LABEL[point.capture_status]}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function statusColor(status: CaptureStatus): string {
  const map: Record<CaptureStatus, string> = {
    captured_recent: "#22c55e",
    captured_stale: "#eab308",
    missing: "#ef4444",
    flagged: "#f97316",
  };
  return map[status];
}
