import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Eye,
  EyeOff,
  Wind,
  CloudRain,
  ShieldAlert,
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
  const [playSpeed, setPlaySpeed] = useState(1); // 1x, 2x
  const intervalRef = useRef(null);

  // Calculate formatted time for current forecast hour offset
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

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      const delay = playSpeed === 2 ? 150 : 300;
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
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl bg-gray-900/90 backdrop-blur-md border border-gray-700/80 rounded-2xl shadow-2xl p-4 text-white z-[500] transition-all">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Corridor Forecast
          </div>
          <span className="text-sm font-medium text-gray-200">
            {getOffsetTimestamp()}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
            +{forecastHour}h
          </span>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1 bg-gray-950/80 p-1 rounded-xl border border-gray-800 text-xs">
          <button
            onClick={() => setHeatmapMode('risk')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              heatmapMode === 'risk'
                ? 'bg-rose-600/90 text-white font-semibold shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Weather Risk
          </button>
          <button
            onClick={() => setHeatmapMode('wind')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              heatmapMode === 'wind'
                ? 'bg-amber-600/90 text-white font-semibold shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            Wind (mph)
          </button>
          <button
            onClick={() => setHeatmapMode('precip')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              heatmapMode === 'precip'
                ? 'bg-blue-600/90 text-white font-semibold shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            Precipitation
          </button>
        </div>

        {/* Heatmap Visibility & Opacity Toggle */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <button
            onClick={() => setVisible(!visible)}
            className={`p-1.5 rounded-lg border transition-all ${
              visible
                ? 'bg-gray-800 border-gray-700 text-gray-200'
                : 'bg-gray-950 border-gray-800 text-gray-500'
            }`}
            title={visible ? 'Hide Heatmap' : 'Show Heatmap'}
          >
            {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1.5 bg-gray-950/60 px-2 py-1 rounded-lg border border-gray-800">
            <Sliders className="w-3 h-3 text-gray-500" />
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-700 rounded-lg cursor-pointer"
              title="Heatmap Opacity"
            />
          </div>
        </div>
      </div>

      {/* Slider Controls Row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause & Reset Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition-all shadow-md shadow-blue-600/30"
            title={isPlaying ? 'Pause corridor timeline' : 'Play 48h corridor timeline'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setForecastHour(0);
            }}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 active:scale-95 text-gray-300 transition-all border border-gray-700/60"
            title="Reset to departure time (+0h)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPlaySpeed((prev) => (prev === 1 ? 2 : 1))}
            className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-[11px] font-mono font-bold text-gray-300 border border-gray-700/60"
            title="Toggle playback speed"
          >
            {playSpeed}x
          </button>
        </div>

        {/* Range Slider Track */}
        <div className="flex-1 relative flex flex-col justify-center">
          <input
            type="range"
            min="0"
            max="48"
            step="1"
            value={forecastHour}
            onChange={(e) => setForecastHour(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />

          {/* Hour tick marks */}
          <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1 px-1">
            <span>0h (Departure)</span>
            <span>+12h</span>
            <span>+24h (Day 1)</span>
            <span>+36h</span>
            <span>+48h (Day 2)</span>
          </div>
        </div>
      </div>

      {/* Mini Legend Footer */}
      <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 uppercase font-semibold text-[10px] tracking-wider">
            Corridor Spectrum:
          </span>
          {heatmapMode === 'risk' && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Severe
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span> No Travel
              </span>
            </div>
          )}
          {heatmapMode === 'wind' && (
            <div className="flex items-center gap-2 font-mono">
              <span className="text-emerald-400">&lt;25 mph</span>
              <span>→</span>
              <span className="text-amber-400">25–34</span>
              <span>→</span>
              <span className="text-orange-400">35–44</span>
              <span>→</span>
              <span className="text-red-400">45–54</span>
              <span>→</span>
              <span className="text-rose-400 font-bold">≥55 mph</span>
            </div>
          )}
          {heatmapMode === 'precip' && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Liquid Rain (in/hr)
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Snowfall (in/hr)
              </span>
            </div>
          )}
        </div>
        <div className="text-gray-500 italic">
          60 FPS In-Memory Corridor Heatmap (Zero Latency)
        </div>
      </div>
    </div>
  );
}
