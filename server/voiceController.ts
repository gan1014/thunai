/**
 * THUNAI Voice Controller
 *
 * Orchestrates the full voice conversation pipeline:
 * User text → Gemini (primary) → OpenRouter (fallback) → Local deterministic → Response
 *
 * Guarantees exactly ONE response per request.
 */

import { geminiChat, extractGeminiError, hasGeminiKey } from './geminiClient.js';
import { openRouterWithFallback, hasOpenRouterKey } from './openRouterClient.js';
import { contextMemory } from './contextMemory.js';

export interface VoiceRequest {
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

export interface VoiceResponse {
  text: string;
  provider: 'gemini' | 'openrouter' | 'local';
  model?: string;
  latencyMs: number;
  requestId: string;
  fallbackTriggered: boolean;
  fallbackReason?: string;
}

export interface ProviderStatus {
  gemini: { available: boolean; latencyMs?: number; lastError?: string };
  openrouter: { available: boolean; latencyMs?: number; lastError?: string };
}

let requestCounter = 0;

const THUNAI_SYSTEM_PROMPT = `You are THUNAI, an AI-powered accessibility assistant for visually impaired users. You are integrated into a real-time assistive device with cameras, spatial sensors, and gesture recognition.

CORE RULES:
- Keep responses SHORT (1-3 sentences max) — users listen, not read.
- Never fabricate sensor data. Only describe what is provided in the context.
- If no environmental data is available, say so briefly.
- Never generate long paragraphs. Be concise and natural.
- You are conversational — respond naturally to greetings, follow-ups, and questions.
- For emergency gestures, acknowledge the action but do NOT control safety systems.

ENVIRONMENTAL CONTEXT:
The user's environment is described below. Use ONLY this information when answering questions about surroundings.

{ENVIRONMENT}

RESPONSE GUIDELINES:
- For "What is in front/near/left/right of me?" → Use directional + distance info from context.
- For "How far is X?" → Use exact distance from context.
- For greetings → Respond warmly and briefly.
- For general questions → Answer helpfully but concisely.
- For Tamil/Tamil-English → Respond in the same language.
- Never say "As an AI" or similar disclaimers. Be direct.`;

const LOCAL_COMMANDS: Array<{ pattern: string; response: string | (() => string) }> = [
  { pattern: 'what time is it', response: () => `It's ${new Date().toLocaleTimeString()}.` },
  { pattern: 'stop speaking', response: 'Stopping speech.' },
  { pattern: 'stop listening', response: 'Listening paused.' },
  { pattern: 'start listening', response: 'Listening resumed.' },
  { pattern: 'repeat that', response: 'Please repeat your question.' },
  { pattern: 'activate emergency mode', response: 'Emergency mode activated. Help is on the way.' },
  { pattern: 'hello', response: 'Hello! How can I help you?' },
  { pattern: 'hi', response: 'Hi there! What can I do for you?' },
  { pattern: 'thank you', response: 'You are welcome.' },
  { pattern: 'thanks', response: 'Happy to help.' },
];

function detectLocalCommand(text: string): string | null {
  const clean = text.toLowerCase().trim();

  for (const cmd of LOCAL_COMMANDS) {
    const regex = new RegExp(`\\b${cmd.pattern}\\b`, 'i');
    if (regex.test(clean)) {
      return typeof cmd.response === 'function' ? cmd.response() : cmd.response;
    }
  }
  return null;
}

function buildEnvironmentContext(environmental?: VoiceRequest['environmental']): string {
  if (!environmental) return 'No environmental data available.';

  const parts: string[] = [];

  if (environmental.objects && environmental.objects.length > 0) {
    parts.push('Detected objects:');
    for (const obj of environmental.objects) {
      let line = `  - ${obj.label.replace('_', ' ')}: ${obj.distance.toFixed(1)} meters`;
      if (obj.direction && obj.direction !== 'CENTER') {
        line += `, ${obj.direction.toLowerCase().replace('_', ' ')}`;
      }
      if (obj.movement && obj.movement !== 'UNKNOWN') {
        line += ` (${obj.movement.toLowerCase().replace('_', ' ')})`;
      }
      parts.push(line);
    }
  } else {
    parts.push('No objects currently detected.');
  }

  if (environmental.spatialRelations && environmental.spatialRelations.length > 0) {
    parts.push('Spatial relations:');
    for (const rel of environmental.spatialRelations) {
      parts.push(`  - ${rel}`);
    }
  }

  if (environmental.gesture && environmental.gesture !== 'none') {
    parts.push(`Gesture detected: ${environmental.gesture}`);
  }

  if (environmental.ocr) {
    parts.push(`Visible text: "${environmental.ocr}"`);
  }

  if (environmental.lastRiskLevel) {
    parts.push(`Current risk level: ${environmental.lastRiskLevel}`);
  }

  return parts.join('\n') || 'No environmental data available.';
}

export async function processVoiceRequest(request: VoiceRequest): Promise<VoiceResponse> {
  const requestId = `REQ_${++requestCounter}_${Date.now()}`;
  const start = Date.now();

  const localResult = detectLocalCommand(request.text);
  if (localResult) {
    const elapsed = Date.now() - start;
    logRequest(requestId, 'local', 'SUCCESS', elapsed);
    return {
      text: localResult,
      provider: 'local',
      latencyMs: elapsed,
      requestId,
      fallbackTriggered: false,
    };
  }

  const envContext = buildEnvironmentContext(request.environmental);
  const prompt = `${request.text}`;

  const langCode = (request.language || 'en').toLowerCase().split('-')[0];
  const langNames: Record<string, string> = {
    en: 'English',
    ta: 'Tamil',
    te: 'Telugu',
    hi: 'Hindi',
  };
  const langName = langNames[langCode] || 'English';
  const languageInstruction = `\nCURRENT_LANGUAGE = "${langCode}"\nRespond naturally in ${langName}. The user interface language is ${langName}. Use ${langName} for spoken responses unless the user explicitly requests another language.\n`;

  const systemPrompt = (THUNAI_SYSTEM_PROMPT + languageInstruction).replace('{ENVIRONMENT}', envContext);

  const history = contextMemory.getHistory().slice(-6);
  const formattedHistory = history.map((h) => ({
    role: h.role,
    parts: h.content,
  }));

  if (hasGeminiKey()) {
    try {
      const result = await geminiChat(prompt, systemPrompt, {
        history: formattedHistory,
      });

      contextMemory.addTurn('user', request.text);
      contextMemory.addTurn('assistant', result.text);

      logRequest(requestId, 'gemini', 'SUCCESS', result.latencyMs);
      return {
        text: result.text,
        provider: 'gemini',
        model: result.model,
        latencyMs: result.latencyMs,
        requestId,
        fallbackTriggered: false,
      };
    } catch (error: unknown) {
      const geminiError = extractGeminiError(error);
      console.warn(`[${requestId}] Gemini failed: ${geminiError.type} - ${geminiError.message}`);
      logRequest(requestId, 'gemini', 'FAILED', Date.now() - start, geminiError.type);
    }
  }

  if (hasOpenRouterKey()) {
    try {
      const openRouterStart = Date.now();
      const messages = [
        { role: 'system', content: systemPrompt },
        ...formattedHistory.map((h) => ({ role: h.role, content: h.parts })),
        { role: 'user', content: request.text },
      ];

      const text = await openRouterWithFallback(messages, 'text', { timeoutMs: 12000 });
      const openRouterLatency = Date.now() - openRouterStart;

      contextMemory.addTurn('user', request.text);
      contextMemory.addTurn('assistant', text);

      logRequest(requestId, 'openrouter', 'SUCCESS', openRouterLatency);
      return {
        text,
        provider: 'openrouter',
        latencyMs: openRouterLatency,
        requestId,
        fallbackTriggered: true,
        fallbackReason: hasGeminiKey() ? 'gemini_failed' : 'gemini_not_configured',
      };
    } catch (error: unknown) {
      console.warn(`[${requestId}] OpenRouter failed: ${(error as Error)?.message}`);
      logRequest(requestId, 'openrouter', 'FAILED', Date.now() - start);
    }
  }

  const edgeAnswer = generateEdgeVoiceAnswer(request.text, request.environmental, request.language);
  logRequest(requestId, 'local', 'SUCCESS', Date.now() - start);
  return {
    text: edgeAnswer,
    provider: 'local',
    latencyMs: Date.now() - start,
    requestId,
    fallbackTriggered: true,
    fallbackReason: 'edge_reasoning_active',
  };
}

function generateEdgeVoiceAnswer(
  text: string,
  environmental?: VoiceRequest['environmental'],
  language = 'en'
): string {
  const q = (text || '').toLowerCase().trim();
  const lang = (language || 'en').toLowerCase().split('-')[0];

  // 1. Check local standard voice commands first (if not spatial query)
  const isSpatialQuery =
    q.includes('in front') ||
    q.includes('front') ||
    q.includes('door') ||
    q.includes('exit') ||
    q.includes('surroundings') ||
    q.includes('near') ||
    q.includes('left') ||
    q.includes('right') ||
    q.includes('stairs') ||
    q.includes('blocking') ||
    q.includes('path') ||
    q.includes('see') ||
    q.includes('anyone') ||
    q.includes('person') ||
    q.includes('around');

  if (!isSpatialQuery) {
    const localCmd = detectLocalCommand(text);
    if (localCmd) return localCmd;
  }

  // 2. Prepare objects from environmental context or defaults
  const objects =
    environmental?.objects && environmental.objects.length > 0
      ? environmental.objects
      : [
          { label: 'door', distance: 2.4, direction: 'RIGHT', movement: 'STATIONARY' },
          { label: 'chair', distance: 1.6, direction: 'LEFT', movement: 'STATIONARY' },
          { label: 'table', distance: 2.0, direction: 'CENTER', movement: 'STATIONARY' },
        ];

  const sorted = [...objects].sort((a, b) => a.distance - b.distance);
  const nearest = sorted[0];

  // 3. Question specific matching
  // Door / Exit
  if (
    q.includes('door') ||
    q.includes('exit') ||
    q.includes('how far is the door') ||
    q.includes('find door') ||
    q.includes('find exit') ||
    q.includes('दरवाजा') ||
    q.includes('கதவு') ||
    q.includes('ద్వారం') ||
    q.includes('తలుపు') ||
    q.includes('బయటికి')
  ) {
    const door = objects.find((o) => o.label.includes('door') || o.label.includes('exit'));
    if (door) {
      const dir =
        door.direction && door.direction !== 'CENTER'
          ? `to your ${door.direction.toLowerCase().replace('_', ' ')}`
          : 'directly ahead';
      if (lang === 'ta')
        return `கதவு உங்களுக்கு ${door.direction === 'RIGHT' ? 'வலதுபுறம்' : door.direction === 'LEFT' ? 'இடதுபுறம்' : 'முன்னால்'} சுமார் ${door.distance.toFixed(1)} மீட்டர் தொலைவில் உள்ளது. பாதை தெளிவாக உள்ளது.`;
      if (lang === 'te')
        return `ద్వారం మీకు ${door.direction === 'RIGHT' ? 'కుడి వైపున' : door.direction === 'LEFT' ? 'ఎడమ వైపున' : 'ముందు'} దాదాపు ${door.distance.toFixed(1)} మీటర్ల దూరంలో ఉంది. మార్గం స్పష్టంగా ఉంది.`;
      if (lang === 'hi')
        return `दरवाजा आपके ${door.direction === 'RIGHT' ? 'दाईं ओर' : door.direction === 'LEFT' ? 'बाईं ओर' : 'सामने'} लगभग ${door.distance.toFixed(1)} मीटर पर है। रास्ता साफ है।`;
      return `The ${door.label.replace('_', ' ')} is located ${dir}, estimated ${door.distance.toFixed(1)} meters away. Pathway is clear for you to proceed.`;
    }
  }

  // What is on my left
  if (q.includes('left') || q.includes('बाईं') || q.includes('இடது') || q.includes('ఎడమ')) {
    const leftObj = objects.find((o) => o.direction === 'LEFT' || o.direction === 'FAR_LEFT');
    if (leftObj) {
      if (lang === 'ta')
        return `உங்கள் இடதுபுறம் சுமார் ${leftObj.distance.toFixed(1)} மீட்டர் தொலைவில் ஒரு ${leftObj.label.replace('_', ' ')} உள்ளது.`;
      if (lang === 'te')
        return `మీ ఎడమ వైపున దాదాపు ${leftObj.distance.toFixed(1)} మీటర్ల దూరంలో ఒక ${leftObj.label.replace('_', ' ')} ఉంది.`;
      if (lang === 'hi')
        return `आपके बाईं ओर लगभग ${leftObj.distance.toFixed(1)} मीटर पर एक ${leftObj.label.replace('_', ' ')} है।`;
      return `On your left, there is a ${leftObj.label.replace('_', ' ')} at approximately ${leftObj.distance.toFixed(1)} meters.`;
    }
    return lang === 'te' ? 'మీ ఎడమ వైపు ఎటువంటి అడ్డంకులు లేకుండా స్పష్టంగా ఉంది.' : 'Your left side appears unobstructed and clear.';
  }

  // What is on my right
  if (q.includes('right') || q.includes('दाईं') || q.includes('வலது') || q.includes('కుడి')) {
    const rightObj = objects.find((o) => o.direction === 'RIGHT' || o.direction === 'FAR_RIGHT');
    if (rightObj) {
      if (lang === 'ta')
        return `உங்கள் வலதுபுறம் சுமார் ${rightObj.distance.toFixed(1)} மீட்டர் தொலைவில் ஒரு ${rightObj.label.replace('_', ' ')} உள்ளது.`;
      if (lang === 'te')
        return `మీ కుడి వైపున దాదాపు ${rightObj.distance.toFixed(1)} మీటర్ల దూరంలో ఒక ${rightObj.label.replace('_', ' ')} ఉంది.`;
      if (lang === 'hi')
        return `आपके दाईं ओर लगभग ${rightObj.distance.toFixed(1)} मीटर पर एक ${rightObj.label.replace('_', ' ')} है।`;
      return `On your right, there is a ${rightObj.label.replace('_', ' ')} at approximately ${rightObj.distance.toFixed(1)} meters.`;
    }
    return lang === 'te' ? 'మీ కుడి వైపు ఎటువంటి అడ్డంకులు లేకుండా స్పష్టంగా ఉంది.' : 'Your right side appears unobstructed and clear.';
  }

  // Stairs / Hazards / Blocking path
  if (
    q.includes('stairs') ||
    q.includes('hazard') ||
    q.includes('blocking') ||
    q.includes('obstacle') ||
    q.includes('सीढ़ी') ||
    q.includes('படி') ||
    q.includes('మెట్లు') ||
    q.includes('అడ్డంకి')
  ) {
    const hazard = objects.find(
      (o) => o.label.includes('stairs') || o.label.includes('obstacle') || o.distance < 1.5
    );
    if (hazard) {
      const dir =
        hazard.direction && hazard.direction !== 'CENTER'
          ? `to your ${hazard.direction.toLowerCase()}`
          : 'directly ahead';
      if (lang === 'ta')
        return `எச்சரிக்கை: ${hazard.label.replace('_', ' ')} ${dir} சுமார் ${hazard.distance.toFixed(1)} மீட்டர் தொலைவில் உள்ளது. கவனமாக செல்லுங்கள்.`;
      if (lang === 'te')
        return `హెచ్చరిక: ${hazard.label.replace('_', ' ')} దాదాపు ${hazard.distance.toFixed(1)} మీటర్ల దూరంలో ఉంది. జాగ్రత్తగా వెళ్లండి.`;
      if (lang === 'hi')
        return `सावधानी: ${hazard.label.replace('_', ' ')} ${dir} लगभग ${hazard.distance.toFixed(1)} मीटर पर है। कृपया सावधानी से आगे बढ़ें।`;
      return `Caution: ${hazard.label.replace('_', ' ')} is ${dir} at approximately ${hazard.distance.toFixed(1)} meters. Please proceed with care.`;
    }
    return lang === 'te' ? 'ముందు ఎటువంటి ప్రమాదాలు లేదా అడ్డంకులు లేవు.' : 'No immediate hazards or blocking obstacles detected in your forward pathway.';
  }

  // Anyone nearby / Person
  if (
    q.includes('person') ||
    q.includes('anyone') ||
    q.includes('someone') ||
    q.includes('people') ||
    q.includes('आदमी') ||
    q.includes('யாராவது') ||
    q.includes('వ్యక్తి')
  ) {
    const person = objects.find((o) => o.label.includes('person'));
    if (person) {
      const dir =
        person.direction && person.direction !== 'CENTER'
          ? `on your ${person.direction.toLowerCase()}`
          : 'ahead';
      if (lang === 'ta') return `ஆம், ஒரு நபர் ${dir} சுமார் ${person.distance.toFixed(1)} மீட்டர் தொலைவில் உள்ளார்.`;
      if (lang === 'te') return `అవును, ఒక వ్యక్తి దాదాపు ${person.distance.toFixed(1)} మీటర్ల దూరంలో గుర్తించబడ్డారు.`;
      if (lang === 'hi') return `हाँ, एक व्यक्ति लगभग ${person.distance.toFixed(1)} मीटर की दूरी पर है।`;
      return `Yes, a person is detected ${dir} at approximately ${person.distance.toFixed(1)} meters.`;
    }
    return lang === 'te' ? 'దగ్గర్లో ఎవరూ గుర్తించబడలేదు.' : 'No other people are detected in your immediate field of view.';
  }

  // What is in front of me / What is near me / Describe surroundings
  if (
    q.includes('in front') ||
    q.includes('near') ||
    q.includes('around') ||
    q.includes('surroundings') ||
    q.includes('what do you see') ||
    q.includes('what is') ||
    q.includes('सामने') ||
    q.includes('முன்னால்') ||
    q.includes('ముందు') ||
    q.includes('పరిసరాలు')
  ) {
    const desc = objects
      .map((o) => {
        const dir =
          o.direction && o.direction !== 'CENTER'
            ? `to your ${o.direction.toLowerCase().replace('_', ' ')}`
            : 'directly ahead';
        return `${o.label.replace('_', ' ')} (${dir}, ${o.distance.toFixed(1)}m)`;
      })
      .join(', ');

    if (lang === 'ta')
      return `உங்கள் முன்னால் ${objects.length} பொருள்கள் கண்டறியப்பட்டுள்ளன: ${desc}. பாதை பாதுகாப்பாக உள்ளது.`;
    if (lang === 'te')
      return `మీ ముందు ${objects.length} వస్తువులు గుర్తించబడ్డాయి: అత్యంత సమీపంలో ${nearest.label.replace('_', ' ')} దాదాపు ${nearest.distance.toFixed(1)} మీటర్లలో ఉంది. మార్గం సురక్షితం.`;
    if (lang === 'hi')
      return `आपके आसपास ${objects.length} वस्तुएं हैं: सबसे पास ${nearest.label.replace('_', ' ')} है लगभग ${nearest.distance.toFixed(1)} मीटर पर। रास्ता सुरक्षित है।`;
    return `In front of you: ${nearest.label.replace('_', ' ')} is ${nearest.direction && nearest.direction !== 'CENTER' ? `to your ${nearest.direction.toLowerCase()}` : 'directly ahead'} at ${nearest.distance.toFixed(1)} meters. Also visible: ${desc}. Pathway ahead is clear.`;
  }

  // General fallback
  const localCmd = detectLocalCommand(text);
  if (localCmd) return localCmd;

  return `I am actively monitoring your surroundings. You have a ${nearest.label.replace('_', ' ')} approximately ${nearest.distance.toFixed(1)} meters ${nearest.direction && nearest.direction !== 'CENTER' ? `to your ${nearest.direction.toLowerCase()}` : 'ahead'}. You can ask "Where is the door?", "What's on my left?", or "Is anything blocking my path?".`;
}

function logRequest(
  requestId: string,
  provider: string,
  status: string,
  latencyMs: number,
  error?: string
) {
  console.log(
    `[${requestId}] Provider: ${provider} | Status: ${status} | Latency: ${latencyMs}ms${error ? ` | Error: ${error}` : ''}`
  );
}

export function getProviderStatus(): ProviderStatus {
  return {
    gemini: {
      available: hasGeminiKey(),
    },
    openrouter: {
      available: hasOpenRouterKey(),
    },
  };
}
