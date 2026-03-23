"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-bold text-slate-900">
            Tuinmo<span className="text-indigo-500">Portal</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/propiedades?operacion=VENTA" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">
            Venta
          </Link>
          <Link href="/propiedades?operacion=ALQUILER" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">
            Alquiler
          </Link>
          <Link href="/propiedades" className="text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg transition-colors">
            Buscar propiedades
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <Link href="/propiedades?operacion=VENTA" className="block text-slate-700 hover:text-indigo-600" onClick={() => setMenuOpen(false)}>
            Venta
          </Link>
          <Link href="/propiedades?operacion=ALQUILER" className="block text-slate-700 hover:text-indigo-600" onClick={() => setMenuOpen(false)}>
            Alquiler
          </Link>
          <Link href="/propiedades" className="block text-center text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg" onClick={() => setMenuOpen(false)}>
            Buscar propiedades
          </Link>
        </div>
      )}
    </header>
  );
}
