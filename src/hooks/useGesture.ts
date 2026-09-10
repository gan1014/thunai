import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureResult } from '../types';
import { api } from '../api/client';

export function useGesture(captureFrameFn?: () => string | null) {
  const [currentGesture, setCurrentGesture] = useState<GestureResult | null>(null);
  const [gestureHistory, setGestureHistory] = useState<GestureResult[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const intervalRef = useRef<any>(null);

  const performDetection = useCallback(async () => {
    if (!captureFrameFn) return;
    const frame = captureFrameFn();
    if (!frame) return;

    try {
      const result = await api.recognizeGesture(frame);
      if (result && result.gesture) {
        setCurrentGesture(result);
        setGestureHistory((prev) => [result, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      console.warn('Continuous gesture detection tick failed:', err);
    }
  }, [captureFrameFn]);

  const startDetection = useCallback(
    (intervalMs = 800) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsDetecting(true);
      performDetection();
      intervalRef.current = setInterval(performDetection, intervalMs);
    },
    [performDetection]
  );

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsDetecting(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    currentGesture,
    gestureHistory,
    isDetecting,
    startDetection,
    stopDetection,
    setCurrentGesture,
  };
}
