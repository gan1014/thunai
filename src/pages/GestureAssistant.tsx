import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Hand, Sparkles, Volume2, ShieldAlert, HeartHandshake, Globe, Eye, AlertTriangle, Activity, Navigation } from 'lucide-react';
import { GestureDetector } from '../components/GestureDetector';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useAssistant } from '../context/AssistantContext';
import { useProfile } from '../context/ProfileContext';
import { useVoiceInteraction } from '../context/VoiceInteractionContext';
import { GESTURE_ICONS, GESTURE_CONTROL_LABELS } from '../utils/constants';
import { GestureResult, GestureControlEvent, LanguageCode } from '../types';

const ISL_GESTURE_DICTIONARY = [
  { gesture: 'namaste', label: 'Namaste (नमस्ते / वणक्कम / నమస్తే)', intent: 'greeting', text: 'नमस्ते, आप कैसे हैं? (Namaste, Greetings)', icon: '🙏', risk: 'low', lang: 'hi' as LanguageCode },
  { gesture: 'water_paani', label: 'Water / Paani (पानी / தண்ணீர் / నీరు)', intent: 'assistance', text: 'मुझे पीने के लिए पानी चाहिए। (I need drinking water)', icon: '💧', risk: 'low', lang: 'hi' as LanguageCode },
  { gesture: 'food_khana', label: 'Food / Khana (खाना / உணவு / ఆహారం)', intent: 'assistance', text: 'मुझे भूख लगी है, कृपया भोजन दीजिए। (I need food)', icon: '🍲', risk: 'low', lang: 'hi' as LanguageCode },
  { gesture: 'medicine_dawa', label: 'Medicine / Dawa (दवाई / மருந்து / మందు)', intent: 'assistance', text: 'मुझे मेरी समय की दवाई चाहिए। (I need my scheduled medicine)', icon: '💊', risk: 'medium', lang: 'hi' as LanguageCode },
  { gesture: 'doctor_hospital', label: 'Doctor / Hospital (डॉक्टर / மருத்துவர் / వైద్యుడు)', intent: 'help', text: 'कृपया किसी डॉक्टर या नर्स को बुलाइए! (Please call a doctor immediately)', icon: '🩺', risk: 'high', lang: 'hi' as LanguageCode },
  { gesture: 'toilet_washroom', label: 'Restroom / Toilet (शौचालय / கழிப்பறை / శౌచాలయం)', intent: 'assistance', text: 'शौचालय किस तरफ है? (Where is the restroom?)', icon: '🚻', risk: 'low', lang: 'hi' as LanguageCode },
  { gesture: 'thank_you', label: 'Thank You (धन्यवाद / நன்றி / ధన్యవాదాలు)', intent: 'greeting', text: 'आपकी सहायता के लिए बहुत धन्यवाद। (Thank you for your assistance)', icon: '🤝', risk: 'low', lang: 'hi' as LanguageCode },
  { gesture: 'help_sos', label: 'Urgent SOS / Madad (मदद चाहिए / உதவி / సహాయం)', intent: 'help', text: 'आपातकालीन सहायता! मुझे तुरंत मदद चाहिए! (Emergency! I need immediate help)', icon: '🆘', risk: 'critical', lang: 'hi' as LanguageCode },
];

const STANDARD_GESTURE_DICTIONARY = [
  { gesture: 'open_palm', label: 'Open Palm (Stop)', intent: 'stop', text: 'Emergency Stop / Halt Movement', icon: '✋', risk: 'high', lang: 'en' as LanguageCode },
  { gesture: 'closed_fist', label: 'Closed Fist (SOS)', intent: 'help', text: 'Urgent SOS / Assistance Needed', icon: '✊', risk: 'critical', lang: 'en' as LanguageCode },
  { gesture: 'thumbs_up', label: 'Thumbs Up (Safe)', intent: 'yes', text: 'Affirmative / Confirmed', icon: '👍', risk: 'low', lang: 'en' as LanguageCode },
  { gesture: 'thumbs_down', label: 'Thumbs Down (Cancel)', intent: 'no', text: 'Negative / Cancel', icon: '👎', risk: 'low', lang: 'en' as LanguageCode },
  { gesture: 'peace_sign', label: 'Peace Sign (Clear)', intent: 'okay', text: 'Safe & Clear Status', icon: '✌️', risk: 'low', lang: 'en' as LanguageCode },
  { gesture: 'pointing_up', label: 'Pointing Up (Exit)', intent: 'attention', text: 'Direct Spatial Focus Ahead', icon: '☝️', risk: 'medium', lang: 'en' as LanguageCode },
  { gesture: 'waving', label: 'Hand Wave (Guide)', intent: 'greeting', text: 'Social Greeting & Presence', icon: '👋', risk: 'low', lang: 'en' as LanguageCode },
];

const WAVE_RESPONSES: Record<string, string> = {
  en: 'How can I help you?',
  hi: 'मैं आपकी कैसे मदद कर सकता हूँ?',
  ta: 'நான் உங்களுக்கு எப்படி உதவ முடியும்?',
  te: 'నేను మీకు ఎలా సహాయం చేయగలను?',
};

const ALERT_RESPONSES: Record<string, string> = {
  en: 'Alert triggered. Please be careful.',
  hi: 'अलर्ट सक्रिय। कृपया सावधान रहें।',
  ta: 'எச்சரிக்கை செயல்படுத்தப்பட்டது. தயவுசெய்து கவனமாக இருங்கள்.',
  te: 'హెచ్చరిక సక్రియం చేయబడింది. దయచేసి జాగ్రత్తగా ఉండండి.',
};

export const GestureAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { speak, isSpeaking } = useSpeechSynthesis();
  const { profile } = useProfile();
  const { sendMultimodal } = useAssistant();
  const { activeNavigationPath, processVoiceQuery } = useVoiceInteraction();

  const [activeTab, setActiveTab] = useState<'isl' | 'standard'>('isl');
  const [lastGesture, setLastGesture] = useState<GestureResult | null>(null);
  const [lastGestureEvent, setLastGestureEvent] = useState<GestureControlEvent | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const speechCooldownRef = useRef(false);
  const pipelineCooldownRef = useRef(false);

  const currentLang = (i18n.language as LanguageCode) || profile.preferred_language || 'en';

  const handleGestureControlEvent = useCallback(async (event: GestureControlEvent) => {
    setLastGestureEvent(event);

    if (event.gesture === 'POINTING_UP') {
      if (speechCooldownRef.current) return;
      speechCooldownRef.current = true;
      try {
        await processVoiceQuery(t('voice.promptExit'));
      } catch (err) {
        console.warn('Pointing exit query failed:', err);
      }
      setTimeout(() => { speechCooldownRef.current = false; }, 4000);
      return;
    }

    if (event.gesture === 'WAVE') {
      if (speechCooldownRef.current || isSpeaking) return;
      speechCooldownRef.current = true;

      const responseText = WAVE_RESPONSES[currentLang] || WAVE_RESPONSES.en;
      speak(responseText, currentLang);

      if (!pipelineCooldownRef.current) {
        pipelineCooldownRef.current = true;
        try {
          await sendMultimodal({
            text_input: `Gesture detected: WAVE - Help Request. User asked: "${responseText}"`,
            simulated_environment: {
              environment_type: 'indoor',
              noise_level: 'quiet',
              lighting: 'normal',
            },
          });
        } catch (err) {
          console.warn('Gesture pipeline send failed:', err);
        }
        setTimeout(() => { pipelineCooldownRef.current = false; }, 5000);
      }

      setTimeout(() => { speechCooldownRef.current = false; }, 4000);
    }

    if (event.gesture === 'OPEN_PALM') {
      if (speechCooldownRef.current || isSpeaking) return;
      speechCooldownRef.current = true;

      const responseText = ALERT_RESPONSES[currentLang] || ALERT_RESPONSES.en;
      speak(responseText, currentLang);

      if (!pipelineCooldownRef.current) {
        pipelineCooldownRef.current = true;
        try {
          await sendMultimodal({
            text_input: `Gesture detected: OPEN_PALM - Alert/Stop Request. Risk elevated.`,
            simulated_environment: {
              environment_type: 'indoor',
              noise_level: 'moderate',
              lighting: 'normal',
            },
          });
        } catch (err) {
          console.warn('Gesture pipeline send failed:', err);
        }
        setTimeout(() => { pipelineCooldownRef.current = false; }, 5000);
      }

      setTimeout(() => { speechCooldownRef.current = false; }, 4000);
    }
  }, [speak, isSpeaking, currentLang, sendMultimodal, processVoiceQuery, t]);

  const handleGestureSelect = async (g: GestureResult, langOverride?: LanguageCode) => {
    setLastGesture(g);
    const targetLang = langOverride || currentLang;
    speak(g.text, targetLang);

    if (g.gesture === 'pointing_up' || (g.gesture as string) === 'toilet_washroom') {
      await processVoiceQuery(t('voice.promptExit'));
    }
  };

  const simulateGesture = (item: typeof ISL_GESTURE_DICTIONARY[0]) => {
    const simulated: GestureResult = {
      gesture: item.gesture as any,
      intent: item.intent as any,
      text: item.text,
      confidence: 0.98,
      landmarks: [
        { x: 0.5, y: 0.8, z: 0 },
        { x: 0.45, y: 0.6, z: 0 },
        { x: 0.4, y: 0.4, z: 0 },
        { x: 0.5, y: 0.3, z: 0 },
        { x: 0.55, y: 0.4, z: 0 },
      ],
    };
    handleGestureSelect(simulated, item.lang);
  };

  const currentDict = activeTab === 'isl' ? ISL_GESTURE_DICTIONARY : STANDARD_GESTURE_DICTIONARY;

  return (
    <div id="gesture-assistant-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
            <Hand className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{t('gesture.title')}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                MediaPipe
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t('gesture.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showDebug
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {showDebug ? t('gesture.showDebug') : t('gesture.hideDebug')}
          </button>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('isl')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'isl' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              ISL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('standard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'standard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Universal
            </button>
          </div>
        </div>
      </div>

      {lastGestureEvent && (
        <div className={`p-4 rounded-2xl border-2 flex items-center justify-between shadow-lg transition-all ${
          lastGestureEvent.gesture === 'OPEN_PALM'
            ? 'bg-red-950/60 border-red-500/50'
            : 'bg-blue-950/60 border-blue-500/50'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
              lastGestureEvent.gesture === 'OPEN_PALM' ? 'bg-red-600/30' : 'bg-blue-600/30'
            }`}>
              {GESTURE_CONTROL_LABELS[lastGestureEvent.gesture]?.icon || '✋'}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                {GESTURE_CONTROL_LABELS[lastGestureEvent.gesture]?.intent || t('gesture.recognizedIntent')}
              </p>
              <p className="text-lg font-bold text-white">
                {lastGestureEvent.gesture === 'OPEN_PALM' ? t('gesture.alertRequest') : t('gesture.helpRequest')}
              </p>
              <p className="text-xs text-white/50">
                Hand: {lastGestureEvent.hand} | {t('gesture.confidence')}: {(lastGestureEvent.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              {lastGestureEvent.gesture === 'OPEN_PALM' ? 'Stop / Alert' : 'Assistant Activated'}
            </p>
            <p className="text-xs text-white/60">
              {isSpeaking ? t('voice.speaking') : 'Voice delivered'}
            </p>
          </div>
        </div>
      )}

      {/* Google Maps AR Walking Route Card (when active) */}
      {activeNavigationPath && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-2 border-emerald-500/80 p-4 rounded-2xl shadow-xl space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-400 animate-bounce" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                  {t('vision.walkingCorridor')}: {activeNavigationPath.targetLabel}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {activeNavigationPath.stepInstruction}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-500/40">
              📍 {activeNavigationPath.targetDistanceMeters.toFixed(1)}m • {activeNavigationPath.clockDirection.split(' ')[0]}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">{t('vision.headingAngle')}</span>
              <p className="font-bold text-white mt-0.5 font-mono">
                {activeNavigationPath.turnAngleDeg > 0 ? `+${activeNavigationPath.turnAngleDeg}° (Right)` : activeNavigationPath.turnAngleDeg < 0 ? `${activeNavigationPath.turnAngleDeg}° (Left)` : '0° (Straight)'}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">{t('vision.estimatedStrides')}</span>
              <p className="font-bold text-white mt-0.5">
                🚶 {activeNavigationPath.stepCountEstimated} {t('vision.steps')}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">{t('common.status')}</span>
              <p className={`font-bold mt-0.5 ${activeNavigationPath.isPathClear ? 'text-emerald-400' : 'text-amber-400'}`}>
                {activeNavigationPath.isPathClear ? `✓ ${t('vision.pathClear')}` : `⚠️ ${t('vision.pathBlocked')}`}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">{t('vision.clockHeading')}</span>
              <p className="font-bold text-blue-300 mt-0.5">
                🕐 {activeNavigationPath.clockDirection}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <GestureDetector
            onGestureSelect={(g) => handleGestureSelect(g)}
            onGestureControlEvent={handleGestureControlEvent}
            showDebug={showDebug}
          />

          {lastGesture && (
            <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{GESTURE_ICONS[lastGesture.gesture] || '✋'}</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    {t('gesture.speakSign')}
                  </p>
                  <p className="text-sm font-bold text-white">{lastGesture.text}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => speak(lastGesture.text, currentLang)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" /> {t('common.readAloud')}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-xs font-bold text-white">{t('gesture.openPalm')}</p>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('gesture.emergencyStop')}
              </p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Hand className="w-4 h-4 text-blue-400" />
                <p className="text-xs font-bold text-white">{t('gesture.wave')}</p>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('gesture.helpRequest')}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {activeTab === 'isl' ? t('gesture.islSigns') : t('gesture.universalSigns')}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t('gesture.subtitle')}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {currentDict.map((item) => (
                <button
                  key={item.gesture}
                  type="button"
                  onClick={() => simulateGesture(item)}
                  className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500 text-left transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-white">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.text}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    item.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
                    item.risk === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.intent}
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
