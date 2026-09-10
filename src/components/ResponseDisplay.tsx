import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Sparkles, ChevronDown, ChevronUp, Shield, Cpu, Zap, Copy, Check, ArrowDown, ArrowUp, Minus, MapPin } from 'lucide-react';
import { AssistantResponse, LanguageCode } from '../types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { getTextSizeClass, riskColor } from '../utils/helpers';

interface ResponseDisplayProps {
  response: AssistantResponse | null;
  className?: string;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response, className = '' }) => {
  const { t, i18n } = useTranslation();
  const { speak, stop, isSpeaking } = useSpeechSynthesis();
  const [showTrace, setShowTrace] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentLang = (i18n.language as LanguageCode) || response?.language || 'en';

  useEffect(() => {
    if (response && response.display_config.auto_read) {
      speak(response.voice_text || response.text, currentLang);
    }
  }, [response, speak, currentLang]);

  if (!response) {
    return (
      <div
        id="response-display-placeholder"
        className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500 ${className}`}
      >
        <Cpu className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-base font-medium text-slate-400">{t('app.aareAi')} • {t('app.realTimeReady')}</p>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          {t('voice.subtitle')}
        </p>
      </div>
    );
  }

  const riskStyles = riskColor(response.risk.risk_level);
  const textSizeClass = getTextSizeClass(response.display_config.text_size);

  const handleCopy = () => {
    navigator.clipboard.writeText(response.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="response-display-card"
      className={`bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 ${
        response.display_config.high_contrast ? 'ring-2 ring-yellow-400 bg-black text-white' : ''
      } ${className}`}
      aria-live="polite"
    >
      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/60 text-blue-300 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AAS Score: {response.aas_score}/100</span>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/50 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            {response.modality} output
          </div>

          <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${riskStyles.badge}`}>
            {response.risk.risk_level} risk
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{response.latency_ms} ms</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-2">
        {response.modality === 'visual' ? (
          <div className="p-4 bg-yellow-400/10 border-2 border-yellow-400 rounded-xl">
            <p className="text-xl md:text-3xl font-black text-yellow-300 tracking-wide uppercase leading-snug">
              {response.visual_text}
            </p>
            <p className="text-sm text-slate-300 mt-2 font-medium">{response.text}</p>
          </div>
        ) : (
          <div className={`${textSizeClass} font-semibold text-slate-100 tracking-normal`}>
            {response.text}
          </div>
        )}
      </div>

      {/* Detected Objects */}
      {response.detected_objects && response.detected_objects.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-400 font-medium mr-1">{t('vision.hazardsTracked')}:</span>
          {response.detected_objects.map((obj, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-1"
            >
              <span>{obj.label.replace('_', ' ')}</span>
              <span className="text-slate-500 font-mono">({obj.distance_meters.toFixed(1)}m)</span>
              {obj.spatial?.direction && obj.spatial.direction !== 'CENTER' && (
                <span className="px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-bold">
                  <MapPin className="w-2 h-2 inline mr-0.5" />
                  {obj.spatial.direction.replace('_', ' ')}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) stop();
              else speak(response.voice_text || response.text, currentLang);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isSpeaking ? t('voice.stopSpeech') : t('common.readAloud')}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowTrace((prev) => !prev)}
          className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
        >
          <span>AARE Reasoning Trace</span>
          {showTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Reasoning Trace */}
      {showTrace && (
        <div className="mt-2 p-4 bg-slate-950/90 rounded-xl border border-indigo-900/60 font-mono text-xs text-indigo-300 space-y-1.5 overflow-x-auto shadow-inner">
          <p className="font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Cpu className="w-4 h-4" /> Explainable Adaptive Reasoning Steps:
          </p>
          {response.reasoning_trace.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-slate-500 flex-shrink-0">[{idx + 1}]</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
