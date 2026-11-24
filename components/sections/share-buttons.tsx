import { SocialIcon } from "@/components/layout/social-icons";
import { getT } from "@/lib/i18n/server";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const enc = encodeURIComponent(title);
  const t = getT();
  const links = [
    { key: "linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, label: t("common.shareOn", { x: "LinkedIn" }) },
    { key: "facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, label: t("common.shareOn", { x: "Facebook" }) },
    { key: "x", href: `https://twitter.com/intent/tweet?url=${u}&text=${enc}`, label: t("common.shareOn", { x: "X" }) },
  ];
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-subtle">{t("common.share")}</span>
      {links.map((l) => (
        <a key={l.key} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-fg">
          <SocialIcon name={l.key} />
        </a>
      ))}
    </div>
  );
}
