/**
 * ============================================================================
 * DEMO-SAFE HARDCODED RESPONSE LAYER (Hackathon Reliability System)
 * ============================================================================
 * TrahiGPT currently operates with a 100% reliable local response lookup
 * layer for hackathon demo stability, bypassing live network/API dependencies.
 *
 * TO RE-ENABLE LIVE GEMINI API:
 * In `sendTrahiGPTMessage()`, comment out the `getHardcodedResponse()` block
 * and uncomment the live `/api/trahigpt/chat` fetch implementation marked below.
 * ============================================================================
 */

import {
  getHardcodedResponse,
  type TrahiGPTResponseResult,
  CPR_RESPONSE,
  SNAKEBITE_RESPONSE,
} from './trahiGPTHardcodedResponses.ts';

export interface TrahiGPTStructuredResponse {
  title?: string;
  urgency?: 'critical' | 'high' | 'moderate' | 'info';
  summary?: string;
  stats?: Array<{
    label: string;
    value: string;
    subtext?: string;
  }>;
  steps?: Array<{
    stepNumber?: number;
    icon?: string;
    title: string;
    description: string;
  }>;
  contacts?: Array<{
    name: string;
    number: string;
    category?: string;
  }>;
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

  // Fallback initial sample sessions with structured data
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
          text: CPR_RESPONSE.reply,
          structuredData: CPR_RESPONSE.structuredData,
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
          text: SNAKEBITE_RESPONSE.reply,
          structuredData: SNAKEBITE_RESPONSE.structuredData,
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
  _history: ChatMessage[] = []
): Promise<TrahiGPTResponseResult> {
  // Simulate realistic AI response/thinking delay (800ms - 1200ms) for demo experience
  const delayMs = Math.floor(Math.random() * 400) + 800;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  // --- HARDCODED DEMO-SAFE RESPONSE LAYER ---
  // Returns pre-formated structured first-aid protocol for demo reliability.
  return getHardcodedResponse(prompt);

  /*
  // ==========================================================================
  // LIVE GEMINI API INTEGRATION (UNCOMMENT TO RE-ENABLE LIVE API CALL)
  // ==========================================================================
  const res = await fetch('/api/trahigpt/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, history: _history }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Server returned status ${res.status}: ${res.statusText}`);
  }

  if (!data.reply) {
    throw new Error('No dynamic response returned from Gemini API.');
  }

  return {
    reply: data.reply,
    structuredData: data.structuredData,
  };
  */
}

