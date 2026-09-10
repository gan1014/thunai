/**
 * THUNAI Exit & Obstacle Spatial Fusion Pipeline
 * 
 * Performs deterministic exit verification, path obstacle analysis,
 * severity classification, temporal alert filtering, and multilingual fusion.
 */

import type { DetectedObject, LanguageCode, NavigationPathData } from '../src/types.ts';

export type ObstacleSeverity = 'SAFE' | 'CAUTION' | 'WARNING' | 'CRITICAL';

export interface ExitAnalysisResult {
  exitFound: boolean;
  exitType?: 'confirmed_exit' | 'exit_sign_only' | 'doorway' | 'uncertain';
  exitObject?: DetectedObject;
  exitDistanceM?: number;
  exitDirection?: string;
  exitConfidence: number;
  obstaclesInPath: Array<{
    object: DetectedObject;
    severity: ObstacleSeverity;
    distanceM: number;
    direction: string;
    isCritical: boolean;
  }>;
  pathStatus: 'CLEAR' | 'OBSTRUCTED' | 'CAUTION_HAZARDS' | 'UNCERTAIN';
  spokenResponse: string;
  language: LanguageCode;
  navigationPath?: NavigationPathData;
  detected_objects?: DetectedObject[];
}

interface ObstacleAlertMemory {
  lastObstacleId: string;
  lastDistance: number;
  lastAlertTime: number;
  lastSeverity: ObstacleSeverity;
}

export class ExitObstaclePipeline {
  private alertMemory: Map<string, ObstacleAlertMemory> = new Map();
  private readonly COOLDOWN_MS = 4000;

  /**
   * Generates a Google Maps AR style walking path connecting user (bottom center) to target door/exit.
   */
  public generateNavigationPath(
    targetObj?: DetectedObject,
    obstacles: ExitAnalysisResult['obstaclesInPath'] = []
  ): NavigationPathData | undefined {
    if (!targetObj) return undefined;

    const tx = (targetObj.bbox[0] + targetObj.bbox[2]) / 2; // target center X (0 to 1)
    const ty = (targetObj.bbox[1] + targetObj.bbox[3]) / 2; // target center Y (0 to 1)
    const dist = targetObj.distance_meters || 2.5;

    // Start from bottom center of camera view (user position)
    const startX = 0.5;
    const startY = 0.95;

    // Calculate heading angle in degrees (-45° left to +45° right)
    const deltaX = tx - startX;
    const turnAngleDeg = Math.round(Math.atan2(deltaX, (startY - ty) || 0.5) * (180 / Math.PI));

    // Clock direction representation for audio and visual guidance
    let clockDirection = "12 o'clock (straight ahead)";
    if (turnAngleDeg < -25) clockDirection = "10 o'clock (left)";
    else if (turnAngleDeg < -8) clockDirection = "11 o'clock (slightly left)";
    else if (turnAngleDeg > 25) clockDirection = "2 o'clock (right)";
    else if (turnAngleDeg > 8) clockDirection = "1 o'clock (slightly right)";

    // Estimated walking steps (average 0.7m per human stride)
    const stepCountEstimated = Math.max(1, Math.round(dist / 0.7));

    // Turn by turn instruction text
    let stepInstruction = `Walk ${stepCountEstimated} steps forward`;
    if (turnAngleDeg < -12) {
      stepInstruction = `Turn ${Math.abs(turnAngleDeg)}° left and walk ${stepCountEstimated} steps`;
    } else if (turnAngleDeg > 12) {
      stepInstruction = `Turn ${turnAngleDeg}° right and walk ${stepCountEstimated} steps`;
    }

    // Check if any obstacle blocks the direct line path
    let isPathClear = true;
    let hazardAlert: string | undefined;
    let midX = (startX + tx) / 2;
    let midY = (startY + ty) / 2;

    const blockingObs = obstacles.find(
      (o) => o.distanceM < dist && (o.severity === 'CRITICAL' || o.severity === 'WARNING')
    );

    if (blockingObs) {
      isPathClear = false;
      const obsX = (blockingObs.object.bbox[0] + blockingObs.object.bbox[2]) / 2;
      hazardAlert = `Caution: ${blockingObs.object.label.replace('_', ' ')} at ${blockingObs.distanceM.toFixed(1)}m`;

      // Bend waypoints around obstacle (obstacle-avoidant spline corridor)
      if (obsX >= 0.5) {
        midX = Math.max(0.15, obsX - 0.28);
      } else {
        midX = Math.min(0.85, obsX + 0.28);
      }
      stepInstruction = `Veer ${obsX >= 0.5 ? 'left' : 'right'} around ${blockingObs.object.label.replace('_', ' ')}, then proceed ${stepCountEstimated} steps`;
    }

    // Generate smooth spline waypoints for Google Maps AR route corridor
    const waypoints = [
      { x: startX, y: startY },
      { x: startX * 0.7 + midX * 0.3, y: startY * 0.7 + midY * 0.3 },
      { x: midX, y: midY },
      { x: midX * 0.3 + tx * 0.7, y: midY * 0.3 + ty * 0.7 },
      { x: tx, y: Math.min(0.88, ty + 0.1) },
    ];

    const pathColor = isPathClear ? '#10B981' : '#F59E0B'; // green for clear, amber for caution

    return {
      targetLabel: targetObj.label.replace('_', ' '),
      targetDistanceMeters: dist,
      clockDirection,
      turnAngleDeg,
      stepInstruction,
      stepCountEstimated,
      isPathClear,
      waypoints,
      pathColor,
      hazardAlert,
      timestamp: Date.now(),
    };
  }

  /**
   * Evaluates the visual & spatial scene for exit queries, obstacle checks, and path clearance.
   */
  evaluateScene(
    objects: DetectedObject[],
    ocrText?: string,
    queryType: 'FIND_EXIT' | 'FIND_DOOR' | 'CHECK_OBSTACLES' | 'CHECK_PATH_CLEAR' | 'DISTANCE_QUERY' = 'FIND_EXIT',
    language: LanguageCode = 'en',
    lastTargetLandmark?: string
  ): ExitAnalysisResult {
    const lang = (language || 'en').toLowerCase().split('-')[0] as LanguageCode;

    // 1. Exit & Door Identification
    const exitSignObj = objects.find(
      (o) => o.label === 'exit_sign' || (o.label === 'sign' && o.confidence >= 0.65)
    );
    const doorObj = objects.find(
      (o) => (o.label === 'door' || o.label === 'entrance' || o.label === 'corridor') && o.confidence >= 0.65
    );

    const hasExitOcr = Boolean(
      ocrText &&
      /\b(exit|emergency exit|way out|வெளியேறும் வழி|బయటికి వెళ్లే మార్గం|निकास)\b/i.test(ocrText)
    );

    let exitFound = false;
    let exitType: ExitAnalysisResult['exitType'] = 'uncertain';
    let targetExitObj: DetectedObject | undefined;
    let exitConfidence = 0;

    if (queryType === 'FIND_DOOR') {
      if (doorObj) {
        exitFound = true;
        exitType = 'doorway';
        targetExitObj = doorObj;
        exitConfidence = doorObj.confidence;
      }
    } else {
      // Exit query
      if (hasExitOcr && doorObj) {
        exitFound = true;
        exitType = 'confirmed_exit';
        targetExitObj = doorObj;
        exitConfidence = Math.max(0.92, doorObj.confidence);
      } else if (exitSignObj && doorObj) {
        exitFound = true;
        exitType = 'confirmed_exit';
        targetExitObj = doorObj;
        exitConfidence = 0.90;
      } else if (doorObj) {
        exitFound = true;
        exitType = 'doorway';
        targetExitObj = doorObj;
        exitConfidence = doorObj.confidence;
      } else if (exitSignObj || hasExitOcr) {
        exitFound = true;
        exitType = 'exit_sign_only';
        targetExitObj = exitSignObj || {
          label: 'exit_sign',
          confidence: 0.85,
          distance_meters: 3.0,
          bbox: [0.4, 0.1, 0.6, 0.25],
        };
        exitConfidence = 0.85;
      }
    }

    // Fallback if looking for exit/door and a candidate exists
    if (!targetExitObj && (queryType === 'FIND_EXIT' || queryType === 'FIND_DOOR')) {
      const anyDoorLike = objects.find((o) => o.label.includes('door') || o.label.includes('exit') || o.label.includes('entrance'));
      if (anyDoorLike) {
        exitFound = true;
        exitType = 'doorway';
        targetExitObj = anyDoorLike;
        exitConfidence = anyDoorLike.confidence;
      }
    }

    // 2. Obstacle Analysis
    const obstacleList = this.analyzeObstacles(objects, targetExitObj);
    const criticalObstacle = obstacleList.find((o) => o.severity === 'CRITICAL' || o.severity === 'WARNING');

    // 3. Determine Path Status
    let pathStatus: ExitAnalysisResult['pathStatus'] = 'CLEAR';
    if (criticalObstacle) {
      pathStatus = 'OBSTRUCTED';
    } else if (obstacleList.some((o) => o.severity === 'CAUTION')) {
      pathStatus = 'CAUTION_HAZARDS';
    } else if (objects.length === 0) {
      pathStatus = 'CLEAR';
    }

    // 4. Generate AR Navigation Path
    const navigationPath = this.generateNavigationPath(targetExitObj, obstacleList);

    // 5. Generate Spoken Response
    const spokenResponse = this.generateSpokenFusion(
      queryType,
      exitFound,
      exitType,
      targetExitObj,
      obstacleList,
      pathStatus,
      lang,
      lastTargetLandmark,
      navigationPath
    );

    return {
      exitFound,
      exitType,
      exitObject: targetExitObj,
      exitDistanceM: targetExitObj?.distance_meters,
      exitDirection: targetExitObj ? this.formatNaturalDirection(targetExitObj, lang) : undefined,
      exitConfidence,
      obstaclesInPath: obstacleList,
      pathStatus,
      spokenResponse,
      language: lang,
      navigationPath,
      detected_objects: objects,
    };
  }

  private analyzeObstacles(
    objects: DetectedObject[],
    targetObj?: DetectedObject
  ): ExitAnalysisResult['obstaclesInPath'] {
    const OBSTACLE_LABELS = new Set([
      'person', 'chair', 'table', 'wall', 'pole', 'vehicle', 'bag', 'box',
      'stairs', 'obstacle', 'bench', 'counter', 'pothole', 'auto_rickshaw',
      'cow_animal', 'speed_breaker', 'metro_platform_edge'
    ]);

    const results: ExitAnalysisResult['obstaclesInPath'] = [];

    for (const obj of objects) {
      if (targetObj && obj === targetObj) continue;
      if (obj.label === 'exit_sign') continue;
      if (!OBSTACLE_LABELS.has(obj.label) && obj.distance_meters > 2.0) continue;

      const dist = obj.distance_meters;
      let severity: ObstacleSeverity = 'SAFE';

      if (dist < 0.7) {
        severity = 'CRITICAL';
      } else if (dist <= 1.5) {
        severity = 'WARNING';
      } else if (dist <= 3.0) {
        severity = 'CAUTION';
      } else {
        severity = 'SAFE';
      }

      const dir = this.formatNaturalDirection(obj);
      const isAhead = dir.includes('ahead') || dir.includes('front');

      if (isAhead && severity === 'CAUTION' && dist <= 2.2) {
        severity = 'WARNING';
      }

      results.push({
        object: obj,
        severity,
        distanceM: dist,
        direction: dir,
        isCritical: severity === 'CRITICAL',
      });
    }

    return results.sort((a, b) => a.distanceM - b.distanceM);
  }

  private formatNaturalDirection(obj: DetectedObject, lang: LanguageCode = 'en'): string {
    const rawDir = obj.spatial?.direction || 'CENTER';
    const cx = (obj.bbox[0] + obj.bbox[2]) / 2;

    if (lang === 'ta') {
      if (rawDir === 'FAR_LEFT' || cx < 0.25) return 'இடதுபுறம் தூரத்தில்';
      if (rawDir === 'LEFT' || cx < 0.40) return 'இடதுபுறம் சற்று முன்னால்';
      if (rawDir === 'FAR_RIGHT' || cx > 0.75) return 'வலதுபுறம் தூரத்தில்';
      if (rawDir === 'RIGHT' || cx > 0.60) return 'வலதுபுறம் சற்று முன்னால்';
      return 'நேர் முன்னால்';
    }

    if (lang === 'te') {
      if (rawDir === 'FAR_LEFT' || cx < 0.25) return 'మీ ఎడమ వైపు దూరంలో';
      if (rawDir === 'LEFT' || cx < 0.40) return 'మీ ఎడమ వైపు కొద్దిగా ముందు';
      if (rawDir === 'FAR_RIGHT' || cx > 0.75) return 'మీ కుడి వైపు దూరంలో';
      if (rawDir === 'RIGHT' || cx > 0.60) return 'మీ కుడి వైపు కొద్దిగా ముందు';
      return 'నేరుగా ముందు';
    }

    if (lang === 'hi') {
      if (rawDir === 'FAR_LEFT' || cx < 0.25) return 'बाईं ओर दूर';
      if (rawDir === 'LEFT' || cx < 0.40) return 'बाईं ओर आगे';
      if (rawDir === 'FAR_RIGHT' || cx > 0.75) return 'दाईं ओर दूर';
      if (rawDir === 'RIGHT' || cx > 0.60) return 'दाईं ओर आगे';
      return 'सीधे सामने';
    }

    if (rawDir === 'FAR_LEFT' || cx < 0.25) return 'far to your left';
    if (rawDir === 'LEFT' || cx < 0.40) return 'ahead and slightly to your left';
    if (rawDir === 'FAR_RIGHT' || cx > 0.75) return 'far to your right';
    if (rawDir === 'RIGHT' || cx > 0.60) return 'ahead and slightly to your right';
    return 'directly ahead';
  }

  private localizeObjectLabel(label: string, lang: LanguageCode = 'en'): string {
    const l = label.toLowerCase();
    if (lang === 'ta') {
      const map: Record<string, string> = {
        chair: 'நாற்காலி',
        table: 'மேஜை',
        door: 'கதவு',
        exit: 'வெளியேறும் வழி',
        exit_sign: 'வெளியேறும் பலகை',
        person: 'நபர்',
        stairs: 'படிகள்',
        obstacle: 'தடை',
        vehicle: 'வாகனம்',
        wall: 'சுவர்',
      };
      return map[l] || l.replace('_', ' ');
    }
    if (lang === 'te') {
      const map: Record<string, string> = {
        chair: 'కుర్చీ',
        table: 'బల్ల',
        door: 'ద్వారం',
        exit: 'బయటికి వెళ్లే మార్గం',
        exit_sign: 'ఎగ్జిట్ బోర్డు',
        person: 'వ్యక్తి',
        stairs: 'మెట్లు',
        obstacle: 'అడ్డంకి',
        vehicle: 'వాహనం',
        wall: 'గోడ',
      };
      return map[l] || l.replace('_', ' ');
    }
    if (lang === 'hi') {
      const map: Record<string, string> = {
        chair: 'कुर्सी',
        table: 'मेज',
        door: 'दरवाजा',
        exit: 'निकास',
        exit_sign: 'निकास बोर्ड',
        person: 'व्यक्ति',
        stairs: 'सीढ़ियां',
        obstacle: 'बाधा',
        vehicle: 'वाहन',
        wall: 'दीवार',
      };
      return map[l] || l.replace('_', ' ');
    }
    return l.replace('_', ' ');
  }

  private generateSpokenFusion(
    queryType: string,
    exitFound: boolean,
    exitType: string,
    exitObj: DetectedObject | undefined,
    obstacles: ExitAnalysisResult['obstaclesInPath'],
    pathStatus: string,
    lang: LanguageCode,
    lastTargetLandmark?: string,
    navigationPath?: NavigationPathData
  ): string {
    const nearestObstacle = obstacles[0];
    const hasHazard = nearestObstacle && (nearestObstacle.severity === 'CRITICAL' || nearestObstacle.severity === 'WARNING');

    // Query 1: FIND_EXIT
    if (queryType === 'FIND_EXIT') {
      if (!exitFound || !exitObj) {
        if (lang === 'ta') {
          return 'தற்போதைய பார்வையில் வெளியேறும் வழி தெளிவாகத் தெரியவில்லை. தயவுசெய்து மெதுவாக இடதுபுறம் திரும்புங்கள்.';
        }
        if (lang === 'te') {
          return 'ప్రస్తుత దృశ్యంలో బయటికి వెళ్లే మార్గం స్పష్టంగా కనిపించడం లేదు. దయచేసి నెమ్మదిగా ఎడమ వైపు తిరగండి.';
        }
        if (lang === 'hi') {
          return 'वर्तमान दृश्य से कोई स्पष्ट निकास नहीं दिखाई दे रहा है। कृपया धीरे-धीरे बाईं ओर मुड़ें।';
        }
        return 'I cannot see a clear exit from the current view. Please turn slowly to the left.';
      }

      const dist = exitObj.distance_meters.toFixed(1);
      const dir = this.formatNaturalDirection(exitObj, lang);
      const clock = navigationPath?.clockDirection ? ` at ${navigationPath.clockDirection}` : '';
      const steps = navigationPath?.stepCountEstimated ? ` (about ${navigationPath.stepCountEstimated} steps)` : '';

      if (exitType === 'exit_sign_only') {
        if (lang === 'ta') {
          return `முன்னால் சுமார் ${dist} மீட்டர் தொலைவில் வெளியேறும் பலகை (Exit Sign) தெரிகிறது, ஆனால் கதவை இன்னும் உறுதிப்படுத்த முடியவில்லை.`;
        }
        if (lang === 'te') {
          return `ముందు దాదాపు ${dist} మీటర్ల దూరంలో ఎగ్జిట్ బోర్డు కనిపిస్తోంది, కానీ తలుపు ఇంకా నిర్ధారించబడలేదు.`;
        }
        if (lang === 'hi') {
          return `आगे लगभग ${dist} मीटर पर एक निकास बोर्ड दिख रहा है, लेकिन दरवाजे की पुष्टि नहीं हो सकी है।`;
        }
        return `I can see an exit sign ${dir}, approximately ${dist} metres away, but I cannot confirm the doorway.`;
      }

      // Confirmed exit / doorway with obstacle checking
      let obstaclePhrase = '';
      if (hasHazard) {
        const obsLabel = this.localizeObjectLabel(nearestObstacle.object.label, lang);
        const obsDist = nearestObstacle.distanceM.toFixed(1);
        if (lang === 'ta') {
          obstaclePhrase = ` இடையில் சுமார் ${obsDist} மீட்டர் தொலைவில் ஒரு ${obsLabel} தடையாக உள்ளது.`;
        } else if (lang === 'te') {
          obstaclePhrase = ` మధ్యలో దాదాపు ${obsDist} మీటర్ల వద్ద ఒక ${obsLabel} అడ్డంకిగా ఉంది.`;
        } else if (lang === 'hi') {
          obstaclePhrase = ` बीच में लगभग ${obsDist} मीटर पर एक ${obsLabel} बाधा है।`;
        } else {
          obstaclePhrase = ` There is a ${obsLabel} about ${obsDist} metres ahead.`;
        }
      } else {
        if (lang === 'ta') {
          obstaclePhrase = ' தற்போதைய பார்வையில் பாதை தெளிவாக உள்ளது.';
        } else if (lang === 'te') {
          obstaclePhrase = ' ప్రస్తుత దృశ్యంలో మార్గం స్పష్టంగా ఉంది.';
        } else if (lang === 'hi') {
          obstaclePhrase = ' वर्तमान दृश्य में रास्ता साफ दिखाई दे रहा है।';
        } else {
          obstaclePhrase = ' The path appears clear in the current view.';
        }
      }

      if (lang === 'ta') {
        return `வெளியேறும் வழி உங்களுக்கு ${dir} சுமார் ${dist} மீட்டர் தொலைவில் உள்ளது.${obstaclePhrase}`;
      }
      if (lang === 'te') {
        return `బయటికి వెళ్లే మార్గం మీకు ${dir} దాదాపు ${dist} మీటర్ల దూరంలో ఉంది.${obstaclePhrase}`;
      }
      if (lang === 'hi') {
        return `निकास आपके ${dir} लगभग ${dist} मीटर की दूरी पर है।${obstaclePhrase}`;
      }
      return `The exit is ${dir}${clock}, approximately ${dist} metres away${steps}.${obstaclePhrase}`;
    }

    // Query 2: FIND_DOOR
    if (queryType === 'FIND_DOOR') {
      if (!exitObj) {
        if (lang === 'ta') return 'தற்போதைய பார்வையில் கதவு எதுவும் தெளிவாகத் தெரியவில்லை.';
        if (lang === 'te') return 'ప్రస్తుత దృశ్యంలో తలుపు ఏదీ స్పష్టంగా కనిపించడం లేదు.';
        if (lang === 'hi') return 'सामने कोई दरवाजा नहीं दिख रहा है।';
        return 'No door is confidently visible in your current camera view.';
      }
      const dist = exitObj.distance_meters.toFixed(1);
      const dir = this.formatNaturalDirection(exitObj, lang);
      const clock = navigationPath?.clockDirection ? ` at ${navigationPath.clockDirection}` : '';
      const steps = navigationPath?.stepCountEstimated ? ` (about ${navigationPath.stepCountEstimated} steps)` : '';

      let obstaclePhrase = '';
      if (hasHazard) {
        const obsLabel = this.localizeObjectLabel(nearestObstacle.object.label, lang);
        const obsDist = nearestObstacle.distanceM.toFixed(1);
        obstaclePhrase = lang === 'ta'
          ? ` இடையில் ${obsDist} மீட்டரில் ஒரு ${obsLabel} உள்ளது.`
          : lang === 'te'
          ? ` మధ్యలో ${obsDist} మీటర్లలో ${obsLabel} ఉంది.`
          : lang === 'hi'
          ? ` बीच में ${obsDist} मीटर पर ${obsLabel} है।`
          : ` There is a ${obsLabel} about ${obsDist} metres ahead.`;
      }

      if (lang === 'ta') return `கதவு உங்களுக்கு ${dir} சுமார் ${dist} மீட்டர் தொலைவில் உள்ளது.${obstaclePhrase}`;
      if (lang === 'te') return `ద్వారం మీకు ${dir} సుమారు ${dist} మీటర్ల దూరంలో ఉంది.${obstaclePhrase}`;
      if (lang === 'hi') return `दरवाजा आपके ${dir} लगभग ${dist} मीटर पर स्थित है।${obstaclePhrase}`;
      return `The door is located ${dir}${clock}, approximately ${dist} metres away${steps}.${obstaclePhrase}`;
    }

    // Query 3: CHECK_PATH_CLEAR
    if (queryType === 'CHECK_PATH_CLEAR') {
      if (hasHazard) {
        const obsLabel = nearestObstacle.object.label.replace('_', ' ');
        const obsDist = nearestObstacle.distanceM.toFixed(1);
        if (lang === 'ta') {
          return `எச்சரிக்கை: பாதை தெளிவாக இல்லை. ${nearestObstacle.direction} சுமார் ${obsDist} மீட்டர் தொலைவில் ${obsLabel} உள்ளது.`;
        }
        if (lang === 'te') {
          return `హెచ్చరిక: మార్గం స్పష్టంగా లేదు. ${nearestObstacle.direction} దాదాపు ${obsDist} మీటర్ల దూరంలో ${obsLabel} ఉంది.`;
        }
        if (lang === 'hi') {
          return `सावधानी: रास्ता साफ नहीं है। लगभग ${obsDist} मीटर पर ${obsLabel} बाधा है।`;
        }
        return `Caution: The path is not clear. There is a ${obsLabel} ${nearestObstacle.direction}, approximately ${obsDist} metres away.`;
      }

      if (lang === 'ta') return 'பாதை தெளிவாக உள்ளது. நீங்கள் பாதுகாப்பாக முன்னேறிச் செல்லலாம்.';
      if (lang === 'te') return 'మార్గం స్పష్టంగా ఉంది. మీరు సురక్షితంగా ముందుకు వెళ్లవచ్చు.';
      if (lang === 'hi') return 'रास्ता साफ प्रतीत होता है। आप सुरक्षित आगे बढ़ सकते हैं.';
      return 'The path ahead appears clear. You may proceed forward safely.';
    }

    // Query 4: CHECK_OBSTACLES / WHAT IS IN FRONT
    if (queryType === 'CHECK_OBSTACLES') {
      if (obstacles.length === 0) {
        if (lang === 'ta') return 'முன்னால் எந்தத் தடையும் இல்லை. பாதை தெளிவாக உள்ளது.';
        if (lang === 'te') return 'ముందు ఎటువంటి అడ్డంకులు లేవు. మార్గం స్పష్టంగా ఉంది.';
        if (lang === 'hi') return 'आगे कोई बाधा नहीं है। रास्ता साफ है।';
        return 'No immediate obstacles detected in your forward pathway.';
      }

      const obs = obstacles[0];
      const obsLabel = obs.object.label.replace('_', ' ');
      const obsDist = obs.distanceM.toFixed(1);
      const obsDir = obs.direction;

      if (obs.severity === 'CRITICAL') {
        if (lang === 'ta') return `உடனடி எச்சரிக்கை: ${obsLabel} மிக அருகில் ${obsDist} மீட்டரில் உள்ளது! உடனே நில்லுங்கள்!`;
        if (lang === 'te') return `తక్షణ హెచ్చరిక: ${obsLabel} చాలా దగ్గరగా ${obsDist} మీటర్లలో ఉంది! వెంటనే ఆగండి!`;
        if (lang === 'hi') return `खतरे की चेतावनी: ${obsLabel} बहुत पास ${obsDist} मीटर पर है! कृपया तुरंत रुकें!`;
        return `Critical warning: ${obsLabel} is directly ahead, less than ${obsDist} metres away! Please stop.`;
      }

      if (lang === 'ta') {
        return `${obsDir} சுமார் ${obsDist} மீட்டர் தொலைவில் ஒரு ${obsLabel} உள்ளது.`;
      }
      if (lang === 'te') {
        return `${obsDir} దాదాపు ${obsDist} మీటర్ల దూరంలో ఒక ${obsLabel} ఉంది.`;
      }
      if (lang === 'hi') {
        return `${obsDir} लगभग ${obsDist} मीटर पर एक ${obsLabel} है।`;
      }
      return `There is a ${obsLabel} ${obsDir}, approximately ${obsDist} metres away.`;
    }

    // Query 5: DISTANCE_QUERY
    if (queryType === 'DISTANCE_QUERY') {
      if (exitObj) {
        const dist = exitObj.distance_meters.toFixed(1);
        const label = exitObj.label.replace('_', ' ');
        return `The ${label} is approximately ${dist} metres away.`;
      }
      if (nearestObstacle) {
        const dist = nearestObstacle.distanceM.toFixed(1);
        const label = nearestObstacle.object.label.replace('_', ' ');
        return `The ${label} is approximately ${dist} metres away.`;
      }
      return 'The target distance cannot be reliably estimated from this angle.';
    }

    return 'Perception active. Pathway is monitored.';
  }

  /**
   * Filters repeated obstacle alerts to avoid "obstacle, obstacle" noise.
   */
  shouldTriggerObstacleAlert(obstacle: DetectedObject): boolean {
    const id = obstacle.label;
    const now = Date.now();
    const prev = this.alertMemory.get(id);

    if (!prev) {
      this.alertMemory.set(id, {
        lastObstacleId: id,
        lastDistance: obstacle.distance_meters,
        lastAlertTime: now,
        lastSeverity: obstacle.distance_meters < 0.7 ? 'CRITICAL' : 'WARNING',
      });
      return true;
    }

    const timePassed = now - prev.lastAlertTime;
    const distanceDelta = prev.lastDistance - obstacle.distance_meters;

    if (distanceDelta > 0.5 || timePassed > this.COOLDOWN_MS) {
      prev.lastDistance = obstacle.distance_meters;
      prev.lastAlertTime = now;
      return true;
    }

    return false;
  }
}

export const exitObstaclePipeline = new ExitObstaclePipeline();
