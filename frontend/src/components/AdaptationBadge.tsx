import React from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { Incident } from '../lib/types';

interface AdaptationBadgeProps {
  incident: Incident;
}

export const AdaptationBadge: React.FC<AdaptationBadgeProps> = ({ incident }) => {
  if (!incident.is_adapted && incident.status !== 'REOPENED') {
    return null;
  }

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-r from-purple-950/70 via-slate-900/90 to-purple-950/70 border-2 border-purple-500 shadow-glow-purple relative overflow-hidden backdrop-blur-md mb-4 animate-pulse-slow">
      {/* Top Banner Alert */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-500/40">
        <div className="flex items-center space-x-2.5">
          <span className="p-1.5 rounded-lg bg-purple-500 text-slate-950 font-bold">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <span className="text-sm sm:text-base font-bold text-purple-100 font-mono tracking-wide uppercase">
            New Forensic Evidence Received — Dynamic Reassessment
          </span>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-md bg-purple-900/90 border border-purple-400 text-purple-200 font-bold">
          DECISION REVERSED
        </span>
      </div>

      {/* Before / After Cinematic Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center py-4">
        {/* Previous Assessment */}
        <div className="md:col-span-5 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-center font-mono">
          <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
            Initial Preliminary Assessment
          </span>
          <div className="text-base sm:text-lg font-bold text-emerald-400">
            ATTACK FAILED / FALSE POSITIVE
          </div>
          <span className="text-xs sm:text-sm text-slate-300 mt-1 block">
            Confidence: <strong>72%</strong> (Synchronous probe dropped)
          </span>
        </div>

        {/* Transition Arrow */}
        <div className="md:col-span-1 flex justify-center py-1">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300 shadow-glow-purple">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>

        {/* Updated Assessment */}
        <div className="md:col-span-5 bg-purple-950/60 p-4 rounded-xl border border-purple-400 text-center font-mono shadow-glow-purple">
          <span className="text-xs text-purple-300 uppercase font-bold block mb-1">
            Updated Autonomous Assessment
          </span>
          <div className="text-base sm:text-lg font-bold text-red-400">
            ATTACK SUCCEEDED
          </div>
          <span className="text-xs sm:text-sm text-purple-200 mt-1 block font-bold">
            Confidence: <strong>91%</strong> (Simulated Block Enforced)
          </span>
        </div>
      </div>

      {/* Rationale Footer */}
      <div className="pt-3 border-t border-purple-500/30 font-mono text-xs sm:text-sm text-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
          <span>
            <strong className="text-purple-300">Agent Reasoning:</strong> Delayed worker execution log proved unauthorized shell access; prior negative evaluation overturned.
          </span>
        </div>
        <span className="text-xs text-purple-300 underline font-semibold shrink-0">
          Audit Event Recorded
        </span>
      </div>
    </div>
  );
};
