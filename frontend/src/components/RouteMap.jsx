import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import HeatmapCanvasLayer from './HeatmapCanvasLayer';
import { RISK_LEVELS, evaluateLoadRule } from '../utils/constants';
import {
  Clock,
  Wind,
  CloudRain,
  Snowflake,
  AlertTriangle,
  Tag,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

// Distinct color palettes for all 3 corridors
const ROUTE_PALETTES = [
  {
    primary: '#10b981', // Vibrant Emerald (Route 1)
    glow: '#059669',
    label: 'Primary Corridor',
    badgeText: '🏆 SAFEST CORRIDOR',
    badgeClass: 'text-emerald-400',
  },
  {
    primary: '#06b6d4', // Electric Cyan (Route 2)
    glow: '#0891b2',
    label: 'Southern Bypass',
    badgeText: 'ALT OPTION 1',
    badgeClass: 'text-cyan-400',
  },
  {
    primary: '#f59e0b', // Warm Amber (Route 3)
    glow: '#d97706',
    label: 'Northern Corridor',
    badgeText: 'ALT OPTION 2',
    badgeClass: 'text-amber-400',
  },
];

// Automatically fits map bounds when routes change
function MapAutoFitter({ routes }) {
  const map = useMap();

  useEffect(() => {
    if (!routes || routes.length === 0) return;

    const latLngs = [];
    routes.forEach((r) => {
      if (r.geometry && r.geometry.coordinates) {
        r.geometry.coordinates.forEach(([lon, lat]) => {
          latLngs.push([lat, lon]);
        });
      }
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 8 });
    }
  }, [routes, map]);

  return null;
}

export default function RouteMap({
  routes = [],
  activeRouteId = null,
  setActiveRouteId,
  forecastHour = 0,
  heatmapMode = 'risk',
  heatmapOpacity = 0.75,
  heatmapVisible = true,
  loadWeight = 45000,
  spotlightPoint = null,
  origin = 'Chicago, IL',
  destination = 'Denver, CO',
  onOpenDispatch = null,
  isSidebarOpen = false,
}) {
  const [showAllEtas, setShowAllEtas] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  const scrollTrackRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollTrackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  const scrollByOffset = (offset) => {
    if (scrollTrackRef.current) {
      scrollTrackRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e) => {
    // Only primary (left) mouse click
    if (e.button !== 0 || !scrollTrackRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftRef.current = scrollTrackRef.current.scrollLeft;
    setIsGrabbing(true);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isDraggingRef.current || !scrollTrackRef.current) return;
      const walk = e.pageX - startXRef.current;
      if (Math.abs(walk) > 4) {
        hasDraggedRef.current = true;
      }
      scrollTrackRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleGlobalMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsGrabbing(false);
      if (hasDraggedRef.current) {
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 100);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  useEffect(() => {
    const el = scrollTrackRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [routes, checkScroll]);

  const handleClickCapture = (e) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const handleWheel = (e) => {
    if (!scrollTrackRef.current) return;
    if (e.deltaX === 0 && e.deltaY !== 0) {
      scrollTrackRef.current.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeRoute = routes.find((r) => r.id === activeRouteId) || routes[0];
  const recommendedRoute = routes.find((r) => r.is_recommended) || routes[0];

  return (
    <div className="relative w-full h-full bg-[#070a12] overflow-hidden flex flex-col">
      {/* =========================================================================
          FLUSH TOP CORRIDOR TELEMETRY RIBBON (Not a Card — 1-Line Flush Header)
          Directly fulfills: "Show all routes, checkpoints, risk levels, ETAs, and
          route summaries on a map" with zero screen clutter or floating boxes.
      ========================================================================= */}
      {routes.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-[450] bg-[#070a12]/95 backdrop-blur-md border-b border-white/10 px-2 sm:px-3 py-1.5 flex items-center justify-between gap-1.5 sm:gap-2 shadow-2xl pointer-events-auto">
          {/* Corridor Selection Tabs & Mobile Dispatch Opener - Contained in flexible scrollable track */}
          <div className="flex-1 min-w-0 flex items-center gap-1 relative overflow-hidden">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollByOffset(-180)}
                className="shrink-0 p-1 rounded-md bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 shadow-lg transition-all z-10"
                title="Scroll routes left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <div
              ref={scrollTrackRef}
              onMouseDown={handleMouseDown}
              onClickCapture={handleClickCapture}
              onWheel={handleWheel}
              onDragStart={(e) => e.preventDefault()}
              className={`flex-1 min-w-0 overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2 pr-1 select-none ${
                isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ touchAction: 'pan-x' }}
            >
              {/* Mobile Open Dispatch Button - Cleanly integrated inside top bar */}
              {onOpenDispatch && (
                <button
                  type="button"
                  onClick={(e) => {
                    if (hasDraggedRef.current) return;
                    onOpenDispatch(e);
                  }}
                  className="lg:hidden shrink-0 px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 active:bg-sky-500/40 border border-sky-400/40 text-sky-300 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                  title="Open Dispatch Controls"
                >
                  <span>🚚</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider">Dispatch</span>
                </button>
              )}

              {routes.map((route, idx) => {
                const isSelected = route.id === activeRoute?.id;
                const isRec = route.is_recommended || route.id === recommendedRoute?.id;
                const palette = ROUTE_PALETTES[idx % ROUTE_PALETTES.length];
                const sum = route.summary || {};

                let etaTime = '--:--';
                if (sum.eta_destination) {
                  try {
                    const d = new Date(sum.eta_destination);
                    etaTime = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                  } catch {
                    etaTime = sum.eta_destination;
                  }
                }

                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => {
                      if (hasDraggedRef.current) return;
                      setActiveRouteId && setActiveRouteId(route.id);
                    }}
                    className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 sm:gap-2 border shrink-0 ${
                      isSelected
                        ? 'bg-slate-800/95 border-white/25 text-white shadow-lg ring-1 ring-sky-400/50'
                        : 'bg-slate-950/60 hover:bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: palette.primary }}
                    />
                    {/* Desktop view */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <span className="font-extrabold tracking-tight text-white whitespace-nowrap">
                        {route.name}
                      </span>
                      <span className={`text-[10px] font-bold ${palette.badgeClass}`}>
                        [{isRec ? '★ RECOMMENDED' : `ALT ${idx}`}]
                      </span>
                    </div>

                    {/* Mobile compact view */}
                    <div className="flex sm:hidden items-center gap-1">
                      <span className="font-extrabold text-[11px] text-white whitespace-nowrap">
                        {isRec ? '★ Safest' : `Alt ${idx}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-300 border-l border-white/10 pl-1.5 sm:pl-2">
                      <span className="font-bold text-slate-200">{sum.total_duration_hours}h</span>
                      <span className="hidden sm:inline text-slate-500">•</span>
                      <span className="hidden sm:inline">{sum.total_distance_miles}m</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sky-300 whitespace-nowrap">Arr {etaTime}</span>
                      <span className="hidden sm:inline text-slate-500">•</span>
                      <span
                        className={`hidden sm:inline font-bold ${
                          sum.average_risk_score <= 1.5
                            ? 'text-emerald-400'
                            : sum.average_risk_score <= 2.5
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {sum.average_risk_score <= 1.5 ? 'Clear' : sum.max_risk_level}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollByOffset(180)}
                className="shrink-0 p-1 rounded-md bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 shadow-lg transition-all z-10"
                title="Scroll routes right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Checkpoint Counter & ETA density toggle */}
          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-slate-400 bg-[#070a12]/95 backdrop-blur-md pl-2 sm:pl-3 border-l border-white/10 z-10">
            <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded bg-slate-900/80 border border-white/10 text-[10px] text-sky-300 font-bold font-mono whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <span className="hidden sm:inline">{activeRoute?.checkpoints?.length || 0} Checkpoints on Map</span>
              <span className="sm:hidden">{activeRoute?.checkpoints?.length || 0} CPs</span>
            </div>

            <button
              type="button"
              onClick={() => setShowAllEtas(!showAllEtas)}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all border whitespace-nowrap ${
                showAllEtas
                  ? 'bg-sky-500 text-white border-sky-400 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-white/10'
              }`}
              title="Toggle between Key Milestone ETAs and Every Checkpoint ETA along the highway"
            >
              <Tag className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">{showAllEtas ? 'All ETAs Visible' : 'Key ETAs'}</span>
              <span className="sm:hidden">{showAllEtas ? 'All' : 'ETAs'}</span>
            </button>

            {/* Dynamic Telemetry Legend (Adapts to Active Mode: Risk, Wind, Rain, Snow) - only on ultra-wide screens to prevent ribbon crowding */}
            <div className="hidden 2xl:flex items-center gap-2 text-[10px] pl-2 border-l border-white/10 font-mono shrink-0 whitespace-nowrap">
              {heatmapMode === 'rain' && (
                <>
                  <span className="text-sky-400 font-bold flex items-center gap-1">
                    <CloudRain className="w-3 h-3" /> Rain:
                  </span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> &lt;0.10 in/h</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> 0.25</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-700" /> 0.50</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-600" /> 1.00</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> &gt;1.00 in/h</span>
                </>
              )}
              {heatmapMode === 'snow' && (
                <>
                  <span className="text-purple-300 font-bold flex items-center gap-1">
                    <Snowflake className="w-3 h-3" /> Snow:
                  </span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-200" /> &lt;0.5 in/h</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> 1.0</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-600" /> 2.0</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-fuchsia-600" /> 3.0</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> &gt;3.0 (Blizzard)</span>
                </>
              )}
              {heatmapMode === 'wind' && (
                <>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Wind className="w-3 h-3" /> Wind:
                  </span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> &lt;20 mph</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 25–34</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> 35–44</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> &gt;45 mph</span>
                </>
              )}
              {heatmapMode === 'risk' && (
                <>
                  <span className="text-slate-400 font-bold">Risk:</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Low</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Mod</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> High</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Sev</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Stop</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LEAFLET FULLSCREEN CANVAS
      ========================================================================= */}
      <MapContainer
        center={[39.8283, -98.5795]} // Center of USA
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full"
        attributionControl={false}
      >
        {/* Esri World Dark Gray Canvas: 100% Free, Clean Dark Aesthetics */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
          opacity={0.8}
        />

        <MapAutoFitter routes={routes} />

        {/* 60 FPS Thermal Canvas Heatmap Layer */}
        <HeatmapCanvasLayer
          routes={routes}
          activeRouteId={activeRouteId}
          forecastHour={forecastHour}
          heatmapMode={heatmapMode}
          opacity={heatmapOpacity}
          visible={heatmapVisible}
        />

        {/* =====================================================================
            1. PURE CARTOGRAPHIC HIGHWAY POLYLINES & IN-SITU LABELS (ZERO BOXES)
        ===================================================================== */}
        {routes.map((route, rIdx) => {
          const isSelected = route.id === activeRoute?.id;
          const isRecommended = route.is_recommended || route.id === recommendedRoute?.id;
          const palette = ROUTE_PALETTES[rIdx % ROUTE_PALETTES.length];
          const coords = route.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || [];
          if (coords.length === 0) return null;

          // Midpoint coordinate along route polyline for Pure Cartographic Typography
          const midCoord = coords[Math.floor(coords.length / 2)];
          const sum = route.summary || {};

          return (
            <React.Fragment key={route.id}>
              {/* Outer glow halo for selected route */}
              {(isSelected || isRecommended) && (
                <Polyline
                  positions={coords}
                  pathOptions={{
                    color: isSelected ? palette.primary : palette.glow,
                    weight: isSelected ? 12 : 7,
                    opacity: isSelected ? 0.4 : 0.2,
                    lineCap: 'round',
                  }}
                />
              )}

              {/* Main polyline */}
              <Polyline
                positions={coords}
                pathOptions={{
                  color: palette.primary,
                  weight: isSelected ? 6.5 : 4.0,
                  opacity: isSelected ? 0.95 : 0.65,
                  dashArray: isSelected ? null : isRecommended ? null : '6, 8',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{
                  click: () => {
                    if (setActiveRouteId) {
                      setActiveRouteId(route.id);
                    }
                  },
                }}
              >
                <Tooltip sticky>
                  <div className="carto-halo-text text-xs text-white p-1">
                    <span className="font-extrabold" style={{ color: palette.primary }}>
                      {route.name}
                    </span>
                    <span className="text-slate-300 font-mono block">
                      {sum.total_distance_miles} mi • {sum.total_duration_hours} hrs • {isRecommended ? 'Safest' : 'Alternative'}
                    </span>
                  </div>
                </Tooltip>
              </Polyline>

              {/* Pure Cartographic Typography along Highway */}
              {midCoord && (
                <CircleMarker
                  center={midCoord}
                  radius={1}
                  pathOptions={{ opacity: 0, fillOpacity: 0 }}
                  eventHandlers={{
                    click: () => setActiveRouteId && setActiveRouteId(route.id),
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -6]}>
                    <div
                      onClick={() => setActiveRouteId && setActiveRouteId(route.id)}
                      className={`${
                        isSelected ? 'flex' : 'hidden sm:flex'
                      } cursor-pointer select-none font-mono text-[11px] font-extrabold uppercase carto-halo-text items-center gap-1.5 transition-transform hover:scale-105`}
                      style={{ color: palette.primary }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: palette.primary }}
                      />
                      <span>{route.name}</span>
                      <span className="text-slate-200 font-normal">
                        ({sum.total_duration_hours}h • {sum.total_distance_miles}m)
                      </span>
                      <span className="text-white font-bold">
                        {isRecommended ? '★ SAFEST' : `ALT ${rIdx}`}
                      </span>
                    </div>
                  </Tooltip>
                </CircleMarker>
              )}
            </React.Fragment>
          );
        })}

        {/* =====================================================================
            2. COLOR-CODED RISK HIGHWAY SEGMENTS (Road itself shows danger)
        ===================================================================== */}
        {activeRoute?.checkpoints && activeRoute.checkpoints.length > 1 && (
          activeRoute.checkpoints.slice(0, -1).map((cp, idx) => {
            const nextCp = activeRoute.checkpoints[idx + 1];
            const dataAtHour =
              cp.forecast_48h && cp.forecast_48h[forecastHour]
                ? cp.forecast_48h[forecastHour]
                : [
                    cp.weather?.wind_mph ?? 0,
                    cp.weather?.rain_in_hr ?? 0,
                    cp.weather?.snow_in_hr ?? 0,
                    cp.risk?.risk_score ?? 1,
                  ];

            const [windMph, , , baseScore] = dataAtHour;
            const loadRule = evaluateLoadRule(windMph, loadWeight);
            const effectiveScore = loadRule.triggered
              ? Math.max(baseScore, loadRule.score)
              : baseScore;

            if (effectiveScore < 3) return null;

            const riskInfo = RISK_LEVELS[effectiveScore] || RISK_LEVELS[1];

            return (
              <Polyline
                key={`hazard-seg-${activeRoute.id}-${idx}`}
                positions={[
                  [cp.lat, cp.lon],
                  [nextCp.lat, nextCp.lon],
                ]}
                pathOptions={{
                  color: riskInfo.color,
                  weight: 8.5,
                  opacity: 0.95,
                  lineCap: 'round',
                }}
              />
            );
          })
        )}

        {/* =====================================================================
            3. CHECKPOINTS ACROSS ALL 3 ROUTES & IN-SITU MILEPOST ETAs
        ===================================================================== */}
        {routes.map((route, rIdx) => {
          const isSelected = route.id === activeRoute?.id;

          // Non-active routes: clean subtle colored nodes along the lines
          if (!isSelected) {
            return route.checkpoints?.map((cp, cpIdx) => {
              const score = cp.risk?.risk_score || 1;
              const riskInfo = RISK_LEVELS[score] || RISK_LEVELS[1];
              return (
                <CircleMarker
                  key={`alt-cp-${route.id}-${cpIdx}`}
                  center={[cp.lat, cp.lon]}
                  radius={3.0}
                  pathOptions={{
                    fillColor: riskInfo.color,
                    fillOpacity: 0.65,
                    color: '#ffffff',
                    weight: 0.8,
                  }}
                  eventHandlers={{
                    click: () => setActiveRouteId && setActiveRouteId(route.id),
                  }}
                >
                  <Tooltip>
                    <span className="carto-halo-text text-[10px] text-white font-mono">
                      {route.name}: M{Math.round(cp.distance_from_origin_miles)} ({riskInfo.name})
                    </span>
                  </Tooltip>
                </CircleMarker>
              );
            });
          }

          // Active route: interactive checkpoints + clean in-line cartographic timestamps
          const totalCps = route.checkpoints?.length || 1;

          // Find single worst peak hazard checkpoint along the route (avoids spamming 100 hazard labels)
          let peakHazardIdx = -1;
          let worstWind = 0;
          route.checkpoints?.forEach((c, cIdx) => {
            const data =
              c.forecast_48h && c.forecast_48h[forecastHour]
                ? c.forecast_48h[forecastHour]
                : [c.weather?.wind_mph || 0, 0, 0, 1];
            const [w] = data;
            const lr = evaluateLoadRule(w, loadWeight);
            const eff = lr.triggered ? Math.max(data[3], lr.score) : data[3];
            if (eff >= 3 && w > worstWind) {
              worstWind = w;
              peakHazardIdx = cIdx;
            }
          });

          // Milestones: exactly 3 clean quarter markers along the entire trip (at 25%, 50%, 75%)
          const m25 = Math.max(1, Math.floor(totalCps * 0.25));
          const m50 = Math.max(2, Math.floor(totalCps * 0.5));
          const m75 = Math.max(3, Math.floor(totalCps * 0.75));
          const quarterMilestones = new Set([m25, m50, m75]);

          return route.checkpoints?.map((cp, idx) => {
            const dataAtHour =
              cp.forecast_48h && cp.forecast_48h[forecastHour]
                ? cp.forecast_48h[forecastHour]
                : [
                    cp.weather?.wind_mph ?? 0,
                    cp.weather?.rain_in_hr ?? 0,
                    cp.weather?.snow_in_hr ?? 0,
                    cp.risk?.risk_score ?? 1,
                  ];

            const [windMph, rainInHr, snowInHr, baseRiskScore] = dataAtHour;
            const loadRule = evaluateLoadRule(windMph, loadWeight);
            const effectiveScore = loadRule.triggered
              ? Math.max(baseRiskScore, loadRule.score)
              : baseRiskScore;

            const riskInfo = RISK_LEVELS[effectiveScore] || RISK_LEVELS[1];
            const isHazard = effectiveScore >= 2;
            const isCritical = effectiveScore >= 4;

            const baseEta = cp.eta_iso ? new Date(cp.eta_iso) : null;
            const exactEta = baseEta
              ? new Date(baseEta.getTime() + forecastHour * 3600000)
              : null;
            const timeStr = exactEta
              ? exactEta.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '--:--';
            const dateStr = exactEta
              ? exactEta.toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            const isOrigin = idx === 0;
            const isDestination = idx === totalCps - 1;
            const isQuarterMilestone = quarterMilestones.has(idx);
            const isPeakHazard = idx === peakHazardIdx;

            // Only show labels for quarter milestones on desktop, single peak storm point, or when ETAs are toggled on
            const shouldShowBadge = showAllEtas
              ? (isMobile ? idx % 6 === 0 : idx % 4 === 0)
              : isPeakHazard || (!isMobile && isQuarterMilestone);

            return (
              <CircleMarker
                key={`${route.id}-cp-${cp.id || idx}`}
                center={[cp.lat, cp.lon]}
                radius={isCritical ? 7.5 : isHazard ? 5.5 : 4.0}
                pathOptions={{
                  fillColor: riskInfo.color,
                  fillOpacity: isHazard ? 1.0 : 0.7,
                  color: isCritical ? '#ffffff' : '#070a12',
                  weight: isCritical ? 2.5 : 1.2,
                }}
                eventHandlers={{
                  mouseover: (e) => e.target.openPopup(),
                  click: (e) => e.target.openPopup(),
                }}
              >
                {/* Pure In-Situ Milestone Timestamp (No Box, Pure Typography) */}
                {!isOrigin && !isDestination && shouldShowBadge && (
                  <Tooltip permanent direction="bottom" offset={[0, 6]}>
                    <div
                      className={`carto-halo-text text-[10px] font-mono font-bold select-none whitespace-nowrap ${
                        isPeakHazard && isCritical
                          ? 'text-rose-400 animate-pulse'
                          : isHazard
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {isPeakHazard && isCritical ? (
                        <span>
                          🛑 PEAK STORM: M{Math.round(cp.distance_from_origin_miles)} ({Number(windMph).toFixed(0)}mph {riskInfo.name})
                        </span>
                      ) : (
                        <span>
                          M{Math.round(cp.distance_from_origin_miles)} • {timeStr}
                        </span>
                      )}
                    </div>
                  </Tooltip>
                )}

                {/* Minimalist Inspection Popup on Click */}
                <Popup>
                  <div className="min-w-[220px] text-xs font-sans text-slate-100">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                      <div>
                        <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: riskInfo.color }} />
                          <span>Checkpoint #{idx + 1}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Highway Mile {Number(cp.distance_from_origin_miles).toFixed(1)}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskInfo.bgClass}`}>
                        {riskInfo.name}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 mb-2 flex items-center justify-between font-mono">
                      <span className="text-sky-400">ETA: {dateStr}, {timeStr}</span>
                      <span className="text-slate-400">Mile {Number(cp.distance_from_origin_miles).toFixed(1)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px] bg-slate-950 p-2 rounded-lg border border-white/5">
                      <div>
                        <div className="text-amber-400 font-bold">{Number(windMph).toFixed(1)}</div>
                        <div className="text-slate-500">mph wind</div>
                      </div>
                      <div>
                        <div className="text-sky-400 font-bold">{Number(rainInHr).toFixed(2)}</div>
                        <div className="text-slate-500">in/h rain</div>
                      </div>
                      <div>
                        <div className="text-purple-400 font-bold">{Number(snowInHr).toFixed(2)}</div>
                        <div className="text-slate-500">in/h snow</div>
                      </div>
                    </div>

                    {loadRule.triggered && (
                      <div className="mt-2 p-1.5 rounded bg-rose-500/20 border border-rose-500/60 text-rose-200 text-[10px] font-bold">
                        ⚠ {loadRule.text}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          });
        })}

        {/* =====================================================================
            4. SPOTLIGHT MARKER (Chart Scrubbing Highlight)
        ===================================================================== */}
        {spotlightPoint && (
          <CircleMarker
            center={[spotlightPoint.lat, spotlightPoint.lon]}
            radius={10}
            pathOptions={{
              fillColor: '#38bdf8',
              fillOpacity: 0.8,
              color: '#ffffff',
              weight: 2.5,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              <div className="carto-halo-text text-xs font-mono font-extrabold text-sky-300 select-none">
                📍 {spotlightPoint.name} ({spotlightPoint.windMph.toFixed(0)} mph)
              </div>
            </Tooltip>
          </CircleMarker>
        )}

        {/* =====================================================================
            5. ORIGIN & DESTINATION IN-SITU MARKERS (Pure Typography Halos)
        ===================================================================== */}
        {activeRoute?.checkpoints && activeRoute.checkpoints.length > 0 && (
          <>
            {/* Origin */}
            <CircleMarker
              center={[activeRoute.checkpoints[0].lat, activeRoute.checkpoints[0].lon]}
              radius={6}
              pathOptions={{
                fillColor: '#10b981',
                fillOpacity: 1,
                color: '#ffffff',
                weight: 2,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>
                <div className="carto-halo-text text-[10px] sm:text-[11px] font-mono font-extrabold text-emerald-400 select-none">
                  ▲ <span className="hidden sm:inline">ORIGIN: </span><span className="text-white">{origin || activeRoute.checkpoints[0]?.name || 'Origin'}</span>
                  <span className="text-slate-300 font-normal hidden sm:inline">
                    {' '}(Dep: {activeRoute.checkpoints[0]?.eta_iso ? new Date(activeRoute.checkpoints[0].eta_iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Now'})
                  </span>
                </div>
              </Tooltip>
            </CircleMarker>

            {/* Destination */}
            <CircleMarker
              center={[
                activeRoute.checkpoints[activeRoute.checkpoints.length - 1].lat,
                activeRoute.checkpoints[activeRoute.checkpoints.length - 1].lon,
              ]}
              radius={6}
              pathOptions={{
                fillColor: '#f43f5e',
                fillOpacity: 1,
                color: '#ffffff',
                weight: 2,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>
                <div className="carto-halo-text text-[10px] sm:text-[11px] font-mono font-extrabold text-rose-400 select-none">
                  ▼ <span className="hidden sm:inline">DESTINATION: </span><span className="text-white">{destination || activeRoute.checkpoints[activeRoute.checkpoints.length - 1]?.name || 'Destination'}</span>
                  <span className="text-emerald-300 font-normal hidden sm:inline">
                    {' '}(ETA: {activeRoute.checkpoints[activeRoute.checkpoints.length - 1]?.eta_iso ? new Date(activeRoute.checkpoints[activeRoute.checkpoints.length - 1].eta_iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '--:--'})
                  </span>
                </div>
              </Tooltip>
            </CircleMarker>
          </>
        )}
      </MapContainer>
    </div>
  );
}
