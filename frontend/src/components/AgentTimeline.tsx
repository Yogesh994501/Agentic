import React, { useEffect, useRef } from 'react';
import { Terminal, Check, AlertTriangle, Play, ShieldAlert, Cpu, Wrench, Eye, RotateCw } from 'lucide-react';
import { AgentEvent } from '../lib/types';

interface AgentTimelineProps {
  events: AgentEvent[];
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ events }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'OBSERVE':
        return 'bg-blue-950/80 text-blue-400 border-blue-800';
      case 'PLAN':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800';
      case 'TOOL_CALL':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'TOOL_RESULT':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'EVIDENCE':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'HYPOTHESIS_UPDATE':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800';
      case 'DECISION':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'ACTION':
        return 'bg-red-950 text-red-400 border-red-800 font-bold';
      case 'VERIFY':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800 font-bold';
      case 'ADAPT':
        return 'bg-purple-900 text-purple-200 border-purple-600 font-bold animate-pulse';
      case 'OVERRIDE':
        return 'bg-amber-900 text-amber-200 border-amber-600 font-bold';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4 border border-cyan-500/20 shadow-lg flex flex-col h-[520px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            Autonomous Agent Timeline & Execution Trace
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {events.length} Events Logged
        </span>
      </div>

      {/* Events Stream */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 font-mono text-xs">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            Investigation pipeline idle. Launch a scenario to stream live reasoning events.
          </div>
        ) : (
          events.map((evt, idx) => {
            const timeStr = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false }) : '';
            return (
              <div
                key={evt.event_id || idx}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-1 relative group"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">{timeStr}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] border font-bold uppercase ${getBadgeStyle(evt.event_type)}`}>
                      {evt.event_type}
                    </span>
                    {evt.tool && (
                      <span className="text-cyan-400/90 text-[10px] font-semibold">
                        tool: {evt.tool}()
                      </span>
                    )}
                  </div>
                  {evt.confidence !== undefined && evt.confidence !== null && (
                    <span className="text-purple-400 font-semibold text-[10px]">
                      conf: {evt.confidence}%
                    </span>
                  )}
                </div>

                <div className="text-slate-200 text-xs pl-0.5 leading-relaxed">
                  {evt.description}
                </div>

                {evt.output && (
                  <div className="mt-1 bg-slate-950/70 rounded p-1.5 text-[10px] text-slate-400 overflow-x-auto max-h-24">
                    <pre>{JSON.stringify(evt.output, null, 2)}</pre>
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
