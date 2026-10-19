"use client";

import Link from "next/link";
import Image from "next/image";
import type { PropiedadLista } from "@/lib/api";
import { fetchPropiedadBySlug } from "@/lib/api";
import { formatPrecio, tipoOperacionLabel } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";

function numeroWhatsapp(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  if (digits.startsWith("54")) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  const conQuince = digits.match(/^(\d{2,4})15(\d{6,8})$/);
  if (conQuince && `${conQuince[1]}${conQuince[2]}`.length === 10) {
    digits = `${conQuince[1]}${conQuince[2]}`;
  }
  if (digits.length === 10) digits = `9${digits}`;
  if (digits.length < 10) return "";
  return `54${digits}`;
}

function mensajePropiedad(prop: PropiedadLista): string {
  const titulo = prop.tituloPublico?.trim() || "esta propiedad";
  const link = `${window.location.origin}/propiedad/${prop.slug}`;
  return `Hola, me interesa esta propiedad: ${titulo}\n${link}`;
}

export default function HomeListCard({ prop }: { prop: PropiedadLista }) {
  const titulo = prop.tituloPublico?.trim() || [prop.tipo, prop.localidad].filter(Boolean).join(" en ");
  const zona = [prop.localidad, prop.partido].filter(Boolean).join(", ");
  const precio =
    prop.mostrarPrecio && prop.precio != null ? formatPrecio(prop.precio, prop.moneda) : "Consultar";
  const metros = prop.metrosCuadradosCubierto ?? prop.metrosCuadradosTotales;
  const amenities: { icon: string; label: string }[] = [];
  if (prop.cantidadAmbientes != null) amenities.push({ icon: "meeting_room", label: `${prop.cantidadAmbientes} amb.` });
  if (prop.cantidadDormitorios != null) amenities.push({ icon: "bed", label: `${prop.cantidadDormitorios} dorm.` });
  if (prop.cantidadBanos != null) amenities.push({ icon: "bathtub", label: `${prop.cantidadBanos} baño${prop.cantidadBanos === 1 ? "" : "s"}` });
  if (prop.cochera) amenities.push({ icon: "garage", label: "Cochera" });
  const href = `/propiedad/${prop.slug}`;

  const pedirWhatsapp = async () => {
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
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(mensajePropiedad(prop))}`;
    const opened = window.open(url, "_blank");
    if (opened) opened.opener = null;
    else window.location.href = url;
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border-2 border-transparent bg-white font-body shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_24px_-6px_rgba(83,43,168,0.35)]">
      <div className="relative aspect-[16/10] bg-slate-100">
        <Link href={href} className="absolute inset-0">
          {prop.imagenPrincipalUrl ? (
            <Image
              src={prop.imagenPrincipalUrl}
              alt={titulo || "Propiedad"}
              fill
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl">home</span>
            </span>
          )}
        </Link>
        <span
          className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${
            prop.tipoOperacion === "VENTA" ? "bg-primary" : "bg-sky-600"
          }`}
        >
          {tipoOperacionLabel(prop.tipoOperacion)}
        </span>
        <FavoriteButton
          prop={prop}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/40 shadow backdrop-blur-sm"
        />
      </div>

      <div className="flex flex-1 flex-col px-3 pt-3">
        <Link href={href} className="block">
          <p className="text-[1.65rem] font-black leading-none tracking-tight text-neutral-900">{precio}</p>
          <h3 className="mt-2 line-clamp-2 min-h-[2.6em] text-[15px] font-medium leading-snug text-neutral-800">{titulo}</h3>
          <p className="mt-0.5 line-clamp-1 min-h-[1.35em] text-[15px] text-neutral-800">
            {zona && titulo && !titulo.toLowerCase().includes(zona.split(",")[0]?.toLowerCase() || "---") ? zona : "\u00a0"}
          </p>
          <div className="mt-2 flex min-h-[2.75rem] flex-wrap content-start items-center gap-x-3 gap-y-1 text-xs font-semibold text-neutral-700">
              {metros != null && (
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-primary">square_foot</span>
                  {Math.round(metros)} m²
                </span>
              )}
              {amenities.map((item) => (
                <span key={item.icon} className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-primary">{item.icon}</span>
                  {item.label}
                </span>
              ))}
            </div>
        </Link>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 p-3">
        <button
          type="button"
          onClick={() => void pedirWhatsapp()}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#00c853] py-2.5 text-sm font-bold text-white"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("portal-ver-en-mapa", { detail: prop }))}
          className="flex items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-bold text-white"
        >
          Ver en mapa
        </button>
      </div>
    </article>
  );
}
