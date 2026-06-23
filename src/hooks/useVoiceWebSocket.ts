import { useState, useRef, useCallback } from 'react';
import { AudioPlayer } from '../utils/AudioPlayer';

export const useVoiceWebSocket = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // Lazily initialize AudioPlayer to avoid AudioContext issues before user gesture
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const isRecordingRef = useRef(false);

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
      // Ensure mediaDevices API is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatusText('Microphone not supported in this browser/context');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Lazily create / reset the AudioPlayer on each recording session
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stop();
      }
      audioPlayerRef.current = new AudioPlayer();

      // Show overlay immediately — don't wait for WS handshake
      setIsRecording(true);
      isRecordingRef.current = true;
      setStatusText('Connecting...');

      // Construct WS URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use window.location.host to work behind proxy or different ports
      const wsUrl = `${protocol}//${window.location.host}/api/ws/voice`;

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
        setStatusText('Recording...');
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Audio chunk from backend TTS
          const arrayBuffer = await event.data.arrayBuffer();
          audioPlayerRef.current?.playChunk(arrayBuffer);
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
        isRecordingRef.current = false;
      };

    } catch (err: any) {
      console.error('Failed to start recording:', err);
      // Provide a meaningful error message based on the actual error
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setStatusText('Microphone permission denied');
      } else if (err?.name === 'NotFoundError') {
        setStatusText('No microphone found');
      } else if (err?.name === 'NotReadableError') {
        setStatusText('Microphone is already in use');
      } else {
        setStatusText(`Error: ${err?.message || 'Could not start recording'}`);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    // Use ref to avoid stale closure on isRecording state
    if (mediaRecorderRef.current && isRecordingRef.current) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('Error stopping media recorder:', e);
      }
      setIsRecording(false);
      isRecordingRef.current = false;
      setIsProcessing(true);
      setStatusText('Processing audio...');

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send EOF signal
        wsRef.current.send("EOF");
      }
    }
  }, []);

  const abortVoice = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('Error stopping media recorder on abort:', e);
      }
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    setIsProcessing(false);
    setIsRecording(false);
    isRecordingRef.current = false;
    setStatusText('Cancelled');
  }, []);

  return {
    isRecording,
    isProcessing,
    statusText,
    startRecording,
    stopRecording,
    abortVoice
  };
};
