// context/RagContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

export type RagMode   = 'documents' | 'web' | 'hybrid';
export type ToolUsed  = 'document' | 'web' | 'hybrid' | 'none';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SourceItem {
  url:         string | null;
  title:       string | null;
  snippet:     string | null;
  score:       number | null;
  source_type: 'document' | 'web';
}

export interface RagResponse {
  answer:     string;
  steps:      string[];
  tool_used:  ToolUsed;
  trace_id:   string | null;
  error:      string | null;
  sources:    SourceItem[];
  history:    HistoryMessage[];
  confidence: number | null;
}

export interface Document {
  id:         number;
  filename:   string;
  created_at: string;
  [key: string]: any;
}

export interface ChatSession {
  id:         number;
  title:      string;
  created_at: string;
  updated_at: string;
}

export interface TaskResponse {
  task_id: string;
  status:  string;
  [key: string]: any;
}

export interface StreamCallbacks {
  onChunk:     (chunk: string)         => void;
  onStep?:     (step: string)          => void;
  onSources?:  (sources: SourceItem[]) => void;
  onToolUsed?: (tool: ToolUsed)        => void;
  onTraceId?:  (traceId: string)       => void;
  onMode?:     (mode: RagMode)         => void;
  onDone?:     ()                      => void;
  onError?:    (error: string)         => void;
}

interface RagContextType {
  documents:    Document[];
  chatHistory:  HistoryMessage[];
  isLoading:    boolean;
  error:        string | null;
  mode:         RagMode;
  sessionId:    number | null;
  sessions:     ChatSession[];

  setMode:      (mode: RagMode) => void;
  clearHistory: () => void;

  // Session API
  fetchSessions:   ()                    => Promise<void>;
  createSession:   ()                    => Promise<number | null>;
  deleteSession:   (id: number)          => Promise<void>;
  switchSession:   (id: number)          => void;

  // Document API
  fetchDocuments:  ()                                         => Promise<void>;
  uploadDocument:  (file: File)                               => Promise<TaskResponse | null>;
  deleteDocument:  (id: number)                               => Promise<void>;

  // RAG API
  askQuestion:        (question: string)                      => Promise<RagResponse | null>;
  askQuestionStream:  (question: string, cbs: StreamCallbacks) => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const RagContext   = createContext<RagContextType | undefined>(undefined);

export const RagProvider = ({ children }: { children: ReactNode }) => {
  const [documents,   setDocuments]   = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<HistoryMessage[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [mode,        setMode]        = useState<RagMode>('hybrid');
  const [sessionId,   setSessionId]   = useState<number | null>(null);
  const [sessions,    setSessions]    = useState<ChatSession[]>([]);

  // ── Session management ────────────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      setSessions(await res.json());
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const createSession = useCallback(async (): Promise<number | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/create`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create session');
      const data: ChatSession = await res.json();
      setSessions(prev => [data, ...prev]);
      setSessionId(data.id);
      return data.id;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const deleteSession = useCallback(async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete session');
      setSessions(prev => prev.filter(s => s.id !== id));
      // If deleting the active session, reset
      if (sessionId === id) {
        setSessionId(null);
        setChatHistory([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [sessionId]);

  const switchSession = useCallback((id: number) => {
    setSessionId(id);
    setChatHistory([]); // history reloaded on next ask
  }, []);

  const clearHistory = useCallback(() => {
    setChatHistory([]);
    setSessionId(null);
  }, []);

  // ── Ensure session before sending ─────────────────────────────────────────

  const ensureSession = useCallback(async (): Promise<number | null> => {
    if (sessionId) return sessionId;
    return await createSession();
  }, [sessionId, createSession]);

  // ── Documents ─────────────────────────────────────────────────────────────

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      setDocuments(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadDocument = async (file: File): Promise<TaskResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE_URL}/documents/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Failed to upload document');
      const data: TaskResponse = await res.json();
      await fetchDocuments();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── RAG: non-streaming ────────────────────────────────────────────────────

  const askQuestion = async (question: string): Promise<RagResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const sid = await ensureSession();
      const res = await fetch(`${API_BASE_URL}/rag/ask`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question, history: chatHistory, mode, session_id: sid }),
      });
      if (!res.ok) throw new Error('Failed to get answer');
      const data: RagResponse = await res.json();
      if (data.history) setChatHistory(data.history);
      // Refresh sessions so sidebar title updates
      await fetchSessions();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ── RAG: streaming ────────────────────────────────────────────────────────

  const askQuestionStream = async (question: string, cbs: StreamCallbacks): Promise<void> => {
    setIsLoading(true);
    setError(null);
    let fullAnswer = '';

    try {
      const sid = await ensureSession();
      const res = await fetch(`${API_BASE_URL}/rag/stream`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question, history: chatHistory, mode, session_id: sid }),
      });
      if (!res.ok)   throw new Error('Failed to stream answer');
      if (!res.body) throw new Error('No response body');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split('\n\n');
        buffer = messages.pop() ?? '';

        for (const message of messages) {
          if (!message.trim()) continue;
          const eventMatch = message.match(/^event:\s*(.+)$/m);
          const dataMatch  = message.match(/^data:\s*(.+)$/m);
          const eventType  = eventMatch?.[1]?.trim();
          const rawData    = dataMatch?.[1]?.trim();
          if (!rawData) continue;

          if (eventType === 'trace')     { cbs.onTraceId?.(rawData); continue; }
          if (eventType === 'mode')      { cbs.onMode?.(rawData as RagMode); continue; }
          if (eventType === 'tool_used') { cbs.onToolUsed?.(rawData as ToolUsed); continue; }
          if (eventType === 'step') {
            try { cbs.onStep?.(JSON.parse(rawData)); } catch { cbs.onStep?.(rawData); }
            continue;
          }
          if (eventType === 'sources') {
            try { cbs.onSources?.(JSON.parse(rawData)); } catch {}
            continue;
          }
          if (rawData === '[DONE]') {
            setChatHistory(prev => [
              ...prev,
              { role: 'user',      content: question   },
              { role: 'assistant', content: fullAnswer  },
            ]);
            // Refresh sessions so sidebar title updates after stream
            await fetchSessions();
            cbs.onDone?.();
            continue;
          }
          try {
            const token: string = JSON.parse(rawData);
            fullAnswer += token;
            cbs.onChunk(token);
          } catch {
            fullAnswer += rawData;
            cbs.onChunk(rawData);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
      cbs.onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RagContext.Provider value={{
      documents, chatHistory, isLoading, error, mode, sessionId, sessions,
      setMode, clearHistory,
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