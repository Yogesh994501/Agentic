import React, { useEffect, useRef, useState } from 'react';
import { Terminal, ChevronRight, ChevronDown, Eye, FileSearch, ShieldAlert, Cpu, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import type { AgentEvent } from '../lib/types';

interface AgentTimelineProps {
  events: AgentEvent[];
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ events }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const toggleRaw = (id: string) => {
    setExpandedEvents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'OBSERVE':
        return { label: 'Observation', icon: Eye, color: 'text-blue-400 bg-blue-950/60 border-blue-800' };
      case 'PLAN':
        return { label: 'Gap Analysis', icon: Cpu, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800' };
      case 'TOOL_CALL':
        return { label: 'Tool Invocation', icon: FileSearch, color: 'text-purple-300 bg-purple-950/60 border-purple-800' };
      case 'TOOL_RESULT':
        return { label: 'Tool Result', icon: Terminal, color: 'text-slate-300 bg-slate-800 border-slate-700' };
      case 'EVIDENCE':
        return { label: 'Evidence Verified', icon: ShieldAlert, color: 'text-amber-300 bg-amber-950/60 border-amber-800' };
      case 'HYPOTHESIS_UPDATE':
        return { label: 'Hypothesis Refined', icon: Sparkles, color: 'text-indigo-300 bg-indigo-950/60 border-indigo-800' };
      case 'DECISION':
        return { label: 'Outcome Decision', icon: CheckCircle2, color: 'text-rose-300 bg-rose-950/60 border-rose-800' };
      case 'ACTION':
        return { label: 'Containment Action', icon: Lock, color: 'text-red-400 bg-red-950 border-red-800 font-bold' };
      case 'VERIFY':
        return { label: 'State Verification', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-950 border-emerald-800 font-bold' };
      case 'ADAPT':
        return { label: 'Dynamic Adaptation', icon: Sparkles, color: 'text-purple-200 bg-purple-900 border-purple-600 font-bold animate-pulse' };
      case 'OVERRIDE':
        return { label: 'Human Override', icon: ShieldAlert, color: 'text-amber-200 bg-amber-900 border-amber-600 font-bold' };
      default:
        return { label: type, icon: Terminal, color: 'text-slate-400 bg-slate-900 border-slate-800' };
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4 border border-cyan-500/20 shadow-lg flex flex-col h-[540px]">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            Agent Execution Timeline
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {events.length} Steps Recorded
        </span>
      </div>

      {/* Events Stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
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
                className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-1"
              >
                {/* Event Top Bar */}
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">{timeStr}</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${badge.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                    {evt.tool && (
                      <span className="text-cyan-400 font-semibold text-[10px]">
                        tool: {evt.tool}()
                      </span>
                    )}
                  </div>
                  {evt.confidence !== undefined && evt.confidence !== null && (
                    <span className="text-purple-300 font-semibold text-[10px]">
                      conf: {evt.confidence}%
                    </span>
                  )}
                </div>

                {/* Human Readable Action Summary */}
                <div className="text-slate-200 text-xs pl-0.5 leading-relaxed font-sans mt-0.5">
                  {evt.description}
                </div>

                {/* Collapsible Raw Telemetry Toggle */}
                {hasRaw && (
                  <div className="mt-1 pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => toggleRaw(eventKey)}
                      className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      {isRawOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span>{isRawOpen ? 'Hide raw telemetry' : 'View raw telemetry'}</span>
                    </button>
                    {isRawOpen && (
                      <div className="mt-1 bg-slate-950/90 rounded p-2 text-[10px] text-slate-400 overflow-x-auto max-h-32 border border-slate-800">
                        <pre>{JSON.stringify(evt.output || evt.input, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
