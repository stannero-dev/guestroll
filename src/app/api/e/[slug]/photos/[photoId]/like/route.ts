import { NextResponse } from "next/server";
import { ensureGuestId, getGuestSession } from "@/lib/auth/session";
import { getViewer } from "@/lib/auth/viewer";
import { getEventBySlug } from "@/lib/events";
import { apiError, rateLimited } from "@/lib/http";
import { setLike } from "@/lib/likes";
import { getPhoto } from "@/lib/photos";
import { albumShared, canEnterEvent } from "@/lib/policy";
import { limiters } from "@/lib/security/limiters";
import { clientIp, isSameOrigin } from "@/lib/security/request";

type Context = RouteContext<"/api/e/[slug]/photos/[photoId]/like">;

/**
 * A guest likes (POST) or unlikes (DELETE) a photo of the shared album. Only
 * photos the guest can already see there: visible ones, while the hosts share
 * the album. One like per guest and photo, and never on one's own photo, so the
 * ranking says what the room thinks.
 */
async function like(request: Request, { params }: Context, liked: boolean) {
  if (!isSameOrigin(request)) return apiError("forbidden");
  const { slug, photoId } = await params;
  const event = getEventBySlug(slug);
  if (!event) return apiError("not_found");
  const viewer = await getViewer();
  if (!canEnterEvent(event, viewer) || !albumShared(event)) return apiError("forbidden");

  const photo = getPhoto(photoId);
  // Same answer for "not in this event", "not visible" and "doesn't exist": ids must not be probeable.
  if (!photo || photo.eventId !== event.id || photo.status !== "visible") return apiError("not_found");

  const session = await getGuestSession();
  const guestId = ensureGuestId(session);
  if (photo.guestId === guestId) return apiError("forbidden");

  const limit = limiters.like.consume(guestId);
  if (!limit.allowed) return rateLimited(limit.retryAfterMs);
  // The guest id is only a cookie: this holds for a client that drops it to like again.
  const ip = clientIp(request);
  const perIp = ip === "direct" ? null : limiters.likePerIp.consume(ip);
  if (perIp && !perIp.allowed) return rateLimited(perIp.retryAfterMs);

  await session.save();
  return NextResponse.json({ likes: setLike(photo, guestId, liked), liked }, { headers: { "Cache-Control": "private, no-store" } });
}

export const POST = (request: Request, context: Context) => like(request, context, true);
export const DELETE = (request: Request, context: Context) => like(request, context, false);
