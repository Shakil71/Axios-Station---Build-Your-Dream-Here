import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal wrapper, pure CSS (see `.reveal` in globals.css).
 * Content is always rendered visible; in browsers with scroll-driven
 * animations it fades/slides in as it enters the viewport. No JavaScript,
 * so content never waits for hydration (good for LCP), and
 * prefers-reduced-motion is respected.
 *
 * `hero` uses a short time-based entrance instead, for above-the-fold content.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  hero = false,
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: "div" | "li"; delay?: number; hero?: boolean; children?: ReactNode }) {
  return (
    <Tag
      className={cn(hero ? "rise" : "reveal", className)}
      style={{ ...style, "--reveal-delay": delay } as CSSProperties}
      {...props}
    >
      {children}
    </Tag>
  );
}
