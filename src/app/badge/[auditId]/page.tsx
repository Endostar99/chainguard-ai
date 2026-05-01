import type { Metadata } from "next";

interface Props {
  params: Promise<{ auditId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { auditId } = await params;
  return {
    title: `ChainGuard Trust Certificate`,
    description: `Verified smart contract security certificate for audit ${auditId.slice(0, 8)}`,
  };
}

// TODO: Implement public trust badge page
// - Fetch audit by ID (public route — no auth required)
// - Only show if trust score >= 80
// - Display a visual certificate: contract name, score, date, ChainGuard logo
// - OG image for social sharing
// - "Run your own audit" CTA

export default async function BadgePage({ params }: Props) {
  const { auditId } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="card max-w-md text-center">
        <div className="mb-4 text-5xl font-bold text-green-400">✓</div>
        <h1 className="mb-2 text-2xl font-bold">Security Verified</h1>
        <p className="mb-4 font-mono text-sm text-zinc-500">{auditId}</p>
        <p className="text-zinc-400">
          Trust badge certificate — show for audits with score ≥ 80.
        </p>
      </div>
    </div>
  );
}
