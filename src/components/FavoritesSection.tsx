"use client";

import { useFavorites } from "@/lib/useFavorites";
import PropertyCard from "./PropertyCard";

export default function FavoritesSection() {
  const { favorites } = useFavorites();

  if (favorites.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 md:py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500 filled">favorite</span>
            Tus favoritas
          </h2>
          <p className="text-sm text-on-surface-variant mt-1 font-body">
            {favorites.length === 1
              ? "1 propiedad guardada"
              : `${favorites.length} propiedades guardadas`}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {favorites.map((p) => (
          <PropertyCard key={p.id} prop={p} />
        ))}
      </div>
    </section>
  );
}
