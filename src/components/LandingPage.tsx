import React from 'react';
import { ActiveTab, Language } from '../types/crypto';
import { translations } from '../utils/translations';
import {
  Terminal,
  Cpu,
  Binary,
  Eye,
  KeyRound,
  Trophy,
  Bot,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface LandingPageProps {
  setActiveTab: (tab: ActiveTab) => void;
  language: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab, language }) => {
  const t = translations[language];

  const features = [
    {
      tab: 'classical' as ActiveTab,
      title: t.classical,
      desc: 'Caesar, Vigenère, Playfair 5x5, Hill 2x2 matrix, Rail Fence zigzag, and Monoalphabetic ciphers with live step-by-step trace animations.',
      icon: Terminal,
      color: 'emerald',
      badge: 'Interactive Tracing',
    },
    {
      tab: 'modern' as ActiveTab,
      title: t.modern,
      desc: 'True browser Web Crypto API: AES-256-GCM (text & file encryption), RSA-OAEP 2048 keypairs & signatures, SHA-1/256/512, and bit-level Avalanche effect demo.',
      icon: Cpu,
      color: 'cyan',
      badge: 'Hardware WebCrypto',
    },
    {
      tab: 'analysis' as ActiveTab,
      title: t.analysis,
      desc: 'Crack unknown ciphers with Index of Coincidence, Chi-squared Caesar brute force, Kasiski & Friedman tests, and Gemini AI cryptanalysis.',
      icon: Binary,
      color: 'emerald',
      badge: 'AI Powered',
    },
    {
      tab: 'steganography' as ActiveTab,
      title: t.steganography,
      desc: 'Embed secret text into PNG image pixels using Least Significant Bit (LSB) on Canvas with optional AES-GCM password protection and visual diff maps.',
      icon: Eye,
      color: 'cyan',
      badge: 'Pixel LSB',
    },
    {
      tab: 'password' as ActiveTab,
      title: t.password,
      desc: '100% zero-knowledge local entropy calculation, crack time estimation (online, GPU, PBKDF2), pattern detection, and privacy-safe Gemini audit.',
      icon: KeyRound,
      color: 'emerald',
      badge: 'Zero-Knowledge',
    },
    {
      tab: 'ctf' as ActiveTab,
      title: t.ctf,
      desc: 'Defcon-style crypto CTF challenges across Easy, Medium, and Hard tiers. Solve puzzles with hints, timer, and persistent scoreboard.',
      icon: Trophy,
      color: 'cyan',
      badge: 'Compete & Learn',
    },
  ];

  return (
    <div className="relative min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 text-center px-4 max-w-5xl mx-auto">
        {/* Glow ambient circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-mono font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Generation Cryptography Laboratory</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-mono">
            CipherLab
          </span>
          <br />
          <span className="text-2xl sm:text-4xl lg:text-5xl font-sans text-slate-200 font-light mt-2 block">
            {t.tagline}
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
          {language === 'ar'
            ? 'منصة متكاملة للمهندسين ومختبري الاختراق وعشاق التشفير. استكشف الشفرات التاريخية، ونفّذ خوارزميات التشفير الحديثة عبر Web Crypto، واختبر قوة كلمات المرور، واستعن بذكاء Gemini لتحليل الشفرات الغامضة وحل تحديات الهاكرز.'
            : 'The definitive hands-on cryptographic suite. Explore classical ciphers with live step visualizers, execute real Web Crypto AES & RSA operations, hide payloads in pixel LSBs, and harness Gemini AI to decipher unknown intercepts.'}
        </p>

        {/* Hero CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setActiveTab('classical')}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition-all cyber-glow-green shadow-lg cursor-pointer"
          >
            <span>{t.startEncrypting}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>

          <button
            onClick={() => setActiveTab('ctf')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 text-sm font-medium hover:border-cyan-500/50 hover:text-cyan-400 transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span>{t.ctf}</span>
          </button>

          <button
            onClick={() => setActiveTab('tutor')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 text-sm font-medium hover:border-emerald-500/50 hover:text-emerald-400 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>{t.tutor}</span>
          </button>
        </div>

        {/* Key Features Quick Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-14 max-w-4xl mx-auto text-left font-mono text-xs">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0c1219]/70 backdrop-blur-sm">
            <span className="text-emerald-400 font-bold block text-sm">6 CIPHERS</span>
            <span className="text-slate-400 text-[11px]">Step-by-step trace</span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0c1219]/70 backdrop-blur-sm">
            <span className="text-cyan-400 font-bold block text-sm">AES + RSA 2048</span>
            <span className="text-slate-400 text-[11px]">Native Web Crypto</span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0c1219]/70 backdrop-blur-sm">
            <span className="text-emerald-400 font-bold block text-sm">AI BREAKING</span>
            <span className="text-slate-400 text-[11px]">Gemini 3.8 Flash</span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0c1219]/70 backdrop-blur-sm">
            <span className="text-cyan-400 font-bold block text-sm">LSB STEGO</span>
            <span className="text-slate-400 text-[11px]">Canvas pixel hiding</span>
          </div>
        </div>
      </section>

      {/* Feature Modules Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            {language === 'ar' ? 'وحدات المختبر الشاملة' : 'Comprehensive Cryptographic Modules'}
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            {language === 'ar'
              ? 'مجموعة متكاملة من الأدوات التفاعلية المصممة للتعلم العميق والممارسة العملية واختبار الأمان.'
              : 'Engineered for security researchers, cryptanalysts, students, and cybersecurity enthusiasts.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            const isEmerald = f.color === 'emerald';
            return (
              <div
                key={f.tab}
                onClick={() => setActiveTab(f.tab)}
                className="group relative p-6 rounded-2xl border border-slate-800 bg-[#0d131b]/80 hover:border-emerald-500/40 hover:bg-[#0f1722] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-emerald-950/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                        isEmerald
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 group-hover:cyber-glow-green'
                          : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400 group-hover:cyber-glow-cyan'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900 text-slate-300">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mb-2">
                    {f.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans mb-6">
                    {f.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                  <span>{language === 'ar' ? 'افتح الوحدة' : 'Launch Module'}</span>
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Section (3 Steps) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-400 text-xs font-mono mb-3">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {language === 'ar' ? 'كيف يعمل سايفر لاب؟' : 'How CipherLab Works'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d131b]/60 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              {language === 'ar' ? 'أدخل واضبط المعاملات' : 'Input & Configure'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'اختر الخوارزمية، اكتب النص أو ارفع الملف، وضبط المفاتيح (مصفوفات هيل، مفاتيح فيجنير، كلمات مرور AES، أو أزواج RSA).'
                : 'Select any algorithm, provide your message or upload files, and tune parameters like Hill matrices, Vigenère phrases, AES passwords, or RSA keypairs.'}
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d131b]/60 relative">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              {language === 'ar' ? 'شاهد المحاكاة خطوة بخطوة' : 'Visualize & Transform'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'شاهد شبكة بلايفير 5x5، وموجة السكة الحديدية، ومصفوفات هيل أثناء التحويل في الوقت الفعلي مع أزرار تشغيل وإيقاف وتحكم بالسرعة.'
                : 'Watch Playfair grids highlight digraph intersections, Rail Fence zigzags animate across rails, and Web Crypto calculate real AES-GCM tags.'}
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d131b]/60 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              {language === 'ar' ? 'حلّل واخترق بذكاء Gemini' : 'Analyze & Break with AI'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'استخدم حسابات مؤشر التطابق وفحص كاسيسكي، ودع ذكاء Gemini يكشف نوع الشفرة ويسترجع المفتاح ويفسر خطوات الحل بوضوح.'
                : 'Feed unknown intercepts into statistical frequency analyzers and let Gemini cryptanalysis deduce cipher types, recover keys, and decipher flags.'}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800/80 pt-10 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CipherLab © {new Date().getFullYear()} — Client-Side Cryptography & Gemini AI Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Zero-Knowledge Privacy</span>
            <span>•</span>
            <span>Web Crypto Native</span>
            <span>•</span>
            <span>RTL Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
