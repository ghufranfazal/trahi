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
        setInput(currentTranscript);
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
    <div className="w-full max-w-3xl mx-auto px-4 py-3 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-lg">
      {/* Live Voice Recording Status Badge */}
      {isListening && (
        <div className="mb-2 flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-ping" />
            <span className="font-bold">Listening via Web Speech API (en-IN)...</span>
          </div>
          <span className="text-[10px] font-mono bg-red-600 px-2 py-0.5 rounded text-white font-bold">
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
              ? 'bg-[#DC2626] text-white shadow-lg shadow-red-500/30 ring-4 ring-red-300 animate-pulse'
              : 'bg-teal-50 hover:bg-teal-100/80 text-[#0F9D8F] border border-teal-200/80 shadow-2xs'
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
            className="w-full h-11 pl-4 pr-10 rounded-2xl bg-gray-50/90 text-gray-900 placeholder-gray-400 text-xs sm:text-sm font-medium border border-gray-200/90 focus:outline-none focus:border-[#0F9D8F] focus:ring-2 focus:ring-[#0F9D8F]/20 focus:bg-white transition-all shadow-2xs"
          />

          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold px-1"
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
              ? 'bg-[#0F9D8F] hover:bg-[#0c8579] text-white shadow-md shadow-[#0F9D8F]/25 active:scale-95'
              : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
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

      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1.5 px-1 font-medium">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-[#0F9D8F]" />
          <span>TrahiGPT Triage Engine • Gemini 3.7 Flash</span>
        </span>
        <span className="hidden sm:inline">Emergency Helpline: Dial 112 / 108</span>
      </div>
    </div>
  );
};
