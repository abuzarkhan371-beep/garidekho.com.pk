import Link from "next/link";
import { cn } from "@/lib/utils";

/** Original Garidekho mark: a road that curls into a "G" inside a midnight tile. */
export function BrandMark({ className, src }: { className?: string; src?: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Garidekho logo"
        className={cn("size-9 shrink-0 rounded-xl object-contain", className)}
      />
    );
  }

  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} role="img" aria-label="Garidekho logo">
      <rect x="0" y="0" width="40" height="40" rx="11" fill="var(--color-navy)" />
      <path
        d="M28.5 13.2a10.4 10.4 0 1 0 1.1 10.1h-8.2"
        fill="none"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 20h8" stroke="white" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="30" cy="12" r="3" fill="var(--color-signal-300)" />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
  logoUrl,
}: { className?: string; compact?: boolean; logoUrl?: string | null }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label="Garidekho home">
      <BrandMark className="size-9 shrink-0" src={logoUrl} />
      {!compact && (
        <span className="grid grid-cols-[auto_auto] items-baseline leading-none">
          <span className="col-start-1 row-start-1 font-display text-[1.35rem] font-extrabold tracking-tight text-ink-900 dark:text-white">
            gari
          </span>
          <span className="col-start-2 row-start-1 font-display text-[1.35rem] font-extrabold tracking-tight text-link dark:text-link-soft">
            dekho
          </span>
          <span className="col-start-2 row-start-2 mt-0.5 justify-self-end whitespace-nowrap text-right text-[0.58rem] font-semibold tracking-[0.08em] text-ink-400">
            .com.pk
          </span>
        </span>
      )}
    </Link>
  );
}
