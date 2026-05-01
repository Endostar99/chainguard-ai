import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AUDIT_SYSTEM_PROMPT, buildAuditUserMessage } from "./audit-prompt";
import type { AuditReport } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8096;

// ─── Runtime schema for Claude's response ────────────────────────────────────
// Prevents malformed AI output from reaching the database.

const VulnerabilitySchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  description: z.string(),
  impact: z.string(),
  affectedLines: z.array(z.number().int()).default([]),
  vulnerableCode: z.string().optional(),
  fixSuggestion: z.string(),
  fixCode: z.string().optional(),
  reference: z.string().optional(),
});

const AuditReportSchema = z.object({
  executiveSummary: z.string().min(1),
  trustScore: z.number().int().min(0).max(100),
  severityBreakdown: z.object({
    critical: z.number().int().min(0),
    high: z.number().int().min(0),
    medium: z.number().int().min(0),
    low: z.number().int().min(0),
    info: z.number().int().min(0),
  }),
  vulnerabilities: z.array(VulnerabilitySchema),
  auditedAt: z.string().optional(),
  model: z.string().optional(),
});

export async function runAudit(
  contractCode: string,
  contractName?: string,
): Promise<AuditReport> {
  const userMessage = buildAuditUserMessage(contractCode, contractName);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // Prompt caching: the system prompt is large and static — cache it to cut
    // ~90% of input token cost on repeated calls within the 5-minute TTL.
    system: [
      {
        type: "text",
        text: AUDIT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  // Strip accidental markdown fences (```json ... ```)
  const rawJson = block.text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    console.error("Claude returned non-JSON:", rawJson.slice(0, 400));
    throw new Error("Claude returned malformed JSON. Please retry.");
  }

  const validation = AuditReportSchema.safeParse(parsed);
  if (!validation.success) {
    console.error(
      "Claude response failed schema validation:",
      JSON.stringify(validation.error.flatten(), null, 2),
    );
    throw new Error("Claude returned an unexpected report structure. Please retry.");
  }

  return {
    ...validation.data,
    auditedAt: new Date().toISOString(),
    model: MODEL,
  } as AuditReport;
}
