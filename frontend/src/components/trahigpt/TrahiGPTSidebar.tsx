import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  X,
  User,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatSession } from '../../services/trahiGPTService.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface TrahiGPTSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenProfile: () => void;
}

export const TrahiGPTSidebar: React.FC<TrahiGPTSidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenProfile,
}) => {
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Touch swipe gesture state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    // If swiped left by more than 50px, close sidebar
    if (touchStartX.current - touchEndX.current > 50) {
      onClose();
    }
  };

  // Filter sessions by search query
  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  });

  // Group filtered sessions chronologically
  const now = Date.now();
  const todaySessions: ChatSession[] = [];
  const yesterdaySessions: ChatSession[] = [];
  const olderSessions: ChatSession[] = [];

  filteredSessions.forEach((s) => {
    const diff = now - s.updatedAt;
    if (diff < 86400000) {
      todaySessions.push(s);
    } else if (diff < 86400000 * 2) {
      yesterdaySessions.push(s);
    } else {
      olderSessions.push(s);
    }
  });

  const avatarUrl =
    userProfile?.profilePictureUrl ||
    (userProfile?.userId || userProfile?.uid
      ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${userProfile.userId || userProfile.uid}`
      : null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
          />

          {/* Drawer Sidebar Container */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-white border-r border-gray-200/80 flex flex-col justify-between p-4 shadow-2xl text-gray-800 select-none h-full"
          >
            {/* Top Bar Header & Controls */}
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0F9D8F] flex items-center justify-center text-white shadow-md shadow-[#0F9D8F]/25">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                      <span>TrahiGPT</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 text-[#F0294D]">
                        AI Triage
                      </span>
                    </h2>
                    <p className="text-[10px] text-gray-400">Emergency & First Aid Assistant</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition cursor-pointer"
                  title="Close Menu (or Swipe Left)"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 1. New Chat Button */}
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#0F9D8F]/25 active:scale-98 transition cursor-pointer"
              >
                <Plus size={18} />
                <span>New Chat Session</span>
              </button>

              {/* 2. Quick Search Input */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recent conversations..."
                  className="w-full py-2 pl-9 pr-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 text-xs border border-gray-200 focus:outline-none focus:border-[#0F9D8F]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 3. Recent Chats Chronological List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                {filteredSessions.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs space-y-1">
                    <MessageSquare size={24} className="mx-auto opacity-40 mb-2 text-gray-400" />
                    <p className="font-semibold text-gray-600">No matching conversations found.</p>
                    <p className="text-[11px]">Start a new chat prompt anytime.</p>
                  </div>
                ) : (
                  <>
                    {todaySessions.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 px-2">
                          Today
                        </h4>
                        <div className="space-y-1">
                          {todaySessions.map((session) => (
                            <div
                              key={session.id}
                              className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs ${
                                activeSessionId === session.id
                                  ? 'bg-teal-50/80 text-[#0F9D8F] border-l-3 border-[#0F9D8F] font-bold shadow-2xs'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <div
                                onClick={() => {
                                  onSelectSession(session.id);
                                  onClose();
                                }}
                                className="flex items-center gap-2.5 flex-1 min-w-0"
                              >
                                <MessageSquare
                                  size={14}
                                  className={
                                    activeSessionId === session.id
                                      ? 'text-[#0F9D8F] shrink-0'
                                      : 'text-gray-400 shrink-0'
                                  }
                                />
                                <span className="truncate">{session.title}</span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                                title="Delete Conversation"
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition cursor-pointer ml-1 text-gray-400"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {yesterdaySessions.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 px-2">
                          Yesterday
                        </h4>
                        <div className="space-y-1">
                          {yesterdaySessions.map((session) => (
                            <div
                              key={session.id}
                              className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs ${
                                activeSessionId === session.id
                                  ? 'bg-teal-50/80 text-[#0F9D8F] border-l-3 border-[#0F9D8F] font-bold shadow-2xs'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <div
                                onClick={() => {
                                  onSelectSession(session.id);
                                  onClose();
                                }}
                                className="flex items-center gap-2.5 flex-1 min-w-0"
                              >
                                <MessageSquare size={14} className="text-gray-400 shrink-0" />
                                <span className="truncate">{session.title}</span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                                title="Delete Conversation"
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition cursor-pointer ml-1 text-gray-400"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {olderSessions.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 px-2">
                          Previous 7 Days
                        </h4>
                        <div className="space-y-1">
                          {olderSessions.map((session) => (
                            <div
                              key={session.id}
                              className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs ${
                                activeSessionId === session.id
                                  ? 'bg-teal-50/80 text-[#0F9D8F] border-l-3 border-[#0F9D8F] font-bold shadow-2xs'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <div
                                onClick={() => {
                                  onSelectSession(session.id);
                                  onClose();
                                }}
                                className="flex items-center gap-2.5 flex-1 min-w-0"
                              >
                                <MessageSquare size={14} className="text-gray-400 shrink-0" />
                                <span className="truncate">{session.title}</span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                                title="Delete Conversation"
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition cursor-pointer ml-1 text-gray-400"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 4. Profile Footer (Fixed at bottom of drawer) */}
            <div className="pt-3 border-t border-gray-100 shrink-0">
              <button
                onClick={() => {
                  onOpenProfile();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100/80 border border-gray-200/80 transition cursor-pointer text-left group"
                title="Click to open Profile Settings"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full border-2 border-[#0F9D8F] overflow-hidden bg-white shrink-0 flex items-center justify-center shadow-2xs">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="User Profile Avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User size={18} className="text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {userProfile?.name || 'Guest User'}
                    </p>
                    <p className="text-[10px] text-[#0F9D8F] font-semibold flex items-center gap-1 truncate">
                      <ShieldCheck size={11} />
                      <span>{userProfile?.authType === 'google' ? 'Google Donor' : 'Anonymous SOS'}</span>
                    </p>
                  </div>
                </div>

                <div className="p-1 rounded-lg bg-gray-200/80 group-hover:bg-[#0F9D8F] group-hover:text-white text-gray-500 transition shrink-0">
                  <ChevronRight size={14} />
                </div>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
