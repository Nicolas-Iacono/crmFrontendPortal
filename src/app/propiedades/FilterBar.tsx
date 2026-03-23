"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FiltrosDisponibles } from "@/lib/api";

interface Props {
  filtros: FiltrosDisponibles;
  currentParams: Record<string, string>;
}

export default function FilterBar({ filtros, currentParams }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const [operacion, setOperacion] = useState(currentParams.operacion || "");
  const [tipo, setTipo] = useState(currentParams.tipo || "");
  const [localidad, setLocalidad] = useState(currentParams.localidad || "");
  const [precioMin, setPrecioMin] = useState(currentParams.precioMin || "");
  const [precioMax, setPrecioMax] = useState(currentParams.precioMax || "");
  const [ambientes, setAmbientes] = useState(currentParams.ambientes || "");
  const [dormitorios, setDormitorios] = useState(currentParams.dormitorios || "");
  const [cochera, setCochera] = useState(currentParams.cochera === "true");
  const [pileta, setPileta] = useState(currentParams.pileta === "true");
  const [mascotas, setMascotas] = useState(currentParams.aceptaMascotas === "true");

  const apply = () => {
    const p = new URLSearchParams();
    if (operacion) p.set("operacion", operacion);
    if (tipo) p.set("tipo", tipo);
    if (localidad) p.set("localidad", localidad);
    if (precioMin) p.set("precioMin", precioMin);
    if (precioMax) p.set("precioMax", precioMax);
    if (ambientes) p.set("ambientes", ambientes);
    if (dormitorios) p.set("dormitorios", dormitorios);
    if (cochera) p.set("cochera", "true");
    if (pileta) p.set("pileta", "true");
    if (mascotas) p.set("aceptaMascotas", "true");
    if (currentParams.usuarioId) p.set("usuarioId", currentParams.usuarioId);
    if (currentParams.inmobiliariaNombre) p.set("inmobiliariaNombre", currentParams.inmobiliariaNombre);
    p.set("page", "0");
    p.set("size", "12");
    router.push(`/propiedades?${p.toString()}`);
  };

  const clear = () => {
    router.push("/propiedades");
  };

  const selectClass =
    "px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
  const inputClass = selectClass;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Operacion */}
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          {["", "VENTA", "ALQUILER"].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setOperacion(op)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                operacion === op ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
              }`}
            >
              {op === "" ? "Todas" : op === "VENTA" ? "Venta" : "Alquiler"}
            </button>
          ))}
        </div>

        {/* Tipo */}
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={selectClass}>
          <option value="">Tipo</option>
          {filtros.tipos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Localidad */}
        <input
          type="text"
          placeholder="Localidad..."
          value={localidad}
          onChange={(e) => setLocalidad(e.target.value)}
          list="localidades-list"
          className={`${inputClass} w-40`}
        />
        <datalist id="localidades-list">
          {filtros.localidades.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">{expanded ? "expand_less" : "expand_more"}</span>
          {expanded ? "Menos filtros" : "Más filtros"}
        </button>

        <button onClick={apply} className="ml-auto bg-primary hover:bg-primary/90 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">filter_alt</span>
          Filtrar
        </button>
        <button onClick={clear} className="text-xs text-slate-500 hover:text-slate-700">
          Limpiar
        </button>
      </div>

      {expanded && (
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Precio mín.</label>
            <input type="number" placeholder="0" value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} className={`${inputClass} w-28`} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Precio máx.</label>
            <input type="number" placeholder="Sin limite" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} className={`${inputClass} w-28`} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ambientes min</label>
            <select value={ambientes} onChange={(e) => setAmbientes(e.target.value)} className={selectClass}>
              <option value="">-</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Dormitorios mín.</label>
            <select value={dormitorios} onChange={(e) => setDormitorios(e.target.value)} className={selectClass}>
              <option value="">-</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={cochera} onChange={(e) => setCochera(e.target.checked)} className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
            Cochera
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={pileta} onChange={(e) => setPileta(e.target.checked)} className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
            Pileta
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={mascotas} onChange={(e) => setMascotas(e.target.checked)} className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
            Mascotas
          </label>
        </div>
      )}
    </div>
  );
}
