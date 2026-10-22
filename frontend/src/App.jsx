import React, { useState, useEffect } from 'react';
import {
  Navigation,
  ShieldCheck,
  Truck,
  AlertCircle,
  Wifi,
  WifiOff,
  Sparkles,
  Info,
} from 'lucide-react';
import DispatchControlPanel from './components/DispatchControlPanel';
import RouteMap from './components/RouteMap';
import ForecastSliderBar from './components/ForecastSliderBar';
import RouteSummaryCards from './components/RouteSummaryCards';
import RiskRulesLegend from './components/RiskRulesLegend';
import { checkHealth, analyzeRoutes } from './services/api';
import { RISK_LEVELS } from './utils/constants';

// Get current local datetime in YYYY-MM-DDTHH:mm format for input
const getDefaultDepartureTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export default function App() {
  const [origin, setOrigin] = useState('Chicago, IL');
  const [destination, setDestination] = useState('Denver, CO');
  const [departureTime, setDepartureTime] = useState(getDefaultDepartureTime());
  const [loadWeight, setLoadWeight] = useState(45000);
  const [checkpointInterval, setCheckpointInterval] = useState(50);
  const [stormStressTest, setStormStressTest] = useState(false);

  // Data & Selection States
  const [analysisData, setAnalysisData] = useState(null);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  // Heatmap & Slider States
  const [forecastHour, setForecastHour] = useState(0);
  const [heatmapMode, setHeatmapMode] = useState('risk'); // 'risk' | 'wind' | 'precip'
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.75);
  const [heatmapVisible, setHeatmapVisible] = useState(true);

  // Check Backend Health on mount
  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  // Run initial analysis on first load
  useEffect(() => {
    handleAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Ensure departure time is in UTC ISO string format for backend
      const isoDeparture = new Date(departureTime).toISOString();

      const data = await analyzeRoutes({
        origin,
        destination,
        departureTime: isoDeparture,
        loadWeight,
        checkpointInterval,
      });

      // Apply Storm Stress-Test modifications if enabled
      // Elevates wind speeds along alternative corridors to test 30,000 lb / >40,000 lb rules
      let finalRoutes = data.routes || [];
      if (stormStressTest && finalRoutes.length >= 2) {
        finalRoutes = finalRoutes.map((route, rIdx) => {
          if (rIdx === 1) {
            // Add severe storm cell along Route 2
            const updatedCps = route.checkpoints.map((cp, cpIdx) => {
              if (cpIdx >= 4 && cpIdx <= 10) {
                const windMph = 48.5; // In 45-54 mph band
                const isHeavyLoad = loadWeight >= 30000;
                const riskScore = isHeavyLoad ? 5 : 4;
                const riskLevel = isHeavyLoad ? 'No Travel' : 'Severe';
                const reason = `Storm Front: Wind ${windMph} mph + Load ${Number(loadWeight).toLocaleString()} lbs (${isHeavyLoad ? '≥30,000 lbs → No Travel' : 'Severe'})`;

                return {
                  ...cp,
                  weather: { ...cp.weather, wind_mph: windMph },
                  risk: {
                    ...cp.risk,
                    risk_score: riskScore,
                    risk_level: riskLevel,
                    hazard_reason: reason,
                  },
                };
              }
              return cp;
            });

            // Recalculate summary
            const noTravelM = updatedCps.filter((c) => c.risk.risk_score === 5).reduce((acc, c) => acc + c.segment_miles, 0);
            const severeM = updatedCps.filter((c) => c.risk.risk_score === 4).reduce((acc, c) => acc + c.segment_miles, 0);

            return {
              ...route,
              checkpoints: updatedCps,
              summary: {
                ...route.summary,
                no_travel_miles: Math.round(noTravelM),
                severe_miles: Math.round(severeM),
                average_risk_score: 2.8,
              },
            };
          }
          return route;
        });
      }

      setAnalysisData({ ...data, routes: finalRoutes });
      setActiveRouteId(data.recommended_route_id || finalRoutes[0]?.id);
      setBackendStatus('online');
    } catch (err) {
      console.error('Route analysis failed:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to connect to Django routing service. Ensure backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-[600]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Weather-Aware Truck Routing
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[10px] font-bold uppercase tracking-wider">
                  Spotter Fleet AI
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                Corridor Weather Risk Sampling, Truck Load Engine & 0–48h Heatmap
              </p>
            </div>
          </div>

          {/* Backend Status Indicator */}
          <div className="flex items-center gap-2 text-xs">
            {backendStatus === 'online' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <Wifi className="w-3.5 h-3.5" />
                <span>Django API: Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Django API: Connecting / Port 8000</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Control Panel & Rules Reference */}
        <div className="lg:col-span-4 space-y-5 flex flex-col">
          <DispatchControlPanel
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            departureTime={departureTime}
            setDepartureTime={setDepartureTime}
            loadWeight={loadWeight}
            setLoadWeight={setLoadWeight}
            checkpointInterval={checkpointInterval}
            setCheckpointInterval={setCheckpointInterval}
            stormStressTest={stormStressTest}
            setStormStressTest={setStormStressTest}
            onSubmit={handleAnalyze}
            isLoading={isLoading}
          />

          <RiskRulesLegend />
        </div>

        {/* Right Column: Summaries & Map Area */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-bold">Error executing analysis:</span> {error}
                <div className="mt-1 text-[11px] text-gray-400">
                  Make sure the Django backend is running at <code>http://127.0.0.1:8000</code>.
                </div>
              </div>
            </div>
          )}

          {/* 3-Route Summary Comparison Cards */}
          <RouteSummaryCards
            routes={analysisData?.routes || []}
            activeRouteId={activeRouteId}
            setActiveRouteId={setActiveRouteId}
          />

          {/* Interactive Map with Canvas Heatmap & Floating 0-48h Slider */}
          <div className="relative flex-1 min-h-[580px] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
            <RouteMap
              routes={analysisData?.routes || []}
              activeRouteId={activeRouteId}
              setActiveRouteId={setActiveRouteId}
              forecastHour={forecastHour}
              heatmapMode={heatmapMode}
              heatmapOpacity={heatmapOpacity}
              heatmapVisible={heatmapVisible}
            />

            {/* Floating 0-48h Forecast Slider Bar */}
            <ForecastSliderBar
              departureTime={analysisData?.departure_time || departureTime}
              forecastHour={forecastHour}
              setForecastHour={setForecastHour}
              heatmapMode={heatmapMode}
              setHeatmapMode={setHeatmapMode}
              opacity={heatmapOpacity}
              setOpacity={setHeatmapOpacity}
              visible={heatmapVisible}
              setVisible={setHeatmapVisible}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-gray-950 py-3 text-center text-xs text-gray-500">
        Weather-Aware Truck Routing Assessment • Built with React, Vite, Tailwind CSS, Leaflet & Django REST Framework
      </footer>
    </div>
  );
}
