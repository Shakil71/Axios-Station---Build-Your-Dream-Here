import Image from "next/image";
import { ArrowUpRight, Clock, Globe, Mail, MessageCircle, Phone } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { DynamicIcon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/primitives";
import { SocialIcon } from "@/components/layout/social-icons";
import { formatDate, safeHref } from "@/lib/utils";
import type { PostCardDTO, ProjectCardDTO } from "@/services/public";
import { LocaleLink as Link } from "@/components/i18n/locale-provider";
import { dateLocale, type DictKey } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";

export function OfferingCard({ href, title, excerpt, icon, index = 0 }: { href: string; title: string; excerpt: string; icon?: string | null; index?: number }) {
  const t = getT();
  return (
    <Link
      href={href}
      className="group glass ring-gradient relative flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-surface-2"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand/25 bg-gradient-to-br from-brand/15 to-brand-2/10 text-brand-2 transition group-hover:from-brand group-hover:to-brand-2 group-hover:text-white">
          <DynamicIcon name={icon} className="h-[22px] w-[22px]" />
        </span>
        <span className="font-display text-xs font-semibold text-subtle">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="mt-6 text-lg font-semibold text-fg">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{excerpt}</p>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-2">
        {t("common.learnMore")} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function ProjectCard({ project, priority, index = 0 }: { project: ProjectCardDTO; priority?: boolean; index?: number }) {
  const t = getT();
  return (
    <Link href={`/portfolio/${project.slug}`} className="group glass ring-gradient flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <CoverArt media={project.cover} icon="Layers" alt={project.title} className="aspect-[16/10]" priority={priority} seed={index} />
        <div className="absolute left-3 top-3 flex gap-2">
          {project.category && <Badge className="bg-bg/70 backdrop-blur">{project.category.name}</Badge>}
          {project.isDemo && <Badge tone="warning" className="bg-bg/70 backdrop-blur">{t("common.demo")}</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold text-fg group-hover:text-brand-2">{project.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{project.summary}</p>
        {project.technologies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((t) => (
              <Badge key={t} tone="muted">{t}</Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function PostCard({ post, index = 0 }: { post: PostCardDTO; index?: number }) {
  const t = getT();
  return (
    <Link href={`/blog/${post.slug}`} className="group glass ring-gradient flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1">
      <CoverArt media={post.cover} icon="Sparkles" alt={post.title} className="aspect-[16/9]" seed={index} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3 text-xs text-subtle">
          {post.category && <span className="font-semibold text-brand-2">{post.category.name}</span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, dateLocale[getLocale()])}</time>}
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug text-fg group-hover:text-brand-2">{post.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-subtle">
          <Clock className="h-3.5 w-3.5" /> {t("common.minRead", { n: post.readingMinutes })}
        </p>
      </div>
    </Link>
  );
}

export type TeamMemberDTO = {
  slug: string;
  name: string;
  position: string;
  department: string;
  bio: string | null;
  skills: string[];
  photo: { url: string; alt: string } | null;
  experience?: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

/** Keep only digits and a leading "+" for tel:/wa.me links. */
const digits = (v: string) => v.trim().replace(/(?!^\+)[^\d]/g, "");

function memberLinks(m: TeamMemberDTO, t: (k: DictKey, v?: Record<string, string>) => string) {
  const social = [
    { key: "linkedin", url: m.linkedinUrl, label: "LinkedIn" },
    { key: "facebook", url: m.facebookUrl, label: "Facebook" },
    { key: "instagram", url: m.instagramUrl, label: "Instagram" },
    { key: "github", url: m.githubUrl, label: "GitHub" },
    { key: "x", url: m.twitterUrl, label: "X" },
  ].filter((l): l is { key: string; url: string; label: string } => !!l.url);
  const contact = [
    m.email && { key: "email", href: `mailto:${m.email}`, label: t("team.email", { name: m.name }), Icon: Mail },
    m.phone && { key: "phone", href: `tel:${digits(m.phone)}`, label: t("team.call", { name: m.name }), Icon: Phone },
    m.whatsapp && { key: "whatsapp", href: `https://wa.me/${digits(m.whatsapp).replace("+", "")}`, label: t("team.whatsapp", { name: m.name }), Icon: MessageCircle },
    m.websiteUrl && { key: "web", href: safeHref(m.websiteUrl), label: t("team.website", { name: m.name }), Icon: Globe },
  ].filter(Boolean) as { key: string; href: string; label: string; Icon: typeof Mail }[];
  return { social, contact };
}

export function TeamCard({ member, detailed = false }: { member: TeamMemberDTO; detailed?: boolean }) {
  const initials = member.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  const t = getT();
  const { social, contact } = memberLinks(member, t);
  const iconBtn = "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-subtle transition hover:border-brand/50 hover:text-fg";
  return (
    <article className="group glass ring-gradient flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="relative aspect-[4/4.2] overflow-hidden bg-bg-3">
        {member.photo ? (
          <Image src={member.photo.url} alt={member.photo.alt || member.name} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-grid">
            <span className="font-display text-5xl font-bold text-brand-gradient">{initials}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold text-fg">{member.name}</h3>
        <p className="text-sm text-brand-2">{member.position}</p>
        {member.experience && <p className="mt-1 text-xs text-subtle">{t("common.experience", { x: member.experience })}</p>}
        {detailed && member.bio && <p className="mt-3 text-sm leading-relaxed text-muted">{member.bio}</p>}
        {detailed && member.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {member.skills.map((s) => <Badge key={s} tone="muted">{s}</Badge>)}
          </div>
        )}
        {social.length + contact.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {social.map((l) => (
              <a key={l.key} href={safeHref(l.url)} target="_blank" rel="noopener noreferrer" aria-label={t("team.on", { name: member.name, x: l.label })} className={iconBtn}>
                <SocialIcon name={l.key} />
              </a>
            ))}
            {contact.map(({ key, href, label, Icon }) => (
              <a key={key} href={href} aria-label={label} className={iconBtn} {...(key === "whatsapp" || key === "web" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
