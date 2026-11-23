import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import {
  Camera,
  Sparkles,
  SwitchCamera,
  Check,
  AlertTriangle,
  Upload,
  Lock,
} from './Icons';
import sipLogo from '../assets/SIP_N_GO_LOGO.png';

interface BottleScanGateProps {
  onUnlockBottle: (bottleId: string) => void;
  defaultBottleId?: string;
}

export const BottleScanGate: FC<BottleScanGateProps> = ({
  onUnlockBottle,
  defaultBottleId = 'SIP-8821',
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [scannedSuccessId, setScannedSuccessId] = useState<string | null>(null);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('Align bottle QR code in frame');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to extract bottle ID from URL or raw text
  const extractBottleId = (raw: string): string => {
    const text = raw.trim();
    try {
      if (text.includes('bottle=')) {
        const parsedUrl = new URL(
          text.startsWith('http') ? text : `http://localhost/${text.replace(/^\/?/, '')}`
        );
        const b = parsedUrl.searchParams.get('bottle');
        if (b) return b.toUpperCase();
      }
    } catch {
      // url parse fallback
    }
    const match = text.match(/SIP-?[A-Z0-9]+/i);
    if (match) {
      return match[0].toUpperCase();
    }
    return text.slice(0, 10).toUpperCase() || 'SIP-8821';
  };

  const handleBottleSuccess = useCallback(
    (rawId: string) => {
      const cleanId = extractBottleId(rawId);
      setScannedSuccessId(cleanId);
      setScanStatusMessage(`Bottle ${cleanId} Verified!`);

      // Trigger device haptic vibration if supported
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 80, 40]);
        } catch {
          // ignore
        }
      }

      // Stop video stream cleanly
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      // Brief animation before full unlock
      setTimeout(() => {
        onUnlockBottle(cleanId);
      }, 850);
    },
    [onUnlockBottle]
  );

  // Start in-browser camera stream
  const startCamera = async (targetFacingMode?: 'environment' | 'user') => {
    const mode =
      targetFacingMode === 'user' || targetFacingMode === 'environment'
        ? targetFacingMode
        : facingMode;
    setCameraError(null);
    setScanStatusMessage('Starting camera scanner...');
    // Mount the camera viewfinder in DOM immediately so videoRef is ready
    setIsCameraActive(true);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser. Use manual entry or upload.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('Video play warning:', e);
        }
      }

      setScanStatusMessage('Point camera at bottle QR code');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Could not access camera. Check permissions.';
      setCameraError(errorMsg);
      setIsCameraActive(false);
    }
  };

  // Ensure video element receives stream as soon as it mounts into DOM
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch((e) => console.warn('Video play warning:', e));
      }
    }
  }, [isCameraActive]);

  // Auto-start camera when Gate mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Toggle rear / front camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Frame processing loop for QR detection
  useEffect(() => {
    if (!isCameraActive || scannedSuccessId) return;

    const interval = window.setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.readyState < 2 || !canvas) return;

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width === 0 || height === 0) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, width, height);

      // Method 1: Check native BarcodeDetector API (fast on Chromium & Android)
      // @ts-ignore
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          // @ts-ignore
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            handleBottleSuccess(barcodes[0].rawValue);
            return;
          }
        } catch {
          // fallback to jsQR
        }
      }

      // Method 2: Check window.jsQR (loaded via CDN in index.html, works on iOS Safari & everywhere)
      // @ts-ignore
      if (typeof window !== 'undefined' && typeof window.jsQR === 'function') {
        try {
          const imageData = ctx.getImageData(0, 0, width, height);
          // @ts-ignore
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            handleBottleSuccess(code.data);
            return;
          }
        } catch {
          // ignore detection frame errors
        }
      }
    }, 280);

    scanIntervalRef.current = interval;

    return () => {
      window.clearInterval(interval);
    };
  }, [isCameraActive, scannedSuccessId, handleBottleSuccess]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Handle image upload from file or camera roll
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanStatusMessage('Analyzing uploaded image...');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        // @ts-ignore
        if (typeof window !== 'undefined' && typeof window.jsQR === 'function') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // @ts-ignore
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleBottleSuccess(code.data);
            return;
          }
        }
        setScanStatusMessage('No QR code detected in that photo. Try entering Bottle ID below.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = manualInput.trim() || defaultBottleId;
    handleBottleSuccess(id);
  };

  return (
    <div className="scan-gate fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-sky-50/80 via-slate-50 to-white text-slate-900 overflow-y-auto touch-scroll">
      {/* Background ambient lighting (soft, clean, light mode) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl"></div>
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Bar */}
      <header className="scan-gate-header relative z-10 pt-safe px-5 pb-3 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm border border-cyan-100 flex items-center justify-center p-0.5">
            <img
              src={sipLogo}
              alt="Sip n Go Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-base font-black tracking-tight leading-none text-slate-900">
              Sip <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">n</span> Go
            </div>
            <span className="text-[9px] font-bold text-cyan-600 uppercase tracking-widest leading-none">
              Smart Water Bottle
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs text-cyan-800 font-semibold shadow-2xs">
          <Lock size={12} className="text-cyan-600" />
          <span>Bottle Required</span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="scan-gate-main relative z-10 flex-1 max-w-md mx-auto w-full px-5 py-6 flex flex-col justify-between">
        {/* Intro Banner */}
        <div className="scan-gate-intro text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100/70 border border-cyan-200 text-cyan-800 text-xs font-semibold mb-3">
            <Sparkles size={13} className="text-cyan-600" />
            <span>Bottle Authentication</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 m-0">
            Your bottle opens the map.
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
            Scan your Sip n Go bottle to find nearby refill stations and keep track of every refill.
          </p>
        </div>

        {/* Scan Interactive Area */}
        <div className="scan-gate-stage flex-1 flex flex-col items-center justify-center">
          {/* Success Overlay state */}
          {scannedSuccessId ? (
            <div className="w-full max-w-sm p-6 rounded-3xl bg-white border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 mx-auto flex items-center justify-center mb-4 text-emerald-600 animate-pulse">
                <Check size={32} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Verified Bottle ID
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {scannedSuccessId}
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                Unlocking nearby Cebu water stations and pedestrian navigation...
              </p>
            </div>
          ) : isCameraActive ? (
            /* Live Camera Viewfinder (compact for mobile screens) */
            <div className="relative w-full max-w-[260px] aspect-square mx-auto rounded-3xl overflow-hidden border-2 border-cyan-500 shadow-2xl shadow-cyan-500/25 bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-8 pointer-events-none">
                {/* 4 Corner Markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl"></div>

                {/* Animated Laser Sweep Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-laser-sweep"></div>
              </div>

              {/* Status pill over video */}
              <div className="absolute bottom-3 inset-x-4 pointer-events-none">
                <div className="py-1 px-3 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-center text-[11px] font-medium text-cyan-300 truncate">
                  {scanStatusMessage}
                </div>
              </div>

              {/* Viewfinder Controls (Flip / Close) */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={toggleFacingMode}
                  className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all cursor-pointer border border-white/20"
                  title="Switch Camera (Front/Rear)"
                >
                  <SwitchCamera size={16} />
                </button>
                <button
                  onClick={stopCamera}
                  className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all cursor-pointer border border-white/20 text-xs font-bold"
                  title="Close Camera"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            /* Standby Card: Explaining the Bottle Gate & Scan Buttons */
            <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/60 p-6 text-center">
              {/* Bottle Graphic representation */}
              <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-100 to-blue-100 blur-xl"></div>
                <div className="relative w-20 h-20 rounded-2xl bg-white border border-cyan-200 flex flex-col items-center justify-center p-2 shadow-sm">
                  <img src={sipLogo} alt="Sip n Go" className="w-12 h-12 object-contain mb-0.5" />
                  <span className="text-[9px] font-mono font-bold text-cyan-800">SIP-TAG</span>
                </div>
              </div>

              <div className="text-sm text-slate-900 font-bold mb-1">
                Scan with this Device
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">
                Point your camera at the QR code printed on your Sip n Go bottle to verify access.
              </p>

              {cameraError && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-left text-xs flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Action 1: Open Live Camera Scanner */}
              <button
                onClick={() => startCamera()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 cursor-pointer"
              >
                <Camera size={18} />
                <span>Open Camera Scanner</span>
              </button>

              {/* Action 2: Upload photo / Snap photo fallback */}
              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="bottle-qr-upload-input"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all border border-slate-200 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Upload or Snap QR Photo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Manual Entry Fallback (Clean, No Demo/Testing Buttons) */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <div className="text-[11px] text-slate-500 mb-2 font-medium">
            Have your bottle ID? Enter code below:
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2 max-w-xs mx-auto">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              placeholder="e.g. SIP-8821"
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
            >
              Unlock
            </button>
          </form>

          {/* Informational Footer Note */}
          <p className="mt-3.5 text-[10px] text-slate-400 leading-tight">
            🔒 Sip n Go is 100% login-free. Your physical bottle tag acts as your secure identifier.
          </p>
        </div>
      </main>
    </div>
  );
};
