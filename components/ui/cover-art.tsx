import Image from "next/image";
import { DynamicIcon } from "./icon";
import { cn } from "@/lib/utils";
import type { MediaDTO } from "@/services/public";

/**
 * Shows the CMS cover image when one is set; otherwise a branded generative
 * panel (grid + glow + icon) — never a random stock photo.
 */
export function CoverArt({
  media,
  icon,
  alt,
  className,
  priority,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  seed = 0,
}: {
  media?: MediaDTO;
  icon?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  seed?: number;
}) {
  if (media?.url) {
    return (
      <div className={cn("relative overflow-hidden bg-bg-3", className)}>
        <Image
          src={media.url}
          alt={media.alt || alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
    );
  }
  const hues = [
    ["var(--brand)", "var(--brand-2)"],
    ["var(--brand-2)", "var(--brand-deep)"],
    ["var(--brand-deep)", "var(--brand-2)"],
  ][seed % 3]!;
  return (
    <div className={cn("relative overflow-hidden bg-bg-3", className)} role="img" aria-label={alt}>
      <div className="bg-grid mask-radial absolute inset-0 opacity-70" />
      <div
        className="absolute -left-1/4 -top-1/3 h-[140%] w-[90%] rounded-full opacity-35 blur-3xl transition-transform duration-700 group-hover:translate-x-6"
        style={{ background: `radial-gradient(closest-side, ${hues[0]}, transparent)` }}
      />
      <div
        className="absolute -bottom-1/3 -right-1/4 h-[120%] w-[80%] rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${hues[1]}, transparent)` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="glass flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110">
          <DynamicIcon name={icon} className="h-7 w-7 text-brand-2" />
        </div>
      </div>
    </div>
  );
}
