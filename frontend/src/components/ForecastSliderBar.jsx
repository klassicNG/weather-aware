import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Wind,
  CloudRain,
  ShieldAlert,
  Sliders,
} from 'lucide-react';

export default function ForecastSliderBar({
  departureTime,
  forecastHour,
  setForecastHour,
  heatmapMode,
  setHeatmapMode,
  opacity,
  setOpacity,
  visible,
  setVisible,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const intervalRef = useRef(null);

  // Formatted date string for current forecast hour
  const getOffsetTimestamp = () => {
    try {
      const baseDate = departureTime ? new Date(departureTime) : new Date();
      const offsetDate = new Date(baseDate.getTime() + forecastHour * 3600 * 1000);
      return offsetDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return `Hour +${forecastHour}h`;
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const delay = playSpeed === 2 ? 140 : 280;
      intervalRef.current = setInterval(() => {
        setForecastHour((prev) => (prev >= 48 ? 0 : prev + 1));
      }, delay);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playSpeed, setForecastHour]);

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-[450] pointer-events-auto">
      <div className="glass-panel rounded-2xl p-3 px-5 shadow-2xl text-slate-100">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          {/* Timeline Label */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-wide">
              Corridor Weather Timeline:
            </span>
            <span className="text-xs font-medium text-sky-300 font-mono bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
              {getOffsetTimestamp()} (+{forecastHour}h)
            </span>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setHeatmapMode('risk')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                heatmapMode === 'risk'
                  ? 'bg-rose-500/80 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Risk</span>
            </button>
            <button
              onClick={() => setHeatmapMode('wind')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                heatmapMode === 'wind'
                  ? 'bg-amber-500/80 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Wind</span>
            </button>
            <button
              onClick={() => setHeatmapMode('precip')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                heatmapMode === 'precip'
                  ? 'bg-blue-500/80 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Rain/Snow</span>
            </button>
          </div>

          {/* Visibility & Opacity */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={() => setVisible(!visible)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={visible ? 'Hide Heatmap' : 'Show Heatmap'}
            >
              {visible ? <Eye className="w-3.5 h-3.5 text-sky-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-14 h-1 bg-slate-700 rounded-lg cursor-pointer"
              title="Heatmap Opacity"
            />
          </div>
        </div>

        {/* Timeline Slider & Play Controls */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white transition-all shadow-md shadow-sky-500/30"
              title={isPlaying ? 'Pause 48h playback' : 'Play 48h weather playback'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setForecastHour(0);
              }}
              className="p-2 rounded-xl glass-button text-slate-400 hover:text-white"
              title="Reset to departure (+0h)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPlaySpeed((prev) => (prev === 1 ? 2 : 1))}
              className="px-2 py-1 rounded-lg glass-button text-[11px] font-mono font-bold text-slate-300"
              title="Toggle playback speed"
            >
              {playSpeed}x
            </button>
          </div>

          {/* Slider */}
          <div className="flex-1 relative flex flex-col justify-center">
            <input
              type="range"
              min="0"
              max="48"
              step="1"
              value={forecastHour}
              onChange={(e) => setForecastHour(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />

            {/* Time labels */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Leaving Now (0h)</span>
              <span>+12h</span>
              <span>+24h (Day 1)</span>
              <span>+36h</span>
              <span>+48h (Day 2)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
