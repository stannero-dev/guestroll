import { cn } from "@/components/ui";

/** A print, slightly askew. `currentColor` is the paper's outline, so it follows the surrounding text color. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden className={cn("size-6", className)}>
      <g transform="rotate(-8 256 256)">
        <rect x="104" y="72" width="304" height="368" rx="22" fill="none" stroke="currentColor" strokeWidth="40" />
        <rect x="150" y="118" width="212" height="196" rx="8" fill="#ffc72c" />
      </g>
    </svg>
  );
}
