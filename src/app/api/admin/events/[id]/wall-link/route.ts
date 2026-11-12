import { NextResponse } from "next/server";
import { requireEventAdmin } from "@/lib/http";
import { disablePublicWall, newWallToken } from "@/lib/publicWall";

type Context = RouteContext<"/api/admin/events/[id]/wall-link">;

/** Turns the public wall link on, or replaces it: a screen open on the old link stops. */
export async function POST(request: Request, { params }: Context) {
  const { event, denied } = await requireEventAdmin(request, (await params).id);
  if (denied) return denied;
  return NextResponse.json({ wallToken: newWallToken(event.id) });
}

export async function DELETE(request: Request, { params }: Context) {
  const { event, denied } = await requireEventAdmin(request, (await params).id);
  if (denied) return denied;
  disablePublicWall(event.id);
  return NextResponse.json({ ok: true });
}
