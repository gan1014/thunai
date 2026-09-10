import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Sparkles, Upload, Compass, AlertTriangle, ShieldCheck, Volume2, Navigation, ArrowDown, ArrowUp, Minus, MapPin } from 'lucide-react';
import { CameraFeed } from '../components/CameraFeed';
import { SpatialRadar } from '../components/SpatialRadar';
import { ScenarioSimulatorBar, ScenarioPreset } from '../components/ScenarioSimulatorBar';
import { useAssistant } from '../context/AssistantContext';
import { api } from '../api/client';
import { DetectedObject } from '../types';

export const VisionAssistant: React.FC = () => {
  const { t } = useTranslation();
  const { sonarActive, toggleSonar } = useAssistant();
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [sceneDesc, setSceneDesc] = useState<string>('');
  const [relations, setRelations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const directionBadges: Record<string, { label: string; color: string }> = {
    FAR_LEFT: { label: t('spatial.farLeft'), color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    LEFT: { label: t('spatial.left'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    CENTER: { label: t('spatial.straightAhead'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    RIGHT: { label: t('spatial.right'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    FAR_RIGHT: { label: t('spatial.farRight'), color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  };

  const proximityBadges: Record<string, { label: string; color: string }> = {
    VERY_NEAR: { label: 'VERY CLOSE', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    NEAR: { label: 'NEAR', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    MEDIUM: { label: 'MEDIUM', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    FAR: { label: 'FAR', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    UNKNOWN: { label: 'UNKNOWN', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  };

  const movementBadges: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    APPROACHING: { label: 'APPROACHING', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <ArrowDown className="w-3 h-3" /> },
    MOVING_AWAY: { label: 'MOVING AWAY', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <ArrowUp className="w-3 h-3" /> },
    STATIONARY: { label: 'STATIONARY', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <Minus className="w-3 h-3" /> },
    UNKNOWN: { label: 'UNKNOWN', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: null },
  };

  const handleFrame = async (base64: string) => {
    setIsLoading(true);
    try {
      const res = await api.describeScene(base64);
      setDetections(res.objects || []);
      setSceneDesc(res.description || '');
      setRelations(res.spatial_relations?.relations || []);
    } catch (err) {
      console.error('Vision analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScenario = async (preset: ScenarioPreset) => {
    setIsLoading(true);
    try {
      if (preset.id === 'hospital-stairs') {
        setDetections([
          { label: 'stairs_downward', confidence: 0.94, bbox: [0.35, 0.4, 0.65, 0.9], distance_meters: 1.2 },
          { label: 'warning_sign', confidence: 0.89, bbox: [0.15, 0.2, 0.35, 0.5], distance_meters: 1.8 },
        ]);
        setSceneDesc('Downstairs hazard detected 1.2 meters directly ahead with slippery floor warning. Immediate caution advised.');
        setRelations(['stairs_downward is directly in front of you (1.2m)', 'warning_sign is to your left (1.8m)']);
      } else if (preset.id === 'metro-platform') {
        setDetections([
          { label: 'train', confidence: 0.96, bbox: [0.55, 0.1, 0.95, 0.8], distance_meters: 4.2 },
          { label: 'platform_edge', confidence: 0.92, bbox: [0.4, 0.6, 0.9, 0.9], distance_meters: 1.4 },
        ]);
        setSceneDesc('Approaching rapid transit train on right track. Platform edge tactile strip 1.4 meters to your right.');
        setRelations(['platform_edge is 1.4m to your right', 'train is 4.2m ahead on track']);
      } else if (preset.id === 'emergency-exit') {
        setDetections([
          { label: 'emergency_door', confidence: 0.95, bbox: [0.4, 0.15, 0.62, 0.85], distance_meters: 2.3 },
          { label: 'exit_sign', confidence: 0.98, bbox: [0.45, 0.05, 0.58, 0.18], distance_meters: 2.3 },
        ]);
        setSceneDesc('Green illuminated emergency exit double door located 2.3 meters straight ahead with clear pathway.');
        setRelations(['emergency_door is centered straight ahead (2.3m)', 'exit_sign is above doorframe']);
      } else {
        setDetections([
          { label: 'obstacle', confidence: 0.88, bbox: [0.4, 0.3, 0.6, 0.7], distance_meters: 1.9 },
        ]);
        setSceneDesc(`Target subject in ${preset.environment} setting detected. Path partially obstructed at 1.9 meters.`);
        setRelations(['obstacle is 1.9m ahead']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleFrame(base64);
    };
    reader.readAsDataURL(file);
  };

  const approachingCount = detections.filter((d) => d.spatial?.movement === 'APPROACHING').length;
  const veryNearCount = detections.filter((d) => d.spatial?.proximity === 'VERY_NEAR').length;

  return (
    <div id="vision-assistant-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{t('vision.title')}</h1>
            <p className="text-xs text-slate-400">
              {t('vision.subtitle')}
            </p>
          </div>
        </div>

        <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-colors border border-slate-700">
          <Upload className="w-4 h-4" /> {t('common.details')}
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {(approachingCount > 0 || veryNearCount > 0) && (
        <div className="p-4 bg-red-950/40 border-2 border-red-500/50 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-300">
              {veryNearCount > 0 && `${veryNearCount} object(s) VERY CLOSE`}
              {veryNearCount > 0 && approachingCount > 0 && ' | '}
              {approachingCount > 0 && `${approachingCount} object(s) APPROACHING`}
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">{t('vision.hazardWarning')}</p>
          </div>
        </div>
      )}

      <ScenarioSimulatorBar
        onSelectScenario={handleSelectScenario}
        isProcessing={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <CameraFeed
            detections={detections}
            onDetectionsChange={(liveDets) => {
              setDetections(liveDets);
              if (!sceneDesc && liveDets.length > 0) {
                const nearest = [...liveDets].sort((a, b) => a.distance_meters - b.distance_meters)[0];
                const dir = nearest.spatial?.direction ? ` on ${nearest.spatial.direction.toLowerCase().replace('_', ' ')}` : '';
                setSceneDesc(
                  `Real-time tracking: Detected ${liveDets.length} object(s). Nearest is ${nearest.label.replace('_', ' ')} at ${nearest.distance_meters.toFixed(1)} meters${dir}.`
                );
              }
            }}
            onFrame={handleFrame}
            processingInterval={1800}
            autoStart
          />

          <SpatialRadar
            objects={detections}
            sonarActive={sonarActive}
            onToggleSonar={toggleSonar}
          />
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('vision.scanScene')}</h3>
            </div>
            <p className="text-sm font-medium text-slate-200 leading-relaxed">
              {sceneDesc || t('vision.scanScene')}
            </p>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 text-blue-400 mb-3">
              <Compass className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('vision.direction')}</h3>
            </div>

            <div className="space-y-2">
              {relations.length === 0 ? (
                <p className="text-xs text-slate-500 italic">{t('vision.pathClear')}</p>
              ) : (
                relations.map((rel, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <span>{rel}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {t('vision.hazardsTracked')} ({detections.length})
            </h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {detections.length === 0 ? (
                <p className="text-xs text-slate-500 italic">{t('vision.pathClear')}</p>
              ) : (
                detections.map((d, i) => {
                  const isClose = d.spatial?.proximity === 'VERY_NEAR' || d.distance_meters < 1.8;
                  const isMedium = d.spatial?.proximity === 'NEAR' || d.distance_meters < 3.2;
                  const dirBadge = d.spatial?.direction ? directionBadges[d.spatial.direction] : null;
                  const proxBadge = d.spatial?.proximity ? proximityBadges[d.spatial.proximity] : null;
                  const movBadge = d.spatial?.movement ? movementBadges[d.spatial.movement] : null;

                  return (
                    <div
                      key={d.spatial?.id || i}
                      className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        isClose
                          ? 'bg-red-950/30 border-red-500/40'
                          : isMedium
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-800/60 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isClose ? (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          )}
                          <span className="font-semibold text-white capitalize text-sm">
                            {d.label.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">
                            {(d.confidence * 100).toFixed(0)}%
                          </span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            isClose
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isMedium
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {d.distance_meters.toFixed(1)}m
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {dirBadge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${dirBadge.color}`}>
                            <MapPin className="w-2.5 h-2.5 inline mr-0.5" />
                            {dirBadge.label}
                          </span>
                        )}
                        {proxBadge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${proxBadge.color}`}>
                            {proxBadge.label}
                          </span>
                        )}
                        {movBadge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-0.5 ${movBadge.color}`}>
                            {movBadge.icon}
                            {movBadge.label}
                          </span>
                        )}
                        {d.spatial?.relativeSpeedMps != null && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold border bg-slate-500/20 text-slate-400 border-slate-500/30">
                            {Math.abs(d.spatial.relativeSpeedMps).toFixed(1)} m/s
                          </span>
                        )}
                        {d.spatial?.trackActive && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold border bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                            TRACK #{d.spatial.id.split('_').pop()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
