import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Volume2,
  Tv,
  Eye,
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useHandTracking } from '../hooks/useHandTracking';
import { useGestureClassifier } from '../hooks/useGestureClassifier';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useProfile } from '../context/ProfileContext';
import { GESTURE_CONTROL_LABELS } from '../utils/constants';
import { GestureResult, GestureControlEvent, HandLandmark, DEFAULT_GESTURE_CONFIG } from '../types';
import { emergencyManager } from '../services/emergencyManager';

interface GestureDetectorProps {
  onGestureSelect?: (gesture: GestureResult) => void;
  onGestureControlEvent?: (event: GestureControlEvent) => void;
  className?: string;
  autoSpeak?: boolean;
  showDebug?: boolean;
}

const MEDIAPIPE_HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

function createKinematicHand(
  cx: number,
  cy: number,
  scale: number,
  gesture: string,
  timeOffset = 0
): Array<{ x: number; y: number; z?: number }> {
  const points: Array<{ x: number; y: number; z?: number }> = [];
  const wobbleX = Math.sin(timeOffset * 0.003) * 0.015;
  const wobbleY = Math.cos(timeOffset * 0.004) * 0.01;
  const originX = cx + wobbleX;
  const originY = cy + wobbleY;

  points.push({ x: originX, y: originY + 0.16 * scale, z: 0 });

  let thumbCurl = 0.2;
  let indexCurl = 0.1;
  let middleCurl = 0.1;
  let ringCurl = 0.1;
  let pinkyCurl = 0.1;

  if (gesture === 'closed_fist') {
    thumbCurl = 0.85; indexCurl = 0.9; middleCurl = 0.95; ringCurl = 0.9; pinkyCurl = 0.85;
  } else if (gesture === 'thumbs_up') {
    thumbCurl = -0.3; indexCurl = 0.85; middleCurl = 0.88; ringCurl = 0.85; pinkyCurl = 0.8;
  } else if (gesture === 'thumbs_down') {
    thumbCurl = 1.1; indexCurl = 0.85; middleCurl = 0.88; ringCurl = 0.85; pinkyCurl = 0.8;
  } else if (gesture === 'peace_sign') {
    thumbCurl = 0.8; indexCurl = 0.05; middleCurl = 0.05; ringCurl = 0.85; pinkyCurl = 0.85;
  } else if (gesture === 'pointing_up') {
    thumbCurl = 0.75; indexCurl = -0.1; middleCurl = 0.85; ringCurl = 0.85; pinkyCurl = 0.85;
  } else if (gesture === 'waving') {
    const waveShift = Math.sin(timeOffset * 0.012) * 0.06;
    indexCurl = 0.1 + waveShift * 0.5; middleCurl = 0.1; ringCurl = 0.1; pinkyCurl = 0.1;
  }

  const fingerAngles = [-0.65, -0.35, -0.05, 0.25, 0.55];
  const curls = [thumbCurl, indexCurl, middleCurl, ringCurl, pinkyCurl];
  const fingerBaseX = [-0.07, -0.04, 0.0, 0.04, 0.07];

  for (let f = 0; f < 5; f++) {
    const baseAngle = fingerAngles[f];
    const curl = curls[f];
    const bx = originX + fingerBaseX[f] * scale;
    const by = originY + 0.02 * scale;

    const j1x = bx;
    const j1y = by;
    points.push({ x: j1x, y: j1y, z: 0 });

    const segLen = 0.055 * scale * (1 - curl * 0.3);
    const j2x = j1x + Math.sin(baseAngle) * segLen;
    const j2y = j1y - Math.cos(baseAngle) * segLen + curl * 0.02 * scale;
    points.push({ x: j2x, y: j2y, z: 0 });

    const j3x = j2x + Math.sin(baseAngle) * segLen * 0.9;
    const j3y = j2y - Math.cos(baseAngle) * segLen * 0.9 + curl * 0.03 * scale;
    points.push({ x: j3x, y: j3y, z: 0 });

    const tipLen = segLen * 0.8;
    const j4x = j3x + Math.sin(baseAngle) * tipLen;
    const j4y = j3y - Math.cos(baseAngle) * tipLen + curl * 0.04 * scale;
    points.push({ x: j4x, y: j4y, z: 0 });
  }

  return points;
}

export const GestureDetector: React.FC<GestureDetectorProps> = ({
  onGestureSelect,
  onGestureControlEvent,
  className = '',
  autoSpeak = true,
  showDebug = false,
}) => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { videoRef, isActive: isCameraActive, startCamera, stopCamera } = useCamera();
  const { speak } = useSpeechSynthesis();
  const handTracking = useHandTracking({ maxHands: 1 });
  const gestureClassifier = useGestureClassifier(DEFAULT_GESTURE_CONFIG);

  const [feedMode, setFeedMode] = useState<'camera' | 'simulator'>('simulator');
  const [activeGestureKey, setActiveGestureKey] = useState<string>('open_palm');
  const [currentResult, setCurrentResult] = useState<GestureResult>({
    gesture: 'open_palm',
    intent: 'stop',
    text: t('gesture.emergencyStop', 'Emergency Stop: Halt movement immediately'),
    confidence: 0.94,
  });
  const [handCenter, setHandCenter] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [handScale, setHandScale] = useState(1.0);
  const [realLandmarks, setRealLandmarks] = useState<HandLandmark[]>([]);
  const [gestureStatus, setGestureStatus] = useState<string>('IDLE');
  const [fps, setFps] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const lastSpokenTimeRef = useRef<number>(0);
  const fpsCountRef = useRef(0);
  const fpsTimerRef = useRef(performance.now());
  const processFrameRef = useRef<number>(0);

  const GESTURE_DATABASE: Record<string, { label: string; intent: string; text: string; icon: string }> = {
    open_palm: { label: t('gesture.openPalm', 'Open Palm (Stop / Halt)'), intent: 'stop', text: t('gesture.emergencyStop', 'Emergency Stop: Halt movement immediately'), icon: '✋' },
    closed_fist: { label: t('gesture.closedFist', 'Closed Fist (Urgent SOS)'), intent: 'help', text: t('gesture.emergencyTriggered', 'Urgent SOS distress gesture recognized'), icon: '✊' },
    thumbs_up: { label: t('gesture.thumbsUp', 'Thumbs Up (Affirmative / Safe)'), intent: 'yes', text: t('gesture.thumbsUp', 'Affirmative / Confirmed'), icon: '👍' },
    thumbs_down: { label: t('gesture.thumbsDown', 'Thumbs Down (Negative / Cancel)'), intent: 'no', text: t('gesture.thumbsDown', 'Negative / Cancel'), icon: '👎' },
    peace_sign: { label: t('gesture.peaceSign', 'Peace Sign (Safe & Clear)'), intent: 'okay', text: t('gesture.peaceSign', 'Safe & Clear Status'), icon: '✌️' },
    pointing_up: { label: t('gesture.pointing', 'Pointing Up (Attention / Exit Guidance)'), intent: 'attention', text: t('gesture.pointing', 'Attention Ahead: Door & Exit Guidance'), icon: '☝️' },
    waving: { label: t('gesture.wave', 'Hand Wave (Hello / Guide Me)'), intent: 'greeting', text: t('gesture.helpRequest', 'Help Request: How can THUNAI assist you?'), icon: '👋' },
  };

  const handleGestureControlEvent = useCallback((event: GestureControlEvent) => {
    if (onGestureControlEvent) {
      onGestureControlEvent(event);
    }

    const lang = profile.preferred_language || 'en';
    let gestureKey: string = 'open_palm';
    let gestureText = t('gesture.emergencyStop', 'Emergency Stop: Halt movement immediately');
    let gestureIntent: any = 'stop';

    if (event.gesture === 'OPEN_PALM') {
      gestureKey = 'open_palm';
      gestureText =
        lang === 'ta'
          ? 'அவசர நிறுத்தம்: உடனே நடப்பதை நிறுத்துங்கள்.'
          : lang === 'te'
          ? 'అత్యవసర స్టాప్: కదలికను వెంటనే ఆపండి.'
          : lang === 'hi'
          ? 'आपातकालीन रोक: तुरंत चलना बंद करें।'
          : 'Emergency Stop: Halt movement immediately.';
      gestureIntent = 'stop';
    } else if (event.gesture === 'CLOSED_FIST') {
      gestureKey = 'closed_fist';
      gestureText =
        lang === 'ta'
          ? 'அவசர எச்சரிக்கை அனுப்பப்பட்டது.'
          : lang === 'te'
          ? 'అత్యవసర హెచ్చరిక పంపబడింది.'
          : lang === 'hi'
          ? 'आपातकालीन चेतावनी भेजी गई।'
          : 'Emergency alert sent.';
      gestureIntent = 'help';
      if (event.confidence >= 0.75 && !emergencyManager.isEmergencyActive()) {
        emergencyManager.triggerSOS('GESTURE_TRIGGER');
      }
    } else if (event.gesture === 'WAVE') {
      gestureKey = 'waving';
      gestureText =
        lang === 'ta'
          ? 'வணக்கம்! துணை உங்களுக்கு எவ்வாறு உதவ முடியும்?'
          : lang === 'te'
          ? 'నమస్కారం! తుణై మీకు ఎలా సహాయపడుతుంది?'
          : lang === 'hi'
          ? 'नमस्ते! थुनै आपकी कैसे मदद कर सकता है?'
          : 'Hello! How can THUNAI assist you?';
      gestureIntent = 'greeting';
    } else if (event.gesture === 'THUMBS_UP') {
      gestureKey = 'thumbs_up';
      gestureText =
        lang === 'ta'
          ? 'சரி: உறுதிப்படுத்தப்பட்டது.'
          : lang === 'te'
          ? 'సరే: నిర్ధారించబడింది.'
          : lang === 'hi'
          ? 'ठीक है: पुष्टि की गई।'
          : 'Confirmed: Affirmative response recorded.';
      gestureIntent = 'yes';
      if (emergencyManager.getSnapshot().isConfirmingCancel) {
        emergencyManager.confirmCancel();
      }
    } else if (event.gesture === 'THUMBS_DOWN') {
      gestureKey = 'thumbs_down';
      gestureText =
        lang === 'ta'
          ? 'ரத்து செய்யப்பட்டது.'
          : lang === 'te'
          ? 'రద్దు చేయబడింది.'
          : lang === 'hi'
          ? 'रद्द किया गया।'
          : 'Cancelled: Action aborted.';
      gestureIntent = 'no';
      if (emergencyManager.isEmergencyActive() && !emergencyManager.getSnapshot().isConfirmingCancel) {
        emergencyManager.requestCancel();
      }
    } else if (event.gesture === 'PEACE_SIGN') {
      gestureKey = 'peace_sign';
      gestureText =
        lang === 'ta'
          ? 'பாதுகாப்பு நிலை உறுதி செய்யப்பட்டது.'
          : lang === 'te'
          ? 'సురక్షిత స్థితి ధృవీకరించబడింది.'
          : lang === 'hi'
          ? 'सुरक्षित स्थिति की पुष्टि की गई।'
          : 'Safe and clear status verified.';
      gestureIntent = 'okay';
      if (emergencyManager.isEmergencyActive()) {
        emergencyManager.requestCancel();
      }
    } else if (event.gesture === 'POINTING_UP') {
      gestureKey = 'pointing_up';
      gestureText =
        lang === 'ta'
          ? 'கவனம்: கதவு மற்றும் வழி வழிகாட்டல்.'
          : lang === 'te'
          ? 'గమనిక: ద్వారం మరియు నిష్క్రమణ మార్గం.'
          : lang === 'hi'
          ? 'ध्यान दें: दरवाज़ा एवं निकास मार्गदर्शन।'
          : 'Attention: Spatial orientation and exit guidance focused.';
      gestureIntent = 'attention';
    }

    const result: GestureResult = {
      gesture: gestureKey as any,
      intent: gestureIntent,
      text: gestureText,
      confidence: event.confidence,
    };

    setCurrentResult(result);
    if (onGestureSelect) onGestureSelect(result);

    const now = Date.now();
    if (autoSpeak && (now - lastSpokenTimeRef.current > 3500)) {
      lastSpokenTimeRef.current = now;
      speak(gestureText, lang);
    }
  }, [onGestureControlEvent, onGestureSelect, autoSpeak, speak, profile.preferred_language, t]);

  useEffect(() => {
    if (feedMode !== 'camera' || !isCameraActive) return;
    if (!handTracking.isInitialized) {
      handTracking.initialize();
    }
  }, [feedMode, isCameraActive, handTracking]);

  useEffect(() => {
    if (feedMode !== 'camera' || !isCameraActive || !handTracking.isInitialized) return;
    let stopped = false;

    const processFrame = () => {
      if (stopped) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const detection = handTracking.detect(video);
        handTracking.setDetection(detection);

        const event = gestureClassifier.processDetection(detection);
        if (event) {
          handleGestureControlEvent(event);
        }

        setRealLandmarks(detection.detected ? detection.landmarks : []);

        if (detection.detected) {
          const wrist = detection.landmarks[0];
          setHandCenter({ x: 1 - wrist.x, y: wrist.y });
        }
      }

      fpsCountRef.current++;
      const now = performance.now();
      if (now - fpsTimerRef.current >= 1000) {
        setFps(fpsCountRef.current);
        fpsCountRef.current = 0;
        fpsTimerRef.current = now;
      }

      processFrameRef.current = requestAnimationFrame(processFrame);
    };

    processFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      stopped = true;
      if (processFrameRef.current) cancelAnimationFrame(processFrameRef.current);
    };
  }, [feedMode, isCameraActive, handTracking, gestureClassifier, handleGestureControlEvent, videoRef]);

  useEffect(() => {
    if (gestureClassifier.state) {
      setGestureStatus(gestureClassifier.state);
    }
  }, [gestureClassifier.state]);

  const renderTracking = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      let targetX = handCenter.x;
      let targetY = handCenter.y;

      if (feedMode === 'camera' && isCameraActive && videoRef.current) {
        const video = videoRef.current;
        if (video.readyState >= 2) {
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -w, 0, w, h);
          ctx.restore();
        }
      } else {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w / 1.5);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        const handSilX = targetX * w;
        const handSilY = targetY * h;
        ctx.save();
        ctx.fillStyle = 'rgba(251, 146, 60, 0.15)';
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(handSilX, handSilY, 65 * handScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      if (feedMode === 'camera' && isCameraActive && realLandmarks.length === 21) {
        ctx.save();

        for (const [start, end] of MEDIAPIPE_HAND_CONNECTIONS) {
          const p1 = realLandmarks[start];
          const p2 = realLandmarks[end];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo((1 - p1.x) * w, p1.y * h);
            ctx.lineTo((1 - p2.x) * w, p2.y * h);
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }
        }

        realLandmarks.forEach((pt, i) => {
          const px = (1 - pt.x) * w;
          const py = pt.y * h;

          ctx.beginPath();
          ctx.arc(px, py, i === 0 ? 6 : (i % 4 === 0 ? 5 : 3.5), 0, 2 * Math.PI);
          ctx.fillStyle = i % 4 === 0 ? '#F43F5E' : '#38BDF8';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        const currentGesture = gestureClassifier.currentGesture;
        if (currentGesture !== 'UNKNOWN') {
          const labelInfo = GESTURE_CONTROL_LABELS[currentGesture];
          const wrist = realLandmarks[0];
          const boxX = (1 - wrist.x) * w - 80;
          const boxY = wrist.y * h - 60;

          ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
          ctx.fillRect(boxX, boxY - 30, 180, 26);
          ctx.fillStyle = currentGesture === 'OPEN_PALM' ? '#F43F5E' : '#38BDF8';
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.fillText(
            `${labelInfo.icon} ${labelInfo.label} (${(gestureClassifier.debugInfo.palmConfidence || gestureClassifier.debugInfo.waveConfidence || '0')}%)`,
            boxX + 8,
            boxY - 12
          );
        }

        ctx.restore();
      } else if (feedMode === 'simulator') {
        const landmarks = createKinematicHand(targetX, targetY, handScale, activeGestureKey, time);

        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        landmarks.forEach((pt) => {
          if (pt.x < minX) minX = pt.x;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        });

        const pad = 0.04;
        const boxX = Math.max(0, (minX - pad) * w);
        const boxY = Math.max(0, (minY - pad) * h);
        const boxW = Math.min(w, (maxX - minX + pad * 2) * w);
        const boxH = Math.min(h, (maxY - minY + pad * 2) * h);

        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        const bracketLen = 14;
        ctx.strokeStyle = '#F43F5E';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(boxX, boxY + bracketLen); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + bracketLen, boxY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(boxX + boxW - bracketLen, boxY); ctx.lineTo(boxX + boxW); ctx.lineTo(boxX + boxW, boxY + bracketLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(boxX, boxY + boxH - bracketLen); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + bracketLen, boxY + boxH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(boxX + boxW - bracketLen, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - bracketLen); ctx.stroke();

        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(boxX, boxY - 24, 180, 22);
        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillText(`21-PT KINEMATICS: ${(currentResult.confidence * 100).toFixed(0)}%`, boxX + 6, boxY - 8);

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#38BDF8';
        const wrist = landmarks[0];
        [1, 5, 9, 13, 17].forEach((baseIdx) => {
          if (landmarks[baseIdx]) {
            ctx.beginPath();
            ctx.moveTo(wrist.x * w, wrist.y * h);
            ctx.lineTo(landmarks[baseIdx].x * w, landmarks[baseIdx].y * h);
            ctx.stroke();
          }
        });

        for (let f = 0; f < 5; f++) {
          const start = 1 + f * 4;
          for (let j = start; j < start + 3; j++) {
            if (landmarks[j] && landmarks[j + 1]) {
              ctx.beginPath();
              ctx.moveTo(landmarks[j].x * w, landmarks[j].y * h);
              ctx.lineTo(landmarks[j + 1].x * w, landmarks[j + 1].y * h);
              ctx.stroke();
            }
          }
        }

        landmarks.forEach((pt, i) => {
          const px = pt.x * w;
          const py = pt.y * h;
          ctx.beginPath();
          ctx.arc(px, py, i === 0 ? 6 : i % 4 === 0 ? 5 : 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = i % 4 === 0 ? '#F43F5E' : '#38BDF8';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }

      animRef.current = requestAnimationFrame(renderTracking);
    },
    [feedMode, isCameraActive, handCenter, handScale, activeGestureKey, currentResult, realLandmarks, gestureClassifier.currentGesture, gestureClassifier.debugInfo, videoRef]
  );

  useEffect(() => {
    animRef.current = requestAnimationFrame(renderTracking);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [renderTracking]);

  const setGesture = (key: string) => {
    setActiveGestureKey(key);
    const item = GESTURE_DATABASE[key] || GESTURE_DATABASE.open_palm;
    const res: GestureResult = {
      gesture: key as any,
      intent: item.intent as any,
      text: item.text,
      confidence: 0.96 + Math.random() * 0.03,
    };
    setCurrentResult(res);
    if (onGestureSelect) onGestureSelect(res);
    if (autoSpeak) {
      speak(item.text, profile.preferred_language);
    }
  };

  const handleToggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
      handTracking.cleanup();
      gestureClassifier.reset();
      setFeedMode('simulator');
      setRealLandmarks([]);
    } else {
      setFeedMode('camera');
      await startCamera();
      if (!handTracking.isInitialized && !handTracking.isLoading) {
        handTracking.initialize();
      }
    }
  };

  const gestureControlEvent = gestureClassifier.lastEvent;
  const isHandDetected = feedMode === 'camera' && isCameraActive && handTracking.isInitialized;

  return (
    <div id="gesture-detector" className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col ${className}`}>
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} width={640} height={400} className="w-full h-full object-cover" />

        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
          <div className="bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{feedMode === 'camera' ? t('gesture.mediaPipeTracking', 'HAND TRACKING (MEDIAPIPE)') : t('gesture.kinematicSim', '21-POINT KINEMATIC SIM')}</span>
          </div>
          <span className="bg-indigo-600/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase border border-indigo-400/30">
            {feedMode === 'camera' ? (isHandDetected ? 'Webcam + MediaPipe Active' : 'Webcam Active') : t('vision.interactiveSimulator', 'Live Interactive Simulator')}
          </span>
          {feedMode === 'camera' && fps > 0 && (
            <span className="bg-slate-800/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-300 border border-slate-600/30">
              {fps} FPS
            </span>
          )}
        </div>

        {feedMode === 'camera' && isHandDetected && (
          <div className="absolute top-3 right-3">
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-lg ${
              gestureClassifier.currentGesture === 'OPEN_PALM'
                ? 'bg-red-600/90 border-red-400/50 text-white'
                : gestureClassifier.currentGesture === 'WAVE'
                ? 'bg-blue-600/90 border-blue-400/50 text-white'
                : 'bg-slate-800/90 border-slate-600/50 text-slate-300'
            }`}>
              {gestureClassifier.currentGesture === 'UNKNOWN' ? (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {t('common.loading', 'Detecting...')}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  {GESTURE_CONTROL_LABELS[gestureClassifier.currentGesture].icon}
                  {GESTURE_CONTROL_LABELS[gestureClassifier.currentGesture].label}
                </span>
              )}
            </div>
          </div>
        )}

        {gestureControlEvent && (
          <div className={`absolute bottom-20 inset-x-3 p-3 rounded-xl backdrop-blur-md border shadow-2xl ${
            gestureControlEvent.gesture === 'OPEN_PALM'
              ? 'bg-red-900/90 border-red-500/50'
              : 'bg-blue-900/90 border-blue-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{GESTURE_CONTROL_LABELS[gestureControlEvent.gesture].icon}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {GESTURE_CONTROL_LABELS[gestureControlEvent.gesture].intent}
                  </p>
                  <p className="text-sm font-bold text-white">
                    {gestureControlEvent.gesture === 'OPEN_PALM' ? t('gesture.alertRequest', 'ALERT REQUEST') : t('gesture.helpRequest', 'HELP REQUEST')}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-white/50">
                {(gestureControlEvent.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 inset-x-3 bg-slate-900/90 backdrop-blur-md border border-indigo-500/50 p-3.5 rounded-xl flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{GESTURE_DATABASE[activeGestureKey]?.icon || '✋'}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  {t('gesture.recognizedIntent', 'Recognized Intent')}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {(currentResult.confidence * 100).toFixed(0)}% {t('gesture.confidence', 'Conf')}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                {currentResult.text}
              </p>
            </div>
          </div>

          {onGestureSelect && (
            <button
              type="button"
              onClick={() => onGestureSelect(currentResult)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('gesture.speakSign', 'Speak Sign')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleCamera}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              isCameraActive
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isCameraActive ? (
              <><Camera className="w-3.5 h-3.5" /><span>{t('vision.stopWebcam', 'Stop Webcam')}</span></>
            ) : (
              <><Camera className="w-3.5 h-3.5 text-indigo-400" /><span>{t('vision.useWebcam', 'Switch to Live Webcam')}</span></>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFeedMode('simulator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              feedMode === 'simulator' && !isCameraActive
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{t('vision.interactiveSimulator', 'Interactive Demo Stream')}</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          {feedMode === 'camera' ? 'Show open palm (✋) or wave (👋) to interact' : 'Click any gesture below to trigger kinematics:'}
        </span>
      </div>

      <div className="p-3 bg-slate-900 border-t border-slate-800/80">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
          {Object.entries(GESTURE_DATABASE).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => setGesture(key)}
              className={`p-2 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1 border focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                activeGestureKey === key
                  ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-bold truncate max-w-full">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {showDebug && feedMode === 'camera' && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-400 space-y-0.5">
          <p>Hand detected: {gestureClassifier.debugInfo.detected ? 'YES' : 'NO'}</p>
          <p>Hand: {gestureClassifier.debugInfo.hand || 'N/A'}</p>
          <p>Palm gesture: {gestureClassifier.debugInfo.palmGesture || 'N/A'} (conf: {gestureClassifier.debugInfo.palmConfidence || '0'})</p>
          <p>Wave gesture: {gestureClassifier.debugInfo.waveGesture || 'N/A'} (conf: {gestureClassifier.debugInfo.waveConfidence || '0'})</p>
          <p>Candidate: {gestureClassifier.debugInfo.candidateGesture || 'N/A'} (conf: {gestureClassifier.debugInfo.candidateConfidence || '0'})</p>
          <p>Stable frames: {gestureClassifier.debugInfo.stableFrames || 0}</p>
          <p>Cooldown: {gestureClassifier.debugInfo.cooldown ? 'ACTIVE' : 'INACTIVE'}</p>
          <p>Wrist history: {gestureClassifier.debugInfo.wristHistoryLen || 0} pts</p>
          <p>State: {gestureClassifier.debugInfo.state || 'IDLE'}</p>
          <p>FPS: {fps}</p>
        </div>
      )}
    </div>
  );
};
