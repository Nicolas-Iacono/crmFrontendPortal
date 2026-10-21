"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Building2, ChevronDown, LocateFixed, MapPin, Search } from "lucide-react";
import { normalizeListingSearchParams } from "@/lib/listingSearchParams";
import { getListingPathForQueryString } from "@/lib/listingHref";

const TIPOS = [
  { value: "", label: "Tipo de propiedad" },
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
  const label = TIPOS.find((item) => item.value === value)?.label ?? "Tipo de propiedad";

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
    <div ref={rootRef} className="relative min-w-0 lg:w-[220px] lg:shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center gap-2 rounded-2xl bg-[#F4F0FF] px-3 text-left text-sm font-semibold text-[#19152B] lg:h-[52px] lg:rounded-full lg:bg-[#F3EEFF]"
      >
        <Building2 size={18} className="shrink-0 text-[#6937DD]" strokeWidth={1.8} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronDown size={18} className={`shrink-0 text-[#737088] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%+0.4rem)] z-40 w-full min-w-[12.5rem] overflow-hidden rounded-2xl border border-black/5 bg-white py-1.5 text-[#19152B] shadow-2xl"
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
                    selected ? "bg-[#6937DD] text-white" : "hover:bg-[#F0E9FF]"
                  }`}
                >
                  {item.label}
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
  const [puedeUbicar, setPuedeUbicar] = useState(false);
  const [ubicando, setUbicando] = useState(false);

  useEffect(() => {
    setPuedeUbicar(typeof navigator !== "undefined" && "geolocation" in navigator);
  }, []);

  const usarUbicacion = () => {
    if (!navigator.geolocation || ubicando) return;
    setUbicando(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/reverse-geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          if (!res.ok) return;
          const data = (await res.json()) as { localidad?: string; etiqueta?: string };
          const texto = data.localidad || data.etiqueta || "";
          if (texto) setUbicacion(texto);
        } finally {
          setUbicando(false);
        }
      },
      () => setUbicando(false),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
    );
  };

  const handleSearch = (e: FormEvent) => {
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
    <form
      onSubmit={handleSearch}
      className="w-full [filter:drop-shadow(0_16px_34px_rgba(78,43,165,0.18))]"
    >
      <div className="relative z-[1] flex h-11 w-[200px] items-center gap-1 rounded-t-[18px] bg-white px-1.5 lg:h-16 lg:w-[228px] lg:px-2">
        <button
          type="button"
          onClick={() => setOperacion("VENTA")}
          className={`h-9 min-w-0 flex-1 truncate rounded-full px-3 text-sm font-bold transition-colors lg:h-12 ${
            operacion === "VENTA" ? "bg-[#6937DD] text-white" : "text-[#6937DD]"
          }`}
        >
          Venta
        </button>
        <button
          type="button"
          onClick={() => setOperacion("ALQUILER")}
          className={`h-9 min-w-0 flex-1 truncate rounded-full px-3 text-sm font-bold transition-colors lg:h-12 ${
            operacion === "ALQUILER" ? "bg-[#6937DD] text-white" : "text-[#6937DD]"
          }`}
        >
          Alquiler
        </button>
        <span
          aria-hidden
          className="pointer-events-none absolute -right-5 bottom-0 h-5 w-5 bg-[radial-gradient(circle_at_top_right,transparent_20px,#fff_21px)]"
        />
      </div>

      <div className="-mt-px rounded-b-[22px] rounded-tr-[22px] bg-white p-3.5 lg:flex lg:h-[72px] lg:items-center lg:gap-2.5 lg:px-3 lg:py-0">
        <label className="mb-2.5 flex h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#F4F0FF] px-3 lg:mb-0 lg:h-[52px] lg:rounded-full lg:bg-[#F3EEFF]">
          <MapPin size={18} className="shrink-0 text-[#6937DD]" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Localidad, barrio o zona..."
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#19152B] outline-none placeholder:text-[#8A869C]"
          />
          {puedeUbicar && (
            <button
              type="button"
              aria-label="Usar mi ubicación"
              disabled={ubicando}
              onClick={usarUbicacion}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6937DD] disabled:opacity-50"
            >
              <LocateFixed size={18} strokeWidth={1.8} />
            </button>
          )}
        </label>

        <div className="mb-2.5 lg:mb-0">
          <TipoMenu value={tipo} onChange={setTipo} />
        </div>

        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#6937DD] text-sm font-bold text-white transition-colors hover:bg-[#4E2BA5] lg:h-[52px] lg:w-auto lg:shrink-0 lg:rounded-full lg:px-6"
        >
          <Search size={18} strokeWidth={2} />
          Buscar propiedades
        </button>
      </div>
    </form>
  );
}
