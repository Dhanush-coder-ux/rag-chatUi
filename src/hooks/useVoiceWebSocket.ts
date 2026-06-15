import { useState, useRef, useCallback } from 'react';
import { AudioPlayer } from '../utils/AudioPlayer';

export const useVoiceWebSocket = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer>(new AudioPlayer());

  const startRecording = useCallback(async (
    sessionId: number | null,
    mode: string,
    model: string,
    documentIds: number[],
    history: any[],
    onTranscription: (text: string) => void,
    onRagChunk: (chunk: string) => void,
    onSessionId: (id: number) => void
  ) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioPlayerRef.current.stop(); // reset player

      // Construct WS URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In Vite, proxy might not handle WS properly out of the box if not configured, 
      // but usually the backend is at port 8001. We'll use the API_URL logic from existing config if possible, 
      const wsUrl = `${protocol}//localhost:8000/ws/voice`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send config
        ws.send(JSON.stringify({
          session_id: sessionId,
          mode,
          model,
          document_ids: documentIds,
          history
        }));

        // Start recording
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data); // send Blob
          }
        };

        mediaRecorder.start(250); // Capture chunks every 250ms
        setIsRecording(true);
        setStatusText('Recording...');
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Audio chunk from backend TTS
          const arrayBuffer = await event.data.arrayBuffer();
          audioPlayerRef.current.playChunk(arrayBuffer);
        } else {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'status') {
              setStatusText(data.message);
            } else if (data.type === 'transcription') {
              onTranscription(data.text);
            } else if (data.type === 'session_id') {
              onSessionId(data.session_id);
            } else if (data.type === 'rag_chunk') {
              onRagChunk(data.chunk);
            } else if (data.type === 'end_of_audio') {
              setIsProcessing(false);
              setStatusText('');
              ws.close();
            } else if (data.type === 'error') {
              console.error('Backend WS Error:', data.message);
              setStatusText('Error: ' + data.message);
              setIsProcessing(false);
              ws.close();
            }
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setStatusText('Connection error');
        stopRecording();
      };

      ws.onclose = () => {
        setIsProcessing(false);
        setIsRecording(false);
      };

    } catch (err) {
      console.error('Failed to start recording', err);
      setStatusText('Microphone permission denied');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsProcessing(true);
      setStatusText('Processing audio...');

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send EOF signal
        wsRef.current.send("EOF");
      }
    }
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    statusText,
    startRecording,
    stopRecording
  };
};
