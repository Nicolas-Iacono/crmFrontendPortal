import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-32 text-center font-body">
      <span className="material-symbols-outlined text-7xl text-primary mb-4 block">explore_off</span>
      <h1 className="text-6xl font-extrabold text-primary mb-4 font-headline">404</h1>
      <h2 className="text-xl font-bold text-on-surface mb-2">Página no encontrada</h2>
      <p className="text-on-surface-variant mb-8">
        La propiedad que buscás no existe o fue removida.
      </p>
      <Link
        href="/propiedades"
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-full transition-colors"
      >
        <span className="material-symbols-outlined text-lg">search</span>
        Buscar propiedades
      </Link>
    </div>
  );
}
