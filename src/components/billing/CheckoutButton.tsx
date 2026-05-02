"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  priceId: string;
  children: React.ReactNode;
  className?: string;
}

export default function CheckoutButton({
  priceId,
  children,
  className = "btn-primary w-full",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      // Parse JSON separately so a server crash (HTML response) shows a
      // useful status code rather than the generic "Network error" message.
      let data: { url?: string; error?: string };
      try {
        data = await res.json();
      } catch {
        setError(`Server error (HTTP ${res.status}). Check the dev console.`);
        setLoading(false);
        return;
      }

      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Could not reach the server. Check your connection.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className={cn(className, "flex items-center justify-center gap-2")}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Redirecting…" : children}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
