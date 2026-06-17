import React from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square } from 'lucide-react';
import micAnimation from '../lottie_animations/mic animation with circle.json';

interface VoiceRecordingOverlayProps {
  isRecording: boolean;
  statusText: string;
  onStopRecording: () => void;
}

export const VoiceRecordingOverlay: React.FC<VoiceRecordingOverlayProps> = ({
  isRecording,
  statusText,
  onStopRecording
}) => {
  return (
    <AnimatePresence>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md bg-black/70"
        >
          {/* Lottie Animation Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative w-72 h-72 flex items-center justify-center pointer-events-none"
          >
            <Lottie 
              animationData={micAnimation} 
              loop={true} 
              className="absolute inset-0 w-full h-full scale-[1.5]"
            />
          </motion.div>

          {/* Status Text */}
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-3xl font-light tracking-wide text-white drop-shadow-md"
          >
            {statusText || "Listening..."}
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-sys-cyan/90 font-mono text-sm uppercase tracking-widest animate-pulse"
          >
            Speak your message
          </motion.p>

          {/* Stop / Send Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onStopRecording}
            className="mt-12 group relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] transition-all duration-300"
          >
             <Square className="w-8 h-8 text-red-500 fill-current group-hover:scale-95 transition-transform" />
             <span className="absolute -bottom-8 text-xs font-mono text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                STOP & SEND
             </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
