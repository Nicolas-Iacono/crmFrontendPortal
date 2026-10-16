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
type Placed = { prop: PropiedadLista; lat: number; lng: number };

type MarkerHandle = {
  setMap: (map: unknown) => void;
  setVisible?: (visible: boolean) => void;
  setSelected?: (on: boolean) => void;
  setDetailed?: (on: boolean) => void;
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
  addListener: (event: string, fn: () => void) => { remove?: () => void };
};

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

/** A partir de este zoom el punto violeta pasa a mostrar el precio. */
const ZOOM_PRECIOS = 14;

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

  const paint = () => {
    if (!button) return;
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
    button.style.left = `${point.x}px`;
    button.style.top = `${point.y}px`;
  };
  overlay.onRemove = function () {
    button?.remove();
    button = null;
  };
  overlay.setMap(map);

  return {
    setMap: (next) => overlay.setMap(next),
    setVisible: (visible) => {
      if (button) button.style.display = visible ? "" : "none";
    },
    setSelected: (on) => {
      selected = on;
      paint();
    },
    setDetailed: (on) => {
      detailed = on;
      paint();
    },
  };
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
  const markersRef = useRef<{ id: number; lat: number; lng: number; marker: MarkerHandle }[]>([]);
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
      setMarkerVisible(item.marker, show);
      if (show && (area || shown.mode === "ids")) count += 1;
    }
    if (area || shown.mode === "ids") setInsideCount(count);
    else setInsideCount(null);
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
    if (!hasProperties) return;
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
        zoomControl: true,
        zoomControlOptions: google.maps.ControlPosition
          ? { position: google.maps.ControlPosition.RIGHT_BOTTOM }
          : undefined,
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

      if (userLocationRef.current && google.maps.Marker) {
        const person =
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"><path fill="#532ba8" stroke="#fff" stroke-width="1.2" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
          );
        new google.maps.Marker({
          map,
          position: userLocationRef.current,
          title: "Estás acá",
          clickable: false,
          zIndex: 9999,
          icon: {
            url: person,
            scaledSize: google.maps.Size ? new google.maps.Size(40, 40) : undefined,
            anchor: new google.maps.Point(20, 20),
          },
        });
      }

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
          markersRef.current.push({ id: item.prop.id, lat: item.lat, lng: item.lng, marker });
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
      el.replaceChildren();
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

  if (properties.length === 0) {
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
