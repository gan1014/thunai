import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import {
  Bot,
  Send,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Hand,
  Volume2,
  VolumeX,
  Compass,
  Eye,
  Camera,
  Radio,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Square,
  Activity,
  Layers,
  Navigation,
  Zap,
} from 'lucide-react';
import { CameraFeed } from '../components/CameraFeed';
import { VoiceInput } from '../components/VoiceInput';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { RiskAlert } from '../components/RiskAlert';
import { ContextPanel } from '../components/ContextPanel';
import { SpatialRadar } from '../components/SpatialRadar';
import { ScenarioSimulatorBar, ScenarioPreset } from '../components/ScenarioSimulatorBar';
import { GestureDetector } from '../components/GestureDetector';
import { useAssistant } from '../context/AssistantContext';
import { useProfile } from '../context/ProfileContext';
import { useVoiceInteraction } from '../context/VoiceInteractionContext';
import { DetectedObject, GestureResult } from '../types';

export const FullAssistant: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const {
    latestResponse,
    isProcessing,
    sendMultimodal,
    clearConversation,
    sonarActive,
    toggleSonar,
    soundEnabled,
    setSoundEnabled,
    openEmergency,
  } = useAssistant();

  const {
    state: voiceState,
    isListening,
    isCameraActive,
    currentTranscript,
    interimTranscript,
    lastResponseText,
    liveDetections: voiceDetections,
    activeNavigationPath,
    processVoiceQuery,
    openCameraByVoice,
    closeCameraByVoice,
    interruptSpeech,
  } = useVoiceInteraction();

  const [textInput, setTextInput] = useState('');
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [liveDetections, setLiveDetections] = useState<DetectedObject[]>([]);
  const [environment, setEnvironment] = useState<'indoor' | 'outdoor' | 'transit' | 'medical'>('indoor');
  const [noiseLevel, setNoiseLevel] = useState<'quiet' | 'moderate' | 'noisy'>('quiet');
  const [showLiveGestureTracker, setShowLiveGestureTracker] = useState(false);

  const quickSpatialQueries = [
    { icon: '🚪', text: t('voice.promptExit'), label: t('header.findExit') },
    { icon: '🚪', text: t('voice.promptDoor'), label: t('vision.doorDetected') },
    { icon: '🚶', text: t('voice.promptPath'), label: t('vision.pathClear') },
    { icon: '⚠️', text: t('voice.promptObstacle'), label: t('vision.obstacleDetected') },
    { icon: '⬅️', text: t('voice.promptLeft'), label: t('spatial.left') },
    { icon: '➡️', text: t('voice.promptRight'), label: t('spatial.right') },
  ];

  const quickGestures = [
    {
      key: 'open_palm',
      icon: '✋',
      label: t('gesture.openPalm'),
      action: t('gesture.emergencyStop'),
      color: 'border-red-500/50 bg-red-500/10 text-red-300 hover:bg-red-500/20',
      intent: 'stop',
      query: t('gesture.emergencyStop'),
    },
    {
      key: 'closed_fist',
      icon: '✊',
      label: t('gesture.closedFist'),
      action: t('gesture.emergencyTriggered'),
      color: 'border-rose-600/60 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30',
      intent: 'help',
      query: t('gesture.emergencyTriggered'),
    },
    {
      key: 'pointing_up',
      icon: '☝️',
      label: t('gesture.pointing'),
      action: t('voice.promptExit'),
      color: 'border-blue-500/50 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20',
      intent: 'attention',
      query: t('voice.promptExit'),
    },
    {
      key: 'thumbs_up',
      icon: '👍',
      label: t('gesture.thumbsUp'),
      action: t('vision.pathClear'),
      color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
      intent: 'yes',
      query: t('vision.pathClear'),
    },
    {
      key: 'peace_sign',
      icon: '✌️',
      label: t('gesture.peaceSign'),
      action: t('spatial.clearCorridor'),
      color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20',
      intent: 'okay',
      query: t('spatial.clearCorridor'),
    },
    {
      key: 'waving',
      icon: '👋',
      label: t('gesture.wave'),
      action: t('gesture.helpRequest'),
      color: 'border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20',
      intent: 'greeting',
      query: t('gesture.helpRequest'),
    },
  ];

  const handleFrameCapture = async (base64: string) => {
    setCurrentFrame(base64);
    try {
      const vision = await api.describeScene(base64);
      setLiveDetections(vision.objects || []);
    } catch (err) {
      console.warn('Live camera analysis failed:', err);
    }
  };

  const handleSelectScenario = async (preset: ScenarioPreset) => {
    setEnvironment(preset.environment);
    setNoiseLevel(preset.noiseLevel);
    await sendMultimodal({
      text_input: preset.textQuery,
      simulated_environment: {
        environment_type: preset.environment,
        noise_level: preset.noiseLevel,
        lighting: 'normal',
      },
    });
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    const query = textInput.trim();
    setTextInput('');
    await processVoiceQuery(query);
  };

  const handleTriggerGesture = async (gestureItem: typeof quickGestures[0]) => {
    if (gestureItem.key === 'closed_fist') {
      openEmergency();
    }
    await processVoiceQuery(gestureItem.query);
  };

  const handleGestureSelect = async (gesture: GestureResult) => {
    if (gesture.gesture === 'closed_fist') {
      openEmergency();
    }
    await processVoiceQuery(gesture.text);
  };

  // Status badge styling
  const getVoiceStateBadge = () => {
    switch (voiceState) {
      case 'RESPONDING':
        return {
          label: t('voice.speaking'),
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse',
          icon: <Volume2 className="w-3.5 h-3.5" />,
        };
      case 'ANALYZING':
        return {
          label: t('vision.scanScene'),
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse',
          icon: <Activity className="w-3.5 h-3.5" />,
        };
      case 'CAMERA_STARTING':
        return {
          label: t('vision.liveFeed'),
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
          icon: <Camera className="w-3.5 h-3.5" />,
        };
      case 'PROCESSING_COMMAND':
        return {
          label: t('voice.processing'),
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse',
          icon: <Zap className="w-3.5 h-3.5" />,
        };
      case 'LISTENING':
      default:
        return {
          label: t('voice.voiceFirstActive'),
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <Mic className="w-3.5 h-3.5 text-blue-400" />,
        };
    }
  };

  const statusBadge = getVoiceStateBadge();
  const effectiveDetections = voiceDetections.length > 0 ? voiceDetections : liveDetections;

  return (
    <div id="full-multimodal-assistant" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white">
                {t('nav.assistant')}
              </h1>
              <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusBadge.color}`}>
                {statusBadge.icon}
                <span>{statusBadge.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('voice.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {voiceState === 'RESPONDING' && (
            <button
              type="button"
              onClick={interruptSpeech}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer animate-pulse"
              title={t('voice.stopSpeech')}
            >
              <Square className="w-3.5 h-3.5" /> {t('voice.stopSpeech')}
            </button>
          )}

          <button
            type="button"
            onClick={isCameraActive ? closeCameraByVoice : openCameraByVoice}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isCameraActive
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            {isCameraActive ? t('vision.stopWebcam') : t('vision.useWebcam')}
          </button>

          <button
            type="button"
            onClick={clearConversation}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('common.reset')}
          </button>
        </div>
      </div>

      {/* Live Transcribed Voice Bubble */}
      {(currentTranscript || interimTranscript || lastResponseText) && (
        <div className="bg-slate-900/90 border border-blue-500/40 p-4 rounded-2xl shadow-lg space-y-2">
          {currentTranscript || interimTranscript ? (
            <div className="flex items-start gap-2.5 text-xs text-blue-300">
              <Mic className="w-4 h-4 mt-0.5 text-blue-400 animate-pulse flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block">{t('voice.youSpoke')}</span>
                <span className="text-white font-medium text-sm">"{currentTranscript || interimTranscript}"</span>
              </div>
            </div>
          ) : null}

          {lastResponseText && (
            <div className="flex items-start gap-2.5 text-xs text-emerald-300 pt-2 border-t border-slate-800">
              <Volume2 className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block">{t('voice.thunaiSpoke')}</span>
                <span className="text-emerald-100 font-semibold text-sm">"{lastResponseText}"</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Critical Risk Banner if active */}
      {latestResponse && (
        <RiskAlert risk={latestResponse.risk} />
      )}

      {/* Perception Simulator */}
      <ScenarioSimulatorBar
        onSelectScenario={handleSelectScenario}
        isProcessing={isProcessing}
      />

      {/* Interactive Hand Gesture Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
              <Hand className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                {t('gesture.title')}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t('gesture.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLiveGestureTracker(!showLiveGestureTracker)}
            className="px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Radio className="w-3.5 h-3.5" />
            {showLiveGestureTracker ? t('gesture.hideDebug') : t('gesture.showDebug')}
            {showLiveGestureTracker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Gesture Trigger Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {quickGestures.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => handleTriggerGesture(g)}
              disabled={isProcessing}
              className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer transform active:scale-95 disabled:opacity-50 ${g.color}`}
            >
              <span className="text-2xl">{g.icon}</span>
              <span className="text-xs font-bold leading-tight">{g.label}</span>
              <span className="text-[10px] text-slate-400 leading-tight line-clamp-1">{g.action}</span>
            </button>
          ))}
        </div>

        {/* Collapsible Live MediaPipe Hand Tracking Camera Panel */}
        {showLiveGestureTracker && (
          <div className="pt-4 border-t border-slate-800">
            <GestureDetector
              onGestureSelect={handleGestureSelect}
              autoSpeak={true}
              showDebug={true}
            />
          </div>
        )}
      </div>

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

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          <CameraFeed
            detections={effectiveDetections}
            navigationPath={activeNavigationPath || undefined}
            onFrame={handleFrameCapture}
            processingInterval={1800}
            autoStart={false}
          />

          <SpatialRadar
            objects={effectiveDetections}
            sonarActive={sonarActive}
            onToggleSonar={toggleSonar}
          />

          {/* Quick Voice Queries Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t('voice.quickQueries')}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {quickSpatialQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => processVoiceQuery(q.text)}
                  disabled={isProcessing}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-blue-600/20 border border-slate-700/80 hover:border-blue-500/50 text-left text-xs font-medium text-slate-200 flex items-center gap-2.5 transition-all cursor-pointer group disabled:opacity-50"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">{q.icon}</span>
                  <div className="truncate">
                    <span className="block font-semibold text-white group-hover:text-blue-300">{q.label}</span>
                    <span className="block text-[10px] text-slate-400 truncate">"{q.text}"</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Text Query Form */}
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 shadow-lg space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                {t('common.ask')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('voice.subtitle')}
              </p>
            </div>

            <form onSubmit={handleTextSubmit} className="space-y-3">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t('voice.promptExit')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isProcessing || !textInput.trim()}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isProcessing ? t('voice.processing') : t('common.ask')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          <ContextPanel
            objects={effectiveDetections}
            intent={latestResponse?.intent}
            risk={latestResponse?.risk}
            environment={environment}
            noiseLevel={noiseLevel}
            selectedModality={latestResponse?.modality || profile.preferred_output}
            onEnvironmentChange={setEnvironment}
            onNoiseChange={setNoiseLevel}
          />

          <ResponseDisplay response={latestResponse} />
        </div>
      </div>
    </div>
  );
};
