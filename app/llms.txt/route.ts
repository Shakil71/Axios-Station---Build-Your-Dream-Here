import { getSettings, listIndustries, listServices, listSolutions, listPosts } from "@/services/public";
import { str } from "@/lib/settings-schema";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

/**
 * /llms.txt — a plain-language summary of the company and its key pages for
 * AI assistants and AI search (ChatGPT, Perplexity, Gemini, Claude…).
 * Built from live CMS content, so it stays current automatically.
 */
export async function GET() {
  const [s, services, solutions, industries, posts] = await Promise.all([
    getSettings("en"),
    listServices("en"),
    listSolutions("en"),
    listIndustries("en"),
    listPosts({ perPage: 20 }, "en"),
  ]);
  const name = str(s, "site.name") || "Axios Station";
  const contact = [str(s, "contact.email") && `Email: ${str(s, "contact.email")}`, str(s, "contact.phone") && `Phone: ${str(s, "contact.phone")}`, str(s, "contact.address") && `Address: ${str(s, "contact.address").replace(/\s*\n\s*/g, ", ")}`]
    .filter(Boolean)
    .join("\n");
  const list = (rows: { title: string; excerpt: string; slug: string }[], base: string) =>
    rows.map((r) => `- [${r.title}](${siteUrl(`${base}/${r.slug}`)}): ${r.excerpt}`).join("\n");

  const body = `# ${name}

> ${str(s, "site.description")}

${name} is a technology company from Bangladesh, founded in ${str(s, "site.foundingYear") || "2024"}. It builds custom software, AI integrations, cloud infrastructure, ERP, CRM, POS, hotel and HR systems, and provides IT support and digital marketing. The website is available in English and Bengali (${siteUrl("/bn")}).

## Key pages
- [Home](${siteUrl("/")})
- [About](${siteUrl("/about")})
- [Services](${siteUrl("/services")})
- [Solutions](${siteUrl("/solutions")})
- [Industries](${siteUrl("/industries")})
- [Portfolio](${siteUrl("/portfolio")})
- [Team](${siteUrl("/team")})
- [Blog](${siteUrl("/blog")})
- [Contact](${siteUrl("/contact")})

## Services
${list(services, "/services")}

## Solutions
${list(solutions, "/solutions")}

## Industries
${list(industries, "/industries")}

## Articles
${list(posts.items, "/blog")}
${contact ? `\n## Contact\n${contact}\n` : `\n## Contact\n- [Contact form](${siteUrl("/contact")})\n`}`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
