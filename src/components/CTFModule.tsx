import React, { useState, useEffect } from 'react';
import { Language, CTFChallenge, CTFStats } from '../types/crypto';
import { translations } from '../utils/translations';
import { INITIAL_CTF_CHALLENGES, getStoredCTFStats, saveCTFStats } from '../utils/ctfData';
import { processCaesar, processRailFence, processVigenere } from '../utils/classicalCiphers';
import {
  Trophy,
  Flame,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  Copy,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

interface CTFModuleProps {
  language: Language;
  onExplainWithAI: (context: string) => void;
  onAddHistory: (item: { module: string; operation: string; summary: string; detail?: string }) => void;
  onShowToast: (msg: { text: string; type: 'success' | 'error' | 'info' }) => void;
}

export const CTFModule: React.FC<CTFModuleProps> = ({
  language,
  onExplainWithAI,
  onAddHistory,
  onShowToast,
}) => {
  const t = translations[language];

  const [challenges, setChallenges] = useState<CTFChallenge[]>(INITIAL_CTF_CHALLENGES);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [activeChallengeId, setActiveChallengeId] = useState<string>(INITIAL_CTF_CHALLENGES[0].id);

  // Stats from localStorage
  const [stats, setStats] = useState<CTFStats>(getStoredCTFStats());

  // Active challenge state
  const [unlockedHints, setUnlockedHints] = useState<number[]>([]);
  const [flagInput, setFlagInput] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [solveState, setSolveState] = useState<'unsolved' | 'correct' | 'wrong'>('unsolved');

  const activeChallenge = challenges.find((c) => c.id === activeChallengeId) || challenges[0];
  const isAlreadySolved = stats.solvedIds.includes(activeChallenge.id);

  // Timer loop
  useEffect(() => {
    let interval: number;
    if (isTimerRunning && !isAlreadySolved) {
      interval = window.setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isAlreadySolved]);

  // When switching challenge, reset inputs & timer
  const handleSelectChallenge = (id: string) => {
    setActiveChallengeId(id);
    setUnlockedHints([]);
    setFlagInput('');
    setSolveState('unsolved');
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  // Submit flag (case-insensitive and ignoring spaces)
  const handleSubmitFlag = () => {
    if (!flagInput.trim()) return;

    const normalizedInput = flagInput.trim().toUpperCase().replace(/\s+/g, '');
    const normalizedTarget = activeChallenge.flag.trim().toUpperCase().replace(/\s+/g, '');

    if (normalizedInput === normalizedTarget) {
      setSolveState('correct');
      setIsTimerRunning(false);

      if (!isAlreadySolved) {
        // Calculate penalty for hints
        let penalty = 0;
        if (unlockedHints.includes(0)) penalty += 15;
        if (unlockedHints.includes(1)) penalty += 35;
        if (unlockedHints.includes(2)) penalty += 70;

        const earnedPoints = Math.max(20, activeChallenge.points - penalty);
        const newStats: CTFStats = {
          solvedCount: stats.solvedCount + 1,
          totalScore: stats.totalScore + earnedPoints,
          currentStreak: stats.currentStreak + 1,
          solvedIds: [...stats.solvedIds, activeChallenge.id],
          fastestSolveSeconds: stats.fastestSolveSeconds
            ? Math.min(stats.fastestSolveSeconds, timerSeconds)
            : timerSeconds,
        };

        setStats(newStats);
        saveCTFStats(newStats);

        onShowToast({
          text: `CORRECT FLAG! +${earnedPoints} Points added to scoreboard!`,
          type: 'success',
        });
        onAddHistory({
          module: 'CTF Challenges',
          operation: 'Flag Captured',
          summary: `Solved "${activeChallenge.title}" (+${earnedPoints} pts) in ${timerSeconds}s`,
        });
      } else {
        onShowToast({ text: 'Flag verified again! (Already scored)', type: 'info' });
      }
    } else {
      setSolveState('wrong');
      onShowToast({ text: 'INCORRECT FLAG! Check the cipher mechanics or hints.', type: 'error' });
    }
  };

  // Unlock hint
  const handleUnlockHint = (hintIndex: number) => {
    if (unlockedHints.includes(hintIndex)) return;
    setUnlockedHints([...unlockedHints, hintIndex]);
    onShowToast({ text: `Hint #${hintIndex + 1} unlocked (-${hintIndex === 0 ? 15 : hintIndex === 1 ? 35 : 70} pts)`, type: 'info' });
  };

  // Generate New AI Challenge via Gemini (Plaintext from AI, guaranteed encryption computed locally)
  const handleGenerateAiChallenge = async () => {
    try {
      setIsGeneratingAi(true);
      const diff = selectedDifficulty === 'all' ? 'medium' : selectedDifficulty;

      const res = await fetch('/api/gemini/ctf-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: diff,
          language,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate challenge');
      const challengeData = await res.json();

      const plaintext = (challengeData.plaintext || '').trim().toUpperCase();
      const rawFlag = (challengeData.flag || '').trim();
      const flagNormalized = rawFlag.toUpperCase().replace(/\s+/g, '');

      // Verify that the plaintext actually contains the flag
      const cleanPlaintextCheck = plaintext.replace(/\s+/g, '');
      if (!flagNormalized || !cleanPlaintextCheck.includes(flagNormalized)) {
        onShowToast({ text: 'AI returned an invalid challenge, please try again', type: 'error' });
        return;
      }

      let ciphertext = '';
      let cipherType = '';
      const keyUsed = (challengeData.keyUsed || '').trim();

      if (diff === 'easy') {
        const useRailFence = Math.random() > 0.5;
        if (useRailFence) {
          ciphertext = processRailFence(plaintext, 3, false).output;
          cipherType = 'Rail Fence Cipher (3 Rails)';
        } else {
          const shiftNum = parseInt(keyUsed, 10) || Math.floor(Math.random() * 24) + 1;
          ciphertext = processCaesar(plaintext, shiftNum, false).output;
          cipherType = 'Caesar Cipher';
        }
      } else if (diff === 'medium') {
        const vigenereKey = keyUsed.replace(/[^A-Z]/gi, '').toUpperCase() || 'SECRET';
        ciphertext = processVigenere(plaintext, vigenereKey, false).output;
        cipherType = 'Vigenère Cipher';
      } else {
        // hard: keyUsed is 8-10 letter keyword -> Vigenère, then Rail Fence with 3 rails
        const vigenereKey = keyUsed.replace(/[^A-Z]/gi, '').toUpperCase() || 'ENCRYPTION';
        const intermediate = processVigenere(plaintext, vigenereKey, false).output;
        ciphertext = processRailFence(intermediate, 3, false).output;
        cipherType = 'Layered Cipher (Vigenère + Rail Fence)';
      }

      const points = diff === 'easy' ? 100 : diff === 'medium' ? 250 : 500;

      const newId = `ai-ctf-${Date.now()}`;
      const newChallenge: CTFChallenge = {
        id: newId,
        title: challengeData.title || 'Operation AI Enigma',
        difficulty: diff,
        cipherType,
        scenario: challengeData.scenario || 'Classified dispatch intercepted.',
        ciphertext,
        flag: rawFlag,
        points,
        hints: challengeData.hints || [
          'Carefully inspect the cipher structure and letter distributions.',
          'Consider the key and rail pattern.',
          'Analyze the final flag token.',
        ],
      };

      setChallenges([newChallenge, ...challenges]);
      handleSelectChallenge(newId);
      onShowToast({ text: `New AI Challenge "${newChallenge.title}" generated!`, type: 'success' });
    } catch (err: any) {
      onShowToast({ text: err.message || 'Failed to generate CTF puzzle', type: 'error' });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const filteredChallenges = challenges.filter((c) =>
    selectedDifficulty === 'all' ? true : c.difficulty === selectedDifficulty
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Scoreboard */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {t.ctf}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono border border-amber-500/30">
              Cyber Wargames
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Crack encrypted intercepts, recover flags, and climb the scoreboard. Powered by dynamic Gemini CTF generators.
          </p>
        </div>

        {/* Local Persistent Scoreboard */}
        <div className="flex items-center gap-3 bg-[#0c1219]/90 border border-slate-800 p-3 rounded-2xl backdrop-blur-sm font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-slate-400 block text-[10px] uppercase">{t.score}</span>
            <span className="text-emerald-400 font-bold text-base">{stats.totalScore}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-slate-400 block text-[10px] uppercase">{t.streak}</span>
            <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-base">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{stats.currentStreak}</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
            <span className="text-slate-400 block text-[10px] uppercase">{t.solved}</span>
            <span className="text-cyan-400 font-bold text-base">
              {stats.solvedCount} / {challenges.length}
            </span>
          </div>
        </div>
      </div>

      {/* Control bar: Difficulty filter & AI Generator */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium capitalize transition-all cursor-pointer ${
                selectedDifficulty === diff
                  ? 'bg-slate-200 text-black font-semibold'
                  : 'border border-slate-800 bg-[#0d131a] text-slate-400 hover:text-white'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerateAiChallenge}
          disabled={isGeneratingAi}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-black font-semibold text-xs hover:from-cyan-400 hover:to-emerald-300 transition-all cyber-glow-cyan cursor-pointer disabled:opacity-50"
        >
          <Bot className="w-4 h-4" />
          <span>{isGeneratingAi ? 'Gemini Generating Mission...' : t.generateNewChallenge}</span>
        </button>
      </div>

      {/* Main Grid: Challenge List & Active Room */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Challenge Cards Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {filteredChallenges.map((c) => {
            const isSolved = stats.solvedIds.includes(c.id);
            const isSelected = c.id === activeChallenge.id;
            return (
              <div
                key={c.id}
                onClick={() => handleSelectChallenge(c.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md'
                    : 'border-slate-800 bg-[#0c1219]/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      c.difficulty === 'easy'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : c.difficulty === 'medium'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {c.difficulty}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {c.points} pts
                    </span>
                    {isSolved && (
                      <span title="Solved">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-100 mb-1">{c.title}</h4>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  Type: {c.cipherType}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active CTF Terminal Arena */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            {/* Arena Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold font-mono text-white">
                    {activeChallenge.title}
                  </h3>
                  {isAlreadySolved && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-cyan-400 mt-0.5">
                  Cipher Family: {activeChallenge.cipherType}
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 bg-[#070b0f] px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-white font-bold">
                  {Math.floor(timerSeconds / 60)}:
                  {(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Mission Scenario Briefing */}
            <div className="mb-5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Interception Scenario Briefing:
              </span>
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed p-3.5 rounded-xl border border-slate-800/80 bg-[#070b0f]">
                {activeChallenge.scenario}
              </p>
            </div>

            {/* Ciphertext Terminal Box */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Raw Intercepted Ciphertext:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeChallenge.ciphertext);
                    onShowToast({ text: t.copied, type: 'success' });
                  }}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy to Workbench</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#070b0f] text-emerald-400 font-mono text-sm break-all select-all cyber-border-glow">
                {activeChallenge.ciphertext}
              </div>
            </div>

            {/* Progressive Hint Accordion */}
            <div className="mb-6 space-y-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Progressive Intelligence Hints:
              </div>

              {activeChallenge.hints.map((hint, idx) => {
                const isUnlocked = unlockedHints.includes(idx);
                const cost = idx === 0 ? 15 : idx === 1 ? 35 : 70;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-800 bg-[#080d13] flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="flex items-start gap-2.5">
                      <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">
                          Hint #{idx + 1}
                        </span>
                        {isUnlocked ? (
                          <span className="text-slate-200 font-sans">{hint}</span>
                        ) : (
                          <span className="text-slate-500 italic">
                            Encrypted hint (costs -{cost} pts from challenge reward)
                          </span>
                        )}
                      </div>
                    </div>

                    {!isUnlocked && (
                      <button
                        onClick={() => handleUnlockHint(idx)}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs shrink-0 cursor-pointer"
                      >
                        Unlock Hint (-{cost} pts)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Flag Submission Arena */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#070b0f]">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block mb-2">
                Submit Flag (Format: FLAG{'{...}'}):
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  placeholder="FLAG{SECRET_CODE_HERE}"
                  className="flex-1 p-3 rounded-lg border border-slate-800 bg-[#0a0f15] text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500 tracking-wider"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitFlag();
                  }}
                />

                <button
                  onClick={handleSubmitFlag}
                  className="px-6 py-3 rounded-lg bg-emerald-500 text-black font-semibold text-xs font-mono hover:bg-emerald-400 transition-colors cursor-pointer"
                >
                  {t.submitFlag}
                </button>
              </div>

              {solveState === 'correct' && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>PWNED! Flag accepted! Points credited to scoreboard.</span>
                </div>
              )}

              {solveState === 'wrong' && (
                <div className="mt-3 p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Access Denied: Incorrect flag string. Try cryptanalysis or request a hint!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
