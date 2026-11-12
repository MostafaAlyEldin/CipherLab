import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types/crypto';
import { translations } from '../utils/translations';
import {
  calculateImageCapacity,
  embedMessageInCanvas,
  extractMessageFromCanvas,
  generateVisualDifference,
} from '../utils/steganography';
import {
  Eye,
  EyeOff,
  Upload,
  Download,
  Lock,
  Unlock,
  Sparkles,
  Layers,
  Check,
  AlertCircle,
  Copy,
} from 'lucide-react';

interface SteganographyModuleProps {
  language: Language;
  onExplainWithAI: (context: string) => void;
  onAddHistory: (item: { module: string; operation: string; summary: string; detail?: string }) => void;
  onShowToast: (msg: { text: string; type: 'success' | 'error' | 'info' }) => void;
}

export const SteganographyModule: React.FC<SteganographyModuleProps> = ({
  language,
  onExplainWithAI,
  onAddHistory,
  onShowToast,
}) => {
  const t = translations[language];
  const [mode, setMode] = useState<'hide' | 'reveal'>('hide');

  // Hide state
  const [secretMessage, setSecretMessage] = useState(
    'MISSION TOP SECRET: Satellite override code is SIGMA-7741. Transmit via encrypted proxy.'
  );
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [stegoDataUrl, setStegoDataUrl] = useState<string | null>(null);
  const [imageCapacity, setImageCapacity] = useState<number>(0);
  const [usedBytes, setUsedBytes] = useState<number>(0);

  // Reveal state
  const [revealPassword, setRevealPassword] = useState('');
  const [extractedMessage, setExtractedMessage] = useState('');
  const [isEncryptedFlag, setIsEncryptedFlag] = useState(false);

  // Canvas references
  const origCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stegoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const revealCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate default sample image on canvas (cool digital abstract gradient pattern)
  const drawDefaultSampleImage = (canvas: HTMLCanvasElement) => {
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark cyber gradient with geometric shapes
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#091522');
    grad.addColorStop(0.5, '#0d2838');
    grad.addColorStop(1, '#0b1d1f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Cyber geometric wireframes & glowing circles
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, 320, 220);

    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(200, 150, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#059669';
    ctx.font = '16px monospace';
    ctx.fillText('CIPHERLAB CARRIER IMAGE', 75, 155);

    setImageCapacity(calculateImageCapacity(400, 300));
  };

  useEffect(() => {
    if (origCanvasRef.current) {
      drawDefaultSampleImage(origCanvasRef.current);
    }
  }, []);

  const handleImageUpload = (file: File, target: 'orig' | 'reveal') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = target === 'orig' ? origCanvasRef.current : revealCanvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          if (target === 'orig') {
            setImageCapacity(calculateImageCapacity(img.width, img.height));
            setStegoDataUrl(null);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    onShowToast({ text: `${file.name} loaded into canvas`, type: 'info' });
  };

  // Embed Message into LSB
  const handleEmbed = async () => {
    const canvas = origCanvasRef.current;
    if (!canvas) return;

    try {
      // Create duplicate canvas for stego
      const stegoCanvas = document.createElement('canvas');
      stegoCanvas.width = canvas.width;
      stegoCanvas.height = canvas.height;
      const stegoCtx = stegoCanvas.getContext('2d');
      if (!stegoCtx) return;
      stegoCtx.fillStyle = '#ffffff';
      stegoCtx.fillRect(0, 0, stegoCanvas.width, stegoCanvas.height);
      stegoCtx.drawImage(canvas, 0, 0);

      const pass = usePassword && password.trim() ? password : undefined;
      const res = await embedMessageInCanvas(stegoCanvas, secretMessage, pass);
      setStegoDataUrl(res.dataUrl);
      setUsedBytes(res.usedBytes);

      // Render onto visible stego canvas
      if (stegoCanvasRef.current) {
        stegoCanvasRef.current.width = canvas.width;
        stegoCanvasRef.current.height = canvas.height;
        const ctx = stegoCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(stegoCanvas, 0, 0);
        }
      }

      // Generate Difference Map
      if (diffCanvasRef.current) {
        const origCtx = canvas.getContext('2d');
        const sCtx = stegoCanvas.getContext('2d');
        if (origCtx && sCtx) {
          const origData = origCtx.getImageData(0, 0, canvas.width, canvas.height);
          const stegoData = sCtx.getImageData(0, 0, canvas.width, canvas.height);
          generateVisualDifference(origData, stegoData, diffCanvasRef.current);
        }
      }

      onShowToast({ text: 'Secret message embedded into pixel LSBs successfully!', type: 'success' });
      onAddHistory({
        module: 'Steganography',
        operation: 'LSB Hide',
        summary: `Embedded ${res.usedBytes} bytes into ${canvas.width}x${canvas.height} image ${
          pass ? '(AES-GCM Protected)' : ''
        }`,
      });
    } catch (err: any) {
      onShowToast({ text: err.message, type: 'error' });
    }
  };

  // Reveal Message from LSB
  const handleExtract = async () => {
    const canvas = revealCanvasRef.current || stegoCanvasRef.current;
    if (!canvas) {
      onShowToast({ text: 'No image found to extract from. Upload one first.', type: 'error' });
      return;
    }

    try {
      const res = await extractMessageFromCanvas(canvas, revealPassword);
      setExtractedMessage(res.message);
      setIsEncryptedFlag(res.isEncrypted);
      onShowToast({ text: 'Hidden message extracted!', type: 'success' });
      onAddHistory({
        module: 'Steganography',
        operation: 'LSB Reveal',
        summary: `Extracted: "${res.message.slice(0, 25)}..."`,
      });
    } catch (err: any) {
      onShowToast({ text: err.message, type: 'error' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {t.steganography}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono border border-cyan-500/30">
              HTML5 Canvas LSB
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Conceal confidential messages within image pixels using Least Significant Bit (LSB) encoding, with optional AES-GCM password locking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (origCanvasRef.current) drawDefaultSampleImage(origCanvasRef.current);
              setSecretMessage('EXFILTRATION PROTOCOL: Coordinates 37.7749° N, 122.4194° W.');
              onShowToast({ text: 'Sample image and secret loaded', type: 'info' });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500/50 hover:text-cyan-400 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.loadExample}</span>
          </button>

          <button
            onClick={() =>
              onExplainWithAI(
                'Explain digital image steganography: LSB substitution in RGB channels, human visual system imperceptibility, and combining steganography with AES encryption.'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.explainWithAI}</span>
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setMode('hide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
            mode === 'hide'
              ? 'bg-cyan-500 text-black shadow-md cyber-glow-cyan'
              : 'border border-slate-800 bg-[#0d131a] text-slate-300 hover:border-slate-700'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>{t.hideMessage}</span>
        </button>

        <button
          onClick={() => setMode('reveal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
            mode === 'reveal'
              ? 'bg-emerald-500 text-black shadow-md cyber-glow-green'
              : 'border border-slate-800 bg-[#0d131a] text-slate-300 hover:border-slate-700'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t.revealMessage}</span>
        </button>
      </div>

      {/* 1. HIDE MESSAGE WORKSPACE */}
      {mode === 'hide' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Secret Message to Conceal:
                </label>
                <span className="text-[11px] font-mono text-cyan-400">
                  {secretMessage.length} chars
                </span>
              </div>

              <textarea
                rows={3}
                value={secretMessage}
                onChange={(e) => setSecretMessage(e.target.value)}
                placeholder="Type confidential message to embed in image..."
                className="w-full p-3 rounded-xl border border-slate-800 bg-[#070b0f] text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 resize-none mb-3"
              />

              {/* Password Encryption Toggle */}
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-mono text-slate-300">
                      Layered AES-GCM Password Lock
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    className="accent-cyan-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {usePassword && (
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter passphrase to encrypt before hiding..."
                    className="w-full p-2 rounded-lg border border-slate-800 bg-[#070b0f] text-cyan-400 font-mono text-xs focus:outline-none focus:border-cyan-500 mt-1"
                  />
                )}
              </div>

              {/* Upload Custom Carrier Image */}
              <div className="border border-dashed border-slate-800 hover:border-cyan-500/40 rounded-xl p-3 text-center mb-4">
                <input
                  type="file"
                  id="carrier-upload"
                  accept="image/png,image/jpeg"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f, 'orig');
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="carrier-upload"
                  className="cursor-pointer text-xs font-mono text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload custom PNG/JPEG or use default canvas</span>
                </label>
              </div>

              {/* Capacity Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>{t.capacity}:</span>
                  <span className="text-emerald-400 font-bold">
                    {usedBytes} / {imageCapacity.toLocaleString()} Bytes (
                    {imageCapacity > 0 ? ((usedBytes / imageCapacity) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{
                      width: `${imageCapacity > 0 ? Math.min(100, (usedBytes / imageCapacity) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleEmbed}
                  disabled={!secretMessage}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold text-xs hover:bg-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Embed Message into LSB
                </button>

                {stegoDataUrl && (
                  <a
                    href={stegoDataUrl}
                    download="cipherlab_stego.png"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Visual Side-by-Side Comparison & Diff */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4">
                Visual Inspection: Original vs. Stego vs. Bit Diff Map
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original */}
                <div className="p-3 rounded-xl border border-slate-800 bg-[#070b0f] flex flex-col items-center">
                  <span className="text-[11px] font-mono text-slate-400 mb-2">
                    {t.originalImage}
                  </span>
                  <canvas ref={origCanvasRef} className="max-w-full h-auto rounded border border-slate-800" />
                </div>

                {/* Stego */}
                <div className="p-3 rounded-xl border border-slate-800 bg-[#070b0f] flex flex-col items-center">
                  <span className="text-[11px] font-mono text-cyan-400 mb-2 font-semibold">
                    {t.stegoImage} (Imperceptible to eye)
                  </span>
                  <canvas ref={stegoCanvasRef} className="max-w-full h-auto rounded border border-slate-800" />
                </div>
              </div>

              {/* Bit Difference Map */}
              <div className="mt-4 p-3 rounded-xl border border-slate-800 bg-[#070b0f] flex flex-col items-center">
                <span className="text-[11px] font-mono text-emerald-400 mb-2 font-semibold">
                  {t.differenceMap} (Neon cyan pixels indicate modified LSB bits)
                </span>
                <canvas ref={diffCanvasRef} className="max-w-full h-auto rounded border border-slate-800" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REVEAL MESSAGE WORKSPACE */}
      {mode === 'reveal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
                Extract Secret Payload from Image
              </h3>

              <div className="border border-dashed border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 text-center mb-4">
                <input
                  type="file"
                  id="reveal-upload"
                  accept="image/png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f, 'reveal');
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="reveal-upload"
                  className="cursor-pointer text-xs font-mono text-slate-400 hover:text-emerald-400 flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <span>Upload Stego PNG to extract</span>
                </label>
              </div>

              <div className="mb-4">
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Decryption Passphrase (if password was used when hiding):
                </label>
                <input
                  type="text"
                  value={revealPassword}
                  onChange={(e) => setRevealPassword(e.target.value)}
                  placeholder="Enter passphrase if required..."
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-[#070b0f] text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleExtract}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                Extract Secret Message
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Extracted Message Output
                </h3>
                {isEncryptedFlag && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    <Lock className="w-3 h-3" /> AES-256-GCM Verified
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#070b0f] text-emerald-300 font-mono text-sm break-all select-all min-h-[140px] cyber-border-glow">
                {extractedMessage || 'Extracted payload will appear here after scanning...'}
              </div>

              <div className="mt-4">
                <span className="text-xs font-mono text-slate-400 block mb-2">Image Preview:</span>
                <canvas ref={revealCanvasRef} className="max-w-full h-auto rounded border border-slate-800" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
