/**
 * The public upload function is called from a static GitHub Pages origin.
 * Authentication is intentionally absent (same open-upload model as phase 1),
 * so CORS must allow browser calls from the deployed site.
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
