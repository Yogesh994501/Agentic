import React from 'react';
import { Brain, CheckCircle, AlertCircle, ArrowUpRight, HelpCircle } from 'lucide-react';
import { Incident } from '../lib/types';

interface ReasoningPanelProps {
  incident: Incident | null;
}

export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ incident }) => {
  if (!incident) return null;

  const evidence = incident.evidence || [];
  const hasOutcome = incident.attack_outcome && incident.attack_outcome !== 'UNDETERMINED';

  return (
    <div className="glass-panel rounded-xl p-4 border border-cyan-500/20 shadow-lg font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Transparent Agent Decision Trace
          </h3>
        </div>
        <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
          AUDITABLE STATE
        </span>
      </div>

      <div className="space-y-3">
        {/* GOAL */}
        <div>
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block mb-0.5">
            1. Investigation Goal
          </span>
          <p className="text-slate-200 bg-slate-900/80 p-2 rounded border border-slate-800">
            Determine whether incoming security alert {incident.alert_id} represents a successful breach or benign anomaly, without blindly trusting signature labels.
          </p>
        </div>

        {/* WORKING HYPOTHESIS */}
        <div>
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block mb-0.5">
            2. Working Hypothesis
          </span>
          <p className="text-slate-200 bg-slate-900/80 p-2 rounded border border-slate-800 italic">
            "{incident.current_hypothesis}"
          </p>
        </div>

        {/* EVIDENCE CORRELATED */}
        <div>
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block mb-0.5">
            3. Correlated Evidence Artifacts ({evidence.length})
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {evidence.length === 0 ? (
              <p className="text-slate-500 italic">No artifacts retrieved yet.</p>
            ) : (
              evidence.map((ev) => (
                <div
                  key={ev.evidence_id}
                  className="flex items-start justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80 gap-2"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-cyan-400 font-bold">[{ev.evidence_id}]</span>
                    <span className="text-[11px] text-slate-300">{ev.finding}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    ev.supports_success ? 'text-red-400 bg-red-950/60' : 'text-emerald-400 bg-emerald-950/60'
                  }`}>
                    {ev.confidence_impact > 0 ? `+${ev.confidence_impact}` : ev.confidence_impact}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FINAL DECISION SUMMARY */}
        {hasOutcome && (
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Final Incident Assessment:
              </span>
              <span className="text-sm font-bold text-slate-100">
                {incident.attack_outcome} ({incident.confidence}%)
              </span>
            </div>
            <p className="text-slate-300 bg-slate-900/90 p-2 rounded border border-slate-700/80 mt-1">
              {incident.reasoning_summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
