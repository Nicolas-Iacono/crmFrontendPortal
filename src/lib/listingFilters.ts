/** Query params soportados por GET /api/public/propiedades (Spring) */

export type BooleanFilterParam =
  | "cochera"
  | "pileta"
  | "aceptaMascotas"
  | "aptoProfesional"
  | "patio"
  | "jardin"
  | "balcon"
  | "terraza"
  | "quincho"
  | "laundry"
  | "sum"
  | "seguridad"
  | "gimnasio"
  | "ascensor";

export interface BooleanFilterDef {
  param: BooleanFilterParam;
  label: string;
  icon: string;
}

/** Comodidades / amenities (toggle) */
export const PORTAL_AMENITY_FILTERS: BooleanFilterDef[] = [
  { param: "cochera", label: "Cochera", icon: "garage" },
  { param: "patio", label: "Patio", icon: "deck" },
  { param: "jardin", label: "Jardín", icon: "grass" },
  { param: "pileta", label: "Pileta", icon: "pool" },
  { param: "balcon", label: "Balcón", icon: "balcony" },
  { param: "terraza", label: "Terraza", icon: "roofing" },
  { param: "quincho", label: "Quincho / parrilla", icon: "outdoor_grill" },
  { param: "laundry", label: "Lavadero", icon: "local_laundry_service" },
  { param: "sum", label: "SUM", icon: "groups" },
  { param: "seguridad", label: "Seguridad / portero", icon: "security" },
  { param: "gimnasio", label: "Gimnasio", icon: "fitness_center" },
  { param: "ascensor", label: "Ascensor", icon: "elevator" },
  { param: "aceptaMascotas", label: "Mascotas", icon: "pets" },
  { param: "aptoProfesional", label: "Apto profesional", icon: "work" },
];

export function booleanFiltersFromParams(
  params: Record<string, string>
): Record<BooleanFilterParam, boolean> {
  const o = {} as Record<BooleanFilterParam, boolean>;
  for (const { param } of PORTAL_AMENITY_FILTERS) {
    o[param] = params[param] === "true";
  }
  return o;
}

export function appendBooleanFilters(
  p: URLSearchParams,
  flags: Record<BooleanFilterParam, boolean>
) {
  for (const { param } of PORTAL_AMENITY_FILTERS) {
    if (flags[param]) p.set(param, "true");
  }
}

export function preserveSortAndUsuario(
  p: URLSearchParams,
  currentParams: Record<string, string>
) {
  if (currentParams.sort) p.set("sort", currentParams.sort);
  if (currentParams.dir) p.set("dir", currentParams.dir);
  if (currentParams.usuarioId) p.set("usuarioId", currentParams.usuarioId);
  if (currentParams.inmobiliariaNombre)
    p.set("inmobiliariaNombre", currentParams.inmobiliariaNombre);
}
