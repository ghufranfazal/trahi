import { createSOSReport } from './firestoreService.ts';
import { EmergencyCategory, SOSReport } from '../types.ts';

export interface AudioRecordingState {
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  liveTranscript: string;
}

// Haptic & Sound Feedback
export function triggerHapticFeedback(): void {
  // 1. Hardware vibration if supported by device/browser
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([120, 60, 150]);
    } catch {
      // Ignore vibration errors
    }
  }

  // 2. Audio tone feedback using Web Audio API
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Ignore audio context errors
  }
}

// Convert Blob to Base64 String
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Get high-accuracy GPS coordinates with fallback
export function getPreciseLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      // Default fallback: India center
      resolve({ latitude: 20.5937, longitude: 78.9629 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.warn("Geolocation high accuracy error, falling back:", error.message);
        // Fallback default coordinates
        resolve({ latitude: 20.5937, longitude: 78.9629 });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  });
}

// Upload Audio to Cloudinary via backend API
export async function uploadAudioToCloudinary(audioBlob: Blob): Promise<{ url: string | null; provider?: string }> {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    const mimeType = audioBlob.type || 'audio/webm';

    const res = await fetch('/api/upload-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: base64Audio,
        mimeType,
      }),
    });

    if (!res.ok) {
      throw new Error(`Upload API error: ${res.status}`);
    }

    const data = await res.json();
    return {
      url: data.url || base64Audio,
      provider: data.provider || 'local',
    };
  } catch (error) {
    console.warn("Failed to upload audio to Cloudinary, using fallback base64 URL:", error);
    try {
      const fallbackBase64 = await blobToBase64(audioBlob);
      return { url: fallbackBase64, provider: 'fallback_data_uri' };
    } catch {
      return { url: null };
    }
  }
}

// Classify Emergency and Transcribe with Gemini API
export async function classifyEmergencyMessage(
  transcript: string,
  audioBlob?: Blob | null
): Promise<{ category: EmergencyCategory; transcript: string }> {
  try {
    let audioBase64: string | undefined;
    let mimeType = 'audio/webm';

    if (audioBlob) {
      try {
        audioBase64 = await blobToBase64(audioBlob);
        mimeType = audioBlob.type || 'audio/webm';
      } catch {
        // Continue with text transcript
      }
    }

    const res = await fetch('/api/classify-sos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript,
        audioBase64,
        mimeType,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        category: (data.category as EmergencyCategory) || 'Other',
        transcript: data.transcript || transcript || 'Emergency distress signal',
      };
    }
  } catch (error) {
    console.warn("Classification API call failed, falling back to heuristic classification:", error);
  }

  // Local fallback classification
  const lower = (transcript || '').toLowerCase();
  let fallbackCat: EmergencyCategory = 'Other';
  if (lower.includes('flood') || lower.includes('water') || lower.includes('submerge')) fallbackCat = 'Flood';
  else if (lower.includes('fire') || lower.includes('burn') || lower.includes('smoke')) fallbackCat = 'Fire';
  else if (lower.includes('quake') || lower.includes('earthquake') || lower.includes('tremor')) fallbackCat = 'Earthquake';
  else if (lower.includes('medical') || lower.includes('heart') || lower.includes('doctor') || lower.includes('hospital') || lower.includes('blood') || lower.includes('pain')) fallbackCat = 'Medical Emergency';
  else if (lower.includes('crime') || lower.includes('police') || lower.includes('attack') || lower.includes('thief') || lower.includes('violence')) fallbackCat = 'Crime/Violence';
  else if (lower.includes('collapse') || lower.includes('building') || lower.includes('debris') || lower.includes('rubble')) fallbackCat = 'Building Collapse';
  else if (lower.includes('accident') || lower.includes('crash') || lower.includes('vehicle')) fallbackCat = 'Accident';

  return {
    category: fallbackCat,
    transcript: transcript || 'Emergency voice beacon broadcast',
  };
}

// Complete SOS submission orchestrator
export interface SOSSubmissionResult {
  reportId: string;
  category: EmergencyCategory;
  transcript: string;
  voiceUrl: string | null;
  latitude: number;
  longitude: number;
  timestamp: number;
  userAddress: string;
}

export async function submitCompleteSOSReport(params: {
  userId: string;
  audioBlob: Blob | null;
  rawTranscript: string;
  userAddress?: string;
  fallbackCoords?: { latitude: number; longitude: number };
}): Promise<SOSSubmissionResult> {
  const { userId, audioBlob, rawTranscript, userAddress, fallbackCoords } = params;

  // 1. Get exact high-accuracy coordinates
  let coords = await getPreciseLocation();
  if ((coords.latitude === 0 || coords.latitude === 20.5937) && fallbackCoords?.latitude) {
    coords = fallbackCoords;
  }

  // 2. Upload audio to Cloudinary in background/parallel with classification
  let voiceUrl: string | null = null;
  if (audioBlob && audioBlob.size > 0) {
    try {
      const uploadRes = await uploadAudioToCloudinary(audioBlob);
      voiceUrl = uploadRes.url;
    } catch (err) {
      console.warn("Audio upload non-fatal failure:", err);
    }
  }

  // 3. Transcribe & Classify with Gemini API
  const { category, transcript } = await classifyEmergencyMessage(rawTranscript, audioBlob);

  const timestamp = Date.now();
  const address = userAddress || `Near coordinates ${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E`;

  // 4. Save to Firestore sos_reports collection
  const reportPayload: Omit<SOSReport, 'id'> = {
    userId,
    voiceUrl,
    transcript,
    category,
    latitude: coords.latitude,
    longitude: coords.longitude,
    timestamp,
    status: 'active',
    userAddress: address,
  };

  const reportId = await createSOSReport(reportPayload);

  return {
    reportId,
    category,
    transcript,
    voiceUrl,
    latitude: coords.latitude,
    longitude: coords.longitude,
    timestamp,
    userAddress: address,
  };
}
