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

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, or just the ID
 */
export const extractYoutubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) return match[1];
  }

  return null;
};

/**
 * Generate YouTube thumbnail URL from video ID
 * Quality: 'max' (1280x720), 'hq' (480x360), 'mq' (320x180), 'default' (120x90)
 */
export const getYoutubeThumbnailUrl = (videoId: string, quality: 'maxres' | 'hq' | 'sd' | 'mq' | 'default' = 'hq'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
};

/**
 * Check if filename is a YouTube video (heuristic)
 * Returns the video ID if it's a YouTube video, null otherwise
 */
export const getYoutubeVideoIdFromFilename = (filename: string): string | null => {
  // Check if filename contains 'youtube' or looks like a video ID
  if (filename.toLowerCase().includes('youtube')) {
    const videoId = extractYoutubeVideoId(filename);
    if (videoId) return videoId;
  }

  // Check if it's just a video ID pattern
  const videoId = extractYoutubeVideoId(filename);
  if (videoId && filename.length === 11) {
    return videoId;
  }

  return null;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
