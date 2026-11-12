import React, { useState, useEffect, useRef } from 'react';
import { ClassicalCipherType, ClassicalCipherResult, Language } from '../types/crypto';
import { translations } from '../utils/translations';
import {
  processCaesar,
  processVigenere,
  processPlayfair,
  processHill,
  processRailFence,
  processSubstitution,
  validateHillKey,
  invertMatrixMod26,
  generateRandomValidHillKey,
  generateKeyFromPhrase,
} from '../utils/classicalCiphers';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  ArrowRightLeft,
  Bot,
  AlertCircle,
} from 'lucide-react';

interface ClassicalModuleProps {
  language: Language;
  onExplainWithAI: (context: string) => void;
  onAddHistory: (item: { module: string; operation: string; summary: string; detail?: string }) => void;
  onShowToast: (msg: { text: string; type: 'success' | 'error' | 'info' }) => void;
}

export const ClassicalModule: React.FC<ClassicalModuleProps> = ({
  language,
  onExplainWithAI,
  onAddHistory,
  onShowToast,
}) => {
  const t = translations[language];

  const [cipherType, setCipherType] = useState<ClassicalCipherType>('caesar');
  const [inputText, setInputText] = useState('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG');
  const [isDecrypt, setIsDecrypt] = useState(false);
  const [outputResult, setOutputResult] = useState<ClassicalCipherResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Cipher-specific keys
  const [caesarShift, setCaesarShift] = useState<number>(3);
  const [vigenereKey, setVigenereKey] = useState<string>('CIPHER');
  const [playfairKey, setPlayfairKey] = useState<string>('MONARCHY');
  const [hillSize, setHillSize] = useState<2 | 3 | 4>(2);
  const [hillMatrix, setHillMatrix] = useState<number[][]>([[3, 3], [2, 5]]);
  const [railCount, setRailCount] = useState<number>(3);
  const [substitutionKey, setSubstitutionKey] = useState<string>(
    'QWERTYUIOPASDFGHJKLZXCVBNM'
  );

  const handleSetHillSize = (size: 2 | 3 | 4) => {
    setHillSize(size);
    if (size === 2) {
      setHillMatrix([[3, 3], [2, 5]]);
      if (inputText === 'ACT') setInputText('HELP');
    } else if (size === 3) {
      setHillMatrix([[6, 24, 1], [13, 16, 10], [20, 17, 15]]);
      if (inputText === 'HELP') setInputText('ACT');
    } else {
      setHillMatrix(generateRandomValidHillKey(4));
    }
  };

  const handleRandomHillKey = () => {
    const newMat = generateRandomValidHillKey(hillSize);
    setHillMatrix(newMat);
    onShowToast({ text: `Generated random valid ${hillSize}×${hillSize} Hill key`, type: 'info' });
  };

  // Playback & Animation state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(500);
  const timerRef = useRef<number | null>(null);

  // Examples dataset
  const loadExampleData = (type: ClassicalCipherType) => {
    setIsPlaying(false);
    setCurrentStep(0);
    setIsDecrypt(false);

    if (type === 'caesar') {
      setInputText('DEFEND THE EAST WALL OF THE CASTLE AT SUNRISE');
      setCaesarShift(4);
    } else if (type === 'vigenere') {
      setInputText('CRYPTOGRAPHY IS THE FOUNDATION OF CYBERSECURITY');
      setVigenereKey('SECRET');
    } else if (type === 'playfair') {
      setInputText('MEET ME AT THE SECRET LAB TONIGHT');
      setPlayfairKey('LABORATORY');
    } else if (type === 'hill') {
      if (hillSize === 3) {
        setInputText('ACT');
        setHillMatrix([[6, 24, 1], [13, 16, 10], [20, 17, 15]]);
      } else if (hillSize === 4) {
        setInputText('DEFENDTHEEAST');
        setHillMatrix(generateRandomValidHillKey(4));
      } else {
        setInputText('HELP');
        setHillMatrix([[3, 3], [2, 5]]);
      }
    } else if (type === 'railfence') {
      setInputText('WE ARE DISCOVERED FLEE AT ONCE NOW');
      setRailCount(3);
    } else if (type === 'substitution') {
      setInputText('THE EAGLE HAS LANDED SAFELY');
      setSubstitutionKey(generateKeyFromPhrase('ZEBRAS'));
    }
    onShowToast({ text: `${type.toUpperCase()} example loaded`, type: 'info' });
  };

  // Run Cipher calculation
  const executeCipher = (fromAuto = false) => {
    try {
      let res: ClassicalCipherResult;

      if (cipherType === 'caesar') {
        res = processCaesar(inputText, caesarShift, isDecrypt);
      } else if (cipherType === 'vigenere') {
        if (!vigenereKey.trim()) throw new Error('Vigenère key cannot be empty');
        res = processVigenere(inputText, vigenereKey, isDecrypt);
      } else if (cipherType === 'playfair') {
        if (!playfairKey.trim()) throw new Error('Playfair key phrase cannot be empty');
        res = processPlayfair(inputText, playfairKey, isDecrypt);
      } else if (cipherType === 'hill') {
        const val = validateHillKey(hillMatrix);
        if (!val.valid) throw new Error(val.error);
        res = processHill(inputText, hillMatrix, isDecrypt);
      } else if (cipherType === 'railfence') {
        res = processRailFence(inputText, railCount, isDecrypt);
      } else {
        res = processSubstitution(inputText, substitutionKey, isDecrypt);
      }

      setOutputResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err: any) {
      setOutputResult(null);
      setIsPlaying(false);
      if (!fromAuto) {
        onShowToast({ text: err.message || 'Cipher computation error', type: 'error' });
      }
    }
  };

  // Run on mount or parameter change
  useEffect(() => {
    executeCipher(true);
  }, [
    cipherType,
    inputText,
    isDecrypt,
    caesarShift,
    vigenereKey,
    playfairKey,
    hillMatrix,
    railCount,
    substitutionKey,
  ]);

  // Debounced history recording to prevent history spamming
  useEffect(() => {
    if (!outputResult || !outputResult.output) return;
    const timer = window.setTimeout(() => {
      onAddHistory({
        module: 'Classical Ciphers',
        operation: `${cipherType.toUpperCase()} ${isDecrypt ? 'Decrypt' : 'Encrypt'}`,
        summary: `Input: ${inputText.slice(0, 30)}... -> Output: ${outputResult.output.slice(0, 30)}...`,
        detail: `Cipher: ${cipherType}, Mode: ${isDecrypt ? 'Decryption' : 'Encryption'}`,
      });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [outputResult]);

  // Animation Playback loop
  useEffect(() => {
    if (isPlaying && outputResult && outputResult.steps.length > 0) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= outputResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speedMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, outputResult, speedMs]);

  const handleCopy = () => {
    if (!outputResult) return;
    navigator.clipboard.writeText(outputResult.output);
    setCopied(true);
    onShowToast({ text: t.copied, type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    if (outputResult) {
      setInputText(outputResult.output);
      setIsDecrypt(!isDecrypt);
    }
  };

  const hillValidation = cipherType === 'hill' ? validateHillKey(hillMatrix) : { valid: true };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {t.classical}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              Interactive
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Historical transformation ciphers with live step-by-step matrix, grid, and wave traces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadExampleData(cipherType)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-400 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.loadExample}</span>
          </button>

          <button
            onClick={() =>
              onExplainWithAI(
                `Classical Cipher: ${cipherType.toUpperCase()} (mode: ${
                  isDecrypt ? 'decryption' : 'encryption'
                }). Input: "${inputText}", Output: "${outputResult?.output || ''}"`
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.explainWithAI}</span>
          </button>
        </div>
      </div>

      {/* Cipher Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {[
          { id: 'caesar', label: 'Caesar Cipher' },
          { id: 'vigenere', label: 'Vigenère Cipher' },
          { id: 'playfair', label: 'Playfair (5x5)' },
          { id: 'hill', label: 'Hill Matrix (n×n)' },
          { id: 'railfence', label: 'Rail Fence (Zig-Zag)' },
          { id: 'substitution', label: 'Monoalphabetic' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setCipherType(c.id as ClassicalCipherType)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
              cipherType === c.id
                ? 'bg-emerald-500 text-black shadow-md cyber-glow-green'
                : 'border border-slate-800 bg-[#0d131a] text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Controls & Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs & Configuration */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Text Input Panel */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Input Text
              </label>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
                <button
                  onClick={() => setIsDecrypt(false)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    !isDecrypt
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.encrypt}
                </button>
                <button
                  onClick={() => setIsDecrypt(true)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    isDecrypt
                      ? 'bg-cyan-500 text-black font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.decrypt}
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="w-full p-3.5 rounded-xl border border-slate-800 bg-[#070b0f] text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Key & Parameters Panel */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
              {t.keyLabel}
            </h3>

            {/* Caesar Key */}
            {cipherType === 'caesar' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Shift Offset (0 - 25):</span>
                  <span className="text-emerald-400 font-bold text-sm bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-500/30">
                    +{caesarShift} (ROT-{caesarShift})
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={caesarShift}
                  onChange={(e) => setCaesarShift(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}

            {/* Vigenere Key */}
            {cipherType === 'vigenere' && (
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400">Secret Keyword (Letters):</label>
                <input
                  type="text"
                  value={vigenereKey}
                  onChange={(e) => setVigenereKey(e.target.value.toUpperCase())}
                  placeholder="e.g. CIPHER"
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-[#070b0f] text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500 uppercase tracking-widest"
                />
              </div>
            )}

            {/* Playfair Key */}
            {cipherType === 'playfair' && (
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400">Key Phrase (Generates 5x5 Grid):</label>
                <input
                  type="text"
                  value={playfairKey}
                  onChange={(e) => setPlayfairKey(e.target.value.toUpperCase())}
                  placeholder="e.g. MONARCHY"
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-[#070b0f] text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500 uppercase tracking-wider"
                />
                <p className="text-[11px] text-slate-500 font-mono">
                  Note: 'J' is merged into 'I'. Duplicate digraph letters receive an 'X' separator.
                </p>
              </div>
            )}

            {/* Hill Key (General n x n Matrix) */}
            {cipherType === 'hill' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-400">Key Matrix Dimension:</label>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
                    {([2, 3, 4] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleSetHillSize(sz)}
                        className={`px-2.5 py-0.5 rounded transition-colors ${
                          hillSize === sz
                            ? 'bg-emerald-500 text-black font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sz}×{sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${hillSize}, minmax(0, 1fr))`,
                    maxWidth: `${hillSize * 70}px`,
                  }}
                >
                  {Array.from({ length: hillSize }).map((_, r) =>
                    Array.from({ length: hillSize }).map((__, c) => (
                      <input
                        key={`${r}-${c}`}
                        type="number"
                        value={hillMatrix[r]?.[c] ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          const newMat = hillMatrix.map((row, rowIdx) =>
                            rowIdx === r
                              ? row.map((cell, colIdx) => (colIdx === c ? val : cell))
                              : [...row]
                          );
                          setHillMatrix(newMat);
                        }}
                        className="p-2 text-center rounded border border-slate-800 bg-[#070b0f] font-mono text-sm text-emerald-400 focus:border-emerald-500 focus:outline-none"
                      />
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRandomHillKey}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-xs font-mono hover:text-emerald-400 hover:border-emerald-500/50 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Random valid key</span>
                  </button>
                </div>

                {!hillValidation.valid ? (
                  <div className="flex items-center gap-1.5 p-2 rounded bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{hillValidation.error}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 font-mono text-xs text-emerald-400">
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        Determinant: <strong>{hillValidation.det} mod 26</strong> (Coprime with 26 ✓, Inverse = {hillValidation.invDet})
                      </span>
                    </div>
                    {(() => {
                      try {
                        const invMat = invertMatrixMod26(hillMatrix);
                        return (
                          <div className="text-[11px] text-slate-300 mt-1">
                            <span className="text-slate-400 block mb-0.5">Inverse Matrix K⁻¹ (mod 26):</span>
                            <div className="flex flex-col gap-0.5 p-1.5 rounded bg-[#070b0f] border border-slate-800 text-cyan-300">
                              {invMat.map((row, r) => (
                                <div key={r}>[{row.join(', ')}]</div>
                              ))}
                            </div>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Rail Fence Key */}
            {cipherType === 'railfence' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Number of Rails (2 - 10):</span>
                  <span className="text-cyan-400 font-bold text-sm bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-500/30">
                    {railCount} Rails
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={railCount}
                  onChange={(e) => setRailCount(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500"
                />
              </div>
            )}

            {/* Substitution Key */}
            {cipherType === 'substitution' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-400">26-Letter Substitution Alphabet:</label>
                  <button
                    onClick={() => setSubstitutionKey(generateKeyFromPhrase('SECRET'))}
                    className="text-[10px] text-emerald-400 hover:underline font-mono"
                  >
                    Generate from phrase
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={26}
                  value={substitutionKey}
                  onChange={(e) => setSubstitutionKey(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-[#070b0f] text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500 tracking-wider"
                />
                <span className="text-[11px] text-slate-500 font-mono">
                  Characters: {substitutionKey.length} / 26
                </span>
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                {isDecrypt ? 'Decrypted Output' : 'Ciphertext Output'}
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSwap}
                  title="Swap Input and Output"
                  className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-500/20 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.copied : t.copy}</span>
                </button>
              </div>
            </div>

            <div className="w-full p-3.5 rounded-xl border border-slate-800 bg-[#070b0f] text-emerald-400 font-mono text-sm break-all select-all min-h-[90px] cyber-border-glow">
              {outputResult?.output || t.outputPlaceholder}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Step Visualizer */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm flex-1 flex flex-col">
            {/* Visualizer Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono text-slate-100">
                  {t.stepVisualizer}
                </h3>
                {outputResult && outputResult.steps.length > 0 && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Step {currentStep + 1} of {outputResult.steps.length}
                  </span>
                )}
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
                  title={t.prev}
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? t.pause : t.play}</span>
                </button>

                <button
                  onClick={() =>
                    setCurrentStep(
                      Math.min(
                        (outputResult?.steps.length || 1) - 1,
                        currentStep + 1
                      )
                    )
                  }
                  disabled={
                    !outputResult ||
                    currentStep >= outputResult.steps.length - 1
                  }
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
                  title={t.next}
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(0);
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                  title={t.reset}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Speed Slider */}
                <div className="flex items-center gap-1 text-xs font-mono text-slate-400 ml-2">
                  <span>{t.speed}:</span>
                  <select
                    value={speedMs}
                    onChange={(e) => setSpeedMs(parseInt(e.target.value, 10))}
                    className="bg-[#070b0f] border border-slate-800 rounded px-1.5 py-0.5 text-emerald-400 font-mono text-xs"
                  >
                    <option value={1000}>0.5x</option>
                    <option value={500}>1x</option>
                    <option value={200}>2.5x</option>
                    <option value={80}>Fast</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Step Highlight Box */}
            {outputResult && outputResult.steps[currentStep] && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-mono text-lg font-bold">
                    <span className="text-white px-2 py-0.5 rounded bg-slate-800">
                      {outputResult.steps[currentStep].inputChar}
                    </span>
                    <span className="text-emerald-400">→</span>
                    <span className="text-emerald-300 px-2 py-0.5 rounded bg-emerald-900/50 border border-emerald-500/40">
                      {outputResult.steps[currentStep].outputChar}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-300">
                    {outputResult.steps[currentStep].explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Visualizer Canvas Area tailored per cipher */}
            <div className="flex-1 min-h-[300px] rounded-xl border border-slate-800 bg-[#070b0f] p-4 flex flex-col justify-center items-center overflow-auto">
              {/* Playfair 5x5 Grid Visualization */}
              {cipherType === 'playfair' && outputResult?.auxiliaryData?.playfairGrid && (
                <div className="flex flex-col items-center">
                  <div className="text-xs font-mono text-slate-400 mb-3">
                    Playfair 5x5 Matrix (Key: <span className="text-emerald-400 font-bold">{playfairKey}</span>)
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 p-3 rounded-xl border border-slate-800 bg-slate-900/50">
                    {outputResult.auxiliaryData.playfairGrid.map((row, rIdx) =>
                      row.map((char, cIdx) => {
                        const step = outputResult.steps[currentStep];
                        const isHighlighted = step?.inputChar.includes(char) || step?.outputChar.includes(char);
                        return (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            className={`w-11 h-11 rounded-lg flex items-center justify-center font-mono font-bold text-sm transition-all duration-300 ${
                              isHighlighted
                                ? 'bg-emerald-500 text-black shadow-lg scale-105 border-2 border-emerald-300'
                                : 'bg-[#0a0f15] border border-slate-800 text-slate-300'
                            }`}
                          >
                            {char}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Hill n x n Matrix Transformation */}
              {cipherType === 'hill' && outputResult?.auxiliaryData?.hillMatrix && (
                <div className="flex flex-col items-center max-w-xl w-full">
                  <div className="text-xs font-mono text-slate-400 mb-3">
                    Matrix Vector Multiplication Modulo 26 ({hillMatrix.length}×{hillMatrix.length})
                  </div>
                  <div className="flex items-center gap-3 font-mono text-sm p-4 rounded-xl border border-slate-800 bg-slate-900/40 overflow-x-auto max-w-full">
                    {/* Vector P */}
                    <div className="flex flex-col border-l-2 border-r-2 border-emerald-500 px-2 py-1 text-center text-emerald-400 font-bold shrink-0">
                      {Array.from({ length: hillMatrix.length }).map((_, idx) => (
                        <span key={idx}>
                          {outputResult.steps[currentStep]?.inputChar[idx] || (idx === 0 ? 'A' : 'X')}
                        </span>
                      ))}
                    </div>

                    <span className="text-slate-400 font-bold shrink-0">×</span>

                    {/* Matrix K */}
                    <div
                      className="grid gap-1.5 border-l-2 border-r-2 border-cyan-500 px-2 py-1 text-center text-cyan-300 font-bold shrink-0"
                      style={{ gridTemplateColumns: `repeat(${hillMatrix.length}, minmax(0, 1fr))` }}
                    >
                      {hillMatrix.map((row, r) =>
                        row.map((val, c) => (
                          <span key={`${r}-${c}`} className="min-w-[1.75rem] text-center">
                            {val}
                          </span>
                        ))
                      )}
                    </div>

                    <span className="text-slate-400 font-bold shrink-0">=</span>

                    {/* Result Vector C */}
                    <div className="flex flex-col border-l-2 border-r-2 border-emerald-400 px-2 py-1 text-center text-emerald-300 font-bold bg-emerald-950/40 shrink-0">
                      {Array.from({ length: hillMatrix.length }).map((_, idx) => (
                        <span key={idx}>
                          {outputResult.steps[currentStep]?.outputChar[idx] || (idx === 0 ? 'X' : 'X')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rail Fence ZigZag Wave Visualizer */}
              {cipherType === 'railfence' && outputResult?.auxiliaryData?.railFenceGrid && (
                <div className="w-full overflow-x-auto pb-2">
                  <div className="text-xs font-mono text-slate-400 text-center mb-3">
                    Zigzag Rail Oscillations ({railCount} Rails)
                  </div>
                  <div className="flex flex-col gap-2 min-w-[500px] p-4 rounded-xl border border-slate-800 bg-[#090d13]">
                    {outputResult.auxiliaryData.railFenceGrid.map((row, r) => (
                      <div key={r} className="flex items-center gap-1">
                        <span className="w-16 text-[11px] font-mono text-slate-500 shrink-0">
                          Rail {r + 1}:
                        </span>
                        <div className="flex items-center gap-1 flex-1">
                          {row.slice(0, 35).map((cell, c) => {
                            const isCurrent = cell !== null && outputResult.steps[currentStep]?.stepIndex === c;
                            return (
                              <div
                                key={c}
                                className={`w-7 h-7 rounded flex items-center justify-center font-mono text-xs transition-all ${
                                  cell === null
                                    ? 'bg-transparent text-slate-800'
                                    : isCurrent
                                    ? 'bg-cyan-500 text-black font-bold shadow-md scale-110'
                                    : 'bg-slate-800/60 border border-slate-700/60 text-emerald-400 font-semibold'
                                }`}
                              >
                                {cell || '·'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Caesar / Vigenère / Substitution Letter Ribbon Visualizer */}
              {(cipherType === 'caesar' || cipherType === 'vigenere' || cipherType === 'substitution') && (
                <div className="w-full flex flex-col items-center">
                  <div className="text-xs font-mono text-slate-400 mb-3">
                    Alphabet Mapping Ribbon
                  </div>
                  <div className="overflow-x-auto max-w-full pb-2">
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                      {/* Plain row */}
                      <div className="flex items-center gap-1">
                        <span className="w-12 text-[10px] font-mono text-slate-400">Plain:</span>
                        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => {
                          const isMatch = outputResult?.steps[currentStep]?.inputChar.toUpperCase() === char;
                          return (
                            <div
                              key={char}
                              className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs ${
                                isMatch
                                  ? 'bg-emerald-500 text-black font-bold'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {char}
                            </div>
                          );
                        })}
                      </div>

                      {/* Cipher row */}
                      <div className="flex items-center gap-1">
                        <span className="w-12 text-[10px] font-mono text-slate-400">Cipher:</span>
                        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char, idx) => {
                          let mappedChar = char;
                          if (cipherType === 'caesar') {
                            mappedChar = String.fromCharCode(65 + ((idx + caesarShift) % 26));
                          } else if (cipherType === 'substitution') {
                            mappedChar = substitutionKey[idx] || char;
                          }
                          const isMatch = outputResult?.steps[currentStep]?.outputChar.toUpperCase() === mappedChar;
                          return (
                            <div
                              key={idx}
                              className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs ${
                                isMatch
                                  ? 'bg-cyan-500 text-black font-bold'
                                  : 'bg-slate-900 text-cyan-400/80 border border-slate-800'
                              }`}
                            >
                              {mappedChar}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
