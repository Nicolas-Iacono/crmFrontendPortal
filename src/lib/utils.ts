export function formatPrecio(precio: number | null, moneda: string): string {
  if (precio == null) return "Consultar";
  const symbol = moneda === "USD" ? "U$D" : "$";
  return `${symbol} ${precio.toLocaleString("es-AR")}`;
}

export function tipoOperacionLabel(op: string): string {
  const map: Record<string, string> = {
    ALQUILER: "Alquiler",
    VENTA: "Venta",
  };
  return map[op] || op;
}

export function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
