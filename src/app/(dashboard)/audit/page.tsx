"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

const PLACEHOLDER_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyToken {
    // Paste your Solidity contract here...
}`;

type InputMode = "editor" | "upload";

export default function AuditPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<InputMode>("editor");
  const [code, setCode] = useState("");
  const [contractName, setContractName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".sol")) {
      setError("Only .sol files are supported.");
      return;
    }
    if (file.size > 100_000) {
      setError("File exceeds 100KB limit.");
      return;
    }
    setError(null);
    setUploadedFile(file);
    if (!contractName) {
      setContractName(file.name.replace(".sol", ""));
    }
    const reader = new FileReader();
    reader.onload = (e) => setCode(e.target?.result as string);
    reader.readAsText(file);
  }, [contractName]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleSubmit = async () => {
    const contractCode = code.trim();
    if (!contractCode || contractCode === PLACEHOLDER_CONTRACT.trim()) {
      setError("Please paste or upload a Solidity contract.");
      return;
    }
    if (contractCode.length < 10) {
      setError("Contract code is too short.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractCode,
          contractName: contractName.trim() || undefined,
        }),
      });

      // Always try to parse JSON first; fall back to a status-based message
      // if the server returned HTML (e.g. a Vercel 504 timeout page).
      let data: { error?: string; auditId?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        if (res.status === 504 || res.status === 524) {
          setError(
            "The audit timed out — the contract may be too complex. Try again or split it into smaller files.",
          );
        } else {
          setError(`Server error (${res.status}). Please try again.`);
        }
        return;
      }

      if (!res.ok) {
        setError(data?.error ?? "Failed to run audit. Please try again.");
        return;
      }

      router.push(`/audit/${data!.auditId}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const editorTheme = EditorView.theme({
    "&": { backgroundColor: "transparent" },
    ".cm-gutters": { backgroundColor: "transparent", borderRight: "1px solid #27272a" },
    ".cm-activeLineGutter": { backgroundColor: "#27272a40" },
    ".cm-activeLine": { backgroundColor: "#27272a40" },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">New Audit</h1>
        <p className="text-zinc-400">
          Paste your Solidity contract or upload a{" "}
          <span className="font-mono text-zinc-300">.sol</span> file to get a
          security report in seconds.
        </p>
      </div>

      {/* Contract Name */}
      <div className="mb-6">
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          Contract name{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <input
          type="text"
          className="input max-w-sm"
          placeholder="e.g. MyToken, StakingVault"
          value={contractName}
          onChange={(e) => setContractName(e.target.value)}
          disabled={isLoading}
          maxLength={100}
        />
      </div>

      {/* Mode Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 w-fit">
        <button
          onClick={() => setMode("editor")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "editor"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          disabled={isLoading}
        >
          Paste Code
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "upload"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          disabled={isLoading}
        >
          Upload .sol
        </button>
      </div>

      {/* Editor / Upload Panel */}
      <div className="mb-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        {mode === "editor" ? (
          <div className="min-h-[420px]">
            {/* Editor toolbar */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
              </div>
              <span className="text-xs text-zinc-500">Solidity</span>
              {code && (
                <button
                  onClick={() => setCode("")}
                  className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                  disabled={isLoading}
                >
                  Clear
                </button>
              )}
            </div>
            <CodeMirror
              value={code}
              height="420px"
              extensions={[javascript({ jsx: false }), editorTheme]}
              theme={oneDark}
              placeholder={PLACEHOLDER_CONTRACT}
              onChange={setCode}
              editable={!isLoading}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                highlightActiveLineGutter: true,
                autocompletion: true,
                bracketMatching: true,
              }}
              style={{ fontSize: "13px" }}
            />
          </div>
        ) : (
          /* Upload Zone */
          <div
            className={`flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 transition-colors ${
              isDragging
                ? "border-2 border-dashed border-green-500 bg-green-500/5"
                : "border-2 border-dashed border-transparent"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {uploadedFile ? (
              /* File Preview */
              <div className="flex w-full max-w-sm flex-col items-center gap-4">
                <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 w-full">
                  <SolFileIcon />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    aria-label="Remove file"
                    onClick={() => {
                      setUploadedFile(null);
                      setCode("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-zinc-500 transition-colors hover:text-zinc-300"
                    disabled={isLoading}
                  >
                    <XIcon />
                  </button>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  Replace file
                </button>
              </div>
            ) : (
              /* Drop area */
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800">
                  <UploadIcon />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-200">
                    Drop your{" "}
                    <span className="font-mono text-green-400">.sol</span> file
                    here
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    or click to browse — max 100KB
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  Choose file
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".sol"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertIcon />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={isLoading || (!code && !uploadedFile)}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 text-base"
        >
          {isLoading ? (
            <>
              <SpinnerIcon />
              Analyzing contract…
            </>
          ) : (
            <>
              <ShieldIcon />
              Run Security Audit
            </>
          )}
        </button>
        {isLoading && (
          <p className="text-sm text-zinc-500">
            This usually takes 15–30 seconds.
          </p>
        )}
      </div>

      {/* Disclaimer */}
      <p className="mt-6 text-xs text-zinc-600">
        This report is AI-generated and advisory only. High-value contracts
        should undergo human expert review.
      </p>
    </div>
  );
}

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function SolFileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-green-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
