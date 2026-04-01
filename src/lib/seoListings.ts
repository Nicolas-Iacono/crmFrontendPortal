/**
 * URLs amigables para SEO: /casas-en-venta-quilmes, /departamentos-en-alquiler-la-plata
 * Formato: {tipo-plural}-en-{venta|alquiler}-{localidad-slug}
 * Sin tipo específico: propiedades-en-venta-{localidad}
 */

import { normalizeListingSearchParams } from "./listingSearchParams";

export interface ParsedSeoListing {
  tipo: string;
  operacion: "VENTA" | "ALQUILER";
  localidad: string;
}

const TIPO_SLUG_MAP: Record<string, string> = {
  casa: "casas",
  departamento: "departamentos",
  ph: "ph",
  lote: "lotes",
  local: "locales",
  cochera: "cocheras",
  galpon: "galpones",
  galpón: "galpones",
  oficina: "oficinas",
  terreno: "terrenos",
  monoambiente: "monoambientes",
  duplex: "duplex",
  triplex: "triplex",
};

export function tipoToSlugSegment(tipo: string): string {
  const key = tipo.trim().toLowerCase();
  if (TIPO_SLUG_MAP[key]) return TIPO_SLUG_MAP[key];
  return key
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function localidadToSlug(localidad: string): string {
  return localidad
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function resolveLocalidadFromSlug(
  slug: string,
  localidades: string[]
): string | null {
  const target = slug.toLowerCase();
  for (const loc of localidades) {
    if (localidadToSlug(loc) === target) return loc;
  }
  if (target) {
    return slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return null;
}

const SLUG_TO_TIPO: Record<string, string> = Object.fromEntries(
  Object.entries(TIPO_SLUG_MAP).map(([tipo, slug]) => [slug, tipo.charAt(0).toUpperCase() + tipo.slice(1)])
);

export function slugSegmentToTipo(
  slug: string,
  tiposDisponibles: string[]
): string | null {
  const s = slug.toLowerCase();
  if (s === "propiedades") return "";
  for (const tipo of tiposDisponibles) {
    if (tipoToSlugSegment(tipo) === s) return tipo;
  }
  if (SLUG_TO_TIPO[s]) return SLUG_TO_TIPO[s];
  return null;
}

export function buildSeoListingSlug(input: {
  tipo?: string;
  operacion: string;
  localidad: string;
}): string {
  const op = input.operacion.toUpperCase();
  const opSlug = op === "VENTA" ? "venta" : op === "ALQUILER" ? "alquiler" : "";
  if (!opSlug) throw new Error("operacion invalida");
  const locSlug = localidadToSlug(input.localidad);
  if (!locSlug) throw new Error("localidad invalida");
  const tipoSlug = input.tipo?.trim()
    ? tipoToSlugSegment(input.tipo)
    : "propiedades";
  return `${tipoSlug}-en-${opSlug}-${locSlug}`;
}

export function parseSeoListingSlug(
  slug: string,
  tiposDisponibles: string[],
  localidadesDisponibles: string[]
): ParsedSeoListing | null {
  const lower = slug.toLowerCase();
  const idx = lower.indexOf("-en-");
  if (idx <= 0) return null;
  const tipoSlug = slug.slice(0, idx);
  const rest = slug.slice(idx + 4);
  if (!rest) return null;

  let operacionSlug: string | null = null;
  let localidadPart = "";
  const r = rest.toLowerCase();
  if (r.startsWith("alquiler-")) {
    operacionSlug = "alquiler";
    localidadPart = rest.slice("alquiler-".length);
  } else if (r.startsWith("venta-")) {
    operacionSlug = "venta";
    localidadPart = rest.slice("venta-".length);
  } else return null;

  if (!localidadPart) return null;

  const localidad = resolveLocalidadFromSlug(
    localidadPart.toLowerCase(),
    localidadesDisponibles
  );
  if (!localidad) return null;

  const tipo = slugSegmentToTipo(tipoSlug, tiposDisponibles);
  if (tipo === null) return null;

  return {
    tipo,
    operacion: operacionSlug === "venta" ? "VENTA" : "ALQUILER",
    localidad,
  };
}

export function mergeParsedSeoIntoSearchParams(
  parsed: ParsedSeoListing,
  rawQuery: Record<string, string | undefined>
): Record<string, string> {
  const merged: Record<string, string | undefined> = {
    ...rawQuery,
    operacion: parsed.operacion,
    localidad: parsed.localidad,
  };
  if (parsed.tipo) merged.tipo = parsed.tipo;
  else delete merged.tipo;
  return normalizeListingSearchParams(merged);
}

/** Detecta rutas tipo `/casas-en-venta-quilmes` (un solo segmento). */
export function isLikelySeoListingPathname(pathname: string | null | undefined): boolean {
  if (!pathname || pathname === "/") return false;
  const seg = pathname.split("/").filter(Boolean);
  if (seg.length !== 1) return false;
  return /^[a-z0-9-]+-en-(venta|alquiler)-[a-z0-9-]+$/i.test(seg[0]);
}

export function formatSeoListingH1(parsed: ParsedSeoListing): string {
  const op = parsed.operacion === "VENTA" ? "venta" : "alquiler";
  if (!parsed.tipo) {
    return `Propiedades en ${op} en ${parsed.localidad}`;
  }
  const t = parsed.tipo.trim().toLowerCase();
  const plural: Record<string, string> = {
    casa: "Casas",
    departamento: "Departamentos",
    ph: "PH",
    lote: "Lotes",
    local: "Locales",
    cochera: "Cocheras",
    monoambiente: "Monoambientes",
    terreno: "Terrenos",
    oficina: "Oficinas",
  };
  const head = plural[t] || parsed.tipo;
  return `${head} en ${op} en ${parsed.localidad}`;
}
