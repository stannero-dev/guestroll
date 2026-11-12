import "server-only";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { photoLikes, photos, type PhotoRow } from "@/lib/db/schema";
import type { PhotoDto } from "@/lib/photos";

/** How many likes each of these photos has; photos without any are absent. */
export function likeCounts(photoIds: string[]): Map<string, number> {
  if (photoIds.length === 0) return new Map();
  const rows = getDb()
    .select({ photoId: photoLikes.photoId, n: count() })
    .from(photoLikes)
    .where(inArray(photoLikes.photoId, photoIds))
    .groupBy(photoLikes.photoId)
    .all();
  return new Map(rows.map((r) => [r.photoId, r.n]));
}

/** Which of these photos this guest liked. */
export function likedBy(photoIds: string[], guestId: string | undefined): Set<string> {
  if (!guestId || photoIds.length === 0) return new Set();
  const rows = getDb()
    .select({ photoId: photoLikes.photoId })
    .from(photoLikes)
    .where(and(eq(photoLikes.guestId, guestId), inArray(photoLikes.photoId, photoIds)))
    .all();
  return new Set(rows.map((r) => r.photoId));
}

/** Adds the like counts, and whether this guest liked each photo, to a page of DTOs. */
export function withLikes<T extends PhotoDto>(dtos: T[], guestId?: string): T[] {
  const ids = dtos.map((d) => d.id);
  const counts = likeCounts(ids);
  const mine = likedBy(ids, guestId);
  return dtos.map((d) => ({ ...d, likes: counts.get(d.id) ?? 0, liked: mine.has(d.id) }));
}

/** Idempotent either way: liking twice is one like, unliking a photo never liked is a no-op. */
export function setLike(photo: Pick<PhotoRow, "id" | "eventId">, guestId: string, liked: boolean): number {
  const db = getDb();
  if (liked) db.insert(photoLikes).values({ photoId: photo.id, guestId, eventId: photo.eventId }).onConflictDoNothing().run();
  else db.delete(photoLikes).where(and(eq(photoLikes.photoId, photo.id), eq(photoLikes.guestId, guestId))).run();
  return likeCounts([photo.id]).get(photo.id) ?? 0;
}

/** The event's most liked visible photos, most liked first; ties go to the earlier photo. */
export function topLiked(eventId: string, limit = 5): { photo: PhotoRow; likes: number }[] {
  const n = count(photoLikes.guestId);
  return getDb()
    .select({ photo: photos, likes: n })
    .from(photoLikes)
    .innerJoin(photos, eq(photos.id, photoLikes.photoId))
    .where(and(eq(photoLikes.eventId, eventId), eq(photos.status, "visible")))
    .groupBy(photos.id)
    .orderBy(desc(n), photos.createdAt)
    .limit(Math.min(Math.max(limit, 1), 20))
    .all();
}
