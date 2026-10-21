"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUpDown, Bath, BedDouble, Car, ChevronDown, DoorOpen, Heart, Map, Ruler, X } from "lucide-react";
import type { PropiedadLista } from "@/lib/api";
import { fetchPropiedadBySlug } from "@/lib/api";
import { formatPrecio, tipoOperacionLabel } from "@/lib/utils";
import FavoriteButton from "@/components/FavoriteButton";
import { useFavorites } from "@/lib/useFavorites";

const ListingsLeafletMap = dynamic(() => import("./ListingsLeafletMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-[#737088]">Cargando mapa…</div>,
});

type OperacionFiltro = "TODAS" | "VENTA" | "ALQUILER";
type Orden = "recientes" | "precio-asc" | "precio-desc";

const ORDENES: { id: Orden; label: string }[] = [
  { id: "recientes", label: "Más recientes" },
  { id: "precio-asc", label: "Menor precio" },
  { id: "precio-desc", label: "Mayor precio" },
];

type Extra = { imagenes: string[]; fecha: string | null };

function numeroWhatsapp(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  if (digits.startsWith("54")) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  const conQuince = digits.match(/^(\d{2,4})15(\d{6,8})$/);
  if (conQuince && `${conQuince[1]}${conQuince[2]}`.length === 10) digits = `${conQuince[1]}${conQuince[2]}`;
  if (digits.length === 10) digits = `9${digits}`;
  if (digits.length < 10) return "";
  return `54${digits}`;
}

async function abrirWhatsapp(prop: PropiedadLista) {
  let digits = numeroWhatsapp(prop.whatsappInmobiliaria);
  if (!digits) {
    try {
      const detalle = await fetchPropiedadBySlug(prop.slug);
      digits = numeroWhatsapp(detalle.whatsappContacto || detalle.telefonoContacto);
    } catch {
      window.alert("No se pudo abrir WhatsApp.");
      return;
    }
  }
  if (!digits) {
    window.alert("Esta inmobiliaria no tiene un WhatsApp cargado.");
    return;
  }
  const titulo = prop.tituloPublico?.trim() || "esta propiedad";
  const text = `Hola, me interesa esta propiedad: ${titulo}\n${window.location.origin}/propiedad/${prop.slug}`;
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  const opened = window.open(url, "_blank");
  if (opened) opened.opener = null;
  else window.location.href = url;
}

function Fotos({ urls, href, alt, mostrarConteo }: { urls: string[]; href: string; alt: string; mostrarConteo: boolean }) {
  const [indice, setIndice] = useState(0);
  const origen = useRef<number | null>(null);
  const movio = useRef(false);
  const total = urls.length;
  const actual = total > 0 ? urls[Math.min(indice, total - 1)] : null;

  return (
    <div
      className="relative aspect-[16/10] touch-pan-y bg-[#F0E9FF]"
      onPointerDown={(e) => {
        origen.current = e.clientX;
        movio.current = false;
      }}
      onPointerMove={(e) => {
        if (origen.current != null && Math.abs(e.clientX - origen.current) > 8) movio.current = true;
      }}
      onPointerUp={(e) => {
        if (origen.current == null) return;
        const dx = e.clientX - origen.current;
        origen.current = null;
        if (Math.abs(dx) > 40 && total > 1) {
          setIndice((n) => {
            const base = Math.min(n, total - 1);
            return dx < 0 ? Math.min(base + 1, total - 1) : Math.max(base - 1, 0);
          });
          return;
        }
        if (!movio.current) window.location.assign(href);
      }}
    >
      {actual ? (
        <Image src={actual} alt={alt} fill className="pointer-events-none object-cover" sizes="(min-width: 1024px) 30vw, 100vw" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[#737088]">Sin imagen</span>
      )}
      {mostrarConteo && total > 0 && (
        <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white">
          {Math.min(indice, total - 1) + 1}/{total}
        </span>
      )}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F3EEFF] px-2.5 py-1 text-[12px] font-semibold text-[#4E2BA5]">
      {children}
    </span>
  );
}

function FavoriteCard({ prop, extra }: { prop: PropiedadLista; extra?: Extra }) {
  const titulo = prop.tituloPublico?.trim() || [prop.tipo, prop.localidad].filter(Boolean).join(" en ");
  const lugar = [prop.localidad?.toUpperCase(), prop.partido].filter(Boolean).join(", ");
  const precio = prop.mostrarPrecio && prop.precio != null ? formatPrecio(prop.precio, prop.moneda) : "Consultar";
  const metros = prop.metrosCuadradosCubierto ?? prop.metrosCuadradosTotales;
  const href = `/propiedad/${prop.slug}`;
  const urls = extra?.imagenes?.length ? extra.imagenes : prop.imagenPrincipalUrl ? [prop.imagenPrincipalUrl] : [];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_10px_28px_rgba(25,21,43,0.08)]">
      <div className="relative">
        <Fotos urls={urls} href={href} alt={titulo || "Propiedad"} mostrarConteo={Boolean(extra)} />
        <span className={`pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${prop.tipoOperacion === "VENTA" ? "bg-[#6937DD]" : "bg-sky-600"}`}>
          {tipoOperacionLabel(prop.tipoOperacion)}
        </span>
        <FavoriteButton prop={prop} className="absolute right-3 top-3 z-10 h-9 w-9 rounded-lg bg-white shadow-sm" />
      </div>
      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <Link href={href} className="min-w-0">
          <p className="text-[1.65rem] font-black leading-none tracking-tight text-[#19152B]">{precio}</p>
          <h2 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug text-[#19152B]">{titulo}</h2>
          {lugar && <p className="mt-1 truncate text-[12px] font-medium text-[#8A869C]">{lugar}</p>}
        </Link>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {metros != null && (
            <Chip><Ruler size={13} /> {Math.round(metros)} m²</Chip>
          )}
          {prop.cantidadAmbientes != null && (
            <Chip><DoorOpen size={13} /> {prop.cantidadAmbientes} amb.</Chip>
          )}
          {prop.cantidadDormitorios != null && (
            <Chip><BedDouble size={13} /> {prop.cantidadDormitorios} dorm.</Chip>
          )}
          {prop.cantidadBanos != null && (
            <Chip><Bath size={13} /> {prop.cantidadBanos} baño{prop.cantidadBanos === 1 ? "" : "s"}</Chip>
          )}
          {prop.cochera && (
            <Chip><Car size={13} /> Cochera</Chip>
          )}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3.5">
          <button type="button" onClick={() => void abrirWhatsapp(prop)} className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#00C763] text-sm font-bold text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l6-1.6A11 11 0 0 0 20.5 3.5Zm-8.5 17a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-3.6.9.9-3.5-.2-.3A9.1 9.1 0 1 1 12 20.5Zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.5 4 15 15 0 0 0 1.5.6 3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z" />
            </svg>
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("portal-ver-en-mapa", { detail: prop }))}
            className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#6937DD] text-sm font-bold text-white"
          >
            <Map size={16} />
            Ver en mapa
          </button>
        </div>
      </div>
    </article>
  );
}

function MapaFavoritas({
  propiedades,
  seleccionada,
  locateTick,
  onSelect,
  onClose,
}: {
  propiedades: PropiedadLista[];
  seleccionada: number;
  locateTick: number;
  onSelect: (id: number) => void;
  onClose: () => void;
}) {
  const prop = propiedades.find((item) => item.id === seleccionada) ?? propiedades[0];
  const titulo = prop?.tituloPublico?.trim() || [prop?.tipo, prop?.localidad].filter(Boolean).join(" en ");
  const precio = prop && prop.mostrarPrecio && prop.precio != null ? formatPrecio(prop.precio, prop.moneda) : "Consultar";

  return (
    <div className="fixed inset-0 z-[60] bg-[#ece8f4]">
      <ListingsLeafletMap
        properties={propiedades}
        selectedId={seleccionada}
        onMarkerSelect={onSelect}
        locateTick={locateTick}
        fill
        showDrawButton={false}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar mapa"
        className="absolute left-3 z-[700] flex h-11 w-11 items-center justify-center rounded-full border border-[#E6E0F5] bg-white text-[#19152B] shadow-lg"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <X size={20} />
      </button>
      {prop && (
        <Link
          href={`/propiedad/${prop.slug}`}
          className="absolute inset-x-4 z-[700] flex items-center gap-3 rounded-2xl bg-white p-3 shadow-lg"
          style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-black text-[#19152B]">{precio}</span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-[#19152B]">{titulo}</span>
          </span>
          <span className="shrink-0 rounded-full bg-[#6937DD] px-3 py-2 text-xs font-bold text-white">Ver</span>
        </Link>
      )}
    </div>
  );
}

export default function FavoritesSection() {
  const { favorites } = useFavorites();
  const [foco, setFoco] = useState<PropiedadLista | null>(null);
  const [locateTick, setLocateTick] = useState(0);
  const [operacion, setOperacion] = useState<OperacionFiltro>("TODAS");
  const [orden, setOrden] = useState<Orden>("recientes");
  const [ordenAbierta, setOrdenAbierta] = useState(false);
  const [extras, setExtras] = useState<Record<number, Extra>>({});
  const pedidos = useRef(new Set<number>());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ver = (event: Event) => {
      const prop = (event as CustomEvent<PropiedadLista>).detail;
      if (!prop?.id) return;
      setFoco(prop);
      setLocateTick((n) => n + 1);
    };
    window.addEventListener("portal-ver-en-mapa", ver);
    return () => window.removeEventListener("portal-ver-en-mapa", ver);
  }, []);

  useEffect(() => {
    if (!foco) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [foco]);

  const propsMapa = useMemo(() => {
    if (!foco) return favorites;
    if (favorites.some((item) => item.id === foco.id)) return favorites;
    return [foco, ...favorites];
  }, [favorites, foco]);

  useEffect(() => {
    let vivo = true;
    for (const fav of favorites) {
      if (pedidos.current.has(fav.id)) continue;
      pedidos.current.add(fav.id);
      fetchPropiedadBySlug(fav.slug)
        .then((detalle) => {
          if (!vivo) return;
          const imagenes = (detalle.imagenesUrls ?? []).filter(Boolean);
          setExtras((prev) => ({
            ...prev,
            [fav.id]: {
              imagenes: imagenes.length > 0 ? imagenes : fav.imagenPrincipalUrl ? [fav.imagenPrincipalUrl] : [],
              fecha: detalle.fechaPublicacion || null,
            },
          }));
        })
        .catch(() => {
          if (!vivo) return;
          setExtras((prev) => ({
            ...prev,
            [fav.id]: { imagenes: fav.imagenPrincipalUrl ? [fav.imagenPrincipalUrl] : [], fecha: null },
          }));
        });
    }
    return () => {
      vivo = false;
    };
  }, [favorites]);

  useEffect(() => {
    if (!ordenAbierta) return;
    const cerrar = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOrdenAbierta(false);
    };
    window.addEventListener("pointerdown", cerrar);
    return () => window.removeEventListener("pointerdown", cerrar);
  }, [ordenAbierta]);

  const visibles = useMemo(() => {
    const filtradas = favorites.filter((prop) => operacion === "TODAS" || prop.tipoOperacion === operacion);
    const copia = [...filtradas];
    copia.sort((a, b) => {
      if (orden === "precio-asc" || orden === "precio-desc") {
        const pa = a.mostrarPrecio && a.precio != null ? a.precio : null;
        const pb = b.mostrarPrecio && b.precio != null ? b.precio : null;
        if (pa == null && pb == null) return 0;
        if (pa == null) return 1;
        if (pb == null) return -1;
        return orden === "precio-asc" ? pa - pb : pb - pa;
      }
      const fa = extras[a.id]?.fecha;
      const fb = extras[b.id]?.fecha;
      if (fa && fb && fa !== fb) return fb.localeCompare(fa);
      if (fa && !fb) return -1;
      if (!fa && fb) return 1;
      return b.id - a.id;
    });
    return copia;
  }, [favorites, operacion, orden, extras]);

  const resumen =
    favorites.length === 0
      ? "Todavía no guardaste propiedades."
      : favorites.length === 1
        ? "1 propiedad guardada"
        : `${favorites.length} propiedades guardadas`;
  const ordenLabel = ORDENES.find((item) => item.id === orden)?.label ?? "Más recientes";

  return (
    <div className="bg-[#FBF8FF]">
      <section className="relative -mt-10 overflow-hidden rounded-b-[30px] bg-[#4E2BA5] bg-[url('/ondaAbstractas.png')] bg-cover bg-center bg-no-repeat px-5 pb-7 pt-[4.75rem] lg:mt-0 lg:flex lg:min-h-[240px] lg:items-center lg:rounded-b-[28px] lg:bg-[length:100%_auto] lg:bg-bottom lg:px-8 lg:py-8">
        <div className="relative mx-auto flex max-w-7xl items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-white/15 text-white">
            <Heart size={22} className="fill-white" />
          </span>
          <div>
            <h1 className="text-[30px] font-extrabold leading-none text-white min-[390px]:text-[33px]">Favoritas</h1>
            <p className="mt-1.5 text-sm text-white/80">{resumen}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-8">
        {favorites.length === 0 ? (
          <div className="mx-auto mt-2 max-w-md rounded-[22px] bg-white px-6 py-10 text-center shadow-[0_10px_28px_rgba(25,21,43,0.06)]">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#F0E9FF] text-[#6937DD]">
              <Heart size={26} />
            </span>
            <p className="mt-4 text-lg font-extrabold text-[#19152B]">Todavía no hay guardadas</p>
            <p className="mt-1 text-sm text-[#737088]">Tocá el corazón de una publicación para verla acá.</p>
            <Link href="/propiedades" className="mt-5 inline-flex h-11 items-center rounded-full bg-[#6937DD] px-5 text-sm font-bold text-white">
              Explorar propiedades
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-1.5">
              {(["TODAS", "VENTA", "ALQUILER"] as const).map((op) => {
                const activa = operacion === op;
                const label = op === "TODAS" ? "Todas" : op === "VENTA" ? "Venta" : "Alquiler";
                return (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperacion(op)}
                    className={`h-8 shrink-0 rounded-full px-3 text-[13px] font-bold ${activa ? "bg-[#6937DD] text-white" : "bg-white text-[#19152B] shadow-[0_4px_14px_rgba(25,21,43,0.06)]"}`}
                  >
                    {label}
                  </button>
                );
              })}
              <div ref={menuRef} className="relative ml-auto shrink-0">
                <button
                  type="button"
                  aria-expanded={ordenAbierta}
                  onClick={() => setOrdenAbierta((abierta) => !abierta)}
                  className="flex h-8 items-center gap-1 whitespace-nowrap rounded-full bg-white px-2.5 text-[13px] font-bold text-[#19152B] shadow-[0_4px_14px_rgba(25,21,43,0.06)]"
                >
                  <ArrowUpDown size={15} className="text-[#6937DD]" />
                  {ordenLabel}
                  <ChevronDown size={15} className="text-[#737088]" />
                </button>
                {ordenAbierta && (
                  <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-2xl bg-white py-1 shadow-[0_12px_32px_rgba(25,21,43,0.14)]">
                    {ORDENES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setOrden(item.id);
                          setOrdenAbierta(false);
                        }}
                        className={`block w-full px-3.5 py-2.5 text-left text-sm font-semibold ${orden === item.id ? "text-[#6937DD]" : "text-[#19152B]"} hover:bg-[#F3EEFF]`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {visibles.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#737088]">No hay favoritas en esta operación.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibles.map((prop) => (
                  <FavoriteCard key={prop.id} prop={prop} extra={extras[prop.id]} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {foco && (
        <MapaFavoritas
          propiedades={propsMapa}
          seleccionada={foco.id}
          locateTick={locateTick}
          onSelect={(id) => {
            const elegida = propsMapa.find((item) => item.id === id);
            if (elegida) setFoco(elegida);
          }}
          onClose={() => setFoco(null)}
        />
      )}
    </div>
  );
}
