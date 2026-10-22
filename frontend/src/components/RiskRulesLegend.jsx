import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, AlertOctagon, Scale, ShieldAlert } from 'lucide-react';

export default function RiskRulesLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl text-white">
      {/* Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
            Official Assessment Risk Rules & Load Limits Reference
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
            PDF Specification
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{isOpen ? 'Collapse' : 'Expand Rules'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Table & Rules */}
      {isOpen && (
        <div className="p-5 border-t border-gray-800 space-y-4 text-xs">
          {/* Main Thresholds Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950 text-gray-400 font-mono text-[11px] border-b border-gray-800">
                  <th className="p-2.5 font-semibold">Condition</th>
                  <th className="p-2.5 text-emerald-400 font-semibold">Low (1)</th>
                  <th className="p-2.5 text-amber-400 font-semibold">Moderate (2)</th>
                  <th className="p-2.5 text-orange-400 font-semibold">High (3)</th>
                  <th className="p-2.5 text-red-400 font-semibold">Severe (4)</th>
                  <th className="p-2.5 text-rose-400 font-semibold">No Travel (5)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
                <tr className="hover:bg-gray-800/30">
                  <td className="p-2.5 font-bold text-gray-200 font-sans">Wind (mph)</td>
                  <td className="p-2.5 text-gray-300">&lt; 25 mph</td>
                  <td className="p-2.5 text-gray-300">25–34</td>
                  <td className="p-2.5 text-gray-300">35–44</td>
                  <td className="p-2.5 text-gray-300">45–54</td>
                  <td className="p-2.5 text-rose-300 font-bold">≥ 55 mph</td>
                </tr>
                <tr className="hover:bg-gray-800/30">
                  <td className="p-2.5 font-bold text-gray-200 font-sans">Rain (in/hr)</td>
                  <td className="p-2.5 text-gray-300">&lt; 0.10 in/hr</td>
                  <td className="p-2.5 text-gray-300">0.10–0.25</td>
                  <td className="p-2.5 text-gray-300">0.25–0.50</td>
                  <td className="p-2.5 text-gray-300">0.50–1.00</td>
                  <td className="p-2.5 text-rose-300 font-bold">&gt; 1.00 in/hr</td>
                </tr>
                <tr className="hover:bg-gray-800/30">
                  <td className="p-2.5 font-bold text-gray-200 font-sans">Snow (in/hr)</td>
                  <td className="p-2.5 text-gray-300">&lt; 0.5 in/hr</td>
                  <td className="p-2.5 text-gray-300">0.5–1.0</td>
                  <td className="p-2.5 text-gray-300">1.0–2.0</td>
                  <td className="p-2.5 text-gray-300">2.0–3.0</td>
                  <td className="p-2.5 text-rose-300 font-bold">&gt; 3.0 in/hr</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Load Rules & Preference Ranking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Load Rules */}
            <div className="bg-gray-950/80 p-3.5 rounded-xl border border-gray-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Scale className="w-4 h-4" />
                <span>Truck Load Weight Override Rules:</span>
              </div>
              <ul className="space-y-1.5 text-gray-300 list-disc list-inside text-[11px]">
                <li>
                  <span className="font-mono text-rose-400 font-bold">≥ 55 mph</span> →{' '}
                  <span className="font-bold text-rose-400">No Travel (5)</span> for any load weight.
                </li>
                <li>
                  <span className="font-mono text-orange-400">45–54 mph</span> +{' '}
                  <span className="font-mono text-amber-400 font-bold">≥ 30,000 lb</span> →{' '}
                  <span className="font-bold text-rose-400">No Travel (5)</span>.
                </li>
                <li>
                  <span className="font-mono text-amber-400">35–44 mph</span> +{' '}
                  <span className="font-mono text-amber-400 font-bold">&gt; 40,000 lb</span> →{' '}
                  <span className="font-bold text-red-400">Severe (4)</span>.
                </li>
              </ul>
            </div>

            {/* Tie-breaker Ranking */}
            <div className="bg-gray-950/80 p-3.5 rounded-xl border border-gray-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Strict Route Recommendation Priority:</span>
              </div>
              <ol className="space-y-1.5 text-gray-300 list-decimal list-inside text-[11px]">
                <li>
                  <span className="font-semibold text-white">Fewest No Travel miles</span> (Safety Gate).
                </li>
                <li>
                  <span className="font-semibold text-white">Fewest Severe miles</span>.
                </li>
                <li>
                  <span className="font-semibold text-white">Fewest High miles</span>.
                </li>
                <li>
                  <span className="font-semibold text-white">Lowest average risk score</span> (distance-weighted).
                </li>
                <li>
                  <span className="font-semibold text-white">Shortest travel times</span>.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
