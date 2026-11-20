export type ReportType =
  | "BOUNTY_PLUNDER"
  | "RESOURCE_TILE"
  | "TRUCK_PLUNDER";

export interface VisionPlayer {
  rawDisplayName: string;
  playerName: string;
  alliance: string;
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
