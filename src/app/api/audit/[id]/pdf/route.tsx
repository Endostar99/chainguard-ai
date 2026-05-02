import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AuditRow } from "@/types";
import AuditPDFDocument from "@/lib/pdf/AuditPDFDocument";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    return Response.json({ error: "Audit not found" }, { status: 404 });
  }

  const audit = data as AuditRow;
  const contractName =
    audit.contract_name ?? `Contract-${id.slice(0, 8).toUpperCase()}`;

  try {
    // Cast required: renderToBuffer expects ReactElement<DocumentProps> but JSX
    // gives ReactElement<Props>; the runtime shape is identical.
    const doc = (
      <AuditPDFDocument audit={audit} contractName={contractName} />
    ) as unknown as ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(doc);

    const slug = contractName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
    const date = new Date(audit.created_at).toISOString().slice(0, 10);
    const filename = `chainguard-${slug}-${date}.pdf`;

    // Buffer → Uint8Array so the Web Response BodyInit accepts it
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[pdf] Generation failed:", err);
    return Response.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
