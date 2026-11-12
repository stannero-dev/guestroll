import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { freshEnv } from "../helpers/env";

let env: Awaited<ReturnType<typeof freshEnv>>;
beforeEach(async () => {
  env = await freshEnv();
});
afterEach(() => env.cleanup());

describe("public wall link", () => {
  it("opens the event only while the link is current", async () => {
    const { createEvent } = await import("@/lib/events");
    const wall = await import("@/lib/publicWall");
    const event = createEvent({ name: "Back to School" });

    expect(wall.getEventByWallToken("")).toBeUndefined();
    const first = wall.newWallToken(event.id);
    expect(first).toMatch(/^[a-z0-9]{32}$/);
    expect(wall.getEventByWallToken(first)?.id).toBe(event.id);

    // A new link revokes the old one.
    const second = wall.newWallToken(event.id);
    expect(second).not.toBe(first);
    expect(wall.getEventByWallToken(first)).toBeUndefined();
    expect(wall.getEventByWallToken(second)?.id).toBe(event.id);

    wall.disablePublicWall(event.id);
    expect(wall.getEventByWallToken(second)).toBeUndefined();
    // Malformed tokens never reach the database.
    expect(wall.getEventByWallToken("x' OR 1=1 --")).toBeUndefined();
  });

  it("streams only the event's visible photos, never an original", async () => {
    const { wallMayShow } = await import("@/lib/publicWall");
    const event = { id: "e1" };
    const photo = { eventId: "e1", status: "visible" as const, mediaType: null };

    expect(wallMayShow(event, photo, "display")).toBe(true);
    expect(wallMayShow(event, photo, "thumb")).toBe(true);
    expect(wallMayShow(event, photo, "original")).toBe(false);
    expect(wallMayShow(event, photo, "play")).toBe(false);
    expect(wallMayShow(event, { ...photo, mediaType: "video/mp4" }, "play")).toBe(true);
    expect(wallMayShow(event, { ...photo, status: "hidden" }, "display")).toBe(false);
    expect(wallMayShow(event, { ...photo, status: "pending" }, "display")).toBe(false);
    expect(wallMayShow(event, { ...photo, eventId: "e2" }, "display")).toBe(false);
  });
});
