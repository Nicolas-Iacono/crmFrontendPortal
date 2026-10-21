"use client";

import type { PropiedadLista } from "@/lib/api";
import { formatPrecio } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

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
  return { lat, lng };
}

/** Evita re-geocodificar al volver a abrir el mapa en la misma sesión del navegador. */
const geocodeClientCache = new Map<string, { lat: number; lng: number }>();

type LatLng = { lat: number; lng: number };

const PIN_PERSONA =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">` +
      `<path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#532ba8"/>` +
      `<path transform="translate(6 5)" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1.2h16V18c0-2.66-5.33-4-8-4z" fill="#fff"/>` +
      `</svg>`
  );
type Placed = { prop: PropiedadLista; lat: number; lng: number };

type MarkerHandle = {
  setMap: (map: unknown) => void;
  setVisible?: (visible: boolean) => void;
  setSelected?: (on: boolean) => void;
  setDetailed?: (on: boolean) => void;
  setOffset?: (x: number, y: number) => void;
  addListener?: (event: string, fn: () => void) => void;
  content?: HTMLElement;
};

type ShapeHandle = { setMap: (map: unknown) => void; setPath?: (path: LatLng[]) => void };

type ShownMode = { mode: "all" } | { mode: "none" } | { mode: "ids"; ids: Set<number> };

type GoogleNS = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMap;
    Marker?: new (opts: Record<string, unknown>) => MarkerHandle;
    Polyline: new (opts: Record<string, unknown>) => ShapeHandle;
    Polygon: new (opts: Record<string, unknown>) => ShapeHandle;
    InfoWindow: new () => {
      setContent: (html: string) => void;
      open: (a: unknown, b?: unknown) => void;
    };
    LatLng: new (lat: number, lng: number) => unknown;
    LatLngBounds: new () => { extend: (ll: LatLng) => void; isEmpty: () => boolean };
    Point: new (x: number, y: number) => unknown;
    Size?: new (w: number, h: number) => unknown;
    OverlayView: new () => {
      setMap: (map: unknown) => void;
      getPanes: () => { overlayMouseTarget: HTMLElement } | null;
      getProjection: () => {
        fromContainerPixelToLatLng: (p: unknown) => { lat: () => number; lng: () => number };
        fromLatLngToDivPixel: (ll: unknown) => { x: number; y: number } | null;
      } | null;
      onAdd: () => void;
      draw: () => void;
      onRemove: () => void;
    };
    SymbolPath?: { CIRCLE: number };
    ColorScheme?: { LIGHT: string };
    ControlPosition?: { RIGHT_BOTTOM: number };
    importLibrary?: (name: string) => Promise<unknown>;
    marker?: { AdvancedMarkerElement?: new (opts: Record<string, unknown>) => MarkerHandle };
    event?: { trigger: (target: unknown, name: string) => void };
  };
};

type GoogleMap = {
  setOptions: (opts: Record<string, unknown>) => void;
  getDiv: () => HTMLElement;
  getBounds: () => { contains: (ll: unknown) => boolean } | null | undefined;
  fitBounds: (bounds: unknown, padding?: number) => void;
  getZoom: () => number | undefined;
  setZoom: (zoom: number) => void;
  panTo: (ll: LatLng) => void;
  getCenter?: () => { lat: () => number; lng: () => number } | null | undefined;
  addListener: (event: string, fn: () => void) => { remove?: () => void };
};

function distanciaKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(s)));
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

function googleNs(): GoogleNS | undefined {
  return (window as Window & { google?: GoogleNS }).google;
}

let mapsScriptPromise: Promise<void> | null = null;

/** Una sola etiqueta de script. React vuelve a montar el mapa y Google rechaza una segunda copia. */
function loadGoogleMapsScript(key: string): Promise<void> {
  if (googleNs()?.maps?.Map) return Promise.resolve();
  if (mapsScriptPromise) return mapsScriptPromise;

  mapsScriptPromise = new Promise((resolve, reject) => {
    if (!document.getElementById("portal-google-maps")) {
      const script = document.createElement("script");
      script.id = "portal-google-maps";
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
      script.onerror = () => script.setAttribute("data-error", "1");
      document.head.appendChild(script);
    }

    const started = Date.now();
    const tick = () => {
      const script = document.getElementById("portal-google-maps");
      const maps = googleNs()?.maps;
      if (maps?.Map || maps?.importLibrary) {
        resolve();
        return;
      }
      if (script?.getAttribute("data-error") === "1" || Date.now() - started > 10000) {
        mapsScriptPromise = null;
        reject(new Error("google maps"));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });

  return mapsScriptPromise;
}

async function loadGoogle(): Promise<GoogleNS> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("sin clave");
  await loadGoogleMapsScript(key);
  const google = googleNs();
  if (google?.maps?.importLibrary && !google.maps.Map) {
    await google.maps.importLibrary("maps");
  }
  if (!google?.maps?.Map) throw new Error("google maps");
  return google;
}

/** A partir de este zoom el punto violeta pasa a mostrar el precio y los grupos se abren. */
const ZOOM_PRECIOS = 14;

function kmEntrePuntos(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Solo se agrupan propiedades que siguen entrando en la pantalla al acercar el mapa. */
function radioGrupoKm(zoom: number): number {
  if (zoom >= ZOOM_PRECIOS) return 0;
  const kmPantalla = 2.2 * (360 / 2 ** zoom) * 111;
  return Math.min(0.65, Math.max(0.15, kmPantalla * 0.1));
}

function agruparPuntos<T extends { id: number; lat: number; lng: number }>(items: T[], zoom: number) {
  if (zoom >= ZOOM_PRECIOS) {
    return items.map((item) => ({ tipo: "punto" as const, id: String(item.id), pos: { lat: item.lat, lng: item.lng }, items: [item] }));
  }
  const radio = radioGrupoKm(zoom);
  const pendientes = [...items];
  const grupos: T[][] = [];
  while (pendientes.length > 0) {
    const semilla = pendientes.pop() as T;
    const grupo = [semilla];
    for (let i = pendientes.length - 1; i >= 0; i -= 1) {
      const item = pendientes[i];
      if (kmEntrePuntos(semilla.lat, semilla.lng, item.lat, item.lng) <= radio) {
        grupo.push(item);
        pendientes.splice(i, 1);
      }
    }
    grupos.push(grupo);
  }
  return grupos.map((grupo) => {
    if (grupo.length === 1) {
      return { tipo: "punto" as const, id: String(grupo[0].id), pos: { lat: grupo[0].lat, lng: grupo[0].lng }, items: grupo };
    }
    const lat = grupo.reduce((sum, item) => sum + item.lat, 0) / grupo.length;
    const lng = grupo.reduce((sum, item) => sum + item.lng, 0) / grupo.length;
    return { tipo: "grupo" as const, id: `g-${lat.toFixed(4)}-${lng.toFixed(4)}`, pos: { lat, lng }, items: grupo };
  });
}

function separarEnCirculo(cantidad: number, indice: number): { x: number; y: number } {
  if (cantidad <= 1) return { x: 0, y: 0 };
  const radio = 26;
  const angulo = (Math.PI * 2 * indice) / cantidad - Math.PI / 2;
  return { x: Math.cos(angulo) * radio, y: Math.sin(angulo) * radio };
}

function etiquetaPrecio(prop: PropiedadLista): string {
  if (!prop.mostrarPrecio || prop.precio == null) return "Consultar";
  return formatPrecio(prop.precio, prop.moneda);
}

function createPriceTag(
  google: GoogleNS,
  map: GoogleMap,
  position: LatLng,
  label: string,
  onClick: () => void
): MarkerHandle {
  const overlay = new google.maps.OverlayView() as InstanceType<GoogleNS["maps"]["OverlayView"]> & {
    getPanes: () => { overlayMouseTarget: HTMLElement } | null;
    getProjection: () => { fromLatLngToDivPixel: (ll: unknown) => { x: number; y: number } | null } | null;
  };
  const latLng = new google.maps.LatLng(position.lat, position.lng);
  let button: HTMLButtonElement | null = null;
  let selected = false;
  let detailed = (map.getZoom() ?? 0) >= ZOOM_PRECIOS;
  let visible = true;
  let offset = { x: 0, y: 0 };

  const paint = () => {
    if (!button) return;
    button.style.display = visible ? "" : "none";
    if (!visible) return;
    button.style.background = selected ? "#3b1d86" : "#532ba8";
    button.style.zIndex = selected ? "3" : "1";
    if (!detailed) {
      button.textContent = "";
      button.style.width = "24px";
      button.style.height = "24px";
      button.style.padding = "0";
      button.style.borderRadius = "50%";
      button.style.background = selected ? "rgb(85, 34, 205)" : "rgb(130, 74, 234)";
      button.style.border = "2px solid #fff";
      button.style.boxShadow = selected ? "0 0 0 3px #d0bcff" : "0 1px 4px rgba(83,43,168,.35)";
      button.style.transform = selected ? "translate(-50%, -50%) scale(1.2)" : "translate(-50%, -50%)";
      return;
    }
    button.textContent = label;
    button.style.width = "";
    button.style.height = "";
    button.style.padding = "6px 10px";
    button.style.borderRadius = "999px";
    button.style.border = "2px solid #fff";
    button.style.boxShadow = selected
      ? "0 0 0 3px #d0bcff, 0 2px 8px rgba(83,43,168,.45)"
      : "0 2px 6px rgba(0,0,0,.28)";
    button.style.transform = selected ? "translate(-50%, -100%) scale(1.08)" : "translate(-50%, -100%)";
  };

  overlay.onAdd = function () {
    button = document.createElement("button");
    button.type = "button";
    button.textContent = detailed ? label : "";
    button.style.position = "absolute";
    button.style.border = "2px solid #fff";
    button.style.borderRadius = "999px";
    button.style.color = "#fff";
    button.style.font = "700 12px system-ui, sans-serif";
    button.style.lineHeight = "1";
    button.style.padding = "6px 10px";
    button.style.whiteSpace = "nowrap";
    button.style.cursor = "pointer";
    button.style.transition = "transform .2s ease, background .2s ease, box-shadow .2s ease";
    paint();
    button.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    button.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      onClick();
    });
    this.getPanes()?.overlayMouseTarget.appendChild(button);
  };
  overlay.draw = function () {
    if (!button) return;
    const point = this.getProjection()?.fromLatLngToDivPixel(latLng);
    if (!point) return;
    button.style.left = `${point.x + offset.x}px`;
    button.style.top = `${point.y + offset.y}px`;
  };
  overlay.onRemove = function () {
    button?.remove();
    button = null;
  };
  overlay.setMap(map);

  return {
    setMap: (next) => overlay.setMap(next),
    setVisible: (on) => {
      visible = on;
      if (button) button.style.display = on ? "" : "none";
    },
    setSelected: (on) => {
      selected = on;
      paint();
    },
    setDetailed: (on) => {
      detailed = on;
      paint();
    },
    setOffset: (x: number, y: number) => {
      offset = { x, y };
      overlay.draw();
    },
  };
}

function createClusterBadge(
  google: GoogleNS,
  map: GoogleMap,
  position: LatLng,
  count: number,
  onClick: () => void
): MarkerHandle {
  const overlay = new google.maps.OverlayView() as InstanceType<GoogleNS["maps"]["OverlayView"]> & {
    getPanes: () => { overlayMouseTarget: HTMLElement } | null;
    getProjection: () => { fromLatLngToDivPixel: (ll: unknown) => { x: number; y: number } | null } | null;
  };
  const latLng = new google.maps.LatLng(position.lat, position.lng);
  let button: HTMLButtonElement | null = null;

  overlay.onAdd = function () {
    button = document.createElement("button");
    button.type = "button";
    button.textContent = String(count);
    button.style.position = "absolute";
    button.style.width = "36px";
    button.style.height = "36px";
    button.style.padding = "0";
    button.style.border = "2px solid #fff";
    button.style.borderRadius = "50%";
    button.style.background = "#532ba8";
    button.style.color = "#fff";
    button.style.font = "800 13px system-ui, sans-serif";
    button.style.lineHeight = "1";
    button.style.cursor = "pointer";
    button.style.boxShadow = "0 2px 8px rgba(0,0,0,.25)";
    button.style.transform = "translate(-50%, -50%)";
    button.style.zIndex = "4";
    button.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    button.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      onClick();
    });
    this.getPanes()?.overlayMouseTarget.appendChild(button);
  };
  overlay.draw = function () {
    if (!button) return;
    const point = this.getProjection()?.fromLatLngToDivPixel(latLng);
    if (!point) return;
    button.style.left = `${point.x}px`;
    button.style.top = `${point.y}px`;
  };
  overlay.onRemove = function () {
    button?.remove();
    button = null;
  };
  overlay.setMap(map);

  return { setMap: (next) => overlay.setMap(next) };
}

function centrarEn(map: GoogleMap, item: { lat: number; lng: number }, zoomIn: boolean) {
  const zoom = zoomIn ? 16 : (map.getZoom() ?? 14);
  if (zoomIn) map.setZoom(zoom);
  const height = map.getDiv()?.clientHeight ?? 0;
  const pixels = height * 0.22;
  const metersPerPixel = (156543.03392 * Math.cos((item.lat * Math.PI) / 180)) / 2 ** zoom;
  const dLat = (pixels * metersPerPixel) / 111320;
  map.panTo({ lat: item.lat - dLat, lng: item.lng });
}

function setMarkerVisible(marker: MarkerHandle, visible: boolean) {
  if (marker.setVisible) {
    marker.setVisible(visible);
    return;
  }
  if (marker.content) marker.content.style.display = visible ? "" : "none";
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
  /** null borra el trazo si el padre limpió la selección. */
  areaIds?: number[] | null;
  /** El mapa ocupa todo el alto del contenedor (pantalla completa). */
  fill?: boolean;
  showDrawButton?: boolean;
  drawMode?: boolean;
  onDrawModeChange?: (on: boolean) => void;
  /** Si viene, solo se muestran esos ids. null muestra todas. */
  visibleIds?: number[] | null;
  /**
   * undefined: mostrar todas (listado).
   * null: no mostrar propiedades hasta que el usuario lo pida.
   * array: solo esas propiedades.
   */
  shownIds?: number[] | null;
  revealTick?: number;
  onRevealViewport?: (ids: number[]) => void;
  selectedId?: number | null;
  onMarkerSelect?: (id: number) => void;
  /** Cada vez que aumenta, el mapa acerca y centra la propiedad seleccionada. */
  locateTick?: number;
  /** Cada vez que aumenta, el mapa centra la ubicación de la persona. */
  userFocusTick?: number;
  /** true mientras el centro del mapa sigue a la persona. */
  onUserCenteredChange?: (on: boolean) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const googleRef = useRef<GoogleNS | null>(null);
  const overlayRef = useRef<InstanceType<GoogleNS["maps"]["OverlayView"]> | null>(null);
  const [status, setStatus] = useState<{ done: number; total: number; phase: string }>({
    done: 0,
    total: 0,
    phase: "idle",
  });
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [drawModeState, setDrawModeState] = useState(false);
  const drawMode = drawModeProp ?? drawModeState;
  const [insideCount, setInsideCount] = useState<number | null>(null);
  const drawModeRef = useRef(false);
  const onAreaSelectRef = useRef(onAreaSelect);
  const onRevealRef = useRef(onRevealViewport);
  const onMarkerSelectRef = useRef(onMarkerSelect);
  const selectedIdRef = useRef<number | null>(selectedId);
  const setDrawModeRef = useRef<(next: boolean) => void>(() => {});
  const shapeRef = useRef<ShapeHandle | null>(null);
  const areaIdsRef = useRef<Set<number> | null>(null);
  const visibleIdsRef = useRef<Set<number> | null>(null);
  const shownModeRef = useRef<ShownMode>({ mode: "all" });
  const placedRef = useRef<Placed[]>([]);
  const userLocationRef = useRef(userLocation ?? null);
  const userMarkerRef = useRef<MarkerHandle | null>(null);
  const siguiendoRef = useRef(false);
  const centradoEnRef = useRef(0);
  const focoAplicadoRef = useRef(0);
  const onUserCenteredRef = useRef(onUserCenteredChange);
  onUserCenteredRef.current = onUserCenteredChange;
  const markersRef = useRef<{ id: number; lat: number; lng: number; marker: MarkerHandle; mostrar: boolean }[]>([]);
  const clustersRef = useRef<MarkerHandle[]>([]);
  const grupoKeyRef = useRef("");
  const agruparRef = useRef<() => void>(() => {});
  const paintRef = useRef<() => void>(() => {});
  const hasProperties = properties.length > 0;

  userLocationRef.current = userLocation ?? null;
  placedRef.current = placed;
  selectedIdRef.current = selectedId;

  const setDrawMode = (next: boolean) => {
    drawModeRef.current = next;
    if (drawModeProp === undefined) setDrawModeState(next);
    onDrawModeChange?.(next);
  };
  setDrawModeRef.current = setDrawMode;

  paintRef.current = () => {
    const area = areaIdsRef.current;
    const allow = visibleIdsRef.current;
    const shown = shownModeRef.current;
    let count = 0;
    for (const item of markersRef.current) {
      let inZone = true;
      if (area) inZone = area.has(item.id);
      else if (shown.mode === "none") inZone = false;
      else if (shown.mode === "ids") inZone = shown.ids.has(item.id);
      const inFilter = allow == null || allow.has(item.id);
      const show = inZone && inFilter;
      item.mostrar = show;
      if (show && (area || shown.mode === "ids")) count += 1;
    }
    if (area || shown.mode === "ids") setInsideCount(count);
    else setInsideCount(null);
    agruparRef.current();
  };

  agruparRef.current = () => {
    const map = mapRef.current;
    const google = googleRef.current;
    if (!map || !google) return;
    const zoom = map.getZoom() ?? 0;
    const visibles = markersRef.current.filter((item) => item.mostrar);
    const key = `${radioGrupoKm(zoom).toFixed(2)}:${visibles.map((item) => item.id).join(",")}`;
    if (key === grupoKeyRef.current) return;
    grupoKeyRef.current = key;
    for (const cluster of clustersRef.current) cluster.setMap(null);
    clustersRef.current = [];
    const escondidos = new Set<number>();
    const abrir = zoom < ZOOM_PRECIOS;
    if (abrir) {
      for (const grupo of agruparPuntos(visibles, zoom)) {
        if (grupo.tipo !== "grupo") continue;
        for (const item of grupo.items) escondidos.add(item.id);
        const pos = grupo.pos;
        clustersRef.current.push(createClusterBadge(google, map, pos, grupo.items.length, () => {
          let minLat = grupo.items[0].lat;
          let maxLat = minLat;
          let minLng = grupo.items[0].lng;
          let maxLng = minLng;
          const bounds = new google.maps.LatLngBounds();
          for (const item of grupo.items) {
            bounds.extend({ lat: item.lat, lng: item.lng });
            minLat = Math.min(minLat, item.lat);
            maxLat = Math.max(maxLat, item.lat);
            minLng = Math.min(minLng, item.lng);
            maxLng = Math.max(maxLng, item.lng);
          }
          const alcance = kmEntrePuntos(minLat, minLng, maxLat, maxLng);
          if (alcance < 0.08) {
            map.panTo(pos);
            map.setZoom(16);
            return;
          }
          map.fitBounds(bounds, 96);
        }));
      }
    }
    const porLugar = new Map<string, typeof visibles>();
    for (const item of markersRef.current) {
      const lugar = `${item.lat.toFixed(4)}:${item.lng.toFixed(4)}`;
      const lista = porLugar.get(lugar) ?? [];
      lista.push(item);
      porLugar.set(lugar, lista);
    }
    for (const lista of porLugar.values()) {
      lista.forEach((item, indice) => {
        const visible = item.mostrar && !escondidos.has(item.id);
        const corrido = visible && lista.length > 1 ? separarEnCirculo(lista.length, indice) : { x: 0, y: 0 };
        item.marker.setOffset?.(corrido.x, corrido.y);
        setMarkerVisible(item.marker, visible);
      });
    }
  };

  useEffect(() => {
    onAreaSelectRef.current = onAreaSelect;
  }, [onAreaSelect]);

  useEffect(() => {
    onRevealRef.current = onRevealViewport;
  }, [onRevealViewport]);

  useEffect(() => {
    onMarkerSelectRef.current = onMarkerSelect;
  }, [onMarkerSelect]);

  useEffect(() => {
    for (const item of markersRef.current) {
      item.marker.setSelected?.(item.id === selectedId);
    }
    const map = mapRef.current;
    if (!map || selectedId == null) return;
    const item = markersRef.current.find((marker) => marker.id === selectedId);
    if (!item) return;
    centrarEn(map, item, false);
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const google = googleRef.current;
    const pos = userLocation ?? null;
    if (!mapReady || !map || !google?.maps.Marker) return;
    if (!pos) {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      return;
    }
    const actual = userMarkerRef.current as (MarkerHandle & { setPosition?: (p: LatLng) => void }) | null;
    if (actual?.setPosition) {
      actual.setPosition(pos);
      actual.setMap(map);
    } else {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = new google.maps.Marker({
        map,
        position: pos,
        title: "Estás acá",
        clickable: false,
        zIndex: 9999,
        icon: {
          url: PIN_PERSONA,
          scaledSize: google.maps.Size ? new google.maps.Size(36, 48) : undefined,
          anchor: new google.maps.Point(18, 46),
        },
      });
    }
    if (userFocusTick > focoAplicadoRef.current) {
      focoAplicadoRef.current = userFocusTick;
      siguiendoRef.current = true;
      centradoEnRef.current = Date.now();
      onUserCenteredRef.current?.(true);
      map.panTo(pos);
      if ((map.getZoom() ?? 0) < 15) map.setZoom(15);
    }
  }, [mapReady, userLocation, userFocusTick]);

  useEffect(() => {
    if (!locateTick || selectedId == null) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      const map = mapRef.current;
      const item = markersRef.current.find((marker) => marker.id === selectedId);
      if (map && item) {
        for (const marker of markersRef.current) marker.marker.setSelected?.(marker.id === selectedId);
        centrarEn(map, item, true);
        window.clearInterval(timer);
        return;
      }
      if (tries >= 60) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [locateTick, selectedId]);

  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  useEffect(() => {
    visibleIdsRef.current = visibleIds ? new Set(visibleIds) : null;
    paintRef.current();
  }, [visibleIds]);

  useEffect(() => {
    if (shownIds === undefined) shownModeRef.current = { mode: "all" };
    else if (shownIds === null) shownModeRef.current = { mode: "none" };
    else shownModeRef.current = { mode: "ids", ids: new Set(shownIds) };
    paintRef.current();
  }, [shownIds]);

  useEffect(() => {
    if (areaIds == null) {
      if (areaIdsRef.current == null && shapeRef.current == null) return;
      shapeRef.current?.setMap(null);
      shapeRef.current = null;
      areaIdsRef.current = null;
      setInsideCount(null);
      paintRef.current();
      return;
    }
    areaIdsRef.current = new Set(areaIds);
    paintRef.current();
  }, [areaIds]);

  useEffect(() => {
    if (properties.length === 0) return;

    let cancelled = false;
    const initial: Placed[] = [];
    const missingQueries: string[] = [];

    for (const prop of properties) {
      const stored = coordsGuardadas(prop);
      if (stored) {
        initial.push({ prop, ...stored });
        continue;
      }
      const q = ubicacionQuery(prop);
      const cached = geocodeClientCache.get(q);
      if (cached) {
        initial.push({ prop, ...cached });
        continue;
      }
      missingQueries.push(q);
    }

    const uniqueMissing = [...new Set(missingQueries)];

    setError(null);
    setPlaced(initial);
    if (uniqueMissing.length === 0) {
      if (initial.length === 0) {
        setStatus({ done: 0, total: 0, phase: "empty" });
        setError("No pudimos ubicar estas publicaciones en el mapa. Probá acotar la zona o revisá las direcciones en el CRM.");
      } else {
        setStatus({ done: properties.length, total: properties.length, phase: "map" });
      }
      return;
    }

    setStatus({
      done: properties.length - uniqueMissing.length,
      total: properties.length,
      phase: initial.length > 0 ? "map" : "geocoding",
    });

    (async () => {
      let doneMissing = 0;
      await Promise.all(
        uniqueMissing.map(async (q) => {
          try {
            const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
            if (res.ok) {
              const j = (await res.json()) as { lat: number; lon: number };
              geocodeClientCache.set(q, { lat: j.lat, lng: j.lon });
            }
          } catch {
            /* ignorar una dirección fallida */
          }
          doneMissing += 1;
          if (!cancelled) {
            setStatus({
              done: properties.length - uniqueMissing.length + doneMissing,
              total: properties.length,
              phase: initial.length > 0 ? "map" : "geocoding",
            });
          }
        })
      );

      if (cancelled) return;

      const extra: Placed[] = [];
      for (const prop of properties) {
        if (coordsGuardadas(prop)) continue;
        const ll = geocodeClientCache.get(ubicacionQuery(prop));
        if (ll) extra.push({ prop, ...ll });
      }

      const merged = [...initial, ...extra];
      if (merged.length === 0) {
        setError("No pudimos ubicar estas publicaciones en el mapa. Probá acotar la zona o revisá las direcciones en el CRM.");
        setStatus({ done: properties.length, total: properties.length, phase: "empty" });
        return;
      }
      setPlaced(merged);
      setStatus({ done: properties.length, total: properties.length, phase: "map" });
    })();

    return () => {
      cancelled = true;
    };
  }, [properties]);

  useEffect(() => {
    if (!hasProperties && !fill) return;
    const el = wrapRef.current;
    if (!el) return;

    let cancelled = false;

    (async () => {
      let google: GoogleNS;
      try {
        google = await loadGoogle();
      } catch {
        if (!cancelled) setError("No se pudo cargar Google Maps.");
        return;
      }
      if (cancelled || !wrapRef.current) return;

      googleRef.current = google;
      (window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
        if (!cancelled) {
          setError(
            "Google Maps bloqueó esta página. En la clave hay que permitir http://localhost:3001/* y https://portal.tuinmo.net/*."
          );
        }
      };
      const center = userLocationRef.current || { lat: -34.6037, lng: -58.3816 };
      const classicMarker = typeof google.maps.Marker === "function";
      let map: GoogleMap;
      try {
        map = new google.maps.Map(el, {
        center,
        zoom: userLocationRef.current ? 14 : 12,
        mapTypeId: "roadmap",
        clickableIcons: false,
        gestureHandling: "greedy",
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: false,
        cameraControl: false,
        rotateControl: false,
        backgroundColor: "#e8eaed",
        ...(google.maps.ColorScheme ? { colorScheme: google.maps.ColorScheme.LIGHT } : {}),
        ...(classicMarker ? {} : { mapId: "DEMO_MAP_ID" }),
      });
      } catch {
        if (!cancelled) {
          setError(
            "Google Maps bloqueó esta página. En la clave hay que permitir http://localhost:3001/* y https://portal.tuinmo.net/*."
          );
        }
        return;
      }
      if (cancelled) return;
      mapRef.current = map;

      const overlay = new google.maps.OverlayView();
      overlay.onAdd = () => {};
      overlay.draw = () => {};
      overlay.onRemove = () => {};
      overlay.setMap(map);
      overlayRef.current = overlay;

      const container = map.getDiv?.() || el;
      if (!container?.addEventListener) return;
      let drawing = false;
      let stroke: LatLng[] = [];
      let liveLine: ShapeHandle | null = null;

      const toLatLng = (ev: PointerEvent): LatLng | null => {
        const proj = overlay.getProjection();
        if (!proj) return null;
        const rect = container.getBoundingClientRect();
        const ll = proj.fromContainerPixelToLatLng(new google.maps.Point(ev.clientX - rect.left, ev.clientY - rect.top));
        return { lat: ll.lat(), lng: ll.lng() };
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
        liveLine?.setMap(null);
        liveLine = new google.maps.Polyline({
          map,
          path: stroke,
          strokeColor: "#532ba8",
          strokeWeight: 3,
        });
      };
      const onMove = (ev: PointerEvent) => {
        if (!drawing || !drawModeRef.current) return;
        ev.preventDefault();
        const ll = toLatLng(ev);
        if (!ll) return;
        const prev = stroke[stroke.length - 1];
        if (prev && Math.abs(prev.lat - ll.lat) < 0.00002 && Math.abs(prev.lng - ll.lng) < 0.00002) return;
        stroke.push(ll);
        liveLine?.setPath?.(stroke);
      };
      const onUp = () => {
        if (!drawing) return;
        drawing = false;
        liveLine?.setMap(null);
        liveLine = null;
        if (stroke.length < 3) return;
        const ring = stroke;
        shapeRef.current?.setMap(null);
        const polygon = new google.maps.Polygon({
          map,
          paths: ring,
          strokeColor: "#532ba8",
          strokeWeight: 2,
          fillColor: "#d0bcff",
          fillOpacity: 0.28,
        });
        shapeRef.current = polygon;
        const ids: number[] = [];
        for (const item of markersRef.current) {
          if (puntoDentro(item.lat, item.lng, ring)) ids.push(item.id);
        }
        areaIdsRef.current = new Set(ids);
        paintRef.current();
        onAreaSelectRef.current?.(ids);
        map.setOptions({ draggable: true, gestureHandling: "greedy" });
        setDrawModeRef.current(false);
      };

      container.addEventListener("pointerdown", onDown, true);
      container.addEventListener("pointermove", onMove, true);
      container.addEventListener("pointerup", onUp, true);
      container.addEventListener("pointercancel", onUp, true);

      if (drawModeRef.current) {
        map.setOptions({ draggable: false, gestureHandling: "none" });
      }

      const sync = () => {
        const current = mapRef.current;
        const g = googleRef.current;
        if (!current || !g) return;
        const nextIds = new Set(placedRef.current.map((item) => item.prop.id));
        markersRef.current = markersRef.current.filter((item) => {
          if (nextIds.has(item.id)) return true;
          item.marker.setMap(null);
          return false;
        });
        const have = new Set(markersRef.current.map((item) => item.id));
        for (const item of placedRef.current) {
          if (have.has(item.prop.id)) continue;
          const marker = createPriceTag(g, current, { lat: item.lat, lng: item.lng }, etiquetaPrecio(item.prop), () => {
            marker.setSelected?.(true);
            for (const other of markersRef.current) {
              if (other.id !== item.prop.id) other.marker.setSelected?.(false);
            }
            if (onMarkerSelectRef.current) onMarkerSelectRef.current(item.prop.id);
            else window.location.assign(`/propiedad/${encodeURIComponent(item.prop.slug)}`);
          });
          marker.setSelected?.(item.prop.id === selectedIdRef.current);
          markersRef.current.push({ id: item.prop.id, lat: item.lat, lng: item.lng, marker, mostrar: true });
        }
        paintRef.current();
        const zoom = current.getZoom() ?? 0;
        const detailed = zoom >= ZOOM_PRECIOS;
        for (const item of markersRef.current) item.marker.setDetailed?.(detailed);
        if (shownModeRef.current.mode === "all" && markersRef.current.length > 0 && selectedIdRef.current == null) {
          const bounds = new g.maps.LatLngBounds();
          for (const item of markersRef.current) bounds.extend({ lat: item.lat, lng: item.lng });
          if (!bounds.isEmpty()) current.fitBounds(bounds, 48);
        }
      };

      (map as GoogleMap & { __sync?: () => void }).__sync = sync;
      map.addListener("zoom_changed", () => {
        const detailed = (map.getZoom() ?? 0) >= ZOOM_PRECIOS;
        for (const item of markersRef.current) item.marker.setDetailed?.(detailed);
        agruparRef.current();
      });
      map.addListener("idle", () => {
        agruparRef.current();
      });
      map.addListener("dragstart", () => {
        if (!siguiendoRef.current) return;
        siguiendoRef.current = false;
        onUserCenteredRef.current?.(false);
      });
      map.addListener("idle", () => {
        if (!siguiendoRef.current) return;
        if (Date.now() - centradoEnRef.current < 800) return;
        const center = map.getCenter?.();
        const aqui = userLocationRef.current;
        if (!center || !aqui) return;
        if (distanciaKm(center.lat(), center.lng(), aqui.lat, aqui.lng) > 0.15) {
          siguiendoRef.current = false;
          onUserCenteredRef.current?.(false);
        }
      });
      sync();
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      setMapReady(false);
      mapRef.current = null;
      googleRef.current = null;
      overlayRef.current = null;
      shapeRef.current = null;
      markersRef.current = [];
      for (const cluster of clustersRef.current) cluster.setMap(null);
      clustersRef.current = [];
      grupoKeyRef.current = "";
      el.replaceChildren();
      if (siguiendoRef.current) {
        siguiendoRef.current = false;
        onUserCenteredRef.current?.(false);
      }
    };
  }, [hasProperties]);

  useEffect(() => {
    const map = mapRef.current as (GoogleMap & { __sync?: () => void }) | null;
    map?.__sync?.();
  }, [placed, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setOptions({
      draggable: !drawMode,
      gestureHandling: drawMode ? "none" : "greedy",
    });
  }, [drawMode, mapReady]);

  useEffect(() => {
    if (!mapReady || revealTick === 0) return;
    const map = mapRef.current;
    const google = googleRef.current;
    if (!map || !google) return;

    const publish = () => {
      const bounds = map.getBounds();
      if (!bounds) return false;
      const ids = placedRef.current
        .filter((item) => bounds.contains(new google.maps.LatLng(item.lat, item.lng)))
        .map((item) => item.prop.id);
      onRevealRef.current?.(ids);
      return true;
    };

    if (publish()) return;
    let listener: { remove?: () => void } | undefined;
    listener = map.addListener("idle", () => {
      if (!publish()) return;
      listener?.remove?.();
    });
    return () => listener?.remove?.();
  }, [revealTick, mapReady]);

  if (properties.length === 0 && !fill) {
    return (
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-8 text-center text-on-surface-variant text-sm">
        No hay propiedades para mostrar en el mapa.
      </div>
    );
  }

  const frameClass = fill
    ? "h-full w-full min-h-0 rounded-none border-0"
    : "w-full h-[min(70vh,520px)] min-h-[320px] rounded-xl border border-outline-variant/30";

  return (
    <div className={fill ? "h-full" : "space-y-3"}>
      {!fill && status.phase === "geocoding" && (
        <p className="text-sm text-on-surface-variant font-body">
          Ubicando publicaciones en el mapa… {status.done}/{status.total}
        </p>
      )}
      {error && (
        <p
          className={`text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 font-body ${
            fill ? "absolute left-4 right-4 top-36 z-[800] text-center" : ""
          }`}
        >
          {error}
        </p>
      )}
      <div
        className={`${fill ? "relative h-full" : "relative"} ${drawMode ? "cursor-crosshair" : ""}`}
        style={{ touchAction: drawMode ? "none" : "auto" }}
      >
        <div ref={wrapRef} className={`${frameClass} overflow-hidden z-0`} />
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
            : insideCount != null
              ? `${insideCount} publicación${insideCount !== 1 ? "es" : ""} dentro del trazo.`
              : `${placed.length} publicación${placed.length !== 1 ? "es" : ""} en el mapa.`}
        </p>
      )}
    </div>
  );
}
