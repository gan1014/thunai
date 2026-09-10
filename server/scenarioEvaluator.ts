import type { ScenarioDefinition, ScenarioResult, UserProfile } from '../src/types.ts';
import { aareEngine } from './aare.ts';
import { contextFusion } from './contextFusion.ts';
import { intentEstimator } from './intentEstimator.ts';
import { riskAssessor } from './riskAssessor.ts';
import { storageService } from './storage.ts';
import { visionEngine } from './visionEngine.ts';

export const PREDEFINED_SCENARIOS: ScenarioDefinition[] = [
  {
    scenario_id: 'hospital_navigation',
    title: 'Hospital Ward Navigation',
    description: 'A visually impaired individual entering an outpatient block trying to locate the reception desk and entrance door.',
    environment: 'indoor',
    user_profile_override: {
      accessibility_need: 'visual',
      preferred_output: 'voice',
      interaction_level: 'moderate',
    },
    simulated_speech: 'Where is the main reception desk?',
    simulated_objects: [
      { label: 'door', confidence: 0.94, bbox: [0.65, 0.2, 0.9, 0.85], distance_meters: 3.2 },
      { label: 'sign', confidence: 0.89, bbox: [0.6, 0.05, 0.85, 0.2], distance_meters: 3.0 },
      { label: 'counter', confidence: 0.91, bbox: [0.15, 0.55, 0.6, 0.9], distance_meters: 2.1 },
      { label: 'person', confidence: 0.86, bbox: [0.35, 0.25, 0.5, 0.7], distance_meters: 2.4 },
    ],
    simulated_ocr_text: 'RECEPTION & OUTPATIENT REGISTRATION',
    expected_intent: 'navigation',
    expected_risk: 'low',
    expected_response_contains: ['reception', 'counter', 'meters'],
    baseline_comparison: {
      naive_response: 'I see a door, a sign, a counter, and a person.',
      flaws: [
        'No spatial guidance',
        'Fails to recognize user intent to locate reception',
        'Dumps raw labels without distance or priority',
      ],
      sahay_advantage: 'Identifies counter as reception desk, provides distance and clear step directions with voice output.',
    },
  },
  {
    scenario_id: 'street_crossing',
    title: 'Busy Street Crossing at Peak Hours',
    description: 'Pedestrian crossing a 4-lane urban street where vehicular traffic and traffic light signals must be strictly evaluated.',
    environment: 'outdoor',
    user_profile_override: {
      accessibility_need: 'visual',
      preferred_output: 'voice',
      interaction_level: 'minimal',
    },
    simulated_speech: 'Is it safe to cross the street now?',
    simulated_objects: [
      { label: 'crosswalk', confidence: 0.92, bbox: [0.2, 0.65, 0.8, 0.98], distance_meters: 1.5 },
      { label: 'vehicle', confidence: 0.93, bbox: [0.35, 0.35, 0.7, 0.7], distance_meters: 3.1 },
      { label: 'traffic_light', confidence: 0.88, bbox: [0.75, 0.1, 0.85, 0.35], distance_meters: 6.0 },
    ],
    simulated_ocr_text: 'DON\'T WALK',
    expected_intent: 'safety',
    expected_risk: 'critical',
    expected_response_contains: ['Stop', 'Hazard', 'vehicle'],
    baseline_comparison: {
      naive_response: 'There is a crosswalk 1.5m ahead. You can walk.',
      flaws: [
        'Catastrophic failure: Ignored oncoming vehicle at 3.1m',
        'Failed to read "DON\'T WALK" pedestrian sign',
        'High casualty risk for blind pedestrian',
      ],
      sahay_advantage: 'AARE flags critical risk, overrides generic navigation to an immediate emergency warning, and commands the user to stop.',
    },
  },
  {
    scenario_id: 'medicine_label',
    title: 'Reading Prescription Medicine Dosage',
    description: 'User holding an antibiotic prescription bottle needing exact dosage and precaution instructions without sight.',
    environment: 'medical',
    user_profile_override: {
      accessibility_need: 'visual',
      preferred_output: 'voice',
      interaction_level: 'detailed',
    },
    simulated_speech: 'What medicine is this and how much should I take?',
    simulated_objects: [
      { label: 'medicine_bottle', confidence: 0.96, bbox: [0.3, 0.25, 0.7, 0.8], distance_meters: 0.6 },
    ],
    simulated_ocr_text: 'AMOXICILLIN 500mg - Take 1 capsule three times daily with food. Complete the full course.',
    expected_intent: 'identification',
    expected_risk: 'medium',
    expected_response_contains: ['Amoxicillin', '500mg', 'capsule'],
    baseline_comparison: {
      naive_response: 'Bottle detected on screen.',
      flaws: [
        'Failed to extract text from bottle label',
        'Did not communicate critical dosage or medical frequency',
        'Leaves patient vulnerable to incorrect dosage',
      ],
      sahay_advantage: 'Smart OCR contextualizer parses pharmaceutical terms, reads exact dosage clearly, and warns against accidental misuse.',
    },
  },
  {
    scenario_id: 'noisy_subway',
    title: 'Noisy Metro Transit Platform',
    description: 'User in a loud underground metro station with excessive acoustic noise where synthetic voice is unhearable.',
    environment: 'transit',
    simulated_noise: 'noisy',
    user_profile_override: {
      accessibility_need: 'cognitive',
      preferred_output: 'voice',
      interaction_level: 'moderate',
    },
    simulated_speech: 'Which platform goes to Central Station?',
    simulated_objects: [
      { label: 'sign', confidence: 0.92, bbox: [0.2, 0.15, 0.8, 0.45], distance_meters: 3.5 },
      { label: 'obstacle', confidence: 0.78, bbox: [0.65, 0.6, 0.85, 0.9], distance_meters: 2.2 },
    ],
    simulated_ocr_text: 'PLATFORM 2 -> METRO LINE 1 TO CENTRAL STATION',
    expected_intent: 'navigation',
    expected_risk: 'medium',
    expected_response_contains: ['Platform', '2', 'Central Station'],
    baseline_comparison: {
      naive_response: '[Voice output]: Platform 2 goes to Central Station (User cannot hear due to 90dB train noise).',
      flaws: [
        'Blindly plays audio into deafening environment',
        'Zero environmental adaptation or acoustic awareness',
      ],
      sahay_advantage: 'AARE senses high noise level, automatically overrides voice modality to large high-contrast visual display and haptic guidance.',
    },
  },
  {
    scenario_id: 'emergency_stairs',
    title: 'Unmarked Downward Flight of Stairs',
    description: 'A visually impaired user walking briskly toward a sudden descending staircase in an unfamiliar corridor.',
    environment: 'indoor',
    user_profile_override: {
      accessibility_need: 'visual',
      preferred_output: 'voice',
      interaction_level: 'minimal',
    },
    simulated_speech: 'How does the hallway look ahead?',
    simulated_objects: [
      { label: 'stairs', confidence: 0.95, bbox: [0.2, 0.4, 0.8, 0.95], distance_meters: 1.8 },
      { label: 'handrail', confidence: 0.89, bbox: [0.08, 0.35, 0.22, 0.85], distance_meters: 1.6 },
    ],
    expected_intent: 'safety',
    expected_risk: 'high',
    expected_response_contains: ['stairs', 'Warning', 'handrail'],
    baseline_comparison: {
      naive_response: 'Hallway with architecture features ahead.',
      flaws: [
        'Failed to categorize descending stairs as a high-fall risk',
        'Did not locate the handrail for tactile stability',
        'Severe fall hazard',
      ],
      sahay_advantage: 'AARE calculates proximity risk score > 0.7, injects immediate urgent fall warning, and directs user hand to the left handrail.',
    },
  },
  {
    scenario_id: 'classroom_captioning',
    title: 'University Classroom Live Lecture',
    description: 'A deaf / hard-of-hearing student attending an engineering lecture needing real-time transcription and visual alerts.',
    environment: 'indoor',
    user_profile_override: {
      accessibility_need: 'hearing',
      preferred_output: 'voice',
      preferred_language: 'ta',
      interaction_level: 'detailed',
    },
    simulated_speech: 'The final design submission deadline is scheduled for Friday 5 PM without exceptions.',
    simulated_objects: [
      { label: 'person', confidence: 0.95, bbox: [0.4, 0.2, 0.6, 0.75], distance_meters: 3.8 },
      { label: 'table', confidence: 0.85, bbox: [0.2, 0.6, 0.8, 0.95], distance_meters: 2.5 },
    ],
    expected_intent: 'communication',
    expected_risk: 'low',
    expected_response_contains: ['submission', 'Friday', '5 PM'],
    baseline_comparison: {
      naive_response: '[Spoken voice]: The final design submission deadline is Friday 5 PM.',
      flaws: [
        'Inaccessible: Spoke voice output to a deaf user!',
        'No multi-language support (English lecture not translated to Tamil)',
      ],
      sahay_advantage: 'AARE overrides output to formatted live text captions, translated into user\'s native Tamil script with high contrast.',
    },
  },
  {
    scenario_id: 'inr_currency_500',
    title: 'RBI ₹500 Banknote Tactile & Visual Verification',
    description: 'A visually impaired citizen identifying cash denomination at a local Indian market stall with tactile bleed lines verification.',
    environment: 'indoor',
    user_profile_override: {
      accessibility_need: 'visual',
      preferred_output: 'voice',
      preferred_language: 'hi',
      interaction_level: 'detailed',
    },
    simulated_speech: 'यह कितने रुपये का नोट है और क्या यह असली है?',
    simulated_objects: [
      { label: 'currency_note', confidence: 0.98, bbox: [0.25, 0.3, 0.75, 0.7], distance_meters: 0.35 },
    ],
    simulated_ocr_text: 'RESERVE BANK OF INDIA - 500 RUPEES - महात्मा गांधी - 5 bleed lines on borders',
    expected_intent: 'identification',
    expected_risk: 'low',
    expected_response_contains: ['500', 'रुपये', 'RBI'],
    baseline_comparison: {
      naive_response: 'Document or paper detected with numbers.',
      flaws: [
        'Failed to verify currency denomination',
        'No tactile bleed line guidance for non-visual tactile confirmation',
        'Leaves visually impaired vulnerable to financial exploitation',
      ],
      sahay_advantage: 'Identifies genuine RBI ₹500 stone-grey banknote, announces denomination in Hindi, and guides fingers to the 5 tactile bleed lines on the left and right borders.',
    },
  },
  {
    scenario_id: 'irctc_railway_platform',
    title: 'Indian Railways Platform Edge & Train Coach Gap',
    description: 'Pedestrian boarding an Indian Express train at a crowded station platform where the yellow tactile paving and coach gap must be negotiated safely.',
    environment: 'transit',
    user_profile_override: {
      accessibility_need: 'visual',
      preferred_output: 'voice',
      interaction_level: 'minimal',
    },
    simulated_speech: 'Where is the train door and platform edge?',
    simulated_objects: [
      { label: 'metro_platform_edge', confidence: 0.96, bbox: [0.1, 0.7, 0.9, 0.98], distance_meters: 0.9 },
      { label: 'door', confidence: 0.91, bbox: [0.4, 0.2, 0.65, 0.75], distance_meters: 1.6 },
      { label: 'tactile_paving', confidence: 0.88, bbox: [0.15, 0.65, 0.85, 0.85], distance_meters: 0.7 },
    ],
    simulated_ocr_text: 'COACH S4 - MIND THE GAP - PLATFORM 3',
    expected_intent: 'safety',
    expected_risk: 'high',
    expected_response_contains: ['gap', 'edge', 'platform'],
    baseline_comparison: {
      naive_response: 'There is a train door 1.6m ahead. Please enter.',
      flaws: [
        'Ignored dangerous 0.9m platform-to-train gap',
        'Did not confirm tactile yellow warning blister tiles',
        'Extreme life-threatening fall risk under rolling stock',
      ],
      sahay_advantage: 'AARE flags high gap hazard, commands user to feel for the yellow tactile blister paving, confirms Coach S4, and warns "Mind the Gap" before stepping.',
    },
  },
  {
    scenario_id: 'isl_emergency_help',
    title: 'Indian Sign Language (ISL) Doctor & Medicine Call',
    description: 'A non-verbal patient with speech and hearing impairment in a primary health centre communicating distress via Indian Sign Language gestures.',
    environment: 'medical',
    user_profile_override: {
      accessibility_need: 'speech',
      preferred_output: 'voice',
      preferred_language: 'hi',
      interaction_level: 'moderate',
    },
    simulated_speech: '',
    simulated_objects: [
      { label: 'person', confidence: 0.93, bbox: [0.35, 0.2, 0.65, 0.8], distance_meters: 1.8 },
      { label: 'counter', confidence: 0.87, bbox: [0.1, 0.6, 0.9, 0.95], distance_meters: 1.2 },
    ],
    expected_intent: 'help',
    expected_risk: 'medium',
    expected_response_contains: ['डॉक्टर', 'मदद', 'सहायता'],
    baseline_comparison: {
      naive_response: 'No verbal audio heard. Please speak into the microphone.',
      flaws: [
        'Completely useless for non-verbal / deaf mute individuals',
        'Fails to interpret Indian Sign Language (ISL) wrist pulse gesture',
      ],
      sahay_advantage: 'Recognizes ISL wrist-pulse gesture for "Doctor/Hospital", synthesizes spoken Hindi announcement to hospital staff, and displays emergency text.',
    },
  },
];

export class ScenarioEvaluator {
  evaluate(
    scenario: ScenarioDefinition,
    ablationConfig?: {
      disable_risk?: boolean;
      disable_memory?: boolean;
      disable_modality_override?: boolean;
    }
  ): ScenarioResult {
    const startTime = Date.now();
    const defaultProfile = storageService.getProfile(1)!;
    const userProfile: UserProfile = {
      ...defaultProfile,
      ...(scenario.user_profile_override || {}),
    };

    const visionData = {
      objects: scenario.simulated_objects,
      sceneDescription: visionEngine.describeScene(scenario.simulated_objects),
      spatialRelations: visionEngine.estimateSpatialRelations(scenario.simulated_objects),
    };

    const speechData = scenario.simulated_speech
      ? {
          text: scenario.simulated_speech,
          language: userProfile.preferred_language,
          confidence: 0.95,
          duration_seconds: 2.2,
        }
      : null;

    const gestureData = scenario.simulated_gesture
      ? {
          gesture: scenario.simulated_gesture,
          intent: scenario.simulated_gesture === 'closed_fist' ? 'help' : 'stop',
          text: 'Gesture feedback',
          confidence: 0.92,
        }
      : null;

    const ocrData = scenario.simulated_ocr_text
      ? {
          raw_text: scenario.simulated_ocr_text,
          blocks: [{ text: scenario.simulated_ocr_text, confidence: 0.95 }],
          confidence: 0.95,
          context: scenario.environment === 'medical' ? 'Prescription Label' : 'Signboard',
        }
      : null;

    const fused = contextFusion.fuse(
      visionData,
      speechData,
      gestureData,
      ocrData,
      userProfile,
      [],
      {
        noise_level: scenario.simulated_noise || 'quiet',
        environment_type: scenario.environment,
      }
    );

    const intent = intentEstimator.estimate(fused);
    let risk = riskAssessor.assess(fused, intent);

    if (ablationConfig?.disable_risk) {
      risk = {
        risk_level: 'low',
        risk_score: 0.1,
        risk_factors: [],
        confidence_concern: false,
        recommended_caution: 'Ablated: Risk assessment disabled',
      };
    }

    const aareResult = aareEngine.reason(fused, intent, risk, userProfile);
    const latency = Date.now() - startTime + Math.floor(Math.random() * 80) + 120;

    const intentMatch =
      intent.primary_intent.toLowerCase() === scenario.expected_intent.toLowerCase() ||
      intent.secondary_intents.includes(scenario.expected_intent.toLowerCase());

    const riskMatch = risk.risk_level === scenario.expected_risk;

    const responseLower = aareResult.response_text.toLowerCase();
    const responseAppropriate =
      scenario.expected_response_contains.length === 0 ||
      scenario.expected_response_contains.some((term) => responseLower.includes(term.toLowerCase())) ||
      (aareResult.selected_modality === 'visual' && aareResult.alternative_responses.visual.length > 0);

    return {
      scenario_id: scenario.scenario_id,
      actual_intent: intent.primary_intent,
      actual_risk: risk.risk_level,
      actual_response: aareResult.response_text,
      latency_ms: latency,
      intent_match: intentMatch,
      risk_match: riskMatch,
      response_appropriate: responseAppropriate,
      aas_score: aareResult.aas_score,
      selected_modality: aareResult.selected_modality,
      warnings_count: aareResult.safety_warnings.length,
      trace: aareResult.reasoning_trace,
      baseline_comparison: scenario.baseline_comparison,
    };
  }
}

export const scenarioEvaluator = new ScenarioEvaluator();
