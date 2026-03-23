"use client";

import { useRouter } from "next/navigation";

const OPTIONS: { label: string; sort: string; dir: string }[] = [
  { label: "Más recientes", sort: "fechaPublicacion", dir: "desc" },
  { label: "Precio: menor a mayor", sort: "precio", dir: "asc" },
  { label: "Precio: mayor a menor", sort: "precio", dir: "desc" },
];

export default function PropiedadesSort({ currentParams }: { currentParams: Record<string, string> }) {
  const router = useRouter();
  const sort = currentParams.sort || "fechaPublicacion";
  const dir = currentParams.dir || "desc";
  const combined = `${sort}|${dir}`;
  const value = OPTIONS.some((o) => `${o.sort}|${o.dir}` === combined)
    ? combined
    : `${OPTIONS[0].sort}|${OPTIONS[0].dir}`;

  const onChange = (v: string) => {
    const [s, d] = v.split("|");
    const p = new URLSearchParams();
    Object.entries(currentParams).forEach(([k, val]) => {
      if (k !== "sort" && k !== "dir") p.set(k, val);
    });
    p.set("sort", s);
    p.set("dir", d);
    router.push(`/propiedades?${p.toString()}`);
  };

  return (
    <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-full">
      <span className="material-symbols-outlined text-primary text-lg pl-2">sort</span>
      <span className="text-sm font-bold pl-1 text-on-surface-variant font-body">Ordenar:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none text-sm font-bold text-primary focus:ring-0 cursor-pointer pr-8 font-body outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.label} value={`${o.sort}|${o.dir}`}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
