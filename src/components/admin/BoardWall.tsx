"use client";

/* eslint-disable @next/next/no-img-element -- photos come from an auth-checked route */
import { Heart } from "lucide-react";
import type { CSSProperties } from "react";
import { useWallMedia } from "./wallSource";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/components/ui";
import type { MessageDto } from "@/lib/messages";
import type { PhotoDto } from "@/lib/photos";

/*
 * The board is a physical object (cork, paper, pins), the same in light and
 * dark themes: its colors are its own, not the interface's tokens. Only the
 * event's accent color comes from the theme.
 */
const INK = "#2b2118";
const PAPER = "#fffdf7";
const PINS = ["#d8412f", "#2f6fd8", "#e2a917", "#2f9e5b", "#8a4fd0"];

const CORK: CSSProperties = {
  backgroundColor: "#cfa173",
  backgroundImage: [
    "radial-gradient(circle at 20% 30%, rgba(96,60,24,.30) 0 1px, transparent 1.7px)",
    "radial-gradient(circle at 70% 60%, rgba(255,238,206,.40) 0 1.2px, transparent 2px)",
    "radial-gradient(circle at 45% 80%, rgba(120,78,36,.24) 0 1.5px, transparent 2.4px)",
    "radial-gradient(ellipse at center, rgba(255,242,220,.30), rgba(96,60,24,.22))",
  ].join(","),
  backgroundSize: "13px 13px, 17px 17px, 23px 23px, 100% 100%",
};

const LINED: CSSProperties = {
  backgroundColor: PAPER,
  backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 calc(4.6vh - 1px), rgba(64,110,180,.22) calc(4.6vh - 1px) 4.6vh)",
};

/** A stable number in [0, 1) from an id: each print keeps its tilt and its pin while it moves around the board. */
function seed(id: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

interface BoardWallProps {
  /** The guest QR code's image, from the wall's source. */
  qrUrl: string;
  eventName: string;
  joinUrl: string;
  /** Newest or leading first: the first is pinned big, the next six around it. */
  photos: PhotoDto[];
  /** The photo that just arrived, if any: it drops onto the board. */
  leadId: string | null;
  /** The guests' most liked photos, most liked first. */
  top: PhotoDto[];
  message: MessageDto | null;
  showQr: boolean;
  caption: (photo: PhotoDto) => string;
  empty: boolean;
  /** A credit line on a little label at the foot of the board. */
  credit?: string;
}

const PRINTS = 7;

/** The wall as a classroom pinboard: prints pinned at an angle, the room's favourites on a lined sheet. */
export function BoardWall({ qrUrl, eventName, joinUrl, photos, leadId, top, message, showQr, caption, empty, credit = "" }: BoardWallProps) {
  const t = useT();
  const mediaUrl = useWallMedia();
  const prints = photos.slice(0, PRINTS);
  const side = top.length > 0 || showQr || message;

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden p-[4vh]" style={{ ...CORK, color: INK }}>
      {/* The wooden frame, over everything but never in the way. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-20" style={{ boxShadow: "inset 0 0 0 1.5vh #8a5a30, inset 0 0 0 1.9vh #5f3b1c, inset 0 0 7vh rgba(70,40,12,.35)" }} />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-6 pb-[2.5vh]">
        <div className="relative -rotate-1 px-[3vh] py-[1.2vh] shadow-md" style={{ backgroundColor: PAPER }}>
          <Tape className="-top-[1.4vh] left-[8%] -rotate-6" />
          <Tape className="-top-[1.4vh] right-[8%] rotate-3" />
          <p className="max-w-[60vw] truncate text-[clamp(1.5rem,5vh,4rem)] leading-tight font-extrabold tracking-tight [font-stretch:80%]">{eventName}</p>
        </div>
        {!showQr && (
          <p className="shrink-0 rotate-1 rounded-sm px-[2vh] py-[1vh] text-[clamp(0.9rem,2.2vh,1.5rem)] font-semibold shadow-md" style={{ backgroundColor: "#ffe98a" }}>
            {joinUrl.replace(/^https?:\/\//, "")}
          </p>
        )}
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 gap-[3vh]">
        {empty ? (
          <div className="grid flex-1 place-items-center">
            <p className="-rotate-2 px-[5vh] py-[4vh] text-[clamp(1.5rem,4.5vh,3.5rem)] font-bold shadow-lg" style={{ backgroundColor: "#ffe98a" }}>
              {t("admin.wall.waiting")}
            </p>
          </div>
        ) : (
          <ul role="list" className="grid min-w-0 flex-1 grid-cols-5 grid-rows-2 gap-[1.5vh]">
            {prints.map((photo, i) => (
              <Print key={photo.id} photo={photo} big={i === 0} dropped={photo.id === leadId} text={caption(photo)} />
            ))}
          </ul>
        )}

        {side && (
          <aside className="flex w-[23vw] shrink-0 flex-col gap-[2.5vh]">
            {top.length > 0 && (
              <section className="relative rotate-1 px-[2.2vh] pt-[2.4vh] pb-[1.6vh] shadow-lg" style={LINED}>
                <Tape className="-top-[1.4vh] left-1/2 -translate-x-1/2 -rotate-2" />
                <h2 className="flex items-center gap-[1vh] pb-[1vh] text-[clamp(1.1rem,3.2vh,2.4rem)] leading-none font-extrabold tracking-tight">
                  <Heart className="size-[3vh] fill-current" style={{ color: PINS[0] }} aria-hidden />
                  {t("admin.wall.top")}
                </h2>
                <ol className="space-y-[1vh]">
                  {top.map((photo, i) => (
                    <li key={photo.id} className="flex items-center gap-[1.4vh]">
                      <span className="w-[2.6vh] shrink-0 text-center text-[clamp(1rem,2.8vh,2rem)] font-extrabold tabular-nums">{i + 1}</span>
                      <img src={mediaUrl(photo.id, "thumb")} alt="" className="size-[6.4vh] shrink-0 border-[0.4vh] border-white object-cover shadow-sm" />
                      <span className="min-w-0 flex-1 truncate text-[clamp(0.9rem,2.2vh,1.6rem)] font-semibold">{photo.guestName ?? t("admin.anonymous")}</span>
                      <span className="flex shrink-0 items-center gap-[0.5vh] text-[clamp(0.9rem,2.4vh,1.7rem)] font-bold tabular-nums">
                        <Heart className="size-[2.2vh] fill-current" style={{ color: PINS[0] }} aria-hidden />
                        {photo.likes ?? 0}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {message && (
              <blockquote key={message.id} className="min-h-0 -rotate-1 animate-[wall-in_700ms_ease-out] space-y-[0.8vh] px-[2.2vh] py-[1.8vh] shadow-md" style={{ backgroundColor: "#ffe98a" }}>
                <p className="line-clamp-4 text-[clamp(0.9rem,2.3vh,1.7rem)] leading-snug font-semibold text-pretty">“{message.text}”</p>
                {message.guestName && <footer className="truncate text-[clamp(0.8rem,1.9vh,1.3rem)] opacity-70">{message.guestName}</footer>}
              </blockquote>
            )}

            {showQr && (
              <section className="relative mt-auto flex -rotate-1 items-center gap-[1.6vh] p-[1.6vh] shadow-lg" style={{ backgroundColor: PAPER }}>
                <Pin color={PINS[1]} />
                <img src={qrUrl} alt="" className="size-[15vh] min-h-20 shrink-0" />
                <p className="text-[clamp(0.9rem,2.4vh,1.8rem)] leading-tight font-bold text-balance">{t("admin.wall.scan")}</p>
              </section>
            )}
          </aside>
        )}
      </div>

      {credit && (
        <p
          className="absolute bottom-[3.2vh] left-[5vh] z-10 -rotate-2 px-[2vh] pt-[1.1vh] pb-[0.9vh] text-[clamp(0.85rem,2.1vh,1.5rem)] leading-none font-bold tracking-tight shadow-md"
          style={{ backgroundColor: "#e9d3a8", backgroundImage: "repeating-linear-gradient(90deg, rgba(120,80,30,.06) 0 2px, transparent 2px 6px)" }}
        >
          <Tape className="-top-[1.3vh] left-1/2 h-[2vh] w-[6vh] -translate-x-1/2 rotate-3" />
          {credit}
        </p>
      )}
    </div>
  );
}

/**
 * One pinned print. The cell is a size container, so the print takes the
 * photo's own proportions as large as the cell allows: never cropped, never
 * padded with bars. `PAD` and `FOOT` are the paper's border and its caption.
 */
function Print({ photo, big, dropped, text }: { photo: PhotoDto; big: boolean; dropped: boolean; text: string }) {
  const mediaUrl = useWallMedia();
  const ratio = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;
  const pad = big ? "1.3vh" : "0.8vh";
  const foot = big ? "6vh" : "3.6vh";
  // Room is left around the paper for its tilt and its pin.
  const width = `min(calc(88cqw - 2 * ${pad}), calc((86cqh - ${foot} - ${pad}) * ${ratio.toFixed(4)}))`;
  const tilt = (seed(photo.id) - 0.5) * (big ? 3 : 8);
  const likes = photo.likes ?? 0;

  return (
    <li className={cn("grid min-h-0 min-w-0 place-items-center [container-type:size]", big && "col-span-2 row-span-2")}>
      <figure
        className={cn("relative flex flex-col shadow-[0_0.6vh_1.6vh_rgba(60,35,10,.45)]", dropped ? "animate-[board-pin_700ms_cubic-bezier(.2,.9,.3,1.15)]" : "animate-[wall-in_700ms_ease-out]")}
        style={{ backgroundColor: PAPER, paddingTop: pad, paddingInline: pad, rotate: `${tilt.toFixed(2)}deg` }}
      >
        <Pin color={PINS[Math.floor(seed(photo.id, 7) * PINS.length)]} />
        <img src={mediaUrl(photo.id, "display")} alt="" className="block bg-black/10 object-cover" style={{ width, aspectRatio: ratio }} />
        <figcaption className="flex items-center justify-between gap-[1vh] px-[0.4vh] font-semibold" style={{ height: foot, width, fontSize: big ? "clamp(1rem,2.6vh,1.9rem)" : "clamp(0.7rem,1.7vh,1.2rem)" }}>
          <span className="min-w-0 truncate">{text}</span>
          {likes > 0 && (
            <span className="flex shrink-0 items-center gap-[0.4vh] tabular-nums">
              <Heart className="size-[1.1em] fill-current" style={{ color: PINS[0] }} aria-hidden />
              {likes}
            </span>
          )}
        </figcaption>
      </figure>
    </li>
  );
}

function Pin({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="absolute -top-[1.1vh] left-1/2 z-10 size-[2.2vh] -translate-x-1/2 rounded-full shadow-[0_0.4vh_0.5vh_rgba(40,20,5,.5)]"
      style={{ background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,.85) 0 12%, ${color} 38%)` }}
    />
  );
}

function Tape({ className }: { className?: string }) {
  return <span aria-hidden className={cn("absolute z-10 h-[2.6vh] w-[9vh] shadow-sm", className)} style={{ backgroundColor: "rgba(255,244,190,.82)" }} />;
}
