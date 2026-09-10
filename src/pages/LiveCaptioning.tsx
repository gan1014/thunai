import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Subtitles,
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Volume2,
  Bell,
  Play,
  Square,
  Globe,
  Settings2,
  Share2,
} from 'lucide-react';
import { LiveCaptions, CaptionItem } from '../components/LiveCaptions';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { api } from '../api/client';
import { LanguageCode } from '../types';
import { LANGUAGES } from '../utils/constants';

const LECTURE_STREAM_SCENARIOS = [
  'Welcome everyone to today’s lecture on accessibility computing and human-centered design.',
  'Today we are analyzing real-time multimodal assistance for individuals with visual, auditory, and motor impairments.',
  'Notice how situational awareness automatically shifts interaction modes based on ambient noise and environmental hazards.',
  'For example, when background noise exceeds 65 decibels, audio synthesis volume dynamically scales up.',
  'Next, our kinematic vision tracker processes 21 hand landmarks directly in real time.',
  'The midterm research evaluation and jury review is scheduled for this upcoming session.',
];

const ACOUSTIC_EVENTS = [
  { label: '[Applause & Clapping Detected]', icon: '👏' },
  { label: '[Door Knock / Alert]', icon: '🚪' },
  { label: '[Audience Question Raised]', icon: '🙋' },
  { label: '[Emergency Siren / Alarm]', icon: '🚨' },
];

export const LiveCaptioning: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [captions, setCaptions] = useState<CaptionItem[]>([
    {
      text: 'SAHAY-X Live Subtitle Engine Active. Microphone listening continuously.',
      timestamp: Date.now() - 15000,
      speaker: 'System',
    },
  ]);

  const [activeLang, setActiveLang] = useState<LanguageCode>((i18n.language as LanguageCode) || 'en');
  const [translateSubtitles, setTranslateSubtitles] = useState(true);
  const [targetSubLang, setTargetSubLang] = useState<LanguageCode>('hi');
  const [theme, setTheme] = useState<'dark' | 'yellow-black' | 'white-black' | 'slate'>('dark');
  const [isSimulatingLecture, setIsSimulatingLecture] = useState(false);
  const simIndexRef = useRef(0);
  const simTimerRef = useRef<any>(null);

  const bcp47Map: Record<LanguageCode, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    kn: 'kn-IN',
  };

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: bcp47Map[activeLang] || 'en-IN',
    continuous: true,
    interimResults: true,
    onResult: async (text, isFinal) => {
      if (isFinal && text.trim()) {
        let translatedText: string | undefined = undefined;
        if (translateSubtitles && targetSubLang !== activeLang) {
          try {
            const res = await api.translateText(text, targetSubLang);
            translatedText = res.translated;
          } catch (e) {
            // translation fallback ignored
          }
        }

        setCaptions((prev) => [
          ...prev,
          {
            text,
            translatedText,
            timestamp: Date.now(),
            speaker: 'Live Speaker',
          },
        ]);
        resetTranscript();
      }
    },
  });

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    if (isSimulatingLecture) {
      simTimerRef.current = setInterval(async () => {
        const sentence = LECTURE_STREAM_SCENARIOS[simIndexRef.current % LECTURE_STREAM_SCENARIOS.length];
        simIndexRef.current += 1;

        let translatedText: string | undefined = undefined;
        if (translateSubtitles && targetSubLang !== 'en') {
          try {
            const res = await api.translateText(sentence, targetSubLang);
            translatedText = res.translated;
          } catch (e) {
            // Ignore
          }
        }

        setCaptions((prev) => [
          ...prev,
          {
            text: sentence,
            translatedText,
            timestamp: Date.now(),
            speaker: 'Prof. Sharma (Lecturer)',
          },
        ]);
      }, 3800);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulatingLecture, translateSubtitles, targetSubLang]);

  const triggerAcousticEvent = (eventText: string) => {
    setCaptions((prev) => [
      ...prev,
      {
        text: eventText,
        timestamp: Date.now(),
        speaker: 'Acoustic Sensor',
        isSoundEvent: true,
      },
    ]);
  };

  return (
    <div id="live-captioning-page" className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Subtitles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                {t('captions.title')}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('app.realTimeReady')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('captions.subtitle')}
            </p>
          </div>
        </div>

        {/* Live Mic Action Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              isListening
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isListening ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{t('common.micOff')}</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>{t('common.micOn')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Captions Display: 8 Cols */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <LiveCaptions
            captions={captions}
            interimText={interimTranscript}
            language={activeLang}
            theme={theme}
            onThemeChange={setTheme}
            onClear={() => setCaptions([])}
          />

          {/* Quick Caption Settings Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={translateSubtitles}
                  onChange={(e) => setTranslateSubtitles(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Simultaneous Subtitle Translation:</span>
              </label>

              {translateSubtitles && (
                <select
                  value={targetSubLang}
                  onChange={(e) => setTargetSubLang(e.target.value as LanguageCode)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer"
                >
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="en">English</option>
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <span className="font-medium">Total Captured:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {captions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: 4 Cols */}
        <div className="lg:col-span-4 space-y-5">
          {/* Classroom Simulator Card */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Live Classroom Stream Simulator
                </h3>
              </div>
              {isSimulatingLecture && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Streams continuous spoken lecture dialogue with realistic cadence to test real-time subtitles without speaking out loud.
            </p>

            <button
              type="button"
              onClick={() => setIsSimulatingLecture((v) => !v)}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSimulatingLecture
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
            >
              {isSimulatingLecture ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Lecture Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Stream Live Lecture (Demo)</span>
                </>
              )}
            </button>
          </div>

          {/* Acoustic Environmental Hazard Signals */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Acoustic Event Detection
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Captures non-verbal room sounds for deaf students so they are immediately aware of classroom events:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {ACOUSTIC_EVENTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => triggerAcousticEvent(item.label)}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-amber-400 transition-all flex items-center gap-2.5 cursor-pointer group"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
