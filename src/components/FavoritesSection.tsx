"use client";

import { useFavorites } from "@/lib/useFavorites";
import HomeListCard from "./HomeListCard";

export default function FavoritesSection() {
  const { favorites } = useFavorites();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-24 md:pb-20">
      <div className="mb-8 md:mb-10">
        <h1 className="font-headline font-extrabold text-3xl sm:text-4xl text-on-surface tracking-tight mb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500 filled text-3xl sm:text-4xl">favorite</span>
          Favoritas
        </h1>
        <p className="text-on-surface-variant font-body">
          {favorites.length === 0
            ? "Todavía no guardaste propiedades."
            : favorites.length === 1
              ? "1 propiedad guardada"
              : `${favorites.length} propiedades guardadas`}
        </p>
      </div>

      {favorites.length === 0 ? (
        <p className="text-sm text-on-surface-variant font-body">
          Tocá el corazón de una publicación para verla acá.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((p) => (
            <HomeListCard key={p.id} prop={p} />
          ))}
        </div>
      )}
    </section>
  );
}
