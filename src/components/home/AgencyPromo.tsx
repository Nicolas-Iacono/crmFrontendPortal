import { MessageCircle, Search, ShieldCheck } from "lucide-react";

const BENEFICIOS = [
  { titulo: "Propiedades del CRM", texto: "Publicadas por inmobiliarias que usan Tuinmo.", Icono: ShieldCheck },
  { titulo: "Contacto directo", texto: "Comunicate por WhatsApp.", Icono: MessageCircle },
  { titulo: "Búsqueda inteligente", texto: "Filtrá por zona, precio y tipo.", Icono: Search },
];

export default function AgencyPromo() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div
        className="overflow-hidden rounded-[24px] bg-[#4E2BA5] bg-cover bg-center text-white"
        style={{ backgroundImage: "linear-gradient(100deg, rgba(78,43,165,.92), rgba(105,55,221,.78)), url('/assets/portal/cta-inmobiliarias.webp')" }}
      >
        <div className="grid gap-6 px-5 py-8 lg:grid-cols-2 lg:px-10 lg:py-12">
          <div>
            <h2 className="max-w-md text-3xl font-extrabold leading-tight">Un portal para inmobiliarias reales</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
              Propiedades publicadas por inmobiliarias que utilizan Tuinmo CRM. Información actualizada desde cada inmobiliaria.
            </p>
            <a
              href="https://tuinmo.net"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-[#4E2BA5]"
            >
              Conocé Tuinmo
            </a>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3 lg:content-center">
            {BENEFICIOS.map(({ titulo, texto, Icono }) => (
              <li key={titulo} className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <Icono size={22} />
                <p className="mt-2 text-sm font-bold">{titulo}</p>
                <p className="mt-1 text-xs leading-snug text-white/80">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
