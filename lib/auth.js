const COOKIE_NAME = "calming_user_id";

export function createAuthCookie(userId) {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  const cookie = [
    `${COOKIE_NAME}=${userId}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    isProd ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");

  return cookie;
}

export function clearAuthCookie() {
  const isProd = process.env.NODE_ENV === "production";
  const cookie = [
    `${COOKIE_NAME}=guest`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 30}`,
    isProd ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");

  return cookie;
}
