export interface TrahiGPTStep {
  stepNumber: number;
  title: string;
  description: string;
  icon?: string;
}

export interface TrahiGPTContact {
  name: string;
  number: string;
  category?: string;
}

export interface TrahiGPTStat {
  label: string;
  value: string;
  subtext?: string;
}

export interface TrahiGPTStructuredResponse {
  title?: string;
  summary?: string;
  urgency?: 'critical' | 'high' | 'moderate' | 'info';
  steps?: TrahiGPTStep[];
  contacts?: TrahiGPTContact[];
  stats?: TrahiGPTStat[];
  warnings?: string[];
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  category?: string;
  structuredData?: TrahiGPTStructuredResponse;
  errorType?: 'CONFIG_MISSING' | 'RATE_LIMIT' | 'GENERAL_ERROR';
  retryPrompt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface TrahiGPTResponseResult {
  text: string;
  structuredData?: TrahiGPTStructuredResponse;
  errorType?: 'CONFIG_MISSING' | 'RATE_LIMIT' | 'GENERAL_ERROR';
  retryPrompt?: string;
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

  // Sample initial sessions with structured visual data
  const sampleSessions: ChatSession[] = [
    {
      id: 'session-cpr-guide',
      title: 'CPR & Cardiac Response Guide',
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
          text: 'Emergency CPR & Cardiac Response Protocol',
          timestamp: Date.now() - 3600000 * 2 + 1000,
          structuredData: {
            title: 'Emergency CPR & Cardiac Response Protocol',
            summary: 'Immediate hands-only CPR keeps oxygen flowing to brain and vital organs until professional paramedics arrive.',
            urgency: 'critical',
            steps: [
              {
                stepNumber: 1,
                title: 'Position the Victim',
                description: 'Place the victim flat on their back on a firm, hard surface.',
                icon: 'user',
              },
              {
                stepNumber: 2,
                title: 'Hand Placement',
                description: 'Place the heel of one hand in the center of their chest. Lock second hand over the first with fingers interlaced.',
                icon: 'activity',
              },
              {
                stepNumber: 3,
                title: 'Chest Compressions',
                description: 'Push hard and fast at a rate of 100 to 120 compressions per minute.',
                icon: 'heart',
              },
              {
                stepNumber: 4,
                title: 'Compression Depth',
                description: 'Compress 2 inches (5 cm) deep and allow full chest recoil between compressions.',
                icon: 'check',
              },
            ],
            contacts: [
              { name: 'National Emergency', number: '112', category: 'All-in-One' },
              { name: 'Ambulance & Paramedic', number: '108', category: 'Medical' },
            ],
            stats: [
              { label: 'Compression Rate', value: '100-120 / min', subtext: "Rhythm of 'Stayin' Alive'" },
              { label: 'Compression Depth', value: '2 inches (5 cm)', subtext: 'Allow complete recoil' },
            ],
            warnings: [
              'Do not interrupt compressions for more than 10 seconds.',
              'Do not compress on soft mattresses or pillows.',
            ],
            notes: 'If an Automated External Defibrillator (AED) is available, turn it on immediately and follow its voice instructions.',
          },
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
): Promise<TrahiGPTResponseResult> {
  try {
    const res = await fetch('/api/trahigpt-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, history }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      const errorType = data?.errorType || (res.status === 429 ? 'RATE_LIMIT' : res.status === 503 ? 'CONFIG_MISSING' : 'GENERAL_ERROR');
      console.error(`TrahiGPT API Error [HTTP ${res.status}] [Type: ${errorType}]:`, data || res.statusText);

      if (errorType === 'CONFIG_MISSING') {
        return {
          text: 'TrahiGPT is currently unavailable — the AI service is not configured. Please contact support.',
          errorType: 'CONFIG_MISSING',
        };
      }

      if (errorType === 'RATE_LIMIT') {
        return {
          text: 'TrahiGPT is experiencing high demand right now. Please try again in a moment, or use the Emergency Contacts list below for immediate help.',
          errorType: 'RATE_LIMIT',
        };
      }

      return {
        text: 'Something went wrong reaching TrahiGPT. Please check your connection and try again.',
        errorType: 'GENERAL_ERROR',
        retryPrompt: prompt,
      };
    }

    // Process raw response text into structured data
    const rawReply = data.reply || '';
    let parsedData: TrahiGPTStructuredResponse | undefined = undefined;

    try {
      // Strip markdown json wrapper if present
      let cleanJson = rawReply.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanJson);
      if (typeof parsed === 'object' && parsed !== null) {
        parsedData = {
          title: parsed.title,
          summary: parsed.summary,
          urgency: parsed.urgency || 'info',
          steps: Array.isArray(parsed.steps) ? parsed.steps : [],
          contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
          stats: Array.isArray(parsed.stats) ? parsed.stats : [],
          warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
          notes: parsed.notes,
        };
      }
    } catch (e) {
      console.warn('Failed to parse Gemini JSON output, falling back to text presentation:', e);
      parsedData = {
        title: 'Emergency Guidance',
        summary: rawReply,
      };
    }

    return {
      text: rawReply,
      structuredData: parsedData,
    };
  } catch (err: any) {
    console.error('TrahiGPT fetch exception:', err);
    return {
      text: 'Something went wrong reaching TrahiGPT. Please check your connection and try again.',
      errorType: 'GENERAL_ERROR',
      retryPrompt: prompt,
    };
  }
}

