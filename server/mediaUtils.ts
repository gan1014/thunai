/**
 * Robust media utilities and Gemini execution helper with automatic retry and model fallback.
 */

/**
 * Extracts clean base64 data and mimeType from data URIs or plain base64 strings.
 * Handles complex browser formats like "data:audio/webm;codecs=opus;base64,...",
 * "data:image/jpeg;base64,...", etc.
 */
export function parseDataUri(
  input: string,
  defaultMime = 'image/jpeg'
): { mimeType: string; base64Data: string } {
  if (!input) {
    return { mimeType: defaultMime, base64Data: '' };
  }

  const trimmed = input.trim();
  const commaIndex = trimmed.indexOf(',');

  if (trimmed.startsWith('data:') && commaIndex !== -1) {
    const meta = trimmed.substring(5, commaIndex); // e.g., "audio/webm;codecs=opus;base64"
    const rawMime = meta.split(';')[0]?.trim().toLowerCase() || defaultMime;
    const base64Data = trimmed.substring(commaIndex + 1).replace(/\s/g, '');
    return { mimeType: rawMime, base64Data };
  }

  return { mimeType: defaultMime, base64Data: trimmed.replace(/\s/g, '') };
}

/**
 * Sleep helper for retry backoff
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a Gemini function with automatic retries and fallback to alternate models on 503 / 429 errors.
 */
export async function runGeminiWithFallback<T>(
  executor: (modelName: string) => Promise<T>,
  models: string[] = ['gemini-3.8-flash', 'gemini-flash-latest'],
  description = 'Gemini operation'
): Promise<T> {
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await executor(model);
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        const isTransient =
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('UNAVAILABLE');

        if (isTransient && attempt === 0) {
          // Wait 600ms before immediate retry of same model
          await delay(600);
          continue;
        }

        // If not transient or second attempt failed, break to next model
        break;
      }
    }
  }

  throw lastError || new Error(`${description} failed across all model attempts`);
}
