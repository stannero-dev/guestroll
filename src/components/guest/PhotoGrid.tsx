"use client";

/* eslint-disable @next/next/no-img-element -- photos come from an auth-checked route, not a static asset */
import { Clock, Copy, Focus, Heart, Play, Star } from "lucide-react";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/components/ui";
import type { PhotoDto } from "@/lib/photos";

export const mediaUrl = (id: string, variant: "thumb" | "display" | "original" | "play", download = false) =>
  `/api/media/${id}?v=${variant}${download ? "&download=1" : ""}`;

/** `0:42`, `1:05`: a clip is never long enough to need hours. */
export function formatDuration(ms: number): string {
  const seconds = Math.max(Math.round(ms / 1000), 1);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

interface PhotoGridProps {
  photos: PhotoDto[];
  onOpen?: (index: number) => void;
  selected?: ReadonlySet<string>;
  onToggle?: (id: string) => void;
  /** With `onToggle`, where a click selects: a video then gets its own play button. */
  onPlay?: (index: number) => void;
  /** The shared album: guests like the others' photos, and see how many likes their own got. */
  onLike?: (photo: PhotoDto) => void;
  /** `prints`: white-bordered prints for guests. `sheet`: a tight contact sheet for admins. */
  variant?: "prints" | "sheet";
  className?: string;
}

export function PhotoGrid({ photos, onOpen, selected, onToggle, onPlay, onLike, variant = "prints", className }: PhotoGridProps) {
  const t = useT();
  const sheet = variant === "sheet";
  return (
    <ul
      role="list"
      className={cn(sheet ? "grid grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-8" : "grid grid-cols-3 gap-3 sm:grid-cols-4", className)}
    >
      {photos.map((photo, index) => {
        const isSelected = selected?.has(photo.id) ?? false;
        return (
          <li key={photo.id} className={cn("relative", !sheet && "print")}>
            <button
              type="button"
              onClick={() => (onToggle ? onToggle(photo.id) : onOpen?.(index))}
              aria-pressed={onToggle ? isSelected : undefined}
              aria-label={photo.guestName ?? t("admin.anonymous")}
              className="block aspect-square w-full overflow-hidden bg-sunken focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ink"
            >
              <img
                src={mediaUrl(photo.id, "thumb")}
                alt=""
                loading="lazy"
                decoding="async"
                className={cn("size-full object-cover", photo.status === "hidden" && "opacity-30 grayscale")}
              />
            </button>
            {photo.video &&
              (onPlay ? (
                <button
                  type="button"
                  onClick={() => onPlay(index)}
                  className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-xs font-semibold text-white tabular-nums hover:bg-black focus-visible:outline-2 focus-visible:outline-white"
                >
                  <Play className="size-3.5 fill-current" aria-hidden />
                  <span className="sr-only">{t("admin.moderation.watch")}</span>
                  {formatDuration(photo.video.durationMs)}
                </button>
              ) : (
                <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums">
                  <Play className="size-3 fill-current" aria-label={t("guest.video")} />
                  {formatDuration(photo.video.durationMs)}
                </span>
              ))}
            {onLike && photo.status === "visible" && <LikeBadge photo={photo} onLike={onLike} />}
            {isSelected && <span className="pointer-events-none absolute inset-0 ring-4 ring-accent ring-inset" />}
            {photo.favorite && (
              <span className="pointer-events-none absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-accent text-accent-ink shadow-sm" title={t("admin.moderation.favorite")}>
                <Star className="size-3.5 fill-current" aria-label={t("admin.moderation.favorite")} />
              </span>
            )}
            {(photo.blurry || photo.duplicateOf) && (
              <span className="pointer-events-none absolute right-1 bottom-1 flex gap-1">
                {photo.blurry && (
                  <span className="grid size-6 place-items-center rounded-full bg-surface text-ink shadow-sm" title={t("admin.moderation.blurryBadge")}>
                    <Focus className="size-3.5" aria-label={t("admin.moderation.blurryBadge")} />
                  </span>
                )}
                {photo.duplicateOf && (
                  <span className="grid size-6 place-items-center rounded-full bg-surface text-ink shadow-sm" title={t("admin.moderation.duplicateBadge")}>
                    <Copy className="size-3.5" aria-label={t("admin.moderation.duplicateBadge")} />
                  </span>
                )}
              </span>
            )}
            {photo.status === "pending" && (
              <span
                className={cn("pointer-events-none absolute grid size-6 place-items-center rounded-full bg-surface text-ink shadow-sm", sheet ? "top-1 left-1" : "top-2.5 left-2.5")}
                title={t("guest.pendingReview")}
              >
                <Clock className="size-3.5" aria-label={t("guest.pendingReview")} />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** A heart and its count on a print: a button on the others' photos, a plain count on one's own. */
function LikeBadge({ photo, onLike }: { photo: PhotoDto; onLike: (photo: PhotoDto) => void }) {
  const t = useT();
  const likes = photo.likes ?? 0;
  const shape = "absolute right-2 bottom-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums shadow-sm";
  if (photo.mine) {
    if (likes === 0) return null;
    return (
      <span className={cn(shape, "pointer-events-none bg-surface text-ink")} aria-label={t("guest.likeCount", { count: likes })}>
        <Heart className="size-3.5 fill-current text-danger" aria-hidden />
        {likes}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onLike(photo)}
      aria-pressed={photo.liked ?? false}
      aria-label={photo.liked ? t("guest.unlike") : t("guest.like")}
      className={cn(shape, "min-h-8 min-w-8 justify-center bg-surface text-ink active:scale-90 focus-visible:outline-2 focus-visible:outline-ink", "transition-transform")}
    >
      <Heart className={cn("size-4", photo.liked && "fill-current text-danger")} aria-hidden />
      {likes > 0 && likes}
    </button>
  );
}
