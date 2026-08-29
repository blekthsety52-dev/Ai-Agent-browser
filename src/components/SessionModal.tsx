import React, { useState } from 'react';
import { Layers, X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { BrowserSession } from '../types';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: BrowserSession[];
  activeSession: string;
  onSelectSession: (id: string) => void;
  onCreateSession: (id: string, name?: string) => void;
  onCloseSession: (id: string) => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSession,
  onSelectSession,
  onCreateSession,
  onCloseSession,
}) => {
  const [newSessionName, setNewSessionName] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    const id = newSessionName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    onCreateSession(id, newSessionName.trim());
    setNewSessionName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050508]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0a14] border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Ambient radial glow */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.12)_0%,transparent_60%)]" />

        {/* Header */}
        <div className="bg-[#0a0a14]/90 backdrop-blur-md px-6 py-4 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Browser Sessions</h2>
              <p className="text-xs text-slate-400 font-sans">Manage isolated browser profiles & tabs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-5 space-y-3 max-h-60 overflow-y-auto relative z-10 bg-[#050508]/40">
          <label className="text-[10px] uppercase font-mono tracking-widest text-white/40 block">
            Active Sessions ({sessions.length})
          </label>

          {sessions.map((s) => {
            const isActive = s.id === activeSession;
            return (
              <div
                key={s.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  isActive
                    ? 'bg-[#0a0a14] border-indigo-500/60 shadow-[0_0_20px_rgba(79,70,229,0.2)]'
                    : 'bg-[#050508]/80 border-white/5 hover:border-white/10'
                }`}
              >
                <div
                  onClick={() => {
                    onSelectSession(s.id);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer truncate"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{s.name || s.id}</span>
                    {isActive && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans truncate mt-0.5">
                    {s.title || s.url || 'about:blank'}
                  </p>
                </div>

                {s.id !== 'default' && (
                  <button
                    onClick={() => onCloseSession(s.id)}
                    title="Close session"
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Create New Session Form */}
        <form onSubmit={handleCreate} className="p-5 bg-[#0a0a14] border-t border-white/5 space-y-3 relative z-10">
          <label className="text-xs font-semibold text-slate-200 block">Create Isolated Session</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="e.g. ScraperSession, QA_Session..."
              className="flex-1 bg-black/40 text-slate-100 text-xs font-mono rounded-xl px-3 py-2.5 border border-white/10 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 shadow-inner"
            />
            <button
              type="submit"
              disabled={!newSessionName.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
