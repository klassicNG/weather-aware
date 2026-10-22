import React from 'react';
import {
  CheckCircle2,
  Clock,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { RISK_LEVELS } from '../utils/constants';

export default function RouteSummaryCards({
  routes = [],
  activeRouteId = null,
  setActiveRouteId,
}) {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-200 tracking-tight flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-400" />
          Route Options & Safety Ranking (3 Corridors)
        </h3>
        <span className="text-xs text-gray-500">
          Ranked by Weather Risk & Duration
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routes.map((route) => {
          const isSelected = route.id === activeRouteId;
          const isRec = route.is_recommended;
          const sum = route.summary || {};
          const totalDist = sum.total_distance_miles || 1;

          // Percentages for mileage bar
          const pNoTravel = ((sum.no_travel_miles || 0) / totalDist) * 100;
          const pSevere = ((sum.severe_miles || 0) / totalDist) * 100;
          const pHigh = ((sum.high_miles || 0) / totalDist) * 100;
          const pModerate = ((sum.moderate_miles || 0) / totalDist) * 100;
          const pLow = ((sum.low_miles || 0) / totalDist) * 100;

          return (
            <div
              key={route.id}
              onClick={() => setActiveRouteId && setActiveRouteId(route.id)}
              className={`relative rounded-2xl p-4 transition-all cursor-pointer border text-left flex flex-col justify-between ${
                isRec
                  ? 'bg-gradient-to-b from-blue-950/40 via-gray-900/90 to-gray-900 border-blue-500/80 shadow-xl shadow-blue-900/20 ring-1 ring-blue-500/50'
                  : isSelected
                  ? 'bg-gray-900/90 border-gray-600 shadow-lg'
                  : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900/80'
              }`}
            >
              {/* Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                    {route.id.replace('_', ' ').toUpperCase()}
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    {route.name}
                  </h4>
                </div>

                {isRec ? (
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/60 text-blue-300 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    RECOMMENDED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-[10px] font-mono shrink-0">
                    Alternative
                  </span>
                )}
              </div>

              {/* Core Metrics */}
              <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-gray-800/80 my-2 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Distance</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {sum.total_distance_miles} <span className="text-xs font-normal text-gray-400">mi</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Travel Time</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {sum.total_duration_hours} <span className="text-xs font-normal text-gray-400">hrs</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Avg Risk</div>
                  <div
                    className={`text-sm font-bold font-mono ${
                      sum.average_risk_score <= 1.5
                        ? 'text-emerald-400'
                        : sum.average_risk_score <= 2.5
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {sum.average_risk_score} <span className="text-xs font-normal text-gray-400">/ 5.0</span>
                  </div>
                </div>
              </div>

              {/* Mileage Breakdown Stacked Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1 font-mono">
                  <span>Risk Mileage Distribution</span>
                  <span>{sum.total_distance_miles} mi total</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden flex shadow-inner">
                  {pLow > 0 && (
                    <div
                      style={{ width: `${pLow}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Low Risk: ${sum.low_miles} mi (${pLow.toFixed(0)}%)`}
                    />
                  )}
                  {pModerate > 0 && (
                    <div
                      style={{ width: `${pModerate}%` }}
                      className="bg-amber-500 h-full"
                      title={`Moderate Risk: ${sum.moderate_miles} mi (${pModerate.toFixed(0)}%)`}
                    />
                  )}
                  {pHigh > 0 && (
                    <div
                      style={{ width: `${pHigh}%` }}
                      className="bg-orange-500 h-full"
                      title={`High Risk: ${sum.high_miles} mi (${pHigh.toFixed(0)}%)`}
                    />
                  )}
                  {pSevere > 0 && (
                    <div
                      style={{ width: `${pSevere}%` }}
                      className="bg-red-500 h-full"
                      title={`Severe Risk: ${sum.severe_miles} mi (${pSevere.toFixed(0)}%)`}
                    />
                  )}
                  {pNoTravel > 0 && (
                    <div
                      style={{ width: `${pNoTravel}%` }}
                      className="bg-rose-600 h-full animate-pulse"
                      title={`No Travel Risk: ${sum.no_travel_miles} mi (${pNoTravel.toFixed(0)}%)`}
                    />
                  )}
                </div>

                {/* Sub-stat badges */}
                <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
                  {sum.no_travel_miles > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-500/40 font-bold">
                      ⚠ {sum.no_travel_miles} mi No Travel
                    </span>
                  )}
                  {sum.severe_miles > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-500/30">
                      {sum.severe_miles} mi Severe
                    </span>
                  )}
                  {sum.high_miles > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-300 border border-orange-500/30">
                      {sum.high_miles} mi High
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-500/20">
                    {sum.low_miles} mi Clear
                  </span>
                </div>
              </div>

              {/* Recommendation Reason */}
              <div
                className={`text-xs p-2.5 rounded-xl border mt-auto ${
                  isRec
                    ? 'bg-blue-950/40 border-blue-500/30 text-blue-200'
                    : 'bg-gray-950/60 border-gray-800 text-gray-400'
                }`}
              >
                <div className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                  <p className="line-clamp-2 leading-relaxed">
                    {route.recommendation_reason}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
