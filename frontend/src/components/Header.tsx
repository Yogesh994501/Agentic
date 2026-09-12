import React, { useState, useEffect } from 'react';
import { Shield, Activity, RefreshCw, Server, Lock } from 'lucide-react';
import { SandboxState } from '../lib/types';

interface HeaderProps {
  sandboxState: SandboxState | null;
  agentStatus: 'IDLE' | 'INVESTIGATING' | 'RESPONDING';
  onReset: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  sandboxState,
  agentStatus,
  onReset,
  isResetting
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-cyan-500/20 bg-[#070a13]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 shadow-glow-cyan">
            <Shield className="w-6 h-6 animate-pulse-slow" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">
                Sentinel<span className="text-cyan-400">Flow</span>
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-mono">
                v1.0-SOC
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-tight">
              Autonomous Investigation & Containment Engine
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Autonomous Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 shadow-glow-emerald">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold">AUTONOMOUS SOC ACTIVE</span>
          </div>

          {/* Sandbox Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-blue-950/40 border border-blue-500/30 text-blue-300">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>SANDBOX: <strong className="text-cyan-400">ISOLATED</strong></span>
          </div>

          {/* Agent Status */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border ${
            agentStatus === 'INVESTIGATING'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 animate-pulse'
              : agentStatus === 'RESPONDING'
              ? 'bg-red-950/40 border-red-500/40 text-red-300'
              : 'bg-slate-900 border-slate-700 text-slate-300'
          }`}>
            <Activity className="w-3.5 h-3.5" />
            <span>AGENT: <strong>{agentStatus}</strong></span>
          </div>

          {/* Clock */}
          <div className="px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-800 text-slate-400">
            {currentTime}
          </div>

          {/* Reset Sandbox Button */}
          <button
            onClick={onReset}
            disabled={isResetting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all text-xs font-semibold disabled:opacity-50"
            title="Reset sandbox state, rules, and incidents to initial state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset Sandbox'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
