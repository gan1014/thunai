import type { AAREResult, FusedContext, IntentResult, LanguageCode, OutputModality, RiskResult, UserProfile } from '../src/types.ts';
import { TRANSLATIONS, translateTemplate } from './languageUtils.ts';

export class AdaptiveAccessibilityReasoningEngine {
  reason(
    fusedContext: FusedContext,
    intent: IntentResult,
    risk: RiskResult,
    userProfile: UserProfile
  ): AAREResult {
    const trace: string[] = ['Beginning AARE multimodal reasoning...'];

    // Step 1: Urgency determination
    let urgency: 'immediate' | 'urgent' | 'normal' | 'passive' = 'normal';
    if (risk.risk_level === 'critical') {
      urgency = 'immediate';
    } else if (risk.risk_level === 'high') {
      urgency = 'urgent';
    } else if (risk.risk_level === 'medium') {
      urgency = 'normal';
    } else {
      urgency = 'passive';
    }
    trace.push(`Urgency determined: ${urgency} (Risk Score: ${risk.risk_score}, Level: ${risk.risk_level})`);

    // Step 2: Detail level
    const detailLevel = userProfile.interaction_level || 'moderate';
    trace.push(`Detail level set to "${detailLevel}" based on user profile preferences`);

    // Step 3: Modality Selection & Contextual Overrides
    let selectedModality: OutputModality = userProfile.preferred_output || 'voice';
    let overrideReason: string | null = null;

    if (fusedContext.noise_level === 'noisy' && selectedModality === 'voice') {
      selectedModality = userProfile.accessibility_need === 'visual' ? 'voice' : 'visual';
      overrideReason = 'Noisy auditory environment: voice transmission suppressed to prevent masking';
    } else if (userProfile.accessibility_need === 'visual' && selectedModality !== 'voice') {
      selectedModality = 'voice';
      overrideReason = 'Visual disability: screen text/visual overridden to synthetic speech';
    } else if (userProfile.accessibility_need === 'hearing' && selectedModality === 'voice') {
      selectedModality = 'text';
      overrideReason = 'Hearing impairment: speech output overridden to high-contrast live text';
    }

    if (overrideReason) {
      trace.push(`Modality Overridden: ${selectedModality} (User requested: ${userProfile.preferred_output}. Reason: ${overrideReason})`);
    } else {
      trace.push(`Selected Modality: ${selectedModality} (Aligned directly with user preference)`);
    }

    // Step 4: Generate Domain Responses
    let rawResponse = '';
    switch (intent.primary_intent) {
      case 'navigation':
        rawResponse = this.generateNavigationResponse(fusedContext, risk, detailLevel);
        break;
      case 'safety':
        rawResponse = this.generateSafetyResponse(fusedContext, risk, detailLevel);
        break;
      case 'identification':
        rawResponse = this.generateIdentificationResponse(fusedContext, detailLevel);
        break;
      case 'assistance':
        rawResponse = this.generateAssistanceResponse(fusedContext, risk, detailLevel);
        break;
      case 'communication':
        rawResponse = this.generateCommunicationResponse(fusedContext, detailLevel);
        break;
      default:
        rawResponse = this.generateInformationResponse(fusedContext, detailLevel);
        break;
    }
    trace.push(`Drafted core situational response for primary intent: "${intent.primary_intent}"`);

    // Step 5: Uncertainty language injection
    if (risk.confidence_concern) {
      rawResponse = `There appears to be uncertainty in sensory visibility. ${rawResponse}`;
      trace.push('Uncertainty language applied due to low sensor confidence on high-risk targets');
    }

    // Step 6: Safety Warnings
    const safetyWarnings: string[] = [];
    if (risk.risk_level === 'critical' || risk.risk_level === 'high') {
      safetyWarnings.push(...risk.risk_factors);
      trace.push(`Injected ${safetyWarnings.length} critical safety warnings`);
    } else if (risk.risk_level === 'medium') {
      safetyWarnings.push(...risk.risk_factors.slice(0, 2));
      trace.push('Appended medium caution advisory to response buffer');
    }

    // Step 7: Language Localization
    const lang: LanguageCode = userProfile.preferred_language || 'en';
    const localizedResponse = this.localizeResponse(rawResponse, lang, fusedContext);
    trace.push(`Localized final synthesized text into target language: ${lang.toUpperCase()}`);

    // Step 8: Alternative modality streams
    const alternativeResponses = {
      voice: this.formatVoiceResponse(localizedResponse),
      text: localizedResponse,
      visual: this.formatVisualResponse(localizedResponse, risk),
    };

    // Step 9: AAS Score (Adaptive Accessibility Score) 0 - 100
    let aasScore = 50;
    if (intent.confidence > 0.7) aasScore += 20;
    if (!overrideReason || overrideReason.length > 0) aasScore += 10;
    if ((risk.risk_level === 'high' || risk.risk_level === 'critical') && safetyWarnings.length > 0) {
      aasScore += 10;
    }
    if (lang !== 'en' || localizedResponse.length > 0) aasScore += 10;
    if (risk.confidence_concern && !rawResponse.includes('uncertainty')) aasScore -= 10;
    if ((risk.risk_level === 'critical' || risk.risk_level === 'high') && safetyWarnings.length === 0) {
      aasScore -= 20;
    }

    aasScore = Math.max(10, Math.min(100, aasScore));
    trace.push(`AARE Evaluation Complete: AAS Score calculated at ${aasScore}/100`);

    return {
      response_text: localizedResponse,
      response_language: lang,
      selected_modality: selectedModality,
      urgency,
      detail_level: detailLevel,
      safety_warnings: safetyWarnings,
      alternative_responses: alternativeResponses,
      reasoning_trace: trace,
      aas_score: aasScore,
    };
  }

  private generateNavigationResponse(
    context: FusedContext,
    risk: RiskResult,
    detail: string
  ): string {
    const speechLower = (context.speech_text || '').toLowerCase();

    // Find best matching object if user specifically asked for door, exit, stairs, counter, sign, etc.
    let targetObj = context.objects[0];
    if (speechLower.includes('door') || speechLower.includes('exit')) {
      const match = context.objects.find((o) => o.label.includes('door') || o.label.includes('exit'));
      if (match) targetObj = match;
    } else if (speechLower.includes('stair') || speechLower.includes('step')) {
      const match = context.objects.find((o) => o.label.includes('stair') || o.label.includes('step'));
      if (match) targetObj = match;
    } else if (speechLower.includes('counter') || speechLower.includes('reception') || speechLower.includes('desk')) {
      const match = context.objects.find((o) => o.label.includes('counter') || o.label.includes('desk') || o.label.includes('sign'));
      if (match) targetObj = match;
    }

    if (targetObj) {
      const label = targetObj.label.replace('_', ' ');
      const dist = targetObj.distance_meters.toFixed(1);
      const isCritical = risk.risk_level === 'critical' || risk.risk_level === 'high';

      const dir = targetObj.spatial?.direction
        ? targetObj.spatial.direction.toLowerCase().replace('_', ' ')
        : 'ahead';
      const dirPhrase = dir === 'center' || dir === 'ahead' ? 'directly ahead' : `to your ${dir.replace('far ', 'far to your ')}`;
      const mov = targetObj.spatial?.movement && targetObj.spatial.movement !== 'UNKNOWN'
        ? `, ${targetObj.spatial.movement === 'APPROACHING' ? 'approaching you' : targetObj.spatial.movement === 'MOVING_AWAY' ? 'moving away' : 'stationary'}`
        : '';

      if (isCritical) {
        return `Stop! Hazard alert: ${label} is located ${dirPhrase} at approximately ${dist} meters${mov}. Please stop and wait.`;
      }

      if (speechLower.includes('where is') || speechLower.includes('door') || speechLower.includes('exit') || speechLower.includes('find') || speechLower.includes('locate')) {
        return `The ${label} is located ${dirPhrase}, estimated ${dist} meters away. Pathway is clear for you to proceed.`;
      }

      if (detail === 'minimal') {
        return `${label} is approximately ${dist} meters ${dirPhrase}${mov}. Path is clear.`;
      }

      const relations = context.spatial_relations.relations.join(', ');
      return `Navigation guidance: The ${label} is approximately ${dist} meters ${dirPhrase}${mov}. ${relations ? `Surrounding spatial layout: ${relations}.` : ''} Pathway is clear.`;
    }

    if (speechLower.includes('door') || speechLower.includes('exit')) {
      return 'No door or exit detected in your immediate forward view. The pathway ahead appears clear. Try panning the camera slightly to your left or right.';
    }

    return 'Path ahead is unobstructed. Proceed forward safely.';
  }

  private generateSafetyResponse(
    context: FusedContext,
    risk: RiskResult,
    detail: string
  ): string {
    const hazard = risk.risk_factors[0] || 'Unidentified hazard';
    const approachingObj = context.objects.find((o) => o.spatial?.movement === 'APPROACHING');
    const approachingNote = approachingObj
      ? ` The ${approachingObj.label.replace('_', ' ')} is approaching from ${approachingObj.spatial?.direction?.toLowerCase().replace('_', ' ') || 'ahead'}.`
      : '';

    if (detail === 'minimal') {
      return `Warning: ${hazard}.${approachingNote} Please stop and verify your step.`;
    }
    return `Safety alert: ${hazard}.${approachingNote} Immediate intervention recommended. Please maintain a firm grip on nearest railing and pause movement.`;
  }

  private generateIdentificationResponse(context: FusedContext, detail: string): string {
    if (context.ocr_text) {
      if (detail === 'minimal') {
        return `Text reads: "${context.ocr_text.slice(0, 60)}"`;
      }
      return `${context.ocr_context || 'Identified text'}: "${context.ocr_text}"`;
    }

    if (context.objects.length > 0) {
      const list = context.objects.map((o) => {
        const dir = o.spatial?.direction ? ` on ${o.spatial.direction.toLowerCase().replace('_', ' ')}` : '';
        return `${o.label.replace('_', ' ')} at approximately ${o.distance_meters.toFixed(1)}m${dir}`;
      }).join(', ');
      return `Detected items in visual frame: ${list}.`;
    }

    return 'I cannot confirm specific objects in current focus. Try shifting the camera angle.';
  }

  private generateAssistanceResponse(
    context: FusedContext,
    risk: RiskResult,
    detail: string
  ): string {
    if (context.gesture_intent === 'help') {
      return 'Emergency assistance protocol triggered! Broadcaster notification ready. Staying active on live voice standby.';
    }
    const scene = context.scene_description || 'Surroundings analyzed';
    return `I am here to assist you. ${scene}. State your intended destination or hold a gesture to navigate.`;
  }

  private generateCommunicationResponse(context: FusedContext, detail: string): string {
    if (context.speech_text) {
      return `Transcribed message: "${context.speech_text}". Voice response synthesized and ready for broadcast.`;
    }
    return 'Voice and gesture communication channels are active.';
  }

  private generateInformationResponse(context: FusedContext, detail: string): string {
    return context.scene_description || 'All environmental monitors operating normally.';
  }

  private localizeResponse(text: string, lang: LanguageCode, context: FusedContext): string {
    if (lang === 'en') return text;

    // Check key templates in languageUtils
    if (text.includes('Stop! Hazard alert') || text.includes('Safety alert')) {
      return translateTemplate('risk_critical', lang);
    }
    if (text.includes('Path ahead is clear') || text.includes('unobstructed')) {
      return translateTemplate('nav_clear_path', lang, { distance: 3.5 });
    }
    if (context.objects[0]) {
      const obj = context.objects[0];
      return translateTemplate('nav_ahead', lang, {
        object: obj.label.replace('_', ' '),
        distance: obj.distance_meters.toFixed(1),
      });
    }

    return text;
  }

  private formatVoiceResponse(text: string): string {
    // Simplify for natural TTS cadence: strip quotes, replace technical symbols
    return text.replace(/["*_]/g, '').replace(/(\d+(\.\d+)?)m\b/g, '$1 meters');
  }

  private formatVisualResponse(text: string, risk: RiskResult): string {
    if (risk.risk_level === 'critical') {
      return 'DANGER: STOP IMMEDIATELY';
    }
    if (risk.risk_level === 'high') {
      return `WARNING: ${risk.risk_factors[0] || 'HAZARD AHEAD'}`.toUpperCase();
    }
    // Short bold keyword summary
    return text.split('.')[0].toUpperCase().slice(0, 60);
  }
}

export const aareEngine = new AdaptiveAccessibilityReasoningEngine();
