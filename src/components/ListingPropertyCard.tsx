"use client";

import Link from "next/link";
import Image from "next/image";
import { PropiedadLista } from "@/lib/api";
import { formatPrecio, tipoOperacionLabel } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";

export default function ListingPropertyCard({ prop }: { prop: PropiedadLista }) {
  const ubicacion = [prop.localidad, prop.partido].filter(Boolean).join(", ");
  const beds = prop.cantidadDormitorios ?? prop.cantidadAmbientes;
  const baths = prop.cantidadBanos;
  const sqft = prop.metrosCuadradosCubierto ?? prop.metrosCuadradosTotales;

  return (
    <div className="group bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
      <Link href={`/propiedad/${prop.slug}`} className="relative h-72 overflow-hidden block">
        {prop.imagenPrincipalUrl ? (
          <Image
            src={prop.imagenPrincipalUrl}
            alt={prop.tituloPublico || ""}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">home</span>
          </div>
        )}

        <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2">
          {prop.destacada ? (
            <span className="bg-primary text-white px-4 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-opacity-90 w-fit">
              Destacada
            </span>
          ) : (
            <span className="bg-tertiary-container text-white px-4 py-1 rounded-full text-xs font-bold backdrop-blur-md w-fit">
              {tipoOperacionLabel(prop.tipoOperacion)}
            </span>
          )}
        </div>

        <FavoriteButton
          prop={prop}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 z-10"
        />
      </Link>

      <div className="p-6 sm:p-8 flex flex-col flex-1 font-body">
        <div className="flex justify-between items-start gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-headline font-extrabold text-on-surface tracking-tight line-clamp-2">
            {prop.tituloPublico}
          </h2>
          <span className="text-xl sm:text-2xl font-black text-primary shrink-0">
            {prop.mostrarPrecio && prop.precio != null ? formatPrecio(prop.precio, prop.moneda) : "Consultar"}
          </span>
        </div>

        <p className="text-on-surface-variant text-sm mb-8 flex items-start gap-2">
          <span className="material-symbols-outlined text-lg shrink-0">location_on</span>
          <span>{ubicacion || "Ubicación a consultar"}</span>
        </p>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
          {beds != null && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim">bed</span>
              <span className="text-sm font-bold text-on-surface">{beds} Dorm.</span>
            </div>
          )}
          {baths != null && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim">bathtub</span>
              <span className="text-sm font-bold text-on-surface">{baths} Baños</span>
            </div>
          )}
          {sqft != null && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim">square_foot</span>
              <span className="text-sm font-bold text-on-surface">{Math.round(sqft)} m²</span>
            </div>
          )}
          {prop.cochera === true && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim">garage</span>
              <span className="text-sm font-bold text-on-surface">Cochera</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex gap-4">
          <Link
            href={`/propiedad/${prop.slug}`}
            className="flex-1 text-center bg-surface-container-high text-primary py-4 rounded-xl font-bold hover:bg-primary hover:text-white transition-all"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}
