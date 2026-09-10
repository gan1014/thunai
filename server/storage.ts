import type { EmergencyContact, EmergencyEvent, InteractionLog, SessionMetrics, UserProfile } from '../src/types.ts';
import { scientificMetricsEngine } from './scientificMetricsEngine.ts';

export class StorageService {
  private profiles: Map<number, UserProfile> = new Map();
  private sessions: Map<number, {
    id: number;
    user_profile_id: number;
    started_at: string;
    ended_at?: string;
    interactions: InteractionLog[];
  }> = new Map();
  private emergencyContacts: Map<number, EmergencyContact> = new Map();
  private emergencyEvents: Map<string, EmergencyEvent> = new Map();

  private nextProfileId = 1;
  private nextSessionId = 101;
  private nextLogId = 1001;
  private nextContactId = 1;

  constructor() {
    this.seedDefaultProfiles();
    this.seedDemoSession();
    this.seedEmergencyContacts();
    this.seedEmergencyEvents();
  }

  private seedDefaultProfiles() {
    const defaults: Array<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>> = [
      {
        name: 'Arun Kumar (Visual Assistance)',
        accessibility_need: 'visual',
        preferred_language: 'en',
        preferred_output: 'voice',
        text_size: 'xlarge',
        interaction_level: 'moderate',
        emergency_mode: true,
        high_contrast: true,
      },
      {
        name: 'Priya Sundaram (Hearing Impairment)',
        accessibility_need: 'hearing',
        preferred_language: 'ta',
        preferred_output: 'text',
        text_size: 'large',
        interaction_level: 'detailed',
        emergency_mode: true,
        high_contrast: false,
      },
      {
        name: 'Rajesh Sharma (Motor & Gesture)',
        accessibility_need: 'motor',
        preferred_language: 'hi',
        preferred_output: 'visual',
        text_size: 'large',
        interaction_level: 'minimal',
        emergency_mode: true,
        high_contrast: true,
      },
      {
        name: 'Kavita Patel (Senior - High Contrast)',
        accessibility_need: 'cognitive',
        preferred_language: 'en',
        preferred_output: 'voice',
        text_size: 'xlarge',
        interaction_level: 'detailed',
        emergency_mode: true,
        high_contrast: true,
      },
    ];

    defaults.forEach((p) => {
      const id = this.nextProfileId++;
      const now = new Date().toISOString();
      this.profiles.set(id, {
        id,
        ...p,
        created_at: now,
        updated_at: now,
      });
    });
  }

  private seedDemoSession() {
    const sessId = this.nextSessionId++;
    const now = new Date().toISOString();
    const logs: InteractionLog[] = [
      {
        id: this.nextLogId++,
        session_id: sessId,
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        input_type: 'camera',
        input_data_summary: 'Camera frame with exit doorway',
        detected_objects: [
          { label: 'door', confidence: 0.94, bbox: [0.6, 0.2, 0.9, 0.85], distance_meters: 3.0 },
          { label: 'exit_sign', confidence: 0.91, bbox: [0.65, 0.05, 0.85, 0.18], distance_meters: 2.8 },
        ],
        estimated_intent: 'navigation',
        risk_level: 'low',
        risk_score: 0.18,
        confidence: 0.92,
        selected_modality: 'voice',
        response_text: 'The door is 3.0 meters directly ahead. Pathway is clear.',
        response_language: 'en',
        latency_ms: 320,
        was_successful: true,
      },
      {
        id: this.nextLogId++,
        session_id: sessId,
        timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        input_type: 'multimodal',
        input_data_summary: 'Hazardous stairs ahead detected',
        detected_objects: [
          { label: 'stairs', confidence: 0.92, bbox: [0.25, 0.45, 0.75, 0.95], distance_meters: 1.8 },
          { label: 'handrail', confidence: 0.86, bbox: [0.1, 0.4, 0.28, 0.85], distance_meters: 1.6 },
        ],
        estimated_intent: 'safety',
        risk_level: 'high',
        risk_score: 0.74,
        confidence: 0.91,
        selected_modality: 'voice',
        response_text: 'Warning: Descending flight of stairs 1.8 meters ahead. Handrail is on your left.',
        response_language: 'en',
        latency_ms: 290,
        was_successful: true,
      },
      {
        id: this.nextLogId++,
        session_id: sessId,
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        input_type: 'voice',
        input_data_summary: 'Spoken request: "Can you read this prescription bottle?"',
        detected_objects: [
          { label: 'medicine_bottle', confidence: 0.95, bbox: [0.35, 0.3, 0.65, 0.78], distance_meters: 0.8 },
        ],
        estimated_intent: 'identification',
        risk_level: 'medium',
        risk_score: 0.48,
        confidence: 0.94,
        selected_modality: 'voice',
        response_text: 'Prescription Medication Label: Paracetamol 500mg. Take 1 tablet every 6 hours.',
        response_language: 'en',
        latency_ms: 340,
        was_successful: true,
      }
    ];

    this.sessions.set(sessId, {
      id: sessId,
      user_profile_id: 1,
      started_at: now,
      interactions: logs,
    });
  }

  // Profile operations
  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values());
  }

  getProfile(id: number): UserProfile | undefined {
    return this.profiles.get(id);
  }

  createProfile(data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): UserProfile {
    const id = this.nextProfileId++;
    const now = new Date().toISOString();
    const profile: UserProfile = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    };
    this.profiles.set(id, profile);
    return profile;
  }

  updateProfile(id: number, data: Partial<UserProfile>): UserProfile {
    const existing = this.profiles.get(id);
    if (!existing) {
      throw new Error(`Profile ${id} not found`);
    }
    const updated: UserProfile = {
      ...existing,
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(id, updated);
    return updated;
  }

  deleteProfile(id: number): boolean {
    if (id === 1) return false; // Guard default primary profile
    return this.profiles.delete(id);
  }

  // Session operations
  startSession(profileId = 1): number {
    const id = this.nextSessionId++;
    this.sessions.set(id, {
      id,
      user_profile_id: profileId,
      started_at: new Date().toISOString(),
      interactions: [],
    });
    return id;
  }

  endSession(id: number): void {
    const sess = this.sessions.get(id);
    if (sess) {
      sess.ended_at = new Date().toISOString();
    }
  }

  logInteraction(sessionId: number, logData: Omit<InteractionLog, 'id' | 'session_id'>): InteractionLog {
    let sess = this.sessions.get(sessionId);
    if (!sess) {
      const newId = this.startSession(1);
      sess = this.sessions.get(newId)!;
    }

    const log: InteractionLog = {
      id: this.nextLogId++,
      session_id: sess.id,
      ...logData,
    };

    sess.interactions.push(log);
    return log;
  }

  getSession(id: number) {
    return this.sessions.get(id);
  }

  getSessionMetrics(id: number): SessionMetrics {
    const sess = this.sessions.get(id);
    const logs = sess ? sess.interactions : [];

    const total = logs.length;
    if (total === 0) {
      return {
        total_interactions: 0,
        avg_latency_ms: 0,
        task_success_count: 0,
        task_success_rate: 0,
        avg_aas_score: 0,
        modality_distribution: { voice: 0, text: 0, visual: 0 },
        risk_distribution: { low: 0, medium: 0, high: 0, critical: 0 },
        intent_distribution: {},
        interactions_history: [],
        scientific_metrics: scientificMetricsEngine.computeMetrics([]),
      };
    }

    let sumLatency = 0;
    let successes = 0;
    const modalityCounts = { voice: 0, text: 0, visual: 0 };
    const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    const intentCounts: Record<string, number> = {};

    const history = logs.map((log, idx) => {
      sumLatency += log.latency_ms;
      if (log.was_successful) successes++;
      if (log.selected_modality in modalityCounts) {
        modalityCounts[log.selected_modality]++;
      }
      if (log.risk_level in riskCounts) {
        riskCounts[log.risk_level]++;
      }
      intentCounts[log.estimated_intent] = (intentCounts[log.estimated_intent] || 0) + 1;

      return {
        timestamp: new Date(log.timestamp).getTime(),
        aas_score: Math.min(100, Math.max(65, 78 + (idx % 4) * 5 + (log.was_successful ? 8 : -10))),
        latency_ms: log.latency_ms,
        confidence: log.confidence,
        risk_level: log.risk_level,
        modality: log.selected_modality,
        intent: log.estimated_intent,
      };
    });

    const avgAas = history.reduce((acc, h) => acc + h.aas_score, 0) / total;

    return {
      total_interactions: total,
      avg_latency_ms: Math.round(sumLatency / total),
      task_success_count: successes,
      task_success_rate: Number(((successes / total) * 100).toFixed(1)),
      avg_aas_score: Number(avgAas.toFixed(1)),
      modality_distribution: modalityCounts,
      risk_distribution: riskCounts,
      intent_distribution: intentCounts,
      interactions_history: history,
      scientific_metrics: scientificMetricsEngine.computeMetrics(logs),
    };
  }

  // ==========================================
  // EMERGENCY CONTACT OPERATIONS
  // ==========================================

  private seedEmergencyContacts() {
    const defaultContacts: Array<Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>> = [
      {
        userId: 1,
        name: 'Primary Caretaker & Physician',
        phone: '+91 89395 17847',
        whatsapp_enabled: true,
        relationship: 'Primary Physician & Caretaker',
        is_primary: true,
      },
      {
        userId: 1,
        name: 'Deepa Kumar (Emergency Contact / Family)',
        phone: '+91 89395 17847',
        whatsapp_enabled: true,
        relationship: 'Family Member (Sister)',
        is_primary: false,
      },
    ];

    defaultContacts.forEach((c) => {
      const id = this.nextContactId++;
      const now = new Date().toISOString();
      this.emergencyContacts.set(id, {
        id,
        ...c,
        created_at: now,
        updated_at: now,
      });
    });
  }

  getEmergencyContacts(userId = 1): EmergencyContact[] {
    return Array.from(this.emergencyContacts.values()).filter(
      (c) => !c.userId || c.userId === userId
    );
  }

  getPrimaryEmergencyContact(userId = 1): EmergencyContact | undefined {
    const contacts = this.getEmergencyContacts(userId);
    return contacts.find((c) => c.is_primary) || contacts[0];
  }

  createEmergencyContact(data: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>): EmergencyContact {
    const id = this.nextContactId++;
    const now = new Date().toISOString();

    // If marked as primary, unmark other contacts for this user
    if (data.is_primary) {
      this.emergencyContacts.forEach((c) => {
        if (c.userId === (data.userId || 1)) {
          c.is_primary = false;
        }
      });
    }

    const contact: EmergencyContact = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    };
    this.emergencyContacts.set(id, contact);
    return contact;
  }

  updateEmergencyContact(id: number, data: Partial<EmergencyContact>): EmergencyContact {
    const existing = this.emergencyContacts.get(id);
    if (!existing) {
      throw new Error(`Emergency contact ${id} not found`);
    }

    if (data.is_primary) {
      this.emergencyContacts.forEach((c) => {
        if (c.id !== id && c.userId === existing.userId) {
          c.is_primary = false;
        }
      });
    }

    const updated: EmergencyContact = {
      ...existing,
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    this.emergencyContacts.set(id, updated);
    return updated;
  }

  deleteEmergencyContact(id: number): boolean {
    return this.emergencyContacts.delete(id);
  }

  // ==========================================
  // EMERGENCY EVENT LOG OPERATIONS
  // ==========================================

  private seedEmergencyEvents() {
    const now = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
    const eventId = 'THN-20260910-001';
    this.emergencyEvents.set(eventId, {
      id: eventId,
      userId: 1,
      userName: 'Arun Kumar',
      triggerMethod: 'GESTURE_TRIGGER',
      status: 'RESOLVED',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 - 120000).toISOString(),
      escalatedAt: now,
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 300000).toISOString(),
      latitude: 13.0827,
      longitude: 80.2707,
      accuracyMeters: 12,
      battery: 78,
      mapsUrl: 'https://www.google.com/maps?q=13.0827,80.2707',
      isTestMode: false,
      smsStatus: 'DELIVERED',
      smsMessageSid: 'SM_demo_seeded_7718',
      whatsappStatus: 'DELIVERED',
      whatsappMessageSid: 'WA_demo_seeded_9921',
      contactNotified: {
        name: 'Dr. Ramesh S',
        phone: '+91 98765 43210',
        relationship: 'Primary Physician & Caretaker',
      },
      created_at: now,
      updated_at: now,
    });
  }

  createEmergencyEvent(eventData: Omit<EmergencyEvent, 'created_at' | 'updated_at'>): EmergencyEvent {
    const now = new Date().toISOString();
    const event: EmergencyEvent = {
      ...eventData,
      created_at: now,
      updated_at: now,
    };
    this.emergencyEvents.set(event.id, event);
    return event;
  }

  getEmergencyEvent(id: string): EmergencyEvent | undefined {
    return this.emergencyEvents.get(id);
  }

  updateEmergencyEvent(id: string, updates: Partial<EmergencyEvent>): EmergencyEvent {
    const existing = this.emergencyEvents.get(id);
    if (!existing) {
      throw new Error(`Emergency event ${id} not found`);
    }
    const updated: EmergencyEvent = {
      ...existing,
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };
    this.emergencyEvents.set(id, updated);
    return updated;
  }

  getAllEmergencyEvents(userId?: number): EmergencyEvent[] {
    const events = Array.from(this.emergencyEvents.values());
    const filtered = userId ? events.filter((e) => e.userId === userId) : events;
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export const storageService = new StorageService();

