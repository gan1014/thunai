import { useCallback, useRef, useState } from 'react';
import {
  HandDetectionResult,
  HandLandmark,
  GestureControlType,
  GestureControlIntent,
  GestureControlState,
  GestureControlEvent,
  GestureControlConfig,
  DEFAULT_GESTURE_CONFIG,
} from '../types';

const LANDMARK_WRIST = 0;
const LANDMARK_THUMB_TIP = 4;
const LANDMARK_INDEX_TIP = 8;
const LANDMARK_MIDDLE_TIP = 12;
const LANDMARK_RING_TIP = 16;
const LANDMARK_PINKY_TIP = 20;
const LANDMARK_INDEX_PIP = 6;
const LANDMARK_MIDDLE_PIP = 10;
const LANDMARK_RING_PIP = 14;
const LANDMARK_PINKY_PIP = 18;
const LANDMARK_THUMB_IP = 3;
const LANDMARK_THUMB_MCP = 2;
const LANDMARK_INDEX_MCP = 5;
const LANDMARK_PINKY_MCP = 17;

function isFingerExtended(tip: HandLandmark, pip: HandLandmark): boolean {
  return tip.y < pip.y;
}

function isThumbExtended(thumb: HandLandmark[], indexMcp: HandLandmark): boolean {
  const tip = thumb[LANDMARK_THUMB_TIP];
  const ip = thumb[LANDMARK_THUMB_IP];
  const mcp = thumb[LANDMARK_THUMB_MCP];
  const distTip = Math.abs(tip.x - mcp.x);
  const distIp = Math.abs(ip.x - mcp.x);
  return distTip > 0.03 && distTip > distIp * 0.8;
}

function classifyOpenPalm(landmarks: HandLandmark[]): { gesture: GestureControlType; confidence: number } {
  if (landmarks.length < 21) return { gesture: 'UNKNOWN', confidence: 0 };

  const thumbExtended = isThumbExtended(
    [landmarks[0], landmarks[1], landmarks[2], landmarks[3], landmarks[4]],
    landmarks[LANDMARK_INDEX_MCP]
  );

  const indexExtended = isFingerExtended(landmarks[LANDMARK_INDEX_TIP], landmarks[LANDMARK_INDEX_PIP]);
  const middleExtended = isFingerExtended(landmarks[LANDMARK_MIDDLE_TIP], landmarks[LANDMARK_MIDDLE_PIP]);
  const ringExtended = isFingerExtended(landmarks[LANDMARK_RING_TIP], landmarks[LANDMARK_RING_PIP]);
  const pinkyExtended = isFingerExtended(landmarks[LANDMARK_PINKY_TIP], landmarks[LANDMARK_PINKY_PIP]);

  const extendedCount = [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended]
    .filter(Boolean).length;

  const allExtended = extendedCount === 5;
  const fourExtended = extendedCount >= 4;

  if (allExtended) {
    const palmCenter = {
      x: (landmarks[LANDMARK_INDEX_MCP].x + landmarks[LANDMARK_PINKY_MCP].x) / 2,
      y: (landmarks[LANDMARK_INDEX_MCP].y + landmarks[LANDMARK_PINKY_MCP].y) / 2,
    };
    const spread = Math.sqrt(
      Math.pow(landmarks[LANDMARK_PINKY_TIP].x - landmarks[LANDMARK_INDEX_TIP].x, 2) +
      Math.pow(landmarks[LANDMARK_PINKY_TIP].y - landmarks[LANDMARK_INDEX_TIP].y, 2)
    );
    const confidence = Math.min(0.99, 0.7 + spread * 0.8);
    return { gesture: 'OPEN_PALM', confidence: Math.max(0.75, confidence) };
  }

  if (fourExtended && middleExtended && indexExtended && ringExtended) {
    return { gesture: 'OPEN_PALM', confidence: 0.82 };
  }

  return { gesture: 'UNKNOWN', confidence: 0 };
}

function classifyPointingUp(landmarks: HandLandmark[]): { gesture: GestureControlType; confidence: number } {
  if (landmarks.length < 21) return { gesture: 'UNKNOWN', confidence: 0 };
  const indexExtended = isFingerExtended(landmarks[LANDMARK_INDEX_TIP], landmarks[LANDMARK_INDEX_PIP]);
  const middleExtended = isFingerExtended(landmarks[LANDMARK_MIDDLE_TIP], landmarks[LANDMARK_MIDDLE_PIP]);
  const ringExtended = isFingerExtended(landmarks[LANDMARK_RING_TIP], landmarks[LANDMARK_RING_PIP]);
  const pinkyExtended = isFingerExtended(landmarks[LANDMARK_PINKY_TIP], landmarks[LANDMARK_PINKY_PIP]);

  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return { gesture: 'POINTING_UP', confidence: 0.88 };
  }
  return { gesture: 'UNKNOWN', confidence: 0 };
}

function classifyClosedFist(landmarks: HandLandmark[]): { gesture: GestureControlType; confidence: number } {
  if (landmarks.length < 21) return { gesture: 'UNKNOWN', confidence: 0 };
  const indexExtended = isFingerExtended(landmarks[LANDMARK_INDEX_TIP], landmarks[LANDMARK_INDEX_PIP]);
  const middleExtended = isFingerExtended(landmarks[LANDMARK_MIDDLE_TIP], landmarks[LANDMARK_MIDDLE_PIP]);
  const ringExtended = isFingerExtended(landmarks[LANDMARK_RING_TIP], landmarks[LANDMARK_RING_PIP]);
  const pinkyExtended = isFingerExtended(landmarks[LANDMARK_PINKY_TIP], landmarks[LANDMARK_PINKY_PIP]);

  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return { gesture: 'CLOSED_FIST', confidence: 0.86 };
  }
  return { gesture: 'UNKNOWN', confidence: 0 };
}

function classifyPeaceSign(landmarks: HandLandmark[]): { gesture: GestureControlType; confidence: number } {
  if (landmarks.length < 21) return { gesture: 'UNKNOWN', confidence: 0 };
  const indexExtended = isFingerExtended(landmarks[LANDMARK_INDEX_TIP], landmarks[LANDMARK_INDEX_PIP]);
  const middleExtended = isFingerExtended(landmarks[LANDMARK_MIDDLE_TIP], landmarks[LANDMARK_MIDDLE_PIP]);
  const ringExtended = isFingerExtended(landmarks[LANDMARK_RING_TIP], landmarks[LANDMARK_RING_PIP]);
  const pinkyExtended = isFingerExtended(landmarks[LANDMARK_PINKY_TIP], landmarks[LANDMARK_PINKY_PIP]);

  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    return { gesture: 'PEACE_SIGN', confidence: 0.85 };
  }
  return { gesture: 'UNKNOWN', confidence: 0 };
}

interface WristPosition {
  x: number;
  y: number;
  timestamp: number;
}

function classifyWave(positions: WristPosition[], config: GestureControlConfig): { gesture: GestureControlType; confidence: number } {
  if (positions.length < config.WAVE_HISTORY_SIZE * 0.6) {
    return { gesture: 'UNKNOWN', confidence: 0 };
  }

  const now = performance.now();
  const recentPositions = positions.filter(
    (p) => now - p.timestamp < config.WAVE_TIME_WINDOW_MS
  );

  if (recentPositions.length < 8) {
    return { gesture: 'UNKNOWN', confidence: 0 };
  }

  let directionChanges = 0;
  let totalDistance = 0;
  let lastDirection = 0;

  for (let i = 1; i < recentPositions.length; i++) {
    const dx = recentPositions[i].x - recentPositions[i - 1].x;
    totalDistance += Math.abs(dx);

    const direction = dx > 0.002 ? 1 : dx < -0.002 ? -1 : 0;
    if (direction !== 0 && direction !== lastDirection && lastDirection !== 0) {
      directionChanges++;
    }
    if (direction !== 0) lastDirection = direction;
  }

  const totalDisplacement = Math.abs(
    recentPositions[recentPositions.length - 1].x - recentPositions[0].x
  );

  if (
    directionChanges >= config.WAVE_MIN_DIRECTION_CHANGES &&
    totalDistance > config.WAVE_MIN_DISTANCE &&
    totalDisplacement < config.WAVE_MIN_DISTANCE * 3
  ) {
    const confidence = Math.min(
      0.98,
      0.65 + (directionChanges / config.WAVE_MIN_DIRECTION_CHANGES) * 0.15 +
      Math.min(totalDistance / 0.3, 0.15)
    );
    return { gesture: 'WAVE', confidence: Math.max(0.7, confidence) };
  }

  return { gesture: 'UNKNOWN', confidence: 0 };
}

export function useGestureClassifier(config: GestureControlConfig = DEFAULT_GESTURE_CONFIG) {
  const [state, setState] = useState<GestureControlState>('IDLE');
  const [currentGesture, setCurrentGesture] = useState<GestureControlType>('UNKNOWN');
  const [confirmedGesture, setConfirmedGesture] = useState<GestureControlType>('UNKNOWN');
  const [lastEvent, setLastEvent] = useState<GestureControlEvent | null>(null);
  const [stableFrameCount, setStableFrameCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  const stateRef = useRef<GestureControlState>('IDLE');
  const candidateGestureRef = useRef<GestureControlType>('UNKNOWN');
  const candidateFramesRef = useRef(0);
  const wristHistoryRef = useRef<WristPosition[]>([]);
  const lastTriggerTimeRef = useRef(0);
  const lastGestureTimeRef = useRef(0);
  const cooldownActiveRef = useRef(false);

  const processDetection = useCallback((detection: HandDetectionResult): GestureControlEvent | null => {
    const now = performance.now();
    const currentState = stateRef.current;

    if (!detection.detected || detection.landmarks.length < 21) {
      if (currentState !== 'IDLE' && currentState !== 'RELEASE_WAIT') {
        stateRef.current = 'RELEASE_WAIT';
        candidateGestureRef.current = 'UNKNOWN';
        candidateFramesRef.current = 0;
        wristHistoryRef.current = [];
        setCurrentGesture('UNKNOWN');
        setStableFrameCount(0);
      }
      if (currentState === 'RELEASE_WAIT' && now - lastGestureTimeRef.current > 500) {
        stateRef.current = 'IDLE';
        cooldownActiveRef.current = false;
      }
      setDebugInfo({ detected: false, hand: detection.handedness, state: stateRef.current });
      return null;
    }

    lastGestureTimeRef.current = now;

    const palmResult = classifyOpenPalm(detection.landmarks);

    wristHistoryRef.current.push({
      x: detection.landmarks[LANDMARK_WRIST].x,
      y: detection.landmarks[LANDMARK_WRIST].y,
      timestamp: now,
    });

    if (wristHistoryRef.current.length > config.WAVE_HISTORY_SIZE) {
      wristHistoryRef.current = wristHistoryRef.current.slice(-config.WAVE_HISTORY_SIZE);
    }

    const waveResult = classifyWave(wristHistoryRef.current, config);
    const pointingResult = classifyPointingUp(detection.landmarks);
    const fistResult = classifyClosedFist(detection.landmarks);
    const peaceResult = classifyPeaceSign(detection.landmarks);

    let candidateGesture: GestureControlType = 'UNKNOWN';
    let candidateConfidence = 0;

    if (palmResult.gesture === 'OPEN_PALM' && palmResult.confidence > candidateConfidence) {
      candidateGesture = 'OPEN_PALM';
      candidateConfidence = palmResult.confidence;
    }

    if (waveResult.gesture === 'WAVE' && waveResult.confidence > candidateConfidence) {
      candidateGesture = 'WAVE';
      candidateConfidence = waveResult.confidence;
    }

    if (pointingResult.gesture === 'POINTING_UP' && pointingResult.confidence > candidateConfidence) {
      candidateGesture = 'POINTING_UP';
      candidateConfidence = pointingResult.confidence;
    }

    if (fistResult.gesture === 'CLOSED_FIST' && fistResult.confidence > candidateConfidence) {
      candidateGesture = 'CLOSED_FIST';
      candidateConfidence = fistResult.confidence;
    }

    if (peaceResult.gesture === 'PEACE_SIGN' && peaceResult.confidence > candidateConfidence) {
      candidateGesture = 'PEACE_SIGN';
      candidateConfidence = peaceResult.confidence;
    }

    setCurrentGesture(candidateGesture);

    setDebugInfo({
      detected: true,
      hand: detection.handedness,
      palmGesture: palmResult.gesture,
      palmConfidence: palmResult.confidence.toFixed(2),
      waveGesture: waveResult.gesture,
      waveConfidence: waveResult.confidence.toFixed(2),
      pointingGesture: pointingResult.gesture,
      candidateGesture,
      candidateConfidence: candidateConfidence.toFixed(2),
      stableFrames: candidateFramesRef.current,
      state: stateRef.current,
      wristHistoryLen: wristHistoryRef.current.length,
      cooldown: cooldownActiveRef.current,
    });

    if (cooldownActiveRef.current) {
      if (candidateGesture === 'UNKNOWN') {
        cooldownActiveRef.current = false;
        stateRef.current = 'IDLE';
      }
      return null;
    }

    if (candidateGesture === 'UNKNOWN') {
      candidateFramesRef.current = 0;
      candidateGestureRef.current = 'UNKNOWN';
      if (currentState !== 'IDLE' && currentState !== 'RELEASE_WAIT') {
        stateRef.current = 'DETECTING';
      }
      return null;
    }

    if (candidateGesture === candidateGestureRef.current) {
      candidateFramesRef.current++;
    } else {
      candidateGestureRef.current = candidateGesture;
      candidateFramesRef.current = 1;
      stateRef.current = 'CANDIDATE';
    }

    setStableFrameCount(candidateFramesRef.current);

    if (candidateFramesRef.current >= config.STABLE_FRAMES && candidateConfidence >= config.CONFIDENCE_THRESHOLD) {
      if (currentState !== 'CONFIRMED' && currentState !== 'TRIGGERED') {
        stateRef.current = 'CONFIRMED';
        setConfirmedGesture(candidateGesture);

        const intent: GestureControlIntent =
          candidateGesture === 'OPEN_PALM' ? 'ALERT_REQUEST' :
          candidateGesture === 'WAVE' ? 'HELP_REQUEST' :
          candidateGesture === 'POINTING_UP' ? 'HELP_REQUEST' :
          candidateGesture === 'CLOSED_FIST' ? 'HELP_REQUEST' :
          candidateGesture === 'PEACE_SIGN' ? 'HELP_REQUEST' :
          'UNKNOWN';

        const event: GestureControlEvent = {
          gesture: candidateGesture,
          confidence: candidateConfidence,
          hand: detection.handedness,
          timestamp: now,
          intent,
        };

        stateRef.current = 'TRIGGERED';
        lastTriggerTimeRef.current = now;

        setLastEvent(event);

        stateRef.current = 'COOLDOWN';
        cooldownActiveRef.current = true;
        setTimeout(() => {
          cooldownActiveRef.current = false;
          candidateFramesRef.current = 0;
          candidateGestureRef.current = 'UNKNOWN';
          wristHistoryRef.current = [];
          stateRef.current = 'IDLE';
        }, config.COOLDOWN_MS);

        return event;
      }
    }

    return null;
  }, [config]);

  const reset = useCallback(() => {
    stateRef.current = 'IDLE';
    candidateGestureRef.current = 'UNKNOWN';
    candidateFramesRef.current = 0;
    wristHistoryRef.current = [];
    cooldownActiveRef.current = false;
    lastTriggerTimeRef.current = 0;
    lastGestureTimeRef.current = 0;
    setState('IDLE');
    setCurrentGesture('UNKNOWN');
    setConfirmedGesture('UNKNOWN');
    setLastEvent(null);
    setStableFrameCount(0);
  }, []);

  return {
    state: stateRef.current,
    currentGesture,
    confirmedGesture,
    lastEvent,
    stableFrameCount,
    debugInfo,
    processDetection,
    reset,
  };
}
