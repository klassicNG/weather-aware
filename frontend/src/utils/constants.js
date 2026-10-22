export const RISK_LEVELS = {
  1: {
    name: 'Safe / Low',
    score: 1,
    color: '#10b981', // emerald-500
    bgClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    dotClass: 'bg-emerald-500',
    description: 'Safe driving conditions (<25 mph wind, <0.1 in/hr rain, <0.5 in/hr snow)',
  },
  2: {
    name: 'Moderate Advisory',
    score: 2,
    color: '#f59e0b', // amber-500
    bgClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dotClass: 'bg-amber-500',
    description: 'Advisory conditions (25-34 mph wind, 0.10-0.25 in/hr rain, 0.5-1.0 in/hr snow)',
  },
  3: {
    name: 'High Risk',
    score: 3,
    color: '#f97316', // orange-500
    bgClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    dotClass: 'bg-orange-500',
    description: 'Elevated risk (35-44 mph wind, 0.25-0.50 in/hr rain, 1.0-2.0 in/hr snow)',
  },
  4: {
    name: 'Severe Hazard',
    score: 4,
    color: '#ef4444', // red-500
    bgClass: 'bg-red-500/20 text-red-300 border-red-500/40',
    dotClass: 'bg-red-500',
    description: 'Hazardous conditions (45-54 mph wind, 0.50-1.00 in/hr rain, 2.0-3.0 in/hr snow, or 35-44 mph + >40,000 lbs)',
  },
  5: {
    name: 'Mandatory Shutdown',
    score: 5,
    color: '#be123c', // rose-700 / magenta
    bgClass: 'bg-rose-950/80 text-rose-200 border-rose-500/60 shadow-lg shadow-rose-900/40',
    dotClass: 'bg-rose-500',
    description: 'No Travel / Emergency shutdown (>=55 mph wind, 45-54 mph + >=30,000 lbs, >1.00 in/hr rain, >3.0 in/hr snow)',
  },
};

export const CORRIDOR_PRESETS = [
  {
    flag: '🇺🇸',
    name: 'Chicago → Denver',
    origin: 'Chicago, IL, USA',
    destination: 'Denver, CO, USA',
    tag: 'USA • I-80 / I-76 Plains Corridor',
  },
  {
    flag: '🇪🇺',
    name: 'Paris → Berlin',
    origin: 'Paris, France',
    destination: 'Berlin, Germany',
    tag: 'Europe • Trans-European Highway',
  },
  {
    flag: '🇬🇧',
    name: 'London → Edinburgh',
    origin: 'London, UK',
    destination: 'Edinburgh, UK',
    tag: 'UK • M1 / A1 Freight Backbone',
  },
  {
    flag: '🇨🇦',
    name: 'Toronto → Montreal',
    origin: 'Toronto, ON, Canada',
    destination: 'Montreal, QC, Canada',
    tag: 'Canada • Highway 401 Corridor',
  },
  {
    flag: '🇦🇺',
    name: 'Sydney → Melbourne',
    origin: 'Sydney, NSW, Australia',
    destination: 'Melbourne, VIC, Australia',
    tag: 'Australia • Hume Highway',
  },
  {
    flag: '🇲🇽',
    name: 'Mexico City → Monterrey',
    origin: 'Mexico City, Mexico',
    destination: 'Monterrey, Mexico',
    tag: 'Mexico • Highway 57 North',
  },
];

export const LOAD_PRESETS = [
  { weight: 20000, label: '20k Empty', desc: 'Light/bobtail trailer' },
  { weight: 30000, label: '30k Loaded', desc: 'Triggers 45-54 mph shutdown' },
  { weight: 45000, label: '45k Max Gross', desc: 'Triggers 35-44 mph severe' },
];
