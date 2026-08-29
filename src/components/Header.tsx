import React from 'react';
import {
  Compass,
  Terminal,
  Bot,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  Server,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { BrowserSession } from '../types';

interface HeaderProps {
  activeTab: 'agent' | 'viewport' | 'terminal' | 'snapshot' | 'templates';
  setActiveTab: (tab: 'agent' | 'viewport' | 'terminal' | 'snapshot' | 'templates') => void;
  sessions: BrowserSession[];
  activeSession: string;
  setActiveSession: (id: string) => void;
  onNewSession: () => void;
  onRefreshAll: () => void;
  isBusy: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  sessions,
  activeSession,
  setActiveSession,
  onNewSession,
  onRefreshAll,
  isBusy,
}) => {
  return (
    <header className="border-b border-white/5 bg-[#0a0a14]/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand Identity & Active Session */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white font-bold shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">
                  Agent Browser Engine
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold tracking-wider">
                  CDP Node
                </span>
              </div>
              <p className="text-[11px] text-indigo-400 font-mono uppercase tracking-widest">Autonomous Navigation Node // Online</p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          {/* Session Selector */}
          <div className="flex items-center gap-1.5">
            <div className="relative inline-block">
              <select
                value={activeSession}
                onChange={(e) => setActiveSession(e.target.value)}
                className="appearance-none bg-[#050508] hover:bg-[#0f0f1c] text-slate-200 text-xs font-mono rounded-lg pl-3 pr-8 py-1.5 border border-white/10 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    session: {s.name || s.id}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              onClick={onNewSession}
              title="Create new browser session"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center p-1 bg-[#050508]/80 rounded-xl border border-white/5 w-full md:w-auto justify-center overflow-x-auto shadow-inner">
          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'agent'
                ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Autonomous AI</span>
          </button>

          <button
            onClick={() => setActiveTab('viewport')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'viewport'
                ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Live Viewport</span>
          </button>

          <button
            onClick={() => setActiveTab('snapshot')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'snapshot'
                ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>DOM / A11y Tree</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'terminal'
                ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Workflows</span>
          </button>
        </nav>

        {/* Right: Health & Engine Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
            <span>Chrome CDP Ready</span>
          </div>

          <button
            onClick={onRefreshAll}
            disabled={isBusy}
            title="Refresh snapshot and view"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 disabled:opacity-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
