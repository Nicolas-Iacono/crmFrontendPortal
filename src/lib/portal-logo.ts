/**
 * Logo del header del portal.
 * Definí `NEXT_PUBLIC_PORTAL_LOGO_URL` en `.env.local` (URL pública o firmada de Supabase Storage).
 * Si no está definida, se usa `/playstore.png` desde `public/`.
 */
export const PORTAL_LOGO_SRC =
  process.env.NEXT_PUBLIC_PORTAL_LOGO_URL?.trim() || "/playstore.png";
