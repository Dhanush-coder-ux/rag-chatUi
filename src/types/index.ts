import { SourceItem } from '../context/RagContext';

export type MessageRole = 'user' | 'assistant' | 'system';

export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

// Re-export for convenience
export type { SourceItem };

export interface ToolUse {
  id: string;
  label: string;
  icon: 'search' | 'web' | 'brain';
  status: 'running' | 'done';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sources?: SourceItem[];
  tools?: ToolUse[];
  streamStatus?: StreamStatus;
  isError?: boolean;
  confidence?: number;
  traceId?: string;
  modelUsed?: string;   // e.g. "gemini-2.5-flash" | "llama3"
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  uploadedAt: Date;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  uploadedFiles: UploadedFile[];
  streamStatus: StreamStatus;
  abortController: AbortController | null;
}
