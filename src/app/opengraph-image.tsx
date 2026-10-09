import { BRAND } from "@/lib/brand";
import { ImageResponse } from "next/og";
import { it } from "@/lib/i18n/dict";

export const alt = it.meta.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #6366f1 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 36, fontWeight: 700 }}>
          <div style={{ display: "flex", width: 64, height: 64, borderRadius: 16, background: "#fbbf24", color: "#1e1b4b", alignItems: "center", justifyContent: "center", fontSize: 40 }}>⚡</div>
          {BRAND}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Preventivi professionali in PDF in 60 secondi</div>
          <div style={{ fontSize: 30, opacity: 0.9 }}>Rivalsa INPS · Ritenuta d&apos;acconto · Forfettario · Bozza con AI · Nessuna registrazione</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, opacity: 0.8 }}>preventivolampo · PDF puliti da 4,90 € · Pro da 9 €/mese</div>
      </div>
    ),
    { ...size },
  );
}
