import { Metadata } from "next";
import { fetchInmobiliarias } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Inmobiliarias - Tuinmo",
  description:
    "Conocé las inmobiliarias que publican propiedades en Tuinmo. Encontrá la inmobiliaria ideal para tu próxima operación.",
};

export default async function InmobiliariasPage() {
  const inmobiliarias = await fetchInmobiliarias().catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-24 md:pb-20">
      <div className="mb-10 md:mb-14">
        <h1 className="font-headline font-extrabold text-3xl sm:text-4xl text-on-surface tracking-tight mb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl sm:text-4xl">
            business
          </span>
          Inmobiliarias
        </h1>
        <p className="text-on-surface-variant font-body">
          {inmobiliarias.length} inmobiliaria{inmobiliarias.length !== 1 ? "s" : ""} publicando en Tuinmo
        </p>
      </div>

      {inmobiliarias.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {inmobiliarias.map((inmo) => {
            const ubicacion = [inmo.localidad, inmo.partido, inmo.provincia]
              .filter(Boolean)
              .join(", ");

            return (
              <Link
                key={inmo.id}
                href={`/propiedades?usuarioId=${inmo.id}&inmobiliariaNombre=${encodeURIComponent(inmo.nombreNegocio)}`}
                className="group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-outline-variant/10 hover:border-primary/20"
              >
                <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-container-high flex items-center justify-center shrink-0 ring-2 ring-outline-variant/10 group-hover:ring-primary/30 transition-all">
                    {inmo.logoUrl ? (
                      <Image
                        src={inmo.logoUrl}
                        alt={inmo.nombreNegocio}
                        width={80}
                        height={80}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                        business
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="font-headline font-bold text-lg text-on-surface group-hover:text-primary transition-colors">
                      {inmo.nombreNegocio}
                    </h2>
                    {ubicacion && (
                      <p className="text-sm text-on-surface-variant mt-1 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        {ubicacion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-outline-variant/10 px-6 sm:px-8 py-4 flex items-center justify-between bg-surface-container-low/50">
                  <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1 font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-primary text-base">home</span>
                      {inmo.cantidadPropiedades} propiedad{inmo.cantidadPropiedades !== 1 ? "es" : ""}
                    </span>
                    {inmo.matricula && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">verified</span>
                        Mat. {inmo.matricula}
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-primary text-xl group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 rounded-lg bg-surface-container-low border border-outline-variant/20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">
            store
          </span>
          <h3 className="text-lg font-headline font-semibold text-on-surface mb-1">
            No hay inmobiliarias publicando
          </h3>
          <p className="text-sm text-on-surface-variant font-body mb-6">
            Pronto se sumarán inmobiliarias al portal
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-white px-6 py-2 rounded-full text-sm font-bold"
          >
            Volver al inicio
          </Link>
        </div>
      )}
    </div>
  );
}
