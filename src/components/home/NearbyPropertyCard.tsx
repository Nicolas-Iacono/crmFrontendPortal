import Link from "next/link";
import Image from "next/image";
import { Bath, BedDouble, DoorOpen, MapPin, Ruler } from "lucide-react";
import type { PropiedadLista } from "@/lib/api";
import { formatPrecio, tipoOperacionLabel } from "@/lib/utils";
import FavoriteButton from "@/components/FavoriteButton";

export default function NearbyPropertyCard({ prop, distancia }: { prop: PropiedadLista; distancia?: string }) {
  const titulo = prop.tituloPublico?.trim() || [prop.tipo, prop.localidad].filter(Boolean).join(" en ");
  const zona = [prop.localidad, prop.partido].filter(Boolean).join(", ");
  const precio = prop.mostrarPrecio && prop.precio != null ? formatPrecio(prop.precio, prop.moneda) : "Consultar";
  const metros = prop.metrosCuadradosCubierto ?? prop.metrosCuadradosTotales;
  const href = `/propiedad/${prop.slug}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_10px_28px_rgba(25,21,43,0.08)]">
      <div className="relative aspect-[16/10] bg-[#F0E9FF]">
        <Link href={href} className="absolute inset-0">
          {prop.imagenPrincipalUrl ? (
            <Image src={prop.imagenPrincipalUrl} alt={titulo || "Propiedad"} fill className="object-cover" sizes="(min-width: 1024px) 320px, 82vw" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[#737088]">Sin imagen</span>
          )}
        </Link>
        {distancia && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#6937DD]">
            A {distancia}
          </span>
        )}
        <span className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${prop.tipoOperacion === "VENTA" ? "bg-[#6937DD]" : "bg-sky-600"}`}>
          {tipoOperacionLabel(prop.tipoOperacion)}
        </span>
        <FavoriteButton prop={prop} className="absolute right-3 top-3 h-9 w-9 rounded-xl bg-white/90 shadow" />
      </div>
      <Link href={href} className="flex flex-1 flex-col px-3.5 py-3">
        <p className="text-xl font-black leading-none text-[#19152B]">{precio}</p>
        <h3 className="mt-2 line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-snug text-[#19152B]">{titulo}</h3>
        <div className="mt-2 flex min-h-[2.4rem] flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-[#4E2BA5]">
          {metros != null && (
            <span className="inline-flex items-center gap-1"><Ruler size={14} /> {Math.round(metros)} m²</span>
          )}
          {prop.cantidadAmbientes != null && (
            <span className="inline-flex items-center gap-1"><DoorOpen size={14} /> {prop.cantidadAmbientes} amb.</span>
          )}
          {prop.cantidadDormitorios != null && (
            <span className="inline-flex items-center gap-1"><BedDouble size={14} /> {prop.cantidadDormitorios}</span>
          )}
          {prop.cantidadBanos != null && (
            <span className="inline-flex items-center gap-1"><Bath size={14} /> {prop.cantidadBanos}</span>
          )}
        </div>
        <p className="mt-2 flex items-center gap-1 text-[13px] text-[#737088]">
          <MapPin size={14} className="shrink-0 text-[#6937DD]" />
          <span className="truncate">{zona || "Ubicación a consultar"}</span>
        </p>
      </Link>
    </article>
  );
}
