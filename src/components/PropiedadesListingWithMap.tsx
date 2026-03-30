"use client";

import type { PropiedadLista } from "@/lib/api";
import { fetchPropiedadesClient } from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";
import ListingPropertyCard from "./ListingPropertyCard";
import ListingsLeafletMap from "./ListingsLeafletMap";

const MAP_PAGE_SIZE_MAX = 500;

type Props = {
  initialProperties: PropiedadLista[];
  totalElements: number;
  /** Parámetros de búsqueda actuales (mismos que la página). */
  searchParamsForFetch: Record<string, string>;
};

export default function PropiedadesListingWithMap({
  initialProperties,
  totalElements,
  searchParamsForFetch,
}: Props) {
  const [view, setView] = useState<"list" | "map">("list");
  const [mapProperties, setMapProperties] = useState<PropiedadLista[] | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const loadedKeyRef = useRef<string | null>(null);
  const loadingMapRef = useRef(false);

  const fetchKey = JSON.stringify(searchParamsForFetch);

  useEffect(() => {
    loadedKeyRef.current = null;
    setMapProperties(null);
  }, [fetchKey]);

  const ensureMapData = useCallback(async () => {
    if (loadedKeyRef.current === fetchKey) return;
    if (loadingMapRef.current) return;
    loadingMapRef.current = true;

    setMapError(null);
    setMapLoading(true);
    try {
      const size = Math.min(MAP_PAGE_SIZE_MAX, Math.max(totalElements, initialProperties.length));
      const params: Record<string, string> = {
        ...searchParamsForFetch,
        page: "0",
        size: String(Math.max(size, initialProperties.length)),
      };
      const res = await fetchPropiedadesClient(params);
      setMapProperties(res.content);
      loadedKeyRef.current = fetchKey;
    } catch {
      setMapError("No se pudieron cargar las propiedades para el mapa.");
      setMapProperties(initialProperties);
      loadedKeyRef.current = fetchKey;
    } finally {
      setMapLoading(false);
      loadingMapRef.current = false;
    }
  }, [fetchKey, initialProperties, searchParamsForFetch, totalElements]);

  useEffect(() => {
    if (view !== "map") return;
    if (mapProperties !== null) return;
    void ensureMapData();
  }, [view, mapProperties, ensureMapData]);

  const onSelectMap = () => setView("map");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-auto sm:mr-0 sm:order-first">
          Vista
        </span>
        <div className="inline-flex rounded-full bg-surface-container-high p-1 border border-outline-variant/20">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              view === "list"
                ? "bg-primary text-white shadow-sm"
                : "text-on-surface-variant hover:bg-surface-variant/80"
            }`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={onSelectMap}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              view === "map"
                ? "bg-primary text-white shadow-sm"
                : "text-on-surface-variant hover:bg-surface-variant/80"
            }`}
          >
            <span className="material-symbols-outlined text-base leading-none">map</span>
            Mapa
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {initialProperties.map((p) => (
            <ListingPropertyCard key={p.id} prop={p} />
          ))}
        </div>
      ) : (
        <div className="min-h-[360px]">
          {mapError && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3 font-body">
              {mapError}
            </p>
          )}
          {mapLoading && !mapProperties && (
            <div className="flex items-center justify-center py-24 text-on-surface-variant text-sm font-body">
              Cargando publicaciones para el mapa…
            </div>
          )}
          {mapProperties && <ListingsLeafletMap properties={mapProperties} />}
        </div>
      )}
    </div>
  );
}
