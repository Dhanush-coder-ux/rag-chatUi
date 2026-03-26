// types.ts
export interface Document {
  id: number;
  filename: string;
  content_type: string;
  // Add other fields from your DocumentOut schema
}

export interface HistoryMessage {
  role: string;
  content: string;
}

export interface RagResponse {
  answer: string;
  steps: any[];
  tool_used: string;
  trace_id?: string;
  error?: string;
  sources: any[];
  history: HistoryMessage[];
}

export interface TaskResponse {
  task_id: string;
}