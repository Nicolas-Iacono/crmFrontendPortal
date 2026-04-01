import {
  buildRedirectQueryPreservingExtras,
  shouldRedirectToSeoListingPath,
} from "./listingSearchParams";
import { buildSeoListingSlug } from "./seoListings";

/** Arma href del listado: `/propiedades?...` o `/casas-en-venta-x?...` */

export function buildListingsHref(
  pathPrefix: string,
  params: Record<string, string>
): string {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") p.set(k, v);
  });
  const q = p.toString();
  const base = pathPrefix.startsWith("/") ? pathPrefix : `/${pathPrefix}`;
  return q ? `${base}?${q}` : base;
}

/**
 * Ruta canónica para un conjunto de filtros: URL SEO si aplica, si no `/propiedades?...`.
 * Usar en paginación, orden y filtros (cliente).
 */
export function getListingPathForQueryString(params: Record<string, string>): string {
  if (shouldRedirectToSeoListingPath(params)) {
    try {
      const slug = buildSeoListingSlug({
        operacion: params.operacion,
        localidad: params.localidad,
        tipo: params.tipo || undefined,
      });
      const qs = buildRedirectQueryPreservingExtras(params);
      return qs ? `/${slug}${qs}` : `/${slug}`;
    } catch {
      /* seguir a /propiedades */
    }
  }
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") p.set(k, v);
  });
  const q = p.toString();
  return q ? `/propiedades?${q}` : "/propiedades";
}

export function getListingPathFromUrlSearchParams(search: URLSearchParams): string {
  const flat: Record<string, string> = {};
  search.forEach((value, key) => {
    flat[key] = value;
  });
  return getListingPathForQueryString(flat);
}
