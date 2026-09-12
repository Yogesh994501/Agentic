import React from 'react';
import { Brain } from 'lucide-react';
import type { Incident } from '../lib/types';

interface ReasoningPanelProps {
  incident: Incident | null;
}

export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ incident }) => {
  if (!incident) return null;

  const evidence = incident.evidence || [];
  const hasOutcome = incident.attack_outcome && incident.attack_outcome !== 'UNDETERMINED';

  return (
    <div className="glass-panel rounded-xl p-5 sm:p-6 border border-cyan-500/20 shadow-lg font-mono">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2.5">
          <Brain className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-100">
              Agent Decision Trace
            </h3>
            <span className="text-xs sm:text-sm text-slate-400 block mt-0.5">
              Why the agent decided
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-purple-200 bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-800/70">
          Auditable Trace
        </span>
      </div>

      <div className="space-y-4">
        {/* 1. Investigation Goal */}
        <div>
          <span className="text-slate-400 font-bold uppercase text-xs tracking-wider block mb-1.5">
            1. Investigation Goal
          </span>
          <p className="text-slate-100 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[13px] sm:text-sm leading-relaxed">
            Determine whether security alert <span className="text-cyan-300 font-bold">{incident.alert_id}</span> represents an active compromise or benign traffic without relying on signature severity alone.
          </p>
        </div>

        {/* 2. Working Hypothesis */}
        <div>
          <span className="text-slate-400 font-bold uppercase text-xs tracking-wider block mb-1.5">
            2. Working Hypothesis
          </span>
          <p className="text-slate-200 bg-slate-900/80 p-3 rounded-lg border border-slate-800 italic text-[13px] sm:text-sm leading-relaxed">
            "{incident.current_hypothesis}"
          </p>
        </div>

        {/* 3. Correlated Evidence Artifacts */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 font-bold uppercase text-xs tracking-wider">
              3. Correlated Evidence ({evidence.length})
            </span>
            <span className="text-xs text-slate-400">Host & network artifacts</span>
          </div>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {evidence.length === 0 ? (
              <p className="text-slate-400 italic text-xs sm:text-sm p-2">No artifacts retrieved yet.</p>
            ) : (
              evidence.map((ev) => (
                <div
                  key={ev.evidence_id}
                  className="flex items-start justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/90 gap-2.5 text-[13px] sm:text-sm"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-cyan-400 font-bold shrink-0 mt-0.5">[{ev.evidence_id}]</span>
                    <span className="text-slate-200 leading-snug">{ev.finding}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                    ev.supports_success ? 'text-red-300 bg-red-950/80 border border-red-800/60' : 'text-emerald-300 bg-emerald-950/80 border border-emerald-800/60'
                  }`}>
                    {ev.confidence_impact > 0 ? `+${ev.confidence_impact}` : ev.confidence_impact}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Final Assessment Summary */}
        {hasOutcome && (
          <div className="pt-3 border-t border-slate-800/90">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-300 font-bold uppercase text-xs tracking-wider">
                Final Assessment Outcome:
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {incident.attack_outcome.replace('ATTACK_', '')} ({incident.confidence}%)
              </span>
            </div>
            <p className="text-slate-100 bg-slate-900/95 p-3 rounded-lg border border-slate-700 mt-1 text-[13px] sm:text-sm leading-relaxed">
              {incident.reasoning_summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
