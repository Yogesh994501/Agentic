import React from 'react';
import { CheckCircle2, Lock, ShieldX, ShieldCheck } from 'lucide-react';
import type { Incident, Alert, FirewallRule } from '../lib/types';

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
  const isFailed = incident?.attack_outcome === 'ATTACK_FAILED';
  const targetIp = alert?.source_ip || '198.51.100.23';

  return (
    <div className="glass-panel rounded-xl p-5 sm:p-6 border border-cyan-500/20 shadow-lg font-mono">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2.5">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-100">
            Response & Sandbox Firewall
          </h3>
        </div>
        <span className="text-xs text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/70 font-semibold">
          Zero Host Risk
        </span>
      </div>

      {/* Response Action Card */}
      {incident && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 mb-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                Automated Response Decision
              </span>
              <div className="text-sm sm:text-base font-bold text-slate-100 flex flex-wrap items-center gap-2 mt-1">
                {isFailed ? (
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <ShieldX className="w-5 h-5 text-emerald-400" />
                    <span>NO CONTAINMENT REQUIRED</span>
                  </div>
                ) : (
                  <span className="text-red-400 font-bold">BLOCK IP: {targetIp}</span>
                )}

                {isExecuted ? (
                  <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold shadow-glow-emerald">
                    SIMULATED BLOCK ACTIVE
                  </span>
                ) : isRejected ? (
                  <span className="text-xs px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500 font-bold">
                    OPERATOR REJECTED
                  </span>
                ) : isFailed ? (
                  <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-bold">
                    HOST DEFENDED
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    EVALUATING
                  </span>
                )}
              </div>
            </div>

            {/* Verification Status */}
            {isExecuted && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>VERIFIED: PASSED</span>
              </div>
            )}
          </div>

          <p className="text-slate-200 text-[13px] sm:text-sm mt-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800 leading-relaxed">
            <strong className="text-slate-100">Policy Trigger:</strong> {
              isFailed
                ? 'Attack verified dropped by perimeter filter; host uncompromised. Containment suppressed.'
                : `Attack outcome = ${incident.attack_outcome.replace('ATTACK_', '')} (${incident.confidence}%). Automated threshold met.`
            }
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-2.5 border-t border-slate-800">
            {!isExecuted && incident.attack_outcome === 'ATTACK_SUCCEEDED' && (
              <button
                onClick={onExecuteBlock}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-glow-red transition-all cursor-pointer"
              >
                Simulate Firewall Block
              </button>
            )}

            {isExecuted && (
              <button
                onClick={() => onReleaseBlock(targetIp)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                Release Simulated Block
              </button>
            )}

            {!isRejected && !isFailed && (
              <button
                onClick={onRejectResponse}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                Reject Response
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Sandbox Firewall Rules Table */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">
          <span>Active Sandbox Rules ({firewallRules.length})</span>
          <span className="text-slate-400 font-normal">Live sandbox state</span>
        </div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {firewallRules.length === 0 ? (
            <p className="text-slate-400 italic text-xs sm:text-sm py-2.5 text-center bg-slate-900/50 rounded-lg border border-slate-800">
              No active firewall rules. Clean perimeter state.
            </p>
          ) : (
            firewallRules.map((rule) => (
              <div
                key={rule.rule_id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs sm:text-sm"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-red-400 font-bold">{rule.ip}</span>
                  <span className="text-slate-400 text-xs">[{rule.rule_id}]</span>
                  <span className="text-slate-300 text-xs truncate max-w-xs">{rule.reason}</span>
                </div>
                <button
                  onClick={() => onReleaseBlock(rule.ip)}
                  className="text-slate-400 hover:text-red-400 text-xs underline ml-2 cursor-pointer"
                >
                  Release
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
