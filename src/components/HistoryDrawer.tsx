import React from 'react';
import { HistoryItem, Language } from '../types/crypto';
import { translations } from '../utils/translations';
import { X, Trash2, Clock, Copy, Check } from 'lucide-react';

interface HistoryDrawerProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
  onShowToast: (msg: { text: string; type: 'success' | 'error' | 'info' }) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  language,
  isOpen,
  onClose,
  history,
  onClearHistory,
  onShowToast,
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md h-full bg-[#0b1016] border-l border-slate-800 shadow-2xl flex flex-col slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080d12]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold font-mono text-white text-sm">{t.history}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-950/30 transition-colors"
                title={t.clearHistory}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.clearHistory}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-center">
              <Clock className="w-8 h-8 text-slate-600 mb-2" />
              <span>{t.noHistory}</span>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-800/80 bg-[#070b0f] hover:border-slate-700 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    {item.module}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-slate-200 font-semibold">{item.operation}</div>
                <div className="text-slate-400 truncate">{item.summary}</div>

                {item.detail && (
                  <div className="text-[11px] text-slate-500 font-sans border-t border-slate-800/60 pt-1 mt-1">
                    {item.detail}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${item.operation}\n${item.summary}`);
                      onShowToast({ text: t.copied, type: 'success' });
                    }}
                    className="flex items-center gap-1 text-[10px] text-emerald-400 hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{t.copy}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
