import type { FusedContext, IntentResult, RiskLevel, RiskResult } from '../src/types.ts';

export const HIGH_RISK_OBJECTS: Record<string, number> = {
  vehicle: 0.9,
  stairs: 0.8,
  obstacle: 0.7,
  crosswalk: 0.6,
  medicine_bottle: 0.6,
  ramp: 0.5,
  traffic_light: 0.5,
  elevator: 0.4,
};

export class RiskAssessor {
  assess(fusedContext: FusedContext, intent: IntentResult): RiskResult {
    let maxRiskScore = 0.1;
    const riskFactors: string[] = [];
    let confidenceConcern = false;

    for (const obj of fusedContext.objects) {
      const baseRisk = HIGH_RISK_OBJECTS[obj.label.toLowerCase()] || 0.15;
      let multiplier = 1.0;

      // Proximity scaling
      if (obj.distance_meters < 1.0) {
        multiplier = 2.0;
      } else if (obj.distance_meters < 2.0) {
        multiplier = 1.5;
      } else if (obj.distance_meters > 4.0) {
        multiplier = 0.7;
      }

      // Movement-based risk escalation
      if (obj.spatial?.movement === 'APPROACHING') {
        multiplier *= 1.4;
      } else if (obj.spatial?.movement === 'MOVING_AWAY') {
        multiplier *= 0.6;
      }

      // Proximity category risk
      if (obj.spatial?.proximity === 'VERY_NEAR') {
        multiplier *= 1.3;
      } else if (obj.spatial?.proximity === 'NEAR') {
        multiplier *= 1.1;
      }

      const score = Math.min(1.0, baseRisk * multiplier * Math.max(0.6, obj.confidence));

      if (score > maxRiskScore) {
        maxRiskScore = score;
      }

      if (baseRisk >= 0.5) {
        const dir = obj.spatial?.direction ? ` on ${obj.spatial.direction.toLowerCase().replace('_', ' ')}` : '';
        const mov = obj.spatial?.movement && obj.spatial.movement !== 'UNKNOWN' ? `, ${obj.spatial.movement.toLowerCase()}` : '';
        riskFactors.push(
          `${obj.label.replace('_', ' ').toUpperCase()} detected at ${obj.distance_meters.toFixed(1)}m${dir}${mov} (${(obj.confidence * 100).toFixed(0)}% confidence)`
        );
      }

      if (obj.confidence < 0.55 && baseRisk >= 0.6) {
        confidenceConcern = true;
        riskFactors.push(`Low sensor certainty for high-risk ${obj.label}`);
      }
    }

    // Contextual risk modifiers
    if (intent.primary_intent === 'navigation' && maxRiskScore > 0.4) {
      maxRiskScore = Math.min(1.0, maxRiskScore + 0.15);
      riskFactors.push('Active navigation path intersects hazard area');
    }

    if (fusedContext.environment_type === 'transit' && maxRiskScore < 0.5) {
      maxRiskScore = Math.max(maxRiskScore, 0.45);
      riskFactors.push('Transit terminal high-traffic mobility zone');
    }

    // Determine risk level category
    let riskLevel: RiskLevel = 'low';
    let recommendedCaution = 'Standard situational awareness recommended.';

    if (maxRiskScore >= 0.8) {
      riskLevel = 'critical';
      recommendedCaution = 'CRITICAL HAZARD: Immediate stop or intervention advised.';
    } else if (maxRiskScore >= 0.6) {
      riskLevel = 'high';
      recommendedCaution = 'HIGH RISK: Proceed with high tactile/visual verification.';
    } else if (maxRiskScore >= 0.3) {
      riskLevel = 'medium';
      recommendedCaution = 'MODERATE RISK: Noticeable obstacles or transitions in proximity.';
    }

    return {
      risk_level: riskLevel,
      risk_score: Number(maxRiskScore.toFixed(2)),
      risk_factors: riskFactors.length > 0 ? riskFactors : ['Clear pathway, no critical hazards identified'],
      confidence_concern: confidenceConcern,
      recommended_caution: recommendedCaution,
    };
  }
}

export const riskAssessor = new RiskAssessor();
