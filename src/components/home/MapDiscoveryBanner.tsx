"use client";

import { ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function MapDiscoveryBanner() {
  const pathname = usePathname();
  const router = useRouter();

  const abrir = () => {
    if (pathname === "/") {
      window.dispatchEvent(new Event("portal-abrir-mapa"));
      return;
    }
    router.push("/?mapa=1");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div className="relative flex min-h-[190px] overflow-hidden rounded-[20px] bg-[#F0E9FF] lg:min-h-[230px]">
        <div className="relative z-10 flex max-w-[16rem] flex-col justify-center px-5 py-6 sm:max-w-sm lg:max-w-md lg:px-8">
          <h2 className="text-2xl font-extrabold leading-tight text-[#19152B]">Explorá en el mapa</h2>
          <p className="mt-2 text-sm leading-snug text-[#737088]">
            Descubrí propiedades en todo el país. Filtrá por zona, precio y tipo.
          </p>
          <button
            type="button"
            onClick={abrir}
            className="mt-4 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-[#6937DD] px-5 text-sm font-bold text-white"
          >
            Abrir mapa
            <ArrowRight size={16} />
          </button>
        </div>
        <img
          src="/assets/portal/mapa-preview.svg"
          alt=""
          className="absolute inset-y-0 right-0 h-full w-[58%] object-cover object-left sm:w-[52%]"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#F0E9FF] via-[#F0E9FF]/90 to-transparent" />
      </div>
    </section>
  );
}
