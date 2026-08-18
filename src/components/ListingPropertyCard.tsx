"use client";

import Link from "next/link";
import Image from "next/image";
import { PropiedadLista } from "@/lib/api";
import { formatPrecio, tipoOperacionLabel } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";

export default function ListingPropertyCard({ prop }: { prop: PropiedadLista }) {
  const ubicacion = [prop.localidad, prop.partido].filter(Boolean).join(", ");
  const amb = prop.cantidadAmbientes;
  const beds = prop.cantidadDormitorios;
  const baths = prop.cantidadBanos;
  const sqft = prop.metrosCuadradosCubierto ?? prop.metrosCuadradosTotales;
  const titulo =
    prop.tituloPublico?.trim() ||
    `${prop.tipo || "Propiedad"} en ${tipoOperacionLabel(prop.tipoOperacion).toLowerCase()}`;
  const precioLabel =
    prop.mostrarPrecio && prop.precio != null ? formatPrecio(prop.precio, prop.moneda) : "Consultar";

  const specs: { icon: string; label: string }[] = [];
  if (amb != null) specs.push({ icon: "meeting_room", label: `${amb} amb.` });
  if (beds != null) specs.push({ icon: "bed", label: `${beds} Dorm.` });
  if (baths != null) specs.push({ icon: "bathtub", label: `${baths} Baños` });
  if (sqft != null) specs.push({ icon: "square_foot", label: `${Math.round(sqft)} m²` });
  if (prop.cochera === true) specs.push({ icon: "garage", label: "Cochera" });

  return (
    <article className="group relative h-full rounded-xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <Link
        href={`/propiedad/${prop.slug}`}
        className="flex flex-col h-full cursor-pointer"
        aria-label={`${titulo} · ${precioLabel}`}
      >
        <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-surface-container-high">
          {prop.imagenPrincipalUrl ? (
            <Image
              src={prop.imagenPrincipalUrl}
              alt={titulo}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">home</span>
            </div>
          )}
          <span
            className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-md ${
              prop.destacada ? "bg-primary/90" : "bg-tertiary-container"
            }`}
          >
            {prop.destacada ? "Destacada" : tipoOperacionLabel(prop.tipoOperacion)}
          </span>
        </div>

        <div className="p-3.5 flex flex-col flex-1 min-h-0 font-body">
          <p className="text-base font-black text-primary leading-none mb-1.5 tabular-nums">
            {precioLabel}
          </p>
          <h2 className="text-sm font-headline font-extrabold text-on-surface tracking-tight line-clamp-2 leading-snug min-h-[2.5rem]">
            {titulo}
          </h2>
          <p className="mt-1.5 text-xs text-on-surface-variant flex items-center gap-1 min-w-0">
            <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
            <span className="truncate">{ubicacion || "Ubicación a consultar"}</span>
          </p>

          {specs.length > 0 && (
            <div className="mt-auto pt-2.5 border-t border-outline-variant/20 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold text-on-surface">
              {specs.map((s) => (
                <span key={s.label} className="inline-flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">
                    {s.icon}
                  </span>
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      <FavoriteButton
        prop={prop}
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full border border-zinc-900/15 shadow-sm hover:bg-white cursor-pointer"
      />
    </article>
  );
}
