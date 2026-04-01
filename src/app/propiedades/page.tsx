import { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { fetchPropiedades, fetchFiltros } from "@/lib/api";
import {
  normalizeListingSearchParams,
  shouldRedirectToSeoListingPath,
  buildRedirectQueryPreservingExtras,
} from "@/lib/listingSearchParams";
import { buildSeoListingSlug } from "@/lib/seoListings";
import PropiedadesListingShell from "./PropiedadesListingShell";

export const metadata: Metadata = {
  title: "Propiedades exclusivas",
  description:
    "Explorá propiedades en venta y alquiler. Filtrá por ubicación, tipo, precio y más.",
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PropiedadesPage({ searchParams }: Props) {
  const raw = await searchParams;
  const cleanParams = normalizeListingSearchParams(raw);

  if (shouldRedirectToSeoListingPath(cleanParams)) {
    const slug = buildSeoListingSlug({
      operacion: cleanParams.operacion,
      localidad: cleanParams.localidad,
      tipo: cleanParams.tipo || undefined,
    });
    const qs = buildRedirectQueryPreservingExtras(cleanParams);
    permanentRedirect(qs ? `/${slug}${qs}` : `/${slug}`);
  }

  const [propiedades, filtros] = await Promise.all([
    fetchPropiedades(cleanParams).catch(() => ({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 12,
      first: true,
      last: true,
    })),
    fetchFiltros().catch(() => ({
      localidades: [],
      partidos: [],
      tipos: [],
      operaciones: [],
      precioMinimo: null,
      precioMaximo: null,
    })),
  ]);

  return (
    <PropiedadesListingShell
      filtros={filtros}
      cleanParams={cleanParams}
      propiedades={propiedades}
      clearFiltersHref="/propiedades"
    />
  );
}
