import Anthropic from "@anthropic-ai/sdk";
import { AUDIT_SYSTEM_PROMPT, buildAuditUserMessage } from "./audit-prompt";
import type { AuditReport } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8096;

/**
 * Run a smart contract audit using the Claude API.
 * Returns a structured AuditReport or throws on failure.
 */
export async function runAudit(
  contractCode: string,
  contractName?: string,
): Promise<AuditReport> {
  const userMessage = buildAuditUserMessage(contractCode, contractName);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: AUDIT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  // Strip any accidental markdown code fences
  const rawJson = content.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let report: AuditReport;
  try {
    report = JSON.parse(rawJson);
  } catch (e) {
    console.error("Failed to parse Claude response as JSON:", rawJson);
    throw new Error("Claude returned malformed JSON. Please retry.");
  }

  // Stamp the audit time and model if not already set
  report.auditedAt = report.auditedAt ?? new Date().toISOString();
  report.model = MODEL;

  return report;
}
