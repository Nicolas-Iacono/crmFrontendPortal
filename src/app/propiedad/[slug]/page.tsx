import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchPropiedadBySlug, fetchRelacionadas } from "@/lib/api";
import { getPortalBaseUrl } from "@/lib/site";
import { formatPrecio, tipoOperacionLabel } from "@/lib/utils";
import PhotoGallery from "@/components/PhotoGallery";
import ContactForm from "@/components/ContactForm";
import PropertyCard from "@/components/PropertyCard";
import PropertyMapLoader from "@/components/PropertyMapLoader";
import FavoriteButton from "@/components/FavoriteButton";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const prop = await fetchPropiedadBySlug(slug);
    const titulo = prop.tituloPublico || `Propiedad en ${prop.localidad}`;
    const descripcion =
      prop.descripcionPublica?.slice(0, 160) ||
      `${prop.tipo} en ${tipoOperacionLabel(prop.tipoOperacion).toLowerCase()} en ${prop.localidad}, ${prop.partido}`;

    return {
      title: titulo,
      description: descripcion,
      openGraph: {
        title: titulo,
        description: descripcion,
        images: prop.imagenesUrls.length > 0 ? [prop.imagenesUrls[0]] : [],
        type: "article",
      },
    };
  } catch {
    return { title: "Propiedad no encontrada" };
  }
}

export default async function PropiedadDetallePage({ params }: Props) {
  const { slug } = await params;
  let prop;
  try {
    prop = await fetchPropiedadBySlug(slug);
  } catch {
    notFound();
  }

  const relacionadas = await fetchRelacionadas(prop.id, 3).catch(() => []);

  const amenities = [
    { key: "pileta", label: "Pileta", icon: "pool", val: prop.pileta },
    { key: "cochera", label: "Cochera", icon: "garage", val: prop.cochera },
    { key: "jardin", label: "Jardín", icon: "yard", val: prop.jardin },
    { key: "patio", label: "Patio", icon: "deck", val: prop.patio },
    { key: "balcon", label: "Balcón", icon: "balcony", val: prop.balcon },
    { key: "quincho", label: "Quincho", icon: "outdoor_grill", val: prop.quincho },
    { key: "laundry", label: "Lavadero", icon: "local_laundry_service", val: prop.laundry },
    { key: "sum", label: "SUM", icon: "groups", val: prop.sum },
    { key: "seguridad", label: "Seguridad", icon: "security", val: prop.seguridad },
    { key: "gimnasio", label: "Gimnasio", icon: "fitness_center", val: prop.gimnasio },
    { key: "ascensor", label: "Ascensor", icon: "elevator", val: prop.ascensor },
    { key: "terraza", label: "Terraza", icon: "roofing", val: prop.terraza },
    { key: "aptoProfesional", label: "Apto profesional", icon: "work", val: prop.aptoProfesional },
    { key: "aceptaMascotas", label: "Acepta mascotas", icon: "pets", val: prop.aceptaMascotas },
  ].filter((a) => a.val);

  const ubicacion = [prop.localidad, prop.partido, prop.provincia].filter(Boolean).join(", ");
  const zonaParaMapa = ubicacion ? `${ubicacion}, Argentina` : "Argentina";
  const direccionCompleta =
    prop.mostrarDireccionExacta && prop.direccion
      ? `${prop.direccion}, ${ubicacion}`
      : ubicacion;

  const stats = [
    { label: "Ambientes", value: prop.cantidadAmbientes, icon: "meeting_room" },
    { label: "Dormitorios", value: prop.cantidadDormitorios, icon: "bed" },
    { label: "Baños", value: prop.cantidadBanos, icon: "bathtub" },
    { label: "m² cub.", value: prop.metrosCuadradosCubierto ? Math.round(prop.metrosCuadradosCubierto) : null, icon: "square_foot" },
    { label: "m² tot.", value: prop.metrosCuadradosTotales ? Math.round(prop.metrosCuadradosTotales) : null, icon: "crop_free" },
  ].filter((s) => s.value != null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: prop.tituloPublico,
    description: prop.descripcionPublica,
    url: `${getPortalBaseUrl()}/propiedad/${prop.slug}`,
    image: prop.imagenesUrls,
    offers: prop.precio
      ? { "@type": "Offer", price: prop.precio, priceCurrency: prop.moneda }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-20">
        {/* Bento Grid Gallery */}
        <PhotoGallery images={prop.imagenesUrls} />

        {/* Two-column Layout */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Content Area */}
          <div className="flex-1 space-y-12">
            {/* Header Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                  {tipoOperacionLabel(prop.tipoOperacion)}
                </span>
                {prop.tipo && (
                  <>
                    <span className="text-outline-variant">•</span>
                    <span className="text-on-surface-variant font-medium text-sm">{prop.tipo}</span>
                  </>
                )}
                {prop.fechaPublicacion && (
                  <>
                    <span className="text-outline-variant">•</span>
                    <span className="text-on-surface-variant font-medium text-sm">
                      Publicada {new Date(prop.fechaPublicacion).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-extrabold text-on-surface tracking-tight">
                {prop.tituloPublico}
              </h1>

              <p className="text-lg text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                {direccionCompleta}
              </p>

              {/* Quick Stats Chips */}
              {stats.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-4">
                  {stats.map((s) => (
                    <div key={s.label} className="bg-surface-container-low px-6 py-4 rounded-xl flex flex-col">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{s.label}</span>
                      <span className="text-xl font-headline font-bold">{s.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {prop.descripcionPublica && (
              <div className="space-y-6">
                <h2 className="text-2xl font-headline font-bold border-l-4 border-primary pl-4">
                  Acerca de esta propiedad
                </h2>
                <div className="text-on-surface-variant leading-relaxed text-lg whitespace-pre-line">
                  {prop.descripcionPublica}
                </div>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-headline font-bold border-l-4 border-primary pl-4">
                  Comodidades
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities.map((a) => (
                    <div
                      key={a.key}
                      className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10"
                    >
                      <span className="material-symbols-outlined text-primary scale-110">{a.icon}</span>
                      <span className="font-medium">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location — Google Maps embebido */}
            <div className="space-y-6">
              <h2 className="text-2xl font-headline font-bold border-l-4 border-primary pl-4">
                Ubicación
              </h2>
              <PropertyMapLoader
                query={
                  prop.direccion
                    ? `${prop.direccion}, ${ubicacion || ""}, Argentina`.replace(/,\s*,/g, ",").replace(/,\s*$/, "")
                    : zonaParaMapa
                }
                ubicacionLabel={direccionCompleta || "Zona no indicada"}
              />
            </div>
          </div>

          {/* Sticky Sidebar */}
          <aside className="w-full lg:w-[400px]">
            <div className="sticky top-28 space-y-6">
              {/* Pricing Card */}
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-2xl shadow-on-surface/5 border border-outline-variant/20">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-sm font-bold text-primary-container uppercase tracking-widest">
                      Precio
                    </span>
                    <div className="text-3xl md:text-4xl font-headline font-black text-on-surface">
                      {prop.mostrarPrecio && prop.precio != null
                        ? formatPrecio(prop.precio, prop.moneda)
                        : "Consultar"}
                    </div>
                  </div>
                  <FavoriteButton
                    prop={{
                      id: prop.id,
                      slug: prop.slug,
                      tituloPublico: prop.tituloPublico,
                      tipo: prop.tipo,
                      tipoOperacion: prop.tipoOperacion,
                      precio: prop.precio,
                      moneda: prop.moneda,
                      mostrarPrecio: prop.mostrarPrecio,
                      localidad: prop.localidad,
                      partido: prop.partido,
                      provincia: prop.provincia,
                      cantidadAmbientes: prop.cantidadAmbientes,
                      cantidadDormitorios: prop.cantidadDormitorios,
                      cantidadBanos: prop.cantidadBanos,
                      metrosCuadradosCubierto: prop.metrosCuadradosCubierto,
                      metrosCuadradosTotales: prop.metrosCuadradosTotales,
                      cochera: prop.cochera,
                      imagenPrincipalUrl: prop.imagenesUrls?.[0] ?? null,
                      nombreInmobiliaria: prop.nombreInmobiliaria,
                      logoInmobiliaria: prop.logoInmobiliaria,
                    }}
                    className="w-10 h-10 rounded-full border-2 border-outline-variant/30 hover:bg-surface-container-high"
                  />
                </div>

                {/* Contact Form */}
                <ContactForm
                  propiedadId={prop.id}
                  whatsapp={prop.whatsappContacto}
                  slug={prop.slug}
                  tituloPublico={prop.tituloPublico}
                />

                {/* Agent / Inmobiliaria info */}
                {prop.nombreInmobiliaria && (
                  <div className="mt-6 flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                    {prop.logoInmobiliaria ? (
                      <Image
                        src={prop.logoInmobiliaria}
                        alt={prop.nombreInmobiliaria}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl text-primary">business</span>
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-sm">{prop.nombreInmobiliaria}</div>
                      <div className="text-xs text-on-surface-variant">Inmobiliaria</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Views mini card */}
              {prop.cantidadVistas > 0 && (
                <div className="bg-primary-container text-on-primary-container p-6 rounded-2xl overflow-hidden relative group">
                  <div className="relative z-10">
                    <h4 className="font-bold text-lg mb-2">Interés en esta propiedad</h4>
                    <p className="text-sm opacity-90 mb-1">
                      Esta propiedad fue vista {prop.cantidadVistas} {prop.cantidadVistas === 1 ? "vez" : "veces"}.
                    </p>
                  </div>
                  <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-white/10 text-[120px]">
                    trending_up
                  </span>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Similar Properties */}
        {relacionadas.length > 0 && (
          <section className="mt-24 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-black text-on-surface">
                  Propiedades similares
                </h2>
                <p className="text-on-surface-variant">
                  Otras opciones en la misma zona que podrían interesarte.
                </p>
              </div>
              <Link
                href="/propiedades"
                className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all"
              >
                Ver más propiedades
                <span className="material-symbols-outlined">east</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relacionadas.map((p) => (
                <PropertyCard key={p.id} prop={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
