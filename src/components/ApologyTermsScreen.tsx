import { useState, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { Heart, Sparkles, Check } from './Icons';

interface ApologyTermsScreenProps {
  onAccept: () => void;
  bottleId: string;
}

export const ApologyTermsScreen: FC<ApologyTermsScreenProps> = ({
  onAccept,
  bottleId,
}) => {
  const [declinePosition, setDeclinePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [declineAttempts, setDeclineAttempts] = useState<number>(0);
  const [isAccepted, setIsAccepted] = useState<boolean>(false);
  const [playfulNote, setPlayfulNote] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const playfulMessages = [
    'Oops! Button slipped away 🙈',
    'Error: Decline option not found! Try Accept 💕',
    'Dodong is very sorry, please? 🥺',
    'Too slow! Dodong loves you too much 🏃‍♂️💨',
    'No declining allowed! Say yes please 🥰',
    'Just tap Accept already! ❤️',
  ];

  // Runaway button mechanic: teleports when touched, hovered, or clicked
  const moveDeclineButton = useCallback((e?: React.SyntheticEvent) => {
    if (e && e.type === 'touchstart') {
      try {
        (e as any).preventDefault?.();
      } catch {}
    }

    // Tightly bounded for mobile phone screens so it never overflows or causes scroll
    const maxX = 65;
    const maxY = 38;
    
    // Generate new random offset that doesn't stay near 0
    let newX = (Math.random() * 2 - 1) * maxX;
    let newY = (Math.random() * 2 - 1) * maxY;
    
    // Ensure it moves noticeably
    if (Math.abs(newX) < 25) newX = newX < 0 ? -45 : 45;
    if (Math.abs(newY) < 16) newY = newY < 0 ? -28 : 28;

    setDeclinePosition({ x: Math.round(newX), y: Math.round(newY) });
    setDeclineAttempts((prev) => {
      const next = prev + 1;
      setPlayfulNote(playfulMessages[(next - 1) % playfulMessages.length]);
      return next;
    });

    // Device haptic vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([30, 40]);
      } catch {
        // ignore
      }
    }
  }, [playfulMessages]);

  const handleAcceptClick = () => {
    setIsAccepted(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 100, 60, 120]);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      onAccept();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-rose-50/70 via-sky-50/50 to-white text-slate-900 overflow-y-auto overflow-x-hidden touch-scroll">
      {/* Soft romantic ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-rose-200/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-cyan-200/35 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-pink-200/40 rounded-full blur-3xl"></div>
      </div>

      {/* Header Bar */}
      <header className="relative z-10 pt-safe px-5 pb-3 flex items-center justify-between border-b border-rose-100 bg-white/85 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-cyan-500 flex items-center justify-center shadow-md shadow-rose-500/20 text-white">
            <Heart size={18} className="fill-white" />
          </div>
          <div>
            <div className="text-base font-black tracking-tight leading-none text-slate-900">
              Sip <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-500">n</span> Go
            </div>
            <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest leading-none">
              Special Agreement
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-xs text-rose-700 font-bold shadow-2xs">
          <span>Bottle #{bottleId}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-md mx-auto w-full px-5 py-6 flex flex-col justify-between">
        {/* Title & Prompt */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/80 border border-rose-200 text-rose-700 text-xs font-bold mb-2.5">
            <Sparkles size={13} className="text-rose-500" />
            <span>Important Terms of Service</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 m-0 leading-tight">
            To gain access to Sip n Go, you must accept the Terms and Conditions
          </h1>
          <p className="text-slate-500 text-xs mt-1.5">
            Please review the required agreement below before proceeding to the water stations.
          </p>
        </div>

        {/* The Apology Letter Card (Styled like a legal terms document) */}
        <div className="bg-white rounded-3xl border border-rose-200/90 shadow-xl shadow-rose-500/5 p-5 text-left relative overflow-hidden">
          {/* Subtle watermark */}
          <div className="absolute -bottom-8 -right-8 w-32 h-32 text-rose-100/60 pointer-events-none">
            <Heart size={128} className="fill-rose-50 stroke-rose-100" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                Official Addendum
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Effective: Always & Forever
              </span>
            </div>

            {/* Apology Body */}
            <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed font-sans max-h-56 overflow-y-auto pr-1">
              {/* The required exact text highlighted */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 text-rose-950">
                <p className="text-sm font-black text-rose-600 tracking-tight m-0">
                  "Im very sorry. Can you forgive dodong?" 🥺
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                  Clause 1: Dodong's Confession
                </h4>
                <p className="text-slate-600">
                  Dodong acknowledges being wrong and making his favorite person upset. Dodong misses your smile and feels terrible about it.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                  Clause 2: Terms of Reconciliation
                </h4>
                <p className="text-slate-600">
                  By accepting these terms, you agree to give Dodong another chance. In exchange, Dodong legally covenants to:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600 text-[11px]">
                  <li>Listen attentively and communicate better.</li>
                  <li>Always make sure your Sip n Go bottle is filled with ice-cold water.</li>
                  <li>Provide unlimited warm hugs, snacks, and sweet treats.</li>
                  <li>Love you more than yesterday and less than tomorrow.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                  Clause 3: Non-Declination Clause
                </h4>
                <p className="text-slate-600 text-[11px]">
                  Under subsection 3.1, declining this apology is deemed emotionally impossible. Attempting to click Decline will trigger evasive evasions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Playful hint / message when decline is tapped */}
        {playfulNote && (
          <div className="mt-3 py-2 px-3.5 rounded-2xl bg-rose-100/90 border border-rose-300 text-rose-800 text-xs font-bold text-center animate-bounce shadow-sm">
            {playfulNote}
          </div>
        )}

        {/* Buttons Action Area with safe-area padding */}
        <div ref={containerRef} className="mt-5 relative pb-safe">
          {/* Success Heart Explosion State */}
          {isAccepted ? (
            <div className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-500 text-white font-black text-sm text-center shadow-xl shadow-rose-500/30 animate-pulse flex items-center justify-center gap-2">
              <Heart size={20} className="fill-white animate-bounce" />
              <span>Yay! Dodong is forgiven! Loading Sip n Go... ❤️</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* PRIMARY ACCEPT BUTTON */}
              <button
                onClick={handleAcceptClick}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-cyan-600 hover:from-rose-600 hover:to-cyan-700 text-white font-black text-sm shadow-xl shadow-rose-500/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Check size={18} />
                <span>Accept & Forgive Dodong ❤️</span>
              </button>

              {/* RUNAWAY DECLINE BUTTON */}
              <div className="relative h-12 flex items-center justify-center">
                <button
                  type="button"
                  onMouseEnter={moveDeclineButton}
                  onTouchStart={moveDeclineButton}
                  onPointerDown={moveDeclineButton}
                  onClick={moveDeclineButton}
                  style={{
                    transform: `translate(${declinePosition.x}px, ${declinePosition.y}px)`,
                    transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  className="py-2.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-semibold border border-slate-200 cursor-pointer shadow-xs select-none active:scale-90"
                >
                  {declineAttempts === 0
                    ? 'Decline'
                    : declineAttempts === 1
                    ? 'Are you sure? 🥺'
                    : declineAttempts === 2
                    ? "Can't click me! 🏃"
                    : 'Decline (Dodong is sorry!)'}
                </button>
              </div>
            </div>
          )}

          {/* Security & Love note */}
          <p className="mt-2 text-[10px] text-slate-400 text-center leading-tight">
            🔒 By clicking Accept, you consent to receive lifetime love, hydration, and loyalty.
          </p>
        </div>
      </main>
    </div>
  );
};
