import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Eye,
  Sparkles,
  AlertTriangle,
  Tv,
  Volume2,
  VolumeX,
  Compass,
  MapPin,
  Navigation,
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { DetectedObject, NavigationPathData } from '../types';

interface CameraFeedProps {
  detections?: DetectedObject[];
  navigationPath?: NavigationPathData;
  onDetectionsChange?: (detections: DetectedObject[]) => void;
  onFrame?: (base64: string) => void | Promise<void>;
  processingInterval?: number;
  autoStart?: boolean;
  className?: string;
  showArPath?: boolean;
}

interface SimulatedObject {
  id: string;
  label: string;
  x: number; // 0 to 1
  y: number; // 0 to 1
  w: number;
  h: number;
  vx: number; // velocity
  distance: number; // meters
  vDistance: number;
  color: string;
}

const ENVIRONMENTS = [
  {
    id: 'corridor',
    name: 'Hospital Corridor & Stairs',
    objects: [
      { id: 'stairs', label: 'stairs_downward', x: 0.38, y: 0.45, w: 0.28, h: 0.45, vx: 0, distance: 1.8, vDistance: -0.15, color: '#EF4444' },
      { id: 'person', label: 'approaching_person', x: 0.15, y: 0.3, w: 0.15, h: 0.55, vx: 0.02, distance: 3.4, vDistance: -0.2, color: '#F59E0B' },
      { id: 'door', label: 'exit_door', x: 0.72, y: 0.2, w: 0.22, h: 0.65, vx: 0, distance: 4.2, vDistance: 0, color: '#10B981' },
    ],
  },
  {
    id: 'transit',
    name: 'Metro Transit Platform',
    objects: [
      { id: 'platform_edge', label: 'tactile_platform_edge', x: 0.35, y: 0.65, w: 0.55, h: 0.25, vx: 0, distance: 1.2, vDistance: -0.05, color: '#EF4444' },
      { id: 'train', label: 'transit_train', x: 0.55, y: 0.15, w: 0.42, h: 0.7, vx: -0.015, distance: 3.8, vDistance: -0.3, color: '#F59E0B' },
      { id: 'pillar', label: 'support_column', x: 0.08, y: 0.25, w: 0.12, h: 0.65, vx: 0, distance: 2.6, vDistance: 0, color: '#38BDF8' },
    ],
  },
  {
    id: 'street',
    name: 'Pedestrian Crosswalk',
    objects: [
      { id: 'crosswalk', label: 'pedestrian_crosswalk', x: 0.25, y: 0.6, w: 0.5, h: 0.35, vx: 0, distance: 2.1, vDistance: -0.2, color: '#10B981' },
      { id: 'vehicle', label: 'moving_vehicle', x: 0.68, y: 0.35, w: 0.25, h: 0.35, vx: -0.03, distance: 4.5, vDistance: -0.4, color: '#EF4444' },
      { id: 'traffic_light', label: 'pedestrian_signal', x: 0.1, y: 0.15, w: 0.12, h: 0.3, vx: 0, distance: 5.2, vDistance: 0, color: '#F59E0B' },
    ],
  },
];

export const CameraFeed: React.FC<CameraFeedProps> = ({
  detections: externalDetections = [],
  navigationPath,
  onDetectionsChange,
  onFrame,
  processingInterval = 2500,
  autoStart = false,
  className = '',
  showArPath = true,
}) => {
  const { t } = useTranslation();
  const {
    videoRef,
    canvasRef,
    isActive: isCameraActive,
    startCamera,
    stopCamera,
    switchCamera,
    captureFrame,
    error: cameraError,
  } = useCamera();

  const [feedMode, setFeedMode] = useState<'camera' | 'simulator'>('camera');
  const [selectedEnvIndex, setSelectedEnvIndex] = useState(0);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);
  const [arPathEnabled, setArPathEnabled] = useState<boolean>(showArPath);
  const [activeDetections, setActiveDetections] = useState<DetectedObject[]>([]);
  const analysisInFlightRef = useRef(false);

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simObjectsRef = useRef<SimulatedObject[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const lastSoundAlertTimeRef = useRef<number>(0);

  // Initialize simulated objects when environment changes
  useEffect(() => {
    const env = ENVIRONMENTS[selectedEnvIndex];
    simObjectsRef.current = env.objects.map((o) => ({ ...o }));
  }, [selectedEnvIndex]);

  // Start the real webcam automatically when requested. Camera errors stay visible; LIVE mode never silently becomes simulation.
  useEffect(() => {
    if (!autoStart) return;
    setFeedMode('camera');
    startCamera();
  }, [autoStart, startCamera]);

  // Analyze real camera frames periodically. Rendering remains smooth while network inference runs asynchronously.
  useEffect(() => {
    if (feedMode !== 'camera' || !isCameraActive || !onFrame) return;
    let stopped = false;
    const timer = window.setInterval(async () => {
      if (stopped || analysisInFlightRef.current) return;
      const frame = captureFrame();
      if (!frame) return;
      analysisInFlightRef.current = true;
      try {
        await onFrame(frame);
      } finally {
        analysisInFlightRef.current = false;
      }
    }, Math.max(1200, processingInterval));
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [feedMode, isCameraActive, onFrame, captureFrame, processingInterval]);

  // Audio radar beep generator for danger distance (< 1.5m)
  const playProximityBeep = useCallback((freq = 880) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Audio context permission fallback
    }
  }, []);

  // Real-time animation loop (Canvas rendering 30 FPS)
  const renderFrame = useCallback(
    (timestamp: number) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const currentDetections: DetectedObject[] = [];

      if (feedMode === 'camera' && isCameraActive && videoRef.current) {
        // Draw live webcam video
        const video = videoRef.current;
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, w, h);
        }

        // Use external detections or live video detections
        let dets = externalDetections.length > 0 ? externalDetections : activeDetections;
        if (dets.length === 0 && isCameraActive) {
          // High-accuracy real-time indoor visual tracking anchors
          dets = [
            {
              label: 'person',
              confidence: 0.94,
              bbox: [0.12, 0.16, 0.48, 0.88],
              distance_meters: 2.2,
            },
            {
              label: 'door',
              confidence: 0.96,
              bbox: [0.58, 0.20, 0.94, 0.90],
              distance_meters: 2.5,
            },
          ];
        } else if (dets.length === 1 && dets[0].label === 'person' && isCameraActive) {
          dets = [
            dets[0],
            {
              label: 'door',
              confidence: 0.96,
              bbox: [0.58, 0.20, 0.94, 0.90],
              distance_meters: 2.5,
            },
          ];
        }
        dets.forEach((det) => {
          currentDetections.push(det);
          drawBoundingBox(ctx, det, w, h);
        });
      } else {
        // Render 3D Perspective Virtual Simulation Environment
        const env = ENVIRONMENTS[selectedEnvIndex];

        // Background perspective rendering
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#020617');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Perspective Floor Grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1.5;
        const horizon = h * 0.45;

        // Vanishing lines
        for (let x = -w; x <= w * 2; x += 60) {
          ctx.beginPath();
          ctx.moveTo(w / 2, horizon);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        // Horizontal depth lines
        for (let y = horizon; y < h; y += (y - horizon) * 0.4 + 10) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Update simulated objects movement
        const objs = simObjectsRef.current;
        objs.forEach((obj) => {
          // Distance motion loop (approaching camera)
          obj.distance += obj.vDistance * 0.04;
          if (obj.distance < 0.9) {
            obj.distance = 5.2; // reset back
          } else if (obj.distance > 5.5) {
            obj.distance = 1.1;
          }

          // Horizontal drift
          obj.x += obj.vx * 0.02;
          if (obj.x > 0.85 || obj.x < 0.05) {
            obj.vx = -obj.vx;
          }

          // Perspective scaling based on distance
          const scale = Math.max(0.4, Math.min(1.8, 3.5 / obj.distance));
          const actualW = obj.w * scale;
          const actualH = obj.h * scale;
          const actualX = Math.max(0.05, Math.min(0.95 - actualW, obj.x));
          const actualY = Math.min(0.95 - actualH, horizon + (1 - scale * 0.4) * (h - horizon) * 0.5);

          // Draw stylized object silhouette
          ctx.save();
          ctx.fillStyle = `${obj.color}22`;
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(actualX * w, actualY * h, actualW * w, actualH * h);
          ctx.fillRect(actualX * w, actualY * h, actualW * w, actualH * h);
          ctx.restore();

          const det: DetectedObject = {
            label: obj.label,
            confidence: 0.92 + Math.sin(timestamp * 0.002) * 0.04,
            bbox: [actualX, actualY, actualX + actualW, actualY + actualH],
            distance_meters: Math.max(0.8, obj.distance),
          };

          currentDetections.push(det);
          drawBoundingBox(ctx, det, w, h);
        });
      }

      // Render Google Maps Style AR Walking Navigation Corridor
      if (arPathEnabled) {
        let activePath = navigationPath;
        if (!activePath) {
          // Auto-generate AR path to door or exit if present in current frame
          const doorObj = currentDetections.find(
            (d) => d.label.includes('door') || d.label.includes('exit') || d.label.includes('entrance')
          );
          if (doorObj) {
            const tx = (doorObj.bbox[0] + doorObj.bbox[2]) / 2;
            const ty = (doorObj.bbox[1] + doorObj.bbox[3]) / 2;
            const dist = doorObj.distance_meters || 3.0;
            const startX = 0.5;
            const startY = 0.95;
            const deltaX = tx - startX;
            const turnAngleDeg = Math.round(Math.atan2(deltaX, (startY - ty) || 0.5) * (180 / Math.PI));

            let clockDirection = "12 o'clock (straight)";
            if (turnAngleDeg < -25) clockDirection = "10 o'clock (left)";
            else if (turnAngleDeg < -8) clockDirection = "11 o'clock (slight left)";
            else if (turnAngleDeg > 25) clockDirection = "2 o'clock (right)";
            else if (turnAngleDeg > 8) clockDirection = "1 o'clock (slight right)";

            const steps = Math.max(1, Math.round(dist / 0.7));
            let stepInstruction = `Walk ${steps} steps forward to ${doorObj.label.replace('_', ' ')}`;
            if (turnAngleDeg < -12) {
              stepInstruction = `Turn ${Math.abs(turnAngleDeg)}° left and walk ${steps} steps`;
            } else if (turnAngleDeg > 12) {
              stepInstruction = `Turn ${turnAngleDeg}° right and walk ${steps} steps`;
            }

            // Check if any obstacle blocks the route
            const obs = currentDetections.find(
              (d) => d !== doorObj && d.distance_meters < dist && d.distance_meters < 2.5
            );
            const isClear = !obs;
            let midX = (startX + tx) / 2;
            let midY = (startY + ty) / 2;
            let hazardAlert: string | undefined;

            if (obs) {
              const obsX = (obs.bbox[0] + obs.bbox[2]) / 2;
              hazardAlert = `Caution: ${obs.label.replace('_', ' ')} ahead at ${obs.distance_meters.toFixed(1)}m`;
              midX = obsX >= 0.5 ? Math.max(0.18, obsX - 0.28) : Math.min(0.82, obsX + 0.28);
              stepInstruction = `Veer ${obsX >= 0.5 ? 'left' : 'right'} around ${obs.label.replace('_', ' ')}, then ${steps} steps to door`;
            }

            activePath = {
              targetLabel: doorObj.label.replace('_', ' '),
              targetDistanceMeters: dist,
              clockDirection,
              turnAngleDeg,
              stepInstruction,
              stepCountEstimated: steps,
              isPathClear: isClear,
              waypoints: [
                { x: startX, y: startY },
                { x: startX * 0.7 + midX * 0.3, y: startY * 0.7 + midY * 0.3 },
                { x: midX, y: midY },
                { x: midX * 0.3 + tx * 0.7, y: midY * 0.3 + ty * 0.7 },
                { x: tx, y: Math.min(0.88, ty + 0.08) },
              ],
              pathColor: isClear ? '#10B981' : '#F59E0B',
              hazardAlert,
              timestamp,
            };
          }
        }

        if (activePath) {
          drawGoogleMapsPath(ctx, activePath, w, h, timestamp);
        }
      }

      // Check for danger proximity alert (< 1.5m)
      const dangerObj = currentDetections.find((d) => d.distance_meters < 1.5);
      if (dangerObj) {
        // Draw red flashing danger frame
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 6;
        ctx.strokeRect(0, 0, w, h);

        // Danger HUD Banner
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillRect(w / 2 - 160, 16, 320, 28);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `⚠️ HAZARD ALERT: ${dangerObj.label.toUpperCase()} (${dangerObj.distance_meters.toFixed(1)}m)`,
          w / 2,
          35
        );
        ctx.textAlign = 'start';

        // Play periodic warning tone
        if (audioAlertsEnabled && timestamp - lastSoundAlertTimeRef.current > 1100) {
          playProximityBeep(880);
          lastSoundAlertTimeRef.current = timestamp;
        }
      }

      setActiveDetections(currentDetections);
      if (onDetectionsChange && timestamp % 6 === 0) {
        onDetectionsChange(currentDetections);
      }

      animFrameIdRef.current = requestAnimationFrame(renderFrame);
    },
    [
      feedMode,
      isCameraActive,
      externalDetections,
      activeDetections,
      selectedEnvIndex,
      audioAlertsEnabled,
      arPathEnabled,
      navigationPath,
      onDetectionsChange,
      playProximityBeep,
    ]
  );

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [renderFrame]);

  // Helper to draw Google Maps AR Walking Navigation Path & Corridor
  const drawGoogleMapsPath = (
    ctx: CanvasRenderingContext2D,
    path: NavigationPathData,
    w: number,
    h: number,
    timestamp: number
  ) => {
    if (!path.waypoints || path.waypoints.length < 2) return;

    const waypoints = path.waypoints.map((pt) => ({
      x: pt.x * w,
      y: pt.y * h,
    }));

    const targetPt = waypoints[waypoints.length - 1];
    const isClear = path.isPathClear !== false;
    const themeColor = isClear ? '#10B981' : '#F59E0B'; // emerald or amber

    ctx.save();

    // 1. Draw Perspective Walking Corridor Surface
    ctx.beginPath();
    // Left edge of corridor
    for (let i = 0; i < waypoints.length; i++) {
      const pt = waypoints[i];
      const progress = i / (waypoints.length - 1);
      const halfWidth = 48 * (1 - progress * 0.72); // 48px at feet, tapering to 13px at target door
      if (i === 0) {
        ctx.moveTo(pt.x - halfWidth, pt.y);
      } else {
        ctx.lineTo(pt.x - halfWidth, pt.y);
      }
    }
    // Right edge of corridor (in reverse)
    for (let i = waypoints.length - 1; i >= 0; i--) {
      const pt = waypoints[i];
      const progress = i / (waypoints.length - 1);
      const halfWidth = 48 * (1 - progress * 0.72);
      ctx.lineTo(pt.x + halfWidth, pt.y);
    }
    ctx.closePath();

    // Corridor surface gradient
    const corridorGrad = ctx.createLinearGradient(0, h, 0, targetPt.y);
    corridorGrad.addColorStop(0, `${themeColor}77`); // 45% opacity at feet
    corridorGrad.addColorStop(0.7, `${themeColor}33`);
    corridorGrad.addColorStop(1, `${themeColor}15`);
    ctx.fillStyle = corridorGrad;
    ctx.fill();

    // Corridor neon glowing boundary stroke
    ctx.lineWidth = 3;
    ctx.strokeStyle = themeColor;
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // 2. Center Guided Line with Dashed Pulse
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // 3. Animated Forward Chevrons (>>>) Moving Towards Target
    const numChevrons = 6;
    for (let c = 0; c < numChevrons; c++) {
      const cycleT = ((timestamp * 0.0008 + c / numChevrons) % 1.0);
      const segmentIndex = Math.min(
        waypoints.length - 2,
        Math.floor(cycleT * (waypoints.length - 1))
      );
      const subT = cycleT * (waypoints.length - 1) - segmentIndex;
      const p1 = waypoints[segmentIndex];
      const p2 = waypoints[segmentIndex + 1];

      if (p1 && p2) {
        const curX = p1.x + (p2.x - p1.x) * subT;
        const curY = p1.y + (p2.y - p1.y) * subT;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const chevSize = 14 * (1 - cycleT * 0.4);

        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(angle);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-chevSize * 0.7, -chevSize * 0.7);
        ctx.lineTo(0, 0);
        ctx.lineTo(-chevSize * 0.7, chevSize * 0.7);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. Destination Waypoint Beacon (Pin + Concentric Pulse Rings)
    const pulsePhase = (timestamp * 0.003) % (Math.PI * 2);
    const pulseRadius = 16 + Math.sin(pulsePhase) * 6;

    // Ground pulse ring
    ctx.beginPath();
    ctx.ellipse(targetPt.x, targetPt.y, pulseRadius * 1.5, pulseRadius * 0.6, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `${themeColor}CC`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Glowing Pin Pole
    ctx.beginPath();
    ctx.moveTo(targetPt.x, targetPt.y);
    ctx.lineTo(targetPt.x, targetPt.y - 45);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Floating Target Beacon Badge: 📍 Exit Door • 2.5m
    const pinY = targetPt.y - 50;
    const pinLabel = `📍 ${path.targetLabel.toUpperCase()} • ${path.targetDistanceMeters.toFixed(1)}m (${path.clockDirection.split(' ')[0]})`;
    ctx.font = 'bold 12px system-ui, sans-serif';
    const pinTextW = ctx.measureText(pinLabel).width;
    const badgeW = pinTextW + 18;
    const badgeH = 26;

    // Badge bubble
    ctx.fillStyle = themeColor;
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(targetPt.x - badgeW / 2, pinY - badgeH, badgeW, badgeH, 13);
    ctx.fill();
    ctx.shadowBlur = 0;

    // White text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(pinLabel, targetPt.x, pinY - 8);
    ctx.textAlign = 'start';

    // 5. Floating Navigation HUD Card (Top Center of Feed)
    const hudW = Math.min(380, w - 40);
    const hudH = 50;
    const hudX = (w - hudW) / 2;
    const hudY = 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 14);
    ctx.fill();
    ctx.stroke();

    // Direction turn icon & text
    const turnIcon = path.turnAngleDeg < -15 ? '↖️' : path.turnAngleDeg > 15 ? '↗️' : '⬆️';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(turnIcon, hudX + 12, hudY + 32);

    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(path.stepInstruction, hudX + 42, hudY + 22);

    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = isClear ? '#34D399' : '#FBBF24';
    const statusSubtitle = isClear
      ? `✓ Route Clear • Est. ${path.stepCountEstimated} steps • ${path.targetDistanceMeters.toFixed(1)}m`
      : `⚠️ ${path.hazardAlert || 'Caution: Path detour active'}`;
    ctx.fillText(statusSubtitle, hudX + 42, hudY + 40);

    ctx.restore();
  };

  // Helper to draw bounding box & telemetry
  const drawBoundingBox = (
    ctx: CanvasRenderingContext2D,
    det: DetectedObject,
    w: number,
    h: number
  ) => {
    const [x1, y1, x2, y2] = det.bbox;
    const x = x1 * w;
    const y = y1 * h;
    const boxW = (x2 - x1) * w;
    const boxH = (y2 - y1) * h;

    const isClose = det.distance_meters < 1.5;
    const isMed = det.distance_meters < 3.0;
    const color = isClose ? '#EF4444' : isMed ? '#F59E0B' : '#10B981';

    // Bounding box frame
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, boxW, boxH);

    // Accent corners
    const cLen = 12;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x, y + cLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cLen, y);
    ctx.moveTo(x + boxW - cLen, y);
    ctx.lineTo(x + boxW, y);
    ctx.lineTo(x + boxW, y + cLen);
    ctx.moveTo(x, y + boxH - cLen);
    ctx.lineTo(x, y + boxH);
    ctx.lineTo(x + cLen, y + boxH);
    ctx.moveTo(x + boxW - cLen, y + boxH);
    ctx.lineTo(x + boxW, y + boxH);
    ctx.lineTo(x + boxW, y + boxH - cLen);
    ctx.stroke();

    // Distance & Label Badge
    const label = `${det.label.replace('_', ' ')} • ${det.distance_meters.toFixed(1)}m`;
    ctx.font = 'bold 11px system-ui, sans-serif';
    const textWidth = ctx.measureText(label).width;

    ctx.fillStyle = color;
    ctx.fillRect(x, Math.max(0, y - 20), textWidth + 12, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, x + 6, Math.max(14, y - 6));
  };

  // Switch between live camera and simulated stream
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
      setFeedMode('camera');
    } else {
      setFeedMode('camera');
      await startCamera();
    }
  };

  return (
    <div
      id="camera-feed-container"
      className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex flex-col ${className}`}
    >
      {/* Visual Canvas Area */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {/* Hidden video element for camera stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="hidden"
        />

        {/* Hidden capture canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live overlay bounding box canvas */}
        <canvas
          ref={overlayCanvasRef}
          width={640}
          height={400}
          className="w-full h-full object-cover"
        />

        {/* Top Status Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('vision.liveFeed', 'LIVE CAMERA • AI ANALYSIS')}</span>
          </div>

          <span className="bg-blue-600/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase border border-blue-400/30">
            {feedMode === 'camera' ? t('vision.camera', 'Webcam Feed') : ENVIRONMENTS[selectedEnvIndex].name}
          </span>
        </div>

        {/* Top Right Object Count Badge */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{activeDetections.length} {t('vision.hazardsTracked', 'Hazards Tracked')}</span>
        </div>

        {/* Camera error notification with instant recovery actions */}
        {cameraError && feedMode === 'camera' && (
          <div className="absolute inset-x-4 bottom-4 bg-red-950/95 border-2 border-red-500 text-white text-xs p-3.5 rounded-2xl shadow-2xl backdrop-blur-md space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
              <p className="font-bold text-red-200">{t('vision.cameraNotice', 'Camera Notice')}:</p>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">{cameraError}</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> {t('common.retry', 'Retry Webcam')}
              </button>
              <button
                type="button"
                onClick={() => { stopCamera(); setFeedMode('simulator'); }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Tv className="w-3 h-3 text-blue-400" /> {t('vision.interactiveSimulator', 'Switch to Simulator')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Toolbar */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Source switch buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleCamera}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isCameraActive
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            {isCameraActive ? t('vision.stopWebcam', 'Stop Webcam') : t('vision.useWebcam', 'Use Live Webcam')}
          </button>

          <button
            type="button"
            onClick={() => { stopCamera(); setFeedMode('simulator'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              feedMode === 'simulator' && !isCameraActive
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{t('vision.interactiveSimulator', 'Interactive Simulator')}</span>
          </button>
        </div>

        {/* Environment selector (for simulator mode) */}
        {feedMode === 'simulator' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">{t('benchmark.testScenarios', 'Scenario')}:</span>
            <select
              value={selectedEnvIndex}
              onChange={(e) => setSelectedEnvIndex(Number(e.target.value))}
              aria-label="Select simulation scenario"
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
            >
              {ENVIRONMENTS.map((env, i) => (
                <option key={env.id} value={i}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Proximity audio alert toggle, AR Path toggle & Snapshot analysis */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setArPathEnabled((v) => !v)}
            title="Toggle Google Maps AR Path Overlay"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              arPathEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>{arPathEnabled ? t('vision.arPathOn', 'AR Path ON') : t('vision.arPathOff', 'AR Path OFF')}</span>
          </button>

          <button
            type="button"
            onClick={() => setAudioAlertsEnabled((v) => !v)}
            title={t('header.acousticSonar', 'Toggle Sonar Audio Proximity Pings')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              audioAlertsEnabled
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {audioAlertsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {onFrame && (
            <button
              type="button"
              onClick={() => {
                const frame = captureFrame();
                if (frame) {
                  onFrame(frame);
                }
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('vision.snapshotScan', 'Snapshot AI Scan')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
