import React from 'react';
import { GitCompare, Sparkles, AlertCircle } from 'lucide-react';
import { Incident } from '../lib/types';

interface AdaptationBadgeProps {
  incident: Incident;
}

export const AdaptationBadge: React.FC<AdaptationBadgeProps> = ({ incident }) => {
  if (!incident.is_adapted && incident.status !== 'REOPENED') {
    return null;
  }

  return (
    <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/50 shadow-lg relative overflow-hidden backdrop-blur-md mb-4 animate-pulse-slow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Autonomous Dynamic Adaptation Triggered
              </span>
              <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded border border-purple-700">
                OUTCOME CHANGED
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {incident.adaptation_reason ||
                "Decision changed because new supplemental evidence contradicted previous preliminary assessment."}
            </p>
          </div>
        </div>

        {/* Before / After Indicators */}
        <div className="flex items-center space-x-2 bg-slate-900/90 px-3 py-2 rounded-lg border border-purple-500/30 text-xs font-mono">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase">Initial</div>
            <span className="text-emerald-400 font-bold">FAILED (72%)</span>
          </div>
          <GitCompare className="w-4 h-4 text-purple-400" />
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase">Reassessed</div>
            <span className="text-red-400 font-bold">SUCCEEDED (91%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
