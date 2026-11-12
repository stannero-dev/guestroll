import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { topLiked, withLikes } from "@/lib/likes";
import { listMessages, toMessageDto } from "@/lib/messages";
import { listPhotos, toPhotoDto } from "@/lib/photos";
import { getEventByWallToken } from "@/lib/publicWall";
import { readWallStyle } from "@/lib/wall";

/**
 * Everything the public wall shows, in one poll: its settings, the latest
 * visible photos, the most liked ones and the visible guestbook text. Photos go
 * out as anonymous DTOs (no admin fields): the wall needs ids, sizes, names.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/w/[token]">) {
  const event = getEventByWallToken((await params).token);
  if (!event) return apiError("not_found");
  const style = readWallStyle(event.wallStyle);
  const asWall = { guestId: undefined };

  const photos = listPhotos(event, "album", { status: "visible", favorite: style.favoritesOnly, limit: 60 });
  const top = style.layout === "board" ? topLiked(event.id, 5) : [];
  const messages = style.showMessages ? listMessages(event, "book", { status: "visible", limit: 30 }).filter((m) => m.text) : [];

  return NextResponse.json(
    {
      style,
      photos: withLikes(photos.map((p) => toPhotoDto(p, asWall))),
      top: top.map(({ photo, likes }) => ({ ...toPhotoDto(photo, asWall), likes })),
      messages: messages.map((m) => toMessageDto(m, {})),
    },
    { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } },
  );
}
