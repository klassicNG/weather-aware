import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Wind,
  CloudRain,
  Snowflake,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
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
  // Start minimized on small screens to maximize map real-estate
  const [isMinimized, setIsMinimized] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640
  );
  const intervalRef = useRef(null);

  // Formatted date string for current forecast hour
  const getOffsetTimestamp = () => {
    try {
      const baseDate = departureTime ? new Date(departureTime) : null;
      if (!baseDate) return '';
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
        worstWind: 0,
        worstRain: 0,
        worstSnow: 0,
        maxScore: 1,
      };
    }

    let maxScore = 1;
    let worstWind = 0;
    let worstRain = 0;
    let worstSnow = 0;

    activeRoute.checkpoints.forEach((cp) => {
      const data =
        cp.forecast_48h && cp.forecast_48h[forecastHour]
          ? cp.forecast_48h[forecastHour]
          : [cp.weather?.wind_mph || 10, cp.weather?.rain_in_hr || 0, cp.weather?.snow_in_hr || 0, 1];

      const [w, r, s, score] = data;
      if (score > maxScore) maxScore = score;
      if (w > worstWind) worstWind = w;
      if (r > worstRain) worstRain = r;
      if (s > worstSnow) worstSnow = s;
    });

    const precipContext =
      worstSnow > 0.05 && worstRain > 0.05
        ? `(${worstWind.toFixed(0)} mph wind, ${worstRain.toFixed(2)} in/h rain, ${worstSnow.toFixed(1)} in/h snow)`
        : worstSnow > 0.05
        ? `(${worstWind.toFixed(0)} mph wind, ${worstSnow.toFixed(1)} in/h snow)`
        : worstRain > 0.05
        ? `(${worstWind.toFixed(0)} mph wind, ${worstRain.toFixed(2)} in/h rain)`
        : `(${worstWind.toFixed(0)} mph wind)`;

    if (maxScore >= 5) {
      return {
        level: 'Mandatory Shutdown Hazard',
        badgeClass: 'bg-rose-950/90 text-rose-200 border-rose-500/60 shadow-lg shadow-rose-900/40 animate-pulse',
        text: `🛑 SHUTDOWN HAZARD AT +${forecastHour}h ${precipContext}. Active extreme cell along corridor for heavy rigs.`,
        worstWind,
        worstRain,
        worstSnow,
        maxScore,
      };
    }
    if (maxScore === 4) {
      return {
        level: worstSnow > 1.0 ? 'Severe Snow Storm on Corridor' : 'Severe Weather on Corridor',
        badgeClass: 'bg-red-950/80 text-red-200 border-red-500/50',
        text: `🔴 SEVERE WEATHER AT +${forecastHour}h ${precipContext}. Active weather cell on open highway.`,
        worstWind,
        worstRain,
        worstSnow,
        maxScore,
      };
    }
    if (maxScore === 3) {
      const title =
        worstSnow >= 1.0
          ? 'Heavy Snow Advisory'
          : worstRain >= 0.25
          ? 'Heavy Rain Advisory'
          : 'High Wind Advisory';
      return {
        level: title,
        badgeClass: 'bg-orange-950/80 text-orange-200 border-orange-500/50',
        text: `🟠 ELEVATED CONDITIONS AT +${forecastHour}h ${precipContext}. Light/empty rigs take note.`,
        worstWind,
        worstRain,
        worstSnow,
        maxScore,
      };
    }
    if (maxScore === 2) {
      const condition =
        worstSnow > 0
          ? `${worstSnow.toFixed(1)} in/h light snow`
          : worstRain > 0
          ? `${worstRain.toFixed(2)} in/h light rain`
          : `${worstWind.toFixed(0)} mph moderate breeze`;
      return {
        level: 'Moderate Conditions',
        badgeClass: 'bg-amber-950/80 text-amber-200 border-amber-500/50',
        text: `🟡 MODERATE AT +${forecastHour}h: ${condition} along corridor.`,
        worstWind,
        worstRain,
        worstSnow,
        maxScore,
      };
    }
    return {
      level: 'Clear Corridor',
      badgeClass: 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50',
      text: `🟢 ALL CLEAR AT +${forecastHour}h (${worstWind.toFixed(0)} mph breeze). Ideal driving conditions along route.`,
      worstWind,
      worstRain,
      worstSnow,
      maxScore,
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
    <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-[96%] sm:w-[95%] max-w-4xl z-[450] pointer-events-auto">
      <div className="glass-panel rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-2xl text-slate-100 transition-all">
        {/* Header & Driver Help Banner */}
        <div className="flex items-center justify-between gap-2 pb-2 sm:pb-2.5 mb-2 sm:mb-2.5 border-b border-white/10">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-sky-400">
                48h Weather Simulator
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                — Plan ahead to dodge bad weather
              </span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-white mt-0.5 flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-slate-400">Leave at:</span>
              <span className="text-sky-300 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 font-mono text-[11px] truncate max-w-[160px] sm:max-w-none">
                {getOffsetTimestamp()}
              </span>
              <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">
                ({forecastHour === 0 ? 'Leaving Now' : `+${forecastHour}h later`})
              </span>
            </div>
          </div>

          {/* Minimize toggle */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            title={isMinimized ? 'Expand weather simulator' : 'Collapse'}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Dynamic Driver Safety Verdict for this Selected Departure Hour */}
        <div className={`px-2.5 py-2 sm:p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3 ${advisory.badgeClass}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-bold uppercase tracking-wider text-[10px] sm:text-[11px] shrink-0">
              [{advisory.level}]
            </span>
            <span className="line-clamp-1 text-[11px] sm:text-xs hidden sm:block">{advisory.text}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] shrink-0">
            {heatmapMode === 'rain' && (
              <span className="text-sky-300 font-bold bg-sky-950/70 px-1.5 sm:px-2 py-0.5 rounded border border-sky-500/30 whitespace-nowrap">
                🌧️ {advisory.worstRain ? advisory.worstRain.toFixed(2) : '0.00'} in/hr
              </span>
            )}
            {heatmapMode === 'snow' && (
              <span className="text-purple-300 font-bold bg-purple-950/70 px-1.5 sm:px-2 py-0.5 rounded border border-purple-500/30 whitespace-nowrap">
                ❄️ {advisory.worstSnow ? advisory.worstSnow.toFixed(2) : '0.00'} in/hr
              </span>
            )}
            {heatmapMode === 'wind' && (
              <span className="text-amber-300 font-bold bg-amber-950/70 px-1.5 sm:px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
                🌬️ {advisory.worstWind ? advisory.worstWind.toFixed(0) : '0'} mph
              </span>
            )}
            {heatmapMode === 'risk' && (
              <span className="text-rose-300 font-bold bg-rose-950/70 px-1.5 sm:px-2 py-0.5 rounded border border-rose-500/30 whitespace-nowrap">
                🛡️ Lvl {advisory.maxScore || 1}/5
              </span>
            )}
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Quick Departure Window Jump Buttons + Metric Selector — horizontally scrollable on mobile */}
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
              {/* Scrollable jump buttons */}
              <div className="flex items-center gap-1 text-xs overflow-x-auto no-scrollbar flex-nowrap pr-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-0.5 shrink-0 hidden sm:inline">
                  Jump:
                </span>
                {[
                  { label: 'Now', hours: 0 },
                  { label: '+3h', hours: 3 },
                  { label: '+6h', hours: 6 },
                  { label: '+12h', hours: 12 },
                  { label: '+24h', hours: 24 },
                ].map(({ label, hours }) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setForecastHour(hours)}
                    className={`shrink-0 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap ${
                      forecastHour === hours
                        ? 'bg-sky-500 text-white shadow'
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Metric Selector Pills — scrollable on mobile */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950/70 p-0.5 sm:p-1 rounded-xl border border-white/5 text-[11px] sm:text-xs overflow-x-auto no-scrollbar flex-nowrap shrink-0">
                {[
                  { mode: 'risk', icon: <ShieldAlert className="w-3 sm:w-3.5 h-3 sm:h-3.5" />, label: 'Risk', activeClass: 'bg-rose-500/80' },
                  { mode: 'wind', icon: <Wind className="w-3 sm:w-3.5 h-3 sm:h-3.5" />, label: 'Wind', activeClass: 'bg-amber-500/80' },
                  { mode: 'rain', icon: <CloudRain className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-sky-400" />, label: 'Rain', activeClass: 'bg-blue-600' },
                  { mode: 'snow', icon: <Snowflake className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-purple-300" />, label: 'Snow', activeClass: 'bg-purple-600' },
                ].map(({ mode, icon, label, activeClass }) => (
                  <button
                    key={mode}
                    onClick={() => setHeatmapMode(mode)}
                    className={`shrink-0 flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                      heatmapMode === mode
                        ? `${activeClass} text-white font-bold shadow`
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                ))}
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
