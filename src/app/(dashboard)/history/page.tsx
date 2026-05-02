import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileCode2, LogOut, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/(auth)/actions";
import { cn, formatDate, trustScoreColor } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit History" };

export default async function HistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: audits } = await supabase
    .from("audits")
    .select("id, contract_name, trust_score, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
            Audit History
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/audit" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New audit
          </Link>
          <form action={signout}>
            <button
              type="submit"
              className="btn-secondary flex items-center gap-2"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>

      {/* Audit list */}
      {!audits || audits.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {audits.map((audit) => (
            <AuditRow key={audit.id} audit={audit} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditRow({
  audit,
}: {
  audit: {
    id: string;
    contract_name: string | null;
    trust_score: number;
    created_at: string;
  };
}) {
  const scoreColor = trustScoreColor(audit.trust_score);
  const scoreLabel =
    audit.trust_score >= 80
      ? "Trusted"
      : audit.trust_score >= 60
        ? "Moderate"
        : audit.trust_score >= 40
          ? "Risky"
          : "Critical Risk";

  return (
    <Link
      href={`/audit/${audit.id}`}
      className="group flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-zinc-200 transition-colors">
        <FileCode2 className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-100">
          {audit.contract_name ?? "Untitled Contract"}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {formatDate(audit.created_at)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={cn("text-lg font-bold tabular-nums", scoreColor)}>
          {audit.trust_score}
        </p>
        <p className="text-xs text-zinc-500">{scoreLabel}</p>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
        <FileCode2 className="h-7 w-7 text-zinc-400" />
      </div>
      <p className="text-lg font-semibold text-zinc-100">No audits yet</p>
      <p className="mt-1 text-sm text-zinc-400">
        Run your first smart contract audit to see results here.
      </p>
      <Link href="/audit" className="btn-primary mt-6 flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Run your first audit
      </Link>
    </div>
  );
}
