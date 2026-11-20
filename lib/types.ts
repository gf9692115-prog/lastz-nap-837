export type ReportType =
  | "BOUNTY_PLUNDER"
  | "RESOURCE_TILE"
  | "TRUCK_PLUNDER";

export interface VisionPlayer {
  /** The full label as shown in game, e.g. "#838 [VNNa]メηα²β". */
  rawDisplayName: string;
  /** Nickname only, without the #server prefix or [alliance] tag. */
  playerName: string;
  /** Contents of [square brackets], without brackets. Empty when absent. */
  alliance: string;
  /** Extracted server number. No #XXX prefix should be reported as 837. */
  server: string;
  hasServerTag: boolean;
}

export interface VisionExtraction {
  reportType: ReportType | "UNKNOWN";
  isSupportedReport: boolean;
  confidence: number;
  battleTimeRaw: string;
  battleTimeIso: string;
  bountyOffender: VisionPlayer;
  leftPlayer: VisionPlayer;
  rightPlayer: VisionPlayer;
  notes: string;
}

export interface NormalizedPlayer {
  /** Visible full label without leading #server prefix, e.g. "[d00m]RAKK". */
  displayName: string;
  alliance: string;
  server: string;
  hasServerTag: boolean;
}

export interface ViolationDecision {
  reportType: ReportType;
  offendingAlliance: string;
  offendingPlayer: string;
  offendingServer: string;
  victimPlayer: string | null;
  /** ISO string, always truncated to the minute. */
  battleTimestamp: string;
  battleTimeRaw: string;
  isViolation: boolean;
  reason: string;
  confidence: number;
  notes: string;
}

export type RuleEvaluation =
  | { ok: true; decision: ViolationDecision }
  | {
      ok: false;
      code: "UNSUPPORTED_REPORT" | "INVALID_REPORT";
      message: string;
    };

export interface ViolationRecord {
  id: string;
  createdAt: string;
  reportType: ReportType;
  offendingAlliance: string;
  offendingPlayer: string;
  offendingServer: string;
  victimPlayer: string | null;
  battleTimestamp: string;
  isViolation: boolean;
  reason: string;
  imageUrl: string | null;
}

export interface LeaderboardEntry {
  alliance: string;
  violationCount: number;
  offenderCount: number;
  lastViolationAt: string | null;
}

export interface DashboardStats {
  violationCount: number;
  allianceCount: number;
}

export interface DashboardData {
  leaderboard: LeaderboardEntry[];
  latestViolations: ViolationRecord[];
  stats: DashboardStats;
  /** True when Supabase is unreachable or has not been configured yet. */
  dataUnavailable: boolean;
}

export type UploadOutcomeCode =
  | "VIOLATION_RECORDED"
  | "EXTERNAL_SERVER"
  | "DUPLICATE"
  | "UNSUPPORTED_REPORT"
  | "INVALID_REPORT"
  | "INVALID_IMAGE"
  | "AI_ERROR"
  | "CONFIGURATION_ERROR"
  | "STORAGE_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export interface UploadResponseRecord {
  reportType: ReportType;
  offendingAlliance: string;
  offendingPlayer: string;
  offendingServer: string;
  victimPlayer: string | null;
  battleTimestamp: string;
  isViolation: boolean;
  reason: string;
  imageUrl: string | null;
}

export interface UploadApiResponse {
  ok: boolean;
  code: UploadOutcomeCode;
  message: string;
  record?: UploadResponseRecord;
}
