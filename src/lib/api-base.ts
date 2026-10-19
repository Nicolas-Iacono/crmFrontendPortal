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

/** API pública. Si el build del portal se hizo con la URL local, el navegador igual la usa en tuinmo.net. */
const API_PUBLICA = "https://crminmobiliario-app-production.up.railway.app";

function esLocal(valor: string): boolean {
  return /localhost|127\.0\.0\.1/.test(valor);
}

/**
 * URL base del backend (solo origen, ej. `https://xxx.up.railway.app`).
 *
 * **Producción:** `API_URL` y/o `NEXT_PUBLIC_API_URL` (misma URL; sin `/api` al final o con `/api`, ambas sirven).
 */
export function getApiBase(): string {
  const pub = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  if (typeof window !== "undefined") {
    const enTuinmo = window.location.hostname.endsWith("tuinmo.net");
    if (enTuinmo && (!pub || esLocal(pub))) return API_PUBLICA;
    return pub || "";
  }
  const api = normalizeApiBase(process.env.API_URL);
  return api || pub || "http://localhost:8080";
}
