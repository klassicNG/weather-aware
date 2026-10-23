import React, { useState } from 'react';
import {
  Wind,
  CloudRain,
  Snowflake,
  Clock,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { RISK_LEVELS, evaluateLoadRule } from '../utils/constants';

export default function CorridorMileChart({
  route,
  forecastHour = 0,
  loadWeight = 45000,
  onHoverCheckpoint,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!route || !route.checkpoints || route.checkpoints.length === 0) {
    return null;
  }

  const checkpoints = route.checkpoints;
  const totalMiles =
    route.summary?.total_distance_miles ||
    checkpoints[checkpoints.length - 1]?.distance_from_origin_miles ||
    1;

  // Process checkpoint conditions at current forecastHour
  const points = checkpoints.map((cp, idx) => {
    const dataAtHour =
      cp.forecast_48h && cp.forecast_48h[forecastHour]
        ? cp.forecast_48h[forecastHour]
        : [
            cp.weather?.wind_mph ?? 0,
            cp.weather?.rain_in_hr ?? 0,
            cp.weather?.snow_in_hr ?? 0,
            cp.risk?.risk_score ?? 1,
          ];

    const [windMph, rainInHr, snowInHr, baseScore] = dataAtHour;
    const loadRule = evaluateLoadRule(windMph, loadWeight);
    const effectiveScore = loadRule.triggered
      ? Math.max(baseScore, loadRule.score)
      : baseScore;

    const baseEta = cp.eta_iso ? new Date(cp.eta_iso) : null;
    const exactEta = baseEta
      ? new Date(baseEta.getTime() + forecastHour * 3600000)
      : null;

    return {
      index: idx,
      distance: cp.distance_from_origin_miles || 0,
      segmentMiles: cp.segment_miles || totalMiles / checkpoints.length,
      name: cp.name || `Mile ${Math.round(cp.distance_from_origin_miles || 0)}`,
      windMph: Number(windMph),
      rainInHr: Number(rainInHr),
      snowInHr: Number(snowInHr),
      riskScore: effectiveScore,
      riskInfo: RISK_LEVELS[effectiveScore] || RISK_LEVELS[1],
      loadRule,
      timeStr: exactEta
        ? exactEta.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : '',
      lat: cp.lat,
      lon: cp.lon,
    };
  });

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  // Compute SVG Wind Sparkline
  const maxWind = Math.max(60, ...points.map((p) => p.windMph));
  const svgWidth = 1000;
  const svgHeight = 70;

  const getSvgX = (dist) => (dist / Math.max(1, totalMiles)) * svgWidth;
  const getSvgY = (wind) => svgHeight - (wind / maxWind) * (svgHeight - 14) - 6;

  const sparklinePath = points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${getSvgX(p.distance).toFixed(1)} ${getSvgY(
          p.windMph
        ).toFixed(1)}`
    )
    .join(' ');

  const areaPath = `${sparklinePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  return (
    <div className="bg-slate-950/80 rounded-2xl p-3 border border-white/10 text-xs shadow-xl">
      {/* 1. Header with Title */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>Corridor Mile-by-Mile Crosswind Profile</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          0 mi ➔ {Math.round(totalMiles)} mi
        </div>
      </div>

      {/* 2. Permanent Fixed-Height Live Telemetry Slot (Zero Layout Shift / Zero Flickering) */}
      <div className="min-h-[46px] px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between text-xs mb-2.5 transition-colors">
        {activePoint ? (
          <div className="w-full flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow"
                style={{ backgroundColor: activePoint.riskInfo.color }}
              />
              <span className="font-extrabold text-white text-[11px]">
                {activePoint.name} (M{Math.round(activePoint.distance)})
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${activePoint.riskInfo.bgClass}`}
              >
                {activePoint.riskInfo.name}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
              <span className="text-sky-300 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{activePoint.timeStr}</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Wind className="w-3 h-3" />
                <span>{activePoint.windMph.toFixed(0)} mph</span>
              </span>
              {activePoint.rainInHr > 0 && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-sky-400 flex items-center gap-0.5">
                    <CloudRain className="w-3 h-3" />
                    <span>{activePoint.rainInHr.toFixed(2)}"</span>
                  </span>
                </>
              )}
              {activePoint.snowInHr > 0 && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-purple-400 flex items-center gap-0.5">
                    <Snowflake className="w-3 h-3" />
                    <span>{activePoint.snowInHr.toFixed(2)}"</span>
                  </span>
                </>
              )}
            </div>

            {activePoint.loadRule.triggered && (
              <div className="w-full text-[9px] font-bold text-rose-300 flex items-center gap-1 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                <span>{activePoint.loadRule.text}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400/80 animate-ping" />
              <span>Hover ribbon or wind curve to inspect any mile marker</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              Corridor: {Math.round(totalMiles)} mi
            </span>
          </div>
        )}
      </div>

      {/* 3. Continuous Risk Ribbon Track */}
      <div className="space-y-1 mb-2">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>Highway Risk Distribution:</span>
          <div className="flex items-center gap-1.5 text-[9px]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Mod
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Sev
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" /> Stop
            </span>
          </div>
        </div>

        {/* Continuous Segmented Bar */}
        <div className="w-full h-3 rounded-lg overflow-hidden flex bg-slate-900 border border-white/10 shadow-inner">
          {points.map((p, i) => {
            const widthPct = (p.segmentMiles / totalMiles) * 100;
            return (
              <div
                key={i}
                style={{
                  width: `${Math.max(1, widthPct)}%`,
                  backgroundColor: p.riskInfo.color,
                }}
                className={`h-full transition-all cursor-pointer relative group ${
                  hoveredIdx === i ? 'ring-2 ring-white z-10' : ''
                }`}
                onMouseEnter={() => {
                  setHoveredIdx(i);
                  if (onHoverCheckpoint) onHoverCheckpoint(p);
                }}
                onMouseLeave={() => {
                  setHoveredIdx(null);
                  if (onHoverCheckpoint) onHoverCheckpoint(null);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Wind Speed Profile (SVG Graph) */}
      <div className="relative mb-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <Wind className="w-3 h-3" />
            Crosswind Speed Profile (mph)
          </span>
          <span>Max: {Math.round(maxWind)} mph</span>
        </div>

        <div className="relative h-18 bg-slate-900/90 rounded-xl border border-white/10 p-1 overflow-hidden">
          {/* Threshold lines: 35 mph & 45 mph */}
          <div
            className="absolute left-0 right-0 border-b border-orange-500/30 border-dashed pointer-events-none"
            style={{ top: `${((maxWind - 35) / maxWind) * 100}%` }}
          >
            <span className="absolute right-1 -top-3 text-[8px] text-orange-400/80 font-mono">
              35 mph (Heavy Rig Rule)
            </span>
          </div>
          <div
            className="absolute left-0 right-0 border-b border-red-500/40 border-dashed pointer-events-none"
            style={{ top: `${((maxWind - 45) / maxWind) * 100}%` }}
          >
            <span className="absolute right-1 -top-3 text-[8px] text-red-400/80 font-mono">
              45 mph (Shutdown Rule)
            </span>
          </div>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient area */}
            <path d={areaPath} fill="url(#windGradient)" />

            {/* Main wind curve */}
            <path
              d={sparklinePath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Checkpoint nodes */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={getSvgX(p.distance)}
                cy={getSvgY(p.windMph)}
                r={hoveredIdx === i ? 5.5 : p.riskScore >= 4 ? 4 : 2}
                fill={p.riskInfo.color}
                stroke="#ffffff"
                strokeWidth={hoveredIdx === i ? 2 : 0.8}
                className="cursor-pointer transition-all"
                onMouseEnter={() => {
                  setHoveredIdx(i);
                  if (onHoverCheckpoint) onHoverCheckpoint(p);
                }}
                onMouseLeave={() => {
                  setHoveredIdx(null);
                  if (onHoverCheckpoint) onHoverCheckpoint(null);
                }}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* 5. Mile Marker & ETA Progression Ticks */}
      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-1 border-t border-white/5">
        <div>
          <span className="block font-bold text-slate-300">Origin (Mile 0)</span>
          <span>{points[0]?.timeStr}</span>
        </div>
        <div className="text-center">
          <span className="block font-bold text-slate-300">
            Midpoint (~{Math.round(totalMiles / 2)} mi)
          </span>
          <span>{points[Math.floor(points.length / 2)]?.timeStr}</span>
        </div>
        <div className="text-right">
          <span className="block font-bold text-slate-300">
            Destination ({Math.round(totalMiles)} mi)
          </span>
          <span>{points[points.length - 1]?.timeStr}</span>
        </div>
      </div>
    </div>
  );
}
