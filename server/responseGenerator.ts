import type { AAREResult, AssistantResponse, DetectedObject, FusedContext, IntentResult, RiskResult, UserProfile } from '../src/types.ts';

export class ResponseGenerator {
  generate(
    aareOutput: AAREResult,
    userProfile: UserProfile,
    intent: IntentResult,
    risk: RiskResult,
    detectedObjects: DetectedObject[],
    latencyMs: number,
    fusedContext?: Partial<FusedContext>
  ): AssistantResponse {
    return {
      text: aareOutput.response_text,
      voice_text: aareOutput.alternative_responses.voice,
      visual_text: aareOutput.alternative_responses.visual,
      language: aareOutput.response_language,
      modality: aareOutput.selected_modality,
      urgency: aareOutput.urgency,
      safety_warnings: aareOutput.safety_warnings,
      display_config: {
        text_size: userProfile.text_size || 'large',
        high_contrast: userProfile.high_contrast || false,
        auto_read: aareOutput.selected_modality === 'voice',
      },
      reasoning_trace: aareOutput.reasoning_trace,
      aas_score: aareOutput.aas_score,
      timestamp: Date.now(),
      detected_objects: detectedObjects,
      intent,
      risk,
      fused_context: fusedContext,
      latency_ms: latencyMs,
    };
  }
}

export const responseGenerator = new ResponseGenerator();
