import { Activity, Crown, DatabaseZap, Shield } from "lucide-react";

import { allianceBadge, allianceDisplayName } from "@/lib/format";
import type { DashboardStats, LeaderboardEntry } from "@/lib/types";

import { SectionHeading } from "./section-heading";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  stats: DashboardStats;
  unavailable: boolean;
}

const RANK_STYLES = [
  {
    rank: "text-acid",
    line: "bg-acid",
    panel: "bg-acid/[0.045]",
    bar: "bg-gradient-to-r from-acid/80 to-acid/20",
    crown: "text-acid",
  },
  {
    rank: "text-zinc-200",
    line: "bg-zinc-400/70",
    panel: "bg-white/[0.02]",
    bar: "bg-gradient-to-r from-zinc-300/60 to-zinc-500/10",
    crown: "text-zinc-400",
  },
  {
    rank: "text-signal-amber",
    line: "bg-signal-amber/70",
    panel: "bg-signal-amber/[0.025]",
    bar: "bg-gradient-to-r from-signal-amber/55 to-signal-amber/10",
    crown: "text-signal-amber/80",
  },
];

export function Leaderboard({
  entries,
  stats,
  unavailable,
}: LeaderboardProps) {
  const maxCount = Math.max(1, ...entries.map((entry) => entry.violationCount));
  const isEmpty = entries.length === 0;

  return (
    <section id="leaderboard" className="scroll-mt-24 pt-14 sm:pt-20">
      <SectionHeading
        index="02"
        eyebrow="Leaderboard / 837"
        title="Alliance violation leaderboard"
        description="Ranked by confirmed Server 837 violations. Each unique report counts once."
        action={
          <div className="flex items-center gap-4 rounded-sm border border-white/10 bg-white/[0.025] px-4 py-2.5">
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-500">
                Confirmed
              </div>
              <div className="mt-0.5 font-display text-lg font-bold leading-none text-white">
                {String(stats.violationCount).padStart(2, "0")}
                <span className="ml-1 font-sans text-[10px] font-normal text-zinc-500">
                  hits
                </span>
              </div>
            </div>
            <span className="h-7 w-px bg-white/10" aria-hidden="true" />
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-500">
                Alliances
              </div>
              <div className="mt-0.5 font-display text-lg font-bold leading-none text-white">
                {String(stats.allianceCount).padStart(2, "0")}
                <span className="ml-1 font-sans text-[10px] font-normal text-zinc-500">
                  alliances
                </span>
              </div>
            </div>
          </div>
        }
      />

      <div className="relative mt-6 overflow-hidden rounded-sm border border-white/10 bg-void-900/75 shadow-panel">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/3 top-0 h-40 w-80 -translate-y-1/2 rounded-full bg-acid/[0.035] blur-3xl"
        />

        <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.025] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
            <Activity className="h-3 w-3 text-acid/80" />
            Server 837 enforcement ledger
          </div>
          <div className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600 sm:block">
            Rank / Alliance / Count
          </div>
        </div>

        {unavailable || isEmpty ? (
          <div className="relative flex min-h-[250px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border border-white/10"
              />
              <span
                aria-hidden="true"
                className="absolute inset-3 rounded-full border border-dashed border-acid/20"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border-t border-acid/50"
              />
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                {unavailable ? (
                  <DatabaseZap className="h-4 w-4 text-zinc-500" />
                ) : (
                  <Shield className="h-5 w-5 text-acid" />
                )}
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold text-white">
              {unavailable
                ? "Leaderboard data temporarily offline"
                : "No violations recorded yet"}
            </h3>
            <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-zinc-500">
              {unavailable
                ? "The data channel is disconnected or recovering. Refresh in a moment; you can still submit a report."
                : "Server 837 has no confirmed violations yet. Upload a valid report and the alliance ranking will update automatically."}
            </p>
          </div>
        ) : (
          <ol className="divide-y divide-white/[0.065]">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const style = RANK_STYLES[index] ?? {
                rank: "text-zinc-500",
                line: "bg-white/10",
                panel: "",
                bar: "bg-white/15",
                crown: "text-zinc-600",
              };
              const percentage = Math.max(
                4,
                Math.round((entry.violationCount / maxCount) * 100),
              );

              return (
                <li
                  key={entry.alliance}
                  className={`relative grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[62px_minmax(0,1fr)_auto] sm:gap-5 sm:px-6 sm:py-5 ${style.panel}`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-0 left-0 w-px ${style.line}`}
                  />

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-display text-xl font-black leading-none tracking-[-0.04em] sm:text-2xl ${style.rank}`}
                    >
                      {String(rank).padStart(2, "0")}
                    </span>
                    {rank <= 3 ? (
                      <Crown
                        className={`hidden h-3.5 w-3.5 sm:block ${style.crown}`}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span
                        className="truncate font-mono text-[15px] font-semibold text-white sm:text-[17px]"
                        title={allianceDisplayName(entry.alliance)}
                      >
                        {allianceBadge(entry.alliance)}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                        {entry.offenderCount} offender
                        {entry.offenderCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full max-w-md overflow-hidden rounded-full bg-white/[0.055]">
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-2xl font-black leading-none tracking-[-0.03em] text-white sm:text-[30px]">
                      {String(entry.violationCount).padStart(2, "0")}
                    </div>
                    <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-600">
                      violations
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="flex flex-col justify-between gap-2 border-t border-white/[0.08] bg-white/[0.018] px-4 py-3 text-[10px] leading-relaxed text-zinc-600 sm:flex-row sm:items-center sm:px-6">
          <span>
            Only confirmed violations by Server 837 players are scored.
            Cross-server actions are exempt.
          </span>
          <span className="font-mono uppercase tracking-[0.12em]">
            Unique report dedupe active
          </span>
        </div>
      </div>
    </section>
  );
}
