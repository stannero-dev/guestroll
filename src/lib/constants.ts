// Shared by server and browser code: no env reads, no Node imports here.
export const LOCALES = ["en", "fr", "it", "es", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const CAPTURE_MODES = ["camera", "picker", "both"] as const;
export type CaptureMode = (typeof CAPTURE_MODES)[number];

/** How the guest page looks: the default paper, or a classroom chalkboard. */
export const GUEST_STYLES = ["default", "chalkboard"] as const;
export type GuestStyle = (typeof GUEST_STYLES)[number];
