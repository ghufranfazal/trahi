import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  ArrowLeft,
  Sparkles,
  Siren,
  HeartPulse,
  Flame,
  ShieldAlert,
  Droplets,
  Activity,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ChatMessage,
  ChatSession,
  getInitialSessions,
  saveSessionsToStorage,
  sendTrahiGPTMessage,
} from '../../services/trahiGPTService.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { TrahiGPTInputBar } from './TrahiGPTInputBar.tsx';
import { TrahiGPTSidebar } from './TrahiGPTSidebar.tsx';

interface TrahiGPTViewProps {
  onBackToSOS: () => void;
  onOpenProfile: () => void;
}

export const TrahiGPTView: React.FC<TrahiGPTViewProps> = ({
  onBackToSOS,
  onOpenProfile,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on initial render
  useEffect(() => {
    const loaded = getInitialSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      setActiveSessionId(loaded[0].id);
    }
  }, []);

  // Save sessions whenever they update
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessionsToStorage(sessions);
    }
  }, [sessions]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isLoading]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Emergency Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (activeSessionId === id) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
        } else {
          setActiveSessionId(null);
        }
      }
      return updated;
    });
  };

  const handleSendMessage = async (userText: string) => {
    let currentSessionId = activeSessionId;
    let targetSession = activeSession;

    // Create session if none exists
    if (!currentSessionId || !targetSession) {
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: userText.slice(0, 30) || 'New Emergency Query',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSessionId = newSession.id;
      targetSession = newSession;
    }

    const userMessage: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    // Update active session with user message
    const updatedMessages = [...(targetSession?.messages || []), userMessage];
    const isFirstUserMessage = (targetSession?.messages || []).length === 0;

    const newTitle = isFirstUserMessage
      ? userText.length > 32
        ? `${userText.slice(0, 30)}...`
        : userText
      : targetSession?.title || 'Emergency Chat';

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsLoading(true);

    try {
      const reply = await sendTrahiGPTMessage(userText, updatedMessages);

      const assistantMessage: ChatMessage = {
        id: `ast-msg-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [...s.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : s
        )
      );
    } catch (error: any) {
      console.error('Error sending TrahiGPT message:', error);
      const errorMessage: ChatMessage = {
        id: `err-msg-${Date.now()}`,
        sender: 'assistant',
        text: `> ⚠️ **Gemini AI Service Error**: ${error?.message || 'Failed to generate response. Please ensure GEMINI_API_KEY is configured in backend .env.'}`,
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [...s.messages, errorMessage],
                updatedAt: Date.now(),
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    {
      title: 'CPR & Cardiac Response',
      desc: 'Hands-only CPR steps for adult',
      icon: <HeartPulse className="text-red-500" size={18} />,
      query: 'How to perform hands-only CPR on an unconscious adult in cardiac arrest?',
    },
    {
      title: 'Severe Burn Treatment',
      desc: 'First aid for thermal & chemical burns',
      icon: <Flame className="text-orange-500" size={18} />,
      query: 'What is the immediate first-aid protocol for severe burns and scalds?',
    },
    {
      title: 'Snakebite Emergency',
      desc: 'India venomous snakebite triage',
      icon: <ShieldAlert className="text-amber-500" size={18} />,
      query: 'What is the life-saving first-aid action plan for a snakebite in India?',
    },
    {
      title: 'Bleeding & Pressure Dressing',
      desc: 'Stopping heavy hemorrhage',
      icon: <Droplets className="text-red-600" size={18} />,
      query: 'How to control severe bleeding from a deep wound using direct pressure?',
    },
  ];

  return (
    <div className="fixed inset-0 z-30 bg-[#F7F7F8] flex flex-col font-sans text-gray-900 select-none overflow-hidden">
      {/* 1. Header Bar with Menu Toggle & Prominent Return Button (← Trahi SOS) */}
      <header className="h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between shrink-0 shadow-2xs">
        {/* Left Side: Top-Left Collapsible Sidebar ("Hamburger") Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-700 flex items-center justify-center transition border border-gray-200 cursor-pointer"
            title="Open Conversations Drawer (Swipe Right on screen)"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F9D8F] flex items-center justify-center text-white shadow-md shadow-[#0F9D8F]/25">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-gray-900">TrahiGPT</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-[#F0294D] border border-red-200/60">
                  First-Aid AI
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-gray-400 font-medium">
                Gemini 3.7 Flash Triage • Emergency Protocol Active
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Prominent Return Button labeled `← Trahi SOS` */}
        <button
          onClick={onBackToSOS}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs sm:text-sm shadow-md shadow-red-500/20 active:scale-95 transition cursor-pointer border border-red-600/30"
          title="Return to Main SOS Dashboard"
        >
          <ArrowLeft size={16} className="stroke-[3]" />
          <span>← Trahi SOS</span>
        </button>
      </header>

      {/* 2. Top-Left Collapsible Sidebar Drawer */}
      <TrahiGPTSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenProfile={onOpenProfile}
      />

      {/* 3. Central Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl w-full mx-auto">
        {!activeSession || activeSession.messages.length === 0 ? (
          /* Empty / Welcome State with Quick Action Chips */
          <div className="flex flex-col items-center justify-center min-h-[70vh] py-8 text-center max-w-lg mx-auto space-y-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center mx-auto border border-teal-200/80 shadow-md shadow-[#0F9D8F]/10">
                <Sparkles size={32} />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2626] animate-ping" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                TrahiGPT First-Aid Intelligence
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed max-w-md mx-auto font-medium">
                Instant emergency protocols, CPR instructions, burn treatment, and disaster survival guidance for India.
              </p>
            </div>

            {/* Quick Action Chips Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
              {quickPrompts.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(item.query)}
                  className="p-3.5 rounded-2xl bg-white hover:bg-teal-50/60 border border-gray-200/80 hover:border-[#0F9D8F]/60 transition cursor-pointer group text-left shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="p-1.5 rounded-xl bg-gray-50 group-hover:bg-teal-100/60 transition">
                      {item.icon}
                    </div>
                    <span className="font-bold text-xs text-gray-900 group-hover:text-[#0F9D8F] transition">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 pl-9 font-medium">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-red-50/80 border border-red-100 text-[11px] text-red-900 flex items-center justify-center gap-2 font-medium">
              <Siren size={14} className="text-[#DC2626]" />
              <span>In direct danger? Click <strong>← Trahi SOS</strong> or dial <strong>112</strong> immediately.</span>
            </div>
          </div>
        ) : (
          /* Active Message Thread */
          <div className="space-y-6">
            {activeSession.messages.map((message) => {
              const isUser = message.sender === 'user';
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-[#0F9D8F] text-white flex items-center justify-center shrink-0 mt-1 shadow-md shadow-[#0F9D8F]/25">
                      <Sparkles size={16} />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`group relative max-w-[88%] sm:max-w-[80%]`}>
                    <div
                      className={`p-4 rounded-3xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#0F9D8F] text-white font-medium rounded-tr-xs shadow-md shadow-[#0F9D8F]/20'
                          : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{message.text}</p>
                      ) : (
                        <MarkdownRenderer content={message.text} />
                      )}
                    </div>

                    {/* Footer timestamp & copy action */}
                    <div
                      className={`flex items-center gap-2 text-[10px] text-gray-400 mt-1 px-1 font-medium ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(message.text, message.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-gray-700 transition cursor-pointer flex items-center gap-1"
                          title="Copy Markdown Text"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check size={11} className="text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center shrink-0 mt-1 border border-teal-200/80 shadow-2xs">
                      <User size={16} />
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Loading Indicator when assistant is generating */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-[#0F9D8F] text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                  <Sparkles size={16} />
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 text-gray-600 text-xs flex items-center gap-2 shadow-2xs font-medium">
                  <Activity size={14} className="animate-spin text-[#0F9D8F]" />
                  <span>TrahiGPT Triage Engine analyzing query...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* 4. Bottom Centered Input Bar with Web Speech API Voice Input */}
      <TrahiGPTInputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};
