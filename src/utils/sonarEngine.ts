import { DetectedObject } from '../types';

class AcousticSonarEngine {
  private audioCtx: AudioContext | null = null;
  private isRunning: boolean = false;
  private intervalId: any = null;
  private currentObjects: DetectedObject[] = [];
  private onPingCallback?: (closestDistance: number, label: string) => void;

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public updateObjects(objects: DetectedObject[]) {
    this.currentObjects = objects || [];
  }

  public setOnPingCallback(cb?: (closestDistance: number, label: string) => void) {
    this.onPingCallback = cb;
  }

  public start() {
    if (this.isRunning) return;
    this.initContext();
    this.isRunning = true;
    this.scheduleNextPing();
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  private scheduleNextPing() {
    if (!this.isRunning) return;

    // Find the closest detected obstacle
    let closestDist = 10.0;
    let closestObj: DetectedObject | null = null;

    for (const obj of this.currentObjects) {
      const d = obj.distance_meters ?? 5.0;
      if (d < closestDist) {
        closestDist = d;
        closestObj = obj;
      }
    }

    // Ping interval scales with distance:
    // < 1.0m: very rapid 220ms
    // 1.0m - 2.0m: 450ms
    // 2.0m - 4.0m: 800ms
    // > 4.0m or no objects: 1400ms calm ambient sweep
    let delayMs = 1400;
    if (closestDist < 1.2) {
      delayMs = 240;
    } else if (closestDist < 2.2) {
      delayMs = 480;
    } else if (closestDist < 3.5) {
      delayMs = 850;
    }

    this.playPing(closestDist, closestObj);

    if (this.onPingCallback && closestObj) {
      this.onPingCallback(closestDist, closestObj.label);
    }

    this.intervalId = setTimeout(() => {
      this.scheduleNextPing();
    }, delayMs);
  }

  private playPing(distance: number, obj: DetectedObject | null) {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Pan calculation based on horizontal position in camera frame
      // bbox: [x1, y1, x2, y2], center x = (x1 + x2)/2, 0 (left) to 1 (right)
      let panValue = 0; // Center
      if (obj && Array.isArray(obj.bbox) && obj.bbox.length >= 3) {
        const centerX = (obj.bbox[0] + obj.bbox[2]) / 2;
        panValue = Math.max(-0.95, Math.min(0.95, (centerX - 0.5) * 2));
      }

      // Frequency calculation: closer = higher urgent pitch
      // < 1.2m: 880Hz (A5)
      // 2.0m: 600Hz
      // 4.0m+: 420Hz
      const minFreq = 400;
      const maxFreq = 950;
      const clampedDist = Math.max(0.6, Math.min(6.0, distance));
      const freq = maxFreq - ((clampedDist - 0.6) / (6.0 - 0.6)) * (maxFreq - minFreq);

      osc.type = distance < 1.5 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.12);

      // Volume scaling
      const volume = distance < 1.5 ? 0.28 : 0.14;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      // Connect with StereoPanner if supported
      if (this.audioCtx.createStereoPanner) {
        const panner = this.audioCtx.createStereoPanner();
        panner.pan.setValueAtTime(panValue, now);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.audioCtx.destination);
      } else {
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
      }

      osc.start(now);
      osc.stop(now + 0.15);

      // Haptic feedback pulse on mobile devices when critical obstacle < 1.5m
      if (distance < 1.5 && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(distance < 1.0 ? [100, 40, 100] : [60]);
      }
    } catch (err) {
      // Audio autoplay policy or browser restriction
    }
  }
}

export const sonarEngine = new AcousticSonarEngine();
