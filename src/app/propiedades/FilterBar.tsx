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

const ROOM_OPTIONS = ["", "1", "2", "3", "4", "5"];

function ChipGroup({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROOM_OPTIONS.map((n) => {
        const selected = value === n;
        return (
          <button
            key={n || "any"}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`min-w-11 h-11 px-3 rounded-full text-sm font-bold transition-all cursor-pointer disabled:opacity-50 ${
              selected
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container-highest text-on-surface-variant"
            }`}
          >
            {n === "" ? "—" : n === "5" ? "5+" : n}
          </button>
        );
      })}
    </div>
  );
}

export default function FilterBar({ filtros, currentParams }: Props) {
  const { navigate, isPending } = useFilterNav();
  const [sheetOpen, setSheetOpen] = useState(false);

  const [operacion, setOperacion] = useState(currentParams.operacion || "TODAS");
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
    setOperacion(currentParams.operacion || "TODAS");
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

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const apply = (overrides: {
    operacion?: string;
    tipo?: string;
    localidad?: string;
    partido?: string;
    precioMin?: string;
    precioMax?: string;
    ambientes?: string;
    dormitorios?: string;
    banos?: string;
    boolFlags?: Record<BooleanFilterParam, boolean>;
  } = {}) => {
    const p = new URLSearchParams();
    const nextOperacion = overrides.operacion ?? operacion;
    const nextTipo = overrides.tipo ?? tipo;
    const nextLocalidad = overrides.localidad ?? localidad;
    const nextPartido = overrides.partido ?? partido;
    const nextPrecioMin = overrides.precioMin ?? precioMin;
    const nextPrecioMax = overrides.precioMax ?? precioMax;
    const nextAmbientes = overrides.ambientes ?? ambientes;
    const nextDormitorios = overrides.dormitorios ?? dormitorios;
    const nextBanos = overrides.banos ?? banos;
    const nextFlags = overrides.boolFlags ?? boolFlags;

    if (nextOperacion) p.set("operacion", nextOperacion);
    if (nextTipo) p.set("tipo", nextTipo);
    if (nextLocalidad.trim()) p.set("localidad", nextLocalidad.trim());
    if (nextPartido.trim()) p.set("partido", nextPartido.trim());
    if (nextPrecioMin) p.set("precioMin", nextPrecioMin);
    if (nextPrecioMax) p.set("precioMax", nextPrecioMax);
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
    setSheetOpen(false);
    const p = new URLSearchParams();
    preserveSortAndUsuario(p, currentParams);
    p.set("page", "0");
    p.set("size", "12");
    p.set("operacion", "TODAS");
    navigate(getListingPathFromUrlSearchParams(p));
  };

  const applySheet = () => {
    apply();
    setSheetOpen(false);
  };

  const activeCount = useMemo(() => {
    let n = 0;
    if (currentParams.operacion && currentParams.operacion !== "TODAS") n += 1;
    if (currentParams.tipo) n += 1;
    if (currentParams.localidad) n += 1;
    if (currentParams.partido) n += 1;
    if (currentParams.precioMin) n += 1;
    if (currentParams.precioMax) n += 1;
    if (currentParams.ambientes) n += 1;
    if (currentParams.dormitorios) n += 1;
    if (currentParams.banos) n += 1;
    for (const { param } of PORTAL_AMENITY_FILTERS) {
      if (currentParams[param] === "true") n += 1;
    }
    return n;
  }, [currentParams]);

  const tiposLista = filtros.tipos.length
    ? filtros.tipos
    : ["Casa", "Departamento", "PH", "Lote", "Local"];

  const fieldClass =
    "w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3.5 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40";
  const labelClass = "block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2";

  return (
    <div className="font-body">
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-3 space-y-3">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-surface-container-high">
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
              className={`py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer disabled:opacity-60 ${
                operacion === v ? "bg-primary text-white shadow-sm" : "text-on-surface-variant"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <div className="relative flex-1 min-w-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
              search
            </span>
            <input
              type="search"
              placeholder="Localidad o zona"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              list="localidades-list-fb"
              className="w-full bg-surface-container-high border-none rounded-xl pl-10 pr-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
            />
            <datalist id="localidades-list-fb">
              {filtros.localidades.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 px-4 rounded-xl bg-primary text-white font-bold text-sm cursor-pointer disabled:opacity-70"
          >
            {isPending ? "…" : "Buscar"}
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-container-high text-sm font-bold text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl text-primary">tune</span>
            Más filtros
            {activeCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[11px] leading-5">
                {activeCount}
              </span>
            )}
          </button>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clear}
              disabled={isPending}
              className="px-3 py-2.5 text-sm font-bold text-primary cursor-pointer disabled:opacity-50"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end">
          <button
            type="button"
            aria-label="Cerrar filtros"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative bg-surface-bright rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1">
              <span className="w-10 h-1 rounded-full bg-outline-variant/50" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="font-headline font-extrabold text-lg text-on-surface">Filtros</h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center cursor-pointer"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-4 space-y-6">
              <div>
                <p className={labelClass}>Tipo de propiedad</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo("")}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer ${
                      tipo === "" ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    Todos
                  </button>
                  {tiposLista.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer ${
                        tipo === t ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className={labelClass}>Precio</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Mínimo"
                    value={precioMin}
                    onChange={(e) => setPrecioMin(e.target.value)}
                    className={fieldClass}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Máximo"
                    value={precioMax}
                    onChange={(e) => setPrecioMax(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <p className={labelClass}>Ambientes</p>
                <ChipGroup value={ambientes} onChange={setAmbientes} disabled={isPending} />
              </div>
              <div>
                <p className={labelClass}>Dormitorios</p>
                <ChipGroup value={dormitorios} onChange={setDormitorios} disabled={isPending} />
              </div>
              <div>
                <p className={labelClass}>Baños</p>
                <ChipGroup value={banos} onChange={setBanos} disabled={isPending} />
              </div>

              <div>
                <p className={labelClass}>Partido (opcional)</p>
                <input
                  type="text"
                  placeholder="Ej. Quilmes"
                  value={partido}
                  onChange={(e) => setPartido(e.target.value)}
                  list="partidos-list-fb"
                  className={fieldClass}
                />
                <datalist id="partidos-list-fb">
                  {filtros.partidos.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </div>

              <div>
                <p className={labelClass}>Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {PORTAL_AMENITY_FILTERS.map(({ param, label, icon }) => {
                    const on = boolFlags[param];
                    return (
                      <button
                        key={param}
                        type="button"
                        onClick={() => setBoolFlags((prev) => ({ ...prev, [param]: !prev[param] }))}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold cursor-pointer ${
                          on
                            ? "bg-primary text-white"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{icon}</span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-outline-variant/20 flex gap-3">
              <button
                type="button"
                onClick={clear}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-primary bg-surface-container-high cursor-pointer"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={applySheet}
                disabled={isPending}
                className="flex-[2] py-3.5 rounded-xl font-bold text-sm text-white bg-primary cursor-pointer disabled:opacity-70 inline-flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cargando...
                  </>
                ) : (
                  "Ver resultados"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
