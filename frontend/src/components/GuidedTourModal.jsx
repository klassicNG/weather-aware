import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Scale,
  Milestone,
  Sliders,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Sparkles,
} from 'lucide-react';

const TOUR_STEPS = [
  {
    step: 1,
    title: '1. Origin & Destination Corridors',
    badge: 'Step 1 of 5',
    icon: MapPin,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20 border-emerald-500/30',
    headline: 'Enter your freight origin and delivery destination',
    description:
      'Type any city, highway junction, or geographic coordinates. Use the swap button (⇄) to invert direction, or pick from popular pre-configured freight corridors (like Chicago → Denver).',
    tip: 'The routing engine guarantees 3 distinct alternative corridors for every dispatch query.',
  },
  {
    step: 2,
    title: '2. Synchronized Departure Time',
    badge: 'Step 2 of 5',
    icon: Calendar,
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/20 border-sky-500/30',
    headline: 'Weather forecasts are timed to your exact arrival',
    description:
      'Unlike static weather apps, Spotter AI calculates the exact ETA at every 10–50 mile marker. As your truck travels down interstate highways, the weather evaluated is the forecast for when you physically arrive at that checkpoint.',
    tip: 'Click "+0h Now" to immediately use current local departure time.',
  },
  {
    step: 3,
    title: '3. Truck Load Weight Compliance',
    badge: 'Step 3 of 5',
    icon: Scale,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20 border-amber-500/30',
    headline: 'Strict enforcement of Spotter AI load rules',
    description:
      'Heavy rigs face extreme rollover danger in high crosswinds. Entering your load weight activates strict compliance rules:',
    bulletPoints: [
      'Winds ≥55 mph → Mandatory No Travel for all rigs.',
      'Winds 45–54 mph + Load >30,000 lbs → Escalates to No Travel (Mandatory Shutdown).',
      'Winds 35–44 mph + Load >40,000 lbs → Escalates to Severe Hazard.',
    ],
    tip: 'Quick chips let you test 20k (Empty), 30k (Loaded), and 45k (Max Gross) in one click.',
  },
  {
    step: 4,
    title: '4. Checkpoint Sampling Interval',
    badge: 'Step 4 of 5',
    icon: Milestone,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20 border-purple-500/30',
    headline: 'Control weather evaluation resolution',
    description:
      'Select between 10 miles (dense, high-precision checkpoints through mountain passes), 25 miles (balanced), or 50 miles (interstate standard) sampling intervals.',
    tip: 'Checkpoints display exact wind, rain, and snow conditions on hover and click.',
  },
  {
    step: 5,
    title: '5. Compare 3 Routes & 0–48h Timeline Radar',
    badge: 'Step 5 of 5',
    icon: Sliders,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20 border-cyan-500/30',
    headline: 'All 3 routes rendered simultaneously on the map',
    description:
      'The safest recommended corridor glows in bold Emerald, while alternative corridors are displayed in dashed Slate. Scrub the bottom 0–48h timeline slider to evaluate whether delaying departure avoids dangerous storm cells.',
    tip: 'Toggle "Storm Test" anytime to simulate 48 mph crosswinds and verify weight rule escalations.',
  },
];

export default function GuidedTourModal({ isOpen, onClose }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const IconComponent = currentStep.icon;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/10 text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white tracking-tight">
                  Spotter AI Guided Tour
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {currentStep.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Weather-aware routing & load weight safety compliance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Close Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Body */}
        <div className="space-y-4 my-2 text-xs">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-2xl border ${currentStep.iconBg} ${currentStep.iconColor} shrink-0 shadow-lg`}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-extrabold text-white leading-snug">
                {currentStep.headline}
              </h4>
              <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Bullet points if present (Step 3 load rules) */}
          {currentStep.bulletPoints && (
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/5 space-y-1.5 font-mono text-[11px]">
              {currentStep.bulletPoints.map((bp, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-200">
                  <span className="text-amber-400 font-bold shrink-0">▸</span>
                  <span>{bp}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pro Tip Box */}
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-200 text-xs flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-[11px] leading-normal">{currentStep.tip}</span>
          </div>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 my-4">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'w-6 bg-sky-400'
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3.5 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition-all"
            >
              <span>{isLastStep ? 'Start Routing' : 'Next Step'}</span>
              {isLastStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
