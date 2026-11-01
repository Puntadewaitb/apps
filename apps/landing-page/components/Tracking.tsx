import Script from "next/script";
import { gaInit, gaSrc, pixelInit, trackingConfig } from "../lib/tracking";

/** GA4 / Meta Pixel — tidak merender apa pun bila env tidak diisi. */
export function Tracking() {
  const { ga, pixel } = trackingConfig();
  return (
    <>
      {ga && (
        <>
          <Script id="ga-src" src={gaSrc(ga)} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {gaInit(ga)}
          </Script>
        </>
      )}
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {pixelInit(pixel)}
        </Script>
      )}
    </>
  );
}
