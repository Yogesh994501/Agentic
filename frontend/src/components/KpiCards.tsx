import React from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2, XCircle, Gauge } from 'lucide-react';
import type { Incident } from '../lib/types';

interface KpiCardsProps {
  incidents: Incident[];
  avgConfidence: number;
  isInvestigating?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  incidents,
  avgConfidence,
  isInvestigating = false
}) => {
  const activeCount = incidents.filter(i => i.status !== 'CLOSED').length || 1;
  const investigatingCount = isInvestigating ? 1 : incidents.filter(i => i.status === 'INVESTIGATING').length;
  const containedCount = incidents.filter(i => i.status === 'CONTAINED').length;
  const falsePositivesCount = incidents.filter(i => i.status === 'FALSE_POSITIVE').length;

  const cards = [
    {
      title: 'Active Incidents',
      value: activeCount,
      icon: AlertCircle,
      color: 'text-cyan-400',
      border: 'border-cyan-500/25',
      bg: 'bg-cyan-950/20',
      subtitle: 'Simulated queue'
    },
    {
      title: 'Investigating',
      value: investigatingCount,
      icon: ShieldAlert,
      color: isInvestigating ? 'text-amber-400 animate-pulse' : 'text-slate-400',
      border: isInvestigating ? 'border-amber-500/60 bg-amber-950/35' : 'border-slate-800 bg-slate-900/40',
      bg: '',
      subtitle: isInvestigating ? 'Live correlation active' : 'Awaiting trigger'
    },
    {
      title: 'Contained',
      value: containedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      border: 'border-emerald-500/25',
      bg: 'bg-emerald-950/20',
      subtitle: 'Firewall enforced'
    },
    {
      title: 'False Positives',
      value: falsePositivesCount,
      icon: XCircle,
      color: 'text-slate-400',
      border: 'border-slate-800',
      bg: 'bg-slate-900/40',
      subtitle: 'Defended / Dropped'
    },
    {
      title: 'Avg Confidence',
      value: `${avgConfidence}%`,
      icon: Gauge,
      color: 'text-purple-300',
      border: 'border-purple-500/35 shadow-[0_0_20px_rgba(168,85,247,0.18)]',
      bg: 'bg-purple-950/25',
      subtitle: 'Multi-source score'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 sm:p-4.5 rounded-xl border ${card.border} ${card.bg} backdrop-blur-md flex flex-col justify-between transition-all hover:border-slate-600 shadow-sm`}
          >
            {/* Top Row: Label & Icon */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>

            {/* Primary KPI Number: 26-30px */}
            <div className="my-1">
              <span className="text-[28px] font-bold font-mono text-slate-100 leading-none tracking-tight">
                {card.value}
              </span>
            </div>

            {/* Subtitle / Metadata: 11-12px with 6-8px separation */}
            <p className="text-[11px] sm:text-[12px] text-slate-400 font-mono truncate leading-tight mt-1.5">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
