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
    <div className="glass-panel rounded-xl p-5 sm:p-6 border border-cyan-500/20 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-100 font-mono">
            Simulation Control Center
          </h2>
          <span className="text-xs bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2.5 py-0.5 rounded font-mono font-semibold">
            Interactive Scenarios
          </span>
        </div>

        {/* Resilience Tool Failure Simulator */}
        <div className="flex items-center space-x-2 text-xs sm:text-sm font-mono bg-slate-900/90 px-3.5 py-1.5 rounded-lg border border-slate-700/60">
          <AlertTriangle className={`w-4 h-4 ${toolFailureActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-slate-300 font-semibold">Tool Resilience:</span>
          <button
            onClick={() => onToggleToolFailure('get_server_logs', !toolFailureActive)}
            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {toolFailureActive ? (
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <ToggleRight className="w-5 h-5 text-amber-400" /> get_server_logs Offline
              </span>
            ) : (
              <span className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5">
                <ToggleLeft className="w-5 h-5 text-slate-500" /> All Tools Online
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Scenario Selection Grid (115-125px height, clean scannable text) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-4">
        {Object.values(scenarios).map((sc) => {
          const isSelected = sc.scenario_id === selectedScenarioId;
          const info = scenarioSummaries[sc.scenario_id] || { target: sc.name, summary: sc.description };

          return (
            <button
              key={sc.scenario_id}
              onClick={() => onSelectScenario(sc.scenario_id)}
              className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer min-h-[120px] ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-400 shadow-glow-cyan text-white ring-1 ring-cyan-400'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between font-mono mb-1.5">
                  <span className="font-bold text-cyan-300 text-xs">#{sc.scenario_id.replace('scenario_', '0')}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded uppercase font-bold tracking-wide ${
                    sc.expected_outcome === 'ATTACK_SUCCEEDED' ? 'bg-red-950/90 text-red-300 border border-red-800/70' :
                    sc.expected_outcome === 'ATTACK_FAILED' ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/70' :
                    'bg-amber-950/90 text-amber-300 border border-amber-800/70'
                  }`}>
                    {sc.expected_outcome.replace('ATTACK_', '')}
                  </span>
                </div>
                <div className="font-bold text-slate-100 text-sm tracking-tight leading-snug">
                  {info.target}
                </div>
              </div>
              <p className="text-[12px] text-slate-400 mt-2 leading-relaxed">
                {info.summary}
              </p>
            </button>
          );
        })}
      </div>

      {/* Action Bar */}
      {currentScenario && (
        <div className="bg-slate-900/90 rounded-xl p-4 sm:p-4.5 border border-slate-800/90 flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="flex flex-wrap items-center gap-2.5">
              <Flame className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-100 text-sm sm:text-[15px]">{currentScenario.name}</span>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/50">
                Target: {currentScenario.target_asset} ({currentScenario.alert_id})
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-300 mt-1.5 leading-relaxed">
              <strong className="text-slate-100 font-semibold">Demonstrates:</strong> {currentScenario.demonstrates}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Start Investigation Button */}
            <button
              onClick={() => onLaunchScenario(selectedScenarioId)}
              disabled={isInvestigating}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-glow-cyan transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className={`w-4 h-4 fill-current ${isInvestigating ? 'animate-spin' : ''}`} />
              <span>{isInvestigating ? 'INVESTIGATING...' : 'START INVESTIGATION'}</span>
            </button>

            {/* Inject New Evidence */}
            <button
              onClick={onOpenInjectModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              title="Inject delayed/contradictory evidence to trigger agent adaptation"
            >
              <Syringe className="w-4 h-4 text-purple-400" />
              <span>INJECT EVIDENCE</span>
            </button>

            {/* Simulate Human Override */}
            <button
              onClick={onOpenOverrideModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-500/40 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              title="Override agent decision"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>HUMAN OVERRIDE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
