import { createClient } from "npm:@supabase/supabase-js@2.119.2";

const SITE_ORIGINS = new Set([
  "https://gf9692115-prog.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);
const DEFAULT_ORIGIN = "https://gf9692115-prog.github.io";
const REPORTS_BUCKET = "reports";
const MIN_TOKEN_LENGTH = 16;
const MAX_LIST_ROWS = 200;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type AdminRecord = {
  id: string;
  createdAt: string;
  reportType: string;
  offendingAlliance: string;
  offendingPlayer: string;
  offendingServer: string;
  victimPlayer: string | null;
  battleTimestamp: string;
  isViolation: boolean;
  imageUrl: string | null;
};

function responseHeaders(origin: string | null): Record<string, string> {
  const allowOrigin =
    origin && SITE_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-admin-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Cache-Control": "no-store, max-age=0",
    Vary: "Origin",
  };
}

function json(
  body: Record<string, unknown>,
  status: number,
  origin: string | null,
): Response {
  return Response.json(body, {
    status,
    headers: responseHeaders(origin),
  });
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
      console.error("[admin-reports] SUPABASE_SECRET_KEYS is not valid JSON");
    }
  }

  // Backward compatibility for projects still using legacy service_role keys.
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
}

async function tokensMatch(presented: string, expected: string): Promise<boolean> {
  if (!presented) return false;

  const encoder = new TextEncoder();
  const [presentedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(presented)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);

  const presentedBytes = new Uint8Array(presentedHash);
  const expectedBytes = new Uint8Array(expectedHash);
  let diff = 0;
  for (let index = 0; index < presentedBytes.length; index += 1) {
    diff |= presentedBytes[index] ^ expectedBytes[index];
  }
  return diff === 0;
}

function evidenceObjectPath(imageUrl: unknown): string | null {
  if (typeof imageUrl !== "string") return null;

  try {
    const url = new URL(imageUrl);
    const marker = `/storage/v1/object/public/${REPORTS_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    const objectPath = decodeURIComponent(
      url.pathname.slice(markerIndex + marker.length),
    );
    return objectPath || null;
  } catch {
    return null;
  }
}

function toAdminRecord(row: Record<string, unknown>): AdminRecord {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    reportType: String(row.report_type),
    offendingAlliance: String(row.offending_alliance ?? ""),
    offendingPlayer: String(row.offending_player ?? ""),
    offendingServer: String(row.offending_server ?? ""),
    victimPlayer:
      typeof row.victim_player === "string" ? row.victim_player : null,
    battleTimestamp: String(row.battle_timestamp),
    isViolation: Boolean(row.is_violation),
    imageUrl: typeof row.image_url === "string" ? row.image_url : null,
  };
}

Deno.serve(async (request: Request): Promise<Response> => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: responseHeaders(origin),
    });
  }

  if (request.method !== "POST") {
    return json(
      {
        ok: false,
        code: "INVALID_REQUEST",
        message: "Only POST requests are supported.",
      },
      405,
      origin,
    );
  }

  const configuredToken = Deno.env.get("ADMIN_DELETE_TOKEN")?.trim() ?? "";
  if (configuredToken.length < MIN_TOKEN_LENGTH) {
    return json(
      {
        ok: false,
        code: "CONFIGURATION_ERROR",
        message: "Admin access is not configured. Add ADMIN_DELETE_TOKEN to Edge Function secrets.",
      },
      503,
      origin,
    );
  }

  const presentedToken = request.headers.get("x-admin-token")?.trim() ?? "";
  if (!(await tokensMatch(presentedToken, configuredToken))) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return json(
      {
        ok: false,
        code: "UNAUTHORIZED",
        message: "Invalid admin passphrase.",
      },
      401,
      origin,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      {
        ok: false,
        code: "CONFIGURATION_ERROR",
        message: "The admin data service is not configured.",
      },
      503,
      origin,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(
      {
        ok: false,
        code: "INVALID_REQUEST",
        message: "Invalid JSON request body.",
      },
      400,
      origin,
    );
  }

  const action = typeof body.action === "string" ? body.action : "";
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (action === "list") {
    const { data, error } = await supabase
      .from("violations")
      .select(
        "id,created_at,report_type,offending_alliance,offending_player,offending_server,victim_player,battle_timestamp,is_violation,image_url",
      )
      .order("created_at", { ascending: false })
      .limit(MAX_LIST_ROWS);

    if (error) {
      console.error("[admin-reports] list failed:", error.message);
      return json(
        {
          ok: false,
          code: "DATABASE_ERROR",
          message: "Could not load the moderation archive.",
        },
        500,
        origin,
      );
    }

    const records = ((data ?? []) as Record<string, unknown>[]).map(
      toAdminRecord,
    );
    return json({ ok: true, records }, 200, origin);
  }

  if (action === "delete") {
    const id = typeof body.id === "string" ? body.id : "";
    if (!UUID_RE.test(id)) {
      return json(
        {
          ok: false,
          code: "INVALID_REQUEST",
          message: "Invalid record id.",
        },
        400,
        origin,
      );
    }

    const { data: existing, error: lookupError } = await supabase
      .from("violations")
      .select("id,image_url")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      console.error("[admin-reports] lookup failed:", lookupError.message);
      return json(
        {
          ok: false,
          code: "DATABASE_ERROR",
          message: "Could not inspect this record.",
        },
        500,
        origin,
      );
    }

    if (!existing) {
      return json(
        {
          ok: false,
          code: "NOT_FOUND",
          message: "This record no longer exists.",
        },
        404,
        origin,
      );
    }

    const { error: deleteError } = await supabase
      .from("violations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[admin-reports] delete failed:", deleteError.message);
      return json(
        {
          ok: false,
          code: "DATABASE_ERROR",
          message: "Could not delete this record.",
        },
        500,
        origin,
      );
    }

    const objectPath = evidenceObjectPath(existing.image_url);
    if (objectPath) {
      const { error: storageError } = await supabase.storage
        .from(REPORTS_BUCKET)
        .remove([objectPath]);
      if (storageError) {
        console.error(
          "[admin-reports] evidence cleanup failed:",
          storageError.message,
        );
      }
    }

    console.info("[admin-reports] record deleted:", id);
    return json({ ok: true, deletedId: id }, 200, origin);
  }

  return json(
    {
      ok: false,
      code: "INVALID_REQUEST",
      message: "Unknown admin action.",
    },
    400,
    origin,
  );
});
