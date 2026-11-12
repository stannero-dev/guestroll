import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveWall } from "@/components/admin/LiveWall";
import { EventTheme } from "@/components/EventTheme";
import { readChallenges } from "@/lib/challenges";
import { config } from "@/lib/config";
import { getEventByWallToken } from "@/lib/publicWall";
import { eventUrl } from "@/lib/urls";
import { readWallStyle } from "@/lib/wall";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const event = getEventByWallToken((await params).token);
  return { title: event ? event.name : config.appName, robots: { index: false, follow: false } };
}

/**
 * The public live wall: no sign-in, opened from the secret link the hosts
 * created. A turned-off or replaced link is a plain 404.
 */
export default async function PublicWallPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const event = getEventByWallToken(token);
  if (!event) notFound();
  return (
    <EventTheme color={event.accentColor}>
      <LiveWall
        source={{ kind: "public", token }}
        eventName={event.name}
        joinUrl={await eventUrl(event.slug)}
        initialStyle={readWallStyle(event.wallStyle)}
        challenges={readChallenges(event.challenges)}
        credit={config.credit}
      />
    </EventTheme>
  );
}
