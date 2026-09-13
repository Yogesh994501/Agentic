import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Lock, Menu } from 'lucide-react';
import type { SandboxState } from '../lib/types';

export interface NavSection {
  id: string;
  label: string;
}

export const NAV_SECTIONS: NavSection[] = [
  { id: 'command-center', label: 'COMMAND' },
  { id: 'simulation', label: 'SIMULATION' },
  { id: 'investigation', label: 'INVESTIGATION' },
  { id: 'evidence', label: 'EVIDENCE' },
  { id: 'agent-trace', label: 'TRACE' },
];

interface HeaderProps {
  sandboxState?: SandboxState | null;
  agentStatus: 'IDLE' | 'INVESTIGATING' | 'RESPONDING';
  onReset: () => void;
  isResetting: boolean;
  onOpenDrawer: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  agentStatus,
  onReset,
  isResetting,
  onOpenDrawer,
  activeSection,
  onNavigate,
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
    <header className="h-16 border-b border-cyan-500/20 bg-[#070b14]/85 backdrop-blur-md sticky top-0 z-50 px-3 sm:px-5 flex items-center justify-between gap-2 max-w-full overflow-hidden">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Hamburger Menu Button */}
        <button
          onClick={onOpenDrawer}
          className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 hover:border-cyan-500/40 transition-colors cursor-pointer"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* SentinelFlow Brand */}
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-glow-cyan shrink-0">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm sm:text-base font-bold tracking-wider text-slate-100 uppercase leading-none">
                Sentinel<span className="text-cyan-400">Flow</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">
                SOC
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-slate-400 font-mono tracking-tight leading-none mt-0.5">
              Autonomous Engine
            </p>
          </div>
        </div>
      </div>

      {/* Center: Compact Navigation Tabs (shown on xl+ screens so it never squishes the right controls) */}
      <nav
        className="hidden xl:flex items-center space-x-1 font-mono text-xs shrink-0"
        aria-label="Main Operations Navigation"
      >
        {NAV_SECTIONS.map((sec) => {
          const isActive =
            activeSection === sec.id ||
            (sec.id === 'agent-trace' && activeSection === 'decision-trace');
          return (
            <button
              key={sec.id}
              onClick={() => onNavigate(sec.id)}
              className={`relative px-2.5 py-1.5 rounded-md transition-all font-semibold tracking-wide cursor-pointer ${
                isActive
                  ? 'text-cyan-300 bg-cyan-500/15 shadow-[inset_0_0_10px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{sec.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Agent Status & Prominent Reset Sandbox Button */}
      <div className="flex items-center gap-2 text-xs font-mono shrink-0">
        {/* Dynamic Live Agent State */}
        <div
          className={`flex items-center space-x-1.5 h-8 px-2.5 rounded-md border transition-all ${
            agentStatus === 'INVESTIGATING'
              ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-pulse'
              : agentStatus === 'RESPONDING'
              ? 'bg-red-950/80 border-red-400 text-red-200 shadow-glow-red'
              : 'bg-slate-900/90 border-slate-700 text-slate-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              agentStatus === 'INVESTIGATING'
                ? 'bg-amber-400 animate-ping'
                : agentStatus === 'RESPONDING'
                ? 'bg-red-400'
                : 'bg-slate-500'
            }`}
          />
          <span className="font-bold tracking-wide text-xs">
            AGENT: {agentStatus}
          </span>
        </div>

        {/* Sandbox State */}
        <div className="hidden lg:flex items-center space-x-1.5 h-8 px-2.5 rounded-md bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs">
          <Lock className="w-3 h-3 text-blue-400" />
          <span>SANDBOX ISOLATED</span>
        </div>

        {/* Quiet Clock (only on large 2xl screens) */}
        <div className="hidden 2xl:flex h-8 px-2.5 rounded-md bg-slate-900/50 border border-slate-800 text-slate-500 text-xs items-center">
          {currentTime}
        </div>

        {/* PROMINENT RESET SANDBOX BUTTON - ALWAYS VISIBLE */}
        <button
          onClick={onReset}
          disabled={isResetting}
          className="flex items-center space-x-1.5 h-8 px-3 rounded-lg bg-red-950/50 hover:bg-red-900/70 text-red-200 hover:text-white border border-red-500/50 hover:border-red-400 transition-all text-xs font-bold shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
          title="Reset sandbox state, clear incidents, and reset all mock tools"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset Sandbox'}</span>
        </button>
      </div>
    </header>
  );
};
