import React from 'react';
import { Crosshair, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Incident } from '../lib/types';

interface FloatingAgentStatusProps {
  agentStatus: 'IDLE' | 'INVESTIGATING' | 'RESPONDING';
  currentIncident: Incident | null;
  onClick: () => void;
}

export const FloatingAgentStatus: React.FC<FloatingAgentStatusProps> = ({
  agentStatus,
  currentIncident,
  onClick,
}) => {
  const isInvestigating = agentStatus === 'INVESTIGATING';
  const isResponding = agentStatus === 'RESPONDING';
  const hasCompleted = agentStatus === 'IDLE' && currentIncident !== null;

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-20 z-40 h-11 px-4 rounded-full border backdrop-blur-xl shadow-2xl transition-all duration-300 flex items-center gap-2.5 font-mono text-xs cursor-pointer group hover:scale-105 active:scale-95 ${
        isInvestigating
          ? 'bg-amber-950/80 border-amber-400/80 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.35)] animate-pulse'
          : isResponding
          ? 'bg-red-950/80 border-red-400/80 text-red-200 shadow-glow-red'
          : hasCompleted
          ? 'bg-[#07131b]/90 border-cyan-500/40 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:border-cyan-400'
          : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-slate-600'
      }`}
      title="Click to jump to active investigation"
      aria-label="Floating agent status indicator"
    >
      {/* Icon Indicator */}
      {isInvestigating ? (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
        </span>
      ) : isResponding ? (
        <AlertCircle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
      ) : hasCompleted ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-slate-500" />
      )}

      {/* Label */}
      <span className="font-bold tracking-wide">
        {isInvestigating
          ? '● AGENT INVESTIGATING'
          : isResponding
          ? '● AGENT CONTAINING'
          : hasCompleted
          ? '✓ INVESTIGATION COMPLETE'
          : '● AGENT IDLE'}
      </span>

      {/* Confidence Pill when Available */}
      {currentIncident && typeof currentIncident.confidence === 'number' && (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            isInvestigating
              ? 'bg-amber-900/60 text-amber-200 border border-amber-700/60'
              : 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60'
          }`}
        >
          {currentIncident.confidence}% CONF
        </span>
      )}

      {/* Quick Jump Icon on Hover */}
      <Crosshair className="w-3 h-3 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:rotate-45 transition-all ml-0.5" />
    </button>
  );
};
