import React from 'react';
import { ActiveTab, Language } from '../types/crypto';
import { translations } from '../utils/translations';
import {
  ShieldAlert,
  Terminal,
  Binary,
  Cpu,
  Eye,
  KeyRound,
  Trophy,
  Bot,
  Globe,
  Sun,
  Moon,
  History,
  Home,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenTutor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  theme,
  setTheme,
  historyCount,
  onOpenHistory,
  onOpenTutor,
}) => {
  const t = translations[language];

  const navItems = [
    { id: 'landing' as ActiveTab, label: t.landing, icon: Home },
    { id: 'classical' as ActiveTab, label: t.classical, icon: Terminal },
    { id: 'modern' as ActiveTab, label: t.modern, icon: Cpu },
    { id: 'analysis' as ActiveTab, label: t.analysis, icon: Binary },
    { id: 'steganography' as ActiveTab, label: t.steganography, icon: Eye },
    { id: 'password' as ActiveTab, label: t.password, icon: KeyRound },
    { id: 'ctf' as ActiveTab, label: t.ctf, icon: Trophy },
    { id: 'tutor' as ActiveTab, label: t.tutor, icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-500/20 bg-[#080c10]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 cyber-glow-green transition-all">
              <ShieldAlert className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-wider text-lg text-slate-100">
                <span className="text-emerald-400 font-mono">Cipher</span>
                <span className="text-cyan-400 font-mono">Lab</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase font-mono tracking-widest ml-1 hidden sm:inline-block">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block tracking-wide">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switch */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
              title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-xs rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
              title={theme === 'dark' ? t.themeLight : t.themeDark}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            {/* History Drawer Trigger */}
            <button
              onClick={onOpenHistory}
              className="relative p-2 text-xs rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
              title={t.history}
            >
              <History className="w-4 h-4 text-slate-300" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-black flex items-center justify-center font-mono">
                  {historyCount > 9 ? '9+' : historyCount}
                </span>
              )}
            </button>

            {/* AI Tutor Button */}
            <button
              onClick={onOpenTutor}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-sm cyber-glow-green"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.tutor}</span>
            </button>
          </div>
        </div>

        {/* Module Nav Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/60 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
