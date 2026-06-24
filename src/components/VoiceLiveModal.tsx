// VoiceLiveModal.tsx — JARVIS Live Voice Assistant Overlay
import React, { useEffect, useRef, useMemo } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Brain, Volume2, Wifi } from 'lucide-react';
import micAnimation from '../lottie_animations/mic animation with circle.json';
import type { VoicePhase } from '../hooks/useVoiceLiveChat';

interface VoiceLiveModalProps {
  isOpen: boolean;
  phase: VoicePhase;
  transcript: string;
  assistantResponse?: string;
  statusText: string;
  audioLevel: number; // 0–1
  onClose: () => void;
}

// ── Phase config ────────────────────────────────────────────────────────────────
const PHASE_CONFIG: Record<VoicePhase, { label: string; sublabel: string; color: string; glow: string }> = {
  idle:         { label: 'OFFLINE',      sublabel: 'SYSTEM STANDBY',              color: '#64748B', glow: 'rgba(100,116,139,0.2)' },
  connecting:   { label: 'CONNECTING',   sublabel: 'INITIALIZING NEURAL LINK',    color: '#F59E0B', glow: 'rgba(245,158,11,0.25)' },
  listening:    { label: 'LISTENING',    sublabel: 'AWAITING VOICE INPUT',         color: '#00D4FF', glow: 'rgba(0,212,255,0.3)'  },
  vad_speaking: { label: 'DETECTED',     sublabel: 'VOICE SIGNAL ACTIVE',          color: '#22C55E', glow: 'rgba(34,197,94,0.3)'  },
  processing:   { label: 'PROCESSING',   sublabel: 'NEMOTRON NEURAL ENGINE ACTIVE',color: '#A78BFA', glow: 'rgba(167,139,250,0.3)' },
  speaking:     { label: 'RESPONDING',   sublabel: 'AUDIO SYNTHESIS ACTIVE',       color: '#F59E0B', glow: 'rgba(245,158,11,0.3)' },
  error:        { label: 'ERROR',        sublabel: 'SIGNAL LOST — RETRY',          color: '#EF4444', glow: 'rgba(239,68,68,0.3)'  },
};

// ── Waveform bars ───────────────────────────────────────────────────────────────
const WaveformBars: React.FC<{ audioLevel: number; phase: VoicePhase; color: string }> = ({
  audioLevel, phase, color,
}) => {
  const BAR_COUNT = 24;
  const isActive = phase === 'vad_speaking' || phase === 'listening' || phase === 'speaking';

  return (
    <div className="flex items-center justify-center gap-[3px]" style={{ height: '48px' }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const center = BAR_COUNT / 2;
        const distFromCenter = Math.abs(i - center) / center; // 0=center, 1=edge
        const baseHeight = isActive
          ? Math.max(4, (1 - distFromCenter * 0.7) * 32 * (audioLevel + 0.1) * (0.6 + Math.random() * 0.4))
          : 4;
        const delay = i * 0.04;

        return (
          <motion.div
            key={i}
            animate={{ height: `${Math.round(baseHeight)}px` }}
            transition={{ duration: 0.12, ease: 'easeOut', delay }}
            style={{
              width: '3px',
              borderRadius: '2px',
              background: isActive ? color : '#1E293B',
              opacity: isActive ? 0.6 + (1 - distFromCenter) * 0.4 : 0.3,
              boxShadow: isActive ? `0 0 6px ${color}60` : 'none',
            }}
          />
        );
      })}
    </div>
  );
};

// ── HUD Ring ────────────────────────────────────────────────────────────────────
const HUDRing: React.FC<{
  size: number; stroke: number; color: string;
  dashArray: string; duration: number; reverse?: boolean; opacity?: number;
}> = ({ size, stroke, color, dashArray, duration, reverse = false, opacity = 1 }) => {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <motion.svg
      width={size} height={size}
      style={{ position: 'absolute', top: '50%', left: '50%', x: '-50%', y: '-50%', opacity }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </motion.svg>
  );
};

// ── Corner Brackets ─────────────────────────────────────────────────────────────
const CornerBracket: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br'; color: string }> = ({ position, color }) => {
  const size = 28;
  const thickness = 2;
  const len = 20;
  const style: React.CSSProperties = {
    position: 'absolute',
    width: size, height: size,
    ...(position === 'tl' ? { top: 0, left: 0 } : {}),
    ...(position === 'tr' ? { top: 0, right: 0 } : {}),
    ...(position === 'bl' ? { bottom: 0, left: 0 } : {}),
    ...(position === 'br' ? { bottom: 0, right: 0 } : {}),
  };
  const h = position === 'tr' || position === 'br';
  const v = position === 'bl' || position === 'br';

  return (
    <div style={style}>
      <div style={{
        position: 'absolute',
        top: v ? 'auto' : 0, bottom: v ? 0 : 'auto',
        left: h ? 'auto' : 0, right: h ? 0 : 'auto',
        width: len, height: thickness, background: color,
        boxShadow: `0 0 6px ${color}`,
      }} />
      <div style={{
        position: 'absolute',
        top: v ? 'auto' : 0, bottom: v ? 0 : 'auto',
        left: h ? 'auto' : 0, right: h ? 0 : 'auto',
        width: thickness, height: len, background: color,
        boxShadow: `0 0 6px ${color}`,
      }} />
    </div>
  );
};

// ── Phase Icon ──────────────────────────────────────────────────────────────────
const PhaseIcon: React.FC<{ phase: VoicePhase; color: string }> = ({ phase, color }) => {
  const cls = 'w-5 h-5';
  if (phase === 'connecting')   return <Wifi className={cls} style={{ color }} />;
  if (phase === 'processing')   return <Brain className={cls} style={{ color }} />;
  if (phase === 'speaking')     return <Volume2 className={cls} style={{ color }} />;
  return <Mic className={cls} style={{ color }} />;
};

// ── Main Modal ──────────────────────────────────────────────────────────────────
export const VoiceLiveModal: React.FC<VoiceLiveModalProps> = ({
  isOpen, phase, transcript, assistantResponse, statusText, audioLevel, onClose,
}) => {
  const cfg = PHASE_CONFIG[phase];
  const isProcessing = phase === 'processing';
  const isSpeaking   = phase === 'speaking';
  const isListening  = phase === 'listening' || phase === 'vad_speaking';

  // Pulsing glow intensity
  const glowSize = useMemo(() => {
    if (phase === 'vad_speaking') return `0 0 ${60 + audioLevel * 80}px ${cfg.color}50`;
    if (phase === 'speaking')     return `0 0 50px ${cfg.color}40`;
    if (phase === 'listening')    return `0 0 35px ${cfg.color}30`;
    return `0 0 20px ${cfg.color}20`;
  }, [phase, audioLevel, cfg.color]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: 'rgba(2,8,20,0.97)', backdropFilter: 'blur(24px)' }}
        >
          {/* ── Ambient grid ─────────────────────────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(${cfg.color}08 1px, transparent 1px),
              linear-gradient(90deg, ${cfg.color}08 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          {/* ── Radial background glow ────────────────────────────────── */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', width: 600, height: 600,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 65%)`,
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />

          {/* ── Corner brackets ───────────────────────────────────────── */}
          <div style={{ position: 'absolute', inset: 24 }}>
            <CornerBracket position="tl" color={cfg.color} />
            <CornerBracket position="tr" color={cfg.color} />
            <CornerBracket position="bl" color={cfg.color} />
            <CornerBracket position="br" color={cfg.color} />
          </div>

          {/* ── Top status bar ────────────────────────────────────────── */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-8 left-0 right-0 flex items-center justify-between px-12"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color,
                  boxShadow: `0 0 8px ${cfg.color}` }}
              />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                letterSpacing: '0.2em', textTransform: 'uppercase', color: cfg.color,
              }}>
                NEMOTRON · VOICECHAT · LIVE
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#475569', letterSpacing: '0.1em' }}>
              NEURAL LINK ACTIVE
            </div>
          </motion.div>

          {/* ── Central HUD ───────────────────────────────────────────── */}
          <div style={{ position: 'relative', width: 320, height: 320 }}>

            {/* Outermost slow ring */}
            <HUDRing size={320} stroke={1} color={`${cfg.color}30`} dashArray="8 16" duration={18} opacity={0.6} />
            {/* Outer ring */}
            <HUDRing size={290} stroke={1.5} color={`${cfg.color}50`} dashArray="40 20 10 20" duration={12} reverse />
            {/* Mid ring */}
            <HUDRing size={256} stroke={2} color={cfg.color} dashArray="80 180" duration={8} />
            {/* Inner spinning ring */}
            <motion.svg
              width={224} height={224}
              style={{ position: 'absolute', top: '50%', left: '50%', x: '-50%', y: '-50%' }}
              animate={{ rotate: isProcessing ? [0, 360] : 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            >
              <circle cx={112} cy={112} r={108} fill="none" stroke={`${cfg.color}20`} strokeWidth={1} />
              {isProcessing && (
                <circle cx={112} cy={112} r={108} fill="none" stroke={cfg.color}
                  strokeWidth={3} strokeDasharray="60 620" strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${cfg.color})` }} />
              )}
            </motion.svg>

            {/* ── Glow orb background ─────────────────────────────────── */}
            <motion.div
              animate={{ scale: isListening ? [1, 1.1 + audioLevel * 0.3, 1] : [1, 1.04, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: isListening ? 0.3 + audioLevel * 0.3 : 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                x: '-50%', y: '-50%',
                width: 160, height: 160, borderRadius: '50%',
                background: `radial-gradient(circle, ${cfg.color}25 0%, transparent 70%)`,
                boxShadow: glowSize,
                filter: 'blur(8px)',
              }}
            />

            {/* ── Lottie animation ────────────────────────────────────── */}
            <motion.div
              animate={{ scale: isListening ? 1 + audioLevel * 0.12 : 1 }}
              transition={{ duration: 0.1 }}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                x: '-50%', y: '-50%',
                width: 140, height: 140,
                filter: `hue-rotate(${phase === 'listening' ? 0 : phase === 'vad_speaking' ? 90 : phase === 'processing' ? 200 : phase === 'speaking' ? 30 : 0}deg) drop-shadow(0 0 12px ${cfg.color}80)`,
              }}
            >
              <Lottie
                animationData={micAnimation}
                loop={true}
                style={{ width: '100%', height: '100%', transform: 'scale(1.4)' }}
              />
            </motion.div>

            {/* ── Phase data overlay (top of circle) ──────────────────── */}
            <div style={{
              position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
            }}>
              <PhaseIcon phase={phase} color={cfg.color} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.15em', color: cfg.color }}>
                {cfg.label}
              </span>
            </div>

            {/* ── Side data readouts ───────────────────────────────────── */}
            <div style={{ position: 'absolute', left: -80, top: '50%', transform: 'translateY(-50%)' }}>
              {['STT', 'RAG', 'LLM', 'TTS'].map((label, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
                    style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.color }}
                  />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#475569', letterSpacing: '0.1em' }}>
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>

            <div style={{ position: 'absolute', right: -80, top: '50%', transform: 'translateY(-50%)' }}>
              {['WHI', 'BGE', 'NEM', 'EDGE'].map((label, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexDirection: 'row-reverse' }}>
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.3 }}
                    style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.color }}
                  />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#475569', letterSpacing: '0.1em' }}>
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Sub-label ─────────────────────────────────────────────── */}
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 flex flex-col items-center gap-1"
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.25em', color: cfg.color }}>
              {cfg.sublabel}
            </span>
            {statusText && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#475569', letterSpacing: '0.12em' }}>
                {statusText.toUpperCase()}
              </span>
            )}
          </motion.div>

          {/* ── Waveform ──────────────────────────────────────────────── */}
          <div className="mt-6">
            <WaveformBars audioLevel={audioLevel} phase={phase} color={cfg.color} />
          </div>

          {/* ── Transcript display (Holographic glass UI) ─────────────── */}
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.div
                key={transcript}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="mt-10 max-w-2xl px-8 z-10 w-full"
              >
                <div style={{
                  position: 'relative',
                  padding: '20px 28px',
                  background: 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(2,8,20,0.8) 100%)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${cfg.color}30`,
                  borderRadius: '16px',
                  boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 0 20px ${cfg.color}10`,
                  overflow: 'hidden'
                }}>
                  {/* Glowing left accent line */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                    background: cfg.color,
                    boxShadow: `0 0 12px ${cfg.color}`
                  }} />
                  
                  {/* Subtle top reflection */}
                  <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
                    background: `linear-gradient(90deg, transparent, ${cfg.color}80, transparent)`
                  }} />

                  <div className="flex items-center gap-3 mb-3 opacity-80">
                    <PhaseIcon phase={phase} color={cfg.color} />
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: cfg.color, letterSpacing: '0.2em' }}>
                      LIVE DECODE STREAM
                    </p>
                  </div>
                  
                  <p style={{ 
                    fontSize: 16, 
                    color: '#E2E8F0', 
                    lineHeight: 1.7,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {transcript}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Assistant Response display ─────────────────────────────── */}
          <AnimatePresence mode="wait">
            {assistantResponse && (
              <motion.div
                key="assistant-response"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="mt-4 max-w-2xl px-8 z-10 w-full"
              >
                <div style={{
                  position: 'relative',
                  padding: '20px 28px',
                  background: 'linear-gradient(135deg, rgba(15,23,42,0.7) 0%, rgba(2,8,20,0.9) 100%)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid #A78BFA30`, /* Nemotron purple accent */
                  borderRadius: '16px',
                  boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 0 20px #A78BFA10`,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                    background: '#A78BFA',
                    boxShadow: `0 0 12px #A78BFA`
                  }} />
                  <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
                    background: `linear-gradient(90deg, transparent, #A78BFA80, transparent)`
                  }} />

                  <div className="flex items-center gap-3 mb-3 opacity-80">
                    <PhaseIcon phase="processing" color="#A78BFA" />
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#A78BFA', letterSpacing: '0.2em' }}>
                      NEMOTRON SYNTHESIS
                    </p>
                  </div>
                  
                  <p style={{ 
                    fontSize: 16, 
                    color: '#E2E8F0', 
                    lineHeight: 1.7,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {assistantResponse}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Info panel: auto-VAD notice ─────────────────────────────── */}
          {!transcript && phase === 'listening' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.5 }}
              style={{ marginTop: 24, fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                color: '#475569', letterSpacing: '0.15em' }}
            >
              SPEAK NATURALLY — SILENCE AUTO-DETECTS END OF SPEECH
            </motion.p>
          )}

          {/* ── End conversation button ─────────────────────────────────── */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={onClose}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              position: 'absolute', bottom: 40,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 40,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#EF4444', cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.15em',
              boxShadow: '0 0 20px rgba(239,68,68,0.15)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 35px rgba(239,68,68,0.35)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(239,68,68,0.15)')}
          >
            <X size={14} />
            END CONVERSATION
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
