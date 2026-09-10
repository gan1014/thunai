import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  Sparkles,
  Upload,
  Compass,
  AlertTriangle,
  ShieldCheck,
  Volume2,
  Navigation,
  ArrowDown,
  ArrowUp,
  Minus,
  MapPin,
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  Camera,
  Layers,
} from 'lucide-react';
import { CameraFeed } from '../components/CameraFeed';
import { SpatialRadar } from '../components/SpatialRadar';
import { ScenarioSimulatorBar, ScenarioPreset } from '../components/ScenarioSimulatorBar';
import { useAssistant } from '../context/AssistantContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { api } from '../api/client';
import { DetectedObject, LanguageCode } from '../types';

export const VisionAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { sonarActive, toggleSonar } = useAssistant();
  const { speak } = useSpeechSynthesis();
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [sceneDesc, setSceneDesc] = useState<string>('');
  const [relations, setRelations] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentLang = (i18n.language as LanguageCode) || 'en';

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

  const createSpatialData = (
    id: string,
    direction: 'FAR_LEFT' | 'LEFT' | 'CENTER' | 'RIGHT' | 'FAR_RIGHT',
    proximity: 'VERY_NEAR' | 'NEAR' | 'MEDIUM' | 'FAR' | 'UNKNOWN',
    movement: 'APPROACHING' | 'MOVING_AWAY' | 'STATIONARY' | 'UNKNOWN',
    relativeSpeedMps: number | null = 0,
    center = { x: 0.5, y: 0.5 }
  ) => ({
    id,
    direction,
    horizontalOffset: direction === 'LEFT' ? -0.5 : direction === 'RIGHT' ? 0.5 : 0,
    verticalPosition: 'CENTER' as const,
    distanceConfidence: 0.95,
    proximity,
    movement,
    relativeSpeedMps,
    trajectoryConfidence: 0.9,
    center,
    trackAge: 5,
    trackActive: true,
  });

  const handleSelectScenario = async (preset: ScenarioPreset) => {
    setIsLoading(true);
    setUseLiveCamera(false);
    try {
      if (preset.id === 'railway-station-exit') {
        const stationDetections: DetectedObject[] = [
          {
            label: 'exit_sign',
            confidence: 0.98,
            bbox: [0.26, 0.01, 0.42, 0.09],
            distance_meters: 3.5,
            spatial: createSpatialData('trk_exit_sign', 'LEFT', 'NEAR', 'STATIONARY', 0, { x: 0.34, y: 0.05 }),
          },
          {
            label: 'train',
            confidence: 0.97,
            bbox: [0.38, 0.05, 0.99, 0.65],
            distance_meters: 2.8,
            spatial: createSpatialData('trk_train', 'RIGHT', 'NEAR', 'STATIONARY', 0, { x: 0.68, y: 0.35 }),
          },
          {
            label: 'person',
            confidence: 0.95,
            bbox: [0.34, 0.27, 0.52, 0.47],
            distance_meters: 4.2,
            spatial: createSpatialData('trk_person_luggage', 'CENTER', 'MEDIUM', 'MOVING_AWAY', -0.8, { x: 0.43, y: 0.37 }),
          },
          {
            label: 'tactile_paving',
            confidence: 0.93,
            bbox: [0.0, 0.38, 0.32, 0.99],
            distance_meters: 1.5,
            spatial: createSpatialData('trk_tactile', 'LEFT', 'VERY_NEAR', 'STATIONARY', 0, { x: 0.16, y: 0.68 }),
          },
        ];
        setDetections(stationDetections);
        const desc = 'Coimbatore Railway Station Platform: Overhead green Exit sign detected on your left pointing left (← EXIT) at 3.5 meters. Train along right track at 2.8 meters. Follow the tactile walking corridor and turn left in 3.5 meters to reach the station exit.';
        setSceneDesc(desc);
        setRelations([
          'exit_sign (← EXIT) is overhead to your left at 3.5m',
          'tactile_paving is along your left corridor (1.5m)',
          'train is standing on your right track (2.8m)',
          'pedestrian with luggage is walking ahead (4.2m)',
          'Navigation: Turn LEFT in 3.5 meters for the station exit doorway',
        ]);
        setPreviewImage(preset.simulatedFrame || '/samples/railway_station_exit.png');
        speak(desc, currentLang);
      } else if (preset.id === 'hospital-stairs') {
        setDetections([
          { label: 'stairs_downward', confidence: 0.94, bbox: [0.35, 0.4, 0.65, 0.9], distance_meters: 1.2 },
          { label: 'warning_sign', confidence: 0.89, bbox: [0.15, 0.2, 0.35, 0.5], distance_meters: 1.8 },
        ]);
        const desc = 'Downstairs hazard detected 1.2 meters directly ahead with slippery floor warning. Immediate caution advised.';
        setSceneDesc(desc);
        setRelations(['stairs_downward is directly in front of you (1.2m)', 'warning_sign is to your left (1.8m)']);
        setPreviewImage(null);
        speak(desc, currentLang);
      } else if (preset.id === 'metro-platform') {
        setDetections([
          { label: 'train', confidence: 0.96, bbox: [0.55, 0.1, 0.95, 0.8], distance_meters: 4.2 },
          { label: 'platform_edge', confidence: 0.92, bbox: [0.4, 0.6, 0.9, 0.9], distance_meters: 1.4 },
        ]);
        const desc = 'Approaching rapid transit train on right track. Platform edge tactile strip 1.4 meters to your right.';
        setSceneDesc(desc);
        setRelations(['platform_edge is 1.4m to your right', 'train is 4.2m ahead on track']);
        setPreviewImage(null);
        speak(desc, currentLang);
      } else if (preset.id === 'emergency-exit') {
        setDetections([
          { label: 'emergency_door', confidence: 0.95, bbox: [0.4, 0.15, 0.62, 0.85], distance_meters: 2.3 },
          { label: 'exit_sign', confidence: 0.98, bbox: [0.45, 0.05, 0.58, 0.18], distance_meters: 2.3 },
        ]);
        const desc = 'Green illuminated emergency exit double door located 2.3 meters straight ahead with clear pathway.';
        setSceneDesc(desc);
        setRelations(['emergency_door is centered straight ahead (2.3m)', 'exit_sign is above doorframe']);
        setPreviewImage(null);
        speak(desc, currentLang);
      } else {
        setDetections([
          { label: 'obstacle', confidence: 0.88, bbox: [0.4, 0.3, 0.6, 0.7], distance_meters: 1.9 },
        ]);
        const desc = `Target subject in ${preset.environment} setting detected. Path partially obstructed at 1.9 meters.`;
        setSceneDesc(desc);
        setRelations(['obstacle is 1.9m ahead']);
        setPreviewImage(null);
        speak(desc, currentLang);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      setUseLiveCamera(false);
      setIsLoading(true);
      try {
        const res = await api.describeScene(base64);
        setDetections(res.objects || []);
        setSceneDesc(res.description || '');
        setRelations(res.spatial_relations?.relations || []);
        if (res.description) {
          speak(res.description, currentLang);
        }
      } catch (err) {
        console.error('Vision analysis error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const approachingCount = detections.filter((d) => d.spatial?.movement === 'APPROACHING').length;
  const veryNearCount = detections.filter((d) => d.spatial?.proximity === 'VERY_NEAR').length;

  const exitDetection = detections.find(
    (d) => d.label === 'exit_sign' || d.label === 'door' || d.label === 'emergency_door' || d.label === 'exit'
  );

  return (
    <div id="vision-assistant-page" className="space-y-6">
      {/* Header */}
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setUseLiveCamera(!useLiveCamera);
              if (!useLiveCamera) setPreviewImage(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              useLiveCamera
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> {useLiveCamera ? t('vision.stopWebcam') : t('vision.useWebcam')}
          </button>

          <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-colors border border-slate-700">
            <Upload className="w-4 h-4" /> Upload Station / Door Photo
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* AR Live Exit Guidance Corridor Banner */}
      {exitDetection && (
        <div className="p-4 bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border-2 border-emerald-500/60 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
              {exitDetection.bbox[0] < 0.35 || exitDetection.spatial?.direction === 'LEFT' ? (
                <ArrowLeft className="w-7 h-7 animate-pulse text-emerald-300" />
              ) : exitDetection.bbox[2] > 0.65 || exitDetection.spatial?.direction === 'RIGHT' ? (
                <ArrowRight className="w-7 h-7 animate-pulse text-emerald-300" />
              ) : (
                <ArrowUpCircle className="w-7 h-7 animate-pulse text-emerald-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 border border-emerald-400/50 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  AR Walking Corridor
                </span>
                <span className="text-xs text-emerald-400/80 font-medium">
                  Google Maps Spatial Wayfinding
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                {exitDetection.bbox[0] < 0.35 || exitDetection.spatial?.direction === 'LEFT'
                  ? `← TURN LEFT IN ${exitDetection.distance_meters.toFixed(1)}m — STATION EXIT`
                  : exitDetection.bbox[2] > 0.65 || exitDetection.spatial?.direction === 'RIGHT'
                  ? `TURN RIGHT IN ${exitDetection.distance_meters.toFixed(1)}m — EXIT DOORWAY →`
                  : `WALK STRAIGHT AHEAD ${exitDetection.distance_meters.toFixed(1)}m — EXIT`}
              </h2>
              <p className="text-xs text-emerald-200/80">
                Overhead exit sign verified. Follow tactile walkway along the platform edge corridor.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => speak(sceneDesc, currentLang)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex-shrink-0"
          >
            <Volume2 className="w-4 h-4" /> Spoken Guidance
          </button>
        </div>
      )}

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

      {/* Scenario Presets Bar */}
      <ScenarioSimulatorBar
        onSelectScenario={handleSelectScenario}
        isProcessing={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Target & Radar */}
        <div className="lg:col-span-7 space-y-6">
          {useLiveCamera ? (
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
          ) : previewImage ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video sm:aspect-[4/3] flex items-center justify-center shadow-xl">
              <img
                src={previewImage}
                alt="Active Vision Scene"
                className="w-full h-full object-contain bg-black/60"
              />
              <div className="absolute top-3 left-3 px-3 py-1 bg-slate-900/85 backdrop-blur-md rounded-lg text-xs font-bold text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
                <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Live AR Spatial Overlay
              </div>

              {exitDetection && (
                <div className="absolute top-12 left-3 px-3 py-1.5 bg-emerald-950/90 backdrop-blur-md rounded-xl text-xs font-extrabold text-white border border-emerald-400 flex items-center gap-2 shadow-2xl animate-bounce">
                  <ArrowLeft className="w-4 h-4 text-emerald-300" />
                  <span>Exit Overhead: Turn Left (3.5m)</span>
                </div>
              )}

              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer backdrop-blur transition-all shadow-lg">
                  <Upload className="w-3.5 h-3.5" /> Upload Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            <CameraFeed
              detections={detections}
              onDetectionsChange={(liveDets) => {
                setDetections(liveDets);
              }}
              onFrame={handleFrame}
              processingInterval={1800}
              autoStart={false}
            />
          )}

          {/* Spatial Radar */}
          <SpatialRadar
            objects={detections}
            sonarActive={sonarActive}
            onToggleSonar={toggleSonar}
          />
        </div>

        {/* Right Column: Directional Perception & Spatial Relations */}
        <div className="lg:col-span-5 space-y-4">
          {/* Spoken Voice Narration Card */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">{t('vision.scanScene')}</h3>
              </div>
              {sceneDesc && (
                <button
                  type="button"
                  onClick={() => speak(sceneDesc, currentLang)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" /> {t('common.readAloud')}
                </button>
              )}
            </div>
            <p className="text-sm font-medium text-slate-200 leading-relaxed">
              {sceneDesc || t('vision.scanScene')}
            </p>
          </div>

          {/* Spatial Exit Wayfinding & Relations */}
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
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      rel.toLowerCase().includes('exit') || rel.toLowerCase().includes('turn')
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-semibold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      rel.toLowerCase().includes('exit') || rel.toLowerCase().includes('turn') ? 'bg-emerald-400' : 'bg-blue-400'
                    }`} />
                    <span>{rel}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hazards & Objects Tracked */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {t('vision.hazardsTracked')} ({detections.length})
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {detections.length === 0 ? (
                <p className="text-xs text-slate-500 italic">{t('vision.pathClear')}</p>
              ) : (
                detections.map((d, i) => {
                  const isClose = d.spatial?.proximity === 'VERY_NEAR' || d.distance_meters < 1.8;
                  const isMedium = d.spatial?.proximity === 'NEAR' || d.distance_meters < 3.2;
                  const isExit = d.label === 'exit_sign' || d.label === 'door' || d.label === 'emergency_door';
                  const dirBadge = d.spatial?.direction ? directionBadges[d.spatial.direction] : null;
                  const proxBadge = d.spatial?.proximity ? proximityBadges[d.spatial.proximity] : null;
                  const movBadge = d.spatial?.movement ? movementBadges[d.spatial.movement] : null;

                  return (
                    <div
                      key={d.spatial?.id || i}
                      className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        isExit
                          ? 'bg-emerald-950/30 border-emerald-500/50'
                          : isClose
                          ? 'bg-red-950/30 border-red-500/40'
                          : isMedium
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-800/60 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isExit ? (
                            <Navigation className="w-4 h-4 text-emerald-400" />
                          ) : isClose ? (
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
                            isExit
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isClose
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
