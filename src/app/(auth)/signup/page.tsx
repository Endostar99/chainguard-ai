import type { Metadata } from "next";
import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold tracking-tight text-zinc-100">
              Chain<span className="text-green-400">Guard</span>{" "}
              <span className="text-zinc-400 font-normal">AI</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-zinc-400">
            Start auditing smart contracts for free
          </p>
        </div>

        <div className="card">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-zinc-100">Create your account</h1>
            <p className="mt-1 text-sm text-zinc-400">
              3 free audits/month. No credit card required.
            </p>
          </div>
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
