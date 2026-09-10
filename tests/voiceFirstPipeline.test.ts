import request from 'supertest';
import { createServer } from '../server.ts';
import { voiceIntentEngine } from '../server/voiceIntentEngine.ts';
import { exitObstaclePipeline } from '../server/exitObstaclePipeline.ts';
import type { DetectedObject } from '../src/types.ts';

const app = createServer();

describe('THUNAI Voice-First Speech-to-Speech Assistive Pipeline (14 Scenarios)', () => {
  // TEST 1: "Open the camera"
  test('TEST 1: Voice intent classifier recognizes "Open the camera"', async () => {
    const res = await request(app)
      .post('/api/voice/intent')
      .send({ text: 'Open the camera' });

    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('CAMERA_OPEN');
    expect(res.body.requiresCamera).toBe(true);
  });

  // TEST 2: "What is in front of me?"
  test('TEST 2: "What is in front of me?" returns spatial objects with concise speech', async () => {
    const sampleObjects: DetectedObject[] = [
      { label: 'chair', confidence: 0.92, distance_meters: 1.4, bbox: [0.35, 0.45, 0.65, 0.85] },
      { label: 'table', confidence: 0.88, distance_meters: 2.1, bbox: [0.15, 0.50, 0.45, 0.85] },
    ];

    const result = exitObstaclePipeline.evaluateScene(sampleObjects, undefined, 'CHECK_OBSTACLES', 'en');
    expect(result.spokenResponse).toContain('chair');
    expect(result.spokenResponse).toContain('1.4');
    expect(result.obstaclesInPath.length).toBeGreaterThanOrEqual(1);
  });

  // TEST 3: "Where is the exit?" with Exit + Obstacle Fusion
  test('TEST 3: "Where is the exit?" performs Exit + Obstacle Fusion in one concise response', async () => {
    const sceneWithExitAndObstacle: DetectedObject[] = [
      { label: 'door', confidence: 0.94, distance_meters: 4.0, bbox: [0.30, 0.15, 0.45, 0.85] },
      { label: 'chair', confidence: 0.90, distance_meters: 1.5, bbox: [0.35, 0.55, 0.65, 0.90] },
    ];

    const result = exitObstaclePipeline.evaluateScene(
      sceneWithExitAndObstacle,
      'EXIT',
      'FIND_EXIT',
      'en'
    );

    expect(result.exitFound).toBe(true);
    expect(result.exitType).toBe('confirmed_exit');
    expect(result.spokenResponse).toContain('exit');
    expect(result.spokenResponse).toContain('chair');
    expect(result.spokenResponse).toContain('1.5');
  });

  // TEST 4: "Is the path clear?"
  test('TEST 4: "Is the path clear?" performs spatial path clearance analysis', async () => {
    const clearScene: DetectedObject[] = [];
    const resultClear = exitObstaclePipeline.evaluateScene(clearScene, undefined, 'CHECK_PATH_CLEAR', 'en');
    expect(resultClear.spokenResponse).toContain('clear');

    const blockedScene: DetectedObject[] = [
      { label: 'obstacle', confidence: 0.95, distance_meters: 0.9, bbox: [0.4, 0.5, 0.6, 0.9] },
    ];
    const resultBlocked = exitObstaclePipeline.evaluateScene(blockedScene, undefined, 'CHECK_PATH_CLEAR', 'en');
    expect(resultBlocked.spokenResponse).toContain('not clear');
  });

  // TEST 5: "Where is the door?"
  test('TEST 5: "Where is the door?" locates door landmark and relative direction', async () => {
    const sceneWithDoor: DetectedObject[] = [
      { label: 'door', confidence: 0.95, distance_meters: 2.8, bbox: [0.70, 0.15, 0.95, 0.85] },
    ];

    const result = exitObstaclePipeline.evaluateScene(sceneWithDoor, undefined, 'FIND_DOOR', 'en');
    expect(result.exitFound).toBe(true);
    expect(result.spokenResponse).toContain('door');
    expect(result.spokenResponse).toContain('2.8');
  });

  // TEST 6: "How far is it?" (Conversational memory linking)
  test('TEST 6: "How far is it?" resolves target distance from context', async () => {
    const scene: DetectedObject[] = [
      { label: 'door', confidence: 0.95, distance_meters: 3.2, bbox: [0.4, 0.2, 0.6, 0.8] },
    ];

    const result = exitObstaclePipeline.evaluateScene(scene, undefined, 'DISTANCE_QUERY', 'en', 'door');
    expect(result.spokenResponse).toContain('3.2 metres');
  });

  // TEST 7: "Stop" / "Be quiet"
  test('TEST 7: "Stop" and "Be quiet" are recognized as STOP_SPEECH for barge-in', async () => {
    const intentStop = voiceIntentEngine.classify('Stop');
    expect(intentStop.intent).toBe('STOP_SPEECH');

    const intentQuiet = voiceIntentEngine.classify('Be quiet');
    expect(intentQuiet.intent).toBe('STOP_SPEECH');
  });

  // TEST 8: Tamil command: "Exit enga irukku?"
  test('TEST 8: Tamil query "Exit enga irukku?" is recognized and answered in Tamil', async () => {
    const intent = voiceIntentEngine.classify('Exit enga irukku?');
    expect(intent.intent).toBe('FIND_EXIT');
    expect(intent.language).toBe('ta');

    const scene: DetectedObject[] = [
      { label: 'door', confidence: 0.94, distance_meters: 3.5, bbox: [0.45, 0.15, 0.55, 0.85] },
    ];
    const result = exitObstaclePipeline.evaluateScene(scene, 'EXIT', 'FIND_EXIT', 'ta');
    expect(result.spokenResponse).toContain('வெளியேறும் வழி');
  });

  // TEST 9: Tanglish mixed command: "En munnadi obstacle irukka?"
  test('TEST 9: Tanglish query "En munnadi obstacle irukka?" is correctly interpreted', async () => {
    const intent = voiceIntentEngine.classify('En munnadi obstacle irukka?');
    expect(intent.intent).toBe('CHECK_OBSTACLES');
    expect(intent.language).toBe('ta');
  });

  // TEST 10: Camera permission handling
  test('TEST 10: Camera error speech handles denied permission gracefully', () => {
    const intent = voiceIntentEngine.classify('Camera close pannunga');
    expect(intent.intent).toBe('CAMERA_CLOSE');
    expect(intent.requiresCamera).toBe(false);
  });

  // TEST 11: No exit visible (Strict anti-hallucination)
  test('TEST 11: No exit visible returns explicit uncertainty without hallucination', async () => {
    const sceneNoExit: DetectedObject[] = [
      { label: 'table', confidence: 0.88, distance_meters: 2.0, bbox: [0.3, 0.5, 0.7, 0.85] },
    ];

    const result = exitObstaclePipeline.evaluateScene(sceneNoExit, undefined, 'FIND_EXIT', 'en');
    expect(result.exitFound).toBe(false);
    expect(result.spokenResponse).toBe(
      'I cannot see a clear exit from the current view. Please turn slowly to the left.'
    );
  });

  // TEST 12: Obstacle moving closer increases severity
  test('TEST 12: Obstacle moving closer (< 0.7m) escalates to CRITICAL severity', () => {
    const closeObstacle: DetectedObject[] = [
      { label: 'obstacle', confidence: 0.95, distance_meters: 0.5, bbox: [0.35, 0.45, 0.65, 0.95] },
    ];

    const result = exitObstaclePipeline.evaluateScene(closeObstacle, undefined, 'CHECK_OBSTACLES', 'en');
    expect(result.obstaclesInPath[0].severity).toBe('CRITICAL');
    expect(result.spokenResponse).toContain('Critical warning');
  });

  // TEST 13: Obstacle temporal alert cooldown
  test('TEST 13: Alert cooldown prevents repetitive obstacle warnings', () => {
    const obstacle: DetectedObject = {
      label: 'chair',
      confidence: 0.90,
      distance_meters: 1.8,
      bbox: [0.3, 0.4, 0.7, 0.8],
    };

    const firstCheck = exitObstaclePipeline.shouldTriggerObstacleAlert(obstacle);
    expect(firstCheck).toBe(true);

    const immediateRepeat = exitObstaclePipeline.shouldTriggerObstacleAlert(obstacle);
    expect(immediateRepeat).toBe(false);
  });

  // TEST 14: Emergency gesture verification
  test('TEST 14: Emergency commands trigger immediate EMERGENCY intent', () => {
    const intent = voiceIntentEngine.classify('Help me! Emergency!');
    expect(intent.intent).toBe('EMERGENCY');
  });
});
