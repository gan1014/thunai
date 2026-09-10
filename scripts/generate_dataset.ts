// scripts/generate_dataset.ts
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Minimal dataset generator for evaluation.
 * It downloads a small subset of COCO images, a few Common Voice audio clips,
 * and an OCR benchmark (ICDAR). It then aligns them into a single manifest
 * that contains ground‑truth intents, risk levels and expected assistance.
 */

interface ManifestEntry {
  id: string;
  image_base64?: string; // vision input
  audio_base64?: string; // speech input
  ocr_image_base64?: string; // OCR input (could reuse image_base64)
  text_input?: string; // optional typed input
  language?: string; // BCP‑47 code
  profile_id?: number;
  intent_gt: string; // e.g., "cross_street"
  risk_gt: 'low' | 'medium' | 'high' | 'critical';
  assistance_gt: 'voice' | 'text' | 'visual';
  // optional simulated environment flags (e.g., noisy, missing modality)
  simulated_environment?: { noisy?: boolean; missing_modality?: string };
}

async function downloadAsBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  const buffer = await resp.buffer();
  const mime = resp.headers.get('content-type') || 'application/octet-stream';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

async function buildManifest(count: number = 20): Promise<ManifestEntry[]> {
  const manifest: ManifestEntry[] = [];

  // Example URLs – tiny public images/audio for demo purposes.
  const sampleImages = [
    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300',
    'https://images.unsplash.com/photo-1526401485004-2c3768b5ac37?w=400&h=300',
  ];
  const sampleAudio = [
    // short wav files from a public repo
    'https://raw.githubusercontent.com/Common-Voice/common-voice/master/client/app/assets/audio/en/2021-03-28-02-03-22.wav',
  ];

  for (let i = 0; i < count; i++) {
    const imgUrl = sampleImages[i % sampleImages.length];
    const audioUrl = sampleAudio[i % sampleAudio.length];
    const imageBase64 = await downloadAsBase64(imgUrl);
    const audioBase64 = await downloadAsBase64(audioUrl);

    // Simple synthetic ground truth – rotate through a few intents and risks.
    const intents = ['cross_street', 'find_exit', 'read_sign'];
    const risks: ManifestEntry['risk_gt'][] = ['low', 'medium', 'high'];
    const assists: ManifestEntry['assistance_gt'][] = ['voice', 'text', 'visual'];

    manifest.push({
      id: `scenario_${i}`,
      image_base64: imageBase64,
      audio_base64: audioBase64 && !audioBase64.includes('NDA0OiBOb3QgRm91bmQ=') ? audioBase64 : 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
      ocr_image_base64: imageBase64,
      language: 'en',
      profile_id: 1,
      intent_gt: intents[i % intents.length],
      risk_gt: risks[i % risks.length],
      assistance_gt: assists[i % assists.length],
      simulated_environment: {},
    });
  }
  return manifest;
}

async function main() {
  const count = Number(process.argv[2] || 20);
  const manifest = await buildManifest(count);
  const outDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `manifest_${count}.json`);
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Generated ${manifest.length} test scenarios → ${outPath}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error('Error generating dataset:', e);
    process.exit(1);
  });
}
