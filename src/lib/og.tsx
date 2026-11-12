import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_COLORS = { paper: "#f2f3f0", ink: "#1a1b1d", muted: "#63676b", stamp: "#ff6a13" };

const fontsDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "assets", "fonts");

type OgFont = { name: string; data: Buffer; weight: 400 | 600 | 800; style: "normal" };
let fonts: Promise<OgFont[]> | undefined;

/** Loaded once per process: next/og needs the raw font files on every render. */
export function ogFonts() {
  fonts ??= Promise.all(
    ([400, 600, 800] as const).map(async (weight) => ({
      name: "Bricolage Grotesque",
      data: await fs.readFile(path.join(fontsDir, `BricolageGrotesque-${weight}.woff`)),
      weight,
      style: "normal" as const,
    })),
  );
  return fonts;
}

/** The shutter logo, drawn inline so the image needs no other asset. */
export function OgLogo({ size, ring = OG_COLORS.ink, lens = "#ffc72c" }: { size: number; ring?: string; lens?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512">
      <g transform="rotate(-8 256 256)">
        <rect x="104" y="72" width="304" height="368" rx="22" fill="none" stroke={ring} strokeWidth="40" />
        <rect x="150" y="118" width="212" height="196" rx="8" fill={lens} />
      </g>
    </svg>
  );
}
