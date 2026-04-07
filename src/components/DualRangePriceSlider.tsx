"use client";

export type DualRangePriceSliderProps = {
  trackMin: number;
  trackMax: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  moneda: "ARS" | "USD";
  idPrefix?: string;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function DualRangePriceSlider({
  trackMin,
  trackMax,
  step,
  valueMin,
  valueMax,
  onChange,
  moneda,
  idPrefix = "precio-rango",
}: DualRangePriceSliderProps) {
  const span = trackMax - trackMin;
  const pct = (v: number) => (span <= 0 ? 0 : ((v - trackMin) / span) * 100);

  const sym = moneda === "USD" ? "U$D " : "$ ";

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    if (!Number.isFinite(raw)) return;
    const next = clamp(raw, trackMin, valueMax - step);
    onChange(next, valueMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    if (!Number.isFinite(raw)) return;
    const next = clamp(raw, valueMin + step, trackMax);
    onChange(valueMin, next);
  };

  const lo = pct(valueMin);
  const hi = pct(valueMax);

  return (
    <div className="dual-range pt-1 pb-1">
      <div className="flex justify-between gap-2 text-xs font-medium text-on-surface-variant mb-2">
        <span id={`${idPrefix}-min-label`}>Precio mínimo</span>
        <span id={`${idPrefix}-max-label`}>Precio máximo</span>
      </div>
      <div className="relative h-9 mx-0.5">
        <div
          className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[var(--color-outline-variant)]/45 pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[var(--color-primary)]/55 pointer-events-none"
          style={{ left: `${lo}%`, width: `${Math.max(hi - lo, 0)}%` }}
          aria-hidden
        />
        <input
          type="range"
          className="dual-range-input dual-range-input-lower absolute inset-x-0 top-1/2 w-full -translate-y-1/2"
          min={trackMin}
          max={trackMax}
          step={step}
          value={valueMin}
          onChange={handleMinChange}
          aria-labelledby={`${idPrefix}-min-label`}
          aria-valuemin={trackMin}
          aria-valuemax={trackMax}
        />
        <input
          type="range"
          className="dual-range-input dual-range-input-upper absolute inset-x-0 top-1/2 w-full -translate-y-1/2"
          min={trackMin}
          max={trackMax}
          step={step}
          value={valueMax}
          onChange={handleMaxChange}
          aria-labelledby={`${idPrefix}-max-label`}
          aria-valuemin={trackMin}
          aria-valuemax={trackMax}
        />
      </div>
      <div className="flex justify-between gap-2 mt-2 text-sm font-semibold text-on-surface tabular-nums">
        <span>
          {sym}
          {valueMin.toLocaleString("es-AR")}
        </span>
        <span>
          {sym}
          {valueMax.toLocaleString("es-AR")}
        </span>
      </div>
    </div>
  );
}
