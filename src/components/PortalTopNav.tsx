"use client";

import Image from "next/image";
import Link from "next/link";
import { PORTAL_LOGO_SRC } from "@/lib/portal-logo";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function NavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isListings = pathname?.startsWith("/propiedades");
  const operacion = searchParams.get("operacion");
  const comprarActive = isListings && operacion !== "ALQUILER";
  const alquilarActive = isListings && operacion === "ALQUILER";

  const navLinks = [
    { href: "/propiedades?operacion=VENTA", label: "Comprar" },
    { href: "/propiedades?operacion=ALQUILER", label: "Alquilar" },
    { href: "/inmobiliarias", label: "Inmobiliarias" },
  ];

  const linkClass = (item: (typeof navLinks)[number]) => {
    if (item.href.includes("VENTA") && comprarActive) return "text-white border-b-2 border-white pb-1";
    if (item.href.includes("ALQUILER") && alquilarActive) return "text-white border-b-2 border-white pb-1";
    if (item.href === "/inmobiliarias" && pathname === "/inmobiliarias") return "text-white border-b-2 border-white pb-1";
    return "text-purple-100/80 hover:text-white transition-colors";
  };

  return (
    <nav className="relative sticky top-0 z-50 flex justify-between items-center w-full px-4 sm:px-8 py-5 max-w-full bg-[#532ba8] text-white shadow-2xl shadow-purple-900/20 rounded-b-[40px] mb-6 sm:mb-8 font-headline font-bold tracking-tight">
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

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item)}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="md:hidden p-2 rounded-full bg-white/10"
        aria-label="Menú"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span className="material-symbols-outlined text-white">menu</span>
      </button>

      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-white rounded-2xl shadow-xl p-4 md:hidden flex flex-col gap-2 text-on-surface z-50 font-body">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className="py-2 font-semibold" onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/" className="py-2 font-semibold text-primary" onClick={() => setMobileOpen(false)}>
            Inicio
          </Link>
        </div>
      )}
    </nav>
  );
}

export default function PortalTopNav() {
  return (
    <Suspense fallback={<div className="h-[72px] bg-[#532ba8] rounded-b-[40px] mb-8" />}>
      <NavInner />
    </Suspense>
  );
}
