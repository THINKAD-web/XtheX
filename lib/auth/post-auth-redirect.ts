/** Relative path after successful login (role-based). */
export function postAuthRedirectPath(role: string | undefined | null): string {
  if (role === "ADMIN") return "/admin";
  if (role === "MEDIA_OWNER") return "/dashboard/media-owner";
  return "/dashboard/advertiser";
}

export function safeInternalCallbackUrl(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}
