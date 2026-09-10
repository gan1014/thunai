import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  Navigation,
  X,
  Send,
  Radio,
  Volume2,
} from 'lucide-react';
import { CameraFeed } from './CameraFeed';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useVoiceInteraction } from '../context/VoiceInteractionContext';
import { useProfile } from '../context/ProfileContext';
import { api } from '../api/client';
import { DetectedObject } from '../types';

interface GlobalVoiceWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const GlobalVoiceWidget: React.FC<GlobalVoiceWidgetProps> = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [liveDetections, setLiveDetections] = useState<DetectedObject[]>([]);
  const { profile } = useProfile();

  const {
    state: voiceState,
    isListening: isContextListening,
    activeNavigationPath,
    lastResponseText,
    processVoiceQuery,
    interruptSpeech,
  } = useVoiceInteraction();

  const { speak, isSpeaking } = useSpeechSynthesis();

  const QUICK_SPATIAL_BUTTONS = [
    { icon: '🚪', text: t('voice.promptExit', 'Where is the exit door?'), label: t('voice.promptExit', 'Where is the exit door?') },
    { icon: '🚶', text: t('voice.promptPath', 'Is the pathway clear?'), label: t('voice.promptPath', 'Is the pathway clear?') },
    { icon: '⚠️', text: t('voice.promptObstacle', 'What is in front of me?'), label: t('voice.promptObstacle', 'What is in front of me?') },
    { icon: '⬅️', text: t('voice.promptLeft', 'What is on my left?'), label: t('voice.promptLeft', 'What is on my left?') },
    { icon: '➡️', text: t('voice.promptRight', 'What is on my right?'), label: t('voice.promptRight', 'What is on my right?') },
  ];

  const sttLang =
    profile.preferred_language === 'ta'
      ? 'ta-IN'
      : profile.preferred_language === 'te'
      ? 'te-IN'
      : profile.preferred_language === 'hi'
      ? 'hi-IN'
      : 'en-IN';

  // Real-time Speech-to-Text recognition
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    language: sttLang,
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal && text.trim()) {
        processVoiceQuery(text.trim());
      }
    },
  });

  // Auto-start listening and announce when modal opens
  useEffect(() => {
    if (isOpen) {
      startListening();
      if (!isSpeaking) {
        const announcement =
          profile.preferred_language === 'ta'
            ? 'இடஞ்சார்ந்த பார்வை இயந்திரம் தயாராக உள்ளது. வெளியேறும் வழி எங்கே எனக் கேட்கவும்.'
            : profile.preferred_language === 'te'
            ? 'విజన్ ఇంజిన్ సిద్ధంగా ఉంది. బయటికి వెళ్లే మార్గం ఎక్కడ అని అడగండి.'
            : profile.preferred_language === 'hi'
            ? 'दृष्टि सहायक तैयार है। बाहर जाने का रास्ता कहाँ है, पूछें।'
            : 'Spatial vision engine active. Ask where is the exit door or any question.';
        speak(announcement, profile.preferred_language);
      }
    } else {
      stopListening();
    }
  }, [isOpen, profile.preferred_language]);

  const handleFrameCapture = async (base64: string) => {
    try {
      const vision = await api.describeScene(base64);
      if (vision.objects && vision.objects.length > 0) {
        setLiveDetections(vision.objects);
      }
    } catch (err) {
      console.warn('Live frame capture error:', err);
    }
  };

  const handleQuickQuery = async (query: string) => {
    await processVoiceQuery(query);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const q = textInput.trim();
    setTextInput('');
    await processVoiceQuery(q);
  };

  return (
    <>
      {/* 1. Persistent Floating Assistant Button on Every Page */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={t('header.findExit', 'Open Spatial Vision & Voice Assistant')}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white font-bold text-xs shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/80 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 opacity-60 blur-sm group-hover:opacity-100 transition-opacity animate-pulse" />
            <div className="relative flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 text-white animate-bounce" aria-hidden="true" />
              </div>
              <span className="font-extrabold tracking-wide">
                🎙️ {t('header.findExit', 'Where is Exit?')} ({t('nav.voice', 'Voice')})
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          </button>
        </div>
      )}

      {/* 2. Global Spatial Vision & Voice Navigation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border-2 border-indigo-500/70 rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Navigation className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="modal-title" className="text-base font-black text-white">
                      {t('app.name', 'THUNAI')} {t('vision.title', 'Vision Assistant')} & {t('header.findExit', 'Exit Guidance')}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {t('vision.liveFeed', 'LIVE AI VISION')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {t('vision.subtitle', 'Real-time Door & Exit Detection with Google Maps AR Corridor Overlay')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                  title={t('common.close', 'Close Assistant')}
                  aria-label={t('common.close', 'Close Assistant')}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Google Maps AR Walking Route HUD Card */}
              {activeNavigationPath && (
                <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border-2 border-emerald-500 p-4 rounded-2xl shadow-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Navigation className="w-5 h-5 text-emerald-400 animate-bounce" aria-hidden="true" />
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                          {t('vision.walkingCorridor', 'AR Route')}: {activeNavigationPath.targetLabel}
                        </h3>
                        <p className="text-xs text-slate-200 font-medium">
                          {activeNavigationPath.stepInstruction}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-900/90 text-emerald-200 border border-emerald-500/50">
                      📍 {activeNavigationPath.targetDistanceMeters.toFixed(1)} {t('vision.meters', 'm')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{t('vision.clockHeading', 'Orientation')}</span>
                      <p className="font-bold text-blue-300 mt-0.5">
                        🕐 {activeNavigationPath.clockDirection}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{t('vision.estimatedStrides', 'Stride Distance')}</span>
                      <p className="font-bold text-white mt-0.5">
                        🚶 {activeNavigationPath.stepCountEstimated} {t('vision.steps', 'strides')}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{t('vision.headingAngle', 'Heading Angle')}</span>
                      <p className="font-bold text-white mt-0.5 font-mono">
                        {activeNavigationPath.turnAngleDeg > 0 ? `+${activeNavigationPath.turnAngleDeg}° (${t('spatial.right', 'Right')})` : activeNavigationPath.turnAngleDeg < 0 ? `${activeNavigationPath.turnAngleDeg}° (${t('spatial.left', 'Left')})` : `0° (${t('spatial.ahead', 'Straight')})`}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{t('common.status', 'Status')}</span>
                      <p className={`font-bold mt-0.5 ${activeNavigationPath.isPathClear ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {activeNavigationPath.isPathClear ? `✓ ${t('vision.pathClear', 'Clear Pathway')}` : `⚠️ ${t('vision.pathBlocked', 'Hazard Detour')}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Camera Feed with Doorway Detection & Google Maps AR Walking Corridor */}
              <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-black">
                <CameraFeed
                  detections={liveDetections}
                  navigationPath={activeNavigationPath || undefined}
                  onFrame={handleFrameCapture}
                  processingInterval={1500}
                  autoStart={true}
                  showArPath={true}
                />
              </div>

              {/* Active Voice Recognition Stream & Spoken Response Bubble */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-4 h-4 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} aria-hidden="true" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {isListening ? t('voice.listening', 'Listening live... Speak in real time') : t('common.inactive', 'Voice Input Inactive')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      isListening
                        ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isListening ? t('common.micOff', 'Stop Mic') : t('common.micOn', 'Start Mic')}</span>
                  </button>
                </div>

                <div className="min-h-[44px] text-sm font-medium text-white flex items-center">
                  {transcript || interimTranscript ? (
                    <p>
                      <span className="text-slate-400 mr-1.5 font-bold">{t('voice.youSpoke', 'You Spoke:')}</span>
                      <span>"{transcript || interimTranscript}"</span>
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">
                      {t('voice.noSpeech', 'Speak now or tap a quick query below...')}
                    </p>
                  )}
                </div>

                {lastResponseText && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <span className="font-bold text-emerald-300 block mb-0.5">{t('voice.thunaiSpoke', 'THUNAI Spoke:')}</span>
                      <p className="font-semibold text-sm leading-relaxed">"{lastResponseText}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 1-Tap Quick Action Buttons */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t('voice.quickQueries', 'Quick Navigation Queries:')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {QUICK_SPATIAL_BUTTONS.map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickQuery(btn.text)}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left transition-all flex flex-col gap-1 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">{btn.icon}</span>
                      <span className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                        {btn.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Query Form */}
              <form onSubmit={handleFormSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t('voice.promptExit', 'e.g. Where is the exit door?')}
                  aria-label={t('voice.speakNow', 'Voice and text query input')}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t('common.ask', 'Ask')}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
