import { REPORT_TYPE_LABELS, UNKNOWN_ALLIANCE } from "./constants";
import type { ReportType } from "./types";

export function allianceDisplayName(alliance: string): string {
  return alliance === UNKNOWN_ALLIANCE ? "Unknown" : alliance;
}

export function allianceBadge(alliance: string): string {
  return alliance === UNKNOWN_ALLIANCE ? "Unknown" : `[${alliance}]`;
}

export function playerNameWithoutAlliance(
  fullName: string,
  alliance: string,
): string {
  if (alliance === UNKNOWN_ALLIANCE) return fullName;
  const prefix = `[${alliance}]`;
  return fullName.startsWith(prefix)
    ? fullName.slice(prefix.length).trim() || fullName
    : fullName;
}

export function reportTypeLabel(reportType: ReportType): string {
  return REPORT_TYPE_LABELS[reportType]?.label ?? "Unknown report";
}

export function evidenceAssessment(reportType: ReportType): string {
  switch (reportType) {
    case "BOUNTY_PLUNDER":
      return "The plunderer shown on this bounty record belongs to Server 837. Bounty plundering is prohibited under the Server 837 NAP and is counted on the alliance leaderboard.";
    case "RESOURCE_TILE":
      return "The right-side attacker on this resource-tile report belongs to Server 837. Resource-tile attacks are prohibited under the Server 837 NAP and are counted on the alliance leaderboard.";
    case "TRUCK_PLUNDER":
      return "The trade-truck attacker on this report belongs to Server 837. Same-server trade-truck raids are prohibited under the Server 837 NAP and are counted on the alliance leaderboard.";
    default:
      return "This report was confirmed under the Server 837 NAP.";
  }
}

interface UtcDateParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

function getUtcParts(iso: string): UtcDateParts | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, "0"),
    day: String(date.getUTCDate()).padStart(2, "0"),
    hour: String(date.getUTCHours()).padStart(2, "0"),
    minute: String(date.getUTCMinutes()).padStart(2, "0"),
  };
}

export function formatBattleTimestamp(iso: string): string {
  const parts = getUtcParts(iso);
  if (!parts) return "Unknown time";
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatShortBattleTimestamp(iso: string): string {
  const parts = getUtcParts(iso);
  if (!parts) return "Unknown time";
  return `${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
