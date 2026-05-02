"use client";

import { useState } from "react";
import { Loader2, Settings } from "lucide-react";

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Settings className="h-4 w-4" />
        )}
        {loading ? "Redirecting…" : "Manage subscription"}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
