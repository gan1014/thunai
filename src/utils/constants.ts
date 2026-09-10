import { AccessibilityNeed, InteractionLevel, LanguageCode, OutputModality, RiskLevel, TextSize } from '../types';

export const ACCESSIBILITY_NEEDS: Array<{
  value: AccessibilityNeed;
  label: string;
  icon: string;
  description: string;
}> = [
  { value: 'visual', label: 'Visual Assistance', icon: '👁️', description: 'Screen reading, spatial auditory guidance & obstacle avoidance' },
  { value: 'hearing', label: 'Hearing Impairment', icon: '🦻', description: 'Real-time live subtitles, visual alerts & haptic cues' },
  { value: 'speech', label: 'Speech Impairment', icon: '🗣️', description: 'Gesture-to-speech synthesizer & communication boards' },
  { value: 'motor', label: 'Motor & Mobility', icon: '♿', description: 'Hands-free navigation, ramp detection & gesture inputs' },
  { value: 'cognitive', label: 'Cognitive & Senior', icon: '🧠', description: 'Simplified language, high contrast & step-by-step guidance' },
  { value: 'none', label: 'Standard Mode', icon: '👤', description: 'Universal multimodal situation-aware assistance' },
];

export const OUTPUT_MODALITIES: Array<{
  value: OutputModality;
  label: string;
  icon: string;
}> = [
  { value: 'voice', label: 'Natural Voice', icon: '🔊' },
  { value: 'text', label: 'Live Text & Captions', icon: '📝' },
  { value: 'visual', label: 'High-Impact Visual', icon: '👁️' },
];

export const LANGUAGES: Array<{
  code: LanguageCode;
  name: string;
  nativeName: string;
}> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

export const TEXT_SIZES: Array<{
  value: TextSize;
  label: string;
  cssClass: string;
}> = [
  { value: 'small', label: 'Small', cssClass: 'text-sm' },
  { value: 'medium', label: 'Medium', cssClass: 'text-base' },
  { value: 'large', label: 'Large', cssClass: 'text-lg' },
  { value: 'xlarge', label: 'Extra Large', cssClass: 'text-xl' },
];

export const INTERACTION_LEVELS: Array<{
  value: InteractionLevel;
  label: string;
  description: string;
}> = [
  { value: 'minimal', label: 'Minimal', description: 'Concise 1-sentence urgent commands' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced 2-3 sentence descriptive guidance' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive environmental breakdown' },
];

export const RISK_LEVELS: Array<{
  value: RiskLevel;
  label: string;
  color: string;
  icon: string;
}> = [
  { value: 'low', label: 'Low Risk', color: 'emerald', icon: '🛡️' },
  { value: 'medium', label: 'Moderate Caution', color: 'amber', icon: '⚠️' },
  { value: 'high', label: 'High Risk Hazard', color: 'orange', icon: '🚨' },
  { value: 'critical', label: 'CRITICAL EMERGENCY', color: 'red', icon: '⛔' },
];

export const GESTURE_CONTROL_LABELS: Record<string, { label: string; intent: string; icon: string }> = {
  OPEN_PALM: { label: 'Open Palm', intent: 'ALERT REQUEST', icon: '🖐️' },
  WAVE: { label: 'Wave', intent: 'HELP REQUEST', icon: '👋' },
  UNKNOWN: { label: 'No Gesture', intent: 'NONE', icon: '—' },
};

export const GESTURE_ICONS: Record<string, string> = {
  thumbs_up: '👍',
  thumbs_down: '👎',
  open_palm: '✋',
  closed_fist: '✊',
  peace_sign: '✌️',
  pointing_up: '☝️',
  waving: '👋',
  namaste: '🙏',
  water_paani: '💧',
  food_khana: '🍲',
  medicine_dawa: '💊',
  doctor_hospital: '🩺',
  thank_you: '🤝',
  toilet_washroom: '🚻',
  help_sos: '🆘',
};
