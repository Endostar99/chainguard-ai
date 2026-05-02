import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ChainGuard AI — Smart Contract Auditor",
    template: "%s | ChainGuard AI",
  },
  description:
    "The first smart contract auditor built for founders, not just engineers. Paste your contract — get a plain-English security report in under 5 minutes.",
  keywords: ["smart contract audit", "solidity security", "blockchain security", "defi audit"],
  openGraph: {
    title: "ChainGuard AI",
    description: "AI-powered smart contract security audits for founders and developers.",
    siteName: "ChainGuard AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="min-h-screen bg-[#0a0a0a] text-zinc-100">{children}</body>
    </html>
  );
}
