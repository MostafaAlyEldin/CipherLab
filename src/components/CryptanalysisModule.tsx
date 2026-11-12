import React, { useState, useEffect } from 'react';
import { Language, AIAnalysisResult } from '../types/crypto';
import { translations } from '../utils/translations';
import {
  calculateLetterFrequencies,
  calculateIoC,
  calculateEntropy,
  bruteForceCaesar,
  kasiskiExamination,
  friedmanTest,
  crackVigenere,
  ENGLISH_FREQUENCIES,
  ARABIC_FREQUENCIES,
  CaesarShiftCandidate,
} from '../utils/analysis';
import {
  Binary,
  Bot,
  Sparkles,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Layers,
  Search,
} from 'lucide-react';

interface CryptanalysisModuleProps {
  language: Language;
  onExplainWithAI: (context: string) => void;
  onAddHistory: (item: { module: string; operation: string; summary: string; detail?: string }) => void;
  onShowToast: (msg: { text: string; type: 'success' | 'error' | 'info' }) => void;
}

export const CryptanalysisModule: React.FC<CryptanalysisModuleProps> = ({
  language,
  onExplainWithAI,
  onAddHistory,
  onShowToast,
}) => {
  const t = translations[language];

  // Ciphertext state
  const [ciphertext, setCiphertext] = useState(
    'LLG HYBUO DISPF JQO NNETU FZXJ XJV PTRC FFK PZMNV XAW WGTVXL EIVRM OEKKW TL XJV SEV XTRMG KXCKMHF JQI XAW IPTVRHXGU QXKWCXI MG ETIMOW FGWSKW QKURBYLV KSGAKJK. IOWVA CIMLIT ZR MZMU DILKEIV ML HVQKIVLIF SC T JIRVEMARI BIROSTU GBHLGI.'
  );

  // Computed statistical metrics
  const [frequencies, setFrequencies] = useState<ReturnType<typeof calculateLetterFrequencies>>({
    counts: {},
    percentages: {},
    totalLetters: 0,
  });
  const [ioc, setIoc] = useState({ unscaled: 0, scaled: 0 });
  const [entropy, setEntropy] = useState(0);
  const [caesarCandidates, setCaesarCandidates] = useState<CaesarShiftCandidate[]>([]);
  const [kasiskiResult, setKasiskiResult] = useState<ReturnType<typeof kasiskiExamination>>({
    keyLengthEstimates: [],
    repeatedGrams: [],
  });
  const [friedmanLength, setFriedmanLength] = useState(0);
  const [vigenereCrack, setVigenereCrack] = useState<ReturnType<typeof crackVigenere>>(null);

  // Gemini AI analysis state
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Run statistical analysis locally
  const runLocalAnalysis = (text: string) => {
    if (!text.trim()) return;
    const freq = calculateLetterFrequencies(text);
    setFrequencies(freq);

    const iocVal = calculateIoC(text);
    setIoc(iocVal);

    setEntropy(calculateEntropy(text));
    setCaesarCandidates(bruteForceCaesar(text));
    setKasiskiResult(kasiskiExamination(text));
    setFriedmanLength(friedmanTest(text));
    setVigenereCrack(crackVigenere(text));
  };

  useEffect(() => {
    runLocalAnalysis(ciphertext);
  }, [ciphertext]);

  // AI Gemini Cryptanalysis Call
  const handleAiCryptanalysis = async () => {
    if (!ciphertext.trim()) {
      onShowToast({ text: 'Please enter ciphertext to analyze', type: 'error' });
      return;
    }

    try {
      setIsAiLoading(true);
      const topFreqs: Record<string, number> = {};
      Object.entries(frequencies.percentages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([k, v]) => {
          topFreqs[k] = v;
        });

      const bestCaesar = caesarCandidates[0]?.shift;

      const response = await fetch('/api/gemini/cryptanalysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciphertext,
          language,
          stats: {
            ioc: ioc.unscaled,
            entropy,
            topFrequencies: topFreqs,
            bestCaesarShift: bestCaesar,
            kasiskiEstimate: kasiskiResult.keyLengthEstimates[0]?.length || friedmanLength,
            vigenereKeyGuess: vigenereCrack?.key || null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setAiResult(data);
      onShowToast({ text: 'Gemini Cryptanalysis complete!', type: 'success' });
      onAddHistory({
        module: 'AI Cryptanalysis',
        operation: 'Cipher Identification & Decryption',
        summary: `Identified: ${data.identifiedCipher} (${data.confidence}% confidence)`,
        detail: `Plaintext preview: ${data.plaintext?.slice(0, 30)}...`,
      });
    } catch (err: any) {
      onShowToast({ text: err.message || 'AI cryptanalysis failed', type: 'error' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const loadPreset = (type: 'caesar' | 'vigenere' | 'substitution' | 'railfence') => {
    if (type === 'caesar') {
      setCiphertext('KHOOR ZRUOG WKLV LV DQ HQFUBSWHG PHVVDJH IRU FLSKHUODE FUBSWDQDOBVLV WHVW');
    } else if (type === 'vigenere') {
      setCiphertext(
        'LLG HYBUO DISPF JQO NNETU FZXJ XJV PTRC FFK PZMNV XAW WGTVXL EIVRM OEKKW TL XJV SEV XTRMG KXCKMHF JQI XAW IPTVRHXGU QXKWCXI MG ETIMOW FGWSKW QKURBYLV KSGAKJK. IOWVA CIMLIT ZR MZMU DILKEIV ML HVQKIVLIF SC T JIRVEMARI BIROSTU GBHLGI.'
      );
    } else if (type === 'substitution') {
      setCiphertext('QEB NRFZH YOLTK CLU GRJMP LSBO QEB IXWV ALD TFEV QEXQ TFP PBZOBQ');
    } else if (type === 'railfence') {
      setCiphertext('WECRLTEERDSOEEFEAOCAIVDEN');
    }
    setAiResult(null);
    onShowToast({ text: `Sample ${type} ciphertext loaded`, type: 'info' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {t.analysis}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              Heuristic & LLM Decryption
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Analyze unknown ciphertext with mathematical frequency metrics, IoC, Chi-squared brute force, Kasiski examination, and Gemini reasoning.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadPreset('caesar')}
            className="px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-emerald-400 cursor-pointer"
          >
            Caesar Sample
          </button>
          <button
            onClick={() => loadPreset('vigenere')}
            className="px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-400 cursor-pointer"
          >
            Vigenère Sample
          </button>
          <button
            onClick={() => loadPreset('railfence')}
            className="px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-400 cursor-pointer"
          >
            Rail Fence Sample
          </button>
          <button
            onClick={() => loadPreset('substitution')}
            className="px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-emerald-400 cursor-pointer"
          >
            Substitution Sample
          </button>
        </div>
      </div>

      {/* Ciphertext Input & Action Box */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Unknown Intercept / Ciphertext:
          </label>
          <span className="text-xs font-mono text-slate-400">
            {ciphertext.length} chars ({frequencies.totalLetters} alphabetic)
          </span>
        </div>

        <textarea
          rows={3}
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
          placeholder="Paste unidentified ciphertext here..."
          className="w-full p-3 rounded-xl border border-slate-800 bg-[#070b0f] text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500 resize-none mb-3"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>
              IoC: <strong className="text-cyan-400">{ioc.unscaled}</strong>
            </span>
            <span>•</span>
            <span>
              Entropy: <strong className="text-emerald-400">{entropy} bits/char</strong>
            </span>
          </div>

          <button
            onClick={handleAiCryptanalysis}
            disabled={isAiLoading || !ciphertext.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-semibold text-xs hover:from-emerald-400 hover:to-teal-300 transition-all cyber-glow-green cursor-pointer disabled:opacity-50"
          >
            <Bot className="w-4 h-4" />
            <span>{isAiLoading ? 'Gemini Analyzing...' : 'Analyze with Gemini AI'}</span>
          </button>
        </div>
      </div>

      {/* GEMINI AI RESULTS SECTION (When Available) */}
      {aiResult && (
        <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-md mb-8 shadow-xl animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-emerald-500/20">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold font-mono text-white">
                  Identified: <span className="text-emerald-400">{aiResult.identifiedCipher}</span>
                </h3>
              </div>
              {aiResult.recoveredKey && (
                <div className="text-xs font-mono text-cyan-300 mt-1">
                  Recovered Key / Parameter: <strong className="text-white">{aiResult.recoveredKey}</strong>
                </div>
              )}
            </div>

            {/* Confidence Meter */}
            <div className="flex items-center gap-3 bg-[#080c10] px-4 py-2 rounded-xl border border-slate-800">
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  {t.confidence}
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {aiResult.confidence}%
                </span>
              </div>
              <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${aiResult.confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Decrypted Plaintext Card */}
          <div className="mb-4">
            <div className="text-xs font-mono text-slate-400 mb-1">Decrypted Plaintext:</div>
            <div className="p-3.5 rounded-xl bg-[#080c10] border border-emerald-500/30 text-emerald-300 font-mono text-sm break-all select-all font-semibold">
              {aiResult.plaintext}
            </div>
          </div>

          {/* Reasoning Steps */}
          {aiResult.reasoningSteps && aiResult.reasoningSteps.length > 0 && (
            <div>
              <div className="text-xs font-mono font-bold text-slate-300 mb-2 uppercase">
                {t.reasoning}:
              </div>
              <div className="space-y-1.5 font-sans text-xs text-slate-300">
                {aiResult.reasoningSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-emerald-400 shrink-0">#{idx + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATISTICAL METRICS BREAKDOWN TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Letter Frequency Comparison Chart */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Letter Frequency vs Natural English Distribution</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Green = Ciphertext, Gray = English
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex items-end gap-1 h-44 pt-6 min-w-[580px]">
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => {
                const observedPct = frequencies.percentages[char] || 0;
                const standardPct = ENGLISH_FREQUENCIES[char] || 0;
                const maxPct = 15; // normalized height ceiling

                return (
                  <div key={char} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="flex items-end gap-0.5 h-32 w-full justify-center">
                      {/* Standard English Bar */}
                      <div
                        className="w-2 bg-slate-700/60 rounded-t group-hover:bg-slate-600 transition-all"
                        style={{ height: `${Math.min(100, (standardPct / maxPct) * 100)}%` }}
                        title={`Standard English '${char}': ${standardPct}%`}
                      />
                      {/* Ciphertext Bar */}
                      <div
                        className="w-2 bg-emerald-400 rounded-t group-hover:bg-emerald-300 transition-all"
                        style={{ height: `${Math.min(100, (observedPct / maxPct) * 100)}%` }}
                        title={`Ciphertext '${char}': ${observedPct}%`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-emerald-400">
                      {char}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Index of Coincidence & Kasiski Tests */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* IoC Interpretation */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
              {t.iocTitle}
            </h3>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {ioc.unscaled}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {ioc.unscaled >= 0.06
                  ? 'Monoalphabetic / English'
                  : ioc.unscaled >= 0.045
                  ? 'Polyalphabetic (Vigenère)'
                  : 'Random / Modern Cipher'}
              </span>
            </div>

            <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                style={{ width: `${Math.min(100, (ioc.unscaled / 0.075) * 100)}%` }}
              />
            </div>

            <div className="text-[11px] font-sans text-slate-400 space-y-1">
              <p>• <strong>~0.0667:</strong> Monoalphabetic substitution or Caesar (single alphabet shift).</p>
              <p>• <strong>~0.0385:</strong> Polyalphabetic cipher (Vigenère with long key) or random bytes.</p>
            </div>
          </div>

          {/* Kasiski & Friedman Examination */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
              {t.kasiskiTitle}
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Friedman Estimated Key Length:</span>
                <span className="text-emerald-400 font-bold">{friedmanLength || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Top Kasiski Factor Repetitions:</span>
                {kasiskiResult.keyLengthEstimates.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {kasiskiResult.keyLengthEstimates.map((est) => (
                      <span
                        key={est.length}
                        className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-xs border border-slate-700"
                      >
                        Length {est.length} (Score: {est.score})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 text-[11px]">No repeated 3-grams found. Ciphertext may be short.</span>
                )}
              </div>

              {/* Highlighted Vigenère Key Recovery Box when IoC < 0.055 */}
              {(ioc.unscaled < 0.055 || vigenereCrack) && vigenereCrack && (
                <div className="mt-4 p-3 rounded-xl border border-cyan-500/50 bg-cyan-950/40 text-xs font-mono space-y-2 animate-in fade-in cyber-glow-cyan">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-cyan-300">
                      Recovered Vigenère Key:
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-cyan-500 text-black font-bold text-xs tracking-wider">
                      {vigenereCrack.key}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="text-slate-400">Key Length (column IoC):</span>
                    <span className="text-white font-bold">{vigenereCrack.keyLength}</span>
                  </div>

                  <div className="pt-2 border-t border-cyan-500/30">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                      Decrypted Plaintext Preview:
                    </span>
                    <div className="p-2.5 rounded-lg bg-[#070b0f] border border-slate-800 text-emerald-300 text-xs font-medium leading-relaxed break-words max-h-24 overflow-y-auto select-all">
                      {vigenereCrack.plaintext.slice(0, 160)}
                      {vigenereCrack.plaintext.length > 160 ? '...' : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Caesar 25-Shift Brute Force Table */}
      <div className="mt-6 p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Caesar Brute Force: All 25 Shifts Ranked by Chi-Squared English Likeness
          </h3>
          <span className="text-[11px] font-mono text-emerald-400">
            Lowest Chi-Square = Best Match
          </span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="sticky top-0 bg-[#0c1219] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Rank</th>
                <th className="py-2 px-3">Shift</th>
                <th className="py-2 px-3">Chi-Square Score</th>
                <th className="py-2 px-3">Decrypted Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {caesarCandidates.slice(0, 10).map((cand) => (
                <tr
                  key={cand.shift}
                  className={`transition-colors ${
                    cand.rank === 1
                      ? 'bg-emerald-950/40 text-emerald-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900/50'
                  }`}
                >
                  <td className="py-2 px-3">
                    {cand.rank === 1 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> #1 Best
                      </span>
                    ) : (
                      `#${cand.rank}`
                    )}
                  </td>
                  <td className="py-2 px-3 text-cyan-400">Shift {cand.shift} (ROT-{cand.shift})</td>
                  <td className="py-2 px-3 font-mono">{cand.chiSquare}</td>
                  <td className="py-2 px-3 truncate max-w-md">{cand.decryptedPreview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
