import React from 'react';
import { Shield, Target, Radio, AlertOctagon, CheckCircle2, HelpCircle, Layers, Gauge, ShieldCheck, ShieldAlert } from 'lucide-react';
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
  isInvestigating,
}) => {
  if (!incident) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-slate-400 font-mono">
        <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
        <p className="text-base font-bold text-slate-300">AWAITING SECURITY ALERT INGESTION</p>
        <p className="text-xs text-slate-500 mt-1">Select a scenario above or start an investigation.</p>
      </div>
    );
  }

  const confidence = incident.confidence || 0;
  const outcome = incident.attack_outcome;
  const isBlocked = incident.response_status === 'EXECUTED';

  const renderOutcomeBanner = () => {
    if (isInvestigating) {
      return (
        <div className="p-4 sm:p-5 rounded-xl bg-cyan-950/40 border border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center gap-3 font-mono animate-pulse">
          <Radio className="w-6 h-6 text-cyan-400 shrink-0 animate-spin" />
          <div>
            <div className="text-lg sm:text-xl font-bold tracking-wide">
              ● AUTONOMOUS INVESTIGATION IN PROGRESS
            </div>
            <p className="text-xs sm:text-sm text-cyan-400/80 mt-1">
              Correlating host telemetry, CVE intelligence, and server access logs...
            </p>
          </div>
        </div>
      );
    }

    switch (outcome) {
      case 'ATTACK_SUCCEEDED':
        return (
          <div className="p-4 sm:p-5 rounded-xl bg-red-950/60 border border-red-500/70 text-red-200 shadow-glow-red font-mono">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-900/60 border border-red-500/80 text-red-300">
                  <AlertOctagon className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-red-100 flex items-center gap-2">
                    <span>⚠ ATTACK SUCCEEDED</span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-red-900/80 text-red-200 border border-red-700">
                      BREACH CONFIRMED
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-red-300/90 font-sans mt-1">
                    Multi-source correlation confirmed execution on target host. Automated defense required.
                  </div>
                </div>
              </div>

              {/* Badges / Metrics */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-red-900/80 border border-red-600/80 text-xs sm:text-sm font-bold text-red-100">
                  {confidence}% CONFIDENCE
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-red-950 border border-red-700/60 text-xs sm:text-sm font-bold text-red-300">
                  {incident.evidence.length} EVIDENCE ARTIFACTS
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/80 text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {isBlocked ? 'SIMULATED CONTAINMENT ACTIVE' : 'CONTAINMENT JUSTIFIED'}
                </span>
              </div>
            </div>
          </div>
        );

      case 'ATTACK_FAILED':
        return (
          <div className="p-4 sm:p-5 rounded-xl bg-emerald-950/50 border border-emerald-500/70 text-emerald-200 shadow-glow-emerald font-mono">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-900/60 border border-emerald-500/80 text-emerald-300">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-100 flex items-center gap-2">
                    <span>✓ ATTACK FAILED</span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700">
                      FALSE POSITIVE
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-emerald-300/90 font-sans mt-1">
                    Host defenses / WAF dropped the probe; application layer untouched.
                  </div>
                </div>
              </div>

              {/* Badges / Metrics */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-900/80 border border-emerald-600/80 text-xs sm:text-sm font-bold text-emerald-100">
                  {confidence}% CONFIDENCE
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-700/60 text-xs sm:text-sm font-bold text-emerald-300">
                  {incident.evidence.length} CORRELATED ARTIFACTS
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-600/60 text-xs sm:text-sm font-bold text-blue-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  NO CONTAINMENT REQUIRED
                </span>
              </div>
            </div>
          </div>
        );

      case 'INSUFFICIENT_EVIDENCE':
        return (
          <div className="p-4 sm:p-5 rounded-xl bg-amber-950/50 border border-amber-500/70 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)] font-mono">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-900/60 border border-amber-500/80 text-amber-300">
                  <HelpCircle className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-amber-100 flex items-center gap-2">
                    <span>? INSUFFICIENT EVIDENCE</span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-amber-900/80 text-amber-200 border border-amber-700">
                      AMBIGUOUS
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-amber-300/90 font-sans mt-1">
                    Encrypted probe with zero host-level confirmation; refusing forced binary conclusion.
                  </div>
                </div>
              </div>

              {/* Badges / Metrics */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-amber-900/80 border border-amber-600/80 text-xs sm:text-sm font-bold text-amber-100">
                  {confidence}% CONFIDENCE
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-amber-950 border border-amber-700/60 text-xs sm:text-sm font-bold text-amber-300">
                  {incident.evidence.length} ARTIFACTS EVALUATED
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  CONTAINMENT DEFERRED
                </span>
              </div>
            </div>
          </div>
        );

      case 'UNDETERMINED':
      default:
        return (
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-cyan-400">
                  <Shield className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <span>AWAITING AUTONOMOUS INVESTIGATION</span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                      STANDBY
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
                    Alert ingested into SOC queue. Launch investigation to correlate vulnerabilities, PCAP, and server logs.
                  </div>
                </div>
              </div>

              {/* Badges / Metrics */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs sm:text-sm font-bold text-slate-300">
                  {confidence}% BASELINE PRIOR
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm font-bold text-slate-400">
                  {incident.evidence.length} ARTIFACTS
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  NO ACTIVE BLOCK (STANDBY)
                </span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 sm:p-6 border border-cyan-500/20 shadow-xl relative space-y-4">
      {/* Adaptation Banner if applicable */}
      <AdaptationBadge incident={incident} />

      {/* Incident Header & Signature */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5 font-mono">
            <span className="text-base sm:text-lg font-bold text-slate-100">{incident.incident_id}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
              incident.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
              incident.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
              'bg-blue-950 text-blue-300 border border-blue-800'
            }`}>
              {incident.severity} SEVERITY
            </span>
            <span className="text-xs sm:text-sm text-slate-400">• Ingested from {alert?.source || 'SURICATA'}</span>
          </div>
          <p className="text-xs sm:text-sm font-mono text-slate-300 mt-1.5 leading-normal">
            <strong className="text-slate-400">Signature:</strong> {alert?.signature || 'Security alert payload signature under analysis'}
          </p>
        </div>
      </div>

      {/* Primary Prominent Outcome Display (20-24px) */}
      <div>{renderOutcomeBanner()}</div>

      {/* Grid: Telemetry Context + Neutral Confidence Meter + Working Hypothesis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono">
        {/* Network & Host Posture */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Target className="w-4 h-4 text-cyan-400" /> Network & Host Posture
            </div>
            <div className="space-y-2 text-xs sm:text-[13px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Source IP (Attacker):</span>
                <span className="text-red-400 font-bold">{alert?.source_ip || '198.51.100.23'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Target Asset IP:</span>
                <span className="text-cyan-400 font-bold">{alert?.destination_ip || '10.0.10.15'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Port / Protocol:</span>
                <span className="text-slate-200">{alert?.destination_port || 443} / {alert?.protocol || 'TCP'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Correlated Items:</span>
                <span className="text-purple-300 font-bold">{incident.evidence.length} Evidence Items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Neutral Confidence Meter */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between uppercase tracking-wide">
              <span className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-purple-400" /> Correlated Confidence
              </span>
              <span className="text-lg font-bold text-slate-100">{confidence}%</span>
            </div>
            {/* Neutral Confidence Bar (Cyan / Purple gradient, non-red) */}
            <div className="w-full bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700 my-2">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-400"
                style={{ width: `${Math.max(6, confidence)}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-300 mt-2">
            <span>Response Threshold: <strong className="text-slate-100">80%</strong></span>
            <span className={confidence >= 80 ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
              {confidence >= 80 ? 'Threshold Met' : 'Accumulating Evidence'}
            </span>
          </div>
        </div>

        {/* Working Hypothesis */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <Layers className="w-4 h-4 text-amber-400" /> Working Hypothesis
            </div>
            <p className="text-slate-200 leading-relaxed text-xs sm:text-[13px] italic bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 line-clamp-4">
              "{incident.current_hypothesis}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
