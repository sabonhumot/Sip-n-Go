import { useState } from 'react';
import type { FC } from 'react';
import { X, QrCode, Check, Droplet, Sparkles, RefreshCw, Download } from './Icons';
import type { BottleData } from '../types';

interface BottleQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  bottle: BottleData;
  onSimulateScan: (bottleId: string) => void;
}

export const BottleQRModal: FC<BottleQRModalProps> = ({
  isOpen,
  onClose,
  bottle,
  onSimulateScan,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeBottleId, setActiveBottleId] = useState(bottle.id);

  if (!isOpen) return null;

  const rawBaseUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.trim() || (window.location.origin + window.location.pathname);
  const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
  const qrTargetUrl = `${cleanBaseUrl}?bottle=${activeBottleId}&action=refill_nearby`;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(
    qrTargetUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrTargetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const res = await fetch(qrImageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sip-n-go-${activeBottleId}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrImageUrl, '_blank');
    }
  };

  const handleSimulate = () => {
    onSimulateScan(activeBottleId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[88vh] overflow-y-auto transform transition-all duration-300 scale-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-20 w-12 h-1.5 rounded-full bg-white/70"></div>
        {/* Header gradient banner */}
        <div className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 p-6 text-white text-left">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2 text-cyan-200 text-xs font-bold tracking-widest uppercase">
            <Sparkles size={14} />
            <span>Sip n Go Smart Bottle Tag</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white m-0">
            Bottle QR Code Link
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Scan this tag to instantly find and navigate to the nearest water refilling station.
          </p>
        </div>

        {/* Content body */}
        <div className="p-6 text-center">
          {/* QR Code Presentation Frame */}
          <div className="relative mx-auto w-64 h-64 bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 border-2 border-dashed border-cyan-400/50 shadow-inner flex flex-col items-center justify-center group">
            <img
              src={qrImageUrl}
              alt="Sip n Go Bottle QR Code"
              className="w-56 h-56 rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105"
            />
            {/* Watermark badge at center */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-md border-2 border-cyan-500 flex items-center justify-center">
                <Droplet size={20} className="text-cyan-500 fill-cyan-500" />
              </div>
            </div>
          </div>

          {/* Bottle Tag Info */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-xs font-mono font-bold border border-cyan-200 dark:border-cyan-800">
              ID: {activeBottleId}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
              ● Active & Paired
            </span>
          </div>

          {/* Encoded URL display */}
          <div className="mt-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all text-center border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 select-none block text-[10px] uppercase font-sans font-bold tracking-wider mb-0.5">
              QR Encoded Destination:
            </span>
            {qrTargetUrl}
          </div>

          {isLocalhost && !import.meta.env.VITE_APP_URL && (
            <div className="mt-2.5 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/50 text-[11px] text-sky-800 dark:text-sky-300 text-left leading-relaxed">
              💡 <strong>Automatic on Vercel:</strong> Because this uses dynamic domain detection, when deployed to Vercel (e.g. <code>https://sip-n-go.vercel.app</code>), the QR code will <strong>automatically point to your live Vercel URL</strong>, not localhost.
            </div>
          )}

          {/* How It Works Explainer */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-left border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              How the Bottle QR Experience Works
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-white text-base">1</div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">Scan from phone camera</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-white text-base">2</div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">Detects GPS location</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-white text-base">3</div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">Guides to clean refill</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleSimulate}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>Simulate QR Scan</span>
            </button>
            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800 font-medium text-xs transition-all cursor-pointer"
              title="Download QR code image to print on stickers or bottle"
            >
              <Download size={15} />
              <span>Download PNG</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-all cursor-pointer"
            >
              {copied ? <Check size={15} className="text-emerald-500" /> : <QrCode size={15} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Switch bottle demo */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Demo with other bottles:</span>
            {['SIP-8821', 'SIP-4019', 'SIP-1042'].map((id) => (
              <button
                key={id}
                onClick={() => setActiveBottleId(id)}
                className={`underline hover:text-cyan-500 transition-colors ${
                  activeBottleId === id ? 'text-cyan-600 dark:text-cyan-400 font-bold' : ''
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
