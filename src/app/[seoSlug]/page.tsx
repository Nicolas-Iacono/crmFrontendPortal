import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPropiedades, fetchFiltros } from "@/lib/api";
import { getPortalBaseUrl } from "@/lib/site";
import {
  parseSeoListingSlug,
  mergeParsedSeoIntoSearchParams,
  formatSeoListingH1,
} from "@/lib/seoListings";
import PropiedadesListingShell from "../propiedades/PropiedadesListingShell";

type Props = {
  params: Promise<{ seoSlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoSlug } = await params;
  const filtros = await fetchFiltros().catch(() => ({
    localidades: [] as string[],
    tipos: [] as string[],
  }));
  const parsed = parseSeoListingSlug(seoSlug, filtros.tipos, filtros.localidades);
  if (!parsed) {
    return {
      title: "Propiedades | Tuinmo",
      description: "Buscá propiedades en venta y alquiler en Tuinmo.",
    };
  }
  const h1 = formatSeoListingH1(parsed);
  const opWord = parsed.operacion === "VENTA" ? "venta" : "alquiler";
  const tipoFrase = parsed.tipo
    ? `${parsed.tipo.toLowerCase()}s`
    : "propiedades";
  const base = getPortalBaseUrl();
  const canonical = `${base}/${seoSlug}`;

  return {
    title: `${h1} | Tuinmo`,
    description: `Encontrá ${tipoFrase} en ${opWord} en ${parsed.localidad}. Precios, fotos y contacto con inmobiliarias.`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${h1} | Tuinmo`,
      description: `Propiedades en ${parsed.localidad} — Tuinmo`,
      url: canonical,
    },
  };
}

export default async function SeoListingsPage({ params, searchParams }: Props) {
  const { seoSlug } = await params;
  const rawQuery = await searchParams;

  const filtros = await fetchFiltros().catch(() => ({
    localidades: [] as string[],
    partidos: [] as string[],
    tipos: [] as string[],
    operaciones: [] as string[],
    precioMinimo: null as number | null,
    precioMaximo: null as number | null,
  }));

  const parsed = parseSeoListingSlug(seoSlug, filtros.tipos, filtros.localidades);
  if (!parsed) notFound();

  const cleanParams = mergeParsedSeoIntoSearchParams(parsed, rawQuery);

  const propiedades = await fetchPropiedades(cleanParams).catch(() => ({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 12,
    first: true,
    last: true,
  }));

  const h1 = formatSeoListingH1(parsed);
  const subtitle = (
    <>
      {propiedades.totalElements} publicacion{propiedades.totalElements !== 1 ? "es" : ""} disponible
      {propiedades.totalElements !== 1 ? "s" : ""} en Tuinmo
    </>
  );

  return (
    <PropiedadesListingShell
      filtros={filtros}
      cleanParams={cleanParams}
      propiedades={propiedades}
      headingTitle={h1}
      headingSubtitle={subtitle}
      clearFiltersHref={`/${seoSlug}`}
    />
  );
}
