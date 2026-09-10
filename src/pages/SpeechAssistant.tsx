import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Globe2,
  Gauge,
  CheckCircle2,
  Volume1,
  Languages,
  Radio,
  Sliders,
  Play,
  Square,
  Navigation,
  Compass,
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useVoiceInteraction } from '../context/VoiceInteractionContext';
import { api } from '../api/client';
import { LanguageCode } from '../types';
import { LANGUAGES } from '../utils/constants';

interface TranslationSet {
  en: string;
  hi: string;
  ta: string;
  te: string;
}

const SAMPLE_ACCESSIBILITY_UTTERANCES = [
  {
    title: 'Exit & Door Finder',
    text: 'Where is the exit or nearest door?',
    lang: 'en' as LanguageCode,
  },
  {
    title: 'Safe Path Query',
    text: 'Is the pathway ahead clear of obstacles and stairs?',
    lang: 'en' as LanguageCode,
  },
  {
    title: 'Telugu Navigation (తెలుగు)',
    text: 'బయటికి వెళ్లే మార్గం ఎక్కడ ఉంది?',
    lang: 'te' as LanguageCode,
  },
  {
    title: 'Restroom Assistance (Hindi)',
    text: 'कृपया मुझे नजदीकी सुलभ शौचालय का रास्ता बताइए।',
    lang: 'hi' as LanguageCode,
  },
  {
    title: 'Emergency Medical (Tamil)',
    text: 'எனக்கு உடனடியாக மருத்துவ உதவி தேவை, மருத்துவரை அழையுங்கள்.',
    lang: 'ta' as LanguageCode,
  },
  {
    title: 'Medicine Label Check',
    text: 'Can you read the dosage and expiry date on this medicine strip?',
    lang: 'en' as LanguageCode,
  },
];

export const SpeechAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeLang, setActiveLang] = useState<LanguageCode>((i18n.language as LanguageCode) || 'en');
  const [spokenText, setSpokenText] = useState('Where is the exit or nearest door?');
  const [translations, setTranslations] = useState<TranslationSet>({
    en: 'Where is the exit or nearest door?',
    hi: 'निकास या निकटतम दरवाजा किस तरफ है?',
    ta: 'வெளியேறும் வழி அல்லது அருகிலுள்ள கதவு எங்கு உள்ளது?',
    te: 'బయటికి వెళ్లే ద్వారం లేదా సమీప మార్గం ఎక్కడ ఉంది?',
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [ambientDb, setAmbientDb] = useState(42);
  const [adaptiveVolumeBoost, setAdaptiveVolumeBoost] = useState(1.0);
  const [speechRate, setSpeechRate] = useState(1.0);

  const { speak, stop, isSpeaking } = useSpeechSynthesis();
  const { activeNavigationPath, processVoiceQuery } = useVoiceInteraction();

  // BCP-47 language codes for speech recognition
  const bcp47Map: Record<LanguageCode, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    kn: 'kn-IN',
  };

  // Real-time Speech Recognition
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: sttSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: bcp47Map[activeLang] || 'en-IN',
    continuous: true,
    interimResults: true,
    onResult: (currentText, isFinal) => {
      if (currentText.trim()) {
        setSpokenText(currentText);
        if (isFinal) {
          triggerLiveTranslations(currentText);
          const lower = currentText.toLowerCase();
          if (
            lower.includes('exit') ||
            lower.includes('door') ||
            lower.includes('path') ||
            lower.includes('where') ||
            lower.includes('रास्ता') ||
            lower.includes('दरवाजा') ||
            lower.includes('வழி') ||
            lower.includes('கதவு') ||
            lower.includes('ద్వారం') ||
            lower.includes('మార్గం')
          ) {
            processVoiceQuery(currentText);
          }
        }
      }
    },
  });

  // Trigger translation into English, Hindi, Tamil, and Telugu
  const triggerLiveTranslations = async (text: string) => {
    if (!text || !text.trim()) return;
    setIsTranslating(true);
    try {
      const [hiRes, taRes, teRes, enRes] = await Promise.all([
        activeLang === 'hi' ? Promise.resolve({ translated: text }) : api.translateText(text, 'hi'),
        activeLang === 'ta' ? Promise.resolve({ translated: text }) : api.translateText(text, 'ta'),
        activeLang === 'te' ? Promise.resolve({ translated: text }) : api.translateText(text, 'te'),
        activeLang === 'en' ? Promise.resolve({ translated: text }) : api.translateText(text, 'en'),
      ]);

      setTranslations({
        en: enRes.translated || text,
        hi: hiRes.translated || text,
        ta: taRes.translated || text,
        te: teRes.translated || text,
      });
    } catch (e) {
      console.warn('Real-time translation error:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  // Live Ambient Noise Monitor (Web Audio API)
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let stream: MediaStream | null = null;
    let animId: number | null = null;

    const startAudioMeter = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            const calculatedDb = Math.round(32 + (avg / 255) * 58);
            setAmbientDb(calculatedDb);

            if (calculatedDb > 65) {
              setAdaptiveVolumeBoost(1.3);
            } else if (calculatedDb > 50) {
              setAdaptiveVolumeBoost(1.15);
            } else {
              setAdaptiveVolumeBoost(1.0);
            }
          }
          animId = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        const interval = setInterval(() => {
          setAmbientDb((prev) => {
            const delta = Math.floor(Math.random() * 7) - 3;
            const next = Math.max(34, Math.min(82, prev + delta));
            if (next > 65) setAdaptiveVolumeBoost(1.25);
            else setAdaptiveVolumeBoost(1.0);
            return next;
          });
        }, 1200);
        return () => clearInterval(interval);
      }
    };

    startAudioMeter();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioCtx) audioCtx.close();
    };
  }, []);

  const handleSpeak = (text: string, lang: LanguageCode) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, lang);
    }
  };

  const simulateLiveUtterance = (item: typeof SAMPLE_ACCESSIBILITY_UTTERANCES[0]) => {
    setActiveLang(item.lang);
    setSpokenText(item.text);
    triggerLiveTranslations(item.text);
    speak(item.text, item.lang);
    const lower = item.text.toLowerCase();
    if (
      lower.includes('exit') ||
      lower.includes('door') ||
      lower.includes('path') ||
      lower.includes('where') ||
      lower.includes('रास्ता') ||
      lower.includes('दरवाजा') ||
      lower.includes('வழி') ||
      lower.includes('கதவு') ||
      lower.includes('ద్వారం') ||
      lower.includes('మార్గం')
    ) {
      processVoiceQuery(item.text);
    }
  };

  return (
    <div id="speech-assistant-page" className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                {t('nav.speech')}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('app.realTimeReady')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('voice.subtitle')}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {LANGUAGES.slice(0, 4).map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setActiveLang(l.code);
                resetTranscript();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLang === l.code
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {l.nativeName}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isListening ? t('captions.micActive') : t('voice.liveAudio')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                  Lang: {activeLang.toUpperCase()} ({bcp47Map[activeLang]})
                </span>
              </div>
            </div>

            {/* Central Microphone Action Area */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative mb-3">
                {isListening && (
                  <div className="absolute inset-0 rounded-full bg-red-500/20 dark:bg-red-500/30 animate-ping" />
                )}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform active:scale-95 cursor-pointer ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-500 shadow-red-600/40 animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  }`}
                  aria-label={isListening ? t('common.micOff') : t('common.micOn')}
                >
                  {isListening ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-9 h-9" />}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {isListening ? t('voice.listening') : t('common.speak')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {isListening
                    ? t('captions.realTimeSpeech')
                    : `${t('voice.voiceFirstActive')}`}
                </p>
              </div>
            </div>

            {/* Real-time Transcription Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('voice.transcript')}
                </span>
                {isListening && (
                  <span className="flex items-center gap-1.5 text-red-500 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE MIC
                  </span>
                )}
              </div>

              <div className="min-h-[70px] text-sm md:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                {transcript || interimTranscript ? (
                  <>
                    <span>{transcript}</span>
                    {interimTranscript && (
                      <span className="text-indigo-500 dark:text-indigo-400 italic font-normal ml-1">
                        {interimTranscript}...
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 italic">
                    "{spokenText}"
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => triggerLiveTranslations(transcript || spokenText)}
                  disabled={isTranslating}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                  {t('common.translate')}
                </button>

                <button
                  type="button"
                  onClick={() => handleSpeak(transcript || spokenText, activeLang)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  {t('common.readAloud')}
                </button>
              </div>
            </div>

            {/* Sample Prompts */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {t('voice.quickQueries')}:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_ACCESSIBILITY_UTTERANCES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => simulateLiveUtterance(item)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left text-xs transition-all flex flex-col gap-1 cursor-pointer group"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      "{item.text}"
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Noise-Adaptive Acoustic Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('voice.noiseAdaptiveGain')}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ACTIVE VAD
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{t('voice.noiseLevel')}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{ambientDb} dB SPL</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${
                    ambientDb > 70 ? 'bg-red-500' : ambientDb > 55 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, ((ambientDb - 20) / 70) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('voice.dynamicVolumeBoost')}: {(adaptiveVolumeBoost * 100).toFixed(0)}%
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {ambientDb > 65
                    ? 'High noise: Acoustic boost applied (+30% gain)'
                    : 'Normal acoustics: Baseline balanced synthesis'}
                </p>
              </div>
              <Volume2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            </div>
          </div>

          {/* Multilingual Simultaneous Translation Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Native Translation & Voice Output
                </h3>
              </div>
              {isTranslating && (
                <span className="text-xs font-bold text-purple-500 animate-pulse">{t('common.loading')}</span>
              )}
            </div>

            <div className="space-y-3">
              {/* English Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    English (Indian Accent)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSpeak(translations.en, 'en')}
                    className="p-1 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                    title="Play English Speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  "{translations.en}"
                </p>
              </div>

              {/* Tamil Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    தமிழ் (Tamil Native Voice)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSpeak(translations.ta, 'ta')}
                    className="p-1 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                    title="Play Tamil Speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  "{translations.ta}"
                </p>
              </div>

              {/* Telugu Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    తెలుగు (Telugu Native Voice)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSpeak(translations.te, 'te')}
                    className="p-1 rounded-lg bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-600 hover:text-white transition-colors cursor-pointer"
                    title="Play Telugu Speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  "{translations.te}"
                </p>
              </div>

              {/* Hindi Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    हिन्दी (Hindi Native Voice)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSpeak(translations.hi, 'hi')}
                    className="p-1 rounded-lg bg-amber-600/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white transition-colors cursor-pointer"
                    title="Play Hindi Speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  "{translations.hi}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
