import { Message, Conversation } from '../types';

export const generateId = (): string =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

export const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const createConversation = (firstMessage?: string): Conversation => ({
  id: generateId(),
  title: firstMessage
    ? firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '')
    : 'New Conversation',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createUserMessage = (content: string): Message => ({
  id: generateId(),
  role: 'user',
  content,
  timestamp: new Date(),
});

export const createAssistantMessage = (): Message => ({
  id: generateId(),
  role: 'assistant',
  content: '',
  timestamp: new Date(),
  streamStatus: 'streaming',
  tools: [
    { id: generateId(), label: 'Searching documents', icon: 'search', status: 'running' },
  ],
});

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
