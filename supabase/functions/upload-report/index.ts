import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.119.2";

import { corsHeaders } from "../_shared/cors.ts";
import {
  DEEPSEEK_BASE_URL_DEFAULT,
  DEEPSEEK_MODEL_DEFAULT,
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
import {
  evaluateBountyExtraction,
  evaluateExtraction,
} from "../_shared/rules.ts";
import type {
  UploadApiResponse,
  UploadOutcomeCode,
  UploadResponseRecord,
  ViolationDecision,
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
  return alliance === UNKNOWN_ALLIANCE ? "Unknown" : alliance;
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
    return failure("INVALID_IMAGE", "Only POST uploads are supported.", 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = getServiceRoleKey();
  const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY")?.trim();

  if (!supabaseUrl || !serviceRoleKey || !deepseekApiKey) {
    // Log names only; never log secret values.
    console.error(
      "[upload-report] missing configuration:",
      [
        !supabaseUrl ? "SUPABASE_URL" : "",
        !serviceRoleKey ? "service_role_key" : "",
        !deepseekApiKey ? "DEEPSEEK_API_KEY" : "",
      ]
        .filter(Boolean)
        .join(", "),
    );

    return failure(
      "CONFIGURATION_ERROR",
      "The upload service is not fully configured. Contact the site admin.",
      503,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return failure("INVALID_IMAGE", "Could not read the upload. Choose the image again.", 400);
  }

  const image = formData.get("image");
  if (!image || typeof image === "string") {
    return failure("INVALID_IMAGE", "Choose a report screenshot.", 400);
  }

  if (image.size <= 0) {
    return failure("INVALID_IMAGE", "The uploaded image is empty. Choose it again.", 400);
  }

  if (image.size > MAX_UPLOAD_BYTES) {
    return failure("INVALID_IMAGE", "The screenshot is too large. Compress it and try again (max 8MB).", 413);
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await image.arrayBuffer();
  } catch {
    return failure("INVALID_IMAGE", "Could not read the image. Choose it again.", 400);
  }

  const bytes = new Uint8Array(arrayBuffer);
  const mimeType = detectSupportedImageMime(bytes);
  if (!mimeType) {
    return failure(
      "INVALID_IMAGE",
      "Only JPG, PNG, and WebP report screenshots are supported.",
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
    return failure("CONFIGURATION_ERROR", "The data service is not ready. Try again shortly.", 503);
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
      return failure("STORAGE_ERROR", "Evidence upload failed. Please try again.", 502);
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
          "The analysis service is not configured. Contact the site admin.",
          503,
        );
      }
      if (error instanceof DeepSeekAnalysisError) {
        return failure(
          "AI_ERROR",
          "AI analysis failed. Try again or upload a clearer screenshot.",
          502,
        );
      }
      throw error;
    }

    let decisions: ViolationDecision[];
    let skippedRows = 0;

    if (extraction.reportType === "BOUNTY_PLUNDER") {
      const batch = evaluateBountyExtraction(extraction);
      if (!batch.ok) {
        await removeEvidence(supabase, bucket, objectPath);
        uploadedPath = null;
        return failure(batch.code, batch.message, 422);
      }
      decisions = batch.decisions;
      skippedRows = batch.skipped;
    } else {
      const evaluation = evaluateExtraction(extraction);
      if (!evaluation.ok) {
        await removeEvidence(supabase, bucket, objectPath);
        uploadedPath = null;
        return failure(evaluation.code, evaluation.message, 422);
      }
      decisions = [evaluation.decision];
    }

    const inserted: UploadResponseRecord[] = [];
    let duplicateCount = 0;
    let databaseFailureCount = 0;

    for (const decision of decisions) {
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
        if (insertError.code === "23505") {
          duplicateCount += 1;
          continue;
        }

        databaseFailureCount += 1;
        console.error(
          `[upload-report] database insert failed for ${decision.offendingPlayer}:`,
          insertError.message,
        );
        continue;
      }

      inserted.push(record);
    }

    if (inserted.length === 0) {
      await removeEvidence(supabase, bucket, objectPath);
      uploadedPath = null;

      if (duplicateCount > 0 && databaseFailureCount === 0) {
        return failure(
          "DUPLICATE",
          `This report has already been recorded. ${duplicateCount} ${duplicateCount === 1 ? "row was" : "rows were"} skipped as duplicates.`,
          409,
        );
      }

      return failure("DATABASE_ERROR", "Could not save this report. Please try again.", 500);
    }

    uploadedPath = null;

    const violations = inserted.filter((record) => record.isViolation);
    const external = inserted.filter((record) => !record.isViolation);
    const messageParts: string[] = [];

    if (violations.length > 0) {
      const alliances = Array.from(
        new Set(violations.map((record) => friendlyAlliance(record.offendingAlliance))),
      );
      messageParts.push(
        `${violations.length} violation${violations.length === 1 ? "" : "s"} recorded for ${alliances.map((alliance) => `[${alliance}]`).join(", ")}.`,
      );
    }

    if (external.length > 0) {
      messageParts.push(
        `${external.length} external record${external.length === 1 ? "" : "s"} kept for audit.`,
      );
    }

    if (duplicateCount > 0) {
      messageParts.push(
        `${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"} skipped.`,
      );
    }

    if (skippedRows > 0) {
      messageParts.push(
        `${skippedRows} unreadable row${skippedRows === 1 ? "" : "s"} skipped.`,
      );
    }

    if (databaseFailureCount > 0) {
      messageParts.push(
        `${databaseFailureCount} record${databaseFailureCount === 1 ? "" : "s"} could not be saved.`,
      );
    }

    const primaryRecord =
      inserted.find((record) => record.isViolation) ?? inserted[0];
    console.info(
      `[upload-report] recorded ${inserted.length} record(s); ${violations.length} violation(s), ${external.length} external, ${duplicateCount} duplicate(s)`,
    );

    return jsonResponse(
      {
        ok: true,
        code: violations.length > 0 ? "VIOLATION_RECORDED" : "EXTERNAL_SERVER",
        message: messageParts.join(" "),
        record: primaryRecord,
        records: inserted,
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
        "The analysis service is not configured. Contact the site admin.",
        503,
      );
    }

    return failure("INTERNAL_ERROR", "The service is temporarily unavailable. Please try again.", 500);
  }
});
