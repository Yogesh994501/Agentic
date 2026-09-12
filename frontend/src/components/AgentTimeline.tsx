import React, { useEffect, useRef, useState } from 'react';
import { Terminal, ChevronRight, ChevronDown, Eye, FileSearch, ShieldAlert, Cpu, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import type { AgentEvent } from '../lib/types';

interface AgentTimelineProps {
  events: AgentEvent[];
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ events }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  // Auto-scroll ONLY within the timeline container itself, NEVER scrolling the main window!
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [events]);

  const toggleRaw = (id: string) => {
    setExpandedEvents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'OBSERVE':
        return { label: 'Observation', icon: Eye, color: 'text-blue-300 bg-blue-950/70 border-blue-700/60' };
      case 'PLAN':
        return { label: 'Gap Analysis', icon: Cpu, color: 'text-cyan-300 bg-cyan-950/70 border-cyan-700/60' };
      case 'TOOL_CALL':
        return { label: 'Tool Invocation', icon: FileSearch, color: 'text-purple-300 bg-purple-950/70 border-purple-700/60' };
      case 'TOOL_RESULT':
        return { label: 'Tool Result', icon: Terminal, color: 'text-slate-300 bg-slate-850 border-slate-700' };
      case 'EVIDENCE':
        return { label: 'Evidence Verified', icon: ShieldAlert, color: 'text-amber-300 bg-amber-950/70 border-amber-700/60' };
      case 'HYPOTHESIS_UPDATE':
        return { label: 'Hypothesis Refined', icon: Sparkles, color: 'text-indigo-300 bg-indigo-950/70 border-indigo-700/60' };
      case 'DECISION':
        return { label: 'Outcome Decision', icon: CheckCircle2, color: 'text-rose-300 bg-rose-950/70 border-rose-700/60' };
      case 'ACTION':
        return { label: 'Containment Action', icon: Lock, color: 'text-red-300 bg-red-950/90 border-red-600 font-bold' };
      case 'VERIFY':
        return { label: 'State Verification', icon: CheckCircle2, color: 'text-emerald-300 bg-emerald-950/90 border-emerald-600 font-bold' };
      case 'ADAPT':
        return { label: 'Dynamic Adaptation', icon: Sparkles, color: 'text-purple-200 bg-purple-900/90 border-purple-500 font-bold animate-pulse' };
      case 'OVERRIDE':
        return { label: 'Human Override', icon: ShieldAlert, color: 'text-amber-200 bg-amber-900/90 border-amber-500 font-bold' };
      default:
        return { label: type, icon: Terminal, color: 'text-slate-300 bg-slate-900 border-slate-800' };
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 sm:p-6 border border-cyan-500/20 shadow-lg flex flex-col h-[580px]">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2.5">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-100 font-mono">
            Agent Execution Timeline
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-300 bg-slate-900/90 px-3 py-1 rounded-md border border-slate-800 font-semibold">
          {events.length} Steps Recorded
        </span>
      </div>

      {/* Events Stream with container-only scroll (never jumps the window) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono scroll-smooth"
      >
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm italic font-mono">
            Investigation pipeline standby. Launch a scenario to stream live reasoning steps.
          </div>
        ) : (
          events.map((evt, idx) => {
            const timeStr = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false }) : '';
            const badge = getEventBadge(evt.event_type);
            const Icon = badge.icon;
            const eventKey = evt.event_id || `evt-${idx}`;
            const isRawOpen = expandedEvents[eventKey];
            const hasRaw = !!evt.output || !!evt.input;

            return (
              <div
                key={eventKey}
                className="p-4 rounded-xl bg-slate-900/75 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-2 shadow-sm"
              >
                {/* Event Top Bar: Timestamps & Badges (11-12px) */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-400 font-semibold">{timeStr}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badge.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                    {evt.tool && (
                      <span className="text-cyan-300 font-semibold text-xs bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                        tool: {evt.tool}()
                      </span>
                    )}
                  </div>
                  {evt.confidence !== undefined && evt.confidence !== null && (
                    <span className="text-purple-300 font-bold text-xs bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
                      Confidence: {evt.confidence}%
                    </span>
                  )}
                </div>

                {/* Human Readable Action Summary: 13-14px */}
                <div className="text-slate-100 text-xs sm:text-[13px] sm:text-sm pl-0.5 leading-relaxed font-sans">
                  {evt.description}
                </div>

                {/* Collapsible Raw Telemetry Toggle */}
                {hasRaw && (
                  <div className="mt-1 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => toggleRaw(eventKey)}
                      className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer font-mono"
                    >
                      {isRawOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{isRawOpen ? 'Hide raw event' : '▸ View raw event'}</span>
                    </button>
                    {isRawOpen && (
                      <div className="mt-2 bg-slate-950/90 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto max-h-40 border border-slate-800">
                        <pre className="font-mono leading-normal">{JSON.stringify(evt.output || evt.input, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
