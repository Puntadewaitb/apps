/**
 * Tracking opsional: GA4 & Meta Pixel aktif HANYA bila env diisi dan formatnya valid.
 * ID divalidasi ketat karena disisipkan ke skrip inline (cegah injeksi).
 */
export const GA_ID_RE = /^G-[A-Z0-9]{4,20}$/;
export const PIXEL_ID_RE = /^\d{8,20}$/;

export type TrackingConfig = { ga?: string; pixel?: string };

export function trackingConfig(
  env: Record<string, string | undefined> = process.env,
): TrackingConfig {
  const ga = env.NEXT_PUBLIC_GA_ID?.trim();
  const pixel = env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  return {
    ga: ga && GA_ID_RE.test(ga) ? ga : undefined,
    pixel: pixel && PIXEL_ID_RE.test(pixel) ? pixel : undefined,
  };
}

/** Origin tambahan untuk CSP; kosong bila tracking mati (CSP tetap ketat). */
export function trackingCsp(cfg: TrackingConfig) {
  const scriptSrc: string[] = [];
  const connectSrc: string[] = [];
  const imgSrc: string[] = [];
  if (cfg.ga) {
    scriptSrc.push("https://www.googletagmanager.com");
    connectSrc.push(
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
    );
    imgSrc.push("https://www.googletagmanager.com", "https://www.google-analytics.com");
  }
  if (cfg.pixel) {
    scriptSrc.push("https://connect.facebook.net");
    connectSrc.push("https://www.facebook.com", "https://connect.facebook.net");
    imgSrc.push("https://www.facebook.com");
  }
  return { scriptSrc, connectSrc, imgSrc };
}

export const gaSrc = (id: string) =>
  `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;

export const gaInit = (id: string) =>
  `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`;

export const pixelInit = (id: string) =>
  `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;
