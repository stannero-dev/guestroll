import { ImageResponse } from "next/og";
import { config } from "@/lib/config";
import { getT } from "@/lib/i18n/server";
import { OG_SIZE, OgLogo, ogFonts } from "@/lib/og";

export const alt = "GCX PicRoll";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const t = await getT();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#24382e", color: "#f4f1e6", fontFamily: "Bricolage Grotesque", border: "18px solid #8a5a30" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <OgLogo size={64} ring="#f4f1e6" />
          <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>{config.appName}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 0.95, letterSpacing: -3, maxWidth: 1000 }}>{t("home.title")}</div>
          <div style={{ fontSize: 30, color: "#c9d1c5", maxWidth: 900, lineHeight: 1.3 }}>{t("home.lead")}</div>
          {config.credit && <div style={{ fontSize: 26, color: "#ffd54a", fontWeight: 600 }}>{config.credit}</div>}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
