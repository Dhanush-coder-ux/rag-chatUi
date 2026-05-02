import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Message } from '../types';

// ── Enums / literals ──────────────────────────────────────────────────────────
export type RagMode = 'documents' | 'web' | 'hybrid';
export type ToolUsed = 'document' | 'web' | 'hybrid' | 'none';
export type LlmModel = 'auto' | 'gemini' | 'llama3'; // ✨ Added model type

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SourceItem {
  url: string | null;
  title: string | null;
  snippet: string | null;
  score: number | null;
  image: string | null;
  source_type: 'document' | 'web';
}

export interface RagResponse {
  answer: string;
  steps: string[];
  session_id: number;
  tool_used: ToolUsed;
  trace_id: string | null;
  error: string | null;
  sources: SourceItem[];
  history: HistoryMessage[];
  confidence: number | null;
}

export interface Document {
  id: number;
  filename: string;
  created_at: string;
  [key: string]: unknown;
}

export interface TaskResponse {
  task_id: string;
  status: string;
  [key: string]: unknown;
}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ApiMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  token_count: number | null;
  created_at: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onStep?: (step: string) => void;
  onSources?: (sources: SourceItem[]) => void;
  onToolUsed?: (tool: ToolUsed) => void;
  onTraceId?: (traceId: string) => void;
  onMode?: (mode: RagMode) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

interface RagContextType {
  documents: Document[];
  chatHistory: HistoryMessage[];
  messages: Message[];
  isLoading: boolean;
  sessionLoading: boolean;
  error: string | null;
  mode: RagMode;
  model: LlmModel; // ✨ Exposed model
  sessionId: number | null;
  sessions: ChatSession[];

  setMode: (mode: RagMode) => void;
  setModel: (model: LlmModel) => void; // ✨ Exposed setModel
  clearHistory: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;

  fetchSessions: () => Promise<void>;
  createSession: () => Promise<number | null>;
  deleteSession: (id: number) => Promise<void>;
  switchSession: (id: number) => Promise<void>;

  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<TaskResponse | null>;
  deleteDocument: (id: number) => Promise<void>;

  askQuestion: (question: string) => Promise<RagResponse | null>;
  askQuestionStream: (question: string, cbs: StreamCallbacks) => Promise<void>;
}

const API_BASE = 'https://rag-app-v1ew.onrender.com';
// const API_BASE = 'http://localhost:8000';

const RagContext = createContext<RagContextType | undefined>(undefined);

function apiMsgToUiMsg(m: ApiMessage): Message {
  let content = m.content || '';
  let sources: SourceItem[] = [];

  if (m.role === 'assistant' && content.includes('event:')) {
    const sourcesMatch = content.match(/event:\s*sources\s*\n?data:\s*(\[[\s\S]*?\])(?=\s*event:|$)/);
    if (sourcesMatch && sourcesMatch[1]) {
      try {
        sources = JSON.parse(sourcesMatch[1]);
      } catch (e) {
        console.warn('Failed to parse sources:', e);
      }
    }

    content = content
      .replace(/event:\s*trace\s*\n?data:\s*[a-f0-9\-]+(?=\s*event:|$)/g, '')
      .replace(/event:\s*mode\s*\n?data:\s*[a-z]+(?=\s*event:|$)/gi, '')
      .replace(/event:\s*tool_used\s*\n?data:\s*[a-z]+(?=\s*event:|$)/gi, '')
      .replace(/event:\s*step\s*\n?data:\s*[^\n]+(?=\s*event:|$)/g, '')
      .replace(/event:\s*sources\s*\n?data:\s*\[[\s\S]*?\](?=\s*event:|$)/g, '')
      .replace(/^event:\s*$/gm, '')
      .trim();
  }

  return {
    id: String(m.id),
    role: m.role,
    content: content,
    timestamp: new Date(m.created_at),
    streamStatus: 'done',
    sources: sources,
    confidence: undefined,
    tools: [],
    isError: false,
  };
}

export const RagProvider = ({ children }: { children: ReactNode }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<HistoryMessage[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<RagMode>('hybrid');
  const [model, setModel] = useState<LlmModel>('auto'); // ✨ Added model state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const apiFetch = useCallback(async (path: string, init?: RequestInit): Promise<Response> => {
    const res = await fetch(`${API_BASE}${path}`, init);
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res;
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiFetch('/chat/');
      setSessions(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [apiFetch]);

  const createSession = useCallback(async (): Promise<number | null> => {
    try {
      const res = await apiFetch('/chat/create', { method: 'POST' });
      const data: ChatSession = await res.json();

      setSessions(prev => {
        const exists = prev.some(s => s.id === data.id);
        if (exists) return prev;
        return [data, ...prev];
      });

      setSessionId(data.id);
      return data.id;

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [apiFetch]);

  const deleteSession = useCallback(async (id: number) => {
    try {
      await apiFetch(`/chat/${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== id));
      if (sessionId === id) {
        setSessionId(null);
        setChatHistory([]);
        setMessages([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [apiFetch, sessionId]);

  const switchSession = useCallback(async (id: number) => {
    setSessionId(id);
    setChatHistory([]);
    setMessages([]);
    setSessionLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`/chat/${id}/messages`);
      const data: ApiMessage[] = await res.json();

      const uiMessages = data.map(apiMsgToUiMsg);
      setMessages(uiMessages);

      setChatHistory(uiMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setMessages([]);
    } finally {
      setSessionLoading(false);
    }
  }, [apiFetch]);

  const clearHistory = useCallback(() => {
    setChatHistory([]);
    setMessages([]);
    setSessionId(null);
  }, []);

  const ensureSession = useCallback(async (): Promise<number | null> => {
    if (sessionId) return sessionId;
    return createSession();
  }, [sessionId, createSession]);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/documents/');
      setDocuments(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  const uploadDocument = useCallback(async (file: File): Promise<TaskResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiFetch('/documents/upload', { method: 'POST', body: form });
      const data: TaskResponse = await res.json();
      await fetchDocuments();
      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, fetchDocuments]);

  const deleteDocument = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch(`/documents/${id}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  const askQuestion = useCallback(async (question: string): Promise<RagResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const sid = await ensureSession();
      const res = await apiFetch('/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ✨ Included model in the payload
        body: JSON.stringify({ question, history: chatHistory, mode, model, session_id: sid }),
      });
      const data: RagResponse = await res.json();

      if (data.session_id && data.session_id !== sessionId) setSessionId(data.session_id);
      if (data.history?.length) setChatHistory(data.history);

      await fetchSessions();
      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, chatHistory, ensureSession, fetchSessions, mode, model, sessionId]);

  const askQuestionStream = useCallback(async (
    question: string,
    cbs: StreamCallbacks,
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    let fullAnswer = '';

    try {
      const sid = await ensureSession();
      const res = await apiFetch('/rag/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ✨ Included model in the payload
        body: JSON.stringify({ question, history: chatHistory, mode, model, session_id: sid }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split('\n\n');
        buffer = messages.pop() ?? '';

        for (const message of messages) {
          if (!message.trim()) continue;

          const eventMatch = message.match(/^event:\s*(.+)$/m);
          const dataMatch = message.match(/^data:\s*(.+)$/ms);
          const eventType = eventMatch?.[1]?.trim();
          const rawData = dataMatch?.[1]?.trim();

          if (!rawData) continue;

          if (eventType === 'trace') { cbs.onTraceId?.(rawData); continue; }
          if (eventType === 'mode') { cbs.onMode?.(rawData as RagMode); continue; }
          if (eventType === 'tool_used') { cbs.onToolUsed?.(rawData as ToolUsed); continue; }
          if (eventType === 'step') {
            try { cbs.onStep?.(JSON.parse(rawData) as string); } catch { cbs.onStep?.(rawData); }
            continue;
          }
          if (eventType === 'sources') {
            try { cbs.onSources?.(JSON.parse(rawData) as SourceItem[]); } catch { }
            continue;
          }
          if (rawData === '[DONE]') {
            setChatHistory(prev => [
              ...prev,
              { role: 'user', content: question },
              { role: 'assistant', content: fullAnswer },
            ]);
            await fetchSessions();
            cbs.onDone?.();
            continue;
          }

          let token: string;
          try {
            const parsed = JSON.parse(rawData);
            token = typeof parsed === 'string' ? parsed : (parsed as Record<string, string>).answer ?? rawData;
          } catch {
            token = rawData;
          }
          fullAnswer += token;
          cbs.onChunk(token);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      cbs.onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, chatHistory, ensureSession, fetchSessions, mode, model]);

  return (
    <RagContext.Provider value={{
      documents, chatHistory, messages, isLoading, sessionLoading, error,
      mode, model, sessionId, sessions,
      setMode, setModel, clearHistory, setMessages,
      fetchSessions, createSession, deleteSession, switchSession,
      fetchDocuments, uploadDocument, deleteDocument,
      askQuestion, askQuestionStream,
    }}>
      {children}
    </RagContext.Provider>
  );
};

export const useRagContext = (): RagContextType => {
  const ctx = useContext(RagContext);
  if (!ctx) throw new Error('useRagContext must be used within a RagProvider');
  return ctx;
};