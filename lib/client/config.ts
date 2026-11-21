export interface PublicSupabaseConfig {
  url: string;
  key: string;
  uploadUrl: string;
  adminUrl: string;
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(
    /\/+$/u,
    "",
  );
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";
  const configuredUploadUrl = (
    process.env.NEXT_PUBLIC_UPLOAD_FUNCTION_URL ?? ""
  )
    .trim()
    .replace(/\/+$/u, "");
  const uploadUrl =
    configuredUploadUrl ||
    (url ? `${url}/functions/v1/upload-report` : "");
  const adminUrl = url ? `${url}/functions/v1/admin-reports` : "";

  return { url, key, uploadUrl, adminUrl };
}
