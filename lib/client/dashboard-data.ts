import { getSupabaseBrowserClient } from "../supabase/browser";
import type {
  DashboardData,
  LeaderboardEntry,
  ReportType,
  ViolationRecord,
} from "../types";

interface LeaderboardRow {
  alliance: string;
  violation_count: number | string;
  offender_count: number | string;
  last_violation_at: string | null;
}

interface ViolationRow {
  id: string;
  created_at: string;
  report_type: ReportType;
  offending_alliance: string;
  offending_player: string;
  offending_server: string;
  victim_player: string | null;
  battle_timestamp: string;
  is_violation: boolean;
  reason: string;
  image_url: string | null;
}

function emptyDashboard(): DashboardData {
  return {
    leaderboard: [],
    latestViolations: [],
    stats: {
      violationCount: 0,
      allianceCount: 0,
    },
    dataUnavailable: true,
  };
}

/**
 * Read the public leaderboard and confirmed evidence rows through the anon /
 * publishable key. RLS exposes only is_violation = true rows to the browser.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return emptyDashboard();

  try {
    const [leaderboardResult, recentResult, countResult] = await Promise.all([
      supabase
        .from("alliance_leaderboard")
        .select(
          "alliance,violation_count,offender_count,last_violation_at",
          { count: "exact" },
        )
        .order("violation_count", { ascending: false })
        .order("last_violation_at", { ascending: false, nullsFirst: false })
        .order("alliance", { ascending: true })
        .limit(100),
      supabase
        .from("violations")
        .select(
          "id,created_at,report_type,offending_alliance,offending_player,offending_server,victim_player,battle_timestamp,is_violation,reason,image_url",
        )
        .eq("is_violation", true)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("violations")
        .select("id", { count: "exact", head: true })
        .eq("is_violation", true),
    ]);

    if (leaderboardResult.error) throw leaderboardResult.error;
    if (recentResult.error) throw recentResult.error;
    if (countResult.error) throw countResult.error;

    const leaderboard = (
      (leaderboardResult.data ?? []) as unknown as LeaderboardRow[]
    ).map(
      (row): LeaderboardEntry => ({
        alliance: row.alliance,
        violationCount: Number(row.violation_count) || 0,
        offenderCount: Number(row.offender_count) || 0,
        lastViolationAt: row.last_violation_at,
      }),
    );

    const latestViolations = (
      (recentResult.data ?? []) as unknown as ViolationRow[]
    ).map(
      (row): ViolationRecord => ({
        id: row.id,
        createdAt: row.created_at,
        reportType: row.report_type,
        offendingAlliance: row.offending_alliance,
        offendingPlayer: row.offending_player,
        offendingServer: row.offending_server,
        victimPlayer: row.victim_player,
        battleTimestamp: row.battle_timestamp,
        isViolation: row.is_violation,
        reason: row.reason,
        imageUrl: row.image_url,
      }),
    );

    return {
      leaderboard,
      latestViolations,
      stats: {
        violationCount: countResult.count ?? 0,
        allianceCount: leaderboardResult.count ?? leaderboard.length,
      },
      dataUnavailable: false,
    };
  } catch (error) {
    console.error(
      "[dashboard] failed to load public data:",
      error instanceof Error ? error.message : "unknown error",
    );
    return emptyDashboard();
  }
}
