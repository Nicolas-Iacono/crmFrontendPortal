/**
 * Quita barra final y, si copiaste la URL con sufijo `/api`, lo sacamos:
 * el código ya usa rutas tipo `/api/public/...`.
 */
function normalizeApiBase(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  let u = raw.trim().replace(/\/+$/, "");
  if (u.endsWith("/api")) u = u.replace(/\/api$/, "");
  return u.replace(/\/+$/, "");
}

/**
 * URL base del backend (solo origen, ej. `https://xxx.up.railway.app`).
 *
 * **Producción:** `API_URL` y/o `NEXT_PUBLIC_API_URL` (misma URL; sin `/api` al final o con `/api`, ambas sirven).
 */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const u = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
    return u || "";
  }
  const api = normalizeApiBase(process.env.API_URL);
  const pub = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  return api || pub || "http://localhost:8080";
}
