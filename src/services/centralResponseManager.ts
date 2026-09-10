/**
 * THUNAI Central Response & State Manager
 * 
 * Guarantees exactly ONE module can speak at any given time,
 * coordinates the priority speech queue, real-time state machine,
 * and instant barge-in / interruption.
 */

import { LanguageCode } from '../types';

export type AssistantState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING_COMMAND'
  | 'CAMERA_STARTING'
  | 'ANALYZING'
  | 'RESPONDING'
  | 'EMERGENCY'
  | 'ERROR';

export type SpeechPriority =
  | 'EMERGENCY'          // Preempts all
  | 'CRITICAL_OBSTACLE'   // Preempts normal queries
  | 'USER_DIRECT_QUESTION'
  | 'NORMAL_GUIDANCE'
  | 'BACKGROUND_INFO';

export interface SpeechQueueItem {
  id: string;
  text: string;
  priority: SpeechPriority;
  language: LanguageCode;
  timestamp: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

const PRIORITY_SCORES: Record<SpeechPriority, number> = {
  EMERGENCY: 100,
  CRITICAL_OBSTACLE: 80,
  USER_DIRECT_QUESTION: 60,
  NORMAL_GUIDANCE: 40,
  BACKGROUND_INFO: 20,
};

class CentralResponseManager {
  private currentState: AssistantState = 'IDLE';
  private speechQueue: SpeechQueueItem[] = [];
  private currentSpeechItem: SpeechQueueItem | null = null;
  private isSpeaking = false;
  private listeners: Set<(state: AssistantState, currentText?: string) => void> = new Set();
  private lastSpokenText = '';
  private lastSpokenTime = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }

  getState(): AssistantState {
    return this.currentState;
  }

  setState(state: AssistantState, metadataText?: string): void {
    this.currentState = state;
    this.notifyListeners(metadataText);
  }

  subscribe(listener: (state: AssistantState, currentText?: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(text?: string): void {
    this.listeners.forEach((fn) => fn(this.currentState, text));
  }

  /**
   * Enqueues speech and plays based on priority.
   */
  speak(
    text: string,
    priority: SpeechPriority = 'USER_DIRECT_QUESTION',
    language: LanguageCode = 'en',
    callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: (err: any) => void }
  ): void {
    if (!text || !text.trim()) return;

    // Prevent immediate duplicate spam
    const now = Date.now();
    if (text === this.lastSpokenText && now - this.lastSpokenTime < 2000 && priority !== 'EMERGENCY') {
      return;
    }

    const item: SpeechQueueItem = {
      id: `speech_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      text: text.trim(),
      priority,
      language,
      timestamp: now,
      ...callbacks,
    };

    // If higher priority (EMERGENCY or CRITICAL_OBSTACLE), preempt current speech
    if (this.currentSpeechItem && PRIORITY_SCORES[priority] > PRIORITY_SCORES[this.currentSpeechItem.priority]) {
      this.cancelCurrentSpeech();
      this.speechQueue.unshift(item);
      this.processQueue();
      return;
    }

    // Insert sorted by priority
    const idx = this.speechQueue.findIndex((q) => PRIORITY_SCORES[q.priority] < PRIORITY_SCORES[priority]);
    if (idx === -1) {
      this.speechQueue.push(item);
    } else {
      this.speechQueue.splice(idx, 0, item);
    }

    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.speechQueue.length === 0 || this.isSpeaking) return;

    const item = this.speechQueue.shift()!;
    this.currentSpeechItem = item;
    this.isSpeaking = true;
    this.setState('RESPONDING', item.text);

    this.lastSpokenText = item.text;
    this.lastSpokenTime = Date.now();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isSpeaking = false;
      this.currentSpeechItem = null;
      this.setState('LISTENING');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(item.text);

      let langCode = 'en-IN';
      if (item.language === 'hi') langCode = 'hi-IN';
      else if (item.language === 'ta') langCode = 'ta-IN';
      else if (item.language === 'te') langCode = 'te-IN';
      else if (item.language === 'bn') langCode = 'bn-IN';
      else if (item.language === 'mr') langCode = 'mr-IN';
      else if (item.language === 'kn') langCode = 'kn-IN';

      utterance.lang = langCode;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const matchVoice = voices.find((v) => v.lang.startsWith(langCode.split('-')[0]));
      if (matchVoice) {
        utterance.voice = matchVoice;
      }

      utterance.onstart = () => {
        if (item.onStart) item.onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentSpeechItem = null;
        if (item.onEnd) item.onEnd();
        this.setState('LISTENING');
        this.processQueue();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.currentSpeechItem = null;
        if (item.onError) item.onError(e);
        this.setState('LISTENING');
        this.processQueue();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('TTS execution error:', err);
      this.isSpeaking = false;
      this.currentSpeechItem = null;
      this.setState('LISTENING');
    }
  }

  /**
   * Barge-in interruption: immediately stops active TTS and clears queue.
   */
  interrupt(): void {
    this.cancelCurrentSpeech();
    this.speechQueue = [];
    this.setState('LISTENING', 'Interrupted');
  }

  private cancelCurrentSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentSpeechItem = null;
  }

  getLastSpokenText(): string {
    return this.lastSpokenText;
  }
}

export const centralResponseManager = new CentralResponseManager();
