import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  HOME_SERVER_ID,
  MAX_UPLOAD_BYTES,
  UNKNOWN_ALLIANCE,
} from "@/lib/constants";
import {
  analyzeReportImage,
  DeepSeekAnalysisError,
  DeepSeekConfigurationError,
} from "@/lib/deepseek";
import {
  getReportsBucket,
  getSupabaseAdmin,
  getSupabaseConfigStatus,
} from "@/lib/supabase/admin";
import {
  detectSupportedImageMime,
  extensionForMime,
} from "@/lib/server/image-file";
import type {
  UploadApiResponse,
  UploadOutcomeCode,
  UploadResponseRecord,
} from "@/lib/types";
import { evaluateExtraction } from "@/lib/violation-rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

function jsonResponse(
  body: UploadApiResponse,
  status: number,
): NextResponse<UploadApiResponse> {
  return NextResponse.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

function failure(
  code: UploadOutcomeCode,
  message: string,
  status: number,
): NextResponse<UploadApiResponse> {
  return jsonResponse({ ok: false, code, message }, status);
}

async function removeEvidence(
  supabase: SupabaseClient,
  bucket: string,
  objectPath: string,
): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([objectPath]);
    if (error) {
      console.warn("[upload] failed to clean up evidence:", error.message);
    }
  } catch (error) {
    console.warn(
      "[upload] failed to clean up evidence:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

function friendlyAlliance(alliance: string): string {
  return alliance === UNKNOWN_ALLIANCE ? "未知联盟" : alliance;
}

export async function POST(
  request: Request,
): Promise<NextResponse<UploadApiResponse>> {
  const supabaseStatus = getSupabaseConfigStatus();
  if (!supabaseStatus.configured || !process.env.DEEPSEEK_API_KEY?.trim()) {
    console.error(
      "[upload] missing server configuration:",
      [
        ...supabaseStatus.missing,
        ...(process.env.DEEPSEEK_API_KEY?.trim()
          ? []
          : ["DEEPSEEK_API_KEY"]),
      ].join(", "),
    );
    return failure(
      "CONFIGURATION_ERROR",
      "服务尚未完成配置，请联系管理员",
      503,
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
    return failure(
      "INVALID_IMAGE",
      "截图过大，请压缩后重试（最大 8MB）",
      413,
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await image.arrayBuffer());
  } catch {
    return failure("INVALID_IMAGE", "无法读取图片，请重新选择", 400);
  }

  const mimeType = detectSupportedImageMime(buffer);
  if (!mimeType) {
    return failure(
      "INVALID_IMAGE",
      "仅支持 JPG、PNG、WebP 格式的战报截图",
      415,
    );
  }

  let supabase: SupabaseClient;
  let bucket: string;
  try {
    supabase = getSupabaseAdmin();
    bucket = getReportsBucket();
  } catch (error) {
    console.error(
      "[upload] failed to initialize Supabase:",
      error instanceof Error ? error.message : "unknown error",
    );
    return failure("CONFIGURATION_ERROR", "数据服务尚未就绪，请稍后重试", 503);
  }

  const now = new Date();
  const objectPath = `${now.getUTCFullYear()}/${String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0")}/${randomUUID()}.${extensionForMime(mimeType)}`;

  let uploadedPath: string | null = null;

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        contentType: mimeType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload] storage upload failed:", uploadError.message);
      return failure("STORAGE_ERROR", "截图上传失败，请稍后重试", 502);
    }

    uploadedPath = objectPath;
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(objectPath);
    const imageUrl = publicUrlData.publicUrl;

    let extraction;
    try {
      extraction = await analyzeReportImage({ buffer, mimeType });
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

      console.info(
        `[upload] rejected ${evaluation.code.toLowerCase()} (${extraction.reportType})`,
      );
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
        return failure(
          "DUPLICATE",
          "该战报已记录过，请勿重复提交",
          409,
        );
      }

      console.error("[upload] database insert failed:", insertError.message);
      return failure("DATABASE_ERROR", "战报保存失败，请稍后重试", 500);
    }

    uploadedPath = null;

    console.info(
      `[upload] recorded type=${decision.reportType} server=#${decision.offendingServer} violation=${decision.isViolation} alliance=${decision.offendingAlliance}`,
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
      "[upload] unexpected error:",
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
}
