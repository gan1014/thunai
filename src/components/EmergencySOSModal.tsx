import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Copy,
  Check,
  PhoneCall,
  MapPin,
  ExternalLink,
  X,
  AlertTriangle,
  Radio,
  Clock,
  Battery,
  MessageSquare,
  Send,
  RotateCcw,
  CheckCircle2,
  History,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { emergencyManager, SOSSnapshot } from '../services/emergencyManager';
import { api } from '../api/client';
import type { EmergencyContact, EmergencyEvent, LanguageCode } from '../types';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedHazard?: string;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  detectedHazard = 'Immediate safety hazard / disorientation reported',
}) => {
  const { t, i18n } = useTranslation();
  const { profile } = useProfile();
  const { speak, stop: stopSpeech } = useSpeechSynthesis();

  const [sosSnapshot, setSosSnapshot] = useState<SOSSnapshot>(emergencyManager.getSnapshot());
  const [sirenActive, setSirenActive] = useState(false);
  const [strobeEnabled, setStrobeEnabled] = useState(true);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'contacts' | 'history'>('active');
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [eventHistory, setEventHistory] = useState<EmergencyEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenTimerRef = useRef<any>(null);

  // Subscribe to EmergencyManager state machine
  useEffect(() => {
    const unsub = emergencyManager.subscribe((snap) => {
      setSosSnapshot(snap);
    });
    return unsub;
  }, []);

  // Fetch emergency contacts & event logs when modal opens
  useEffect(() => {
    if (isOpen) {
      api.getEmergencyContacts(profile.id || 1).then((res) => {
        if (res?.contacts) setContacts(res.contacts);
      }).catch(() => {});

      fetchHistory();
    }
  }, [isOpen, profile.id]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getEmergencyEvents();
      if (res?.events) setEventHistory(res.events);
    } catch (e) {
    } finally {
      setLoadingHistory(false);
    }
  };

  // Audio Siren generator using Web Audio API
  useEffect(() => {
    if (!isOpen || !sirenActive || sosSnapshot.state === 'IDLE' || sosSnapshot.state === 'RESOLVED' || sosSnapshot.state === 'CANCELLED') {
      if (sirenTimerRef.current) {
        clearInterval(sirenTimerRef.current);
        sirenTimerRef.current = null;
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    audioCtxRef.current = new AudioCtx();
    const ctx = audioCtxRef.current;

    const playSirenPulse = () => {
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.linearRampToValueAtTime(920, now + 0.35);
      osc.frequency.linearRampToValueAtTime(580, now + 0.7);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    };

    playSirenPulse();
    sirenTimerRef.current = setInterval(playSirenPulse, 900);

    return () => {
      if (sirenTimerRef.current) {
        clearInterval(sirenTimerRef.current);
        sirenTimerRef.current = null;
      }
      if (ctx && ctx.state !== 'closed') {
        try {
          ctx.close();
        } catch (e) {}
      }
    };
  }, [isOpen, sirenActive, sosSnapshot.state]);

  if (!isOpen) return null;

  const loc = sosSnapshot.location;
  const locText = loc
    ? `Lat ${loc.latitude}, Lng ${loc.longitude} (±${loc.accuracyMeters}m)`
    : t('common.loading');
  const mapsUrl = loc?.mapsUrl || (loc ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}` : '#');

  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0] || {
    name: 'Dr. Ramesh S (Primary Caretaker & Physician)',
    phone: '+91 98765 43210',
    relationship: 'Caretaker',
  };

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = sosSnapshot.totalDurationSeconds > 0
    ? ((sosSnapshot.totalDurationSeconds - sosSnapshot.secondsRemaining) / sosSnapshot.totalDurationSeconds) * 100
    : 0;

  // Multi-language distress messages
  const distressMessages: Record<'en' | 'hi' | 'ta' | 'te', string> = {
    en: `EMERGENCY ALERT from THUNAI: User (${profile.name}) requires IMMEDIATE assistance. Hazard: ${detectedHazard}. Location: ${locText}. Map: ${mapsUrl}`,
    hi: `आपातकालीन सूचना (THUNAI): उपयोगकर्ता (${profile.name}) को तत्काल सहायता की आवश्यकता है। स्थिति: ${detectedHazard}। स्थान: ${locText}।`,
    ta: `அவசர எச்சரிக்கை (THUNAI): பயனர் (${profile.name}) க்கு உடனடி உதவி தேவைப்படுகிறது. அபாயம்: ${detectedHazard}. இடம்: ${locText}.`,
    te: `అత్యవసర హెచ్చరిక (THUNAI): వినియోగదారునికి (${profile.name}) తక్షణ సహాయం కావాలి. ప్రమాదం: ${detectedHazard}. స్థలం: ${locText}.`,
  };

  const handleCopy = (lang: 'en' | 'hi' | 'ta' | 'te') => {
    navigator.clipboard.writeText(distressMessages[lang]);
    setCopiedLang(lang);
    setTimeout(() => setCopiedLang(null), 2500);
  };

  const handleDisarm = () => {
    setSirenActive(false);
    stopSpeech();
    if (sosSnapshot.state !== 'IDLE' && sosSnapshot.state !== 'RESOLVED' && sosSnapshot.state !== 'CANCELLED') {
      emergencyManager.requestCancel();
    } else {
      onClose();
    }
  };

  const isEscalated = sosSnapshot.state === 'NOTIFICATION_SENT' || sosSnapshot.state === 'DELIVERY_FAILED';
  const isCountingDown = sosSnapshot.state === 'COUNTDOWN_ACTIVE' || sosSnapshot.state === 'CANCELLATION_WINDOW' || sosSnapshot.state === 'SOS_TRIGGERED';

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
    >
      <div
        className={`relative w-full max-w-2xl rounded-3xl border-4 p-5 sm:p-7 text-white shadow-2xl transition-all my-auto ${
          strobeEnabled && isCountingDown
            ? 'border-red-500 bg-gradient-to-b from-red-950 via-slate-950 to-slate-950'
            : isEscalated
            ? 'border-emerald-500/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950'
            : 'border-slate-700 bg-slate-950'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-red-800/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                isEscalated
                  ? 'bg-emerald-600 shadow-emerald-600/40'
                  : 'bg-red-600 shadow-red-600/50 animate-pulse'
              }`}
            >
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="emergency-modal-title" className="text-xl font-black uppercase tracking-wider text-red-400">
                  {isEscalated ? t('emergency.distressTriggered') : t('emergency.title')}
                </h2>
                {sosSnapshot.isTestMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-slate-950">
                    {t('emergency.testMode')} (10s)
                  </span>
                )}
                {!sosSnapshot.isTestMode && isCountingDown && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500 text-white animate-pulse">
                    {t('emergency.countdownActive')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {isEscalated
                  ? t('emergency.sosSent')
                  : t('emergency.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDisarm}
            aria-label={t('common.close')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pt-3 pb-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'active' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('common.status')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'contacts' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('emergency.emergencyContact')} ({contacts.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'history' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Log
          </button>
        </div>

        {/* TAB 1: LIVE MONITOR */}
        {activeTab === 'active' && (
          <div className="mt-4 space-y-4">
            {/* Countdown / Status Banner */}
            {isCountingDown && (
              <div className="p-5 rounded-2xl bg-red-950/40 border-2 border-red-500/70 text-center space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1 text-red-300">
                    <Clock className="w-4 h-4 text-red-400 animate-spin" />
                    {t('emergency.countdownActive')}
                  </span>
                  <span className="font-mono text-red-200">
                    {sosSnapshot.secondsRemaining}s {t('emergency.secondsRemaining')}
                  </span>
                </div>

                {/* Big Timer Display */}
                <div className="text-5xl sm:text-6xl font-black font-mono tracking-wider text-white py-1">
                  {formatTime(sosSnapshot.secondsRemaining)}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-red-500 h-full transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <p className="text-xs text-slate-300">
                  {t('emergency.cancelEmergency')}
                </p>

                {/* Cancel Confirmation Dialog */}
                {sosSnapshot.isConfirmingCancel ? (
                  <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-200 space-y-2 animate-bounce">
                    <p className="font-bold text-sm">
                      ⚠️ {t('emergency.confirmCancel')}
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => emergencyManager.confirmCancel()}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm cursor-pointer shadow-lg"
                      >
                        ✓ {t('emergency.confirmCancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => emergencyManager.abortCancel()}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => emergencyManager.requestCancel()}
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-red-500 text-white font-black text-base transition-transform active:scale-95 cursor-pointer shadow-xl flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5 text-red-400" />
                    {t('emergency.cancelEmergency')}
                  </button>
                )}
              </div>
            )}

            {/* Post-Escalation Banner */}
            {isEscalated && (
              <div className="p-5 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-base font-black uppercase text-emerald-300">
                      {t('emergency.sosSent')}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-500/40">
                    {sosSnapshot.eventId || 'THN-ESCALATED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">SMS Channel</span>
                    <p className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      ✓ {sosSnapshot.activeEvent?.smsStatus || t('emergency.smsDispatched')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">WhatsApp Channel</span>
                    <p className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      ✓ {sosSnapshot.activeEvent?.whatsappStatus || t('emergency.whatsappDispatched')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{t('emergency.telemetry')}</span>
                    <p className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      ✓ {t('common.active')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Battery Status</span>
                    <p className="font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                      <Battery className="w-3.5 h-3.5 text-emerald-400" /> {sosSnapshot.batteryPct}%
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">{t('emergency.contactNotified')}:</span>
                    <p className="font-bold text-white">
                      {primaryContact.name} ({primaryContact.phone})
                    </p>
                  </div>
                  <a
                    href={`tel:${primaryContact.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call
                  </a>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                  >
                    {t('emergency.telemetry')} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      emergencyManager.resolveEmergency();
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            )}

            {/* Controls: Siren, Strobe, Test Mode Trigger */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSirenActive(!sirenActive)}
                className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-colors cursor-pointer border ${
                  sirenActive
                    ? 'bg-red-600/30 border-red-500 text-red-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {sirenActive ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4" />}
                <span>{sirenActive ? 'Siren Mute' : 'Audio Siren'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStrobeEnabled(!strobeEnabled)}
                className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-colors cursor-pointer border ${
                  strobeEnabled
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>{strobeEnabled ? 'Visual Strobe On' : 'Strobe Off'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!sosSnapshot.isTestMode) {
                    emergencyManager.triggerSOS('TEST_MODE', true, 10);
                  } else {
                    emergencyManager.resetToIdle();
                  }
                }}
                className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-colors cursor-pointer border ${
                  sosSnapshot.isTestMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-indigo-600/30 border-indigo-500 text-indigo-300 hover:bg-indigo-600/50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{sosSnapshot.isTestMode ? 'Exit Test Mode' : 'Test Mode (10s)'}</span>
              </button>
            </div>

            {/* Geolocation Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('emergency.latLong')}
                  </p>
                  <p className="text-xs font-mono font-bold text-white">{locText}</p>
                </div>
              </div>

              {loc && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-xs font-bold text-white flex items-center gap-1 transition-colors"
                >
                  Map <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Multi-language SMS Cards */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1-Click Multi-language SMS Distress Cards
              </p>

              {(['en', 'ta', 'te', 'hi'] as const).map((lang) => {
                const langLabel = lang === 'en' ? 'English' : lang === 'ta' ? 'Tamil (தமிழ்)' : lang === 'te' ? 'Telugu (తెలుగు)' : 'Hindi (हिन्दी)';
                const isCopied = copiedLang === lang;
                return (
                  <div
                    key={lang}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5 pr-2">
                      <span className="font-bold text-red-400 uppercase text-[10px]">{langLabel}</span>
                      <p className="text-slate-300 leading-relaxed font-sans text-[11px] line-clamp-2">
                        {distressMessages[lang]}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleCopy(lang)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? t('common.copied') : t('common.copy')}</span>
                      </button>

                      <a
                        href={`sms:${primaryContact.phone}?body=${encodeURIComponent(distressMessages[lang])}`}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1 transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{t('common.send')}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* National Dispatch Hotlines */}
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <a
                href="tel:112"
                className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-200 flex flex-col items-center justify-center text-center transition-colors"
              >
                <span className="text-sm font-black text-red-400">112</span>
                <span className="text-[9px] font-bold">National SOS</span>
              </a>
              <a
                href="tel:108"
                className="p-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 flex flex-col items-center justify-center text-center transition-colors"
              >
                <span className="text-sm font-black text-amber-400">108</span>
                <span className="text-[9px] font-bold">Ambulance</span>
              </a>
              <a
                href="tel:1091"
                className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 flex flex-col items-center justify-center text-center transition-colors"
              >
                <span className="text-sm font-black text-purple-400">1091</span>
                <span className="text-[9px] font-bold">Helpline</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: CONTACTS */}
        {activeTab === 'contacts' && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-400 font-bold uppercase">
              {t('emergency.emergencyContact')}
            </p>
            {contacts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{c.name}</span>
                    {c.is_primary && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {c.relationship} • <span className="font-mono text-slate-300">{c.phone}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${c.phone}`}
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: EVENT HISTORY LOG */}
        {activeTab === 'history' && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-400 font-bold uppercase">
              Audit History Log
            </p>
            {loadingHistory ? (
              <p className="text-xs text-slate-500">{t('common.loading')}</p>
            ) : eventHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No emergency events logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {eventHistory.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-red-400">{ev.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          ev.status === 'RESOLVED'
                            ? 'bg-emerald-900/60 text-emerald-300'
                            : ev.status === 'CANCELLED'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-red-900/60 text-red-300'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                    <p className="text-slate-300">
                      Trigger: <strong>{ev.triggerMethod}</strong> • Battery: {ev.battery}% • Accuracy: ±{ev.accuracyMeters}m
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Started: {new Date(ev.startedAt).toLocaleString('en-IN')}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-400">
                        SMS: <span className="text-emerald-400 font-bold">{ev.smsStatus}</span> | WA: <span className="text-emerald-400 font-bold">{ev.whatsappStatus}</span>
                      </span>
                      <a
                        href={ev.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold"
                      >
                        Map <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-5">
          <p className="text-xs text-slate-500">
            {t('app.footer')}
          </p>

          <button
            type="button"
            onClick={handleDisarm}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {isEscalated ? t('common.close') : t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
