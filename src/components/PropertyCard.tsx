import Link from "next/link";
import Image from "next/image";
import { PropiedadLista } from "@/lib/api";
import { formatPrecio, tipoOperacionLabel } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";

export default function PropertyCard({ prop }: { prop: PropiedadLista }) {
  return (
    <div className="group bg-surface-container-lowest rounded-lg border border-outline-variant/30 overflow-hidden hover:shadow-xl transition-all duration-300 font-body relative">
      <Link href={`/propiedad/${prop.slug}`}>
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
          {prop.imagenPrincipalUrl ? (
            <Image
              src={prop.imagenPrincipalUrl}
              alt={prop.tituloPublico || "Propiedad"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl">home</span>
            </div>
          )}

          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              prop.tipoOperacion === "VENTA"
                ? "bg-emerald-500 text-white"
                : "bg-blue-500 text-white"
            }`}>
              {tipoOperacionLabel(prop.tipoOperacion)}
            </span>
          </div>

          {prop.tipo && (
            <div className="absolute top-3 right-3 mr-10">
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/90 text-slate-700">
                {prop.tipo}
              </span>
            </div>
          )}
        </div>

      <div className="p-4">
        <div className="mb-1">
          {prop.mostrarPrecio && prop.precio ? (
            <p className="text-lg font-bold text-primary font-headline">
              {formatPrecio(prop.precio, prop.moneda)}
            </p>
          ) : (
            <p className="text-lg font-bold text-on-surface-variant">Consultar precio</p>
          )}
        </div>

        <h3 className="text-sm font-semibold text-on-surface line-clamp-1 mb-1.5 font-headline">
          {prop.tituloPublico}
        </h3>

        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">location_on</span>
          {[prop.localidad, prop.partido].filter(Boolean).join(", ")}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          {prop.cantidadAmbientes && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary-fixed-dim">meeting_room</span>
              {prop.cantidadAmbientes} amb.
            </span>
          )}
          {prop.cantidadDormitorios && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary-fixed-dim">bed</span>
              {prop.cantidadDormitorios} dorm.
            </span>
          )}
          {prop.metrosCuadradosCubierto && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary-fixed-dim">square_foot</span>
              {prop.metrosCuadradosCubierto} m²
            </span>
          )}
          {prop.cochera && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary-fixed-dim">garage</span>
              Cochera
            </span>
          )}
        </div>

        {prop.nombreInmobiliaria && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
            {prop.logoInmobiliaria ? (
              <Image
                src={prop.logoInmobiliaria}
                alt={prop.nombreInmobiliaria}
                width={20}
                height={20}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] text-primary">business</span>
              </div>
            )}
            <span className="text-xs text-slate-500 truncate">{prop.nombreInmobiliaria}</span>
          </div>
        )}
      </div>
      </Link>
      <FavoriteButton
        prop={prop}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
      />
    </div>
  );
}
