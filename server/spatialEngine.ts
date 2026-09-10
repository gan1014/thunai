import type { DetectedObject } from '../src/types.ts';

export interface SpatialConfig {
  directionThresholds: { farLeft: number; left: number; right: number; farRight: number };
  proximityThresholds: { veryNear: number; near: number; medium: number };
  outlierMaxJump: number;
  smoothingAlpha: number;
  trackStaleTimeoutMs: number;
  minMovementFrames: number;
  focalFactor: number;
  referenceObjects: Record<string, number>;
}

const DEFAULT_CONFIG: SpatialConfig = {
  directionThresholds: { farLeft: 0.20, left: 0.40, right: 0.60, farRight: 0.80 },
  proximityThresholds: { veryNear: 1.0, near: 2.0, medium: 4.0 },
  outlierMaxJump: 3.0,
  smoothingAlpha: 0.4,
  trackStaleTimeoutMs: 2000,
  minMovementFrames: 3,
  focalFactor: 0.95,
  referenceObjects: {
    person: 1.7, chair: 0.9, table: 0.75, door: 2.0, vehicle: 1.5, stairs: 1.5,
    sign: 0.5, exit_sign: 0.4, traffic_light: 0.5, bench: 0.9, counter: 1.0,
    medicine_bottle: 0.15, cup: 0.12, phone: 0.15, book: 0.25, bag: 0.5,
    obstacle: 0.8, wall: 2.0, window: 1.2, elevator: 2.2, ramp: 1.5,
    handrail: 1.0, crosswalk: 0.15, auto_rickshaw: 1.5, pothole: 0.3,
    tactile_paving: 0.1, metro_platform_edge: 0.15, cow_animal: 1.2,
    currency_note: 0.15, medicine_strip: 0.1, speed_breaker: 0.1,
  },
};

interface Track {
  id: string;
  label: string;
  firstSeen: number;
  lastSeen: number;
  positions: Array<{ x: number; y: number; distance: number; timestamp: number }>;
  smoothedDistance: number | null;
  smoothedCenter: { x: number; y: number } | null;
  movement: 'APPROACHING' | 'MOVING_AWAY' | 'STATIONARY' | 'UNKNOWN';
  relativeSpeedMps: number | null;
  direction: DetectedObject['spatial']['direction'];
  proximity: DetectedObject['spatial']['proximity'];
}

export class SpatialEngine {
  private tracks: Map<string, Track> = new Map();
  private config: SpatialConfig;
  private trackCounter = 0;

  constructor(config?: Partial<SpatialConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  updateConfig(config: Partial<SpatialConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SpatialConfig {
    return { ...this.config };
  }

  process(detections: DetectedObject[]): DetectedObject[] {
    const now = Date.now();
    this.pruneStaleTracks(now);

    const usedTrackIds = new Set<string>();
    const enriched: DetectedObject[] = [];

    for (const det of detections) {
      const center = this.getBboxCenter(det.bbox);
      const direction = this.classifyDirection(center.x);
      const directionLabel = this.getDirectionLabel(direction);
      const horizontalOffset = (center.x - 0.5) * 2;
      const verticalPosition = this.classifyVertical(center.y);
      const proximity = this.classifyProximity(det.distance_meters);
      const distanceConfidence = this.estimateDistanceConfidence(det);

      const trackId = this.findOrCreateTrack(det, center, now, usedTrackIds);
      const track = this.tracks.get(trackId)!;
      usedTrackIds.add(trackId);

      const smoothedDistance = this.smoothDistance(track, det.distance_meters, now);
      const smoothedCenter = this.smoothCenter(track, center, now);

      track.positions.push({ x: center.x, y: center.y, distance: smoothedDistance, timestamp: now });
      if (track.positions.length > 20) track.positions.shift();
      track.lastSeen = now;
      track.smoothedDistance = smoothedDistance;
      track.smoothedCenter = smoothedCenter;
      track.direction = directionLabel;
      track.proximity = proximity;

      const movement = this.classifyMovement(track);
      const relativeSpeed = this.calculateRelativeSpeed(track);

      track.movement = movement;
      track.relativeSpeedMps = relativeSpeed;

      const trackAge = Math.round((now - track.firstSeen) / 100) + 1;

      enriched.push({
        ...det,
        distance_meters: smoothedDistance,
        spatial: {
          id: trackId,
          direction: directionLabel,
          horizontalOffset,
          verticalPosition,
          distanceConfidence,
          proximity,
          movement,
          relativeSpeedMps: relativeSpeed,
          trajectoryConfidence: track.positions.length >= this.config.minMovementFrames ? 0.7 : 0.3,
          center: smoothedCenter,
          trackAge,
          trackActive: true,
        },
      });
    }

    return enriched;
  }

  private getBboxCenter(bbox: [number, number, number, number]): { x: number; y: number } {
    return {
      x: (bbox[0] + bbox[2]) / 2,
      y: (bbox[1] + bbox[3]) / 2,
    };
  }

  private classifyDirection(normX: number): 'FAR_LEFT' | 'LEFT' | 'CENTER' | 'RIGHT' | 'FAR_RIGHT' {
    const t = this.config.directionThresholds;
    if (normX < t.farLeft) return 'FAR_LEFT';
    if (normX < t.left) return 'LEFT';
    if (normX > t.farRight) return 'FAR_RIGHT';
    if (normX > t.right) return 'RIGHT';
    return 'CENTER';
  }

  private getDirectionLabel(direction: 'FAR_LEFT' | 'LEFT' | 'CENTER' | 'RIGHT' | 'FAR_RIGHT'): DetectedObject['spatial']['direction'] {
    return direction;
  }

  private classifyVertical(normY: number): 'ABOVE' | 'CENTER' | 'BELOW' {
    if (normY < 0.3) return 'ABOVE';
    if (normY > 0.7) return 'BELOW';
    return 'CENTER';
  }

  private classifyProximity(distance: number): DetectedObject['spatial']['proximity'] {
    const t = this.config.proximityThresholds;
    if (distance <= t.veryNear) return 'VERY_NEAR';
    if (distance <= t.near) return 'NEAR';
    if (distance <= t.medium) return 'MEDIUM';
    return 'FAR';
  }

  private estimateDistanceConfidence(det: DetectedObject): number {
    let conf = det.confidence;
    const refHeight = this.config.referenceObjects[det.label];
    if (refHeight) {
      const bboxHeight = det.bbox[3] - det.bbox[1];
      const apparentSize = refHeight / Math.max(0.01, det.distance_meters);
      if (apparentSize > 0.1 && apparentSize < 5) {
        conf = Math.min(1, conf * 1.1);
      }
    }
    if (det.distance_meters > 6) conf *= 0.6;
    else if (det.distance_meters > 4) conf *= 0.8;
    return Math.min(1, Math.max(0.1, conf));
  }

  private findOrCreateTrack(
    det: DetectedObject,
    center: { x: number; y: number },
    now: number,
    usedTrackIds: Set<string>
  ): string {
    let bestTrack: Track | null = null;
    let bestScore = -Infinity;

    for (const [id, track] of this.tracks) {
      if (usedTrackIds.has(id)) continue;
      if (track.label !== det.label) continue;

      const lastPos = track.positions[track.positions.length - 1];
      if (!lastPos) continue;

      const centerDist = Math.sqrt(
        Math.pow(center.x - lastPos.x, 2) + Math.pow(center.y - lastPos.y, 2)
      );
      const distDiff = Math.abs(det.distance_meters - lastPos.distance);
      const timeSinceLastSeen = now - track.lastSeen;

      const score = -centerDist * 5 - distDiff * 2 - timeSinceLastSeen * 0.001;

      if (score > bestScore && score > -3) {
        bestScore = score;
        bestTrack = track;
      }
    }

    if (bestTrack) {
      return bestTrack.id;
    }

    this.trackCounter++;
    const trackId = `${det.label}_${String(this.trackCounter).padStart(3, '0')}`;
    this.tracks.set(trackId, {
      id: trackId,
      label: det.label,
      firstSeen: now,
      lastSeen: now,
      positions: [{ x: center.x, y: center.y, distance: det.distance_meters, timestamp: now }],
      smoothedDistance: det.distance_meters,
      smoothedCenter: center,
      movement: 'UNKNOWN',
      relativeSpeedMps: null,
      direction: this.classifyDirection(center.x),
      proximity: this.classifyProximity(det.distance_meters),
    });
    return trackId;
  }

  private smoothDistance(track: Track, rawDistance: number, now: number): number {
    if (track.smoothedDistance === null) return rawDistance;

    const jump = Math.abs(rawDistance - track.smoothedDistance);
    if (jump > this.config.outlierMaxJump) {
      return track.smoothedDistance;
    }

    const alpha = this.config.smoothingAlpha;
    return Number((track.smoothedDistance * (1 - alpha) + rawDistance * alpha).toFixed(2));
  }

  private smoothCenter(
    track: Track,
    rawCenter: { x: number; y: number },
    _now: number
  ): { x: number; y: number } {
    if (track.smoothedCenter === null) return rawCenter;

    const alpha = 0.3;
    return {
      x: Number((track.smoothedCenter.x * (1 - alpha) + rawCenter.x * alpha).toFixed(4)),
      y: Number((track.smoothedCenter.y * (1 - alpha) + rawCenter.y * alpha).toFixed(4)),
    };
  }

  private classifyMovement(track: Track): DetectedObject['spatial']['movement'] {
    const positions = track.positions;
    if (positions.length < this.config.minMovementFrames) return 'UNKNOWN';

    const recent = positions.slice(-6);
    if (recent.length < 3) return 'UNKNOWN';

    let totalChange = 0;
    let changeCount = 0;
    for (let i = 1; i < recent.length; i++) {
      totalChange += recent[i].distance - recent[i - 1].distance;
      changeCount++;
    }

    const avgChange = totalChange / changeCount;

    if (avgChange < -0.15) return 'APPROACHING';
    if (avgChange > 0.15) return 'MOVING_AWAY';

    const variance = recent.reduce((sum, p) => {
      const mean = recent.reduce((s, pp) => s + pp.distance, 0) / recent.length;
      return sum + Math.pow(p.distance - mean, 2);
    }, 0) / recent.length;

    if (variance < 0.3) return 'STATIONARY';
    return 'UNKNOWN';
  }

  private calculateRelativeSpeed(track: Track): number | null {
    const positions = track.positions;
    if (positions.length < 3) return null;

    const recent = positions.slice(-5);
    if (recent.length < 2) return null;

    const dt = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;
    if (dt < 0.1) return null;

    const dd = recent[recent.length - 1].distance - recent[0].distance;
    const speed = dd / dt;

    if (Math.abs(speed) > 20) return null;

    return Number(speed.toFixed(2));
  }

  private pruneStaleTracks(now: number): void {
    for (const [id, track] of this.tracks) {
      if (now - track.lastSeen > this.config.trackStaleTimeoutMs) {
        this.tracks.delete(id);
      }
    }
  }

  prioritize(detections: DetectedObject[]): DetectedObject[] {
    return [...detections].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.spatial) {
        if (a.spatial.proximity === 'VERY_NEAR') scoreA += 50;
        else if (a.spatial.proximity === 'NEAR') scoreA += 30;
        else if (a.spatial.proximity === 'MEDIUM') scoreA += 10;

        if (a.spatial.movement === 'APPROACHING') scoreA += 40;
        else if (a.spatial.movement === 'MOVING_AWAY') scoreA += 5;

        if (a.spatial.direction === 'CENTER') scoreA += 15;
        else if (a.spatial.direction === 'LEFT' || a.spatial.direction === 'RIGHT') scoreA += 8;

        scoreA += a.spatial.trackAge * 2;
      }

      scoreA += a.confidence * 20;

      if (b.spatial) {
        if (b.spatial.proximity === 'VERY_NEAR') scoreB += 50;
        else if (b.spatial.proximity === 'NEAR') scoreB += 30;
        else if (b.spatial.proximity === 'MEDIUM') scoreB += 10;

        if (b.spatial.movement === 'APPROACHING') scoreB += 40;
        else if (b.spatial.movement === 'MOVING_AWAY') scoreB += 5;

        if (b.spatial.direction === 'CENTER') scoreB += 15;
        else if (b.spatial.direction === 'LEFT' || b.spatial.direction === 'RIGHT') scoreB += 8;

        scoreB += b.spatial.trackAge * 2;
      }

      scoreB += b.confidence * 20;

      return scoreB - scoreA;
    });
  }

  getDirectionPhrase(direction: string): string {
    switch (direction) {
      case 'FAR_LEFT': return 'far to your left';
      case 'LEFT': return 'to your left';
      case 'CENTER': return 'directly ahead';
      case 'RIGHT': return 'to your right';
      case 'FAR_RIGHT': return 'far to your right';
      default: return 'in view';
    }
  }

  getMovementPhrase(movement: string): string {
    switch (movement) {
      case 'APPROACHING': return 'approaching you';
      case 'MOVING_AWAY': return 'moving away';
      case 'STATIONARY': return 'stationary';
      default: return 'movement uncertain';
    }
  }

  getProximityLabel(proximity: string): string {
    switch (proximity) {
      case 'VERY_NEAR': return 'very close';
      case 'NEAR': return 'nearby';
      case 'MEDIUM': return 'at moderate distance';
      case 'FAR': return 'in the distance';
      default: return 'distance unknown';
    }
  }

  generateSpatialDescription(obj: DetectedObject): string {
    if (!obj.spatial) {
      return `${obj.label.replace('_', ' ')} detected ${obj.distance_meters.toFixed(1)} meters away.`;
    }

    const label = obj.label.replace('_', ' ');
    const dist = obj.distance_meters < 1
      ? `about ${obj.distance_meters.toFixed(1)} meters`
      : `approximately ${Math.round(obj.distance_meters)} meters`;
    const dir = this.getDirectionPhrase(obj.spatial.direction);
    const mov = obj.spatial.movement !== 'UNKNOWN' ? `, ${this.getMovementPhrase(obj.spatial.movement)}` : '';

    return `${label} ${dist} ${dir}${mov}.`;
  }

  getTrackCount(): number {
    return this.tracks.size;
  }

  getTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  reset(): void {
    this.tracks.clear();
    this.trackCounter = 0;
  }
}

export const spatialEngine = new SpatialEngine();
