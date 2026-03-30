"use client";

import type { PropiedadLista } from "@/lib/api";
import { formatPrecio, tipoOperacionLabel } from "@/lib/utils";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

function ubicacionQuery(p: PropiedadLista): string {
  const t = p.textoUbicacionMapa?.trim();
  if (t) return t;
  return [p.localidad, p.partido, p.provincia, "Argentina"].filter(Boolean).join(", ");
}

const NOMINATIM_GAP_MS = 1100;

function fixLeafletDefaultIcons() {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

type Placed = { prop: PropiedadLista; lat: number; lng: number };

export default function ListingsLeafletMap({ properties }: { properties: PropiedadLista[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [status, setStatus] = useState<{ done: number; total: number; phase: string }>({
    done: 0,
    total: 0,
    phase: "idle",
  });
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wrapRef.current || properties.length === 0) return;

    let cancelled = false;
    const uniqueQueries = [...new Set(properties.map(ubicacionQuery))];
    const queryToLatLng = new Map<string, { lat: number; lng: number }>();

    (async () => {
      setError(null);
      setPlaced([]);
      setStatus({ done: 0, total: uniqueQueries.length, phase: "geocoding" });

      for (let i = 0; i < uniqueQueries.length; i++) {
        if (cancelled) return;
        const q = uniqueQueries[i];
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const j = (await res.json()) as { lat: number; lon: number };
            queryToLatLng.set(q, { lat: j.lat, lng: j.lon });
          }
        } catch {
          /* ignorar una dirección fallida */
        }
        setStatus({ done: i + 1, total: uniqueQueries.length, phase: "geocoding" });
        if (i < uniqueQueries.length - 1) {
          await new Promise((r) => setTimeout(r, NOMINATIM_GAP_MS));
        }
      }

      if (cancelled) return;

      const list: Placed[] = [];
      for (const prop of properties) {
        const q = ubicacionQuery(prop);
        const ll = queryToLatLng.get(q);
        if (ll) list.push({ prop, lat: ll.lat, lng: ll.lng });
      }

      if (list.length === 0) {
        setError("No pudimos ubicar estas publicaciones en el mapa. Probá acotar la zona o revisá las direcciones en el CRM.");
        setStatus({ done: uniqueQueries.length, total: uniqueQueries.length, phase: "empty" });
        return;
      }

      setPlaced(list);
      setStatus({ done: uniqueQueries.length, total: uniqueQueries.length, phase: "map" });
    })();

    return () => {
      cancelled = true;
    };
  }, [properties]);

  useEffect(() => {
    if (placed.length === 0 || !wrapRef.current) return;

    fixLeafletDefaultIcons();

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const el = wrapRef.current;
    const map = L.map(el, { scrollWheelZoom: true }).setView([-34.6, -58.38], 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    const group = L.featureGroup();
    for (const { prop, lat, lng } of placed) {
      const marker = L.marker([lat, lng]);
      const precio =
        prop.mostrarPrecio && prop.precio != null
          ? formatPrecio(prop.precio, prop.moneda)
          : "Consultar precio";
      const zona = [prop.localidad, prop.partido].filter(Boolean).join(", ");
      marker.bindPopup(
        `<div class="portal-map-popup" style="min-width:180px;font-family:system-ui,sans-serif;font-size:13px;line-height:1.35">
          <strong style="display:block;margin-bottom:6px">${escapeHtml(prop.tituloPublico || "Propiedad")}</strong>
          <span style="color:#5c4d7a;font-weight:600">${escapeHtml(precio)}</span>
          <div style="margin:6px 0;color:#444;font-size:12px">${escapeHtml(zona)}</div>
          <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#ede7f6;font-size:11px;font-weight:600;color:#4a148c">${escapeHtml(tipoOperacionLabel(prop.tipoOperacion))}</span>
          <div style="margin-top:8px"><a href="/propiedad/${encodeURIComponent(prop.slug)}" style="color:#6a1b9a;font-weight:700">Ver detalle</a></div>
        </div>`
      );
      group.addLayer(marker);
    }
    group.addTo(map);
    try {
      map.fitBounds(group.getBounds().pad(0.2));
    } catch {
      map.setView([placed[0].lat, placed[0].lng], 14);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [placed]);

  if (properties.length === 0) {
    return (
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-8 text-center text-on-surface-variant text-sm">
        No hay propiedades para mostrar en el mapa.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {status.phase === "geocoding" && (
        <p className="text-sm text-on-surface-variant font-body">
          Ubicando publicaciones en el mapa… {status.done}/{status.total} direcciones
          <span className="block text-xs mt-1 opacity-80">
            Usamos OpenStreetMap (Nominatim); puede tardar unos segundos.
          </span>
        </p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 font-body">{error}</p>
      )}
      <div
        ref={wrapRef}
        className="w-full h-[min(70vh,520px)] min-h-[320px] rounded-xl overflow-hidden border border-outline-variant/30 z-0"
        style={{ isolation: "isolate" }}
      />
      {placed.length > 0 && (
        <p className="text-xs text-on-surface-variant font-body">
          {placed.length === properties.length
            ? `${placed.length} publicación${placed.length !== 1 ? "es" : ""} en el mapa.`
            : `${placed.length} de ${properties.length} publicaciones ubicadas (algunas direcciones no se encontraron).`}
        </p>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
