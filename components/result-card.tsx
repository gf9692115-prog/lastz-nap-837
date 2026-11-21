import type { ComponentType, ReactNode } from "react";
import {
  BadgeCheck,
  CopyX,
  FileQuestion,
  Globe2,
  ImageOff,
  Loader,
  ScanSearch,
  ServerCrash,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
  type LucideProps,
} from "lucide-react";

import {
  allianceBadge,
  formatBattleTimestamp,
  playerNameWithoutAlliance,
  reportTypeLabel,
} from "@/lib/format";
import type {
  UploadApiResponse,
  UploadOutcomeCode,
} from "@/lib/types";

interface ResultCardProps {
  result: UploadApiResponse;
  onDismiss?: () => void;
}

interface ResultPresentation {
  title: string;
  icon: ComponentType<LucideProps>;
  wrapper: string;
  iconWrap: string;
  eyebrow: string;
  strong: string;
}

const PRESENTATIONS: Record<UploadOutcomeCode, ResultPresentation> = {
  VIOLATION_RECORDED: {
    title: "Violation confirmed · Scored",
    icon: ShieldCheck,
    wrapper: "border-acid/30 bg-acid/[0.065]",
    iconWrap: "bg-acid text-void-950",
    eyebrow: "text-acid",
    strong: "text-acid",
  },
  EXTERNAL_SERVER: {
    title: "Cross-server action · Not scored",
    icon: Globe2,
    wrapper: "border-signal-cyan/25 bg-signal-cyan/[0.055]",
    iconWrap: "bg-signal-cyan/15 text-signal-cyan",
    eyebrow: "text-signal-cyan",
    strong: "text-signal-cyan",
  },
  DUPLICATE: {
    title: "Duplicate report · Not counted again",
    icon: CopyX,
    wrapper: "border-signal-amber/30 bg-signal-amber/[0.06]",
    iconWrap: "bg-signal-amber/15 text-signal-amber",
    eyebrow: "text-signal-amber",
    strong: "text-signal-amber",
  },
  UNSUPPORTED_REPORT: {
    title: "Outside the detection scope",
    icon: FileQuestion,
    wrapper: "border-white/[0.12] bg-white/[0.035]",
    iconWrap: "bg-white/10 text-zinc-200",
    eyebrow: "text-zinc-400",
    strong: "text-white",
  },
  INVALID_REPORT: {
    title: "Incomplete extraction",
    icon: ScanSearch,
    wrapper: "border-signal-amber/30 bg-signal-amber/[0.06]",
    iconWrap: "bg-signal-amber/15 text-signal-amber",
    eyebrow: "text-signal-amber",
    strong: "text-signal-amber",
  },
  INVALID_IMAGE: {
    title: "Image not usable",
    icon: ImageOff,
    wrapper: "border-signal-red/30 bg-signal-red/[0.055]",
    iconWrap: "bg-signal-red/15 text-signal-red",
    eyebrow: "text-signal-red",
    strong: "text-signal-red",
  },
  AI_ERROR: {
    title: "AI analysis failed",
    icon: Sparkles,
    wrapper: "border-signal-red/30 bg-signal-red/[0.055]",
    iconWrap: "bg-signal-red/15 text-signal-red",
    eyebrow: "text-signal-red",
    strong: "text-signal-red",
  },
  CONFIGURATION_ERROR: {
    title: "Service not ready",
    icon: Wrench,
    wrapper: "border-signal-red/30 bg-signal-red/[0.055]",
    iconWrap: "bg-signal-red/15 text-signal-red",
    eyebrow: "text-signal-red",
    strong: "text-signal-red",
  },
  STORAGE_ERROR: {
    title: "Evidence upload failed",
    icon: ServerCrash,
    wrapper: "border-signal-red/30 bg-signal-red/[0.055]",
    iconWrap: "bg-signal-red/15 text-signal-red",
    eyebrow: "text-signal-red",
    strong: "text-signal-red",
  },
  DATABASE_ERROR: {
    title: "Record save failed",
    icon: ServerCrash,
    wrapper: "border-signal-red/30 bg-signal-red/[0.055]",
    iconWrap: "bg-signal-red/15 text-signal-red",
    eyebrow: "text-signal-red",
    strong: "text-signal-red",
  },
  INTERNAL_ERROR: {
    title: "Processing error",
    icon: ShieldAlert,
    wrapper: "border-signal-red/30 bg-signal-red/[0.055]",
    iconWrap: "bg-signal-red/15 text-signal-red",
    eyebrow: "text-signal-red",
    strong: "text-signal-red",
  },
};

function Detail({
  label,
  children,
  accent = false,
}: {
  label: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </dt>
      <dd
        className={`mt-1 truncate font-mono text-[11px] font-medium ${
          accent ? "text-acid" : "text-zinc-200"
        }`}
        title={typeof children === "string" ? children : undefined}
      >
        {children}
      </dd>
    </div>
  );
}

export function ResultCard({ result, onDismiss }: ResultCardProps) {
  const presentation =
    PRESENTATIONS[result.code] ?? PRESENTATIONS.INTERNAL_ERROR;
  const Icon = presentation.icon;
  const record = result.record;
  const recordPlayer = record
    ? playerNameWithoutAlliance(
        record.offendingPlayer,
        record.offendingAlliance,
      )
    : "";

  return (
    <div
      role={
        result.code === "VIOLATION_RECORDED" || result.code === "EXTERNAL_SERVER"
          ? "status"
          : "alert"
      }
      aria-live="polite"
      className={`relative mt-3 animate-slide-up overflow-hidden rounded-sm border p-4 sm:p-5 ${presentation.wrapper}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full border border-white/[0.06]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 top-2 opacity-[0.045]"
      >
        <Icon className="h-28 w-28 text-white" strokeWidth={1} />
      </div>

      <div className="relative flex items-start gap-3.5">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${presentation.iconWrap}`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className={`font-mono text-[9px] uppercase tracking-[0.2em] ${presentation.eyebrow}`}
              >
                AI verdict / rule checked
              </div>
              <h3 className="mt-1.5 font-display text-[16px] font-bold tracking-[0.01em] text-white">
                {presentation.title}
              </h3>
            </div>
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss verdict"
                className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-zinc-500 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <p
            className={`mt-2.5 text-[13px] font-medium leading-relaxed ${presentation.strong}`}
          >
            {result.message}
          </p>

          {record ? (
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/[0.08] pt-3.5 sm:grid-cols-4">
              <Detail label="Report type">
                {reportTypeLabel(record.reportType)}
              </Detail>
              <Detail
                label={record.isViolation ? "Offending alliance" : "Opponent alliance"}
              >
                {allianceBadge(record.offendingAlliance)}
              </Detail>
              <Detail
                label={record.isViolation ? "Offender" : "Opponent"}
                accent={record.isViolation}
              >
                {recordPlayer}
              </Detail>
              <Detail label="Battle time">
                {formatBattleTimestamp(record.battleTimestamp)}
              </Detail>
            </dl>
          ) : null}

          {record?.isViolation ? (
            <div className="mt-3.5 flex items-center gap-2 border-t border-white/[0.06] pt-3">
              <BadgeCheck className="h-3.5 w-3.5 text-acid" />
              <p className="text-[11px] leading-relaxed text-zinc-400">
                This record is now in the public evidence feed and its screenshot is archived.
              </p>
            </div>
          ) : null}

          {result.code === "EXTERNAL_SERVER" && record ? (
            <div className="mt-3.5 flex items-center gap-2 border-t border-white/[0.06] pt-3">
              <Globe2 className="h-3.5 w-3.5 text-signal-cyan" />
              <p className="text-[11px] leading-relaxed text-zinc-400">
                External Server #{record.offendingServer} activity is kept for audit only and does not enter this server&apos;s leaderboard.
              </p>
            </div>
          ) : null}

          {result.code === "AI_ERROR" || result.code === "INTERNAL_ERROR" ? (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
              <Loader className="h-3 w-3 animate-spin" />
              If this keeps failing, contact the site admin to check the analysis API status.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
