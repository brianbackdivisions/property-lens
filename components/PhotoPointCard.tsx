"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { PhotoPoint, AIVerdict } from "@/lib/types";

interface Props {
  point: PhotoPoint;
  onClose: () => void;
}

const VERDICT_CONFIG: Record<AIVerdict, { label: string; bg: string; text: string }> = {
  complete: { label: "Complete", bg: "bg-green-100", text: "text-green-800" },
  defect: { label: "Defect", bg: "bg-red-100", text: "text-red-800" },
  flag_for_review: { label: "Flag for Review", bg: "bg-yellow-100", text: "text-yellow-800" },
  request_more: { label: "Request More", bg: "bg-orange-100", text: "text-orange-800" },
};

export default function PhotoPointCard({ point, onClose }: Props) {
  const [lightbox, setLightbox] = useState(false);
  const [captureIdx, setCaptureIdx] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const captures = point.captures;
  const hasCapture = captures.length > 0;
  const capture = hasCapture ? captures[captureIdx] : null;
  const verdict = capture ? VERDICT_CONFIG[capture.ai_verdict] : null;

  // Esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (lightbox) setLightbox(false);
        else onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, onClose]);

  // Reset capture index when slot changes
  useEffect(() => {
    setCaptureIdx(0);
  }, [point.slot_id]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Card */}
      <div
        ref={cardRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
          bg-white rounded-xl shadow-2xl w-[880px] max-w-[96vw] max-h-[90vh]
          overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {point.slot_id}
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              {point.slot.display_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Photo */}
          <div className="w-[60%] flex flex-col bg-gray-50 border-r border-gray-100">
            {hasCapture && capture ? (
              <>
                {/* Photo */}
                <div
                  className="relative flex-1 bg-black cursor-zoom-in overflow-hidden min-h-0"
                  onClick={() => setLightbox(true)}
                >
                  <Image
                    src={capture.photo_url}
                    alt={point.slot.display_name}
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="(max-width: 880px) 60vw, 528px"
                    priority
                  />
                  <span className="absolute bottom-2 right-2 text-white text-xs bg-black/50 px-2 py-0.5 rounded">
                    Click to enlarge
                  </span>
                </div>

                {/* Capture metadata */}
                <div className="px-4 py-3 flex flex-col gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">
                      {formatDate(capture.captured_at)}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-600">
                      {capture.provider_name}
                    </span>
                    {verdict && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${verdict.bg} ${verdict.text}`}
                      >
                        {capture.ai_confidence >= 0.9 ? "✓" : "~"} Hawk-Eye: {verdict.label} ({pct(capture.ai_confidence)})
                      </span>
                    )}
                  </div>
                  {capture.ai_notes && (
                    <p className="text-xs text-gray-500 italic">{capture.ai_notes}</p>
                  )}

                  {/* History nav */}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setCaptureIdx((i) => Math.max(0, i - 1))}
                      disabled={captureIdx === 0}
                      className="text-xs text-[#1976d2] disabled:text-gray-300 hover:underline disabled:no-underline"
                    >
                      ← prev
                    </button>
                    <span className="text-xs text-gray-400">
                      {captureIdx + 1} / {captures.length}
                    </span>
                    <button
                      onClick={() =>
                        setCaptureIdx((i) => Math.min(captures.length - 1, i + 1))
                      }
                      disabled={captureIdx === captures.length - 1}
                      className="text-xs text-[#1976d2] disabled:text-gray-300 hover:underline disabled:no-underline"
                    >
                      next →
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 p-8">
                <CameraIcon />
                <p className="text-sm font-medium">No photo captured yet</p>
                <p className="text-xs text-center text-gray-400">
                  This slot has not been photographed for this property. The specification below shows what to capture.
                </p>
              </div>
            )}
          </div>

          {/* Right: Slot spec — stays static */}
          <div className="w-[40%] flex flex-col overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
              {/* Standpoint */}
              <SpecSection label="Stand at">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {point.slot.standpoint_instruction}
                </p>
              </SpecSection>

              {/* Face */}
              <SpecSection label="Face">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {point.slot.facing_instruction}
                </p>
              </SpecSection>

              {/* Frame targets */}
              <SpecSection label="Include in shot">
                <ul className="flex flex-col gap-1">
                  {point.slot.frame_targets.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-[#1976d2] mt-0.5 flex-shrink-0">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </SpecSection>

              {/* Why it matters */}
              {point.slot.why_it_matters && (
                <SpecSection label="Why it matters">
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    {point.slot.why_it_matters}
                  </p>
                </SpecSection>
              )}

              {/* Zone + bearing metadata */}
              <div className="mt-auto pt-4 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
                <span>Zone {point.zone}</span>
                <span>Bearing {point.camera_bearing}°</span>
                <span>{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && capture && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center cursor-zoom-out"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
          >
            <XIcon size={24} />
          </button>
          <div className="relative w-full h-full max-w-5xl max-h-screen p-8">
            <Image
              src={capture.photo_url}
              alt={point.slot.display_name}
              fill
              style={{ objectFit: "contain" }}
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}

function SpecSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-gray-300">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
