import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Volume2, ShieldAlert, Navigation, AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { DetectedObject, LanguageCode } from '../types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface SpatialRadarProps {
  objects: DetectedObject[];
  sonarActive?: boolean;
  onToggleSonar?: () => void;
  className?: string;
}

const DIRECTION_ANGLES: Record<string, number> = {
  FAR_LEFT: -35,
  LEFT: -20,
  CENTER: 0,
  RIGHT: 20,
  FAR_RIGHT: 35,
};

const PROXIMITY_COLORS: Record<string, string> = {
  VERY_NEAR: '#EF4444',
  NEAR: '#F59E0B',
  MEDIUM: '#3B82F6',
  FAR: '#6B7280',
  UNKNOWN: '#6B7280',
};

export const SpatialRadar: React.FC<SpatialRadarProps> = ({
  objects = [],
  sonarActive = false,
  onToggleSonar,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const { speak } = useSpeechSynthesis();
  const [hoveredObject, setHoveredObject] = useState<DetectedObject | null>(null);

  const currentLang = (i18n.language as LanguageCode) || 'en';

  const width = 340;
  const height = 220;
  const centerX = width / 2;
  const originY = height - 25;
  const maxRange = 6.0;
  const scale = (originY - 30) / maxRange;

  const getCoordinates = (d: number, obj?: DetectedObject) => {
    const dist = Math.min(maxRange, Math.max(0.6, d));
    let angleDeg = 0;

    if (obj?.spatial?.direction && DIRECTION_ANGLES[obj.spatial.direction] !== undefined) {
      angleDeg = DIRECTION_ANGLES[obj.spatial.direction];
    } else if (obj?.bbox && Array.isArray(obj.bbox) && obj.bbox.length >= 3) {
      const normX = (obj.bbox[0] + obj.bbox[2]) / 2;
      angleDeg = (normX - 0.5) * 90;
    }

    const angleRad = (angleDeg * Math.PI) / 180;
    const r = dist * scale;
    const screenAngle = -Math.PI / 2 + angleRad;
    const x = centerX + r * Math.cos(screenAngle);
    const y = originY + r * Math.sin(screenAngle);

    return { x, y, angleDeg: Math.round(angleDeg) };
  };

  const handleObjectClick = (obj: DetectedObject) => {
    const { angleDeg } = getCoordinates(obj.distance_meters, obj);

    let text = '';
    const distStr = obj.distance_meters.toFixed(1);
    const label = obj.label.replace('_', ' ');

    if (currentLang === 'ta') {
      const dir = angleDeg < -15 ? 'உங்கள் இடதுபுறத்தில்' : angleDeg > 15 ? 'உங்கள் வலதுபுறத்தில்' : 'நேராக முன்னால்';
      text = `${distStr} மீட்டர் ${dir} ${label} கண்டறியப்பட்டுள்ளது.`;
    } else if (currentLang === 'te') {
      const dir = angleDeg < -15 ? 'మీ ఎడమ వైపున' : angleDeg > 15 ? 'మీ కుడి వైపున' : 'నేరుగా ముందు';
      text = `${distStr} మీటర్ల ${dir} ${label} గుర్తించబడింది.`;
    } else if (currentLang === 'hi') {
      const dir = angleDeg < -15 ? 'आपकी बाईं ओर' : angleDeg > 15 ? 'आपकी दाईं ओर' : 'सीधे आगे';
      text = `${distStr} मीटर ${dir} ${label} का पता चला।`;
    } else {
      const dir = angleDeg < -15 ? `${Math.abs(angleDeg)} degrees to your left` : angleDeg > 15 ? `${Math.abs(angleDeg)} degrees to your right` : 'directly ahead';
      text = `${label} detected ${distStr} meters ${dir}.`;
    }

    speak(text, currentLang);
  };

  const obstacleAhead = objects.some((o) => {
    const coords = getCoordinates(o.distance_meters, o);
    return o.distance_meters < 2.0 && Math.abs(coords.angleDeg) < 18;
  });

  const approachingObjects = objects.filter((o) => o.spatial?.movement === 'APPROACHING');
  const veryNearObjects = objects.filter((o) => o.spatial?.proximity === 'VERY_NEAR');

  return (
    <div
      id="spatial-radar-compass"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col items-center select-none ${className}`}
    >
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {t('vision.title')} • 360° {t('header.acousticSonar')}
          </h3>
        </div>

        {onToggleSonar && (
          <button
            type="button"
            onClick={onToggleSonar}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sonarActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Acoustic Sonar Proximity Pings"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{sonarActive ? t('header.sonarOn') : t('header.sonarOff')}</span>
          </button>
        )}
      </div>

      <div className="relative w-full flex justify-center overflow-hidden py-1">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <radialGradient id="radarSweep" cx="50%" cy="100%" r="90%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path
            d={`M ${centerX} ${originY} L 20 40 A 180 180 0 0 1 320 40 Z`}
            fill="url(#radarSweep)"
          />

          {[1, 2, 4, 6].map((dist) => {
            const r = dist * scale;
            return (
              <g key={dist}>
                <path
                  d={`M ${centerX - r * 0.707} ${originY - r * 0.707} A ${r} ${r} 0 0 1 ${centerX + r * 0.707} ${originY - r * 0.707}`}
                  fill="none"
                  stroke={dist <= 1.5 ? '#EF4444' : dist <= 2.5 ? '#F59E0B' : '#334155'}
                  strokeWidth={dist <= 1.5 ? '1.5' : '1'}
                  strokeDasharray={dist > 2 ? '4 4' : undefined}
                  opacity={dist <= 1.5 ? 0.7 : 0.4}
                />
                <text
                  x={centerX + 6}
                  y={originY - r + 11}
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {dist}m
                </text>
              </g>
            );
          })}

          {[-45, -25, 0, 25, 45].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const r = maxRange * scale;
            const x = centerX + r * Math.cos(rad);
            const y = originY + r * Math.sin(rad);
            return (
              <line
                key={deg}
                x1={centerX}
                y1={originY}
                x2={x}
                y2={y}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.5"
              />
            );
          })}

          <polygon
            points={`${centerX - 16},${originY} ${centerX + 16},${originY} ${centerX + 35},20 ${centerX - 35},20`}
            fill={obstacleAhead ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.12)'}
            stroke={obstacleAhead ? '#EF4444' : '#10B981'}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.6"
          />

          <g transform={`translate(${centerX}, ${originY})`}>
            <circle r="10" fill="#2563EB" stroke="#60A5FA" strokeWidth="2" />
            <polygon points="0,-6 -4,3 4,3" fill="#FFFFFF" />
            <text y="18" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="bold">
              YOU
            </text>
          </g>

          {objects.map((obj, i) => {
            const { x, y } = getCoordinates(obj.distance_meters, obj);
            const isDanger = obj.spatial?.proximity === 'VERY_NEAR' || obj.distance_meters < 1.5;
            const isWarning = obj.spatial?.proximity === 'NEAR' || obj.distance_meters < 2.8;
            const isApproaching = obj.spatial?.movement === 'APPROACHING';
            const fillColor = isDanger ? PROXIMITY_COLORS.VERY_NEAR : isWarning ? PROXIMITY_COLORS.NEAR : PROXIMITY_COLORS.MEDIUM;

            return (
              <g
                key={obj.spatial?.id || i}
                className="cursor-pointer transition-transform duration-200 hover:scale-125"
                onClick={() => handleObjectClick(obj)}
                onMouseEnter={() => setHoveredObject(obj)}
                onMouseLeave={() => setHoveredObject(null)}
              >
                {isDanger && (
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                    className="animate-ping"
                    opacity="0.75"
                  />
                )}

                {isApproaching && (
                  <circle
                    cx={x}
                    cy={y}
                    r="18"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      values="14;22;14"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  fill={fillColor}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                <text
                  x={x}
                  y={y - 11}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="10"
                  fontWeight="bold"
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))"
                >
                  {obj.label.replace('_', ' ')} ({obj.distance_meters.toFixed(1)}m)
                </text>

                {isApproaching && (
                  <text
                    x={x}
                    y={y + 18}
                    textAnchor="middle"
                    fill="#F59E0B"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    ▼ APPROACHING
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="w-full mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Navigation
            className={`w-3.5 h-3.5 ${
              obstacleAhead ? 'text-red-400 rotate-45' : 'text-emerald-400 -rotate-45'
            }`}
          />
          <span className="font-semibold text-slate-200">
            {obstacleAhead
              ? t('spatial.obstacleWarning')
              : `${t('vision.pathClear')} (2.0m)`}
          </span>
        </div>

        <span className="text-[11px] text-slate-500">
          {objects.length} mapped {objects.length === 1 ? 'entity' : 'entities'}
        </span>
      </div>

      {(approachingObjects.length > 0 || veryNearObjects.length > 0) && (
        <div className="w-full mt-2 p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-xs space-y-1">
          {veryNearObjects.length > 0 && (
            <div className="flex items-center gap-1.5 text-red-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>VERY CLOSE: {veryNearObjects.map((o) => o.label.replace('_', ' ')).join(', ')}</span>
            </div>
          )}
          {approachingObjects.length > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>APPROACHING: {approachingObjects.map((o) => o.label.replace('_', ' ')).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {hoveredObject && (
        <div className="w-full mt-2 p-3 rounded-xl bg-slate-800/90 text-xs text-slate-300 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white capitalize text-sm">
              {hoveredObject.label.replace('_', ' ')}
            </span>
            <span className="text-slate-400">{t('common.readAloud')}</span>
          </div>
          {hoveredObject.spatial && (
            <div className="grid grid-cols-2 gap-1 mt-1">
              <span className="text-slate-400">{t('vision.direction')}:</span>
              <span className="font-semibold text-white">{hoveredObject.spatial.direction.replace('_', ' ')}</span>
              <span className="text-slate-400">{t('vision.distance')}:</span>
              <span className="font-semibold text-white">{hoveredObject.distance_meters.toFixed(1)}m</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
