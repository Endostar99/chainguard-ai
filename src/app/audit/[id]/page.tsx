import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Audit Report #${id.slice(0, 8)}`,
  };
}

// TODO: Implement audit results page
// - Fetch audit by ID from Supabase
// - Check ownership (user must own this audit or it's public)
// - Trust score gauge (0-100) — use Recharts RadialBarChart
// - Severity breakdown chart — use Recharts BarChart
// - Vulnerability cards (one per finding) — sorted by severity
// - Each card: title, severity badge, description, impact, fix suggestion, code diffs
// - Download PDF button — generates via react-pdf
// - Share button (if trust score >= 80) — links to /badge/[id]

export default async function AuditResultPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">Audit Report</h1>
      <p className="mb-8 font-mono text-sm text-zinc-500">{id}</p>

      <div className="card">
        <p className="text-zinc-400">
          Audit results page — fetch audit {id} from Supabase and render the full report.
        </p>
      </div>
    </div>
  );
}
