const COOKIE_NAME = "calming_user_id";

const envDefault = Number(process.env.DEFAULT_USER_ID ?? 0);
const fallbackUserId = Number.isFinite(envDefault) && envDefault > 0 ? envDefault : null;

export function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }
  return cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) {
      return acc;
    }
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function extractUserIdFromCookies(cookieHeader) {
  const cookies = parseCookies(cookieHeader);
  if (!Object.prototype.hasOwnProperty.call(cookies, COOKIE_NAME)) {
    return undefined;
  }
  const raw = cookies[COOKIE_NAME];
  if (!raw || raw === "guest") {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function getCurrentUserId(req) {
  const cookieHeader = req?.headers?.cookie;
  const cookieValue = extractUserIdFromCookies(cookieHeader);
  if (cookieValue !== undefined) {
    return cookieValue;
  }
  return fallbackUserId ?? null;
}

export function hasAuthenticatedUser(req) {
  const userId = getCurrentUserId(req);
  return typeof userId === "number" && userId > 0;
}

export function getUserIdForClient(cookieString) {
  const cookieValue = extractUserIdFromCookies(cookieString);
  if (cookieValue !== undefined) {
    return cookieValue;
  }
  return fallbackUserId;
}
