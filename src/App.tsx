/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Language, HistoryItem } from './types/crypto';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ClassicalModule } from './components/ClassicalModule';
import { ModernModule } from './components/ModernModule';
import { CryptanalysisModule } from './components/CryptanalysisModule';
import { SteganographyModule } from './components/SteganographyModule';
import { PasswordModule } from './components/PasswordModule';
import { CTFModule } from './components/CTFModule';
import { AITutorModal } from './components/AITutorModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { MatrixBackground } from './components/MatrixBackground';

const HISTORY_KEY = 'cipherlab_history';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // AI Tutor Modal state
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);
  const [tutorContextSnippet, setTutorContextSnippet] = useState<string | undefined>(undefined);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync RTL and lang attribute with language state
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Save history to localStorage
  const handleAddHistory = useCallback(
    (item: {
      module: string;
      operation: string;
      summary: string;
      detail?: string;
    }) => {
      const newItem: HistoryItem = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        ...item,
      };
      setHistory((prev) => {
        const updated = [newItem, ...prev.slice(0, 49)];
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    []
  );

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
    showToast({ text: 'History cleared', type: 'info' });
  };

  // Toast dispatch
  const showToast = ({ text, type }: { text: string; type: 'success' | 'error' | 'info' }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Trigger "Explain this with AI" from any module
  const handleExplainWithAI = (context: string) => {
    setTutorContextSnippet(context);
    setIsTutorModalOpen(true);
  };

  return (
    <div
      className={`min-h-screen relative flex flex-col transition-colors duration-300 ${
        theme === 'light' ? 'bg-[#f4f7f9] text-slate-900' : 'bg-[#080c10] text-slate-100'
      }`}
    >
      {/* Matrix falling code background */}
      <MatrixBackground opacity={theme === 'dark' ? 0.22 : 0.06} />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTutor={() => setIsTutorModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1">
        {activeTab === 'landing' && (
          <LandingPage setActiveTab={setActiveTab} language={language} />
        )}

        {activeTab === 'classical' && (
          <ClassicalModule
            language={language}
            onExplainWithAI={handleExplainWithAI}
            onAddHistory={handleAddHistory}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'modern' && (
          <ModernModule
            language={language}
            onExplainWithAI={handleExplainWithAI}
            onAddHistory={handleAddHistory}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'analysis' && (
          <CryptanalysisModule
            language={language}
            onExplainWithAI={handleExplainWithAI}
            onAddHistory={handleAddHistory}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'steganography' && (
          <SteganographyModule
            language={language}
            onExplainWithAI={handleExplainWithAI}
            onAddHistory={handleAddHistory}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'password' && (
          <PasswordModule
            language={language}
            onExplainWithAI={handleExplainWithAI}
            onAddHistory={handleAddHistory}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'ctf' && (
          <CTFModule
            language={language}
            onExplainWithAI={handleExplainWithAI}
            onAddHistory={handleAddHistory}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'tutor' && (
          <AITutorModal
            language={language}
            isOpen={true}
            onClose={() => setActiveTab('landing')}
            isFullModule={true}
          />
        )}
      </main>

      {/* Floating AI Tutor Modal (when triggered via navbar or "Explain with AI") */}
      {isTutorModalOpen && activeTab !== 'tutor' && (
        <AITutorModal
          language={language}
          isOpen={isTutorModalOpen}
          onClose={() => {
            setIsTutorModalOpen(false);
            setTutorContextSnippet(undefined);
          }}
          contextSnippet={tutorContextSnippet}
        />
      )}

      {/* Operation History Drawer */}
      <HistoryDrawer
        language={language}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onShowToast={showToast}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
