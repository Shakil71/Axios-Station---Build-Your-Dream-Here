import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/primitives";
import { aiStatus } from "@/lib/ai";

export const metadata = { title: "AI Integrations" };

const PLANNED = [
  { title: "AI chatbot / customer support", description: "Answer visitor questions from published services, solutions and FAQs." },
  { title: "AI lead classification", description: "Tag and prioritise new inquiries by service, budget and urgency." },
  { title: "AI content assistance", description: "Draft blog outlines, meta descriptions and alt text for editors to review." },
  { title: "Intelligent document processing", description: "Extract structured data from uploaded PDFs and forms." },
  { title: "Automated customer communication", description: "Suggested replies to inquiries, always reviewed by a person before sending." },
];

export default async function AiPage() {
  await requirePagePermission("maintenance.manage");
  const status = aiStatus();
  return (
    <>
      <AdminPageHeader title="AI Integrations" description="Server-side provider adapters (lib/ai). API keys live only in the server environment and are never sent to the browser." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Panel title="Provider status">
          {status.configured ? (
            <p className="text-sm"><Badge tone="success">Configured</Badge> <span className="ml-2">Provider: <strong>{status.provider}</strong></span></p>
          ) : (
            <p className="text-sm"><Badge tone="muted">Not configured</Badge></p>
          )}
          <p className="mt-4 text-xs text-muted">Set <code>AI_PROVIDER</code> (openai | anthropic) and the matching API key in the server <code>.env</code>, then restart the app.</p>
        </Panel>
        <Panel title="Ready-to-build AI features" description="The adapter layer is in place. These features are not active yet — none of them run on the site today.">
          <ul className="space-y-4">
            {PLANNED.map((p) => (
              <li key={p.title} className="flex items-start justify-between gap-4">
                <span><span className="block text-sm font-semibold">{p.title}</span><span className="text-sm text-muted">{p.description}</span></span>
                <Badge tone="muted">Planned</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
