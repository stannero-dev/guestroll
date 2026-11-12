import { NextResponse } from "next/server";
import { requireEventAdmin } from "@/lib/http";
import { topLiked } from "@/lib/likes";
import { toPhotoDto } from "@/lib/photos";

/** The guests' favourites: the event's most liked visible photos, for the wall's ranking. */
export async function GET(request: Request, { params }: RouteContext<"/api/admin/events/[id]/photos/top">) {
  const { admin, event, denied } = await requireEventAdmin(request, (await params).id);
  if (denied) return denied;
  const limit = Number(new URL(request.url).searchParams.get("limit")) || 5;
  return NextResponse.json({
    photos: topLiked(event.id, limit).map(({ photo, likes }) => ({ ...toPhotoDto(photo, { admin: admin.scope }), likes })),
  });
}
