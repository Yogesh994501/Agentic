import React from 'react';
import { Shield, Target, Radio, AlertOctagon, CheckCircle2, HelpCircle, Layers, Gauge } from 'lucide-react';
import type { Incident, Alert } from '../lib/types';
import { AdaptationBadge } from './AdaptationBadge';

interface LiveInvestigationProps {
  incident: Incident | null;
  alert: Alert | null;
  currentTool?: string;
  isInvestigating: boolean;
}

export const LiveInvestigation: React.FC<LiveInvestigationProps> = ({
  incident,
  alert,
}) => {
  if (!incident) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-slate-400 font-mono">
        <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
        <p className="text-sm font-semibold">AWAITING SECURITY ALERT INGESTION</p>
        <p className="text-xs text-slate-500 mt-1">Select a scenario above or start an investigation.</p>
      </div>
    );
  }

  const confidence = incident.confidence || 0;
  const outcome = incident.attack_outcome;

  const outcomeBadge = () => {
    switch (outcome) {
      case 'ATTACK_SUCCEEDED':
        return (
          <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/60 text-red-300 shadow-glow-red font-mono">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold tracking-wide">ATTACK SUCCEEDED</span>
              <span className="text-red-400/60">|</span>
              <span>{confidence}% CONFIDENCE</span>
              <span className="text-red-400/60">|</span>
              <span>{incident.evidence.length} ARTIFACTS</span>
            </div>
          </div>
        );
      case 'ATTACK_FAILED':
        return (
          <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 shadow-glow-emerald font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold tracking-wide">ATTACK FAILED / FALSE POSITIVE</span>
              <span className="text-emerald-400/60">|</span>
              <span>{confidence}% CONFIDENCE</span>
              <span className="text-emerald-400/60">|</span>
              <span>{incident.evidence.length} ARTIFACTS</span>
            </div>
          </div>
        );
      case 'INSUFFICIENT_EVIDENCE':
        return (
          <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/60 text-amber-300 font-mono">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold tracking-wide">INSUFFICIENT EVIDENCE</span>
              <span className="text-amber-400/60">|</span>
              <span>{confidence}% CONFIDENCE</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-mono animate-pulse">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="font-bold tracking-wider text-xs">AUTONOMOUS INVESTIGATION IN PROGRESS...</span>
          </div>
        );
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-cyan-500/20 shadow-xl relative">
      {/* Adaptation Banner if applicable */}
      <AdaptationBadge incident={incident} />

      {/* Incident Header & Outcome */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-lg font-bold text-slate-100">{incident.incident_id}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
              incident.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
              incident.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
              'bg-blue-950 text-blue-300 border border-blue-800'
            }`}>
              {incident.severity} SEVERITY
            </span>
            <span className="text-xs text-slate-500">• Ingested from {alert?.source || 'SURICATA'}</span>
          </div>
          <p className="text-xs font-mono text-slate-300 mt-1">
            <strong className="text-slate-400">Signature:</strong> {alert?.signature || 'Security alert payload signature under analysis'}
          </p>
        </div>

        <div>{outcomeBadge()}</div>
      </div>

      {/* Grid: Telemetry Context + Neutral Confidence Meter + Working Hypothesis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mt-3.5">
        {/* Network & Host Posture */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1.5 uppercase">
            <Target className="w-3.5 h-3.5 text-cyan-400" /> Network & Host Posture
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Source IP (Attacker):</span>
              <span className="text-red-400 font-bold">{alert?.source_ip || '198.51.100.23'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Asset IP:</span>
              <span className="text-cyan-400 font-bold">{alert?.destination_ip || '10.0.10.15'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Port / Protocol:</span>
              <span className="text-slate-300">{alert?.destination_port || 443} / {alert?.protocol || 'TCP'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-500">Correlated Artifacts:</span>
              <span className="text-purple-300 font-bold">{incident.evidence.length} Evidence Items</span>
            </div>
          </div>
        </div>

        {/* Neutral Confidence Meter */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center justify-between uppercase">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-purple-400" /> Correlated Confidence
              </span>
              <span className="text-base font-bold text-slate-100">{confidence}%</span>
            </div>
            {/* Neutral Confidence Bar (Cyan / Purple gradient, non-red) */}
            <div className="w-full bg-slate-800 rounded-full h-3 p-0.5 overflow-hidden border border-slate-700">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-400"
                style={{ width: `${Math.max(6, confidence)}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-2">
            <span>Automated Response Threshold: <strong>80%</strong></span>
            <span className={confidence >= 80 ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
              {confidence >= 80 ? 'Threshold Met' : 'Accumulating'}
            </span>
          </div>
        </div>

        {/* Working Hypothesis */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1.5 uppercase">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> Working Hypothesis
          </div>
          <p className="text-slate-200 leading-relaxed text-[11px] italic bg-slate-950/60 p-2 rounded border border-slate-800/80 line-clamp-3">
            "{incident.current_hypothesis}"
          </p>
        </div>
      </div>
    </div>
  );
};
