"use client";

import { Download } from "lucide-react";

interface Props {
  contractName?: string;
}

export default function DownloadPDFButton({ contractName }: Props) {
  const handlePrint = () => {
    const title = contractName
      ? `ChainGuard Audit — ${contractName}`
      : "ChainGuard AI Audit Report";
    const prev = document.title;
    document.title = title;
    window.print();
    document.title = prev;
  };

  return (
    <button
      onClick={handlePrint}
      className="btn-secondary flex items-center gap-2 no-print"
    >
      <Download className="w-4 h-4" />
      Download PDF
    </button>
  );
}
