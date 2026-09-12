import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle, ShieldCheck, Lock, ArrowRight, RefreshCw } from 'lucide-react';
import { Incident, Alert, FirewallRule } from '../lib/types';

interface ResponseCenterProps {
  incident: Incident | null;
  alert: Alert | null;
  firewallRules: FirewallRule[];
  onExecuteBlock: () => void;
  onRejectResponse: () => void;
  onReleaseBlock: (ip: string) => void;
}

export const ResponseCenter: React.FC<ResponseCenterProps> = ({
  incident,
  alert,
  firewallRules,
  onExecuteBlock,
  onRejectResponse,
  onReleaseBlock
}) => {
  const isExecuted = incident?.response_status === 'EXECUTED';
  const isRejected = incident?.response_status === 'REJECTED';
  const targetIp = alert?.source_ip || '198.51.100.23';

  return (
    <div className="glass-panel rounded-xl p-4 border border-cyan-500/20 shadow-lg font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Automated Response & Sandbox Firewall Center
          </h3>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
          ZERO HOST RISK
        </span>
      </div>

      {/* Response Action Card */}
      {incident && (
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Recommended Containment</span>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                <span className="text-red-400">BLOCK IP: {targetIp}</span>
                {isExecuted ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold shadow-glow-emerald">
                    SIMULATED BLOCK ACTIVE
                  </span>
                ) : isRejected ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500 font-bold">
                    OVERRIDDEN (REJECTED)
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    PENDING EVALUATION
                  </span>
                )}
              </div>
            </div>

            {/* Verification Status */}
            {isExecuted && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold text-xs">VERIFICATION: PASSED</span>
              </div>
            )}
          </div>

          <p className="text-slate-300 text-xs mt-1 bg-slate-950/70 p-2 rounded border border-slate-800">
            <strong>Policy Trigger:</strong> Attack outcome = <strong className="text-cyan-400">{incident.attack_outcome}</strong> (Confidence: {incident.confidence}%). All actions remain within synthetic sandbox.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-800">
            {!isExecuted && incident.attack_outcome === 'ATTACK_SUCCEEDED' && (
              <button
                onClick={onExecuteBlock}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-glow-red transition-all"
              >
                SIMULATE FIREWALL BLOCK
              </button>
            )}

            {isExecuted && (
              <button
                onClick={() => onReleaseBlock(targetIp)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-semibold transition-all"
              >
                RELEASE SIMULATED BLOCK
              </button>
            )}

            {!isRejected && (
              <button
                onClick={onRejectResponse}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
              >
                REJECT RESPONSE
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Sandbox Firewall Rules Table */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase mb-2">
          <span>Active Sandbox Rules ({firewallRules.length})</span>
          <span className="text-[10px] text-slate-500">Live MongoDB state</span>
        </div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {firewallRules.length === 0 ? (
            <p className="text-slate-500 italic text-xs py-2 text-center bg-slate-900/40 rounded">
              No active sandbox firewall rules. Clean perimeter.
            </p>
          ) : (
            firewallRules.map((rule) => (
              <div
                key={rule.rule_id}
                className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-red-400 font-bold">{rule.ip}</span>
                  <span className="text-slate-500 text-[10px]">[{rule.rule_id}]</span>
                  <span className="text-slate-400 text-[10px] truncate max-w-xs">{rule.reason}</span>
                </div>
                <button
                  onClick={() => onReleaseBlock(rule.ip)}
                  className="text-slate-400 hover:text-red-400 text-[10px] underline ml-2"
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
