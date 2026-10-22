import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  Navigation,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { RISK_LEVELS } from '../utils/constants';

export default function DriverDecisionCard({
  routes = [],
  activeRouteId = null,
  setActiveRouteId,
  loadWeight = 45000,
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!routes || routes.length === 0) return null;

  const activeRoute = routes.find((r) => r.id === activeRouteId) || routes[0];
  const recommendedRoute = routes.find((r) => r.is_recommended) || routes[0];
  const isViewingRecommended = activeRoute?.id === recommendedRoute?.id;
  const sum = activeRoute?.summary || {};

  return (
    <div className="absolute top-20 left-4 sm:left-6 z-[450] w-80 sm:w-96 pointer-events-auto">
      <div className="glass-panel rounded-2xl p-4 shadow-2xl transition-all">
        {/* Header Row */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg ${
                isViewingRecommended
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isViewingRecommended ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {isViewingRecommended ? 'Recommended Choice' : 'Alternative Corridor'}
              </span>
              <h3 className="text-sm font-extrabold text-white leading-tight">
                {activeRoute.name}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isMinimized ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>

        {!isMinimized && (
          <>
            {/* Core Driver Stats */}
            <div className="grid grid-cols-3 gap-2 my-3 text-center">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Drive Time</div>
                <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                  {sum.total_duration_hours} <span className="text-[10px] text-slate-400 font-normal">hrs</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Distance</div>
                <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                  {sum.total_distance_miles} <span className="text-[10px] text-slate-400 font-normal">mi</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Trip Risk Score</div>
                <div
                  className={`text-sm font-extrabold font-mono mt-0.5 ${
                    sum.average_risk_score <= 1.5
                      ? 'text-emerald-400'
                      : sum.average_risk_score <= 2.5
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {sum.average_risk_score} <span className="text-[10px] text-slate-500 font-normal">/ 5</span>
                </div>
                <div className="text-[9px] text-slate-400 font-sans">
                  {sum.average_risk_score <= 1.5 ? 'All Clear (ETAs)' : 'Elevated Weather'}
                </div>
              </div>
            </div>

            {/* Plain English Driver Advisory */}
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 mb-3 text-xs leading-relaxed text-slate-300">
              <span className="font-bold text-sky-400 block mb-0.5">
                {isViewingRecommended ? 'Why Take This Route:' : 'Alternative Route Analysis:'}
              </span>
              <p className="text-[11px] text-slate-300">
                {activeRoute.recommendation_reason}
              </p>
            </div>

            {/* Risk Mileage Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-mono">
                <span>Corridor Safety Profile:</span>
                <span>
                  {sum.no_travel_miles > 0
                    ? `⚠ ${sum.no_travel_miles} mi Shutdown`
                    : sum.severe_miles > 0
                    ? `${sum.severe_miles} mi Severe`
                    : '100% Clear'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex shadow-inner">
                {sum.low_miles > 0 && (
                  <div
                    style={{ width: `${(sum.low_miles / sum.total_distance_miles) * 100}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Low Risk: ${sum.low_miles} mi`}
                  />
                )}
                {sum.moderate_miles > 0 && (
                  <div
                    style={{ width: `${(sum.moderate_miles / sum.total_distance_miles) * 100}%` }}
                    className="bg-amber-500 h-full"
                    title={`Moderate Risk: ${sum.moderate_miles} mi`}
                  />
                )}
                {sum.high_miles > 0 && (
                  <div
                    style={{ width: `${(sum.high_miles / sum.total_distance_miles) * 100}%` }}
                    className="bg-orange-500 h-full"
                    title={`High Risk: ${sum.high_miles} mi`}
                  />
                )}
                {sum.severe_miles > 0 && (
                  <div
                    style={{ width: `${(sum.severe_miles / sum.total_distance_miles) * 100}%` }}
                    className="bg-red-500 h-full"
                    title={`Severe Risk: ${sum.severe_miles} mi`}
                  />
                )}
                {sum.no_travel_miles > 0 && (
                  <div
                    style={{ width: `${(sum.no_travel_miles / sum.total_distance_miles) * 100}%` }}
                    className="bg-rose-600 h-full animate-pulse"
                    title={`No Travel Risk: ${sum.no_travel_miles} mi`}
                  />
                )}
              </div>
            </div>

            {/* Route Switcher Tabs */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                Compare 3 Corridors:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {routes.map((r, idx) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRouteId(r.id)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all text-center flex flex-col items-center ${
                      r.id === activeRoute.id
                        ? r.is_recommended
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow'
                          : 'bg-sky-500/20 border border-sky-500/50 text-sky-300 shadow'
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-white/5'
                    }`}
                  >
                    <span className="truncate w-full font-bold">
                      {idx === 0 ? 'Route 1' : idx === 1 ? 'Route 2' : 'Route 3'}
                    </span>
                    <span className="text-[9px] font-normal text-slate-400">
                      {r.is_recommended ? 'Recommended' : `+${(r.summary.total_duration_hours - recommendedRoute.summary.total_duration_hours).toFixed(1)}h`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
