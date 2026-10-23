import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Calendar,
  Scale,
  Milestone,
  Zap,
  RotateCcw,
  CloudLightning,
  ChevronDown,
  ChevronUp,
  Info,
  Compass,
  ArrowLeftRight,
} from 'lucide-react';
import { CORRIDOR_PRESETS } from '../utils/constants';

export default function GlassTopNav({
  origin,
  setOrigin,
  destination,
  setDestination,
  loadWeight,
  setLoadWeight,
  departureTime,
  setDepartureTime,
  checkpointInterval,
  setCheckpointInterval,
  stormStressTest,
  setStormStressTest,
  onSubmit,
  isLoading,
  onOpenRules,
  onOpenTour,
}) {
  const [showPresets, setShowPresets] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSelectPreset = (p) => {
    setOrigin(p.origin);
    setDestination(p.destination);
    setShowPresets(false);
  };

  const handleSwapCorridor = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSetNow = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setDepartureTime(now.toISOString().slice(0, 16));
  };

  const weightNum = Number(loadWeight) || 0;
  const is30kRuleActive = weightNum >= 30000;
  const is40kRuleActive = weightNum > 40000;

  return (
    <header className="absolute top-3 left-1/2 -translate-x-1/2 w-[96%] max-w-7xl z-[500] pointer-events-auto">
      <div className="glass-panel rounded-2xl p-2.5 sm:p-3 shadow-2xl transition-all">
        {/* Top Control Bar: Logo, Summary/Inputs, & Primary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* 1. Brand Logo */}
          <div className="flex items-center gap-2 pr-2.5 border-r border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white block leading-none">
                  SPOTTER
                </span>
                <span className="text-[10px] uppercase font-bold px-1 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Fleet AI
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Weather-Aware Routing
              </span>
            </div>
          </div>

          {/* 2. Primary Origin ➔ Destination Inputs (Directly Visible) */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs">
            {/* Origin Input */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/90 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <input
                type="text"
                id="dispatch-origin-input"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Origin"
                className="w-24 sm:w-28 md:w-32 bg-transparent text-white font-semibold focus:outline-none placeholder:text-slate-500 text-xs"
              />
            </div>

            {/* Swap Origin ⇄ Destination */}
            <button
              type="button"
              onClick={handleSwapCorridor}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Swap Origin and Destination"
            >
              <ArrowLeftRight className="w-3 h-3" />
            </button>

            {/* Destination Input */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/90 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <input
                type="text"
                id="dispatch-destination-input"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination"
                className="w-24 sm:w-28 md:w-32 bg-transparent text-white font-semibold focus:outline-none placeholder:text-slate-500 text-xs"
              />
            </div>

            {/* Global Corridors Preset Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Select Popular Freight Corridor"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showPresets && (
                <div className="absolute top-full left-0 mt-2 w-64 glass-panel rounded-2xl p-2 shadow-2xl z-[600] text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2.5 py-1">
                    Major Freight Corridors:
                  </div>
                  {CORRIDOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleSelectPreset(p)}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-sky-500/20 hover:text-sky-300 text-slate-200 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{p.flag}</span>
                        <div>
                          <span className="font-bold block text-xs">{p.name}</span>
                          <span className="text-[10px] text-slate-400 block">{p.tag}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Action Buttons & Expand Toggle */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Storm Test Toggle Button */}
            <button
              type="button"
              id="storm-test-btn"
              onClick={() => setStormStressTest(!stormStressTest)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                stormStressTest
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/20 animate-pulse'
                  : 'glass-button text-slate-400 hover:text-white'
              }`}
              title="Simulate 48 mph crosswind front to verify 30k/40k lb load rules"
            >
              <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Storm Test</span>
            </button>

            {/* Guided Tour Trigger Button */}
            <button
              type="button"
              onClick={onOpenTour}
              className="px-2.5 py-1.5 rounded-xl glass-button text-xs font-semibold text-sky-400 hover:text-white flex items-center gap-1.5 transition-all"
              title="Open Guided Tour"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tour</span>
            </button>

            {/* Official PDF Risk Rules Modal Trigger */}
            <button
              type="button"
              onClick={onOpenRules}
              className="p-2 rounded-xl glass-button text-slate-400 hover:text-white transition-all"
              title="View Official PDF Risk Rules"
            >
              <Info className="w-3.5 h-3.5 text-sky-400" />
            </button>

            {/* Primary CTA: Find Safest Route */}
            <button
              type="button"
              id="find-safest-route-btn"
              onClick={() => onSubmit()}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Routing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Dispatch & Analyze</span>
                </>
              )}
            </button>

            {/* Expand / Collapse Dispatch Settings Drawer */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isExpanded ? 'Collapse Dispatch Controls' : 'Expand Dispatch Controls'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-sky-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-sky-400" />
              )}
            </button>
          </div>
        </div>

        {/* 4. Expanded Dispatch Controls Row (Departure, Load Weight, Interval) */}
        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
            {/* A. Departure Date & Time (1st-Class visible input) */}
            <div className="bg-slate-950/70 p-2 rounded-xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>Departure Date & Time:</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetNow}
                  className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Now
                </button>
              </div>
              <input
                type="datetime-local"
                id="departure-time-picker"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-sky-500 [color-scheme:dark]"
              />
            </div>

            {/* B. Rig Load Weight (1st-Class visible input with presets & rule badges) */}
            <div className="bg-slate-950/70 p-2 rounded-xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  <span>Truck Load Weight:</span>
                </label>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    is40kRuleActive
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : is30kRuleActive
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-white/10'
                  }`}
                >
                  {is40kRuleActive
                    ? '>40k (Severe at 35mph)'
                    : is30kRuleActive
                    ? '≥30k (Shutdown at 45mph)'
                    : 'Standard (<30k)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Numeric Weight Input */}
                <div className="flex-1 flex items-center bg-slate-900/90 border border-white/10 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    id="rig-load-weight-input"
                    min="0"
                    max="100000"
                    step="500"
                    value={loadWeight}
                    onChange={(e) => setLoadWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Weight"
                    className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-mono ml-1">lbs</span>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLoadWeight(20000)}
                    className={`px-2 py-1 rounded-lg font-medium text-[10px] transition-all ${
                      weightNum === 20000
                        ? 'bg-slate-700 text-white font-bold border border-slate-500'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    20k
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoadWeight(30000)}
                    className={`px-2 py-1 rounded-lg font-medium text-[10px] transition-all ${
                      weightNum === 30000
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    30k
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoadWeight(45000)}
                    className={`px-2 py-1 rounded-lg font-medium text-[10px] transition-all ${
                      weightNum === 45000
                        ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/50'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    45k
                  </button>
                </div>
              </div>
            </div>

            {/* C. Checkpoint Sampling Interval (10 / 25 / 50 miles) */}
            <div className="bg-slate-950/70 p-2 rounded-xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Milestone className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sampling Interval:</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Every {checkpointInterval} miles
                </span>
              </div>

              {/* 3-way Segmented Toggle */}
              <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-white/10 text-center font-mono text-xs">
                <button
                  type="button"
                  id="interval-10-btn"
                  onClick={() => setCheckpointInterval(10)}
                  className={`py-1 rounded-md font-bold transition-all ${
                    Number(checkpointInterval) === 10
                      ? 'bg-sky-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Dense checkpoints (maximum accuracy through mountain passes)"
                >
                  10 mi
                </button>
                <button
                  type="button"
                  id="interval-25-btn"
                  onClick={() => setCheckpointInterval(25)}
                  className={`py-1 rounded-md font-bold transition-all ${
                    Number(checkpointInterval) === 25
                      ? 'bg-sky-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Balanced corridor sampling"
                >
                  25 mi
                </button>
                <button
                  type="button"
                  id="interval-50-btn"
                  onClick={() => setCheckpointInterval(50)}
                  className={`py-1 rounded-md font-bold transition-all ${
                    Number(checkpointInterval) === 50
                      ? 'bg-sky-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Standard interstate sampling (default)"
                >
                  50 mi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
