import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Square, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  PhoneCall, 
  Navigation2, 
  Layers, 
  Volume2, 
  VolumeX, 
  Clock, 
  Flame, 
  Waves, 
  Activity, 
  HeartHandshake, 
  Truck, 
  Building, 
  AlertCircle,
  Loader2,
  Play,
  Pause
} from 'lucide-react';
import { 
  submitCompleteSOSReport, 
  SOSSubmissionResult, 
  triggerHapticFeedback 
} from '../../services/sosSubmissionService.ts';
import { EmergencyCategory } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLocation } from '../../context/LocationContext.tsx';
import { useNetwork } from '../../context/NetworkContext.tsx';

export type SOSFlowPhase = 'recording' | 'cancelling' | 'broadcasting' | 'success';

interface SOSFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAudioStream?: MediaStream | null;
  onSOSSuccess?: (result: SOSSubmissionResult) => void;
}

// Icon helper for emergency categories
export const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'Flood':
      return <Waves size={16} className="text-blue-500" />;
    case 'Fire':
      return <Flame size={16} className="text-orange-500" />;
    case 'Earthquake':
      return <Activity size={16} className="text-amber-500" />;
    case 'Medical Emergency':
      return <HeartHandshake size={16} className="text-rose-500" />;
    case 'Crime/Violence':
      return <ShieldAlert size={16} className="text-purple-500" />;
    case 'Building Collapse':
      return <Building size={16} className="text-stone-600" />;
    case 'Accident':
      return <Truck size={16} className="text-red-500" />;
    default:
      return <AlertTriangle size={16} className="text-red-500" />;
  }
};

export const SOSFlowModal: React.FC<SOSFlowModalProps> = ({
  isOpen,
  onClose,
  initialAudioStream,
  onSOSSuccess,
}) => {
  const { user } = useAuth();
  const { location } = useLocation();
  const { networkMode, dispatchNativeSMS, setIsMeshModalOpen } = useNetwork();

  // Phase states: recording -> cancelling (3s) -> broadcasting -> success
  const [phase, setPhase] = useState<SOSFlowPhase>('recording');
  
  // Recording telemetry
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  
  // 3-Second Cancel Countdown
  const [cancelTimeRemaining, setCancelTimeRemaining] = useState<number>(3.0);
  
  // Broadcasting progress steps
  const [broadcastStep, setBroadcastStep] = useState<number>(1);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  
  // Final SOS Submission Result
  const [submissionResult, setSubmissionResult] = useState<SOSSubmissionResult | null>(null);

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const cancelCountdownTimerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // 1. Start Audio Recording & Speech Recognition
  const startRecordingFlow = useCallback(async () => {
    setPhase('recording');
    setRecordingSeconds(0);
    setTranscript('');
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      let stream = initialAudioStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
      }
      streamRef.current = stream;
      setIsMicActive(true);

      // Setup MediaRecorder
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const supportedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      recorder.start(250); // collect 250ms chunks

      // Start Browser Speech Recognition in parallel if available
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Optimized for Indian English & bilingual accents

          recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            if (currentTranscript.trim()) {
              setTranscript(currentTranscript.trim());
            }
          };

          recognition.onerror = (e: any) => {
            console.warn("Speech recognition warning:", e);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        }
      } catch (speechErr) {
        console.warn("Browser SpeechRecognition not supported, falling back to server transcription:", speechErr);
      }

      // Start Recording Timer (up to 10 seconds max)
      const startTime = Date.now();
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Math.min(10, Math.floor((Date.now() - startTime) / 1000));
        setRecordingSeconds(elapsed);
        if (elapsed >= 10) {
          stopRecordingFlow();
        }
      }, 200);

    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setIsMicActive(false);
      // Even without mic, proceed to cancel/broadcast phase gracefully
      stopRecordingFlow();
    }
  }, [initialAudioStream]);

  // 2. Stop Recording and enter 3-second Cancel countdown
  const stopRecordingFlow = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Switch to 3-second Cancel Countdown Phase
    setPhase('cancelling');
    setCancelTimeRemaining(3.0);
  }, []);

  // 3. Handle Cancel (Abort broadcast completely, no data saved)
  const handleCancelBroadcast = () => {
    if (cancelCountdownTimerRef.current) {
      clearInterval(cancelCountdownTimerRef.current);
      cancelCountdownTimerRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    onClose();
  };

  // 4. Countdown Timer for 3-Second Cancel Window
  useEffect(() => {
    if (phase === 'cancelling') {
      const countdownStart = Date.now();
      const totalDuration = 3000; // 3 seconds

      cancelCountdownTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - countdownStart;
        const remaining = Math.max(0, (totalDuration - elapsed) / 1000);
        setCancelTimeRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(cancelCountdownTimerRef.current);
          cancelCountdownTimerRef.current = null;
          // Proceed automatically to Broadcast phase
          executeBroadcast();
        }
      }, 50);

      return () => {
        if (cancelCountdownTimerRef.current) {
          clearInterval(cancelCountdownTimerRef.current);
        }
      };
    }
  }, [phase]);

  // 5. Execute SOS Broadcast to Backend & Firestore
  const executeBroadcast = async () => {
    // Check if in BLE Mesh Demo mode
    if (networkMode === 'mesh') {
      onClose();
      setIsMeshModalOpen(true);
      return;
    }

    // Check if in SMS Dispatch mode or offline
    if (networkMode === 'sms' || !navigator.onLine) {
      onClose();
      dispatchNativeSMS({
        category: 'Emergency SOS Broadcast',
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.formattedAddress,
        transcript: transcript || 'Emergency voice distress beacon broadcast.',
      });
      return;
    }

    // Tier 1: Online Cloud Broadcast
    setPhase('broadcasting');
    setBroadcastStep(1);
    setBroadcastError(null);

    try {
      const userId = user?.uid || 'trahi_anonymous_victim';
      const userAddress = location?.formattedAddress || 'Emergency GPS Telemetry';
      const fallbackCoords = {
        latitude: location?.latitude || 20.5937,
        longitude: location?.longitude || 78.9629,
      };

      setBroadcastStep(2); // Audio upload & AI analysis

      const result = await submitCompleteSOSReport({
        userId,
        audioBlob,
        rawTranscript: transcript,
        userAddress,
        fallbackCoords,
      });

      setBroadcastStep(3); // Logged in Firestore
      setSubmissionResult(result);
      
      triggerHapticFeedback();
      if (onSOSSuccess) {
        onSOSSuccess(result);
      }

      setTimeout(() => {
        setPhase('success');
      }, 600);

    } catch (err: any) {
      console.error("SOS submission error:", err);
      setBroadcastError(err?.message || "Failed to broadcast SOS to cloud. Launching offline SMS channel...");
      // Auto-fallback to SMS dispatch if cloud fails
      setTimeout(() => {
        onClose();
        dispatchNativeSMS({
          category: 'Emergency SOS Broadcast',
          latitude: location?.latitude,
          longitude: location?.longitude,
          address: location?.formattedAddress,
          transcript: transcript || 'Emergency distress signal.',
        });
      }, 1200);
    }
  };

  // Audio Playback Toggle
  const toggleAudioPlayback = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Trigger recording when modal opens
  useEffect(() => {
    if (isOpen) {
      startRecordingFlow();
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (cancelCountdownTimerRef.current) clearInterval(cancelCountdownTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioElementRef.current) audioElementRef.current.pause();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="sos-flow-backdrop"
        className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          id="sos-flow-modal-box"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-red-100 overflow-hidden my-auto text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ========================================================================= */}
          {/* PHASE 1: AUDIO RECORDING (Max 10s with visual pulse & live waveform) */}
          {/* ========================================================================= */}
          {phase === 'recording' && (
            <div className="p-6 sm:p-8 space-y-6 flex flex-col items-center">
              {/* Header Status */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100/80 text-[#F0294D] text-xs font-black uppercase tracking-wider animate-pulse">
                <Radio size={14} className="animate-spin" />
                <span>Recording Emergency Voice Beacon</span>
              </div>

              {/* Central Pulsating Microphone Graphic */}
              <div className="relative my-4 flex items-center justify-center">
                {/* Outermost glowing animated waves */}
                <div className="absolute w-36 h-36 rounded-full bg-red-500/20 animate-ping-slow pointer-events-none" />
                <div className="absolute w-28 h-28 rounded-full bg-red-500/30 animate-pulse pointer-events-none" />

                <div className="relative z-10 w-20 h-20 rounded-full bg-[#F0294D] shadow-[0_10px_30px_rgba(240,41,77,0.5)] flex items-center justify-center text-white">
                  <Mic size={32} className="animate-bounce" />
                </div>
              </div>

              {/* Live Recording Timer */}
              <div className="space-y-1">
                <div className="text-3xl font-black text-gray-900 font-mono">
                  00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                  <span className="text-xs font-bold text-gray-400 font-sans ml-1">/ 00:10 max</span>
                </div>
                <p className="text-xs text-gray-500">
                  Speak clearly (describe the emergency, location, or required aid)
                </p>
              </div>

              {/* Animated Waveform Equalizer Bars */}
              <div className="flex items-center justify-center gap-1.5 h-8">
                {[40, 75, 100, 60, 90, 45, 80, 55, 95, 70, 50, 85].map((height, idx) => (
                  <motion.div
                    key={idx}
                    animate={{
                      height: [`${height * 0.3}%`, `${height}%`, `${height * 0.2}%`],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: idx * 0.08,
                      ease: 'easeInOut',
                    }}
                    className="w-1.5 bg-[#F0294D] rounded-full"
                  />
                ))}
              </div>

              {/* Live Transcript Preview */}
              <div className="w-full p-3.5 bg-red-50/60 rounded-2xl border border-red-100 text-left min-h-[58px]">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                  <Volume2 size={11} /> Live Speech Transcript:
                </span>
                <p className="text-xs font-medium text-gray-800 italic line-clamp-2">
                  {transcript ? `"${transcript}"` : "Listening to speech... (or speak now)"}
                </p>
              </div>

              {/* Manual Stop Button */}
              <button
                onClick={stopRecordingFlow}
                className="w-full py-3.5 bg-[#F0294D] hover:bg-[#d91e40] text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Square size={16} className="fill-white" />
                <span>Stop Recording & Review</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PHASE 2: 3-SECOND CANCEL OVERLAY (Prominent Cancel Button & Countdown)   */}
          {/* ========================================================================= */}
          {phase === 'cancelling' && (
            <div className="p-6 sm:p-8 space-y-5 flex flex-col items-center">
              {/* Alert Header */}
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={24} className="animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900">
                  Broadcasting SOS in {cancelTimeRemaining.toFixed(1)}s
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Emergency signal will be sent to the Trahi network & first responders. Tap Cancel to abort.
                </p>
              </div>

              {/* Progress Countdown Bar */}
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(cancelTimeRemaining / 3.0) * 100}%` }}
                />
              </div>

              {/* Audio & Transcript Preview Box */}
              <div className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Voice Distress Message
                  </span>
                  {audioUrl && (
                    <button
                      onClick={toggleAudioPlayback}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isPlayingAudio ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPlayingAudio ? 'Pause' : 'Play Audio'}</span>
                    </button>
                  )}
                </div>

                <p className="text-xs font-semibold text-gray-800 italic bg-white p-2.5 rounded-xl border border-gray-100">
                  "{transcript || 'Emergency voice distress signal (Transcribing with Gemini AI)'}"
                </p>
              </div>

              {/* Large Cancel Button */}
              <button
                id="cancel-sos-broadcast-btn"
                onClick={handleCancelBroadcast}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black text-base rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <X size={20} />
                <span>Cancel SOS Broadcast</span>
              </button>

              <button
                onClick={() => {
                  if (cancelCountdownTimerRef.current) clearInterval(cancelCountdownTimerRef.current);
                  executeBroadcast();
                }}
                className="text-xs font-bold text-[#0F9D8F] hover:underline cursor-pointer"
              >
                Send Immediately (Skip 3s timer) →
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PHASE 3: BROADCASTING TELEMETRY (GPS + Cloudinary + Gemini AI + Firestore) */}
          {/* ========================================================================= */}
          {phase === 'broadcasting' && (
            <div className="p-8 sm:p-10 space-y-6 flex flex-col items-center">
              <div className="relative w-16 h-16 rounded-full bg-teal-50 text-[#0F9D8F] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-900">
                  Broadcasting Emergency SOS
                </h3>
                <p className="text-xs text-gray-500">
                  Connecting to Trahi Emergency Grid & Responders...
                </p>
              </div>

              {/* Progressive Steps */}
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span className="font-bold text-gray-800">Acquiring high-accuracy GPS telemetry</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    broadcastStep >= 2 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {broadcastStep >= 2 ? <CheckCircle2 size={13} /> : <Loader2 size={12} className="animate-spin" />}
                  </div>
                  <span className="font-bold text-gray-800">Uploading audio to Cloudinary & Gemini AI</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    broadcastStep >= 3 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {broadcastStep >= 3 ? <CheckCircle2 size={13} /> : <Loader2 size={12} className="animate-spin" />}
                  </div>
                  <span className="font-bold text-gray-800">Classifying category & registering distress beacon</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PHASE 4: SUCCESS SCREEN ("Your SOS has been broadcast. Help is on the way.") */}
          {/* ========================================================================= */}
          {phase === 'success' && (
            <div className="p-6 sm:p-8 space-y-5 flex flex-col items-center text-left">
              {/* Success Badge */}
              <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-white" />
                  <span className="text-xs font-black uppercase tracking-wider">Distress Beacon Active</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Your SOS has been broadcast. Help is on the way.
                </h3>
              </div>

              {/* Classified Category & Incident Card */}
              <div className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                {/* Category Pill */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Emergency Category</span>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-gray-900 text-xs font-extrabold shadow-2xs border border-gray-200">
                    {getCategoryIcon(submissionResult?.category)}
                    <span>{submissionResult?.category || 'General Emergency'}</span>
                  </div>
                </div>

                {/* Distress Transcript */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Distress Transcript</span>
                  <p className="text-xs font-semibold text-gray-900 bg-white p-2.5 rounded-xl border border-gray-100 italic">
                    "{submissionResult?.transcript || transcript || 'Emergency voice beacon broadcast.'}"
                  </p>
                </div>

                {/* GPS Coordinates & Address */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Navigation2 size={12} className="text-[#0F9D8F]" /> Coordinates:
                    </span>
                    <span className="font-mono font-bold text-gray-900">
                      {submissionResult?.latitude.toFixed(4)}°N, {submissionResult?.longitude.toFixed(4)}°E
                    </span>
                  </div>

                  <div className="flex items-start justify-between text-gray-600 pt-1">
                    <span className="font-medium shrink-0">📍 Location:</span>
                    <span className="font-bold text-gray-900 text-right line-clamp-2">
                      {submissionResult?.userAddress || location?.formattedAddress || 'GPS Registered Location'}
                    </span>
                  </div>
                </div>

                {/* Audio Playback if voice was recorded */}
                {audioUrl && (
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">Voice Recording:</span>
                    <button
                      onClick={toggleAudioPlayback}
                      className="px-3 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isPlayingAudio ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPlayingAudio ? 'Pause Voice' : 'Listen Recording'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Helpline Quick Dialer & Offline SMS Backup */}
              <div className="w-full space-y-2">
                <div className="p-3 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-red-900 block">National Emergency Number</span>
                    <span className="text-[11px] text-red-700">Dial 112 for direct police/ambulance/fire</span>
                  </div>
                  <a
                    href="tel:112"
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <PhoneCall size={13} />
                    <span>Call 112</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    dispatchNativeSMS({
                      category: submissionResult?.category || 'Emergency SOS',
                      latitude: submissionResult?.latitude || location?.latitude,
                      longitude: submissionResult?.longitude || location?.longitude,
                      address: submissionResult?.userAddress || location?.formattedAddress,
                      transcript: submissionResult?.transcript || transcript || 'Emergency distress beacon',
                    });
                  }}
                  className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Dispatch 1-Tap SMS Backup to 112 →</span>
                </button>
              </div>

              {/* Close / Return Button */}
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Return to Emergency Dashboard</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
