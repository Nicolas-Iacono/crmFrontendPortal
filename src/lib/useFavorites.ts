"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PropiedadLista } from "./api";

const STORAGE_KEY = "tuinmo_favorites";

type FavMap = Record<number, PropiedadLista>;

const EMPTY: FavMap = {};
let cached: FavMap = EMPTY;

function readStore(): FavMap {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavMap) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeStore(map: FavMap) {
  cached = map;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event("favorites-changed"));
}

function subscribe(cb: () => void) {
  window.addEventListener("favorites-changed", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("favorites-changed", cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): FavMap {
  const fresh = readStore();
  if (JSON.stringify(fresh) !== JSON.stringify(cached)) {
    cached = fresh;
  }
  return cached;
}

function getServerSnapshot(): FavMap {
  return EMPTY;
}

export function useFavorites() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isFav = useCallback((id: number) => id in store, [store]);

  const toggle = useCallback((prop: PropiedadLista) => {
    const current = readStore();
    if (prop.id in current) {
      const { [prop.id]: _, ...rest } = current;
      writeStore(rest);
    } else {
      writeStore({ ...current, [prop.id]: prop });
    }
  }, []);

  const favorites = Object.values(store);

  return { favorites, isFav, toggle };
}
