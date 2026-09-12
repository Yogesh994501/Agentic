import React from 'react';
import { Sparkles, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Incident } from '../lib/types';

interface AdaptationBadgeProps {
  incident: Incident;
}

export const AdaptationBadge: React.FC<AdaptationBadgeProps> = ({ incident }) => {
  if (!incident.is_adapted && incident.status !== 'REOPENED') {
    return null;
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/70 via-slate-900/90 to-purple-950/70 border-2 border-purple-500 shadow-glow-purple relative overflow-hidden backdrop-blur-md mb-4 animate-pulse-slow">
      {/* Top Banner Alert */}
      <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/40">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded bg-purple-500 text-slate-950 font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-bold text-purple-200 font-mono tracking-wider uppercase">
            New Forensic Evidence Received — Dynamic Reassessment
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/90 border border-purple-400 text-purple-200 font-bold">
          DECISION REVERSED
        </span>
      </div>

      {/* Before / After Cinematic Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-2 items-center py-3">
        {/* Previous Assessment */}
        <div className="md:col-span-5 bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-center font-mono">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
            Initial Preliminary Assessment
          </span>
          <div className="text-sm font-bold text-emerald-400">
            ATTACK FAILED / FALSE POSITIVE
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Confidence: <strong>72%</strong> (Synchronous probe dropped)
          </span>
        </div>

        {/* Transition Arrow */}
        <div className="md:col-span-1 flex justify-center py-1">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Updated Assessment */}
        <div className="md:col-span-5 bg-purple-950/50 p-3 rounded-lg border border-purple-400/80 text-center font-mono shadow-glow-purple">
          <span className="text-[10px] text-purple-300 uppercase font-semibold block mb-0.5">
            Updated Autonomous Assessment
          </span>
          <div className="text-sm font-bold text-red-400">
            ATTACK SUCCEEDED
          </div>
          <span className="text-xs text-purple-200 mt-0.5 block font-bold">
            Confidence: <strong>91%</strong> (Simulated Block Enforced)
          </span>
        </div>
      </div>

      {/* Rationale Footer */}
      <div className="pt-2 border-t border-purple-500/30 font-mono text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span>
            <strong>Agent Reasoning:</strong> Delayed worker execution log proved unauthorized shell access; prior negative evaluation overturned.
          </span>
        </div>
        <span className="text-[10px] text-purple-300 underline shrink-0 ml-2">
          Audit Event Recorded
        </span>
      </div>
    </div>
  );
};
