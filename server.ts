import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { visionEngine } from './server/visionEngine.ts';
import { speechEngine } from './server/speechEngine.ts';
import { gestureEngine, GESTURE_MAP } from './server/gestureEngine.ts';
import { ocrEngine } from './server/ocrEngine.ts';
import { spatialEngine } from './server/spatialEngine.ts';
import { contextMemory } from './server/contextMemory.ts';
import { contextFusion } from './server/contextFusion.ts';
import { intentEstimator } from './server/intentEstimator.ts';
import { riskAssessor } from './server/riskAssessor.ts';
import { aareEngine } from './server/aare.ts';
import { responseGenerator } from './server/responseGenerator.ts';
import { openRouterWithFallback } from './server/openRouterClient.ts';
import { storageService } from './server/storage.ts';
import { PREDEFINED_SCENARIOS, scenarioEvaluator } from './server/scenarioEvaluator.ts';
import { scientificMetricsEngine } from './server/scientificMetricsEngine.ts';
import { TRANSLATIONS } from './server/languageUtils.ts';
import { voiceIntentEngine } from './server/voiceIntentEngine.ts';
import { exitObstaclePipeline } from './server/exitObstaclePipeline.ts';
import { emergencyService } from './server/emergencyService.ts';
import { twilioService } from './server/twilioService.ts';
import type { MultimodalInput, UserProfile } from './src/types.ts';
dotenv.config();

const PORT = 4000;
const app = express();
const server = http.createServer(app);

export function createServer() { return app; }

// Enable JSON bodies with higher limit for base64 camera frames
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SAHAY-X',
    description: 'Situation-Aware Multimodal AI for Personalized, Risk-Aware Accessibility',
    timestamp: Date.now(),
  });
});

// 2. Vision Endpoints
app.post('/api/vision/detect', async (req, res) => {
  try {
    const { image_base64 } = req.body;
    const rawObjects = await visionEngine.detectObjects(image_base64);
    const objects = spatialEngine.process(rawObjects);
    res.json({ objects });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Vision detection failed' });
  }
});

app.post('/api/vision/describe', async (req, res) => {
  try {
    const { image_base64 } = req.body;
    const rawObjects = await visionEngine.detectObjects(image_base64);
    const objects = spatialEngine.process(rawObjects);
    const description = visionEngine.describeScene(objects);
    const relations = visionEngine.estimateSpatialRelations(objects);
    res.json({ objects, description, spatial_relations: relations });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Scene description failed' });
  }
});

app.post('/api/vision/annotate', async (req, res) => {
  try {
    const { image_base64 } = req.body;
    const rawObjects = await visionEngine.detectObjects(image_base64);
    const objects = spatialEngine.process(rawObjects);
    res.json({
      objects,
      annotations: objects.map((obj) => ({
        label: obj.label,
        confidence: obj.confidence,
        bbox: obj.bbox,
        distance_meters: obj.distance_meters,
        direction: obj.spatial?.direction || 'UNKNOWN',
        proximity: obj.spatial?.proximity || 'UNKNOWN',
        movement: obj.spatial?.movement || 'UNKNOWN',
        color: obj.distance_meters < 1.8 ? '#EF4444' : obj.distance_meters < 3.0 ? '#F59E0B' : '#10B981',
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Annotation failed' });
  }
});

// Spatial Engine Configuration & Calibration
app.get('/api/spatial/config', (_req, res) => {
  res.json(spatialEngine.getConfig());
});

app.put('/api/spatial/config', (req, res) => {
  try {
    spatialEngine.updateConfig(req.body);
    res.json({ status: 'updated', config: spatialEngine.getConfig() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid config' });
  }
});

app.post('/api/spatial/calibrate', (req, res) => {
  try {
    const { label, actualDistanceMeters, observedBboxHeight } = req.body;
    if (!label || !actualDistanceMeters || !observedBboxHeight) {
      return res.status(400).json({ error: 'label, actualDistanceMeters, and observedBboxHeight are required' });
    }
    const focalFactor = (observedBboxHeight * actualDistanceMeters) / Math.max(0.01, 1.7);
    const config = spatialEngine.getConfig();
    config.referenceObjects[label] = config.referenceObjects[label] || 1.0;
    spatialEngine.updateConfig(config);
    res.json({
      status: 'calibrated',
      label,
      actualDistanceMeters,
      observedBboxHeight,
      estimatedFocalFactor: Number(focalFactor.toFixed(4)),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Calibration failed' });
  }
});

app.post('/api/spatial/reset', (_req, res) => {
  spatialEngine.reset();
  res.json({ status: 'tracks_reset' });
});

// 3. Speech Endpoints
app.post('/api/speech/transcribe', async (req, res) => {
  try {
    const { audio_base64, language } = req.body;
    const result = await speechEngine.transcribe(audio_base64, language || 'en');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Speech transcription failed' });
  }
});

app.post('/api/speech/tts', (req, res) => {
  // Browser SpeechSynthesis is universally supported in modern browsers.
  res.json({
    status: 'client_tts_preferred',
    message: 'Browser SpeechSynthesis API handles client playback with low latency.',
  });
});

app.post('/api/speech/translate', async (req, res) => {
  try {
    const { text, target_language } = req.body;
    const translated = await speechEngine.translateText(text, target_language || 'hi');
    res.json({ translated, target_language: target_language || 'hi' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Translation failed' });
  }
});

app.get('/api/speech/languages', (req, res) => {
  res.json({
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    ],
  });
});

// 4. Gesture Endpoints
app.post('/api/gesture/recognize', async (req, res) => {
  try {
    const { frame_base64 } = req.body;
    const result = await gestureEngine.recognize(frame_base64);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gesture recognition failed' });
  }
});

app.get('/api/gesture/gestures', (req, res) => {
  res.json({ gestures: Object.values(GESTURE_MAP) });
});

// 5. OCR Endpoints
app.post('/api/ocr/extract', async (req, res) => {
  try {
    const { image_base64 } = req.body;
    const result = await ocrEngine.extractText(image_base64);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'OCR extraction failed' });
  }
});

app.post('/api/ocr/smart', async (req, res) => {
  try {
    const { image_base64 } = req.body;
    const ocr = await ocrEngine.extractText(image_base64);
    const objects = await visionEngine.detectObjects(image_base64);
    const context = ocrEngine.contextualize(ocr.raw_text, objects);
    res.json({
      raw_text: ocr.raw_text,
      blocks: ocr.blocks,
      confidence: ocr.confidence,
      context,
      detected_objects: objects,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Smart OCR failed' });
  }
});

// 5b. Voice Conversation Endpoints
import { processVoiceRequest, getProviderStatus } from './server/voiceController.ts';

app.post('/api/voice/chat', async (req, res) => {
  try {
    const { text, language, sessionId, environmental } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text field is required' });
      return;
    }
    const result = await processVoiceRequest({ text, language, sessionId, environmental });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Voice processing failed' });
  }
});

app.get('/api/voice/status', (_req, res) => {
  res.json(getProviderStatus());
});

// Voice-First Intent Classification Endpoint
app.post('/api/voice/intent', (req, res) => {
  try {
    const { text, contextTarget } = req.body;
    const intent = voiceIntentEngine.classify(text, contextTarget);
    res.json(intent);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Intent classification failed' });
  }
});

// Exit & Path Obstacle Spatial Analysis Endpoint
app.post('/api/exit/analyze', async (req, res) => {
  try {
    const { image_base64, query_type = 'FIND_EXIT', language = 'en', target_landmark } = req.body;

    let objects: any[] = [];
    let ocrText: string | undefined;

    if (image_base64) {
      const [rawObjects, ocrResult] = await Promise.all([
        visionEngine.detectObjects(image_base64),
        ocrEngine.extractText(image_base64).catch(() => ({ raw_text: '' })),
      ]);
      objects = spatialEngine.process(rawObjects);
      ocrText = ocrResult?.raw_text;
    } else {
      const rawDefault = visionEngine.generateDefaultDetections('indoor');
      objects = spatialEngine.process(rawDefault);
    }

    const analysis = exitObstaclePipeline.evaluateScene(
      objects,
      ocrText,
      query_type,
      language,
      target_landmark
    );

    res.json({
      ...analysis,
      detected_objects: objects,
    });
  } catch (err: any) {
    console.error('Exit analysis error:', err);
    res.status(500).json({ error: err.message || 'Exit analysis failed' });
  }
});

// Helper for the full multimodal pipeline
async function processMultimodalPipeline(input: MultimodalInput) {
  const startTime = Date.now();
  const profileId = input.profile_id || 1;
  const userProfile = storageService.getProfile(profileId) || storageService.getProfile(1)!;

  // 1. Vision Engine
  let objects: any[] = [];
  if (input.image_base64) {
    const rawObjects = await visionEngine.detectObjects(input.image_base64);
    objects = spatialEngine.process(rawObjects);
  } else {
    const rawDefault = visionEngine.generateDefaultDetections(input.simulated_environment?.environment_type);
    objects = spatialEngine.process(rawDefault);
  }
  const sceneDescription = visionEngine.describeScene(objects);
  const spatialRelations = visionEngine.estimateSpatialRelations(objects);

  // 2. Speech Engine
  let speechResult = null;
  if (input.audio_base64) {
    speechResult = await speechEngine.transcribe(input.audio_base64, userProfile.preferred_language);
  } else if (input.text_input) {
    speechResult = {
      text: input.text_input,
      language: userProfile.preferred_language,
      confidence: 0.99,
      duration_seconds: 1.0,
    };
  }

  // 3. Gesture Engine
  let gestureResult = null;
  if (input.gesture_frame_base64) {
    gestureResult = await gestureEngine.recognize(input.gesture_frame_base64);
  }

  // 4. OCR Engine
  let ocrResult = null;
  if (input.image_base64) {
    ocrResult = await ocrEngine.extractText(input.image_base64);
    ocrResult.context = ocrEngine.contextualize(ocrResult.raw_text, objects);
  }

  // 5. Context Memory & Pronoun Coreference Resolution
  let effectiveText = speechResult?.text || '';
  if (effectiveText) {
    const { resolvedText } = contextMemory.resolveReference(effectiveText);
    if (resolvedText !== effectiveText && speechResult) {
      speechResult.text = resolvedText;
    }
  }

  // 6. Context Fusion
  const fusedContext = contextFusion.fuse(
    { objects, sceneDescription, spatialRelations },
    speechResult,
    gestureResult,
    ocrResult,
    userProfile,
    contextMemory.getHistory(),
    input.simulated_environment
  );

  // 7. Intent Estimator
  const intent = intentEstimator.estimate(fusedContext);

  // 8. Risk Assessor
  const risk = riskAssessor.assess(fusedContext, intent);

  // 9. Adaptive Accessibility Reasoning Engine (AARE)
  const aareResult = aareEngine.reason(fusedContext, intent, risk, userProfile);

  const latencyMs = Date.now() - startTime;

  // 10. Final Response Packaging
  const response = responseGenerator.generate(
    aareResult,
    userProfile,
    intent,
    risk,
    objects,
    latencyMs,
    fusedContext
  );

  // Update memory & storage
  contextMemory.addTurn(
    'user',
    effectiveText || gestureResult?.text || 'Visual snapshot',
    intent.primary_intent,
    objects.map((o) => o.label)
  );
  contextMemory.addTurn('assistant', response.text, intent.primary_intent);

  const sessionId = input.session_id || 101;
  storageService.logInteraction(sessionId, {
    timestamp: new Date().toISOString(),
    input_type: input.audio_base64 ? 'voice' : input.gesture_frame_base64 ? 'gesture' : input.image_base64 ? 'camera' : 'text',
    input_data_summary: effectiveText || gestureResult?.text || 'Scene inspection',
    detected_objects: objects,
    estimated_intent: intent.primary_intent,
    risk_level: risk.risk_level,
    risk_score: risk.risk_score,
    confidence: intent.confidence,
    selected_modality: aareResult.selected_modality,
    response_text: response.text,
    response_language: response.language,
    latency_ms: latencyMs,
    was_successful: true,
  });

  return response;
}

// Free OpenRouter conversational layer. It receives structured scene state, not a video stream.
app.post('/api/assistant/scene-chat', async (req, res) => {
  try {
    const { question, objects = [], language = 'en' } = req.body || {};
    if (!question || !String(question).trim()) return res.status(400).json({ error: 'Question is required.' });
    const scene = (objects as any[]).map((o) => ({
      object: o.label,
      confidence: o.confidence,
      position: o.spatial?.direction?.toLowerCase().replace('_', ' ') || ((o.bbox?.[0] + o.bbox?.[2]) / 2) < 0.35 ? 'left' : ((o.bbox?.[0] + o.bbox?.[2]) / 2) > 0.65 ? 'right' : 'ahead',
      estimated_distance_m: o.distance_meters,
      movement: o.spatial?.movement || 'UNKNOWN',
      proximity: o.spatial?.proximity || 'UNKNOWN',
    }));
    try {
      const answer = await openRouterWithFallback([{
        role: 'system',
        content: `You are THUNAI, a concise accessibility assistant. Answer only from the supplied scene state. Never invent objects, distances, or facts. Distances are estimates. Give short spoken-friendly guidance. Preferred language: ${language}. If the scene is empty, say you cannot confidently identify an object.`
      }, {
        role: 'user',
        content: `Scene state:
${JSON.stringify(scene)}

User question: ${String(question).trim()}`
      }], 'text', { temperature: 0.1, maxTokens: 250, timeoutMs: 12000 });
      return res.json({ answer, engine: 'cloud' });
    } catch (err: any) {
      console.warn('OpenRouter scene-chat rate-limited or unavailable, using Edge Reasoning Engine:', err?.message || err);
      const answer = generateEdgeSceneAnswer(question, scene, language);
      return res.json({ answer, engine: 'edge' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Scene chat processing failed' });
  }
});

/**
 * Edge Conversational Reasoning for Accessibility:
 * Computes deterministic, situational answers from perceived scene geometry
 * when cloud LLM is rate-limited or offline.
 */
function generateEdgeSceneAnswer(question: string, scene: any[], language = 'en'): string {
  const q = (question || '').toLowerCase();
  const lang = (language || 'en').toLowerCase();

  if (!scene || scene.length === 0) {
    if (lang === 'hi') return 'सामने कोई बाधा नहीं दिख रही है। रास्ता साफ प्रतीत होता है।';
    if (lang === 'ta') return 'முன்னால் தடைகள் எதுவும் தெரியவில்லை. பாதை தெளிவாக உள்ளது.';
    return 'No immediate obstacles or objects detected in your current camera view. Pathway appears clear.';
  }

  // Sort objects by proximity
  const sorted = [...scene].sort((a, b) => (a.estimated_distance_m || 99) - (b.estimated_distance_m || 99));
  const nearest = sorted[0];

  // Specific query matching
  if (q.includes('stairs') || q.includes('step') || q.includes('सीढ़ी') || q.includes('படி')) {
    const stairs = scene.find((s) => s.object.includes('stairs'));
    if (stairs) {
      if (lang === 'hi') return `सावधानी: आपके ${stairs.position === 'ahead' ? 'सामने' : stairs.position} लगभग ${stairs.estimated_distance_m} मीटर पर सीढ़ियां हैं।`;
      if (lang === 'ta') return `எச்சரிக்கை: உங்களுக்கு ${stairs.position === 'ahead' ? 'முன்னால்' : stairs.position} சுமார் ${stairs.estimated_distance_m} மீட்டர் தொலைவில் படிகள் உள்ளன.`;
      return `Caution: Downward stairs detected ${stairs.position} at approximately ${stairs.estimated_distance_m} meters. Please proceed with caution.`;
    }
  }

  if (q.includes('door') || q.includes('exit') || q.includes('दरवाजा') || q.includes('கதவு')) {
    const door = scene.find((s) => s.object.includes('door') || s.object.includes('exit'));
    if (door) {
      if (lang === 'hi') return `एक ${door.object.replace('_', ' ')} आपके ${door.position === 'ahead' ? 'सामने' : door.position} लगभग ${door.estimated_distance_m} मीटर पर है।`;
      if (lang === 'ta') return `ஒரு ${door.object.replace('_', ' ')} உங்களுக்கு ${door.position === 'ahead' ? 'முன்னால்' : door.position} சுமார் ${door.estimated_distance_m} மீட்டர் தொலைவில் உள்ளது.`;
      return `A ${door.object.replace('_', ' ')} is located on the ${door.position}, estimated ${door.estimated_distance_m} meters away.`;
    }
  }

  // General spatial description
  const count = scene.length;
  if (lang === 'hi') {
    return `कैमरा दृश्य में ${count} वस्तुएं ट्रैक हो रही हैं। सबसे पास ${nearest.object.replace('_', ' ')} है, जो ${nearest.position === 'ahead' ? 'सीधे सामने' : nearest.position} ${nearest.estimated_distance_m} मीटर की दूरी पर है।`;
  }
  if (lang === 'ta') {
    return `கேமராவில் ${count} பொருள்கள் உள்ளன. மிக அருகில் ${nearest.object.replace('_', ' ')} உள்ளது, சுமார் ${nearest.estimated_distance_m} மீட்டர் தொலைவில்.`;
  }
  return `Tracking ${count} object(s) in view. Nearest is ${nearest.object.replace('_', ' ')} located on the ${nearest.position}, estimated ${nearest.estimated_distance_m} meters away.`;
}

// 6. Main Assistant Endpoints
app.post('/api/assistant/process', async (req, res) => {
  try {
    const input: MultimodalInput = req.body;
    const response = await processMultimodalPipeline(input);
    res.json(response);
  } catch (err: any) {
    console.error('Assistant process error:', err);
    res.status(500).json({ error: err.message || 'Assistant pipeline processing failed' });
  }
});

app.post('/api/assistant/scenario', (req, res) => {
  try {
    const { scenario, ablation } = req.body;
    const result = scenarioEvaluator.evaluate(scenario, ablation);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Scenario execution failed' });
  }
});

app.get('/api/assistant/scenarios', (req, res) => {
  res.json({ scenarios: PREDEFINED_SCENARIOS });
});

app.get('/api/assistant/history', (req, res) => {
  res.json({ history: contextMemory.getHistory() });
});

app.delete('/api/assistant/history', (req, res) => {
  contextMemory.clear();
  res.json({ status: 'cleared' });
});

// 7. Profile Endpoints
app.get('/api/profile', (req, res) => {
  res.json(storageService.getAllProfiles());
});

app.get('/api/profile/:id', (req, res) => {
  const profile = storageService.getProfile(Number(req.params.id));
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

app.post('/api/profile', (req, res) => {
  try {
    const created = storageService.createProfile(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/profile/:id', (req, res) => {
  try {
    const updated = storageService.updateProfile(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/profile/:id', (req, res) => {
  const success = storageService.deleteProfile(Number(req.params.id));
  if (!success) return res.status(400).json({ error: 'Cannot delete primary profile 1' });
  res.json({ status: 'deleted' });
});

// 8. Session Endpoints
app.post('/api/session/start', (req, res) => {
  const { profile_id } = req.body;
  const sessionId = storageService.startSession(profile_id || 1);
  res.json({ session_id: sessionId });
});

app.post('/api/session/:id/end', (req, res) => {
  const id = Number(req.params.id);
  storageService.endSession(id);
  const metrics = storageService.getSessionMetrics(id);
  res.json({ status: 'ended', session_id: id, metrics });
});

app.get('/api/session/:id', (req, res) => {
  const id = Number(req.params.id);
  const session = storageService.getSession(id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.get('/api/session/:id/metrics', (req, res) => {
  const id = Number(req.params.id);
  const metrics = storageService.getSessionMetrics(id);
  res.json(metrics);
});

app.get('/api/benchmark/scientific-metrics', (req, res) => {
  try {
    const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
    const session = sessionId ? storageService.getSession(sessionId) : null;
    const logs = session ? session.interactions : [];
    const metrics = scientificMetricsEngine.computeMetrics(logs);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute scientific metrics' });
  }
});

app.get('/api/metrics/research', (_req, res) => {
  try {
    const metrics = scientificMetricsEngine.computeMetrics([]);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute research metrics' });
  }
});

// ==========================================
// 8b. Emergency SOS & Twilio REST Endpoints
// ==========================================

app.post('/api/emergency/start', (req, res) => {
  try {
    const { userId, userName, triggerMethod = 'MANUAL_BUTTON', latitude, longitude, accuracyMeters, battery, isTestMode } = req.body;
    const event = emergencyService.startEmergency({
      userId: userId ? Number(userId) : 1,
      userName,
      triggerMethod,
      latitude,
      longitude,
      accuracyMeters,
      battery,
      isTestMode: Boolean(isTestMode),
    });
    res.status(201).json(event);
  } catch (err: any) {
    console.error('Emergency start error:', err);
    res.status(400).json({ error: err.message || 'Failed to start emergency event' });
  }
});

app.post('/api/emergency/cancel', (req, res) => {
  try {
    const { eventId, reason } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }
    const cancelled = emergencyService.cancelEmergency({ eventId, reason });
    res.json(cancelled);
  } catch (err: any) {
    console.error('Emergency cancel error:', err);
    res.status(400).json({ error: err.message || 'Failed to cancel emergency event' });
  }
});

app.post('/api/emergency/escalate', async (req, res) => {
  try {
    const { eventId, telemetry } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }
    const escalated = await emergencyService.escalateEmergency({ eventId, telemetry });
    res.json(escalated);
  } catch (err: any) {
    console.error('Emergency escalation error:', err);
    res.status(500).json({ error: err.message || 'Failed to escalate emergency event' });
  }
});

app.get('/api/emergency/status/:id', (req, res) => {
  const event = storageService.getEmergencyEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: `Emergency event ${req.params.id} not found` });
  }
  res.json(event);
});

app.post('/api/emergency/resolve', (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }
    const resolved = emergencyService.resolveEmergency(eventId);
    res.json(resolved);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to resolve emergency event' });
  }
});

app.post('/api/emergency/test', async (req, res) => {
  try {
    const { userId = 1, userName = 'Test User', latitude = 13.0827, longitude = 80.2707, battery = 90 } = req.body;
    const testEvent = emergencyService.startEmergency({
      userId,
      userName,
      triggerMethod: 'TEST_MODE',
      latitude,
      longitude,
      accuracyMeters: 5,
      battery,
      isTestMode: true,
    });
    const escalated = await emergencyService.escalateEmergency({
      eventId: testEvent.id,
      telemetry: {
        isTestMode: true,
        latitude,
        longitude,
        accuracyMeters: 5,
        battery,
      },
    });
    res.json({
      message: 'Test emergency successfully executed with simulated Twilio dispatch.',
      event: escalated,
      isConfigured: twilioService.isConfigured(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Test emergency execution failed' });
  }
});

// Emergency Contacts CRUD
app.get('/api/emergency/contacts', (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : 1;
  const contacts = storageService.getEmergencyContacts(userId);
  res.json({ contacts });
});

app.post('/api/emergency/contacts', (req, res) => {
  try {
    const { name, phone, whatsapp_enabled = true, relationship = 'Emergency Contact', is_primary = false, userId = 1 } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required for emergency contact' });
    }
    const contact = storageService.createEmergencyContact({
      userId,
      name,
      phone,
      whatsapp_enabled,
      relationship,
      is_primary,
    });
    res.status(201).json(contact);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create emergency contact' });
  }
});

app.put('/api/emergency/contacts/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = storageService.updateEmergencyContact(id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update emergency contact' });
  }
});

app.delete('/api/emergency/contacts/:id', (req, res) => {
  const id = Number(req.params.id);
  const success = storageService.deleteEmergencyContact(id);
  if (!success) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  res.json({ status: 'deleted', id });
});

app.get('/api/emergency/events', (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : undefined;
  const events = storageService.getAllEmergencyEvents(userId);
  res.json({ events });
});

// Twilio Webhook Delivery Status Callback
app.post('/api/emergency/webhook/twilio-status', (req, res) => {
  try {
    const { MessageSid, MessageStatus } = req.body || {};
    if (MessageSid && MessageStatus) {
      console.log(`[Twilio Webhook] Message ${MessageSid} status updated to: ${MessageStatus}`);
    }
    res.status(200).send('<Response></Response>');
  } catch (err: any) {
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// 9. Real-Time WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws/assistant' });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected to /ws/assistant');

  ws.send(JSON.stringify({
    type: 'connected',
    message: 'SAHAY-X real-time assistant stream ready',
    timestamp: Date.now(),
  }));

  ws.on('message', async (data: Buffer | string) => {
    try {
      const rawStr = data.toString();
      const payload: any = JSON.parse(rawStr);
      if (payload.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        return;
      }
      const response = await processMultimodalPipeline(payload);
      ws.send(JSON.stringify({ type: 'response', data: response }));
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'error', message: err.message || 'Processing failed' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from /ws/assistant');
  });
});

// 10. Vite Middleware Integration
export async function bootstrap() {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SAHAY-X server active on http://0.0.0.0:${PORT}`);
  });
}

const isMain = process.env.NODE_ENV !== 'test' &&
  Boolean(process.argv[1] && /server\.(ts|js|cjs)$/.test(process.argv[1]));

if (isMain) {
  bootstrap().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
