import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-12 px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto mt-12 md:mt-20 border-t border-slate-200 font-body text-sm text-slate-500">
      <div className="mb-8 md:mb-0 text-center md:text-left">
        <span className="text-xl font-black text-[#532ba8] font-headline block mb-4 italic">Tuinmo</span>
        <p className="max-w-xs mx-auto md:mx-0">
          Portal inmobiliario. Propiedades publicadas por inmobiliarias que usan Tuinmo CRM.
        </p>
        <p className="mt-2 text-xs">&copy; {new Date().getFullYear()} Tuinmo. Todos los derechos reservados.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        <Link href="/propiedades" className="hover:text-[#532ba8] hover:underline decoration-2 underline-offset-4 transition-opacity">
          Propiedades
        </Link>
        <a href="https://tuinmo.net" target="_blank" rel="noopener noreferrer" className="hover:text-[#532ba8] hover:underline decoration-2 underline-offset-4">
          Privacidad
        </a>
        <a href="https://tuinmo.net" target="_blank" rel="noopener noreferrer" className="hover:text-[#532ba8] hover:underline decoration-2 underline-offset-4">
          Términos
        </a>
        <Link href="/inmobiliarias" className="hover:text-[#532ba8] hover:underline decoration-2 underline-offset-4">
          Inmobiliarias
        </Link>
      </div>
    </footer>
  );
}
