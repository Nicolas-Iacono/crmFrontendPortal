"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizeListingSearchParams } from "@/lib/listingSearchParams";
import { getListingPathForQueryString } from "@/lib/listingHref";

export default function SearchBar() {
  const router = useRouter();
  const [operacion, setOperacion] = useState("VENTA");
  const [ubicacion, setUbicacion] = useState("");
  const [tipo, setTipo] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const flat: Record<string, string | undefined> = {
      operacion,
      ...(ubicacion.trim() ? { localidad: ubicacion.trim() } : {}),
      ...(tipo ? { tipo } : {}),
    };
    const normalized = normalizeListingSearchParams(flat);
    router.push(getListingPathForQueryString(normalized));
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto font-body">
      <div className="bg-white/15 backdrop-blur-md rounded-[2rem] border border-white/20 p-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="flex rounded-full bg-white/10 p-1">
          <button
            type="button"
            onClick={() => setOperacion("VENTA")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              operacion === "VENTA" ? "bg-white text-primary shadow-sm" : "text-purple-100"
            }`}
          >
            Venta
          </button>
          <button
            type="button"
            onClick={() => setOperacion("ALQUILER")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              operacion === "ALQUILER" ? "bg-white text-primary shadow-sm" : "text-purple-100"
            }`}
          >
            Alquiler
          </button>
        </div>

        <input
          type="text"
          placeholder="Localidad o zona..."
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          className="flex-1 px-4 py-2.5 text-sm outline-none bg-white/10 rounded-full text-white placeholder:text-purple-200/80 border border-white/10"
        />

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="px-4 py-2.5 text-sm text-white bg-white/10 rounded-full outline-none border border-white/10 sm:max-w-[140px]"
        >
          <option value="" className="text-on-surface">Tipo</option>
          <option value="Casa" className="text-on-surface">Casa</option>
          <option value="Departamento" className="text-on-surface">Departamento</option>
          <option value="Lote" className="text-on-surface">Lote</option>
          <option value="Local" className="text-on-surface">Local</option>
          <option value="Oficina" className="text-on-surface">Oficina</option>
          <option value="PH" className="text-on-surface">PH</option>
        </select>

        <button
          type="submit"
          className="bg-white text-primary px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:shadow-lg flex items-center justify-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-lg">search</span>
          Buscar
        </button>
      </div>
    </form>
  );
}
