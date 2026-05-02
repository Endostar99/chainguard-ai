import Link from "next/link";
import { Shield, Zap, FileText, Award } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-500" />
            <span className="text-lg font-bold">ChainGuard AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-zinc-400 hover:text-zinc-100">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-4 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
          AI-Powered Security Audits
        </div>
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight">
          Smart contract audits{" "}
          <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            built for founders
          </span>
          , not just engineers
        </h1>
        <p className="mb-10 max-w-2xl text-lg text-zinc-400">
          Paste your Solidity contract — get a plain-English security report in under 5 minutes.
          Powered by Claude AI. No $50,000 audit firm required.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/audit" className="btn-primary px-8 py-3 text-base">
            Run free audit →
          </Link>
          <span className="text-sm text-zinc-500">No credit card · 3 free audits/month</span>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Zap,
              title: "5-minute reports",
              desc: "Get results in minutes, not weeks. No scheduling, no waiting lists.",
            },
            {
              icon: FileText,
              title: "Plain-English reports",
              desc: "Findings explained in language founders actually understand.",
            },
            {
              icon: Shield,
              title: "OWASP Top 10 coverage",
              desc: "Reentrancy, access control, flash loans, and 7 more attack vectors.",
            },
            {
              icon: Award,
              title: "Trust score badge",
              desc: "Share a verifiable 0–100 security score with your investors.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card">
              <Icon className="mb-3 h-6 w-6 text-green-500" />
              <h3 className="mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-zinc-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-zinc-500">
          <span>© 2026 ChainGuard AI. All rights reserved.</span>
          <p className="max-w-md text-right text-xs">
            AI-generated reports are advisory only. High-value contracts should undergo human expert
            review.
          </p>
        </div>
      </footer>
    </main>
  );
}
