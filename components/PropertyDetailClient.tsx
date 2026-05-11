"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Property } from "@/lib/types";
import PropertyMap from "@/components/PropertyMap";
import SlotList from "@/components/SlotList";
import PhotoPointCard from "@/components/PhotoPointCard";

interface Props {
  property: Property;
}

export default function PropertyDetailClient({ property }: Props) {
  const searchParams = useSearchParams();
  const [activeSlot, setActiveSlot] = useState<string | null>(
    searchParams.get("slot")
  );
  const [showDiagram, setShowDiagram] = useState(false);

  const activePoint = property.photo_points.find((p) => p.slot_id === activeSlot) ?? null;

  const handleSelectSlot = useCallback((slotId: string) => {
    setActiveSlot(slotId);
  }, []);

  const handleCloseCard = useCallback(() => {
    setActiveSlot(null);
  }, []);

  const { captured, total } = computeCounts(property);

  return (
    <div className="flex h-full min-h-0">
      {/* Left: slot list */}
      <div className="w-52 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Property header */}
        <div className="px-3 py-3 border-b border-gray-100 flex-shrink-0">
          <Link href="/" className="text-xs text-[#1976d2] hover:underline mb-1 block">
            ← All properties
          </Link>
          <h1 className="text-sm font-semibold text-gray-900 leading-snug">
            {property.name}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{property.address}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${total > 0 ? Math.round((captured / total) * 100) : 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">{captured}/{total}</span>
          </div>
        </div>

        {/* Slot list */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <SlotList
            points={property.photo_points}
            activeSlot={activeSlot}
            onSelectSlot={handleSelectSlot}
          />
        </div>
      </div>

      {/* Right: map + controls */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Map controls bar */}
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          {property.diagram_image && (
            <button
              onClick={() => setShowDiagram((d) => !d)}
              className={`text-xs px-3 py-1.5 rounded shadow border transition-colors font-medium ${
                showDiagram
                  ? "bg-[#1976d2] text-white border-[#1976d2]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {showDiagram ? "Hide diagram" : "Show diagram"}
            </button>
          )}
        </div>

        {/* Map */}
        <div className="flex-1">
          <PropertyMap
            mode="detail"
            property={property}
            activeSlot={activeSlot}
            onSelectSlot={handleSelectSlot}
            showDiagram={showDiagram}
          />
        </div>

        {/* Status legend */}
        <div className="absolute bottom-8 left-2 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 px-3 py-2 flex gap-4 text-xs text-gray-600">
          {[
            { color: "bg-green-500", label: "Captured (recent)" },
            { color: "bg-yellow-400", label: "Stale (>14 days)" },
            { color: "bg-red-500", label: "Missing" },
            { color: "bg-orange-500", label: "Flagged for review" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Photo point card modal */}
      {activePoint && (
        <PhotoPointCard point={activePoint} onClose={handleCloseCard} />
      )}
    </div>
  );
}

function computeCounts(property: Property) {
  return {
    total: property.photo_points.length,
    captured: property.photo_points.filter((p) => p.captures.length > 0).length,
  };
}
