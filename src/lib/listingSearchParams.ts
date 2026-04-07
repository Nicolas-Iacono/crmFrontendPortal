/** Normaliza query params del listado (misma lógica que /propiedades). */

export function normalizeListingSearchParams(
  raw: Record<string, string | undefined>
): Record<string, string> {
  const cleanParams: Record<string, string> = {};
  Object.entries(raw).forEach(([k, v]) => {
    if (v) cleanParams[k] = v;
  });
  if (!cleanParams.page) cleanParams.page = "0";
  if (!cleanParams.size) cleanParams.size = "12";
  if (!cleanParams.operacion && !cleanParams.usuarioId) cleanParams.operacion = "TODAS";
  if (cleanParams.operacion === "TODAS") delete cleanParams.operacion;
  if (!cleanParams.sort) cleanParams.sort = "fechaPublicacion";
  if (!cleanParams.dir) cleanParams.dir = "desc";
  return cleanParams;
}

/** Params que pueden vivir solo en la query junto a una ruta SEO. */
const SEO_ALLOWED_EXTRA = new Set([
  "page",
  "size",
  "sort",
  "dir",
  "precioMin",
  "precioMax",
  "ambientes",
  "dormitorios",
  "banos",
  "cochera",
  "pileta",
  "aceptaMascotas",
  "aptoProfesional",
  "patio",
  "jardin",
  "balcon",
  "terraza",
  "quincho",
  "laundry",
  "sum",
  "seguridad",
  "gimnasio",
  "ascensor",
]);

/**
 * ¿Redirigir /propiedades?operacion=&localidad= a /{slug}?
 * Solo si no hay vista inmobiliaria ni partido (el slug no lo modela aún).
 */
export function shouldRedirectToSeoListingPath(
  params: Record<string, string>
): boolean {
  if (params.usuarioId) return false;
  const op = params.operacion;
  if (op !== "VENTA" && op !== "ALQUILER") return false;
  if (!params.localidad?.trim()) return false;
  if (params.partido?.trim()) return false;

  for (const key of Object.keys(params)) {
    if (["operacion", "localidad", "tipo"].includes(key)) continue;
    if (!SEO_ALLOWED_EXTRA.has(key)) return false;
  }
  return true;
}

const SEO_QUERY_DEFAULTS: Record<string, string> = {
  page: "0",
  size: "12",
  sort: "fechaPublicacion",
  dir: "desc",
};

export function buildRedirectQueryPreservingExtras(
  params: Record<string, string>
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (["operacion", "localidad", "tipo"].includes(k)) continue;
    if (!v) continue;
    if (SEO_QUERY_DEFAULTS[k] === v) continue;
    p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}
