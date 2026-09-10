// scripts/run_evaluation.ts
import request from 'supertest';
import { createServer } from '../server.ts';
import { metrics } from '../src/utils/metrics.ts';
import path from 'path';
import fs from 'fs';

(async () => {
  const app = createServer();
  const manifestPath = path.resolve(__dirname, '../data/manifest_5.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('Manifest not found:', manifestPath);
    process.exit(1);
  }
  const manifest: any[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  for (const scenario of manifest) {
    // Vision
    metrics.start('vision');
    await request(app).post('/api/vision/detect').send({ image_base64: scenario.image_base64 }).expect(200);
    metrics.end('vision');

    // Speech if present
    if (scenario.audio_base64) {
      metrics.start('speech');
      await request(app).post('/api/speech/transcribe').send({ audio_base64: scenario.audio_base64, language: scenario.language }).expect(200);
      metrics.end('speech');
    }

    // OCR if present
    if (scenario.ocr_image_base64) {
      metrics.start('ocr');
      await request(app).post('/api/ocr/extract').send({ image_base64: scenario.ocr_image_base64 }).expect(200);
      metrics.end('ocr');
    }

    // Full pipeline
    metrics.start('fullPipeline');
    await request(app).post('/api/assistant/process')
      .send({
        image_base64: scenario.image_base64,
        audio_base64: scenario.audio_base64,
        text_input: scenario.text_input,
        profile_id: scenario.profile_id,
        language: scenario.language,
      })
      .expect(200);
    metrics.end('fullPipeline');
  }
  console.log('Evaluation completed. Logs written to logs folder.');
})();
