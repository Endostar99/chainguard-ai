// TODO: Implement audit history page
// - Fetch all audits for the current user from Supabase
// - Show: contract name, date, trust score badge, link to report
// - Empty state if no audits yet
// - Pagination if many audits

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">Audit History</h1>
      <p className="mb-8 text-zinc-400">All your past smart contract audits.</p>

      <div className="card">
        <p className="text-zinc-400">
          Audit history list — fetch from Supabase `audits` table filtered by user_id.
        </p>
      </div>
    </div>
  );
}
