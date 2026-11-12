import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { freshEnv } from "../helpers/env";

let env: Awaited<ReturnType<typeof freshEnv>>;
beforeEach(async () => {
  env = await freshEnv();
});
afterEach(() => env.cleanup());

async function setup() {
  const { createEvent } = await import("@/lib/events");
  const { insertPhoto, toPhotoDto, deletePhotos, setPhotoStatus } = await import("@/lib/photos");
  const likes = await import("@/lib/likes");
  const { newId } = await import("@/lib/security/ids");
  const event = createEvent({ name: "Back to School" });
  const add = (guestId: string, status: "visible" | "hidden" = "visible") =>
    insertPhoto({ id: newId(), eventId: event.id, guestId, guestName: guestId, width: 4, height: 3, bytes: 1, status });
  return { event, add, toPhotoDto, deletePhotos, setPhotoStatus, ...likes };
}

describe("likes", () => {
  it("counts one like per guest and photo, and takes it back", async () => {
    const { add, setLike, likeCounts, likedBy } = await setup();
    const photo = add("ana");

    expect(setLike(photo, "ben", true)).toBe(1);
    expect(setLike(photo, "ben", true)).toBe(1);
    expect(setLike(photo, "cat", true)).toBe(2);
    expect(likedBy([photo.id], "ben")).toEqual(new Set([photo.id]));
    expect(likedBy([photo.id], "dan")).toEqual(new Set());
    expect(likedBy([photo.id], undefined)).toEqual(new Set());

    expect(setLike(photo, "ben", false)).toBe(1);
    expect(setLike(photo, "ben", false)).toBe(1);
    expect(likeCounts([photo.id]).get(photo.id)).toBe(1);
  });

  it("adds counts and the viewer's own likes to a page of photos", async () => {
    const { add, setLike, withLikes, toPhotoDto } = await setup();
    const [a, b] = [add("ana"), add("ana")];
    setLike(a, "ben", true);
    setLike(a, "cat", true);

    const page = withLikes([a, b].map((p) => toPhotoDto(p, { guestId: "ben" })), "ben");
    expect(page.map((p) => [p.likes, p.liked])).toEqual([[2, true], [0, false]]);
  });

  it("ranks the most liked visible photos and forgets likes with their photo", async () => {
    const { event, add, setLike, topLiked, likeCounts, deletePhotos, setPhotoStatus } = await setup();
    const [first, second, hidden] = [add("ana"), add("ben"), add("cat")];
    setLike(first, "x", true);
    for (const guest of ["x", "y", "z"]) setLike(second, guest, true);
    for (const guest of ["w", "x", "y", "z"]) setLike(hidden, guest, true);
    setPhotoStatus([hidden.id], event.id, "hidden");

    expect(topLiked(event.id).map((r) => [r.photo.id, r.likes])).toEqual([[second.id, 3], [first.id, 1]]);
    expect(topLiked(event.id, 1)).toHaveLength(1);

    await deletePhotos([second.id], event.id);
    expect(likeCounts([second.id]).size).toBe(0);
    expect(topLiked(event.id).map((r) => r.photo.id)).toEqual([first.id]);
  });
});
