import React from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2, XCircle, Gauge } from 'lucide-react';
import { Incident } from '../lib/types';

interface KpiCardsProps {
  incidents: Incident[];
  avgConfidence: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ incidents, avgConfidence }) => {
  const activeCount = incidents.filter(i => i.status !== 'CLOSED').length;
  const investigatingCount = incidents.filter(i => i.status === 'INVESTIGATING' || i.status === 'NEW').length;
  const containedCount = incidents.filter(i => i.status === 'CONTAINED').length;
  const falsePositivesCount = incidents.filter(i => i.status === 'FALSE_POSITIVE').length;

  const cards = [
    {
      title: 'Active Incidents',
      value: activeCount,
      icon: AlertCircle,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-950/20',
      subtitle: 'Simulated queue'
    },
    {
      title: 'Investigating',
      value: investigatingCount,
      icon: ShieldAlert,
      color: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-950/20',
      subtitle: 'Correlating evidence'
    },
    {
      title: 'Contained',
      value: containedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-950/20',
      subtitle: 'Firewall block verified'
    },
    {
      title: 'False Positives',
      value: falsePositivesCount,
      icon: XCircle,
      color: 'text-slate-400',
      border: 'border-slate-700/50',
      bg: 'bg-slate-900/40',
      subtitle: 'Host defended / Dropped'
    },
    {
      title: 'Agent Avg Confidence',
      value: `${avgConfidence}%`,
      icon: Gauge,
      color: 'text-purple-400',
      border: 'border-purple-500/20',
      bg: 'bg-purple-950/20',
      subtitle: 'Multi-source threshold'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border ${card.border} ${card.bg} backdrop-blur-sm relative overflow-hidden transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{card.title}</span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-100">{card.value}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};
