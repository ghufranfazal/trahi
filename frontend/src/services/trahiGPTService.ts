export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  category?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'trahigpt_sessions_v1';

// Initial default session if none exists
export function getInitialSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load TrahiGPT sessions from localStorage:', e);
  }

  // Fallback initial sample sessions
  const sampleSessions: ChatSession[] = [
    {
      id: 'session-cpr-guide',
      title: 'CPR & Cardiac Arrest Guide',
      createdAt: Date.now() - 3600000 * 2,
      updatedAt: Date.now() - 3600000 * 2,
      messages: [
        {
          id: 'msg-1',
          sender: 'user',
          text: 'How do I perform hands-only CPR on an unconscious adult?',
          timestamp: Date.now() - 3600000 * 2,
        },
        {
          id: 'msg-2',
          sender: 'assistant',
          text: `### 🩺 Emergency CPR & Cardiac Response Protocol

> 🚨 **CALL IMMEDIATELY**: Dial **112** or **108** for an emergency ambulance before starting CPR.

#### **Step-by-Step Hands-Only CPR:**
1. **Position the Victim**: Place the person flat on their back on a firm surface.
2. **Hand Placement**: Place the heel of one hand in the center of their chest. Lock second hand over the first with fingers interlaced.
3. **Chest Compressions**: Push hard and fast at a rate of **100 to 120 compressions per minute**.
4. **Depth**: Allow the chest to recoil completely between compressions (approx 2 inches or 5 cm deep).
5. **Continue**: Do not stop until professional paramedic assistance arrives or an AED is available.`,
          timestamp: Date.now() - 3600000 * 2 + 1000,
        },
      ],
    },
    {
      id: 'session-snakebite-triage',
      title: 'Snakebite Emergency Triage',
      createdAt: Date.now() - 86400000 * 1,
      updatedAt: Date.now() - 86400000 * 1,
      messages: [
        {
          id: 'msg-3',
          sender: 'user',
          text: 'What is the immediate first aid for a snake bite in India?',
          timestamp: Date.now() - 86400000 * 1,
        },
        {
          id: 'msg-4',
          sender: 'assistant',
          text: `### 🐍 Snakebite Emergency Triage (India Protocol)

> 🚨 **EMERGENCY WARNING**: Treat all snakebites in India as potentially venomous (Cobra, Viper, Krait). Call **108** immediately.

#### **Life-Saving Action Plan:**
1. **Stay Calm & Immobilize**: Keep victim still. Keep bitten limb **below heart level**.
2. **Remove Jewelry/Tight Items**: Remove rings, anklets, and shoes before swelling starts.
3. **Clean Lightly**: Wipe wound gently with clean water. Cover loosely with sterile cloth.

> ⚠️ **DO NOT**:
> - **DO NOT** cut wound or suck out venom.
> - **DO NOT** apply tight tourniquets or ice.`,
          timestamp: Date.now() - 86400000 * 1 + 1000,
        },
      ],
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleSessions));
  } catch (e) {
    // Ignore quota errors
  }

  return sampleSessions;
}

export function saveSessionsToStorage(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Failed to save TrahiGPT sessions to localStorage:', e);
  }
}

export async function sendTrahiGPTMessage(
  prompt: string,
  history: ChatMessage[] = []
): Promise<string> {
  const res = await fetch('/api/trahigpt/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, history }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Server returned status ${res.status}: ${res.statusText}`);
  }

  if (!data.reply) {
    throw new Error('No dynamic response returned from Gemini API.');
  }

  return data.reply;
}
