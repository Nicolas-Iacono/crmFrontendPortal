"use client";

interface PropertyMapProps {
  query: string;
  ubicacionLabel: string;
}

export default function PropertyMap({ query, ubicacionLabel }: PropertyMapProps) {
  const encoded = encodeURIComponent(query);
  const embedSrc = `https://maps.google.com/maps?width=600&height=400&hl=es&q=${encoded}&t=&z=16&ie=UTF8&iwloc=B&output=embed`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  return (
    <div className="space-y-3">
      <div className="h-72 md:h-96 w-full rounded-2xl overflow-hidden shadow-inner border border-outline-variant/10 bg-surface-container-high">
        <iframe
          src={embedSrc}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          title={`Mapa de ${ubicacionLabel}`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant flex items-center gap-1.5 shadow-sm border border-outline-variant/10 max-w-[min(100%,360px)]">
          <span className="material-symbols-outlined text-base text-primary shrink-0">location_on</span>
          <span className="truncate">{ubicacionLabel}</span>
        </div>
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:opacity-95 transition-opacity"
        >
          <span className="material-symbols-outlined text-base">open_in_new</span>
          Abrir en Google Maps
        </a>
      </div>
    </div>
  );
}
