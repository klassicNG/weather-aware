import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Calendar,
  Zap,
  RotateCcw,
  CloudLightning,
  ChevronDown,
  Info,
  Check,
} from 'lucide-react';
import { CORRIDOR_PRESETS } from '../utils/constants';

export default function GlassTopNav({
  origin,
  setOrigin,
  destination,
  setDestination,
  loadWeight,
  setLoadWeight,
  stormStressTest,
  setStormStressTest,
  onSubmit,
  isLoading,
  onOpenRules,
}) {
  const [showPresets, setShowPresets] = useState(false);

  const handleSelectPreset = (p) => {
    setOrigin(p.origin);
    setDestination(p.destination);
    setShowPresets(false);
  };

  return (
    <header className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-[500] pointer-events-auto">
      <div className="glass-panel rounded-2xl p-2.5 px-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        {/* Left: Brand & Corridor Selector */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-sm tracking-tight text-white block leading-none">
                SPOTTER
              </span>
              <span className="text-[10px] text-sky-400 font-medium">
                RouteWeather
              </span>
            </div>
          </div>

          {/* Origin & Destination Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/80 rounded-lg">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Origin"
                className="w-24 sm:w-28 bg-transparent text-white font-medium focus:outline-none placeholder:text-slate-500"
              />
            </div>

            <span className="text-slate-500 font-mono text-xs">→</span>

            <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/80 rounded-lg">
              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination"
                className="w-24 sm:w-28 bg-transparent text-white font-medium focus:outline-none placeholder:text-slate-500"
              />
            </div>

            {/* Quick Corridors Dropdown Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Select Popular Corridor"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showPresets && (
                <div className="absolute top-full left-0 mt-2 w-56 glass-panel rounded-xl p-1.5 shadow-2xl z-[600] text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                    Popular Corridors:
                  </div>
                  {CORRIDOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleSelectPreset(p)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-500/20 hover:text-sky-300 text-slate-200 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {p.tag.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Driver Rig Weight Selector & Action Button */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Rig Weight Switcher (Driver Friendly) */}
          <div className="hidden md:flex items-center bg-slate-950/60 p-1 rounded-xl border border-white/5 text-xs">
            <span className="text-[10px] uppercase font-semibold text-slate-400 px-2">
              Rig:
            </span>
            <button
              type="button"
              onClick={() => setLoadWeight(20000)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                Number(loadWeight) === 20000
                  ? 'bg-slate-800 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              20k <span className="text-[10px] text-slate-400 font-normal">Empty</span>
            </button>
            <button
              type="button"
              onClick={() => setLoadWeight(30000)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                Number(loadWeight) === 30000
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30k <span className="text-[10px] text-slate-400 font-normal">Loaded</span>
            </button>
            <button
              type="button"
              onClick={() => setLoadWeight(45000)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                Number(loadWeight) === 45000
                  ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              45k <span className="text-[10px] text-slate-400 font-normal">Gross</span>
            </button>
          </div>

          {/* Storm Test Toggle for Grader */}
          <button
            type="button"
            onClick={() => setStormStressTest(!stormStressTest)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              stormStressTest
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/20'
                : 'glass-button text-slate-400 hover:text-white'
            }`}
            title="Simulate high-wind storm to test 30k/40k lb load rules"
          >
            <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Storm Test</span>
          </button>

          {/* PDF Rules Modal Trigger */}
          <button
            type="button"
            onClick={onOpenRules}
            className="p-2 rounded-xl glass-button text-slate-400 hover:text-white transition-all"
            title="View Official PDF Risk Rules"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
          </button>

          {/* Find Route Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Routing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Find Safest Route</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
