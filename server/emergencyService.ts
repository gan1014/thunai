/**
 * THUNAI Server-Side Emergency Lifecycle & Escalation Service
 * 
 * Orchestrates SOS State Machine transitions, telemetry assembly,
 * Twilio multi-channel delivery, persistence, and deterministic safety gating.
 */

import { storageService } from './storage.ts';
import { twilioService } from './twilioService.ts';
import type {
  EmergencyContact,
  EmergencyEvent,
  EmergencyTelemetryPayload,
  SOSTriggerMethod,
  SOSState,
} from '../src/types.ts';

export class EmergencyService {
  /**
   * Generate a structured event ID: THN-YYYYMMDD-RANDOM
   */
  public generateEventId(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `THN-${dateStr}-${rand}`;
  }

  /**
   * Start an emergency countdown event
   */
  public startEmergency(params: {
    userId?: number;
    userName?: string;
    triggerMethod: SOSTriggerMethod;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
    battery?: number;
    isTestMode?: boolean;
  }): EmergencyEvent {
    const userId = params.userId || 1;
    const profile = storageService.getProfile(userId);
    const userName = params.userName || profile?.name || 'THUNAI User';
    const eventId = this.generateEventId();
    const now = new Date().toISOString();

    const lat = params.latitude || 13.0827;
    const lng = params.longitude || 80.2707;
    const accuracy = params.accuracyMeters || 10;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    const contact = storageService.getPrimaryEmergencyContact(userId);

    const event: EmergencyEvent = {
      id: eventId,
      userId,
      userName,
      triggerMethod: params.triggerMethod,
      status: 'COUNTDOWN_ACTIVE',
      startedAt: now,
      latitude: lat,
      longitude: lng,
      accuracyMeters: accuracy,
      battery: params.battery !== undefined ? params.battery : 85,
      mapsUrl,
      isTestMode: Boolean(params.isTestMode),
      smsStatus: 'PENDING',
      whatsappStatus: 'PENDING',
      contactNotified: contact
        ? {
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            relationship: contact.relationship,
          }
        : undefined,
      created_at: now,
      updated_at: now,
    };

    return storageService.createEmergencyEvent(event);
  }

  /**
   * Cancel an in-flight emergency countdown
   */
  public cancelEmergency(params: {
    eventId: string;
    reason?: string;
  }): EmergencyEvent {
    const existing = storageService.getEmergencyEvent(params.eventId);
    if (!existing) {
      throw new Error(`Emergency event ${params.eventId} not found`);
    }

    if (existing.status === 'NOTIFICATION_SENT' || existing.status === 'RESOLVED') {
      console.warn(`[EmergencyService] Event ${params.eventId} was already escalated.`);
    }

    const updated = storageService.updateEmergencyEvent(params.eventId, {
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
    });

    console.log(`[EmergencyService] Event ${params.eventId} cancelled by user. Reason: ${params.reason || 'User confirmed safe'}`);
    return updated;
  }

  /**
   * Deterministic Escalation: Dispatches Twilio SMS and WhatsApp notifications
   */
  public async escalateEmergency(params: {
    eventId: string;
    telemetry?: Partial<EmergencyTelemetryPayload>;
  }): Promise<EmergencyEvent> {
    let event = storageService.getEmergencyEvent(params.eventId);
    if (!event) {
      // If event was not initiated prior, create an escalated event on the fly
      const fallbackEvent = this.startEmergency({
        userId: params.telemetry?.userId ? Number(params.telemetry.userId) : 1,
        userName: params.telemetry?.userName,
        triggerMethod: params.telemetry?.triggerMethod || 'MANUAL_BUTTON',
        latitude: params.telemetry?.latitude,
        longitude: params.telemetry?.longitude,
        accuracyMeters: params.telemetry?.accuracyMeters,
        battery: params.telemetry?.battery,
        isTestMode: params.telemetry?.isTestMode,
      });
      event = fallbackEvent;
    }

    if (event.status === 'CANCELLED') {
      throw new Error(`Cannot escalate cancelled emergency event ${event.id}`);
    }

    const now = new Date().toISOString();
    storageService.updateEmergencyEvent(event.id, {
      status: 'ESCALATING',
      escalatedAt: now,
    });

    // Determine target contact
    const contact = storageService.getPrimaryEmergencyContact(event.userId);
    const targetPhone = contact?.phone || '+919876543210';
    const targetName = contact?.name || 'Emergency Contact';

    const payload: EmergencyTelemetryPayload = {
      eventId: event.id,
      userId: event.userId,
      userName: event.userName,
      status: 'ESCALATING',
      triggerMethod: event.triggerMethod,
      timestamp: now,
      latitude: params.telemetry?.latitude || event.latitude,
      longitude: params.telemetry?.longitude || event.longitude,
      accuracyMeters: params.telemetry?.accuracyMeters || event.accuracyMeters,
      battery: params.telemetry?.battery !== undefined ? params.telemetry.battery : event.battery,
      mapsUrl: `https://www.google.com/maps?q=${params.telemetry?.latitude || event.latitude},${params.telemetry?.longitude || event.longitude}`,
      isLastKnownLocation: Boolean(params.telemetry?.isLastKnownLocation),
      emergencyContactId: contact?.id,
      emergencyContactName: targetName,
      emergencyContactPhone: targetPhone,
      isTestMode: event.isTestMode,
    };

    // Dispatch SMS & WhatsApp simultaneously
    const [smsResult, waResult] = await Promise.all([
      twilioService.sendSMS(targetPhone, payload),
      twilioService.sendWhatsApp(targetPhone, payload),
    ]);

    const bothFailed = smsResult.status === 'FAILED' && waResult.status === 'FAILED';
    const finalStatus: SOSState = bothFailed ? 'DELIVERY_FAILED' : 'NOTIFICATION_SENT';

    const updatedEvent = storageService.updateEmergencyEvent(event.id, {
      status: finalStatus,
      smsStatus: smsResult.status,
      smsMessageSid: smsResult.messageSid,
      smsError: smsResult.error,
      whatsappStatus: waResult.status,
      whatsappMessageSid: waResult.messageSid,
      whatsappError: waResult.error,
      contactNotified: {
        id: contact?.id,
        name: targetName,
        phone: targetPhone,
        relationship: contact?.relationship || 'Primary Emergency Contact',
      },
      updated_at: new Date().toISOString(),
    });

    console.log(`[EmergencyService] Escalation completed for ${event.id}. Status: ${finalStatus} (SMS: ${smsResult.status}, WA: ${waResult.status})`);
    return updatedEvent;
  }

  /**
   * Resolve an emergency
   */
  public resolveEmergency(eventId: string): EmergencyEvent {
    const existing = storageService.getEmergencyEvent(eventId);
    if (!existing) {
      throw new Error(`Emergency event ${eventId} not found`);
    }

    return storageService.updateEmergencyEvent(eventId, {
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
    });
  }
}

export const emergencyService = new EmergencyService();
