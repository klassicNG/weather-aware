import React from 'react';
import {
  Truck,
  MapPin,
  Calendar,
  Weight,
  Layers,
  Sparkles,
  Zap,
  RotateCcw,
  CloudLightning,
} from 'lucide-react';
import {
  CORRIDOR_PRESETS,
  LOAD_PRESETS,
  INTERVAL_OPTIONS,
} from '../utils/constants';

export default function DispatchControlPanel({
  origin,
  setOrigin,
  destination,
  setDestination,
  departureTime,
  setDepartureTime,
  loadWeight,
  setLoadWeight,
  checkpointInterval,
  setCheckpointInterval,
  stormStressTest,
  setStormStressTest,
  onSubmit,
  isLoading,
}) {
  const handlePresetSelect = (preset) => {
    setOrigin(preset.origin);
    setDestination(preset.destination);
  };

  return (
    <div className="bg-gray-900/95 border border-gray-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md text-white">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Dispatch Control Center
            </h2>
            <p className="text-xs text-gray-400">
              Weather-Aware Corridor Analysis & Risk Evaluation
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        {/* Origin & Destination Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Origin City / Hub
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Chicago, IL"
              required
              className="w-full px-3.5 py-2 bg-gray-950 border border-gray-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Destination City / Hub
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Denver, CO"
              required
              className="w-full px-3.5 py-2 bg-gray-950 border border-gray-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Quick Corridor Presets */}
        <div>
          <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Quick Corridor Presets:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {CORRIDOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="px-2.5 py-1.5 rounded-lg bg-gray-950/80 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-left text-xs transition-all flex flex-col group"
              >
                <span className="font-semibold text-gray-200 group-hover:text-blue-400 transition-colors truncate">
                  {preset.name}
                </span>
                <span className="text-[10px] text-gray-500 truncate">
                  {preset.tag}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Departure Time & Checkpoint Interval */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Departure Date & Time
            </label>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-gray-950 border border-gray-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Sampling Interval (Miles)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCheckpointInterval(opt.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    checkpointInterval === opt.value
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-sm'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className="text-[9px] text-gray-500 font-normal">{opt.badge}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Load Weight Input & Quick Test Buttons */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Weight className="w-3.5 h-3.5 text-amber-400" />
              Truck Load Weight (lbs)
            </label>
            <span className="text-xs font-mono text-amber-400 font-semibold">
              {Number(loadWeight).toLocaleString()} lbs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
            <input
              type="number"
              min="0"
              max="80000"
              step="500"
              value={loadWeight}
              onChange={(e) => setLoadWeight(e.target.value)}
              className="sm:col-span-1 px-3.5 py-2 bg-gray-950 border border-gray-700/80 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500"
            />

            {/* Quick Test Preset Buttons */}
            {LOAD_PRESETS.map((preset) => (
              <button
                key={preset.weight}
                type="button"
                onClick={() => setLoadWeight(preset.weight)}
                className={`py-1.5 px-2 rounded-xl border text-left text-xs transition-all ${
                  Number(loadWeight) === preset.weight
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="font-semibold text-[11px]">{preset.label}</div>
                <div className="text-[9px] text-gray-500 truncate">{preset.desc}</div>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-gray-500 italic">
            *Tests load rules: ≥55 mph (No Travel for all), 45-54 mph + ≥30,000 lbs (No Travel), 35-44 mph + &gt;40,000 lbs (Severe).
          </p>
        </div>

        {/* Storm Stress-Test Mode Toggle */}
        <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border ${stormStressTest ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
              <CloudLightning className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-200">
                Storm Stress-Test Simulator
              </div>
              <div className="text-[10px] text-gray-400">
                Simulates high-wind weather front (48 mph) to test load weight overrides on calm days
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStormStressTest(!stormStressTest)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              stormStressTest ? 'bg-blue-600 justify-end' : 'bg-gray-700 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Sampling Weather & Evaluating Corridors...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Analyze & Recommend Safest Route</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
