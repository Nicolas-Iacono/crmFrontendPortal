import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import FavoritesSection from "@/components/FavoritesSection";
import { fetchDestacadas, fetchRecientes } from "@/lib/api";

export default async function HomePage() {
  const [destacadas, recientes] = await Promise.all([
    fetchDestacadas(8).catch(() => []),
    fetchRecientes(8).catch(() => []),
  ]);

  return (
    <>
      <section className="relative bg-primary text-on-primary overflow-hidden rounded-[40px] mb-8 sm:mb-12 mx-2 sm:mx-4 shadow-2xl shadow-purple-900/25">
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center font-body">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-extrabold tracking-tight mb-4">
            Encontrá tu próximo
            <span className="block text-primary-fixed/95">hogar</span>
          </h1>
          <p className="text-lg text-purple-100/90 max-w-2xl mx-auto mb-8">
            Explora propiedades en venta y alquiler de las mejores inmobiliarias.
          </p>
          <SearchBar />
        </div>
      </section>

      <FavoritesSection />

      {destacadas.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">star</span>
                Destacadas
              </h2>
              <p className="text-sm text-on-surface-variant mt-1 font-body">Selección especial del portal</p>
            </div>
            <Link href="/propiedades" className="text-sm text-primary font-bold hover:underline underline-offset-4 flex items-center gap-1">
              Ver todas
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destacadas.map((p) => (
              <PropertyCard key={p.id} prop={p} />
            ))}
          </div>
        </section>
      )}

      {recientes.length > 0 && (
        <section className="bg-surface-container-low/80">
          <div className="max-w-7xl mx-auto px-4 py-10 md:py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Recientes
              </h2>
              <p className="text-sm text-on-surface-variant mt-1 font-body">Últimas publicaciones</p>
              </div>
            <Link href="/propiedades" className="text-sm text-primary font-bold hover:underline underline-offset-4 flex items-center gap-1">
              Ver todas
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recientes.map((p) => (
                <PropertyCard key={p.id} prop={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="bg-primary-container text-on-primary-container rounded-[2rem] px-8 py-12 text-center shadow-xl">
          <h2 className="text-2xl md:text-3xl font-headline font-bold mb-3">Sos inmobiliaria?</h2>
          <p className="text-on-primary-container/85 max-w-xl mx-auto mb-6 text-sm md:text-base font-body">
            Publica en este portal con Tuinmo CRM. Gestion integral de propiedades y clientes.
          </p>
          <a
            href="https://tuinmo.net"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-primary font-bold px-8 py-3 rounded-full hover:shadow-lg transition-shadow font-body"
          >
            Conoce Tuinmo
          </a>
        </div>
      </section>
    </>
  );
}
