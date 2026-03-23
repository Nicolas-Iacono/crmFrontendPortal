import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Manrope } from "next/font/google";
import PortalTopNav from "@/components/PortalTopNav";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tuinmo Portal - Propiedades en Venta y Alquiler",
    template: "%s | Tuinmo Portal",
  },
  description:
    "Encontrá tu próximo hogar. Propiedades en venta y alquiler de las mejores inmobiliarias. Casas, departamentos, lotes y mas.",
  keywords: [
    "propiedades",
    "inmobiliaria",
    "venta",
    "alquiler",
    "casas",
    "departamentos",
    "argentina",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Tuinmo Portal",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${plusJakarta.variable} ${manrope.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-on-background font-body antialiased pb-20 md:pb-0">
        <PortalTopNav />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}
