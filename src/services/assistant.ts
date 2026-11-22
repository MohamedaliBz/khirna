import type { Role } from '../types';

/**
 * Client du backend « KHIRNA AI Assistant » (FastAPI, dossier assistant/khirna-ai-assistant).
 * Aucune clé n'est envoyée depuis le navigateur : Groq est appelé uniquement par le backend.
 */

export const ASSISTANT_URL = ((import.meta.env.VITE_ASSISTANT_URL as string | undefined) || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export type AssistantLang = 'fr' | 'ar' | 'tn';
export type AssistantRole = Role | 'visitor';

export interface AssistantSource {
  filename: string;
  section: string;
  content: string;
  score: number;
}

export interface ChatRequest {
  session_id: string;
  message: string;
  language: AssistantLang;
  user_role: AssistantRole;
}

/** Envoie un message et reçoit la réponse au fil de l'eau (SSE), avec repli sur /api/chat. */
export async function askAssistant(
  req: ChatRequest,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ sources: AssistantSource[] }> {
  const sources: AssistantSource[] = [];
  let res: Response;
  try {
    res = await fetch(`${ASSISTANT_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new AssistantOfflineError();
  }

  if (!res.ok || !res.body) {
    // Repli : réponse complète en une fois.
    const plain = await fetch(`${ASSISTANT_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    }).catch(() => {
      throw new AssistantOfflineError();
    });
    if (!plain.ok) throw new Error(`HTTP ${plain.status}`);
    const data = (await plain.json()) as { answer: string; sources?: AssistantSource[] };
    onDelta(data.answer);
    return { sources: data.sources ?? [] };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) >= 0) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let event = 'message';
      let data = '';
      for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      try {
        const parsed = JSON.parse(data);
        if (event === 'delta' && typeof parsed.text === 'string') onDelta(parsed.text);
        else if (event === 'source') sources.push(parsed as AssistantSource);
      } catch {
        /* événement mal formé : ignoré */
      }
    }
  }
  return { sources };
}

export async function clearAssistantSession(sessionId: string) {
  try {
    await fetch(`${ASSISTANT_URL}/api/conversations/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
  } catch {
    /* backend hors ligne : on efface quand même côté interface */
  }
}

export class AssistantOfflineError extends Error {
  constructor() {
    super('assistant-offline');
  }
}
