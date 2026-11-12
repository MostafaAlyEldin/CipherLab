import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types/crypto';
import { translations } from '../utils/translations';
import {
  Bot,
  Send,
  X,
  Sparkles,
  HelpCircle,
  RotateCcw,
  User,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface AITutorModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  contextSnippet?: string;
  isFullModule?: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const AITutorModal: React.FC<AITutorModalProps> = ({
  language,
  isOpen,
  onClose,
  contextSnippet,
  isFullModule = false,
}) => {
  const t = translations[language];

  const suggestedQuestions = [
    'Why is ECB mode insecure (Penguin effect)?',
    'Explain RSA math and prime factoring simply',
    'What is a salt vs IV vs nonce?',
    'Difference between hashing and encryption',
    'How does quantum computing threaten RSA and ECC?',
    'What is the Avalanche Effect in cryptographic hashes?',
  ];

  const arabicSuggestions = [
    'لماذا يعتبر نمط ECB غير آمن في التشفير؟',
    'اشرح خوارزمية RSA والأعداد الأولية ببساطة',
    'ما الفرق بين Salt و IV في التشفير؟',
    'ما الفرق الجوهري بين التجزئة (Hash) والتشفير (Encryption)؟',
    'كيف يهدد الحاسوب الكمي خوارزميات التشفير الحالية؟',
  ];

  const activeQuestions = language === 'ar' ? arabicSuggestions : suggestedQuestions;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content:
        language === 'ar'
          ? 'مرحباً بك في مختبر التشفير! أنا الأستاذة آدا، مرشدتك ومساعدتك في علم التعمية والتشفير. يمكنك سؤالي عن أي خوارزمية كلاسيكية أو حديثة، أو فهم الثغرات الرياضية، أو تحليل أي نتيجة من أدوات المختبر.'
          : 'Welcome to CipherLab! I am Professor Ada, your AI cryptography instructor. Ask me anything about classical or modern ciphers, mathematical proofs, attack vectors, or click "Explain with AI" from any workbench module.',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // If contextSnippet is passed, inject as a query
  useEffect(() => {
    if (contextSnippet && contextSnippet.trim()) {
      handleSendMessage(`Can you explain this result in depth: "${contextSnippet}"`);
    }
  }, [contextSnippet]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          language,
          contextSnippet,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      setMessages([
        ...newMessages,
        { role: 'model', content: data.text || 'Unable to generate response.' },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'model',
          content: 'Apologies, I encountered an error connecting to the AI cryptanalysis core.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'model',
        content:
          language === 'ar'
            ? 'تمت إعادة ضبط المحادثة. ما المفهوم الذي ترغب في استكشافه الآن؟'
            : 'Conversation reset. What cryptographic topic would you like to explore next?',
      },
    ]);
  };

  if (!isOpen && !isFullModule) return null;

  const content = (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0a0e14]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center cyber-glow-green">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold font-mono text-white text-base">Professor Ada</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">CipherLab Interactive Cryptography Mentor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white"
            title="Clear Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {!isFullModule && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggested Topic Chips */}
      <div className="p-3 border-b border-slate-800/80 bg-[#090d13] overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap pl-1">
          {t.suggestedQuestions}:
        </span>
        {activeQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(q)}
            className="px-2.5 py-1 rounded-lg text-xs font-mono border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans text-sm">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl p-4 rounded-2xl ${
                  isUser
                    ? 'bg-emerald-600 text-black font-medium rounded-br-none shadow-md'
                    : 'bg-[#0f1722] border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs font-mono animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <span>Professor Ada is formulating response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-800 bg-[#090d13]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={t.askAda}
            className="flex-1 p-3 rounded-xl border border-slate-800 bg-[#070b0f] text-slate-100 font-sans text-sm focus:outline-none focus:border-emerald-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputVal.trim() || isLoading}
            className="p-3 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (isFullModule) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-140px)] flex flex-col">
        <div className="flex-1 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm overflow-hidden flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  // Floating Modal variant
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl h-[80vh] rounded-2xl border border-slate-800 bg-[#0c1219] shadow-2xl overflow-hidden flex flex-col">
        {content}
      </div>
    </div>
  );
};
