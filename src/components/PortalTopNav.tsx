"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Menu, X } from "lucide-react";
import { PORTAL_LOGO_SRC } from "@/lib/portal-logo";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function NavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const enInicio = pathname === "/";
  const heroContinuo = enInicio || pathname === "/favoritas";
  const operacion = searchParams.get("operacion");
  const opFromSeoPath = pathname?.includes("-en-alquiler-")
    ? "ALQUILER"
    : pathname?.includes("-en-venta-")
      ? "VENTA"
      : null;
  const comprarActive =
    opFromSeoPath === "VENTA" ||
    (pathname?.startsWith("/propiedades") && operacion !== "ALQUILER");
  const alquilarActive =
    opFromSeoPath === "ALQUILER" ||
    (pathname?.startsWith("/propiedades") && operacion === "ALQUILER");

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/propiedades?operacion=VENTA", label: "Comprar" },
    { href: "/propiedades?operacion=ALQUILER", label: "Alquilar" },
    { href: "/inmobiliarias", label: "Inmobiliarias" },
    { href: "/favoritas", label: "Favoritos" },
  ];

  const linkClass = (item: (typeof navLinks)[number]) => {
    if (item.href.includes("VENTA") && comprarActive) return "text-white border-b-2 border-white pb-1";
    if (item.href.includes("ALQUILER") && alquilarActive) return "text-white border-b-2 border-white pb-1";
    if (item.href === "/inmobiliarias" && pathname === "/inmobiliarias") return "text-white border-b-2 border-white pb-1";
    if (item.href === "/favoritas" && pathname === "/favoritas") return "text-white border-b-2 border-white pb-1";
    return "text-purple-100/80 hover:text-white transition-colors";
  };

  return (
    <nav className={`relative sticky top-0 z-50 flex h-16 w-full items-center justify-between rounded-br-[28px] bg-[#4E2BA5] px-4 text-white sm:px-8 font-headline lg:rounded-br-none ${heroContinuo ? "shadow-none lg:shadow-lg" : "shadow-lg"}`}>
      <div className="flex items-center gap-6 lg:gap-12 min-w-0">
        <Link
          href="/"
          className="shrink-0 flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-95 transition-opacity"
        >
          <Image
            src={PORTAL_LOGO_SRC}
            alt="Tuino — inicio"
            width={120}
            height={120}
            className="h-9 sm:h-10 w-auto max-h-[2.75rem] sm:max-h-[2.85rem] object-contain object-left"
            priority
          />
          <span className="text-white font-extrabold tracking-[0.18em] text-xs sm:text-sm md:text-base uppercase whitespace-nowrap border-l border-white/35 pl-2 sm:pl-3">
            PORTAL
          </span>
        </Link>

        <div className="hidden items-center gap-6 font-bold lg:flex xl:gap-8">
          {navLinks.filter((item) => item.href !== "/").map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item)}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 lg:hidden">
        <Link href="/favoritas" aria-label="Favoritos" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <Heart size={18} />
        </Link>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
          aria-label={mobileOpen ? "Cerrar menú" : "Menú"}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute top-full left-3 right-3 mt-2 rounded-2xl bg-white p-3 text-[#19152B] shadow-xl lg:hidden font-body">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-3 font-semibold hover:bg-[#F0E9FF]" onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

export default function PortalTopNav() {
  return (
    <Suspense fallback={<div className="h-16 rounded-br-[28px] bg-[#4E2BA5] lg:rounded-br-none" />}>
      <NavInner />
    </Suspense>
  );
}
