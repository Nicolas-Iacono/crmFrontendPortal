"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FiltrosDisponibles } from "@/lib/api";

interface Props {
  filtros: FiltrosDisponibles;
  currentParams: Record<string, string>;
}

export default function ListingsFilterSidebar({ filtros, currentParams }: Props) {
  const router = useRouter();
  const [operacion, setOperacion] = useState(
    currentParams.operacion || (currentParams.usuarioId ? "" : "VENTA")
  );
  const [tipo, setTipo] = useState(currentParams.tipo || "");
  const [localidad, setLocalidad] = useState(currentParams.localidad || "");
  const [precioMin, setPrecioMin] = useState(currentParams.precioMin || "");
  const [precioMax, setPrecioMax] = useState(currentParams.precioMax || "");
  const [dormitorios, setDormitorios] = useState(currentParams.dormitorios || "");
  const [pileta, setPileta] = useState(currentParams.pileta === "true");
  const [cochera, setCochera] = useState(currentParams.cochera === "true");

  const operacionFromUrl =
    currentParams.operacion || (currentParams.usuarioId ? "" : "VENTA");

  useEffect(() => {
    setOperacion(operacionFromUrl);
  }, [operacionFromUrl, currentParams.usuarioId]);

  const bedOptions = ["", "1", "2", "3", "4"];

  const apply = () => {
    const p = new URLSearchParams();
    if (operacion) p.set("operacion", operacion);
    if (tipo) p.set("tipo", tipo);
    if (localidad.trim()) p.set("localidad", localidad.trim());
    if (precioMin) p.set("precioMin", precioMin);
    if (precioMax) p.set("precioMax", precioMax);
    if (dormitorios) p.set("dormitorios", dormitorios);
    if (cochera) p.set("cochera", "true");
    if (pileta) p.set("pileta", "true");
    if (currentParams.usuarioId) p.set("usuarioId", currentParams.usuarioId);
    if (currentParams.inmobiliariaNombre) p.set("inmobiliariaNombre", currentParams.inmobiliariaNombre);
    p.set("page", "0");
    p.set("size", "12");
    router.push(`/propiedades?${p.toString()}`);
  };

  const labelClass = "font-bold text-xs text-on-surface-variant uppercase tracking-wider";
  const tiposLista = filtros.tipos.length ? filtros.tipos : ["Casa", "Departamento", "PH", "Lote", "Local"];

  return (
    <aside className="hidden lg:flex flex-col w-80 shrink-0 sticky top-32 h-[calc(100vh-10rem)] bg-surface-container-low rounded-lg p-6 overflow-y-auto space-y-8 font-body">
      <div>
        <h3 className="font-headline font-extrabold text-primary text-xl mb-6">Refinar búsqueda</h3>

        <div className="space-y-4 mb-8">
          <p className={labelClass}>Operación</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: "", l: "Todas" },
              { v: "VENTA", l: "Venta" },
              { v: "ALQUILER", l: "Alquiler" },
            ].map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => setOperacion(v)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  operacion === v ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <p className={labelClass}>Rango de precio</p>
          <div className="flex gap-4">
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
              placeholder="Mín."
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
            />
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
              placeholder="Máx."
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <p className={labelClass}>Dormitorios</p>
          <div className="flex flex-wrap gap-2">
            {bedOptions.map((n) => (
              <button
                key={n || "any"}
                type="button"
                onClick={() => setDormitorios(n)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  dormitorios === n ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {n === "" ? "Cualquiera" : `${n}+`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <p className={labelClass}>Zona / localidad</p>
          <input
            className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
            placeholder="Ej: Quilmes"
            value={localidad}
            onChange={(e) => setLocalidad(e.target.value)}
            list="loc-list-sidebar"
          />
          <datalist id="loc-list-sidebar">
            {filtros.localidades.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>

        <div className="space-y-4 mb-8">
          <p className={labelClass}>Tipo de propiedad</p>
          <div className="space-y-2">
            {tiposLista.map((t) => (
              <label key={t} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={tipo === t}
                  onChange={() => setTipo((prev) => (prev === t ? "" : t))}
                  className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5"
                />
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className={labelClass}>Comodidades</p>
          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest hover:bg-surface-variant transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed-dim">pool</span>
                <span className="text-sm font-semibold">Pileta</span>
              </div>
              <input type="checkbox" checked={pileta} onChange={(e) => setPileta(e.target.checked)} className="rounded-full border-outline-variant text-primary focus:ring-primary" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest hover:bg-surface-variant transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed-dim">garage</span>
                <span className="text-sm font-semibold">Cochera</span>
              </div>
              <input type="checkbox" checked={cochera} onChange={(e) => setCochera(e.target.checked)} className="rounded-full border-outline-variant text-primary focus:ring-primary" />
            </label>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={apply}
        className="w-full bg-primary-container text-on-primary-container py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all mt-auto"
      >
        Aplicar filtros
      </button>
    </aside>
  );
}
