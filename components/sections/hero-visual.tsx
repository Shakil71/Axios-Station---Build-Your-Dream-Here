"use client";

import Image from "next/image";
import { MotionConfig, motion } from "framer-motion";
import { BarChart3, BrainCircuit, Check, Cloud, Network, Workflow } from "lucide-react";
import { useT } from "@/components/i18n/locale-provider";

const NODES = [
  { label: "hero.node1", Icon: BrainCircuit, x: 50, y: 6 },
  { label: "hero.node2", Icon: Cloud, x: 92, y: 36 },
  { label: "hero.node3", Icon: Network, x: 78, y: 86 },
  { label: "hero.node4", Icon: Workflow, x: 22, y: 86 },
  { label: "hero.node5", Icon: BarChart3, x: 8, y: 36 },
] as const;

/** Custom animated illustration: an AI/cloud core connected to business systems. */
export function HeroVisual({ labels }: { labels?: string[] }) {
  const t = useT();
  const nodes = NODES.map((n, i) => ({ ...n, label: labels?.[i] || t(n.label) }));

  // Same markup on server and client (no hydration mismatch). For visitors who prefer reduced motion,
  // MotionConfig makes Framer skip transform animations and globals.css stops the CSS loops.
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative mx-auto aspect-square w-full max-w-[560px] select-none" aria-hidden>
        {/* glow */}
        <div className="absolute inset-[18%] rounded-full bg-brand/30 blur-[80px]" />
        <div className="absolute inset-[30%] rounded-full bg-brand-2/20 blur-[60px]" />

        {/* orbits */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="hv-line" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="var(--brand-2)" stopOpacity="0.9" />
              <stop offset="1" stopColor="var(--brand)" stopOpacity="0.6" />
            </linearGradient>
            <radialGradient id="hv-core" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="var(--brand)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className="animate-spin-slow" style={{ transformOrigin: "50px 50px" }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-strong)" strokeWidth="0.25" strokeDasharray="0.6 1.6" />
            <circle cx="92" cy="50" r="0.9" fill="var(--brand-2)" />
            <circle cx="8" cy="50" r="0.6" fill="var(--brand)" />
          </g>
          <circle cx="50" cy="50" r="30" fill="none" stroke="var(--border)" strokeWidth="0.25" />
          <circle cx="50" cy="50" r="18" fill="url(#hv-core)" />
          {nodes.map((n, i) => (
            <path
              key={i}
              d={`M50 50 Q ${(50 + n.x) / 2 + (i % 2 ? 6 : -6)} ${(50 + n.y) / 2 + (i % 2 ? -6 : 6)} ${n.x} ${n.y}`}
              fill="none"
              stroke="url(#hv-line)"
              strokeWidth="0.35"
              strokeDasharray="1.2 2.4"
              className="animate-dash"
              style={{ animationDuration: `${5 + i}s` }}
            />
          ))}
        </svg>

        {/* core */}
        <motion.div
          className="absolute left-1/2 top-1/2 flex h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="absolute inset-0 rounded-[28%] border border-brand/40 animate-pulse-ring" />
          <span className="absolute inset-0 rounded-[28%] border border-brand-2/30 animate-pulse-ring" style={{ animationDelay: "1.3s" }} />
          <div className="glass ring-gradient relative flex h-full w-full items-center justify-center rounded-[28%] shadow-[0_0_60px_-10px_var(--brand)]">
            <Image src="/images/brand/axios-mark.png" alt="" width={512} height={258} className="w-[62%]" priority />
          </div>
        </motion.div>

        {/* nodes */}
        {nodes.map((n, i) => (
          <motion.div
            key={n.label}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.6 }}
          >
            <div className="glass flex items-center gap-2 whitespace-nowrap rounded-full p-1.5 shadow-card animate-float sm:pr-3" style={{ animationDelay: `${i * 0.8}s` }} title={n.label}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-white sm:h-7 sm:w-7">
                <n.Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </span>
              <span className="hidden text-xs font-semibold text-fg sm:inline">{n.label}</span>
            </div>
          </motion.div>
        ))}

        {/* floating workflow card */}
        <motion.div
          className="glass absolute -left-2 top-[52%] hidden w-44 rounded-2xl p-3 shadow-card sm:block lg:-left-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">{t("hero.workflow")}</p>
          {[t("hero.captured"), t("hero.classified"), t("hero.routed")].map((s, i) => (
            <motion.div
              key={s}
              className="mt-2 flex items-center gap-2 text-[11px] text-fg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 + i * 0.35 }}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="h-2.5 w-2.5" />
              </span>
              {s}
            </motion.div>
          ))}
        </motion.div>

        {/* floating analytics card */}
        <motion.div
          className="glass absolute -right-2 top-[58%] hidden w-40 rounded-2xl p-3 shadow-card sm:block lg:-right-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.15, duration: 0.7 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">{t("hero.insights")}</p>
          <svg viewBox="0 0 100 36" className="mt-2 h-10 w-full">
            <defs>
              <linearGradient id="hv-spark" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--brand-2)" stopOpacity="0.4" />
                <stop offset="1" stopColor="var(--brand-2)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 30 L14 26 L28 28 L42 18 L56 21 L70 12 L84 14 L100 4 L100 36 L0 36Z" fill="url(#hv-spark)" />
            <motion.path
              d="M0 30 L14 26 L28 28 L42 18 L56 21 L70 12 L84 14 L100 4"
              fill="none"
              stroke="var(--brand-2)"
              strokeWidth="1.8"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.4, duration: 1.4, ease: "easeOut" }}
            />
          </svg>
        </motion.div>
      </div>
    </MotionConfig>
  );
}
