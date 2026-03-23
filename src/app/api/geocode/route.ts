import { NextRequest, NextResponse } from "next/server";

/** Geocodificación vía Nominatim (OpenStreetMap). Solo servidor: User-Agent y sin CORS del navegador. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", q.trim());

  try {
    const res = await fetch(url.toString(), {
      headers: {
            "User-Agent": "TuinmoPortal/1.0 (portal inmobiliario; https://portal.tuinmo.net)",
        "Accept-Language": "es",
      },
      next: { revalidate: 86_400 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Servicio de mapas no disponible" }, { status: 502 });
    }

    const data = (await res.json()) as { lat?: string; lon?: string }[];
    if (!Array.isArray(data) || data.length === 0 || !data[0].lat || !data[0].lon) {
      return NextResponse.json({ lat: null, lon: null });
    }

    return NextResponse.json({
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    });
  } catch {
    return NextResponse.json({ error: "Error al geocodificar" }, { status: 502 });
  }
}
