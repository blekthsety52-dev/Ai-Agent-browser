import React, { useState } from 'react';
import {
  Layers,
  Search,
  MousePointer,
  Tag,
  Copy,
  Check,
  RefreshCw,
  Code,
  FileCode,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { SnapshotNode } from '../types';

interface SnapshotInspectorProps {
  nodes: SnapshotNode[];
  rawSnapshot: string;
  pageTitle: string;
  pageUrl: string;
  isLoading: boolean;
  onRefresh: () => void;
  onAction: (action: {
    type: string;
    targetRef?: string;
    value?: string;
    url?: string;
  }) => void;
}

export const SnapshotInspector: React.FC<SnapshotInspectorProps> = ({
  nodes,
  rawSnapshot,
  pageTitle,
  pageUrl,
  isLoading,
  onRefresh,
  onAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [activeNode, setActiveNode] = useState<SnapshotNode | null>(null);
  const [viewMode, setViewMode] = useState<'parsed' | 'raw'>('parsed');
  const [fillVal, setFillVal] = useState('');
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Extract unique roles for filtering
  const allRoles = Array.from(new Set(nodes.map((n) => n.role))).sort();

  // Filter nodes
  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      searchQuery === '' ||
      (node.name && node.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (node.ref && node.ref.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (node.role && node.role.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRole === 'all' || node.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case 'heading':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'link':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'button':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'textbox':
      case 'searchbox':
        return 'bg-violet-500/10 text-violet-300 border-violet-500/30';
      case 'checkbox':
      case 'radio':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      default:
        return 'bg-white/5 text-slate-300 border-white/10';
    }
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawSnapshot);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a14] border border-white/5 rounded-3xl overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] relative group">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08)_0%,transparent_70%)]" />

      {/* Header */}
      <div className="bg-[#0a0a14]/90 backdrop-blur-md px-5 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              DOM & Accessibility Snapshot Explorer
            </h2>
            <p className="text-[11px] text-slate-400 font-sans">
              Deterministic Ref handles generated via Chrome CDP accessibility tree
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('parsed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'parsed' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive Tree
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'raw' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw Snapshot
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Take fresh snapshot"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Only for parsed view) */}
      {viewMode === 'parsed' && (
        <div className="p-3.5 bg-[#050508]/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <div className="relative w-full flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes by text, @ref, or role..."
                className="w-full bg-black/40 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 border border-white/10 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-black/40 text-slate-200 text-xs rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
            >
              <option value="all">All Roles ({nodes.length})</option>
              {allRoles.map((r) => (
                <option key={r} value={r}>
                  {r} ({nodes.filter((n) => n.role === r).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content Body */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative z-10">
        {viewMode === 'parsed' ? (
          <>
            {/* Left: Node List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2 border-r border-white/5 bg-[#050508]/60">
              {filteredNodes.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-sans">
                  {nodes.length === 0
                    ? 'No elements captured. Open a URL or click refresh.'
                    : 'No elements match the current search filter.'}
                </div>
              ) : (
                filteredNodes.map((node) => {
                  const isSelected = activeNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setActiveNode(node)}
                      className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 shadow-sm ${
                        isSelected
                          ? 'bg-[#0a0a14] border-indigo-500/70 shadow-[0_0_20px_rgba(79,70,229,0.2)]'
                          : 'bg-[#050508]/90 hover:bg-[#0a0a14] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {node.ref && (
                          <span className="font-mono font-bold text-indigo-300 px-2 py-0.5 rounded-lg bg-indigo-600/10 border border-indigo-500/30 text-[11px]">
                            @{node.ref}
                          </span>
                        )}
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(
                            node.role
                          )}`}
                        >
                          {node.role}
                        </span>
                        <span className="text-slate-200 font-medium truncate font-sans">
                          {node.name || node.value || '(unnamed element)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
                        {node.disabled && (
                          <span className="text-[10px] text-rose-400 font-mono">disabled</span>
                        )}
                        {node.checked && (
                          <span className="text-[10px] text-emerald-400 font-mono">checked</span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Selected Node Action & Inspector Panel */}
            <div className="w-full md:w-80 bg-[#0a0a14] p-4 overflow-y-auto space-y-4">
              {activeNode ? (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                        Node Inspector
                      </span>
                      {activeNode.ref && (
                        <span className="text-xs font-mono text-indigo-300 font-bold bg-indigo-600/20 px-2.5 py-0.5 rounded-lg border border-indigo-500/40">
                          @{activeNode.ref}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 break-words font-medium">
                      {activeNode.name || '(No text label)'}
                    </p>
                  </div>

                  {/* Node Attributes Table */}
                  <div className="bg-[#050508]/80 rounded-2xl p-3 border border-white/5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Role:</span>
                      <span className="text-slate-200">{activeNode.role}</span>
                    </div>
                    {activeNode.ref && (
                      <div className="flex justify-between text-slate-400">
                        <span>Ref ID:</span>
                        <span className="text-indigo-400 font-bold">@{activeNode.ref}</span>
                      </div>
                    )}
                    {activeNode.level !== undefined && (
                      <div className="flex justify-between text-slate-400">
                        <span>Heading Level:</span>
                        <span className="text-slate-200">H{activeNode.level}</span>
                      </div>
                    )}
                    {activeNode.value && (
                      <div className="flex justify-between text-slate-400">
                        <span>Value:</span>
                        <span className="text-slate-200 truncate max-w-[140px]">
                          {activeNode.value}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions on Active Node */}
                  {activeNode.ref && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider">
                        Direct Actions
                      </h4>

                      <button
                        onClick={() => onAction({ type: 'click', targetRef: activeNode.ref })}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MousePointer className="w-3.5 h-3.5" />
                        <span>Click @{activeNode.ref}</span>
                      </button>

                      {/* Fill input */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[11px] text-slate-400">Fill Input Value:</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={fillVal}
                            onChange={(e) => setFillVal(e.target.value)}
                            placeholder="Type text to send..."
                            className="w-full bg-black/40 text-slate-100 text-xs font-mono rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => {
                              onAction({
                                type: 'fill',
                                targetRef: activeNode.ref,
                                value: fillVal,
                              });
                              setFillVal('');
                            }}
                            disabled={!fillVal.trim()}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg border border-white/10 disabled:opacity-40 transition-colors"
                          >
                            Fill
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => onAction({ type: 'extract', targetRef: activeNode.ref })}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium rounded-xl border border-white/10 transition-colors"
                      >
                        Extract Node Text
                      </button>
                    </div>
                  )}

                  {/* Raw Node Line */}
                  <div className="pt-2">
                    <span className="text-[10px] text-white/40 uppercase font-mono block mb-1.5 tracking-wider">
                      Raw Snapshot Entry:
                    </span>
                    <pre className="p-2.5 rounded-xl bg-black/40 text-[10px] font-mono text-slate-400 border border-white/5 overflow-x-auto whitespace-pre-wrap">
                      {activeNode.raw}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-8">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 mb-2">
                    <Tag className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">Select an Element</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                    Click any node from the tree on the left to inspect properties and execute actions.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Raw Snapshot View */
          <div className="flex-1 p-4 bg-[#050508]/90 overflow-auto flex flex-col space-y-2">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
              <span className="text-xs font-mono text-slate-400">
                agent-browser snapshot raw output:
              </span>
              <button
                onClick={handleCopyRaw}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/10 transition-colors cursor-pointer"
              >
                {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRaw ? 'Copied' : 'Copy Snapshot'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#0a0a14] rounded-2xl text-xs font-mono text-indigo-300 leading-relaxed overflow-auto flex-1 whitespace-pre-wrap border border-white/5 selection:bg-indigo-600/30">
              {rawSnapshot || '(No snapshot captured yet)'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
