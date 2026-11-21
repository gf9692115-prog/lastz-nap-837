"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Crosshair,
  LoaderCircle,
  LockKeyhole,
  Radio,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { getDashboardData } from "@/lib/client/dashboard-data";
import { SITE } from "@/lib/constants";
import {
  allianceBadge,
  formatShortBattleTimestamp,
  reportTypeLabel,
} from "@/lib/format";
import type { DashboardData } from "@/lib/types";

import { AdminDialog } from "./admin-dialog";
import { Leaderboard } from "./leaderboard";
import { ReportFeed } from "./report-feed";
import { SiteHeader } from "./site-header";
import { UploadSection } from "./upload-section";

interface HeroProps {
  data: DashboardData;
}

function formatCount(value: number, unavailable: boolean): string {
  if (unavailable) return "--";
  return new Intl.NumberFormat("en-US", {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
  }).format(value);
}

function BackgroundEffects() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-[820px] bg-fine-grid opacity-35 [background-size:46px_46px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
      <div className="absolute -right-48 -top-56 h-[760px] w-[760px] rounded-full bg-blood/[0.13] blur-[170px]" />
      <div className="absolute -left-64 top-[480px] h-[620px] w-[620px] rounded-full bg-acid/[0.04] blur-[170px]" />
      <div className="absolute left-1/2 top-[170px] h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-blood/[0.045] blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blood/70 to-transparent" />
      <div className="absolute inset-x-0 top-[720px] h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" />
      <div className="absolute left-[calc(50%-590px)] top-0 hidden h-full w-px bg-gradient-to-b from-blood/25 via-line to-transparent xl:block" />
      <div className="absolute right-[calc(50%-590px)] top-0 hidden h-full w-px bg-gradient-to-b from-blood/25 via-line to-transparent xl:block" />
    </div>
  );
}

function HeroCrest() {
  return (
    <div
      aria-hidden="true"
      className="relative h-[74px] w-[62px] shrink-0 sm:h-[92px] sm:w-[78px]"
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#3a0f18] via-[#210a0e] to-[#120708] shadow-[0_0_38px_rgba(200,16,46,.34)]"
        style={{
          clipPath: "polygon(50% 0,100% 13%,100% 68%,50% 100%,0 68%,0 13%)",
        }}
      />
      <div
        className="absolute inset-[4px] border border-acid/25 bg-[#0f0707]"
        style={{
          clipPath: "polygon(50% 0,100% 13%,100% 68%,50% 100%,0 68%,0 13%)",
        }}
      />
      <div className="absolute inset-x-[11px] top-[13px] h-px bg-acid/45" />
      <span className="absolute inset-0 flex items-center justify-center pt-1 font-decor text-[30px] leading-none text-bone sm:text-[40px]">
        837
      </span>
      <span className="absolute inset-x-0 bottom-[13px] text-center font-mono text-[6px] uppercase tracking-[0.22em] text-acid/80">
        NAP
      </span>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  valueClassName = "",
}: {
  label: string;
  value: string;
  hint: string;
  valueClassName?: string;
}) {
  return (
    <div className="relative h-full overflow-hidden border border-line-strong bg-[linear-gradient(180deg,#1d1211_0%,#130b0a_100%)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_10px_26px_rgba(0,0,0,.55)]">
      <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-blood to-blood-600" />
      <span className="absolute -right-7 -top-10 h-24 w-24 rounded-full bg-blood/20 blur-2xl" />
      <div className="relative font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-[#c08078]">
        {label}
      </div>
      <div
        className={`relative mt-1.5 truncate font-decor leading-none ${valueClassName}`}
        title={value}
      >
        {value}
      </div>
      <div
        className="relative mt-1.5 truncate text-[10px] leading-relaxed text-[#8f776d]"
        title={hint}
      >
        {hint}
      </div>
    </div>
  );
}

function Hero({ data }: HeroProps) {
  const latest = data.latestViolations[0];
  const unavailable = data.dataUnavailable;
  const latestValue = latest
    ? allianceBadge(latest.offendingAlliance)
    : "—";
  const latestHint = latest
    ? `${reportTypeLabel(latest.reportType)} · ${formatShortBattleTimestamp(latest.battleTimestamp)} UTC`
    : "No confirmed offender yet";

  return (
    <section className="relative pt-4 sm:pt-6">
      <div className="hero-shell px-4 pb-8 pt-4 sm:px-7 sm:pb-10 sm:pt-5">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="stamp">
              <Radio className="h-3 w-3" />
              Server {SITE.server}
            </span>
            <span className="stamp stamp-gold">NAP Sector</span>
            <span className="ml-auto hidden font-mono text-[8px] uppercase tracking-[0.18em] text-[#9c6a62] sm:inline">
              Enforcement dossier · {unavailable ? "syncing" : "live"}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-4 sm:gap-6">
            <HeroCrest />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#c08078] sm:text-[9px]">
                Last Z: Survival Shooter · Server {SITE.server}
              </div>
              <h1 className="hero-title-metal mt-1 whitespace-nowrap font-decor text-[clamp(2.35rem,8vw,5rem)] uppercase leading-[0.88] tracking-[0.01em]">
                NAP WAR REPORT
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[8px] uppercase tracking-[0.16em] text-ash sm:text-[9px]">
                <span className="text-acid-300">[NAP]</span>
                <span>Server {SITE.server}</span>
                <span className="text-blood-300">/</span>
                <span>Violation enforcement dossier</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t border-blood/25 pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <p className="max-w-2xl text-[12px] leading-6 text-[#c9b6aa] sm:text-[13px]">
              Upload a real report. AI reads the screenshot and a server-side
              ruleset makes the final call.{" "}
              <span className="text-bone">
                Only Server {SITE.server} players are scored
              </span>
              ; cross-server actions are exempt, and attacker/victim sides are
              never reversed.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="#upload"
                className="group inline-flex h-10 items-center gap-2 bg-acid-300 px-5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a0d08] transition-colors hover:bg-acid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-4 focus-visible:ring-offset-void-950"
              >
                Start scan
                <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </a>
              <a
                href="#leaderboard"
                className="inline-flex h-10 items-center gap-2 border border-line-strong bg-black/20 px-5 font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-bone transition-colors hover:border-blood/60 hover:text-acid-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/60"
              >
                View leaderboard
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 font-mono text-[7px] uppercase tracking-[0.14em] text-ash sm:text-[8px]">
            <span>
              <span className="text-blood-300">Data</span> / community reports
            </span>
            <span>
              <span className="text-blood-300">Scope</span> / Server {SITE.server} only
            </span>
            <span>
              <span className="text-blood-300">Ruleset</span> / 03 active
            </span>
            <span>
              <span className="text-blood-300">Dedupe</span> / minute-level
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-20 -mt-4 grid grid-cols-2 gap-2.5 px-2 sm:-mt-5 sm:px-4 lg:grid-cols-4">
        <KpiCard
          label="Confirmed violations"
          value={formatCount(data.stats.violationCount, unavailable)}
          hint="All-time Server 837 hits"
          valueClassName="kpi-value text-[30px] sm:text-[34px]"
        />
        <KpiCard
          label="Ranked alliances"
          value={formatCount(data.stats.allianceCount, unavailable)}
          hint="Alliances with scored hits"
          valueClassName="kpi-value text-[30px] sm:text-[34px]"
        />
        <KpiCard
          label="Latest offender"
          value={latestValue}
          hint={latestHint}
          valueClassName="text-[19px] text-acid-300 sm:text-[23px]"
        />
        <KpiCard
          label="Enforcement"
          value={unavailable ? "SYNC" : "LIVE"}
          hint={unavailable ? "Public ledger reconnecting" : "Ruleset 03 · UTC timestamps"}
          valueClassName="kpi-value text-[24px] sm:text-[28px]"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-y border-line py-3 font-mono text-[7px] uppercase tracking-[0.16em] text-zinc-600 sm:text-[8px]">
        <span>Protocol / bounty · resource tile · trade truck</span>
        <span className="hidden sm:inline">
          Attacker extraction / VS right or log attacker
        </span>
        <span>Cross-server / exempt</span>
      </div>
    </section>
  );
}

function AvailabilityNotice({ unavailable }: { unavailable: boolean }) {
  if (!unavailable) return null;
  return (
    <div className="mt-5 flex items-start gap-3 border border-blood/30 bg-blood/[0.05] px-4 py-3">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-signal-amber" />
      <div>
        <p className="text-[12px] font-medium text-signal-amber">
          Leaderboard feed unavailable
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-ash">
          The public ledger is syncing. Rankings and evidence will appear
          automatically when the data channel is restored.
        </p>
      </div>
    </div>
  );
}

function Footer({ onAdminClick }: { onAdminClick: () => void }) {
  return (
    <footer className="mt-14 border-t border-line-strong bg-[#0b0606]/80">
      <div
        aria-hidden="true"
        className="h-[2px] w-full bg-gradient-to-r from-transparent via-blood/70 to-transparent"
      />
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center border border-line-strong bg-black/30">
                <Crosshair className="h-3.5 w-3.5 text-acid" />
              </span>
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-bone">
                NAP<span className="text-acid">//</span>837
              </span>
            </div>
            <p className="mt-3 max-w-xl text-[10px] leading-relaxed text-zinc-600">
              Last Z: Survival Shooter · Server {SITE.server} NAP enforcement.
              Only confirmed violations by Server 837 players are scored.
              Cross-server raids are legal game mechanics and are not counted.
              Evidence is supplied by uploaders and displayed publicly; contact
              alliance leadership for appeals.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-700">
                Detection stack
              </div>
              <div className="mt-1 text-[10px] text-ash">
                AI Vision + Rule Engine
              </div>
            </div>
            <span className="flex h-9 w-9 items-center justify-center border border-acid/20 bg-acid/[0.04]">
              <ShieldCheck className="h-4 w-4 text-acid/80" />
            </span>
          </div>
        </div>
        <div className="mt-7 flex flex-col justify-between gap-2 border-t border-line pt-4 font-mono text-[8px] uppercase tracking-[0.14em] text-zinc-700 sm:flex-row sm:items-center">
          <span>Built for the 837 community · Not affiliated with the game publisher</span>
          <div className="flex flex-wrap items-center gap-3">
            <span>UTC timestamps · Unique evidence ledger</span>
            <button
              type="button"
              onClick={onAdminClick}
              className="inline-flex items-center gap-1.5 border-l border-line-strong pl-3 text-zinc-600 transition-colors hover:text-acid-300"
            >
              <LockKeyhole className="h-3 w-3" />
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LoadingDashboard() {
  return (
    <div
      id="top"
      className="relative min-h-screen overflow-x-clip bg-transparent text-zinc-200"
    >
      <BackgroundEffects />
      <div className="relative z-10">
        <SiteHeader />
        <main
          id="main"
          className="mx-auto flex min-h-[calc(100vh-68px)] w-full max-w-[1180px] items-center justify-center px-4 sm:px-6 lg:px-8"
        >
          <div className="flex flex-col items-center text-center" role="status">
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-acid/25 bg-acid/[0.04]">
              <span
                aria-hidden="true"
                className="absolute inset-1 animate-spin rounded-full border border-transparent border-t-acid/70"
              />
              <LoaderCircle className="h-5 w-5 animate-spin text-acid" />
            </span>
            <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.22em] text-acid">
              Syncing public ledger
            </p>
            <p className="mt-2 text-[12px] text-zinc-500">
              Reading the public Server 837 leaderboard and evidence feed…
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  const loadData = useCallback(async () => {
    const nextData = await getDashboardData();
    setData(nextData);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!data) {
    return <LoadingDashboard />;
  }

  return (
    <div
      id="top"
      className="relative min-h-screen overflow-x-clip bg-transparent text-zinc-200"
    >
      <BackgroundEffects />
      <div className="relative z-10">
        <SiteHeader />
        <main
          id="main"
          className="mx-auto w-full max-w-[1180px] px-4 pb-4 sm:px-6 lg:px-8"
        >
          <Hero data={data} />
          <AvailabilityNotice unavailable={data.dataUnavailable} />
          <UploadSection onUploaded={loadData} />
          <Leaderboard
            entries={data.leaderboard}
            stats={data.stats}
            unavailable={data.dataUnavailable}
          />
          <ReportFeed
            reports={data.latestViolations}
            unavailable={data.dataUnavailable}
            onAdminClick={() => setAdminOpen(true)}
          />
        </main>
        <Footer onAdminClick={() => setAdminOpen(true)} />
      </div>
      {adminOpen ? (
        <AdminDialog
          onClose={() => setAdminOpen(false)}
          onRecordsChanged={loadData}
        />
      ) : null}
    </div>
  );
}
