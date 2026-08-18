"use client";

import { useEffect, useMemo, useState } from "react";
import type { FiltrosDisponibles } from "@/lib/api";
import {
  PORTAL_AMENITY_FILTERS,
  appendBooleanFilters,
  booleanFiltersFromParams,
  preserveSortAndUsuario,
  type BooleanFilterParam,
} from "@/lib/listingFilters";
import { getListingPathFromUrlSearchParams } from "@/lib/listingHref";
import { useFilterNav } from "./FilterNavigation";

interface Props {
  filtros: FiltrosDisponibles;
  currentParams: Record<string, string>;
}

function ToggleSwitch({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        checked ? "bg-primary" : "bg-outline-variant/50"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function ListingsFilterSidebar({ filtros, currentParams }: Props) {
  const { navigate, isPending } = useFilterNav();
  const operacionFromUrl =
    currentParams.operacion || "TODAS";

  const [operacion, setOperacion] = useState(operacionFromUrl);
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

  useEffect(() => {
    setOperacion(operacionFromUrl);
  }, [operacionFromUrl, currentParams.usuarioId]);

  const paramsKey = useMemo(() => JSON.stringify(currentParams), [currentParams]);

  useEffect(() => {
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

  const apply = (overrides: {
    operacion?: string;
    tipo?: string;
    ambientes?: string;
    dormitorios?: string;
    banos?: string;
    boolFlags?: Record<BooleanFilterParam, boolean>;
  } = {}) => {
    const p = new URLSearchParams();
    const nextOperacion = overrides.operacion ?? operacion;
    const nextTipo = overrides.tipo ?? tipo;
    const nextAmbientes = overrides.ambientes ?? ambientes;
    const nextDormitorios = overrides.dormitorios ?? dormitorios;
    const nextBanos = overrides.banos ?? banos;
    const nextFlags = overrides.boolFlags ?? boolFlags;

    if (nextOperacion) p.set("operacion", nextOperacion);
    if (nextTipo) p.set("tipo", nextTipo);
    if (localidad.trim()) p.set("localidad", localidad.trim());
    if (partido.trim()) p.set("partido", partido.trim());
    if (precioMin) p.set("precioMin", precioMin);
    if (precioMax) p.set("precioMax", precioMax);
    if (nextAmbientes) p.set("ambientes", nextAmbientes);
    if (nextDormitorios) p.set("dormitorios", nextDormitorios);
    if (nextBanos) p.set("banos", nextBanos);
    appendBooleanFilters(p, nextFlags);
    preserveSortAndUsuario(p, currentParams);
    p.set("page", "0");
    p.set("size", "12");
    navigate(getListingPathFromUrlSearchParams(p));
  };

  const clear = () => {
    const p = new URLSearchParams();
    preserveSortAndUsuario(p, currentParams);
    p.set("page", "0");
    p.set("size", "12");
    p.set("operacion", "TODAS");
    navigate(getListingPathFromUrlSearchParams(p));
  };

  const labelClass = "font-bold text-xs text-on-surface-variant uppercase tracking-wider";
  const tiposLista = filtros.tipos.length ? filtros.tipos : ["Casa", "Departamento", "PH", "Lote", "Local"];
  const roomOptions = ["", "1", "2", "3", "4", "5"];

  return (
    <aside className="hidden lg:flex flex-col w-80 shrink-0 sticky top-32 h-[calc(100vh-10rem)] bg-surface-container-low rounded-lg p-6 overflow-y-auto space-y-6 font-body">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-headline font-extrabold text-primary text-xl">Refinar búsqueda</h3>
        <button
          type="button"
          onClick={clear}
          disabled={isPending}
          className="text-xs font-bold text-primary hover:underline shrink-0 cursor-pointer disabled:opacity-50"
        >
          Limpiar
        </button>
      </div>

      <div className="space-y-4">
        <p className={labelClass}>Operación</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { v: "TODAS", l: "Todas" },
            { v: "VENTA", l: "Venta" },
            { v: "ALQUILER", l: "Alquiler" },
          ].map(({ v, l }) => (
            <button
              key={v}
              type="button"
              disabled={isPending}
              onClick={() => {
                setOperacion(v);
                apply({ operacion: v });
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                operacion === v
                  ? "bg-primary text-white"
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className={labelClass}>Rango de precio</p>
        <div className="flex gap-3">
          <input
            className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
            placeholder="Precio mín."
            inputMode="decimal"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
          />
          <input
            className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
            placeholder="Precio máx."
            inputMode="decimal"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className={labelClass}>Ambientes</p>
        <div className="flex flex-wrap gap-2">
          {roomOptions.map((n) => (
            <button
              key={n || "any-a"}
              type="button"
              disabled={isPending}
              onClick={() => {
                setAmbientes(n);
                apply({ ambientes: n });
              }}
              className={`px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                ambientes === n
                  ? "bg-primary text-white"
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {n === "" ? "—" : n === "5" ? "5+" : n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className={labelClass}>Dormitorios</p>
        <div className="flex flex-wrap gap-2">
          {roomOptions.map((n) => (
            <button
              key={n || "any-d"}
              type="button"
              disabled={isPending}
              onClick={() => {
                setDormitorios(n);
                apply({ dormitorios: n });
              }}
              className={`px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                dormitorios === n
                  ? "bg-primary text-white"
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {n === "" ? "—" : n === "5" ? "5+" : n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className={labelClass}>Baños</p>
        <div className="flex flex-wrap gap-2">
          {roomOptions.map((n) => (
            <button
              key={n || "any-b"}
              type="button"
              disabled={isPending}
              onClick={() => {
                setBanos(n);
                apply({ banos: n });
              }}
              className={`px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                banos === n
                  ? "bg-primary text-white"
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {n === "" ? "—" : n === "5" ? "5+" : n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className={labelClass}>Zona</p>
        <input
          className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
          placeholder="Localidad"
          value={localidad}
          onChange={(e) => setLocalidad(e.target.value)}
          list="loc-list-sidebar"
        />
        <datalist id="loc-list-sidebar">
          {filtros.localidades.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        <input
          className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
          placeholder="Partido (opcional)"
          value={partido}
          onChange={(e) => setPartido(e.target.value)}
          list="part-list-sidebar"
        />
        <datalist id="part-list-sidebar">
          {filtros.partidos.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </div>

      <div className="space-y-4">
        <p className={labelClass}>Tipo de propiedad</p>
        <div className="space-y-2">
          {tiposLista.map((t) => (
            <label key={t} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={tipo === t}
                onChange={() => {
                  const next = tipo === t ? "" : t;
                  setTipo(next);
                  apply({ tipo: next });
                }}
                className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5"
              />
              <span className="text-sm font-medium group-hover:text-primary transition-colors">{t}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className={labelClass}>Amenities</p>
        <div className="grid grid-cols-1 gap-1">
          {PORTAL_AMENITY_FILTERS.map(({ param, label, icon }) => (
            <label
              key={param}
              htmlFor={`side-${param}`}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-lowest hover:bg-surface-variant/60 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-primary-fixed-dim shrink-0 text-xl">{icon}</span>
                <span className="text-sm font-semibold leading-tight">{label}</span>
              </span>
              <ToggleSwitch
                id={`side-${param}`}
                checked={boolFlags[param]}
                onChange={(v) => {
                  const next = { ...boolFlags, [param]: v };
                  setBoolFlags(next);
                  apply({ boolFlags: next });
                }}
              />
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => apply()}
        disabled={isPending}
        className="w-full bg-primary-container text-on-primary-container py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all mt-2 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" />
            Cargando...
          </>
        ) : (
          "Aplicar filtros"
        )}
      </button>
    </aside>
  );
}
