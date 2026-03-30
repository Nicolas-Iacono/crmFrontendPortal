import { NextRequest, NextResponse } from "next/server";

/** Caché en memoria (proceso) para no repetir Nominatim en la misma sesión del servidor */
const cache = new Map<string, { lat: number; lon: number }>();

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT?.trim() ||
  "TuinmoPortal/1.0 (portal inmobiliario; contacto: https://tuinmo.net)";

async function nominatimSearch(q: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { lat?: string; lon?: string }[];
  if (!data?.length) return null;
  const lat = parseFloat(data[0].lat ?? "");
  const lon = parseFloat(data[0].lon ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return { lat, lon };
}

/**
 * Geocodifica una dirección (Argentina). El cliente debe respetar ~1 solicitud/seg (política Nominatim).
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length > 300) {
    return NextResponse.json({ error: "Parámetro q inválido" }, { status: 400 });
  }

  const cached = cache.get(q);
  if (cached) {
    return NextResponse.json({ lat: cached.lat, lon: cached.lon, cached: true });
  }

  try {
    const coords = await nominatimSearch(q);
    if (!coords) {
      return NextResponse.json({ error: "Sin resultados" }, { status: 404 });
    }
    cache.set(q, coords);
    return NextResponse.json({ lat: coords.lat, lon: coords.lon, cached: false });
  } catch {
    return NextResponse.json({ error: "Error de geocodificación" }, { status: 502 });
  }
}
