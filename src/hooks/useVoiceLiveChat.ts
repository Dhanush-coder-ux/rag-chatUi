/**
 * useVoiceLiveChat — Continuous live voice conversation hook.
 *
 * KEY FIX — WebM header across turns:
 *   We use a SINGLE continuous MediaRecorder for the whole session.
 *   The backend handles saving the initial EBML header and prepending it
 *   to subsequent utterances so Whisper always gets a valid WebM file.
 *
 * VAD (Voice Activity Detection):
 *   AnalyserNode RMS polling every 80ms.
 *   Speech threshold 0.012 RMS.
 *   1400ms silence after speech → send utterance_end to backend.
 */

import { useState, useRef, useCallback } from 'react';
import { AudioPlayer } from '../utils/AudioPlayer';

export type VoicePhase =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'vad_speaking'   // VAD: user is talking
  | 'processing'     // STT + RAG + LLM running on backend
  | 'speaking'       // AI TTS audio playing
  | 'error';

export interface LiveChatCallbacks {
  onTranscript: (text: string) => void;
  onResponseChunk: (chunk: string) => void;
  onTurnEnd: () => void;
  onSessionId: (id: number) => void;
  onPhase?: (phase: VoicePhase) => void;
}

export const useVoiceLiveChat = () => {
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [transcript, setTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [statusText, setStatusText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // ── Refs (stable across re-renders) ──────────────────────────────────────────
  const wsRef             = useRef<WebSocket | null>(null);
  const streamRef         = useRef<MediaStream | null>(null);
  const audioContextRef   = useRef<AudioContext | null>(null);
  const analyserRef       = useRef<AnalyserNode | null>(null);
  const audioPlayerRef    = useRef<AudioPlayer | null>(null);
  const isActiveRef       = useRef(false);
  const isAITurnRef       = useRef(false);       // true while backend is processing
  const isSpeakingRef     = useRef(false);       // VAD: user was speaking
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vadIntervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacksRef      = useRef<LiveChatCallbacks | null>(null);

  // Single continuous MediaRecorder
  const mrRef             = useRef<MediaRecorder | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const updatePhase = useCallback((p: VoicePhase) => {
    setPhase(p);
    callbacksRef.current?.onPhase?.(p);
  }, []);

  const getRMS = useCallback((): number => {
    if (!analyserRef.current) return 0;
    const buf = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buf);
    return Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
  }, []);

  // ── Start the continuous recorder once ───────────────────────────────────────
  const startRecorder = useCallback(() => {
    if (!streamRef.current || !wsRef.current) return;
    const ws = wsRef.current;

    const mr = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
    mrRef.current = mr;

    mr.ondataavailable = (e) => {
      // Stream chunks continuously
      if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(e.data);
      }
    };

    mr.start(100); // 100ms chunks
  }, []);

  // ── Send utterance boundary ──────────────────────────────────────────────────
  const commitUtterance = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!isActiveRef.current || isAITurnRef.current) return;

    // We do NOT stop the recorder. We just tell the backend the utterance ended.
    wsRef.current.send(JSON.stringify({ type: 'utterance_end' }));

    isAITurnRef.current = true;
    isSpeakingRef.current = false;
    setAssistantResponse(''); // Clear previous AI response on new utterance
    updatePhase('processing');
    setStatusText('Processing...');
  }, [updatePhase]);

  // ── VAD loop ──────────────────────────────────────────────────────────────────
  const startVAD = useCallback(() => {
    const SPEECH_THRESHOLD = 0.012;   // RMS level considered speech
    const SILENCE_MS       = 1400;    // ms of silence after speech → commit

    vadIntervalRef.current = setInterval(() => {
      if (!isActiveRef.current || isAITurnRef.current) return;

      const rms = getRMS();
      setAudioLevel(Math.min(rms / 0.08, 1));

      if (rms > SPEECH_THRESHOLD) {
        // ── User is speaking ────────────────────────────────────────────────
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          setAssistantResponse(''); // Clear AI response instantly on new user voice activity
          updatePhase('vad_speaking');
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else if (isSpeakingRef.current && !silenceTimerRef.current) {
        // ── Silence after speech — start countdown ──────────────────────────
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null;
          commitUtterance();
        }, SILENCE_MS);
      }
    }, 80);
  }, [getRMS, updatePhase, commitUtterance]);

  const stopVAD = useCallback(() => {
    if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null; }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    setAudioLevel(0);
  }, []);

  // ── Resume listening after a turn completes ───────────────────────────────────
  const resumeListening = useCallback(() => {
    isAITurnRef.current = false;
    isSpeakingRef.current = false;
    if (isActiveRef.current) {
      updatePhase('listening');
      setStatusText('Listening...');
      setTranscript('');
      // Recorder is already running continuously, no need to restart it
    }
  }, [updatePhase]);

  // ── Main: start live chat ─────────────────────────────────────────────────────
  const startLiveChat = useCallback(async (
    sessionId: number | null,
    mode: string,
    model: string,
    documentIds: number[],
    history: { role: string; content: string }[],
    callbacks: LiveChatCallbacks,
  ) => {
    if (isActiveRef.current) return;

    callbacksRef.current = callbacks;
    isActiveRef.current  = true;
    setIsActive(true);
    updatePhase('connecting');
    setStatusText('Connecting...');
    setTranscript('');
    setAssistantResponse('');

    try {
      // ── Microphone ──────────────────────────────────────────────────────────
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // ── Audio analysis (VAD) ────────────────────────────────────────────────
      const ctx     = new AudioContext();
      audioContextRef.current = ctx;
      const source  = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      // ── Audio player (TTS) ──────────────────────────────────────────────────
      audioPlayerRef.current = new AudioPlayer();

      // ── WebSocket ───────────────────────────────────────────────────────────
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          session_id:   sessionId,
          mode,
          model,
          document_ids: documentIds,
          history,
        }));
        // Recorder starts after we receive the "ready" message from server
      };

      ws.onmessage = async (event) => {
        // ── Binary: TTS audio chunk ─────────────────────────────────────────
        if (event.data instanceof Blob) {
          const ab = await event.data.arrayBuffer();
          audioPlayerRef.current?.playChunk(ab);
          updatePhase('speaking');
          return;
        }

        // ── JSON: control messages ──────────────────────────────────────────
        try {
          const msg = JSON.parse(event.data as string);

          switch (msg.type) {
            case 'ready':
              // Server ready — start VAD + start continuous recorder
              updatePhase('listening');
              setStatusText('Listening...');
              startVAD();
              startRecorder();
              break;

            case 'session_id':
              callbacks.onSessionId(msg.session_id);
              break;

            case 'status':
              setStatusText(msg.message ?? '');
              break;

            case 'transcript':
              setTranscript(msg.text ?? '');
              callbacks.onTranscript(msg.text ?? '');
              break;

            case 'response_chunk':
              updatePhase('speaking');
              setAssistantResponse(prev => prev + (msg.text ?? ''));
              callbacks.onResponseChunk(msg.text ?? '');
              break;

            case 'turn_end':
              callbacks.onTurnEnd();
              resumeListening();
              break;

            case 'error':
              setStatusText(msg.message ?? 'Error occurred');
              // Don't crash — resume listening so user can try again
              resumeListening();
              break;
          }
        } catch {
          // Ignore parse errors (binary handled above)
        }
      };

      ws.onerror = () => {
        updatePhase('error');
        setStatusText('Connection error');
      };

      ws.onclose = () => {
        if (isActiveRef.current) stopLiveChat();
      };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      updatePhase('error');
      setStatusText(msg);
      isActiveRef.current = false;
      setIsActive(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatePhase, startVAD, startRecorder, resumeListening]);

  // ── Stop everything cleanly ───────────────────────────────────────────────────
  const stopLiveChat = useCallback(() => {
    isActiveRef.current  = false;
    isAITurnRef.current  = false;
    isSpeakingRef.current = false;
    setIsActive(false);

    stopVAD();

    try { mrRef.current?.stop(); mrRef.current = null; } catch { /* ignore */ }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'abort' }));
      wsRef.current.close();
    }
    wsRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close().catch(() => {});
    audioPlayerRef.current?.stop();

    updatePhase('idle');
    setStatusText('');
    setTranscript('');
    setAssistantResponse('');
    setAudioLevel(0);
  }, [stopVAD, updatePhase]);

  return {
    phase,
    transcript,
    assistantResponse,
    statusText,
    audioLevel,
    isActive,
    startLiveChat,
    stopLiveChat,
  };
};
