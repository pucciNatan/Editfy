export function getUserIdFromAccess(token?: string | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json.user_id ?? null;
  } catch {
    return null;
  }
}