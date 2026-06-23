import React from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceRecorderWSProps {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

export const VoiceRecorderWS: React.FC<VoiceRecorderWSProps> = ({
  isRecording,
  isProcessing,
  startRecording,
  stopRecording
}) => {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }}
      disabled={isProcessing}
      className={`relative p-2 rounded-full transition-all duration-200 flex items-center justify-center w-10 h-10 ${isRecording
          ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-500/30 animate-pulse'
          : isProcessing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
        }`}
      title={isRecording ? 'Stop Recording and Send' : 'Start Voice Chat'}
    >
      {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
    </button>
  );
};
