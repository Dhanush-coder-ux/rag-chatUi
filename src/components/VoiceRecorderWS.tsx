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
      className={`p-2 rounded-full transition-all duration-200 ${
        isRecording
          ? 'bg-red-500 text-white animate-pulse'
          : isProcessing
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
      }`}
      title={isRecording ? 'Stop Recording' : 'Start Voice Chat'}
    >
      {isRecording ? <Square size={20} /> : <Mic size={20} />}
    </button>
  );
};
