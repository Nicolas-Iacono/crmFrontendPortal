"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isExplore = pathname?.startsWith("/propiedades") || pathname?.startsWith("/propiedad");
  const isInmobiliarias = pathname === "/inmobiliarias";

  const item = (href: string, icon: string, label: string, active: boolean, filled?: boolean) => (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 min-w-[56px] ${
        active ? "text-primary" : "text-on-surface-variant"
      }`}
    >
      <span className={`material-symbols-outlined text-[24px] ${filled ? "filled" : ""}`}>{icon}</span>
      <span className="text-[10px] font-bold font-body">{label}</span>
    </Link>
  );

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-bright/95 backdrop-blur-xl border-t border-outline-variant/20 z-50 flex justify-around items-center py-3 pb-safe rounded-t-3xl shadow-2xl font-body">
      {item("/", "home", "Inicio", isHome, isHome)}
      {item("/propiedades", "explore", "Explorar", isExplore, isExplore)}
      {item("/inmobiliarias", "apartment", "Inmobiliarias", isInmobiliarias, isInmobiliarias)}
    </div>
  );
}
