/**
 * Gemini API Client for THUNAI.
 * Primary AI provider with timeout, retry, and error classification.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  temperature: number;
  maxOutputTokens: number;
}

export interface GeminiResult {
  text: string;
  latencyMs: number;
  provider: 'gemini';
  model: string;
}

export interface GeminiError {
  type: 'timeout' | 'invalid_key' | 'rate_limit' | 'network' | 'server' | 'empty' | 'unknown';
  message: string;
  retryable: boolean;
}

const DEFAULT_CONFIG: GeminiConfig = {
  apiKey: '',
  model: 'gemini-1.5-flash',
  timeoutMs: 3000,
  maxRetries: 0,
  temperature: 0.4,
  maxOutputTokens: 256,
};

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10);
}

export function getGeminiConfig(): GeminiConfig {
  return {
    ...DEFAULT_CONFIG,
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || DEFAULT_CONFIG.model,
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || DEFAULT_CONFIG.timeoutMs,
  };
}

function classifyGeminiError(error: unknown): GeminiError {
  const err = error as { message?: string } | undefined;
  const msg = String(err?.message || error || '').toLowerCase();

  if (msg.includes('timeout') || msg.includes('aborted') || msg.includes('deadline')) {
    return { type: 'timeout', message: 'Gemini request timed out', retryable: true };
  }
  if (msg.includes('invalid') && (msg.includes('key') || msg.includes('api'))) {
    return { type: 'invalid_key', message: 'Gemini API key is invalid', retryable: false };
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
    return { type: 'rate_limit', message: 'Gemini rate limit reached', retryable: false };
  }
  if (msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('network') || msg.includes('fetch')) {
    return { type: 'network', message: 'Network error reaching Gemini', retryable: true };
  }
  if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
    return { type: 'server', message: 'Gemini server error', retryable: true };
  }
  return { type: 'unknown', message: msg || 'Unknown Gemini error', retryable: false };
}

async function callGeminiAPI(
  prompt: string,
  systemInstruction: string,
  config: GeminiConfig,
  history?: Array<{ role: string; parts: string }>
): Promise<GeminiResult> {
  const start = Date.now();

  const contents: any[] = [];

  if (history && history.length > 0) {
    for (const turn of history) {
      contents.push({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.parts }],
      });
    }
  }

  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const body = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const url = `${GEMINI_API_URL}/${config.model}:generateContent?key=${config.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = json?.error?.message || `Gemini HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text.trim()) {
      throw new Error('Gemini returned empty response');
    }

    return {
      text: text.trim(),
      latencyMs: Date.now() - start,
      provider: 'gemini',
      model: config.model,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function geminiChat(
  prompt: string,
  systemInstruction: string,
  options: { timeoutMs?: number; history?: Array<{ role: string; parts: string }> } = {}
): Promise<GeminiResult> {
  const config = getGeminiConfig();
  if (!config.apiKey) {
    throw Object.assign(new Error('GEMINI_API_KEY not configured'), {
      geminiError: { type: 'invalid_key', message: 'No API key', retryable: false } as GeminiError,
    });
  }

  if (options.timeoutMs) {
    config.timeoutMs = options.timeoutMs;
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await callGeminiAPI(prompt, systemInstruction, config, options.history);
    } catch (error: unknown) {
      lastError = error;
      const classified = classifyGeminiError(error);

      (error as any).geminiError = classified;

      if (!classified.retryable || attempt >= config.maxRetries) {
        throw error;
      }

      const delay = Math.min(500 * (attempt + 1), 1500);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

export function extractGeminiError(error: unknown): GeminiError {
  if ((error as any)?.geminiError) {
    return (error as any).geminiError as GeminiError;
  }
  return classifyGeminiError(error);
}
