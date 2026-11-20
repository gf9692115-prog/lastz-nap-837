import {
  HOME_SERVER_ID,
  MIN_EXTRACTION_CONFIDENCE,
  REPORT_TYPES,
  UNKNOWN_ALLIANCE,
} from "./constants.ts";
import type {
  NormalizedPlayer,
  ReportType,
  RuleEvaluation,
} from "./types.ts";

export const UNSUPPORTED_REPORT_MESSAGE =
  "请上传赏金记录、矿区争夺或贸易货车战报";

export const INVALID_REPORT_MESSAGE =
  "未能识别完整的违规方或战斗时间，请上传清晰、包含双方信息与时间的完整战报截图";

export const LOW_CONFIDENCE_MESSAGE =
  "识别把握不足，请上传更清晰、无遮挡的完整战报截图后重试";

const SERVER_PREFIX_RE = /^\s*#\s*(\d{2,5})(?=\D|$)/u;
const BRACKET_RE = /\[([^\[\]]+)\]/u;
const MAX_PLAYER_LENGTH = 160;
const MAX_ALLIANCE_LENGTH = 64;

const REPORT_TYPE_SET = new Set<string>(REPORT_TYPES);

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function cleanVisibleText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_ARABIC_INDIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function toAsciiDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndicIndex = ARABIC_INDIC_DIGITS.indexOf(digit);
    if (arabicIndicIndex >= 0) return String(arabicIndicIndex);
    return String(EXTENDED_ARABIC_INDIC_DIGITS.indexOf(digit));
  });
}

function normalizeServer(value: unknown): string {
  const cleaned = cleanVisibleText(value).replace(/^#/, "").trim();
  return /^\d{2,5}$/u.test(cleaned) ? cleaned : "";
}

function normalizeAlliance(value: unknown): string {
  let cleaned = cleanVisibleText(value);
  if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function buildDisplayFromParts(
  playerName: string,
  alliance: string,
): string {
  if (!playerName) return "";
  return alliance ? `[${alliance}]${playerName}` : playerName;
}

/**
 * Normalize the player name returned by the model.
 *
 * The rule is intentionally deterministic:
 * - a leading #XXX prefix defines the server;
 * - no prefix means the home server (837);
 * - an external server reported by the model is trusted only as a fallback when
 *   the raw label has no visible prefix. This can only turn a would-be
 *   violation into a non-violation, never the other way around.
 */
export function parsePlayerIdentity(
  value: unknown,
  homeServer = HOME_SERVER_ID,
): NormalizedPlayer | null {
  const record = asRecord(value);
  if (!record) return null;

  // Keep the visible player label byte-for-byte apart from whitespace cleanup.
  // Only timestamps/server parsing get digit normalization.
  const raw = cleanVisibleText(record.rawDisplayName);
  const modelPlayerName = cleanVisibleText(record.playerName);
  const modelAlliance = normalizeAlliance(record.alliance);
  const modelServer = normalizeServer(record.server);
  const modelSaysExternal =
    record.hasServerTag === true && Boolean(modelServer) && modelServer !== homeServer;

  const rawPrefix = raw.match(SERVER_PREFIX_RE);
  const rawDisplayWithoutServer = rawPrefix
    ? cleanVisibleText(raw.replace(SERVER_PREFIX_RE, ""))
    : raw;

  const hasServerTag = Boolean(rawPrefix) || modelSaysExternal;
  const server = rawPrefix
    ? rawPrefix[1]
    : modelSaysExternal
      ? modelServer
      : homeServer;

  const rawAlliance = rawDisplayWithoutServer.match(BRACKET_RE)?.[1]?.trim();
  const alliance = (rawAlliance || modelAlliance || "").trim();

  const displayName = rawDisplayWithoutServer
    ? rawDisplayWithoutServer
    : buildDisplayFromParts(modelPlayerName, alliance);

  if (!displayName) return null;
  if (displayName.length > MAX_PLAYER_LENGTH) return null;
  if (alliance.length > MAX_ALLIANCE_LENGTH) return null;

  return {
    displayName,
    alliance: alliance || UNKNOWN_ALLIANCE,
    server,
    hasServerTag,
  };
}

function createUtcIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string | null {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
}

const FULL_DATE_RE =
  /(\d{4})\s*[年./\-·•]\s*(\d{1,2})\s*[月./\-·•]\s*(\d{1,2})\s*日?[T\s,，،]*(\d{1,2})\s*[:：]\s*(\d{2})(?:\s*[:：]\s*(\d{2}))?/u;

const SHORT_DATE_RE =
  /(?:^|[^\d])(\d{1,2})\s*[月./\-·•]\s*(\d{1,2})\s*日?[T\s,，،]*(\d{1,2})\s*[:：]\s*(\d{2})(?:\s*[:：]\s*(\d{2}))?/u;

function parseIsoFallback(value: string): string | null {
  if (!value) return null;

  const isoLike = value.replace(/\s+/gu, "T");
  if (
    !/^\d{4}-\d{1,2}-\d{1,2}T\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/iu.test(
      isoLike,
    )
  ) {
    return null;
  }

  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/iu.test(isoLike);
  const candidate = hasZone ? isoLike : `${isoLike}Z`;
  const date = new Date(candidate);

  if (Number.isNaN(date.getTime())) return null;
  date.setUTCSeconds(0, 0);
  return date.toISOString();
}

/**
 * Convert the time printed on a report into a UTC ISO timestamp truncated to
 * the minute. The game clock is treated as UTC because Last Z screenshots do
 * not expose a timezone. A missing year uses the current UTC year.
 */
export function normalizeBattleTimestamp(
  rawValue: unknown,
  isoFallback?: unknown,
  now = new Date(),
): string | null {
  const raw = toAsciiDigits(cleanVisibleText(rawValue));
  const modelIso = toAsciiDigits(cleanVisibleText(isoFallback));
  const currentYear = now.getUTCFullYear();

  const fullMatch = raw.match(FULL_DATE_RE);
  if (fullMatch) {
    const result = createUtcIso(
      Number(fullMatch[1]),
      Number(fullMatch[2]),
      Number(fullMatch[3]),
      Number(fullMatch[4]),
      Number(fullMatch[5]),
    );
    if (result) return result;
  }

  const shortMatch = raw.match(SHORT_DATE_RE);
  if (shortMatch) {
    let first = Number(shortMatch[1]);
    let second = Number(shortMatch[2]);

    // The Last Z UI writes bounty dates as MM-DD. Keep DD-MM support for
    // screenshots where the day is unambiguously greater than 12.
    let month = first;
    let day = second;
    if (first > 12 && second <= 12) {
      day = first;
      month = second;
    }

    const result = createUtcIso(
      currentYear,
      month,
      day,
      Number(shortMatch[3]),
      Number(shortMatch[4]),
    );
    if (result) return result;
  }

  const fallback = parseIsoFallback(modelIso);
  if (fallback) return fallback;

  return null;
}

function reportTypeFrom(value: unknown): ReportType | null {
  return typeof value === "string" && REPORT_TYPE_SET.has(value)
    ? (value as ReportType)
    : null;
}

function numericConfidence(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0;
}

function buildReason(
  reportType: ReportType,
  server: string,
  alliance: string,
  isViolation: boolean,
): string {
  const serverLabel = `#${server}`;

  if (isViolation) {
    const context =
      reportType === "BOUNTY_PLUNDER"
        ? "赏金任务记录中的掠夺者"
        : reportType === "RESOURCE_TILE"
          ? "矿区争夺战报右侧进攻方"
          : "贸易货车战报右侧劫车方";

    const rule =
      reportType === "RESOURCE_TILE"
        ? "违反 837 服全服禁止抢矿规则"
        : reportType === "TRUCK_PLUNDER"
          ? "违反 837 服 NAP 货车保护规则"
          : "违反 837 服 NAP 赏金保护规则";

    const allianceText =
      alliance === UNKNOWN_ALLIANCE
        ? "未识别到该玩家联盟，暂记入 UNKNOWN"
        : `计入 [${alliance}]`;

    return `${context}来自 ${serverLabel} 本服，${rule}，${allianceText}。`;
  }

  if (reportType === "BOUNTY_PLUNDER") {
    return `赏金任务记录中的掠夺者来自 ${serverLabel} 外服，属于跨服玩法，不计入 837 服 NAP 违规。`;
  }

  if (reportType === "RESOURCE_TILE") {
    return `矿区争夺战报右侧进攻方来自 ${serverLabel} 外服，不计入 837 服 NAP 违规。`;
  }

  return `贸易货车战报右侧劫车方来自 ${serverLabel} 外服，属于正常跨服掠夺，不计入 837 服 NAP 违规。`;
}

/**
 * Apply Server 837 NAP rules to one model extraction.
 *
 * Critical anti-reversal rule: in VS reports the LEFT player is always the
 * uploader / victim. Only `rightPlayer` may become the offender. Bounty records
 * use `bountyOffender` and never either VS side.
 */
export function evaluateExtraction(
  rawExtraction: unknown,
  options: { now?: Date; homeServer?: string } = {},
): RuleEvaluation {
  const record = asRecord(rawExtraction);
  if (!record) {
    return { ok: false, code: "UNSUPPORTED_REPORT", message: UNSUPPORTED_REPORT_MESSAGE };
  }

  const reportType = reportTypeFrom(record.reportType);
  if (!reportType || record.isSupportedReport === false) {
    return { ok: false, code: "UNSUPPORTED_REPORT", message: UNSUPPORTED_REPORT_MESSAGE };
  }

  const confidence = numericConfidence(record.confidence);
  if (confidence < MIN_EXTRACTION_CONFIDENCE) {
    return { ok: false, code: "INVALID_REPORT", message: LOW_CONFIDENCE_MESSAGE };
  }

  const homeServer = options.homeServer ?? HOME_SERVER_ID;
  const selectedPlayer =
    reportType === "BOUNTY_PLUNDER"
      ? record.bountyOffender
      : record.rightPlayer;

  const offender = parsePlayerIdentity(selectedPlayer, homeServer);
  if (!offender) {
    return { ok: false, code: "INVALID_REPORT", message: INVALID_REPORT_MESSAGE };
  }

  const battleTimestamp = normalizeBattleTimestamp(
    record.battleTimeRaw,
    record.battleTimeIso,
    options.now,
  );
  if (!battleTimestamp) {
    return { ok: false, code: "INVALID_REPORT", message: INVALID_REPORT_MESSAGE };
  }

  let victimPlayer: string | null = null;
  if (reportType !== "BOUNTY_PLUNDER") {
    victimPlayer = parsePlayerIdentity(record.leftPlayer, homeServer)?.displayName ?? null;
  }

  const isViolation = offender.server === homeServer;
  const notes = cleanVisibleText(record.notes);
  const reason = buildReason(
    reportType,
    offender.server,
    offender.alliance,
    isViolation,
  );

  return {
    ok: true,
    decision: {
      reportType,
      offendingAlliance: offender.alliance,
      offendingPlayer: offender.displayName,
      offendingServer: offender.server,
      victimPlayer,
      battleTimestamp,
      battleTimeRaw:
        cleanVisibleText(record.battleTimeRaw) || cleanVisibleText(record.battleTimeIso),
      isViolation,
      reason,
      confidence,
      notes,
    },
  };
}
