import type { CSSProperties, ReactNode } from "react";
import { readableInk } from "@/lib/color";

const HEX = /^#[0-9a-f]{6}$/i;

/** Hosts pick any color, so the text drawn on it is computed rather than assumed white. */
export function accentStyle(color: string): CSSProperties {
  if (!HEX.test(color)) return {};
  // Overrides the Tailwind tokens themselves: `--color-accent: var(--accent)` is
  // resolved once on :root, so redefining `--accent` lower down changes nothing.
  return { "--color-accent": color, "--color-accent-ink": readableInk(color) } as CSSProperties;
}

/**
 * Scopes the event's color to its pages. `guestStyle` swaps the guest page's
 * look (see `[data-guest-style]` in globals.css): the tokens change, so every
 * component follows without knowing about it.
 */
export function EventTheme({ color, children, className, guestStyle = "default" }: { color: string; children: ReactNode; className?: string; guestStyle?: string }) {
  return (
    <div style={accentStyle(color)} className={className} data-guest-style={guestStyle === "default" ? undefined : guestStyle}>
      {children}
    </div>
  );
}
