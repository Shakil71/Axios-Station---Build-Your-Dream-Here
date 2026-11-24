"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, BarChart3, Boxes, BrainCircuit, Briefcase, Building2, ClipboardList, Code2, CornerUpRight, ExternalLink, FileText,
  FolderTree, Hash, HelpCircle, History, Image as ImageIcon, Inbox, LayoutDashboard, LayoutTemplate, LogOut, Mail, Menu,
  Palette, PanelBottom, PenSquare, Phone, Quote, Search, Settings, Share2, ShieldCheck, Tags, UserCog, Users, Wrench, X,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Activity, BarChart3, Boxes, BrainCircuit, Briefcase, Building2, ClipboardList, Code2, CornerUpRight, FileText, FolderTree,
  Hash, HelpCircle, History, Image: ImageIcon, Inbox, LayoutDashboard, LayoutTemplate, Mail, Menu, Palette, PanelBottom,
  PenSquare, Phone, Quote, Search, Settings, Share2, ShieldCheck, Tags, UserCog, Users, Wrench,
};

export type ShellNav = { title: string; items: { label: string; href: string; icon: string }[] }[];

export function AdminShell({
  nav,
  user,
  signOutAction,
  children,
}: {
  nav: ShellNav;
  user: { name: string; email: string; roles: string[] };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <Image src="/images/brand/axios-mark.png" alt="" width={512} height={258} className="h-6 w-auto" />
        <span className="font-display text-sm font-bold tracking-[0.16em] uppercase">Axios</span>
        <span className="rounded-md bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-2">CMS</span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin">
        {nav.map((g) => (
          <div key={g.title}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">{g.title}</p>
            <ul className="mt-2 space-y-0.5">
              {g.items.map((it) => {
                const Icon = ICONS[it.icon] ?? FileText;
                const active = isActive(it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                        active ? "bg-brand/15 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className={cn("h-4 w-4", active ? "text-brand-2" : "")} />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-4">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="truncate text-xs text-subtle">{user.roles.join(", ") || user.email}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-bg">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-bg-2 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-bg-2">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 hover:bg-surface-2 cursor-pointer" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-surface-2 lg:hidden cursor-pointer" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg sm:inline-flex">
            View site <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <ThemeToggle />
          <form action={signOutAction}>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg cursor-pointer">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
