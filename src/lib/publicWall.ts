import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { events, type EventRow, type PhotoRow } from "@/lib/db/schema";
import { randomToken } from "@/lib/security/ids";

/*
 * The public live wall: a secret link (`/w/<token>`) that shows the wall
 * without signing in, for a projector or TVs run by people without an admin
 * account. It shows exactly what the signed-in wall shows, and nothing else:
 * visible photos (display copies, never originals), visible guestbook text,
 * the ranking and the guest QR code. It can't change anything.
 */

/** Turns the public wall on, or gives it a new link: the previous one stops working at once. */
export function newWallToken(eventId: string): string {
  // 32 characters over 31 symbols: ~158 bits, far beyond guessing.
  const token = randomToken(32);
  getDb().update(events).set({ wallToken: token }).where(eq(events.id, eventId)).run();
  return token;
}

export function disablePublicWall(eventId: string): void {
  getDb().update(events).set({ wallToken: null }).where(eq(events.id, eventId)).run();
}

const TOKEN = /^[a-z0-9]{32}$/;

/** The event whose public wall this token opens, if the link is current. */
export function getEventByWallToken(token: string): EventRow | undefined {
  if (!TOKEN.test(token)) return undefined;
  return getDb().select().from(events).where(eq(events.wallToken, token)).get();
}

/** What a public wall may stream: the event's visible photos, their screen-sized copies, a clip's file to play. */
export function wallMayShow(event: Pick<EventRow, "id">, photo: Pick<PhotoRow, "eventId" | "status" | "mediaType">, variant: string): boolean {
  if (photo.eventId !== event.id || photo.status !== "visible") return false;
  if (variant === "play") return photo.mediaType !== null;
  return variant === "thumb" || variant === "display";
}
