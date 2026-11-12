import { Readable } from "node:stream";
import { apiError } from "@/lib/http";
import { getPhoto } from "@/lib/photos";
import { getEventByWallToken, wallMayShow } from "@/lib/publicWall";
import { fileMime, openPhotoStream } from "@/lib/storage/files";

/**
 * The public wall's photos: visible ones only, screen-sized copies (or a clip
 * to play), never an original. Same answer for every refusal, so ids can't be probed.
 */
export async function GET(request: Request, { params }: RouteContext<"/api/w/[token]/media/[photoId]">) {
  const { token, photoId } = await params;
  const event = getEventByWallToken(token);
  const photo = event && getPhoto(photoId);
  const asked = new URL(request.url).searchParams.get("v") ?? "display";
  if (!event || !photo || !wallMayShow(event, photo, asked)) return apiError("not_found");

  const variant = asked === "play" ? "original" : (asked as "thumb" | "display");
  const opened = await openPhotoStream(event.id, photo.id, variant, photo.mediaType);
  if (!opened) return apiError("not_found");
  return new Response(Readable.toWeb(opened.stream) as ReadableStream, {
    headers: {
      "Content-Type": fileMime(variant, photo.mediaType),
      "Content-Length": String(opened.size),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": "inline",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Robots-Tag": "noindex",
    },
  });
}
