import type { DetectedObject, FusedContext, GestureResult, OCRResult, SpeechResult, UserProfile, IntentResult, RiskLevel, RiskResult } from '../src/types.ts';

export class ContextFusion {
  fuse(
    visionData: {
      objects: DetectedObject[];
      sceneDescription: string;
      spatialRelations: { relations: string[] };
    },
    speechData: SpeechResult | null,
    gestureData: GestureResult | null,
    ocrData: OCRResult | null,
    userProfile: UserProfile,
    conversationHistory: Array<{ role: string; content: string; timestamp: number }>,
    overrides?: {
      noise_level?: 'quiet' | 'moderate' | 'noisy';
      environment_type?: 'indoor' | 'outdoor' | 'transit' | 'medical';
    }
  ): FusedContext {
    const objects = visionData.objects || [];
    const ocrText = ocrData?.raw_text || '';

    const environmentType =
      overrides?.environment_type || this.estimateEnvironment(objects, ocrText);
    const noiseLevel =
      overrides?.noise_level || this.estimateNoise(speechData?.confidence, environmentType);

    return {
      objects,
      scene_description: visionData.sceneDescription,
      spatial_relations: visionData.spatialRelations,
      speech_text: speechData?.text || '',
      speech_language: speechData?.language || userProfile.preferred_language,
      gesture_intent: gestureData?.intent || '',
      ocr_text: ocrText,
      ocr_context: ocrData?.context || '',
      user_need: userProfile.accessibility_need,
      user_language: userProfile.preferred_language,
      user_preferred_output: userProfile.preferred_output,
      interaction_level: userProfile.interaction_level,
      conversation_history: conversationHistory.slice(-10),
      environment_type: environmentType,
      noise_level: noiseLevel,
      timestamp: Date.now(),
    };
  }

  estimateEnvironment(
    objects: DetectedObject[],
    ocrText: string
  ): 'indoor' | 'outdoor' | 'transit' | 'medical' {
    const labels = objects.map((o) => o.label.toLowerCase());
    const text = ocrText.toLowerCase();

    // Medical checks
    if (
      labels.includes('medicine_bottle') ||
      text.includes('mg') ||
      text.includes('tablet') ||
      text.includes('hospital') ||
      text.includes('clinic') ||
      text.includes('doctor')
    ) {
      return 'medical';
    }

    // Transit checks
    if (
      labels.includes('vehicle') ||
      labels.includes('traffic_light') ||
      text.includes('metro') ||
      text.includes('bus') ||
      text.includes('train') ||
      text.includes('platform')
    ) {
      return 'transit';
    }

    // Outdoor checks
    if (
      labels.includes('crosswalk') ||
      labels.includes('vehicle') ||
      labels.includes('traffic_light')
    ) {
      return 'outdoor';
    }

    return 'indoor';
  }

  estimateNoise(
    speechConfidence: number | undefined,
    environmentType: string
  ): 'quiet' | 'moderate' | 'noisy' {
    if (environmentType === 'transit') {
      return 'noisy';
    }
    if (typeof speechConfidence === 'number') {
      if (speechConfidence > 0.85) return 'quiet';
      if (speechConfidence > 0.6) return 'moderate';
      return 'noisy';
    }
    return 'quiet';
  }
}

export const contextFusion = new ContextFusion();
