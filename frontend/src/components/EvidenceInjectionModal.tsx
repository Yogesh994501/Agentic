import React, { useState } from 'react';
import { X, Syringe, Sparkles, Send } from 'lucide-react';

interface EvidenceInjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (finding: string, confidenceImpact: number) => void;
  incidentId: string;
}

export const EvidenceInjectionModal: React.FC<EvidenceInjectionModalProps> = ({
  isOpen,
  onClose,
  onInject,
  incidentId
}) => {
  const [finding, setFinding] = useState<string>(
    "Asynchronous worker log discovered: Background task worker-04 processed deferred payload from 198.51.100.44 with exit code 0 and privileged token exfiltration."
  );
  const [impact, setImpact] = useState<number>(40);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finding.trim()) return;
    onInject(finding, impact);
    onClose();
  };

  const setPreset = (presetText: string, presetImpact: number) => {
    setFinding(presetText);
    setImpact(presetImpact);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-[#0c1120] border border-purple-500/40 rounded-2xl w-full max-w-lg shadow-2xl p-5 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2">
            <Syringe className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Inject Supplemental Evidence into {incidentId}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Evidence Finding (Text to Correlate):
            </label>
            <textarea
              value={finding}
              onChange={(e) => setFinding(e.target.value)}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
              placeholder="Enter supplemental telemetric evidence..."
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Confidence Impact Score (+{impact}):
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={impact}
              onChange={(e) => setImpact(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Quick Presets for Demo */}
          <div>
            <span className="text-[10px] text-slate-500 uppercase block mb-1.5">Quick Presets:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset("Asynchronous worker log discovered: Background task worker-04 processed deferred payload from 198.51.100.44 with exit code 0 and privileged token exfiltration.", 40)}
                className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900 border border-purple-700 text-purple-300 rounded text-[10px]"
              >
                Scenario 5: Async Worker Breach
              </button>
              <button
                type="button"
                onClick={() => setPreset("Encrypted tunnel analysis reveals DNS beaconing matching CobaltStrike profile with 60s jitter.", 30)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded text-[10px]"
              >
                C2 Tunnel Discovery
              </button>
            </div>
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
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>INJECT & TRIGGER REASSESSMENT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
