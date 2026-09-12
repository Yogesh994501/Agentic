import React from 'react';
import { Shield, Target, Radio, AlertOctagon, CheckCircle2, HelpCircle, Layers, Gauge } from 'lucide-react';
import { Incident, Alert } from '../lib/types';
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
  currentTool,
  isInvestigating
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
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 shadow-glow-red font-mono">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span className="font-bold tracking-wider">ATTACK SUCCEEDED</span>
          </div>
        );
      case 'ATTACK_FAILED':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 shadow-glow-emerald font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold tracking-wider">ATTACK FAILED / FALSE POSITIVE</span>
          </div>
        );
      case 'INSUFFICIENT_EVIDENCE':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-300 font-mono">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="font-bold tracking-wider">INSUFFICIENT EVIDENCE</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-mono animate-pulse">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="font-bold tracking-wider">INVESTIGATING...</span>
          </div>
        );
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-cyan-500/20 shadow-xl relative">
      {/* Adaptation Badge if applicable */}
      <AdaptationBadge incident={incident} />

      {/* Incident Header & Outcome */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
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
          <p className="text-sm font-mono text-slate-300 mt-1">
            <strong>Signature:</strong> {alert?.signature || 'Security alert payload signature under analysis'}
          </p>
        </div>

        <div>{outcomeBadge()}</div>
      </div>

      {/* Grid: Telemetry Context + Confidence + Working Hypothesis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Network & Host Posture */}
        <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="text-[11px] text-slate-400 uppercase font-semibold mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-400" /> Network & Host Posture
          </div>
          <div className="space-y-1.5">
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
              <span className="text-slate-500">Evidence Count:</span>
              <span className="text-purple-400 font-bold">{incident.evidence.length} artifact(s)</span>
            </div>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 text-xs font-mono flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-purple-400" /> Agent Confidence
              </span>
              <span className="text-lg font-bold text-slate-100">{confidence}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  confidence >= 80 ? 'bg-gradient-to-r from-amber-500 to-red-500' :
                  confidence >= 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                  'bg-slate-600'
                }`}
                style={{ width: `${Math.max(5, confidence)}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Threshold for simulated response: <strong>80%</strong>. Agent requires host-level corroboration.
          </p>
        </div>

        {/* Current Working Hypothesis */}
        <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="text-[11px] text-slate-400 uppercase font-semibold mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> Working Hypothesis
          </div>
          <p className="text-slate-200 leading-relaxed text-[11px] italic bg-slate-950/60 p-2 rounded border border-slate-800/80">
            "{incident.current_hypothesis}"
          </p>
        </div>
      </div>
    </div>
  );
};
