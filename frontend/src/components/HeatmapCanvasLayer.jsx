import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Helper to interpolate RGB colors
function interpolateColor(c1, c2, factor) {
  return [
    Math.round(c1[0] + factor * (c2[0] - c1[0])),
    Math.round(c1[1] + factor * (c2[1] - c1[1])),
    Math.round(c1[2] + factor * (c2[2] - c1[2])),
  ];
}

const RISK_PALETTE = [
  [16, 185, 129],  // 1: Low (Emerald)
  [245, 158, 11],  // 2: Moderate (Amber)
  [249, 115, 22],  // 3: High (Orange)
  [239, 68, 68],   // 4: Severe (Red)
  [190, 18, 60],   // 5: No Travel (Magenta/Rose)
];

export default function HeatmapCanvasLayer({
  routes = [],
  activeRouteId = null,
  forecastHour = 0,
  heatmapMode = 'risk', // 'risk' | 'wind' | 'precip'
  opacity = 0.75,
  visible = true,
}) {
  const map = useMap();
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Create a Leaflet custom pane or container for canvas
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '350';
      canvas.style.transition = 'opacity 0.15s ease-out';
      map.getPanes().overlayPane.appendChild(canvas);
      canvasRef.current = canvas;
    }

    const resizeCanvas = () => {
      const size = map.getSize();
      const bounds = map.getBounds();
      const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
      
      canvas.width = size.x;
      canvas.height = size.y;
      L.DomUtil.setPosition(canvas, topLeft);
    };

    const drawHeatmap = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!visible || opacity <= 0.01) return;

      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;

      const bounds = map.getBounds();
      const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
      L.DomUtil.setPosition(canvas, topLeft);

      // Collect all checkpoints from active route (or all routes)
      const targetRoutes = activeRouteId
        ? routes.filter((r) => r.id === activeRouteId)
        : routes;

      const checkpoints = [];
      targetRoutes.forEach((route) => {
        if (route.checkpoints) {
          route.checkpoints.forEach((cp) => checkpoints.push(cp));
        }
      });

      if (checkpoints.length === 0) return;

      const zoom = map.getZoom();
      // Radius scales with map zoom level
      const baseRadius = Math.max(30, Math.min(95, 20 + (zoom - 4) * 12));

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = 'screen';

      checkpoints.forEach((cp) => {
        const point = map.latLngToContainerPoint([cp.lat, cp.lon]);

        // Don't draw if far offscreen
        if (
          point.x < -baseRadius ||
          point.x > size.x + baseRadius ||
          point.y < -baseRadius ||
          point.y > size.y + baseRadius
        ) {
          return;
        }

        // Extract hour data: [wind_mph, rain_in_hr, snow_in_hr, risk_score]
        const hData =
          cp.forecast_48h && cp.forecast_48h[forecastHour]
            ? cp.forecast_48h[forecastHour]
            : [
                cp.weather?.wind_mph || 10,
                cp.weather?.rain_in_hr || 0,
                cp.weather?.snow_in_hr || 0,
                cp.risk?.risk_score || 1,
              ];

        const [windMph, rainInHr, snowInHr, riskScore] = hData;

        let rgb = [16, 185, 129];
        let intensity = 0.7;

        if (heatmapMode === 'risk') {
          // Continuous interpolation between risk scores 1 and 5
          const clampedScore = Math.max(1, Math.min(5, riskScore));
          const idx = Math.min(3, Math.floor(clampedScore - 1));
          const factor = clampedScore - (idx + 1);
          rgb = interpolateColor(RISK_PALETTE[idx], RISK_PALETTE[idx + 1], factor);
          intensity = 0.5 + (clampedScore / 5.0) * 0.45;
        } else if (heatmapMode === 'wind') {
          // Wind: 0 - 65 mph
          const normalized = Math.min(1.0, Math.max(0, windMph / 60.0));
          if (normalized < 0.35) {
            rgb = [34, 197, 94]; // Green (< 21 mph)
          } else if (normalized < 0.55) {
            rgb = [234, 179, 8]; // Yellow (21-33 mph)
          } else if (normalized < 0.75) {
            rgb = [249, 115, 22]; // Orange (33-45 mph)
          } else {
            rgb = [225, 29, 72]; // Rose/Purple (> 45 mph)
          }
          intensity = 0.4 + normalized * 0.55;
        } else if (heatmapMode === 'precip') {
          // Precip: Rain and Snow
          const totalPrecip = rainInHr + snowInHr;
          const normalized = Math.min(1.0, Math.max(0, totalPrecip / 1.5));
          if (snowInHr > 0.2) {
            rgb = [168, 85, 247]; // Purple for snow
          } else {
            rgb = [59, 130, 246]; // Blue for rain
          }
          intensity = totalPrecip > 0.05 ? 0.5 + normalized * 0.45 : 0.15;
        }

        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          baseRadius
        );

        gradient.addColorStop(
          0,
          `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${intensity})`
        );
        gradient.addColorStop(
          0.5,
          `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${intensity * 0.5})`
        );
        gradient.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, baseRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    };

    const onUpdate = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(drawHeatmap);
    };

    map.on('move', onUpdate);
    map.on('zoom', onUpdate);
    map.on('resize', resizeCanvas);

    // Initial draw
    resizeCanvas();
    onUpdate();

    return () => {
      map.off('move', onUpdate);
      map.off('zoom', onUpdate);
      map.off('resize', resizeCanvas);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [map, routes, activeRouteId, forecastHour, heatmapMode, opacity, visible]);

  // Clean up canvas on unmount
  useEffect(() => {
    return () => {
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, []);

  return null;
}
