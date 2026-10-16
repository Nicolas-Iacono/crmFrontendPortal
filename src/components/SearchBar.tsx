"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { normalizeListingSearchParams } from "@/lib/listingSearchParams";
import { getListingPathForQueryString } from "@/lib/listingHref";

const TIPOS = [
  { value: "", label: "Tipo" },
  { value: "Casa", label: "Casa" },
  { value: "Departamento", label: "Departamento" },
  { value: "Lote", label: "Lote" },
  { value: "Local", label: "Local" },
  { value: "Oficina", label: "Oficina" },
  { value: "PH", label: "PH" },
];

function TipoMenu({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const label = TIPOS.find((item) => item.value === value)?.label ?? "Tipo";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative sm:w-40">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-left text-sm text-white outline-none"
      >
        <span className="truncate">{label}</span>
        <span className={`material-symbols-outlined text-lg transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%+0.45rem)] z-30 w-full min-w-[12.5rem] overflow-hidden rounded-2xl border border-black/5 bg-white py-1.5 text-on-surface shadow-2xl"
        >
          {TIPOS.map((item) => {
            const selected = item.value === value;
            return (
              <li key={item.label}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold ${
                    selected ? "bg-primary text-white" : "text-neutral-800 hover:bg-[#e9ddff]"
                  }`}
                >
                  {item.label}
                  {selected && <span className="material-symbols-outlined text-[18px]">check</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

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

        <TipoMenu value={tipo} onChange={setTipo} />

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
