"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import type { PropiedadLista } from "@/lib/api";

interface Props {
  prop: PropiedadLista;
  className?: string;
}

export default function FavoriteButton({ prop, className = "" }: Props) {
  const { isFav, toggle } = useFavorites();
  const active = isFav(prop.id);

  return (
    <button
      type="button"
      className={`flex items-center justify-center transition-all ${className}`}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(prop);
      }}
    >
      <Heart size={18} className={active ? "fill-red-500 text-red-500" : "text-[#19152B]"} />
    </button>
  );
}
