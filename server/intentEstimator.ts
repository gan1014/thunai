import type { FusedContext, IntentResult } from '../src/types.ts';

export const INTENT_KEYWORDS: Record<string, string[]> = {
  navigation: [
    'find', 'where', 'go', 'exit', 'door', 'way', 'direction',
    'reach', 'get to', 'locate', 'outside', 'stairs', 'crosswalk',
    'walk', 'guide', 'route', 'path'
  ],
  identification: [
    'what', 'identify', 'recognize', 'tell me', 'describe',
    'read', 'see', 'look', 'label', 'sign', 'text', 'who', 'bottle'
  ],
  safety: [
    'safe', 'danger', 'careful', 'warning', 'help', 'emergency',
    'risk', 'obstacle', 'hazard', 'stop', 'stairs', 'vehicle', 'car', 'fall'
  ],
  communication: [
    'say', 'tell', 'speak', 'call', 'message', 'ask', 'talk', 'caption', 'subtitle'
  ],
  assistance: [
    'help', 'assist', 'support', 'need', 'want', 'please', 'seat', 'chair', 'guide'
  ],
  information: [
    'time', 'date', 'weather', 'news', 'price', 'cost', 'number',
    'how much', 'schedule', 'status'
  ],
};

export class IntentEstimator {
  estimate(fusedContext: FusedContext): IntentResult {
    const scores: Record<string, number> = {
      navigation: 0,
      identification: 0,
      safety: 0,
      communication: 0,
      assistance: 0,
      information: 0,
    };

    const reasons: string[] = [];

    // 1. Speech Analysis (Weight: 2.0)
    const speech = (fusedContext.speech_text || '').toLowerCase();
    if (speech) {
      for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        for (const kw of keywords) {
          if (new RegExp(`\\b${kw}\\b`, 'i').test(speech)) {
            scores[intent] += 2.0;
            reasons.push(`Keyword "${kw}" in speech reinforced ${intent}`);
          }
        }
      }
    }

    // 2. Gesture Analysis (Weight: 1.5)
    const gesture = fusedContext.gesture_intent;
    if (gesture) {
      if (gesture === 'help') {
        scores.assistance += 3.5;
        scores.safety += 2.5;
        reasons.push('Closed fist SOS gesture triggered high assistance/safety weighting');
      } else if (gesture === 'stop') {
        scores.safety += 3.0;
        reasons.push('Open palm Stop gesture prioritized safety');
      } else if (gesture === 'attention') {
        scores.identification += 2.0;
        scores.navigation += 1.5;
        reasons.push('Pointing upward gesture focused identification/navigation');
      } else if (gesture === 'yes' || gesture === 'no') {
        scores.communication += 2.0;
        reasons.push(`Feedback gesture (${gesture}) reinforced communication`);
      }
    }

    // 3. OCR Analysis (Weight: 1.2)
    const ocr = (fusedContext.ocr_text || '').toLowerCase();
    if (ocr) {
      if (ocr.includes('exit') || ocr.includes('gate') || ocr.includes('platform')) {
        scores.navigation += 1.8;
      }
      if (ocr.includes('warning') || ocr.includes('danger') || ocr.includes('caution')) {
        scores.safety += 2.2;
      }
      if (ocr.includes('mg') || ocr.includes('price') || ocr.includes('dose')) {
        scores.identification += 2.0;
        scores.information += 1.5;
      }
    }

    // 4. Object Analysis (Weight: 1.0)
    const highRiskLabels = ['stairs', 'vehicle', 'obstacle', 'traffic_light'];
    for (const obj of fusedContext.objects) {
      const label = obj.label.toLowerCase();
      if (highRiskLabels.includes(label)) {
        scores.safety += 1.5;
        reasons.push(`Proximity of ${label} elevated environmental safety concern`);
      }
      if (label === 'door' || label === 'exit_sign' || label === 'crosswalk') {
        scores.navigation += 1.2;
      }
      if (label === 'medicine_bottle' || label === 'book' || label === 'sign') {
        scores.identification += 1.2;
      }
    }

    // Determine highest score
    let maxIntent: IntentResult['primary_intent'] = 'identification';
    let maxScore = -1;

    for (const [intent, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxIntent = intent as IntentResult['primary_intent'];
      }
    }

    // Calculate secondary intents
    const sortedIntents = Object.entries(scores)
      .filter(([intent]) => intent !== maxIntent && scores[intent] > 0.5)
      .sort((a, b) => b[1] - a[1])
      .map(([intent]) => intent);

    // Normalize confidence
    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = sum > 0 ? Math.min(0.98, Math.max(0.65, (maxScore + 1.0) / (sum + 1.5))) : 0.75;

    return {
      primary_intent: maxIntent,
      confidence: Number(confidence.toFixed(2)),
      secondary_intents: sortedIntents.slice(0, 2),
      reasoning: reasons.length > 0 ? reasons.slice(0, 3).join('. ') : 'Inferred from environmental sensory inputs.',
    };
  }
}

export const intentEstimator = new IntentEstimator();
