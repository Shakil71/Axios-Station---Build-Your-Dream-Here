import "server-only";
import { env } from "@/lib/env";

/**
 * Server-side AI provider adapter layer.
 *
 * Nothing in the UI uses AI yet. This module defines the contract so future
 * features (chatbot, lead classification, content assistance, document
 * processing) can call `getAIProvider()` without knowing which vendor is
 * configured. API keys are read from server env only and never sent to the browser.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIProvider {
  readonly id: "openai" | "anthropic";
  complete(input: { messages: ChatMessage[]; maxTokens?: number; temperature?: number }): Promise<string>;
}

class OpenAIProvider implements AIProvider {
  readonly id = "openai" as const;
  constructor(private apiKey: string, private model = "gpt-4o-mini") {}
  async complete({ messages, maxTokens = 512, temperature = 0.3 }: Parameters<AIProvider["complete"]>[0]) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, messages, max_tokens: maxTokens, temperature }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content ?? "";
  }
}

class AnthropicProvider implements AIProvider {
  readonly id = "anthropic" as const;
  constructor(private apiKey: string, private model = "claude-sonnet-5-5") {}
  async complete({ messages, maxTokens = 512, temperature = 0.3 }: Parameters<AIProvider["complete"]>[0]) {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": this.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        system: system || undefined,
        messages: messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Anthropic request failed: ${res.status}`);
    const json = (await res.json()) as { content?: { type: string; text?: string }[] };
    return json.content?.filter((c) => c.type === "text").map((c) => c.text ?? "").join("") ?? "";
  }
}

/** Returns the configured provider, or null when AI is not configured. */
export function getAIProvider(): AIProvider | null {
  if (env.AI_PROVIDER === "openai" && env.OPENAI_API_KEY) return new OpenAIProvider(env.OPENAI_API_KEY);
  if (env.AI_PROVIDER === "anthropic" && env.ANTHROPIC_API_KEY) return new AnthropicProvider(env.ANTHROPIC_API_KEY);
  return null;
}

export function aiStatus() {
  const p = getAIProvider();
  return { configured: Boolean(p), provider: p?.id ?? null };
}
