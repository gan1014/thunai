import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Mic, MicOff, Brain, Activity } from 'lucide-react';
import { VoiceProviderStatus, VoiceProvider } from '../types';
import { api } from '../api/client';

interface ConnectionStatusProps {
  activeProvider?: VoiceProvider;
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  activeProvider = 'gemini',
  isListening = false,
  isProcessing = false,
  isSpeaking = false,
  className = '',
}) => {
  const [status, setStatus] = useState<VoiceProviderStatus | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      api.getVoiceStatus().then(setStatus).catch(() => {});
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-3 text-xs ${className}`}>
      <StatusDot
        label="Gemini"
        available={status?.gemini.available ?? false}
        isActive={activeProvider === 'gemini'}
        icon={<Brain className="w-3 h-3" />}
      />
      <StatusDot
        label="Backup"
        available={status?.openrouter.available ?? false}
        isActive={activeProvider === 'openrouter'}
        icon={<Activity className="w-3 h-3" />}
      />
      <div className="w-px h-3 bg-slate-700" />
      <StatusDot
        label="Voice"
        available={isListening}
        isActive={isListening}
        icon={isListening ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
        pulse={isListening}
      />
      {isProcessing && (
        <span className="text-amber-400 font-semibold animate-pulse">Thinking...</span>
      )}
      {isSpeaking && (
        <span className="text-emerald-400 font-semibold">Speaking...</span>
      )}
    </div>
  );
};

const StatusDot: React.FC<{
  label: string;
  available: boolean;
  isActive: boolean;
  icon: React.ReactNode;
  pulse?: boolean;
}> = ({ label, available, isActive, icon, pulse }) => (
  <div className={`flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-slate-400'}`}>
    <span className={`relative flex h-2 w-2 ${pulse ? 'animate-pulse' : ''}`}>
      <span
        className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
          available
            ? isActive
              ? 'bg-emerald-400 animate-ping'
              : 'bg-emerald-400'
            : 'bg-slate-500'
        }`}
      />
      <span
        className={`relative inline-flex rounded-full h-2 w-2 ${
          available ? (isActive ? 'bg-emerald-400' : 'bg-emerald-500') : 'bg-slate-600'
        }`}
      />
    </span>
    {icon}
    <span className="font-medium">{label}</span>
  </div>
);
