import { NextRequest, NextResponse } from "next/server";

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT?.trim() ||
  "TuinmoPortal/1.0 (portal inmobiliario; contacto: https://tuinmo.net)";

type NominatimAddress = {
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
};

function cleanPlace(value?: string): string {
  return (value || "").replace(/^partido de\s+/i, "").trim();
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=12&lat=${lat}&lon=${lon}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "No se pudo ubicar la zona" }, { status: 502 });
    }
    const data = (await res.json()) as { address?: NominatimAddress; display_name?: string };
    const address = data.address || {};
    const localidad = cleanPlace(
      address.city || address.town || address.village || address.municipality || address.suburb
    );
    const partido = cleanPlace(address.county || address.municipality || address.city || address.town);
    if (!localidad && !partido) {
      return NextResponse.json({ error: "Sin zona" }, { status: 404 });
    }
    return NextResponse.json({
      localidad,
      partido,
      provincia: cleanPlace(address.state),
      etiqueta: [localidad, partido].filter((v, i, arr) => v && arr.indexOf(v) === i).join(", "),
    });
  } catch {
    return NextResponse.json({ error: "Error de geocodificación" }, { status: 502 });
  }
}
