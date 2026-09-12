import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Lock, Menu } from 'lucide-react';
import type { SandboxState } from '../lib/types';

export interface NavSection {
  id: string;
  label: string;
}

export const NAV_SECTIONS: NavSection[] = [
  { id: 'command-center', label: 'COMMAND CENTER' },
  { id: 'simulation', label: 'SIMULATION' },
  { id: 'investigation', label: 'INVESTIGATION' },
  { id: 'evidence', label: 'EVIDENCE' },
  { id: 'agent-trace', label: 'AGENT TRACE' },
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
    <header className="h-16 border-b border-cyan-500/20 bg-[#070a13]/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between gap-3">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
        {/* Hamburger Menu Button */}
        <button
          onClick={onOpenDrawer}
          className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 hover:border-cyan-500/40 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* SentinelFlow Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-glow-cyan shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm sm:text-base font-bold tracking-wider text-slate-100 uppercase">
                Sentinel<span className="text-cyan-400">Flow</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">
                v1.0-SOC
              </span>
            </div>
            <p className="hidden md:block text-[10px] sm:text-[11px] text-slate-400 font-mono tracking-tight leading-none mt-0.5">
              Autonomous Investigation & Containment Engine
            </p>
          </div>
        </div>
      </div>

      {/* Center: Compact Desktop Navigation with Active Section Indicator */}
      <nav
        className="hidden lg:flex items-center space-x-1 font-mono text-xs"
        aria-label="Main Operations Navigation"
      >
        {NAV_SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => onNavigate(sec.id)}
              className={`relative px-3 py-1.5 rounded-md transition-all font-semibold tracking-wider cursor-pointer ${
                isActive
                  ? 'text-cyan-300 bg-cyan-500/10 shadow-[inset_0_0_10px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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

      {/* Right: SOC Status Badges Hierarchy & Sandbox Controls */}
      <div className="flex items-center gap-2 text-xs font-mono shrink-0">
        {/* Dynamic Live Agent State */}
        <div
          className={`flex items-center space-x-1.5 sm:space-x-2 h-8 px-2.5 sm:px-3 rounded-md border transition-all ${
            agentStatus === 'INVESTIGATING'
              ? 'bg-amber-950/70 border-amber-400/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-pulse'
              : agentStatus === 'RESPONDING'
              ? 'bg-red-950/70 border-red-400/80 text-red-200 shadow-glow-red'
              : 'bg-slate-900/90 border-slate-700/70 text-slate-300'
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
          <span className="font-bold tracking-wide text-[11px] sm:text-xs">
            AGENT: {agentStatus}
          </span>
        </div>

        {/* Autonomous Mode */}
        <div className="hidden sm:flex items-center space-x-1.5 h-8 px-2.5 rounded-md bg-emerald-950/30 border border-emerald-500/30 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="font-semibold text-[11px]">AUTONOMOUS</span>
        </div>

        {/* Sandbox State */}
        <div className="hidden md:flex items-center space-x-1.5 h-8 px-2.5 rounded-md bg-blue-950/30 border border-blue-500/30 text-blue-300 text-[11px]">
          <Lock className="w-3 h-3 text-blue-400" />
          <span>SANDBOX ISOLATED</span>
        </div>

        {/* Quiet Clock */}
        <div className="hidden xl:flex h-8 px-2.5 rounded-md bg-slate-900/50 border border-slate-800 text-slate-500 text-[11px] items-center">
          {currentTime}
        </div>

        {/* Reset Sandbox */}
        <button
          onClick={onReset}
          disabled={isResetting}
          className="flex items-center space-x-1 h-8 px-2.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600/60 transition-all text-xs font-medium disabled:opacity-50 cursor-pointer"
          title="Reset sandbox state and incidents"
        >
          <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reset'}</span>
        </button>
      </div>
    </header>
  );
};
