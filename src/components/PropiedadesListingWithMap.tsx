"use client";

import type { PropiedadLista } from "@/lib/api";
import { fetchPropiedadesClient } from "@/lib/api";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HomeListCard from "./HomeListCard";
import PropertyCard from "./PropertyCard";

const ListingsLeafletMap = dynamic(() => import("./ListingsLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-on-surface-variant font-body">
      Cargando mapa…
    </div>
  ),
});

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
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [locateTick, setLocateTick] = useState(0);
  const [dibujando, setDibujando] = useState(false);
  const [trazadas, setTrazadas] = useState<number[] | null>(null);
  const [mapProperties, setMapProperties] = useState<PropiedadLista[] | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const loadedKeyRef = useRef<string | null>(null);
  const loadingMapRef = useRef(false);

  const fetchKey = JSON.stringify(searchParamsForFetch);
  const visibles = mapProperties ?? initialProperties;

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

  const abrirMapa = useCallback(
    (prop?: PropiedadLista | null) => {
      setMapaAbierto(true);
      setDibujando(false);
      if (prop?.id) {
        setTrazadas(null);
        setSeleccionada(prop.id);
        setLocateTick((n) => n + 1);
        setMapProperties((prev) => {
          const base = prev ?? initialProperties;
          if (base.some((item) => item.id === prop.id)) return prev ?? base;
          return [prop, ...base];
        });
      } else {
        setSeleccionada(null);
        setTrazadas(null);
      }
      void ensureMapData();
    },
    [ensureMapData, initialProperties]
  );

  const cerrarMapa = () => {
    setMapaAbierto(false);
    setDibujando(false);
    setSeleccionada(null);
  };

  useEffect(() => {
    const abrir = () => abrirMapa(null);
    const ver = (event: Event) => {
      const prop = (event as CustomEvent<PropiedadLista>).detail;
      if (!prop?.id) return;
      abrirMapa(prop);
    };
    window.addEventListener("portal-abrir-mapa", abrir);
    window.addEventListener("portal-ver-en-mapa", ver);
    return () => {
      window.removeEventListener("portal-abrir-mapa", abrir);
      window.removeEventListener("portal-ver-en-mapa", ver);
    };
  }, [abrirMapa]);

  useEffect(() => {
    if (!mapaAbierto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mapaAbierto]);

  useEffect(() => {
    if (!mapaAbierto || userLocation || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }, [mapaAbierto, userLocation]);

  const fichas = useMemo(() => {
    const base = trazadas == null ? visibles : visibles.filter((prop) => trazadas.includes(prop.id));
    if (seleccionada != null && !base.some((prop) => prop.id === seleccionada)) {
      const extra = visibles.find((prop) => prop.id === seleccionada);
      if (extra) return [extra, ...base];
    }
    return base;
  }, [visibles, trazadas, seleccionada]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-auto sm:mr-0 sm:order-first">
          Vista
        </span>
        <div className="inline-flex rounded-full bg-surface-container-high p-1 border border-outline-variant/20">
          <button
            type="button"
            onClick={cerrarMapa}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              !mapaAbierto ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-surface-variant/80"
            }`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => abrirMapa(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              mapaAbierto && seleccionada == null
                ? "bg-primary text-white shadow-sm"
                : "text-on-surface-variant hover:bg-surface-variant/80"
            }`}
          >
            <span className="material-symbols-outlined text-base leading-none">map</span>
            Mapa
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        {initialProperties.map((p) => (
          <HomeListCard key={p.id} prop={p} />
        ))}
      </div>

      {mapaAbierto && (
        <div className="fixed inset-0 z-[60] bg-[#ece8f4]">
          {mapError && (
            <p className="absolute left-4 right-4 top-20 z-[800] text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 font-body">
              {mapError}
            </p>
          )}
          {visibles.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-on-surface-variant font-body">
              {mapLoading ? "Cargando publicaciones para el mapa…" : "No hay propiedades para mostrar en el mapa."}
            </div>
          ) : (
            <ListingsLeafletMap
              properties={visibles}
              userLocation={userLocation}
              onAreaSelect={(ids) => {
                setTrazadas(ids);
                setSeleccionada(null);
              }}
              areaIds={trazadas}
              selectedId={seleccionada}
              onMarkerSelect={setSeleccionada}
              locateTick={locateTick}
              fill
              showDrawButton={false}
              drawMode={dibujando}
              onDrawModeChange={setDibujando}
            />
          )}
          <button
            type="button"
            onClick={cerrarMapa}
            aria-label="Cerrar mapa"
            className="absolute left-3 z-[700] flex h-11 w-11 items-center justify-center rounded-full bg-white text-on-surface shadow-lg border border-outline-variant/30"
            style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div
            className="absolute right-3 z-[700] flex flex-col items-end gap-2"
            style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <div className="flex flex-col items-center gap-1 rounded-full bg-white px-1.5 py-1.5 shadow-lg border border-outline-variant/30">
              <button
                type="button"
                aria-pressed={dibujando}
                aria-label={dibujando ? "Dejar de dibujar" : "Dibujar la zona"}
                onClick={() => setDibujando((on) => !on)}
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  dibujando ? "bg-primary text-white" : "text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[26px]">touch_app</span>
              </button>
            </div>
            {dibujando && (
              <p className="max-w-[9rem] text-right text-xs font-semibold text-on-surface bg-white/95 rounded-full px-3 py-1.5 shadow font-body">
                Dibujá el círculo sobre la zona
              </p>
            )}
          </div>
          {seleccionada != null && (
            <ResultadosLista fichas={fichas} selectedId={seleccionada} onCenter={setSeleccionada} onClear={() => setSeleccionada(null)} />
          )}
          {seleccionada == null && trazadas != null && (
            <button
              type="button"
              onClick={() => setTrazadas(null)}
              className="absolute left-1/2 z-[700] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-lg font-body"
              style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              Limpiar zona
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ResultadosLista({
  fichas,
  selectedId,
  onCenter,
  onClear,
}: {
  fichas: PropiedadLista[];
  selectedId: number | null;
  onCenter: (id: number) => void;
  onClear: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const touchingRef = useRef(false);
  const animandoRef = useRef(false);
  const onCenterRef = useRef(onCenter);
  onCenterRef.current = onCenter;

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (selectedId == null || touchingRef.current) return;
    const scroller = scrollerRef.current;
    const card = scroller?.querySelector<HTMLElement>(`[data-prop-id="${selectedId}"]`);
    if (!scroller || !card) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta = cardRect.left - scrollerRect.left - (scroller.clientWidth - card.clientWidth) / 2;
    if (Math.abs(delta) < 12) return;
    animandoRef.current = true;
    scroller.scrollTo({ left: scroller.scrollLeft + delta, behavior: "smooth" });
    window.setTimeout(() => {
      animandoRef.current = false;
    }, 450);
  }, [selectedId]);

  const marcarCentro = () => {
    if (animandoRef.current) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const mid = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
    let mejor: { id: number; dist: number } | null = null;
    for (const el of scroller.querySelectorAll<HTMLElement>("[data-prop-id]")) {
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.left + rect.width / 2 - mid);
      const id = Number(el.dataset.propId);
      if (!mejor || dist < mejor.dist) mejor = { id, dist };
    }
    if (mejor) onCenterRef.current(mejor.id);
  };

  const n = fichas.length;
  const titulo = n === 1 ? "Se encontró 1 propiedad" : `Se encontraron ${n} propiedades`;

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-[650] max-h-[58vh] bg-[#fdf7ff] rounded-t-[20px] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <button
        type="button"
        onClick={onClear}
        className="absolute left-1/2 bottom-full mb-3 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-lg font-body whitespace-nowrap"
      >
        Cerrar
      </button>
      <div className="flex justify-center pt-3 pb-1">
        <span className="w-10 h-1 rounded-full bg-outline-variant/50" />
      </div>
      <h3 className="px-5 pb-3 font-headline font-extrabold text-lg text-on-surface">{titulo}</h3>
      {n === 0 ? (
        <p className="px-5 pb-6 text-sm text-on-surface-variant font-body">No hay publicaciones para mostrar.</p>
      ) : (
        <div
          ref={scrollerRef}
          onPointerDown={() => {
            touchingRef.current = true;
          }}
          onPointerUp={() => {
            touchingRef.current = false;
            marcarCentro();
          }}
          onPointerCancel={() => {
            touchingRef.current = false;
            marcarCentro();
          }}
          onScroll={marcarCentro}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          {fichas.map((prop) => (
            <div key={prop.id} data-prop-id={prop.id} className="snap-start shrink-0 w-[78vw] max-w-[300px]">
              <PropertyCard prop={prop} destacada={prop.id === selectedId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
