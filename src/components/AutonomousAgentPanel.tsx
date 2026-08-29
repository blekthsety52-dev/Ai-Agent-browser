import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  FastForward,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Copy,
  Check,
  FileText,
  ChevronRight,
  ExternalLink,
  Loader2,
  Maximize2,
  ArrowRight,
} from 'lucide-react';
import { AgentStep, AutonomousRun } from '../types';
import { formatDuration } from '../lib/utils';

interface AutonomousAgentPanelProps {
  currentRun: AutonomousRun | null;
  isRunning: boolean;
  onStartRun: (goal: string) => void;
  onStepRun: (goal: string) => void;
  onStopRun: () => void;
  onSelectWorkflow: () => void;
}

export const AutonomousAgentPanel: React.FC<AutonomousAgentPanelProps> = ({
  currentRun,
  isRunning,
  onStartRun,
  onStepRun,
  onStopRun,
  onSelectWorkflow,
}) => {
  const [goalInput, setGoalInput] = useState(
    'Navigate to news.ycombinator.com, extract the top 5 articles with points and authors, and summarize the key tech trends.'
  );
  const [copiedReport, setCopiedReport] = useState(false);
  const [selectedShot, setSelectedShot] = useState<string | null>(null);

  const sampleGoals = [
    {
      title: 'Hacker News Trends',
      prompt: 'Navigate to news.ycombinator.com, extract the top 5 articles with points and authors, and summarize the key tech trends.',
    },
    {
      title: 'Wikipedia Quantum Computing',
      prompt: 'Open en.wikipedia.org, search for "Quantum computing", navigate to the main page, and extract key milestones and physical principles.',
    },
    {
      title: 'Books Catalog Scraper',
      prompt: 'Go to books.toscrape.com, find the top 5 Five-Star rated books, extract their title, price, and availability.',
    },
    {
      title: 'DuckDuckGo Tech Search',
      prompt: 'Go to duckduckgo.com, search for "Autonomous Browser AI agents 2026", click the top authoritative link, and extract the summary.',
    },
  ];

  const handleCopyReport = () => {
    if (currentRun?.finalAnswer) {
      navigator.clipboard.writeText(currentRun.finalAnswer);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'navigate':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'click':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'fill':
        return 'bg-violet-500/10 text-violet-300 border-violet-500/30';
      case 'press':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'extract':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'scroll':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'complete':
        return 'bg-green-500/20 text-green-300 border-green-500/40';
      default:
        return 'bg-white/5 text-slate-300 border-white/10';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a14] border border-white/5 rounded-3xl overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] relative group">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08)_0%,transparent_70%)]" />

      {/* Top Header */}
      <div className="bg-[#0a0a14]/90 backdrop-blur-md px-5 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              Autonomous AI Navigation Agent
              {isRunning && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                  Running Loop
                </span>
              )}
            </h2>
            <p className="text-[11px] text-indigo-400 font-mono uppercase tracking-wider">
              Powered by agent-browser CLI & Gemini 3.7 Reasoning
            </p>
          </div>
        </div>

        <button
          onClick={onSelectWorkflow}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-medium rounded-xl border border-white/10 transition-all shadow-sm cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Preset Recipes</span>
        </button>
      </div>

      {/* Goal Formulation Area */}
      <div className="p-4 bg-[#050508]/60 border-b border-white/5 space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Define Autonomous Goal / Mission
          </label>
          <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">Natural Language Prompt</span>
        </div>

        <div className="relative">
          <textarea
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            disabled={isRunning}
            rows={2}
            placeholder="e.g. Navigate to en.wikipedia.org, search for James Webb Space Telescope, and extract launch date and top 3 scientific instruments..."
            className="w-full bg-black/40 text-indigo-100 text-xs rounded-xl p-3 border border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 resize-none font-medium leading-relaxed shadow-inner"
          />
        </div>

        {/* Quick sample prompt pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider shrink-0">Quick Goals:</span>
          {sampleGoals.map((g) => (
            <button
              key={g.title}
              onClick={() => setGoalInput(g.prompt)}
              disabled={isRunning}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium border border-white/5 shrink-0 transition-colors cursor-pointer"
            >
              {g.title}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={() => onStartRun(goalInput)}
                disabled={!goalInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Autonomous Loop</span>
              </button>
            ) : (
              <button
                onClick={onStopRun}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop Agent</span>
              </button>
            )}

            <button
              onClick={() => onStepRun(goalInput)}
              disabled={isRunning || !goalInput.trim()}
              title="Execute a single reasoning & interaction step"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-medium rounded-xl border border-white/10 disabled:opacity-50 transition-all cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5 text-indigo-400" />
              <span>Step-by-Step</span>
            </button>
          </div>

          {currentRun && (
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>Steps: <strong className="text-white font-bold">{currentRun.steps.length}</strong></span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span>Status: <strong className={`capitalize ${currentRun.status === 'completed' ? 'text-emerald-400' : currentRun.status === 'running' ? 'text-indigo-400' : 'text-slate-300'}`}>{currentRun.status}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Main Execution Timeline / Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {/* If we have a completed Final Synthesis Report */}
        {currentRun?.finalAnswer && (
          <div className="bg-[#050508]/90 border border-indigo-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(79,70,229,0.15)]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Mission Synthesized Report</h3>
              </div>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
              >
                {copiedReport ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedReport ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="prose prose-invert prose-xs max-w-none text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
              {currentRun.finalAnswer}
            </div>
          </div>
        )}

        {/* Steps Timeline */}
        {currentRun && currentRun.steps.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest font-mono">
              Action Timeline ({currentRun.steps.length} Steps)
            </h4>

            {currentRun.steps.map((step, idx) => (
              <div
                key={step.id || idx}
                className="bg-[#050508]/80 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-3.5 transition-all space-y-2.5 shadow-sm"
              >
                {/* Step Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 text-slate-300 text-[11px] font-mono font-bold flex items-center justify-center border border-white/10">
                      {step.stepNumber}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border font-semibold ${getActionBadgeColor(
                        step.actionType
                      )}`}
                    >
                      {step.actionType}
                    </span>
                    {step.targetRef && (
                      <span className="text-[11px] font-mono text-indigo-400 font-bold">
                        {step.targetRef}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(step.durationMs)}</span>
                  </div>
                </div>

                {/* Thought Reasoning */}
                <div className="text-xs text-slate-200 font-medium pl-2.5 border-l-2 border-indigo-500 leading-relaxed">
                  {step.thought}
                </div>

                {/* CLI Command */}
                <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-1.5 border border-white/5 font-mono text-xs text-indigo-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <Terminal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{step.command}</span>
                  </div>
                </div>

                {/* Command Output */}
                {step.output && (
                  <div className="bg-black/30 rounded-xl p-2.5 text-[11px] font-mono text-slate-400 border border-white/5 max-h-28 overflow-y-auto whitespace-pre-wrap">
                    {step.output}
                  </div>
                )}

                {/* Thumbnail Screenshot if available */}
                {step.screenshotUrl && (
                  <div className="pt-1">
                    <button
                      onClick={() => setSelectedShot(step.screenshotUrl || null)}
                      className="group relative inline-block rounded-xl border border-white/10 hover:border-indigo-500 overflow-hidden transition-colors shadow-sm"
                    >
                      <img
                        src={step.screenshotUrl}
                        alt={`Screenshot step ${step.stepNumber}`}
                        className="h-16 w-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-[#050508]/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty Timeline Placeholder */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
            <div className="p-3.5 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.15)]">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Ready for Autonomous Execution</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Enter an objective above and press "Run Autonomous Loop". The AI agent will plan actions, interact with page elements via refs, and extract required data.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Screenshot Zoom Modal */}
      {selectedShot && (
        <div
          className="fixed inset-0 z-50 bg-[#050508]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedShot(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-[#0a0a14] rounded-2xl border border-white/10 p-3 overflow-hidden shadow-2xl">
            <img
              src={selectedShot}
              alt="Expanded Step Viewport"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <div className="text-center text-xs text-slate-400 py-2 font-mono">
              Click anywhere to dismiss preview
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
