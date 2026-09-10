export type AccessibilityNeed = 'visual' | 'hearing' | 'speech' | 'motor' | 'cognitive' | 'none';
export type PreferredOutput = 'voice' | 'text' | 'visual';
export type TextSize = 'small' | 'medium' | 'large' | 'xlarge';
export type InteractionLevel = 'minimal' | 'moderate' | 'detailed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type OutputModality = 'voice' | 'text' | 'visual';
export type LanguageCode = 'en' | 'ta' | 'hi' | 'te' | 'bn' | 'mr' | 'kn';

export interface UserProfile {
  id: number;
  name: string;
  accessibility_need: AccessibilityNeed;
  preferred_language: LanguageCode;
  preferred_output: PreferredOutput;
  text_size: TextSize;
  interaction_level: InteractionLevel;
  emergency_mode: boolean;
  high_contrast: boolean;
  created_at: string;
  updated_at: string;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] normalized 0-1
  distance_meters: number;
  risk_score?: number;
  // Spatial engine enrichment fields (optional for backward compatibility)
  spatial?: {
    id: string;
    direction: 'FAR_LEFT' | 'LEFT' | 'CENTER' | 'RIGHT' | 'FAR_RIGHT';
    horizontalOffset: number; // -1 (left) to +1 (right)
    verticalPosition: 'ABOVE' | 'CENTER' | 'BELOW';
    distanceConfidence: number; // 0-1
    proximity: 'VERY_NEAR' | 'NEAR' | 'MEDIUM' | 'FAR' | 'UNKNOWN';
    movement: 'APPROACHING' | 'MOVING_AWAY' | 'STATIONARY' | 'UNKNOWN';
    relativeSpeedMps: number | null;
    trajectoryConfidence: number | null;
    center: { x: number; y: number };
    trackAge: number; // frames since first detection
    trackActive: boolean;
  };
}

export interface OCRBlock {
  text: string;
  confidence: number;
  bbox?: [number, number, number, number];
}

export interface OCRResult {
  raw_text: string;
  blocks: OCRBlock[];
  confidence: number;
  context?: string;
}

export interface GestureResult {
  gesture: string;
  intent: string;
  text: string;
  confidence: number;
  landmarks?: Array<{ x: number; y: number; z?: number }>;
}

export interface SpeechResult {
  text: string;
  language: string;
  confidence: number;
  duration_seconds: number;
}

export interface FusedContext {
  objects: DetectedObject[];
  scene_description: string;
  spatial_relations: { relations: string[] };
  speech_text: string;
  speech_language: string;
  gesture_intent: string;
  ocr_text: string;
  ocr_context: string;
  user_need: AccessibilityNeed;
  user_language: LanguageCode;
  user_preferred_output: PreferredOutput;
  interaction_level: InteractionLevel;
  conversation_history: Array<{ role: string; content: string; timestamp: number }>;
  environment_type: 'indoor' | 'outdoor' | 'transit' | 'medical';
  noise_level: 'quiet' | 'moderate' | 'noisy';
  timestamp: number;
}

export interface IntentResult {
  primary_intent: 'navigation' | 'identification' | 'safety' | 'communication' | 'assistance' | 'information';
  confidence: number;
  secondary_intents: string[];
  reasoning: string;
}

export interface RiskResult {
  risk_level: RiskLevel;
  risk_score: number;
  risk_factors: string[];
  confidence_concern: boolean;
  recommended_caution: string;
}

export interface AAREResult {
  response_text: string;
  response_language: LanguageCode;
  selected_modality: OutputModality;
  urgency: 'immediate' | 'urgent' | 'normal' | 'passive';
  detail_level: InteractionLevel;
  safety_warnings: string[];
  alternative_responses: {
    voice: string;
    text: string;
    visual: string;
  };
  reasoning_trace: string[];
  aas_score: number;
}

export interface AssistantResponse {
  text: string;
  voice_text: string;
  visual_text: string;
  language: LanguageCode;
  modality: OutputModality;
  urgency: 'immediate' | 'urgent' | 'normal' | 'passive';
  safety_warnings: string[];
  display_config: {
    text_size: TextSize;
    high_contrast: boolean;
    auto_read: boolean;
  };
  reasoning_trace: string[];
  aas_score: number;
  timestamp: number;
  detected_objects: DetectedObject[];
  intent: IntentResult;
  risk: RiskResult;
  fused_context?: Partial<FusedContext>;
  latency_ms: number;
}

export interface MultimodalInput {
  image_base64?: string;
  audio_base64?: string;
  text_input?: string;
  gesture_frame_base64?: string;
  profile_id?: number;
  session_id?: number;
  simulated_environment?: {
    noise_level?: 'quiet' | 'moderate' | 'noisy';
    environment_type?: 'indoor' | 'outdoor' | 'transit' | 'medical';
    lighting?: 'bright' | 'normal' | 'dim';
  };
}

export interface ScenarioDefinition {
  scenario_id: string;
  title: string;
  description: string;
  environment: 'indoor' | 'outdoor' | 'transit' | 'medical';
  user_profile_override?: Partial<UserProfile>;
  simulated_speech?: string;
  simulated_objects: Array<{
    label: string;
    confidence: number;
    bbox: [number, number, number, number];
    distance_meters: number;
  }>;
  simulated_ocr_text?: string;
  simulated_gesture?: string;
  simulated_noise?: 'quiet' | 'moderate' | 'noisy';
  expected_intent: string;
  expected_risk: RiskLevel;
  expected_response_contains: string[];
  baseline_comparison?: {
    naive_response: string;
    flaws: string[];
    sahay_advantage: string;
  };
}

export interface ScenarioResult {
  scenario_id: string;
  actual_intent: string;
  actual_risk: RiskLevel;
  actual_response: string;
  latency_ms: number;
  intent_match: boolean;
  risk_match: boolean;
  response_appropriate: boolean;
  aas_score: number;
  selected_modality: OutputModality;
  warnings_count: number;
  trace: string[];
  baseline_comparison?: {
    naive_response: string;
    flaws: string[];
    sahay_advantage: string;
  };
}

export interface SessionMetrics {
  total_interactions: number;
  avg_latency_ms: number;
  task_success_count: number;
  task_success_rate: number;
  avg_aas_score: number;
  modality_distribution: {
    voice: number;
    text: number;
    visual: number;
  };
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  intent_distribution: Record<string, number>;
  interactions_history: Array<{
    timestamp: number;
    aas_score: number;
    latency_ms: number;
    confidence: number;
    risk_level: RiskLevel;
    modality: OutputModality;
    intent: string;
  }>;
  scientific_metrics?: CoreScientificMetricsSummary;
}

export interface CoreScientificMetricItem {
  id: number;
  name: string;
  symbol: string;
  value: number;
  unit: string;
  formattedValue: string;
  whatItProves: string;
  benchmarkBaseline: string;
  targetThreshold: string;
  status: 'optimal' | 'passing' | 'warning';
  description: string;
}

export interface CoreScientificMetricsSummary {
  distance_mae_m: number;
  direction_accuracy_pct: number;
  gesture_f1_score_pct: number;
  false_emergency_rate_pct: number;
  end_to_end_latency_ms: number;
  metrics_table: CoreScientificMetricItem[];
  spatial_evaluation: {
    samples_count: number;
    distance_mae: number;
    direction_accuracy: number;
    quadrant_breakdown: { left: number; ahead: number; right: number };
    per_class_mae: Record<string, number>;
  };
  gesture_evaluation: {
    overall_f1: number;
    precision: number;
    recall: number;
    classes: Array<{ gesture: string; precision: number; recall: number; f1: number; samples: number }>;
  };
  safety_evaluation: {
    total_scenarios: number;
    non_emergency_scenarios: number;
    false_emergency_triggers: number;
    false_emergency_rate_pct: number;
    true_emergency_recall_pct: number;
    risk_confusion: {
      safe_as_emergency: number;
      safe_as_safe: number;
      emergency_as_emergency: number;
      emergency_as_safe: number;
    };
  };
  latency_evaluation: {
    end_to_end_ms: number;
    breakdown: {
      vision_perception_ms: number;
      speech_processing_ms: number;
      multimodal_fusion_ms: number;
      aare_reasoning_ms: number;
      output_synthesis_ms: number;
    };
  };
}

export interface InteractionLog {
  id: number;
  session_id: number;
  timestamp: string;
  input_type: 'voice' | 'gesture' | 'camera' | 'text' | 'multimodal';
  input_data_summary: string;
  detected_objects: DetectedObject[];
  estimated_intent: string;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  selected_modality: OutputModality;
  response_text: string;
  response_language: LanguageCode;
  latency_ms: number;
  was_successful: boolean;
}

export type GestureControlType =
  | 'OPEN_PALM'
  | 'CLOSED_FIST'
  | 'WAVE'
  | 'THUMBS_UP'
  | 'THUMBS_DOWN'
  | 'PEACE_SIGN'
  | 'POINTING_UP'
  | 'UNKNOWN';
export type GestureControlIntent = 'ALERT_REQUEST' | 'STOP_REQUEST' | 'HELP_REQUEST' | 'UNKNOWN';
export type GestureControlHand = 'LEFT' | 'RIGHT' | 'UNKNOWN';
export type GestureControlState = 'IDLE' | 'DETECTING' | 'CANDIDATE' | 'CONFIRMED' | 'TRIGGERED' | 'COOLDOWN' | 'RELEASE_WAIT';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandDetectionResult {
  detected: boolean;
  landmarks: HandLandmark[];
  handedness: GestureControlHand;
  confidence: number;
}

export interface GestureControlEvent {
  gesture: GestureControlType;
  confidence: number;
  hand: GestureControlHand;
  timestamp: number;
  intent: GestureControlIntent;
}

export interface GestureControlConfig {
  STABLE_FRAMES: number;
  CONFIDENCE_THRESHOLD: number;
  COOLDOWN_MS: number;
  WAVE_MIN_DISTANCE: number;
  WAVE_MIN_DIRECTION_CHANGES: number;
  WAVE_HISTORY_SIZE: number;
  WAVE_TIME_WINDOW_MS: number;
  PROCESS_INTERVAL_MS: number;
}

export const DEFAULT_GESTURE_CONFIG: GestureControlConfig = {
  STABLE_FRAMES: 5,
  CONFIDENCE_THRESHOLD: 0.7,
  COOLDOWN_MS: 3000,
  WAVE_MIN_DISTANCE: 0.08,
  WAVE_MIN_DIRECTION_CHANGES: 3,
  WAVE_HISTORY_SIZE: 30,
  WAVE_TIME_WINDOW_MS: 1500,
  PROCESS_INTERVAL_MS: 66,
};

// Voice Conversation Types
export type VoiceProvider = 'gemini' | 'openrouter' | 'local';

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  provider?: VoiceProvider;
  model?: string;
  latencyMs?: number;
  timestamp: number;
}

export interface VoiceConversationState {
  messages: VoiceMessage[];
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  activeProvider: VoiceProvider;
  error?: string;
}

export interface VoiceProviderStatus {
  gemini: { available: boolean; latencyMs?: number; lastError?: string };
  openrouter: { available: boolean; latencyMs?: number; lastError?: string };
}

export interface VoiceChatRequest {
  text: string;
  language?: string;
  sessionId?: string;
  environmental?: {
    objects?: Array<{
      label: string;
      distance: number;
      direction: string;
      movement?: string;
      proximity?: string;
    }>;
    spatialRelations?: string[];
    gesture?: string;
    ocr?: string;
    lastRiskLevel?: string;
  };
}

export interface VoiceChatResponse {
  text: string;
  provider: VoiceProvider;
  model?: string;
  latencyMs: number;
  requestId: string;
  fallbackTriggered: boolean;
  fallbackReason?: string;
}

// ==========================================
// EMERGENCY SOS & TWILIO TELEMETRY TYPES
// ==========================================

export type SOSState =
  | 'IDLE'
  | 'SOS_TRIGGERED'
  | 'COUNTDOWN_ACTIVE'
  | 'CANCELLATION_WINDOW'
  | 'ESCALATION_PENDING'
  | 'ESCALATING'
  | 'NOTIFICATION_SENT'
  | 'DELIVERY_FAILED'
  | 'RESOLVED'
  | 'CANCELLED';

export type SOSTriggerMethod =
  | 'MANUAL_BUTTON'
  | 'VOICE_COMMAND'
  | 'GESTURE_TRIGGER'
  | 'AARE_SAFETY_GATE'
  | 'TEST_MODE';

export type DeliveryStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';

export interface EmergencyContact {
  id: number;
  userId?: number;
  name: string;
  phone: string;
  whatsapp_enabled: boolean;
  relationship: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmergencyTelemetryPayload {
  eventId: string;
  userId: string | number;
  userName: string;
  status: SOSState;
  triggerMethod: SOSTriggerMethod;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  battery: number;
  mapsUrl: string;
  isLastKnownLocation?: boolean;
  emergencyContactId?: number | string;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
  isTestMode?: boolean;
}

export interface EmergencyEvent {
  id: string; // e.g. THN-20260910-001
  userId: number;
  userName: string;
  triggerMethod: SOSTriggerMethod;
  status: SOSState;
  startedAt: string;
  escalatedAt?: string;
  cancelledAt?: string;
  resolvedAt?: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  battery: number;
  mapsUrl: string;
  isTestMode: boolean;
  isLastKnownLocation?: boolean;
  smsStatus: DeliveryStatus;
  smsMessageSid?: string;
  smsError?: string;
  whatsappStatus: DeliveryStatus;
  whatsappMessageSid?: string;
  whatsappError?: string;
  contactNotified?: {
    id?: number;
    name: string;
    phone: string;
    relationship: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SOSConfig {
  SOS_TIMEOUT_SECONDS: number;
  SOS_TEST_TIMEOUT_SECONDS: number;
  MAX_NOTIFICATION_RETRIES: number;
  LOCATION_MAX_AGE_SECONDS: number;
  GPS_ACCURACY_THRESHOLD_METERS: number;
  VOICE_FEEDBACK_INTERVALS: number[];
}

export const DEFAULT_SOS_CONFIG: SOSConfig = {
  SOS_TIMEOUT_SECONDS: 120,
  SOS_TEST_TIMEOUT_SECONDS: 10,
  MAX_NOTIFICATION_RETRIES: 2,
  LOCATION_MAX_AGE_SECONDS: 120,
  GPS_ACCURACY_THRESHOLD_METERS: 25,
  VOICE_FEEDBACK_INTERVALS: [30, 60, 90, 110, 120],
};

export interface NavigationPathWaypoint {
  x: number; // 0 to 1 (screen normalized X)
  y: number; // 0 to 1 (screen normalized Y)
}

export interface NavigationPathData {
  targetLabel: string;
  targetDistanceMeters: number;
  clockDirection: string; // e.g. "11 o'clock", "12 o'clock (straight ahead)", "2 o'clock"
  turnAngleDeg: number; // relative to forward: negative = left, positive = right
  stepInstruction: string; // e.g. "Walk 4 steps forward, veer slightly left"
  stepCountEstimated: number;
  isPathClear: boolean;
  waypoints: NavigationPathWaypoint[];
  pathColor: string; // hex color for glowing corridor
  hazardAlert?: string;
  timestamp?: number;
}

export interface ExitAnalysisResult {
  exitFound: boolean;
  exitType?: 'confirmed_exit' | 'exit_sign_only' | 'doorway' | 'uncertain';
  exitObject?: DetectedObject;
  exitDistanceM?: number;
  exitDirection?: string;
  exitConfidence: number;
  obstaclesInPath: Array<{
    object: DetectedObject;
    severity: 'SAFE' | 'CAUTION' | 'WARNING' | 'CRITICAL';
    distanceM: number;
    direction: string;
    isCritical: boolean;
  }>;
  pathStatus: 'CLEAR' | 'OBSTRUCTED' | 'CAUTION_HAZARDS' | 'UNCERTAIN';
  spokenResponse: string;
  language: LanguageCode;
  navigationPath?: NavigationPathData;
  detected_objects?: DetectedObject[];
}

