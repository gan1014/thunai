import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceInputProps {
  onAudioCaptured?: (blob: Blob) => void; // kept for backwards compatibility; live mode uses browser STT.
  onTranscriptionResult?: (text: string) => void;
  language?: string;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptionResult,
  language = 'en-IN',
  className = '',
}) => {
  const [seconds, setSeconds] = useState(0);
  const { isListening, interimTranscript, isSupported, error, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({
      language,
      continuous: true,
      interimResults: true,
      onResult: (text, isFinal) => {
        if (isFinal && text.trim()) onTranscriptionResult?.(text.trim());
      },
    });

  useEffect(() => {
    if (!isListening) { setSeconds(0); return; }
    const timer = window.setInterval(() => setSeconds((s) => Math.min(10, s + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [isListening]);

  const toggle = () => {
    if (isListening) stopListening();
    else { resetTranscript(); startListening(); }
  };

  return (
    <div id="voice-input-card" className={`bg-slate-900 border border-slate-700/60 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg ${className}`}>
      <div className="relative mb-4">
        {isListening && <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" style={{ animationDuration: '1.2s' }} />}
        <button
          type="button"
          onClick={toggle}
          aria-label={isListening ? 'Stop Voice Input' : 'Start Voice Input'}
          disabled={!isSupported}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${!isSupported ? 'bg-slate-700 cursor-not-allowed' : isListening ? 'bg-red-600 hover:bg-red-500 cursor-pointer' : 'bg-blue-600 hover:bg-blue-500 cursor-pointer'}`}
        >
          {isListening ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-9 h-9" />}
        </button>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
        <p className="text-sm font-semibold text-slate-200">{isListening ? `Listening... 00:${String(seconds).padStart(2, '0')}` : 'Click to Speak'}</p>
      </div>
      <p className="text-xs text-slate-400 max-w-xs mb-3">
        {isListening ? (interimTranscript || 'Speak your question...') : 'Free browser speech recognition. Ask THUNAI about the live camera scene.'}
      </p>
      {error && <div className="mt-2 text-xs text-red-400 bg-red-950/50 px-3 py-1.5 rounded-lg border border-red-800/50">{error}</div>}
      {!isSupported && <div className="mt-2 text-xs text-amber-400">Speech recognition is not available in this browser. Try Chrome/Edge.</div>}
    </div>
  );
};
