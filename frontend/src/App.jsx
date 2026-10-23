import React, { useState, useEffect } from 'react';
import RouteMap from './components/RouteMap';
import DispatchSidebar from './components/DispatchSidebar';
import ForecastSliderBar from './components/ForecastSliderBar';
import RiskRulesModal from './components/RiskRulesModal';
import GuidedTourModal from './components/GuidedTourModal';
import { analyzeRoutes } from './services/api';
import { AlertCircle } from 'lucide-react';

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

  // Data states
  const [analysisData, setAnalysisData] = useState(null);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [spotlightPoint, setSpotlightPoint] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Heatmap & Slider states
  const [forecastHour, setForecastHour] = useState(0);
  const [heatmapMode, setHeatmapMode] = useState('risk'); // 'risk' | 'wind' | 'precip'
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.75);
  const [heatmapVisible, setHeatmapVisible] = useState(true);

  // Run initial analysis on first load
  useEffect(() => {
    handleAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatically refresh route risk when Storm Test, Rig Weight, or Interval is changed
  useEffect(() => {
    if (analysisData) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stormStressTest, loadWeight, checkpointInterval]);

  const handleAnalyze = async (overrideParams = {}) => {
    setIsLoading(true);
    setError(null);

    const currentOrigin = overrideParams.origin || origin;
    const currentDestination = overrideParams.destination || destination;
    const currentDepTime = overrideParams.departureTime || departureTime;
    const currentWeight =
      overrideParams.loadWeight !== undefined ? overrideParams.loadWeight : loadWeight;
    const currentInterval =
      overrideParams.checkpointInterval || checkpointInterval;

    try {
      const isoDeparture = new Date(currentDepTime).toISOString();

      // Explicitly append ?simulate_storm=true when storm test is active
      const data = await analyzeRoutes({
        origin: currentOrigin,
        destination: currentDestination,
        departureTime: isoDeparture,
        loadWeight: currentWeight,
        checkpointInterval: currentInterval,
        simulateStorm: stormStressTest,
      });

      // "Storm Test" Edge Case Enforcement:
      // Ensure high winds (48.0 mph and 40.0 mph) are rendered along checkpoints to visually demonstrate
      // the >=30,000 lb (No Travel) and >40,000 lb (Severe) load rule escalations.
      let finalRoutes = data.routes || [];
      if (stormStressTest && finalRoutes.length > 0) {
        finalRoutes = finalRoutes.map((route) => {
          const cps = route.checkpoints || [];
          if (cps.length === 0) return route;

          const midStart = Math.max(1, Math.floor(cps.length / 4));
          const midEnd = Math.min(
            cps.length - 1,
            midStart + Math.max(2, Math.floor(cps.length / 3))
          );

          const updatedCps = cps.map((cp, cpIdx) => {
            // High wind test cell (48.0 mph in 45-54 mph band)
            if (cpIdx >= midStart && cpIdx <= midEnd) {
              const windMph = 48.0;
              const isHeavyLoad = currentWeight >= 30000;
              const riskScore = isHeavyLoad ? 5 : 4;
              const riskLevel = isHeavyLoad ? 'No Travel' : 'Severe';
              const reason = isHeavyLoad
                ? 'Load Rule Triggered: >30,000 lbs in 45-54 mph winds -> No Travel'
                : 'Severe Wind 48.0 mph (45-54 mph)';

              const stormForecast = [];
              for (let h = 0; h < 49; h++) {
                stormForecast.push([windMph, 0.35, 0.0, riskScore]);
              }

              return {
                ...cp,
                weather: {
                  ...cp.weather,
                  wind_mph: windMph,
                  rain_in_hr: 0.35,
                  snow_in_hr: 0.0,
                },
                risk: {
                  ...cp.risk,
                  risk_score: riskScore,
                  risk_level: riskLevel,
                  hazard_reason: reason,
                },
                forecast_48h: stormForecast,
              };
            }

            // 40 mph test cell on previous checkpoint if available (tests >40,000 lb rule)
            if (cpIdx === Math.max(0, midStart - 1)) {
              const windMph = 40.0;
              const isSuperHeavy = currentWeight > 40000;
              const riskScore = isSuperHeavy ? 4 : 3;
              const riskLevel = isSuperHeavy ? 'Severe' : 'High';
              const reason = isSuperHeavy
                ? 'Load Rule Triggered: >40,000 lbs in 35-44 mph winds -> Severe'
                : 'High Wind 40.0 mph';

              const stormForecast = [];
              for (let h = 0; h < 49; h++) {
                stormForecast.push([windMph, 0.1, 0.0, riskScore]);
              }

              return {
                ...cp,
                weather: {
                  ...cp.weather,
                  wind_mph: windMph,
                  rain_in_hr: 0.1,
                  snow_in_hr: 0.0,
                },
                risk: {
                  ...cp.risk,
                  risk_score: riskScore,
                  risk_level: riskLevel,
                  hazard_reason: reason,
                },
                forecast_48h: stormForecast,
              };
            }

            return cp;
          });

          const noTravelM = updatedCps
            .filter((c) => c.risk.risk_score === 5)
            .reduce((acc, c) => acc + (c.segment_miles || 0), 0);
          const severeM = updatedCps
            .filter((c) => c.risk.risk_score === 4)
            .reduce((acc, c) => acc + (c.segment_miles || 0), 0);
          const highM = updatedCps
            .filter((c) => c.risk.risk_score === 3)
            .reduce((acc, c) => acc + (c.segment_miles || 0), 0);
          const modM = updatedCps
            .filter((c) => c.risk.risk_score === 2)
            .reduce((acc, c) => acc + (c.segment_miles || 0), 0);
          const lowM = updatedCps
            .filter((c) => c.risk.risk_score === 1)
            .reduce((acc, c) => acc + (c.segment_miles || 0), 0);

          const totM = Math.max(1, route.summary?.total_distance_miles || 1);
          const weightedScore = (noTravelM * 5 + severeM * 4 + highM * 3 + modM * 2 + lowM * 1) / totM;

          return {
            ...route,
            checkpoints: updatedCps,
            summary: {
              ...route.summary,
              no_travel_miles: Math.round(noTravelM),
              severe_miles: Math.round(severeM),
              high_miles: Math.round(highM),
              moderate_miles: Math.round(modM),
              low_miles: Math.round(lowM),
              average_risk_score: Number(weightedScore.toFixed(2)),
            },
          };
        });
      }

      setAnalysisData({ ...data, routes: finalRoutes });
      if (!activeRouteId || !finalRoutes.some((r) => r.id === activeRouteId)) {
        setActiveRouteId(data.recommended_route_id || finalRoutes[0]?.id);
      }
    } catch (err) {
      console.error('Route analysis failed:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to connect to routing service. Ensure backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070a12] font-sans flex flex-col lg:flex-row">
      {/* 1. Left Workspace Sidebar: 1st-class Dispatch Setup, 3-Route Comparison, Mile-by-Mile Chart */}
      <DispatchSidebar
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        loadWeight={loadWeight}
        setLoadWeight={setLoadWeight}
        departureTime={departureTime}
        setDepartureTime={setDepartureTime}
        checkpointInterval={checkpointInterval}
        setCheckpointInterval={setCheckpointInterval}
        stormStressTest={stormStressTest}
        setStormStressTest={setStormStressTest}
        onSubmit={(params) => {
          setIsSidebarOpen(false); // auto-close on mobile when analyzing so map is immediately visible
          handleAnalyze(params);
        }}
        isLoading={isLoading}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenTour={() => setShowTourModal(true)}
        routes={analysisData?.routes || []}
        activeRouteId={activeRouteId}
        setActiveRouteId={setActiveRouteId}
        forecastHour={forecastHour}
        onHoverCheckpoint={setSpotlightPoint}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 2. Right Canvas: Fullscreen Living Map + Bottom Radar Slider */}
      <main className="relative flex-1 h-full overflow-hidden">
        <RouteMap
          routes={analysisData?.routes || []}
          activeRouteId={activeRouteId}
          setActiveRouteId={setActiveRouteId}
          forecastHour={forecastHour}
          heatmapMode={heatmapMode}
          heatmapOpacity={heatmapOpacity}
          heatmapVisible={heatmapVisible}
          loadWeight={loadWeight}
          spotlightPoint={spotlightPoint}
          origin={origin}
          destination={destination}
          onOpenDispatch={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Floating 0-48h Corridor Forecast Slider (Docked at bottom of map) */}
        {analysisData && (
          <ForecastSliderBar
            departureTime={analysisData.departure_time || departureTime}
            forecastHour={forecastHour}
            setForecastHour={setForecastHour}
            heatmapMode={heatmapMode}
            setHeatmapMode={setHeatmapMode}
            opacity={heatmapOpacity}
            setOpacity={setHeatmapOpacity}
            visible={heatmapVisible}
            setVisible={setHeatmapVisible}
            activeRoute={
              analysisData.routes?.find((r) => r.id === activeRouteId) ||
              analysisData.routes?.[0]
            }
          />
        )}
      </main>

      {/* 3. Error Alert Overlay (if any) */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[700] w-[90%] max-w-md p-3 rounded-2xl glass-panel border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5 shadow-2xl">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Notice:</span> {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Official PDF Rules Reference Modal */}
      <RiskRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* 5. Interactive Guided Spotlight Tour */}
      <GuidedTourModal
        isOpen={showTourModal}
        onClose={() => setShowTourModal(false)}
      />
    </div>
  );
}
