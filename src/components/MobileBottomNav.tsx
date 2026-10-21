"use client";

import Link from "next/link";
import { Heart, House, Map, Search } from "lucide-react";
import type { ReactNode } from "react";
import { isLikelySeoListingPathname } from "@/lib/seoListings";
import { usePathname, useRouter } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isExplore =
    pathname?.startsWith("/propiedades") ||
    pathname?.startsWith("/propiedad") ||
    isLikelySeoListingPathname(pathname);
  const isFavoritas = pathname === "/favoritas";

  const abrirMapa = () => {
    if (pathname === "/" || isExplore) {
      window.dispatchEvent(new Event("portal-abrir-mapa"));
      return;
    }
    router.push("/?mapa=1");
  };

  const item = (href: string, icon: ReactNode, label: string, active: boolean) => (
    <Link href={href} className="flex min-w-[64px] flex-col items-center gap-1 text-[12px] font-semibold">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? "bg-[#F0E9FF] text-[#6937DD]" : "text-[#737088]"}`}>
        {icon}
      </span>
      {label}
    </Link>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 rounded-t-[22px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(25,21,43,0.08)] lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {item("/", <House size={22} />, "Inicio", isHome)}
        {item("/propiedades", <Search size={22} />, "Explorar", Boolean(isExplore))}
        <button type="button" onClick={abrirMapa} className="flex min-w-[64px] flex-col items-center gap-1 text-[12px] font-semibold text-[#737088]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full">
            <Map size={22} />
          </span>
          Mapa
        </button>
        {item("/favoritas", <Heart size={22} />, "Favoritos", isFavoritas)}
      </div>
    </nav>
  );
}
