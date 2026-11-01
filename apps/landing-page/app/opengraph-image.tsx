import { ImageResponse } from "next/og";
import { site } from "../content/site";

// Dibuat saat build (statis) — tanpa fetch eksternal.
export const alt = `${site.brand} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)",
        color: "#ffffff",
      }}
    >
      <div style={{ fontSize: 40, opacity: 0.9, display: "flex" }}>{site.brand}</div>
      <div
        style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1, marginTop: 24, display: "flex" }}
      >
        {site.tagline}
      </div>
      <div style={{ fontSize: 32, opacity: 0.9, marginTop: 32, display: "flex" }}>
        {site.hero.eyebrow}
      </div>
    </div>,
    size,
  );
}
