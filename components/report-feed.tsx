"use client";

import { useCallback, useState, type ComponentType } from "react";
import {
  CalendarClock,
  Coins,
  Gem,
  LockKeyhole,
  Maximize2,
  Newspaper,
  ScanSearch,
  ShieldCheck,
  Swords,
  Truck,
  type LucideProps,
} from "lucide-react";

import {
  allianceBadge,
  formatBattleTimestamp,
  formatShortBattleTimestamp,
  playerNameWithoutAlliance,
  reportTypeLabel,
  safeHttpUrl,
} from "@/lib/format";
import type { ReportType, ViolationRecord } from "@/lib/types";

import { EvidenceModal } from "./evidence-modal";
import { SectionHeading } from "./section-heading";

interface ReportFeedProps {
  reports: ViolationRecord[];
  unavailable: boolean;
  onAdminClick: () => void;
}

interface TypeStyle {
  label: string;
  chip: string;
  line: string;
  glow: string;
  iconWrap: string;
  icon: ComponentType<LucideProps>;
}

const TYPE_STYLES: Record<ReportType, TypeStyle> = {
  BOUNTY_PLUNDER: {
    label: reportTypeLabel("BOUNTY_PLUNDER"),
    chip: "border-signal-amber/25 bg-signal-amber/[0.07] text-signal-amber",
    line: "bg-signal-amber/70",
    glow: "group-hover:shadow-[0_18px_50px_-30px_rgba(255,200,87,0.55)]",
    iconWrap: "bg-signal-amber/[0.12] text-signal-amber",
    icon: Coins,
  },
  RESOURCE_TILE: {
    label: reportTypeLabel("RESOURCE_TILE"),
    chip: "border-signal-cyan/25 bg-signal-cyan/[0.06] text-signal-cyan",
    line: "bg-signal-cyan/70",
    glow: "group-hover:shadow-[0_18px_50px_-30px_rgba(93,225,255,0.5)]",
    iconWrap: "bg-signal-cyan/10 text-signal-cyan",
    icon: Gem,
  },
  TRUCK_PLUNDER: {
    label: reportTypeLabel("TRUCK_PLUNDER"),
    chip: "border-signal-rose/25 bg-signal-rose/[0.06] text-signal-rose",
    line: "bg-signal-rose/70",
    glow: "group-hover:shadow-[0_18px_50px_-30px_rgba(255,123,169,0.5)]",
    iconWrap: "bg-signal-rose/10 text-signal-rose",
    icon: Truck,
  },
};

function ReportCard({
  record,
  onOpen,
  index,
}: {
  record: ViolationRecord;
  onOpen: (record: ViolationRecord) => void;
  index: number;
}) {
  const style = TYPE_STYLES[record.reportType];
  const Icon = style.icon;
  const imageUrl = safeHttpUrl(record.imageUrl);
  const offenderName = playerNameWithoutAlliance(
    record.offendingPlayer,
    record.offendingAlliance,
  );
  const victimName = record.victimPlayer
    ? playerNameWithoutAlliance(record.victimPlayer, "")
    : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(record)}
      aria-haspopup="dialog"
      className={`group dossier-card relative flex h-full w-full flex-col overflow-hidden border border-line-strong text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-blood/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-2 focus-visible:ring-offset-void-950 ${style.glow}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-px ${style.line} opacity-70`}
      />

      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] ${style.chip}`}
        >
          <Icon className="h-3 w-3" />
          {style.label}
        </span>
        <time
          dateTime={record.battleTimestamp}
          title={`UTC ${formatBattleTimestamp(record.battleTimestamp)}`}
          className="flex shrink-0 items-center gap-1.5 font-mono text-[9px] tabular-nums tracking-[0.06em] text-zinc-500"
        >
          <CalendarClock className="h-3 w-3" />
          {formatShortBattleTimestamp(record.battleTimestamp)}
        </time>
      </div>

      <div className="flex flex-1 items-start justify-between gap-4 px-4 pb-4 pt-5 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-blood-300">
            <ShieldCheck className="h-3 w-3 text-acid/80" />
            Confirmed violator
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-mono text-[16px] font-bold leading-tight text-bone sm:text-[18px]">
              {allianceBadge(record.offendingAlliance)}
            </span>
            <span
              className="max-w-[190px] truncate text-[12px] font-medium text-[#c9b6aa] sm:max-w-[230px]"
              title={offenderName}
            >
              {offenderName}
            </span>
          </div>

          <div className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-ash">
            <Swords className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2">
              Victim:{" "}
              <span className="text-ash">
                {victimName || "Not shown on this report"}
              </span>
            </span>
          </div>
        </div>

        <span
          aria-hidden="true"
          className={`relative flex h-[72px] w-[60px] shrink-0 items-center justify-center overflow-hidden border border-line-strong bg-black/40 sm:h-[82px] sm:w-[68px]`}
        >
          {imageUrl ? (
            // Evidence thumbnails are public Supabase Storage objects.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              loading={index < 4 ? "eager" : "lazy"}
              className="h-full w-full object-cover opacity-75 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
            />
          ) : (
            <ScanSearch className="h-4 w-4 text-zinc-600" />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-void-950/75 via-transparent to-transparent" />
          <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-[2px] border border-white/15 bg-void-950/70 text-zinc-300 transition-colors group-hover:border-acid/50 group-hover:text-acid">
            <Maximize2 className="h-2.5 w-2.5" />
          </span>
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
          Public evidence
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ash transition-colors group-hover:text-acid-300">
          View evidence
          <Maximize2 className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

export function ReportFeed({
  reports,
  unavailable,
  onAdminClick,
}: ReportFeedProps) {
  const [selected, setSelected] = useState<ViolationRecord | null>(null);
  const closeModal = useCallback(() => setSelected(null), []);

  return (
    <section id="evidence" className="scroll-mt-24 pt-10 sm:pt-14">
      <SectionHeading
        index="03"
        eyebrow="Evidence feed"
        title="Latest confirmed reports"
        description="Every record includes its original screenshot. Open any card to inspect the evidence and the assessment."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 border border-line-strong bg-black/25 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ash">
              <Newspaper className="h-3.5 w-3.5 text-blood-300" />
              All times shown in UTC
            </div>
            <button
              type="button"
              onClick={onAdminClick}
              className="inline-flex items-center gap-2 border border-line-strong bg-black/25 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ash transition-colors hover:border-blood/50 hover:text-bone"
            >
              <LockKeyhole className="h-3.5 w-3.5" />
              Admin
            </button>
          </div>
        }
      />

      {unavailable || reports.length === 0 ? (
        <div className="dossier-panel mt-5 flex min-h-[230px] flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line-strong bg-black/30">
            {unavailable ? (
              <ScanSearch className="h-5 w-5 text-zinc-600" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-acid/80" />
            )}
          </span>
          <h3 className="mt-4 font-decor text-[20px] uppercase tracking-[0.03em] text-bone">
            {unavailable ? "Evidence feed temporarily offline" : "No public reports yet"}
          </h3>
          <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-ash">
            {unavailable
              ? "The report archive cannot be read right now. Refresh in a moment."
              : "New confirmed records appear here automatically after AI extraction and rule verification."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {reports.map((record, index) => (
              <ReportCard
                key={record.id}
                record={record}
                onOpen={setSelected}
                index={index}
              />
            ))}
          </div>
          <p className="mt-3 text-right font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
            Showing latest {reports.length} confirmed{" "}
            {reports.length === 1 ? "record" : "records"}
          </p>
        </>
      )}

      {selected ? (
        <EvidenceModal record={selected} onClose={closeModal} />
      ) : null}
    </section>
  );
}
