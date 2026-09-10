import { useCallback, useEffect, useRef, useState } from 'react';
import { HandDetectionResult, GestureControlHand, HandLandmark } from '../types';

declare global {
  interface Window {
    HandLandmarker?: any;
    FilesetResolver?: any;
  }
}

interface UseHandTrackingOptions {
  maxHands?: number;
  modelComplexity?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

export function useHandTracking(options: UseHandTrackingOptions = {}) {
  const {
    maxHands = 2,
    minDetectionConfidence = 0.6,
    minTrackingConfidence = 0.5,
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<HandDetectionResult>({
    detected: false,
    landmarks: [],
    handedness: 'UNKNOWN',
    confidence: 0,
  });

  const handLandmarkerRef = useRef<any>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const animFrameRef = useRef<number>(0);

  const initialize = useCallback(async () => {
    if (isInitialized || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const vision = await window.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const handLandmarker = await window.HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: maxHands,
        minHandDetectionConfidence: minDetectionConfidence,
        minHandPresenceConfidence: minTrackingConfidence,
        minTrackingConfidence: minTrackingConfidence,
      });

      handLandmarkerRef.current = handLandmarker;
      setIsInitialized(true);
    } catch (err: any) {
      console.warn('MediaPipe Hand Landmarker init failed:', err);
      setError(err.message || 'Failed to initialize hand tracking');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading, maxHands, minDetectionConfidence, minTrackingConfidence]);

  const detect = useCallback((videoElement: HTMLVideoElement): HandDetectionResult => {
    if (!handLandmarkerRef.current || !videoElement || videoElement.readyState < 2) {
      return { detected: false, landmarks: [], handedness: 'UNKNOWN', confidence: 0 };
    }

    const now = performance.now();
    if (now === lastVideoTimeRef.current) {
      return detection;
    }
    lastVideoTimeRef.current = now;

    try {
      const results = handLandmarkerRef.current.detectForVideo(videoElement, now);

      if (results.landmarks && results.landmarks.length > 0) {
        const handLandmarks = results.landmarks[0];
        const handedness = results.handednesses?.[0]?.[0]?.categoryName || 'UNKNOWN';
        const confidence = results.handednesses?.[0]?.[0]?.score || 0;

        const landmarks: HandLandmark[] = handLandmarks.map((lm: any) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        }));

        const normalizedHand: GestureControlHand =
          handedness === 'Left' ? 'LEFT' :
          handedness === 'Right' ? 'RIGHT' :
          'UNKNOWN';

        return {
          detected: true,
          landmarks,
          handedness: normalizedHand,
          confidence,
        };
      }

      return { detected: false, landmarks: [], handedness: 'UNKNOWN', confidence: 0 };
    } catch (err) {
      return { detected: false, landmarks: [], handedness: 'UNKNOWN', confidence: 0 };
    }
  }, [detection]);

  const cleanup = useCallback(() => {
    if (handLandmarkerRef.current) {
      handLandmarkerRef.current.close();
      handLandmarkerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsInitialized(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isInitialized,
    isLoading,
    error,
    detection,
    setDetection,
    initialize,
    detect,
    cleanup,
  };
}
