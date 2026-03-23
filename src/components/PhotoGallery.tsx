"use client";

import Image from "next/image";
import { useState } from "react";

export default function PhotoGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState(false);
  const [selected, setSelected] = useState(0);

  if (!images.length) return null;

  const extraCount = images.length > 4 ? images.length - 4 : 0;

  return (
    <>
      <section className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[350px] sm:h-[450px] md:h-[550px] mb-12">
        {/* Main large image */}
        <div
          className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-2xl group cursor-pointer bg-surface-container-high"
          onClick={() => { setSelected(0); setLightbox(true); }}
        >
          <Image
            src={images[0]}
            alt="Foto principal"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {images.length === 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">
              1 foto
            </div>
          )}
        </div>

        {/* Top-right image */}
        {images[1] && (
          <div
            className="hidden md:block md:col-span-2 overflow-hidden rounded-2xl group cursor-pointer bg-surface-container-high"
            onClick={() => { setSelected(1); setLightbox(true); }}
          >
            <Image
              src={images[1]}
              alt="Foto 2"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105 !relative w-full h-full"
              sizes="50vw"
            />
          </div>
        )}

        {/* Bottom-right first */}
        {images[2] && (
          <div
            className="hidden md:block overflow-hidden rounded-2xl group cursor-pointer bg-surface-container-high"
            onClick={() => { setSelected(2); setLightbox(true); }}
          >
            <Image
              src={images[2]}
              alt="Foto 3"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105 !relative w-full h-full"
              sizes="25vw"
            />
          </div>
        )}

        {/* Bottom-right last with overlay */}
        {images[3] && (
          <div
            className="hidden md:block relative overflow-hidden rounded-2xl group cursor-pointer bg-surface-container-high"
            onClick={() => { setSelected(3); setLightbox(true); }}
          >
            <Image
              src={images[3]}
              alt="Foto 4"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105 !relative w-full h-full"
              sizes="25vw"
            />
            {extraCount > 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <span className="text-white font-bold text-lg">+{extraCount} Fotos</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
            onClick={() => setLightbox(false)}
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium z-10">
            {selected + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white/80 hover:text-white z-10 p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((s) => (s > 0 ? s - 1 : images.length - 1));
                }}
              >
                <span className="material-symbols-outlined text-4xl">chevron_left</span>
              </button>
              <button
                className="absolute right-4 text-white/80 hover:text-white z-10 p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((s) => (s < images.length - 1 ? s + 1 : 0));
                }}
              >
                <span className="material-symbols-outlined text-4xl">chevron_right</span>
              </button>
            </>
          )}

          <div className="relative w-full max-w-5xl aspect-[16/10] mx-4" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[selected]}
              alt={`Foto ${selected + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div
              className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === selected ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image src={img} alt={`Miniatura ${i + 1}`} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
