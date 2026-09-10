import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Trash2,
  Brain,
  Zap,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { useVoiceConversation } from '../hooks/useVoiceConversation';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { VoiceMessage } from '../types';

export const VoiceAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();

  const bcp47Map: Record<string, string> = {
    en: 'en-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    hi: 'hi-IN',
  };
  const currentBcp47 = bcp47Map[i18n.language] || 'en-IN';

  const quickCommands = [
    { label: t('voice.promptObstacle'), icon: '⚠️' },
    { label: t('voice.promptExit'), icon: '🚪' },
    { label: t('voice.promptPath'), icon: '🚶' },
    { label: t('voice.promptLeft'), icon: '⬅️' },
    { label: t('voice.promptRight'), icon: '➡️' },
    { label: t('vision.scanScene'), icon: '🔍' },
  ];

  const {
    state,
    messages,
    providerStatus,
    startListening,
    stopListening,
    sendText,
    clearMessages,
    isSupported,
  } = useVoiceConversation({
    autoSpeak: true,
    continuousListening: true,
    language: currentBcp47,
  });

  const [textInput, setTextInput] = useState('');
  const [showQuickCommands, setShowQuickCommands] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = async () => {
    if (!textInput.trim() || state.isProcessing) return;
    const text = textInput.trim();
    setTextInput('');
    await sendText(text);
  };

  const handleQuickCommand = async (command: string) => {
    setShowQuickCommands(false);
    await sendText(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div id="voice-assistant-page" className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{t('voice.title')}</h1>
            <p className="text-xs text-slate-400">
              {t('voice.subtitle')}
            </p>
          </div>
        </div>

        <ConnectionStatus
          activeProvider={state.activeProvider}
          isListening={state.isListening}
          isProcessing={state.isProcessing}
          isSpeaking={state.isSpeaking}
        />
      </div>

      {!isSupported && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl mb-4 text-amber-300 text-sm">
          {t('voice.noSpeech')}
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <Mic className="w-16 h-16 mb-4 text-slate-600" />
            <p className="text-lg font-medium text-slate-400">{t('voice.speakNow')}</p>
            <p className="text-sm mt-1 max-w-md">
              {t('voice.voiceFirstActive')}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 max-w-sm">
              {quickCommands.slice(0, 4).map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => handleQuickCommand(cmd.label)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs text-left transition-colors border border-slate-700 cursor-pointer"
                >
                  <span className="mr-1">{cmd.icon}</span> {cmd.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {state.isProcessing && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('voice.processing')}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="relative">
        {showQuickCommands && (
          <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-800 border border-slate-700 rounded-2xl grid grid-cols-2 sm:grid-cols-3 gap-2 shadow-xl">
            {quickCommands.map((cmd) => (
              <button
                key={cmd.label}
                onClick={() => handleQuickCommand(cmd.label)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs text-left transition-colors cursor-pointer"
              >
                <span className="mr-1">{cmd.icon}</span> {cmd.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <button
            type="button"
            onClick={() => setShowQuickCommands((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors cursor-pointer"
            title={t('voice.quickQueries')}
          >
            <Zap className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={state.isListening ? stopListening : startListening}
            disabled={!isSupported}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              state.isListening
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 animate-pulse'
                : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={state.isListening ? t('common.micOff') : t('common.micOn')}
          >
            {state.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('voice.speakNow')}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={state.isProcessing}
          />

          <button
            type="button"
            onClick={handleSendText}
            disabled={!textInput.trim() || state.isProcessing}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={clearMessages}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors cursor-pointer"
            title={t('common.clear')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: VoiceMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  const providerBadge = !isUser && message.provider ? (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
      message.provider === 'gemini'
        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        : message.provider === 'openrouter'
        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
    }`}>
      {message.provider === 'gemini' && <Brain className="w-2.5 h-2.5 inline mr-0.5" />}
      {message.provider}
    </span>
  ) : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-100 border border-slate-700'
        }`}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
        <div className={`flex items-center gap-2 mt-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {providerBadge}
          {message.latencyMs != null && (
            <span className="text-[10px] text-slate-500">{message.latencyMs}ms</span>
          )}
          <span className="text-[10px] text-slate-500">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
