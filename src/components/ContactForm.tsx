"use client";

import { useState, useMemo, useEffect } from "react";
import { enviarConsulta } from "@/lib/api";
import { formatPrecio } from "@/lib/utils";
import { DualRangePriceSlider } from "@/components/DualRangePriceSlider";

export interface ContactFormProps {
  propiedadId: number;
  whatsapp?: string | null;
  slug: string;
  tituloPublico: string;
  /** Precio publicado (para sugerir rango y texto en WhatsApp) */
  precioReferencia?: number | null;
  moneda?: "ARS" | "USD";
  mostrarPrecio?: boolean;
}

type PrefCheck = {
  cochera: boolean;
  balcon: boolean;
  quincho: boolean;
  ascensor: boolean;
  aptoProfesional: boolean;
  patio: boolean;
  jardin: boolean;
  pileta: boolean;
  mascotas: boolean;
};

const initialPrefs: PrefCheck = {
  cochera: false,
  balcon: false,
  quincho: false,
  ascensor: false,
  aptoProfesional: false,
  patio: false,
  jardin: false,
  pileta: false,
  mascotas: false,
};

export default function ContactForm({
  propiedadId,
  whatsapp,
  slug,
  tituloPublico,
  precioReferencia,
  moneda = "ARS",
  mostrarPrecio = true,
}: ContactFormProps) {
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", email: "", mensaje: "" });
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefChecks, setPrefChecks] = useState<PrefCheck>(initialPrefs);
  const [cantidadPersonas, setCantidadPersonas] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const portalUrl = typeof window !== "undefined" ? window.location.origin : "";
  const propUrl = `${portalUrl}/propiedad/${slug}`;
  const cleanWhatsapp = whatsapp?.replace(/\D/g, "") || "";

  const precioHint = useMemo(() => {
    if (!mostrarPrecio || precioReferencia == null) return null;
    return formatPrecio(precioReferencia, moneda);
  }, [mostrarPrecio, precioReferencia, moneda]);

  const { trackMin, trackMax, step } = useMemo(() => {
    if (precioReferencia != null && mostrarPrecio && Number.isFinite(precioReferencia) && precioReferencia > 0) {
      const ref = precioReferencia;
      const low = Math.max(0, Math.floor(ref * 0.35));
      const high = Math.ceil(ref * 2.2);
      const stepGuess = moneda === "USD" ? 1000 : Math.max(10_000, Math.round(ref / 150));
      const step = Math.max(1, stepGuess);
      let tMin = low;
      let tMax = Math.max(high, ref + step * 2);
      if (tMax - tMin < step * 2) tMax = tMin + step * 2;
      return { trackMin: tMin, trackMax: tMax, step };
    }
    const step = moneda === "USD" ? 5000 : 100_000;
    const tMin = 0;
    let tMax = moneda === "USD" ? 2_000_000 : 800_000_000;
    if (tMax - tMin < step * 2) tMax = tMin + step * 2;
    return { trackMin: tMin, trackMax: tMax, step };
  }, [precioReferencia, mostrarPrecio, moneda]);

  const [sliderMin, setSliderMin] = useState(trackMin);
  const [sliderMax, setSliderMax] = useState(trackMax);

  useEffect(() => {
    setSliderMin(trackMin);
    setSliderMax(trackMax);
  }, [trackMin, trackMax]);

  const precioRangoActivo = sliderMin > trackMin || sliderMax < trackMax;

  const setPrecioRango = (min: number, max: number) => {
    setSliderMin(min);
    setSliderMax(max);
  };

  const parseCantidadPersonas = (s: string): number | undefined => {
    const t = s.trim();
    if (!t) return undefined;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const buildPreferenciasApi = () => {
    const out: Parameters<typeof enviarConsulta>[0] = {
      propiedadId,
      nombre: form.nombre,
      apellido: form.apellido.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
      email: form.email.trim() || undefined,
      mensaje: form.mensaje.trim() || undefined,
    };
    if (precioRangoActivo) {
      out.prefPrecioMin = sliderMin;
      out.prefPrecioMax = sliderMax;
    }
    const persN = parseCantidadPersonas(cantidadPersonas);
    if (persN !== undefined) out.prefCantidadPersonas = persN;
    if (prefChecks.cochera) out.prefCochera = true;
    if (prefChecks.balcon) out.prefBalcon = true;
    if (prefChecks.quincho) out.prefQuincho = true;
    if (prefChecks.ascensor) out.prefAscensor = true;
    if (prefChecks.aptoProfesional) out.prefAptoProfesional = true;
    if (prefChecks.patio) out.prefPatio = true;
    if (prefChecks.jardin) out.prefJardin = true;
    if (prefChecks.pileta) out.prefPileta = true;
    if (prefChecks.mascotas) out.prefMascotas = true;
    return out;
  };

  const tienePreferenciasTexto = () => {
    if (precioRangoActivo) return true;
    if (parseCantidadPersonas(cantidadPersonas) != null) return true;
    return Object.values(prefChecks).some(Boolean);
  };

  const appendPreferenciasWhatsApp = (lines: string[]) => {
    if (!tienePreferenciasTexto()) return;
    lines.push("", "🔍 *Preferencias de búsqueda:*");
    if (precioRangoActivo) {
      const sym = moneda === "USD" ? "U$D " : "$ ";
      lines.push(
        `Rango de precio: ${sym}${sliderMin.toLocaleString("es-AR")} – ${sym}${sliderMax.toLocaleString("es-AR")}`
      );
    }
    const persN = parseCantidadPersonas(cantidadPersonas);
    if (persN != null) lines.push(`Cantidad de personas: ${persN}`);
    const am: string[] = [];
    if (prefChecks.cochera) am.push("Cochera");
    if (prefChecks.balcon) am.push("Balcón");
    if (prefChecks.quincho) am.push("Parrilla");
    if (prefChecks.ascensor) am.push("Ascensor");
    if (prefChecks.aptoProfesional) am.push("Apto profesional");
    if (prefChecks.patio) am.push("Patio");
    if (prefChecks.jardin) am.push("Jardín");
    if (prefChecks.pileta) am.push("Pileta");
    if (am.length) lines.push(`Amenities deseados: ${am.join(", ")}`);
    if (prefChecks.mascotas) lines.push("Tengo mascotas (necesito propiedad que las acepte)");
  };

  const saveProspect = async () => {
    try {
      await enviarConsulta(buildPreferenciasApi());
    } catch {
      // silently continue — the WhatsApp message is the primary action
    }
  };

  const buildWhatsAppUrl = (messageText: string) => {
    return `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(messageText)}`;
  };

  const rellenarRangoSegunPublicacion = () => {
    if (precioReferencia == null || !Number.isFinite(precioReferencia)) return;
    const low = Math.round(precioReferencia * 0.85);
    const high = Math.round(precioReferencia * 1.15);
    const lo = Math.max(trackMin, Math.min(low, trackMax - step));
    const hi = Math.min(trackMax, Math.max(high, lo + step));
    setPrecioRango(lo, hi);
  };

  const handleSolicitarVisita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    if (!cleanWhatsapp) {
      setError("Esta propiedad no tiene WhatsApp de contacto configurado.");
      return;
    }
    setLoading(true);
    setError("");

    await saveProspect();

    const nombreCompleto = `${form.nombre}${form.apellido.trim() ? " " + form.apellido : ""}`;
    const lines = [
      `Hola, me interesa coordinar una visita para ver esta propiedad:`,
      `📍 *${tituloPublico}*`,
      propUrl,
      ``,
      `👤 *Datos de contacto:*`,
      `Nombre: ${nombreCompleto}`,
    ];
    if (form.telefono.trim()) lines.push(`Teléfono: ${form.telefono}`);
    if (form.email.trim()) lines.push(`Email: ${form.email}`);
    if (form.mensaje.trim()) lines.push(``, `💬 ${form.mensaje}`);
    appendPreferenciasWhatsApp(lines);

    window.open(buildWhatsAppUrl(lines.join("\n")), "_blank");
    setSent(true);
    setLoading(false);
  };

  const handleWhatsAppConsulta = async () => {
    if (!cleanWhatsapp) return;

    if (form.nombre.trim()) {
      await saveProspect();
    }

    const nombreCompletoWA = `${form.nombre}${form.apellido.trim() ? " " + form.apellido : ""}`;
    const lines = [
      `Hola, estoy interesado/a en esta propiedad:`,
      `📍 *${tituloPublico}*`,
      propUrl,
    ];
    if (form.nombre.trim()) {
      lines.push(``, `👤 *Datos de contacto:*`, `Nombre: ${nombreCompletoWA}`);
      if (form.telefono.trim()) lines.push(`Teléfono: ${form.telefono}`);
      if (form.email.trim()) lines.push(`Email: ${form.email}`);
      if (form.mensaje.trim()) lines.push(``, `💬 ${form.mensaje}`);
      appendPreferenciasWhatsApp(lines);
    }

    window.open(buildWhatsAppUrl(lines.join("\n")), "_blank");
  };

  const togglePref = (key: keyof PrefCheck) => {
    setPrefChecks((p) => ({ ...p, [key]: !p[key] }));
  };

  if (sent) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-emerald-500 mb-3 block">check_circle</span>
        <h3 className="font-semibold text-emerald-800 mb-1">Consulta enviada</h3>
        <p className="text-sm text-emerald-600">La inmobiliaria se pondrá en contacto con vos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSolicitarVisita} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-on-surface-variant text-lg absolute left-3 top-2.5">person</span>
            <input
              type="text"
              placeholder="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-surface-container-low"
              required
            />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Apellido"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-surface-container-low"
            />
          </div>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined text-on-surface-variant text-lg absolute left-3 top-2.5">phone</span>
          <input
            type="tel"
            placeholder="Tu teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-surface-container-low"
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined text-on-surface-variant text-lg absolute left-3 top-2.5">email</span>
          <input
            type="email"
            placeholder="Tu correo electrónico"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-surface-container-low"
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined text-on-surface-variant text-lg absolute left-3 top-2.5">chat</span>
          <textarea
            placeholder="Mensaje (opcional)"
            rows={3}
            value={form.mensaje}
            onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none bg-surface-container-low"
          />
        </div>

        {/* Preferencias de búsqueda (desplegable) */}
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setPrefsOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-primary hover:bg-surface-container-high/80 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">tune</span>
              Preferencias de búsqueda
            </span>
            <span className="material-symbols-outlined text-xl transition-transform" style={{ transform: prefsOpen ? "rotate(180deg)" : undefined }}>
              expand_more
            </span>
          </button>
          {prefsOpen && (
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-outline-variant/30">
              <p className="text-xs text-on-surface-variant">
                Opcional: ayudá a la inmobiliaria a entender qué buscás además de esta propiedad.
              </p>
              {precioHint && (
                <p className="text-xs text-on-surface-variant">
                  Precio publicado: <strong className="text-on-surface">{precioHint}</strong>
                </p>
              )}
              <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-2 py-2 sm:px-3">
                <DualRangePriceSlider
                  trackMin={trackMin}
                  trackMax={trackMax}
                  step={step}
                  valueMin={sliderMin}
                  valueMax={sliderMax}
                  onChange={setPrecioRango}
                  moneda={moneda}
                  idPrefix={`contact-precio-${propiedadId}`}
                />
                {!precioRangoActivo && (
                  <p className="text-[0.7rem] text-on-surface-variant -mt-1 pb-0.5">
                    Deslizá los extremos para acotar el rango; si dejás la barra completa, no se envía preferencia de precio.
                  </p>
                )}
              </div>
              {precioReferencia != null && mostrarPrecio && (
                <button
                  type="button"
                  onClick={rellenarRangoSegunPublicacion}
                  className="text-xs text-primary font-medium underline underline-offset-2"
                >
                  Sugerir rango ±15% según esta publicación
                </button>
              )}
              <div className="flex-1">
                <label className="text-xs font-medium text-on-surface-variant block mb-1">Cantidad de personas</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Ej: 2"
                  value={cantidadPersonas}
                  onChange={(e) => setCantidadPersonas(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 text-sm bg-surface-container-low outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <p className="text-xs font-semibold text-on-surface pt-1">Amenities que me interesan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    { key: "cochera" as const, label: "Cochera" },
                    { key: "balcon" as const, label: "Balcón" },
                    { key: "quincho" as const, label: "Parrilla" },
                    { key: "ascensor" as const, label: "Ascensor" },
                    { key: "aptoProfesional" as const, label: "Apto profesional" },
                    { key: "patio" as const, label: "Patio" },
                    { key: "jardin" as const, label: "Jardín" },
                    { key: "pileta" as const, label: "Pileta" },
                  ] as const
                ).map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer text-sm rounded-lg px-2 py-1.5 hover:bg-surface-container-high/60"
                  >
                    <input
                      type="checkbox"
                      checked={prefChecks[key]}
                      onChange={() => togglePref(key)}
                      className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm rounded-lg px-2 py-1.5 hover:bg-surface-container-high/60">
                <input
                  type="checkbox"
                  checked={prefChecks.mascotas}
                  onChange={() => togglePref("mascotas")}
                  className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                />
                <span>Tengo mascotas (necesito que acepten)</span>
              </label>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary hover:shadow-lg hover:shadow-primary/30 text-white font-bold text-base rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">calendar_month</span>
          {loading ? "Enviando..." : "Solicitar visita"}
        </button>
      </form>

      {cleanWhatsapp && (
        <button
          type="button"
          onClick={handleWhatsAppConsulta}
          className="w-full flex items-center justify-center gap-2 py-4 bg-surface-container-high text-primary font-bold rounded-xl hover:bg-surface-container-highest transition-all"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Consultar por WhatsApp
        </button>
      )}
    </div>
  );
}
