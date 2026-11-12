import React, { useState, useEffect } from 'react';
import { Language, PasswordMetrics } from '../types/crypto';
import { translations } from '../utils/translations';
import {
  analyzePassword,
  generateSecurePassword,
  generateDicewarePassphrase,
} from '../utils/passwordAnalyzer';
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Cpu,
  Globe,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface PasswordModuleProps {
  language: Language;
  onExplainWithAI: (context: string) => void;
  onAddHistory: (item: { module: string; operation: string; summary: string; detail?: string }) => void;
  onShowToast: (msg: { text: string; type: 'success' | 'error' | 'info' }) => void;
}

export const PasswordModule: React.FC<PasswordModuleProps> = ({
  language,
  onExplainWithAI,
  onAddHistory,
  onShowToast,
}) => {
  const t = translations[language];

  const [password, setPassword] = useState('Tr0ub4dor&3_Solar_V0rtex!');
  const [showPassword, setShowPassword] = useState(true);
  const [metrics, setMetrics] = useState<PasswordMetrics>(analyzePassword(password));

  // Generator settings
  const [genLength, setGenLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generatorMode, setGeneratorMode] = useState<'chars' | 'passphrase'>('chars');
  const [passphraseWords, setPassphraseWords] = useState(4);

  // Gemini privacy-safe audit tips state
  const [aiTips, setAiTips] = useState<{
    summary?: string;
    vulnerabilityRisks?: string[];
    recommendations?: string[];
    passphraseComparison?: string;
  } | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    setMetrics(analyzePassword(password));
    setAiTips(null);
  }, [password]);

  const handleGenerate = () => {
    let newPass = '';
    if (generatorMode === 'chars') {
      newPass = generateSecurePassword({
        length: genLength,
        useUpper,
        useLower,
        useNumbers,
        useSymbols,
      });
    } else {
      newPass = generateDicewarePassphrase(passphraseWords, '-');
    }
    setPassword(newPass);
    onShowToast({ text: 'Secure password generated', type: 'info' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    onShowToast({ text: t.copied, type: 'success' });
  };

  // PRIVACY-PRESERVING AI AUDIT: Transmits ONLY statistical metrics, NEVER raw password
  const handleAiAudit = async () => {
    try {
      setIsAuditing(true);
      const response = await fetch('/api/gemini/password-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setAiTips(data);
      onShowToast({ text: 'Privacy-safe Gemini audit complete!', type: 'success' });
      onAddHistory({
        module: 'Password Analyzer',
        operation: 'Zero-Knowledge Security Audit',
        summary: `Audited ${metrics.entropy} bits entropy profile`,
      });
    } catch (err: any) {
      onShowToast({ text: err.message || 'Audit failed', type: 'error' });
    } finally {
      setIsAuditing(false);
    }
  };

  // Entropy Strength tier
  const getStrengthTier = (entropy: number) => {
    if (entropy < 28) return { label: 'Very Weak', color: 'text-rose-500', barColor: 'bg-rose-500', pct: 20 };
    if (entropy < 45) return { label: 'Weak', color: 'text-amber-500', barColor: 'bg-amber-500', pct: 40 };
    if (entropy < 65) return { label: 'Moderate', color: 'text-yellow-400', barColor: 'bg-yellow-400', pct: 65 };
    if (entropy < 90) return { label: 'Strong', color: 'text-emerald-400', barColor: 'bg-emerald-400', pct: 85 };
    return { label: 'Unbreakable (Cryptographic)', color: 'text-cyan-400', barColor: 'bg-cyan-400', pct: 100 };
  };

  const tier = getStrengthTier(metrics.entropy);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {t.password}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              Zero-Knowledge Local Analysis
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time Shannon entropy calculation, threat model crack times, and pattern detection. Passwords are never sent across the network.
          </p>
        </div>

        <button
          onClick={handleAiAudit}
          disabled={isAuditing || metrics.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold text-xs hover:from-emerald-400 hover:to-cyan-400 transition-all cyber-glow-green cursor-pointer disabled:opacity-50"
        >
          <Bot className="w-4 h-4" />
          <span>{isAuditing ? 'Auditing Metrics...' : 'Zero-Knowledge AI Audit'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input, Strength Meter & Generator */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* Live Password Input Box */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Password or Passphrase:
              </label>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-mono text-cyan-400 hover:underline"
              >
                {showPassword ? 'Mask' : 'Reveal'}
              </button>
            </div>

            <div className="relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type any password to evaluate..."
                className="w-full p-3.5 pr-20 rounded-xl border border-slate-800 bg-[#070b0f] text-emerald-300 font-mono text-base focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleCopy}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title={t.copy}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* Strength Meter Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Security Grade:</span>
                <span className={`font-bold ${tier.color}`}>{tier.label}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${tier.barColor} rounded-full transition-all duration-300`}
                  style={{ width: `${tier.pct}%` }}
                />
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-center font-mono">
              <div className="p-2 rounded-lg bg-[#070b0f]">
                <span className="text-slate-400 text-[10px] block">Length</span>
                <span className="text-white font-bold text-sm">{metrics.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#070b0f]">
                <span className="text-slate-400 text-[10px] block">Entropy</span>
                <span className="text-emerald-400 font-bold text-sm">{metrics.entropy} bits</span>
              </div>
              <div className="p-2 rounded-lg bg-[#070b0f]">
                <span className="text-slate-400 text-[10px] block">Charset Pool</span>
                <span className="text-cyan-400 font-bold text-sm">{metrics.charsetSize}</span>
              </div>
            </div>
          </div>

          {/* Secure Password & Passphrase Generator */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Cryptographic Generator</span>
              </h3>

              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setGeneratorMode('chars')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    generatorMode === 'chars'
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  Random Chars
                </button>
                <button
                  onClick={() => setGeneratorMode('passphrase')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    generatorMode === 'passphrase'
                      ? 'bg-cyan-500 text-black font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  Diceware Passphrase
                </button>
              </div>
            </div>

            {generatorMode === 'chars' ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                    <span>Length:</span>
                    <span className="text-emerald-400 font-bold">{genLength} characters</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={48}
                    value={genLength}
                    onChange={(e) => setGenLength(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useUpper}
                      onChange={(e) => setUseUpper(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Uppercase (A-Z)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLower}
                      onChange={(e) => setUseLower(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Lowercase (a-z)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useNumbers}
                      onChange={(e) => setUseNumbers(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Numbers (0-9)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSymbols}
                      onChange={(e) => setUseSymbols(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Symbols (!@#$)</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Diceware Words:</span>
                  <span className="text-cyan-400 font-bold">{passphraseWords} words</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={6}
                  value={passphraseWords}
                  onChange={(e) => setPassphraseWords(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500"
                />
                <p className="text-[11px] font-sans text-slate-400">
                  Diceware combines high-entropy random vocabulary words separated by dashes. Memorable for humans, practically impossible for GPUs.
                </p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Generate New String</span>
            </button>
          </div>
        </div>

        {/* Right Column: Threat Models, Pattern Detection & Gemini Audit */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* Estimated Crack Times across 3 Threat Tiers */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4">
              Estimated Attack Resistance Times
            </h3>

            <div className="space-y-3">
              {/* Online */}
              <div className="p-3 rounded-xl border border-slate-800 bg-[#070b0f] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-200 block">
                      {t.onlineCrack}
                    </span>
                    <span className="text-[11px] text-slate-400">Web login rate-limited</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {metrics.crackTimes.online}
                </span>
              </div>

              {/* Fast GPU */}
              <div className="p-3 rounded-xl border border-slate-800 bg-[#070b0f] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-200 block">
                      {t.fastGpuCrack}
                    </span>
                    <span className="text-[11px] text-slate-400">Leaked NTLM/MD5 dump on Hashcat cluster</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {metrics.crackTimes.offlineFast}
                </span>
              </div>

              {/* Slow Hash */}
              <div className="p-3 rounded-xl border border-slate-800 bg-[#070b0f] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-200 block">
                      {t.slowHashCrack}
                    </span>
                    <span className="text-[11px] text-slate-400">Argon2id or PBKDF2 100k rounds</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {metrics.crackTimes.offlineSlow}
                </span>
              </div>
            </div>
          </div>

          {/* Pattern Detection Badges */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
              Detected Vulnerability Patterns
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                  metrics.patterns.hasDictionaryWords
                    ? 'border-rose-500/40 bg-rose-950/30 text-rose-300'
                    : 'border-slate-800 bg-[#070b0f] text-slate-400'
                }`}
              >
                {metrics.patterns.hasDictionaryWords ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>Dictionary Words ({metrics.patterns.detectedWords.length})</span>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                  metrics.patterns.hasKeyboardWalk
                    ? 'border-rose-500/40 bg-rose-950/30 text-rose-300'
                    : 'border-slate-800 bg-[#070b0f] text-slate-400'
                }`}
              >
                {metrics.patterns.hasKeyboardWalk ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>Keyboard Walks</span>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                  metrics.patterns.hasRepeatedChars
                    ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
                    : 'border-slate-800 bg-[#070b0f] text-slate-400'
                }`}
              >
                {metrics.patterns.hasRepeatedChars ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>Repeated Characters</span>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                  metrics.patterns.hasDatePattern
                    ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
                    : 'border-slate-800 bg-[#070b0f] text-slate-400'
                }`}
              >
                {metrics.patterns.hasDatePattern ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>Date / Year Patterns</span>
              </div>
            </div>
          </div>

          {/* Gemini AI Zero-Knowledge Auditor Results */}
          {aiTips && (
            <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-sm space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Gemini Zero-Knowledge Security Assessment:</span>
              </div>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                {aiTips.summary}
              </p>

              {aiTips.recommendations && (
                <div className="space-y-1 text-xs text-slate-300 font-sans">
                  {aiTips.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-mono font-bold">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
