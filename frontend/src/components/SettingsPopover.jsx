import React, { useState } from 'react';
import {
  Settings,
  X,
  Calendar,
  Scale,
  Milestone,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function SettingsPopover({
  isOpen,
  onClose,
  departureTime,
  setDepartureTime,
  loadWeight,
  setLoadWeight,
  checkpointInterval,
  setCheckpointInterval,
  onApply,
}) {
  const [tempDepartureTime, setTempDepartureTime] = useState(departureTime);
  const [tempLoadWeight, setTempLoadWeight] = useState(loadWeight);
  const [tempInterval, setTempInterval] = useState(checkpointInterval);

  if (!isOpen) return null;

  const handleSetNow = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setTempDepartureTime(now.toISOString().slice(0, 16));
  };

  const handleSave = () => {
    const parsedWeight = Math.max(0, parseFloat(tempLoadWeight) || 0);
    const parsedInterval = [10, 25, 50].includes(Number(tempInterval))
      ? Number(tempInterval)
      : 50;

    setDepartureTime(tempDepartureTime);
    setLoadWeight(parsedWeight);
    setCheckpointInterval(parsedInterval);

    if (onApply) {
      onApply({
        departureTime: tempDepartureTime,
        loadWeight: parsedWeight,
        checkpointInterval: parsedInterval,
      });
    }

    onClose();
  };

  const weightNum = Number(tempLoadWeight) || 0;

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-white/10 text-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Route & Rig Compliance Settings
              </h2>
              <p className="text-xs text-slate-400">
                Custom parameters strictly evaluated against Spotter AI PDF rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Fields */}
        <div className="space-y-5 text-xs">
          {/* 1. Custom Departure Date & Time Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Custom Departure Date & Time</span>
              </label>
              <button
                type="button"
                onClick={handleSetNow}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Now
              </button>
            </div>
            <input
              type="datetime-local"
              id="compliance-departure-time"
              value={tempDepartureTime}
              onChange={(e) => setTempDepartureTime(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all [color-scheme:dark]"
            />
            <p className="text-[11px] text-slate-400 leading-normal">
              Corridor weather forecasts match checkpoint arrival ETAs based on this timestamp.
            </p>
          </div>

          {/* 2. Custom Load Weight Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Custom Load Weight (lbs)</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {weightNum.toLocaleString()} lbs
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                id="compliance-load-weight"
                min="0"
                max="120000"
                step="500"
                value={tempLoadWeight}
                onChange={(e) => setTempLoadWeight(e.target.value)}
                placeholder="Enter custom weight (e.g. 42000)"
                className="flex-1 bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Quick Presets within Popover */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Presets:
              </span>
              <button
                type="button"
                onClick={() => setTempLoadWeight(20000)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  weightNum === 20000
                    ? 'bg-slate-700 text-white border border-slate-500'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                20k (Empty)
              </button>
              <button
                type="button"
                onClick={() => setTempLoadWeight(30000)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  weightNum === 30000
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                30k (Loaded)
              </button>
              <button
                type="button"
                onClick={() => setTempLoadWeight(45000)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  weightNum === 45000
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                45k (Max Gross)
              </button>
            </div>

            {/* Load Rule Threshold Advisory Box */}
            <div
              className={`p-2.5 rounded-xl border text-[11px] leading-relaxed transition-all ${
                weightNum > 40000
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : weightNum >= 30000
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900/80 border-white/5 text-slate-400'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {weightNum > 40000
                    ? 'Super-Heavy Rig Rule (>40,000 lbs):'
                    : weightNum >= 30000
                    ? 'Heavy Rig Rule (≥30,000 lbs):'
                    : 'Standard Rig Rule (<30,000 lbs):'}
                </span>
              </div>
              <p>
                {weightNum > 40000
                  ? 'Over 40k lbs escalates 35-44 mph winds to Severe, and 45-54 mph winds to No Travel (Mandatory Shutdown).'
                  : weightNum >= 30000
                  ? 'At 30k+ lbs, winds between 45-54 mph escalate directly to No Travel (Mandatory Shutdown).'
                  : 'Standard wind risk thresholds apply. Base shutdown remains at ≥55 mph.'}
              </p>
            </div>
          </div>

          {/* 3. Sampling Interval Dropdown */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <Milestone className="w-4 h-4 text-emerald-400" />
              <span>Checkpoint Sampling Interval</span>
            </label>
            <select
              id="compliance-sampling-interval"
              value={tempInterval}
              onChange={(e) => setTempInterval(Number(e.target.value))}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all cursor-pointer [color-scheme:dark]"
            >
              <option value={10}>10 miles — Dense Checkpoints (Maximum Accuracy)</option>
              <option value={25}>25 miles — Balanced Corridor Sampling</option>
              <option value={50}>50 miles — Standard Highway Interval (Default)</option>
            </select>
            <p className="text-[11px] text-slate-400 leading-normal">
              Determines the distance interval between weather evaluation points along each corridor.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-5 mt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl glass-button text-xs font-semibold text-slate-400 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save & Recalculate Routes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
