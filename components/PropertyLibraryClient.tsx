"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import type { Property, CaptureStatus } from "@/lib/types";
import PropertyMap from "@/components/PropertyMap";

interface Props {
  properties: Property[];
}

const CUSTOMER_COLORS: Record<string, string> = {
  "Kroger": "bg-blue-100 text-blue-800",
  "Kohl's": "bg-purple-100 text-purple-800",
  "DMG": "bg-gray-100 text-gray-700",
};

export default function PropertyLibraryClient({ properties }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");

  const customers = useMemo(
    () => ["all", ...Array.from(new Set(properties.map((p) => p.customer))).sort()],
    [properties]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return properties.filter((p) => {
      const matchesCustomer = customerFilter === "all" || p.customer === customerFilter;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.customer.toLowerCase().includes(q);
      return matchesCustomer && matchesSearch;
    });
  }, [properties, search, customerFilter]);

  function handleSelectProperty(id: string) {
    router.push(`/property/${id}`);
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Left panel: list */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Search & filters */}
        <div className="p-3 border-b border-gray-100 flex flex-col gap-2 flex-shrink-0">
          <input
            type="text"
            placeholder="Search properties…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-1 focus:ring-[#1976d2] bg-gray-50"
          />
          <div className="flex gap-1 flex-wrap">
            {customers.map((c) => (
              <button
                key={c}
                onClick={() => setCustomerFilter(c)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  customerFilter === c
                    ? "bg-[#1976d2] text-white border-[#1976d2]"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        </div>

        {/* Property list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-gray-400 text-center">No properties match</p>
          )}
          {filtered.map((property) => {
            const { completion, missing } = computeCompletion(property);
            return (
              <button
                key={property.property_id}
                onClick={() => handleSelectProperty(property.property_id)}
                className="w-full flex flex-col gap-1 px-4 py-3 border-b border-gray-100 text-left hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 leading-snug">
                    {property.name}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      CUSTOMER_COLORS[property.customer] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {property.customer}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{property.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CompletionBar pct={completion} />
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {completion === 100
                      ? "10/10"
                      : `${10 - missing}/10`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-2 border-t border-gray-100 text-xs text-gray-400 text-center">
          {filtered.length} of {properties.length} properties
        </div>
      </div>

      {/* Right: map */}
      <div className="flex-1 relative">
        <PropertyMap
          mode="library"
          properties={filtered}
          onSelectProperty={handleSelectProperty}
        />
      </div>
    </div>
  );
}

function computeCompletion(property: Property): { completion: number; missing: number } {
  const total = property.photo_points.length;
  if (total === 0) return { completion: 0, missing: 0 };
  const captured = property.photo_points.filter((p) => p.captures.length > 0).length;
  return {
    completion: Math.round((captured / total) * 100),
    missing: total - captured,
  };
}

function CompletionBar({ pct }: { pct: number }) {
  const color =
    pct === 100 ? "bg-green-500" : pct >= 70 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
