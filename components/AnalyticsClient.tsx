"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Mock data (hardcoded per PRD section 8.4)
// ---------------------------------------------------------------------------
const CAPTURE_RATE_DATA = [
  { slot: "PP-01", rate: 95 },
  { slot: "PP-02", rate: 88 },
  { slot: "PP-03", rate: 92 },
  { slot: "PP-04", rate: 85 },
  { slot: "PP-05", rate: 82 },
  { slot: "PP-06", rate: 78 },
  { slot: "PP-07", rate: 75 },
  { slot: "PP-08", rate: 73 },
  { slot: "PP-09", rate: 70 },
  { slot: "PP-10", rate: 91 },
];

const PROPERTY_SCOREBOARD = [
  { name: "Newport Pavilion", customer: "Kroger", id: "03_pavilion_newport", captured: 10, total: 10 },
  { name: "Kroger Donnermeyer", customer: "Kroger", id: "02_kroger_donnermeyer_bellevue", captured: 9, total: 10 },
  { name: "Beechmont Cincinnati", customer: "Kroger", id: "05_beechmont_cincinnati", captured: 8, total: 10 },
  { name: "Kohl's West Chester", customer: "Kohl's", id: "01_kohls_west_chester", captured: 7, total: 10 },
  { name: "Paxton Cincinnati", customer: "Kroger", id: "04_paxton_cincinnati", captured: 5, total: 10 },
  { name: "Corry Cincinnati", customer: "Kroger", id: "06_corry_cincinnati", captured: 3, total: 10 },
  { name: "Bryan Station Lexington", customer: "Kroger", id: "07_bryan_station_lexington", captured: 0, total: 10 },
];

const HEATMAP_SLOTS = ["PP-01", "PP-02", "PP-03", "PP-04", "PP-05", "PP-06", "PP-07", "PP-08", "PP-09", "PP-10"];

// Status: 1=captured, 0=missing, 2=stale, 3=flagged
const HEATMAP_DATA = [
  { id: "03_pavilion_newport", name: "Newport Pavilion", slots: [1, 1, 1, 1, 3, 1, 1, 1, 0, 1] },
  { id: "02_kroger_donnermeyer_bellevue", name: "Kroger Donnermeyer", slots: [1, 1, 1, 1, 1, 2, 1, 1, 1, 0] },
  { id: "05_beechmont_cincinnati", name: "Beechmont", slots: [1, 1, 1, 1, 0, 1, 1, 1, 0, 1] },
  { id: "01_kohls_west_chester", name: "Kohl's West Chester", slots: [1, 1, 1, 0, 1, 1, 1, 0, 0, 1] },
  { id: "04_paxton_cincinnati", name: "Paxton Cincinnati", slots: [1, 0, 1, 0, 0, 1, 0, 1, 0, 1] },
  { id: "06_corry_cincinnati", name: "Corry Cincinnati", slots: [1, 0, 1, 0, 0, 0, 0, 1, 0, 0] },
  { id: "07_bryan_station_lexington", name: "Bryan Station", slots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

const CELL_STATUS: Record<number, { bg: string; label: string }> = {
  0: { bg: "#ef4444", label: "Missing" },
  1: { bg: "#22c55e", label: "Captured" },
  2: { bg: "#eab308", label: "Stale" },
  3: { bg: "#f97316", label: "Flagged" },
};

export default function AnalyticsClient() {
  const router = useRouter();

  return (
    <div className="overflow-y-auto flex-1 p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Last 30 days · 7 pilot properties · mock data (v0)
          </p>
        </div>

        {/* Widget 1: Capture Rate by Slot */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Capture Rate by Slot — Last 30 Days
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                % of visits with a complete photo for each slot. Target: 90%.
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CAPTURE_RATE_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="slot" tick={{ fontSize: 11 }} />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
                width={36}
              />
              <Tooltip
                formatter={(v) => [`${v}%`, "Capture rate"]}
                contentStyle={{ fontSize: 12 }}
              />
              <ReferenceLine
                y={90}
                stroke="#1976d2"
                strokeDasharray="4 4"
                label={{ value: "90% target", position: "right", fontSize: 10, fill: "#1976d2" }}
              />
              <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                {CAPTURE_RATE_DATA.map((entry) => (
                  <Cell
                    key={entry.slot}
                    fill={entry.rate >= 90 ? "#22c55e" : entry.rate >= 75 ? "#eab308" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">
            PP-07 through PP-09 (back of store) are below target. PP-01 and PP-10 are at or above.
          </p>
        </div>

        {/* Widget 2: Property Coverage Scoreboard */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Property Coverage Scoreboard
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Sorted by completion. Click a property to view details.
              </p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 py-1.5 pr-4">Property</th>
                <th className="text-left text-xs font-medium text-gray-500 py-1.5 pr-4">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 py-1.5 pr-4 w-48">Coverage</th>
                <th className="text-right text-xs font-medium text-gray-500 py-1.5">Slots</th>
              </tr>
            </thead>
            <tbody>
              {PROPERTY_SCOREBOARD.map((row) => {
                const pct = Math.round((row.captured / row.total) * 100);
                return (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/property/${row.id}`)}
                    className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 pr-4 font-medium text-gray-900">{row.name}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{row.customer}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct === 100
                                ? "bg-green-500"
                                : pct >= 70
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-xs text-gray-500">
                      {row.captured}/{row.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Widget 3: Slot × Property Heatmap */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Slot Coverage Heatmap
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Click a red cell to open that property with the missing slot highlighted.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {Object.entries(CELL_STATUS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: v.bg }}
                  />
                  {v.label}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left pr-3 pb-2 text-gray-500 font-medium w-36 text-xs">
                    Property
                  </th>
                  {HEATMAP_SLOTS.map((s) => (
                    <th key={s} className="px-1.5 pb-2 text-gray-500 font-medium text-center min-w-[46px]">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEATMAP_DATA.map((row) => (
                  <tr key={row.id}>
                    <td className="pr-3 py-1 text-gray-700 font-medium truncate max-w-[144px] text-xs">
                      <Link
                        href={`/property/${row.id}`}
                        className="hover:text-[#1976d2] hover:underline"
                      >
                        {row.name}
                      </Link>
                    </td>
                    {row.slots.map((status, slotIdx) => {
                      const slot = HEATMAP_SLOTS[slotIdx];
                      const cell = CELL_STATUS[status];
                      return (
                        <td key={slot} className="px-1.5 py-1 text-center">
                          <button
                            onClick={() => {
                              router.push(`/property/${row.id}?slot=${slot}`);
                            }}
                            className="w-8 h-7 rounded-sm text-white text-[10px] font-bold transition-opacity hover:opacity-80 cursor-pointer"
                            style={{ background: cell.bg }}
                            title={`${row.name} / ${slot}: ${cell.label}`}
                          >
                            {status === 1 ? "✓" : status === 2 ? "~" : status === 3 ? "!" : "✕"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Avg capture rate", value: "81%", sub: "across all slots" },
            { label: "Properties with 10/10", value: "1", sub: "Newport Pavilion" },
            { label: "Most-missed slot", value: "PP-09", sub: "Back Wall (70%)" },
            { label: "Top slot", value: "PP-01", sub: "Front Lot (95%)" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
