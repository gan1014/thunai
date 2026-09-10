import { useCallback, useEffect, useRef, useState } from 'react';

// Global shared stream to prevent "Device in use" hardware contention across multiple components on Windows
let globalSharedStream: MediaStream | null = null;
let activeSubscriberCount = 0;

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);

    // 1. Check if an active shared stream already exists and is healthy
    if (globalSharedStream && globalSharedStream.getVideoTracks().some((t) => t.readyState === 'live')) {
      if (videoRef.current) {
        videoRef.current.srcObject = globalSharedStream;
        try {
          await videoRef.current.play();
        } catch (e) {
          // Play could be interrupted
        }
      }
      setIsActive(true);
      return;
    }

    // 2. Request camera with graceful fallback constraints
    try {
      let stream: MediaStream | null = null;

      // Attempt A: Standard resolution with facingMode preference
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch (err1) {
        // Attempt B: Basic unconstrained video request
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err2) {
          throw err2;
        }
      }

      if (stream) {
        globalSharedStream = stream;
        activeSubscriberCount++;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      const errMsg = err?.name === 'NotReadableError'
        ? 'Webcam is currently in use by another application. Close other camera apps and click retry.'
        : err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : err?.message || 'Camera is unavailable';
      setError(errMsg);
      setIsActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback((forceStopHardware = false) => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);

    if (forceStopHardware && globalSharedStream) {
      globalSharedStream.getTracks().forEach((t) => t.stop());
      globalSharedStream = null;
      activeSubscriberCount = 0;
    }
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !videoRef.current.videoWidth) {
      return null;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  useEffect(() => {
    return () => {
      // Clean up reference on unmount
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isActive,
    startCamera,
    stopCamera,
    switchCamera,
    captureFrame,
    facingMode,
    error,
  };
}
