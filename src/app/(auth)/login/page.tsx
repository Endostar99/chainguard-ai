import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

interface Props {
  searchParams: Promise<{
    next?: string;
    message?: string;
  }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { next, message } = await searchParams;

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
          <p className="mt-2 text-sm text-zinc-400">Sign in to your account</p>
        </div>

        <div className="card">
          {message && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {decodeURIComponent(message)}
            </div>
          )}
          <LoginForm nextPath={next} />
        </div>
      </div>
    </div>
  );
}
