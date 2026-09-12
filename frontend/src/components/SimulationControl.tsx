import React from 'react';
import { Play, Syringe, AlertTriangle, UserCheck, Flame, Cpu, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Scenario } from '../lib/types';

interface SimulationControlProps {
  scenarios: Record<string, Scenario>;
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onLaunchScenario: (scenarioId: string) => void;
  onOpenInjectModal: () => void;
  onOpenOverrideModal: () => void;
  onToggleToolFailure: (toolName: string, shouldFail: boolean) => void;
  toolFailureActive: boolean;
  isInvestigating: boolean;
}

export const SimulationControl: React.FC<SimulationControlProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onLaunchScenario,
  onOpenInjectModal,
  onOpenOverrideModal,
  onToggleToolFailure,
  toolFailureActive,
  isInvestigating
}) => {
  const currentScenario = scenarios[selectedScenarioId];

  // Concise descriptions specifically tuned for judging scannability
  const scenarioSummaries: Record<string, { target: string; summary: string }> = {
    scenario_1: {
      target: 'Server-07 · Apache Struts RCE',
      summary: 'CVE-2023-50164 + packet OGNL + HTTP 200 log confirm exploitation.'
    },
    scenario_2: {
      target: 'Server-03 · WAF SQLi Defense',
      summary: 'WAF intercepted probe with HTTP 403; database completely untouched.'
    },
    scenario_3: {
      target: 'Server-09 · Encrypted TLS Probe',
      summary: 'Dropped mTLS connection with zero persistence; inconclusive data.'
    },
    scenario_4: {
      target: 'Server-02 · Hidden Redis RCE',
      summary: 'Low severity alert hides unpatched CVE and administrative token leak.'
    },
    scenario_5: {
      target: 'Server-05 · Dynamic Adaptation',
      summary: '72% Failed preliminary verdict reverses to 91% Succeeded on delayed log.'
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4 border border-cyan-500/20 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            Simulation Control Center
          </h2>
          <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded font-mono">
            Interactive Scenarios
          </span>
        </div>

        {/* Resilience Tool Failure Simulator */}
        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900/90 px-3 py-1 rounded-md border border-slate-700/60">
          <AlertTriangle className={`w-3.5 h-3.5 ${toolFailureActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-slate-400">Tool Resilience:</span>
          <button
            onClick={() => onToggleToolFailure('get_server_logs', !toolFailureActive)}
            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {toolFailureActive ? (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <ToggleRight className="w-4 h-4 text-amber-400" /> get_server_logs Offline
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <ToggleLeft className="w-4 h-4 text-slate-500" /> All Tools Online
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Scenario Selection Grid (105-115px height for scannability) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 mb-3">
        {Object.values(scenarios).map((sc) => {
          const isSelected = sc.scenario_id === selectedScenarioId;
          const info = scenarioSummaries[sc.scenario_id] || { target: sc.name, summary: sc.description };

          return (
            <button
              key={sc.scenario_id}
              onClick={() => onSelectScenario(sc.scenario_id)}
              className={`h-[110px] p-3 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/50 border-cyan-400/90 shadow-glow-cyan text-white ring-1 ring-cyan-500'
                  : 'bg-slate-900/70 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between font-mono mb-1">
                  <span className="font-bold text-cyan-300">#{sc.scenario_id.replace('scenario_', '0')}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold ${
                    sc.expected_outcome === 'ATTACK_SUCCEEDED' ? 'bg-red-950 text-red-300 border border-red-800' :
                    sc.expected_outcome === 'ATTACK_FAILED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {sc.expected_outcome.replace('ATTACK_', '')}
                  </span>
                </div>
                <div className="font-bold text-slate-100 truncate text-[11px]">
                  {info.target}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                {info.summary}
              </p>
            </button>
          );
        })}
      </div>

      {/* Action Bar */}
      {currentScenario && (
        <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-200 text-xs">{currentScenario.name}</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Target: {currentScenario.target_asset} ({currentScenario.alert_id})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              <strong className="text-slate-300">Demonstrates:</strong> {currentScenario.demonstrates}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Start Investigation Button */}
            <button
              onClick={() => onLaunchScenario(selectedScenarioId)}
              disabled={isInvestigating}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isInvestigating ? 'animate-spin' : ''}`} />
              <span>{isInvestigating ? 'INVESTIGATING...' : 'START INVESTIGATION'}</span>
            </button>

            {/* Inject New Evidence */}
            <button
              onClick={onOpenInjectModal}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-all"
              title="Inject delayed/contradictory evidence to trigger agent adaptation"
            >
              <Syringe className="w-3.5 h-3.5" />
              <span>INJECT EVIDENCE</span>
            </button>

            {/* Simulate Human Override */}
            <button
              onClick={onOpenOverrideModal}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
              title="Override agent decision"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>HUMAN OVERRIDE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
