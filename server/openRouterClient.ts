/** OpenRouter client. Uses only models exposed as free by OpenRouter.
 * The model is configurable because the free catalog changes over time.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function hasOpenRouterKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 10);
}

export function getOpenRouterModels(kind: 'vision' | 'text' = 'text'): string[] {
  const configured = kind === 'vision'
    ? process.env.OPENROUTER_VISION_MODEL
    : process.env.OPENROUTER_TEXT_MODEL;

  const defaults = kind === 'vision'
    ? [
        'google/gemma-4-26b-a4b-it:free',
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        'google/gemma-4-31b-it:free',
        'nex-agi/nex-n2.5-pro:free',
        'openrouter/free'
      ]
    : [
        'nvidia/nemotron-3.5-lightning:free',
        'google/gemma-4-26b-a4b-it:free',
        'nvidia/nemotron-3-super-120b-a12b:free',
        'liquid/lfm-2.5-2.6b:free',
        'openrouter/free'
      ];

  return configured ? [configured, ...defaults.filter((m) => m !== configured)] : defaults;
}

export async function openRouterChat(
  messages: any[],
  options: { model?: string; temperature?: number; maxTokens?: number; timeoutMs?: number } = {}
): Promise<string> {
  if (!hasOpenRouterKey()) {
    throw new Error('OPENROUTER_API_KEY is not configured. Add it to AI Studio Secrets.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'THUNAI Accessibility Assistant',
      },
      body: JSON.stringify({
        model: options.model || getOpenRouterModels('text')[0],
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 700,
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = body?.error?.message || `OpenRouter HTTP ${response.status}`;
      throw new Error(msg);
    }

    return String(body?.choices?.[0]?.message?.content ?? '').trim();
  } finally {
    clearTimeout(timeout);
  }
}

export async function openRouterWithFallback(
  messages: any[],
  kind: 'vision' | 'text' = 'text',
  options: Omit<Parameters<typeof openRouterChat>[1], 'model'> = {}
): Promise<string> {
  let lastError: unknown;
  for (const model of getOpenRouterModels(kind)) {
    try {
      return await openRouterChat(messages, { ...options, model });
    } catch (error: any) {
      lastError = error;
      console.warn(`OpenRouter model ${model} failed:`, error?.message || error);
      if (String(error?.message || '').includes('Rate limit')) {
        break; // Account-level free limit reached; fast-fail to Edge AI immediately
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All configured OpenRouter free models failed.');
}

export function extractJson<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = Math.min(...[cleaned.indexOf('{'), cleaned.indexOf('[')].filter((n) => n >= 0));
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error('Model did not return valid JSON.');
  }
}
