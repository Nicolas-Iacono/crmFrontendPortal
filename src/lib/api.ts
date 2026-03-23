const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface PropiedadLista {
  id: number;
  slug: string;
  tituloPublico: string;
  tipo: string;
  tipoOperacion: "ALQUILER" | "VENTA";
  precio: number | null;
  moneda: "ARS" | "USD";
  mostrarPrecio: boolean;
  localidad: string;
  partido: string;
  provincia: string;
  cantidadAmbientes: number | null;
  cantidadDormitorios: number | null;
  cantidadBanos: number | null;
  metrosCuadradosCubierto: number | null;
  metrosCuadradosTotales: number | null;
  cochera: boolean;
  imagenPrincipalUrl: string | null;
  nombreInmobiliaria: string;
  logoInmobiliaria: string | null;
  destacada?: boolean;
}

export interface PropiedadDetalle extends PropiedadLista {
  descripcionPublica: string | null;
  estadoPublicacion: string;
  direccion: string | null;
  mostrarDireccionExacta: boolean;
  metrosCuadradosDescubierto: number | null;
  pileta: boolean;
  jardin: boolean;
  patio: boolean;
  balcon: boolean;
  quincho: boolean;
  laundry: boolean;
  sum: boolean;
  seguridad: boolean;
  gimnasio: boolean;
  ascensor: boolean;
  terraza: boolean;
  aptoProfesional: boolean;
  aceptaMascotas: boolean;
  whatsappContacto: string | null;
  emailContacto: string | null;
  telefonoContacto: string | null;
  fechaPublicacion: string;
  cantidadVistas: number;
  imagenesUrls: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface FiltrosDisponibles {
  localidades: string[];
  partidos: string[];
  tipos: string[];
  operaciones: string[];
  precioMinimo: number | null;
  precioMaximo: number | null;
}

export async function fetchPropiedades(
  params: Record<string, string>
): Promise<PageResponse<PropiedadLista>> {
  const searchParams = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/api/public/propiedades?${searchParams}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Error al cargar propiedades");
  return res.json();
}

export async function fetchPropiedadBySlug(
  slug: string
): Promise<PropiedadDetalle> {
  const res = await fetch(`${API_BASE}/api/public/propiedades/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Propiedad no encontrada");
  return res.json();
}

export async function fetchDestacadas(
  limit = 8
): Promise<PropiedadLista[]> {
  const res = await fetch(
    `${API_BASE}/api/public/propiedades/destacadas?limit=${limit}`,
    { next: { revalidate: 120 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRecientes(
  limit = 8
): Promise<PropiedadLista[]> {
  const res = await fetch(
    `${API_BASE}/api/public/propiedades/recientes?limit=${limit}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRelacionadas(
  id: number,
  limit = 4
): Promise<PropiedadLista[]> {
  const res = await fetch(
    `${API_BASE}/api/public/propiedades/${id}/relacionadas?limit=${limit}`,
    { next: { revalidate: 120 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function fetchFiltros(): Promise<FiltrosDisponibles> {
  const res = await fetch(`${API_BASE}/api/public/filtros`, {
    next: { revalidate: 300 },
  });
  if (!res.ok)
    return {
      localidades: [],
      partidos: [],
      tipos: [],
      operaciones: [],
      precioMinimo: null,
      precioMaximo: null,
    };
  return res.json();
}

export interface Inmobiliaria {
  id: number;
  nombreNegocio: string;
  logoUrl: string | null;
  localidad: string | null;
  partido: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  matricula: string | null;
  cantidadPropiedades: number;
}

export async function fetchInmobiliarias(): Promise<Inmobiliaria[]> {
  const res = await fetch(`${API_BASE}/api/public/inmobiliarias`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function enviarConsulta(data: {
  propiedadId: number;
  nombre: string;
  telefono?: string;
  email?: string;
  mensaje?: string;
}): Promise<{ mensaje: string }> {
  const res = await fetch(`${API_BASE}/api/public/consultas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error al enviar consulta");
  }
  return res.json();
}
