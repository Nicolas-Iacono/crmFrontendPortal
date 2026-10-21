import SearchBar from "@/components/SearchBar";
import PropertyCategories from "@/components/home/PropertyCategories";
import ZonaMapSection from "@/components/ZonaMapSection";
import MapDiscoveryBanner from "@/components/home/MapDiscoveryBanner";
import RecentProperties from "@/components/home/RecentProperties";
import AgencyPromo from "@/components/home/AgencyPromo";
import { fetchRecientes } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const recientes = await fetchRecientes(9).catch(() => []);

  return (
    <div className="bg-[#FBF8FF]">
      <section className="relative">
        <div className="portal-hero relative -mt-10 h-[348px] overflow-hidden rounded-b-[30px] bg-[#4E2BA5] sm:h-[372px] lg:mt-0 lg:h-auto lg:min-h-[420px] lg:rounded-b-[28px] lg:bg-cover lg:bg-center lg:px-8 lg:pb-28 lg:pt-8">
          <img
            src="/assets/portal/hero-desktop.webp"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right lg:hidden"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(62,32,140,0.94)_0%,rgba(78,43,165,0.72)_30%,rgba(78,43,165,0.28)_48%,transparent_66%)] lg:hidden" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#4E2BA5]/35 to-transparent lg:hidden" />
          <div className="pointer-events-none absolute -left-10 top-6 h-36 w-36 rounded-full bg-[#8957F5]/30 blur-3xl lg:hidden" />
          <div className="pointer-events-none absolute bottom-6 left-[18%] h-24 w-40 rounded-[50%] bg-[#6937DD]/25 blur-2xl lg:hidden" />
          <div className="relative z-10 px-5 pt-16 sm:px-6 sm:pt-[68px] lg:mx-auto lg:max-w-[1280px] lg:px-0 lg:pt-8">
            <h1 className="max-w-[8.6em] text-[30px] font-extrabold leading-[1.05] text-white min-[390px]:text-[33px] lg:max-w-xl lg:text-5xl">
              <span className="block">Encontrá tu</span>
              <span className="block">próximo hogar</span>
            </h1>
            <p className="mt-2 max-w-[15.2rem] text-[13px] leading-snug text-white/80 min-[390px]:text-sm lg:mt-3 lg:max-w-md lg:text-base">
              Explorá propiedades en venta y alquiler
              <br className="hidden lg:block" />
              de las mejores inmobiliarias.
            </p>
          </div>
        </div>
        <div className="relative z-20 mx-auto -mt-[144px] w-full max-w-[1280px] px-4 sm:-mt-[132px] lg:-mt-[176px]">
          <SearchBar />
        </div>
      </section>

      <PropertyCategories />
      <div className="mt-8">
        <ZonaMapSection />
      </div>
      <MapDiscoveryBanner />
      <RecentProperties propiedades={recientes} />
      <AgencyPromo />

      <style>{`
        @media (min-width: 1024px) {
          .portal-hero {
            background-image: linear-gradient(90deg, rgba(78,43,165,.55), rgba(78,43,165,.12)), url('/assets/portal/hero-desktop.webp') !important;
            background-position: center !important;
          }
        }
      `}</style>
    </div>
  );
}
