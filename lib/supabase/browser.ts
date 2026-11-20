import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicSupabaseConfig } from "../client/config";

let browserClient: SupabaseClient | null = null;

/**
 * Public browser client. Only use the anon/publishable key here. The service
 * role key lives exclusively in the Supabase Edge Function environment.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) return browserClient;

  const { url, key } = getPublicSupabaseConfig();
  if (!url || !key) return null;

  browserClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return browserClient;
}
