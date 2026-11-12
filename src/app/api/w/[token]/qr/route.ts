import { apiError } from "@/lib/http";
import { getEventByWallToken } from "@/lib/publicWall";
import { eventQrSvg } from "@/lib/qr/server";

/** The guest QR code in the public wall's corner: the code printed on the tables anyway. */
export async function GET(_request: Request, { params }: RouteContext<"/api/w/[token]/qr">) {
  const event = getEventByWallToken((await params).token);
  if (!event) return apiError("not_found");
  return new Response(await eventQrSvg(event), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
    },
  });
}
