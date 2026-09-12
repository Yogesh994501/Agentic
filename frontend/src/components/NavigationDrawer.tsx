import React, { useEffect } from 'react';
import {
  X,
  Shield,
  LayoutDashboard,
  PlayCircle,
  Crosshair,
  Share2,
  Activity,
  FileText,
  Lock,
  CheckCircle2
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'command-center',
    label: 'Command Center',
    description: 'SOC overview & live incident metrics',
    icon: LayoutDashboard,
  },
  {
    id: 'simulation',
    label: 'Simulation Center',
    description: 'Attack vectors, scenarios & injection',
    icon: PlayCircle,
  },
  {
    id: 'investigation',
    label: 'Live Investigation',
    description: 'Autonomous pipeline & active hypothesis',
    icon: Crosshair,
  },
  {
    id: 'evidence',
    label: 'Evidence Explorer',
    description: 'Multi-source correlation graph',
    icon: Share2,
  },
  {
    id: 'agent-trace',
    label: 'Agent Activity',
    description: 'Real-time telemetry & execution log',
    icon: Activity,
  },
  {
    id: 'decision-trace',
    label: 'Decision Trace',
    description: 'Autonomous goal, reasoning & containment',
    icon: FileText,
  },
];

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  agentStatus: 'IDLE' | 'INVESTIGATING' | 'RESPONDING';
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeSection,
  onNavigate,
  agentStatus,
}) => {
  // ESC key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleItemClick = (sectionId: string) => {
    onNavigate(sectionId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Glassmorphic Navigation Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-[#070b16]/95 backdrop-blur-2xl border-r border-cyan-500/25 shadow-[0_0_60px_rgba(0,0,0,0.85)] flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="SOC Navigation Drawer"
      >
        {/* Drawer Header */}
        <div className="h-16 px-5 border-b border-cyan-500/15 flex items-center justify-between bg-[#0a0f1e]/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-glow-cyan">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-bold tracking-wider text-slate-100 uppercase">
                  Sentinel<span className="text-cyan-400">Flow</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">
                  SOC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Command Navigation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-slate-700/50 transition-colors"
            title="Close navigation (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Header Strip */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                agentStatus === 'INVESTIGATING'
                  ? 'bg-amber-400 animate-ping'
                  : agentStatus === 'RESPONDING'
                  ? 'bg-red-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="text-slate-300 font-semibold">AGENT: {agentStatus}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/50 text-blue-300 border border-blue-800/50">
            ISOLATED
          </span>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Operational Sections
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all text-xs font-mono group ${
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div
                  className={`mt-0.5 p-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold tracking-wide ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans leading-tight">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#070b16]/90 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-blue-400" />
              <span>Sandbox Isolated</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Autonomous Active</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono text-center">
            SentinelFlow Autonomous SOC Platform
          </p>
        </div>
      </aside>
    </>
  );
};
