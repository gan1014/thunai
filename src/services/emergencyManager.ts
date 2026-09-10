/**
 * THUNAI Emergency Manager & SOS State Machine
 * 
 * Production-quality assistive safety subsystem:
 * - 10-state deterministic state machine
 * - 120-second countdown with accessibility-first periodic voice announcements
 * - Safe cancellation with 2-step confirmation
 * - Resilient localStorage persistence across page reloads, tab navigation, and unmounts
 * - Multi-channel Twilio escalation trigger
 */

import { centralResponseManager } from './centralResponseManager';
import { locationService, LocationCoordinates } from './locationService';
import { api } from '../api/client';
import {
  DEFAULT_SOS_CONFIG,
  EmergencyEvent,
  EmergencyTelemetryPayload,
  SOSConfig,
  SOSState,
  SOSTriggerMethod,
} from '../types';

export interface SOSSnapshot {
  state: SOSState;
  eventId: string | null;
  secondsRemaining: number;
  totalDurationSeconds: number;
  triggerMethod: SOSTriggerMethod;
  isTestMode: boolean;
  isConfirmingCancel: boolean;
  location: LocationCoordinates | null;
  batteryPct: number;
  lastSpokenPrompt: string;
  activeEvent: EmergencyEvent | null;
}

type SOSListener = (snapshot: SOSSnapshot) => void;

const PERSISTENCE_KEY = 'THUNAI_PERSISTENT_SOS_STATE';

export class EmergencyManager {
  private state: SOSState = 'IDLE';
  private eventId: string | null = null;
  private secondsRemaining = 120;
  private totalDurationSeconds = 120;
  private triggerMethod: SOSTriggerMethod = 'MANUAL_BUTTON';
  private isTestMode = false;
  private isConfirmingCancel = false;
  private location: LocationCoordinates | null = null;
  private batteryPct = 80;
  private lastSpokenPrompt = '';
  private activeEvent: EmergencyEvent | null = null;
  private startTime = 0;

  private timerRef: any = null;
  private announcedMilestones: Set<number> = new Set();
  private listeners: Set<SOSListener> = new Set();
  private config: SOSConfig = DEFAULT_SOS_CONFIG;

  constructor() {
    this.detectBattery();
    this.rehydratePersistedState();
  }

  private detectBattery(): void {
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryPct = Math.round((battery.level || 0.8) * 100);
        battery.addEventListener('levelchange', () => {
          this.batteryPct = Math.round(battery.level * 100);
          this.notify();
        });
      }).catch(() => {});
    }
  }

  /**
   * Rehydrate active countdown if user refreshed or navigated away
   */
  private rehydratePersistedState(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const saved = localStorage.getItem(PERSISTENCE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);

      if (data.state === 'COUNTDOWN_ACTIVE' || data.state === 'CANCELLATION_WINDOW') {
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        const remaining = data.totalDurationSeconds - elapsed;

        this.eventId = data.eventId;
        this.totalDurationSeconds = data.totalDurationSeconds;
        this.triggerMethod = data.triggerMethod;
        this.isTestMode = Boolean(data.isTestMode);
        this.startTime = data.startTime;

        if (remaining > 0) {
          this.state = 'COUNTDOWN_ACTIVE';
          this.secondsRemaining = remaining;
          console.log(`[EmergencyManager] Restored active countdown: ${remaining}s remaining (Event: ${this.eventId})`);
          this.startInterval();
        } else {
          // Timer expired while away: immediately escalate
          this.state = 'ESCALATION_PENDING';
          this.secondsRemaining = 0;
          console.log(`[EmergencyManager] Countdown completed while offline/backgrounded. Escalating immediately.`);
          this.executeEscalation();
        }
      } else if (data.state === 'NOTIFICATION_SENT' || data.state === 'DELIVERY_FAILED') {
        this.state = data.state;
        this.eventId = data.eventId;
        this.isTestMode = Boolean(data.isTestMode);
        this.activeEvent = data.activeEvent || null;
      }
    } catch (err) {
      console.warn('[EmergencyManager] Failed to restore persisted SOS state:', err);
    }
  }

  private persistState(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      if (this.state === 'IDLE' || this.state === 'RESOLVED' || this.state === 'CANCELLED') {
        localStorage.removeItem(PERSISTENCE_KEY);
      } else {
        localStorage.setItem(
          PERSISTENCE_KEY,
          JSON.stringify({
            state: this.state,
            eventId: this.eventId,
            startTime: this.startTime,
            totalDurationSeconds: this.totalDurationSeconds,
            triggerMethod: this.triggerMethod,
            isTestMode: this.isTestMode,
            activeEvent: this.activeEvent,
          })
        );
      }
    } catch (e) {
      console.warn('[EmergencyManager] State persistence failed:', e);
    }
  }

  public subscribe(listener: SOSListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    this.persistState();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  public getSnapshot(): SOSSnapshot {
    return {
      state: this.state,
      eventId: this.eventId,
      secondsRemaining: this.secondsRemaining,
      totalDurationSeconds: this.totalDurationSeconds,
      triggerMethod: this.triggerMethod,
      isTestMode: this.isTestMode,
      isConfirmingCancel: this.isConfirmingCancel,
      location: this.location,
      batteryPct: this.batteryPct,
      lastSpokenPrompt: this.lastSpokenPrompt,
      activeEvent: this.activeEvent,
    };
  }

  public getState(): SOSState {
    return this.state;
  }

  public isEmergencyActive(): boolean {
    return (
      this.state === 'SOS_TRIGGERED' ||
      this.state === 'COUNTDOWN_ACTIVE' ||
      this.state === 'CANCELLATION_WINDOW' ||
      this.state === 'ESCALATION_PENDING' ||
      this.state === 'ESCALATING' ||
      this.state === 'NOTIFICATION_SENT' ||
      this.state === 'DELIVERY_FAILED'
    );
  }

  /**
   * Speak accessible message through Central Response Manager
   */
  private announce(text: string, priority: 'EMERGENCY' | 'CRITICAL_OBSTACLE' | 'NORMAL_GUIDANCE' = 'EMERGENCY'): void {
    this.lastSpokenPrompt = text;
    centralResponseManager.speak(text, priority, 'en');
  }

  /**
   * METHOD 1, 2, 3: Trigger SOS (Button, Voice, Gesture)
   */
  public async triggerSOS(
    method: SOSTriggerMethod = 'MANUAL_BUTTON',
    testMode = false,
    customDuration?: number
  ): Promise<void> {
    if (this.isEmergencyActive()) {
      console.warn('[EmergencyManager] SOS is already active. Ignoring duplicate trigger.');
      return;
    }

    this.isTestMode = testMode;
    this.triggerMethod = method;
    this.totalDurationSeconds = customDuration || (testMode ? this.config.SOS_TEST_TIMEOUT_SECONDS : this.config.SOS_TIMEOUT_SECONDS);
    this.secondsRemaining = this.totalDurationSeconds;
    this.startTime = Date.now();
    this.announcedMilestones.clear();
    this.isConfirmingCancel = false;

    this.state = 'SOS_TRIGGERED';
    this.notify();

    // Acquire GPS location asynchronously
    locationService.getCurrentLocation(5000).then((loc) => {
      this.location = loc;
      this.notify();
    });

    // Start server-side emergency tracking event
    try {
      const serverEvent = await api.startEmergency({
        triggerMethod: method,
        isTestMode: testMode,
        battery: this.batteryPct,
        latitude: this.location?.latitude,
        longitude: this.location?.longitude,
        accuracyMeters: this.location?.accuracyMeters,
      });
      this.eventId = serverEvent.id;
      this.activeEvent = serverEvent;
    } catch (err) {
      console.warn('[EmergencyManager] Server start emergency event fallback:', err);
      this.eventId = `THN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    }

    this.state = 'COUNTDOWN_ACTIVE';
    this.notify();

    // Voice Feedback at 0s
    if (this.isTestMode) {
      this.announce(`Emergency test mode activated. Alert will simulate in ${this.totalDurationSeconds} seconds unless you cancel.`);
    } else {
      this.announce('Emergency mode activated. Emergency alert will be sent in 2 minutes unless you cancel.');
    }

    this.startInterval();
  }

  private startInterval(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
    }

    this.timerRef = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private tick(): void {
    if (this.state !== 'COUNTDOWN_ACTIVE' && this.state !== 'CANCELLATION_WINDOW') {
      if (this.timerRef) clearInterval(this.timerRef);
      return;
    }

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.secondsRemaining = Math.max(0, this.totalDurationSeconds - elapsed);
    this.notify();

    // Periodic Voice Announcements
    if (!this.isTestMode) {
      // 120s Production Schedule:
      // at 30s elapsed (90s remaining)
      if (elapsed >= 30 && !this.announcedMilestones.has(30) && this.secondsRemaining > 80) {
        this.announcedMilestones.add(30);
        this.announce('Emergency mode active. You can say cancel SOS.');
      }
      // at 60s elapsed (60s remaining)
      else if (elapsed >= 60 && !this.announcedMilestones.has(60) && this.secondsRemaining > 50) {
        this.announcedMilestones.add(60);
        this.announce('Emergency alert will be sent in 60 seconds.');
      }
      // at 90s elapsed (30s remaining)
      else if (elapsed >= 90 && !this.announcedMilestones.has(90) && this.secondsRemaining > 20) {
        this.announcedMilestones.add(90);
        this.announce('Emergency alert will be sent in 30 seconds.');
      }
      // at 110s elapsed (10s remaining)
      else if (elapsed >= 110 && !this.announcedMilestones.has(110) && this.secondsRemaining > 0) {
        this.announcedMilestones.add(110);
        this.announce('Emergency alert will be sent in 10 seconds.');
      }
    } else {
      // 10s Test Mode Schedule:
      if (elapsed >= 5 && !this.announcedMilestones.has(5) && this.secondsRemaining > 0) {
        this.announcedMilestones.add(5);
        this.announce('Emergency test alert will send in 5 seconds.');
      }
    }

    // 120s Escalation Threshold
    if (this.secondsRemaining <= 0) {
      if (this.timerRef) clearInterval(this.timerRef);
      this.timerRef = null;
      this.state = 'ESCALATION_PENDING';
      this.notify();
      this.executeEscalation();
    }
  }

  /**
   * Automatic Escalation Dispatch to Twilio Backend
   */
  public async executeEscalation(): Promise<void> {
    this.state = 'ESCALATING';
    this.notify();

    this.announce(
      this.isTestMode
        ? 'Emergency test condition has been escalated. Dispatching test notification.'
        : 'Emergency condition has been escalated. Emergency contacts are being notified.'
    );

    // Refresh location right at escalation moment
    const freshLoc = await locationService.getCurrentLocation(3000);
    this.location = freshLoc;

    const payload: EmergencyTelemetryPayload = {
      eventId: this.eventId || `THN-${Date.now()}`,
      userId: 1,
      userName: 'Arun Kumar',
      status: 'ESCALATING',
      triggerMethod: this.triggerMethod,
      timestamp: new Date().toISOString(),
      latitude: freshLoc.latitude,
      longitude: freshLoc.longitude,
      accuracyMeters: freshLoc.accuracyMeters,
      battery: this.batteryPct,
      mapsUrl: freshLoc.mapsUrl,
      isLastKnownLocation: freshLoc.isLastKnownLocation,
      isTestMode: this.isTestMode,
    };

    try {
      const res = await api.escalateEmergency({
        eventId: this.eventId || payload.eventId,
        telemetry: payload,
      });

      this.activeEvent = res;
      this.state = res.status === 'DELIVERY_FAILED' ? 'DELIVERY_FAILED' : 'NOTIFICATION_SENT';
      this.notify();

      if (this.state === 'NOTIFICATION_SENT') {
        this.announce('Your emergency alert has been sent.');
      } else {
        this.announce('I could not confirm emergency message delivery. Please try contacting your emergency contact directly.');
      }
    } catch (err: any) {
      console.error('[EmergencyManager] Escalation dispatch error:', err);
      this.state = 'DELIVERY_FAILED';
      this.notify();
      this.announce('I could not confirm emergency message delivery. Please try contacting your emergency contact directly.');
    }
  }

  /**
   * Cancellation Step 1: Request cancel & prompt confirmation
   */
  public requestCancel(): void {
    if (!this.isEmergencyActive()) return;
    this.isConfirmingCancel = true;
    this.state = 'CANCELLATION_WINDOW';
    this.notify();
    this.announce('Are you safe? Say confirm cancel or tap confirm to stop the emergency alert.');
  }

  /**
   * Cancellation Step 2: Confirm cancellation and disarm
   */
  public async confirmCancel(): Promise<void> {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }

    this.state = 'CANCELLED';
    this.isConfirmingCancel = false;
    this.notify();

    this.announce('Emergency mode cancelled. You are safe.');

    if (this.eventId) {
      try {
        await api.cancelEmergency({
          eventId: this.eventId,
          reason: 'User confirmed safe during cancellation window',
        });
      } catch (err) {
        console.warn('[EmergencyManager] Server cancel event error:', err);
      }
    }

    setTimeout(() => {
      this.resetToIdle();
    }, 2500);
  }

  /**
   * Abort cancellation and resume countdown
   */
  public abortCancel(): void {
    this.isConfirmingCancel = false;
    this.state = 'COUNTDOWN_ACTIVE';
    this.notify();
    this.announce('Emergency countdown resumed.');
  }

  /**
   * Mark an emergency as resolved
   */
  public async resolveEmergency(): Promise<void> {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }

    if (this.eventId) {
      try {
        await api.resolveEmergency(this.eventId);
      } catch (e) {}
    }

    this.state = 'RESOLVED';
    this.notify();
    this.announce('Emergency situation marked as resolved.');

    setTimeout(() => {
      this.resetToIdle();
    }, 2000);
  }

  public resetToIdle(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
    this.state = 'IDLE';
    this.eventId = null;
    this.secondsRemaining = this.config.SOS_TIMEOUT_SECONDS;
    this.isConfirmingCancel = false;
    this.activeEvent = null;
    this.notify();
  }
}

export const emergencyManager = new EmergencyManager();
