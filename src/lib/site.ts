/**
 * URL pública del portal en producción: https://portal.tuinmo.net
 * En local: definí NEXT_PUBLIC_PORTAL_URL en .env.local (ej. http://localhost:3000)
 */
export function getPortalBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_PORTAL_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://portal.tuinmo.net";
}
