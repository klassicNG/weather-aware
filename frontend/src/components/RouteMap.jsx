import React, { useEffect } from 'react';
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
import { RISK_LEVELS } from '../utils/constants';
import { Clock, Wind, CloudRain, Snowflake, AlertTriangle, ShieldCheck } from 'lucide-react';

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
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 8 });
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
}) {
  const activeRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  return (
    <div className="absolute inset-0 w-full h-full bg-[#070a12] overflow-hidden">
      <MapContainer
        center={[39.8283, -98.5795]} // Center of USA
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full"
        attributionControl={false}
      >
        {/* Esri World Dark Gray Canvas: 100% Free, Zero Watermarks, Sleek Dark Minimalist */}
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

        {/* Polylines for all 3 routes */}
        {routes.map((route) => {
          const isSelected = route.id === activeRoute?.id;
          const coords = route.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || [];
          if (coords.length === 0) return null;

          return (
            <React.Fragment key={route.id}>
              {/* Outer glow line for selected route */}
              {isSelected && (
                <Polyline
                  positions={coords}
                  pathOptions={{
                    color: route.is_recommended ? '#0284c7' : '#0ea5e9',
                    weight: 10,
                    opacity: 0.35,
                    lineCap: 'round',
                  }}
                />
              )}

              {/* Main polyline */}
              <Polyline
                positions={coords}
                pathOptions={{
                  color: isSelected
                    ? (route.is_recommended ? '#38bdf8' : '#38bdf8')
                    : '#475569',
                  weight: isSelected ? 5.5 : 3,
                  opacity: isSelected ? 0.95 : 0.4,
                  dashArray: isSelected ? null : '5, 8',
                }}
                eventHandlers={{
                  click: () => setActiveRouteId && setActiveRouteId(route.id),
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs font-sans p-1">
                    <span className="font-bold text-white">{route.name}</span>
                    {route.is_recommended && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        RECOMMENDED
                      </span>
                    )}
                    <div className="text-gray-400 text-[11px] mt-0.5">
                      {route.summary?.total_distance_miles} mi • {route.summary?.total_duration_hours} hrs
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* Checkpoint Markers for the Selected Route */}
        {activeRoute &&
          activeRoute.checkpoints?.map((cp, idx) => {
            const riskScore = cp.risk?.risk_score || 1;
            const riskInfo = RISK_LEVELS[riskScore] || RISK_LEVELS[1];
            const isHazard = riskScore >= 2;
            const isCritical = riskScore >= 4;

            return (
              <CircleMarker
                key={`${activeRoute.id}-cp-${cp.id || idx}`}
                center={[cp.lat, cp.lon]}
                radius={isCritical ? 7.5 : isHazard ? 5.5 : 3.5}
                pathOptions={{
                  fillColor: riskInfo.color,
                  fillOpacity: isHazard ? 1.0 : 0.6,
                  color: isCritical ? '#ffffff' : '#0f172a',
                  weight: isCritical ? 2.5 : 1,
                }}
              >
                <Popup>
                  <div className="min-w-[230px] text-xs font-sans text-slate-100">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                      <div className="font-bold text-sm text-white">
                        {cp.name || `Mile ${cp.distance_from_origin_miles}`}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskInfo.bgClass}`}
                      >
                        {riskInfo.name}
                      </span>
                    </div>

                    {/* ETA & Distance */}
                    <div className="flex items-center justify-between text-slate-300 text-[11px] mb-2.5">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <span>
                          {new Date(cp.eta_iso).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400">
                        Mile {cp.distance_from_origin_miles}
                      </span>
                    </div>

                    {/* Conditions Box */}
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1.5">
                      <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px]">
                        <div className="bg-slate-800/60 p-1.5 rounded-lg">
                          <Wind className="w-3.5 h-3.5 mx-auto text-amber-400 mb-0.5" />
                          <div className="font-bold text-slate-200">{cp.weather?.wind_mph}</div>
                          <div className="text-[9px] text-slate-500">mph</div>
                        </div>
                        <div className="bg-slate-800/60 p-1.5 rounded-lg">
                          <CloudRain className="w-3.5 h-3.5 mx-auto text-sky-400 mb-0.5" />
                          <div className="font-bold text-slate-200">{cp.weather?.rain_in_hr}</div>
                          <div className="text-[9px] text-slate-500">in/h</div>
                        </div>
                        <div className="bg-slate-800/60 p-1.5 rounded-lg">
                          <Snowflake className="w-3.5 h-3.5 mx-auto text-purple-400 mb-0.5" />
                          <div className="font-bold text-slate-200">{cp.weather?.snow_in_hr}</div>
                          <div className="text-[9px] text-slate-500">in/h</div>
                        </div>
                      </div>

                      {cp.risk?.hazard_reason && (
                        <div className="text-[11px] text-slate-300 pt-1.5 border-t border-white/5 leading-relaxed">
                          {cp.risk.hazard_reason}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}
