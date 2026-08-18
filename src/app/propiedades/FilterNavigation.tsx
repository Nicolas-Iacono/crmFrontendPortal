"use client";

import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type FilterNavContextValue = {
  isPending: boolean;
  navigate: (href: string) => void;
};

const FilterNavContext = createContext<FilterNavContextValue | null>(null);

export function FilterNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  return (
    <FilterNavContext.Provider value={{ isPending, navigate }}>
      {children}
    </FilterNavContext.Provider>
  );
}

export function useFilterNav() {
  const ctx = useContext(FilterNavContext);
  if (!ctx) {
    throw new Error("useFilterNav debe usarse dentro de FilterNavProvider");
  }
  return ctx;
}

export function ListingsPendingOverlay() {
  const { isPending } = useFilterNav();
  if (!isPending) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-start justify-center bg-surface-container-lowest/75 backdrop-blur-[2px] rounded-lg pt-24 sm:pt-32"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 bg-white/95 px-8 py-6 rounded-2xl shadow-lg border border-outline-variant/30">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold text-on-surface">Cargando propiedades...</p>
      </div>
    </div>
  );
}
