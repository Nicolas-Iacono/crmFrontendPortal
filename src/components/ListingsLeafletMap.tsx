"use client";

import type { PropiedadLista } from "@/lib/api";
import { formatPrecio } from "@/lib/utils";
import { GoogleMap } from "@react-google-maps/api";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function ubicacionQuery(p: PropiedadLista): string {
  const t = p.textoUbicacionMapa?.trim();
  if (t) return t;
  return [p.localidad, p.partido, p.provincia, "Argentina"].filter(Boolean).join(", ");
}

function coordsGuardadas(p: PropiedadLista): { lat: number; lng: number } | null {
  const lat = p.latitud;
  const lng = p.longitud;
  if (lat == null || lng == null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

const geocodeClientCache = new Map<string, { lat: number; lng: number }>();
const ZOOM_PRECIOS = 14;
const CENTRO = { lat: -34.6037, lng: -58.3816 };
const MAPS_SCRIPT_ID = "portal-google-maps";

let mapsPromise: Promise<void> | null = null;

function mapaDisponible(): boolean {
  return typeof window.google?.maps?.Map === "function";
}

function cargarMaps(apiKey: string): Promise<void> {
  if (mapaDisponible()) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = (async () => {
    if (typeof window.google?.maps?.importLibrary === "function") {
      await window.google.maps.importLibrary("maps");
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const fallo = () => reject(new Error("No se pudo cargar Google Maps"));
      const listo = () => {
        if (typeof window.google?.maps?.importLibrary === "function" || mapaDisponible()) resolve();
        else fallo();
      };
      const previo = document.getElementById(MAPS_SCRIPT_ID);
      if (previo) {
        if (window.google?.maps) {
          listo();
          return;
        }
        previo.addEventListener("load", listo, { once: true });
        previo.addEventListener("error", fallo, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.id = MAPS_SCRIPT_ID;
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=maps`;
      script.onload = () => listo();
      script.onerror = fallo;
      document.head.appendChild(script);
    });
    if (typeof window.google?.maps?.importLibrary === "function" && !mapaDisponible()) {
      await window.google.maps.importLibrary("maps");
    }
  })().catch((error) => {
    mapsPromise = null;
    throw error;
  });
  return mapsPromise;
}

function useMapaGoogle(apiKey: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>();
  useEffect(() => {
    if (!apiKey) return;
    let vivo = true;
    cargarMaps(apiKey)
      .then(() => {
        if (vivo) setIsLoaded(true);
      })
      .catch((error: unknown) => {
        if (!vivo) return;
        setLoadError(error instanceof Error ? error : new Error("No se pudo cargar Google Maps"));
      });
    return () => {
      vivo = false;
    };
  }, [apiKey]);
  return { isLoaded, loadError };
}

const PIN_PERSONA =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">` +
      `<path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#532ba8"/>` +
      `<path transform="translate(6 5)" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1.2h16V18c0-2.66-5.33-4-8-4z" fill="#fff"/>` +
      `</svg>`
  );

type LatLng = { lat: number; lng: number };
type Punto = { prop: PropiedadLista; lat: number; lng: number };
type Grupo = {
  tipo: "punto" | "grupo";
  id: string;
  pos: LatLng;
  items: Punto[];
};

function etiquetaPrecio(prop: PropiedadLista): string {
  if (!prop.mostrarPrecio || prop.precio == null) return "Consultar";
  return formatPrecio(prop.precio, prop.moneda);
}

function puntoDentro(lat: number, lng: number, ring: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i].lat;
    const xi = ring[i].lng;
    const yj = ring[j].lat;
    const xj = ring[j].lng;
    const cruza = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (cruza) inside = !inside;
  }
  return inside;
}

function distanciaKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Al alejar, los pines cercanos se juntan en un número. La celda es chica para no mezclar barrios distintos. */
function agrupar(items: Punto[], zoom: number): Grupo[] {
  if (zoom >= ZOOM_PRECIOS) {
    return items.map((item) => ({
      tipo: "punto",
      id: String(item.prop.id),
      pos: { lat: item.lat, lng: item.lng },
      items: [item],
    }));
  }
  const cell = zoom >= 13 ? 0.02 : zoom >= 12 ? 0.05 : zoom >= 10 ? 0.14 : 0.32;
  const grupos = new Map<string, Punto[]>();
  for (const item of items) {
    const key = `${Math.round(item.lat / cell)}:${Math.round(item.lng / cell)}`;
    const lista = grupos.get(key) ?? [];
    lista.push(item);
    grupos.set(key, lista);
  }
  return [...grupos.values()].map((grupo) => {
    if (grupo.length === 1) {
      return { tipo: "punto", id: String(grupo[0].prop.id), pos: { lat: grupo[0].lat, lng: grupo[0].lng }, items: grupo };
    }
    const lat = grupo.reduce((sum, item) => sum + item.lat, 0) / grupo.length;
    const lng = grupo.reduce((sum, item) => sum + item.lng, 0) / grupo.length;
    return { tipo: "grupo", id: `g-${lat.toFixed(3)}-${lng.toFixed(3)}`, pos: { lat, lng }, items: grupo };
  });
}

export default function ListingsLeafletMap({
  properties,
  userLocation,
  onAreaSelect,
  areaIds,
  fill = false,
  showDrawButton = true,
  drawMode: drawModeProp,
  onDrawModeChange,
  visibleIds,
  shownIds,
  revealTick = 0,
  onRevealViewport,
  selectedId = null,
  onMarkerSelect,
  locateTick = 0,
  userFocusTick = 0,
  onUserCenteredChange,
}: {
  properties: PropiedadLista[];
  userLocation?: { lat: number; lng: number } | null;
  onAreaSelect?: (ids: number[] | null) => void;
  areaIds?: number[] | null;
  fill?: boolean;
  showDrawButton?: boolean;
  drawMode?: boolean;
  onDrawModeChange?: (on: boolean) => void;
  visibleIds?: number[] | null;
  shownIds?: number[] | null;
  revealTick?: number;
  onRevealViewport?: (ids: number[]) => void;
  selectedId?: number | null;
  onMarkerSelect?: (id: number) => void;
  locateTick?: number;
  userFocusTick?: number;
  onUserCenteredChange?: (on: boolean) => void;
}) {
  const clave = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useMapaGoogle(clave);

  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const shapeRef = useRef<google.maps.Polygon | null>(null);
  const personaRef = useRef<google.maps.Marker | null>(null);
  const placedRef = useRef<Punto[]>([]);
  const onAreaSelectRef = useRef(onAreaSelect);
  const onRevealRef = useRef(onRevealViewport);
  const onMarkerRef = useRef(onMarkerSelect);
  const onCenteredRef = useRef(onUserCenteredChange);
  const drawModeRef = useRef(Boolean(drawModeProp));
  const siguiendoRef = useRef(false);
  const centradoEnRef = useRef(0);
  const focoAplicadoRef = useRef(0);
  const locateAplicadoRef = useRef(0);
  const ajusteRef = useRef("");
  const userLocationRef = useRef(userLocation ?? null);

  const [placed, setPlaced] = useState<Punto[]>([]);
  const [zoom, setZoom] = useState(12);
  const [mapReady, setMapReady] = useState(false);
  const [capa, setCapa] = useState<HTMLDivElement | null>(null);
  const pinEls = useRef(new Map<string, HTMLDivElement>());
  const [drawModeState, setDrawModeState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ done: number; total: number; phase: string }>({ done: 0, total: 0, phase: "idle" });
  const drawMode = drawModeProp ?? drawModeState;

  userLocationRef.current = userLocation ?? null;
  placedRef.current = placed;
  onAreaSelectRef.current = onAreaSelect;
  onRevealRef.current = onRevealViewport;
  onMarkerRef.current = onMarkerSelect;
  onCenteredRef.current = onUserCenteredChange;
  drawModeRef.current = drawMode;

  const setDrawMode = (next: boolean) => {
    if (drawModeProp === undefined) setDrawModeState(next);
    onDrawModeChange?.(next);
  };

  useEffect(() => {
    if (properties.length === 0) {
      setPlaced([]);
      return;
    }
    let cancelled = false;
    const initial: Punto[] = [];
    const missing = new Set<string>();
    for (const prop of properties) {
      const stored = coordsGuardadas(prop);
      if (stored) {
        initial.push({ prop, ...stored });
        continue;
      }
      const q = ubicacionQuery(prop);
      const cached = geocodeClientCache.get(q);
      if (cached) initial.push({ prop, ...cached });
      else missing.add(q);
    }
    setPlaced(initial);
    if (missing.size === 0) {
      setStatus({ done: properties.length, total: properties.length, phase: initial.length ? "map" : "empty" });
      if (initial.length === 0) {
        setError("No pudimos ubicar estas publicaciones en el mapa. Probá acotar la zona o revisá las direcciones en el CRM.");
      }
      return;
    }
    setStatus({ done: initial.length, total: properties.length, phase: initial.length ? "map" : "geocoding" });
    void (async () => {
      let done = initial.length;
      await Promise.all(
        [...missing].map(async (q) => {
          try {
            const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
            if (res.ok) {
              const j = (await res.json()) as { lat: number; lon: number };
              geocodeClientCache.set(q, { lat: j.lat, lng: j.lon });
            }
          } catch {
            /* una dirección fallida no frena al resto */
          }
          done += 1;
          if (!cancelled) setStatus({ done, total: properties.length, phase: "geocoding" });
        })
      );
      if (cancelled) return;
      const extra: Punto[] = [];
      for (const prop of properties) {
        if (coordsGuardadas(prop)) continue;
        const ll = geocodeClientCache.get(ubicacionQuery(prop));
        if (ll) extra.push({ prop, ...ll });
      }
      const merged = [...initial, ...extra];
      setPlaced(merged);
      setStatus({ done: properties.length, total: properties.length, phase: merged.length ? "map" : "empty" });
      if (merged.length === 0) {
        setError("No pudimos ubicar estas publicaciones en el mapa. Probá acotar la zona o revisá las direcciones en el CRM.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [properties]);

  const visibles = useMemo(() => {
    return placed.filter((item) => {
      if (areaIds) return areaIds.includes(item.prop.id);
      if (shownIds === null) return false;
      if (shownIds && !shownIds.includes(item.prop.id)) return false;
      if (visibleIds && !visibleIds.includes(item.prop.id)) return false;
      return true;
    });
  }, [placed, areaIds, shownIds, visibleIds]);

  const grupos = useMemo(() => agrupar(visibles, zoom), [visibles, zoom]);
  const gruposRef = useRef(grupos);
  gruposRef.current = grupos;
  const detallada = zoom >= ZOOM_PRECIOS;

  useLayoutEffect(() => {
    overlayRef.current?.draw();
  }, [grupos, capa, selectedId, detallada]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || visibles.length === 0 || selectedId != null || shownIds === null) return;
    const key = visibles.map((item) => item.prop.id).join(",");
    if (key === ajusteRef.current) return;
    ajusteRef.current = key;
    const bounds = new window.google.maps.LatLngBounds();
    visibles.forEach((item) => bounds.extend(item));
    map.fitBounds(bounds, 48);
    const listener = window.google.maps.event.addListenerOnce(map, "idle", () => {
      if ((map.getZoom() ?? 0) > 15) map.setZoom(15);
    });
    return () => window.google.maps.event.removeListener(listener);
  }, [visibles, mapReady, selectedId, shownIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !locateTick || locateTick === locateAplicadoRef.current || selectedId == null) return;
    const item = placed.find((punto) => punto.prop.id === selectedId);
    if (!item) return;
    locateAplicadoRef.current = locateTick;
    map.panTo({ lat: item.lat, lng: item.lng });
    if ((map.getZoom() ?? 0) < ZOOM_PRECIOS) map.setZoom(ZOOM_PRECIOS);
  }, [locateTick, selectedId, placed, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const aqui = userLocation;
    if (!map || !aqui || !userFocusTick || userFocusTick === focoAplicadoRef.current) return;
    focoAplicadoRef.current = userFocusTick;
    siguiendoRef.current = true;
    centradoEnRef.current = Date.now();
    onCenteredRef.current?.(true);
    map.panTo(aqui);
    if ((map.getZoom() ?? 0) < 15) map.setZoom(15);
  }, [userFocusTick, userLocation, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !window.google?.maps?.Marker) return;
    personaRef.current?.setMap(null);
    personaRef.current = null;
    if (!userLocation) return;
    personaRef.current = new window.google.maps.Marker({
      map,
      position: userLocation,
      clickable: false,
      zIndex: 9999,
      title: "Estás acá",
      icon: {
        url: PIN_PERSONA,
        scaledSize: new window.google.maps.Size(36, 48),
        anchor: new window.google.maps.Point(18, 46),
      },
    });
    return () => {
      personaRef.current?.setMap(null);
      personaRef.current = null;
    };
  }, [mapReady, userLocation]);

  useEffect(() => {
    if (areaIds == null) {
      shapeRef.current?.setMap(null);
      shapeRef.current = null;
    }
  }, [areaIds]);

  useEffect(() => {
    const map = mapRef.current;
    const container = map?.getDiv();
    if (!mapReady || !map || !container || !window.google?.maps) return;
    map.setOptions({ draggable: !drawMode, gestureHandling: drawMode ? "none" : "greedy" });
    if (!drawMode) return;

    let drawing = false;
    let stroke: LatLng[] = [];
    let live: google.maps.Polyline | null = null;

    const toLatLng = (ev: PointerEvent): LatLng | null => {
      const proj = overlayRef.current?.getProjection();
      if (!proj) return null;
      try {
        const rect = container.getBoundingClientRect();
        const ll = proj.fromContainerPixelToLatLng(new window.google.maps.Point(ev.clientX - rect.left, ev.clientY - rect.top));
        if (!ll) return null;
        return { lat: ll.lat(), lng: ll.lng() };
      } catch {
        return null;
      }
    };
    const onDown = (ev: PointerEvent) => {
      if (!drawModeRef.current) return;
      ev.preventDefault();
      ev.stopPropagation();
      drawing = true;
      container.setPointerCapture(ev.pointerId);
      const ll = toLatLng(ev);
      if (!ll) return;
      stroke = [ll];
      live?.setMap(null);
      live = new window.google.maps.Polyline({ map, path: stroke, strokeColor: "#532ba8", strokeWeight: 3 });
    };
    const onMove = (ev: PointerEvent) => {
      if (!drawing) return;
      ev.preventDefault();
      const ll = toLatLng(ev);
      if (!ll) return;
      const prev = stroke[stroke.length - 1];
      if (prev && Math.abs(prev.lat - ll.lat) < 0.00002 && Math.abs(prev.lng - ll.lng) < 0.00002) return;
      stroke.push(ll);
      live?.setPath(stroke);
    };
    const onUp = () => {
      if (!drawing) return;
      drawing = false;
      live?.setMap(null);
      live = null;
      if (stroke.length < 3) return;
      shapeRef.current?.setMap(null);
      shapeRef.current = new window.google.maps.Polygon({
        map,
        paths: stroke,
        strokeColor: "#532ba8",
        strokeWeight: 2,
        fillColor: "#d0bcff",
        fillOpacity: 0.28,
      });
      const ids = placedRef.current.filter((item) => puntoDentro(item.lat, item.lng, stroke)).map((item) => item.prop.id);
      onAreaSelectRef.current?.(ids);
      setDrawMode(false);
    };
    container.addEventListener("pointerdown", onDown, true);
    container.addEventListener("pointermove", onMove, true);
    container.addEventListener("pointerup", onUp, true);
    container.addEventListener("pointercancel", onUp, true);
    return () => {
      container.removeEventListener("pointerdown", onDown, true);
      container.removeEventListener("pointermove", onMove, true);
      container.removeEventListener("pointerup", onUp, true);
      container.removeEventListener("pointercancel", onUp, true);
      live?.setMap(null);
    };
  }, [drawMode, mapReady]);

  useEffect(() => {
    if (!mapReady || revealTick === 0) return;
    const map = mapRef.current;
    if (!map) return;
    const publish = () => {
      const bounds = map.getBounds();
      if (!bounds) return false;
      const ids = placedRef.current
        .filter((item) => bounds.contains(new window.google.maps.LatLng(item.lat, item.lng)))
        .map((item) => item.prop.id);
      onRevealRef.current?.(ids);
      return true;
    };
    if (publish()) return;
    const listener = map.addListener("idle", () => {
      if (!publish()) return;
      listener.remove();
    });
    return () => listener.remove();
  }, [revealTick, mapReady]);

  const elegir = (prop: PropiedadLista) => {
    if (onMarkerRef.current) onMarkerRef.current(prop.id);
    else window.location.assign(`/propiedad/${encodeURIComponent(prop.slug)}`);
    const map = mapRef.current;
    const punto = placed.find((item) => item.prop.id === prop.id);
    if (!map || !punto) return;
    map.panTo({ lat: punto.lat, lng: punto.lng });
    if ((map.getZoom() ?? 0) < ZOOM_PRECIOS) map.setZoom(ZOOM_PRECIOS);
  };

  const abrirGrupo = (grupo: Grupo) => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(grupo.pos);
    map.setZoom(Math.min((map.getZoom() || zoom) + 2, ZOOM_PRECIOS));
  };

  if (properties.length === 0 && !fill) {
    return (
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-8 text-center text-on-surface-variant text-sm">
        No hay propiedades para mostrar en el mapa.
      </div>
    );
  }

  const frameClass = fill
    ? "h-full w-full min-h-0"
    : "w-full h-[min(70vh,520px)] min-h-[320px] rounded-xl border border-outline-variant/30 overflow-hidden";

  return (
    <div className={fill ? "h-full" : "space-y-3"}>
      {!fill && status.phase === "geocoding" && (
        <p className="text-sm text-on-surface-variant font-body">
          Ubicando publicaciones en el mapa… {status.done}/{status.total}
        </p>
      )}
      {(error || loadError || !clave) && (
        <p className={`text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 font-body ${fill ? "absolute left-4 right-4 top-36 z-[800] text-center" : ""}`}>
          {!clave
            ? "Falta la clave de Google Maps."
            : "No se pudo cargar Google Maps. En la clave hay que permitir http://localhost:3001/* y https://portal.tuinmo.net/*."}
        </p>
      )}
      <div className={`${fill ? "relative h-full" : "relative"} ${drawMode ? "cursor-crosshair" : ""}`} style={{ touchAction: drawMode ? "none" : "auto" }}>
        <div className={`relative ${frameClass}`}>
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={userLocation || CENTRO}
              zoom={userLocation ? 14 : 12}
              onLoad={(map) => {
                mapRef.current = map;
                setMapReady(true);
                const capaEl = document.createElement("div");
                capaEl.style.position = "absolute";
                capaEl.style.left = "0";
                capaEl.style.top = "0";
                capaEl.style.pointerEvents = "none";
                let arrastrando = false;
                const overlay = new window.google.maps.OverlayView();
                overlay.onAdd = () => {
                  overlay.getPanes()?.overlayMouseTarget.appendChild(capaEl);
                  setCapa(capaEl);
                };
                overlay.draw = () => {
                  // Mientras el dedo arrastra, el mapa mueve esta capa junto con el plano.
                  // Recalcular ahí los desfasa y, al soltar, saltan de vuelta.
                  if (arrastrando) return;
                  const proj = overlay.getProjection();
                  if (!proj) return;
                  for (const grupo of gruposRef.current) {
                    const el = pinEls.current.get(grupo.id);
                    if (!el) continue;
                    try {
                      const punto = proj.fromLatLngToDivPixel(new window.google.maps.LatLng(grupo.pos.lat, grupo.pos.lng));
                      if (!punto || !Number.isFinite(punto.x) || !Number.isFinite(punto.y)) continue;
                      el.style.left = `${punto.x}px`;
                      el.style.top = `${punto.y}px`;
                    } catch {
                      // La proyección avisa que existe antes de estar lista.
                    }
                  }
                };
                overlay.onRemove = () => {
                  capaEl.remove();
                  setCapa(null);
                };
                overlay.setMap(map);
                overlayRef.current = overlay;
                map.addListener("dragstart", () => {
                  arrastrando = true;
                });
                map.addListener("dragend", () => {
                  arrastrando = false;
                  overlay.draw();
                });
                map.addListener("dragstart", () => {
                  if (!siguiendoRef.current) return;
                  siguiendoRef.current = false;
                  onCenteredRef.current?.(false);
                });
                map.addListener("idle", () => {
                  arrastrando = false;
                  overlay.draw();
                  if (!siguiendoRef.current) return;
                  if (Date.now() - centradoEnRef.current < 800) return;
                  const center = map.getCenter();
                  const aqui = userLocationRef.current;
                  if (!center || !aqui) return;
                  if (distanciaKm(center.lat(), center.lng(), aqui.lat, aqui.lng) > 0.15) {
                    siguiendoRef.current = false;
                    onCenteredRef.current?.(false);
                  }
                });
              }}
              onUnmount={() => {
                personaRef.current?.setMap(null);
                shapeRef.current?.setMap(null);
                overlayRef.current?.setMap(null);
                mapRef.current = null;
                setMapReady(false);
                setCapa(null);
              }}
              onZoomChanged={() => {
                const z = mapRef.current?.getZoom();
                if (z != null) setZoom(z);
              }}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                zoomControl: false,
                cameraControl: false,
                rotateControl: false,
                clickableIcons: false,
                gestureHandling: "greedy",
                backgroundColor: "#e8eaed",
              }}
            />
          )}
          {capa && createPortal(
            grupos.map((grupo) => {
              const esGrupo = grupo.tipo === "grupo";
              const prop = grupo.items[0].prop;
              const elegido = !esGrupo && selectedId === prop.id;
              return (
                <div
                  key={grupo.id}
                  ref={(el) => {
                    if (el) pinEls.current.set(grupo.id, el);
                    else pinEls.current.delete(grupo.id);
                  }}
                  className="pointer-events-none absolute"
                >
                  <button
                    type="button"
                    className="pointer-events-auto"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (esGrupo) abrirGrupo(grupo);
                      else elegir(prop);
                    }}
                    style={{
                      transform: esGrupo || !detallada
                        ? `translate(-50%, -50%)${elegido ? " scale(1.08)" : ""}`
                        : `translate(-50%, -100%)${elegido ? " scale(1.08)" : ""}`,
                      width: esGrupo ? 36 : detallada ? "auto" : 22,
                      height: esGrupo ? 36 : detallada ? "auto" : 22,
                      padding: !esGrupo && detallada ? "6px 10px" : 0,
                      borderRadius: esGrupo || !detallada ? "50%" : 999,
                      border: "2px solid #fff",
                      background: elegido ? "#3b1d86" : "#532ba8",
                      color: "#fff",
                      font: esGrupo ? "800 13px system-ui, sans-serif" : "700 12px system-ui, sans-serif",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      boxShadow: elegido ? "0 0 0 3px #d0bcff" : "0 2px 6px rgba(0,0,0,.28)",
                    }}
                  >
                    {esGrupo ? grupo.items.length : detallada ? etiquetaPrecio(prop) : ""}
                  </button>
                </div>
              );
            }),
            capa,
          )}
        </div>
        {showDrawButton && (
          <button
            type="button"
            aria-pressed={drawMode}
            aria-label={drawMode ? "Dejar de dibujar la zona" : "Dibujar la zona con el dedo"}
            onClick={() => setDrawMode(!drawMode)}
            className={`absolute top-3 right-3 z-[500] flex h-12 w-12 items-center justify-center rounded-full shadow-lg border ${
              drawMode ? "bg-primary text-white border-primary" : "bg-white text-primary border-outline-variant/40"
            }`}
          >
            <span className="material-symbols-outlined text-[28px]">touch_app</span>
          </button>
        )}
      </div>
      {!fill && placed.length > 0 && (
        <p className="text-xs text-on-surface-variant font-body">
          {drawMode
            ? "Dibujá un círculo sobre la zona. Al soltar, se ven solo las publicaciones de adentro."
            : `${visibles.length} publicación${visibles.length === 1 ? "" : "es"} en el mapa.`}
        </p>
      )}
    </div>
  );
}
