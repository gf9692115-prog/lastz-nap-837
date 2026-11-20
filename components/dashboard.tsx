import {
  ArrowDownRight,
  ArrowUpRight,
  Crosshair,
  Radio,
  ShieldCheck,
  Sparkles,
  Swords,
  TriangleAlert,
} from "lucide-react";

import { SITE } from "@/lib/constants";
import {
  allianceBadge,
  formatShortBattleTimestamp,
  reportTypeLabel,
} from "@/lib/format";
import type { DashboardData } from "@/lib/types";

import { Leaderboard } from "./leaderboard";
import { ReportFeed } from "./report-feed";
import { SiteHeader } from "./site-header";
import { UploadSection } from "./upload-section";

interface DashboardProps {
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
      <div className="absolute inset-0 bg-void-950" />
      <div className="absolute inset-x-0 top-0 h-[720px] bg-fine-grid opacity-55 [background-size:46px_46px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
      <div className="absolute -right-40 -top-56 h-[620px] w-[620px] rounded-full bg-acid/[0.075] blur-[140px]" />
      <div className="absolute -left-60 top-[460px] h-[520px] w-[520px] rounded-full bg-signal-cyan/[0.035] blur-[140px]" />
      <div className="absolute inset-x-0 top-[680px] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute left-[calc(50%-590px)] top-0 hidden h-full w-px bg-gradient-to-b from-white/10 via-white/[0.035] to-transparent xl:block" />
      <div className="absolute right-[calc(50%-590px)] top-0 hidden h-full w-px bg-gradient-to-b from-white/10 via-white/[0.035] to-transparent xl:block" />
      <div className="absolute left-1/2 top-[180px] h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-acid/[0.018] blur-3xl" />
    </div>
  );
}

function Hero({ data }: DashboardProps) {
  const latest = data.latestViolations[0];
  const unavailable = data.dataUnavailable;

  return (
    <section className="relative pt-10 sm:pt-14 lg:pt-16">
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)] lg:gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 rounded-sm border border-acid/25 bg-acid/[0.055] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-acid">
              <Radio className="h-3 w-3" />
              Server {SITE.server} / Live enforcement
            </span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600 sm:inline">
              Season protocol v1.0
            </span>
          </div>

          <h1 className="mt-6 max-w-[760px] font-display text-[clamp(2.75rem,8.5vw,5.6rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">
            NAP<span className="mx-1 text-acid sm:mx-2">//</span>
            <br className="sm:hidden" />
            违规雷达
          </h1>

          <p className="mt-5 max-w-xl text-[14px] leading-7 text-zinc-400 sm:text-[15px]">
            上传真实战报截图，AI 负责读取，规则引擎负责定性。
            <span className="text-zinc-200">
              只锁定 Server {SITE.server} 本服玩家
            </span>
            ，外服跨服行为不计分。攻守方永远不会算反。
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <a
              href="#upload"
              className="group inline-flex h-11 items-center gap-2 rounded-sm bg-acid px-5 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-void-950 transition-colors hover:bg-acid-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-4 focus-visible:ring-offset-void-950"
            >
              开始检测
              <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <a
              href="#leaderboard"
              className="inline-flex h-11 items-center gap-2 rounded-sm border border-white/[0.12] bg-white/[0.025] px-5 font-display text-[12px] font-semibold uppercase tracking-[0.08em] text-zinc-300 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              查看违规榜
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5">
            {[
              "多语言战报识别",
              "右侧进攻方取证",
              "外服行为豁免",
              "分钟级去重防刷",
            ].map((feature) => (
              <span
                key={feature}
                className="flex items-center gap-2 text-[10px] tracking-wide text-zinc-500"
              >
                <span className="h-1 w-1 rounded-full bg-acid/70" />
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-sm border border-white/[0.04]"
          />
          <div className="relative overflow-hidden rounded-sm border border-white/[0.12] bg-void-900/85 p-5 shadow-panel backdrop-blur-md sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border border-acid/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-12 h-52 w-52 animate-[spin_24s_linear_infinite] rounded-full border border-dashed border-white/[0.08]"
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                <Crosshair className="h-3.5 w-3.5 text-acid/80" />
                Live ledger
              </div>
              <span
                className={`flex items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] ${
                  unavailable
                    ? "border-signal-amber/25 bg-signal-amber/[0.06] text-signal-amber"
                    : "border-acid/20 bg-acid/[0.05] text-acid"
                }`}
              >
                <span
                  className={`h-1 w-1 rounded-full ${
                    unavailable
                      ? "bg-signal-amber"
                      : "animate-pulse-dot bg-acid"
                  }`}
                />
                {unavailable ? "Syncing" : "Live"}
              </span>
            </div>

            <div className="relative mt-8 grid grid-cols-2 gap-5">
              <div>
                <div className="text-[10px] tracking-wide text-zinc-500">
                  累计违规
                </div>
                <div className="mt-2 font-display text-[46px] font-black leading-none tracking-[-0.055em] text-white sm:text-[54px]">
                  {formatCount(data.stats.violationCount, unavailable)}
                </div>
                <div className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-600">
                  Confirmed hits
                </div>
              </div>
              <div>
                <div className="text-[10px] tracking-wide text-zinc-500">
                  上榜联盟
                </div>
                <div className="mt-2 font-display text-[46px] font-black leading-none tracking-[-0.055em] text-white sm:text-[54px]">
                  {formatCount(data.stats.allianceCount, unavailable)}
                </div>
                <div className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-600">
                  Alliances
                </div>
              </div>
            </div>

            <div className="relative mt-7 flex items-center justify-between border-t border-white/[0.08] pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-acid" />
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-zinc-600">
                    Scope
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-zinc-300">
                    Server {SITE.server} only
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-zinc-600">
                  Ruleset
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-zinc-300">
                  03 active
                </div>
              </div>
            </div>

            <div className="relative mt-4 rounded-sm border border-white/[0.07] bg-black/25 px-3 py-2.5">
              {latest ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Sparkles className="h-3 w-3 shrink-0 text-acid/70" />
                    <span className="truncate font-mono text-[9px] tracking-wide text-zinc-400">
                      {reportTypeLabel(latest.reportType)} ·{" "}
                      {allianceBadge(latest.offendingAlliance)}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-600">
                    {formatShortBattleTimestamp(latest.battleTimestamp)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Swords className="h-3 w-3 text-zinc-600" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-zinc-600">
                    {unavailable
                      ? "Ledger connection pending"
                      : "Awaiting first confirmed report"}
                  </span>
                </div>
              )}
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-7 right-2 select-none font-display text-[90px] font-black leading-none tracking-[-0.08em] text-white/[0.024]"
            >
              837
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-y border-white/[0.075] py-3 font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-600 sm:mt-12">
        <span>Protocol / bounty · resource tile · trade truck</span>
        <span className="hidden sm:inline">Attacker extraction / right side only</span>
        <span>Cross-server / exempt</span>
      </div>
    </section>
  );
}

function AvailabilityNotice({ unavailable }: { unavailable: boolean }) {
  if (!unavailable) return null;
  return (
    <div className="mt-5 flex items-start gap-3 rounded-sm border border-signal-amber/20 bg-signal-amber/[0.045] px-4 py-3">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-signal-amber" />
      <div>
        <p className="text-[12px] font-medium text-signal-amber">
          榜单数据通道暂未连通
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          榜单服务正在同步。数据恢复后，排行榜与证据流会自动上线，无需刷新配置。
        </p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-white/[0.08] bg-black/20">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-white/10 bg-white/[0.03]">
                <Crosshair className="h-3.5 w-3.5 text-acid" />
              </span>
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-zinc-200">
                NAP<span className="text-acid">//</span>837
              </span>
            </div>
            <p className="mt-3 max-w-xl text-[10px] leading-relaxed text-zinc-600">
              Last Z: Survival Shooter · Server {SITE.server} NAP 违规自动检测。
              仅统计本服玩家已确认违规；外服跨服掠夺属于合法游戏机制，不计入本服 NAP。
              战报证据由上传者提供并公开公示，如对判定有异议请联系联盟管理复核。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-700">
                Detection stack
              </div>
              <div className="mt-1 text-[10px] text-zinc-500">
                DeepSeek Vision + Rule Engine
              </div>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-acid/20 bg-acid/[0.04]">
              <ShieldCheck className="h-4 w-4 text-acid/80" />
            </span>
          </div>
        </div>
        <div className="mt-7 flex flex-col justify-between gap-2 border-t border-white/[0.06] pt-4 font-mono text-[8px] uppercase tracking-[0.14em] text-zinc-700 sm:flex-row sm:items-center">
          <span>Built for the 837 community · Not affiliated with the game publisher</span>
          <span>UTC timestamps · Unique evidence ledger</span>
        </div>
      </div>
    </footer>
  );
}

export function Dashboard({ data }: DashboardProps) {
  return (
    <div
      id="top"
      className="relative min-h-screen overflow-x-clip bg-void-950 text-zinc-200"
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
          <UploadSection />
          <Leaderboard
            entries={data.leaderboard}
            stats={data.stats}
            unavailable={data.dataUnavailable}
          />
          <ReportFeed
            reports={data.latestViolations}
            unavailable={data.dataUnavailable}
          />
        </main>
        <Footer />
      </div>
    </div>
  );
}
