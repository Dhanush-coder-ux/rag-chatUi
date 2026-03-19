import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { ChatState, Conversation, Message, UploadedFile, StreamStatus } from '../types';
import { generateId, createConversation } from '../utils';

type Action =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: string }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { conversationId: string; messageId: string; updates: Partial<Message> } }
  | { type: 'ADD_FILE'; payload: UploadedFile }
  | { type: 'UPDATE_FILE'; payload: { id: string; updates: Partial<UploadedFile> } }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_STREAM_STATUS'; payload: StreamStatus }
  | { type: 'SET_ABORT_CONTROLLER'; payload: AbortController | null };

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  uploadedFiles: [],
  streamStatus: 'idle',
  abortController: null,
};

function chatReducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };

    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        activeConversationId: action.payload.id,
      };

    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversationId: action.payload };

    case 'DELETE_CONVERSATION': {
      const filtered = state.conversations.filter(c => c.id !== action.payload);
      return {
        ...state,
        conversations: filtered,
        activeConversationId:
          state.activeConversationId === action.payload
            ? filtered[0]?.id ?? null
            : state.activeConversationId,
      };
    }

    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload.conversationId
            ? {
                ...c,
                messages: [...c.messages, action.payload.message],
                updatedAt: new Date(),
              }
            : c
        ),
      };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload.conversationId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === action.payload.messageId
                    ? { ...m, ...action.payload.updates }
                    : m
                ),
              }
            : c
        ),
      };

    case 'ADD_FILE':
      return { ...state, uploadedFiles: [...state.uploadedFiles, action.payload] };

    case 'UPDATE_FILE':
      return {
        ...state,
        uploadedFiles: state.uploadedFiles.map(f =>
          f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
        ),
      };

    case 'REMOVE_FILE':
      return {
        ...state,
        uploadedFiles: state.uploadedFiles.filter(f => f.id !== action.payload),
      };

    case 'SET_STREAM_STATUS':
      return { ...state, streamStatus: action.payload };

    case 'SET_ABORT_CONTROLLER':
      return { ...state, abortController: action.payload };

    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  activeConversation: Conversation | null;
  startNewConversation: () => string;
  sendMessage: (content: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  stopStreaming: () => void;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addFile: (file: UploadedFile) => void;
  updateFile: (id: string, updates: Partial<UploadedFile>) => void;
  removeFile: (id: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const activeConversation =
    state.conversations.find(c => c.id === state.activeConversationId) ?? null;

  const startNewConversation = useCallback((): string => {
    const conv = createConversation();
    dispatch({ type: 'ADD_CONVERSATION', payload: conv });
    return conv.id;
  }, []);

  const streamResponse = useCallback(
    async (
      conversationId: string,
      assistantMessageId: string,
      userQuery: string
    ) => {
      const controller = new AbortController();
      dispatch({ type: 'SET_ABORT_CONTROLLER', payload: controller });
      dispatch({ type: 'SET_STREAM_STATUS', payload: 'streaming' });

      // Simulate tool use steps
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          conversationId,
          messageId: assistantMessageId,
          updates: {
            tools: [
              { id: generateId(), label: 'Searching documents', icon: 'search', status: 'running' },
            ],
          },
        },
      });

      await new Promise(r => setTimeout(r, 600));

      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          conversationId,
          messageId: assistantMessageId,
          updates: {
            tools: [
              { id: generateId(), label: 'Searching documents', icon: 'search', status: 'done' },
              { id: generateId(), label: 'Searching web', icon: 'web', status: 'running' },
            ],
          },
        },
      });

      await new Promise(r => setTimeout(r, 500));

      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          conversationId,
          messageId: assistantMessageId,
          updates: {
            tools: [
              { id: generateId(), label: 'Searching documents', icon: 'search', status: 'done' },
              { id: generateId(), label: 'Searching web', icon: 'web', status: 'done' },
              { id: generateId(), label: 'Generating answer', icon: 'brain', status: 'running' },
            ],
          },
        },
      });

      try {
        const response = await fetch(`${API_BASE}/rag/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userQuery }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let sources: { filename: string; excerpt?: string }[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.token) {
                  fullContent += parsed.token;
                  dispatch({
                    type: 'UPDATE_MESSAGE',
                    payload: {
                      conversationId,
                      messageId: assistantMessageId,
                      updates: { content: fullContent },
                    },
                  });
                }
                if (parsed.sources) {
                  sources = parsed.sources;
                }
              } catch {
                // Raw token, not JSON
                fullContent += data;
                dispatch({
                  type: 'UPDATE_MESSAGE',
                  payload: {
                    conversationId,
                    messageId: assistantMessageId,
                    updates: { content: fullContent },
                  },
                });
              }
            }
          }
        }

        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            conversationId,
            messageId: assistantMessageId,
            updates: {
              streamStatus: 'done',
              sources,
              tools: [
                { id: generateId(), label: 'Searching documents', icon: 'search', status: 'done' },
                { id: generateId(), label: 'Searching web', icon: 'web', status: 'done' },
                { id: generateId(), label: 'Generating answer', icon: 'brain', status: 'done' },
              ],
            },
          },
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              conversationId,
              messageId: assistantMessageId,
              updates: { streamStatus: 'done', content: activeConversation?.messages.find(m => m.id === assistantMessageId)?.content ?? '' },
            },
          });
        } else {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              conversationId,
              messageId: assistantMessageId,
              updates: {
                streamStatus: 'error',
                isError: true,
                content: 'An error occurred while generating the response. Please try again.',
              },
            },
          });
        }
      } finally {
        dispatch({ type: 'SET_STREAM_STATUS', payload: 'idle' });
        dispatch({ type: 'SET_ABORT_CONTROLLER', payload: null });
      }
    },
    [activeConversation]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.streamStatus === 'streaming') return;

      let convId = state.activeConversationId;
      if (!convId) {
        const conv = createConversation(content);
        dispatch({ type: 'ADD_CONVERSATION', payload: conv });
        convId = conv.id;
      }

      const userMsg: import('../types').Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      dispatch({ type: 'ADD_MESSAGE', payload: { conversationId: convId, message: userMsg } });

      // Update title if first message
      const conv = state.conversations.find(c => c.id === convId);
      if (conv && conv.messages.length === 0) {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { conversationId: convId, messageId: userMsg.id, updates: {} },
        });
      }

      const assistantMsg: import('../types').Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streamStatus: 'streaming',
      };

      dispatch({ type: 'ADD_MESSAGE', payload: { conversationId: convId, message: assistantMsg } });

      await streamResponse(convId, assistantMsg.id, content);
    },
    [state.activeConversationId, state.streamStatus, state.conversations, streamResponse]
  );

  const regenerateLastResponse = useCallback(async () => {
    if (!activeConversation || state.streamStatus === 'streaming') return;

    const msgs = activeConversation.messages;
    const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove last assistant message
    const lastAssistantIdx = msgs.map(m => m.role).lastIndexOf('assistant');
    if (lastAssistantIdx >= 0) {
      const msgId = msgs[lastAssistantIdx].id;
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          conversationId: activeConversation.id,
          messageId: msgId,
          updates: { content: '', streamStatus: 'streaming', isError: false, sources: [], tools: [] },
        },
      });
      await streamResponse(activeConversation.id, msgId, lastUserMsg.content);
    }
  }, [activeConversation, state.streamStatus, streamResponse]);

  const stopStreaming = useCallback(() => {
    state.abortController?.abort();
  }, [state.abortController]);

  const deleteConversation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: id });
  }, []);

  const setActiveConversation = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: id });
  }, []);

  const addFile = useCallback((file: UploadedFile) => {
    dispatch({ type: 'ADD_FILE', payload: file });
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<UploadedFile>) => {
    dispatch({ type: 'UPDATE_FILE', payload: { id, updates } });
  }, []);

  const removeFile = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FILE', payload: id });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        state,
        activeConversation,
        startNewConversation,
        sendMessage,
        regenerateLastResponse,
        stopStreaming,
        deleteConversation,
        setActiveConversation,
        addFile,
        updateFile,
        removeFile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
