"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { X, Printer, Share2, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas-pro";

interface DetailPopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  filename?: string;
  children: React.ReactNode;
}

export default function DetailPopup({ open, onClose, title, filename = "detail", children }: DetailPopupProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const stableOnClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); stableOnClose(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, stableOnClose]);

  if (!open) return null;

  const captureImage = async (): Promise<Blob | null> => {
    if (!contentRef.current) return null;
    const canvas = await html2canvas(contentRef.current, {
      backgroundColor: "#0a1628",
      scale: 2,
      useCORS: true,
    });
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92));
  };

  const handlePrint = () => {
    if (!contentRef.current) return;
    const printWin = window.open("", "_blank", "width=800,height=600");
    if (!printWin) return;
    printWin.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#111;background:#fff}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px}
      th{background:#f5f5f5;font-weight:600}
      h2{margin:0 0 4px;font-size:18px} h3{margin:0 0 16px;font-size:13px;color:#666;font-weight:normal}
      .header{text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #333}
      .row{display:flex;gap:8px;margin-bottom:6px} .label{color:#666;min-width:140px;font-size:13px} .value{font-weight:500;font-size:13px}
    </style></head><body>`);
    printWin.document.write(`<div class="header"><h2>PRIMKOPPOL RESOR SUBANG</h2><h3>Jl. Otista No.52, Subang</h3></div>`);
    printWin.document.write(contentRef.current.innerHTML);
    printWin.document.write("</body></html>");
    printWin.document.close();
    setTimeout(() => { printWin.print(); }, 300);
  };

  const triggerDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await captureImage();
      if (blob) triggerDownload(blob);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await captureImage();
      if (!blob) return;
      const file = new File([blob], `${filename}.jpg`, { type: "image/jpeg" });

      let shared = false;
      if (typeof navigator.share === "function") {
        try {
          const canShareFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
          if (canShareFiles) {
            await navigator.share({ title, files: [file] });
            shared = true;
          } else {
            await navigator.share({ title, text: `${title} - PRIMKOPPOL Resor Subang` });
            shared = true;
          }
        } catch (e) {
          if ((e as Error).name === "AbortError") shared = true;
        }
      }

      if (!shared) triggerDownload(blob);
    } catch (err) {
      console.error("Share error:", err);
      try {
        const blob = await captureImage();
        if (blob) triggerDownload(blob);
      } catch { /* final fallback failed */ }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-navy-600/50 bg-navy-950 shadow-2xl shadow-black/40" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-navy-700/60 px-5 py-4 shrink-0">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-navy-400 hover:bg-navy-800 hover:text-white transition-colors" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <div ref={contentRef} className="bg-navy-900 rounded-xl p-4 text-sm text-white space-y-3">
            {children}
          </div>
        </div>

        <div className="flex gap-2 border-t border-navy-700/60 px-5 py-4 shrink-0">
          <button type="button" onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-500 py-2.5 text-sm font-medium text-white transition-colors">
            <Printer className="w-4 h-4" /> Cetak
          </button>
          <button type="button" onClick={handleDownload} disabled={downloading || sharing} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-navy-700 hover:bg-navy-600 disabled:opacity-50 py-2.5 text-sm font-medium text-white transition-colors">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download
          </button>
          <button type="button" onClick={handleShare} disabled={downloading || sharing} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success-600 hover:bg-success-500 disabled:opacity-50 py-2.5 text-sm font-medium text-white transition-colors">
            {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share
          </button>
        </div>
      </div>
    </div>
  );
}
