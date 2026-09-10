import {
  AssistantResponse,
  CoreScientificMetricsSummary,
  DetectedObject,
  GestureResult,
  MultimodalInput,
  OCRResult,
  ScenarioDefinition,
  ScenarioResult,
  SessionMetrics,
  SpeechResult,
  UserProfile,
  VoiceChatRequest,
  VoiceChatResponse,
  VoiceProviderStatus,
} from '../types';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Assistant
  sceneChat: (question: string, objects: DetectedObject[], language = 'en') =>
    fetchJson<{ answer: string }>('/assistant/scene-chat', {
      method: 'POST',
      body: JSON.stringify({ question, objects, language }),
    }),

  processMultimodal: (data: MultimodalInput) =>
    fetchJson<AssistantResponse>('/assistant/process', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  runScenario: (scenario: ScenarioDefinition, ablation?: any) =>
    fetchJson<ScenarioResult>('/assistant/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario, ablation }),
    }),

  getScenarios: () =>
    fetchJson<{ scenarios: ScenarioDefinition[] }>('/assistant/scenarios'),

  getHistory: () =>
    fetchJson<{ history: any[] }>('/assistant/history'),

  clearHistory: () =>
    fetchJson<{ status: string }>('/assistant/history', { method: 'DELETE' }),

  // Vision
  detectObjects: (imageBase64: string) =>
    fetchJson<{ objects: DetectedObject[] }>('/vision/detect', {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 }),
    }),

  describeScene: (imageBase64: string) =>
    fetchJson<{ objects: DetectedObject[]; description: string; spatial_relations: { relations: string[] } }>(
      '/vision/describe',
      {
        method: 'POST',
        body: JSON.stringify({ image_base64: imageBase64 }),
      }
    ),

  // Speech
  transcribeSpeech: (audioBase64: string, language?: string) =>
    fetchJson<SpeechResult>('/speech/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audio_base64: audioBase64, language }),
    }),

  translateText: (text: string, targetLanguage = 'hi') =>
    fetchJson<{ translated: string; target_language: string }>('/speech/translate', {
      method: 'POST',
      body: JSON.stringify({ text, target_language: targetLanguage }),
    }),

  getLanguages: () =>
    fetchJson<{ languages: Array<{ code: string; name: string; nativeName: string }> }>('/speech/languages'),

  // Gesture
  recognizeGesture: (frameBase64: string) =>
    fetchJson<GestureResult>('/gesture/recognize', {
      method: 'POST',
      body: JSON.stringify({ frame_base64: frameBase64 }),
    }),

  getGestures: () =>
    fetchJson<{ gestures: any[] }>('/gesture/gestures'),

  // Spatial Engine
  getSpatialConfig: () =>
    fetchJson<any>('/spatial/config'),

  updateSpatialConfig: (config: any) =>
    fetchJson<{ status: string; config: any }>('/spatial/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  calibrateSpatial: (data: { label: string; actualDistanceMeters: number; observedBboxHeight: number }) =>
    fetchJson<any>('/spatial/calibrate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetSpatialTracks: () =>
    fetchJson<{ status: string }>('/spatial/reset', { method: 'POST' }),

  // OCR
  extractText: (imageBase64: string) =>
    fetchJson<OCRResult>('/ocr/extract', {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 }),
    }),

  smartOCR: (imageBase64: string) =>
    fetchJson<OCRResult & { detected_objects: DetectedObject[] }>('/ocr/smart', {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 }),
    }),

  // Profiles
  getAllProfiles: () =>
    fetchJson<UserProfile[]>('/profile'),

  getProfile: (id: number) =>
    fetchJson<UserProfile>(`/profile/${id}`),

  createProfile: (data: Partial<UserProfile>) =>
    fetchJson<UserProfile>('/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfile: (id: number, data: Partial<UserProfile>) =>
    fetchJson<UserProfile>(`/profile/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProfile: (id: number) =>
    fetchJson<{ status: string }>(`/profile/${id}`, { method: 'DELETE' }),

  // Sessions
  startSession: (profileId = 1) =>
    fetchJson<{ session_id: number }>('/session/start', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId }),
    }),

  endSession: (id: number) =>
    fetchJson<{ status: string; session_id: number; metrics: SessionMetrics }>(`/session/${id}/end`, {
      method: 'POST',
    }),

  getSessionMetrics: (id: number) =>
    fetchJson<SessionMetrics>(`/session/${id}/metrics`),

  // Scientific & Research Metrics Benchmark
  getScientificMetrics: (sessionId?: number) =>
    fetchJson<CoreScientificMetricsSummary>(
      sessionId ? `/benchmark/scientific-metrics?sessionId=${sessionId}` : '/benchmark/scientific-metrics'
    ),

  // Voice-First Intent & Exit/Obstacle Endpoints
  classifyVoiceIntent: (text: string, contextTarget?: string) =>
    fetchJson<any>('/voice/intent', {
      method: 'POST',
      body: JSON.stringify({ text, contextTarget }),
    }),

  analyzeExitAndObstacles: (data: {
    image_base64?: string;
    query_type?: string;
    language?: string;
    target_landmark?: string;
  }) =>
    fetchJson<any>('/exit/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Voice Conversation
  voiceChat: (request: VoiceChatRequest) =>
    fetchJson<VoiceChatResponse>('/voice/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  getVoiceStatus: () =>
    fetchJson<VoiceProviderStatus>('/voice/status'),

  // ==========================================
  // Emergency SOS & Twilio Endpoints
  // ==========================================
  startEmergency: (data: {
    userId?: number;
    userName?: string;
    triggerMethod?: string;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
    battery?: number;
    isTestMode?: boolean;
  }) =>
    fetchJson<any>('/emergency/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancelEmergency: (data: { eventId: string; reason?: string }) =>
    fetchJson<any>('/emergency/cancel', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  escalateEmergency: (data: { eventId: string; telemetry?: any }) =>
    fetchJson<any>('/emergency/escalate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEmergencyStatus: (id: string) =>
    fetchJson<any>(`/emergency/status/${id}`),

  resolveEmergency: (eventId: string) =>
    fetchJson<any>('/emergency/resolve', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    }),

  testEmergency: (data?: any) =>
    fetchJson<any>('/emergency/test', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  getEmergencyContacts: (userId = 1) =>
    fetchJson<{ contacts: any[] }>(`/emergency/contacts?userId=${userId}`),

  createEmergencyContact: (data: any) =>
    fetchJson<any>('/emergency/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEmergencyContact: (id: number, data: any) =>
    fetchJson<any>(`/emergency/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEmergencyContact: (id: number) =>
    fetchJson<any>(`/emergency/contacts/${id}`, {
      method: 'DELETE',
    }),

  getEmergencyEvents: (userId?: number) =>
    fetchJson<{ events: any[] }>(userId ? `/emergency/events?userId=${userId}` : '/emergency/events'),
};

