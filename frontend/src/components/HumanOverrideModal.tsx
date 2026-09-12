import React, { useState } from 'react';
import { X, UserCheck, ShieldCheck, ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';

interface HumanOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOverride: (decision: string, reason: string, operator: string) => void;
  incidentId: string;
}

export const HumanOverrideModal: React.FC<HumanOverrideModalProps> = ({
  isOpen,
  onClose,
  onApplyOverride,
  incidentId
}) => {
  const [decision, setDecision] = useState<string>('APPROVE_RESPONSE');
  const [reason, setReason] = useState<string>('Analyst validated correlated host signals.');
  const [operator, setOperator] = useState<string>('SecOps Lead Analyst');

  if (!isOpen) return null;

  const actions = [
    { id: 'APPROVE_RESPONSE', label: 'Approve Response', desc: 'Confirm automated block recommendation' },
    { id: 'REJECT_RESPONSE', label: 'Reject Response', desc: 'Reject block; close without containment' },
    { id: 'FORCE_BLOCK', label: 'Force Block', desc: 'Manually enforce sandbox firewall block rule' },
    { id: 'RELEASE_BLOCK', label: 'Release Block', desc: 'Remove active sandbox firewall rule' },
    { id: 'MARK_FALSE_POSITIVE', label: 'Mark False Positive', desc: 'Override outcome to benign / false positive' },
    { id: 'REOPEN', label: 'Reopen Investigation', desc: 'Re-evaluate telemetry from scratch' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyOverride(decision, reason, operator);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-[#0c1120] border border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl p-5 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Operator Human Override — {incidentId}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-2">Select Override Action:</label>
            <div className="grid grid-cols-2 gap-2">
              {actions.map((act) => (
                <button
                  type="button"
                  key={act.id}
                  onClick={() => setDecision(act.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    decision === act.id
                      ? 'bg-amber-950/60 border-amber-400 text-amber-200 ring-1 ring-amber-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{act.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{act.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Operator Name:</label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Audit Justification / Rationale:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
              placeholder="Provide reason for this manual override..."
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all"
            >
              <span>APPLY OVERRIDE</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
