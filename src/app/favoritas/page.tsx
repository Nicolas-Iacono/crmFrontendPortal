import type { Metadata } from "next";
import FavoritesSection from "@/components/FavoritesSection";

export const metadata: Metadata = {
  title: "Favoritas",
  description: "Propiedades que guardaste en Tuinmo Portal.",
};

export default function FavoritasPage() {
  return <FavoritesSection />;
}
