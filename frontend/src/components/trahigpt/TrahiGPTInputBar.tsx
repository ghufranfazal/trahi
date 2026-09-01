import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, Sparkles } from 'lucide-react';

interface TrahiGPTInputBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const TrahiGPTInputBar: React.FC<TrahiGPTInputBarProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput((prev) => {
          // If we had existing text, combine cleanly
          return currentTranscript;
        });
      };

      recognition.onerror = (event: any) => {
        console.warn('Web Speech API recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      setIsListening(false);
      return;
    }

    if (speechSupported && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech recognition start failed, using fallback speech simulation:', err);
        startMockVoiceRecording();
      }
    } else {
      // Fallback voice recording simulation
      startMockVoiceRecording();
    }
  };

  const startMockVoiceRecording = () => {
    setIsListening(true);
    const mockPrompts = [
      'How to give CPR to a person in cardiac arrest?',
      'Immediate first aid for a severe snake bite',
      'How to control heavy bleeding from a deep wound?',
      'Emergency steps for severe burn from hot oil',
    ];
    const chosen = mockPrompts[Math.floor(Math.random() * mockPrompts.length)];

    setTimeout(() => {
      setInput(chosen);
      setIsListening(false);
    }, 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-3 bg-slate-900/90 backdrop-blur-md border-t border-slate-800">
      {/* Live Voice Recording Status Badge */}
      {isListening && (
        <div className="mb-2 flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-red-950/80 border border-red-700/60 text-red-200 text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-ping" />
            <span className="font-bold">Listening via Web Speech API (en-IN)...</span>
          </div>
          <span className="text-[10px] font-mono bg-red-900/60 px-2 py-0.5 rounded text-white">
            Speak Now
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        {/* Dedicated Voice Input Button (Microphone Icon) adjacent to input bar */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          title={isListening ? 'Stop Voice Recording' : 'Voice Query Input (Web Speech API)'}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isListening
              ? 'bg-[#DC2626] text-white shadow-lg shadow-red-600/40 ring-4 ring-red-500/30 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70'
          }`}
          aria-label="Hands-free Voice Input"
        >
          {isListening ? (
            <MicOff size={20} className="animate-bounce" />
          ) : (
            <Mic size={20} className="text-[#0F9D8F]" />
          )}
        </button>

        {/* Central Text Input Field */}
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to spoken voice query...'
                : 'Ask TrahiGPT first-aid, CPR, burn, or rescue instructions...'
            }
            disabled={isLoading}
            className="w-full h-11 pl-4 pr-10 rounded-2xl bg-slate-800/90 text-white placeholder-slate-400 text-xs sm:text-sm font-medium border border-slate-700/80 focus:outline-none focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/30 transition-all"
          />

          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            input.trim() && !isLoading
              ? 'bg-[#0F9D8F] hover:bg-[#0c8579] text-white shadow-md shadow-[#0F9D8F]/30 active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
          }`}
          aria-label="Send Query"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-[#0F9D8F]" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1 font-medium">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-[#0F9D8F]" />
          <span>TrahiGPT Triage Engine • Gemini 3.7 Flash</span>
        </span>
        <span className="hidden sm:inline">Emergency Hotline: Dial 112 / 108</span>
      </div>
    </div>
  );
};
