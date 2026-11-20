import { REPORT_TYPE_LABELS, UNKNOWN_ALLIANCE } from "./constants";
import type { ReportType } from "./types";

export function allianceDisplayName(alliance: string): string {
  return alliance === UNKNOWN_ALLIANCE ? "未知联盟" : alliance;
}

export function allianceBadge(alliance: string): string {
  return alliance === UNKNOWN_ALLIANCE ? "未知联盟" : `[${alliance}]`;
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
  return REPORT_TYPE_LABELS[reportType]?.label ?? "未知战报";
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
  if (!parts) return "时间未知";
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatShortBattleTimestamp(iso: string): string {
  const parts = getUtcParts(iso);
  if (!parts) return "时间未知";
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
