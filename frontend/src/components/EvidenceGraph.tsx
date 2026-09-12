import React from 'react';
import { Network, ArrowRight, ShieldCheck, AlertCircle, Bug, FileText, Lock, CheckCircle2, ShieldX } from 'lucide-react';
import type { Incident, Alert } from '../lib/types';

interface EvidenceGraphProps {
  incident: Incident | null;
  alert: Alert | null;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ incident, alert }) => {
  const evidenceList = incident?.evidence || [];
  const hasAsset = evidenceList.some(e => e.source_tool === 'get_asset');
  const hasVuln = evidenceList.some(e => e.source_tool === 'get_vulnerabilities');
  const hasLogs = evidenceList.some(e => e.source_tool === 'get_server_logs');
  const hasInjected = evidenceList.some(e => e.source_tool === 'inject_new_evidence');
  const isDecided = incident?.attack_outcome && incident.attack_outcome !== 'UNDETERMINED';
  const isBlocked = incident?.response_status === 'EXECUTED';
  const isFailed = incident?.attack_outcome === 'ATTACK_FAILED';

  const nodes = [
    {
      id: 'alert',
      title: 'Alert Ingested',
      subtitle: alert ? `${alert.alert_id} (${alert.severity})` : 'Awaiting Alert',
      icon: AlertCircle,
      active: !!alert,
      color: 'border-cyan-500/80 bg-cyan-950/40 text-cyan-300'
    },
    {
      id: 'source_ip',
      title: 'Attacker Source',
      subtitle: alert ? alert.source_ip : 'Unknown IP',
      icon: Network,
      active: !!alert,
      color: 'border-red-500/80 bg-red-950/40 text-red-300'
    },
    {
      id: 'asset',
      title: 'Asset Inventory',
      subtitle: hasAsset ? 'Host Posture Verified' : 'Correlating...',
      icon: ShieldCheck,
      active: hasAsset,
      color: hasAsset ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300' : 'border-slate-800 bg-slate-900/40 text-slate-500'
    },
    {
      id: 'vuln',
      title: 'Vulnerability CVE',
      subtitle: hasVuln ? 'CVE Match Correlated' : 'Checking KB...',
      icon: Bug,
      active: hasVuln,
      color: hasVuln ? 'border-amber-500 bg-amber-950/40 text-amber-300' : 'border-slate-800 bg-slate-900/40 text-slate-500'
    },
    {
      id: 'logs',
      title: 'Server Logs & Impact',
      subtitle: hasInjected ? 'Worker Exec Log (Delayed)' : hasLogs ? 'Host Event Verified' : 'Awaiting Logs...',
      icon: FileText,
      active: hasLogs || hasInjected,
      color: (hasLogs || hasInjected) ? 'border-purple-500 bg-purple-950/40 text-purple-300' : 'border-slate-800 bg-slate-900/40 text-slate-500'
    },
    {
      id: 'outcome',
      title: 'Attack Outcome',
      subtitle: isDecided
        ? (incident?.attack_outcome === 'ATTACK_SUCCEEDED' ? 'BREACH CONFIRMED' :
           incident?.attack_outcome === 'ATTACK_FAILED' ? 'ATTACK DEFENDED' : 'INSUFFICIENT')
        : 'Evaluating...',
      icon: incident?.attack_outcome === 'ATTACK_SUCCEEDED' ? AlertCircle : CheckCircle2,
      active: isDecided,
      color: incident?.attack_outcome === 'ATTACK_SUCCEEDED'
        ? 'border-red-500 bg-red-950/60 text-red-300 shadow-glow-red'
        : incident?.attack_outcome === 'ATTACK_FAILED'
        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-glow-emerald'
        : 'border-slate-800 bg-slate-900/40 text-slate-500'
    },
    {
      id: 'firewall',
      title: 'Simulated Firewall',
      subtitle: isBlocked ? 'IP BLOCKED (Simulated)' : isFailed ? 'NO CONTAINMENT REQUIRED' : 'Standby / Evaluating',
      icon: isBlocked ? Lock : isFailed ? ShieldCheck : ShieldX,
      active: isBlocked || isFailed,
      color: isBlocked
        ? 'border-emerald-400 bg-emerald-950 text-emerald-300 shadow-glow-emerald'
        : isFailed
        ? 'border-slate-700 bg-slate-900/80 text-slate-300'
        : 'border-slate-800 bg-slate-900/40 text-slate-500'
    }
  ];

  return (
    <div className="glass-panel rounded-xl p-5 sm:p-6 border border-cyan-500/20 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 font-mono">
        <div className="flex items-center space-x-2.5">
          <Network className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-100">
            Multi-Source Evidence Correlation
          </h3>
        </div>
        <span className="text-xs sm:text-sm text-slate-300">
          Correlated Artifacts: <strong className="text-cyan-400 font-bold text-sm sm:text-base">{evidenceList.length}</strong>
        </span>
      </div>

      {/* Horizontal Flow Container with Scroll Safety */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center justify-between gap-3 min-w-[1100px] py-1">
          {nodes.map((node, index) => {
            const Icon = node.icon;
            const isPathActive = node.active && (index === 0 || nodes[index - 1].active);

            return (
              <React.Fragment key={node.id}>
                <div
                  className={`flex-1 min-w-[150px] max-w-[170px] p-3.5 sm:p-4 rounded-xl border text-center transition-all ${node.color} ${
                    node.active ? 'shadow-sm' : 'opacity-50'
                  }`}
                >
                  <div className="flex justify-center mb-1.5">
                    <Icon className={`w-5 h-5 ${node.active ? 'animate-pulse' : ''}`} />
                  </div>
                  {/* Node Title: 13-14px */}
                  <div className="text-[13px] sm:text-sm font-bold font-mono truncate">{node.title}</div>
                  {/* Node Subtitle: 11-12px */}
                  <div className="text-[11px] sm:text-xs text-slate-300 truncate mt-1">{node.subtitle}</div>
                </div>

                {index < nodes.length - 1 && (
                  <div className="flex items-center text-slate-600 px-0.5">
                    <ArrowRight className={`w-4 h-4 transition-all ${
                      isPathActive && nodes[index + 1].active
                        ? 'text-cyan-400 animate-flow-pulse'
                        : 'text-slate-700'
                    }`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
