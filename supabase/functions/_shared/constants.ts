export const HOME_SERVER_ID = "837";
export const REPORT_TYPES = [
  "BOUNTY_PLUNDER",
  "RESOURCE_TILE",
  "TRUCK_PLUNDER",
] as const;
export const UNKNOWN_ALLIANCE = "UNKNOWN";
export const MIN_EXTRACTION_CONFIDENCE = 0.55;
export const DEEPSEEK_MODEL_DEFAULT = "deepseek-flash";
export const DEEPSEEK_BASE_URL_DEFAULT = "https://api.deepseek.com";
export const REPORTS_BUCKET_DEFAULT = "reports";
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_DEEPSEEK_TIMEOUT_MS = 50_000;

export const DEEPSEEK_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
