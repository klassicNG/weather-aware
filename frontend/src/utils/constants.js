export const RISK_LEVELS = {
  1: {
    name: 'Low',
    score: 1,
    color: '#10b981', // emerald-500
    bgClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    dotClass: 'bg-emerald-500',
    description: 'Safe driving conditions (<25 mph wind, <0.1 in/hr rain, <0.5 in/hr snow)',
  },
  2: {
    name: 'Moderate',
    score: 2,
    color: '#f59e0b', // amber-500
    bgClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    dotClass: 'bg-amber-500',
    description: 'Advisory conditions (25-34 mph wind, 0.10-0.25 in/hr rain, 0.5-1.0 in/hr snow)',
  },
  3: {
    name: 'High',
    score: 3,
    color: '#f97316', // orange-500
    bgClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    dotClass: 'bg-orange-500',
    description: 'Elevated risk (35-44 mph wind, 0.25-0.50 in/hr rain, 1.0-2.0 in/hr snow)',
  },
  4: {
    name: 'Severe',
    score: 4,
    color: '#ef4444', // red-500
    bgClass: 'bg-red-500/20 text-red-400 border-red-500/40',
    dotClass: 'bg-red-500',
    description: 'Hazardous conditions (45-54 mph wind, 0.50-1.00 in/hr rain, 2.0-3.0 in/hr snow or 35-44 mph + >40,000 lbs)',
  },
  5: {
    name: 'No Travel',
    score: 5,
    color: '#be123c', // rose-700 / magenta
    bgClass: 'bg-rose-900/40 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-900/40',
    dotClass: 'bg-rose-500',
    description: 'Critical shutdown (>=55 mph wind, 45-54 mph + >=30,000 lbs, >1.00 in/hr rain, >3.0 in/hr snow)',
  },
};

export const CORRIDOR_PRESETS = [
  {
    name: 'Chicago → Denver',
    origin: 'Chicago, IL',
    destination: 'Denver, CO',
    tag: 'Plains Interstate (I-80/I-76)',
  },
  {
    name: 'Dallas → Minneapolis',
    origin: 'Dallas, TX',
    destination: 'Minneapolis, MN',
    tag: 'Central Corridor (I-35)',
  },
  {
    name: 'Seattle → Salt Lake City',
    origin: 'Seattle, WA',
    destination: 'Salt Lake City, UT',
    tag: 'Mountain Passes (I-84/I-15)',
  },
  {
    name: 'Atlanta → New York',
    origin: 'Atlanta, GA',
    destination: 'New York, NY',
    tag: 'Eastern Seaboard (I-85/I-95)',
  },
];

export const LOAD_PRESETS = [
  { weight: 20000, label: '20,000 lb (Light)', desc: 'Standard risk limits' },
  { weight: 30000, label: '30,000 lb (Threshold)', desc: 'Triggers 45-54 mph No Travel' },
  { weight: 45000, label: '45,000 lb (Heavy)', desc: 'Triggers 35-44 mph Severe & No Travel' },
];

export const INTERVAL_OPTIONS = [
  { value: 10, label: '10 miles', badge: 'High Detail' },
  { value: 25, label: '25 miles', badge: 'Balanced' },
  { value: 50, label: '50 miles', badge: 'Standard' },
];
