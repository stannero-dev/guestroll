"use client";

import { createContext, useContext } from "react";
import { mediaUrl } from "@/components/guest/PhotoGrid";
import type { MessageDto } from "@/lib/messages";
import type { PhotoDto } from "@/lib/photos";
import type { WallStyle } from "@/lib/wall";

/**
 * Where a live wall reads from: the admin APIs in a signed-in browser, or the
 * public wall link (`/w/<token>`), which needs no sign-in and sees the same
 * approved photos, read only.
 */
export type WallSource = { kind: "admin"; eventId: string } | { kind: "public"; token: string };

export interface WallData {
  photos: PhotoDto[];
  top: PhotoDto[];
  messages: MessageDto[];
}

const json = async <T,>(url: string): Promise<T | null> => {
  const res = await fetch(url).catch(() => null);
  return res?.ok ? ((await res.json()) as T) : null;
};

/** One poll of what the wall shows; null when the source can't be reached (the wall keeps what it has). */
export async function fetchWallData(source: WallSource, style: WallStyle): Promise<WallData | null> {
  if (source.kind === "public") {
    const data = await json<WallData & { style: WallStyle }>(`/api/w/${source.token}`);
    return data && { photos: data.photos, top: data.top, messages: data.messages };
  }
  const base = `/api/admin/events/${source.eventId}`;
  const listed = await json<{ photos: PhotoDto[] }>(`${base}/photos?status=visible${style.favoritesOnly ? "&favorites=1" : ""}`);
  if (!listed) return null;
  const top = style.layout === "board" ? ((await json<{ photos: PhotoDto[] }>(`${base}/photos/top?limit=5`))?.photos ?? []) : [];
  const messages = style.showMessages ? ((await json<{ messages: MessageDto[] }>(`${base}/messages?status=visible`))?.messages ?? []).filter((m) => m.text).slice(0, 30) : [];
  return { photos: listed.photos.slice(0, 60), top, messages };
}

/** The wall's current settings, so a change made in the admin reaches an open wall without a reload. */
export async function fetchWallStyle(source: WallSource): Promise<WallStyle | null> {
  if (source.kind === "public") return (await json<{ style: WallStyle }>(`/api/w/${source.token}`))?.style ?? null;
  return (await json<{ event: { wallStyle: WallStyle } }>(`/api/admin/events/${source.eventId}`))?.event.wallStyle ?? null;
}

export const wallQrUrl = (source: WallSource) =>
  source.kind === "public" ? `/api/w/${source.token}/qr` : `/api/admin/events/${source.eventId}/qr?format=svg`;

type Media = (id: string, variant: "thumb" | "display" | "play") => string;

const MediaContext = createContext<Media>((id, variant) => mediaUrl(id, variant));

/** Photo URLs for the wall's source: the guarded media route, or the public wall's own. */
export function WallMediaProvider({ source, children }: { source: WallSource; children: React.ReactNode }) {
  const media: Media = source.kind === "public" ? (id, variant) => `/api/w/${source.token}/media/${id}?v=${variant}` : (id, variant) => mediaUrl(id, variant);
  return <MediaContext.Provider value={media}>{children}</MediaContext.Provider>;
}

export const useWallMedia = () => useContext(MediaContext);
