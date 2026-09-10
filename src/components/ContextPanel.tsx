import React from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Shield, Compass, Volume2, Sun, Layers, Sparkles } from 'lucide-react';
import { DetectedObject, IntentResult, OutputModality, RiskResult } from '../types';

interface ContextPanelProps {
  objects?: DetectedObject[];
  intent?: IntentResult;
  risk?: RiskResult;
  environment?: 'indoor' | 'outdoor' | 'transit' | 'medical';
  noiseLevel?: 'quiet' | 'moderate' | 'noisy';
  lighting?: 'bright' | 'normal' | 'dim';
  selectedModality?: OutputModality;
  onEnvironmentChange?: (env: 'indoor' | 'outdoor' | 'transit' | 'medical') => void;
  onNoiseChange?: (noise: 'quiet' | 'moderate' | 'noisy') => void;
  className?: string;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  objects = [],
  intent,
  risk,
  environment = 'indoor',
  noiseLevel = 'quiet',
  lighting = 'normal',
  selectedModality = 'voice',
  onEnvironmentChange,
  onNoiseChange,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div
      id="context-awareness-panel"
      className={`bg-slate-900 border border-slate-700/70 rounded-2xl p-4 shadow-xl flex flex-col gap-4 ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-200">Fused Situational Context</h3>
        </div>
        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {t('common.active')}
        </span>
      </div>

      {/* Grid of Key Context Gauges */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Intent */}
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">{t('gesture.recognizedIntent')}</span>
          </div>
          <p className="font-bold text-slate-100 uppercase tracking-wide">
            {intent ? intent.primary_intent : t('common.loading')}
          </p>
          {intent && (
            <p className="text-slate-400 text-[10px] mt-0.5">
              {t('gesture.confidence')}: {(intent.confidence * 100).toFixed(0)}%
            </p>
          )}
        </div>

        {/* Risk */}
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">{t('common.status')}</span>
          </div>
          <p
            className={`font-bold uppercase tracking-wide ${
              risk?.risk_level === 'critical'
                ? 'text-red-400'
                : risk?.risk_level === 'high'
                ? 'text-orange-400'
                : 'text-emerald-400'
            }`}
          >
            {risk ? `${risk.risk_level} Risk` : 'Low Risk'}
          </p>
          {risk && (
            <p className="text-slate-400 text-[10px] mt-0.5">
              Index: {(risk.risk_score * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>

      {/* Environmental Simulation Knobs */}
      <div className="space-y-2 pt-1 border-t border-slate-800 text-xs">
        <p className="font-semibold text-slate-300 text-xs flex items-center justify-between">
          <span>Environment Controls:</span>
          <span className="text-[10px] text-indigo-400">AARE Engine</span>
        </p>

        {/* Environment Type Selector */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-slate-400 text-[11px]">Domain:</span>
          <div className="flex items-center gap-1">
            {(['indoor', 'outdoor', 'transit', 'medical'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => onEnvironmentChange?.(env)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  environment === env
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        </div>

        {/* Acoustic Noise Selector */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-slate-400" /> {t('voice.noiseLevel')}:
          </span>
          <div className="flex items-center gap-1">
            {(['quiet', 'moderate', 'noisy'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onNoiseChange?.(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  noiseLevel === lvl
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Spatial Object Checklist */}
      <div className="pt-2 border-t border-slate-800 text-xs">
        <p className="font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
          <span>{t('vision.hazardsTracked')}:</span>
          <span className="text-slate-500 font-mono text-[10px]">{objects.length} entities</span>
        </p>
        <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
          {objects.length === 0 ? (
            <p className="text-slate-500 text-[11px] italic">{t('vision.pathClear')}</p>
          ) : (
            objects.map((obj, i) => {
              const isClose = obj.spatial?.proximity === 'VERY_NEAR' || obj.distance_meters < 1.8;
              const isApproaching = obj.spatial?.movement === 'APPROACHING';
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-[11px] ${
                    isClose
                      ? 'bg-red-950/30 border-red-500/40'
                      : 'bg-slate-800/60 border-slate-700/40'
                  }`}
                >
                  <span className="font-medium text-slate-200 capitalize">
                    {obj.label.replace('_', ' ')}
                    {isApproaching && <span className="ml-1 text-amber-400 font-bold text-[9px]">APPR</span>}
                  </span>
                  <div className="flex items-center gap-1">
                    {obj.spatial?.direction && obj.spatial.direction !== 'CENTER' && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                        {obj.spatial.direction.replace('_', ' ')}
                      </span>
                    )}
                    <span
                      className={`font-mono text-[10px] ${
                        isClose ? 'text-red-400 font-bold' : 'text-emerald-400'
                      }`}
                    >
                      {obj.distance_meters.toFixed(1)}m
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
