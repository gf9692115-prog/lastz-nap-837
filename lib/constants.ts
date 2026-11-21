import type { ReportType } from "./types";

export const SITE = {
  name: "NAP WATCH",
  game: "LAST Z: SURVIVAL SHOOTER",
  server: "837",
  tagline: "837 服联盟 NAP 违规雷达",
} as const;

export const HOME_SERVER_ID = "837";
export const UNKNOWN_ALLIANCE = "UNKNOWN";
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_CLIENT_RAW_BYTES = 15 * 1024 * 1024;
export const MIN_EXTRACTION_CONFIDENCE = 0.55;
export const DEEPSEEK_MODEL_DEFAULT = "deepseek-flash";
export const DEEPSEEK_BASE_URL_DEFAULT = "https://api.deepseek.com";
export const REPORTS_BUCKET_DEFAULT = "reports";

/** Formats accepted by DeepSeek's vision input after client-side conversion. */
export const DEEPSEEK_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** HEIC/HEIF are accepted from phones only so the client can convert them. */
export const CLIENT_INPUT_IMAGE_MIME_TYPES = [
  ...DEEPSEEK_IMAGE_MIME_TYPES,
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
    label: "赏金掠夺",
    fullLabel: "赏金任务掠夺记录",
    shortHint: "任务记录 · 卡片中的掠夺者",
  },
  RESOURCE_TILE: {
    label: "矿区争夺",
    fullLabel: "矿区争夺战报",
    shortHint: "VS 战报 · 只看右侧进攻方",
  },
  TRUCK_PLUNDER: {
    label: "贸易货车",
    fullLabel: "贸易货车掠夺战报",
    shortHint: "VS 右侧劫车方 / 详情日志攻击者",
  },
};

export const NAP_RULES = [
  {
    index: "01",
    title: "赏金掠夺",
    detail: "任务记录卡片上的掠夺者若为本服玩家，计违规。",
  },
  {
    index: "02",
    title: "矿区争夺",
    detail: "只取战报右侧进攻方的联盟；左侧上传者永不计分。",
  },
  {
    index: "03",
    title: "贸易货车",
    detail:
      "VS 右侧劫车方，或货车详情「战斗记录」里的进攻玩家；外服不计。",
  },
] as const;
