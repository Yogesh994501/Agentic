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
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-950/15',
      subtitle: 'Simulated queue'
    },
    {
      title: 'Investigating',
      value: investigatingCount,
      icon: ShieldAlert,
      color: isInvestigating ? 'text-amber-400 animate-pulse' : 'text-slate-400',
      border: isInvestigating ? 'border-amber-500/50 bg-amber-950/30' : 'border-slate-800 bg-slate-900/30',
      bg: '',
      subtitle: isInvestigating ? 'Live correlation' : 'Idle'
    },
    {
      title: 'Contained',
      value: containedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-950/15',
      subtitle: 'Firewall enforced'
    },
    {
      title: 'False Positives',
      value: falsePositivesCount,
      icon: XCircle,
      color: 'text-slate-400',
      border: 'border-slate-800',
      bg: 'bg-slate-900/30',
      subtitle: 'Defended / Dropped'
    },
    {
      title: 'Agent Confidence',
      value: `${avgConfidence}%`,
      icon: Gauge,
      color: 'text-purple-300',
      border: 'border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
      bg: 'bg-purple-950/20',
      subtitle: 'Correlated score'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`h-[88px] px-3.5 py-2.5 rounded-xl border ${card.border} ${card.bg} backdrop-blur-sm flex flex-col justify-between transition-all hover:border-slate-600`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                {card.title}
              </span>
              <Icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-slate-100 leading-none">
                {card.value}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono truncate leading-none">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
