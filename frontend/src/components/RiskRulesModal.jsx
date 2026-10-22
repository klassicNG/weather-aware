import React from 'react';
import { X, BookOpen, Scale, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function RiskRulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-white/10 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Official Risk & Load Weight Rules
              </h3>
              <p className="text-xs text-slate-400">
                Weather-Aware Truck Routing Assessment Specification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px]">
                  <th className="p-2.5 font-bold">Condition</th>
                  <th className="p-2.5 text-emerald-400">Low (1)</th>
                  <th className="p-2.5 text-amber-400">Moderate (2)</th>
                  <th className="p-2.5 text-orange-400">High (3)</th>
                  <th className="p-2.5 text-red-400">Severe (4)</th>
                  <th className="p-2.5 text-rose-400 font-bold">No Travel (5)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                <tr>
                  <td className="p-2.5 font-bold font-sans text-slate-200">Wind (mph)</td>
                  <td className="p-2.5 text-slate-300">&lt; 25</td>
                  <td className="p-2.5 text-slate-300">25–34</td>
                  <td className="p-2.5 text-slate-300">35–44</td>
                  <td className="p-2.5 text-slate-300">45–54</td>
                  <td className="p-2.5 text-rose-400 font-bold">≥ 55</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans text-slate-200">Rain (in/hr)</td>
                  <td className="p-2.5 text-slate-300">&lt; 0.10</td>
                  <td className="p-2.5 text-slate-300">0.10–0.25</td>
                  <td className="p-2.5 text-slate-300">0.25–0.50</td>
                  <td className="p-2.5 text-slate-300">0.50–1.00</td>
                  <td className="p-2.5 text-rose-400 font-bold">&gt; 1.00</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans text-slate-200">Snow (in/hr)</td>
                  <td className="p-2.5 text-slate-300">&lt; 0.5</td>
                  <td className="p-2.5 text-slate-300">0.5–1.0</td>
                  <td className="p-2.5 text-slate-300">1.0–2.0</td>
                  <td className="p-2.5 text-slate-300">2.0–3.0</td>
                  <td className="p-2.5 text-rose-400 font-bold">&gt; 3.0</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Load Rules & Ranking Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Scale className="w-4 h-4" />
                <span>Load Weight Overrides:</span>
              </div>
              <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                <li>
                  <span className="font-mono text-rose-400 font-bold">≥ 55 mph</span> → No Travel (5) for any load
                </li>
                <li>
                  <span className="font-mono text-orange-400">45–54 mph</span> +{' '}
                  <span className="font-mono text-amber-400 font-bold">≥ 30,000 lb</span> →{' '}
                  <span className="text-rose-400 font-bold">No Travel (5)</span>
                </li>
                <li>
                  <span className="font-mono text-amber-400">35–44 mph</span> +{' '}
                  <span className="font-mono text-amber-400 font-bold">&gt; 40,000 lb</span> →{' '}
                  <span className="text-red-400 font-bold">Severe (4)</span>
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-sky-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Tie-Breaker Recommendation Priority:</span>
              </div>
              <ol className="space-y-1 text-slate-300 list-decimal list-inside text-[11px]">
                <li>
                  <span className="font-semibold text-white">Fewest No Travel miles</span> (Safety gate)
                </li>
                <li>
                  <span className="font-semibold text-white">Fewest Severe miles</span>
                </li>
                <li>
                  <span className="font-semibold text-white">Fewest High miles</span>
                </li>
                <li>
                  <span className="font-semibold text-white">Lowest average risk score</span>
                </li>
                <li>
                  <span className="font-semibold text-white">Shortest travel times</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
