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
import { AlertTriangle, Clock, Wind, CloudRain, Snowflake, ShieldAlert } from 'lucide-react';

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
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
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
    <div className="relative w-full h-full min-h-[550px] bg-gray-950 overflow-hidden">
      <MapContainer
        center={[39.8283, -98.5795]} // Center of USA
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        attributionControl={false}
      >
        {/* CartoDB Dark Matter Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <MapAutoFitter routes={routes} />

        {/* In-Memory Thermal Heatmap Layer */}
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
          const isSelected = route.id === (activeRoute?.id);
          const coords = route.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || [];
          if (coords.length === 0) return null;

          // Determine polyline color based on recommendation or max risk
          const baseColor = route.is_recommended ? '#3b82f6' : '#64748b';

          return (
            <React.Fragment key={route.id}>
              {/* Outer stroke for selected route (glowing highlight) */}
              {isSelected && (
                <Polyline
                  positions={coords}
                  pathOptions={{
                    color: '#60a5fa',
                    weight: 8,
                    opacity: 0.6,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              )}

              {/* Main polyline */}
              <Polyline
                positions={coords}
                pathOptions={{
                  color: isSelected ? (route.is_recommended ? '#2563eb' : '#38bdf8') : baseColor,
                  weight: isSelected ? 5 : 3.5,
                  opacity: isSelected ? 0.95 : 0.45,
                  dashArray: isSelected ? null : '6, 6',
                }}
                eventHandlers={{
                  click: () => setActiveRouteId && setActiveRouteId(route.id),
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs font-sans">
                    <span className="font-bold">{route.name}</span>
                    {route.is_recommended && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                        RECOMMENDED
                      </span>
                    )}
                    <div className="text-gray-400 mt-0.5">
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
            const isNoTravelOrSevere = riskScore >= 4;

            // Weather forecast at current slider hour
            const forecastAtHour =
              cp.forecast_48h && cp.forecast_48h[forecastHour]
                ? cp.forecast_48h[forecastHour]
                : [
                    cp.weather?.wind_mph || 0,
                    cp.weather?.rain_in_hr || 0,
                    cp.weather?.snow_in_hr || 0,
                    cp.risk?.risk_score || 1,
                  ];

            return (
              <CircleMarker
                key={`${activeRoute.id}-cp-${cp.id || idx}`}
                center={[cp.lat, cp.lon]}
                radius={isNoTravelOrSevere ? 7 : 5}
                pathOptions={{
                  fillColor: riskInfo.color,
                  fillOpacity: 0.95,
                  color: isNoTravelOrSevere ? '#ffffff' : '#1e293b',
                  weight: isNoTravelOrSevere ? 2 : 1.5,
                }}
              >
                <Popup>
                  <div className="text-gray-100 min-w-[240px] text-xs font-sans">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-700/80 pb-2 mb-2">
                      <span className="font-bold text-sm text-white">
                        {cp.name || `Checkpoint ${idx + 1}`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${riskInfo.bgClass}`}
                      >
                        {riskInfo.name} ({riskScore}/5)
                      </span>
                    </div>

                    {/* ETA & Distance */}
                    <div className="grid grid-cols-2 gap-2 mb-2 text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>ETA: {new Date(cp.eta_iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-gray-400">Dist:</span>
                        <span className="font-semibold">{cp.distance_from_origin_miles} mi</span>
                      </div>
                    </div>

                    {/* Active Conditions at ETA */}
                    <div className="bg-gray-900/90 rounded-lg p-2.5 border border-gray-800 space-y-1.5">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Conditions at Arrival:
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px]">
                        <div className="bg-gray-800/60 p-1 rounded">
                          <Wind className="w-3 h-3 mx-auto text-amber-400 mb-0.5" />
                          <div>{cp.weather?.wind_mph} mph</div>
                        </div>
                        <div className="bg-gray-800/60 p-1 rounded">
                          <CloudRain className="w-3 h-3 mx-auto text-blue-400 mb-0.5" />
                          <div>{cp.weather?.rain_in_hr} in/h</div>
                        </div>
                        <div className="bg-gray-800/60 p-1 rounded">
                          <Snowflake className="w-3 h-3 mx-auto text-purple-400 mb-0.5" />
                          <div>{cp.weather?.snow_in_hr} in/h</div>
                        </div>
                      </div>

                      {/* Hazard explanation */}
                      {cp.risk?.hazard_reason && (
                        <div className="text-[11px] text-gray-300 italic pt-1 border-t border-gray-800">
                          {cp.risk.hazard_reason}
                        </div>
                      )}
                    </div>

                    {/* Slider Hour Status */}
                    {forecastHour > 0 && (
                      <div className="mt-2 text-[10px] text-gray-400 bg-gray-950/70 p-1.5 rounded border border-gray-800">
                        <span className="font-semibold text-blue-400">Forecast at +{forecastHour}h:</span>{' '}
                        {forecastAtHour[0]} mph wind, {forecastAtHour[1]} in rain, {forecastAtHour[2]} in snow
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}
