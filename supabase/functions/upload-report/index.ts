import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.119.2";

import { corsHeaders } from "../_shared/cors.ts";
import {
  DEEPSEEK_BASE_URL_DEFAULT,
  DEEPSEEK_MODEL_DEFAULT,
  HOME_SERVER_ID,
  MAX_UPLOAD_BYTES,
  REPORTS_BUCKET_DEFAULT,
  UNKNOWN_ALLIANCE,
} from "../_shared/constants.ts";
import {
  analyzeReportImage,
  DeepSeekAnalysisError,
  DeepSeekConfigurationError,
} from "../_shared/deepseek.ts";
import {
  detectSupportedImageMime,
  extensionForMime,
} from "../_shared/image.ts";
import { evaluateExtraction } from "../_shared/rules.ts";
import type {
  UploadApiResponse,
  UploadOutcomeCode,
  UploadResponseRecord,
} from "../_shared/types.ts";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  ...corsHeaders,
};

function jsonResponse(
  body: UploadApiResponse,
  status: number,
): Response {
  return Response.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

function failure(
  code: UploadOutcomeCode,
  message: string,
  status: number,
): Response {
  return jsonResponse({ ok: false, code, message }, status);
}

function friendlyAlliance(alliance: string): string {
  return alliance === UNKNOWN_ALLIANCE ? "未知联盟" : alliance;
}

function getServiceRoleKey(): string {
  const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysJson) {
    try {
      const keys = JSON.parse(secretKeysJson) as Record<string, unknown>;
      const preferred = keys.default;
      if (typeof preferred === "string" && preferred) return preferred;
      const first = Object.values(keys).find(
        (value): value is string => typeof value === "string" && Boolean(value),
      );
      if (first) return first;
    } catch {
      console.error("[upload-report] SUPABASE_SECRET_KEYS is not valid JSON");
    }
  }

  // Backward compatibility for projects still using legacy service_role keys.
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
}

async function removeEvidence(
  supabase: SupabaseClient,
  bucket: string,
  objectPath: string,
): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([objectPath]);
    if (error) {
      console.warn("[upload-report] cleanup failed:", error.message);
    }
  } catch (error) {
    console.warn(
      "[upload-report] cleanup failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return failure("INVALID_IMAGE", "仅支持 POST 上传", 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = getServiceRoleKey();
  const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY")?.trim();

  if (!supabaseUrl || !serviceRoleKey || !deepseekApiKey) {
    const missingConfig = [
      !supabaseUrl ? "SUPABASE_URL" : "",
      !serviceRoleKey ? "service_role_key" : "",
      !deepseekApiKey ? "DEEPSEEK_API_KEY" : "",
    ].filter(Boolean);

    console.error(
      "[upload-report] missing configuration:",
      missingConfig.join(", "),
    );

    return Response.json(
      {
        ok: false,
        code: "CONFIGURATION_ERROR",
        message: "服务尚未完成配置，请联系管理员",
        // Environment variable names only; never the values.
        missing_config: missingConfig,
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return failure("INVALID_IMAGE", "无法读取上传内容，请重新选择图片", 400);
  }

  const image = formData.get("image");
  if (!image || typeof image === "string") {
    return failure("INVALID_IMAGE", "请选择一张战报截图", 400);
  }

  if (image.size <= 0) {
    return failure("INVALID_IMAGE", "图片内容为空，请重新选择", 400);
  }

  if (image.size > MAX_UPLOAD_BYTES) {
    return failure("INVALID_IMAGE", "截图过大，请压缩后重试（最大 8MB）", 413);
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await image.arrayBuffer();
  } catch {
    return failure("INVALID_IMAGE", "无法读取图片，请重新选择", 400);
  }

  const bytes = new Uint8Array(arrayBuffer);
  const mimeType = detectSupportedImageMime(bytes);
  if (!mimeType) {
    return failure(
      "INVALID_IMAGE",
      "仅支持 JPG、PNG、WebP 格式的战报截图",
      415,
    );
  }

  let supabase: SupabaseClient;
  try {
    supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.error(
      "[upload-report] failed to create Supabase client:",
      error instanceof Error ? error.message : "unknown error",
    );
    return failure("CONFIGURATION_ERROR", "数据服务尚未就绪，请稍后重试", 503);
  }

  const bucket = Deno.env.get("SUPABASE_REPORTS_BUCKET")?.trim() ||
    REPORTS_BUCKET_DEFAULT;
  const now = new Date();
  const objectPath = `${now.getUTCFullYear()}/${String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0")}/${crypto.randomUUID()}.${extensionForMime(mimeType)}`;
  let uploadedPath: string | null = null;

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, new Blob([arrayBuffer], { type: mimeType }), {
        contentType: mimeType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload-report] storage upload failed:", uploadError.message);
      return failure("STORAGE_ERROR", "截图上传失败，请稍后重试", 502);
    }

    uploadedPath = objectPath;
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(objectPath);
    const imageUrl = publicUrlData.publicUrl;

    let extraction;
    try {
      extraction = await analyzeReportImage({
        bytes,
        mimeType,
        config: {
          apiKey: deepseekApiKey,
          baseUrl:
            Deno.env.get("DEEPSEEK_BASE_URL")?.trim() ||
            DEEPSEEK_BASE_URL_DEFAULT,
          model:
            Deno.env.get("DEEPSEEK_MODEL")?.trim() || DEEPSEEK_MODEL_DEFAULT,
        },
      });
    } catch (error) {
      await removeEvidence(supabase, bucket, objectPath);
      uploadedPath = null;

      if (error instanceof DeepSeekConfigurationError) {
        return failure(
          "CONFIGURATION_ERROR",
          "AI 服务尚未配置，请联系管理员",
          503,
        );
      }
      if (error instanceof DeepSeekAnalysisError) {
        return failure(
          "AI_ERROR",
          "AI 识别暂时失败，请稍后重试或换一张更清晰的截图",
          502,
        );
      }
      throw error;
    }

    const evaluation = evaluateExtraction(extraction);
    if (!evaluation.ok) {
      await removeEvidence(supabase, bucket, objectPath);
      uploadedPath = null;
      return failure(evaluation.code, evaluation.message, 422);
    }

    const decision = evaluation.decision;
    const record: UploadResponseRecord = {
      reportType: decision.reportType,
      offendingAlliance: decision.offendingAlliance,
      offendingPlayer: decision.offendingPlayer,
      offendingServer: decision.offendingServer,
      victimPlayer: decision.victimPlayer,
      battleTimestamp: decision.battleTimestamp,
      isViolation: decision.isViolation,
      reason: decision.reason,
      imageUrl,
    };

    const { error: insertError } = await supabase.from("violations").insert({
      report_type: decision.reportType,
      offending_alliance: decision.offendingAlliance,
      offending_player: decision.offendingPlayer,
      offending_server: decision.offendingServer,
      victim_player: decision.victimPlayer,
      battle_timestamp: decision.battleTimestamp,
      is_violation: decision.isViolation,
      reason: decision.reason,
      image_url: imageUrl,
    });

    if (insertError) {
      await removeEvidence(supabase, bucket, objectPath);
      uploadedPath = null;

      if (insertError.code === "23505") {
        return failure("DUPLICATE", "该战报已记录过，请勿重复提交", 409);
      }

      console.error("[upload-report] database insert failed:", insertError.message);
      const includeDebug =
        new URL(request.url).searchParams.get("debug") === "1";

      return Response.json(
        {
          ok: false,
          code: "DATABASE_ERROR",
          message: "战报保存失败，请稍后重试",
          ...(includeDebug
            ? {
                debug: {
                  code: insertError.code,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                },
              }
            : {}),
        },
        { status: 500, headers: NO_STORE_HEADERS },
      );
    }

    uploadedPath = null;

    console.info(
      `[upload-report] recorded type=${decision.reportType} server=#${decision.offendingServer} violation=${decision.isViolation} alliance=${decision.offendingAlliance}`,
    );

    if (decision.isViolation) {
      return jsonResponse(
        {
          ok: true,
          code: "VIOLATION_RECORDED",
          message: `违规已记录：计入 [${friendlyAlliance(
            decision.offendingAlliance,
          )}] 1 次违规`,
          record,
        },
        201,
      );
    }

    return jsonResponse(
      {
        ok: true,
        code: "EXTERNAL_SERVER",
        message: `该对手来自 #${decision.offendingServer} 服务器，属于正常跨服掠夺，不计入 ${HOME_SERVER_ID} 服 NAP 违规`,
        record,
      },
      201,
    );
  } catch (error) {
    if (uploadedPath) {
      await removeEvidence(supabase, bucket, uploadedPath);
    }

    console.error(
      "[upload-report] unexpected error:",
      error instanceof Error ? error.message : "unknown error",
    );

    if (error instanceof DeepSeekConfigurationError) {
      return failure(
        "CONFIGURATION_ERROR",
        "AI 服务尚未配置，请联系管理员",
        503,
      );
    }

    return failure("INTERNAL_ERROR", "服务暂时不可用，请稍后重试", 500);
  }
});
