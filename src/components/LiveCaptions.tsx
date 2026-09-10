import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Subtitles, Trash2, Pause, Play, ZoomIn, ZoomOut, Download, Palette } from 'lucide-react';
import { LanguageCode } from '../types';

export interface CaptionItem {
  text: string;
  translatedText?: string;
  timestamp: number;
  speaker?: string;
  isSoundEvent?: boolean;
}

interface LiveCaptionsProps {
  captions?: CaptionItem[];
  interimText?: string;
  language?: LanguageCode;
  onClear?: () => void;
  className?: string;
  theme?: 'dark' | 'yellow-black' | 'white-black' | 'slate';
  onThemeChange?: (theme: 'dark' | 'yellow-black' | 'white-black' | 'slate') => void;
}

export const LiveCaptions: React.FC<LiveCaptionsProps> = ({
  captions = [],
  interimText = '',
  language = 'en',
  onClear,
  className = '',
  theme = 'dark',
  onThemeChange,
}) => {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState<'lg' | 'xl' | '2xl' | '3xl'>('xl');
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPaused && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [captions, interimText, isPaused]);

  const sizeClasses = {
    lg: 'text-base md:text-lg',
    xl: 'text-lg md:text-2xl',
    '2xl': 'text-xl md:text-3xl',
    '3xl': 'text-2xl md:text-4xl',
  };

  const themeStyles = {
    dark: {
      card: 'bg-slate-950 border-slate-800 text-slate-100',
      header: 'border-slate-800',
      bubble: 'bg-slate-900/90 border-slate-800 text-slate-100',
      speaker: 'text-indigo-400',
      interim: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/30',
      sound: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      translation: 'text-amber-300/90',
    },
    'yellow-black': {
      card: 'bg-black border-yellow-400 text-yellow-300',
      header: 'border-yellow-500/40',
      bubble: 'bg-black border-2 border-yellow-400 text-yellow-300 shadow-yellow-500/20',
      speaker: 'text-yellow-200 font-black underline',
      interim: 'text-yellow-400 border-yellow-400 bg-yellow-950/40',
      sound: 'bg-yellow-400 text-black font-black border-yellow-400',
      translation: 'text-yellow-100 font-bold',
    },
    'white-black': {
      card: 'bg-black border-white text-white',
      header: 'border-white/30',
      bubble: 'bg-black border-2 border-white text-white',
      speaker: 'text-white font-black underline',
      interim: 'text-slate-300 border-dashed border-white bg-slate-900',
      sound: 'bg-white text-black font-black border-white',
      translation: 'text-slate-200',
    },
    slate: {
      card: 'bg-white border-slate-300 text-slate-900',
      header: 'border-slate-200',
      bubble: 'bg-slate-50 border-slate-200 text-slate-900',
      speaker: 'text-indigo-600 font-bold',
      interim: 'text-indigo-600 border-indigo-300 bg-indigo-50',
      sound: 'bg-amber-100 text-amber-900 border-amber-300',
      translation: 'text-slate-600 italic',
    },
  };

  const currentTheme = themeStyles[theme] || themeStyles.dark;

  const handleExport = () => {
    if (captions.length === 0) return;
    const textContent = captions
      .map(
        (c) =>
          `[${new Date(c.timestamp).toLocaleTimeString()}] ${c.speaker || t('captions.speaker', 'Speaker')}: ${c.text}${
            c.translatedText ? `\n   Translation: ${c.translatedText}` : ''
          }`
      )
      .join('\n\n');

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sahay-x-live-captions-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="live-captions-card"
      className={`border-2 rounded-2xl p-5 flex flex-col shadow-2xl transition-colors ${currentTheme.card} ${className}`}
    >
      {/* Header Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b mb-3 ${currentTheme.header}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Subtitles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">{t('captions.liveSubtitles', 'Live Subtitles & Captions')}</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live audio ingestion active" />
            </div>
            <p className="text-xs opacity-75">{t('captions.classroomDesc', 'Classroom & meeting high-contrast real-time captions')}</p>
          </div>
        </div>

        {/* Toolbar buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Theme cycle */}
          {onThemeChange && (
            <div className="flex items-center gap-1 border border-slate-700/50 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                title="Dark theme"
                className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                  theme === 'dark' ? 'bg-indigo-600 text-white' : 'opacity-60 hover:opacity-100'
                }`}
              >
                D
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('yellow-black')}
                title="Yellow on Black (High Contrast for Low Vision)"
                className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                  theme === 'yellow-black' ? 'bg-yellow-400 text-black' : 'opacity-60 hover:opacity-100 text-yellow-300'
                }`}
              >
                Y
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('white-black')}
                title="White on Black (Monochrome High Contrast)"
                className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                  theme === 'white-black' ? 'bg-white text-black' : 'opacity-60 hover:opacity-100 text-white'
                }`}
              >
                W
              </button>
            </div>
          )}

          {/* Font sizing */}
          <button
            type="button"
            onClick={() => {
              if (fontSize === 'lg') setFontSize('xl');
              else if (fontSize === 'xl') setFontSize('2xl');
              else if (fontSize === '2xl') setFontSize('3xl');
            }}
            aria-label="Increase Font Size"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Increase Font Size (up to 3xl for classroom visibility)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (fontSize === '3xl') setFontSize('2xl');
              else if (fontSize === '2xl') setFontSize('xl');
              else if (fontSize === 'xl') setFontSize('lg');
            }}
            aria-label="Decrease Font Size"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Decrease Font Size"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Pause auto scroll */}
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={isPaused ? 'Resume live scrolling' : 'Pause scrolling'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Export transcript */}
          <button
            type="button"
            onClick={handleExport}
            disabled={captions.length === 0}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
            title="Export full transcript as .txt"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Clear captions */}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear Captions"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-900/50 text-slate-300 hover:text-red-300 transition-colors cursor-pointer"
              title="Clear all captions"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Captions Stream Area */}
      <div
        ref={containerRef}
        className="flex-1 min-h-[220px] max-h-[420px] overflow-y-auto space-y-3 pr-2 scroll-smooth"
        role="log"
        aria-live="polite"
      >
        {captions.length === 0 && !interimText ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center opacity-60 p-8 space-y-2">
            <Subtitles className="w-8 h-8 opacity-40 animate-pulse" />
            <p className="text-sm font-medium">{t('captions.listeningSpeech', 'Listening for speech in real-time...')}</p>
            <p className="text-xs opacity-75">{t('captions.streamDesc', 'Captions stream onto the screen word by word as the speaker speaks.')}</p>
          </div>
        ) : (
          <>
            {captions.map((c, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl border transition-all ${
                  c.isSoundEvent ? currentTheme.sound : currentTheme.bubble
                }`}
              >
                <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                  <span className={`font-bold ${currentTheme.speaker}`}>{c.speaker || t('captions.speaker', 'Speaker')}</span>
                  <span>
                    {new Date(c.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <p className={`${sizeClasses[fontSize]} font-semibold leading-relaxed tracking-wide`}>
                  {c.text}
                </p>
                {c.translatedText && (
                  <p className={`mt-1 text-xs md:text-sm font-medium ${currentTheme.translation}`}>
                    ↳ {c.translatedText}
                  </p>
                )}
              </div>
            ))}

            {/* Real-time Interim Live Stream Bubble */}
            {interimText && (
              <div
                className={`p-3.5 rounded-xl border border-dashed transition-all animate-pulse ${currentTheme.interim}`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold mb-1 opacity-80">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>{t('captions.transcribingLive', 'Transcribing live in real time...')}</span>
                </div>
                <p className={`${sizeClasses[fontSize]} font-medium italic leading-relaxed`}>
                  {interimText}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
