import type { ReportType } from "./types";

export const SITE = {
  name: "NAP WATCH",
  game: "LAST Z: SURVIVAL SHOOTER",
  server: "837",
  tagline: "Server 837 NAP violation radar",
} as const;

export const HOME_SERVER_ID = "837";
export const UNKNOWN_ALLIANCE = "UNKNOWN";
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_CLIENT_RAW_BYTES = 15 * 1024 * 1024;
export const MIN_EXTRACTION_CONFIDENCE = 0.55;
export const REPORTS_BUCKET_DEFAULT = "reports";

/** Screenshot formats accepted by the upload picker. */
export const CLIENT_INPUT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const REPORT_TYPES: readonly ReportType[] = [
  "BOUNTY_PLUNDER",
  "RESOURCE_TILE",
  "TRUCK_PLUNDER",
];

export const REPORT_TYPE_LABELS: Record<
  ReportType,
  { label: string; fullLabel: string; shortHint: string }
> = {
  BOUNTY_PLUNDER: {
    label: "Bounty Plunder",
    fullLabel: "Bounty mission plunder record",
    shortHint: "Mission record · the plunderer on the card",
  },
  RESOURCE_TILE: {
    label: "Resource Tile",
    fullLabel: "Resource tile battle report",
    shortHint: "VS report · right-side attacker only",
  },
  TRUCK_PLUNDER: {
    label: "Trade Truck",
    fullLabel: "Trade truck plunder report",
    shortHint: "VS right-side attacker or defense-log attacker",
  },
};

export const NAP_RULES = [
  {
    index: "01",
    title: "Bounty Plunder",
    detail: "A mission-record plunderer is scored when they belong to Server 837.",
  },
  {
    index: "02",
    title: "Resource Tile",
    detail: "Only the right-side attacker is scored; the left-side uploader never is.",
  },
  {
    index: "03",
    title: "Trade Truck",
    detail: "Use the VS right-side raider or the defense-log attacker. External servers are exempt.",
  },
] as const;
