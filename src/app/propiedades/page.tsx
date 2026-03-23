import { Metadata } from "next";
import { fetchPropiedades, fetchFiltros } from "@/lib/api";
import ListingPropertyCard from "@/components/ListingPropertyCard";
import ListingsFilterSidebar from "./ListingsFilterSidebar";
import FilterBar from "./FilterBar";
import PropiedadesSort from "./PropiedadesSort";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Propiedades exclusivas",
  description:
    "Explorá propiedades en venta y alquiler. Filtrá por ubicación, tipo, precio y más.",
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function visiblePageIndices(current: number, total: number): number[] {
  const maxButtons = 9;
  if (total <= maxButtons) return Array.from({ length: total }, (_, i) => i);
  let start = Math.max(0, current - 4);
  let end = Math.min(total, start + maxButtons);
  if (end - start < maxButtons) start = Math.max(0, end - maxButtons);
  return Array.from({ length: end - start }, (_, i) => start + i);
}

export default async function PropiedadesPage({ searchParams }: Props) {
  const params = await searchParams;
  const cleanParams: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v) cleanParams[k] = v;
  });
  if (!cleanParams.page) cleanParams.page = "0";
  if (!cleanParams.size) cleanParams.size = "12";
  // Sin filtro de inmobiliaria: por defecto venta. Con usuarioId: mostrar venta + alquiler salvo que venga operacion en la URL.
  if (!cleanParams.operacion && !cleanParams.usuarioId) cleanParams.operacion = "VENTA";
  if (!cleanParams.sort) cleanParams.sort = "fechaPublicacion";
  if (!cleanParams.dir) cleanParams.dir = "desc";

  const inmobiliariaNombre = cleanParams.inmobiliariaNombre?.trim() || null;

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

  const currentPage = propiedades.number;
  const totalPages = propiedades.totalPages;
  const visiblePages = totalPages > 1 ? visiblePageIndices(currentPage, totalPages) : [];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 flex gap-6 lg:gap-10 pb-24 md:pb-20">
      <ListingsFilterSidebar filtros={filtros} currentParams={cleanParams} />

      <main className="flex-1 min-w-0">
        <div className="lg:hidden mb-6">
          <FilterBar filtros={filtros} currentParams={cleanParams} />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-4">
          <div className="min-w-0">
            <h1 className="font-headline font-extrabold text-3xl sm:text-4xl text-on-surface tracking-tight mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl sm:text-4xl">apartment</span>
              {cleanParams.usuarioId
                ? inmobiliariaNombre || "Inmobiliaria"
                : "Propiedades exclusivas"}
            </h1>
            <p className="text-on-surface-variant font-body">
              {cleanParams.usuarioId ? (
                <>
                  Propiedades publicadas en Tuinmo · {propiedades.totalElements} publicación
                  {propiedades.totalElements !== 1 ? "es" : ""}
                </>
              ) : (
                <>
                  {propiedades.totalElements} publicacion{propiedades.totalElements !== 1 ? "es" : ""} disponible
                  {propiedades.totalElements !== 1 ? "s" : ""}
                </>
              )}
            </p>
            {cleanParams.usuarioId && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href="/inmobiliarias"
                  className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Todas las inmobiliarias
                </Link>
                <span className="text-on-surface-variant">·</span>
                <Link
                  href="/propiedades"
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Ver todo el portal
                </Link>
              </div>
            )}
          </div>
          <PropiedadesSort currentParams={cleanParams} />
        </div>

        {propiedades.content.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
            {propiedades.content.map((p) => (
              <ListingPropertyCard key={p.id} prop={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-lg bg-surface-container-low border border-outline-variant/20">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">search_off</span>
            <h3 className="text-lg font-headline font-semibold text-on-surface mb-1">No hay resultados</h3>
            <p className="text-sm text-on-surface-variant font-body mb-6">Probá otros filtros o zona</p>
            <Link href="/propiedades" className="inline-block bg-primary text-white px-6 py-2 rounded-full text-sm font-bold">
              Limpiar filtros
            </Link>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-16 flex justify-center">
            <div className="inline-flex items-center gap-1 sm:gap-2 bg-surface-container-low p-2 rounded-full flex-wrap justify-center max-w-full">
              {currentPage > 0 && (
                <Link
                  href={`/propiedades?${new URLSearchParams({ ...cleanParams, page: String(currentPage - 1) }).toString()}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-surface-variant shrink-0"
                  aria-label="Anterior"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </Link>
              )}
              {visiblePages[0] > 0 && (
                <>
                  <Link
                    href={`/propiedades?${new URLSearchParams({ ...cleanParams, page: "0" }).toString()}`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      currentPage === 0 ? "bg-primary text-white" : "text-on-surface hover:bg-surface-variant"
                    }`}
                  >
                    1
                  </Link>
                  {visiblePages[0] > 1 && <span className="px-1 text-on-surface-variant">...</span>}
                </>
              )}
              {visiblePages.map((item) => (
                <Link
                  key={item}
                  href={`/propiedades?${new URLSearchParams({ ...cleanParams, page: String(item) }).toString()}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    item === currentPage ? "bg-primary text-white" : "text-on-surface hover:bg-surface-variant"
                  }`}
                >
                  {item + 1}
                </Link>
              ))}
              {visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <>
                  {visiblePages[visiblePages.length - 1] < totalPages - 2 && (
                    <span className="px-1 text-on-surface-variant">...</span>
                  )}
                  <Link
                    href={`/propiedades?${new URLSearchParams({ ...cleanParams, page: String(totalPages - 1) }).toString()}`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      currentPage === totalPages - 1 ? "bg-primary text-white" : "text-on-surface hover:bg-surface-variant"
                    }`}
                  >
                    {totalPages}
                  </Link>
                </>
              )}
              {!propiedades.last && (
                <Link
                  href={`/propiedades?${new URLSearchParams({ ...cleanParams, page: String(currentPage + 1) }).toString()}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-surface-variant shrink-0"
                  aria-label="Siguiente"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
