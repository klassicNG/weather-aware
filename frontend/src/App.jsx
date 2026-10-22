import React, { useState, useEffect } from 'react';
import GlassTopNav from './components/GlassTopNav';
import RouteMap from './components/RouteMap';
import DriverDecisionCard from './components/DriverDecisionCard';
import ForecastSliderBar from './components/ForecastSliderBar';
import RiskRulesModal from './components/RiskRulesModal';
import { checkHealth, analyzeRoutes } from './services/api';
import { AlertCircle, WifiOff } from 'lucide-react';

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

  // Automatically refresh route risk when Storm Test or Rig Weight is changed
  useEffect(() => {
    if (analysisData) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stormStressTest, loadWeight]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const isoDeparture = new Date(departureTime).toISOString();

      const data = await analyzeRoutes({
        origin,
        destination,
        departureTime: isoDeparture,
        loadWeight,
        checkpointInterval,
      });

      // Apply Storm Stress-Test simulation if enabled (simulates high winds to test 30k/40k lb overrides)
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
    <div className="relative w-screen h-screen overflow-hidden bg-[#070a12] font-sans">
      {/* 1. Fullscreen Living Map Backdrop */}
      <RouteMap
        routes={analysisData?.routes || []}
        activeRouteId={activeRouteId}
        setActiveRouteId={setActiveRouteId}
        forecastHour={forecastHour}
        heatmapMode={heatmapMode}
        heatmapOpacity={heatmapOpacity}
        heatmapVisible={heatmapVisible}
      />

      {/* 2. Floating Frosted Glass Navigation Bar */}
      <GlassTopNav
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        loadWeight={loadWeight}
        setLoadWeight={setLoadWeight}
        stormStressTest={stormStressTest}
        setStormStressTest={setStormStressTest}
        onSubmit={handleAnalyze}
        isLoading={isLoading}
        onOpenRules={() => setShowRulesModal(true)}
      />

      {/* 3. Driver's Safety Decision Card */}
      {analysisData && (
        <DriverDecisionCard
          routes={analysisData.routes || []}
          activeRouteId={activeRouteId}
          setActiveRouteId={setActiveRouteId}
          loadWeight={loadWeight}
        />
      )}

      {/* 4. Floating 0-48h Corridor Forecast Slider */}
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
          activeRoute={analysisData.routes?.find((r) => r.id === activeRouteId) || analysisData.routes?.[0]}
        />
      )}

      {/* 5. Error Alert Overlay (if any) */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[700] w-[90%] max-w-md p-3 rounded-2xl glass-panel border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5 shadow-2xl">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Connection notice:</span> {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* 6. Official PDF Rules Reference Modal */}
      <RiskRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
}
