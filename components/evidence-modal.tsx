"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CalendarClock,
  ExternalLink,
  ShieldCheck,
  Swords,
  X,
} from "lucide-react";

import {
  allianceBadge,
  allianceDisplayName,
  evidenceAssessment,
  formatBattleTimestamp,
  playerNameWithoutAlliance,
  reportTypeLabel,
  safeHttpUrl,
} from "@/lib/format";
import type { ViolationRecord } from "@/lib/types";

interface EvidenceModalProps {
  record: ViolationRecord;
  onClose: () => void;
}

export function EvidenceModal({ record, onClose }: EvidenceModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const imageUrl = safeHttpUrl(record.imageUrl);
  const alliance = allianceDisplayName(record.offendingAlliance);
  const offenderName = playerNameWithoutAlliance(
    record.offendingPlayer,
    record.offendingAlliance,
  );
  const victimName = record.victimPlayer
    ? playerNameWithoutAlliance(record.victimPlayer, "")
    : null;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-dialog-title"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="dossier-panel relative max-h-[92dvh] w-full max-w-4xl animate-slide-up overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line-strong bg-[#150e0d]/95 px-4 py-3.5 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-acid">
              <ShieldCheck className="h-3.5 w-3.5" />
              Confirmed NAP evidence
            </div>
            <h2
              id="evidence-dialog-title"
              className="mt-1 truncate font-display text-[17px] font-bold text-white sm:text-xl"
            >
              Evidence · [{alliance}] {offenderName}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close evidence preview"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-line-strong text-ash transition-colors hover:bg-white/5 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden border-b border-line-strong bg-black/60 p-2 sm:min-h-[420px] lg:border-b-0 lg:border-r">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-fine-grid opacity-25 [background-size:26px_26px]"
            />
            {imageUrl ? (
              // The evidence is user content hosted in Supabase Storage.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`Server 837 NAP evidence: report screenshot for ${alliance} player ${offenderName}`}
                className="relative z-10 max-h-[64dvh] w-auto max-w-full object-contain"
              />
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-3 text-zinc-500">
                <ShieldCheck className="h-8 w-8 text-zinc-700" />
                <span className="text-xs">No screenshot evidence is available for this record.</span>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6">
            <div className="inline-flex items-center gap-2 border border-acid/30 bg-acid/[0.07] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-acid-300">
              <span className="h-1.5 w-1.5 rounded-full bg-acid" />
              {reportTypeLabel(record.reportType)}
            </div>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                  Offending alliance
                </dt>
                <dd className="mt-1 font-mono text-lg font-semibold text-bone">
                  {allianceBadge(record.offendingAlliance)}
                </dd>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    Offender
                  </dt>
                  <dd
                    className="mt-1 truncate text-[13px] font-medium text-zinc-200"
                    title={offenderName}
                  >
                    {offenderName}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    Source server
                  </dt>
                  <dd className="mt-1 font-mono text-[13px] font-medium text-zinc-200">
                    #{record.offendingServer}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3 border border-line bg-black/20 p-3">
                <Swords className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                <div className="min-w-0">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    Victim
                  </dt>
                  <dd className="mt-1 text-[12px] leading-relaxed text-zinc-300">
                    {victimName || "Not shown or not identified on this report"}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    Battle time · UTC
                  </dt>
                  <dd className="mt-1 font-mono text-[13px] text-zinc-200">
                    {formatBattleTimestamp(record.battleTimestamp)}
                  </dd>
                </div>
              </div>

              <div className="border-t border-line-strong pt-4">
                <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                  Assessment
                </dt>
                <dd className="mt-1.5 text-[12px] leading-relaxed text-zinc-400">
                  {evidenceAssessment(record.reportType)}
                </dd>
              </div>
            </dl>

            {imageUrl ? (
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 border border-line-strong bg-black/20 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-bone transition-colors hover:border-acid/50 hover:text-acid-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
              >
                Open original image in a new tab
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
