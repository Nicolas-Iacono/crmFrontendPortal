"use client";

import { useRouter } from "next/navigation";
import { Building, Building2, House, Map, Store } from "lucide-react";
import { getListingPathForQueryString } from "@/lib/listingHref";

const CATEGORIAS = [
  { nombre: "Deptos", tipo: "Departamento", Icono: Building2 },
  { nombre: "Casas", tipo: "Casa", Icono: House },
  { nombre: "Lotes", tipo: "Lote", Icono: Map },
  { nombre: "Locales", tipo: "Local", Icono: Store },
  { nombre: "Oficinas", tipo: "Oficina", Icono: Building },
];

export default function PropertyCategories() {
  const router = useRouter();

  return (
    <div className="mx-auto mt-8 flex w-full min-w-0 max-w-7xl justify-around px-2 pb-1 lg:mt-14 lg:grid lg:grid-cols-5 lg:justify-items-center lg:gap-6 lg:px-10">
      {CATEGORIAS.map(({ nombre, tipo, Icono }) => (
        <button
          key={nombre}
          type="button"
          onClick={() => router.push(getListingPathForQueryString({ tipo, operacion: "VENTA" }))}
          className="flex min-w-0 flex-col items-center gap-2 text-[#19152B] lg:w-full"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#F0E9FF] text-[#6937DD] transition-colors hover:bg-[#E4D8FF] sm:h-16 sm:w-16 sm:rounded-[22px] lg:h-16 lg:w-20">
            <Icono size={28} strokeWidth={1.6} />
          </span>
          <span className="text-center text-[13px] font-medium leading-tight">{nombre}</span>
        </button>
      ))}
    </div>
  );
}
