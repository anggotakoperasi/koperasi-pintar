"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { X, Printer, Share2, Download, Loader2, Check, Copy, MessageCircle, Mail, Image } from "lucide-react";
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
  const cachedBlob = useRef<Blob | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const stableOnClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showShareMenu) setShowShareMenu(false);
        else stableOnClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, stableOnClose, showShareMenu]);

  useEffect(() => {
    if (!open) {
      cachedBlob.current = null;
      setImageReady(false);
      setShowShareMenu(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled || !contentRef.current) return;
      try {
        const canvas = await html2canvas(contentRef.current, {
          backgroundColor: "#0a1628",
          scale: 2,
          useCORS: true,
        });
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
        );
        if (!cancelled && blob) {
          cachedBlob.current = blob;
          setImageReady(true);
        }
      } catch { /* pre-capture failed */ }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open]);

  if (!open) return null;

  const getBlob = async (): Promise<Blob | null> => {
    if (cachedBlob.current) return cachedBlob.current;
    if (!contentRef.current) return null;
    const canvas = await html2canvas(contentRef.current, {
      backgroundColor: "#0a1628",
      scale: 2,
      useCORS: true,
    });
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );
    if (blob) {
      cachedBlob.current = blob;
      setImageReady(true);
    }
    return blob;
  };

  const triggerDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePrint = () => {
    if (!contentRef.current) return;
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#111;background:#fff}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px}
      th{background:#f5f5f5;font-weight:600}
      h2{margin:0 0 4px;font-size:18px} h3{margin:0 0 16px;font-size:13px;color:#666;font-weight:normal}
      .header{text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #333}
      .row{display:flex;gap:8px;margin-bottom:6px} .label{color:#666;min-width:140px;font-size:13px} .value{font-weight:500;font-size:13px}
    </style></head><body>`);
    w.document.write(`<div class="header"><h2>PRIMKOPPOL RESOR SUBANG</h2><h3>Jl. Otista No.52, Subang</h3></div>`);
    w.document.write(contentRef.current.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await getBlob();
      if (blob) triggerDownload(blob);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await getBlob();
      if (!blob) return;

      await new Promise((r) => setTimeout(r, 150));

      if (typeof navigator.share === "function") {
        const file = new File([blob], `${filename}.jpg`, { type: "image/jpeg" });
        const canFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

        if (canFiles) {
          try {
            await navigator.share({ title, files: [file] });
            return;
          } catch (e) {
            if ((e as Error).name === "AbortError") return;
          }
        }

        try {
          await navigator.share({ title, text: `${title} - PRIMKOPPOL Resor Subang` });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }

      setShowShareMenu(true);
    } catch {
      setShowShareMenu(true);
    } finally {
      setSharing(false);
    }
  };

  const shareText = `${title} - PRIMKOPPOL Resor Subang`;

  const handleShareDownload = async () => {
    const blob = await getBlob();
    if (blob) triggerDownload(blob);
    setShowShareMenu(false);
  };

  const handleShareCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch { /* ignore */ }
    setShowShareMenu(false);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    setShowShareMenu(false);
  };

  const handleShareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText)}`, "_blank");
    setShowShareMenu(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) { setShowShareMenu(false); onClose(); } }}
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

        <div className="relative flex gap-2 border-t border-navy-700/60 px-5 py-4 shrink-0">
          <button type="button" onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-500 py-2.5 text-sm font-medium text-white transition-colors">
            <Printer className="w-4 h-4" /> Cetak
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-navy-700 hover:bg-navy-600 disabled:opacity-60 py-2.5 text-sm font-medium text-white transition-colors"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success-600 hover:bg-success-500 disabled:opacity-60 py-2.5 text-sm font-medium text-white transition-colors"
          >
            {sharing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : imageReady
                ? <><Share2 className="w-4 h-4" /><Check className="w-3 h-3 -ml-1 text-success-300" /></>
                : <Share2 className="w-4 h-4" />
            }
            {" "}Share
          </button>

          {showShareMenu && (
            <div className="absolute bottom-full right-4 mb-2 w-56 rounded-xl border border-navy-600/50 bg-navy-900 shadow-2xl shadow-black/50 overflow-hidden z-10">
              <div className="px-3 py-2 border-b border-navy-700/60">
                <p className="text-xs font-medium text-navy-300">Bagikan melalui</p>
              </div>
              <div className="py-1">
                <button type="button" onClick={handleShareDownload} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white hover:bg-navy-800 transition-colors">
                  <Image className="w-4 h-4 text-accent-400" /> Download Gambar
                </button>
                <button type="button" onClick={handleShareCopy} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white hover:bg-navy-800 transition-colors">
                  <Copy className="w-4 h-4 text-navy-300" /> Salin Teks
                </button>
                <button type="button" onClick={handleShareWhatsApp} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white hover:bg-navy-800 transition-colors">
                  <MessageCircle className="w-4 h-4 text-success-400" /> WhatsApp
                </button>
                <button type="button" onClick={handleShareEmail} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white hover:bg-navy-800 transition-colors">
                  <Mail className="w-4 h-4 text-warning-400" /> Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
