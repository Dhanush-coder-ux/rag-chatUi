import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type RagMode = 'documents' | 'web' | 'hybrid';
export type ToolUsed = 'document' | 'web' | 'hybrid' | 'none';

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

export interface TaskResponse {
  task_id: string;
  status:  string;
  [key: string]: any;
}

// ── Stream event callbacks ─────────────────────────────────────────────────────

export interface StreamCallbacks {
  onChunk:    (chunk: string)          => void;   // answer token
  onStep?:    (step: string)           => void;   // pipeline step label
  onSources?: (sources: SourceItem[])  => void;   // enriched sources
  onToolUsed?:(tool: ToolUsed)         => void;   // "document" | "web" | "hybrid"
  onTraceId?: (traceId: string)        => void;   // trace id
  onMode?:    (mode: RagMode)          => void;   // mode echoed back
  onDone?:    ()                       => void;   // stream finished
  onError?:   (error: string)          => void;   // stream error
}

// ── Context interface ─────────────────────────────────────────────────────────

interface RagContextType {
  // State
  documents:   Document[];
  chatHistory: HistoryMessage[];
  isLoading:   boolean;
  error:       string | null;
  mode:        RagMode;

  // Setters
  setMode: (mode: RagMode) => void;
  clearHistory: () => void;

  // Document API
  fetchDocuments:  ()                                               => Promise<void>;
  uploadDocument:  (file: File)                                     => Promise<TaskResponse | null>;
  deleteDocument:  (id: number)                                     => Promise<void>;

  // RAG API
  askQuestion:       (question: string)                             => Promise<RagResponse | null>;
  askQuestionStream: (question: string, cbs: StreamCallbacks)       => Promise<void>;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const RagContext = createContext<RagContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────────

export const RagProvider = ({ children }: { children: ReactNode }) => {
  const [documents,   setDocuments]   = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<HistoryMessage[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [mode,        setMode]        = useState<RagMode>('hybrid');

  const clearHistory = useCallback(() => setChatHistory([]), []);

  // ── Documents ────────────────────────────────────────────────────────────

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

      const res = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body:   form,
      });
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

  // ── RAG: non-streaming ───────────────────────────────────────────────────

  const askQuestion = async (question: string): Promise<RagResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/rag/ask`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          question,
          history: chatHistory,
          mode,             // ← send selected mode
        }),
      });

      if (!res.ok) throw new Error('Failed to get answer');
      const data: RagResponse = await res.json();

      if (data.history) setChatHistory(data.history);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ── RAG: streaming ───────────────────────────────────────────────────────
  //
  // SSE event types emitted by the backend:
  //   event: trace     → trace id string
  //   event: mode      → mode string echoed back
  //   event: step      → JSON-encoded step label string
  //   event: sources   → JSON array of SourceItem
  //   event: tool_used → tool string
  //   data: <token>    → JSON-encoded answer token
  //   data: [DONE]     → stream finished

  const askQuestionStream = async (
    question: string,
    cbs: StreamCallbacks,
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    let fullAnswer = '';

    try {
      const res = await fetch(`${API_BASE_URL}/rag/stream`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          question,
          history: chatHistory,
          mode,             // ← send selected mode
        }),
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

        // SSE messages are separated by double newline
        const messages = buffer.split('\n\n');
        buffer = messages.pop() ?? '';   // keep incomplete last chunk

        for (const message of messages) {
          if (!message.trim()) continue;

          const eventMatch = message.match(/^event:\s*(.+)$/m);
          const dataMatch  = message.match(/^data:\s*(.+)$/m);

          const eventType = eventMatch?.[1]?.trim();
          const rawData   = dataMatch?.[1]?.trim();

          if (!rawData) continue;

          // ── Named events ──────────────────────────────────────────────
          if (eventType === 'trace') {
            cbs.onTraceId?.(rawData);
            continue;
          }

          if (eventType === 'mode') {
            cbs.onMode?.(rawData as RagMode);
            continue;
          }

          if (eventType === 'step') {
            try {
              const step: string = JSON.parse(rawData);
              cbs.onStep?.(step);
            } catch {
              cbs.onStep?.(rawData);
            }
            continue;
          }

          if (eventType === 'sources') {
            try {
              const sources: SourceItem[] = JSON.parse(rawData);
              cbs.onSources?.(sources);
            } catch {
              // malformed — ignore
            }
            continue;
          }

          if (eventType === 'tool_used') {
            cbs.onToolUsed?.(rawData as ToolUsed);
            continue;
          }

          // ── Default data events (answer tokens) ───────────────────────
          if (rawData === '[DONE]') {
            // Persist final turn to history
            setChatHistory(prev => [
              ...prev,
              { role: 'user',      content: question    },
              { role: 'assistant', content: fullAnswer  },
            ]);
            cbs.onDone?.();
            continue;
          }

          try {
            const token: string = JSON.parse(rawData);
            fullAnswer += token;
            cbs.onChunk(token);
          } catch {
            // non-JSON chunk — pass through raw
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

  // ── Context value ─────────────────────────────────────────────────────────

  return (
    <RagContext.Provider
      value={{
        documents,
        chatHistory,
        isLoading,
        error,
        mode,
        setMode,
        clearHistory,
        fetchDocuments,
        uploadDocument,
        deleteDocument,
        askQuestion,
        askQuestionStream,
      }}
    >
      {children}
    </RagContext.Provider>
  );
};

// ── Hook ────────────────────────────────────────────────────────────────────────

export const useRagContext = (): RagContextType => {
  const ctx = useContext(RagContext);
  if (!ctx) throw new Error('useRagContext must be used within a RagProvider');
  return ctx;
};