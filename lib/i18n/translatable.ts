/**
 * Which CMS fields can be translated (pure data — used by the admin UI,
 * the save action and the public read layer).
 *
 * Values are stored in the `Translation` table as text, in the same format
 * the admin uses for the English field:
 *   list  → one item per line
 *   items → one per line: "Title | Description"
 *   stats → one per line: "Value | Label"
 */
export type TranslatableKind = "text" | "textarea" | "richtext" | "list" | "items" | "stats";
export type TranslatableField = { name: string; label: string; kind: TranslatableKind };

const f = (name: string, label: string, kind: TranslatableKind = "text"): TranslatableField => ({ name, label, kind });

/** Entity type (stored in Translation.entityType) → fields. */
export const TRANSLATABLE: Record<string, TranslatableField[]> = {
  service: [
    f("title", "Title"), f("tagline", "Tagline"), f("excerpt", "Short description", "textarea"), f("overview", "Overview", "textarea"),
    f("challenges", "Business challenges", "list"), f("solution", "Our solution", "textarea"), f("features", "Key features", "items"),
    f("benefits", "Business benefits", "list"), f("process", "Development process", "items"),
  ],
  solution: [
    f("title", "Title"), f("tagline", "Tagline"), f("excerpt", "Short description", "textarea"), f("overview", "Overview", "textarea"),
    f("modules", "Modules", "items"), f("customization", "Customisation statement", "textarea"), f("benefits", "Benefits", "list"),
  ],
  industry: [
    f("title", "Title"), f("excerpt", "Short description", "textarea"), f("overview", "Overview", "textarea"),
    f("challenges", "Industry challenges", "list"), f("approach", "Our approach", "items"),
  ],
  project: [
    f("title", "Project title"), f("summary", "Summary", "textarea"), f("description", "Description", "richtext"),
    f("challenges", "Challenges", "textarea"), f("solutions", "Solutions", "textarea"), f("results", "Results", "textarea"),
  ],
  projectCategory: [f("name", "Name")],
  teamMember: [f("position", "Position"), f("experience", "Experience"), f("bio", "Biography", "textarea"), f("skills", "Skills / expertise", "list")],
  blogPost: [f("title", "Title"), f("excerpt", "Excerpt", "textarea"), f("content", "Content", "richtext")],
  blogCategory: [f("name", "Name")],
  testimonial: [f("quote", "Quote", "textarea"), f("authorTitle", "Author title")],
  faq: [f("question", "Question"), f("answer", "Answer", "textarea")],
  page: [f("title", "Title"), f("summary", "Summary", "textarea"), f("body", "Body", "richtext")],
  navigationItem: [f("label", "Label")],
  navigation: [f("name", "Menu heading")],
  pageSection: [
    f("title", "Title"), f("subtitle", "Subtitle / eyebrow"), f("description", "Description", "textarea"),
    f("ctaLabel", "Primary button label"), f("cta2Label", "Secondary button label"),
    f("list", "List", "list"), f("items", "Items", "items"), f("stats", "Stats", "stats"),
  ],
  setting: [f("value", "Value", "textarea")],
};

/** Admin resource key → translation entity type. */
export const RESOURCE_ENTITY: Record<string, string> = {
  services: "service",
  solutions: "solution",
  industries: "industry",
  projects: "project",
  "project-categories": "projectCategory",
  team: "teamMember",
  "blog-posts": "blogPost",
  "blog-categories": "blogCategory",
  testimonials: "testimonial",
  faqs: "faq",
  pages: "page",
  "navigation-items": "navigationItem",
};

/** Site settings that have a Bengali version (edited in Admin → Settings). */
export const TRANSLATABLE_SETTINGS = [
  "site.tagline",
  "site.description",
  "site.positioning",
  "footer.about",
  "contact.address",
  "contact.hours",
] as const;

// ── Shared text ⇄ structure helpers ─────────────────────────

export type TitledItem = { title: string; description: string };

export function parseList(text: string): string[] {
  return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

export function parseItems(text: string): TitledItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const [title, ...rest] = line.split("|");
      return { title: (title ?? "").trim(), description: rest.join("|").trim() };
    })
    .filter((x) => x.title);
}

export function parseStats(text: string): { value: string; label: string }[] {
  return parseItems(text).map((i) => ({ value: i.title, label: i.description })).filter((s) => s.value && s.label);
}

export const listToText = (v: string[]) => v.join("\n");
export const itemsToText = (v: TitledItem[]) => v.map((i) => (i.description ? `${i.title} | ${i.description}` : i.title)).join("\n");
export const statsToText = (v: { value: string; label: string }[]) => v.map((s) => `${s.value} | ${s.label}`).join("\n");
