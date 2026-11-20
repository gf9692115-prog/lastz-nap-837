import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { REPORTS_BUCKET_DEFAULT } from "../constants";

export class SupabaseConfigurationError extends Error {
  constructor(message = "Supabase is not configured") {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

let adminClient: SupabaseClient | null = null;

export function getSupabaseConfigStatus(): {
  configured: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  return { configured: missing.length === 0, missing };
}

/**
 * Server-only Supabase client using the service role. Never import this module
 * from a Client Component.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new SupabaseConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing",
    );
  }

  adminClient = createClient(url.replace(/\/+$/u, ""), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "lastz-nap-837",
      },
    },
  });

  return adminClient;
}

export function getReportsBucket(): string {
  return process.env.SUPABASE_REPORTS_BUCKET?.trim() || REPORTS_BUCKET_DEFAULT;
}
