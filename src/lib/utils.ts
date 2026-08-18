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

/** Calle + número (altura) para mostrar y geocodificar. Evita duplicar el número. */
export function calleYNumero(
  direccion?: string | null,
  altura?: string | null
): string {
  const calle = direccion != null ? String(direccion).trim() : "";
  const nro = altura != null ? String(altura).trim() : "";
  if (!nro) return calle;
  if (!calle) return nro;
  const calleNorm = calle.toLowerCase();
  const nroNorm = nro.toLowerCase();
  if (calleNorm === nroNorm || calleNorm.endsWith(` ${nroNorm}`) || calleNorm.endsWith(nroNorm)) {
    return calle;
  }
  return `${calle} ${nro}`;
}

/** Dirección visible en ficha: calle, número, piso y depto. */
export function formatDireccionExacta(prop: {
  direccion?: string | null;
  altura?: string | null;
  numero?: string | null;
  piso?: string | null;
  departamento?: string | null;
}): string {
  const nro = prop.altura || prop.numero || "";
  const calle = calleYNumero(prop.direccion, nro);
  const extras = [
    prop.piso ? `Piso ${prop.piso}` : null,
    prop.departamento ? `Dpto ${prop.departamento}` : null,
  ].filter(Boolean);
  return [calle, ...extras].filter(Boolean).join(" ");
}
