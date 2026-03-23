"use client";

import { useState } from "react";
import { enviarConsulta } from "@/lib/api";

export interface ContactFormProps {
  propiedadId: number;
  whatsapp?: string | null;
  slug: string;
  tituloPublico: string;
}

export default function ContactForm({ propiedadId, whatsapp, slug, tituloPublico }: ContactFormProps) {
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", mensaje: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const portalUrl = typeof window !== "undefined" ? window.location.origin : "";
  const propUrl = `${portalUrl}/propiedad/${slug}`;
  const cleanWhatsapp = whatsapp?.replace(/\D/g, "") || "";

  const saveProspect = async () => {
    try {
      await enviarConsulta({ propiedadId, ...form });
    } catch {
      // silently continue — the WhatsApp message is the primary action
    }
  };

  const buildWhatsAppUrl = (messageText: string) => {
    return `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(messageText)}`;
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

    const lines = [
      `Hola, me interesa coordinar una visita para ver esta propiedad:`,
      `📍 *${tituloPublico}*`,
      propUrl,
      ``,
      `👤 *Datos de contacto:*`,
      `Nombre: ${form.nombre}`,
    ];
    if (form.telefono.trim()) lines.push(`Teléfono: ${form.telefono}`);
    if (form.email.trim()) lines.push(`Email: ${form.email}`);
    if (form.mensaje.trim()) lines.push(``, `💬 ${form.mensaje}`);

    window.open(buildWhatsAppUrl(lines.join("\n")), "_blank");
    setSent(true);
    setLoading(false);
  };

  const handleWhatsAppConsulta = async () => {
    if (!cleanWhatsapp) return;

    if (form.nombre.trim()) {
      await saveProspect();
    }

    const lines = [
      `Hola, estoy interesado/a en esta propiedad:`,
      `📍 *${tituloPublico}*`,
      propUrl,
    ];
    if (form.nombre.trim()) {
      lines.push(``, `👤 *Datos de contacto:*`, `Nombre: ${form.nombre}`);
      if (form.telefono.trim()) lines.push(`Teléfono: ${form.telefono}`);
      if (form.email.trim()) lines.push(`Email: ${form.email}`);
      if (form.mensaje.trim()) lines.push(``, `💬 ${form.mensaje}`);
    }

    window.open(buildWhatsAppUrl(lines.join("\n")), "_blank");
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
        <div className="relative">
          <span className="material-symbols-outlined text-on-surface-variant text-lg absolute left-3 top-2.5">person</span>
          <input
            type="text"
            placeholder="Tu nombre *"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-surface-container-low"
            required
          />
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
