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
  ChevronDown,
  ChevronUp,
  HelpCircle,
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
  activeRoute = null,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);
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

  // Evaluate the worst weather along the route at the current forecast hour
  const getHourlyRouteAdvisory = () => {
    if (!activeRoute || !activeRoute.checkpoints || activeRoute.checkpoints.length === 0) {
      return {
        level: 'Safe',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        text: 'Clear driving conditions along your route.',
      };
    }

    let maxScore = 1;
    let worstWind = 0;
    let worstPrecip = 0;

    activeRoute.checkpoints.forEach((cp) => {
      const data =
        cp.forecast_48h && cp.forecast_48h[forecastHour]
          ? cp.forecast_48h[forecastHour]
          : [cp.weather?.wind_mph || 10, cp.weather?.rain_in_hr || 0, cp.weather?.snow_in_hr || 0, 1];

      const [w, r, s, score] = data;
      if (score > maxScore) maxScore = score;
      if (w > worstWind) worstWind = w;
      if (r + s > worstPrecip) worstPrecip = r + s;
    });

    if (maxScore >= 5) {
      return {
        level: 'Mandatory Shutdown Hazard',
        badgeClass: 'bg-rose-950/90 text-rose-200 border-rose-500/60 shadow-lg shadow-rose-900/40 animate-pulse',
        text: `🛑 DANGEROUS CONDITIONS (${worstWind} mph wind / storm). High rollover risk for loaded rigs. Delay departure.`,
      };
    }
    if (maxScore === 4) {
      return {
        level: 'Severe Weather Alert',
        badgeClass: 'bg-red-950/80 text-red-200 border-red-500/50',
        text: `🔴 SEVERE STORM DETECTED (${worstWind} mph wind). Hazardous crosswinds expected. Drive with extreme caution.`,
      };
    }
    if (maxScore === 3) {
      return {
        level: 'High Wind / Rain Advisory',
        badgeClass: 'bg-orange-950/80 text-orange-200 border-orange-500/50',
        text: `🟠 ELEVATED WEATHER (${worstWind} mph wind). Gusty winds along corridor. Light/empty trailers take note.`,
      };
    }
    if (maxScore === 2) {
      return {
        level: 'Moderate Weather',
        badgeClass: 'bg-amber-950/80 text-amber-200 border-amber-500/50',
        text: `🟡 ADVISORY: Light rain or 25–34 mph breeze along route. Normal highway speeds recommended.`,
      };
    }
    return {
      level: 'Clear Corridor',
      badgeClass: 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50',
      text: `🟢 ALL CLEAR (${worstWind} mph breeze). Ideal departure window with clear roads.`,
    };
  };

  const advisory = getHourlyRouteAdvisory();

  // Radar Playback: Stops automatically when reaching hour 48 (no infinite loop)
  useEffect(() => {
    if (isPlaying) {
      const delay = playSpeed === 2 ? 140 : 280;
      intervalRef.current = setInterval(() => {
        setForecastHour((prev) => {
          if (prev >= 48) {
            setIsPlaying(false);
            return 48;
          }
          const next = prev + 1;
          if (next >= 48) {
            setIsPlaying(false);
            return 48;
          }
          return next;
        });
      }, delay);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playSpeed, setForecastHour]);

  const handleTogglePlay = () => {
    if (!isPlaying) {
      if (forecastHour >= 48) {
        setForecastHour(0);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-[450] pointer-events-auto">
      <div className="glass-panel rounded-2xl p-4 shadow-2xl text-slate-100 transition-all">
        {/* Header & Driver Help Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs uppercase tracking-wider text-sky-400">
                Departure Weather Radar & 48-Hour Simulator
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                (Plan ahead: see if waiting a few hours avoids bad weather)
              </span>
            </div>
            <div className="text-xs font-semibold text-white mt-0.5 flex items-center gap-1.5">
              <span>If you leave at:</span>
              <span className="text-sky-300 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20 font-mono">
                {getOffsetTimestamp()}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                ({forecastHour === 0 ? 'Leaving Now' : `+${forecastHour} hours later`})
              </span>
            </div>
          </div>

          {/* Minimize toggle */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isMinimized ? 'Expand weather simulator' : 'Collapse'}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Dynamic Driver Safety Verdict for this Selected Departure Hour */}
        <div className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 mb-3 ${advisory.badgeClass}`}>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[11px] shrink-0">
              [{advisory.level}]
            </span>
            <span className="line-clamp-1">{advisory.text}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0 hidden md:inline">
            Heatmap updates live
          </span>
        </div>

        {!isMinimized && (
          <>
            {/* Quick Departure Window Jump Buttons (Driver-Friendly) */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 hidden sm:inline">
                  Jump to:
                </span>
                <button
                  type="button"
                  onClick={() => setForecastHour(0)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    forecastHour === 0
                      ? 'bg-sky-500 text-white shadow'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  Leave Now
                </button>
                <button
                  type="button"
                  onClick={() => setForecastHour(3)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    forecastHour === 3
                      ? 'bg-sky-500 text-white shadow'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  +3 Hours
                </button>
                <button
                  type="button"
                  onClick={() => setForecastHour(6)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    forecastHour === 6
                      ? 'bg-sky-500 text-white shadow'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  +6 Hours
                </button>
                <button
                  type="button"
                  onClick={() => setForecastHour(12)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    forecastHour === 12
                      ? 'bg-sky-500 text-white shadow'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  +12h (Later Today)
                </button>
                <button
                  type="button"
                  onClick={() => setForecastHour(24)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    forecastHour === 24
                      ? 'bg-sky-500 text-white shadow'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  +24h (Tomorrow)
                </button>
              </div>

              {/* Metric Selector Pills */}
              <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-white/5 text-xs">
                <button
                  onClick={() => setHeatmapMode('risk')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                    heatmapMode === 'risk'
                      ? 'bg-rose-500/80 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Shows danger risk from Green (Safe) to Red (Hazard)"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Hazard Risk</span>
                </button>
                <button
                  onClick={() => setHeatmapMode('wind')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                    heatmapMode === 'wind'
                      ? 'bg-amber-500/80 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Shows wind speed gusts along the route"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Wind Speed</span>
                </button>
                <button
                  onClick={() => setHeatmapMode('precip')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                    heatmapMode === 'precip'
                      ? 'bg-blue-500/80 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Shows rain and snow showers"
                >
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>Rain & Snow</span>
                </button>
              </div>
            </div>

            {/* Timeline Slider Track & Play Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleTogglePlay}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/30 flex items-center gap-1.5"
                  title={isPlaying ? 'Pause radar animation' : 'Animate 48-hour weather timeline (stops at hour 48)'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play Radar'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setForecastHour(0);
                  }}
                  className="p-1.5 rounded-xl glass-button text-slate-400 hover:text-white"
                  title="Reset to departure time (+0h)"
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

              {/* Slider Track */}
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

                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>Now (0h)</span>
                  <span>+12h (Evening)</span>
                  <span>+24h (Tomorrow)</span>
                  <span>+36h</span>
                  <span>+48h (Day 2)</span>
                </div>
              </div>

              {/* Heatmap Visibility Toggle */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-white/10">
                <button
                  onClick={() => setVisible(!visible)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title={visible ? 'Hide Radar Heatmap' : 'Show Radar Heatmap'}
                >
                  {visible ? <Eye className="w-4 h-4 text-sky-400" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
