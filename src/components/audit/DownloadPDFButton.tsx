"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  auditId: string;
  contractName?: string;
}

export default function DownloadPDFButton({ auditId, contractName }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/audit/${auditId}/pdf`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed to generate PDF.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = contractName
        ? `chainguard-${contractName}.pdf`
        : `chainguard-audit-${auditId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="no-print">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="btn-secondary flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {loading ? "Generating…" : "Download PDF"}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
