"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bath, BedDouble, Clock3, Map, MapPin, Ruler } from "lucide-react";
import type { PropiedadLista } from "@/lib/api";
import { fetchPropiedadBySlug } from "@/lib/api";
import { formatPrecio, tipoOperacionLabel } from "@/lib/utils";
import FavoriteButton from "@/components/FavoriteButton";

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

function RecentCard({ prop }: { prop: PropiedadLista }) {
  const titulo = prop.tituloPublico?.trim() || [prop.tipo, prop.localidad].filter(Boolean).join(" en ");
  const zona = [prop.localidad, prop.partido].filter(Boolean).join(", ");
  const precio = prop.mostrarPrecio && prop.precio != null ? formatPrecio(prop.precio, prop.moneda) : "Consultar";
  const metros = prop.metrosCuadradosCubierto ?? prop.metrosCuadradosTotales;
  const href = `/propiedad/${prop.slug}`;

  return (
    <article className="flex min-h-[124px] w-full min-w-0 max-w-full overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_rgba(25,21,43,0.06)] lg:min-h-0 lg:flex-col">
      <div className="relative w-[36%] shrink-0 bg-[#F0E9FF] lg:aspect-[16/10] lg:w-full">
        <Link href={href} className="absolute inset-0">
          {prop.imagenPrincipalUrl ? (
            <Image src={prop.imagenPrincipalUrl} alt={titulo || "Propiedad"} fill className="object-cover" sizes="(min-width: 1024px) 30vw, 38vw" loading="lazy" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs font-semibold text-[#737088]">Sin imagen</span>
          )}
        </Link>
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${prop.tipoOperacion === "VENTA" ? "bg-[#6937DD]" : "bg-sky-600"}`}>
          {tipoOperacionLabel(prop.tipoOperacion)}
        </span>
        <FavoriteButton prop={prop} className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-white/90" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-2.5 lg:p-3">
        <Link href={href} className="min-w-0">
          <p className="truncate text-base font-black text-[#19152B]">{precio}</p>
          <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-[#19152B]">{titulo}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#737088]">
            <MapPin size={13} className="shrink-0 text-[#6937DD]" />
            <span className="truncate">{zona || "Ubicación a consultar"}</span>
          </p>
          <p className="mt-1 flex flex-wrap gap-x-2 text-[11px] font-semibold text-[#4E2BA5]">
            {metros != null && <span className="inline-flex items-center gap-0.5"><Ruler size={12} /> {Math.round(metros)} m²</span>}
            {prop.cantidadDormitorios != null && <span className="inline-flex items-center gap-0.5"><BedDouble size={12} /> {prop.cantidadDormitorios}</span>}
            {prop.cantidadBanos != null && <span className="inline-flex items-center gap-0.5"><Bath size={12} /> {prop.cantidadBanos}</span>}
          </p>
        </Link>
        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2">
          <button type="button" onClick={() => void abrirWhatsapp(prop)} className="flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg bg-[#00C763] px-1 text-[10px] font-bold text-white sm:text-[11px]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l6-1.6A11 11 0 0 0 20.5 3.5Zm-8.5 17a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-3.6.9.9-3.5-.2-.3A9.1 9.1 0 1 1 12 20.5Zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.5 4 15 15 0 0 0 1.5.6 3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z" />
            </svg>
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("portal-ver-en-mapa", { detail: prop }))}
            className="flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg bg-[#6937DD] px-1 text-[10px] font-bold text-white sm:text-[11px]"
          >
            <Map size={13} />
            Ver en mapa
          </button>
        </div>
      </div>
    </article>
  );
}

export default function RecentProperties({ propiedades }: { propiedades: PropiedadLista[] }) {
  if (propiedades.length === 0) return null;

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#19152B] lg:text-2xl">
            <Clock3 size={22} className="text-[#6937DD]" />
            Publicaciones recientes
          </h2>
          <p className="mt-1 text-sm text-[#737088]">Últimas propiedades publicadas en el portal</p>
        </div>
        <Link href="/propiedades" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#6937DD]">
          Ver todas
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {propiedades.map((prop) => (
          <RecentCard key={prop.id} prop={prop} />
        ))}
      </div>
    </section>
  );
}
