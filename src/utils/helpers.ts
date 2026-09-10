import { RiskLevel, TextSize } from '../types';

export function formatTimestamp(ts: number | string): string {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function truncate(text: string, maxLen = 80): string {
  if (!text) return '';
  return text.length > maxLen ? `${text.substring(0, maxLen)}...` : text;
}

export function riskColor(level: RiskLevel): { bg: string; text: string; border: string; badge: string } {
  switch (level) {
    case 'critical':
      return {
        bg: 'bg-red-950/40',
        text: 'text-red-400',
        border: 'border-red-500',
        badge: 'bg-red-500 text-white animate-pulse',
      };
    case 'high':
      return {
        bg: 'bg-orange-950/40',
        text: 'text-orange-400',
        border: 'border-orange-500',
        badge: 'bg-orange-500 text-white',
      };
    case 'medium':
      return {
        bg: 'bg-amber-950/40',
        text: 'text-amber-400',
        border: 'border-amber-500',
        badge: 'bg-amber-500/80 text-black',
      };
    default:
      return {
        bg: 'bg-emerald-950/30',
        text: 'text-emerald-400',
        border: 'border-emerald-500',
        badge: 'bg-emerald-500 text-white',
      };
  }
}

export function getTextSizeClass(size?: TextSize): string {
  switch (size) {
    case 'small':
      return 'text-sm leading-normal';
    case 'large':
      return 'text-lg leading-relaxed';
    case 'xlarge':
      return 'text-xl md:text-2xl leading-relaxed';
    case 'medium':
    default:
      return 'text-base leading-relaxed';
  }
}

/**
 * Procedural Web Audio API sound synthesis:
 * Generates immediate non-blocking audio feedback without relying on external mp3 assets.
 */
export function playAlertSound(type: 'critical' | 'warning' | 'chime' | 'beep' = 'chime') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'critical') {
      // Rapid urgent alternating alarm
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.1);
      osc.frequency.setValueAtTime(880, now + 0.2);
      osc.frequency.setValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'warning') {
      // Double advisory pulse
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(650, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Soft gentle confirmation chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (err) {
    console.warn('Audio feedback synthesis bypassed:', err);
  }
}
