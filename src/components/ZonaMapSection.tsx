"use client";

import type { PropiedadLista } from "@/lib/api";
import { fetchPropiedadesClient } from "@/lib/api";
import HomeListCard from "@/components/HomeListCard";
import PropertyCard from "@/components/PropertyCard";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const ListingsLeafletMap = dynamic(() => import("./ListingsLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[min(70vh,520px)] min-h-[320px] rounded-xl border border-outline-variant/30 flex items-center justify-center text-sm text-on-surface-variant font-body">
      Cargando mapa…
    </div>
  ),
});

type Status = "locating" | "loading" | "ready" | "denied" | "empty" | "error" | "ask";

function appInstalada(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}
type Cerca = { prop: PropiedadLista; km: number };

const RADIOS_KM = [15, 30, 60];

function kmEntre(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function coordsDe(p: PropiedadLista): { lat: number; lng: number } | null {
  if (p.latitud == null || p.longitud == null) return null;
  if (!Number.isFinite(p.latitud) || !Number.isFinite(p.longitud)) return null;
  return { lat: p.latitud, lng: p.longitud };
}

async function geocode(q: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { lat?: number; lon?: number };
  if (data.lat == null || data.lon == null) return null;
  return { lat: data.lat, lng: data.lon };
}

async function ubicar(props: PropiedadLista[]): Promise<Cerca[]> {
  const cache = new Map<string, { lat: number; lng: number } | null>();
  const out: Cerca[] = [];
  for (const prop of props) {
    let coords = coordsDe(prop);
    if (!coords) {
      const q = (prop.textoUbicacionMapa || [prop.localidad, prop.partido, prop.provincia, "Argentina"].filter(Boolean).join(", ")).trim();
      if (!q) continue;
      if (!cache.has(q)) cache.set(q, await geocode(q));
      coords = cache.get(q) || null;
    }
    if (!coords) continue;
    out.push({
      prop: { ...prop, latitud: coords.lat, longitud: coords.lng },
      km: 0,
    });
  }
  return out;
}

function conDistancia(items: Cerca[], lat: number, lng: number): Cerca[] {
  return items
    .map((item) => ({
      ...item,
      km: kmEntre(lat, lng, item.prop.latitud as number, item.prop.longitud as number),
    }))
    .sort((a, b) => a.km - b.km);
}

function formatKm(km: number): string {
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

type FiltrosMapa = {
  operacion: "TODAS" | "VENTA" | "ALQUILER";
  tipo: string;
  precioMin: string;
  precioMax: string;
  moneda: "" | "USD" | "ARS";
  ambientes: string;
  dormitorios: string;
  banos: string;
  cochera: boolean;
};

const FILTROS_INICIALES: FiltrosMapa = {
  operacion: "TODAS",
  tipo: "",
  precioMin: "",
  precioMax: "",
  moneda: "",
  ambientes: "",
  dormitorios: "",
  banos: "",
  cochera: false,
};

function cantidadFiltros(f: FiltrosMapa): number {
  let n = 0;
  if (f.operacion !== "TODAS") n += 1;
  if (f.tipo) n += 1;
  if (f.precioMin) n += 1;
  if (f.precioMax) n += 1;
  if (f.moneda) n += 1;
  if (f.ambientes) n += 1;
  if (f.dormitorios) n += 1;
  if (f.banos) n += 1;
  if (f.cochera) n += 1;
  return n;
}

function cumpleFiltro(prop: PropiedadLista, f: FiltrosMapa): boolean {
  if (f.operacion !== "TODAS" && prop.tipoOperacion !== f.operacion) return false;
  if (f.tipo && prop.tipo !== f.tipo) return false;
  if (f.cochera && !prop.cochera) return false;
  if (f.ambientes && (prop.cantidadAmbientes ?? 0) < Number(f.ambientes)) return false;
  if (f.dormitorios && (prop.cantidadDormitorios ?? 0) < Number(f.dormitorios)) return false;
  if (f.banos && (prop.cantidadBanos ?? 0) < Number(f.banos)) return false;
  const min = f.precioMin.trim() ? Number(f.precioMin) : null;
  const max = f.precioMax.trim() ? Number(f.precioMax) : null;
  if (min != null || max != null || f.moneda) {
    if (!prop.mostrarPrecio || prop.precio == null) return false;
    if (f.moneda && prop.moneda !== f.moneda) return false;
    if (min != null && Number.isFinite(min) && prop.precio < min) return false;
    if (max != null && Number.isFinite(max) && prop.precio > max) return false;
  }
  return true;
}

export default function ZonaMapSection() {
  const [status, setStatus] = useState<Status>("locating");
  const [message, setMessage] = useState("Pedimos tu ubicación para mostrar las propiedades más cercanas.");
  const [radio, setRadio] = useState(RADIOS_KM[0]);
  const [cerca, setCerca] = useState<Cerca[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [trazadas, setTrazadas] = useState<number[] | null>(null);
  const [enPantalla, setEnPantalla] = useState<number[] | null>(null);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [foco, setFoco] = useState<PropiedadLista | null>(null);
  const [ubicarTick, setUbicarTick] = useState(0);
  const [revealTick, setRevealTick] = useState(0);
  const [filtros, setFiltros] = useState<FiltrosMapa>(FILTROS_INICIALES);
  const [borrador, setBorrador] = useState<FiltrosMapa>(FILTROS_INICIALES);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [dibujando, setDibujando] = useState(false);
  const [esMobile, setEsMobile] = useState<boolean | null>(null);
  const vivaRef = useRef(true);

  const userLocation = useMemo(
    () => (coords ? { lat: coords.lat, lng: coords.lng } : null),
    [coords]
  );
  const properties = useMemo(() => {
    const list = cerca.map((item) => item.prop);
    if (foco && !list.some((item) => item.id === foco.id)) return [foco, ...list];
    return list;
  }, [cerca, foco]);
  const tipos = useMemo(
    () => [...new Set(cerca.map((item) => item.prop.tipo).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [cerca]
  );
  const filtradas = useMemo(
    () => (cantidadFiltros(filtros) === 0 ? cerca : cerca.filter((item) => cumpleFiltro(item.prop, filtros))),
    [cerca, filtros]
  );
  const zonaIds = trazadas ?? enPantalla;
  let fichas = zonaIds == null ? filtradas : filtradas.filter((item) => zonaIds.includes(item.prop.id));
  if (foco && seleccionada === foco.id && !fichas.some((item) => item.prop.id === foco.id)) {
    const ll = coordsDe(foco);
    const km = ll && coords ? kmEntre(coords.lat, coords.lng, ll.lat, ll.lng) : 0;
    fichas = [{ prop: foco, km }, ...fichas];
  }
  const idsVisibles = useMemo(() => {
    if (cantidadFiltros(filtros) === 0) return null;
    const ids = filtradas.map((item) => item.prop.id);
    if (foco && !ids.includes(foco.id)) ids.push(foco.id);
    return ids;
  }, [filtradas, filtros, foco]);
  const filtrosOn = cantidadFiltros(filtros);

  const limpiarZona = () => {
    setTrazadas(null);
    setEnPantalla(null);
    setSeleccionada(null);
    setFoco(null);
  };

  useEffect(() => {
    const abrir = () => setMapaAbierto(true);
    const ver = (event: Event) => {
      const prop = (event as CustomEvent<PropiedadLista>).detail;
      if (!prop?.id) return;
      setFoco(prop);
      setTrazadas(null);
      setEnPantalla([prop.id]);
      setSeleccionada(prop.id);
      setMapaAbierto(true);
      setUbicarTick((n) => n + 1);
    };
    window.addEventListener("portal-abrir-mapa", abrir);
    window.addEventListener("portal-ver-en-mapa", ver);
    if (new URLSearchParams(window.location.search).get("mapa") === "1") setMapaAbierto(true);
    return () => {
      window.removeEventListener("portal-abrir-mapa", abrir);
      window.removeEventListener("portal-ver-en-mapa", ver);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setEsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!mapaAbierto && !filtrosAbiertos) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mapaAbierto, filtrosAbiertos]);

  const buscarCerca = useCallback(async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    setStatus("loading");
    setMessage("Buscando propiedades según tu ubicación…");
    try {
      let elegidas: Cerca[] = [];
      let radioUsado = RADIOS_KM[RADIOS_KM.length - 1];
      for (const candidato of RADIOS_KM) {
        const res = await fetchPropiedadesClient({
          lat: String(lat),
          lng: String(lng),
          radioKm: String(candidato),
          page: "0",
          size: "200",
        });
        const ubicadas = conDistancia(await ubicar(res.content || []), lat, lng);
        const dentro = ubicadas.filter((item) => item.km <= candidato);
        if (dentro.length) {
          elegidas = dentro;
          radioUsado = candidato;
          break;
        }
      }
      if (!vivaRef.current) return;
      setRadio(radioUsado);
      setCerca(elegidas);
      setStatus(elegidas.length ? "ready" : "empty");
      setMessage(
        elegidas.length
          ? `${elegidas.length} propiedad${elegidas.length === 1 ? "" : "es"} a menos de ${radioUsado} km, de la más cercana a la más lejana.`
          : `No hay propiedades publicadas a menos de ${radioUsado} km.`
      );
    } catch {
      if (!vivaRef.current) return;
      setStatus("error");
      setMessage("No pudimos buscar propiedades con tu ubicación. Probá de nuevo.");
    }
  }, []);

  const pedirUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Este navegador no puede compartir la ubicación.");
      return;
    }
    setStatus("locating");
    setMessage("Pedimos tu ubicación para mostrar las propiedades más cercanas.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (vivaRef.current) void buscarCerca(position.coords.latitude, position.coords.longitude);
      },
      () => {
        if (!vivaRef.current) return;
        setStatus("ask");
        setMessage("Tocá el botón para permitir la ubicación y ver las propiedades cercanas.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [buscarCerca]);

  useEffect(() => {
    vivaRef.current = true;
    return () => {
      vivaRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    const empezar = async () => {
      if (!appInstalada()) {
        pedirUbicacion();
        return;
      }
      let concedido = false;
      try {
        if (navigator.permissions?.query) {
          const estado = await navigator.permissions.query({ name: "geolocation" });
          concedido = estado.state === "granted";
        }
      } catch {
        concedido = false;
      }
      if (cancelado) return;
      if (concedido) pedirUbicacion();
      else {
        setStatus("ask");
        setMessage("Tocá el botón para permitir la ubicación y ver las propiedades cercanas.");
      }
    };
    void empezar();
    return () => {
      cancelado = true;
    };
  }, [pedirUbicacion]);

  const abrirFiltros = () => {
    setBorrador(filtros);
    setFiltrosAbiertos(true);
  };

  const aplicarFiltros = () => {
    setFiltros(borrador);
    setFiltrosAbiertos(false);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 md:py-14">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">near_me</span>
            Propiedades cerca de tu ubicación
          </h2>
          <p className="text-sm text-on-surface-variant mt-1 font-body">{message}</p>
        </div>
      </div>

      {(status === "ask" || status === "denied") && (
        <button
          type="button"
          onClick={pedirUbicacion}
          className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-full font-body"
        >
          Permitir ubicación
        </button>
      )}

      {(status === "locating" || status === "loading") && (
        <div className="w-full h-[min(70vh,520px)] min-h-[320px] rounded-xl border border-outline-variant/30 flex items-center justify-center text-sm text-on-surface-variant font-body">
          {status === "locating" ? "Esperando el permiso de ubicación…" : "Midiendo la distancia a cada propiedad…"}
        </div>
      )}

      {status === "ready" && (
        <>
          {zonaIds != null && (
            <button
              type="button"
              onClick={limpiarZona}
              className="mb-3 text-sm font-bold text-primary font-body"
            >
              Limpiar zona
            </button>
          )}
          {fichas.length === 0 ? (
            <p className="text-sm text-on-surface-variant font-body">
              No hay publicaciones con estos filtros. Cambiá el trazo o los filtros del mapa.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {fichas.map((item) => (
                <div key={item.prop.id}>
                  <p className="text-xs font-semibold text-primary mb-2 font-body">A {formatKm(item.km)}</p>
                  <HomeListCard prop={item.prop} />
                </div>
              ))}
            </div>
          )}

          <p className="sr-only">Radio usado: {radio} km</p>
        </>
      )}

      {mapaAbierto && (esMobile || foco != null) && (status === "ready" || foco != null) && (
        <div className="fixed inset-0 z-[60] bg-[#ece8f4]">
          <ListingsLeafletMap
            properties={properties}
            userLocation={userLocation}
            onAreaSelect={(ids) => {
              setTrazadas(ids);
              setSeleccionada(null);
            }}
            areaIds={trazadas}
            visibleIds={idsVisibles}
            shownIds={enPantalla}
            revealTick={revealTick}
            onRevealViewport={(ids) => {
              setEnPantalla(ids);
              setSeleccionada(null);
            }}
            selectedId={seleccionada}
            onMarkerSelect={setSeleccionada}
            locateTick={ubicarTick}
            fill
            showDrawButton={false}
            drawMode={dibujando}
            onDrawModeChange={setDibujando}
          />
          <button
            type="button"
            onClick={() => {
              setMapaAbierto(false);
              setDibujando(false);
              setFiltrosAbiertos(false);
            }}
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
              <button
                type="button"
                aria-label="Filtros"
                onClick={abrirFiltros}
                className={`relative flex h-11 w-11 items-center justify-center rounded-full ${
                  filtrosOn > 0 ? "bg-primary text-white" : "text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[26px]">tune</span>
                {filtrosOn > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-white text-primary text-[10px] font-bold leading-4">
                    {filtrosOn}
                  </span>
                )}
              </button>
            </div>
            {dibujando && (
              <p className="max-w-[9rem] text-right text-xs font-semibold text-on-surface bg-white/95 rounded-full px-3 py-1.5 shadow font-body">
                Dibujá el círculo sobre la zona
              </p>
            )}
          </div>
          {seleccionada != null ? (
            <ResultadosZona
              fichas={fichas}
              selectedId={seleccionada}
              onCenter={setSeleccionada}
              onClear={limpiarZona}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                if (zonaIds != null) {
                  limpiarZona();
                  return;
                }
                setTrazadas(null);
                setRevealTick((n) => n + 1);
              }}
              className="absolute left-1/2 z-[700] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-lg font-body"
              style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              {zonaIds == null ? "Mostrar propiedades en la zona" : "Limpiar zona"}
            </button>
          )}
        </div>
      )}

      {filtrosAbiertos && (
        <HojaFiltros
          value={borrador}
          tipos={tipos}
          onChange={setBorrador}
          onClose={() => setFiltrosAbiertos(false)}
          onApply={aplicarFiltros}
          onClear={() => setBorrador(FILTROS_INICIALES)}
        />
      )}
    </section>
  );
}

function ResultadosZona({
  fichas,
  selectedId,
  onCenter,
  onClear,
}: {
  fichas: Cerca[];
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
  const titulo =
    n === 1 ? "Se encontró 1 propiedad" : `Se encontraron ${n} propiedades`;

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
        Limpiar zona
      </button>
      <div className="flex justify-center pt-3 pb-1">
        <span className="w-10 h-1 rounded-full bg-outline-variant/50" />
      </div>
      <h3 className="px-5 pb-3 font-headline font-extrabold text-lg text-on-surface">{titulo}</h3>
      {n === 0 ? (
        <p className="px-5 pb-6 text-sm text-on-surface-variant font-body">
          No hay publicaciones dentro del círculo. Dibujá otra zona o limpiá la actual.
        </p>
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
          {fichas.map((item) => (
            <div
              key={item.prop.id}
              data-prop-id={item.prop.id}
              className="snap-start shrink-0 w-[78vw] max-w-[300px]"
            >
              <p className="text-xs font-semibold text-primary mb-2 font-body">A {formatKm(item.km)}</p>
              <PropertyCard prop={item.prop} destacada={item.prop.id === selectedId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-11 h-11 px-3 rounded-full text-sm font-bold ${
        selected ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"
      }`}
    >
      {children}
    </button>
  );
}

function HojaFiltros({
  value,
  tipos,
  onChange,
  onClose,
  onApply,
  onClear,
}: {
  value: FiltrosMapa;
  tipos: string[];
  onChange: (next: FiltrosMapa) => void;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const label = "block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2";
  const field =
    "w-full bg-white border border-outline-variant/30 rounded-xl px-3.5 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="fixed inset-0 z-[80] flex items-end">
      <div
        className={`h-[100dvh] w-full bg-[#fdf7ff] rounded-t-[20px] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-headline font-extrabold text-lg text-on-surface">Filtros</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6 font-body">
          <div>
            <p className={label}>Operación</p>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-surface-container-high">
              {(
                [
                  ["TODAS", "Todas"],
                  ["VENTA", "Venta"],
                  ["ALQUILER", "Alquiler"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange({ ...value, operacion: v })}
                  className={`py-2.5 rounded-full text-sm font-bold ${
                    value.operacion === v ? "bg-primary text-white" : "text-on-surface-variant"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {tipos.length > 0 && (
            <div>
              <p className={label}>Tipo</p>
              <div className="flex flex-wrap gap-2">
                <Chip selected={value.tipo === ""} onClick={() => onChange({ ...value, tipo: "" })}>
                  Todos
                </Chip>
                {tipos.map((tipo) => (
                  <Chip key={tipo} selected={value.tipo === tipo} onClick={() => onChange({ ...value, tipo })}>
                    {tipo}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className={label}>Precio</p>
            <div className="flex gap-2 mb-3">
              {(["", "USD", "ARS"] as const).map((m) => (
                <Chip key={m || "any"} selected={value.moneda === m} onClick={() => onChange({ ...value, moneda: m })}>
                  {m === "" ? "Cualquiera" : m}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Mínimo"
                value={value.precioMin}
                onChange={(e) => onChange({ ...value, precioMin: e.target.value })}
                className={field}
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Máximo"
                value={value.precioMax}
                onChange={(e) => onChange({ ...value, precioMax: e.target.value })}
                className={field}
              />
            </div>
          </div>

          {(
            [
              ["ambientes", "Ambientes"],
              ["dormitorios", "Dormitorios"],
              ["banos", "Baños"],
            ] as const
          ).map(([key, titulo]) => (
            <div key={key}>
              <p className={label}>{titulo}</p>
              <div className="flex flex-wrap gap-2">
                {["", "1", "2", "3", "4", "5"].map((n) => (
                  <Chip key={n || "any"} selected={value[key] === n} onClick={() => onChange({ ...value, [key]: n })}>
                    {n === "" ? "—" : n === "5" ? "5+" : n}
                  </Chip>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className={label}>Comodidades</p>
            <Chip selected={value.cochera} onClick={() => onChange({ ...value, cochera: !value.cochera })}>
              Cochera
            </Chip>
          </div>
        </div>

        <div className="px-5 pt-3 border-t border-outline-variant/20 flex gap-3 bg-[#fdf7ff] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClear}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm text-primary bg-surface-container-high"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-[2] py-3.5 rounded-xl font-bold text-sm text-white bg-primary"
          >
            Ver en el mapa
          </button>
        </div>
      </div>
    </div>
  );
}
