import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Send,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Camera,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ExecResult } from '../types';
import { formatDuration } from '../lib/utils';

interface CommandStudioProps {
  onExecute: (args: string[]) => Promise<ExecResult | null>;
  history: ExecResult[];
  onClearHistory: () => void;
  isLoading: boolean;
}

export const CommandStudio: React.FC<CommandStudioProps> = ({
  onExecute,
  history,
  onClearHistory,
  isLoading,
}) => {
  const [commandInput, setCommandInput] = useState('open https://news.ycombinator.com');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isLoading) return;

    // Split arguments respecting quotes
    const raw = commandInput.trim().replace(/^agent-browser\s+/, '');
    const args: string[] = [];
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
      if (match[1]) args.push(match[1]);
      else if (match[2]) args.push(match[2]);
      else args.push(match[0]);
    }

    if (args.length > 0) {
      await onExecute(args);
    }
  };

  const quickCommands = [
    { label: 'snapshot -i', cmd: 'snapshot -i', desc: 'Interactive accessibility tree' },
    { label: 'click @ref', cmd: 'click @e1', desc: 'Click element by ref' },
    { label: 'fill @ref', cmd: 'fill @e2 "search query"', desc: 'Fill input field' },
    { label: 'press Enter', cmd: 'press Enter', desc: 'Send keyboard key' },
    { label: 'scroll down', cmd: 'scroll down', desc: 'Scroll viewport down' },
    { label: 'get text @ref', cmd: 'get text @e1', desc: 'Extract element text' },
    { label: 'screenshot', cmd: 'screenshot', desc: 'Take page screenshot' },
    { label: 'cookies', cmd: 'cookies', desc: 'Inspect session cookies' },
    { label: 'eval title', cmd: 'eval "document.title"', desc: 'Evaluate JavaScript' },
  ];

  const handleCopy = (stdout: string, idx: number) => {
    navigator.clipboard.writeText(stdout);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a14] border border-white/5 rounded-3xl overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] relative group">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08)_0%,transparent_70%)]" />

      {/* Header */}
      <div className="bg-[#0a0a14]/90 backdrop-blur-md px-5 py-4 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
            <TerminalIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              agent-browser CLI Studio
            </h2>
            <p className="text-[11px] text-slate-400 font-sans">Direct interactive command line execution</p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          disabled={history.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs border border-white/10 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Quick Command Chips */}
      <div className="px-4 py-2.5 bg-[#050508]/60 border-b border-white/5 flex items-center gap-2 overflow-x-auto relative z-10">
        <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider shrink-0">Chips:</span>
        {quickCommands.map((q) => (
          <button
            key={q.cmd}
            onClick={() => setCommandInput(q.cmd)}
            title={q.desc}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-indigo-300 border border-white/5 hover:border-indigo-500/30 text-xs font-mono shrink-0 transition-all cursor-pointer"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs bg-[#050508]/90 relative z-10">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 mb-3">
              <TerminalIcon className="w-8 h-8" />
            </div>
            <p className="text-slate-300 font-sans text-xs font-medium">No CLI commands run yet in this session.</p>
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Type an agent-browser command below or click a chip to execute.
            </p>
          </div>
        ) : (
          history.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#0a0a14] border border-white/5 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Command Banner */}
              <div className="bg-black/30 px-3.5 py-2 border-b border-white/5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  {item.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span className="text-indigo-300 font-bold truncate">$ {item.command}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 shrink-0">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(item.durationMs)}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(item.stdout || item.stderr, idx)}
                    title="Copy output"
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedId === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Stdout Output */}
              {item.stdout && (
                <div className="p-3.5 text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-indigo-600/30">
                  {item.stdout}
                </div>
              )}

              {/* Stderr Output */}
              {item.stderr && (
                <div className="p-3.5 text-rose-300 bg-rose-950/20 border-t border-rose-900/30 whitespace-pre-wrap leading-relaxed">
                  {item.stderr}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Input Prompt Form */}
      <form onSubmit={handleSubmit} className="p-3.5 bg-[#0a0a14] border-t border-white/5 flex items-center gap-2.5 relative z-10">
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-3.5 text-indigo-400 font-mono text-xs font-bold pointer-events-none">
            $
          </span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="agent-browser open https://... or snapshot -i or click @e1"
            className="w-full bg-black/40 text-indigo-100 font-mono text-xs rounded-xl pl-8 pr-3 py-2.5 border border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !commandInput.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};
