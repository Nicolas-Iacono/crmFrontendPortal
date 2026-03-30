"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FiltrosDisponibles } from "@/lib/api";
import {
  PORTAL_AMENITY_FILTERS,
  appendBooleanFilters,
  booleanFiltersFromParams,
  preserveSortAndUsuario,
  type BooleanFilterParam,
} from "@/lib/listingFilters";

interface Props {
  filtros: FiltrosDisponibles;
  currentParams: Record<string, string>;
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        checked ? "bg-indigo-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function FilterBar({ filtros, currentParams }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const [operacion, setOperacion] = useState(currentParams.operacion || (currentParams.usuarioId ? "TODAS" : "VENTA"));
  const [tipo, setTipo] = useState(currentParams.tipo || "");
  const [localidad, setLocalidad] = useState(currentParams.localidad || "");
  const [partido, setPartido] = useState(currentParams.partido || "");
  const [precioMin, setPrecioMin] = useState(currentParams.precioMin || "");
  const [precioMax, setPrecioMax] = useState(currentParams.precioMax || "");
  const [ambientes, setAmbientes] = useState(currentParams.ambientes || "");
  const [dormitorios, setDormitorios] = useState(currentParams.dormitorios || "");
  const [banos, setBanos] = useState(currentParams.banos || "");
  const [boolFlags, setBoolFlags] = useState<Record<BooleanFilterParam, boolean>>(() =>
    booleanFiltersFromParams(currentParams)
  );

  const paramsKey = useMemo(() => JSON.stringify(currentParams), [currentParams]);

  useEffect(() => {
    setOperacion(currentParams.operacion || (currentParams.usuarioId ? "TODAS" : "VENTA"));
    setTipo(currentParams.tipo || "");
    setLocalidad(currentParams.localidad || "");
    setPartido(currentParams.partido || "");
    setPrecioMin(currentParams.precioMin || "");
    setPrecioMax(currentParams.precioMax || "");
    setAmbientes(currentParams.ambientes || "");
    setDormitorios(currentParams.dormitorios || "");
    setBanos(currentParams.banos || "");
    setBoolFlags(booleanFiltersFromParams(currentParams));
  }, [paramsKey, currentParams]);

  const setFlag = (param: BooleanFilterParam, v: boolean) => {
    setBoolFlags((prev) => ({ ...prev, [param]: v }));
  };

  const quickCochera = boolFlags.cochera;
  const quickPileta = boolFlags.pileta;
  const quickMascotas = boolFlags.aceptaMascotas;

  const setQuickCochera = (v: boolean) => setFlag("cochera", v);
  const setQuickPileta = (v: boolean) => setFlag("pileta", v);
  const setQuickMascotas = (v: boolean) => setFlag("aceptaMascotas", v);

  const apply = () => {
    const p = new URLSearchParams();
    if (operacion) p.set("operacion", operacion);
    if (tipo) p.set("tipo", tipo);
    if (localidad.trim()) p.set("localidad", localidad.trim());
    if (partido.trim()) p.set("partido", partido.trim());
    if (precioMin) p.set("precioMin", precioMin);
    if (precioMax) p.set("precioMax", precioMax);
    if (ambientes) p.set("ambientes", ambientes);
    if (dormitorios) p.set("dormitorios", dormitorios);
    if (banos) p.set("banos", banos);
    appendBooleanFilters(p, boolFlags);
    preserveSortAndUsuario(p, currentParams);
    p.set("page", "0");
    p.set("size", "12");
    router.push(`/propiedades?${p.toString()}`);
  };

  const clear = () => {
    const p = new URLSearchParams();
    preserveSortAndUsuario(p, currentParams);
    p.set("page", "0");
    p.set("size", "12");
    if (!currentParams.usuarioId) p.set("operacion", "VENTA");
    router.push(`/propiedades?${p.toString()}`);
  };

  const selectClass =
    "px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
  const inputClass = selectClass;

  const extraAmenities = PORTAL_AMENITY_FILTERS.filter(
    (f) => !["cochera", "pileta", "aceptaMascotas"].includes(f.param)
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          onClick={clear}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 w-full sm:w-auto sm:mr-2 order-first"
        >
          Limpiar
        </button>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Precio mín.</label>
          <input
            type="number"
            placeholder="0"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            className={`${inputClass} w-28`}
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Precio máx.</label>
          <input
            type="number"
            placeholder="Sin límite"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            className={`${inputClass} w-28`}
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Ambientes mín.</label>
          <select value={ambientes} onChange={(e) => setAmbientes(e.target.value)} className={selectClass}>
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Dormitorios mín.</label>
          <select value={dormitorios} onChange={(e) => setDormitorios(e.target.value)} className={selectClass}>
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer pb-1">
          <input
            type="checkbox"
            checked={quickCochera}
            onChange={(e) => setQuickCochera(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Cochera
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer pb-1">
          <input
            type="checkbox"
            checked={quickPileta}
            onChange={(e) => setQuickPileta(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Pileta
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer pb-1">
          <input
            type="checkbox"
            checked={quickMascotas}
            onChange={(e) => setQuickMascotas(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Mascotas
        </label>
      </div>

      <div className="flex flex-wrap gap-3 items-end border-t border-slate-100 pt-3">
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          {["TODAS", "VENTA", "ALQUILER"].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setOperacion(op)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                operacion === op ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
              }`}
            >
              {op === "TODAS" ? "Todas" : op === "VENTA" ? "Venta" : "Alquiler"}
            </button>
          ))}
        </div>

        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={selectClass}>
          <option value="">Tipo</option>
          {filtros.tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Localidad..."
          value={localidad}
          onChange={(e) => setLocalidad(e.target.value)}
          list="localidades-list-fb"
          className={`${inputClass} flex-1 min-w-[120px]`}
        />
        <datalist id="localidades-list-fb">
          {filtros.localidades.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">{expanded ? "expand_less" : "expand_more"}</span>
          {expanded ? "Menos filtros" : "Más filtros"}
        </button>

        <button
          onClick={apply}
          className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">filter_alt</span>
          Filtrar
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Baños mín.</label>
              <select value={banos} onChange={(e) => setBanos(e.target.value)} className={selectClass}>
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}+
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Partido..."
              value={partido}
              onChange={(e) => setPartido(e.target.value)}
              list="partidos-list-fb"
              className={`${inputClass} w-40`}
            />
            <datalist id="partidos-list-fb">
              {filtros.partidos.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>

          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Amenities</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {extraAmenities.map(({ param, label, icon }) => (
              <div
                key={param}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
              >
                <span className="flex items-center gap-2 min-w-0 text-xs font-medium text-slate-700">
                  <span className="material-symbols-outlined text-indigo-500 text-lg shrink-0">{icon}</span>
                  <span className="leading-tight">{label}</span>
                </span>
                <ToggleSwitch checked={boolFlags[param]} onChange={(v) => setFlag(param, v)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
